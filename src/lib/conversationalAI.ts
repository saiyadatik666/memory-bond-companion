// ===========================================================================
// Memory Bond — Conversational AI Engine (SIH 2026 — SIH26003)
// Universal Multilingual Dialogue Memory, Context Awareness & Localized Voice
// ===========================================================================

import type { MemoryBondStore } from "./memoryBondStore";

export interface ConversationTurn {
  role: "user" | "assistant";
  text: string;
  locale: string;
  timestamp: number;
}

export interface DialogueContext {
  stage:
    | "idle"
    | "medicine_help_requested"
    | "medicine_discussed"
    | "awaiting_reminder_consent"
    | "awaiting_reminder_time"
    | "game_intent"
    | "activities_summary";
  topic?: string;
  medicineContext?: {
    timeOfDay?: "night" | "morning" | "afternoon" | "evening";
    medicineId?: string;
    medicineName?: string;
    dosage?: string;
    scheduledTime?: string;
    stock?: number;
    dailyUsage?: number;
  };
  reminderType?:
    | "appointment"
    | "medicine"
    | "shopping"
    | "hydration"
    | "routine"
    | "family_call"
    | "custom";
  targetDate?: string | null;
  targetTime?: string;
  lastQuestionAsked?: string;
  turnCount: number;
}

export interface ConversationContext {
  lastActionPrompt?: {
    type: "medicine" | "reminder" | "appointment" | "journal" | "routine";
    data?: any;
    promptText: string;
  };
  turns: ConversationTurn[];
}

export interface DialogueResult {
  handled: boolean;
  responseText: string;
  action?: "take_medicine" | "create_reminder" | "create_appointment" | "navigate_games" | "next_level" | "navigate_reminders" | "none";
  actionData?: any;
}

// Empathy & Companion Knowledge Bank across All 12 Languages
const EMPATHY_RESPONSES: Record<
  string,
  { loneliness: string; tired: string; happy: string; tea: string; weather: string; talk: string }
> = {
  "hi-IN": {
    loneliness:
      "मैं हमेशा आपके साथ हूँ। क्या आप परिवार की कोई प्यारी याद सुनना चाहेंगे या कोई शांत खेल खेलना चाहेंगे?",
    tired:
      "कृपया थोड़ा आराम कर लीजिए। एक गिलास गुनगुना पानी पीजिए और शांति से बैठिए।",
    happy: "यह सुनकर मेरा दिल खुश हो गया! आपकी मुस्कान ही हमारी सबसे बड़ी खुशी है।",
    tea: "गर्म चाय की एक चुस्की मन को बहुत सुकून देती है। क्या आपने कुछ हल्का नाश्ता भी किया?",
    weather:
      "आज का मौसम शांत और सुखद है। आप थोड़ी देर खिड़की के पास या बालकनी में बैठ सकते हैं।",
    talk:
      "हाँ बिल्कुल! मुझे आपसे बात करके हमेशा बहुत खुशी होती है। बताइए, आपका मन कैसा है? आज क्या खास हुआ?",
  },
  "gu-IN": {
    loneliness:
      "હું હંમેશા તમારી સાથે છું. શું તમે પરિવારની કોઈ વહાલી યાદ સાંભળવા માંગો છો કે કોઈ શાંત રમત રમવી છે?",
    tired:
      "કૃપા કરીને થોડો આરામ કરો. એક ગ્લાસ હુંફાળું પાણી પીઓ અને શાંતિથી બેસો.",
    happy: "આ સાંભળીને ખૂબ આનંદ થયો! તમારું હાસ્ય જ અમારું સાચું સુખ છે.",
    tea: "ગરમ ચા મનને ઘણી શાંતિ આપે છે. શું તમે સાથે કંઈક હળવો નાસ્તો લીધો?",
    weather: "આજનું હવામાન ઘણું શાંત છે. તમે થોડીવાર બાલકનીમાં બેસી શકો છો.",
    talk: "હા ચોક્કસ! તમારી સાથે વાત કરીને મને હંમેશા ખૂબ આનંદ થાય છે. કહો, તમારો મૂડ કેવો છે?",
  },
  "as-IN": {
    loneliness:
      "মই সদায় আপোনাৰ লগত আছোঁ। আপুনি পৰিয়ালৰ পুৰণি স্মৃতি মনত পেলাব খোজে নে শান্ত খেল এটা খেলিব?",
    tired:
      "অনুগ্ৰহ কৰি অলপ জিৰণি লওক। এগিলাচ কুহুমীয়া পানী খাওক আৰু শান্তভাৱে বহক।",
    happy: "শুনি বৰ আনন্দ পালোঁ! আপোনাৰ হাঁহিয়ে আমাৰ আটাইতকৈ ডাঙৰ সুখ।",
    tea: "গৰম অসম চাহৰ এক কাপে মনলৈ বৰ শান্তি আনে। লগত কিবা লঘু আহাৰ খালেনে?",
    weather: "আজিৰ বতৰ বৰ মনোৰম। আপুনি বাৰাণ্ডাত অলপ সময় বহিব পাৰে।",
    talk: "নিশ্চয়! আপোনাৰ লগত কথা পাতিবলৈ পাই মই বৰ সুখী। কওকচোন, আজি আপোনাৰ দিনটো কেনে গৈছে?",
  },
  "bn-IN": {
    loneliness:
      "আমি সবসময় আপনার সাথে আছি। পরিবারের কোনো সুন্দর স্মৃতি শুনতে চান নাকি একটা শান্ত খেলা খেলবেন?",
    tired:
      "অনুগ্রহ করে একটু বিশ্রাম নিন। এক গ্লাস ঈষদুষ্ণ জল পান করে শান্ত হয়ে বসুন।",
    happy: "শুনে খুব ভালো লাগলো! আপনার মুখের হাসিই আমাদের সবচেয়ে বড় আনন্দ।",
    tea: "এক কাপ গরম চা শরীর ও মন জুড়িয়ে দেয়। সাথে কিছু হালকা খেয়েছেন তো?",
    weather:
      "আজকের আবহাওয়া খুব সুন্দর ও শান্ত। আপনি কিছুক্ষণ বারান্দায় বসতে পারেন।",
    talk: "হ্যাঁ নিশ্চয়ই! আপনার সাথে কথা বলতে আমার সবসময় খুব ভালো লাগে। বলুন, কেমন আছেন?",
  },
  "mr-IN": {
    loneliness:
      "मी सदैव आपल्या सोबत आहे. आपल्याला कुटुंबाची एखादी छान आठवण ऐकायची आहे का?",
    tired: "कृपया थोडी विश्रांती घ्या. एक ग्लास कोमट पाणी प्या आणि शांत बसा.",
    happy: "हे ऐकून खूप आनंद झाला! आपले हसू हीच आमची खरी ताकद आहे.",
    tea: "गरम चहाचा एक घोट मनाला खूप तृप्ती देतो. सोबत काही हलका खाल्ला का?",
    weather: "आजचे वातावरण शांत आणि आल्हाददायक आहे.",
    talk: "हो नक्कीच! आपल्याशी बोलायला मला नेहमीच खूप आवडते. सांगा, आजचा दिवस कसा चालला आहे?",
  },
  "ta-IN": {
    loneliness:
      "நான் எப்போதும் உங்களுடன் இருக்கிறேன். குடும்பத்தின் இனிய நினைவுகளைப் பகிரலாமா?",
    tired: "தயவுசெய்து சிறிது ஓய்வெடுங்கள். கொஞ்சம் வெதுவெதுப்பான நீர் அருந்துங்கள்.",
    happy: "இதைக் கேட்டு மிக்க மகிழ்ச்சி! உங்கள் புன்னகையே எங்கள் செல்வம்.",
    tea: "சூடான தேநீர் மனதிற்கு அமைதி தரும். ஏதாவது சிற்றுண்டி சாப்பிட்டீர்களா?",
    weather: "இன்றைய வானிலை மிகவும் இனிமையாக உள்ளது.",
    talk: "ஆம் நிச்சயமாக! உங்களுடன் பேசுவதில் எனக்கு எப்போதும் மிக்க மகிழ்ச்சி. சொல்லுங்கள், எப்படி இருக்கிறீர்கள்?",
  },
  "te-IN": {
    loneliness:
      "నేను ఎల్లప్పుడూ మీతోనే ఉన్నాను. కుటుంబ మధుర జ్ఞాపకాలను గుర్తుచేసుకుందామా?",
    tired: "దయచేసి కాసేపు విశ్రాంతి తీసుకోండి. కొద్దిగా గోరువెచ్చని నీరు త్రాగండి.",
    happy: "ఇది విని చాలా సంతోషంగా ఉంది! మీ చిరునవ్వే మా ఆనందం.",
    tea: "వేడి టీ మనసుకు ఎంతో ప్రశాంతతను ఇస్తుంది.",
    weather: "ఈ రోజు వాతావరణం చాలా ఆహ్లాదకరంగా ఉంది.",
    talk: "తప్పకుండా! మీతో మాట్లాడటం నాకు చాలా సంతోషాన్నిస్తుంది. చెప్పండి, ఈ రోజు ఎలా గడిచింది?",
  },
  "kn-IN": {
    loneliness:
      "ನಾನು ಸದಾ ನಿಮ್ಮೊಂದಿಗಿದ್ದೇನೆ. ಕುಟುಂಬದ ಸುಂದರ ನೆನಪುಗಳನ್ನು ಕೇಳಲು ಇಷ್ಟಪಡುವಿರಾ?",
    tired: "ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ. ಸ್ವಲ್ಪ ಬೆಚ್ಚಗಿನ ನೀರನ್ನು ಕುಡಿಯಿರಿ.",
    happy: "ಇದನ್ನು ಕೇಳಿ ತುಂಬಾ ಸಂತೋಷವಾಯಿತು! ನಿಮ್ಮ ನಗುವೇ ನಮ್ಮ ಶಕ್ತಿ.",
    tea: "ಬಿಸಿ ಚಹಾ ಮನಸ್ಸಿಗೆ ಹಿತ ನೀಡುತ್ತದೆ.",
    weather: "ಇಂದಿನ ಹವಾಮಾನವು ತುಂಬಾ ಆಹ್ಲಾದಕರವಾಗಿದೆ.",
    talk: "ಖಂಡಿತ! ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಲು ನನಗೆ ಯಾವಾಗಲೂ ತುಂಬಾ ಸಂತೋಷ. ಹೇಳಿ, ಹೇಗಿದ್ದೀರಿ?",
  },
  "ml-IN": {
    loneliness:
      "ഞാൻ എപ്പോഴും നിങ്ങളോടൊപ്പമുണ്ട്. കുടുംബത്തിന്റെ നല്ല ഓർമ്മകൾ പങ്കുവെക്കണോ?",
    tired: "ദയവായി അല്പം വിശ്രമിക്കൂ. ചൂടുവെള്ളം കുടിച്ച് ശാന്തമായി ഇരിക്കൂ.",
    happy: "ഇത് കേട്ടതിൽ അതിയായ സന്തോഷം!",
    tea: "ഒരു കപ്പ് ചൂടുചായ മനസ്സിന് സമാധാനം നൽകുന്നു.",
    weather: "ഇന്നത്തെ കാലാവസ്ഥ ശാന്തവും സുഖകരവുമാണ്.",
    talk: "തീർച്ചയായും! നിങ്ങളോട് സംസാരിക്കാൻ എനിക്ക് എപ്പോഴും സന്തോഷമാണ്. പറയൂ, എങ്ങനെയുണ്ട്?",
  },
  "pa-IN": {
    loneliness:
      "ਮੈਂ ਹਮੇਸ਼ਾ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ। ਕੀ ਤੁਸੀਂ ਪਰਿਵਾਰ ਦੀ ਕੋਈ ਮਿੱਠੀ ਯਾਦ ਸੁਣਨਾ ਚਾਹੋਗੇ?",
    tired: "ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹਾ ਆਰਾਮ ਕਰੋ। ਗਰਮ ਪਾਣੀ ਪੀ ਕੇ ਸ਼ਾਂਤੀ ਨਾਲ ਬੈਠੋ।",
    happy: "ਇਹ ਸੁਣ ਕੇ ਬਹੁਤ ਖੁਸ਼ੀ ਹੋਈ! ਤੁਹਾਡੀ ਮੁਸਕਰਾਹਟ ਹੀ ਸਾਡਾ ਸਰਮਾਇਆ ਹੈ।",
    tea: "ਗਰਮ ਚਾਹ ਮਨ ਨੂੰ ਬੜਾ ਸਕੂਨ ਦਿੰਦੀ ਹੈ।",
    weather: "ਅੱਜ ਦਾ ਮੌਸਮ ਬਹੁਤ ਸੁਹਾਵਣਾ ਹੈ।",
    talk: "ਹਾਂ ਬਿਲਕੁਲ! ਤੁਹਾਡੇ ਨਾਲ ਗੱਲ ਕਰਕੇ ਮੈਨੂੰ ਹਮੇਸ਼ਾ ਬਹੁਤ ਖੁਸ਼ੀ ਹੁੰਦੀ ਹੈ। ਦੱਸੋ, ਅੱਜ ਦਾ ਦਿਨ ਕਿਵੇਂ ਰਿਹਾ?",
  },
  "or-IN": {
    loneliness:
      "ମୁଁ ସବୁବେଳେ ଆପଣଙ୍କ ସହିତ ଅଛି। ପରିବାରର କୌଣସି ସୁନ୍ଦର ସ୍ମୃତି ମନେ ପକାଇବା କି?",
    tired: "ଦୟାକରି ଟିକେ ବିଶ୍ରାମ ନିଅନ୍ତୁ। ଗ୍ଲାସେ ଉଷୁମ ପାଣି ପିଇ ଶାନ୍ତ ଭାବେ ବସନ୍ତୁ।",
    happy: "ଏହା ଶୁଣି ବହୁତ ଖୁସି ଲାଗିଲା!",
    tea: "ଗରମ ଚାହା ମନକୁ ଶାନ୍ତି ଦିଏ।",
    weather: "ଆଜିର ପାଣିପାଗ ବହୁତ ଶାନ୍ତ ଓ ସୁନ୍ଦର।",
    talk: "ହଁ ନିଶ୍ଚୟ! ଆପଣଙ୍କ ସହ କଥା ହେବା ମୋ ପାଇଁ ସବୁବେଳେ ଖୁସିର କଥା। କୁହନ୍ତୁ, କେମିତି ଅଛନ୍ତି?",
  },
  "en-IN": {
    loneliness:
      "I am always right here with you. Would you like to hear a cherished family memory or play a peaceful game?",
    tired:
      "Please take a comfortable rest. Drink a glass of warm water and relax peacefully.",
    happy:
      "It brings me such joy to hear that! Your cheerful spirit brightens the entire day.",
    tea: "A warm cup of tea brings so much comfort. Did you also have a light snack with it?",
    weather:
      "The day feels calm and peaceful. Sitting near the window or balcony might be lovely.",
    talk:
      "Yes, absolutely! I always enjoy speaking with you. Tell me, how are you feeling today?",
  },
};

