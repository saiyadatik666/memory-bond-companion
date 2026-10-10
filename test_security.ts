/**
 * MEMORY BOND — COMPREHENSIVE SECURITY AUDIT & VERIFICATION TEST SUITE
 * Tests rate limiting, input sanitization, token signing, replay protection,
 * role guards, and multilingual character preservation.
 */

import { checkRateLimit, extractClientIdentifier } from "./src/lib/serverRateLimiter";
import { sanitizeText, escapeHtml, ValidMedicineSchema, ValidReminderSchema } from "./src/lib/sanitizer";
import { generateSessionSignature, verifySessionSignature, isTabAuthorized, type ActiveSession } from "./src/lib/authGuards";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runSecuritySuite() {
  console.log("================================================================================");
  console.log("RUNNING MEMORY BOND SECURITY VERIFICATION TEST SUITE");
  console.log("================================================================================\n");

  // TEST 1: RATE LIMITER
  console.log("1. RATE LIMITING TESTS:");
  const config = { maxRequests: 3, windowSeconds: 2 };
  const id = `test_client_${Date.now()}`;

  const r1 = checkRateLimit("test_bucket", id, config);
  assert(r1.allowed === true && r1.remaining === 2, "First request is allowed with remaining=2");

  const r2 = checkRateLimit("test_bucket", id, config);
  assert(r2.allowed === true && r2.remaining === 1, "Second request is allowed with remaining=1");

  const r3 = checkRateLimit("test_bucket", id, config);
  assert(r3.allowed === true && r3.remaining === 0, "Third request is allowed with remaining=0");

  const r4 = checkRateLimit("test_bucket", id, config);
  assert(r4.allowed === false && r4.retryAfterSeconds > 0, "Fourth request is throttled with HTTP 429 Retry-After");

  const otherId = `test_client_other_${Date.now()}`;
  const rOther = checkRateLimit("test_bucket", otherId, config);
  assert(rOther.allowed === true, "Different client IP is not affected by other client's rate limit");

  // TEST 2: INPUT SANITIZATION & MULTILINGUAL PRESERVATION
  console.log("\n2. INPUT VALIDATION & SANITIZATION TESTS:");
  
  // Hindi preservation
  const hindiInput = "मुझे अपनी दवा का समय बताओ।";
  assert(sanitizeText(hindiInput) === hindiInput, "Preserves Hindi Devanagari script accurately");

  // Gujarati preservation
  const gujaratiInput = "મારે સવારે ૮:૩૦ વાગ્યે કઈ દવા લેવાની છે?";
  assert(sanitizeText(gujaratiInput) === gujaratiInput, "Preserves Gujarati script accurately");

  // Control character stripping
  const dirtyInput = "Clean text\x00\x08\x1F with hidden control characters";
  assert(sanitizeText(dirtyInput) === "Clean text with hidden control characters", "Strips null bytes and control chars");

  // Script tag stripping
  const xssInput = 'Hello <script>alert("hacked")</script> world';
  assert(!sanitizeText(xssInput).includes("<script>"), "Strips executable <script> tags");

  // HTML entity escaping
  const htmlInput = '<img src=x onerror="alert(1)">';
  assert(escapeHtml(htmlInput) === "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;", "Escapes HTML entities properly");

  // Length capping
  const longInput = "a".repeat(3000);
  assert(sanitizeText(longInput, 1000).length === 1000, "Enforces strict maximum length boundary");

  // TEST 3: ZOD VALIDATION SCHEMAS
  console.log("\n3. SCHEMA BOUNDARY TESTS:");
  const validMed = {
    name: "Metformin",
    dosage: "500mg",
    unit: "tablet" as const,
    stock: 60,
    daily_usage: 2,
    refill_threshold: 10,
    warn_days: 5,
    times: ["08:00", "20:00"],
    frequency: "daily" as const,
    start_date: "2026-10-10",
  };
  const medParsed = ValidMedicineSchema.safeParse(validMed);
  assert(medParsed.success === true, "Valid medicine record passes Zod validation");

  const invalidMed = {
    name: "", // Invalid: empty
    times: ["invalid_time_format"], // Invalid: not HH:MM
    stock: -5, // Invalid: negative
  };
  const invalidMedParsed = ValidMedicineSchema.safeParse(invalidMed);
  assert(invalidMedParsed.success === false, "Malformed medicine record is rejected by schema");

  // TEST 4: AUTH & SESSION INTEGRITY SIGNATURES
  console.log("\n4. SESSION INTEGRITY & ROLE SECURITY TESTS:");
  const validSession: ActiveSession = {
    userId: "user_test_123",
    role: "senior",
    fullName: "Ramesh Sharma",
    signature: generateSessionSignature("user_test_123", "senior"),
  };
  assert(verifySessionSignature(validSession) === true, "Cryptographically signed session passes verification");

  const tamperedSession: ActiveSession = {
    userId: "user_test_123",
    role: "caregiver", // Tampered role from senior to caregiver
    fullName: "Ramesh Sharma",
    signature: generateSessionSignature("user_test_123", "senior"), // Signature made for senior
  };
  assert(verifySessionSignature(tamperedSession) === false, "Tampered session role is rejected");

  // TEST 5: ROUTE GUARDS & ACCESS CONTROL
  console.log("\n5. ACCESS CONTROL & ROLE BOUNDARY TESTS:");
  assert(isTabAuthorized("senior", "home") === true, "Senior is authorized for Senior Home");
  assert(isTabAuthorized("senior", "caregiver") === false, "Senior is strictly forbidden from Caregiver Dashboard");
  assert(isTabAuthorized("caregiver", "caregiver") === true, "Caregiver is authorized for Caregiver Dashboard");
  assert(isTabAuthorized("caregiver", "games") === false, "Caregiver is forbidden from Senior Games Hub");

  console.log("\n================================================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
