import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { checkRateLimit, extractClientIdentifier, RATE_LIMIT_PRESETS, RateLimitExceededError } from "./serverRateLimiter";

const ALLOWED_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",
] as const;

const ProcessInput = z.object({
  // Maximum 8MB base64 audio payload to prevent memory inflation / buffer DoS
  audioBase64: z
    .string()
    .min(32, "Recording is too short")
    .max(8 * 1024 * 1024, "Recording exceeds maximum size (8MB)"),
  mimeType: z.enum(ALLOWED_MIME_TYPES).default("audio/webm"),
  language: z.string().max(10).optional(),
});

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

function extFor(mime: string): string {
  const base = mime.split(";")[0];
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
  };
  return map[base ?? ""] ?? "webm";
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Transcribe a recorded voice memory in any supported language and return a
 * short Gujarati summary of what was said.
 * 
 * Protected by sliding-window rate limiting, audio payload bounds, and MIME verification.
 */
export const processVoiceMemory = createServerFn({ method: "POST" })
  .validator((input: unknown) => ProcessInput.parse(input))
  .handler(async ({ data }: { data: z.infer<typeof ProcessInput> }) => {
    // 1. Rate Limiting Check
    let request: Request | null = null;
    try {
      request = getRequest();
    } catch {}

    const clientId = extractClientIdentifier(request);
    const rateCheck = checkRateLimit("voice_memory", clientId, RATE_LIMIT_PRESETS.VOICE_TRANSCRIPTION);
    if (!rateCheck.allowed) {
      throw new RateLimitExceededError(
        `Too many audio recordings sent. Please wait ${rateCheck.retryAfterSeconds} seconds before saving another voice memory.`,
        rateCheck.retryAfterSeconds
      );
    }

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI transcription service is currently not configured.");


    const bytes = base64ToBytes(data.audioBase64);
    if (bytes.byteLength < 2048) {
      throw new Error("That recording was too short — please try again.");
    }

    const form = new FormData();
    form.append("model", "google/gemini-3.5-transcribe");
    form.append(
      "file",
      new Blob([bytes as unknown as BlobPart], { type: data.mimeType }),
      `memory.${extFor(data.mimeType)}`,
    );
    // Bare ISO-639-1 only; skip anything else so the model auto-detects.
    const lang = (data.language ?? "").slice(0, 2).toLowerCase();
    if (/^(en|hi|as|bn|gu|mr|or|pa|ta|te|kn|ml)$/.test(lang)) {
      form.append("language", lang);
    }

    const sttRes = await fetch(`${GATEWAY}/audio/transcriptions`, {
      method: "POST",
      headers: { "Lovable-API-Key": key },
      body: form,
    });
    if (!sttRes.ok) {
      console.warn(`[VoiceMemory] Transcription gateway error (${sttRes.status})`);
      throw new Error("Voice transcription service is temporarily unavailable. Please try recording again.");
    }
    const sttJson = (await sttRes.json()) as { text?: string };
    const transcript = (sttJson.text ?? "").trim();
    if (!transcript) {
      return { transcript: "", summaryGu: "", title: "" };
    }

    const chatRes = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          {
            role: "system",
            content:
              "You help elderly users keep a memory journal. You receive a spoken memory in any Indian language. Reply ONLY with JSON: {\"title\": string, \"summary_gu\": string}. 'title' is a short 3-6 word title in Gujarati. 'summary_gu' is a warm 2-3 sentence summary of the memory written in Gujarati script. Never add extra keys or text.",
          },
          { role: "user", content: transcript },
        ],
      }),
    });
    if (!chatRes.ok) {
      console.warn(`[VoiceMemory] AI summary gateway error (${chatRes.status})`);
      throw new Error("Could not generate memory summary at this moment. The audio was recorded successfully.");
    }
    const chatJson = (await chatRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = chatJson.choices?.[0]?.message?.content ?? "";
    let title = "";
    let summaryGu = "";
    try {
      const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = JSON.parse(jsonText) as { title?: string; summary_gu?: string };
      title = (parsed.title ?? "").trim();
      summaryGu = (parsed.summary_gu ?? "").trim();
    } catch {
      summaryGu = raw.trim();
    }

    return { transcript, summaryGu, title };
  });
