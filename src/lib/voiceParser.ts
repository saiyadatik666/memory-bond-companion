import type { MemoryBondStore } from "./memoryBondStore";

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
      reminderType:
        | "medicine"
        | "shopping"
        | "appointment"
        | "personal"
        | "family_call"
        | "routine"
        | "hydration"
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
  | { type: "UNKNOWN"; original: string; confirmationMessage: string };

/** Intents that are simply spoken back — no confirmation card needed. */
const SPOKEN_ANSWER_TYPES = [
  "QUERY_NEXT_REMINDER",
  "SPEAK_REMINDERS",
  "ANSWER",
  "QUERY_MEDICINE",
  "CASUAL_CHAT",
];

export function isSpokenAnswer(
  intent: VoiceIntent,
): intent is Extract<VoiceIntent, { message: string }> {
  return SPOKEN_ANSWER_TYPES.includes(intent.type);
}

/** The spoken text of any intent, whatever its shape. */
export function intentSpeech(intent: VoiceIntent): string {
  return isSpokenAnswer(intent) ? intent.message : intent.confirmationMessage;
}

// Language detection from Unicode script ranges
export function detectLanguage(text: string): string {
  const t = text.trim();
  if (/[\u0A80-\u0AFF]/.test(t)) return "gu-IN";
  if (/[\u0900-\u097F]/.test(t)) return "hi-IN";
  if (/[\u0980-\u09FF]/.test(t)) return "bn-IN";
  if (/[\u0B80-\u0BFF]/.test(t)) return "ta-IN";
  if (/[\u0C00-\u0C7F]/.test(t)) return "te-IN";
  if (/[\u0C80-\u0CFF]/.test(t)) return "kn-IN";
  if (/[\u0D00-\u0D7F]/.test(t)) return "ml-IN";
  if (/[\u0A00-\u0A7F]/.test(t)) return "pa-IN";
  if (/[\u0B00-\u0B7F]/.test(t)) return "or-IN";
  return "en-IN";
}

/** Pick a localized value: exact locale, then a same-script sibling, then English. */
function pick<T>(map: Record<string, T>, locale: string): T {
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

// Best-voice picker
export function selectVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  let v = voices.find((voice) => voice.lang === lang);
  if (v) return v;
  const prefix = lang.split("-")[0] ?? "en";
  v = voices.find((voice) => voice.lang.startsWith(prefix));
  if (v) return v;
  v = voices.find((voice) => voice.lang.startsWith("hi"));
  if (v) return v;
  return (
    voices.find((voice) => voice.lang === "en-IN") ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null
  );
}

// Time extractor
export function extractTime(text: string): string {
  const t = text.toLowerCase();
  const m1 = t.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/);
  if (m1 && m1[1] && m1[2]) {
    let h = parseInt(m1[1], 10);
    const min = m1[2];
    const mer = m1[3];
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${min}`;
  }
  const m2 = t.match(/(\d{1,2})\s*(am|pm)/);
  if (m2 && m2[1]) {
    let h = parseInt(m2[1], 10);
    const mer = m2[2];
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:00`;
  }
  if (t.includes("raat") || t.includes("night") || t.includes("tonight")) return "20:00";
  if (t.includes("morning") || t.includes("subah") || t.includes("savare")) return "08:30";
  if (t.includes("afternoon") || t.includes("dopahar")) return "13:00";
  if (t.includes("evening") || t.includes("shaam") || t.includes("saanj")) return "17:30";
  return "09:00";
}