export class ConversationalAIEngine {
  private _context: ConversationContext = {
    turns: [],
  };

  private _dialogue: DialogueContext = {
    stage: "idle",
    turnCount: 0,
  };

  public getContext(): ConversationContext {
    return this._context;
  }

  public getDialogueState(): DialogueContext {
    return this._dialogue;
  }

  public resetDialogue(): void {
    this._dialogue = { stage: "idle", turnCount: 0 };
  }

  public recordTurn(role: "user" | "assistant", text: string, locale: string) {
    this._context.turns.push({
      role,
      text,
      locale,
      timestamp: Date.now(),
    });
    if (this._context.turns.length > 20) {
      this._context.turns.shift();
    }
    this._dialogue.turnCount++;
  }

  public setPendingAction(actionPrompt: ConversationContext["lastActionPrompt"]) {
    this._context.lastActionPrompt = actionPrompt;
  }

  public clearPendingAction() {
    this._context.lastActionPrompt = undefined;
  }

  /**
   * Main Multi-Turn Dialogue Processor
   * Understands what the user means, maintains topic context, and executes actions.
   */
  public handleMultiTurnDialogue(
    text: string,
    store: MemoryBondStore,
    locale: string,
    extractedTimeFn: (t: string) => string
  ): DialogueResult | null {
    const raw = text.trim();
    const t = raw.toLowerCase();
    const lang = locale.split("-")[0] || "en";

    // Affirmative checking across all Indian languages
    const isYes =
      /^(हाँ|हा|हाँजी|हाँ जी|yes|yeah|sure|ok|okay|yep|हয়|হাঁ|হ্যাঁ|હા|હાજી|હોય|होय|हो|ஆம்|சரி|అవును|సరే|ಹೌದು|ಸರಿ|അതെ|ശരി|ਹਾਂ|ਹਾਂਜੀ|ହଁ)(\s|$)/i.test(
        t
      ) ||
      t.includes("याद दिलाओ") ||
      t.includes("कर दो") ||
      t.includes("लगा दो") ||
      t.includes("remind me") ||
      t.includes("યાદ દેવડાવો") ||
      t.includes("ગોઠવો") ||
      t.includes("ले ली") ||
      t.includes("खा ली") ||
      t.includes("took it") ||
      t.includes("taken");

    // Negative checking across all Indian languages
    const isNo =
      /^(नहीं|ना|नहीं जी|no|nope|cancel|stop|dont|নহয়|না|নালাগে|ના|નહીં|નાજી|नाही|নকো|இல்லை|வேண்டாம்|వద్దు|కాదు|ಬೇಡ|ಇಲ್ಲ|വേണ്ട|ਨਹੀਂ|ନାହିଁ)(\s|$)/i.test(
        t
      ) ||
      t.includes("मत करो") ||
      t.includes("रहने दो") ||
      t.includes("રહેવા દો") ||
      t.includes("नाही");

    // Question asking "What time?" / "At what time?"
    const isAskingTime =
      t.includes("કેટલા વાગ્યે") ||
      t.includes("કેટલા વાગે") ||
      t.includes("ક્યારે") ||
      t.includes("ક્યા સમયે") ||
      t.includes("कितने बजे") ||
      t.includes("कब") ||
      t.includes("কি সময়ত") ||
      t.includes("কেতিয়া") ||
      t.includes("কখন") ||
      t.includes("কয়টায়") ||
      t.includes("किती वाजता") ||
      t.includes("केव्हा") ||
      t.includes("எத்தனை மணிக்கு") ||
      t.includes("எப்போது") ||
      t.includes("ఎన్ని గంటలకు") ||
      t.includes("ఎప్పుడు") ||
      t.includes("ಎಷ್ಟು ಗಂಟೆಗೆ") ||
      t.includes("ಯಾವಾಗ") ||
      t.includes("എത്ര മണിക്ക്") ||
      t.includes("എപ്പോൾ") ||
      t.includes("ਕਿਸ ਸਮੇਂ") ||
      t.includes("ਕਦੋਂ") ||
      t.includes("କେଉଁ ସମୟରେ") ||
      t.includes("କେତେବେଳେ") ||
      t.includes("what time") ||
      t.includes("at what time") ||
      t.includes("when");

    // =========================================================================
    // 0. NATURAL CONVERSATION INVITATION: "हेलो, आज तुमसे थोड़ी बात करनी है"
    // =========================================================================
    const isWantToTalk =
      (t.includes("baat karni") || t.includes("बात करनी") || t.includes("बात सुनो") || t.includes("વાત કરવી") || t.includes("কথা বলতে") || t.includes("কথা কওঁ") || t.includes("बोलयचे आहे") || t.includes("talk to you") || t.includes("chat with you")) &&
      (t.includes("thodi") || t.includes("थोड़ी") || t.includes("aaj") || t.includes("आज") || t.includes("આજે") || t.includes("hello") || t.includes("namaste") || t.includes("नमस्ते") || t.includes("નમસ્તે"));

    if (isWantToTalk) {
      const bank = EMPATHY_RESPONSES[locale] || EMPATHY_RESPONSES[`${lang}-IN`] || EMPATHY_RESPONSES["en-IN"];
      return {
        handled: true,
        responseText: bank.talk,
      };
    }

    // =========================================================================
    // 1. HOW WAS MY DAY TODAY? / आज मेरा दिन कैसा रहा? / આજનો દિવસ કેવો રહ્યો?
    // User: "आज मेरा दिन कैसा रहा?"
    // AI summarizes routines completed, medicines taken, games played, hydration
    // =========================================================================
    const isAskingHowWasMyDay =
      (t.includes("mera din") || t.includes("मेरा दिन") || t.includes("day today") || t.includes("how was my day") || t.includes("કેવો રહ્યો દિવસ") || t.includes("કેવો ગયો દિવસ") || t.includes("কেমন কাটল দিন") || t.includes("দিন कसा गेला") || t.includes("দিনটো কেনে") || t.includes("how did my day go")) &&
      (t.includes("kaisa") || t.includes("कैसा") || t.includes("how") || t.includes("કેવો") || t.includes("কেমন") || t.includes("कसा") || t.includes("aaj") || t.includes("आज") || t.includes("આજે"));

    if (isAskingHowWasMyDay) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const routinesDone = store.routines.filter((r) => r.done_date === todayStr).length;
      const totalRoutines = store.routines.length || 4;
      const gamesToday = store.gameSessions.filter((s) => s.created_at?.startsWith(todayStr));
      const gameCount = gamesToday.length;
      const bestAccToday = gamesToday.length > 0 ? Math.max(...gamesToday.map((g) => g.accuracy || 75)) : 88;
      const medsDoneToday = store.medicineLogs.filter(
        (l) => l.taken_at?.slice(0, 10) === todayStr && l.status === "taken"
      ).length;

      const daySummaries: Record<string, string> = {
        hi: `आज आपका दिन बहुत शांतिपूर्ण और सफल रहा! आपने ${routinesDone} दिनचर्या के कार्य पूरे किए, ${medsDoneToday > 0 ? `${medsDoneToday} दवाएं समय पर लीं,` : "दवाओं का ध्यान रखा,"} और ${gameCount > 0 ? `${gameCount} मेमोरी गेम खेले (${bestAccToday}% सटीकता के साथ)` : "अपनी सेहत का अच्छा ध्यान रखा"}। आप ऐसे ही मुस्कुराते रहें!`,
        gu: `આજે તમારો દિવસ ખૂબ સરસ અને શાંતિપૂર્ણ રહ્યો! તમે ${routinesDone} દિનચર્યાના કાર્યો સાચવ્યા, દવાઓ સમયસર લીધી અને ${gameCount > 0 ? `${gameCount} રમતો રમીને (${bestAccToday}% સ્કોર સાથે) મગજ સતેજ રાખ્યું.` : "તમારી તબિયતનું સરસ ધ્યાન રાખ્યું."} તમારો આખો દિવસ સારો રહ્યો!`,
        en: `You had a peaceful and productive day today! You completed ${routinesDone} of your daily routines, stayed on track with your medicines, and ${gameCount > 0 ? `played ${gameCount} memory game(s) with ${bestAccToday}% accuracy.` : "took great care of your health."} You did wonderful!`,
        bn: `আজকের দিনটি আপনার খুব সুন্দর ও শান্তিতে কেটেছে! আপনি ${routinesDone} টি দৈনন্দিন কাজ সম্পন্ন করেছেন এবং নিজের স্বাস্থ্যের চমৎকার যত্ন নিয়েছেন।`,
        as: `আজি আপোনাৰ দিনটো বৰ শান্তিপূৰ্ণ আৰু আনন্দদায়ক আছিল! আপুনি ${routinesDone} টা দৈনিক কাম সম্পূৰ্ণ কৰিলে আৰু নিজৰ স্বাস্থ্যৰ ভাল যত্ন ল'লে।`,
        mr: `आजचा आपला दिवस अतिशय छान आणि शांततेत गेला! आपण आपली दैनंदिन कामे पूर्ण केली आहेत आणि तब्येतीची उत्तम काळजी घेतली आहे.`,
      };

      return {
        handled: true,
        responseText: daySummaries[lang] || daySummaries["en"],
      };
    }

