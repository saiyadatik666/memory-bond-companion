import type { MemoryBondStore } from "./memoryBondStore";
import { conversationalAI } from "./conversationalAI";
import { voiceManager } from "./voiceProvider";

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

// Language detection from Unicode script ranges
export function detectLanguage(text: string): string {
  const t = text.trim();
  if (/[\u0A80-\u0AFF]/.test(t)) return "gu-IN"; // Gujarati
  if (/[\u0900-\u097F]/.test(t)) return "hi-IN"; // Hindi / Marathi / Sanskrit
  if (/[\u0980-\u09FF]/.test(t)) {
    // Bengali or Assamese (Assamese distinctive characters: ৱ, ৰ)
    if (/[ৱৰ]/.test(t)) return "as-IN";
    return "bn-IN";
  }
  if (/[\u0B80-\u0BFF]/.test(t)) return "ta-IN"; // Tamil
  if (/[\u0C00-\u0C7F]/.test(t)) return "te-IN"; // Telugu
  if (/[\u0C80-\u0CFF]/.test(t)) return "kn-IN"; // Kannada
  if (/[\u0D00-\u0D7F]/.test(t)) return "ml-IN"; // Malayalam
  if (/[\u0A00-\u0A7F]/.test(t)) return "pa-IN"; // Punjabi
  if (/[\u0B00-\u0B7F]/.test(t)) return "or-IN"; // Odia
  return "en-IN";
}

/** Pick a localized value: exact locale, then fallback */
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

// Best voice picker for elderly accessibility
export function selectVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Exact match
  let v = voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
  if (v) return v;

  // Language prefix match (e.g. "hi", "bn", "ta")
  const prefix = lang.split("-")[0]?.toLowerCase() ?? "en";
  v = voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix));
  if (v) return v;

  // Regional Indian English fallback
  v = voices.find((voice) => voice.lang.toLowerCase() === "en-in");
  if (v) return v;

  return voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ?? voices[0] ?? null;
}