// ---------------------------------------------------------------------------
// Localised message maps (English is always the final fallback)
// ---------------------------------------------------------------------------
const MED_CONFIRM: Record<string, (n: string) => string> = {
  "hi-IN": (n) => `क्या आप ${n} लेना दर्ज करना चाहते हैं?`,
  "gu-IN": (n) => `શું તમે ${n} લીધી એ નોંધ કરવા માંગો છો?`,
  "bn-IN": (n) => `আপনি কি ${n} খাওয়ার রেকর্ড করতে চান?`,
  "ta-IN": (n) => `${n} எடுத்தீர்களா என்பதை சேமிக்கட்டுமா?`,
  "te-IN": (n) => `${n} తీసుకున్నారని నమోదు చేయాలా?`,
  "kn-IN": (n) => `${n} ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ ಎಂದು ದಾಖಲಿಸಲಾ?`,
  "ml-IN": (n) => `${n} കഴിച്ചു എന്ന് രേഖപ്പെടുത്തണോ?`,
  "pa-IN": (n) => `ਕੀ ਤੁਸੀਂ ${n} ਲੈ ਲਈ — ਦਰਜ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
  "mr-IN": (n) => `${n} घेतली असे नोंदवू का?`,
  "as-IN": (n) => `আপুনি ${n} খাইছে বুলি লিখিম নেকি?`,
  "en-IN": (n) => `Record that you took ${n}?`,
};
const REM_CONFIRM: Record<string, (t: string, tm: string) => string> = {
  "hi-IN": (t, tm) => `क्या मैं "${t}" के लिए ${tm} बजे reminder सेट करूँ?`,
  "gu-IN": (t, tm) => `શું હું "${t}" માટે ${tm} વાગ્યે reminder સેટ કરું?`,
  "bn-IN": (t, tm) => `"${t}" এর জন্য ${tm} টায় রিমাইন্ডার সেট করব?`,
  "ta-IN": (t, tm) => `"${t}" க்கு ${tm} மணிக்கு நினைவூட்டல் அமைக்கட்டுமா?`,
  "te-IN": (t, tm) => `"${t}" కోసం ${tm}కి రిమైండర్ సెట్ చేయనా?`,
  "kn-IN": (t, tm) => `"${t}" ಗಾಗಿ ${tm}ಕ್ಕೆ ರಿಮೈಂಡರ್ ಹೊಂದಿಸಲಾ?`,
  "ml-IN": (t, tm) => `"${t}" ന് ${tm}ന് ഓർമ്മ ഇടണോ?`,
  "pa-IN": (t, tm) => `"${t}" ਲਈ ${tm} ਵਜੇ ਰਿਮਾਈਂਡਰ ਲਗਾਵਾਂ?`,
  "mr-IN": (t, tm) => `"${t}" साठी ${tm} वाजता आठवण ठेवू का?`,
  "as-IN": (t, tm) => `"${t}" ৰ বাবে ${tm} বজাত মনত পেলাব নেকি?`,
  "en-IN": (t, tm) => `Shall I set a reminder for "${t}" at ${tm}?`,
};
const APPT_CONFIRM: Record<string, (t: string, tm: string) => string> = {
  "hi-IN": (t, tm) => `"${t}" appointment ${tm} बजे save करूँ?`,
  "gu-IN": (t, tm) => `"${t}" appointment ${tm} વાગ્યે save કરું?`,
  "bn-IN": (t, tm) => `"${t}" অ্যাপয়েন্টমেন্ট ${tm} টায় সেভ করব?`,
  "ta-IN": (t, tm) => `"${t}" நியமனம் ${tm}க்கு சேமிக்கட்டுமா?`,
  "te-IN": (t, tm) => `"${t}" అపాయింట్‌మెంట్ ${tm}కి సేవ్ చేయనా?`,
  "kn-IN": (t, tm) => `"${t}" ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ${tm}ಕ್ಕೆ ಸೇವ್ ಮಾಡಲಾ?`,
  "ml-IN": (t, tm) => `"${t}" ${tm}ന് സേവ് ചെയ്യണോ?`,
  "pa-IN": (t, tm) => `"${t}" ਅਪੌਇੰਟਮੈਂਟ ${tm} ਵਜੇ ਸੇਵ ਕਰਾਂ?`,
  "mr-IN": (t, tm) => `"${t}" भेट ${tm} वाजता जतन करू का?`,
  "as-IN": (t, tm) => `"${t}" ${tm} বজাত সাঁচি থওঁ নেকি?`,
  "en-IN": (t, tm) => `Save appointment "${t}" at ${tm}?`,
};
const JOURNAL_CONFIRM: Record<string, (b: string) => string> = {
  "hi-IN": (b) => `क्या मैं यह याद journal में सेव करूँ: "${b}"?`,
  "gu-IN": (b) => `આ સ્મૃતિ journal માં સેવ કરું: "${b}"?`,
  "bn-IN": (b) => `এই স্মৃতিটি জার্নালে সেভ করব: "${b}"?`,
  "ta-IN": (b) => `இந்த நினைவை நாட்குறிப்பில் சேமிக்கட்டுமா: "${b}"?`,
  "te-IN": (b) => `ఈ జ్ఞాపకాన్ని డైరీలో సేవ్ చేయనా: "${b}"?`,
  "kn-IN": (b) => `ಈ ನೆನಪನ್ನು ದಿನಚರಿಯಲ್ಲಿ ಉಳಿಸಲಾ: "${b}"?`,
  "ml-IN": (b) => `ഈ ഓർമ്മ ഡയറിയിൽ സൂക്ഷിക്കണോ: "${b}"?`,
  "pa-IN": (b) => `ਇਹ ਯਾਦ ਡਾਇਰੀ ਵਿੱਚ ਸੇਵ ਕਰਾਂ: "${b}"?`,
  "mr-IN": (b) => `ही आठवण डायरीत जतन करू का: "${b}"?`,
  "as-IN": (b) => `এই স্মৃতি ডায়েৰীত সাঁচি থওঁ নেকি: "${b}"?`,
  "en-IN": (b) => `Shall I save this memory to your journal: "${b}"?`,
};
const JOURNAL_EMPTY: Record<string, string> = {
  "hi-IN": "बताइए क्या याद सेव करनी है — जैसे: नोट करो, आज पोते के साथ चाय पी।",
  "gu-IN": "કહો શું નોંધવું છે — જેમ કે: નોંધ કરો, આજે પૌત્ર સાથે ચા પીધી.",
  "bn-IN": "কী লিখব বলুন — যেমন: নোট করো, আজ নাতির সঙ্গে চা খেলাম।",
  "ta-IN": "என்ன எழுத வேண்டும் சொல்லுங்கள் — உதாரணம்: நோட் செய், இன்று பேரனுடன் தேநீர்.",
  "te-IN": "ఏం రాయాలో చెప్పండి — ఉదా: నోట్ చేయి, ఈరోజు మనవడితో టీ తాగాను.",
  "kn-IN": "ಏನು ಬರೆಯಬೇಕು ಹೇಳಿ — ಉದಾ: ನೋಟ್ ಮಾಡು, ಇಂದು ಮೊಮ್ಮಗನ ಜೊತೆ ಚಹಾ.",
  "ml-IN": "എന്ത് എഴുതണം എന്ന് പറയൂ — ഉദാ: നോട്ട് ചെയ്യൂ, ഇന്ന് കൊച്ചുമകനൊപ്പം ചായ.",
  "pa-IN": "ਦੱਸੋ ਕੀ ਲਿਖਣਾ ਹੈ — ਜਿਵੇਂ: ਨੋਟ ਕਰੋ, ਅੱਜ ਪੋਤੇ ਨਾਲ ਚਾਹ ਪੀਤੀ।",
  "mr-IN": "काय लिहू ते सांगा — जसे: नोंद कर, आज नातवासोबत चहा घेतला.",
  "as-IN": "কি লিখিম কওক — যেনে: টোকা লিখা, আজি নাতিৰ সৈতে চাহ খালোঁ।",
  "en-IN": "Tell me what to save — for example: note that I had tea with my grandson today.",
};
const NO_REMINDERS: Record<string, string> = {
  "hi-IN": "आज कोई reminder नहीं है।",
  "gu-IN": "આજે કોઈ reminder નથી.",
  "bn-IN": "আজ কোনো রিমাইন্ডার নেই।",
  "ta-IN": "இன்று நினைவூட்டல் இல்லை.",
  "te-IN": "ఈరోజు రిమైండర్లు లేవు.",
  "kn-IN": "ಇಂದು ಯಾವುದೇ ರಿಮೈಂಡರ್ ಇಲ್ಲ.",
  "ml-IN": "ഇന്ന് ഓർമ്മകൾ ഒന്നുമില്ല.",
  "pa-IN": "ਅੱਜ ਕੋਈ ਰਿਮਾਈਂਡਰ ਨਹੀਂ ਹੈ।",
  "mr-IN": "आज कोणतीही आठवण नाही.",
  "as-IN": "আজি কোনো ৰিমাইণ্ডাৰ নাই।",
  "en-IN": "You have no reminders today.",
};
const REMINDER_LIST_INTRO: Record<string, (n: number) => string> = {
  "hi-IN": (n) => `आपके ${n} reminder हैं।`,
  "gu-IN": (n) => `તમારા ${n} reminder છે.`,
  "bn-IN": (n) => `আপনার ${n} টি রিমাইন্ডার আছে।`,
  "ta-IN": (n) => `உங்களுக்கு ${n} நினைவூட்டல்கள் உள்ளன.`,
  "te-IN": (n) => `మీకు ${n} రిమైండర్లు ఉన్నాయి.`,
  "kn-IN": (n) => `ನಿಮಗೆ ${n} ರಿಮೈಂಡರ್‌ಗಳಿವೆ.`,
  "ml-IN": (n) => `നിങ്ങൾക്ക് ${n} ഓർമ്മകൾ ഉണ്ട്.`,
  "pa-IN": (n) => `ਤੁਹਾਡੇ ${n} ਰਿਮਾਈਂਡਰ ਹਨ।`,
  "mr-IN": (n) => `तुमच्या ${n} आठवणी आहेत.`,
  "as-IN": (n) => `আপোনাৰ ${n} টা ৰিমাইণ্ডাৰ আছে।`,
  "en-IN": (n) => `You have ${n} reminders.`,
};
const AT_WORD: Record<string, string> = {
  "hi-IN": "बजे",
  "gu-IN": "વાગ્યે",
  "bn-IN": "টায়",
  "ta-IN": "மணிக்கு",
  "te-IN": "గంటలకు",
  "kn-IN": "ಗಂಟೆಗೆ",
  "ml-IN": "മണിക്ക്",
  "pa-IN": "ਵਜੇ",
  "mr-IN": "वाजता",
  "as-IN": "বজাত",
  "en-IN": "at",
};
const TIME_NOW: Record<string, (t: string) => string> = {
  "hi-IN": (t) => `अभी ${t} बजे हैं।`,
  "gu-IN": (t) => `હાલ ${t} વાગ્યા છે.`,
  "bn-IN": (t) => `এখন ${t} টা।`,
  "ta-IN": (t) => `இப்போது ${t} மணி.`,
  "te-IN": (t) => `ఇప్పుడు ${t} గంటలు.`,
  "kn-IN": (t) => `ಈಗ ${t} ಗಂಟೆ.`,
  "ml-IN": (t) => `ഇപ്പോൾ സമയം ${t}.`,
  "pa-IN": (t) => `ਹੁਣ ${t} ਵਜੇ ਹਨ।`,
  "mr-IN": (t) => `आता ${t} वाजले आहेत.`,
  "as-IN": (t) => `এতিয়া ${t} বজাত।`,
  "en-IN": (t) => `It is ${t} right now.`,
};
const DATE_TODAY: Record<string, (d: string) => string> = {
  "hi-IN": (d) => `आज ${d} है।`,
  "gu-IN": (d) => `આજે ${d} છે.`,
  "bn-IN": (d) => `আজ ${d}।`,
  "ta-IN": (d) => `இன்று ${d}.`,
  "te-IN": (d) => `ఈరోజు ${d}.`,
  "kn-IN": (d) => `ಇಂದು ${d}.`,
  "ml-IN": (d) => `ഇന്ന് ${d}.`,
  "pa-IN": (d) => `ਅੱਜ ${d} ਹੈ।`,
  "mr-IN": (d) => `आज ${d} आहे.`,
  "as-IN": (d) => `আজি ${d}।`,
  "en-IN": (d) => `Today is ${d}.`,
};
const NEXT_APPT: Record<string, (t: string, d: string, tm: string) => string> = {
  "hi-IN": (t, d, tm) => `आपकी अगली appointment "${t}" ${d} को ${tm} बजे है।`,
  "gu-IN": (t, d, tm) => `તમારી આગલી appointment "${t}" ${d} ${tm} વાગ્યે.`,
  "bn-IN": (t, d, tm) => `পরের অ্যাপয়েন্টমেন্ট "${t}" ${d} তারিখে ${tm} টায়।`,
  "ta-IN": (t, d, tm) => `அடுத்த நியமனம் "${t}" ${d} அன்று ${tm} மணிக்கு.`,
  "te-IN": (t, d, tm) => `తదుపరి అపాయింట్‌మెంట్ "${t}" ${d} న ${tm} కి.`,
  "kn-IN": (t, d, tm) => `ಮುಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ "${t}" ${d} ರಂದು ${tm} ಕ್ಕೆ.`,
  "ml-IN": (t, d, tm) => `അടുത്ത അപ്പോയ്ന്റ്മെന്റ് "${t}" ${d} ന് ${tm} ന്.`,
  "pa-IN": (t, d, tm) => `ਅਗਲੀ ਅਪੌਇੰਟਮੈਂਟ "${t}" ${d} ਨੂੰ ${tm} ਵਜੇ ਹੈ।`,
  "mr-IN": (t, d, tm) => `पुढील भेट "${t}" ${d} रोजी ${tm} वाजता आहे.`,
  "as-IN": (t, d, tm) => `পৰৱৰ্তী সাক্ষাৎ "${t}" ${d} তাৰিখে ${tm} বজাত।`,
  "en-IN": (t, d, tm) => `Your next appointment is "${t}" on ${d} at ${tm}.`,
};
const NO_APPT: Record<string, string> = {
  "hi-IN": "कोई appointment नहीं है।",
  "gu-IN": "કોઈ appointment નથી.",
  "bn-IN": "কোনো অ্যাপয়েন্টমেন্ট নেই।",
  "ta-IN": "நியமனம் இல்லை.",
  "te-IN": "అపాయింట్‌మెంట్లు లేవు.",
  "kn-IN": "ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಇಲ್ಲ.",
  "ml-IN": "അപ്പോയ്ന്റ്മെന്റ് ഇല്ല.",
  "pa-IN": "ਕੋਈ ਅਪੌਇੰਟਮੈਂਟ ਨਹੀਂ ਹੈ।",
  "mr-IN": "कोणतीही भेट नाही.",
  "as-IN": "কোনো সাক্ষাৎ নাই।",
  "en-IN": "You have no upcoming appointments.",
};
const FAMILY_LIST: Record<string, (names: string) => string> = {
  "hi-IN": (n) => `आपके परिवार में ${n} हैं।`,
  "gu-IN": (n) => `તમારા પરિવારમાં ${n} છે.`,
  "bn-IN": (n) => `আপনার পরিবারে আছেন ${n}।`,
  "ta-IN": (n) => `உங்கள் குடும்பத்தில் ${n} உள்ளனர்.`,
  "te-IN": (n) => `మీ కుటుంబంలో ${n} ఉన్నారు.`,
  "kn-IN": (n) => `ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ${n} ಇದ್ದಾರೆ.`,
  "ml-IN": (n) => `നിങ്ങളുടെ കുടുംബത്തിൽ ${n} ഉണ്ട്.`,
  "pa-IN": (n) => `ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਵਿੱਚ ${n} ਹਨ।`,
  "mr-IN": (n) => `तुमच्या कुटुंबात ${n} आहेत.`,
  "as-IN": (n) => `আপোনাৰ পৰিয়ালত ${n} আছে।`,
  "en-IN": (n) => `Your family contacts are ${n}.`,
};
const NO_FAMILY: Record<string, string> = {
  "hi-IN": "अभी कोई family contact सेव नहीं है।",
  "en-IN": "No family contacts are saved yet.",
  "bn-IN": "এখনো কোনো পারিবারিক যোগাযোগ সেভ করা নেই।",
  "ta-IN": "குடும்ப தொடர்புகள் இல்லை.",
  "te-IN": "కుటుంబ కాంటాక్ట్లు లేవు.",
  "gu-IN": "કોઈ family contact સેવ નથી.",
};
const JOURNAL_SAVED: Record<string, string> = {
  "hi-IN": "आपकी याद journal में सेव हो गई।",
  "gu-IN": "તમારી સ્મૃતિ journal માં સેવ થઈ ગઈ.",
  "bn-IN": "স্মৃতিটি জার্নালে সেভ হয়েছে।",
  "ta-IN": "நினைவு நாட்குறிப்பில் சேமிக்கப்பட்டது.",
  "te-IN": "జ్ఞాపకం డైరీలో సేవ్ అయింది.",
  "kn-IN": "ನೆನಪು ದಿನಚರಿಯಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.",
  "ml-IN": "ഓർമ്മ ഡയറിയിൽ സൂക്ഷിച്ചു.",
  "pa-IN": "ਯਾਦ ਡਾਇਰੀ ਵਿੱਚ ਸੇਵ ਹੋ ਗਈ।",
  "mr-IN": "आठवण डायरीत जतन झाली.",
  "as-IN": "স্মৃতি ডায়েৰীত সাঁচি থোৱা হ'ল।",
  "en-IN": "Your memory has been saved to the journal.",
};
const UNK_RESPONSE: Record<string, string> = {
  "hi-IN": "मैं समझ नहीं पाया। क्या आप reminder, दवाई, appointment, या journal में कुछ लिखवाना चाहते हैं?",
  "gu-IN": "હું સમજ્યો નહિ. reminder, દવા, appointment કે journal માં નોંધ જોઈએ?",
  "bn-IN": "আমি বুঝতে পারিনি। রিমাইন্ডার, ওষুধ, অ্যাপয়েন্টমেন্ট বা জার্নালে নোট দরকার?",
  "ta-IN": "என்னால் புரியவில்லை. நினைவூட்டல், மருந்து, நியமனம் அல்லது நோட் வேண்டுமா?",
  "te-IN": "నాకు అర్థమవలేదు. రిమైండర్, మందు, అపాయింట్‌మెంట్ లేదా నోట్ కావాలా?",
  "kn-IN": "ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ರಿಮೈಂಡರ್, ಔಷಧ, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಅಥವಾ ನೋಟ್ ಬೇಕೇ?",
  "ml-IN": "എനിക്ക് മനസ്സിലായില്ല. ഓർമ്മ, മരുന്ന്, അപ്പോയ്ന്റ്മെന്റ് അല്ലെങ്കിൽ നോട്ട് വേണോ?",
  "pa-IN": "ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਰਿਮਾਈਂਡਰ, ਦਵਾਈ, ਅਪੌਇੰਟਮੈਂਟ ਜਾਂ ਨੋਟ ਚਾਹੀਦਾ ਹੈ?",
  "mr-IN": "मला समजले नाही. आठवण, औषध, भेट किंवा नोंद हवी आहे का?",
  "as-IN": "মই বুজি নাপালোঁ। ৰিমাইণ্ডাৰ, ঔষধ, সাক্ষাৎ বা টোকা লাগে নেকি?",
  "en-IN":
    "I didn't quite understand. Would you like a reminder, medicine help, an appointment, or a note in your journal?",
};

// Multilingual keyword banks -------------------------------------------------
const JOURNAL_KW = [
  "note that", "add a note", "make a note", "note down", "write down", "diary",
  "journal", "memory journal", "remember that", "save this memory", "note karo",
  "note likho", "diary me likho", "yaad likho", "yaad rakho", "नोट", "डायरी", "याद लिखो",
  "नोंद", "নোট", "ডায়েরি", "টোকা", "ડાયરી", "નોંધ", "நோட்", "நாட்குறிப்பு",
  "నోట్", "డైరీ", "ನೋಟ್", "ದಿನಚರಿ", "നോട്ട്", "ഡയറി", "ਨੋਟ", "ਡਾਇਰੀ",
];
const SPEAK_REM_KW = [
  "read my reminders", "read out my reminders", "tell me my reminders", "speak my reminders",
  "what are my reminders", "all my reminders", "today's reminders", "todays reminders",
  "sare reminder", "reminder batao", "reminder sunao", "reminder bolo",
  "reminder सुनाओ", "reminder बताओ", "রিমাইন্ডার বলুন", "reminder કહો",
  "நினைவூட்டல் சொல்", "రిమైండర్లు చెప్పు",
];
const TIME_KW = ["what time", "time now", "kitne baje", "samay kya", "समय", "কটা বাজে", "કેટલા વાગ્યા", "நேரம் என்ன", "సమయం ఎంత"];
const DATE_KW = ["what day", "what date", "today's date", "todays date", "aaj kaunsi tarikh", "aaj kya din", "आज कौन", "আজ কী", "આજે કઈ", "இன்று என்ன தேதி", "ఈరోజు తేదీ"];
const APPT_Q_KW = ["next appointment", "my appointment", "when is my appointment", "doctor kab", "appointment kab", "अपॉइंटमेंट कब", "অ্যাপয়েন্টমেন্ট কখন"];
const FAMILY_Q_KW = ["my family", "family contacts", "who is my family", "mera parivar", "parivar", "परिवार", "পরিবার", "પરિવાર", "குடும்பம்", "కుటుంబం"];

function stripJournalKeywords(text: string): string {
  let out = text;
  for (const kw of JOURNAL_KW) {
    out = out.replace(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
  }
  return out.replace(/^\s*(that|ki|ke|कि|যে)\s+/i, "").replace(/\s{2,}/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Main intent parser
// ---------------------------------------------------------------------------
export function parseVoiceIntent(
  rawText: string,
  store: MemoryBondStore,
  locale = "en-IN",
): VoiceIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const at = pick(AT_WORD, locale);

  // 1. Casual greetings / emotional chat
  const isGreeting =
    /^(hi|hello|hey|good morning|good evening|good afternoon|good night|namaste|namaskar)[\s!.,]*$/i.test(text) ||
    /namaste|namaskar|sat sri akal/i.test(text);
  const isWellbeing = /how are you|kaise ho|kaisa hai/i.test(text);
  const isEmotional = /i feel|i am (sad|happy|tired|lonely|anxious|worried|great|good|bad)/i.test(text);

  if (isGreeting || isWellbeing || isEmotional) {
    const responses: Record<string, string> = {
      "hi-IN": "नमस्ते! आज आप कैसे हैं? मैं आपकी कैसे मदद कर सकता हूँ?",
      "gu-IN": "નમસ્તે! આજે તમે કેવા છો? હું તમારી શી મદદ કરી શકું?",
      "bn-IN": "নমস্কার! আজ আপনি কেমন আছেন? কীভাবে সাহায্য করতে পারি?",
      "ta-IN": "வணக்கம்! இன்று நீங்கள் எப்படி? எப்படி உதவலாம்?",
      "te-IN": "నమస్కారం! ఈరోజు ఎలా ఉన్నారు? ఎలా సహాయం చేయగలను?",
      "kn-IN": "ನಮಸ್ಕಾರ! ಇಂದು ಹೇಗಿದ್ದೀರಾ? ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      "ml-IN": "നമസ്കാരം! ഇന്ന് എങ്ങനെ ഉണ്ട്? ഞാൻ എങ്ങനെ സഹായിക്കാം?",
      "pa-IN": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਕਿਵੇਂ ਹੋ? ਮੈਂ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
      "mr-IN": "नमस्कार! आज तुम्ही कसे आहात? मी कशी मदत करू?",
      "as-IN": "নমস্কাৰ! আজি আপুনি কেনে আছে? মই কেনেকৈ সহায় কৰিম?",
      "en-IN": "Hello! How are you feeling today? How can I help you?",
    };
    return { type: "CASUAL_CHAT", message: pick(responses, locale) };
  }

  // 2. Dictate a memory-journal note
  if (JOURNAL_KW.some((kw) => lower.includes(kw.toLowerCase()))) {
    const body = stripJournalKeywords(text);
    if (!body) {
      return { type: "ANSWER", message: pick(JOURNAL_EMPTY, locale) };
    }
    const words = body.split(/\s+/);
    const title = words.slice(0, 6).join(" ") + (words.length > 6 ? "…" : "");
    return {
      type: "ADD_JOURNAL",
      title,
      body,
      confirmationMessage: pick(JOURNAL_CONFIRM, locale)(body),
    };
  }

  // 3. Read out all reminders
  if (SPEAK_REM_KW.some((kw) => lower.includes(kw.toLowerCase()))) {
    const active = store.reminders.filter((r) => r.active);
    if (active.length === 0) {
      return { type: "SPEAK_REMINDERS", message: pick(NO_REMINDERS, locale) };
    }
    const intro = pick(REMINDER_LIST_INTRO, locale)(active.length);
    const list = active.map((r) => `${r.title} — ${at} ${r.time}`).join(". ");
    return { type: "SPEAK_REMINDERS", message: `${intro} ${list}.` };
  }

  // 4. Took medicine
  const tookKw = [
    "took my medicine", "took medicine", "taken medicine", "i took it",
    "dawa le li", "dawai le li", "dava lai lidhi", "dava khai lidhi",
  ];
  if (tookKw.some((kw) => lower.includes(kw))) {
    const nextMed = store.medicines[0];
    const confirmationMessage = pick(MED_CONFIRM, locale)(nextMed?.name || "your medicine");
    return nextMed
      ? { type: "TAKE_MEDICINE", medicineId: nextMed.id, medicineName: nextMed.name, confirmationMessage }
      : { type: "TAKE_MEDICINE", medicineName: "Scheduled Medicine", confirmationMessage };
  }

  // 5. Navigation
  if (lower.includes("show my medicines") || lower.includes("open medicines") || lower.includes("dawaiyan dikhao")) {
    return { type: "NAVIGATE", targetView: "medicines", confirmationMessage: "" };
  }
  if (lower.includes("show games") || lower.includes("play games") || lower.includes("memory games")) {
    return { type: "NAVIGATE", targetView: "games", confirmationMessage: "" };
  }
  if (lower.includes("show reminders") || lower.includes("my reminders")) {
    return { type: "NAVIGATE", targetView: "reminders", confirmationMessage: "" };
  }
  if (lower.includes("open journal") || lower.includes("show journal")) {
    return { type: "NAVIGATE", targetView: "journal", confirmationMessage: "" };
  }
  if (lower.includes("routine") || lower.includes("dinchrya")) {
    return { type: "NAVIGATE", targetView: "routine", confirmationMessage: "" };
  }

  // 6. Simple questions: time / date / appointments / family
  if (TIME_KW.some((kw) => lower.includes(kw.toLowerCase()))) {
    const now = new Date();
    const t = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { type: "ANSWER", message: pick(TIME_NOW, locale)(t) };
  }
  if (DATE_KW.some((kw) => lower.includes(kw.toLowerCase()))) {
    const d = new Date().toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return { type: "ANSWER", message: pick(DATE_TODAY, locale)(d) };
  }
  if (FAMILY_Q_KW.some((kw) => lower.includes(kw.toLowerCase()))) {
    const names = store.contacts
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .map((c) => `${c.name} (${c.relationship})`)
      .join(", ");
    return {
      type: "ANSWER",
      message: names ? pick(FAMILY_LIST, locale)(names) : pick(NO_FAMILY, locale),
    };
  }
  if (APPT_Q_KW.some((kw) => lower.includes(kw.toLowerCase()))) {
    const upcoming = store.appointments
      .slice()
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
    return {
      type: "ANSWER",
      message: upcoming
        ? pick(NEXT_APPT, locale)(upcoming.title, upcoming.date, upcoming.time)
        : pick(NO_APPT, locale),
    };
  }

  // 7. Medicine query
  const medQKw = ["my medicine", "what medicine", "which medicine", "when is my medicine",
    "meri dawai", "dawai kab", "meri dava", "dava kab"];
  if (medQKw.some((kw) => lower.includes(kw))) {
    const med = store.medicines[0];
    const medTime = med?.times[0] || "08:30";
    const responses: Record<string, string> = {
      "hi-IN": med ? `आपकी ${med.name} (${med.dosage}) ${medTime} बजे लेनी है।` : "कोई दवाई scheduled नहीं है।",
      "gu-IN": med ? `તમારી ${med.name} (${med.dosage}) ${medTime} વાગ્યે.` : "કોઈ દવા scheduled નથી.",
      "bn-IN": med ? `আপনার ${med.name} (${med.dosage}) ${medTime} টায়।` : "কোন ওষুধ নেই।",
      "ta-IN": med ? `${med.name} (${med.dosage}) ${medTime} மணிக்கு.` : "மருந்து இல்லை.",
      "te-IN": med ? `${med.name} (${med.dosage}) ${medTime} కి.` : "మందులు లేవు.",
      "mr-IN": med ? `तुमची ${med.name} (${med.dosage}) ${medTime} वाजता.` : "औषध नाही.",
      "as-IN": med ? `আপোনাৰ ${med.name} (${med.dosage}) ${medTime} বজাত।` : "ঔষধ নাই।",
      "en-IN": med ? `Your ${med.name} (${med.dosage}) is at ${medTime}.` : "No scheduled medicines.",
    };
    return { type: "QUERY_MEDICINE", message: pick(responses, locale) };
  }

  // 8. Query next reminder
  const nextRemKw = ["what is my next reminder", "what's my next reminder", "next reminder",
    "agli yaad", "next yaad", "next reminder kya hai"];
  if (nextRemKw.some((kw) => lower.includes(kw))) {
    const active = store.reminders.filter((r) => r.active)[0];
    if (!active) return { type: "QUERY_NEXT_REMINDER", message: pick(NO_REMINDERS, locale) };
    const responses: Record<string, string> = {
      "hi-IN": `आपका अगला reminder "${active.title}" ${active.time} बजे है।`,
      "gu-IN": `તમારો reminder "${active.title}" ${active.time} વાગ્યે.`,
      "bn-IN": `পরবর্তী রিমাইন্ডার "${active.title}" ${active.time} টায়।`,
      "ta-IN": `அடுத்த நினைவூட்டல் "${active.title}" ${active.time} மணிக்கு.`,
      "te-IN": `తదుపరి రిమైండర్ "${active.title}" ${active.time} కి.`,
      "mr-IN": `पुढील आठवण "${active.title}" ${active.time} वाजता.`,
      "as-IN": `পৰৱৰ্তী ৰিমাইণ্ডাৰ "${active.title}" ${active.time} বজাত।`,
      "en-IN": `Your next reminder is "${active.title}" at ${active.time}.`,
    };
    return { type: "QUERY_NEXT_REMINDER", message: pick(responses, locale) };
  }

  // 9. Appointments
  const apptKw = ["appointment", "doctor", "hospital", "clinic", "apointment", "dawakhana", "meet doctor"];
  if (apptKw.some((kw) => lower.includes(kw))) {
    const time = extractTime(lower);
    const cleanTitle =
      text.replace(/remind me|schedule|create|appointment|doctor|hospital/gi, "").trim() || "Doctor Appointment";
    const futureDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    return {
      type: "CREATE_APPOINTMENT",
      title: cleanTitle,
      date: futureDate,
      time,
      confirmationMessage: pick(APPT_CONFIRM, locale)(cleanTitle, time),
    };
  }

  // 10. Reminders
  const remKw = ["remind me", "reminder", "set reminder", "yaad dilana", "yaad karana", "mujhe yaad", "reminder chahiye",
    "reminder lagao", "reminder set karo", "reminder seto", "yaad apav"];
  if (remKw.some((kw) => lower.includes(kw))) {
    const time = extractTime(lower);
    let reminderType: "medicine" | "shopping" | "family_call" | "routine" | "hydration" | "custom" = "custom";
    if (lower.includes("medicine") || lower.includes("pill") || lower.includes("tablet") || lower.includes("dawa") || lower.includes("dava"))
      reminderType = "medicine";
    else if (lower.includes("buy") || lower.includes("shop") || lower.includes("vegetable") || lower.includes("bazar") || lower.includes("market"))
      reminderType = "shopping";
    else if (lower.includes("call") || lower.includes("phone") || lower.includes("son") || lower.includes("daughter"))
      reminderType = "family_call";
    else if (lower.includes("walk") || lower.includes("exercise") || lower.includes("water") || lower.includes("hydration"))
      reminderType = "routine";
    let title = text.replace(/^remind me to\s*/i, "").replace(/^remind me\s*/i, "")
      .replace(/at\s+\d+.*$/i, "").replace(/on\s+.*$/i, "").replace(/yaad dilana|yaad karana|reminder/gi, "").trim();
    if (!title) title = "General Reminder";
    return {
      type: "CREATE_REMINDER",
      title,
      time,
      reminderType,
      confirmationMessage: pick(REM_CONFIRM, locale)(title, time),
    };
  }

  // 11. Unknown — never echo user words
  return { type: "UNKNOWN", original: text, confirmationMessage: pick(UNK_RESPONSE, locale) };
}

export function journalSavedMessage(locale: string): string {
  return pick(JOURNAL_SAVED, locale);
}

// Text-to-speech with best-voice picker
export function speakText(text: string, lang = "en-IN", onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voice = selectVoice(lang);
    if (voice) utterance.voice = voice;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  };
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
  } else {
    doSpeak();
  }
}