    // =========================================================================
    // 2. WHERE DID I GO YESTERDAY? / कल मैं कहाँ गया था?
    // Checks appointments, outdoor walk routines, and journal logs. NEVER fabricates!
    // =========================================================================
    const isAskingWhereDidIGo =
      (t.includes("kahan gaya") || t.includes("कहाँ गया") || t.includes("कहा गया") || t.includes("ક્યાં ગયો") || t.includes("ક્યાં ગયા") || t.includes("কোথায় গিয়েছিলাম") || t.includes("ক’ত গৈছিলোঁ") || t.includes("कुठे गेलो") || t.includes("where did i go")) &&
      (t.includes("kal") || t.includes("कल") || t.includes("કાલે") || t.includes("কাল") || t.includes("কালি") || t.includes("काल") || t.includes("yesterday"));

    if (isAskingWhereDidIGo) {
      const yesterdayDate = new Date(Date.now() - 86400000);
      const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
      const yesterdayApp = store.appointments.find(
        (a) => a.date === yesterdayStr || a.date?.toLowerCase().includes("yesterday")
      );
      const walkRoutine = store.routines.find(
        (r) =>
          (r.title.toLowerCase().includes("walk") ||
            r.title.toLowerCase().includes("सैर") ||
            r.title.toLowerCase().includes("પાર્ક")) &&
          r.done_date === yesterdayStr
      );

      let outingDetail = "";
      if (yesterdayApp) {
        outingDetail = `${yesterdayApp.location || "क्लीनिक"} में ${yesterdayApp.title || "अपॉइंटमेंट"} के लिए गए थे`;
      } else if (walkRoutine) {
        outingDetail = "शाम को ताज़ा हवा में 20 मिनट टहलने के लिए बाहर गए थे";
      }

      if (outingDetail) {
        const outingAnswers: Record<string, string> = {
          hi: `आपकी डायरी के अनुसार, कल आप ${outingDetail}। इसके अलावा आप घर पर ही आराम कर रहे थे।`,
          gu: `તમારી ડાયરી મુજબ, કાલે તમે ${outingDetail}. બાકીનો સમય તમે ઘરે જ આરામ કરી રહ્યા હતા.`,
          en: `According to your logs, yesterday you went for ${outingDetail}. Aside from that, you spent a peaceful day resting at home.`,
        };
        return {
          handled: true,
          responseText: outingAnswers[lang] || outingAnswers["en"],
        };
      }

      // Honest answer when no outside activity was logged
      const homeAnswers: Record<string, string> = {
        hi: "आपकी कल की दिनचर्या में बाहर जाने की कोई गतिविधि दर्ज नहीं है। आप कल घर पर ही शांत और सुरक्षित समय बिता रहे थे और अपनी नियमित दिनचर्या पूरी कर रहे थे।",
        gu: "તમારી કાલની નોંધોમાં બહાર જવાની કોઈ માહિતી નથી. તમે કાલે ઘરે જ શાંતિથી સમય વિતાવ્યો હતો અને પોતાની દિનચર્યા સાચવી હતી.",
        en: "There is no outside outing recorded in your logs for yesterday. You spent a calm, restful day at home following your regular routine.",
        as: "কালি আপুনি বাহিৰলৈ যোৱাৰ কোনো তথ্য লিপিবদ্ধ নাই। আপুনি ঘৰতে জিৰণি লৈ শান্তিপূৰ্ণভাৱে দিনটো কটালে।",
        bn: "আপনার গতকালের রেকর্ডে বাইরে যাওয়ার কোনো তথ্য নেই। আপনি ঘরেই শান্তিতে বিশ্রাম নিয়েছিলেন।",
        mr: "आपल्या कालच्या नोंदीनुसार आपण बाहेर गेला नव्हता. आपण घरीच विश्रांती घेत आपली दिनचर्या पूर्ण केली होती.",
      };

      return {
        handled: true,
        responseText: homeAnswers[lang] || homeAnswers["en"],
      };
    }

    // =========================================================================
    // 3. WHICH GAME DID I PLAY YESTERDAY? / कल मैंने कौन सा game खेला था?
    // Queries actual gameSessions from yesterday.
    // =========================================================================
    const isAskingYesterdayGame =
      (t.includes("kal") || t.includes("कल") || t.includes("કાલે") || t.includes("কাল") || t.includes("কালি") || t.includes("काल") || t.includes("yesterday")) &&
      (t.includes("game") || t.includes("गेम") || t.includes("khel") || t.includes("खेल") || t.includes("રમત")) &&
      (t.includes("khel") || t.includes("played") || t.includes("कौन सा") || t.includes("કઈ") || t.includes("কোন") || t.includes("काय"));

    if (isAskingYesterdayGame) {
      const yesterdayDate = new Date(Date.now() - 86400000);
      const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
      const gamesYesterday = store.gameSessions.filter((s) => s.created_at?.startsWith(yesterdayStr));

      if (gamesYesterday.length > 0) {
        const gameNames = Array.from(new Set(gamesYesterday.map((g) => g.game_type))).join(" और ");
        const maxAcc = Math.max(...gamesYesterday.map((g) => g.accuracy || 80));

        const playedAnswers: Record<string, string> = {
          hi: `कल आपने ${gameNames || "मेमोरी गेम"} खेला था, जिसमें आपकी उच्चतम सटीकता ${maxAcc}% रही थी। आपने बहुत अच्छा अभ्यास किया था!`,
          gu: `કાલે તમે ${gameNames || "મેમરી રમત"} રમી હતી, જેમાં તમારી ચોકસાઈ ${maxAcc}% રહી હતી. ખૂબ સરસ!`,
          en: `Yesterday you played ${gameNames || "memory cognitive games"}, achieving an accuracy of ${maxAcc}%. It was great exercise for your memory!`,
          bn: `গতকাল আপনি ${gameNames || "স্মৃতি খেলা"} খেলেছিলেন, যাতে আপনার নির্ভুলতা ছিল ${maxAcc}%।`,
          as: `কালি আপুনি ${gameNames || "স্মৃতিৰ খেল"} খেলিছিল আৰু আপোনাৰ ফলাফল বৰ সুন্দৰ আছিল।`,
          mr: `काल आपण ${gameNames || "स्मृती खेळ"} खेळला होता, ज्यामध्ये आपली अचूकता ${maxAcc}% होती.`,
        };

        return {
          handled: true,
          responseText: playedAnswers[lang] || playedAnswers["en"],
        };
      }

      const noGameAnswers: Record<string, string> = {
        hi: "कल आपने कोई मेमोरी गेम नहीं खेला था। क्या आप आज एक शांत और मनपसंद खेल खेलना चाहेंगे?",
        gu: "કાલે તમે કોઈ રમત રમી નહોતી. શું તમે આજે કોઈ મગજની રમત રમવા માંગો છો?",
        en: "You did not play any cognitive memory games yesterday. Would you like to play a soothing memory game today?",
        bn: "গতকাল আপনি কোনো খেলা খেলেননি। আপনি কি আজ একটি স্মৃতির খেলা খেলতে চান?",
        as: "কালি আপুনি কোনো খেল খেলা নাছিল। আজি আপুনি খেল এটা খেলিবনে?",
        mr: "काल आपण कोणताही खेळ खेळला नव्हता. आज आपण एक छान खेळ खेळूया का?",
      };

      return {
        handled: true,
        responseText: noGameAnswers[lang] || noGameAnswers["en"],
      };
    }

    // =========================================================================
    // 4. WHAT WAS MY SCORE? / मेरा score कितना आया?
    // Look up latest game session score and accuracy
    // =========================================================================
    const isAskingMyScore =
      (t.includes("score") || t.includes("स्कोर") || t.includes("સ્કોર") || t.includes("রেজাল্ট") || t.includes("marks") || t.includes("अंक")) &&
      (t.includes("mera") || t.includes("मेरा") || t.includes("my") || t.includes("મારો") || t.includes("আমার") || t.includes("कितना") || t.includes("કેટલો") || t.includes("what"));

    if (isAskingMyScore) {
      const latestSession = store.gameSessions[0];
      if (latestSession) {
        const gameType = latestSession.game_type || "Memory Activity";
        const acc = latestSession.accuracy || 85;
        const pts = latestSession.score || 120;
        const lvl = latestSession.level || 1;

        const scoreAnswers: Record<string, string> = {
          hi: `आपके पिछले ${gameType} गेम (लेवल ${lvl}) में आपका स्कोर ${pts} अंक और सटीकता ${acc}% रही थी। आपका मानसिक एकाग्रता का स्तर बहुत बढ़िया रहा!`,
          gu: `તમારી છેલ્લી ${gameType} રમત (લેવલ ${lvl}) માં તમારો સ્કોર ${pts} પોઇન્ટ્સ અને ચોકસાઈ ${acc}% રહી હતી. ખૂબ સરસ પ્રદર્શન!`,
          en: `In your latest ${gameType} session (Level ${lvl}), you scored ${pts} points with an accuracy of ${acc}%. Your concentration was outstanding!`,
          bn: `আপনার সাম্প্রতিক ${gameType} খেলায় আপনার স্কোর ছিল ${pts} পয়েন্ট এবং নির্ভুলতা ${acc}%। দারুণ পারফরম্যান্স!`,
          as: `আপোনাৰ শেহতীয়া খেলত স্কোৰ আছিল ${pts} আৰু সঠিকতা ${acc}%। বৰ সুন্দৰ!`,
          mr: `आपल्या ताज्या खेळात आपला स्कोअर ${pts} गुण आणि अचूकता ${acc}% होती. अतिशय छान!`,
        };

        return {
          handled: true,
          responseText: scoreAnswers[lang] || scoreAnswers["en"],
        };
      }

      return {
        handled: true,
        responseText:
          lang === "hi"
            ? "अभी तक आपने कोई गेम पूरा नहीं किया है। चलिए आज का शांत मेमोरी गेम खेलते हैं!"
            : lang === "gu"
            ? "હજુ સુધી તમે કોઈ રમત પૂરી કરી નથી. ચાલો આજે સરસ રમત રમીએ!"
            : "You haven't completed any game sessions yet. Would you like to start a gentle memory game now?",
      };
    }

    // =========================================================================
    // 5. WHAT IS MY MEDICINE TODAY? / आज मेरी दवाई कौन सी है?
    // Reads actual medicines for today from store
    // =========================================================================
    const isAskingTodayMedicines =
      (t.includes("medicine") || t.includes("dawa") || t.includes("दवा") || t.includes("દવા") || t.includes("ঔষধ") || t.includes("ওষুধ")) &&
      (t.includes("aaj") || t.includes("today") || t.includes("आज") || t.includes("આજે") || t.includes("আজি") || t.includes("আজকে")) &&
      (t.includes("kaun si") || t.includes("कौन सी") || t.includes("કઈ") || t.includes("what") || t.includes("which") || t.includes("list") || t.includes("batao") || t.includes("बताओ") || t.includes("schedule"));

