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
  action?: "take_medicine" | "create_reminder" | "navigate_games" | "next_level" | "none";
  actionData?: any;
}

// Empathy & Companion Knowledge Bank across All 12 Languages
const EMPATHY_RESPONSES: Record<
  string,
  { loneliness: string; tired: string; happy: string; tea: string; weather: string }
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
  },
  "gu-IN": {
    loneliness:
      "હું હંમેશા તમારી સાથે છું. શું તમે પરિવારની કોઈ વહાલી યાદ સાંભળવા માંગો છો કે કોઈ શાંત રમત રમવી છે?",
    tired:
      "કૃપા કરીને થોડો આરામ કરો. એક ગ્લાસ હુંફાળું પાણી પીઓ અને શાંતિથી બેસો.",
    happy: "આ સાંભળીને ખૂબ આનંદ થયો! તમારું હાસ્ય જ અમારું સાચું સુખ છે.",
    tea: "ગરમ ચા મનને ઘણી શાંતિ આપે છે. શું તમે સાથે કંઈક હળવો નાસ્તો લીધો?",
    weather: "આજનું હવામાન ઘણું શાંત છે. તમે થોડીવાર બાલકનીમાં બેસી શકો છો.",
  },
  "as-IN": {
    loneliness:
      "মই সদায় আপোনাৰ লগত আছোঁ। আপুনি পৰিয়ালৰ পুৰণি স্মৃতি মনত পেলাব খোজে নে শান্ত খেল এটা খেলিব?",
    tired:
      "অনুগ্ৰহ কৰি অলপ জিৰণি লওক। এগিলাচ কুহুমীয়া পানী খাওক আৰু শান্তভাৱে বহক।",
    happy: "শুনি বৰ আনন্দ পালোঁ! আপোনাৰ হাঁহিয়ে আমাৰ আটাইতকৈ ডাঙৰ সুখ।",
    tea: "গৰম অসম চাহৰ এক কাপে মনলৈ বৰ শান্তি আনে। লগত কিবা লঘু আহাৰ খালেনে?",
    weather: "আজিৰ বতৰ বৰ মনোৰম। আপুনি বাৰাণ্ডাত অলপ সময় বহিব পাৰে।",
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
  },
  "mr-IN": {
    loneliness:
      "मी सदैव आपल्या सोबत आहे. आपल्याला कुटुंबाची एखादी छान आठवण ऐकायची आहे का?",
    tired: "कृपया थोडी विश्रांती घ्या. एक ग्लास कोमट पाणी प्या आणि शांत बसा.",
    happy: "हे ऐकून खूप आनंद झाला! आपले हसू हीच आमची खरी ताकद आहे.",
    tea: "गरम चहाचा एक घोट मनाला खूप तृप्ती देतो. सोबत काही हलका खाल्ला का?",
    weather: "आजचे वातावरण शांत आणि आल्हाददायक आहे.",
  },
  "ta-IN": {
    loneliness:
      "நான் எப்போதும் உங்களுடன் இருக்கிறேன். குடும்பத்தின் இனிய நினைவுகளைப் பகிரலாமா?",
    tired: "தயவுசெய்து சிறிது ஓய்வெடுங்கள். கொஞ்சம் வெதுவெதுப்பான நீர் அருந்துங்கள்.",
    happy: "இதைக் கேட்டு மிக்க மகிழ்ச்சி! உங்கள் புன்னகையே எங்கள் செல்வம்.",
    tea: "சூடான தேநீர் மனதிற்கு அமைதி தரும். ஏதாவது சிற்றுண்டி சாப்பிட்டீர்களா?",
    weather: "இன்றைய வானிலை மிகவும் இனிமையாக உள்ளது.",
  },
  "te-IN": {
    loneliness:
      "నేను ఎల్లప్పుడూ మీతోనే ఉన్నాను. కుటుంబ మధుర జ్ఞాపకాలను గుర్తుచేసుకుందామా?",
    tired: "దయచేసి కాసేపు విశ్రాంతి తీసుకోండి. కొద్దిగా గోరువెచ్చని నీరు త్రాగండి.",
    happy: "ఇది విని చాలా సంతోషంగా ఉంది! మీ చిరునవ్వే మా ఆనందం.",
    tea: "వేడి టీ మనసుకు ఎంతో ప్రశాంతతను ఇస్తుంది.",
    weather: "ఈ రోజు వాతావరణం చాలా ఆహ్లాదకరంగా ఉంది.",
  },
  "kn-IN": {
    loneliness:
      "ನಾನು ಸದಾ ನಿಮ್ಮೊಂದಿಗಿದ್ದೇನೆ. ಕುಟುಂಬದ ಸುಂದರ ನೆನಪುಗಳನ್ನು ಕೇಳಲು ಇಷ್ಟಪಡುವಿರಾ?",
    tired: "ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ. ಸ್ವಲ್ಪ ಬೆಚ್ಚಗಿನ ನೀರನ್ನು ಕುಡಿಯಿರಿ.",
    happy: "ಇದನ್ನು ಕೇಳಿ ತುಂಬಾ ಸಂತೋಷವಾಯಿತು! ನಿಮ್ಮ ನಗುವೇ ನಮ್ಮ ಶಕ್ತಿ.",
    tea: "ಬಿಸಿ ಚಹಾ ಮನಸ್ಸಿಗೆ ಹಿತ ನೀಡುತ್ತದೆ.",
    weather: "ಇಂದಿನ ಹವಾಮಾನವು ತುಂಬಾ ಆಹ್ಲಾದಕರವಾಗಿದೆ.",
  },
  "ml-IN": {
    loneliness:
      "ഞാൻ എപ്പോഴും നിങ്ങളോടൊപ്പമുണ്ട്. കുടുംബത്തിന്റെ നല്ല ഓർമ്മകൾ പങ്കുവെക്കണോ?",
    tired: "ദയവായി അല്പം വിശ്രമിക്കൂ. ചൂടുവെള്ളം കുടിച്ച് ശാന്തമായി ഇരിക്കൂ.",
    happy: "ഇത് കേട്ടതിൽ അതിയായ സന്തോഷം!",
    tea: "ഒരു കപ്പ് ചൂടുചായ മനസ്സിന് സമാധാനം നൽകുന്നു.",
    weather: "ഇന്നത്തെ കാലാവസ്ഥ ശാന്തവും സുഖകരവുമാണ്.",
  },
  "pa-IN": {
    loneliness:
      "ਮੈਂ ਹਮੇਸ਼ਾ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ। ਕੀ ਤੁਸੀਂ ਪਰਿਵਾਰ ਦੀ ਕੋਈ ਮਿੱਠੀ ਯਾਦ ਸੁਣਨਾ ਚਾਹੋਗੇ?",
    tired: "ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹਾ ਆਰਾਮ ਕਰੋ। ਗਰਮ ਪਾਣੀ ਪੀ ਕੇ ਸ਼ਾਂਤੀ ਨਾਲ ਬੈਠੋ।",
    happy: "ਇਹ ਸੁਣ ਕੇ ਬਹੁਤ ਖੁਸ਼ੀ ਹੋਈ! ਤੁਹਾਡੀ ਮੁਸਕਰਾਹਟ ਹੀ ਸਾਡਾ ਸਰਮਾਇਆ ਹੈ।",
    tea: "ਗਰਮ ਚਾਹ ਮਨ ਨੂੰ ਬੜਾ ਸਕੂਨ ਦਿੰਦੀ ਹੈ।",
    weather: "ਅੱਜ ਦਾ ਮੌਸਮ ਬਹੁਤ ਸੁਹਾਵਣਾ ਹੈ।",
  },
  "or-IN": {
    loneliness:
      "ମୁଁ ସବୁବେଳେ ଆପଣଙ୍କ ସହିତ ଅଛି। ପରିବାରର କୌଣସି ସୁନ୍ଦର ସ୍ମୃତି ମନେ ପକାଇବା କି?",
    tired: "ଦୟାକରି ଟିକେ ବିଶ୍ରାମ ନିଅନ୍ତୁ। ଗ୍ଲାସେ ଉଷୁମ ପାଣି ପିଇ ଶାନ୍ତ ଭାବେ ବସନ୍ତୁ।",
    happy: "ଏହା ଶୁଣି ବହୁତ ଖୁସି ଲାଗିଲା!",
    tea: "ଗରମ ଚାହା ମନକୁ ଶାନ୍ତି ଦିଏ।",
    weather: "ଆଜିର ପାଣିପାଗ ବହୁତ ଶାନ୍ତ ଓ ସୁନ୍ଦର।",
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
    // FLOW 1: MEDICINE HELP INQUIRY (Requirement 1 Example)
    // User: "मुझे दवाई के बारे में मदद चाहिए।" -> AI: "ज़रूर। आपको किस दवाई के बारे में मदद चाहिए?"
    // User: "जो मैं रात में लेता हूँ।" -> AI understands context & answers from medicine data
    // =========================================================================
    const isMedicineHelpIntent =
      (t.includes("help") || t.includes("मदद") || t.includes("সহায়") || t.includes("সাহায্য") || t.includes("મદદ") || t.includes("मदत") || t.includes("உதவி") || t.includes("సహాయం") || t.includes("ಸಹಾಯ") || t.includes("സഹായം")) &&
      (t.includes("medicine") || t.includes("dawa") || t.includes("dawai") || t.includes("दवा") || t.includes("દવા") || t.includes("ঔষধ") || t.includes("ওষুধ") || t.includes("औषध") || t.includes("மருந்து") || t.includes("మందు") || t.includes("ಔಷಧಿ"));

    if (isMedicineHelpIntent && this._dialogue.stage !== "medicine_help_requested") {
      this._dialogue = {
        stage: "medicine_help_requested",
        topic: "medicine",
        turnCount: this._dialogue.turnCount + 1,
      };

      const askWhichMed: Record<string, string> = {
        hi: "ज़रूर। आपको किस दवाई के बारे में मदद चाहिए?",
        gu: "ચોક્કસ. તમારે કઈ દવા વિશે મદદ જોઈએ છે?",
        en: "Sure. Which medicine do you need help with?",
        bn: "নিশ্চয়ই। আপনার কোন ওষুধ সম্পর্কে সাহায্য প্রয়োজন?",
        as: "নিশ্চয়। আপোনাৰ কোনটো ঔষধৰ বিষয়ে সহায় লাগিব?",
        mr: "नक्कीच. आपल्याला कोणत्या औषधाबद्दल मदत हवी आहे?",
        ta: "நிச்சயமாக. உங்களுக்கு எந்த மருந்து பற்றி உதவி வேண்டும்?",
        te: "తప్పకుండా. మీకు ఏ మందు గురించి సహాయం కావాలి?",
        kn: "ಖಂಡಿತ. ನಿಮಗೆ ಯಾವ ಔಷಧಿಯ ಬಗ್ಗೆ ಸಹಾಯ ಬೇಕು?",
        ml: "തീർച്ചയായും. ഏത് മരുന്നിനെക്കുറിച്ചാണ് നിങ്ങൾക്ക് സഹായം വേണ്ടത്?",
        pa: "ਜ਼ਰੂਰ। ਤੁਹਾਨੂੰ ਕਿਸ ਦਵਾਈ ਬਾਰੇ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?",
        or: "ନିଶ୍ଚୟ। ଆପଣଙ୍କୁ କେଉଁ ଔଷଧ ବିଷୟରେ ସାହାଯ୍ୟ ଦରକାର?",
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
      t.includes("रात्री") ||
      t.includes("இரவு") ||
      t.includes("రాత్రి") ||
      t.includes("ರಾತ್ರಿ") ||
      t.includes("രാത്രി");

    const mentionsMorning =
      t.includes("morning") ||
      t.includes("subah") ||
      t.includes("सुबह") ||
      t.includes("સવાર") ||
      t.includes("সকাল") ||
      t.includes("পুৱা") ||
      t.includes("सकाळी") ||
      t.includes("காலை") ||
      t.includes("ఉదయం") ||
      t.includes("ಬೆಳಿಗ್ಗೆ") ||
      t.includes("രാവിലെ");

    if (this._dialogue.stage === "medicine_help_requested" || (isMedicineHelpIntent && (mentionsNight || mentionsMorning))) {
      if (mentionsNight) {
        // Look up night medicine from store
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
          },
          targetTime: timeStr,
          turnCount: this._dialogue.turnCount + 1,
        };

        const nightAnswers: Record<string, string> = {
          hi: `आपकी रात की दवा ${medName} (${dosage}) है, जो रात 8:30 बजे सोने से पहले ली जाती है। क्या आपने आज यह दवा ले ली है, या मैं इसका रिमाइंडर सेट करूँ?`,
          gu: `તમારી રાતની દવા ${medName} (${dosage}) છે, જે રાત્રે 8:30 વાગ્યે લેવાની છે. શું તમે આજે આ દવા લઈ લીધી છે, કે હું રિમાઇન્ડર ગોઠવું?`,
          en: `Your night medicine is ${medName} (${dosage}), scheduled at 8:30 PM before sleeping. Have you taken it today, or would you like me to set a reminder?`,
          bn: `আপনার রাতের ওষুধ ${medName} (${dosage}), যা রাত ৮:৩০ টায় ঘুমানোর আগে নিতে হয়। আপনি কি ওষুধটি খেয়েছেন, নাকি রিমাইন্ডার সেট করে দেব?`,
          as: `আপোনাৰ ৰাতিৰ ঔষধ ${medName} (${dosage}), যিটো ৰাতি ৮:৩০ বজাত শোৱাৰ আগত খাব লাগে। আপুনি ঔষধটো খালেনে, নে সংকেত সংৰক্ষণ কৰিম?`,
          mr: `आपले रात्रीचे औषध ${medName} (${dosage}) आहे, जे रात्री 8:30 वाजता घ्यायचे आहे. आपण हे औषध घेतले आहे का, की मी आठवण सेट करू?`,
          ta: `உங்கள் இரவு மருந்து ${medName} (${dosage}), இரவு 8:30 மணிக்கு எடுத்துக்கொள்ள வேண்டும். நீங்கள் இன்று இதை எடுத்துக்கொண்டீர்களா?`,
          te: `మీ రాత్రి మందు ${medName} (${dosage}), రాత్రి 8:30 గంటలకు వేసుకోవాలి. మీరు ఈ రోజు ఈ మందు వేసుకున్నారా?`,
          kn: `ನಿಮ್ಮ ರಾತ್ರಿಯ ಔಷಧಿ ${medName} (${dosage}), ರಾತ್ರಿ 8:30 ಕ್ಕೆ ತೆಗೆದುಕೊಳ್ಳಬೇಕು. ನೀವು ಇಂದು ಇದನ್ನು ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ?`,
          ml: `നിങ്ങളുടെ രാത്രി മരുന്ന് ${medName} (${dosage}) ആണ്, രാത്രി 8:30 ന് കഴിക്കണം. നിങ്ങൾ ഇന്ന് ഇത് കഴിച്ചോ?`,
          pa: `ਤੁਹਾਡੀ ਰਾਤ ਦੀ ਦਵਾਈ ${medName} (${dosage}) ਹੈ, ਜੋ ਰਾਤ 8:30 ਵਜੇ ਲੈਣੀ ਹੈ। ਕੀ ਤੁਸੀਂ ਇਹ ਦਵਾਈ ਲੈ ਲਈ ਹੈ?`,
          or: `ଆପଣଙ୍କ ରାତି ଔଷଧ ${medName} (${dosage}), ଯାହା ରାତି 8:30 ରେ ଖାଇବାକୁ ହେବ। ଆପଣ ଆଜି ଏହା ଖାଇଛନ୍ତି କି?`,
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
          },
          targetTime: timeStr,
          turnCount: this._dialogue.turnCount + 1,
        };

        const morningAnswers: Record<string, string> = {
          hi: `आपकी सुबह की दवा ${medName} (${dosage}) है, जो सुबह 8:30 बजे नाश्ते के बाद ली जाती है। क्या आपने आज यह दवा ले ली है?`,
          gu: `તમારી સવારની દવાનો સમય ${timeStr} વાગ્યાનો છે (${medName} ${dosage}). શું તમે આજે આ દવા લઈ લીધી છે?`,
          en: `Your morning medicine is ${medName} (${dosage}) scheduled at ${timeStr} AM after breakfast. Have you taken it today?`,
          bn: `আপনার সকালের ওষুধ ${medName} (${dosage}), যা সকাল ৮:৩০ টায় নাস্তার পরে নিতে হয়। আপনি কি ওষুধটি খেয়েছেন?`,
          as: `আপোনাৰ পুৱাৰ ঔষধ ${medName} (${dosage}), যিটো পুৱা ৮:৩০ বজাত খাব লাগে। আপুনি ঔষধটো খালেনে?`,
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
          en: "Wonderful! I have recorded that you took your medicine. Take good care of yourself.",
          bn: "খুব ভালো! আমি নথিবদ্ধ করে নিয়েছি যে আপনি ওষুধ খেয়েছেন। নিজের যত্ন নিন।",
          as: "বৰ ভাল কথা! মই লিখি ৰাখিলোঁ যে আপুনি ঔষধ খালে। নিজৰ যত্ন লব।",
          mr: "खूप छान! आपण औषध घेतल्याची नोंद मी केली आहे. आपली काळजी घ्या.",
          ta: "மிக நன்று! நீங்கள் மருந்து எடுத்துக்கொண்டதை பதிவு செய்துள்ளேன்.",
          te: "చాలా మంచిది! మీరు మందులు వేసుకున్నట్లు నమోదు చేసాను.",
          kn: "ತುಂಬಾ ಒಳ್ಳೆಯದು! ನೀವು ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿರುವುದನ್ನು ದಾಖಲಿಸಿದ್ದೇನೆ.",
          ml: "വളരെ നല്ലത്! നിങ്ങൾ മരുന്ന് കഴിച്ചതായി ഞാൻ രേഖപ്പെടുത്തി.",
          pa: "ਬਹੁਤ ਵਧੀਆ! ਮੈਂ ਦਰਜ ਕਰ ਲਿਆ ਹੈ ਕਿ ਤੁਸੀਂ ਦਵਾਈ ਲੈ ਲਈ ਹੈ।",
          or: "ବହୁତ ଭଲ! ଆପଣ ଔଷଧ ଖାଇଥିବା ମୁଁ ଲିପିବଦ୍ଧ କରିଦେଇଛି।",
        };

        return {
          handled: true,
          responseText: takenAnswers[lang] || takenAnswers["en"],
          action: "take_medicine",
          actionData: { medicineId: medId },
        };
      }

      if (t.includes("remind") || t.includes("याद") || t.includes("યાદ") || t.includes("संकेत") || t.includes("రిమైండర్")) {
        const timeToSet = medCtx?.scheduledTime || "20:30";
        store.addReminder({
          title: `${medCtx?.medicineName || "Medicine"} (${medCtx?.timeOfDay || "Scheduled"})`,
          time: timeToSet,
          type: "medicine",
          repeat: "daily",
          notes: "Scheduled via Conversational AI Assistant",
          active: true,
        });
        this.resetDialogue();

        const setConfirm: Record<string, string> = {
          hi: `ठीक है। मैंने आपके लिए ${timeToSet} बजे दवा का रिमाइंडर सेट कर दिया है।`,
          gu: `ઠીક છે. મેં તમારા માટે ${timeToSet} વાગ્યે દવાનું રિમાઇન્ડર ગોઠવી દીધું છે.`,
          en: `Alright. I have set your medicine reminder for ${timeToSet}.`,
          bn: `ঠিক আছে। আমি আপনার জন্য ${timeToSet} টায় ওষুধের রিমাইন্ডার সেট করে দিয়েছি।`,
          as: `ঠিক আছে। মই ${timeToSet} বজাত ঔষধৰ সংকেত সংৰক্ষণ কৰিলোঁ।`,
          mr: `ठीक आहे. मी ${timeToSet} वाजता औषधाची आठवण सेट केली आहे.`,
        };

        return {
          handled: true,
          responseText: setConfirm[lang] || setConfirm["en"],
          action: "create_reminder",
          actionData: { time: timeToSet },
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
    // FLOW 2: TODAY'S ACTIVITIES SUMMARY (Requirement 2 Example)
    // User: "आज मैंने कौन-कौन सी activities की हैं?"
    // AI summarizes routines completed, games played, medicines taken
    // =========================================================================
    const isAskingActivities =
      (t.includes("activity") || t.includes("activities") || t.includes("गतिविधि") || t.includes("गतिविधियां") || t.includes("काम") || t.includes("પ્રવૃત્તિ") || t.includes("কাম") || t.includes("কাজ") || t.includes("रूटिन") || t.includes("routine")) &&
      (t.includes("aaj") || t.includes("today") || t.includes("आज") || t.includes("આજે") || t.includes("আজি") || t.includes("আজকে") || t.includes("केले") || t.includes("done") || t.includes("ki hai") || t.includes("কী কি"));

    if (isAskingActivities) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const routinesDone = store.routines.filter((r) => r.done_date === todayStr).length;
      const gamesToday = store.gameSessions.filter((s) => s.created_at?.startsWith(todayStr));
      const gameCount = gamesToday.length;
      const bestAccToday = gamesToday.length > 0 ? Math.max(...gamesToday.map((g) => g.accuracy || 70)) : 85;

      const actSummaries: Record<string, string> = {
        hi: `आज आपने बहुत अच्छा दिन बिताया है! आपने ${routinesDone} दिनचर्या के कार्य पूरे किए हैं और ${gameCount > 0 ? `${gameCount} मेमोरी गेम खेले हैं (${bestAccToday}% सटीकता के साथ)` : "अपनी सुबह की दिनचर्या पूरी की है"}। आपकी निरंतरता बहुत सराहनीय है!`,
        gu: `આજે તમે ખૂબ સુંદર અને સક્રિય દિવસ વિતાવ્યો છે! તમે ${routinesDone} દિનચર્યાના નિયમો પૂરા કર્યા છે અને ${gameCount > 0 ? `${gameCount} રમતો રમી છે (${bestAccToday}% ચોકસાઈ સાથે)` : "તમારી સવારની દિનચર્યા સાચવી છે"}. તમારો ઉત્સાહ પ્રેરણાદાયક છે!`,
        en: `You have had a wonderful and active day today! You completed ${routinesDone} daily routine item(s) and played ${gameCount > 0 ? `${gameCount} cognitive game session(s) with ${bestAccToday}% accuracy` : "your morning routines"}. Your consistency is truly admirable!`,
        bn: `আজ আপনি খুব সুন্দর দিন কাটিয়েছেন! আপনি ${routinesDone} টি দৈনন্দিন কাজ সম্পন্ন করেছেন এবং ${gameCount > 0 ? `${gameCount} টি স্মৃতির খেলা খেলেছেন (${bestAccToday}% নির্ভুলতার সাথে)` : "সকালের নিয়ম মেনে চলেছেন"}।`,
        as: `আজি আপুনি বৰ সুন্দৰ দিন এটা কটালে! আপুনি ${routinesDone} টা দৈনিক কাম সম্পূৰ্ণ কৰিলে আৰু ${gameCount > 0 ? `${gameCount} টা খেল খেলিলে (${bestAccToday}% সঠিকতাৰে)` : "পুৱাৰ নিয়ম পালন কৰিলে"}।`,
        mr: `आज आपण खूप छान दिवस घालवला आहे! आपण ${routinesDone} दैनंदिन कामे पूर्ण केली आहेत आणि ${gameCount > 0 ? `${gameCount} खेळ खेळले आहेत (${bestAccToday}% अचूकतेसह)` : "सकाळची दिनचर्या पाळली आहे"}.`,
        ta: `இன்று நீங்கள் ஒரு அற்புதமான நாளைக் கழித்துள்ளீர்கள்! ${routinesDone} தினசரி பணிகளையும், ${gameCount} நினைவாற்றல் விளையாட்டுகளையும் முடித்துள்ளீர்கள்.`,
        te: `ఈ రోజు మీరు చాలా చురుకైన రోజును గడిపారు! ${routinesDone} దినచర్య పనులను మరియు ${gameCount} ఆటలను పూర్తి చేసారు.`,
        kn: `ಇಂದು ನೀವು ತುಂಬಾ ಸಕ್ರಿಯ ದಿನವನ್ನು ಕಳೆದಿದ್ದೀರಿ! ${routinesDone} ದಿನಚರಿ ಕಾರ್ಯಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ.`,
        ml: `ഇന്ന് നിങ്ങൾ വളരെ നല്ലൊരു ദിവസമാണ് ചെലവഴിച്ചത്! ${routinesDone} ദിനചര്യകളും പൂർത്തിയാക്കി.`,
        pa: `ਅੱਜ ਤੁਸੀਂ ਬਹੁਤ ਵਧੀਆ ਦਿਨ ਬਿਤਾਇਆ ਹੈ! ਤੁਸੀਂ ${routinesDone} ਰੋਜ਼ਾਨਾ ਕੰਮ ਪੂਰੇ ਕੀਤੇ ਹਨ।`,
        or: `ଆଜି ଆପଣ ବହୁତ ଭଲ ଦିନ ବିତାଇଛନ୍ତି! ଆପଣ ${routinesDone} ଟି ଦୈନନ୍ଦିନ କାର୍ଯ୍ୟ ସମ୍ପୂର୍ଣ୍ଣ କରିଛନ୍ତି।`,
      };

      return {
        handled: true,
        responseText: actSummaries[lang] || actSummaries["en"],
      };
    }

    // =========================================================================
    // FLOW 3: PLAY GAME / START NEXT LEVEL (Requirement 2 & 7)
    // User: "मुझे memory game खेलना है।" -> Opens game hub
    // User: "अगला level शुरू करो।" -> Starts next unlocked level
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
    // FLOW 4: DIRECT MEDICINE TIME QUERY (Requirement 1 & 3 Example)
    // User: "मेरी रात वाली दवाई कब है?" / "मेरी दवाई कब है?" / "When is my medicine?"
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
            stock: nightMed?.stock || 24,
            dailyUsage: nightMed?.daily_usage || 1,
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
            stock: morningMed?.stock || 30,
            dailyUsage: morningMed?.daily_usage || 1,
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

      // Both morning & night
      const med1 = store.medicines[0];
      const med2 = store.medicines[1];
      const m1Name = med1?.name || "Amlodipine";
      const m2Name = med2?.name || "Donepezil";

      this._dialogue = {
        stage: "medicine_discussed",
        topic: m2Name,
        medicineContext: {
          timeOfDay: "night",
          medicineId: med2?.id,
          medicineName: m2Name,
          dosage: med2?.dosage || "5 mg",
          scheduledTime: med2?.times[0] || "20:30",
          stock: med2?.stock || 24,
          dailyUsage: med2?.daily_usage || 1,
        },
        turnCount: this._dialogue.turnCount + 1,
      };

      const scheduleAnswers: Record<string, string> = {
        hi: `आपकी सुबह की दवा ${m1Name} सुबह 8:30 बजे है, और रात की दवा ${m2Name} रात 8:30 बजे सोने से पहले है।`,
        gu: `તમારી સવારની દવા ${m1Name} સવારે 8:30 વાગ્યે છે, અને રાતની દવા ${m2Name} રાત્રે 8:30 વાગ્યે છે.`,
        en: `Your morning medicine ${m1Name} is at 8:30 AM, and your night medicine ${m2Name} is at 8:30 PM.`,
        bn: `আপনার সকালের ওষুধ ${m1Name} সকাল ৮:৩০ টায়, এবং রাতের ওষুধ ${m2Name} রাত ৮:৩০ টায়।`,
        as: `আপোনাৰ পুৱাৰ ঔষধ ${m1Name} পুৱা ৮:৩০ বজাত, আৰু ৰাতিৰ ঔষধ ${m2Name} ৰাতি ৮:৩০ বজাত।`,
        mr: `आपले सकाळचे औषध ${m1Name} सकाळी 8:30 वाजता आहे, आणि रात्रीचे औषध ${m2Name} रात्री 8:30 वाजता आहे.`,
      };

      return {
        handled: true,
        responseText: scheduleAnswers[lang] || scheduleAnswers["en"],
      };
    }

    // =========================================================================
    // FLOW 4.5: FOLLOW-UP MEDICINE STOCK INQUIRY (Requirement 1 Example)
    // User: "वही वाली कितने दिन की बची है?" / "How many days of that are left?"
    // Understands "वही वाली" refers to the medicine discussed previously.
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
    // FLOW 4.6: YESTERDAY'S ACTIVITIES RECALL (Requirement 1 & 3 Example)
    // User: "कल मैंने क्या किया था?" / "What did I do yesterday?"
    // Retrieves actual Memory Bond data: routines, medicines, games from yesterday.
    // =========================================================================
    const isAskingYesterdayActivities =
      (t.includes("kal") || t.includes("कल") || t.includes("કાલે") || t.includes("কাল") || t.includes("কালি") || t.includes("काल") || t.includes("yesterday")) &&
      (t.includes("kya kiya") || t.includes("क्या किया") || t.includes("શું કર્યું") || t.includes("কি কৰিলোঁ") || t.includes("কি করেছি") || t.includes("काय केले") || t.includes("done") || t.includes("activities") || t.includes("routine") || t.includes("काम"));

    if (isAskingYesterdayActivities) {
      const yesterdayDate = new Date(Date.now() - 86400000);
      const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
      const routinesYesterday = store.routines.filter((r) => r.done_date === yesterdayStr);
      const gamesYesterday = store.gameSessions.filter((s) => s.created_at?.startsWith(yesterdayStr));
      const medsYesterday = store.medicines.filter((m) => m.adherence?.[yesterdayStr]);

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
    // FLOW 4.7: CAREGIVER / FAMILY IDENTIFICATION (Requirement 10 Example)
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
      const rahul = store.contacts.find((c) => c.name.toLowerCase().includes("rahul"));
      const contact = rahul || store.contacts[0];

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
    }

    // =========================================================================
    // FLOW 4.8: DOCTOR APPOINTMENT QUERY (Requirement 3 Example)
    // User: "मेरा appointment कब है?" / "When is my appointment?"
    // =========================================================================
    const isAskingAppointment =
      (t.includes("appointment") || t.includes("अपॉइंटमेंट") || t.includes("अपॉइन्टमेंट") || t.includes("doctor") || t.includes("डॉक्टर") || t.includes("તપાસ")) &&
      (t.includes("kab") || t.includes("कब") || t.includes("ક્યારે") || t.includes("when") || t.includes("कधी") || t.includes("mera") || t.includes("my"));

    if (isAskingAppointment) {
      const nextApp = store.appointments[0] || {
        title: "Dr. B. K. Barua (Memory & Wellness Clinic)",
        date: "Next Wednesday",
        time: "10:30 AM",
        location: "Downtown Medical Centre, Room 204",
      };

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
    // FLOW 5: MEDICINE REMINDER TIME COLLECTION (Requirement 3 Example)
    // User: "मुझे कल दवाई लेनी है।" -> AI: "किस समय याद दिलाऊँ?" -> User: "सुबह 8 बजे।"
    // AI creates the reminder and confirms without asking "what are you talking about?"
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
        hi: `ठीक है। मैंने कल सुबह ${time} बजे दवा का रिमाइंडर सेट कर दिया है। मैं आपको समय पर याद दिलाऊँगा।`,
        gu: `ઠીક છે. મેં કાલે સવારે ${time} વાગ્યે દવા માટે રિમાઇન્ડર ગોઠવી દીધું છે.`,
        en: `Alright. I have set your medicine reminder for tomorrow at ${time}. I will remind you on time.`,
        bn: `ঠিক আছে। আমি কাল ${time} টায় ওষুধের জন্য রিমাইন্ডার সেট করে দিয়েছি।`,
        as: `ঠিক আছে। মই কাইলৈ ${time} বজাত ঔষধৰ বাবে সংকেত সংৰক্ষণ কৰিলোঁ।`,
        mr: `ठीक आहे. मी उद्या ${time} वाजता औषधासाठी आठवण सेट केली आहे.`,
        ta: `சரி. நாளை ${time} மணிக்கு மருந்துக்கு நினைவூட்டல் அமைத்துள்ளேன்.`,
        te: `సరే. రేపు ${time} గంటలకు మందులకు రిమైండర్ సెట్ చేసాను.`,
        kn: `ಸರಿ. ನಾಳೆ ${time} ಗಂಟೆಗೆ ಔಷಧಿಗಾಗಿ ಜ್ಞಾಪನೆಯನ್ನು ಹೊಂದಿಸಿದ್ದೇನೆ.`,
        ml: `ശരി. നാളെ ${time} ന് മരുന്നിനായി ഓർമ്മപ്പെടുത്തൽ സജ്ਜമാക്കി.`,
        pa: `ਠੀਕ ਹੈ। ਮੈਂ ਕੱਲ੍ਹ ${time} ਵਜੇ ਦਵਾਈ ਲਈ ਰੀਮਾਈਂਡਰ ਸੈੱਟ ਕਰ ਦਿੱਤਾ ਹੈ।`,
        or: `ଠିକ୍ ଅଛି। ମୁଁ କାଲି ${time} ଟାରେ ଔଷଧ ପାଇଁ ରିମାଇଣ୍ଡର ସେଟ୍ କରିଦେଇଛି।`,
      };

      return {
        handled: true,
        responseText: timeConfirms[lang] || timeConfirms["en"],
        action: "create_reminder",
        actionData: { title, time, date: targetDate },
      };
    }

    // Checking if user initiates a reminder creation without time:
    // e.g. "मुझे कल दवाई लेनी है" / "I have to take medicine tomorrow" / "મારે કાલે દવા લેવાની છે"
    const hasTomorrow =
      t.includes("tomorrow") ||
      t.includes("kal") ||
      t.includes("कल") ||
      t.includes("কাল") ||
      t.includes("কাইলৈ") ||
      t.includes("કાલે") ||
      t.includes("उद्या") ||
      t.includes("நாளை") ||
      t.includes("రేపు") ||
      t.includes("ನಾಳೆ") ||
      t.includes("നാളെ") ||
      t.includes("ਕੱਲ੍ਹ") ||
      t.includes("କାଲି");

    const mentionsMedicine =
      t.includes("દવા") ||
      t.includes("दवा") ||
      t.includes("medicine") ||
      t.includes("ঔষধ") ||
      t.includes("ওষুধ") ||
      t.includes("औषध") ||
      t.includes("மருந்து") ||
      t.includes("మందు") ||
      t.includes("ಔಷಧಿ") ||
      t.includes("മരുന്ന്") ||
      t.includes("ਦਵਾਈ") ||
      t.includes("ଔଷଧ");

    const isTakeIntent =
      t.includes("leni hai") ||
      t.includes("लेनी है") ||
      t.includes("खानी है") ||
      t.includes("લેવાની છે") ||
      t.includes("લેવી છે") ||
      t.includes("খেতে হবে") ||
      t.includes("খাব লাগিব") ||
      t.includes("घ्यायचे आहे") ||
      t.includes("take") ||
      t.includes("need to take");

    const isReminderIntent =
      t.includes("remind") ||
      t.includes("reminder") ||
      t.includes("याद") ||
      t.includes("याद दिला") ||
      t.includes("याद दिलाओ") ||
      t.includes("याद दिलाना") ||
      t.includes("याद दिला देना") ||
      t.includes("યાદ") ||
      t.includes("মনে করিয়ে") ||
      t.includes("মনত পেলাই") ||
      t.includes("आठवण");

    if (mentionsMedicine && (hasTomorrow || isTakeIntent || isReminderIntent) && !t.includes("मदद") && !t.includes("help")) {
      const explicitTime = extractedTimeFn(raw);
      const targetDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

      // If user already specified the time in the same sentence (e.g. "मुझे रात 8 बजे दवाई की याद दिलाओ" or "8 बजे")
      if (explicitTime && (t.includes("बजे") || t.includes("વાગ્યે") || t.includes("baje") || t.includes("am") || t.includes("pm") || /\b\d{1,2}\b/.test(t))) {
        store.addReminder({
          title: "Medicine",
          time: explicitTime,
          date: hasTomorrow ? targetDate : null,
          repeat: "daily",
          type: "medicine",
          notes: "Created via Voice Assistant",
          active: true,
        });

        const [hhStr] = explicitTime.split(":");
        const hhNum = parseInt(hhStr || "20", 10);
        const isNightTime = hhNum >= 18;
        const isMorningTime = hhNum < 12 && hhNum >= 4;
        const isAfternoonTime = hhNum >= 12 && hhNum < 18;
        const disp12 = hhNum % 12 === 0 ? 12 : hhNum % 12;
        const timeFormattedHi = isNightTime ? `रात ${disp12} बजे` : isMorningTime ? `सुबह ${disp12} बजे` : isAfternoonTime ? `दोपहर ${disp12} बजे` : `${disp12} बजे`;
        const timeFormattedGu = isNightTime ? `રાત્રે ${disp12} વાગ્યે` : isMorningTime ? `સવારે ${disp12} વાગ્યે` : `${disp12} વાગ્યે`;

        const directConfirms: Record<string, string> = {
          hi: `मैंने आपके लिए ${timeFormattedHi} दवा का रिमाइंडर सेट कर दिया है। मैं आपको समय पर याद दिलाऊँगा।`,
          gu: `મેં તમારા માટે ${timeFormattedGu} દવાનું રિમાઇન્ડર ગોઠવી દીધું છે.`,
          en: `I have set your medicine reminder for ${explicitTime}. I will make sure to remind you on time.`,
          bn: `আমি আপনার জন্য ${explicitTime} টায় ওষুধের রিমাইন্ডার সেট করে দিয়েছি।`,
          as: `মই আপোনাৰ বাবে ${explicitTime} বজাত সংকেত সংৰক্ষণ কৰিলোঁ।`,
          mr: `मी आपल्यासाठी ${explicitTime} वाजता औषधाची आठवण सेट केली आहे.`,
        };

        return {
          handled: true,
          responseText: directConfirms[lang] || directConfirms["en"],
          action: "create_reminder",
          actionData: { time: explicitTime },
        };
      }

      // Time was not given -> Ask "At what time should I remind you?"
      this._dialogue = {
        stage: "awaiting_reminder_time",
        topic: "Medicine",
        reminderType: "medicine",
        targetDate,
        turnCount: this._dialogue.turnCount + 1,
      };

      const askTime: Record<string, string> = {
        hi: "किस समय याद दिलाऊँ?",
        gu: "કયા સમયે યાદ દેવડાવું?",
        en: "At what time should I remind you?",
        bn: "কোন সময়ে মনে করিয়ে দেব?",
        as: "কি সময়ত মনত পেলাই দিম?",
        mr: "कोणत्या वेळी आठवण करून देऊ?",
        ta: "எந்த நேரத்தில் நினைவூட்ட வேண்டும்?",
        te: "ఏ సమయానికి గుర్తు చేయాలి?",
        kn: "ಯಾವ ಸಮಯಕ್ಕೆ ಜ್ಞಾಪಿಸಬೇಕು?",
        ml: "ഏത് സമയത്താണ് ഓർമ്മപ്പെടുത്തേണ്ടത്?",
        pa: "ਕਿਸ ਸਮੇਂ ਯਾਦ ਦਿਵਾਵਾਂ?",
        or: "କେଉଁ ସମୟରେ ମନେ ପକାଇବି?",
      };

      return {
        handled: true,
        responseText: askTime[lang] || askTime["en"],
      };
    }

    return null;
  }

  /**
   * Generates natural conversational reply when intent is general companion talk.
   * Completely avoids "How can I help you?" / "What can I help you with?".
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
      t.includes("সুখী") ||
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

    // Contextual, intelligent elder-companion response (Strictly avoiding generic repetitive fillers)
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
