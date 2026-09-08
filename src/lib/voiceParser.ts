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
  | {
      type: "NAVIGATE";
      targetView: string;
      confirmationMessage: string;
    }
  | {
      type: "QUERY_NEXT_REMINDER";
      message: string;
    }
  | {
      type: "QUERY_MEDICINE";
      message: string;
    }
  | {
      type: "CASUAL_CHAT";
      message: string;
    }
  | {
      type: "UNKNOWN";
      original: string;
      confirmationMessage: string;
    };

// ---------------------------------------------------------------------------
// Language detection from Unicode script ranges
// ---------------------------------------------------------------------------
export function detectLanguage(text: string): string {
  const t = text.trim();
  if (/[\u0A80-\u0AFF]/.test(t)) return "gu-IN"; // Gujarati
  if (/[\u0900-\u097F]/.test(t)) return "hi-IN"; // Devanagari (Hindi/Marathi/Nepali)
  if (/[\u0980-\u09FF]/.test(t)) return "bn-IN"; // Bengali / Assamese
  if (/[\u0B80-\u0BFF]/.test(t)) return "ta-IN"; // Tamil
  if (/[\u0C00-\u0C7F]/.test(t)) return "te-IN"; // Telugu
  if (/[\u0C80-\u0CFF]/.test(t)) return "kn-IN"; // Kannada
  if (/[\u0D00-\u0D7F]/.test(t)) return "ml-IN"; // Malayalam
  if (/[\u0A00-\u0A7F]/.test(t)) return "pa-IN"; // Punjabi (Gurmukhi)
  if (/[\u0B00-\u0B7F]/.test(t)) return "or-IN"; // Odia
  return "en-IN";
}

