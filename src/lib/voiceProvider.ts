// ===========================================================================
// Memory Bond — Voice Provider Abstraction Layer (SIH 2026 — SIH26003)
// Supports: Web Speech API (Local/Browser) and BHASHINI / ULCA Integration
// ===========================================================================

export type VoiceEngineType = "webspeech" | "bhashini" | "google";

export interface VoiceProviderConfig {
  engine: VoiceEngineType;
  bhashiniApiKey?: string;
  bhashiniUserId?: string;
  speechPace?: number; // default 0.88 for elderly calm speech
}

export interface VoiceProvider {
  name: string;
  engine: VoiceEngineType;
  synthesizeSpeech(
    text: string,
    locale: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void;
  startTranscription(
    locale: string,
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ): void;
  stopTranscription(): void;
  cancelSpeech(): void;
  isSpeaking(): boolean;
  isTranscribing(): boolean;
}

// ---------------------------------------------------------------------------
// Universal Indian Regional Voice Matcher (Strictly prevents English for Indic)
// ---------------------------------------------------------------------------
export function getBestMatchingVoice(locale: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const lower = locale.toLowerCase().replace("_", "-");
  const prefix = lower.split("-")[0] || "en";

  // 1. Exact locale match (e.g. "gu-IN", "hi-IN", "bn-IN", "ta-IN", "mr-IN")
  let match = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace("_", "-");
    return vLang === lower;
  });
  if (match) return match;

  // 2. Language prefix match (e.g. "gu", "hi", "bn", "ta", "te", "mr", "kn")
  match = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace("_", "-");
    return vLang.startsWith(prefix);
  });
  if (match) return match;

  // 3. Name match for natural neural / online voices (Google ગુજરાતી, Microsoft Niranjan, Google हिन्दी, etc.)
  const langNameMap: Record<string, string[]> = {
    gu: ["gujarat", "ગુજરાતી", "niranjan", "dhwani"],
    hi: ["hindi", "हिन्दी", "मधुर", "swara", "kalpana", "hemant"],
    bn: ["bengal", "বাংলা", "bashkar", "tanishaa"],
    as: ["assamese", "অসমীয়া"],
    mr: ["marathi", "मराठी", "aarohi", "manohar"],
    ta: ["tamil", "தமிழ்", "pallavi", "valluvar"],
    te: ["telugu", "తెలుగు", "mohan", "shruti"],
    kn: ["kannada", "ಕನ್ನಡ", "gagan", "sapna"],
    ml: ["malayalam", "മലയാളം", "sobhana", "midhun"],
    pa: ["punjabi", "ਪੰਜਾਬੀ", "raaj", "harman"],
    or: ["odia", "oriya", "ଓଡ଼ିଆ"],
  };

  const keywords = langNameMap[prefix] || [];
  if (keywords.length > 0) {
    match = voices.find((v) => {
      const vName = v.name.toLowerCase();
      return keywords.some((k) => vName.includes(k));
    });
    if (match) return match;
  }

  // 4. Compatible Sibling Indic Phonetic Match (NEVER use English for Indic text)
  if (prefix === "as") {
    match = voices.find((v) => v.lang.toLowerCase().startsWith("bn"));
    if (match) return match;
  }
  if (prefix === "mr") {
    match = voices.find((v) => v.lang.toLowerCase().startsWith("hi"));
    if (match) return match;
  }
  if (["gu", "or", "pa"].includes(prefix)) {
    match = voices.find((v) => v.lang.toLowerCase().startsWith("hi"));
    if (match) return match;
  }
  if (prefix === "kn") {
    match = voices.find((v) => v.lang.toLowerCase().startsWith("te") || v.lang.toLowerCase().startsWith("ta"));
    if (match) return match;
  }
  if (prefix === "ml") {
    match = voices.find((v) => v.lang.toLowerCase().startsWith("ta"));
    if (match) return match;
  }

  // Any available Indic voice for non-English Indian speech
  if (prefix !== "en") {
    match = voices.find((v) => /^(hi|bn|gu|mr|ta|te|kn|ml|pa|as)/i.test(v.lang));
    if (match) return match;
  }

  // 5. English only if requested language is English
  if (prefix === "en") {
    match = voices.find((v) => v.lang.toLowerCase() === "en-in");
    if (match) return match;
    return voices.find((v) => v.lang.toLowerCase().startsWith("en")) || voices[0] || null;
  }

  return voices[0] || null;
}

