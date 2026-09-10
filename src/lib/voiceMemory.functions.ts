import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ProcessInput = z.object({
  audioBase64: z.string().min(32),
  mimeType: z.string().default("audio/webm"),
  language: z.string().optional(),
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
 */
export const processVoiceMemory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ProcessInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

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
      const body = await sttRes.text().catch(() => "");
      throw new Error(`Transcription failed (${sttRes.status}). ${body.slice(0, 300)}`);
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
      const body = await chatRes.text().catch(() => "");
      throw new Error(`Summary failed (${chatRes.status}). ${body.slice(0, 300)}`);
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