// ---------------------------------------------------------------------------
// Best-voice picker — finds closest available SpeechSynthesisVoice
// ---------------------------------------------------------------------------
export function selectVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // 1. Exact BCP-47 match
  let v = voices.find((v) => v.lang === lang);
  if (v) return v;

  // 2. Language-prefix match
  const prefix = lang.split("-")[0];
  v = voices.find((v) => v.lang.startsWith(prefix));
  if (v) return v;

  // 3. Hindi as next-best Indian fallback
  v = voices.find((v) => v.lang.startsWith("hi"));
  if (v) return v;

  // 4. Any English-India, then any English
  return (
    voices.find((v) => v.lang === "en-IN") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

// ---------------------------------------------------------------------------
// Time extractor — supports numeric and keyword forms in multiple languages
// ---------------------------------------------------------------------------
export function extractTime(text: string): string {
  const t = text.toLowerCase();

  const matchWithMinutes = t.match(/(\d{1,2})[:.:](\d{2})\s*(am|pm)?/);
  if (matchWithMinutes) {
    let hours = parseInt(matchWithMinutes[1] ?? "0", 10);
    const minutes = matchWithMinutes[2] ?? "00";
    const meridiem = matchWithMinutes[3];
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  const matchHourOnly = t.match(/(\d{1,2})\s*(am|pm)/);
  if (matchHourOnly) {
    let hours = parseInt(matchHourOnly[1] ?? "0", 10);
    const meridiem = matchHourOnly[2];
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:00`;
  }

  if (t.includes("रात") || t.includes("tonight") || t.includes("night") || t.includes("রাতে"))
    return "20:00";
  if (
    t.includes("सुबह") || t.includes("morning") || t.includes("ৰাতিপুৱা") ||
    t.includes("સવારે") || t.includes("காலை") || t.includes("ఉదయం")
  )
    return "08:30";
  if (t.includes("दोपहर") || t.includes("afternoon") || t.includes("மதியம்"))
    return "13:00";
  if (
    t.includes("शाम") || t.includes("evening") || t.includes("সন্ধিয়া") ||
    t.includes("સાંજ") || t.includes("மாலை") || t.includes("సాయంత్రం")
  )
    return "17:30";

  return "09:00";
}

// ---------------------------------------------------------------------------
// Localised confirmation strings
// ---------------------------------------------------------------------------
const MEDICINE_CONFIRM: Record<string, (name: string) => string> = {
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

const REMINDER_CONFIRM: Record<string, (title: string, time: string) => string> = {
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

const APPOINTMENT_CONFIRM: Record<string, (title: string, time: string) => string> = {
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

const UNKNOWN_RESPONSE: Record<string, string> = {
  "hi-IN": "मैं समझ नहीं पाया। क्या आप reminder, दवाई, appointment, या कुछ और जानना चाहते हैं?",
  "gu-IN": "હું સમજ્યો નહિ. શું તમે reminder, દવા, appointment, અથવા બીજું કંઈ જાણવા માંગો છો?",
  "bn-IN": "আমি বুঝতে পারিনি। রিমাইন্ডার, ওষুধ, অ্যাপয়েন্টমেন্ট বা অন্য কিছু দরকার?",
  "ta-IN": "என்னால் புரியவில்லை. நினைவூட்டல், மருந்து, நியமனம் வேண்டுமா?",
  "te-IN": "నాకు అర్థమవలేదు. రిమైండర్, మందు లేదా అపాయింట్‌మెంట్ కావాలా?",
  "kn-IN": "ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ರಿಮೈಂಡರ್, ಔಷಧ ಅಥವಾ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬೇಕೇ?",
  "ml-IN": "എനിക്ക് മനസ്സിലായില്ല. ഓർമ്മ, മരുന്ന്, അല്ലെങ്കിൽ അപ്പോയ്ന്റ്മെന്റ് വേണോ?",
  "pa-IN": "ਮੈਨੂੰ ਸਮਝ ਨਹੀਂ ਆਇਆ। ਰਿਮਾਈਂਡਰ, ਦਵਾਈ, ਜਾਂ ਅਪੌਇੰਟਮੈਂਟ ਚਾਹੀਦੀ ਹੈ?",
  "en-IN":
    "I didn't quite understand. Would you like help with a reminder, medicine, appointment, or something else?",
};

// ---------------------------------------------------------------------------
// Main intent parser
// ---------------------------------------------------------------------------
export function parseVoiceIntent(
  rawText: string,
  store: MemoryBondStore,
  locale = "en-IN"
): VoiceIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // ── 1. Casual greetings / emotional chat ──────────────────────────────────
  const isGreeting =
    /^(hi|hello|hey|good morning|good evening|good afternoon|good night|namaste|namaskar)[\s!.,]*$/i.test(
      text
    ) ||
    /नमस्ते|नमस्कार|प्रणाम|शुभ प्रभात|नमस्कारम्/.test(text) ||
    /નમસ્તે|નમસ્કાર|સુપ્રભાત/.test(text) ||
    /নমস্কার|নমস্তে|সুপ্রভাত/.test(text) ||
    /வணக்கம்|காலை வணக்கம்/.test(text) ||
    /నమస్కారం|శుభోదయం/.test(text) ||
    /ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ|ਨਮਸਤੇ/.test(text);

  const isWellbeing =
    /how are you|आप कैसे हैं|आप ठीक|कैसे हो|ઠीक छो|তুমি কেমন/i.test(text);

  const isEmotional =
    /i feel|i am (sad|happy|tired|lonely|anxious|worried|great|good|bad)|मेरा दिन|आज अच्छा|मुझे अच्छा|बहुत अच्छा रहा/i.test(
      text
    );

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

  // ── 2. Took medicine ──────────────────────────────────────────────────────
  const tookKeywords = [
    "took my medicine", "took medicine", "taken medicine", "i took it",
    "दवा ले ली", "दवाई ले ली", "दवा खा ली", "दवाई खा ली",
    "ঔষধ খাইছো", "ওষুধ খেয়েছি",
    "દવા લઈ લીધી", "દવા ખાઈ લીધી",
    "மருந்து சாப்பிட்டேன்",
    "మందు తీసుకున్నాను",
    "ಔಷಧ ತೆಗೆದುಕೊಂಡೆ",
    "മരുന്ന് കഴിച്ചു",
    "ਦਵਾਈ ਲੈ ਲਈ",
  ];
  if (tookKeywords.some((kw) => lower.includes(kw.toLowerCase()))) {
    const nextMed = store.medicines[0];
    const fn = MEDICINE_CONFIRM[locale] ?? MEDICINE_CONFIRM["en-IN"];
    return {
      type: "TAKE_MEDICINE",
      medicineId: nextMed?.id,
      medicineName: nextMed?.name || "Scheduled Medicine",
      confirmationMessage: fn(nextMed?.name || "your medicine"),
    };
  }

  // ── 3. Navigation ─────────────────────────────────────────────────────────
  if (
    lower.includes("show my medicines") || lower.includes("open medicines") ||
    lower.includes("दवाइयाँ दिखाओ") || lower.includes("दवाई दिखाओ") ||
    lower.includes("દવા બતાવો") || lower.includes("ওষুধ দেখান")
  ) {
    return { type: "NAVIGATE", targetView: "medicines", confirmationMessage: "" };
  }
  if (
    lower.includes("show games") || lower.includes("play games") ||
    lower.includes("memory games") || lower.includes("गेम") || lower.includes("खेल")
  ) {
    return { type: "NAVIGATE", targetView: "games", confirmationMessage: "" };
  }
  if (
    lower.includes("show reminders") || lower.includes("my reminders") ||
    lower.includes("reminder दिखाओ") || lower.includes("याद दिखाओ")
  ) {
    return { type: "NAVIGATE", targetView: "reminders", confirmationMessage: "" };
  }
  if (lower.includes("routine") || lower.includes("दिनचर्या")) {
    return { type: "NAVIGATE", targetView: "routine", confirmationMessage: "" };
  }

  // ── 4. Medicine query ─────────────────────────────────────────────────────
  const medQueryKw = [
    "my medicine", "what medicine", "which medicine", "when is my medicine",
    "मेरी दवाई", "दवाई कब", "दवाई कितने बजे", "कौन सी दवाई",
    "मेरी दवा", "दवा कब",
    "મારી દવા", "ક્યારે દવા",
    "আমার ওষুধ", "ওষুধ কখন",
    "ਮੇਰੀ ਦਵਾਈ",
  ];
  if (medQueryKw.some((kw) => lower.includes(kw.toLowerCase()))) {
    const med = store.medicines[0];
    const responses: Record<string, string> = {
      "hi-IN": med
        ? `आपकी ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} बजे लेनी है।`
        : "आपकी कोई दवाई scheduled नहीं है।",
      "gu-IN": med
        ? `તમારી ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} વાગ્યે લેવાની છે.`
        : "તમારી કોઈ દવા scheduled નથી.",
      "bn-IN": med
        ? `আপনার ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} টায় নিতে হবে।`
        : "কোন ওষুধ নির্ধারিত নেই।",
      "ta-IN": med
        ? `உங்கள் ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} மணிக்கு.`
        : "மருந்து எதுவும் இல்லை.",
      "te-IN": med
        ? `మీ ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} గంటలకు.`
        : "ఏ మందూ లేదు.",
      "kn-IN": med
        ? `ನಿಮ್ಮ ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} ಕ್ಕೆ.`
        : "ಯಾವ ಔಷಧವೂ ಇಲ್ಲ.",
      "ml-IN": med
        ? `നിങ്ങളുടെ ${med.name} (${med.dosage}) ${med.times[0] || "08:30"}ന്.`
        : "ഒരു മരുന്നും ഇല്ല.",
      "pa-IN": med
        ? `ਤੁਹਾਡੀ ${med.name} (${med.dosage}) ${med.times[0] || "08:30"} ਵਜੇ ਲੈਣੀ ਹੈ।`
        : "ਕੋਈ ਦਵਾਈ scheduled ਨਹੀਂ।",
      "en-IN": med
        ? `Your ${med.name} (${med.dosage}) is scheduled at ${med.times[0] || "08:30"}.`
        : "You have no scheduled medicines.",
    };
    return { type: "QUERY_MEDICINE", message: responses[locale] ?? responses["en-IN"] };
  }

  // ── 5. Query next reminder ────────────────────────────────────────────────
  const nextReminderKw = [
    "what is my next reminder", "what's my next reminder", "next reminder",
    "अगली याद", "next याद", "कौन सी याद",
    "পরবর্তী রিমাইন্ডার", "আগামী রিমাইন্ডার",
    "ਅਗਲੀ ਰੀਮਾਈਂਡਰ",
    "அடுத்த நினைவூட்டல்", "తదుపరి రిమైండర్",
  ];
  if (nextReminderKw.some((kw) => lower.includes(kw.toLowerCase()))) {
    const active = store.reminders.filter((r) => r.active)[0];
    const responses: Record<string, (r: typeof active) => string> = {
      "hi-IN": (r) =>
        r ? `आपका अगला reminder "${r.title}" ${r.time} बजे है।` : "आज कोई pending reminder नहीं है।",
      "gu-IN": (r) =>
        r ? `તમારો આગળ reminder "${r.title}" ${r.time} વાગ્યે.` : "આજ માટે કોઈ reminder નથી.",
      "bn-IN": (r) =>
        r ? `আপনার পরবর্তী রিমাইন্ডার "${r.title}" ${r.time} টায়।` : "আজকের রিমাইন্ডার নেই।",
      "ta-IN": (r)
s < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  const matchHourOnly = t.match(/(\d{1,2})\s*(am|pm)/);
  if (matchHourOnly) {
    let hours = parseInt(matchHourOnly[1], 10);
    const meridiem = matchHourOnly[2];
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:00`;
  }

  if (t.includes("tonight") || t.includes("night") || t.includes("रात")) return "20:00";
  if (t.includes("morning") || t.includes("सुबह") || t.includes("ৰাতিপুৱা")) return "08:30";
  if (t.includes("afternoon") || t.includes("दोपहर")) return "13:00";
  if (t.includes("evening") || t.includes("शाम") || t.includes("সন্ধিয়া")) return "17:30";

  return "09:00";
}