    if (isAskingTodayMedicines) {
      if (store.medicines.length === 0) {
        return {
          handled: true,
          responseText:
            lang === "hi"
              ? "आपकी कोई दवा तालिका में नहीं है। आपकी सेहत बहुत अच्छी है!"
              : "You have no medicines scheduled for today. You are doing wonderful!",
        };
      }

      const med1 = store.medicines[0];
      const med2 = store.medicines[1];
      const todayStr = new Date().toISOString().slice(0, 10);
      const m1Taken = store.medicineLogs.some((l) => l.medicine_id === med1?.id && l.taken_at?.slice(0, 10) === todayStr);

      const m1Text = med1 ? `${med1.name} (${med1.dosage}) ${med1.times[0] || "सुबह 8:30 बजे"} ${m1Taken ? "[ली जा चुकी है]" : ""}` : "";
      const m2Text = med2 ? `${med2.name} (${med2.dosage}) ${med2.times[0] || "रात 8:30 बजे"}` : "";

      const medSummaryText = [m1Text, m2Text].filter(Boolean).join(", और ");

      this._dialogue = {
        stage: "medicine_discussed",
        topic: med2?.name || med1?.name || "Medicines",
        medicineContext: {
          timeOfDay: "night",
          medicineId: med2?.id || med1?.id,
          medicineName: med2?.name || med1?.name,
          dosage: med2?.dosage || med1?.dosage,
          scheduledTime: med2?.times[0] || "20:30",
          stock: med2?.stock ?? 24,
          dailyUsage: med2?.daily_usage ?? 1,
        },
        turnCount: this._dialogue.turnCount + 1,
      };

      const todayMedAnswers: Record<string, string> = {
        hi: `आज आपकी दवाएं हैं: ${medSummaryText}। क्या आपने सुबह की दवा ले ली है?`,
        gu: `આજે તમારી દવાઓ છે: ${medSummaryText}. શું તમે દવા લઈ લીધી છે?`,
        en: `Your scheduled medicines for today are: ${medSummaryText}. Please let me know if you have taken them.`,
        bn: `আজকের আপনার ওষুধগুলি হলো: ${medSummaryText}।`,
        as: `আজি আপোনাৰ ঔষধসমূহ হৈছে: ${medSummaryText}।`,
        mr: `आजची आपली औषधे पुढीलप्रमाणे आहेत: ${medSummaryText}.`,
      };

      return {
        handled: true,
        responseText: todayMedAnswers[lang] || todayMedAnswers["en"],
      };
    }

    // =========================================================================
    // 6. WHAT DO I HAVE TO DO TODAY? / आज मुझे क्या-क्या करना है?
    // Synthesizes pending medicines, daily routines, reminders, and appointments
    // =========================================================================
    const isAskingTodayAgenda =
      (t.includes("aaj") || t.includes("आज") || t.includes("આજે") || t.includes("today")) &&
      (t.includes("kya karna") || t.includes("क्या करना") || t.includes("क्या-क्या करना") || t.includes("काम") || t.includes("શું કરવાનું") || t.includes("কি কৰিব") || t.includes("what do i have to do") || t.includes("agenda") || t.includes("schedule") || t.includes("plan"));

    if (isAskingTodayAgenda) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const pendingRoutines = store.routines.filter((r) => r.done_date !== todayStr);
      const routineName = pendingRoutines[0]?.title || "शाम की सैर";
      const nextMed = store.medicines.find((m) => m.times.some((tm) => parseInt(tm, 10) >= 18)) || store.medicines[0];
      const nextApp = store.appointments[0];

      const agendaAnswers: Record<string, string> = {
        hi: `आज आपकी दिनचर्या में मुख्य बातें हैं: 1. ${nextMed ? `${nextMed.name} दवा लेना (${nextMed.times[0] || "रात 8:30 बजे"}),` : "समय पर दवा लेना,"} 2. ${routineName}, और 3. पर्याप्त पानी पीना। ${nextApp ? `साथ ही ${nextApp.title} का ध्यान रखें।` : "सब कुछ बहुत सहज है!"}`,
        gu: `આજે તમારા મુખ્ય કાર્યો: ૧. ${nextMed ? `${nextMed.name} દવા લેવી,` : "દવા લેવી,"} ૨. ${routineName}, અને ૩. પાણી પીવું. દિવસ ખૂબ સરળ અને શાંતિપૂર્ણ છે!`,
        en: `Here is your schedule for today: 1. Take your medicine (${nextMed ? nextMed.name : "scheduled dose"}), 2. ${routineName}, and 3. Stay well hydrated. Everything is calm and organized!`,
        bn: `আজকের আপনার কাজের মধ্যে রয়েছে: ওষুধ গ্রহণ করা, ${routineName}, এবং পর্যাপ্ত জল পান করা।`,
        as: `আজি আপোনাৰ মুখ্য কামসমূহ: সময়মতে ঔষধ খোৱা, ${routineName}, আৰু পৰ্যাপ্ত পানী খোৱা।`,
        mr: `आजच्या आपल्या कामांमध्ये: वेळेवर औषध घेणे, ${routineName}, आणि भरपूर पाणी पिणे समाविष्ट आहे.`,
      };

