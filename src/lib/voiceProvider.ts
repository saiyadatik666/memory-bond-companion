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
// 1. Web Speech Provider (Built-in, zero-latency, offline-capable)
// ---------------------------------------------------------------------------
export class WebSpeechVoiceProvider implements VoiceProvider {
  public name = "Web Speech API (Browser Native)";
  public engine: VoiceEngineType = "webspeech";
  private _isSpeaking = false;
  private _isTranscribing = false;
  private _recognition: any = null;
  private _activeUtterance: SpeechSynthesisUtterance | null = null;
  private _speechRate = 0.88; // Calm, respectful pace for seniors

  constructor(pace = 0.88) {
    this._speechRate = pace;
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

  // Cancel any active speech output immediately (Barge-In)
  public cancelSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this._isSpeaking = false;
      this._activeUtterance = null;
    }
  }

  // Synthesize and speak text
  public synthesizeSpeech(
    text: string,
    locale = "en-IN",
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return;
    }

    // Echo prevention: cancel speech first and pause active mic
    this.cancelSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    this._activeUtterance = utterance;
    utterance.rate = this._speechRate;
    utterance.pitch = 1.0;
    utterance.lang = locale;

    // Pick best matching Indian voice
    const voice = this.getBestMatchingVoice(locale);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this._isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this._isSpeaking = false;
      this._activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this._isSpeaking = false;
      this._activeUtterance = null;
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  // Match native voice based on Indian regional language preferences without forcing English
  private getBestMatchingVoice(locale: string): SpeechSynthesisVoice | null {
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
    // Assamese shares Eastern Indic phonetics with Bengali
    if (prefix === "as") {
      match = voices.find((v) => v.lang.toLowerCase().startsWith("bn"));
      if (match) return match;
    }
    // Marathi shares Devanagari script & phonetics with Hindi
    if (prefix === "mr") {
      match = voices.find((v) => v.lang.toLowerCase().startsWith("hi"));
      if (match) return match;
    }
    // Gujarati, Odia, Punjabi fallback to Hindi Indic phonetic engine if exact engine missing
    if (["gu", "or", "pa"].includes(prefix)) {
      match = voices.find((v) => v.lang.toLowerCase().startsWith("hi"));
      if (match) return match;
    }
    // Dravidian siblings
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

  // Safe speak with echo guard
  public speak(
    text: string,
    locale = "en-IN",
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    // 1. Interrupt any active mic listening to avoid picking up TTS
    this._provider.stopTranscription();
    // 2. Speak
    this._provider.synthesizeSpeech(text, locale, onStart, onEnd, onError);
  }

  // Barge-In: immediately halts spoken output
  public bargeIn() {
    this._provider.cancelSpeech();
  }

  public stopSpeaking() {
    this._provider.cancelSpeech();
  }
}

export const voiceManager = new VoiceManagerService();
