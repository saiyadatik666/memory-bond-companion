import type { MemoryBondStore } from "./memoryBondStore";

// ---------------------------------------------------------------------------
// Intent types
// ---------------------------------------------------------------------------
export type VoiceIntent =
  | { type: "TAKE_MEDICINE"; medicineId?: string; medicineName?: string; confirmationMessage: string }
  | { type: "CREATE_REMINDER"; title: string; time: string; reminderType: "medicine" | "shopping" | "appointment" | "personal" | "family_call" | "routine" | "hydration" | "meal" | "custom"; confirmationMessage: string }
  | { type: "CREATE_APPOINTMENT"; title: string; date: string; time: string; location?: string; confirmationMessage: string }
  | { type: "NAVIGATE"; targetView: string; confirmationMessage: string }
  | { type: "QUERY_NEXT_REMINDER"; message: string }
  | { type: "QUERY_MEDICINE"; message: string }
  | { type: "CASUAL_CHAT"; message: string }
  | { type: "UNKNOWN"; original: string; confirmationMessage: string };

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

// Best-voice picker
export function selectVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  let v = voices.find((v) => v.lang === lang);
  if (v) return v;
  const prefix = lang.split("-")[0];
  v = voices.find((v) => v.lang.startsWith(prefix));
  if (v) return v;
  v = voices.find((v) => v.lang.startsWith("hi"));
  if (v) return v;
  return voices.find((v) => v.lang === "en-IN") ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
}

