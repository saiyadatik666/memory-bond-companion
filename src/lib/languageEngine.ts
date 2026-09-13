// ===========================================================================
// Memory Bond — Universal Automatic Language Engine (SIH 2026 — SIH26003)
// Centralized Language Engine for the ENTIRE Application
// Supports: Native Unicode Scripts, Romanized Indian Languages, Mixed Code-Switching,
// Automatic Dynamic Switching, Same-Language Response Rules & Localized Game Strings.
// ===========================================================================

export interface SupportedLanguage {
  code: string; // e.g. "gu"
  locale: string; // e.g. "gu-IN"
  name: string; // "Gujarati"
  nativeName: string; // "ગુજરાતી"
  scriptRegex: RegExp;
  romanKeywords: string[];
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: "gu",
    locale: "gu-IN",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    scriptRegex: /[\u0A80-\u0AFF]/,
    romanKeywords: [
      "kem cho",
      "kemcho",
      "majama",
      "maja ma",
      "su karo",
      "su kare",
      "su chhe",
      "su che",
      "mare",
      "tamare",
      "tamaru",
      "tamari",
      "tame",
      "kaho",
      "savare",
      "dawa",
      "dava",
      "levani",
      "kyare",
      "ketla",
      "jamvanu",
      "aaje",
      "aaj",
      "chhe",
      "nathi",
      "aapo",
      "bapore",
      "saanje",
      "vagye",
      "vage",
      "ketle",
      "hath",
      "pag",
      "pan",
      "ghare",
      "have gujarati",
      "gujarati ma",
      "gujaratima",
    ],
  },
  {
    code: "hi",
    locale: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    scriptRegex: /[\u0900-\u097F]/,
    romanKeywords: [
      "kaise ho",
      "kaise",
      "kya haal",
      "kya chal raha",
      "aaj kya",
      "aaj ka",
      "aaj ki",
      "karna hai",
      "meri dawa",
      "dawai",
      "kab leni",
      "batao",
      "samjhao",
      "theek hai",
      "namaste",
      "subah",
      "shaam",
      "dopahar",
      "raat",
      "paani",
      "pani",
      "mujhe",
      "mera",
      "meri",
      "mere",
      "karo",
      "kholo",
      "shuru",
      "bataiye",
      "suno",
      "kripya",
      "accha",
      "acha",
      "bahut",
      "hai",
      "hain",
      "nahi",
      "nahin",
      "kab hai",
      "ab hindi",
      "hindi mein",
      "hindi me",
    ],
  },
  {
    code: "bn",
    locale: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    scriptRegex: /[\u0980-\u09FF]/,
    romanKeywords: [
      "kemon acho",
      "kemon achen",
      "apni kemon",
      "tumi kemon",
      "ki khobor",
      "aajke ki",
      "aaj ki korbo",
      "oshudh",
      "oushodh",
      "kobe khete",
      "koto baje",
      "shokal",
      "bikel",
      "khabo",
      "kheyechi",
      "bolun",
      "aami",
      "amar",
      "apnar",
      "namaskar",
      "bhalo",
      "ache",
      "achen",
      "banglay",
      "bangla te",
    ],
  },
  {
    code: "as",
    locale: "as-IN",
    name: "Assamese",
    nativeName: "অসমীয়া",
    scriptRegex: /[ৱৰ]/,
    romanKeywords: [
      "kene aasa",
      "kene aaso",
      "ki khobor",
      "aaji ki kaam",
      "aaji ki",
      "kailoi",
      "puwa",
      "khalu",
      "bozat",
      "axomiya",
      "nomoskar",
      "bhal",
      "ase",
      "kenekoi",
      "daway",
      "khabone",
      "bihu",
      "gahor",
    ],
  },
  {
    code: "mr",
    locale: "mr-IN",
    name: "Marathi",
    nativeName: "मराठी",
    scriptRegex: /\b(आहे|आहोत|नाही|कसे|कसा|केले|झाले|पाहिजे|वाजता|दुपारी|सकाळी|औषध|घेते|घेतले|करा|सांगा)\b/,
    romanKeywords: [
      "kasa ahes",
      "kashi ahes",
      "kay challay",
      "kay chalalay",
      "aushadh kadhi",
      "aushadh",
      "sakali",
      "sandhyakali",
      "sanga",
      "kuthe",
      "ahe",
      "nahi",
      "ghyayche",
      "namaskar",
      "bara",
      "aahat",
      "marathit",
    ],
  },
  {
    code: "ta",
    locale: "ta-IN",
    name: "Tamil",
    nativeName: "தமிழ்",
    scriptRegex: /[\u0B80-\u0BFF]/,
    romanKeywords: [
      "naan eppadi irukken",
      "eppadi irukkeenga",
      "eppadi irukeenga",
      "vanakkam",
      "marunthu eppo",
      "marunthu",
      "iniku enna",
      "iniku",
      "naalai",
      "neram",
      "manikku",
      "saaptingala",
      "nalla",
      "irukku",
      "tamilil",
    ],
  },
  {
    code: "te",
    locale: "te-IN",
    name: "Telugu",
    nativeName: "తెలుగు",
    scriptRegex: /[\u0C00-\u0C7F]/,
    romanKeywords: [
      "ela unnaru",
      "ela unnavu",
      "namaskaram",
      "mandhu eppudu",
      "mandhulu",
      "e roju emi",
      "eroju",
      "repu",
      "gantalaku",
      "thinnara",
      "bagunnara",
      "telugulo",
    ],
  },
  {
    code: "kn",
    locale: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    scriptRegex: /[\u0C80-\u0CFF]/,
    romanKeywords: [
      "hegiddira",
      "hegiddiya",
      "namaskara",
      "oushadha yavaga",
      "oushadha",
      "ivathu enu",
      "ivattu",
      "beligge",
      "gantege",
      "oota aatha",
      "chennagidira",
      "kannadadalli",
    ],
  },
  {
    code: "ml",
    locale: "ml-IN",
    name: "Malayalam",
    nativeName: "മലയാളം",
    scriptRegex: /[\u0D00-\u0D7F]/,
    romanKeywords: [
      "sukhamano",
      "sukhamane",
      "namaskaram",
      "marunnu eppozha",
      "marunnu",
      "innu entha",
      "ravile",
      "manikku",
      "kazhicho",
      "malayalathil",
    ],
  },
  {
    code: "pa",
    locale: "pa-IN",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    scriptRegex: /[\u0A00-\u0A7F]/,
    romanKeywords: [
      "sat sri akal",
      "kiddan",
      "ki haal",
      "dawai kadon",
      "dawai",
      "ajj ki karna",
      "savere",
      "vaje",
      "chah",
      "roti",
      "punjabi vich",
    ],
  },
  {
    code: "or",
    locale: "or-IN",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    scriptRegex: /[\u0B00-\u0B7F]/,
    romanKeywords: [
      "kemiti achhanti",
      "namaskar",
      "oushadha kete bele",
      "oushadha",
      "aaji kana",
      "sakale",
      "tare",
      "odia re",
    ],
  },
  {
    code: "ne",
    locale: "ne-IN",
    name: "Nepali",
    nativeName: "नेपाली",
    scriptRegex: /[\u0900-\u097F]/,
    romanKeywords: ["kasto cha", "sanchai", "aaja k cha", "aushadhi", "bataunus", "namaste"],
  },
  {
    code: "brx",
    locale: "brx-IN",
    name: "Bodo",
    nativeName: "बड़ो / बर'",
    scriptRegex: /[\u0900-\u097F]/,
    romanKeywords: ["maborai dwe", "dini", "muli", "khonasan"],
  },
  {
    code: "kha",
    locale: "kha-IN",
    name: "Khasi",
    nativeName: "Ka Ktien Khasi",
    scriptRegex: /^[A-Za-z0-9\s.,!?'"()\-:;/]+$/,
    romanKeywords: ["kumno", "mynta", "dawai", "kynmaw"],
  },
  {
    code: "lus",
    locale: "lus-IN",
    name: "Mizo",
    nativeName: "Mizo ṭawng",
    scriptRegex: /^[A-Za-z0-9\s.,!?'"()\-:;/]+$/,
    romanKeywords: ["dam em", "vawiin", "damdawi", "hriattirna"],
  },
  {
    code: "mni",
    locale: "mni-IN",
    name: "Meitei (Manipuri)",
    nativeName: "মৈতৈ / ꯃꯩꯇꯩꯂꯣꯟ",
    scriptRegex: /[\uABC0-\uABFF\u0980-\u09FF]/,
    romanKeywords: ["kamdouri", "ngasi", "hidak", "ningsing"],
  },
  {
    code: "trp",
    locale: "trp-IN",
    name: "Kokborok",
    nativeName: "Kokborok",
    scriptRegex: /^[A-Za-z0-9\s.,!?'"()\-:;/]+$/,
    romanKeywords: ["bahai tongo", "tini", "samung"],
  },
  {
    code: "nag",
    locale: "nag-IN",
    name: "Nagamese",
    nativeName: "Nagamese",
    scriptRegex: /^[A-Za-z0-9\s.,!?'"()\-:;/]+$/,
    romanKeywords: ["kine ase", "aji ki ase", "dawai", "kotha"],
  },
  {
    code: "en",
    locale: "en-IN",
    name: "English",
    nativeName: "English",
    scriptRegex: /^[A-Za-z0-9\s.,!?'"()\-:;/]+$/,
    romanKeywords: [
      "how are you",
      "what should i do",
      "what is my",
      "next appointment",
      "remind me",
      "take medicine",
      "explain it",
      "in english",
      "good morning",
      "good evening",
      "tell me a story",
    ],
  },
];

// Session memory key
const SESSION_LANG_KEY = "mb_active_session_lang";

class CentralLanguageEngine {
  private _activeLocale: string = "en-IN";
  private _listeners: Set<(locale: string) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(SESSION_LANG_KEY) || localStorage.getItem("mb.lang");
      if (saved) {
        const found = SUPPORTED_LANGUAGES.find((l) => l.code === saved || l.locale === saved);
        if (found) {
          this._activeLocale = found.locale;
        }
      }
    }
  }

  public get activeLocale(): string {
    return this._activeLocale;
  }

  public get activeLanguage(): SupportedLanguage {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.locale === this._activeLocale) ||
      SUPPORTED_LANGUAGES[0]!
    );
  }

  public subscribe(listener: (locale: string) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notify() {
    this._listeners.forEach((l) => l(this._activeLocale));
  }

  /**
   * Universal Language Detection
   * Determines the language of the user's input with highest fidelity:
   * 1. Explicit language switch commands ("ab hindi mein", "have gujaratima", "in english")
   * 2. Native Unicode Scripts (Gujarati, Devanagari, Bengali/Assamese, Tamil, Telugu, etc.)
   * 3. Romanized transliteration phrases ("kem cho?", "majama?", "mujhe aaj kya karna hai?")
   * 4. Mixed language (Hinglish, Gujlish) e.g. "mujhe aaj medicine kab leni hai?"
   * 5. Short follow-up retention (preserves active conversation language)
   */
  public detectLanguage(text: string, currentSessionLocale?: string): string {
    const raw = (text || "").trim();
    if (!raw) return currentSessionLocale || this._activeLocale;

    const lower = raw.toLowerCase();
    const fallback = currentSessionLocale || this._activeLocale;

    // 1. Explicit language switch requests
    if (/\b(switch to|speak in|change to|say in|talk in)\s+gujarati\b/i.test(lower) || /\b(gujarati ma|gujaratima|ગુજરાતીમાં|have gujarati)\b/i.test(lower)) {
      this.setActiveLocale("gu-IN");
      return "gu-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+hindi\b/i.test(lower) || /\b(hindi me|hindi mein|हिंदी में|हिन्दी में|ab hindi)\b/i.test(lower)) {
      this.setActiveLocale("hi-IN");
      return "hi-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+bengali\b/i.test(lower) || /\b(banglay|bangla te|বাংলায়)\b/i.test(lower)) {
      this.setActiveLocale("bn-IN");
      return "bn-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+assamese\b/i.test(lower) || /\b(axomiya|অসমীয়াত)\b/i.test(lower)) {
      this.setActiveLocale("as-IN");
      return "as-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+marathi\b/i.test(lower) || /\b(marathit|मराठीत)\b/i.test(lower)) {
      this.setActiveLocale("mr-IN");
      return "mr-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+tamil\b/i.test(lower) || /\b(tamilil|தமிழில்)\b/i.test(lower)) {
      this.setActiveLocale("ta-IN");
      return "ta-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+telugu\b/i.test(lower) || /\b(telugulo|తెలుగులో)\b/i.test(lower)) {
      this.setActiveLocale("te-IN");
      return "te-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+kannada\b/i.test(lower) || /\b(kannadadalli|ಕನ್ನಡದಲ್ಲಿ)\b/i.test(lower)) {
      this.setActiveLocale("kn-IN");
      return "kn-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+malayalam\b/i.test(lower) || /\b(malayalathil|മലയാളത്തിൽ)\b/i.test(lower)) {
      this.setActiveLocale("ml-IN");
      return "ml-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+punjabi\b/i.test(lower) || /\b(punjabi vich|ਪੰਜਾਬੀ ਵਿੱਚ)\b/i.test(lower)) {
      this.setActiveLocale("pa-IN");
      return "pa-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+odia\b/i.test(lower) || /\b(odia re|ଓଡ଼ିଆରେ)\b/i.test(lower)) {
      this.setActiveLocale("or-IN");
      return "or-IN";
    }
    if (/\b(switch to|speak in|change to|say in|talk in)\s+english\b/i.test(lower) || /\b(in english|english please)\b/i.test(lower)) {
      this.setActiveLocale("en-IN");
      return "en-IN";
    }

    // 2. Native Unicode Scripts (100% confidence)
    if (/[\u0A80-\u0AFF]/.test(raw)) {
      this.setActiveLocale("gu-IN");
      return "gu-IN";
    }
    if (/[\u0980-\u09FF]/.test(raw)) {
      if (/[ৱৰ]/.test(raw) || /\b(কাইলৈ|পুৱা|খালোঁ|আছিল|কৰিম|হ’ল|হয়|বজাত|কেনে|আজি)\b/.test(raw)) {
        this.setActiveLocale("as-IN");
        return "as-IN";
      }
      this.setActiveLocale("bn-IN");
      return "bn-IN";
    }
    if (/[\u0B80-\u0BFF]/.test(raw)) {
      this.setActiveLocale("ta-IN");
      return "ta-IN";
    }
    if (/[\u0C00-\u0C7F]/.test(raw)) {
      this.setActiveLocale("te-IN");
      return "te-IN";
    }
    if (/[\u0C80-\u0CFF]/.test(raw)) {
      this.setActiveLocale("kn-IN");
      return "kn-IN";
    }
    if (/[\u0D00-\u0D7F]/.test(raw)) {
      this.setActiveLocale("ml-IN");
      return "ml-IN";
    }
    if (/[\u0A00-\u0A7F]/.test(raw)) {
      this.setActiveLocale("pa-IN");
      return "pa-IN";
    }
    if (/[\u0B00-\u0B7F]/.test(raw)) {
      this.setActiveLocale("or-IN");
      return "or-IN";
    }
    if (/[\u0900-\u097F]/.test(raw)) {
      if (/\b(आहे|आहोत|नाही|कसे|कसा|केले|झाले|पाहिजे|वाजता|दुपारी|सकाळी|औषध|घेते|घेतले|करा|सांगा)\b/.test(raw)) {
        this.setActiveLocale("mr-IN");
        return "mr-IN";
      }
      this.setActiveLocale("hi-IN");
      return "hi-IN";
    }

    // 3. Romanized Transliteration & Mixed Code-Switching Detection
    // Gujarati Romanized / Gujlish:
    if (
      /\b(kem cho|kemcho|majama|maja ma|su karo|su kare|su chhe|su che|mare medicine|mari medicine|levani che|kyare levani|tamare|tamaru|savare|dawa levi|dava levi|jamvanu|aaje maro|aaje maru|aaje su|vage|vagye)\b/i.test(
        lower
      )
    ) {
      this.setActiveLocale("gu-IN");
      return "gu-IN";
    }

    // Hindi Romanized / Hinglish:
    if (
      /\b(kaise ho|kya haal|aaj kya|aaj ka|aaj ki|meri dawa|mujhe aaj|medicine kab leni|dawai kab|kab lena|batao|samjhao|namaste|theek hai|paani|pani|karna hai|kholo|chalo|bahut accha)\b/i.test(
        lower
      )
    ) {
      this.setActiveLocale("hi-IN");
      return "hi-IN";
    }

    // Bengali Romanized:
    if (
      /\b(kemon acho|kemon achen|apni kemon|ki korbo|oshudh kobe|aajke ki|aami bhalo|khobor ki)\b/i.test(
        lower
      )
    ) {
      this.setActiveLocale("bn-IN");
      return "bn-IN";
    }

    // Tamil Romanized:
    if (
      /\b(naan eppadi|eppadi irukkeenga|eppadi irukeenga|vanakkam|marunthu eppo|iniku enna)\b/i.test(
        lower
      )
    ) {
      this.setActiveLocale("ta-IN");
      return "ta-IN";
    }

    // Marathi Romanized:
    if (
      /\b(kasa ahes|kashi ahes|kay challay|aushadh kadhi|sakali kay|sanga mala)\b/i.test(
        lower
      )
    ) {
      this.setActiveLocale("mr-IN");
      return "mr-IN";
    }

    // Assamese Romanized:
    if (/\b(kene aasa|ki khobor|aaji ki kaam|kailoi puwa)\b/i.test(lower)) {
      this.setActiveLocale("as-IN");
      return "as-IN";
    }

    // Telugu Romanized:
    if (/\b(ela unnaru|mandhu eppudu|e roju emi)\b/i.test(lower)) {
      this.setActiveLocale("te-IN");
      return "te-IN";
    }

    // Kannada Romanized:
    if (/\b(hegiddira|oushadha yavaga|ivathu enu)\b/i.test(lower)) {
      this.setActiveLocale("kn-IN");
      return "kn-IN";
    }

    // Malayalam Romanized:
    if (/\b(sukhamano|marunnu eppozha|innu entha)\b/i.test(lower)) {
      this.setActiveLocale("ml-IN");
      return "ml-IN";
    }

    // Punjabi Romanized:
    if (/\b(sat sri akal|kiddan|dawai kadon|ajj ki karna)\b/i.test(lower)) {
      this.setActiveLocale("pa-IN");
      return "pa-IN";
    }

    // Odia Romanized:
    if (/\b(kemiti achhanti|oushadha kete bele|aaji kana)\b/i.test(lower)) {
      this.setActiveLocale("or-IN");
      return "or-IN";
    }

    // 4. Short multi-turn answers (e.g. "yes", "no", "8:30", "ok", "sure", "ha", "haan")
    const isShortContinuation =
      raw.length <= 8 ||
      /^(yes|no|ok|okay|sure|confirm|cancel|ha|haan|nah|8|9|10|7|6|5|4|3|2|1|pm|am|\d{1,2}([:.]\d{2})?)$/i.test(
        lower
      );

    if (isShortContinuation && fallback) {
      return fallback;
    }

    // 5. English queries ("How are you?", "What is AI?", "What should I do today?")
    if (
      /\b(what|how|why|when|where|who|is|are|can|could|would|should|tell|explain|medicine|routine|appointment|today|tomorrow)\b/i.test(
        lower
      )
    ) {
      // If user had an Indic session active, check if this is truly English
      const englishWordMatches = (lower.match(/\b(the|is|are|what|how|you|do|today|my|me|can|please|explain|story|game)\b/g) || []).length;
      if (englishWordMatches >= 2) {
        this.setActiveLocale("en-IN");
        return "en-IN";
      }
    }

    // Preserve the session's active language if previously set to an Indic language
    if (fallback && fallback !== "en-IN") {
      return fallback;
    }

    this.setActiveLocale("en-IN");
    return "en-IN";
  }

  public setActiveLocale(locale: string) {
    if (this._activeLocale !== locale) {
      this._activeLocale = locale;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_LANG_KEY, locale);
        const code = locale.split("-")[0];
        if (code) localStorage.setItem("mb.lang", code);
      }
      this._notify();
    }
  }

  /**
   * Formats speech for seniors: gentle, simple, respectful
   */
  public toElderlyFriendly(text: string, locale?: string): string {
    const loc = locale || this._activeLocale;
    let clean = text.trim();

    // Remove technical phrasing
    clean = clean.replace(/\b(adherence status indicates|pharmacological regimen|cognitive parameters|session metric)\b/gi, "");
    clean = clean.replace(/\s+/g, " ").trim();
    return clean;
  }
}