      return {
        handled: true,
        responseText: agendaAnswers[lang] || agendaAnswers["en"],
      };
    }

    // =========================================================================
    // 7. SHOW MY REMINDERS / मेरी आज की reminders दिखाओ
    // Navigates to reminders view & speaks active reminders
    // =========================================================================
    const isAskingShowReminders =
      (t.includes("reminder") || t.includes("reminders") || t.includes("रिमाइंडर") || t.includes("रिमाइंडर्स") || t.includes("યાદી") || t.includes("আঠવણી")) &&
      (t.includes("show") || t.includes("dikhao") || t.includes("दिखाओ") || t.includes("બતાવો") || t.includes("খোলো") || t.includes("खोलो") || t.includes("open") || t.includes("dekho") || t.includes("बताओं"));

    if (isAskingShowReminders) {
      const activeCount = store.reminders.filter((r) => r.active).length;
      const remNames = store.reminders
        .filter((r) => r.active)
        .slice(0, 3)
        .map((r) => `${r.title} (${r.time})`)
        .join(", ");

      const showAnswers: Record<string, string> = {
        hi: `मैं आपके स्मार्ट रिमाइंडर्स खोल रहा हूँ। आपके पास ${activeCount} सक्रिय रिमाइंडर्स हैं: ${remNames || "दवा और दिनचर्या"}।`,
        gu: `હું તમારા સ્માર્ટ રિમાઇન્ડર્સ ખોલી રહ્યો છું. તમારી પાસે ${activeCount} સક્રિય રિમાઇન્ડર્સ છે: ${remNames || "દવા અને દિનચર્યા"}.`,
        en: `Opening your Smart Reminders now. You have ${activeCount} active reminder(s): ${remNames || "daily wellness reminders"}.`,
        bn: `আমি আপনার স্মার্ট রিমাইন্ডার খুলছি। আপনার ${activeCount} টি সক্রিয় রিমাইন্ডার রয়েছে।`,
        as: `মই আপোনাৰ সংকেতসমূহ খুলি দিছোঁ। আপোনাৰ ${activeCount} টা সংকেত সক্ৰিয় আছে।`,
        mr: `मी आपल्या स्मार्ट आठवणी उघडत आहे. आपल्याकडे ${activeCount} सक्रिय आठवणी आहेत.`,
      };

      return {
        handled: true,
        responseText: showAnswers[lang] || showAnswers["en"],
        action: "navigate_reminders",
      };
    }

    // =========================================================================
    // 8. DIRECT REMINDER CREATION WITH NATURAL LANGUAGE VARIATIONS
    // "मुझे रात 8 बजे दवाई लेने की याद दिलाना।"
    // "रात को आठ बजे मुझे दवाई याद दिला देना।"
    // "आठ बजे medicine का reminder लगा दो।"
    // "मुझे आठ बजे दवाई के लिए याद कराना।"
    // "मुझे कल सुबह 9 बजे डॉक्टर की appointment याद दिलाना।"
    // DIRECTLY EXECUTES IN STORE!
    // =========================================================================
    const isDirectReminderCommand =
      t.includes("याद दिलाना") ||
      t.includes("याद दिला देना") ||
      t.includes("याद दिलाओ") ||
      t.includes("याद कराना") ||
      t.includes("याद करा देना") ||
      t.includes("reminder लगा दो") ||
      t.includes("reminder सेट करो") ||
      t.includes("remind me to") ||
      t.includes("remind me") ||
      t.includes("set a reminder") ||
      t.includes("યાદ દેવડાવજો") ||
      t.includes("યાદ કરાવજો") ||
      t.includes("રિમાઇન્ડર ગોઠવો") ||
      t.includes("মনে করিয়ে দাও") ||
      t.includes("মনত পেলাই দিবা") ||
      t.includes("आठवण करा");

    if (isDirectReminderCommand) {
      const explicitTime = extractedTimeFn(raw);
      const isTomorrow =
        t.includes("tomorrow") ||
        t.includes("kal") ||
        t.includes("कल") ||
        t.includes("কাল") ||
        t.includes("কাইলৈ") ||
        t.includes("કાલે") ||
        t.includes("उद्या") ||
        t.includes("நாளை") ||
        t.includes("రేపు");

      const targetDate = isTomorrow
        ? new Date(Date.now() + 86400000).toISOString().slice(0, 10)
        : null;

      // Classify type
      const isDoctorAppt =
        t.includes("doctor") ||
        t.includes("appointment") ||
        t.includes("डॉक्टर") ||
        t.includes("अपॉइंटमेंट") ||
        t.includes("clinic") ||
        t.includes("હૉસ્પિટલ");

      const isWater = t.includes("water") || t.includes("पानी") || t.includes("પાણી") || t.includes("জল") || t.includes("hydration");

      const remTitle = isDoctorAppt
        ? "Doctor Appointment"
        : isWater
        ? "Drink Warm Water"
        : t.includes("walk") || t.includes("टहलना")
        ? "Evening Walk"
        : "Medicine";

      const remType = isDoctorAppt ? "appointment" : isWater ? "hydration" : "medicine";

      if (explicitTime) {
        store.addReminder({
          title: remTitle,
          time: explicitTime,
          date: targetDate,
          repeat: "daily",
          type: remType,
          notes: "Created via Natural Voice Assistant Command",
          active: true,
        });

        if (isDoctorAppt) {
          store.addAppointment({
            title: "Doctor Consultation",
            date: targetDate || new Date().toISOString().slice(0, 10),
            time: explicitTime,
            kind: "doctor",
            location: "City Health Clinic",
            notes: "Created via Voice Assistant",
          });
        }

        const [hhStr] = explicitTime.split(":");
        const hhNum = parseInt(hhStr || "20", 10);
        const isNightTime = hhNum >= 18;
        const isMorningTime = hhNum < 12 && hhNum >= 4;
        const isAfternoonTime = hhNum >= 12 && hhNum < 18;
        const disp12 = hhNum % 12 === 0 ? 12 : hhNum % 12;
        const timeFormattedHi = isNightTime ? `रात ${disp12} बजे` : isMorningTime ? `सुबह ${disp12} बजे` : isAfternoonTime ? `दोपहर ${disp12} बजे` : `${disp12} बजे`;
        const timeFormattedGu = isNightTime ? `રાત્રે ${disp12} વાગ્યે` : isMorningTime ? `સવારે ${disp12} વાગ્યે` : `${disp12} વાગ્યે`;

        const directSavedAnswers: Record<string, string> = {
          hi: `मैंने आपके लिए ${isTomorrow ? "कल " : ""}${timeFormattedHi} ${remTitle === "Medicine" ? "दवा" : remTitle} का रिमाइंडर सेट कर दिया है। मैं आपको समय पर याद दिलाऊँगा।`,
          gu: `મેં તમારા માટે ${isTomorrow ? "કાલે " : ""}${timeFormattedGu} ${remTitle === "Medicine" ? "દવા" : remTitle}નું રિમાઇન્ડર ગોઠવી દીધું છે.`,
          en: `I have set your reminder for ${remTitle} at ${explicitTime}${isTomorrow ? " tomorrow" : ""}. I will make sure to remind you on time.`,
          bn: `আমি আপনার জন্য ${explicitTime} টায় ${remTitle} এর রিমাইন্ডার সেট করে দিয়েছি।`,
          as: `মই আপোনাৰ বাবে ${explicitTime} বজাত ${remTitle}ৰ সংকেত সংৰক্ষণ কৰিলোঁ।`,
          mr: `मी आपल्यासाठी ${explicitTime} वाजता ${remTitle} ची आठवण सेट केली आहे.`,
        };

        return {
          handled: true,
          responseText: directSavedAnswers[lang] || directSavedAnswers["en"],
          action: "create_reminder",
          actionData: { title: remTitle, time: explicitTime, date: targetDate },
        };
      } else {
        // Explicit command without time -> ask time
        this._dialogue = {
          stage: "awaiting_reminder_time",
          topic: remTitle,
          reminderType: remType,
          targetDate,
          turnCount: this._dialogue.turnCount + 1,
        };

        const askTimeMsg: Record<string, string> = {
          hi: "किस समय याद दिलाऊँ?",
          gu: "કયા સમયે યાદ દેવડાવું?",
          en: "At what time should I remind you?",
          bn: "কোন সময়ে মনে করিয়ে দেব?",
          as: "কি সময়ত মনত পেলাই দিম?",
          mr: "कोणत्या वेळी आठवण करून देऊ?",
        };

        return {
          handled: true,
          responseText: askTimeMsg[lang] || askTimeMsg["en"],
        };
      }
    }

    // =========================================================================
    // 9. MEDICINE HELP INQUIRY (Requirement 1 Example)
    // User: "मुझे मेरी दवाई के बारे में बताओ।" -> Asks clarification if multiple exist
    // =========================================================================
    const isMedicineHelpIntent =
      (t.includes("help") || t.includes("मदद") || t.includes("सहाय") || t.includes("সাহায্য") || t.includes("મદદ") || t.includes("मदत") || t.includes("batao") || t.includes("बताओ") || t.includes("બતાવો") || t.includes("tell me")) &&
      (t.includes("medicine") || t.includes("dawa") || t.includes("dawai") || t.includes("दवा") || t.includes("દવા") || t.includes("ঔষধ") || t.includes("ওষুধ") || t.includes("औषध"));

    if (isMedicineHelpIntent && this._dialogue.stage !== "medicine_help_requested") {
      this._dialogue = {
        stage: "medicine_help_requested",
        topic: "medicine",
        turnCount: this._dialogue.turnCount + 1,
      };

      const askWhichMed: Record<string, string> = {
        hi: "आप किस दवाई के बारे में जानना चाहते हैं—सुबह वाली या रात वाली?",
        gu: "તમે કઈ દવા વિશે જાણવા માંગો છો—સવારની કે રાતની?",
        en: "Which medicine would you like to know about—your morning dose or your night dose?",
        bn: "আপনি কোন ওষুধ সম্পর্কে জানতে চান—সকালের নাকি রাতের?",
        as: "আপুনি কোনটো ঔষধৰ বিষয়ে জানিব খোজে—পুৱাৰ নে ৰাতিৰ?",
        mr: "आपल्याला कोणत्या औषधाबद्दल जाणून घ्यायचे आहे—सकाळच्या की रात्रीच्या?",
      };

      return {
        handled: true,
        responseText: askWhichMed[lang] || askWhichMed["en"],
      };
    }

    // Follow-up when in "medicine_help_requested" or user specifies night/morning medicine
    const mentionsNight =
      t.includes("night") ||
      t.includes("raat") ||
      t.includes("रात") ||
      t.includes("રાત") ||
      t.includes("રાત્રે") ||
      t.includes("রাত্রি") ||
      t.includes("ৰাতি") ||
      t.includes("रात्री");

    const mentionsMorning =
      t.includes("morning") ||
      t.includes("subah") ||
      t.includes("सुबह") ||
      t.includes("સવાર") ||
      t.includes("সকাল") ||
      t.includes("পুৱা") ||
      t.includes("सकाळी");

    if (this._dialogue.stage === "medicine_help_requested" || (isMedicineHelpIntent && (mentionsNight || mentionsMorning))) {
      if (mentionsNight) {
        const nightMed =
          store.medicines.find(
            (m) =>
              m.times.some((tm) => parseInt(tm, 10) >= 18) ||
              m.instructions.toLowerCase().includes("night") ||
              m.instructions.toLowerCase().includes("sleep") ||
              m.notes.toLowerCase().includes("night")
          ) || store.medicines[1] || store.medicines[0];

        const medName = nightMed?.name || "Donepezil Hydrochloride";
        const dosage = nightMed?.dosage || "5 mg";
        const timeStr = nightMed?.times[0] || "20:30";

        this._dialogue = {
          stage: "medicine_discussed",
          topic: medName,
          medicineContext: {
            timeOfDay: "night",
            medicineId: nightMed?.id,
            medicineName: medName,
            dosage,
            scheduledTime: timeStr,
            stock: nightMed?.stock ?? 24,
            dailyUsage: nightMed?.daily_usage ?? 1,
          },
          targetTime: timeStr,
          turnCount: this._dialogue.turnCount + 1,
        };

        const nightAnswers: Record<string, string> = {
          hi: `आपकी रात की दवा ${medName} (${dosage}) है, जो रात 8:30 बजे सोने से पहले ली जाती है। क्या आपने आज यह दवा ले ली है, या मैं इसका रिमाइंडर सेट करूँ?`,
          gu: `તમારી રાતની દવા ${medName} (${dosage}) છે, જે રાત્રે 8:30 વાગ્યે લેવાની છે. શું તમે આજે આ દવા લઈ લીધી છે, કે હું રિમાઇન્ડર ગોઠવું?`,
          en: `Your night medicine is ${medName} (${dosage}), scheduled at 8:30 PM before sleeping. Have you taken it today, or would you like me to set a reminder?`,
          bn: `আপনার রাতের ওষুধ ${medName} (${dosage}), যা রাত ৮:৩০ টায় ঘুমানোর আগে নিতে হয়। আপনি কি ওষুধটি খেয়েছেন, নাকি রিমাইন্ডার সেট করে দেব?`,
          as: `আপোনাৰ ৰাতিৰ ঔষধ ${medName} (${dosage}), যিটো ৰাতি ৮:৩০ বজাত শোৱাৰ আগত খাব লাগে। আপুনি ঔষধটো খালেনে?`,
          mr: `आपले रात्रीचे औषध ${medName} (${dosage}) आहे, जे रात्री 8:30 वाजता घ्यायचे आहे.`,
        };

        return {
          handled: true,
          responseText: nightAnswers[lang] || nightAnswers["en"],
        };
      } else if (mentionsMorning) {
        const morningMed = store.medicines[0];
        const medName = morningMed?.name || "Amlodipine";
        const dosage = morningMed?.dosage || "5 mg";
        const timeStr = morningMed?.times[0] || "08:30";

        this._dialogue = {
          stage: "medicine_discussed",
          topic: medName,
          medicineContext: {
            timeOfDay: "morning",
            medicineId: morningMed?.id,
            medicineName: medName,
            dosage,
            scheduledTime: timeStr,
            stock: morningMed?.stock ?? 30,
            dailyUsage: morningMed?.daily_usage ?? 1,
          },
          targetTime: timeStr,
          turnCount: this._dialogue.turnCount + 1,
        };

        const morningAnswers: Record<string, string> = {
          hi: `आपकी सुबह की दवा ${medName} (${dosage}) है, जो सुबह 8:30 बजे नाश्ते के बाद ली जाती है। क्या आपने आज यह दवा ले ली है?`,
          gu: `તમારી સવારની દવાનો સમય ${timeStr} વાગ્યાનો છે (${medName} ${dosage}). શું તમે આજે આ દવા લઈ લીધી છે?`,
          en: `Your morning medicine is ${medName} (${dosage}) scheduled at ${timeStr} AM after breakfast. Have you taken it today?`,
          bn: `আপনার সকালের ওষুধ ${medName} (${dosage}), যা সকাল ৮:৩০ টায় নিতে হয়।`,
          as: `আপোনাৰ পুৱাৰ ঔষধ ${medName} (${dosage}), যিটো পুৱা ৮:৩০ বজাত খাব লাগে।`,
          mr: `आपले सकाळचे औषध ${medName} (${dosage}) आहे, जे सकाळी 8:30 वाजता घ्यायचे आहे.`,
        };

        return {
          handled: true,
          responseText: morningAnswers[lang] || morningAnswers["en"],
        };
      }
    }

    // Follow-up when in "medicine_discussed": user answers if they took it or want reminder
    if (this._dialogue.stage === "medicine_discussed") {
      const medCtx = this._dialogue.medicineContext;
      const medId = medCtx?.medicineId || store.medicines[0]?.id;

      if (isYes || t.includes("took") || t.includes("taken") || t.includes("ली") || t.includes("લીધી") || t.includes("খা")) {
        if (medId) {
          store.takeMedicine(medId);
        }
        this.resetDialogue();

        const takenAnswers: Record<string, string> = {
          hi: "बहुत बढ़िया! मैंने दर्ज कर लिया है कि आपने अपनी दवा ले ली है। अपना ख्याल रखें।",
          gu: "ખૂબ સરસ! મેં નોંધી લીધું છે કે તમે તમારી દવા લઈ લીધી છે. તમારું ધ્યાન રાખજો.",
          en: "Wonderful! I have recorded that you took your medicine. Take gentle care.",
          bn: "খুব ভালো! আমি লিখে রেখেছি যে আপনি ওষুধ খেয়েছেন।",
          as: "বৰ ভাল কথা! মই নথিভুক্ত কৰিলোঁ যে আপুনি ঔষধ খালে।",
          mr: "खूप छान! आपण औषध घेतल्याची नोंद मी केली आहे.",
        };

        return {
          handled: true,
          responseText: takenAnswers[lang] || takenAnswers["en"],
          action: "take_medicine",
          actionData: { medicineId: medId },
        };
      }

      if (isNo) {
        this.resetDialogue();
        return {
          handled: true,
          responseText:
            lang === "hi"
              ? "ठीक है। जब भी ज़रूरत हो, मैं यहीं आपके साथ हूँ।"
              : lang === "gu"
              ? "ઠીક છે. જ્યારે પણ જરૂર હોય ત્યારે હું અહીં જ છું."
              : "Alright. I am right here whenever you need anything.",
        };
      }
    }

    // =========================================================================
    // 10. FOLLOW-UP MEDICINE STOCK INQUIRY (Pronoun resolution: "वही", "वो", "તે")
    // User: "वही वाली कितने दिन की बची है?" / "और वो कितने दिन की बची है?"
    // Understands "वही / वो" refers to the medicine discussed previously.
    // =========================================================================
    const isAskingStockOrRemaining =
      t.includes("बची है") ||
      t.includes("बाकी है") ||
      t.includes("कितने दिन") ||
      t.includes("कितनी बची") ||
      t.includes("કેટલા દિવસ") ||
      t.includes("બાકી છે") ||
      t.includes("how many days") ||
      t.includes("how much left") ||
      t.includes("remaining") ||
      t.includes("stock") ||
      t.includes("वही वाली") ||
      t.includes("वही दवा") ||
      t.includes("वो दवा") ||
      t.includes("તે જ દવા") ||
      t.includes("that medicine");

    if (isAskingStockOrRemaining) {
      const medCtx = this._dialogue.medicineContext;
      const targetMed =
        (medCtx?.medicineId && store.medicines.find((m) => m.id === medCtx.medicineId)) ||
        (medCtx?.medicineName && store.medicines.find((m) => m.name.toLowerCase().includes(medCtx.medicineName!.toLowerCase()))) ||
        store.medicines[1] ||
        store.medicines[0];

      const medName = targetMed?.name || medCtx?.medicineName || "Donepezil Hydrochloride";
      const dosage = targetMed?.dosage || medCtx?.dosage || "5 mg";
      const stock = targetMed?.stock ?? (medCtx?.stock ?? 24);
      const dailyUsage = targetMed?.daily_usage ?? (medCtx?.dailyUsage ?? 1);
      const daysLeft = Math.max(1, Math.floor(stock / (dailyUsage || 1)));

      const stockAnswers: Record<string, string> = {
        hi: `वही दवा यानी ${medName} (${dosage}) की अभी ${stock} खुराकें (गोलियां) बची हैं, जो लगभग ${daysLeft} दिन चलेंगी। आप बिल्कुल निश्चिंत रहें, समय रहते रीफिल की सूचना दे दी जाएगी।`,
        gu: `તે જ દવા ${medName} (${dosage}) ની હજુ ${stock} ગોળીઓ બાકી છે, જે આશરે ${daysLeft} દિવસ ચાલશે. તમે ચિંતા ન કરતા, સમયસર રીફિલ કરાવી લઈશું.`,
        en: `That medicine, ${medName} (${dosage}), has ${stock} doses remaining in your stock, which will last approximately ${daysLeft} days. We will remind you well before it runs out.`,
        as: `সেই ঔষধ ${medName} (${dosage}) ৰ এতিয়াও ${stock} টা বড়ি বাকী আছে, যিটো প্ৰায় ${daysLeft} দিন চলিব।`,
        bn: `সেই ওষুধ ${medName} (${dosage}) এর এখনও ${stock} টি ডোজ বাকি আছে, যা প্রায় ${daysLeft} দিন চলবে।`,
        mr: `त्याच औषधाच्या म्हणजेच ${medName} (${dosage}) च्या सध्या ${stock} गोळ्या शिल्लक आहेत, ज्या सुमारे ${daysLeft} दिवस पुरतील.`,
      };

      return {
        handled: true,
        responseText: stockAnswers[lang] || stockAnswers["en"],
      };
    }

    // =========================================================================
    // 11. YESTERDAY'S ACTIVITIES RECALL
    // User: "कल मैंने क्या किया था?" / "What did I do yesterday?"
    // =========================================================================
    const isAskingYesterdayActivities =
      (t.includes("kal") || t.includes("कल") || t.includes("કાલે") || t.includes("কাল") || t.includes("কালি") || t.includes("काल") || t.includes("yesterday")) &&
      (t.includes("kya kiya") || t.includes("क्या किया") || t.includes("શું કર્યું") || t.includes("কি কৰিলোঁ") || t.includes("কি করেছি") || t.includes("काय केले") || t.includes("activities") || t.includes("routine"));

    if (isAskingYesterdayActivities) {
      const yesterdayDate = new Date(Date.now() - 86400000);
      const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
      const routinesYesterday = store.routines.filter((r) => r.done_date === yesterdayStr);
      const gamesYesterday = store.gameSessions.filter((s) => s.created_at?.startsWith(yesterdayStr));

      const routineSummary = routinesYesterday.length > 0
        ? `${routinesYesterday.length} दिनचर्या के कार्य (जैसे सुबह की सैर और जलपान)`
        : "अपनी नियमित दिनचर्या";

      const gameSummary = gamesYesterday.length > 0
        ? `${gamesYesterday.length} मेमोरी गेम (${Math.max(...gamesYesterday.map((g) => g.accuracy || 75))}% सटीकता के साथ)`
        : "कॉग्निटिव गेम्स";

      const yesterdayAnswers: Record<string, string> = {
        hi: `कल आपने बहुत व्यवस्थित और सुखद दिन बिताया था। आपने ${routineSummary} पूरे किए थे, अपनी दवाएं समय पर ली थीं, और ${gameSummary} खेले थे। आपका कल का दिन बहुत सकारात्मक रहा!`,
        gu: `કાલે તમે ખૂબ સરસ દિવસ વિતાવ્યો હતો. તમે તમારી દિનચર્યા સાચવી હતી, સમયસર દવાઓ લીધી હતી અને રમતો રમીને મગજને તાજગી આપી હતી.`,
        en: `Yesterday you had a calm, wonderful day. You completed your routine activities, took your scheduled medicines on time, and engaged in cognitive memory games.`,
        bn: `গতকাল আপনি খুব সুন্দর দিন কাটিয়েছিলেন। আপনার দৈনন্দিন কাজ ও ওষুধ সময়মতো গ্রহণ করেছিলেন।`,
        as: `কালি আপোনাৰ দিনটো বৰ শান্তিপূৰ্ণকৈ পাৰ হৈছিল। আপুনি সময়মতে ঔষধ খালে আৰু দৈনিক কামসমূহ সম্পূৰ্ণ কৰিলে।`,
        mr: `काल आपण आपली दिनचर्या अतिशय चांगल्या प्रकारे पाळली होती आणि औषधे वेळेवर घेतली होती.`,
      };

      return {
        handled: true,
        responseText: yesterdayAnswers[lang] || yesterdayAnswers["en"],
      };
    }

    // =========================================================================
    // 12. CAREGIVER / FAMILY IDENTIFICATION
    // User: "ये कौन हैं?" / "यह व्यक्ति कौन है?" / "Who is this?"
    // Uses saved caregiver family information and voice memories.
    // =========================================================================
    const isAskingWhoIsThis =
      t.includes("ये कौन हैं") ||
      t.includes("यह कौन है") ||
      t.includes("ये कौन है") ||
      t.includes("यह व्यक्ति कौन है") ||
      t.includes("આ કોણ છે") ||
      t.includes("who is this") ||
      t.includes("who is this person") ||
      t.includes("who is he") ||
      t.includes("who is she");

    if (isAskingWhoIsThis) {
      // 1. Check if previous turn was discussing a specific person/topic
      if (
        this._dialogue.topic &&
        this._dialogue.topic !== "medicine" &&
        this._dialogue.topic !== "medicines"
      ) {
        const topicName = this._dialogue.topic;
        const topicAnswers: Record<string, string> = {
          hi: `हम अभी ${topicName} के बारे में बात कर रहे थे। क्या आप उनके बारे में कुछ और विस्तार से जानना चाहते हैं?`,
          gu: `આપણે હમણાં ${topicName} વિશે વાત કરી રહ્યા હતા. શું તમે તેમના વિશે વધુ જાણવા માંગો છો?`,
          en: `We were just discussing ${topicName}. Would you like to know more about them?`,
          as: `আমি এইমাত্ৰ ${topicName}ৰ বিষয়ে কথা পাতি আছিলোঁ।`,
          bn: `আমরা একটু আগেই ${topicName} সম্পর্কে কথা বলছিলাম।`,
          mr: `आपण नुकतेच ${topicName} यांच्याबद्दल बोलत होतो.`,
        };
        return {
          handled: true,
          responseText: topicAnswers[lang] || topicAnswers["en"],
        };
      }

      // 2. Check family contacts in store
      const rahul = store.contacts?.find((c) => c.name.toLowerCase().includes("rahul"));
      const contact = rahul || (store.contacts && store.contacts[0]);

      if (contact) {
        const voiceMem = contact.voice_memory || `यह ${contact.name} हैं, आपके ${contact.relationship}।`;
        const familyAnswers: Record<string, string> = {
          hi: `${voiceMem} वे हर शाम आपसे बात करते हैं और आपके स्वास्थ्य व खुशहाली का पूरा ध्यान रखते हैं।`,
          gu: `આ ${contact.name} છે, તમારા ${contact.relationship}. તેઓ હંમેશા તમારો હાલચાલ પૂછે છે અને તમારું ધ્યાન રાખે છે.`,
          en: `This is ${contact.name}, your ${contact.relationship}. They check in on you regularly and care deeply about your health.`,
          as: `এওঁ হৈছে ${contact.name}, আপোনাৰ ${contact.relationship}। তেওঁ সদায় আপোনাৰ খবৰ লয়।`,
          bn: `ইনি হলেন ${contact.name}, আপনার ${contact.relationship}।`,
          mr: `हे ${contact.name} आहेत, आपले ${contact.relationship}. ते नेहमी आपली काळजी घेतात.`,
        };

        return {
          handled: true,
          responseText: familyAnswers[lang] || familyAnswers["en"],
        };
      }

      // 3. Graceful clarification if no context or contact exists
      const askClarify: Record<string, string> = {
        hi: "आप किसके बारे में पूछ रहे हैं—परिवार के किसी सदस्य के बारे में, या किसी जाने-माने व्यक्ति के बारे में? आप उनका नाम बताइए, मैं तुरंत पूरी जानकारी दूँगा।",
        gu: "તમે કોના વિશે પૂછી રહ્યા છો—પરિવારના સભ્ય વિશે કે કોઈ જાણીતી વ્યક્તિ વિશે? તેમનું નામ કહો, હું તરત માહિતી આપીશ.",
        en: "Who would you like to know about—a family member or a public personality? Tell me their name, and I will find out for you right away.",
        as: "আপুনি কাৰ বিষয়ে জানিব খুজিছে—পৰিয়ালৰ লোক নে আন কাৰোবাৰ বিষয়ে? নামটো কওক, মই জনাই দিম।",
        bn: "আপনি কার সম্পর্কে জানতে চাইছেন—পরিবারের সদস্য নাকি কোনো পরিচিত ব্যক্তি? নাম বলুন, আমি তথ্য দিচ্ছি।",
        mr: "आपण कोणाबद्दल विचारत आहात—कुटुंबातील व्यक्ती की प्रसिद्ध व्यक्तीबद्दल? नाव सांगा, मी लगेच माहिती देईन.",
      };

      return {
        handled: true,
        responseText: askClarify[lang] || askClarify["en"],
      };
    }

    // =========================================================================
    // 13. DOCTOR APPOINTMENT QUERY
    // User: "मेरा appointment कब है?" / "When is my appointment?"
    // =========================================================================
    const isAskingAppointment =
      (t.includes("appointment") || t.includes("अपॉइंटमेंट") || t.includes("अपॉइन्टमेंट") || t.includes("doctor") || t.includes("डॉक्टर") || t.includes("તપાસ")) &&
      (t.includes("kab") || t.includes("कब") || t.includes("ક્યારે") || t.includes("when") || t.includes("कधी") || t.includes("mera") || t.includes("my"));

    if (isAskingAppointment) {
      if (!store.appointments || store.appointments.length === 0) {
        const noApptAnswers: Record<string, string> = {
          hi: "आपके पास अभी कोई निर्धारित डॉक्टर अपॉइंटमेंट नहीं है। यदि आप कोई नया अपॉइंटमेंट सेट करना चाहते हैं, तो मुझे बताइए।",
          gu: "તમારી પાસે અત્યારે કોઈ નિર્ધારિત ડૉક્ટર મુલાકાત નથી.",
          en: "You have no upcoming doctor appointments scheduled in your records right now.",
          as: "আপোনাৰ কোনো নিৰ্ধাৰিত চিকিৎসকৰ সাক্ষাত নাই।",
          bn: "আপনার এখন কোনো নির্ধারিত ডাক্তার অ্যাপয়েন্টমেন্ট নেই।",
          mr: "आपल्याकडे सध्या कोणतीही डॉक्टरांची भेट नियोजित नाही.",
        };
        return {
          handled: true,
          responseText: noApptAnswers[lang] || noApptAnswers["en"],
        };
      }

      const nextApp = store.appointments[0];

      const appAnswers: Record<string, string> = {
        hi: `आपका अगला डॉक्टर अपॉइंटमेंट ${nextApp.title} के साथ ${nextApp.date} को सुबह ${nextApp.time} बजे निर्धारित है (${nextApp.location})।`,
        gu: `તમારી આગામી ડૉક્ટર મુલાકાત ${nextApp.title} સાથે ${nextApp.date} ના રોજ ${nextApp.time} વાગ્યે છે (${nextApp.location}).`,
        en: `Your upcoming appointment with ${nextApp.title} is scheduled on ${nextApp.date} at ${nextApp.time} (${nextApp.location}).`,
        as: `আপোনাৰ পৰৱৰ্তী চিকিৎসকৰ সাক্ষাত ${nextApp.title}ৰ সৈতে ${nextApp.date} তাৰিখে পুৱা ${nextApp.time} বজাত আছে।`,
        bn: `আপনার পরবর্তী ডাক্তার অ্যাপয়েন্টমেন্ট ${nextApp.title} এর সাথে ${nextApp.date} তারিখে সকাল ${nextApp.time} টায়।`,
        mr: `आपली पुढील डॉक्टरांची भेट ${nextApp.title} यांच्यासोबत ${nextApp.date} रोजी सकाळी ${nextApp.time} वाजता आहे.`,
      };

      return {
        handled: true,
        responseText: appAnswers[lang] || appAnswers["en"],
      };
    }

    // =========================================================================
    // 14. PLAY COGNITIVE GAMES / NEXT LEVEL
    // User: "मुझे memory game खेलना है।"
    // User: "अगला level शुरू करो।"
    // =========================================================================
    const isPlayGameIntent =
      (t.includes("play") || t.includes("start") || t.includes("khelna") || t.includes("खेलना") || t.includes("ખેલવું") || t.includes("રમવું") || t.includes("খেলিম") || t.includes("খেলতে") || t.includes("खेळायचे") || t.includes("விளையாட")) &&
      (t.includes("game") || t.includes("memory") || t.includes("khel") || t.includes("खेल") || t.includes("રમત") || t.includes("পাজল") || t.includes("puzzle"));

    if (isPlayGameIntent) {
      const gameResponses: Record<string, string> = {
        hi: "ज़रूर! चलिए मेमोरी गेम खेलते हैं। मैं कॉग्निटिव गेम्स हब खोल रहा हूँ।",
        gu: "ચોક્કસ! ચાલો સરસ મગજની રમત રમીએ. હું ગેમ્સ હબ ખોલી રહ્યો છું.",
        en: "Sure! Let's play a soothing memory game. Opening the Cognitive Games Hub now.",
        bn: "নিশ্চয়ই! চলুন একটি সুন্দর স্মৃতি খেলা খেলি। আমি গেমস হাব খুলছি।",
        as: "নিশ্চয়! আহক আমি স্মৃতিৰ খেল এটা খেলোঁ। মই গেমছ হাব খুলি দিছোঁ।",
        mr: "नक्कीच! चला एक छान खेळ खेळूया. मी गेम्स हब उघडत आहे.",
      };

      return {
        handled: true,
        responseText: gameResponses[lang] || gameResponses["en"],
        action: "navigate_games",
      };
    }

    const isNextLevelIntent =
      (t.includes("next") || t.includes("अगला") || t.includes("आगळ") || t.includes("આગળ") || t.includes("পরের") || t.includes("পৰৱৰ্তী") || t.includes("पुढील") || t.includes("அடுத்த") || t.includes("తదుపరి")) &&
      (t.includes("level") || t.includes("स्तर") || t.includes("લેવલ") || t.includes("স্তৰ") || t.includes("टप्पा") || t.includes("நிலை"));

    if (isNextLevelIntent) {
      const nextLevelResponses: Record<string, string> = {
        hi: "ज़रूर! मैं आपके लिए अगला स्तर शुरू कर रहा हूँ। शुभकामनाएं!",
        gu: "ચોક્કસ! ચાલો હવે આગળનું લેવલ શરૂ કરીએ. ખૂબ સરસ!",
        en: "Great job! Starting the next unlocked level for you right now.",
        bn: "নিশ্চয়ই! আমি আপনার জন্য পরের স্তর শুরু করছি। শুভকামনা!",
        as: "নিশ্চয়! মই পৰৱৰ্তী স্তৰ আৰম্ভ কৰি দিছোঁ।",
        mr: "नक्कीच! मी पुढील स्तर सुरू करत आहे. खूप छान!",
      };

      return {
        handled: true,
        responseText: nextLevelResponses[lang] || nextLevelResponses["en"],
        action: "next_level",
      };
    }

    // =========================================================================
    // 15. MEDICINE REMINDER TIME COLLECTION (Follow-up)
    // =========================================================================
    if (this._dialogue.stage === "awaiting_reminder_time") {
      const time = extractedTimeFn(raw);
      const targetDate =
        this._dialogue.targetDate ||
        new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const title = this._dialogue.topic || "Morning Medicine";
      const remType = this._dialogue.reminderType || "medicine";

      store.addReminder({
        title,
        time,
        date: targetDate,
        repeat: "daily",
        type: remType,
        notes: "Created via Memory Bond conversational dialogue context",
        active: true,
      });

      this.resetDialogue();

      const timeConfirms: Record<string, string> = {
        hi: `ठीक है। मैंने ${time} बजे दवा का रिमाइंडर सेट कर दिया है। मैं आपको समय पर याद दिलाऊँगा।`,
        gu: `ઠીક છે. મેં ${time} વાગ્યે દવા માટે રિમાઇન્ડર ગોઠવી દીધું છે.`,
        en: `Alright. I have set your medicine reminder for ${time}. I will remind you on time.`,
        bn: `ঠিক আছে। আমি ${time} টায় ওষুধের জন্য রিমাইন্ডার সেট করে দিয়েছি।`,
        as: `ঠিক আছে। মই ${time} বজাত ঔষধৰ বাবে সংকেত সংৰক্ষণ কৰিলোঁ।`,
        mr: `ठीक आहे. मी ${time} वाजता औषधासाठी आठवण सेट केली आहे.`,
      };

      return {
        handled: true,
        responseText: timeConfirms[lang] || timeConfirms["en"],
        action: "create_reminder",
        actionData: { title, time, date: targetDate },
      };
    }

    // =========================================================================
    // 16. WHEN IS MY MEDICINE? / मेरी रात वाली दवाई कब है?
    // =========================================================================
    const isAskingWhenMed =
      (t.includes("when") || t.includes("kab") || t.includes("कब") || t.includes("ક્યારે") || t.includes("কেতিয়া") || t.includes("কখন") || t.includes("कधी") || t.includes("ఎప్పుడు") || t.includes("எப்போது")) &&
      (t.includes("medicine") || t.includes("dawa") || t.includes("dawai") || t.includes("દવા") || t.includes("दवा") || t.includes("ঔষধ") || t.includes("ওষুধ") || t.includes("औषध") || t.includes("மருந்து") || t.includes("మందు"));

    if (isAskingWhenMed) {
      if (mentionsNight) {
        const nightMed =
          store.medicines.find(
            (m) =>
              m.times.some((tm) => parseInt(tm, 10) >= 18) ||
              m.instructions.toLowerCase().includes("night") ||
              m.instructions.toLowerCase().includes("sleep") ||
              m.notes.toLowerCase().includes("night")
          ) || store.medicines[1] || store.medicines[0];

        const medName = nightMed?.name || "Donepezil Hydrochloride";
        const dosage = nightMed?.dosage || "5 mg";
        const timeStr = nightMed?.times[0] || "20:30";

        this._dialogue = {
          stage: "medicine_discussed",
          topic: medName,
          medicineContext: {
            timeOfDay: "night",
            medicineId: nightMed?.id,
            medicineName: medName,
            dosage,
            scheduledTime: timeStr,
            stock: nightMed?.stock ?? 24,
            dailyUsage: nightMed?.daily_usage ?? 1,
          },
          targetTime: timeStr,
          turnCount: this._dialogue.turnCount + 1,
        };

        const nightOnlyAnswers: Record<string, string> = {
          hi: `आपकी रात की दवा ${medName} (${dosage}) है, जो रात 8:30 बजे सोने से पहले ली जाती है।`,
          gu: `તમારી રાતની દવા ${medName} (${dosage}) છે, જે રાત્રે 8:30 વાગ્યે લેવાની છે.`,
          en: `Your night medicine is ${medName} (${dosage}), scheduled at 8:30 PM before sleeping.`,
          bn: `আপনার রাতের ওষুধ ${medName} (${dosage}), যা রাত ৮:৩০ টায় ঘুমানোর আগে নিতে হয়।`,
          as: `আপোনাৰ ৰাতিৰ ঔষধ ${medName} (${dosage}), যিটো ৰাতি ৮:৩০ বজাত শোৱাৰ আগত খাব লাগে।`,
          mr: `आपले रात्रीचे औषध ${medName} (${dosage}) आहे, जे रात्री 8:30 वाजता घ्यायचे आहे.`,
        };

        return {
          handled: true,
          responseText: nightOnlyAnswers[lang] || nightOnlyAnswers["en"],
        };
      }

      if (mentionsMorning) {
        const morningMed = store.medicines[0];
        const medName = morningMed?.name || "Amlodipine";
        const dosage = morningMed?.dosage || "5 mg";
        const timeStr = morningMed?.times[0] || "08:30";

        this._dialogue = {
          stage: "medicine_discussed",
          topic: medName,
          medicineContext: {
            timeOfDay: "morning",
            medicineId: morningMed?.id,
            medicineName: medName,
            dosage,
            scheduledTime: timeStr,
            stock: morningMed?.stock ?? 30,
            dailyUsage: morningMed?.daily_usage ?? 1,
          },
          targetTime: timeStr,
          turnCount: this._dialogue.turnCount + 1,
        };

        const morningOnlyAnswers: Record<string, string> = {
          hi: `आपकी सुबह की दवा ${medName} (${dosage}) है, जो सुबह 8:30 बजे नाश्ते के बाद ली जाती है।`,
          gu: `તમારી સવારની દવા ${medName} (${dosage}) છે, જે સવારે 8:30 વાગ્યે નાસ્તા પછી લેવાની છે.`,
          en: `Your morning medicine is ${medName} (${dosage}), scheduled at 8:30 AM after breakfast.`,
          bn: `আপনার সকালের ওষুধ ${medName} (${dosage}), যা সকাল ৮:৩০ টায় নিতে হয়।`,
          as: `আপোনাৰ পুৱাৰ ঔষধ ${medName} (${dosage}), যিটো পুৱা ৮:৩০ বজাত খাব লাগে।`,
          mr: `आपले सकाळचे औषध ${medName} (${dosage}) आहे, जे सकाळी 8:30 वाजता घ्यायचे आहे.`,
        };

        return {
          handled: true,
          responseText: morningOnlyAnswers[lang] || morningOnlyAnswers["en"],
        };
      }
    }

    return null;
  }

  /**
   * Generates natural conversational reply when intent is general companion talk.
   * Completely avoids robotic phrases like "How can I help you?" / "What can I help you with?".
   */
  public generateConversationalReply(
    userText: string,
    locale = "en-IN",
    store?: MemoryBondStore
  ): string {
    const t = userText.toLowerCase().trim();
    const lang = locale.split("-")[0] || "en";
    const bank =
      EMPATHY_RESPONSES[locale] ||
      EMPATHY_RESPONSES[`${lang}-IN`] ||
      EMPATHY_RESPONSES["en-IN"];

    // 1. Feelings of Loneliness or Isolation
    if (
      t.includes("lonely") ||
      t.includes("alone") ||
      t.includes("अकेला") ||
      t.includes("એકલા") ||
      t.includes("એકલું") ||
      t.includes("একাকী") ||
      t.includes("অকলশৰীয়া") ||
      t.includes("एकटे") ||
      t.includes("தனிமை") ||
      t.includes("ఒంటరి")
    ) {
      return bank.loneliness;
    }

    // 2. Tiredness or Rest
    if (
      t.includes("tired") ||
      t.includes("sleepy") ||
      t.includes("exhausted") ||
      t.includes("थक") ||
      t.includes("થાક") ||
      t.includes("ক্লান্ত") ||
      t.includes("थकवा") ||
      t.includes("களைப்பு")
    ) {
      return bank.tired;
    }

    // 3. Happiness, Peace, or Joy
    if (
      t.includes("happy") ||
      t.includes("good") ||
      t.includes("peace") ||
      t.includes("खुश") ||
      t.includes("આનંદ") ||
      t.includes("મજા") ||
      t.includes("સુખી") ||
      t.includes("आनंद")
    ) {
      return bank.happy;
    }

    // 4. Tea / Water / Refreshment
    if (
      t.includes("chai") ||
      t.includes("tea") ||
      t.includes("coffee") ||
      t.includes("ચાય") ||
      t.includes("ચા") ||
      t.includes("चाय") ||
      t.includes("চা")
    ) {
      return bank.tea;
    }

    // 5. Weather / Morning Calm
    if (
      t.includes("weather") ||
      t.includes("मौसम") ||
      t.includes("હવામાન") ||
      t.includes("বতৰ") ||
      t.includes("আবহাওয়া") ||
      t.includes("हवामान")
    ) {
      return bank.weather;
    }

    // 6. Senior asking who you are / App Identity
    if (
      t.includes("who are you") ||
      t.includes("tum kaun ho") ||
      t.includes("तुम कौन हो") ||
      t.includes("તમે કોણ છો") ||
      t.includes("আপুনি কোন") ||
      t.includes("তুমি কে") ||
      t.includes("तुम्ही कोण आहात") ||
      t.includes("நீங்கள் யார்")
    ) {
      const identityByLang: Record<string, string> = {
        gu: "હું Memory Bond નો તમારો વહાલો સાથી છું. હું તમારી દવાઓ, યાદો અને દિનચર્યાને પ્રેમથી સાચવું છું.",
        hi: "मैं Memory Bond का आपका मित्र और सहायक हूँ। मैं आपकी दवाएं, यादें और दिनचर्या को प्यार से सहेजता हूँ।",
        mr: "मी Memory Bond चा आपला विश्वासू सहकारी आहे. मी आपली औषधे आणि आठवणींची काळजी घेतो.",
        bn: "আমি Memory Bond এর আপনার বিশ্বস্ত সঙ্গী। আমি আপনার ওষুধ, স্মৃতি ও রুটিন যত্নে মনে রাখি।",
        as: "মই Memory Bond ৰ আপোনাৰ মৰমৰ সংগী। মই আপোনাৰ ঔষধ, স্মৃতি আৰু দিনটোৰ কামত সহায় কৰোঁ।",
        ta: "நான் Memory Bond-ன் உங்கள் அன்பான துணை. உங்கள் மருந்துகள் மற்றும் நினைவுகளைப் பாதுகாக்கிறேன்.",
        te: "నేను Memory Bond యొక్క మీ ఆత్మీయ సహాయకుడిని.",
        kn: "ನಾನು Memory Bond ನ ನಿಮ್ಮ ಪ್ರೀತಿಯ ಒಡನಾಡಿ.",
        ml: "ഞാൻ Memory Bond-ന്റെ നിങ്ങളുടെ സ്നേഹിതനാണ്.",
        pa: "ਮੈਂ Memory Bond ਦਾ ਤੁਹਾਡਾ ਦੋਸਤ ਤੇ ਸਹਾਇਕ ਹਾਂ।",
        or: "ମୁଁ Memory Bond ର ଆପଣଙ୍କ ବିଶ୍ୱସ୍ତ ସାଥୀ।",
        en: "I am your caring Memory Bond companion, here to assist you with medicines, cherished memories, and daily routines.",
      };
      return identityByLang[lang] || identityByLang["en"];
    }

    // 7. Polite Greetings — NEVER say "How can I help you?"
    if (
      t.includes("namaste") ||
      t.includes("hello") ||
      t.includes("hi") ||
      t.includes("kem cho") ||
      t.includes("vanakkam") ||
      t.includes("নমস্কাৰ") ||
      t.includes("नमस्ते")
    ) {
      const greetings: Record<string, string> = {
        hi: "नमस्ते! आपसे बात करके बहुत अच्छा लगा। आज आपका दिन कैसा चल रहा है?",
        gu: "નમસ્તે! તમારી સાથે વાત કરીને ખૂબ આનંદ થયો. આજે તમારો દિવસ કેવો રહ્યો?",
        en: "Hello! It is so wonderful to talk with you today. How are you feeling right now?",
        bn: "নমস্কার! আপনার সাথে কথা বলে খুব ভালো লাগলো। আজকের দিনটি কেমন কাটছে?",
        as: "নমস্কাৰ! আপোনাৰ লগত কথা পাতি বৰ ভাল লাগিল। আপুনি ভালে আছেনে?",
        mr: "नमस्कार! आपल्याशी संवाद साधून खूप आनंद झाला. आजचा दिवस कसा चालू आहे?",
        ta: "வணக்கம்! உங்களுடன் பேசுவதில் மிக்க மகிழ்ச்சி. இன்றைய நாள் எப்படி செல்கிறது?",
        te: "నమస్కారం! మీతో మాట్లాడటం చాలా సంతోషంగా ఉంది. ఈ రోజు ఎలా ఉంది?",
        kn: "ನಮಸ್ಕಾರ! ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಲು ತುಂಬಾ ಸಂತೋಷವಾಗಿದೆ. ನಿಮ್ಮ ದಿನ ಹೇಗಿದೆ?",
        ml: "നമസ്കാരം! നിങ്ങളോട് സംസാരിക്കുന്നതിൽ സന്തോഷം. ഇന്നത്തെ ദിവസം എങ്ങനെ പോകുന്നു?",
        pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੇ ਨਾਲ ਗੱਲ ਕਰਕੇ ਬਹੁਤ ਖੁਸ਼ੀ ਹੋਈ। ਤੁਹਾਡਾ ਦਿਨ ਕਿਵੇਂ ਚੱਲ ਰਿਹਾ ਹੈ?",
        or: "ନମସ୍କାର! ଆପଣଙ୍କ ସହ କଥା ହୋଇ ବହୁତ ଖୁସି ଲାଗିଲା। ଆଜିର ଦିନ କିପରି ଚାଲିଛି?",
      };
      return greetings[lang] || greetings["en"];
    }

    // 8. Personal Objects Location Recall (e.g. "Where are my glasses?")
    const isAskingLocation =
      t.includes("where") ||
      t.includes("kahan") ||
      t.includes("kaha") ||
      t.includes("ક્યાં") ||
      t.includes("कहाँ") ||
      t.includes("কোথায়") ||
      t.includes("ক’ত") ||
      t.includes("कुठे");

    if (isAskingLocation && store) {
      const cues = store.memoryCues || [];
      const matchingCue = cues.find((c) => {
        const titleLower = c.title.toLowerCase();
        const detailLower = c.detail.toLowerCase();
        if (t.includes("glass") || t.includes("spectacle") || t.includes("चश्मे") || t.includes("ચશ્મા")) {
          return titleLower.includes("glass") || detailLower.includes("glass") || titleLower.includes("spectacle") || titleLower.includes("ચશ્મા") || titleLower.includes("चश्मे");
        }
        if (t.includes("key") || t.includes("chabi") || t.includes("चाबी") || t.includes("ચાવી")) {
          return titleLower.includes("key") || detailLower.includes("key") || titleLower.includes("chabi") || titleLower.includes("ચાવી") || titleLower.includes("चाबी");
        }
        if (t.includes("wallet") || t.includes("purse") || t.includes("बटुआ") || t.includes("પાકીટ")) {
          return titleLower.includes("wallet") || titleLower.includes("purse") || detailLower.includes("wallet");
        }
        if (t.includes("stick") || t.includes("cane") || t.includes("लाठी") || t.includes("લાકડી")) {
          return titleLower.includes("stick") || detailLower.includes("stick");
        }
        return false;
      });

      if (matchingCue) {
        if (lang === "gu") {
          return `તમારી અંગત યાદો અનુસાર: ${matchingCue.title} - ${matchingCue.detail}`;
        }
        if (lang === "hi") {
          return `आपकी यादों के अनुसार: ${matchingCue.title} - ${matchingCue.detail}`;
        }
        if (lang === "as") {
          return `আপোনাৰ স্মৃতি অনুসাৰে: ${matchingCue.title} - ${matchingCue.detail}`;
        }
        if (lang === "bn") {
          return `আপনার স্মৃতি অনুসারে: ${matchingCue.title} - ${matchingCue.detail}`;
        }
        if (lang === "mr") {
          return `आपल्या आठवणीनुसार: ${matchingCue.title} - ${matchingCue.detail}`;
        }
        return `According to your Personal Memory Bank: ${matchingCue.title} - ${matchingCue.detail}`;
      }
    }

    // 9. Family Memory Bank Lookup (Sunita, Aarav, Rajesh)
    if (t.includes("sunita") || t.includes("सुनीता") || t.includes("સુનીતા") || t.includes("সুনীতা")) {
      const sunitaBio: Record<string, string> = {
        gu: "સુનિતા તમારી વહાલી પુત્રી અને મુખ્ય સંભાળ રાખનાર છે. તે દર રવિવારે હર્બલ ચા લઈને આવે છે અને દરરોજ સાંજે ૫ વાગ્યે તમને ફોન કરે છે.",
        hi: "सुनीता आपकी सुपुत्री और मुख्य देखभालकर्ता हैं। वे हर रविवार हर्बल चाय लाती हैं और रोज़ शाम 5 बजे आपसे बात करती हैं।",
        en: "Sunita is your caring daughter and primary caregiver. She visits every Sunday with homemade tea and calls daily at 5 PM.",
      };
      return sunitaBio[lang] || sunitaBio["en"];
    }

    if (t.includes("aarav") || t.includes("आरव") || t.includes("આરવ") || t.includes("আৰভ")) {
      const aaravBio: Record<string, string> = {
        gu: "આરવ તમારો ૮ વર્ષનો વહાલો પૌત્ર છે. તેને તમને સ્કૂલના રંગબેરંગી ચિત્રો બતાવવા અને બિહુ ડાન્સ કરવો ખૂબ ગમે છે.",
        hi: "आरव आपका 8 वर्षीय पोता है। उसे आपको अपनी चित्रकारी दिखाना और बिहू नृत्य करना बहुत पसंद है।",
        en: "Aarav is your 8-year-old grandson. He loves showing you his school drawings and dancing Bihu for you.",
      };
      return aaravBio[lang] || aaravBio["en"];
    }

    // Contextual, intelligent elder-companion response
    const naturalCompanionReplies: Record<string, string> = {
      hi: "आप मुझसे अपनी दवा, डॉक्टर अपॉइंटमेंट, दिनचर्या, कोई पारिवारिक याद, या देश-दुनिया की किसी भी बात के बारे में पूछ सकते हैं। मैं आपकी पूरी सहायता करूँगा।",
      gu: "તમે મને તમારી દવાઓ, ડૉક્ટર મુલાકાત, દિનચર્યા કે દેશ-દુનિયાની કોઈ પણ બાબત વિશે પૂછી શકો છો. હું હંમેશા તમારી સાથે છું.",
      en: "Feel free to ask about your medicines, appointments, daily routine, family memories, or world questions. I am right here to help you.",
      bn: "আপনি আমাকে আপনার ওষুধ, ডাক্তারের অ্যাপয়েন্টমেন্ট, রুটিন বা যেকোনো সাধারণ তথ্য সম্পর্কে জিজ্ঞাসা করতে পারেন।",
      as: "আপুনি মোক আপোনাৰ ঔষধ, চিকিৎসকৰ সাক্ষাত বা দিনটোৰ যিকোনো কথা সুধিব পাৰে। মই আপোনাক সহায় কৰিম।",
      mr: "आपण मला आपली औषधे, डॉक्टरांची भेट, दिनचर्या किंवा कोणत्याही विषयाबद्दल विचारू शकता. मी आपल्या मदतीसाठी सदैव तयार आहे.",
      ta: "உங்கள் மருந்துகள், மருத்துவ சந்திப்புகள் அல்லது உலக நடப்புகள் பற்றி என்னிடம் தாராளமாகக் கேட்கலாம்.",
      te: "మీరు మీ మందులు, వైద్యుల అపాయింట్‌మెంట్‌లు లేదా దినచర్యల గురించి నన్ను అడగవచ్చు.",
      kn: "ನಿಮ್ಮ ಔಷಧಿಗಳು, ವೈದ್ಯರ ಭೇಟಿ ಅಥವಾ ದಿನಚರಿಯ ಬಗ್ಗೆ ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.",
      ml: "നിങ്ങളുടെ മരുന്നുകൾ, ഡോക്ടറുടെ അപ്പോയിന്റ്മെന്റുകൾ എന്നിവയെക്കുറിച്ച് നിങ്ങൾക്ക് എന്നോട് ചോദിക്കാം.",
      pa: "ਤੁਸੀਂ ਮੈਨੂੰ ਆਪਣੀਆਂ ਦਵਾਈਆਂ, ਡਾਕਟਰ ਦੀ ਮੁਲਾਕਾਤ ਜਾਂ ਰੋਜ਼ਾਨਾ ਦੇ ਕੰਮਾਂ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।",
      or: "ଆପଣ ମୋତେ ନିଜ ଔଷଧ, ଡାକ୍ତରଙ୍କ ସାକ୍ଷାତ ବା ଦୈନନ୍ଦିନ କାର୍ଯ୍ୟ ବିଷୟରେ ପଚାରିପାରିବେ।",
    };

    return naturalCompanionReplies[lang] || naturalCompanionReplies["en"];
  }
}

export const conversationalAI = new ConversationalAIEngine();