// Time extractor
export function extractTime(text: string): string {
  const t = text.toLowerCase();
  const m1 = t.match(/(\d{1,2})[:.:](\d{2})\s*(am|pm)?/);
  if (m1) {
    let h = parseInt(m1[1], 10);
    const min = m1[2], mer = m1[3];
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${min}`;
  }
  const m2 = t.match(/(\d{1,2})\s*(am|pm)/);
  if (m2) {
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

// Localised confirmation maps
const MED_CONFIRM: Record<string, (n: string) => string> = {
  "hi-IN": (n) => `क्या आप ${n} लेना दर्ज करना चाहते हैं?`,
  "gu-IN": (n) => `શું તમે ${n} લીધી એ નોંધ કરવા માંગો છો?`,
  "bn-IN": (n) => `আপনি কি ${n} খাওয়ার রেকর্ড করতে চান?`,
  "ta-IN": (n) => `${n} எடுத்தீர்களா என்பதை சேமிக்கட்டுமா?`,
  "te-IN": (n) => `${n} తీసుకున్నారని నమోదు చేయాలా?`,
  "kn-IN": (n) => `${n} ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ ಎಂದು ದಾಖಲಿಸಲಾ?`,
  "ml-IN": (n) => `${n} കഴിച്ചു എന്ന് രേഖപ്പെടുത്തണോ?`,
  "pa-IN": (n) => `ਕੀ ਤੁਸੀਂ ${n} ਲੈ ਲਈ — ਦਰਜ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
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
  "en-IN": (t, tm) => `Shall I set a reminder for "${t}" at ${tm}?`,
};
const APPT_CONFIRM: Record<string, (t: string, tm: string) => string> = {
  "hi-IN": (t, tm) => `"${t}" appointment ${tm} बजे save करूँ?`,
  "gu-IN": (t, tm) => `"${t}" appointment ${tm} વાગ્યે save કરું?`,
  "bn-IN": (t, tm) => `"${t}" অ্যাপয়েন্টমেন্ট ${tm} টায় সেভ করব?`,
  "ta-IN": (t, tm) => `"${t}" நியமனம் ${tm}க்கு சேமிக்கட்டுமா?`,
  "te-IN": (t, tm) => `"${t}" అపాయింట్‌మెంట్ ${tm}కి సేవ్ చేయనా?`,
  "kn-IN": (t, tm) => `"${t}" ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ${tm}ಕ್ಕೆ ಸೇವ್ ಮಾಡಲಾ?`,
  "ml-IN": (t, tm) => `"${t}" ${tm}ന് സേവ് ചേർക്കണോ?`,
  "pa-IN": (t, tm) => `"${t}" ਅਪੌਇੰਟਮੈਂਟ ${tm} ਵਜੇ ਸੇਵ ਕਰਾਂ?`,
  "en-IN": (t, tm) => `Save appointment "${t}" at ${tm}?`,
};
const UNK_RESPONSE: Record<string, string> = {
  "hi-IN": "मैं समझ नहीं पाया। क्या आप reminder, दवाई, appointment, या कुछ और जानना चाहते हैं?",
  "gu-IN": "હું સમજ્યો નહિ. શું તમે reminder, દવા, appointment, અથવા બીજું કંઈ જાણવા માંગો છો?",
  "bn-IN": "আমি বুঝতে পারিনি। রিমাইন্ডার, ওষুধ, অ্যাপয়েন্টমেন্ট বা অন্য কিছু দরকার?",
  "ta-IN": "என்னால் புரியவில்லை. நினைவூட்டல், மருந்து, நியமனம் வேண்டுமா?",
  "te-IN": "నాకు అర్థమవలేదు. రిమైండర్, మందు లేదా అపాయింట్‌మెంట్ కావాలా?",
  "kn-IN": "ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ರಿಮೈಂಡರ್, ಔಷಧ ಅಥವಾ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬೇಕೇ?",
  "ml-IN": "എനിക്ക് മനസ്സിലായില്ല. ഓർമ്മ, മരുന്ന്, അല്ലെങ്കിൽ അപ്പോയ്ന്റ്മെന്റ് വേണോ?",
  "pa-IN": "ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਰਿਮਾਈਂਡਰ, ਦਵਾਈ, ਜਾਂ ਅਪੌਇੰਟਮੈਂਟ ਚਾਹੀਦੀ ਹੈ?",
  "en-IN": "I didn't quite understand. Would you like help with a reminder, medicine, appointment, or something else?",
};

// Main intent parser
export function parseVoiceIntent(rawText: string, store: MemoryBondStore, locale = "en-IN"): VoiceIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();

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
      "en-IN": "Hello! How are you feeling today? How can I help you?",
    };
    return { type: "CASUAL_CHAT", message: responses[locale] ?? responses["en-IN"] };
  }

  // 2. Took medicine
  const tookKw = [
    "took my medicine", "took medicine", "taken medicine", "i took it",
    "dawa le li", "dawai le li", "dava lai lidhi", "dava khai lidhi",
  ];
  if (tookKw.some((kw) => lower.includes(kw))) {
    const nextMed = store.medicines[0];
    const fn = MED_CONFIRM[locale] ?? MED_CONFIRM["en-IN"];
    return {
      type: "TAKE_MEDICINE",
      medicineId: nextMed?.id,
      medicineName: nextMed?.name || "Scheduled Medicine",
      confirmationMessage: fn(nextMed?.name || "your medicine"),
    };
  }

  // 3. Navigation
  if (lower.includes("show my medicines") || lower.includes("open medicines") || lower.includes("dawaiyan dikhao")) {
    return { type: "NAVIGATE", targetView: "medicines", confirmationMessage: "" };
  }
  if (lower.includes("show games") || lower.includes("play games") || lower.includes("memory games")) {
    return { type: "NAVIGATE", targetView: "games", confirmationMessage: "" };
  }
  if (lower.includes("show reminders") || lower.includes("my reminders")) {
    return { type: "NAVIGATE", targetView: "reminders", confirmationMessage: "" };
  }
  if (lower.includes("routine") || lower.includes("dinchrya")) {
    return { type: "NAVIGATE", targetView: "routine", confirmationMessage: "" };
  }

  // 4. Medicine query
  const medQKw = ["my medicine", "what medicine", "which medicine", "when is my medicine",
    "meri dawai", "dawai kab", "meri dava", "dava kab"];
  if (medQKw.some((kw) => lower.includes(kw))) {
    const med = store.medicines[0];
    const responses: Record<string, string> = {
      "hi-IN": med ? `आपकी ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} बजे लेनी है।` : "कोई दवाई scheduled नहीं है।",
      "gu-IN": med ? `તમારી ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} વાગ્યે.` : "કોઈ દવા scheduled નથી.",
      "bn-IN": med ? `আপনার ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} টায়।` : "কোন ওষুধ নেই।",
      "en-IN": med ? `Your ${med.name} (${med.dosage}) is at ${med.times[0] || "08:30"}.` : "No scheduled medicines.",
    };
    return { type: "QUERY_MEDICINE", message: responses[locale] ?? responses["en-IN"] };
  }

  // 5. Query next reminder
  const nextRemKw = ["what is my next reminder", "what's my next reminder", "next reminder",
    "agli yaad", "next yaad", "next reminder kya hai"];
  if (nextRemKw.some((kw) => lower.includes(kw))) {
    const active = store.reminders.filter((r) => r.active)[0];
    const responses: Record<string, (r: typeof active) => string> = {
      "hi-IN": (r) => r ? `आपका अगला reminder "${r.title}" ${r.time} बजे है।` : "आज कोई pending reminder नहीं है।",
      "gu-IN": (r) => r ? `તમારો reminder "${r.title}" ${r.time} વાગ્યે.` : "કોઈ reminder નથી.",
      "bn-IN": (r) => r ? `পরবর্তী রিমাইন্ডার "${r.title}" ${r.time} টায়।` : "রিমাইন্ডার নেই।",
      "en-IN": (r) => r ? `Your next reminder is "${r.title}" at ${r.time}.` : "No pending reminders for today.",
    };
    const fn = responses[locale] ?? responses["en-IN"];
    return { type: "QUERY_NEXT_REMINDER", message: fn(active) };
  }

  // 6. Appointments
  const apptKw = ["appointment", "doctor", "hospital", "clinic", "apointment", "dawakhana", "meet doctor"];
  if (apptKw.some((kw) => lower.includes(kw))) {
    const time = extractTime(lower);
    const cleanTitle = text.replace(/remind me|schedule|create|appointment|doctor|hospital/gi, "").trim() || "Doctor Appointment";
    const futureDate = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];
    const fn = APPT_CONFIRM[locale] ?? APPT_CONFIRM["en-IN"];
    return { type: "CREATE_APPOINTMENT", title: cleanTitle, date: futureDate, time, confirmationMessage: fn(cleanTitle, time) };
  }

  // 7. Reminders
  const remKw = ["remind me", "reminder", "set reminder", "yaad dilana", "yaad karana", "mujhe yaad", "reminder chahiye",
    "reminder lagao", "reminder set karo", "reminder seto", "yaad apav"];
  if (remKw.some((kw) => lower.includes(kw))) {
    const time = extractTime(lower);
    let reminderType: "medicine" | "shopping" | "family_call" | "routine" | "hydration" | "custom" = "custom";
    if (lower.includes("medicine") || lower.includes("pill") || lower.includes("tablet") || lower.includes("dawa") || lower.includes("dava"))
      reminderType = "medicine";
    else if (lower.includes("buy") || lower.includes("shop") || lower.includes("vegetable") || lower.includes("bazar") || lower.includes("market"))
      reminderType = "shopping";
    else if (lower.includes("call") || lower.includes("phone") || lower.includes("son") || lower.includes("daughter") || lower.includes("phone"))
      reminderType = "family_call";
    else if (lower.includes("walk") || lower.includes("exercise") || lower.includes("water") || lower.includes("hydration"))
      reminderType = "routine";
    let title = text.replace(/^remind me to\s*/i, "").replace(/^remind me\s*/i, "")
      .replace(/at\s+\d+.*$/i, "").replace(/on\s+.*$/i, "").replace(/yaad dilana|yaad karana|reminder/gi, "").trim();
    if (!title) title = "General Reminder";
    const fn = REM_CONFIRM[locale] ?? REM_CONFIRM["en-IN"];
    return { type: "CREATE_REMINDER", title, time, reminderType, confirmationMessage: fn(title, time) };
  }

  // 8. Unknown — never echo user words
  return { type: "UNKNOWN", original: text, confirmationMessage: UNK_RESPONSE[locale] ?? UNK_RESPONSE["en-IN"] };
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
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; doSpeak(); };
  } else {
    doSpeak();
  }
}