export function parseVoiceIntent(rawText: string, store: MemoryBondStore): VoiceIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. "I took my medicine" / "Took medicine" / "दवा ले ली" / "ঔষধ খাইছো"
  if (
    lower.includes("took my medicine") ||
    lower.includes("took medicine") ||
    lower.includes("taken medicine") ||
    lower.includes("i took it") ||
    lower.includes("dawa le li") ||
    lower.includes("दवा ले ली") ||
    lower.includes("dawai le li") ||
    lower.includes("ঔষধ খাইছো")
  ) {
    // Find candidate medicine (e.g. first pending or matching)
    const nextMed = store.medicines[0];
    return {
      type: "TAKE_MEDICINE",
      ...(nextMed ? { medicineId: nextMed.id } : {}),
      medicineName: nextMed?.name || "Scheduled Medicine",
      confirmationMessage: nextMed
        ? `You want to record that you took ${nextMed.name}. Save this confirmation?`
        : "You want to record that you took your medicine. Confirm?",
    };
  }

  // 2. Navigation commands: "Show my medicines", "Show games", "Go home", etc.
  if (lower.includes("show my medicines") || lower.includes("open medicines") || lower.includes("दवाइयाँ दिखाओ")) {
    return {
      type: "NAVIGATE",
      targetView: "medicines",
      confirmationMessage: "Opening your Medicines screen.",
    };
  }
  if (lower.includes("show games") || lower.includes("play games") || lower.includes("memory games")) {
    return {
      type: "NAVIGATE",
      targetView: "games",
      confirmationMessage: "Opening Memory Games.",
    };
  }
  if (lower.includes("show reminders") || lower.includes("my reminders")) {
    return {
      type: "NAVIGATE",
      targetView: "reminders",
      confirmationMessage: "Opening your Reminders.",
    };
  }
  if (lower.includes("routine") || lower.includes("दिनचर्या")) {
    return {
      type: "NAVIGATE",
      targetView: "routine",
      confirmationMessage: "Opening your Daily Routine.",
    };
  }

  // 3. Query Next Reminder: "What's my next reminder?" / "Next medicine"
  if (lower.includes("what is my next reminder") || lower.includes("what's my next reminder") || lower.includes("next reminder")) {
    const active = store.reminders.filter((r) => r.active)[0];
    const message = active
      ? `Your next reminder is "${active.title}" at ${active.time}.`
      : "You have no pending reminders for today.";
    return {
      type: "QUERY_NEXT_REMINDER",
      message,
    };
  }

  // 4. Appointments: "Doctor appointment is on Friday at 10 AM", "appointment on ..."
  if (lower.includes("appointment") || lower.includes("doctor") || lower.includes("अपॉइंटमेंट") || lower.includes("ডাক্তাৰ")) {
    const time = extractTime(lower);
    const cleanTitle = text.replace(/remind me|schedule|create/gi, "").trim();
    // approximate date 3 days ahead or tomorrow
    const futureDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

    return {
      type: "CREATE_APPOINTMENT",
      title: cleanTitle || "Doctor Appointment",
      date: futureDate,
      time,
      confirmationMessage: `You want to save an appointment: "${cleanTitle || "Doctor Visit"}" at ${time}. Save it?`,
    };
  }

  // 5. Reminders with Medicine, Calling, Shopping, or General
  if (lower.includes("remind me") || lower.includes("याद दिलाना") || lower.includes("remind")) {
    const time = extractTime(lower);
    let reminderType: "medicine" | "shopping" | "family_call" | "routine" | "custom" = "custom";

    if (lower.includes("medicine") || lower.includes("pill") || lower.includes("tablet") || lower.includes("दवा")) {
      reminderType = "medicine";
    } else if (lower.includes("buy") || lower.includes("vegetable") || lower.includes("shop") || lower.includes("मार्केट") || lower.includes("बाजार")) {
      reminderType = "shopping";
    } else if (lower.includes("call") || lower.includes("phone") || lower.includes("son") || lower.includes("daughter") || lower.includes("फोन")) {
      reminderType = "family_call";
    } else if (lower.includes("walk") || lower.includes("water") || lower.includes("exercise") || lower.includes("टहलना")) {
      reminderType = "routine";
    }

    // Clean prompt string for title
    let title = text
      .replace(/^remind me to\s*/i, "")
      .replace(/^remind me\s*/i, "")
      .replace(/at\s+\d+.*$/i, "")
      .replace(/on\s+.*$/i, "")
      .trim();

    if (!title) title = "General Reminder";

    return {
      type: "CREATE_REMINDER",
      title,
      time,
      reminderType,
      confirmationMessage: `You want a reminder at ${time} to "${title}". Save it?`,
    };
  }

  // Fallback / Unknown
  return {
    type: "UNKNOWN",
    original: text,
    confirmationMessage: `Did you say: "${text}"? Would you like to create a reminder for this?`,
  };
}

// Text to speech helper
export function speakText(text: string, speechLocale = "en-IN") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // Stop any pending utterances
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLocale;
  utterance.rate = 0.9; // Slightly slower for senior clarity
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