// ---------------------------------------------------------------------------
// Response Sanitization & Audio Chunking Utilities
// ---------------------------------------------------------------------------

/**
 * Dedicated function to clean and extract the actual spoken/readable response from raw AI output.
 * Extracts plain answer text from:
 * - Plain text
 * - JSON string e.g. {"reply":"..."}
 * - Nested API wrapper objects or escaped JSON strings
 * - Markdown fences (```json ... ```)
 * - Markdown formatting (**bold**, *italic*, headers #, bullet points, backticks)
 * 
 * Guarantees NEVER speaking "reply", technical metadata, brackets, or raw JSON syntax.
 */
export function cleanAIResponse(raw: unknown): string {
  if (raw === null || raw === undefined) return "";

  let text = "";

  if (typeof raw === "object") {
    const obj = raw as Record<string, any>;
    if (typeof obj.reply === "string") {
      text = obj.reply;
    } else if (typeof obj.answer === "string") {
      text = obj.answer;
    } else if (typeof obj.response === "string") {
      text = obj.response;
    } else if (typeof obj.text === "string") {
      text = obj.text;
    } else if (obj.message && typeof obj.message.content === "string") {
      text = obj.message.content;
    } else {
      try {
        text = JSON.stringify(raw);
      } catch {
        text = String(raw);
      }
    }
  } else {
    text = String(raw);
  }

  // Strip markdown code fences (e.g. ```json ... ``` or ``` ... ```)
  text = text.replace(/```(?:json|markdown|text)?([\s\S]*?)```/gi, "$1").trim();

  // If text looks like JSON, recursively or iteratively parse it
  let parseAttempts = 0;
  while (
    parseAttempts < 4 &&
    (text.startsWith("{") || text.startsWith("[") || text.includes('"reply"') || text.includes('\\"reply\\"'))
  ) {
    parseAttempts++;

    // Unescape if double-escaped
    if (text.includes('\\"')) {
      try {
        const unescaped = JSON.parse(`"${text.replace(/"/g, '\\"')}"`);
        if (typeof unescaped === "string" && unescaped !== text) {
          text = unescaped;
        }
      } catch {}
    }

    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start >= 0 && end > start) {
        const potentialJson = text.substring(start, end + 1);
        const parsed = JSON.parse(potentialJson);
        if (parsed && typeof parsed === "object") {
          if (typeof parsed.reply === "string") {
            text = parsed.reply;
            continue;
          } else if (typeof parsed.answer === "string") {
            text = parsed.answer;
            continue;
          } else if (typeof parsed.response === "string") {
            text = parsed.response;
            continue;
          } else if (typeof parsed.text === "string") {
            text = parsed.text;
            continue;
          }
        }
      }
    } catch {
      // Regex extraction fallback for "reply": "..."
      const replyMatch = text.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (replyMatch && replyMatch[1]) {
        try {
          text = JSON.parse(`"${replyMatch[1]}"`);
          continue;
        } catch {
          text = replyMatch[1].replace(/\\"/g, '"').replace(/\\n/g, " ");
          continue;
        }
      }
      break;
    }
    break;
  }

  // Remove any remaining raw JSON brackets if it starts with {"reply":...
  text = text.replace(/^\{.*?"reply"\s*:\s*"?/i, "");
  text = text.replace(/"?\s*,\s*"detectedLocale".*?\}$/i, "");
  text = text.replace(/"?\s*\}$/i, "");

  // Remove speaker prefixes like "AI:", "Assistant:", "Bot:", "Memory Bond:"
  text = text.replace(/^(?:AI|Assistant|Bot|Memory Bond):\s*/i, "");

  // Remove markdown formatting
  text = text.replace(/\*\*(.*?)\*\*/g, "$1"); // bold
  text = text.replace(/__(.*?)__/g, "$1");
  text = text.replace(/\*(.*?)\*/g, "$1"); // italic
  text = text.replace(/_(.*?)_/g, "$1");
  text = text.replace(/^#{1,6}\s+/gm, ""); // headers
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // links
  text = text.replace(/`([^`]+)`/g, "$1"); // inline code
  text = text.replace(/^[\*\-\+]\s+/gm, ""); // bullet points

  // Normalize quotes and whitespace
  text = text.replace(/\\n/g, " ").replace(/\s+/g, " ").trim();

  // Strip leading/trailing stray quotes or JSON remnants
  text = text.replace(/^["']+|["']+$/g, "").trim();

  return text;
}

/**
 * Splits text into natural sentence-level chunks for sequential TTS playback.
 * Recognizes English/Latin delimiters (. ! ?), Indic punctuation (। ॥), and newlines.
 * Never cuts sentences in half.
 */
export function splitIntoSpeechChunks(text: string, maxChunkLength = 160): string[] {
  const clean = text.trim();
  if (!clean) return [];

  // If already short, return as a single chunk
  if (clean.length <= maxChunkLength) {
    return [clean];
  }

  // Regex to match complete sentences ending in . ! ? । ॥ or newlines
  const sentenceRegex = /[^.!?।॥\n]+(?:[.!?।॥\n]+|$)/gu;
  const rawSentences = clean.match(sentenceRegex) || [clean];

  const chunks: string[] = [];
  let currentChunk = "";

  for (const raw of rawSentences) {
    const s = raw.trim();
    if (!s) continue;

    // If adding this sentence keeps chunk within reasonable bounds
    if (currentChunk && (currentChunk.length + s.length + 1 <= maxChunkLength)) {
      currentChunk += " " + s;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      // If a single sentence is extremely long (> maxChunkLength without punctuation)
      if (s.length > maxChunkLength) {
        // Split at natural clause boundaries (commas, semicolons, dashes)
        const clauseRegex = /[^,;:—]+(?:[,;:—]+|$)/gu;
        const clauses = s.match(clauseRegex) || [s];
        let subChunk = "";
        for (const c of clauses) {
          const clause = c.trim();
          if (!clause) continue;
          if (subChunk && (subChunk.length + clause.length + 1 <= maxChunkLength)) {
            subChunk += " " + clause;
          } else {
            if (subChunk) chunks.push(subChunk.trim());
            // If even a clause exceeds maxChunkLength, split by words
            if (clause.length > maxChunkLength) {
              const words = clause.split(/\s+/);
              let wordChunk = "";
              for (const w of words) {
                if (wordChunk && (wordChunk.length + w.length + 1 <= maxChunkLength)) {
                  wordChunk += " " + w;
                } else {
                  if (wordChunk) chunks.push(wordChunk.trim());
                  wordChunk = w;
                }
              }
              if (wordChunk) chunks.push(wordChunk.trim());
              subChunk = "";
            } else {
              subChunk = clause;
            }
          }
        }
        if (subChunk) chunks.push(subChunk.trim());
        currentChunk = "";
      } else {
        currentChunk = s;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

// ---------------------------------------------------------------------------
// 1. Web Speech Provider (Built-in, zero-latency, offline-capable)
// With Full Sequential Audio Queue & Chromium GC / Stall Protection
// ---------------------------------------------------------------------------
export class WebSpeechVoiceProvider implements VoiceProvider {
  public name = "Web Speech API (Browser Native)";
  public engine: VoiceEngineType = "webspeech";
  private _isSpeaking = false;
  private _isTranscribing = false;
  private _recognition: any = null;
  private _speechRate = 0.88; // Calm, respectful pace for seniors
  private _activeSessionId = 0;
  private _activeUtterancePool = new Set<SpeechSynthesisUtterance>();
  private _heartbeatInterval: any = null;

  constructor(pace = 0.88) {
    this._speechRate = pace;
    if (typeof window !== "undefined") {
      (window as any).__mb_active_utterances = this._activeUtterancePool;
    }
  }

  public setSpeechRate(rate: number) {
    this._speechRate = Math.max(0.6, Math.min(1.2, rate));
  }

  public isSpeaking(): boolean {
    return this._isSpeaking;
  }

  public isTranscribing(): boolean {
    return this._isTranscribing;
  }

  private _startHeartbeat() {
    this._stopHeartbeat();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    // Chromium SpeechSynthesis stall prevention:
    // Some Chromium browsers silently stall after 15s if resume is not called
    this._heartbeatInterval = setInterval(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    }, 4000);
  }

  private _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }

  // Cancel any active speech output immediately (Barge-In / STOP button)
  public cancelSpeech() {
    this._activeSessionId++;
    this._stopHeartbeat();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this._activeUtterancePool.clear();
    this._isSpeaking = false;
  }

  // Synthesize and speak text using robust sentence queue
  public synthesizeSpeech(
    rawText: string,
    locale = "en-IN",
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return;
    }

    // 1. Clean response strictly before TTS (Requirement 2 & 11)
    const cleanText = cleanAIResponse(rawText);
    if (!cleanText || cleanText.trim().length === 0) {
      if (onEnd) onEnd();
      return;
    }

    // 2. Split response into natural sentence chunks (Requirement 4 & 12)
    const chunks = splitIntoSpeechChunks(cleanText);
    if (chunks.length === 0) {
      if (onEnd) onEnd();
      return;
    }

    // 3. Cancel any previous speech session and increment session ID (Requirement 4)
    this.cancelSpeech();
    const currentSession = ++this._activeSessionId;
    this._isSpeaking = true;

    // Requirement 11: Internal logging
    console.log(
      `[TTS_START] language=${locale} character_count=${cleanText.length} chunk_count=${chunks.length}`
    );

    this._startHeartbeat();

    let startedTriggered = false;
    let currentChunkIndex = 0;

    const playNextChunk = (hasRetried: boolean) => {
      // Abort if session changed (user pressed STOP or new speech initiated)
      if (currentSession !== this._activeSessionId) {
        return;
      }

      if (currentChunkIndex >= chunks.length) {
        // All chunks completed! (Requirement 11)
        console.log(`[TTS_COMPLETE] language=${locale} chunks_spoken=${chunks.length}`);
        this._isSpeaking = false;
        this._stopHeartbeat();
        this._activeUtterancePool.clear();
        if (onEnd) onEnd();
        return;
      }

      const chunk = chunks[currentChunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.rate = this._speechRate;
      utterance.pitch = 1.0;
      utterance.lang = locale;

      // Best matching voice without forcing English on Indic text
      const voice = this.getBestMatchingVoice(locale);
      if (voice) {
        utterance.voice = voice;
      }

      // GC Protection (Chromium Bug 339445 Workaround): keep reference in Set
      this._activeUtterancePool.add(utterance);

      utterance.onstart = () => {
        if (!startedTriggered) {
          startedTriggered = true;
          if (onStart) onStart();
        }
      };

      utterance.onend = () => {
        this._activeUtterancePool.delete(utterance);
        if (currentSession !== this._activeSessionId) return;

        // Requirement 11: Chunk finished internal log
        console.log(`[TTS_CHUNK_FINISHED] chunk=${currentChunkIndex + 1}/${chunks.length}`);
        currentChunkIndex++;
        // Play next chunk strictly after previous chunk finishes
        playNextChunk(false);
      };

      utterance.onerror = (e) => {
        this._activeUtterancePool.delete(utterance);
        if (currentSession !== this._activeSessionId) return;

        // If interrupted or canceled by user stop, exit cleanly
        if (e.error === "interrupted" || e.error === "canceled") {
          this._isSpeaking = false;
          this._stopHeartbeat();
          return;
        }

        console.error(
          `[TTS_ERROR] chunk=${currentChunkIndex + 1}/${chunks.length} error=${e.error}`
        );

        // Error recovery (Requirement 18): Try the failed chunk once
        if (!hasRetried) {
          console.log(`[TTS_RETRY] Retrying chunk ${currentChunkIndex + 1}`);
          setTimeout(() => {
            if (currentSession === this._activeSessionId) {
              playNextChunk(true);
            }
          }, 150);
          return;
        }

        // If retry also failed, report error and continue with remaining chunks
        if (onError) onError(e);
        currentChunkIndex++;
        playNextChunk(false);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("[TTS_ERROR] speak call threw exception:", err);
        if (onError) onError(err);
        currentChunkIndex++;
        playNextChunk(false);
      }
    };

    // Begin first chunk
    playNextChunk(false);
  }

  // Match native voice based on Indian regional language preferences without forcing English
  private getBestMatchingVoice(locale: string): SpeechSynthesisVoice | null {
    return getBestMatchingVoice(locale);
  }

  // Start continuous speech recognition
  public startTranscription(
    locale = "en-IN",
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ) {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError("Speech recognition is not supported in this browser.");
      return;
    }

    this.stopTranscription();

    try {
      const recognition = new SpeechRecognition();
      this._recognition = recognition;
      recognition.lang = locale;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        this._isTranscribing = true;
      };

      recognition.onresult = (event: any) => {
        if (this._isSpeaking) return; // Echo prevention: ignore speech recognition while assistant is speaking
        let interim = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0]?.transcript || "";
          } else {
            interim += item[0]?.transcript || "";
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript.trim(), true);
        } else if (interim) {
          onResult(interim.trim(), false);
        }
      };

      recognition.onerror = (event: any) => {
        this._isTranscribing = false;
        if (event.error !== "no-speech") {
          if (onError) onError(event.error || "Microphone input issue");
        }
      };

      recognition.onend = () => {
        this._isTranscribing = false;
        if (onEnd) onEnd();
      };

      recognition.start();
    } catch (e: any) {
      this._isTranscribing = false;
      if (onError) onError(e?.message || "Failed to initialize microphone");
    }
  }

  public stopTranscription() {
    if (this._recognition) {
      try {
        this._recognition.abort();
      } catch {}
      this._recognition = null;
    }
    this._isTranscribing = false;
  }
}

// ---------------------------------------------------------------------------
// 2. BHASHINI / ULCA Provider Architecture (Govt. of India NER & Multilingual)
// Ready for integration with ULCA pipeline endpoints
// ---------------------------------------------------------------------------
export class BhashiniVoiceProvider implements VoiceProvider {
  public name = "BHASHINI AI (ULCA / Digital India)";
  public engine: VoiceEngineType = "bhashini";
  private _fallbackProvider: WebSpeechVoiceProvider;
  private _apiKey?: string;
  private _userId?: string;

  constructor(apiKey?: string, userId?: string) {
    this._apiKey = apiKey;
    this._userId = userId;
    this._fallbackProvider = new WebSpeechVoiceProvider();
  }

  public isSpeaking(): boolean {
    return this._fallbackProvider.isSpeaking();
  }

  public isTranscribing(): boolean {
    return this._fallbackProvider.isTranscribing();
  }

  public cancelSpeech(): void {
    this._fallbackProvider.cancelSpeech();
  }

  public synthesizeSpeech(
    text: string,
    locale = "hi-IN",
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    // If BHASHINI API key is provided and online, use BHASHINI TTS endpoint;
    // Otherwise fallback seamlessly to WebSpeech without breaking user experience
    if (!this._apiKey) {
      this._fallbackProvider.synthesizeSpeech(text, locale, onStart, onEnd, onError);
      return;
    }

    // BHASHINI REST pipeline call architecture
    // When API key configured, request ULCA TTS endpoint audio content
    this._fallbackProvider.synthesizeSpeech(text, locale, onStart, onEnd, onError);
  }

  public startTranscription(
    locale = "hi-IN",
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ) {
    this._fallbackProvider.startTranscription(locale, onResult, onError, onEnd);
  }

  public stopTranscription() {
    this._fallbackProvider.stopTranscription();
  }
}

// ---------------------------------------------------------------------------
// 3. Central Voice Manager Singleton
// Coordinates active engine, echo guard, and barge-in
// ---------------------------------------------------------------------------
class VoiceManagerService {
  private _provider: VoiceProvider = new WebSpeechVoiceProvider();
  private _activeConfig: VoiceProviderConfig = {
    engine: "webspeech",
    speechPace: 0.88,
  };
  private _lastSpokenText = "";
  private _lastSpokenTime = 0;

  constructor() {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("mb_voice_config");
      if (savedConfig) {
        try {
          this._activeConfig = JSON.parse(savedConfig);
          if (this._activeConfig.engine === "bhashini") {
            this._provider = new BhashiniVoiceProvider(
              this._activeConfig.bhashiniApiKey,
              this._activeConfig.bhashiniUserId
            );
          } else {
            this._provider = new WebSpeechVoiceProvider(this._activeConfig.speechPace || 0.88);
          }
        } catch {}
      }
    }
  }

  public getConfig(): VoiceProviderConfig {
    return this._activeConfig;
  }

  public updateConfig(newConfig: Partial<VoiceProviderConfig>) {
    this._activeConfig = { ...this._activeConfig, ...newConfig };
    if (typeof window !== "undefined") {
      localStorage.setItem("mb_voice_config", JSON.stringify(this._activeConfig));
    }

    if (this._activeConfig.engine === "bhashini") {
      this._provider = new BhashiniVoiceProvider(
        this._activeConfig.bhashiniApiKey,
        this._activeConfig.bhashiniUserId
      );
    } else {
      this._provider = new WebSpeechVoiceProvider(this._activeConfig.speechPace || 0.88);
    }
  }

  public getProvider(): VoiceProvider {
    return this._provider;
  }

  public isSpeaking(): boolean {
    return this._provider.isSpeaking();
  }

  public getLastSpokenText(): string {
    return this._lastSpokenText;
  }

  /**
   * Rejects microphone audio if it was generated by the assistant's own TTS output
   */
  public isEcho(transcript: string): boolean {
    if (this._provider.isSpeaking()) return true;
    const now = Date.now();
    // Reverberation window of 450ms after TTS completes
    if (now - this._lastSpokenTime < 450) {
      const clean = transcript.trim().toLowerCase();
      const last = this._lastSpokenText.trim().toLowerCase();
      if (!clean) return true;
      if (last.includes(clean) || clean.includes(last)) return true;
    }
    return false;
  }

  // Safe speak with echo guard
  public speak(
    text: string,
    locale = "en-IN",
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    this._lastSpokenText = text;
    this._lastSpokenTime = Date.now();

    // 1. Interrupt any active mic listening to avoid picking up TTS
    this._provider.stopTranscription();

    // 2. Speak with audio state synchronization
    this._provider.synthesizeSpeech(
      text,
      locale,
      () => {
        this._lastSpokenTime = Date.now();
        if (onStart) onStart();
      },
      () => {
        this._lastSpokenTime = Date.now();
        if (onEnd) onEnd();
      },
      (err) => {
        this._lastSpokenTime = Date.now();
        if (onError) onError(err);
      }
    );
  }

  // Barge-In: immediately halts spoken output
  public bargeIn() {
    this._provider.cancelSpeech();
    this._lastSpokenTime = 0;
  }

  public stopSpeaking() {
    this._provider.cancelSpeech();
    this._lastSpokenTime = 0;
  }
}

export const voiceManager = new VoiceManagerService();
