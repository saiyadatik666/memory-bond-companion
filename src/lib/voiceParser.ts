import type { MemoryBondStore } from "./memoryBondStore";
import { conversationalAI } from "./conversationalAI";
import { voiceManager, getBestMatchingVoice, cleanAIResponse } from "./voiceProvider";
import { isWorldKnowledgeQuery, resolveWorldKnowledge, resolveVerifiedFact } from "./worldKnowledgeEngine";

// ---------------------------------------------------------------------------
// Intent types
// ---------------------------------------------------------------------------
export type VoiceIntent =
  | {
      type: "TAKE_MEDICINE";
      medicineId?: string;
      medicineName?: string;
      confirmationMessage: string;
    }
  | {
      type: "CREATE_REMINDER";
      title: string;
      time: string;
      date?: string | null;
      notes?: string;
      reminderType:
        | "medicine"
        | "shopping"
        | "appointment"
        | "personal"
        | "family_call"
        | "routine"
        | "hydration"
        | "walking"
        | "meal"
        | "custom";
      confirmationMessage: string;
    }
  | {
      type: "CREATE_APPOINTMENT";
      title: string;
      date: string;
      time: string;
      location?: string;
      confirmationMessage: string;
    }
  | { type: "ADD_JOURNAL"; title: string; body: string; confirmationMessage: string }
  | { type: "NAVIGATE"; targetView: string; confirmationMessage: string }
  | { type: "QUERY_NEXT_REMINDER"; message: string }
  | { type: "SPEAK_REMINDERS"; message: string }
  | { type: "ANSWER"; message: string }
  | { type: "QUERY_MEDICINE"; message: string }
  | { type: "CASUAL_CHAT"; message: string }
  | { type: "CONFIRM_ACTION"; confirmationMessage: string }
  | { type: "CANCEL_ACTION"; confirmationMessage: string }
  | { type: "UNKNOWN"; original: string; confirmationMessage: string };

/** Intents that are simply spoken back — no confirmation card needed. */
const SPOKEN_ANSWER_TYPES = [
  "QUERY_NEXT_REMINDER",
  "SPEAK_REMINDERS",
  "ANSWER",
  "QUERY_MEDICINE",
  "CASUAL_CHAT",
  "CANCEL_ACTION",
];

export function isSpokenAnswer(
  intent: VoiceIntent,
): intent is Extract<VoiceIntent, { message: string }> {
  return SPOKEN_ANSWER_TYPES.includes(intent.type);
}

/** The spoken text of any intent, whatever its shape. */
export function intentSpeech(intent: VoiceIntent): string {
  if (isSpokenAnswer(intent)) return intent.message;
  return intent.confirmationMessage;
}

// ---------------------------------------------------------------------------
// Universal Language Detection Engine (Unicode Scripts + Transliterations + Mixed)
// ---------------------------------------------------------------------------
export function detectLanguage(text: string, currentSessionLocale?: string): string {
  const raw = text.trim();
  const t = raw.toLowerCase();
  if (!t) return currentSessionLocale || "en-IN";

  // 1. Explicit user language switch commands (e.g. "Ab Hindi mein samjhao", "હવે ગુજરાતીમાં કહો", "In English please")
  if (/\b(switch to|speak in|change to)\s+gujarati\b/i.test(t) || /\b(gujarati ma|gujarati mein|ગુજરાતીમાં)\b/i.test(t) || /\bhave gujarati\b/i.test(t)) return "gu-IN";
  if (/\b(switch to|speak in|change to)\s+hindi\b/i.test(t) || /\b(hindi me|hindi mein|हिन्दी में|हिंदी में)\b/i.test(t) || /\bab hindi\b/i.test(t)) return "hi-IN";
  if (/\b(switch to|speak in|change to)\s+marathi\b/i.test(t) || /\b(marathit|मराठीत)\b/i.test(t)) return "mr-IN";
  if (/\b(switch to|speak in|change to)\s+bengali\b/i.test(t) || /\b(bangla te|banglay|বাংলায়)\b/i.test(t)) return "bn-IN";
  if (/\b(switch to|speak in|change to)\s+assamese\b/i.test(t) || /\b(axomiya|অসমীয়াত)\b/i.test(t)) return "as-IN";
  if (/\b(switch to|speak in|change to)\s+tamil\b/i.test(t) || /\b(tamilil|தமிழில்)\b/i.test(t)) return "ta-IN";
  if (/\b(switch to|speak in|change to)\s+telugu\b/i.test(t) || /\b(telugulo|తెలుగులో)\b/i.test(t)) return "te-IN";
  if (/\b(switch to|speak in|change to)\s+kannada\b/i.test(t) || /\b(kannadadalli|ಕನ್ನಡದಲ್ಲಿ)\b/i.test(t)) return "kn-IN";
  if (/\b(switch to|speak in|change to)\s+malayalam\b/i.test(t) || /\b(malayalathil|മലയാളത്തിൽ)\b/i.test(t)) return "ml-IN";
  if (/\b(switch to|speak in|change to)\s+punjabi\b/i.test(t) || /\b(punjabi vich|ਪੰਜਾਬੀ ਵਿੱਚ)\b/i.test(t)) return "pa-IN";
  if (/\b(switch to|speak in|change to)\s+odia\b/i.test(t) || /\b(odia re|ଓଡ଼ିଆରେ)\b/i.test(t)) return "or-IN";
  if (/\b(switch to|speak in|change to)\s+english\b/i.test(t) || /\b(in english|english please)\b/i.test(t)) return "en-IN";

  // 2. Native Unicode Script Detection (highest confidence)
  if (/[\u0A80-\u0AFF]/.test(raw)) return "gu-IN"; // Gujarati Script
  if (/[\u0900-\u097F]/.test(raw)) {
    // Marathi specific words / inflectional markers in Devanagari
    if (/\b(आहे|आहोत|नाही|कसे|कसा|केले|झाले|पाहिजे|वाजता|दुपारी|सकाळी|औषध|घेते|घेतले|करा|सांगा)\b/.test(raw)) {
      return "mr-IN";
    }
    return "hi-IN"; // Hindi in Devanagari
  }
  if (/[\u0980-\u09FF]/.test(raw)) {
    // Assamese specific characters (ৱ, ৰ) or common Assamese words
    if (/[ৱৰ]/.test(raw) || /\b(কাইলৈ|পুৱা|খালোঁ|আছিল|কৰিম|হ’ল|হয়|বজাত|কেনে|আজি)\b/.test(raw)) {
      return "as-IN";
    }
    return "bn-IN"; // Bengali
  }
  if (/[\u0B80-\u0BFF]/.test(raw)) return "ta-IN"; // Tamil
  if (/[\u0C00-\u0C7F]/.test(raw)) return "te-IN"; // Telugu
  if (/[\u0C80-\u0CFF]/.test(raw)) return "kn-IN"; // Kannada
  if (/[\u0D00-\u0D7F]/.test(raw)) return "ml-IN"; // Malayalam
  if (/[\u0A00-\u0A7F]/.test(raw)) return "pa-IN"; // Punjabi
  if (/[\u0B00-\u0B7F]/.test(raw)) return "or-IN"; // Odia

  // 3. Romanized / Transliterated Indian Language & Mixed Language Markers (PRIORITY BEFORE ENGLISH FALLBACK)
  // Gujarati Transliteration (e.g. "kem cho", "mare medicine kyare levani che", "su kare che")
  if (
    /\b(kem cho|kaho|tamaru|tamari|tame|su karo|su chaley|su chhe|su che|mare|tamare|dawa levi|dava levi|levani che|kyare|savare|bapore|saanje|ketla|ketle|vagye|vage|aaje|pan|chhe|nathi|aapo|bhai|jamvanu|majama)\b/i.test(t)
  ) {
    return "gu-IN";
  }

  // Hindi & Hinglish Transliteration (e.g. "kaise ho", "aaj kya karna hai", "Can you tell me aaj ka routine", "meri dawa")
  if (
    /\b(kaise ho|kya haal|aaj kya|aaj ka|aaj ki|aaj ke|meri dawa|dawai|kab leni|batao|samjhao|kripya|namaste|theek hai|subah|shaam|baje|paani|pani|mujhe|mera|meri|karo|kholo|chalo|bahut|kaisa|kaisi|bolo|shuru|hai|hain|nahi|nahin|accha|acha|karna hai)\b/i.test(t)
  ) {
    return "hi-IN";
  }

  // Marathi Transliteration
  if (/\b(kasa ahes|kashi ahes|kay challay|aushadh kadhi|sakali|sandhyakali|sanga|kuthe|ahe|nahi|ghyayche)\b/i.test(t)) {
    return "mr-IN";
  }

  // Bengali Transliteration
  if (/\b(kemon aachen|kemon acho|ki korbo|oshudh koto|shokal|bikel|khabo|kheyechi|aajke|aami)\b/i.test(t)) {
    return "bn-IN";
  }

  // Assamese Transliteration
  if (/\b(kene aasa|ki khobor|aaji ki kaam|kailoi|puwa|khalu|bozat|axomiya)\b/i.test(t)) {
    return "as-IN";
  }

  // Tamil Transliteration
  if (/\b(eppadi irukkeenga|vanakkam|marunthu eppo|iniku enna|naalai|neram|manikku)\b/i.test(t)) {
    return "ta-IN";
  }

  // Telugu Transliteration
  if (/\b(ela unnaru|namaskaram|mandhu eppudu|e roju emi|repu|gantalaku)\b/i.test(t)) {
    return "te-IN";
  }

  // Kannada Transliteration
  if (/\b(hegiddira|oushadha yavaga|ivathu enu|beligge|gantege)\b/i.test(t)) {
    return "kn-IN";
  }

  // Malayalam Transliteration
  if (/\b(sukhamano|marunnu eppozha|innu entha|ravile|manikku)\b/i.test(t)) {
    return "ml-IN";
  }

  // Punjabi Transliteration
  if (/\b(sat sri akal|kiddan|dawai kadon|ajj ki karna|savere|vaje)\b/i.test(t)) {
    return "pa-IN";
  }

  // Odia Transliteration
  if (/\b(kemiti achhanti|oushadha kete bele|aaji kana|sakale|tare)\b/i.test(t)) {
    return "or-IN";
  }

  // 4. Short multi-turn answers (e.g. "yes", "no", "8:30", "confirm") preserve the active session language
  const isShortContinuation =
    raw.length <= 8 ||
    /^(yes|no|ok|okay|sure|confirm|cancel|8|9|10|7|6|5|4|3|2|1|pm|am|\d{1,2}([:.]\d{2})?)$/i.test(t);

  if (isShortContinuation && currentSessionLocale && currentSessionLocale !== "en-IN") {
    return currentSessionLocale;
  }

  // 5. Default fallback to English for general queries ("What is AI?", "Explain it simply", "How does gravity work?")
  return "en-IN";
}