export const languageEngine = new CentralLanguageEngine();

// ===========================================================================
// Central Game Multilingual Dictionaries
// Guarantees that EVERY Memory Bond game displays instructions, buttons, hints,
// and feedback in the detected language without hardcoded English.
// ===========================================================================

export interface GameLocalizationStrings {
  start: string;
  restart: string;
  reset: string;
  nextQuestion: string;
  checkAnswer: string;
  level: string;
  of: string;
  pairs: string;
  question: string;
  score: string;
  accuracy: string;
  wellDone: string;
  greatEffort: string;
  allPairsConnected: string;
  spotOn: string;
  goodTry: string;
  wonderfulEffort: string;
  secondsRemaining: string;
  tapToSelect: string;
  somethingWentWrong: string;
  tryAgain: string;
  exitGame: string;
  instructions: {
    cardMatch: string;
    objectRecall: string;
    patternRecall: string;
    sequenceMemory: string;
    routineRecall: string;
    familyPhoto: string;
    voiceQuiz: string;
    findDifference: string;
    wordMemory: string;
    matchObject: string;
    nerCultural: string;
  };
}

export const GAME_I18N: Record<string, GameLocalizationStrings> = {
  gu: {
    start: "શરૂ કરો",
    restart: "ફરી શરૂ કરો",
    reset: "રીસેટ",
    nextQuestion: "આગળનો પ્રશ્ન",
    checkAnswer: "તપાસો",
    level: "લેવલ",
    of: "માંથી",
    pairs: "જોડીઓ",
    question: "પ્રશ્ન",
    score: "સ્કોર",
    accuracy: "સચોટતા",
    wellDone: "ખૂબ સરસ! શાબાશ!",
    greatEffort: "સુંદર પ્રયાસ કર્યો!",
    allPairsConnected: "બધી જોડીઓ જોડાઈ ગઈ!",
    spotOn: "એકદમ સાચો જવાબ! ઉત્તમ સ્મૃતિ!",
    goodTry: "સારો પ્રયાસ! અભ્યાસ ચાલુ રાખો!",
    wonderfulEffort: "અદ્ભુત સ્મૃતિ પ્રયાસ!",
    secondsRemaining: "સેકન્ડ બાકી",
    tapToSelect: "પસંદ કરવા માટે ટેપ કરો",
    somethingWentWrong: "કંઈક સમસ્યા થઈ છે. કૃપા કરીને ફરી પ્રયાસ કરો.",
    tryAgain: "ફરી પ્રયાસ કરો",
    exitGame: "રમતમાંથી બહાર નીકળો",
    instructions: {
      cardMatch: "સરખા ચિત્રવાળા બે કાર્ડ પસંદ કરો અને જોડી બનાવો.",
      objectRecall: "થાલી પર રાખેલી વસ્તુઓ ધ્યાનથી જુઓ અને ફેરફાર ઓળખો.",
      patternRecall: "આકારનો ક્રમ યાદ રાખો અને તે જ ક્રમમાં પસંદ કરો.",
      sequenceMemory: "દર્શાવેલા આંકડા યાદ રાખીને તે જ ક્રમમાં દાખલ કરો.",
      routineRecall: "દૈનિક સ્વસ્થ આદતો વિશે શાંત મનથી જવાબ આપો.",
      familyPhoto: "પરિવારના વહાલા સભ્યો અને જૂની યાદોને ઓળખો.",
      voiceQuiz: "ધ્યાનથી અવાજ સાંભળો અને સાચો વિકલ્પ પસંદ કરો.",
      findDifference: "ગ્રીડમાં જુદી પડતી એક વસ્તુ પર ટેપ કરો.",
      wordMemory: "શાંતિથી શબ્દો વાંચો અને યાદ રાખીને પસંદ કરો.",
      matchObject: "સંબંધિત ઘરની વસ્તુઓની યોગ્ય જોડી બનાવો.",
      nerCultural: "સાંસ્કૃતિક વસ્તુઓનો ક્રમ ધ્યાનથી યાદ રાખો.",
    },
  },
  hi: {
    start: "शुरू करें",
    restart: "दोबारा शुरू करें",
    reset: "रीसेट",
    nextQuestion: "अगला प्रश्न",
    checkAnswer: "जांचें",
    level: "लेवल",
    of: "में से",
    pairs: "जोड़े",
    question: "प्रश्न",
    score: "स्कोर",
    accuracy: "सटीकता",
    wellDone: "बहुत बढ़िया! शाबाश!",
    greatEffort: "शानदार प्रयास!",
    allPairsConnected: "सभी जोड़े मिल गए!",
    spotOn: "बिल्कुल सही! बेहतरीन याददाश्त!",
    goodTry: "अच्छा प्रयास! अभ्यास जारी रखें!",
    wonderfulEffort: "अद्भुत प्रयास!",
    secondsRemaining: "सेकंड शेष",
    tapToSelect: "चुनने के लिए टैप करें",
    somethingWentWrong: "कुछ समस्या हुई है। कृपया फिर कोशिश करें।",
    tryAgain: "फिर कोशिश करें",
    exitGame: "खेल से बाहर जाएं",
    instructions: {
      cardMatch: "समान चित्रों वाले दो कार्ड चुनें और जोड़े बनाएं।",
      objectRecall: "थाली पर रखी वस्तुओं को ध्यान से देखें और बदलाव पहचानें।",
      patternRecall: "क्रम को ध्यान से देखें और उसी क्रम में दोहराएं।",
      sequenceMemory: "दिखाए गए नंबर याद रखें और उसी क्रम में दर्ज करें।",
      routineRecall: "दैनिक स्वस्थ दिनचर्या के बारे में शांत मन से उत्तर दें।",
      familyPhoto: "परिवार के सदस्यों और प्यारी यादों को पहचानें।",
      voiceQuiz: "आवाज़ ध्यान से सुनें और सही उत्तर चुनें।",
      findDifference: "ग्रिड में से अलग दिखने वाली वस्तु पर टैप करें।",
      wordMemory: "शांति से शब्दों को पढ़ें और याद रखकर चुनें।",
      matchObject: "जुड़ी हुई वस्तुओं के सही जोड़े बनाएं।",
      nerCultural: "सांस्कृतिक वस्तुओं का क्रम ध्यान से याद रखें।",
    },
  },
  bn: {
    start: "শুরু করুন",
    restart: "পুনরায় খেলুন",
    reset: "রিসেট",
    nextQuestion: "পরবর্তী প্রশ্ন",
    checkAnswer: "যাচাই করুন",
    level: "লেভেল",
    of: "এর মধ্যে",
    pairs: "জোড়া",
    question: "প্রশ্ন",
    score: "স্কোর",
    accuracy: "সঠিকতা",
    wellDone: "দারুণ! শাবাশ!",
    greatEffort: "চমৎকার প্রচেষ্টা!",
    allPairsConnected: "সব জোড়া মিলে গেছে!",
    spotOn: "একদম সঠিক! চমৎকার স্মৃতিশক্তি!",
    goodTry: "ভালো চেষ্টা! চালিয়ে যান!",
    wonderfulEffort: "অপূর্ব স্মৃতিচর্চা!",
    secondsRemaining: "সেকেন্ড বাকি",
    tapToSelect: "নির্বাচন করতে ট্যাপ করুন",
    somethingWentWrong: "কিছু সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    tryAgain: "আবার চেষ্টা করুন",
    exitGame: "খেলা বন্ধ করুন",
    instructions: {
      cardMatch: "একই ছবির দুটি কার্ড উল্টে মিলিয়ে জোড়া তৈরি করুন।",
      objectRecall: "থালায় রাখা জিনিসগুলি মনোযোগ দিয়ে দেখে পরিবর্তন চিহ্নিত করুন।",
      patternRecall: "ক্রমটি লক্ষ্য করুন এবং সেই অনুসারে সাজান।",
      sequenceMemory: "সংখ্যাগুলি মনে রাখুন এবং একই ক্রমে প্রবেশ করান।",
      routineRecall: "স্বাস্থ্যকর দৈনন্দিন রুটিন সম্পর্কে প্রশ্নের উত্তর দিন।",
      familyPhoto: "পরিবারের আপনজনদের চিনুন এবং স্মৃতি স্মরণ করুন।",
      voiceQuiz: "মনোযোগ দিয়ে অডিও শুনে সঠিক উত্তরটি নির্বাচন করুন।",
      findDifference: "গ্রিডে অন্যরকম একটি বস্তুর উপর ট্যাপ করুন।",
      wordMemory: "শব্দগুলি শান্তভাবে পড়ুন এবং মনে রেখে চিহ্নিত করুন।",
      matchObject: "সম্পর্কযুক্ত দৈনন্দিন জিনিসগুলির জোড়া লাগান।",
      nerCultural: "সাংস্কৃতিক বস্তুগুলির ক্রমটি মনে রাখুন।",
    },
  },
  as: {
    start: "আৰম্ভ কৰক",
    restart: "পুনৰ খেলক",
    reset: "ৰিচেট",
    nextQuestion: "পৰৱৰ্তী প্ৰশ্ন",
    checkAnswer: "পৰীক্ষা কৰক",
    level: "লেভেল",
    of: "ৰ ভিতৰত",
    pairs: "যোৰ",
    question: "প্ৰশ্ন",
    score: "স্কোৰ",
    accuracy: "শুদ্ধতা",
    wellDone: "বৰ ধুনীয়া! বহুত ভাল!",
    greatEffort: "সুন্দৰ প্ৰচেষ্টা!",
    allPairsConnected: "সকলো যোৰ মিলি গ'ল!",
    spotOn: "একদম সঠিক! অপূৰ্ব স্মৃতি!",
    goodTry: "ভাল প্ৰচেষ্টা! আগবাঢ়ি যাওক!",
    wonderfulEffort: "অপূৰ্ব অনুশীলন!",
    secondsRemaining: "ছেকেণ্ড বাকী",
    tapToSelect: "বাছনি কৰিবলৈ টিপক",
    somethingWentWrong: "কিবা এটা সমস্যা হ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
    tryAgain: "পুনৰ চেষ্টা কৰক",
    exitGame: "খেল সমাপ্ত কৰক",
    instructions: {
      cardMatch: "একে ছবিৰ দুখন কাৰ্ড বাছি যোৰ সাজক।",
      objectRecall: "কাঁহীত থকা বস্তুবোৰ মনোযোগেৰে চাই পৰিৱৰ্তন চিনি উলিয়াওক।",
      patternRecall: "ক্ৰমটো মনত ৰাখি সেইদৰে সজাওক।",
      sequenceMemory: "নম্বৰবোৰ মনত ৰাখক আৰু একে ক্ৰমত লিখক।",
      routineRecall: "দৈনন্দিন স্বাস্থ্যৱান অভ্যাসৰ বিষয়ে উত্তৰ দিয়ক।",
      familyPhoto: "পৰিয়ালৰ মৰমৰ মানুহবোৰ চিনি পাওক।",
      voiceQuiz: "কথাখিনি শুনি সঠিক উত্তৰ বাছক।",
      findDifference: "বেলেগ বস্তু এটা চিনাক্ত কৰক।",
      wordMemory: "শব্দবোৰ পঢ়ি মনত ৰাখক।",
      matchObject: "সম্পৰ্ক থকা বস্তুবোৰ মিলাওক।",
      nerCultural: "সাংস্কৃতিক বস্তুবোৰৰ ক্ৰম মনত ৰাখক।",
    },
  },
  mr: {
    start: "सुरू करा",
    restart: "पुन्हा सुरू करा",
    reset: "रीसेट",
    nextQuestion: "पुढील प्रश्न",
    checkAnswer: "तपासा",
    level: "पातळी",
    of: "पैकी",
    pairs: "जोड्या",
    question: "प्रश्न",
    score: "गुण",
    accuracy: "अचूकता",
    wellDone: "खूप छान! शाब्बास!",
    greatEffort: "उत्तम प्रयत्न!",
    allPairsConnected: "सर्व जोड्या जुळल्या!",
    spotOn: "अचूक उत्तर! उत्तम स्मरणशक्ती!",
    goodTry: "छान प्रयत्न! चालू ठेवा!",
    wonderfulEffort: "अप्रतिम स्मरण सराव!",
    secondsRemaining: "सेकंद बाकी",
    tapToSelect: "निवडण्यासाठी टॅप करा",
    somethingWentWrong: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
    tryAgain: "पुन्हा प्रयत्न करा",
    exitGame: "खेळ बंद करा",
    instructions: {
      cardMatch: "सारखे चित्र असलेली दोन कार्डे निवडून जोडी बनवा.",
      objectRecall: "ताटातील वस्तू लक्षपूर्वक पहा आणि बदल ओळखा.",
      patternRecall: "नमुना लक्षात ठेवा आणि पुन्हा तयार करा.",
      sequenceMemory: "क्रमांक लक्षात ठेवा आणि त्याच क्रमाने भरा.",
      routineRecall: "दैनंदिन आरोग्याविषयी प्रश्नांची उत्तरे द्या.",
      familyPhoto: "कुटुंबातील प्रिय व्यक्तींना ओळखा.",
      voiceQuiz: "आवाज लक्षपूर्वक ऐका आणि योग्य पर्याय निवडा.",
      findDifference: "वेगळी असलेली एक वस्तू शोधा.",
      wordMemory: "शब्द वाचा आणि लक्षात ठेवून निवडा.",
      matchObject: "संबंधित वस्तूंच्या जोड्या लावा.",
      nerCultural: "सांस्कृतिक वस्तूंचा क्रम लक्षात ठेवा.",
    },
  },
  ta: {
    start: "தொடங்கு",
    restart: "மீண்டும் விளையாடு",
    reset: "மீட்டமை",
    nextQuestion: "அடுத்த கேள்வி",
    checkAnswer: "சரிபார்",
    level: "நிலை",
    of: "இல்",
    pairs: "இணைகள்",
    question: "கேள்வி",
    score: "மதிப்பெண்",
    accuracy: "துல்லியம்",
    wellDone: "மிக நன்று! வாழ்த்துகள்!",
    greatEffort: "சிறப்பான முயற்சி!",
    allPairsConnected: "அனைத்து இணைகளும் சேர்ந்தன!",
    spotOn: "சரியான விடை! அருமையான நினைவாற்றல்!",
    goodTry: "நல்ல முயற்சி! தொடருங்கள்!",
    wonderfulEffort: "அற்புதமான நினைவாற்றல் பயிற்சி!",
    secondsRemaining: "வினாடிகள் மீதம்",
    tapToSelect: "தேர்ந்தெடுக்க தொடவும்",
    somethingWentWrong: "ஏதோ தவறு நடந்துவிட்டது. மீண்டும் முயற்சிக்கவும்.",
    tryAgain: "மீண்டும் முயற்சி செய்",
    exitGame: "வெளியேறு",
    instructions: {
      cardMatch: "பொருந்தும் இரண்டு படங்களை தேர்ந்தெடுத்து இணைக்கவும்.",
      objectRecall: "தட்டில் உள்ள பொருட்களை கவனித்து மாற்றத்தைக் கண்டறியவும்.",
      patternRecall: "வரிசையை கவனித்து அதே வரிசையில் அமைக்கவும்.",
      sequenceMemory: "எண்களை நினைவில் வைத்து உள்ளிடவும்.",
      routineRecall: "தினசரி நலப்பழக்கங்கள் பற்றிய கேள்விக்கு விடையளிக்கவும்.",
      familyPhoto: "குடும்ப உறுப்பினர்களை அடையாளம் காணவும்.",
      voiceQuiz: "குரல் குறிப்பைக் கேட்டு சரியான விடையைத் தேர்ந்தெடுக்கவும்.",
      findDifference: "வித்தியாசமான ஒரு பொருளைத் தட்டவும்.",
      wordMemory: "வார்த்தைகளை அமைதியாகப் படித்து நினைவில் வைக்கவும்.",
      matchObject: "தொடர்புடைய அன்றாடப் பொருட்களை இணைக்கவும்.",
      nerCultural: "பண்பாட்டுப் பொருட்களின் வரிசையை நினைவில் வைக்கவும்.",
    },
  },
  te: {
    start: "ప్రారంభించండి",
    restart: "మళ్లీ ఆడండి",
    reset: "రీసెట్",
    nextQuestion: "తదుపరి ప్రశ్న",
    checkAnswer: "సరిచూడండి",
    level: "స్థాయి",
    of: "లో",
    pairs: "జంటలు",
    question: "ప్రశ్న",
    score: "స్కోరు",
    accuracy: "ఖచ్చితత్వం",
    wellDone: "చాలా బాగుంది! శభాష్!",
    greatEffort: "మంచి ప్రయత్నం!",
    allPairsConnected: "అన్ని జంటలు కలిశాయి!",
    spotOn: "ఖచ్చితమైన సమాధానం!",
    goodTry: "మంచి ప్రయత్నం!",
    wonderfulEffort: "అద్భుతమైన జ్ఞాపకశక్తి వ్యాయామం!",
    secondsRemaining: "సెకన్లు మిగిలి ఉన్నాయి",
    tapToSelect: "ఎంచుకోవడానికి నొక్కండి",
    somethingWentWrong: "ఏదో సమస్య వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
    tryAgain: "మళ్లీ ప్రయత్నించండి",
    exitGame: "ఆట నుండి నిష్క్రమించు",
    instructions: {
      cardMatch: "ఒకేలా ఉన్న రెండు కార్డులను ఎంచుకుని జత చేయండి.",
      objectRecall: "పళ్ళెంలో ఉన్న వస్తువులను గమనించి మార్పును గుర్తించండి.",
      patternRecall: "క్రమాన్ని గుర్తుంచుకుని అమర్చండి.",
      sequenceMemory: "నంబర్లను గుర్తుంచుకుని నమోదు చేయండి.",
      routineRecall: "రోజువారీ ఆరోగ్యపు అలవాట్లకు సమాధానం ఇవ్వండి.",
      familyPhoto: "కుటుంబ సభ్యులను గుర్తించండి.",
      voiceQuiz: "వాయిస్ నోట్ విని సరైన సమాధానం ఎంచుకోండి.",
      findDifference: "భిన్నంగా ఉన్న వస్తువును గుర్తించండి.",
      wordMemory: "పదాలను చదివి గుర్తుంచుకోండి.",
      matchObject: "సంబంధిత వస్తువులను జత చేయండి.",
      nerCultural: "సాంస్కృతిక వస్తువుల క్రమాన్ని గుర్తుంచుకోండి.",
    },
  },
  kn: {
    start: "ಪ್ರಾರಂಭಿಸಿ",
    restart: "ಮತ್ತೆ ಆಡಿ",
    reset: "ರೀಸೆಟ್",
    nextQuestion: "ಮುಂದಿನ ಪ್ರಶ್ನೆ",
    checkAnswer: "ಪರಿಶೀಲಿಸಿ",
    level: "ಹಂತ",
    of: "ರಲ್ಲಿ",
    pairs: "ಜೋಡಿಗಳು",
    question: "ಪ್ರಶ್ನೆ",
    score: "ಅಂಕ",
    accuracy: "ನಿಖರತೆ",
    wellDone: "ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ! ಶಾಬಾಶ್!",
    greatEffort: "ಉತ್ತಮ ಪ್ರಯತ್ನ!",
    allPairsConnected: "ಎಲ್ಲಾ ಜೋಡಿಗಳು ಹೊಂದಾಣಿಕೆಯಾದವು!",
    spotOn: "ಸರಿಯಾದ ಉತ್ತರ! ಅದ್ಭುತ ನೆನಪಿನ ಶಕ್ತಿ!",
    goodTry: "ಉತ್ತಮ ಪ್ರಯತ್ನ! ಮುಂದುವರಿಸಿ!",
    wonderfulEffort: "ಉತ್ತಮ ನೆನಪಿನ ಶಕ್ತಿಯ ಅಭ್ಯಾಸ!",
    secondsRemaining: "ಸೆಕೆಂಡುಗಳು ಬಾಕಿ ಇವೆ",
    tapToSelect: "ಆಯ್ಕೆ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
    somethingWentWrong: "ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    tryAgain: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    exitGame: "ಆಟದಿಂದ ನಿರ್ಗಮಿಸಿ",
    instructions: {
      cardMatch: "ಹೊಂದಾಣಿಕೆಯಾಗುವ ಎರಡು ಕಾರ್ಡ್‌ಗಳನ್ನು ಜೋಡಿಸಿ.",
      objectRecall: "ತಟ್ಟೆಯಲ್ಲಿರುವ ವಸ್ತುಗಳನ್ನು ಗಮನಿಸಿ ಬದಲಾವಣೆ ಗುರುತಿಸಿ.",
      patternRecall: "ವಿನ್ಯಾಸದ ಕ್ರಮವನ್ನು ನೆನಪಿನಲ್ಲಿಡಿ.",
      sequenceMemory: "ಸಂಖ್ಯೆಗಳನ್ನು ನೆನಪಿಸಿಕೊಂಡು ನಮೂದಿಸಿ.",
      routineRecall: "ದೈನಂದಿನ ಆರೋಗ್ಯಕರ ದಿನಚರಿಗೆ ಉತ್ತರಿಸಿ.",
      familyPhoto: "ಕುಟುಂಬದ ಸದಸ್ಯರನ್ನು ಗುರುತಿಸಿ.",
      voiceQuiz: "ಧ್ವನಿ ಸೂಚನೆ ಕೇಳಿ ಸರಿಯಾದ ಉತ್ತರ ಆರಿಸಿ.",
      findDifference: "ವಿಭಿನ್ನವಾಗಿರುವ ವಸ್ತುವನ್ನು ಗುರುತಿಸಿ.",
      wordMemory: "ಪದಗಳನ್ನು ಓದಿ ನೆನಪಿಡಿ.",
      matchObject: "ಸಂಬಂಧಿಸಿದ ವಸ್ತುಗಳನ್ನು ಜೋಡಿಸಿ.",
      nerCultural: "ಸಾಂಸ್ಕೃತಿಕ ವಸ್ತುಗಳ ಕ್ರಮ ನೆನಪಿಡಿ.",
    },
  },
  ml: {
    start: "ആരംഭിക്കുക",
    restart: "വീണ്ടും കളിക്കുക",
    reset: "റീസെറ്റ്",
    nextQuestion: "അടുത്ത ചോദ്യം",
    checkAnswer: "പരിശോധിക്കുക",
    level: "ലെവൽ",
    of: "ൽ",
    pairs: "ജോഡികൾ",
    question: "ചോദ്യം",
    score: "സ്കോർ",
    accuracy: "കൃത്യത",
    wellDone: "വളരെ നന്നായി! അഭിനന്ദനങ്ങൾ!",
    greatEffort: "നല്ല പരിശ്രമം!",
    allPairsConnected: "എല്ലാ ജോഡികളും ചേർത്തു!",
    spotOn: "കൃത്യമായ ഉത്തരം!",
    goodTry: "നല്ല ശ്രമം!",
    wonderfulEffort: "മികച്ച ഓർമ്മശക്തി പരിശീലനം!",
    secondsRemaining: "സെക്കൻഡ് ബാക്കി",
    tapToSelect: "തിരഞ്ഞെടുക്കാൻ ടാപ്പ് ചെയ്യുക",
    somethingWentWrong: "എന്തോ തകരാറുണ്ടായി. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    tryAgain: "വീണ്ടും ശ്രമിക്കുക",
    exitGame: "പുറത്തു കടക്കുക",
    instructions: {
      cardMatch: "യോജിക്കുന്ന രണ്ട് കാർഡുകൾ കണ്ടെത്തി ജോടിയാക്കുക.",
      objectRecall: "തട്ടിലുള്ള സാധനങ്ങൾ കണ്ട് മാറ്റം കണ്ടെത്തുക.",
      patternRecall: "പാറ്റേൺ ഓർത്ത് ക്രമീകരിക്കുക.",
      sequenceMemory: "നമ്പറുകൾ ഓർത്ത് ടൈപ്പ് ചെയ്യുക.",
      routineRecall: "ആരോഗ്യകരമായ ദിനചര്യകളെക്കുറിച്ചുള്ള ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകുക.",
      familyPhoto: "കുടുംബാംഗങ്ങളെ തിരിച്ചറിയുക.",
      voiceQuiz: "ശബ്ദം ശ്രദ്ധിച്ച് ശരിയായ ഉത്തരം തിരഞ്ഞെടുക്കുക.",
      findDifference: "വ്യത്യസ്തമായ ഒരെണ്ണം കണ്ടെത്തുക.",
      wordMemory: "വാക്കുകൾ വായിച്ച് ഓർത്തു വെക്കുക.",
      matchObject: "ബന്ധപ്പെട്ട സാധനങ്ങൾ തമ്മിൽ യോജിപ്പിക്കുക.",
      nerCultural: "സാസ്കാരിക വസ്തുക്കളുടെ ക്രമം ഓർക്കുക.",
    },
  },
  pa: {
    start: "ਸ਼ੁਰੂ ਕਰੋ",
    restart: "ਦੁਬਾਰਾ ਖੇਡੋ",
    reset: "ਰੀਸੈਟ",
    nextQuestion: "ਅਗਲਾ ਸਵਾਲ",
    checkAnswer: "ਜਾਂਚੋ",
    level: "ਲੈਵਲ",
    of: "ਵਿੱਚੋਂ",
    pairs: "ਜੋੜੇ",
    question: "ਸਵਾਲ",
    score: "ਸਕੋਰ",
    accuracy: "ਸ਼ੁੱਧਤਾ",
    wellDone: "ਬਹੁਤ ਵਧੀਆ! ਸ਼ਾਬਾਸ਼!",
    greatEffort: "ਵਧੀਆ ਕੋਸ਼ਿਸ਼!",
    allPairsConnected: "ਸਾਰੇ ਜੋੜੇ ਮਿਲ ਗਏ!",
    spotOn: "ਬਿਲਕੁਲ ਸਹੀ ਜਵਾਬ!",
    goodTry: "ਚੰਗੀ ਕੋਸ਼ਿਸ਼!",
    wonderfulEffort: "ਸ਼ਾਨਦਾਰ ਅਭਿਆਸ!",
    secondsRemaining: "ਸਕਿੰਟ ਬਾਕੀ",
    tapToSelect: "ਚੁਣਨ ਲਈ ਟੈਪ ਕਰੋ",
    somethingWentWrong: "ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    tryAgain: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
    exitGame: "ਖੇਡ ਤੋਂ ਬਾਹਰ ਜਾਓ",
    instructions: {
      cardMatch: "ਇੱਕੋ ਜਿਹੇ ਦੋ ਕਾਰਡ ਚੁਣ ਕੇ ਜੋੜਾ ਬਣਾਓ।",
      objectRecall: "ਥਾਲੀ ਵਿੱਚ ਰੱਖੀਆਂ ਚੀਜ਼ਾਂ ਧਿਆਨ ਨਾਲ ਦੇਖੋ ਅਤੇ ਬਦਲਾਅ ਪਛਾਣੋ।",
      patternRecall: "ਤਰਤੀਬ ਯਾਦ ਰੱਖੋ ਅਤੇ ਦੁਹਰਾਓ।",
      sequenceMemory: "ਨੰਬਰ ਯਾਦ ਰੱਖੋ ਅਤੇ ਉਸੇ ਤਰਤੀਬ ਵਿੱਚ ਦਾਖਲ ਕਰੋ।",
      routineRecall: "ਰੋਜ਼ਾਨਾ ਚੰਗੀਆਂ ਆਦਤਾਂ ਬਾਰੇ ਜਵਾਬ ਦਿਓ।",
      familyPhoto: "ਪਰਿਵਾਰ ਦੇ ਮੈਂਬਰਾਂ ਨੂੰ ਪਛਾਣੋ।",
      voiceQuiz: "ਆਵਾਜ਼ ਧਿਆਨ ਨਾਲ ਸੁਣੋ ਅਤੇ ਸਹੀ ਜਵਾਬ ਚੁਣੋ।",
      findDifference: "ਵੱਖਰੀ ਚੀਜ਼ 'ਤੇ ਟੈਪ ਕਰੋ।",
      wordMemory: "ਸ਼ਬਦ ਪੜ੍ਹੋ ਅਤੇ ਯਾਦ ਰੱਖ ਕੇ ਚੁਣੋ।",
      matchObject: "ਜੁੜੀਆਂ ਚੀਜ਼ਾਂ ਦਾ ਮੇਲ ਕਰੋ।",
      nerCultural: "ਸੱਭਿਆਚਾਰਕ ਚੀਜ਼ਾਂ ਦੀ ਤਰਤੀਬ ਯਾਦ ਰੱਖੋ।",
    },
  },
  or: {
    start: "ଆରମ୍ଭ କରନ୍ତୁ",
    restart: "ପୁଣି ଖେଳନ୍ତୁ",
    reset: "ରିସେଟ୍",
    nextQuestion: "ପରବର୍ତ୍ତୀ ପ୍ରଶ୍ନ",
    checkAnswer: "ଯାଞ୍ଚ କରନ୍ତୁ",
    level: "ସ୍ତର",
    of: "ମଧ୍ୟରୁ",
    pairs: "ଯୋଡ଼ି",
    question: "ପ୍ରଶ୍ନ",
    score: "ସ୍କୋର୍",
    accuracy: "ସଠିକତା",
    wellDone: "ବହୁତ ଭଲ! ଶାବାଶ!",
    greatEffort: "ଉତ୍ତମ ପ୍ରୟାସ!",
    allPairsConnected: "ସମସ୍ତ ଯୋଡ଼ି ମିଳିଗଲା!",
    spotOn: "ଠିକ୍ ଉତ୍ତର!",
    goodTry: "ଭଲ ଚେଷ୍ଟା!",
    wonderfulEffort: "ଚମତ୍କାର ଅଭ୍ୟାସ!",
    secondsRemaining: "ସେକେଣ୍ଡ ବାକି",
    tapToSelect: "ବାଛିବା ପାଇଁ ଟ୍ୟାପ୍ କରନ୍ତୁ",
    somethingWentWrong: "କିଛି ଅସୁବିଧା ହେଲା। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    tryAgain: "ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ",
    exitGame: "ଖେଳ ବନ୍ଦ କରନ୍ତୁ",
    instructions: {
      cardMatch: "ସମାନ ଚିତ୍ର ଥିବା ଦୁଇଟି କାର୍ଡ ବାଛି ଯୋଡ଼ି କରନ୍ତୁ।",
      objectRecall: "ଥାଳିରେ ଥିବା ଜିନିଷଗୁଡ଼ିକ ଦେଖି ପରିବର୍ତ୍ତନ ଚିହ୍ନଟ କରନ୍ତୁ।",
      patternRecall: "କ୍ରମଟି ମନେ ରଖି ପୁନରାବୃତ୍ତି କରନ୍ତୁ।",
      sequenceMemory: "ନମ୍ବରଗୁଡ଼ିକ ମନେ ରଖି ପ୍ରବେଶ କରନ୍ତୁ।",
      routineRecall: "ସ୍ୱାସ୍ଥ୍ୟକର ଦୈନିକ ଅଭ୍ୟାସ ବିଷୟରେ ଉତ୍ତର ଦିଅନ୍ତୁ।",
      familyPhoto: "ପରିବାରର ସଦସ୍ୟମାନଙ୍କୁ ଚିହ୍ନନ୍ତୁ।",
      voiceQuiz: "ସ୍ୱର ଶୁଣି ସଠିକ୍ ଉତ୍ତର ବାଛନ୍ତୁ।",
      findDifference: "ଭିନ୍ନ ଥିବା ଜିନିଷଟି ଉପରେ ଟ୍ୟାପ୍ କରନ୍ତୁ।",
      wordMemory: "ଶବ୍ଦଗୁଡ଼ିକ ପଢ଼ି ମନେ ରଖନ୍ତୁ।",
      matchObject: "ସମ୍ପର୍କିତ ଜିନିଷଗୁଡ଼ିକୁ ଯୋଡ଼ନ୍ତୁ।",
      nerCultural: "ସାଂସ୍କୃତିକ ଜିନିଷର କ୍ରମ ମନେ ରଖନ୍ତୁ।",
    },
  },
  en: {
    start: "Start",
    restart: "Play Again",
    reset: "Reset",
    nextQuestion: "Next Question",
    checkAnswer: "Check Answer",
    level: "Level",
    of: "of",
    pairs: "Pairs",
    question: "Question",
    score: "Score",
    accuracy: "Accuracy",
    wellDone: "Well done! Excellent effort!",
    greatEffort: "Great effort! Keep going!",
    allPairsConnected: "All pairs connected!",
    spotOn: "Spot on! Excellent memory!",
    goodTry: "Good try! Great practice!",
    wonderfulEffort: "Wonderful recall effort!",
    secondsRemaining: "s remaining",
    tapToSelect: "Tap to select",
    somethingWentWrong: "Something went wrong. Please try again.",
    tryAgain: "Try Again",
    exitGame: "Exit Game",
    instructions: {
      cardMatch: "Flip peaceful cards and find matching pairs.",
      objectRecall: "Observe keepsakes on the tray and spot the mystery change.",
      patternRecall: "Watch the pattern and repeat the sequence in order.",
      sequenceMemory: "Remember the numbers shown and enter them in order.",
      routineRecall: "Calm questions reinforcing healthy daily habits.",
      familyPhoto: "Familiar faces and heartwarming family relationships.",
      voiceQuiz: "Listen to the audio cue and pick the correct recall answer.",
      findDifference: "Look across the peaceful grid and tap the odd one out.",
      wordMemory: "Read and remember the calm words, then pick them out.",
      matchObject: "Connect everyday items with their natural partners.",
      nerCultural: "Remember the sequence of culturally familiar keepsakes.",
    },
  },
};

/**
 * Gets localized game UI text based on language code or locale
 */
export function getGameStrings(localeOrCode?: string): GameLocalizationStrings {
  const code = (localeOrCode || languageEngine.activeLocale).split("-")[0]?.toLowerCase() || "en";
  return GAME_I18N[code] || GAME_I18N["en"]!;
}