// Time extractor supporting Indian natural speech (Hindi, English, regional terms)
export function extractTime(text: string): string {
  const t = text.toLowerCase();
  
  // Format: 8:30 AM / 8.30 PM
  const m1 = t.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/);
  if (m1 && m1[1] && m1[2]) {
    let h = parseInt(m1[1], 10);
    const min = m1[2];
    const mer = m1[3];
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${min}`;
  }

  // Format: 8 AM / 8 PM / 8 baje / 8 বজাত
  const m2 = t.match(/(\d{1,2})\s*(am|pm|baje|बजे|বজাত|વાગ્યે|वाजता|மணிக்கு|గంటలకు|ಗಂಟೆಗೆ)/);
  if (m2 && m2[1]) {
    let h = parseInt(m2[1], 10);
    const word = m2[2];
    if (word === "pm" && h < 12) h += 12;
    if (word === "am" && h === 12) h = 0;
    // Contextual AM/PM check
    if ((t.includes("shaam") || t.includes("raat") || t.includes("evening") || t.includes("night") || t.includes("दुपार")) && h < 12) {
      h += 12;
    }
    return `${h.toString().padStart(2, "0")}:00`;
  }

  // Pure number like "8" when user mentions time
  const m3 = t.match(/\b(\d{1,2})\b/);
  if (m3 && m3[1]) {
    const num = parseInt(m3[1], 10);
    if (num >= 1 && num <= 12) {
      const isPm = t.includes("pm") || t.includes("shaam") || t.includes("raat") || t.includes("evening") || t.includes("night");
      const h = isPm && num < 12 ? num + 12 : num;
      return `${h.toString().padStart(2, "0")}:00`;
    }
  }

  // Natural colloquial terms
  if (t.includes("raat") || t.includes("night") || t.includes("tonight") || t.includes("राती")) return "20:30";
  if (t.includes("morning") || t.includes("subah") || t.includes("savare") || t.includes("पुৱা") || t.includes("সকাল")) return "08:30";
  if (t.includes("afternoon") || t.includes("dopahar") || t.includes("दुपारी") || t.includes("দুপুর")) return "13:00";
  if (t.includes("evening") || t.includes("shaam") || t.includes("saanj") || t.includes("সন্ধ্যা")) return "17:30";

  return "09:00";
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

const CANCELLED_MSG: Record<string, string> = {
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
    lower.includes("याद दिलाना") ||
    lower.includes("मनত পেলাবা") ||
    lower.includes("মনে করিয়ে") ||
    lower.includes("યાદ દેવડાવજો") ||
    lower.includes("आठवण करा") ||
    lower.includes("நினைவூட்டு") ||
    lower.includes("గుర్తు చేయి")
  ) {
    const time = extractTime(text);
    
    // Categorize reminder
    let reminderType: VoiceIntent extends { type: "CREATE_REMINDER"; reminderType: infer T } ? T : never = "custom";
    if (lower.includes("water") || lower.includes("pani") || lower.includes("पानी") || lower.includes("জল") || lower.includes("પાણી")) {
      reminderType = "hydration";
    } else if (lower.includes("medicine") || lower.includes("dawa") || lower.includes("दवा") || lower.includes("ঔষধ") || lower.includes("દવા")) {
      reminderType = "medicine";
    } else if (lower.includes("market") || lower.includes("vegetable") || lower.includes("sabzi") || lower.includes("shopping") || lower.includes("सब्जी") || lower.includes("શાકભાજી")) {
      reminderType = "shopping";
    } else if (lower.includes("call") || lower.includes("phone") || lower.includes("sunita") || lower.includes("बेटी") || lower.includes("ఫోన్")) {
      reminderType = "family_call";
    } else if (lower.includes("walk") || lower.includes("stretch") || lower.includes("exercise") || lower.includes("टहलना")) {
      reminderType = "routine";
    }

    // Clean reminder title
    let cleanTitle = text
      .replace(/^(please\s+)?(remind me to|set a reminder for|reminder for|remind me)\s*/i, "")
      .replace(/कल सुबह|कल शाम|सुबह|शाम|बजे|याद दिलाना|याद दिलाओ/gi, "")
      .replace(/at\s+\d{1,2}(:\d{2})?\s*(am|pm)?/i, "")
      .replace(/tomorrow/i, "")
      .trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      if (reminderType === "hydration") cleanTitle = "Drink warm water";
      else if (reminderType === "medicine") cleanTitle = "Take medicine";
      else if (reminderType === "shopping") cleanTitle = "Pick up fresh vegetables";
      else cleanTitle = "Daily task";
    }

    const msgFn = pick(REM_CONFIRM, locale);
    return {
      type: "CREATE_REMINDER",
      title: cleanTitle,
      time,
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
    const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const msgFn = pick(APPT_CONFIRM, locale);
    return {
      type: "CREATE_APPOINTMENT",
      title: "Doctor Consultation",
      date,
      time,
      location: "Clinic",
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
      "hi-IN": "नमस्ते! आपका दिन शुभ हो। मैं आपकी क्या मदद करूँ?",
      "as-IN": "নমস্কাৰ! আপোনাৰ দিনটো শান্তিময় হওক। মই কেনেকৈ সহায় কৰিব পাৰোঁ?",
      "bn-IN": "নমস্কার! আপনার দিনটি সুন্দর হোক। আমি কীভাবে সাহায্য করতে পারি?",
      "gu-IN": "નમસ્તે! તમારો દિવસ શુભ રહે. હું તમને કેવી રીતે મદદ કરી શકું?",
      "mr-IN": "नमस्कार! आपला दिवस आनंदी जावो. मी काय मदत करू?",
      "ta-IN": "வணக்கம்! உங்கள் நாள் இனிதாக அமையட்டும். நான் எப்படி உதவலாம்?",
      "te-IN": "నమస్కారం! మీ రోజు ప్రశాంతంగా ఉండాలి. నేను ఎలా సహాయపడగలను?",
      "kn-IN": "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ದಿನವು ಶುಭವಾಗಿರಲಿ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      "ml-IN": "നമസ്കാരം! നിങ്ങളുടെ ദിവസം ശുഭകരമാകട്ടെ. ഞാൻ എങ്ങനെ സഹായിക്കണം?",
      "pa-IN": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡਾ ਦਿਨ ਵਧੀਆ ਰਹੇ। ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
      "or-IN": "ନମସ୍କାର! ଆପଣଙ୍କ ଦିନ ଶୁଭଙ୍କର ହେଉ। ମୁଁ କିପରି ସାହାଯ୍ୟ କରିବି?",
      "en-IN": "Good day! Wishing you a peaceful day. How can I assist you today?",
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
        .map((r: any) => r[0]?.transcript || "")
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