/** Pick a localized value: exact locale, then fallback */
export function pick<T>(map: Record<string, T>, locale: string): T {
  const base = (locale.split("-")[0] ?? "en").toLowerCase();
  const sibling: Record<string, string> = {
    as: "bn-IN",
    or: "bn-IN",
    mr: "hi-IN",
    pa: "hi-IN",
    kn: "ta-IN",
    ml: "ta-IN",
  };
  const sib = sibling[base];
  return (
    map[locale] ??
    map[`${base}-IN`] ??
    (sib ? map[sib] : undefined) ??
    (map["en-IN"] as T)
  );
}

// Best voice picker for elderly accessibility using central voice engine
export function selectVoice(lang: string): SpeechSynthesisVoice | null {
  return getBestMatchingVoice(lang);
}

// Normalize regional numeral characters to standard digits
export function normalizeNumerals(str: string): string {
  return str
    .replace(/[૦०০੦]/g, "0")
    .replace(/[૧१১੧]/g, "1")
    .replace(/[૨२২੨]/g, "2")
    .replace(/[૩३৩੩]/g, "3")
    .replace(/[૪४৪੪]/g, "4")
    .replace(/[૫५৫੫]/g, "5")
    .replace(/[૬६৬੬]/g, "6")
    .replace(/[૭७৭੭]/g, "7")
    .replace(/[૮८৮੮]/g, "8")
    .replace(/[૯९৯੯]/g, "9");
}

// Spoken number words mapping across Indian languages
const NUMBER_WORDS: Record<string, number> = {
  "दस": 10, "দশ": 10, "દસ": 10, "দहा": 10, "ten": 10,
  "नौ": 9, "নয়": 9, "નવ": 9, "नऊ": 9, "nine": 9,
  "आठ": 8, "আট": 8, "આઠ": 8, "eight": 8,
  "सात": 7, "সাত": 7, "સાત": 7, "seven": 7,
  "छह": 6, "छः": 6, "ছয়": 6, "છ": 6, "सहा": 6, "six": 6,
  "पांच": 5, "पाँच": 5, "পাঁচ": 5, "પાંચ": 5, "पाच": 5, "five": 5,
  "चार": 4, "চাৰি": 4, "চার": 4, "ચાર": 4, "four": 4,
  "तीन": 3, "তিনি": 3, "তিন": 3, "ત્રણ": 3, "three": 3,
  "दो": 2, "দুই": 2, "બે": 2, "दोन": 2, "two": 2,
  "एक": 1, "এক": 1, "એક": 1, "one": 1,
  "ग्यारह": 11, "এঘাৰ": 11, "এগারো": 11, "અગિયાર": 11, "अकरा": 11, "eleven": 11,
  "बारह": 12, "বাৰ": 12, "বারো": 12, "બાર": 12, "बारा": 12, "twelve": 12,
};

