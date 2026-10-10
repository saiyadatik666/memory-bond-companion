/**
 * Memory Bond - Production Server-Side Rate Limiter & Abuse Prevention Engine
 * 
 * Provides robust sliding-window rate limiting for all server functions,
 * expensive AI endpoints, authentication workflows, and pairing token requests.
 * 
 * Properties:
 * 1. Tracks usage by authenticated user ID (when present) or client IP.
 * 2. Sliding window algorithm with precise sub-minute granularity.
 * 3. Automatic memory eviction for stale rate-limit buckets.
 * 4. Configurable limits per endpoint type with safe fallbacks.
 * 5. Returns standard HTTP 429 status code and Retry-After header.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  identifierName?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  retryAfterSeconds: number;
}

interface RequestRecord {
  timestamps: number[];
}

// In-memory sliding window store keyed by `${endpoint}:${clientKey}`
const rateLimitStore = new Map<string, RequestRecord>();

// Periodic cleanup of records older than 10 minutes to prevent memory leaks
let lastCleanup = Date.now();
function runStaleCleanup(now: number) {
  if (now - lastCleanup < 60_000) return; // Clean at most once every minute
  lastCleanup = now;
  const maxAge = 10 * 60 * 1000;
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < maxAge);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Extract reliable client identifier (IP or authenticated User ID) from Request headers
 */
export function extractClientIdentifier(request?: Request | null, userId?: string | null): string {
  if (userId && typeof userId === "string" && userId.trim()) {
    return `user_${userId.trim()}`;
  }

  if (!request || !request.headers) {
    return "anonymous_client";
  }

  // Cloudflare Connecting IP header
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return `ip_${cfIp.trim()}`;

  // Standard X-Forwarded-For header (take the first client IP in the chain)
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return `ip_${firstIp}`;
  }

  // X-Real-IP header
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return `ip_${xRealIp.trim()}`;

  return "anonymous_client";
}

/**
 * Check and record a rate-limited request
 */
export function checkRateLimit(
  bucketName: string,
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  runStaleCleanup(now);

  const windowMs = config.windowSeconds * 1000;
  const cutoff = now - windowMs;
  const key = `${bucketName}:${identifier}`;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter out timestamps outside the active sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  const currentCount = record.timestamps.length;
  const remaining = Math.max(0, config.maxRequests - currentCount);

  if (currentCount >= config.maxRequests) {
    const oldest = record.timestamps[0] || now;
    const retryAfterMs = Math.max(1000, oldest + windowMs - now);
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetSeconds: retryAfterSec,
      retryAfterSeconds: retryAfterSec,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.timestamps.length),
    resetSeconds: config.windowSeconds,
    retryAfterSeconds: 0,
  };
}

/**
 * Standard preset limits for Memory Bond endpoints
 */
export const RATE_LIMIT_PRESETS = {
  // Voice Assistant: 15 calls per 60 seconds (prevents quota exhaustion)
  VOICE_ASSISTANT: {
    maxRequests: Number(process.env["RATE_LIMIT_AI_PER_MINUTE"]) || 15,
    windowSeconds: 60,
    identifierName: "ai_voice_assistant",
  },
  // Audio Transcription: 8 uploads per 60 seconds (expensive AI audio pipeline)
  VOICE_TRANSCRIPTION: {
    maxRequests: Number(process.env["RATE_LIMIT_AUDIO_PER_MINUTE"]) || 8,
    windowSeconds: 60,
    identifierName: "ai_voice_transcribe",
  },
  // QR Pairing verification & connection: 10 attempts per 60 seconds (brute force protection)
  PAIRING_ATTEMPTS: {
    maxRequests: Number(process.env["RATE_LIMIT_PAIRING_PER_MINUTE"]) || 10,
    windowSeconds: 60,
    identifierName: "pairing_verification",
  },
  // Auth actions & password resets: 10 requests per 60 seconds
  AUTH_ACTIONS: {
    maxRequests: 10,
    windowSeconds: 60,
    identifierName: "auth_actions",
  },
};

/**
 * Helper error class representing a rate limit violation
 */
export class RateLimitExceededError extends Error {
  public readonly statusCode = 429;
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number = 60) {
    super(message);
    this.name = "RateLimitExceededError";
    this.retryAfter = retryAfter;
  }
}