// Time extractor supporting Indian natural speech (Hindi, Gujarati, English, regional terms)
export function extractTime(text: string): string {
  const norm = normalizeNumerals(text);
  const t = norm.toLowerCase();
  
  // Format: 8:30 AM / 8.30 PM / 8:30
  const m1 = t.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/);
  if (m1 && m1[1] && m1[2]) {
    let h = parseInt(m1[1], 10);
    const min = m1[2];
    const mer = m1[3];
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${min}`;
  }

  // Format: 8 AM / 8 PM / 8 baje / 8 વાગ્યે / 8 বজাত / 8 वाजता
  const m2 = t.match(/(\d{1,2})\s*(am|pm|baje|बजे|বজাত|টায়|વાગ્યે|વાગે|वाजता|மணிக்கு|గంటలకు|ಗಂಟೆಗೆ|മണിക്ക്|ਵਜੇ|ଟାରେ)?/);
  if (m2 && m2[1]) {
    let h = parseInt(m2[1], 10);
    if (h >= 1 && h <= 12) {
      const isMorning = t.includes("morning") || t.includes("subah") || t.includes("सुबह") || t.includes("સવારે") || t.includes("savare") || t.includes("সকাল") || t.includes("পুৱা") || t.includes("सकाळी") || t.includes("am");
      const isEvening = t.includes("evening") || t.includes("shaam") || t.includes("शाम") || t.includes("સાંજે") || t.includes("saanje") || t.includes("সন্ধ্যা") || t.includes("संध्याकाळी") || t.includes("pm");
      const isNight = t.includes("night") || t.includes("raat") || t.includes("रात") || t.includes("રાત્રે") || t.includes("રાત") || t.includes("राती") || t.includes("রাত্রে");
      const isAfternoon = t.includes("afternoon") || t.includes("dopahar") || t.includes("दोपहर") || t.includes("બપોરે") || t.includes("દુપારી") || t.includes("দুপুর");

      if ((isEvening || isNight || isAfternoon) && h < 12) {
        h += 12;
      }
      return `${h.toString().padStart(2, "0")}:00`;
    }
  }

  // Spoken number words check e.g. "દસ વાગ્યે", "આઠ વાગ્યે", "दस बजे", "सुबह आठ बजे", "eight am"
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    if (t.includes(word)) {
      const isPm = t.includes("pm") || t.includes("shaam") || t.includes("शाम") || t.includes("સાંજ") || t.includes("રાત") || t.includes("raat") || t.includes("evening") || t.includes("night") || t.includes("બપોર");
      const h = isPm && num < 12 ? num + 12 : num;
      return `${h.toString().padStart(2, "0")}:00`;
    }
  }

  // Pure number like "8" when user mentions time
  const m3 = t.match(/\b(\d{1,2})\b/);
  if (m3 && m3[1]) {
    const num = parseInt(m3[1], 10);
    if (num >= 1 && num <= 12) {
      const isPm = t.includes("pm") || t.includes("shaam") || t.includes("સાંજ") || t.includes("રાત") || t.includes("raat") || t.includes("evening") || t.includes("night") || t.includes("બપોર");
      const h = isPm && num < 12 ? num + 12 : num;
      return `${h.toString().padStart(2, "0")}:00`;
    }
  }

  // Natural colloquial terms
  if (t.includes("raat") || t.includes("night") || t.includes("tonight") || t.includes("રાત") || t.includes("राती")) return "20:30";
  if (t.includes("morning") || t.includes("subah") || t.includes("savare") || t.includes("સવાર") || t.includes("પુৱা") || t.includes("সকাল") || t.includes("सकाळ")) return "08:30";
  if (t.includes("afternoon") || t.includes("dopahar") || t.includes("બપોર") || t.includes("दुपारी") || t.includes("দুপুর")) return "13:00";
  if (t.includes("evening") || t.includes("shaam") || t.includes("સાંજ") || t.includes("সন্ধ্যা") || t.includes("संध्याकाळ")) return "17:30";

  return "08:30";
}

// ---------------------------------------------------------------------------
// Localised message maps for All 12 Languages
// ---------------------------------------------------------------------------
const MED_CONFIRM: Record<string, (n: string) => string> = {
  "hi-IN": (n) => `क्या आप दर्ज करना चाहते हैं कि आपने ${n} ले ली?`,
  "as-IN": (n) => `আপুনি ${n} খালে বুলি লিপিবদ্ধ কৰিবনে?`,
  "bn-IN": (n) => `আপনি কি নথিবদ্ধ করতে চান যে আপনি ${n} খেয়েছেন?`,
  "gu-IN": (n) => `શું તમે નોંધવા માંગો છો કે તમે ${n} લીધી છે?`,
  "mr-IN": (n) => `आपण नोंदवू इच्छिता का की आपण ${n} घेतली आहे?`,
  "ta-IN": (n) => `நீங்கள் ${n} உட்கொண்டதாகப் பதிவு செய்யவா?`,
  "te-IN": (n) => `మీరు ${n} వేసుకున్నారని నమోదు చేయమంటారా?`,
  "kn-IN": (n) => `ನೀವು ${n} ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ ಎಂದು ದಾಖಲಿಸಬೇಕೇ?`,
  "ml-IN": (n) => `നിങ്ങൾ ${n} കഴിച്ചതായി രേഖപ്പെടുത്തണമോ?`,
  "pa-IN": (n) => `ਕੀ ਤੁਸੀਂ ਦਰਜ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ ਕਿ ਤੁਸੀਂ ${n} ਲੈ ਲਈ ਹੈ?`,
  "or-IN": (n) => `ଆପଣ ${n} ନେଇଛନ୍ତି ବୋଲି ଲିପିବଦ୍ଧ କରିବେ କି?`,
  "en-IN": (n) => `Record that you took ${n}?`,
};

const REM_CONFIRM: Record<string, (t: string, tm: string) => string> = {
  "hi-IN": (t, tm) => `क्या मैं "${t}" के लिए ${tm} बजे का रिमाइंडर लगा दूँ?`,
  "as-IN": (t, tm) => `মই "${t}" ৰ বাবে ${tm} বজাত মনত পেলোৱা সংকেত লগাম নেকি?`,
  "bn-IN": (t, tm) => `আমি কি "${t}" এর জন্য ${tm} টায় রিমাইন্ডার সেট করব?`,
  "gu-IN": (t, tm) => `શું હું "${t}" માટે ${tm} વાગ્યે રિમાઇન્ડર ગોઠવું?`,
  "mr-IN": (t, tm) => `मी "${t}" साठी ${tm} वाजता आठवण सेट करू का?`,
  "ta-IN": (t, tm) => `"${t}" க்காக ${tm} மணிக்கு நினைவூட்டல் அமைக்கவா?`,
  "te-IN": (t, tm) => `"${t}" కోసం ${tm} గంటలకు రిమైండర్ సెట్ చేయమంటారా?`,
  "kn-IN": (t, tm) => `"${t}" ಗಾಗಿ ${tm} ಗಂಟೆಗೆ ಜ್ಞಾಪನೆಯನ್ನು ಹೊಂದಿಸಲೇ?`,
  "ml-IN": (t, tm) => `"${t}" നായി ${tm} ന് ഓർമ്മപ്പെടുത്തൽ സജ്ജീകരിക്കണമോ?`,
  "pa-IN": (t, tm) => `ਕੀ ਮੈਂ "${t}" ਲਈ ${tm} ਵਜੇ ਰੀਮਾਈਂਡਰ ਲਗਾ ਦੇਵਾਂ?`,
  "or-IN": (t, tm) => `ମୁଁ "${t}" ପାଇଁ ${tm} ଟାରେ ରିମାଇଣ୍ଡର ଲଗାଇବି କି?`,
  "en-IN": (t, tm) => `Shall I set a reminder for "${t}" at ${tm}?`,
};

const APPT_CONFIRM: Record<string, (t: string, tm: string) => string> = {
  "hi-IN": (t, tm) => `क्या "${t}" अपॉइंटमेंट ${tm} बजे के लिए सेव करूँ?`,
  "as-IN": (t, tm) => `"${t}" নিযুক্তি ${tm} বজাত সংৰক্ষণ কৰিম নেকি?`,
  "bn-IN": (t, tm) => `"${t}" অ্যাপয়েন্টমেন্ট ${tm} টায় সংরক্ষণ করব?`,
  "gu-IN": (t, tm) => `"${t}" એપોઇન્ટમેન્ટ ${tm} વાગ્યે સાચવું?`,
  "mr-IN": (t, tm) => `"${t}" भेट ${tm} वाजता जतन करू का?`,
  "ta-IN": (t, tm) => `"${t}" சந்திப்பை ${tm} மணிக்குச் சேமிக்கவா?`,
  "te-IN": (t, tm) => `"${t}" అపాయింట్‌మెంట్‌ను ${tm} గంటలకు సేవ్ చేయమంటారా?`,
  "kn-IN": (t, tm) => `"${t}" ನೇಮಕಾತಿಯನ್ನು ${tm} ಗಂಟೆಗೆ ಉಳಿಸಲೇ?`,
  "ml-IN": (t, tm) => `"${t}" കൂടിക്കാഴ്ച ${tm} ന് സേവ് ചെയ്യണമോ?`,
  "pa-IN": (t, tm) => `ਕੀ "${t}" ਮੁਲਾਕਾਤ ${tm} ਵਜੇ ਸੰਭਾਲੀਏ?`,
  "or-IN": (t, tm) => `"${t}" ସାକ୍ଷାତ ${tm} ଟାରେ ସଞ୍ଚୟ କରିବି କି?`,
  "en-IN": (t, tm) => `Save appointment "${t}" at ${tm}?`,
};

const JOURNAL_CONFIRM: Record<string, (b: string) => string> = {
  "hi-IN": (b) => `क्या आप इसे Memory Bond में याद के रूप में सेव करना चाहते हैं: "${b}"?`,
  "as-IN": (b) => `আপুনি এইটো Memory Bond দিনলিপিত স্মৃতি হিচাপে সাঁচিব খোজে নেকি: "${b}"?`,
  "bn-IN": (b) => `আপনি কি এটি Memory Bond ডায়েরিতে স্মৃতি হিসেবে সংরক্ষণ করতে চান: "${b}"?`,
  "gu-IN": (b) => `શું તમે આને Memory Bond માં યાદ તરીકે સાચવવા માંગો છો: "${b}"?`,
  "mr-IN": (b) => `आपण हे Memory Bond मध्ये आठवण म्हणून जतन करू इच्छिता: "${b}"?`,
  "ta-IN": (b) => `இதை Memory Bond இல் நினைவாகச் சேமிக்க விரும்புகிறீர்களா: "${b}"?`,
  "te-IN": (b) => `దీన్ని Memory Bond లో జ్ఞాపకంగా భద్రపరచాలనుకుంటున్నారా: "${b}"?`,
  "kn-IN": (b) => `ಇದನ್ನು Memory Bond ನಲ್ಲಿ ನೆನಪಾಗಿ ಉಳಿಸಲು ಬಯಸುವಿರಾ: "${b}"?`,
  "ml-IN": (b) => `ഇത് Memory Bond-ൽ ഓർമ്മയായി സൂക്ഷിക്കണോ: "${b}"?`,
  "pa-IN": (b) => `ਕੀ ਤੁਸੀਂ ਇਸਨੂੰ Memory Bond ਵਿੱਚ ਯਾਦ ਵਜੋਂ ਸੰਭਾਲਣਾ ਚਾਹੁੰਦੇ ਹੋ: "${b}"?`,
  "or-IN": (b) => `ଆପଣ ଏହାକୁ Memory Bond ରେ ସ୍ମୃତି ଭାବରେ ସାଇତି ରଖିବାକୁ ଚାହାଁନ୍ତି କି: "${b}"?`,
  "en-IN": (b) => `Shall I save this memory to your Memory Bond journal: "${b}"?`,
};

const NO_REMINDER_MSG: Record<string, string> = {
  "hi-IN": "आपके पास आज कोई आगामी रिमाइंडर नहीं है। सब कुछ पूरा हो चुका है।",
  "as-IN": "আপোনাৰ আজিৰ কোনো বাকী মনত পেলোৱা সংকেত নাই। সকলো সম্পূৰ্ণ হৈছে।",
  "bn-IN": "আপনার আজ কোনও অবশিষ্ট রিমাইন্ডার নেই। সব সম্পন্ন হয়েছে।",
  "gu-IN": "તમારી પાસે આજે કોઈ બાકી રિમાઇન્ડર નથી. બધું પૂર્ણ થઈ ગયું છે.",
  "mr-IN": "आपल्याकडे आज कोणतीही उर्वरित आठवण नाही. सर्व कामे पूर्ण झाली आहेत.",
  "ta-IN": "உங்களுக்கு இன்று வரவிருக்கும் நினைவூட்டல்கள் எதுவும் இல்லை. அனைத்தும் முடிந்தது.",
  "te-IN": "మీకు ఈ రోజు రాబోయే రిమైండర్‌లు లేవు. అన్నీ పూర్తయ్యాయి.",
  "kn-IN": "ನಿಮಗೆ ಇಂದು ಯಾವುದೇ ಬಾಕಿ ಜ್ಞಾಪನೆಗಳಿಲ್ಲ. ಎಲ್ಲವೂ ಪೂರ್ಣಗೊಂಡಿದೆ.",
  "ml-IN": "നിങ്ങൾക്ക് ഇന്ന് വരാനിരിക്കുന്ന ഓർമ്മപ്പെടുത്തലുകൾ ഒന്നുമില്ല.",
  "pa-IN": "ਤੁਹਾਡੇ ਕੋਲ ਅੱਜ ਕੋਈ ਬਾਕੀ ਰੀਮਾਈਂਡਰ ਨਹੀਂ ਹੈ। ਸਭ ਪੂਰਾ ਹੋ ਗਿਆ ਹੈ।",
  "or-IN": "ଆପଣଙ୍କର ଆଜି କୌଣସି ବାକି ସ୍ମାରକ ନାହିଁ। ସବୁ ହୋଇଯାଇଛି।",
  "en-IN": "You have no upcoming reminders for today. All caught up!",
};

const NEXT_REMINDER_MSG: Record<string, (t: string, tm: string) => string> = {
  "hi-IN": (t, tm) => `आपका अगला रिमाइंडर है: "${t}", ${tm} बजे।`,
  "as-IN": (t, tm) => `আপোনাৰ পৰৱৰ্তী মনত পেলোৱা কাম: "${t}", ${tm} বজাত।`,
  "bn-IN": (t, tm) => `আপনার পরের রিমাইন্ডার হলো: "${t}", ${tm} টায়।`,
  "gu-IN": (t, tm) => `તમારું આગલું રિમાઇન્ડર છે: "${t}", ${tm} વાગ્યે.`,
  "mr-IN": (t, tm) => `आपली पुढील आठवण आहे: "${t}", ${tm} वाजता.`,
  "ta-IN": (t, tm) => `உங்கள் அடுத்த நினைவூட்டல்: "${t}", ${tm} மணிக்கு.`,
  "te-IN": (t, tm) => `మీ తదుపరి రిమైండర్: "${t}", ${tm} గంటలకు.`,
  "kn-IN": (t, tm) => `ನಿಮ್ಮ ಮುಂದಿನ ಜ್ಞಾಪನೆ: "${t}", ${tm} ಗಂಟೆಗೆ.`,
  "ml-IN": (t, tm) => `നിങ്ങളുടെ അടുത്ത ഓർമ്മപ്പെടുത്തൽ: "${t}", ${tm} ന്.`,
  "pa-IN": (t, tm) => `ਤੁਹਾਡਾ ਅਗਲਾ ਰੀਮਾਈਂਡਰ ਹੈ: "${t}", ${tm} ਵਜੇ।`,
  "or-IN": (t, tm) => `ଆପଣଙ୍କ ପରବର୍ତ୍ତୀ ସ୍ମାରକ: "${t}", ${tm} ଟାରେ।`,
  "en-IN": (t, tm) => `Your next reminder is "${t}" at ${tm}.`,
};

const NO_MEDS_MSG: Record<string, string> = {
  "hi-IN": "आपकी सभी दवाइयाँ आज समय पर ले ली गई हैं। बहुत बढ़िया!",
  "as-IN": "আপোনাৰ সকলো ঔষধ আজি সময়মতে খোৱা হৈছে। বৰ ভাল!",
  "bn-IN": "আপনার সব ঔষধ আজ ঠিক সময়ে নেওয়া হয়েছে। খুব ভালো!",
  "gu-IN": "તમારી બધી દવાઓ આજે સમયસર લેવાઈ ગઈ છે. ખૂબ સરસ!",
  "mr-IN": "आपली सर्व औषधे आज वेळेवर घेतली गेली आहेत. उत्तम!",
  "ta-IN": "உங்கள் அனைத்து மருந்துகளும் இன்று சரியான நேரத்தில் உட்கொள்ளப்பட்டன. மிக நன்று!",
  "te-IN": "మీ మందులన్నీ ఈ రోజు సమయానికి వేసుకున్నారు. చాలా మంచిది!",
  "kn-IN": "ನಿಮ್ಮ ಎಲ್ಲಾ ಔಷಧಿಗಳನ್ನು ಇಂದು ಸಮಯಕ್ಕೆ ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ. ತುಂಬಾ ಒಳ್ಳೆಯದು!",
  "ml-IN": "നിങ്ങളുടെ എല്ലാ മരുന്നുകളും ഇന്ന് കൃത്യസമയത്ത് കഴിച്ചു.",
  "pa-IN": "ਤੁਹਾਡੀਆਂ ਸਾਰੀਆਂ ਦਵਾਈਆਂ ਅੱਜ ਸਮੇਂ ਸਿਰ ਲਈਆਂ ਗਈਆਂ ਹਨ। ਸ਼ਾਬਾਸ਼!",
  "or-IN": "ଆପଣଙ୍କର ସମସ୍ତ ଔଷଧ ଆଜି ସମୟରେ ନିଆଯାଇଛି। ବହୁତ ଭଲ!",
  "en-IN": "All your scheduled medicines have been taken today. Well done!",
};

const NEXT_MED_MSG: Record<string, (n: string, d: string, tm: string) => string> = {
  "hi-IN": (n, d, tm) => `आपकी अगली दवा है ${n} (${d}), समय: ${tm}।`,
  "as-IN": (n, d, tm) => `আপোনাৰ পৰৱৰ্তী ঔষধ হ’ল ${n} (${d}), সময়: ${tm}।`,
  "bn-IN": (n, d, tm) => `আপনার পরের ঔষধ হলো ${n} (${d}), সময়: ${tm}।`,
  "gu-IN": (n, d, tm) => `તમારી આગલી દવા છે ${n} (${d}), સમય: ${tm}.`,
  "mr-IN": (n, d, tm) => `आपले पुढील औषध आहे ${n} (${d}), वेळ: ${tm}.`,
  "ta-IN": (n, d, tm) => `உங்கள் அடுத்த மருந்து ${n} (${d}), நேரம்: ${tm}.`,
  "te-IN": (n, d, tm) => `మీ తదుపరి మందు ${n} (${d}), సమయం: ${tm}.`,
  "kn-IN": (n, d, tm) => `ನಿಮ್ಮ ಮುಂದಿನ ಔಷಧಿ ${n} (${d}), ಸಮಯ: ${tm}.`,
  "ml-IN": (n, d, tm) => `നിങ്ങളുടെ അടുത്ത മരുന്ന് ${n} (${d}), സമയം: ${tm}.`,
  "pa-IN": (n, d, tm) => `ਤੁਹਾਡੀ ਅਗਲੀ ਦਵਾਈ ਹੈ ${n} (${d}), ਸਮਾਂ: ${tm}।`,
  "or-IN": (n, d, tm) => `ଆପଣଙ୍କ ପରବର୍ତ୍ତୀ ଔଷଧ ହେଉଛି ${n} (${d}), ସମୟ: ${tm}।`,
  "en-IN": (n, d, tm) => `Your next medicine is ${n} (${d}) at ${tm}.`,
};

const UNKNOWN_MSG: Record<string, string> = {
  "hi-IN": "मैं समझ नहीं पाया। क्या आप दवा, रिमाइंडर या रूटीन के बारे में पूछना चाहते हैं?",
  "as-IN": "মই বুজি নাপালোঁ। আপুনি ঔষধ, মনত পেলোৱা সংকেত বা ৰুটিনৰ বিষয়ে সুধিব খোজে নেকি?",
  "bn-IN": "আমি বুঝতে পারিনি। আপনি কি ঔষধ, রিমাইন্ডার বা রুটিন সম্পর্কে জানতে চান?",
  "gu-IN": "હું સમજી શક્યો નથી. શું તમે દવા, રિમાઇન્ડર કે દિનચર્યા વિશે પૂછવા માંગો છો?",
  "mr-IN": "मला समजले नाही. आपण औषध, आठवण किंवा दिनचर्येबद्दल विचारू इच्छिता का?",
  "ta-IN": "எனக்குப் புரியவில்லை. மருந்து, நினைவூட்டல் அல்லது வழக்கம் பற்றி கேட்க விரும்புகிறீர்களா?",
  "te-IN": "నాకు అర్థం కాలేదు. మందులు, రిమైండర్లు లేదా దినచర్య గురించి అడగాలనుకుంటున్నారా?",
  "kn-IN": "ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ನೀವು ಔಷಧಿ, ಜ್ಞಾಪನೆ ಅಥವಾ ದಿನಚರಿಯ ಬಗ್ಗೆ ಕೇಳಲು ಬಯಸುವಿರಾ?",
  "ml-IN": "എനിക്ക് മനസ്സിലായില്ല. മരുന്ന്, ഓർമ്മപ്പെടുത്തൽ അല്ലെങ്കിൽ ദിനചര്യയെക്കുറിച്ച് ചോദിക്കണമോ?",
  "pa-IN": "ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਕੀ ਤੁਸੀਂ ਦਵਾਈ ਜਾਂ ਰੀਮਾਈਂਡਰ ਬਾਰੇ ਪੁੱਛਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
  "or-IN": "ମୁଁ ବୁଝିପାରିଲି ନାହିଁ। ଆପଣ ଔଷଧ ବା ସ୍ମାରକ ବିଷୟରେ ପଚାରିବାକୁ ଚାହାଁନ୍ତି କି?",
  "en-IN": "I didn't quite catch that. You can ask about medicines, reminders, or routine.",
};

export const CANCELLED_MSG: Record<string, string> = {
  "hi-IN": "ठीक है, रद्द कर दिया गया।",
  "as-IN": "ঠিক আছে, বাতিল কৰা হ’ল।",
  "bn-IN": "ঠিক আছে, বাতিল করা হলো।",
  "gu-IN": "ઠીક છે, રદ કરવામાં આવ્યું.",
  "mr-IN": "ठीक आहे, रद्द केले.",
  "ta-IN": "சரி, ரத்து செய்யப்பட்டது.",
  "te-IN": "సరే, రద్దు చేయబడింది.",
  "kn-IN": "ಸರಿ, ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.",
  "ml-IN": "ശരി, റദ്ദാക്കി.",
  "pa-IN": "ਠੀਕ ਹੈ, ਰੱਦ ਕਰ ਦਿੱਤਾ ਗਿਆ।",
  "or-IN": "ଠିକ୍ ଅଛି, ବାତିଲ୍ କରାଗଲା।",
  "en-IN": "Action cancelled.",
};

export const MEDICINE_TAKEN_SUCCESS_MSG: Record<string, string> = {
  "gu-IN": "દવા લેવાઈ ગઈ તરીકે નોંધાઈ ગઈ છે. ખૂબ સરસ!",
  "hi-IN": "दवा ले ली गई के रूप में दर्ज कर ली गई है। बहुत बढ़िया!",
  "as-IN": "ঔষধ খোৱা হৈছে বুলি সংৰক্ষণ কৰা হ’ল। বৰ ভাল!",
  "bn-IN": "ঔষধ খাওয়া হয়েছে হিসেবে নথিবদ্ধ করা হয়েছে। খুব ভালো!",
  "mr-IN": "औषध घेतले म्हणून नोंदवले गेले आहे. खूप छान!",
  "ta-IN": "மருந்து உட்கொண்டதாகப் பதிவு செய்யப்பட்டது. மிக நன்று!",
  "te-IN": "మందు తీసుకున్నట్లు నమోదు చేయబడింది. చాలా మంచిది!",
  "kn-IN": "ಔಷಧಿಯನ್ನು ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ ಎಂದು ದಾಖಲಿಸಲಾಗಿದೆ. ತುಂಬಾ ಒಳ್ಳೆಯದು!",
  "ml-IN": "മരുന്ന് കഴിച്ചതായി രേഖപ്പെടുത്തി. വളരെ നല്ലത്!",
  "pa-IN": "ਦਵਾਈ ਲੈਣ ਵਜੋਂ ਦਰਜ ਕਰ ਲਈ ਗਈ ਹੈ। ਬਹੁਤ ਵਧੀਆ!",
  "or-IN": "ଔଷଧ ନିଆଯାଇଛି ବୋଲି ଲିପିବଦ୍ଧ କରାଗଲା। ବହୁତ ଭଲ!",
  "en-IN": "Medicine recorded as taken. Very well done!",
};

export const REMINDER_SAVED_SUCCESS_MSG: Record<string, (time: string) => string> = {
  "gu-IN": (t) => `મેં ${t} વાગ્યા માટે રિમાઇન્ડર સાચવી લીધું છે.`,
  "hi-IN": (t) => `मैंने ${t} बजे के लिए रिमाइंडर सेव कर दिया है।`,
  "as-IN": (t) => `মই ${t} বজাৰ বাবে সংকেত সাঁচি ৰাখিলোঁ।`,
  "bn-IN": (t) => `আমি ${t} টার জন্য রিমাইন্ডার সংরক্ষণ করেছি।`,
  "mr-IN": (t) => `मी ${t} वाजतासाठी आठवण जतन केली आहे.`,
  "ta-IN": (t) => `நான் ${t} மணிக்கு நினைவூட்டலைச் சேமித்துள்ளேன்.`,
  "te-IN": (t) => `నేను ${t} గంటలకు రిమైండర్‌ను సేవ్ చేశాను.`,
  "kn-IN": (t) => `ನಾನು ${t} ಗಂಟೆಗೆ ಜ್ಞಾಪನೆಯನ್ನು ಉಳಿಸಿದ್ದೇನೆ.`,
  "ml-IN": (t) => `ഞാൻ ${t} നുള്ള ഓർമ്മപ്പെടുത്തൽ സൂക്ഷിച്ചു.`,
  "pa-IN": (t) => `ਮੈਂ ${t} ਵਜੇ ਲਈ ਰੀਮਾਈਂਡਰ ਸੰਭਾਲ ਲਿਆ ਹੈ।`,
  "or-IN": (t) => `ମୁଁ ${t} ଟା ପାଇଁ ରିମାଇଣ୍ଡର ସଞ୍ଚୟ କରିଛି।`,
  "en-IN": (t) => `Saved reminder for ${t}.`,
};

export const APPOINTMENT_SAVED_SUCCESS_MSG: Record<string, string> = {
  "gu-IN": "ડૉક્ટરની મુલાકાત સાચવી લેવામાં આવી છે.",
  "hi-IN": "डॉक्टर अपॉइंटमेंट सफलतापूर्वक सेव कर ली गई है।",
  "as-IN": "ডাক্তাৰৰ নিযুক্তি সফলভাৱে সংৰক্ষণ কৰা হ’ল।",
  "bn-IN": "ডাক্তারের অ্যাপয়েন্টমেন্ট সফলভাবে সংরক্ষণ করা হয়েছে।",
  "mr-IN": "डॉक्टरांची भेट यशस्वीरित्या जतन केली आहे.",
  "ta-IN": "மருத்துவர் சந்திப்பு வெற்றிகரமாகச் சேமிக்கப்பட்டது.",
  "te-IN": "డాక్టర్ అపాయింట్‌మెంట్ విజయవంతంగా సేవ్ చేయబడింది.",
  "kn-IN": "ವೈದ್ಯರ ನೇಮಕಾತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ.",
  "ml-IN": "ഡോക്ടറുടെ കൂടിക്കാഴ്ച വിജയകരമായി സേവ് ചെയ്തു.",
  "pa-IN": "ਡਾਕਟਰ ਮੁਲਾਕਾਤ ਸਫਲਤਾਪੂਰਵਕ ਸੰਭਾਲ ਲਈ ਗਈ ਹੈ।",
  "or-IN": "ଡାକ୍ତରଙ୍କ ସାକ୍ଷାତ ସଫଳତାର ସହିତ ସଞ୍ଚୟ କରାଗଲା।",
  "en-IN": "Doctor appointment confirmed and saved.",
};

export const JOURNAL_SAVED_SUCCESS_MSG: Record<string, string> = {
  "gu-IN": "તમારી વહાલી યાદ Memory Bond માં સાચવી લીધી છે.",
  "hi-IN": "आपकी प्यारी याद Memory Bond में सुरक्षित कर ली गई है।",
  "as-IN": "আপোনাৰ মধুৰ স্মৃতি Memory Bond ত সাঁচি ৰখা হ’ল।",
  "bn-IN": "আপনার সুন্দর স্মৃতি Memory Bond এ সংরক্ষণ করা হয়েছে।",
  "mr-IN": "आपली गोड आठवण Memory Bond मध्ये जतन केली आहे.",
  "ta-IN": "உங்கள் இனிய நினைவு Memory Bond இல் சேமிக்கப்பட்டது.",
  "te-IN": "మీ మధుర జ్ఞాపకం Memory Bond లో భద్రపరచబడింది.",
  "kn-IN": "ನಿಮ್ಮ ಮಧುರ ನೆನಪನ್ನು Memory Bond ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.",
  "ml-IN": "നിങ്ങളുടെ നല്ല ഓർമ്മ Memory Bond-ൽ സൂക്ഷിച്ചു.",
  "pa-IN": "ਤੁਹਾਡੀ ਪਿਆਰੀ ਯਾਦ Memory Bond ਵਿੱਚ ਸੰਭਾਲ ਲਈ ਗਈ ਹੈ।",
  "or-IN": "ଆପଣଙ୍କ ମଧୁର ସ୍ମୃତି Memory Bond ରେ ସାଇତି ରଖାଗଲା।",
  "en-IN": "Cherished memory saved to your Memory Bond journal.",
};

export const ERROR_HEARING_MSG: Record<string, string> = {
  "gu-IN": "અવાજ સ્પષ્ટ સંભળાયો નથી. કૃપા કરીને ફરી બોલો અથવા નીચે લખો.",
  "hi-IN": "आवाज़ साफ़ सुनाई नहीं दी। कृपया पुनः बोलें या नीचे लिखें।",
  "as-IN": "মাত স্পষ্টকৈ শুনা নগ’ল। অনুগ্ৰহ কৰি পুনৰ কওক বা তলত লিখক।",
  "bn-IN": "কথা স্পষ্টভাবে শোনা যায়নি। অনুগ্রহ করে আবার বলুন বা নিচে লিখুন।",
  "mr-IN": "आवाज स्पष्ट ऐकू आला नाही. कृपया पुन्हा बोला किंवा खाली लिहा.",
  "ta-IN": "குரல் தெளிவாகக் கேட்கவில்லை. தயவுசெய்து மீண்டும் பேசவும் அல்லது கீழே எழுதவும்.",
  "te-IN": "వాయిస్ స్పష్టంగా వినబడలేదు. దయచేసి మళ్లీ మాట్లాడండి లేదా క్రింద టైప్ చేయండి.",
  "kn-IN": "ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಮಾತನಾಡಿ ಅಥವಾ ಕೆಳಗೆ ಬರೆಯಿರಿ.",
  "ml-IN": "ശബ്ദം വ്യക്തമായി കേട്ടില്ല. ദയവായി വീണ്ടും സംസാരിക്കുക അല്ലെങ്കിൽ താഴെ എഴുതുക.",
  "pa-IN": "ਆਵਾਜ਼ ਸਾਫ਼ ਸੁਣਾਈ ਨਹੀਂ ਦਿੱਤੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ ਜਾਂ ਹੇਠਾਂ ਲਿਖੋ।",
  "or-IN": "ସ୍ୱର ସ୍ପଷ୍ଟ ଶୁଣାଗଲା ନାହିଁ। ଦୟାକରି ପୁଣି କୁହନ୍ତୁ ବା ତଳେ ଲେଖନ୍ତୁ।",
  "en-IN": "Could not hear audio clearly. Please try speaking again or type below.",
};

export const RETRY_LABEL_MSG: Record<string, string> = {
  "gu-IN": "ફરી પ્રયાસ કરો",
  "hi-IN": "पुनः प्रयास करें",
  "as-IN": "পুনৰ চেষ্টা কৰক",
  "bn-IN": "আবার চেষ্টা করুন",
  "mr-IN": "पुन्हा प्रयत्न करा",
  "ta-IN": "மீண்டும் முயற்சிக்கவும்",
  "te-IN": "మళ్లీ ప్రయత్నించండి",
  "kn-IN": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
  "ml-IN": "വീണ്ടും ശ്രമിക്കുക",
  "pa-IN": "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
  "or-IN": "ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ",
  "en-IN": "Try Again",
};

export const BARGE_IN_HINT_MSG: Record<string, string> = {
  "gu-IN": "બોલતી વખતે રોકવા માટે સ્ક્રીન પર ગમે ત્યાં ટેપ કરો",
  "hi-IN": "बोलते समय रोकने के लिए स्क्रीन पर कहीं भी टैप करें",
  "as-IN": "কথা কওঁতে বন্ধ কৰিবলৈ স্ক্ৰীণত যিকোনো ঠাইত স্পৰ্শ কৰক",
  "bn-IN": "কথা বলার সময় থামাতে স্ক্রিনে যেকোনো জায়গায় ট্যাপ করুন",
  "mr-IN": "बोलताना थांबवण्यासाठी स्क्रीनवर कुठेही टॅप करा",
  "ta-IN": "பேசும்போது குறுக்கிட திரையைத் தொடவும்",
  "te-IN": "మాట్లాడుతున్నప్పుడు ఆపడానికి స్క్రీన్‌పై ఎక్కడైనా తాకండి",
  "kn-IN": "ಮಾತನಾಡುವಾಗ ನಿಲ್ಲಿಸಲು ಪರದೆಯ ಮೇಲೆ ಎಲ್ಲಿಯಾದರೂ ಟ್ಯಾಪ್ ಮಾಡಿ",
  "ml-IN": "സംസാരിക്കുമ്പോൾ തടസ്സപ്പെടുത്താൻ സ്ക്രീനിൽ തൊടുക",
  "pa-IN": "ਬੋਲਦੇ ਸਮੇਂ ਰੋਕਣ ਲਈ ਸਕ੍ਰੀਨ 'ਤੇ ਕਿਤੇ ਵੀ ਟੈਪ ਕਰੋ",
  "or-IN": "କହିବା ସମୟରେ ଅଟକାଇବାକୁ ସ୍କ୍ରିନରେ କୌଣସି ସ୍ଥାନରେ ଟ୍ୟାପ୍ କରନ୍ତୁ",
  "en-IN": "Tap anywhere on screen to interrupt speech",
};

// ---------------------------------------------------------------------------
// Supported Voice Providers Architecture
// ---------------------------------------------------------------------------
export interface VoiceProviderOption {
  id: "web_speech" | "bhashini" | "google_cloud";
  name: string;
  description: string;
  active: boolean;
  offlineCapable: boolean;
}

export const SUPPORTED_VOICE_PROVIDERS: VoiceProviderOption[] = [
  {
    id: "web_speech",
    name: "Browser Speech Engine (Local & Offline Ready)",
    description: "Zero-latency, private, runs completely inside the device without external network.",
    active: true,
    offlineCapable: true,
  },
  {
    id: "bhashini",
    name: "BHASHINI AI (Indian Languages Mission)",
    description: "Dedicated Indian national AI speech pipeline supporting all 22 scheduled languages.",
    active: false,
    offlineCapable: false,
  },
  {
    id: "google_cloud",
    name: "Cloud Multilingual Speech Adapter",
    description: "High-fidelity neural voices with deep accent recognition.",
    active: false,
    offlineCapable: false,
  },
];

// Conversational affirmative and negative terms
const AFFIRMATIVE_TERMS = [
  "yes", "yeah", "sure", "ok", "okay", "confirm", "correct",
  "हाँ", "हा", "हाँजी", "कर दो", "लगा दो", "ले ली", "खा ली",
  "হয়", "ঠিক আছে", "কৰক",
  "হ্যাঁ", "হ্যা", "করুন", "নিয়েছি",
  "હા", "હાજી", "કરો", "લીધી",
  "होय", "हो", "करा", "घेतली",
  "ஆம்", "சரி", "போடுங்கள்", "உட்கொண்டேன்",
  "అవును", "సరే", "చేయండి", "వేశాను",
  "ಹೌದು", "ಸರಿ", "ಮಾಡಿ", "ತೆಗೆದುಕೊಂಡೆ",
  "അതെ", "ശരി", "കഴിച്ചു",
  "ਹਾਂ", "ਹਾਂਜੀ", "ਕਰੋ",
  "ହଁ", "ହଁଆଜ୍ଞା", "କରନ୍ତୁ",
];

const NEGATIVE_TERMS = [
  "no", "nope", "cancel", "stop", "dont", "do not",
  "नहीं", "ना", "मत करो", "रहने दो",
  "নহয়", "নালাগে", "বাতিল",
  "না", "করবেন না", "থাক",
  "ના", "નહીં", "રહેવા દો",
  "नाही", "नको",
  "இல்லை", "வேண்டாம்", "தவிர்",
  "వద్దు", "కాదు",
  "ಬೇಡ", "ಇಲ್ಲ",
  "വേണ്ട", "ഇല്ല",
  "ਨਹੀਂ", "ਰਹਿਣ ਦਿਓ",
  "ନାହିଁ", "ନାଇଁ",
];

export function isAffirmative(text: string): boolean {
  const t = text.trim().toLowerCase();
  return AFFIRMATIVE_TERMS.some((term) => t === term || t.startsWith(term + " ") || t.endsWith(" " + term));
}

export function isNegative(text: string): boolean {
  const t = text.trim().toLowerCase();
  return NEGATIVE_TERMS.some((term) => t === term || t.startsWith(term + " ") || t.endsWith(" " + term));
}

// ---------------------------------------------------------------------------
// Main Intent Parser
// ---------------------------------------------------------------------------
export function parseVoiceIntent(
  rawText: string,
  store: MemoryBondStore,
  locale = "en-IN",
  pendingContext?: VoiceIntent | null
): VoiceIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Context Retention Check: Did user confirm or reject previous pending action?
  if (pendingContext && !isSpokenAnswer(pendingContext)) {
    if (isAffirmative(lower)) {
      return {
        type: "CONFIRM_ACTION",
        confirmationMessage: "Confirmed. Executing now.",
      };
    }
    if (isNegative(lower)) {
      return {
        type: "CANCEL_ACTION",
        confirmationMessage: pick(CANCELLED_MSG, locale),
      };
    }
  }

  // 1.2. World Knowledge Check (Instant verified facts)
  if (isWorldKnowledgeQuery(text)) {
    const verified = resolveVerifiedFact(text, locale);
    if (verified) {
      return {
        type: "ANSWER",
        message: verified,
      };
    }
  }

  // 1.3. Voice-First Daily Routine & Plan (SIH 2026 Section 10 & 11)
  const isDailyPlanQuery =
    lower.includes("what do i have today") ||
    lower.includes("what do i need to do today") ||
    lower.includes("what is my plan today") ||
    lower.includes("what are my activities today") ||
    lower.includes("what should i do today") ||
    lower.includes("aaj mujhe kya karna hai") ||
    lower.includes("aaj kya karna hai") ||
    lower.includes("आज मुझे क्या करना है") ||
    lower.includes("आज क्या करना है") ||
    lower.includes("আজ মোৰ কি কাম আছে") ||
    lower.includes("আজ কি কৰিব লাগিব") ||
    lower.includes("আজকে কি করতে হবে");

  if (isDailyPlanQuery) {
    const nextMed = store.medicines[0];
    const nextApp = store.appointments[0];
    const recGame = store.activityRecommendation?.gameTitle || "Pattern Recall";

    let reply = "";
    if (locale.startsWith("hi")) {
      reply = `आज आपको ${nextMed ? `${nextMed.times[0] || "8:30"} बजे ${nextMed.name}` : "8:30 बजे मॉर्निंग"} मेडिसिन लेनी है। 10:00 बजे ${recGame} मेमोरी गतिविधि है। ${nextApp ? `शाम 4:00 बजे ${nextApp.title} है।` : "शाम 6:00 बजे फैमिली कॉल है।"}`;
    } else if (locale.startsWith("as") || locale.startsWith("bn")) {
      reply = `আজি আপোনাৰ পুৱা ${nextMed ? `${nextMed.times[0] || "৮:৩০"} বজাত ${nextMed.name}` : "৮:৩০ বজাত ঔষধ"} খাব লাগিব। ১০:০০ বজাত ${recGame} স্মৃতি অনুশীলন আৰু ${nextApp ? `আবেলি ৪:০০ বজাত ডাক্তৰৰ সাক্ষাৎ আছে।` : "গধূলি পৰিয়ালৰ লগত কথা পতাৰ সময়।"}`;
    } else {
      reply = `Today at ${nextMed ? `${nextMed.times[0] || "8:30 AM"} you have your ${nextMed.name}` : "8:30 AM morning medicine"}. At 10:00 AM you have your ${recGame} memory activity. ${nextApp ? `At 4:00 PM you have ${nextApp.title}.` : "At 6:00 PM you have your family check-in call."}`;
    }

    return {
      type: "ANSWER",
      message: reply,
    };
  }

  // 1.4. Direct Voice Quick Commands (Call Family, Start Game, Appointment Query)
  if (
    lower.includes("start my memory game") ||
    lower.includes("start memory game") ||
    lower.includes("start game") ||
    lower.includes("khel shuru karo") ||
    lower.includes("game shuru karo") ||
    lower.includes("खेल शुरू करो") ||
    lower.includes("গেম আৰম্ভ কৰক")
  ) {
    return {
      type: "NAVIGATE",
      targetView: "games",
      confirmationMessage: locale.startsWith("hi") ? "आपका मेमोरी गेम शुरू कर रहे हैं। ध्यान से खेलें।" : "Starting your recommended memory activity now.",
    };
  }

  if (
    lower.includes("call my family") ||
    lower.includes("call family") ||
    lower.includes("call sunita") ||
    lower.includes("call daughter") ||
    lower.includes("family ko phone") ||
    lower.includes("परिवार को फोन") ||
    lower.includes("পৰিয়ালক ফোন")
  ) {
    return {
      type: "NAVIGATE",
      targetView: "family",
      confirmationMessage: locale.startsWith("hi") ? "आपके परिवार और सुनीता जी से संपर्क कर रहे हैं।" : "Connecting you to your family circle now.",
    };
  }

  if (
    lower.includes("when is my appointment") ||
    lower.includes("appointment kab hai") ||
    lower.includes("doctor appointment kab hai") ||
    lower.includes("डॉक्टर अपॉइंटमेंट कब है") ||
    lower.includes("अपॉइंटमेंट कब है")
  ) {
    const nextApp = store.appointments[0];
    const appMsg = nextApp
      ? (locale.startsWith("hi")
          ? `आपका अपॉइंटमेंट ${nextApp.date} को ${nextApp.time} बजे ${nextApp.title} के साथ है।`
          : `Your next appointment is on ${nextApp.date} at ${nextApp.time} for ${nextApp.title}.`)
      : (locale.startsWith("hi") ? "आज कोई नया क्लिनिक अपॉइंटमेंट शेड्यूल नहीं है।" : "You have no clinic appointments scheduled today.");
    return {
      type: "ANSWER",
      message: appMsg,
    };
  }

  // 1.5. Conversational Multi-Turn Dialogue Engine (Contextual appointment/reminder consent, medicine help, activities, games)
  const multiTurn = conversationalAI.handleMultiTurnDialogue(text, store, locale, extractTime);
  if (multiTurn && multiTurn.handled) {
    if (multiTurn.action === "navigate_games") {
      return {
        type: "NAVIGATE",
        targetView: "games",
        confirmationMessage: multiTurn.responseText,
      };
    }
    if (multiTurn.action === "next_level") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mb_start_next_level"));
      }
      return {
        type: "NAVIGATE",
        targetView: "games",
        confirmationMessage: multiTurn.responseText,
      };
    }
    if (multiTurn.action === "navigate_reminders") {
      return {
        type: "NAVIGATE",
        targetView: "reminders",
        confirmationMessage: multiTurn.responseText,
      };
    }
    return {
      type: "ANSWER",
      message: multiTurn.responseText,
    };
  }

  // 1.8. Conversational Question & Personal Memory Recall (When is medicine? Where are glasses? Who is Sunita? My medicine is at 8 PM)
  const isQuestionOrMemory =
    lower.includes("when") ||
    lower.includes("where") ||
    lower.includes("who is") ||
    lower.includes("who are you") ||
    lower.includes("ક્યારે") ||
    lower.includes("ક્યાં") ||
    lower.includes("કોણ") ||
    lower.includes("તમે કોણ") ||
    lower.includes("कब") ||
    lower.includes("कहाँ") ||
    lower.includes("कौन") ||
    lower.includes("तुम कौन") ||
    lower.includes("কেতিয়া") ||
    lower.includes("ক’ত") ||
    lower.includes("কখন") ||
    lower.includes("কোথায়") ||
    lower.includes("my medicine is at") ||
    lower.includes("medicine is at 8") ||
    lower.includes("દવા 8 વાગ્યે") ||
    lower.includes("दवा 8 बजे") ||
    lower.includes("sunita") ||
    lower.includes("aarav") ||
    lower.includes("rajesh") ||
    lower.includes("सुनीता") ||
    lower.includes("સુનીતા");

  if (isQuestionOrMemory) {
    const conversationalReply = conversationalAI.generateConversationalReply(text, locale, store);
    if (
      conversationalReply.includes("દવા") ||
      conversationalReply.includes("दवा") ||
      conversationalReply.includes("medicine") ||
      conversationalReply.includes("ঔষধ") ||
      conversationalReply.includes("યાદો") ||
      conversationalReply.includes("यादों") ||
      conversationalReply.includes("Memory Bank") ||
      conversationalReply.includes("સુનિતા") ||
      conversationalReply.includes("सुनीता") ||
      conversationalReply.includes("Sunita") ||
      conversationalReply.includes("Aarav") ||
      conversationalReply.includes("Rajesh") ||
      conversationalReply.includes("Memory Bond")
    ) {
      return {
        type: "ANSWER",
        message: conversationalReply,
      };
    }
  }

  // 2. Navigation Intent
  if (
    lower.includes("go to") ||
    lower.includes("open") ||
    lower.includes("kholo") ||
    lower.includes("khol") ||
    lower.includes("chalo") ||
    lower.includes("dekho") ||
    lower.includes("খোলো") ||
    lower.includes("खोलो")
  ) {
    if (lower.includes("medicine") || lower.includes("dawa") || lower.includes("दवा") || lower.includes("ঔষধ")) {
      return { type: "NAVIGATE", targetView: "medicines", confirmationMessage: "Opening Medicine Manager." };
    }
    if (lower.includes("reminder") || lower.includes("alarm") || lower.includes("याद")) {
      return { type: "NAVIGATE", targetView: "reminders", confirmationMessage: "Opening Smart Reminders." };
    }
    if (lower.includes("culture") || lower.includes("assam") || lower.includes("heritage") || lower.includes("bihu") || lower.includes("সংস্কৃতি")) {
      return { type: "NAVIGATE", targetView: "cultural", confirmationMessage: "Opening North East Heritage Hub." };
    }
    if (lower.includes("social") || lower.includes("greeting") || lower.includes("photo") || lower.includes("family feed")) {
      return { type: "NAVIGATE", targetView: "social", confirmationMessage: "Opening Family Greetings Feed." };
    }
    if (lower.includes("game") || lower.includes("khel") || lower.includes("खेल") || lower.includes("খেল")) {
      return { type: "NAVIGATE", targetView: "games", confirmationMessage: "Opening Cognitive Games Hub." };
    }
    if (lower.includes("checkin") || lower.includes("check in") || lower.includes("assessment") || lower.includes("score")) {
      return { type: "NAVIGATE", targetView: "checkin", confirmationMessage: "Opening Cognitive Check-in." };
    }
    if (lower.includes("healthcare") || lower.includes("triage") || lower.includes("doctor dashboard") || lower.includes("clinical")) {
      return { type: "NAVIGATE", targetView: "healthcare", confirmationMessage: "Opening Healthcare Worker Dashboard." };
    }
    if (lower.includes("journal") || lower.includes("memory") || lower.includes("yaad") || lower.includes("डायरी")) {
      return { type: "NAVIGATE", targetView: "journal", confirmationMessage: "Opening Memory Journal." };
    }
    if (lower.includes("routine") || lower.includes("dinacharya") || lower.includes("दिनचर्या") || lower.includes("ৰুটিন")) {
      return { type: "NAVIGATE", targetView: "routine", confirmationMessage: "Opening Daily Routine." };
    }
    if (lower.includes("setting") || lower.includes("भाषा") || lower.includes("language")) {
      return { type: "NAVIGATE", targetView: "settings", confirmationMessage: "Opening Settings." };
    }
    if (lower.includes("caregiver") || lower.includes("family") || lower.includes("परिवार")) {
      return { type: "NAVIGATE", targetView: "family", confirmationMessage: "Opening Family Circle." };
    }
    if (lower.includes("home") || lower.includes("ghar") || lower.includes("घर")) {
      return { type: "NAVIGATE", targetView: "home", confirmationMessage: "Going to Home screen." };
    }
  }

  // 3. Medicine queries: "What is my next medicine?" / "अगली दवा कौन सी है?"
  if (
    (lower.includes("next") && (lower.includes("medicine") || lower.includes("dawa") || lower.includes("pill"))) ||
    lower.includes("अगली दवा") ||
    lower.includes("পরের ঔষধ") ||
    lower.includes("આગલી દવા") ||
    lower.includes("पुढील औषध")
  ) {
    const nextMed = store.medicines[0];
    if (!nextMed) {
      return { type: "QUERY_MEDICINE", message: pick(NO_MEDS_MSG, locale) };
    }
    const tMsg = pick(NEXT_MED_MSG, locale);
    return {
      type: "QUERY_MEDICINE",
      message: tMsg(nextMed.name, nextMed.dosage, nextMed.times[0] || "08:30"),
    };
  }

  // 4. Record taking medicine: "I took my medicine" / "दवा ले ली" / "ঔষধ খালোঁ"
  if (
    lower.includes("took my medicine") ||
    lower.includes("taken my medicine") ||
    lower.includes("took medicine") ||
    lower.includes("dawa le li") ||
    lower.includes("dawa kha li") ||
    lower.includes("दवा ले ली") ||
    lower.includes("दवा खा ली") ||
    lower.includes("ঔষধ খালোঁ") ||
    lower.includes("ঔষধ খেয়েছি") ||
    lower.includes("દવા લઈ લીધી") ||
    lower.includes("औषध घेतले")
  ) {
    const targetMed = store.medicines[0];
    const medName = targetMed ? targetMed.name : "scheduled medicine";
    const msgFn = pick(MED_CONFIRM, locale);
    return {
      type: "TAKE_MEDICINE",
      medicineId: targetMed?.id,
      medicineName: medName,
      confirmationMessage: msgFn(medName),
    };
  }

  // 5. Query next reminder: "What is my reminder?" / "रिमाइंडर क्या है?"
  if (
    lower.includes("reminder") &&
    (lower.includes("what") || lower.includes("next") || lower.includes("kya hai") || lower.includes("क्या है") || lower.includes("কি আছে"))
  ) {
    const nextRem = store.reminders.find((r) => r.active);
    if (!nextRem) {
      return { type: "QUERY_NEXT_REMINDER", message: pick(NO_REMINDER_MSG, locale) };
    }
    const fn = pick(NEXT_REMINDER_MSG, locale);
    return {
      type: "QUERY_NEXT_REMINDER",
      message: fn(nextRem.title, nextRem.time),
    };
  }

  // 6. Create Reminder: "Remind me to..." / "याद दिलाना" / "মনত পেলাবা"
  if (
    lower.includes("remind me") ||
    lower.includes("reminder") ||
    lower.includes("yaad dilana") ||
    lower.includes("yaad dilao") ||
    lower.includes("याद दिलाना") ||
    lower.includes("याद दिलाओ") ||
    lower.includes("याद दिला देना") ||
    lower.includes("याद दिला") ||
    lower.includes("मनত পেলাবা") ||
    lower.includes("মনে করিয়ে") ||
    lower.includes("યાદ દેવડાવજો") ||
    lower.includes("आठवण करा") ||
    lower.includes("நினைவூட்டு") ||
    lower.includes("గుర్తు చేయి")
  ) {
    const time = extractTime(text);
    
    // Extract date if tomorrow/future day is spoken
    let reminderDate: string | null = null;
    if (
      lower.includes("tomorrow") ||
      lower.includes("कल") ||
      lower.includes("কাল") ||
      lower.includes("কাইলৈ") ||
      lower.includes("કાલે") ||
      lower.includes("उद्या") ||
      lower.includes("நாளை") ||
      lower.includes("రేపు")
    ) {
      reminderDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    }

    // Categorize reminder
    let reminderType: Extract<VoiceIntent, { type: "CREATE_REMINDER" }>["reminderType"] = "custom";
    let extractedNotes = "";

    if (lower.includes("water") || lower.includes("hydration") || lower.includes("drink") || lower.includes("pani") || lower.includes("पानी") || lower.includes("जल") || lower.includes("પાણી")) {
      reminderType = "hydration";
    } else if (lower.includes("medicine") || lower.includes("dawa") || lower.includes("pill") || lower.includes("tablet") || lower.includes("दवा") || lower.includes("ঔষধ") || lower.includes("દવા")) {
      reminderType = "medicine";
    } else if (
      lower.includes("buy") ||
      lower.includes("purchase") ||
      lower.includes("shopping") ||
      lower.includes("market") ||
      lower.includes("vegetable") ||
      lower.includes("sabzi") ||
      lower.includes("rice") ||
      lower.includes("tea") ||
      lower.includes("grocery") ||
      lower.includes("kirana") ||
      lower.includes("bazaar") ||
      lower.includes("सब्जी") ||
      lower.includes("खरीद") ||
      lower.includes("দোকান") ||
      lower.includes("বজাৰ") ||
      lower.includes("বাজার")
    ) {
      reminderType = "shopping";
      const buyMatch = text.match(/(?:buy|purchase|खरीदने|लाने|কিনিবলৈ|কিনতে)\s+([a-zA-Z\u0900-\u09FF\s,]+)/i);
      if (buyMatch && buyMatch[1]) {
        extractedNotes = `Items: ${buyMatch[1].trim()}`;
      } else if (lower.includes("rice") || lower.includes("tea")) {
        extractedNotes = "Items: rice, tea";
      }
    } else if (lower.includes("call") || lower.includes("phone") || lower.includes("sunita") || lower.includes("बेटी") || lower.includes("daughter") || lower.includes("ఫోన్")) {
      reminderType = "family_call";
    } else if (lower.includes("walk") || lower.includes("walking") || lower.includes("stretch") || lower.includes("exercise") || lower.includes("टहलना")) {
      reminderType = "routine";
    }

    // Clean reminder title
    let cleanTitle = text
      .replace(/^(please\s+)?(remind me to|set a reminder for|reminder for|remind me)\s*/i, "")
      .replace(/कल सुबह|कल शाम|सुबह|शाम|बजे|याद दिलाना|याद दिलाओ/gi, "")
      .replace(/at\s+\d{1,2}(:\d{2})?\s*(am|pm)?/i, "")
      .replace(/tomorrow(\s+morning|\s+evening|\s+afternoon)?(\s+to)?/gi, "")
      .replace(/^(morning|evening|afternoon)\s+to\s+/i, "")
      .replace(/^to\s+/i, "")
      .trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      if (reminderType === "hydration") cleanTitle = "Drink warm water";
      else if (reminderType === "medicine") cleanTitle = "Take medicine";
      else if (reminderType === "shopping") cleanTitle = extractedNotes ? `Buy ${extractedNotes.replace("Items: ", "")}` : "Pick up fresh groceries";
      else cleanTitle = "Daily task";
    } else {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }

    const msgFn = pick(REM_CONFIRM, locale);
    return {
      type: "CREATE_REMINDER",
      title: cleanTitle,
      time,
      date: reminderDate,
      notes: extractedNotes || undefined,
      reminderType,
      confirmationMessage: msgFn(cleanTitle, time),
    };
  }

  // 7. Doctor Appointment: "Doctor appointment..." / "डॉक्टर की मुलाकात"
  if (
    lower.includes("doctor") ||
    lower.includes("appointment") ||
    lower.includes("clinic") ||
    lower.includes("hospital") ||
    lower.includes("डॉक्टर") ||
    lower.includes("अपॉइंटमेंट")
  ) {
    const time = extractTime(text);
    const isTomorrow =
      lower.includes("tomorrow") ||
      lower.includes("कल") ||
      lower.includes("কাল") ||
      lower.includes("কাইলৈ") ||
      lower.includes("કાલે") ||
      lower.includes("उद्या");
    const date = isTomorrow
      ? new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const msgFn = pick(APPT_CONFIRM, locale);
    return {
      type: "CREATE_APPOINTMENT",
      title: "Doctor Consultation",
      date,
      time,
      location: "City Health Clinic",
      confirmationMessage: msgFn("Doctor Consultation", time),
    };
  }

  // 8. Memory / Journal Sharing: "Today my daughter visited" / "आज मेरी बेटी आई थी"
  if (
    lower.includes("beti") ||
    lower.includes("daughter") ||
    lower.includes("grandson") ||
    lower.includes("family visited") ||
    lower.includes("bihu") ||
    lower.includes("bazaar") ||
    lower.includes("garden") ||
    lower.includes("flower") ||
    lower.includes("बेटी") ||
    lower.includes("পোতা") ||
    lower.includes("দিदी") ||
    lower.includes("याद")
  ) {
    const msgFn = pick(JOURNAL_CONFIRM, locale);
    return {
      type: "ADD_JOURNAL",
      title: "Cherished Moment",
      body: text,
      confirmationMessage: msgFn(text),
    };
  }

  // 9. Polite Greeting
  if (
    lower.includes("namaste") ||
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("kem cho") ||
    lower.includes("vanakkam") ||
    lower.includes("নমস্কাৰ") ||
    lower.includes("नमस्ते")
  ) {
    const greetings: Record<string, string> = {
      "hi-IN": "नमस्ते! आपसे बात करके बहुत अच्छा लगा। आज आपका दिन कैसा चल रहा है?",
      "as-IN": "নমস্কাৰ! আপোনাৰ লগত কথা পাতি বৰ ভাল লাগিল। আপুনি ভালে আছেনে?",
      "bn-IN": "নমস্কার! আপনার সাথে কথা বলে খুব ভালো লাগলো। আজকের দিনটি কেমন কাটছে?",
      "gu-IN": "નમસ્તે! તમારી સાથે વાત કરીને ખૂબ આનંદ થયો. આજે તમારો દિવસ કેવો રહ્યો?",
      "mr-IN": "नमस्कार! आपल्याशी संवाद साधून खूप आनंद झाला. आजचा दिवस कसा चालू आहे?",
      "ta-IN": "வணக்கம்! உங்களுடன் பேசுவதில் மிக்க மகிழ்ச்சி. இன்றைய நாள் எப்படி செல்கிறது?",
      "te-IN": "నమస్కారం! మీతో మాట్లాడటం చాలా సంతోషంగా ఉంది. ఈ రోజు ఎలా ఉంది?",
      "kn-IN": "ನಮಸ್ಕಾರ! ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಲು ತುಂಬಾ ಸಂತೋಷವಾಗಿದೆ. ನಿಮ್ಮ ದಿನ ಹೇಗಿದೆ?",
      "ml-IN": "നമസ്കാരം! നിങ്ങളോട് സംസാരിക്കുന്നതിൽ സന്തോഷം. ഇന്നത്തെ ദിവസം എങ്ങനെ പോകുന്നു?",
      "pa-IN": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੇ ਨਾਲ ਗੱਲ ਕਰਕੇ ਬਹੁਤ ਖੁਸ਼ੀ ਹੋਈ। ਤੁਹਾਡਾ ਦਿਨ ਕਿਵੇਂ ਚੱਲ ਰਿਹਾ ਹੈ?",
      "or-IN": "ନମସ୍କାର! ଆପଣଙ୍କ ସହ କଥା ହୋଇ ବହୁତ ଖୁସି ଲାଗିଲା। ଆଜିର ଦିନ କିପରି ଚାଲିଛି?",
      "en-IN": "Hello! It is so wonderful to talk with you today. How are you feeling right now?",
    };
    return {
      type: "CASUAL_CHAT",
      message: pick(greetings, locale),
    };
  }

  // Fallback: Natural Conversational AI with Session Empathy
  const conversationalReply = conversationalAI.generateConversationalReply(text, locale, store);
  return {
    type: "CASUAL_CHAT",
    message: conversationalReply,
  };
}

/**
 * Asynchronous Voice Intent Parser supporting multi-turn dialogue, direct commands,
 * and live web research for outside world knowledge
 */
export async function parseVoiceIntentAsync(
  rawText: string,
  store: MemoryBondStore,
  locale = "en-IN",
  pendingContext?: VoiceIntent | null
): Promise<VoiceIntent> {
  const text = rawText.trim();

  // 1. Context Retention Check: Did user confirm or reject previous pending action?
  if (pendingContext && !isSpokenAnswer(pendingContext)) {
    const lower = text.toLowerCase();
    if (isAffirmative(lower)) {
      return {
        type: "CONFIRM_ACTION",
        confirmationMessage: "Confirmed. Executing now.",
      };
    }
    if (isNegative(lower)) {
      return {
        type: "CANCEL_ACTION",
        confirmationMessage: pick(CANCELLED_MSG, locale),
      };
    }
  }

  // 2. Multi-turn conversational AI dialogue engine & direct actions
  // (Medicine help, stock inquiry, yesterday's activities, reminder creation, appointment, games, family memory)
  const multiTurn = conversationalAI.handleMultiTurnDialogue(text, store, locale, extractTime);
  if (multiTurn && multiTurn.handled) {
    if (multiTurn.action === "navigate_games") {
      return {
        type: "NAVIGATE",
        targetView: "games",
        confirmationMessage: multiTurn.responseText,
      };
    }
    if (multiTurn.action === "next_level") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mb_start_next_level"));
      }
      return {
        type: "NAVIGATE",
        targetView: "games",
        confirmationMessage: multiTurn.responseText,
      };
    }
    if (multiTurn.action === "navigate_reminders") {
      return {
        type: "NAVIGATE",
        targetView: "reminders",
        confirmationMessage: multiTurn.responseText,
      };
    }
    return {
      type: "ANSWER",
      message: multiTurn.responseText,
    };
  }

  // 3. Outside World Knowledge Check (Verified repository + Live Wikipedia/DuckDuckGo web research)
  if (isWorldKnowledgeQuery(text)) {
    const worldResult = await resolveWorldKnowledge(text, locale);
    if (worldResult && worldResult.answer) {
      return {
        type: "ANSWER",
        message: worldResult.answer,
      };
    }
  }

  return parseVoiceIntent(rawText, store, locale, pendingContext);
}

// ---------------------------------------------------------------------------
// Spoken Audio Engine with Elderly-Friendly Pace, Echo Guard & Barge-In
// ---------------------------------------------------------------------------
export function stopSpeaking() {
  voiceManager.stopSpeaking();
}

export function speakText(text: string, lang = "en-IN", onEnd?: () => void) {
  voiceManager.speak(text, lang, undefined, onEnd, () => {
    if (onEnd) onEnd();
  });
}

/**
 * Start browser speech recognition. Returns a stop function (or null if unsupported).
 */
export function startSpeechRecognition(
  lang = "en-IN",
  onResult?: (text: string) => void,
  onError?: (error: string) => void,
  onEnd?: () => void,
): (() => void) | null {
  if (typeof window === "undefined") return null;
  const SR =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    if (onError) onError("unsupported");
    if (onEnd) onEnd();
    return null;
  }

  try {
    const rec = new SR();
    rec.lang = lang || "en-IN";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => (r as any)[0]?.transcript || "")
        .join(" ")
        .trim();
      if (text && onResult) onResult(text);
    };
    rec.onerror = (e: any) => {
      if (onError) onError(e?.error || "speech-error");
    };
    rec.onend = () => {
      if (onEnd) onEnd();
    };

    rec.start();

    return () => {
      try {
        rec.stop();
      } catch {}
    };
  } catch (err) {
    if (onError) onError("start-failed");
    if (onEnd) onEnd();
    return null;
  }
}

export { cleanAIResponse };

