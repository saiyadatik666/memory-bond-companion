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
    | "awaiting_reminder_consent"
    | "awaiting_reminder_time"
    | "medicine_discussed";
  topic?: string;
  reminderType?: "appointment" | "medicine" | "shopping" | "hydration" | "routine" | "custom";
  targetDate?: string | null;
  targetTime?: string;
}

export interface ConversationContext {
  lastActionPrompt?: {
    type: "medicine" | "reminder" | "appointment" | "journal" | "routine";
    data?: any;
    promptText: string;
  };
  turns: ConversationTurn[];
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
  };

  public getContext(): ConversationContext {
    return this._context;
  }

  public getDialogueState(): DialogueContext {
    return this._dialogue;
  }

  public resetDialogue(): void {
    this._dialogue = { stage: "idle" };
  }

  public recordTurn(role: "user" | "assistant", text: string, locale: string) {
    this._context.turns.push({
      role,
      text,
      locale,
      timestamp: Date.now(),
    });
    if (this._context.turns.length > 15) {
      this._context.turns.shift();
    }
  }

  public setPendingAction(actionPrompt: ConversationContext["lastActionPrompt"]) {
    this._context.lastActionPrompt = actionPrompt;
  }

  public clearPendingAction() {
    this._context.lastActionPrompt = undefined;
  }

  /**
   * Multi-turn Dialogue Handler across ALL 12 languages
   * Handles:
   * 1. Gujarati medicine conversation flow:
   *    User: "મારે કાલે સવારે દવા લેવાની છે."
   *    AI: "તમારી સવારની દવાનો સમય 08:30 વાગ્યાનો છે. શું હું તમને સવારે 08:30 વાગ્યે યાદ દેવડાવું?"
   *    User: "કેટલા વાગ્યે?"
   *    AI: "તમારી સવારની દવાનો સમય 08:30 વાગ્યાનો છે. મેં તમારા માટે રિમાઇન્ડર ગોઠવી દીધું છે."
   * 2. Doctor Appointment flow:
   *    User: "कल डॉक्टर के पास जाना है।" -> "क्या मैं आपको इसकी याद दिलाऊँ?" -> "हाँ" -> "किस समय?" -> "सुबह दस बजे"
   * 3. Reminders across all supported languages without forcing English.
   */
  public handleMultiTurnDialogue(
    text: string,
    store: MemoryBondStore,
    locale: string,
    extractedTimeFn: (t: string) => string
  ): { handled: boolean; responseText: string } | null {
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
      t.includes("ગોઠવો");

    // Negative checking across all Indian languages
    const isNo =
      /^(नहीं|ना|नहीं जी|no|nope|cancel|stop|dont|নহয়|না|নালাগে|ના|નહીં|નાજી|नाही|নকো|இல்லை|வேண்டாம்|వద్దు|కాదు|ಬೇಡ|ಇಲ್ಲ|വേണ്ട|ਨਹੀਂ|ନାହିଁ)(\s|$)/i.test(
        t
      ) ||
      t.includes("मत करो") ||
      t.includes("रहने दो") ||
      t.includes("રહેવા દો");

    // Question asking "What time?" / "At what time?" in various languages
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
    // STAGE A: Medicine Dialogue Context (Section 4 Example)
    // =========================================================================
    if (this._dialogue.stage === "medicine_discussed") {
      const scheduledTime = this._dialogue.targetTime || "08:30";
      const targetDate =
        this._dialogue.targetDate ||
        new Date(Date.now() + 86400000).toISOString().slice(0, 10);

      // 1. If user asks "What time?" / "કેટલા વાગ્યે?":
      if (isAskingTime) {
        // Automatically save reminder and state the time in user's exact language
        store.addReminder({
          title: "Morning Medicine",
          time: scheduledTime,
          date: targetDate,
          repeat: "daily",
          type: "medicine",
          notes: "Scheduled via Voice Assistant Context",
          active: true,
        });

        this.resetDialogue();

        const answersByLang: Record<string, string> = {
          gu: `તમારી સવારની દવાનો સમય ${scheduledTime} વાગ્યાનો છે. મેં તમારા માટે રિમાઇન્ડર ગોઠવી દીધું છે.`,
          hi: `आपकी सुबह की दवा का समय ${scheduledTime} बजे है। मैंने आपके लिए रिमाइंडर सेट कर दिया है।`,
          mr: `आपल्या सकाळच्या औषधाची वेळ ${scheduledTime} वाजता आहे. मी आपल्यासाठी आठवण सेट केली आहे.`,
          bn: `আপনার সকালের ওষুধের সময় ${scheduledTime} টায়। আমি রিমাইন্ডার সেট করে দিয়েছি।`,
          as: `আপোনাৰ পুৱাৰ ঔষধৰ সময় ${scheduledTime} বজাত। মই আপোনাৰ বাবে সংকেত সংৰক্ষণ কৰিলোঁ।`,
          ta: `உங்கள் காலை மருந்து நேரம் ${scheduledTime}. உங்களுக்கான நினைவூட்டல் அமைக்கப்பட்டுள்ளது.`,
          te: `మీ ఉదయం మందుల సమయం ${scheduledTime}. మీ కోసం రిమైండర్ సెట్ చేసాను.`,
          kn: `ನಿಮ್ಮ ಬೆಳಗಿನ ಔಷಧಿಯ ಸಮಯ ${scheduledTime}. ನಾನು ಜ್ಞಾಪನೆಯನ್ನು ಹೊಂದಿಸಿದ್ದೇನೆ.`,
          ml: `നിങ്ങളുടെ രാവിലത്തെ മരുന്നിന്റെ സമയം ${scheduledTime} ആണ്. ഞാൻ ഓർമ്മപ്പെടുത്തൽ സജ്જമാക്കി.`,
          pa: `ਤੁਹਾਡੀ ਸਵੇਰ ਦੀ ਦਵਾਈ ${scheduledTime} ਵਜੇ ਹੈ। ਮੈਂ ਰੀਮਾਈਂਡਰ ਸੈੱਟ ਕਰ ਦਿੱਤਾ ਹੈ।`,
          or: `ଆପଣଙ୍କ ସକାଳ ଔଷଧ ସମୟ ${scheduledTime}। ମୁଁ ରିମାଇଣ୍ଡର ସେଟ୍ କରିଦେଇଛି।`,
          en: `Your morning medicine is at ${scheduledTime}. I have set your reminder for ${scheduledTime}.`,
        };

        return {
          handled: true,
          responseText: answersByLang[lang] || answersByLang["en"],
        };
      }

      // 2. If user confirms with affirmative ("Yes" / "હા" / "हाँ"):
      if (isYes) {
        store.addReminder({
          title: "Morning Medicine",
          time: scheduledTime,
          date: targetDate,
          repeat: "daily",
          type: "medicine",
          notes: "Scheduled via Voice Assistant Context",
          active: true,
        });

        this.resetDialogue();

        const confirmsByLang: Record<string, string> = {
          gu: `ઠીક છે. હું તમને કાલે સવારે ${scheduledTime} વાગ્યે દવા માટે યાદ દેવડાવીશ.`,
          hi: `ठीक है। मैं आपको कल सुबह ${scheduledTime} बजे दवा के लिए याद दिलाऊँगा।`,
          mr: `ठीक आहे. मी उद्या सकाळी ${scheduledTime} वाजता औषधासाठी आठवण करून देईन.`,
          bn: `ঠিক আছে। আমি কাল সকালে ${scheduledTime} টায় ওষুধের জন্য মনে করিয়ে দেব।`,
          as: `ঠিক আছে। মই কাইলৈ পুৱা ${scheduledTime} বজাত ঔষধৰ বাবে মনত পেলাই দিম।`,
          ta: `சரி. நாளை காலை ${scheduledTime} மணிக்கு மருந்துக்கு நினைவூட்டுவேன்.`,
          te: `సరే. రేపు ఉదయం ${scheduledTime} గంటలకు మందులకు గుర్తు చేస్తాను.`,
          kn: `ಸರಿ. ನಾಳೆ ಬೆಳಿಗ್ಗೆ ${scheduledTime} ಗಂಟೆಗೆ ಔಷಧಿಗಾಗಿ ನೆನಪಿಸುತ್ತೇನೆ.`,
          ml: `ശരി. നാളെ രാവിലെ ${scheduledTime} ന് മരുന്നിനായി ഓർമ്മിപ്പിക്കും.`,
          pa: `ਠੀਕ ਹੈ। ਮੈਂ ਕੱਲ੍ਹ ਸਵੇਰੇ ${scheduledTime} ਵਜੇ ਦਵਾਈ ਲਈ ਯਾਦ ਦਿਵਾਵਾਂਗਾ।`,
          or: `ଠିକ୍ ଅଛି। ମୁଁ କାଲି ସକାଳେ ${scheduledTime} ଟାରେ ଔଷଧ ପାଇଁ ମନେ ପକାଇଦେବି।`,
          en: `Alright. I will remind you tomorrow morning at ${scheduledTime} for your medicine.`,
        };

        return {
          handled: true,
          responseText: confirmsByLang[lang] || confirmsByLang["en"],
        };
      }

      // 3. If user says a specific time:
      const customTime = extractedTimeFn(raw);
      if (customTime && customTime !== "09:00" && !isNo) {
        store.addReminder({
          title: "Medicine",
          time: customTime,
          date: targetDate,
          repeat: "daily",
          type: "medicine",
          notes: "Scheduled via Voice Assistant Context",
          active: true,
        });

        this.resetDialogue();

        const timeConfirmByLang: Record<string, string> = {
          gu: `ઠીક છે. મેં દવા માટે ${customTime} વાગ્યે રિમાઇન્ડર ગોઠવી દીધું છે.`,
          hi: `ठीक है। मैंने दवा के लिए ${customTime} बजे का रिमाइंडर सेट कर दिया है।`,
          mr: `ठीक आहे. मी औषधासाठी ${customTime} वाजता आठवण सेट केली आहे.`,
          bn: `ঠিক আছে। আমি ওষুধের জন্য ${customTime} টায় রিমাইন্ডার সেট করে দিয়েছি।`,
          as: `ঠিক আছে। মই ঔষধৰ বাবে ${customTime} বজাত সংকেত সংৰক্ষণ কৰিলোঁ।`,
          en: `Alright. I have set your medicine reminder for ${customTime}.`,
        };

        return {
          handled: true,
          responseText: timeConfirmByLang[lang] || timeConfirmByLang["en"],
        };
      }

      // 4. If user cancels:
      if (isNo) {
        this.resetDialogue();
        return {
          handled: true,
          responseText:
            lang === "gu"
              ? "ઠીક છે, કોઈ વાંધો નહીં."
              : lang === "hi"
              ? "ठीक है, कोई बात नहीं।"
              : "Alright, no problem.",
        };
      }
    }

    // =========================================================================
    // STAGE B: General Reminder Consent Stage
    // =========================================================================
    if (this._dialogue.stage === "awaiting_reminder_consent") {
      if (isYes) {
        this._dialogue.stage = "awaiting_reminder_time";

        const askTimeByLang: Record<string, string> = {
          gu: "ચોક્કસ. કયા સમયે યાદ કરાવું?",
          hi: "ज़रूर। किस समय याद दिलाऊँ?",
          as: "নিশ্চয়। কি সময়ত মনত পেলাই দিম?",
          bn: "নিশ্চয়ই। কোন সময়ে মনে করিয়ে দেব?",
          mr: "नक्कीच. कोणत्या वेळी आठवण करून देऊ?",
          ta: "நிச்சயமாக. எந்த நேரத்தில் நினைவூட்ட வேண்டும்?",
          te: "తప్పకుండా. ఏ సమయానికి గుర్తు చేయాలి?",
          kn: "ಖಂಡಿತ. ಯಾವ ಸಮಯಕ್ಕೆ ಜ್ಞಾಪಿಸಬೇಕು?",
          ml: "തീർച്ചയായും. ഏത് സമയത്താണ് ഓർമ്മപ്പെടുത്തേണ്ടത്?",
          pa: "ਜ਼ਰੂਰ। ਕਿਸ ਸਮੇਂ ਯਾਦ ਦਿਵਾਵਾਂ?",
          or: "ନିଶ୍ଚୟ। କେଉଁ ସମୟରେ ମନେ ପକାଇବି?",
          en: "Sure. At what time should I remind you?",
        };

        return {
          handled: true,
          responseText: askTimeByLang[lang] || askTimeByLang["en"],
        };
      } else if (isNo) {
        this.resetDialogue();

        const cancelByLang: Record<string, string> = {
          gu: "ઠીક છે, કોઈ વાંધો નહીં. હું તમારી બીજી શું મદદ કરી શકું?",
          hi: "ठीक है, कोई बात नहीं। मैं आपकी और क्या मदद करूँ?",
          as: "ঠিক আছে, কোনো কথা নাই। মই আন কি সহায় কৰিব পাৰোঁ?",
          bn: "ঠিক আছে, কোনো অসুবিধা নেই। আমি আর কীভাবে সাহায্য করতে পারি?",
          mr: "ठीक आहे, काही हरकत नाही. मी आणखी काय मदत करू?",
          ta: "சரி, பரவாயில்லை. நான் வேறு என்ன உதவ வேண்டும்?",
          te: "సరే, పరవాలేదు. నేను ఇంకా ఏ విధంగా సహాయపడగలను?",
          kn: "ಸರಿ, ತೊಂದರೆಯಿಲ್ಲ. ನಾನು ಇನ್ನೇನು ಸಹಾಯ ಮಾಡಲಿ?",
          ml: "ശരി, കുഴപ്പമില്ല. ഞാൻ വേറെ എന്താണ് സഹായിക്കേണ്ടത്?",
          pa: "ਠੀਕ ਹੈ, ਕੋਈ ਗੱਲ ਨਹੀਂ। ਮੈਂ ਹੋਰ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
          or: "ଠିକ୍ ଅଛି, କିଛି ଅସୁବିଧା ନାହିଁ। ମୁଁ ଆଉ କିପରି ସାହାଯ୍ୟ କରିବି?",
          en: "Alright, no problem. How else may I assist you?",
        };

        return {
          handled: true,
          responseText: cancelByLang[lang] || cancelByLang["en"],
        };
      }
    }

    // =========================================================================
    // STAGE C: General Reminder Time Collection Stage
    // =========================================================================
    if (this._dialogue.stage === "awaiting_reminder_time") {
      const time = extractedTimeFn(raw);
      const targetDate =
        this._dialogue.targetDate ||
        new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const title = this._dialogue.topic || "Scheduled Reminder";
      const remType = this._dialogue.reminderType || "appointment";

      store.addReminder({
        title,
        time,
        date: targetDate,
        repeat: "none",
        type: remType,
        notes: "Created via Memory Bond conversational dialogue",
        active: true,
      });

      this.resetDialogue();

      const savedByLang: Record<string, string> = {
        gu: `ઠીક છે. હું તમને કાલે ${time} વાગ્યે યાદ દેવડાવીશ.`,
        hi: `ठीक है। मैं आपको कल ${time} बजे याद दिलाऊँगा।`,
        as: `ঠিক আছে। মই কাইলৈ ${time} বজাত আপোনাক মনત পেলাই দিম।`,
        bn: `ঠিক আছে। আমি কাল ${time} টায় আপনাকে মনে করিয়ে দেব।`,
        mr: `ठीक आहे. मी उद्या ${time} वाजता आपल्याला आठवण करून देईन.`,
        ta: `சரி. நாளை ${time} மணிக்கு உங்களுக்கு நினைவூட்டுவேன்.`,
        te: `సరే. రేపు ${time} గంటలకు మీకు గుర్తు చేస్తాను.`,
        kn: `ಸರಿ. ನಾಳೆ ${time} ಗಂಟೆಗೆ ನಿಮಗೆ ನೆನಪಿಸುತ್ತೇನೆ.`,
        ml: `ശരി. നാളെ ${time} ന് ഞാൻ നിങ്ങളെ ഓർമ്മിപ്പിക്കും.`,
        pa: `ਠੀਕ ਹੈ। ਮੈਂ ਕੱਲ੍ਹ ${time} ਵਜੇ ਤੁਹਾਨੂੰ ਯਾਦ ਕਰਵਾਵਾਂਗਾ।`,
        or: `ଠିକ୍ ଅଛି। ମୁଁ କାଲି ${time} ଟାରେ ଆପଣଙ୍କୁ ମନେ ପକାଇଦେବି।`,
        en: `Alright. I will remind you tomorrow at ${time}.`,
      };

      return {
        handled: true,
        responseText: savedByLang[lang] || savedByLang["en"],
      };
    }

    // =========================================================================
    // STAGE D: Natural Intent Detection (Casual Statements $\to$ Assistant Dialogue)
    // =========================================================================
    const hasTomorrow =
      t.includes("tomorrow") ||
      t.includes("कल") ||
      t.includes("কাল") ||
      t.includes("কাইলৈ") ||
      t.includes("કાલે") ||
      t.includes("ઉદ્યા") ||
      t.includes("उद्या") ||
      t.includes("நாளை") ||
      t.includes("రేపు") ||
      t.includes("ನಾಳೆ") ||
      t.includes("നാളെ") ||
      t.includes("ਕੱਲ੍ਹ") ||
      t.includes("କାଲି");

    // 1. Medicine statement (User: "મારે કાલે સવારે દવા લેવાની છે" or Hindi/English equivalent)
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

    const isMedicineTakingIntent =
      t.includes("લેવાની છે") ||
      t.includes("લેવી છે") ||
      t.includes("લેવાની") ||
      t.includes("વાની છે") ||
      t.includes("લેવું પડશે") ||
      t.includes("ખાવાની છે") ||
      t.includes("લેની હૈ") ||
      t.includes("लेनी है") ||
      t.includes("खानी है") ||
      t.includes("खाना है") ||
      t.includes("घ्यायचे आहे") ||
      t.includes("ঘ্যায়াচে আহে") ||
      t.includes("খেতে হবে") ||
      t.includes("খাব লাগিব") ||
      t.includes("சாப்பிட வேண்டும்") ||
      t.includes("వేసుకోవాలి") ||
      t.includes("ತೆಗೆದುಕೊಳ್ಳಬೇಕು") ||
      t.includes("കഴിക്കണം") ||
      t.includes("ਲੈਣੀ ਹੈ") ||
      t.includes("have to take") ||
      t.includes("need to take") ||
      t.includes("must take");

    if (mentionsMedicine && (isMedicineTakingIntent || hasTomorrow)) {
      // Lookup scheduled morning medicine from store if available
      const scheduledMed = store.medicines[0];
      const morningTime = scheduledMed?.times[0] || "08:30";

      this._dialogue = {
        stage: "medicine_discussed",
        topic: scheduledMed ? scheduledMed.name : "Morning Medicine",
        reminderType: "medicine",
        targetDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        targetTime: morningTime,
      };

      const medPromptByLang: Record<string, string> = {
        gu: `તમારી સવારની દવાનો સમય ${morningTime} વાગ્યાનો છે. શું હું તમને સવારે ${morningTime} વાગ્યે યાદ દેવડાવું?`,
        hi: `आपकी सुबह की दवा का समय ${morningTime} बजे है। क्या मैं आपको ${morningTime} बजे याद दिलाऊँ?`,
        mr: `आपल्या सकाळच्या औषधाची वेळ ${morningTime} वाजता आहे. मी आपल्याला ${morningTime} वाजता आठवण करून देऊ का?`,
        bn: `আপনার সকালের ওষুধের সময় ${morningTime} টায়। আমি কি আপনাকে ${morningTime} টায় মনে করিয়ে দেব?`,
        as: `আপোনাৰ পুৱাৰ ঔষধৰ সময় ${morningTime} বজাত। মই আপোনাক ${morningTime} বজাত সংকেত দিম নেকি?`,
        ta: `உங்கள் காலை மருந்து நேரம் ${morningTime}. நான் ${morningTime} மணிக்கு நினைவூட்டவா?`,
        te: `మీ ఉదయం మందుల సమయం ${morningTime}. నేను ${morningTime} గంటలకు గుర్తు చేయమంటారా?`,
        kn: `ನಿಮ್ಮ ಬೆಳಗಿನ ಔಷಧಿಯ ಸಮಯ ${morningTime}. ನಾನು ${morningTime} ಕ್ಕೆ ನೆನಪಿಸಲೇ?`,
        ml: `നിങ്ങളുടെ രാവിലത്തെ മരുന്നിന്റെ സമയം ${morningTime} ആണ്. ഞാൻ ${morningTime} ന് ഓർമ്മിപ്പിക്കണമോ?`,
        pa: `ਤੁਹਾਡੀ ਸਵੇਰ ਦੀ ਦਵਾਈ ${morningTime} ਵਜੇ ਹੈ। ਕੀ ਮੈਂ ਯਾਦ ਕਰਵਾਵਾਂ?`,
        or: `ଆପଣଙ୍କ ସକାଳ ଔଷଧ ସମୟ ${morningTime}। ମୁଁ ଆପଣଙ୍କୁ ମନେ ପକାଇବି କି?`,
        en: `Your morning medicine is scheduled for ${morningTime}. Would you like me to remind you at ${morningTime}?`,
      };

      return {
        handled: true,
        responseText: medPromptByLang[lang] || medPromptByLang["en"],
      };
    }

    // 2. Doctor / Clinic statement ("कल डॉक्टर के पास जाना है" / "કાલે ડૉક્ટર પાસે જવાનું છે")
    const mentionsDoctor =
      t.includes("doctor") ||
      t.includes("डॉक्टर") ||
      t.includes("clinic") ||
      t.includes("hospital") ||
      t.includes("ডাক্তাৰ") ||
      t.includes("ডাক্তার") ||
      t.includes("ડોક્ટર") ||
      t.includes("વૈદ્ય") ||
      t.includes("மருத்துவர்") ||
      t.includes("వైద్యుడు") ||
      t.includes("ಡಾಕ್ಟರ್") ||
      t.includes("ഡോക്ടർ");

    const isGoingIntent =
      t.includes("jana hai") ||
      t.includes("जाना है") ||
      t.includes("जવાનું છે") ||
      t.includes("જવાનું") ||
      t.includes("जावे लागेल") ||
      t.includes("যাব লাগে") ||
      t.includes("যেতে হবে") ||
      t.includes("போக வேண்டும்") ||
      t.includes("వెళ్ళాలి") ||
      t.includes("ಹೋಗಬೇಕು") ||
      t.includes("പോകണം") ||
      t.includes("ਜਾਣਾ ਹੈ") ||
      t.includes("ଯିବାକୁ ହେବ") ||
      t.includes("have to go") ||
      t.includes("need to visit");

    if (mentionsDoctor && (isGoingIntent || hasTomorrow)) {
      this._dialogue = {
        stage: "awaiting_reminder_consent",
        topic: "Doctor Appointment",
        reminderType: "appointment",
        targetDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      };

      const docAskByLang: Record<string, string> = {
        gu: "ઠીક છે. શું હું તમને ડૉક્ટરની મુલાકાત માટે યાદ દેવડાવું?",
        hi: "ठीक है। क्या मैं आपको डॉक्टर की मुलाकात याद दिलाऊँ?",
        as: "ঠিক আছে। মই আপোনাক ডাক্তাৰৰ সাক্ষাতৰ সংকেত দিয়াটো বিচাৰে নেকি?",
        bn: "ঠিক আছে। আমি কি আপনাকে ডাক্তারের সাক্ষাতের কথা মনে করিয়ে দেব?",
        mr: "ठीक आहे. मी आपल्याला डॉक्टरांच्या भेटीची आठवण करून देऊ का?",
        ta: "சரி. மருத்துவர் சந்திப்பிற்கு நான் நினைவூட்டவா?",
        te: "సరే. డాక్టర్ అపాయింట్‌మెంట్‌కు నేను గుర్తు చేయమంటారా?",
        kn: "ಸರಿ. ವೈದ್ಯರ ಭೇಟಿಗೆ ನಾನು ನೆನಪಿಸಲೇ?",
        ml: "ശരി. ഡോക്ടറെ കാണുന്നതിനായി ഞാൻ ഓർമ്മിപ്പിക്കണമോ?",
        pa: "ਠੀਕ ਹੈ। ਕੀ ਮੈਂ ਡਾਕਟਰ ਦੀ ਮੁਲਾਕਾਤ ਯਾਦ ਦਿਵਾਵਾਂ?",
        or: "ଠିକ୍ ଅଛି। ଡାକ୍ତରଙ୍କ ସାକ୍ଷାତ ପାଇଁ ମନେ ପକାଇବି କି?",
        en: "Alright. Would you like me to set a reminder for your doctor visit?",
      };

      return {
        handled: true,
        responseText: docAskByLang[lang] || docAskByLang["en"],
      };
    }

    // 3. Market / Shopping statement ("કાલે બજાર જવાનું છે" / "कल बाज़ार जाना है")
    const mentionsMarket =
      t.includes("market") ||
      t.includes("bazaar") ||
      t.includes("बाज़ार") ||
      t.includes("બજાર") ||
      t.includes("দোকান") ||
      t.includes("shopping") ||
      t.includes("বজাৰ") ||
      t.includes("বাজার") ||
      t.includes("சந்தை") ||
      t.includes("మార్కెట్") ||
      t.includes("ಮಾರುಕಟ್ಟೆ") ||
      t.includes("മാർക്കറ്റ്") ||
      t.includes("ਮਾਰਕੀਟ") ||
      t.includes("ହାଟ");

    if (mentionsMarket && (isGoingIntent || hasTomorrow)) {
      this._dialogue = {
        stage: "awaiting_reminder_consent",
        topic: "Market & Groceries",
        reminderType: "shopping",
        targetDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      };

      const mktAskByLang: Record<string, string> = {
        gu: "ઠીક છે. શું હું તમને બજાર જવા માટે યાદ દેવડાવું?",
        hi: "ठीक है। क्या मैं आपको बाज़ार जाने की याद दिलाऊँ?",
        as: "ঠিক আছে। মই আপোনাক বজাৰৰ সংকেত দিয়াটো বিচাৰে নেকি?",
        bn: "ঠিক আছে। আমি কি আপনাকে বাজারে যাওয়ার কথা মনে করিয়ে দেব?",
        mr: "ठीक आहे. मी आपल्याला बाजारात जाण्याची आठवण करून देऊ का?",
        en: "Alright. Would you like me to set a reminder for the market?",
      };

      return {
        handled: true,
        responseText: mktAskByLang[lang] || mktAskByLang["en"],
      };
    }

    return null;
  }

  // Generates natural conversational response when standard intent is conversational
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
        gu: "હું Memory Bond નો તમારો વહાલો સાથી અને સહાયક છું. હું તમારી દવાઓ, યાદો અને દિનચર્યાને પ્રેમથી સાચવું છું.",
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

    // 7. Contextual memory check if user mentions doctor or medicine
    if (
      store &&
      (t.includes("doctor") ||
        t.includes("डॉक्टर") ||
        t.includes("ડોક્ટર") ||
        t.includes("ডাক্তাৰ"))
    ) {
      const nextAppt = store.appointments[0];
      if (nextAppt) {
        if (lang === "gu") {
          return `તમારી આગલી ડૉક્ટર મુલાકાત "${nextAppt.title}" માટે ${nextAppt.date} ના રોજ ${nextAppt.time} વાગ્યે છે.`;
        }
        if (lang === "hi") {
          return `आपकी अगली डॉक्टर मुलाकात "${nextAppt.title}" के लिए ${nextAppt.date} को ${nextAppt.time} बजे है।`;
        }
        if (lang === "bn") {
          return `আপনার পরবর্তী ডাক্তারের অ্যাপয়েন্টমেন্ট "${nextAppt.title}" ${nextAppt.date} তারিখে ${nextAppt.time} টায়।`;
        }
        if (lang === "as") {
          return `আপোনাৰ পৰৱৰ্তী ডাক্তাৰ সাক্ষাৎ "${nextAppt.title}" ${nextAppt.date} তাৰিখে ${nextAppt.time} বজাত।`;
        }
        return `Your next scheduled doctor consultation is "${nextAppt.title}" on ${nextAppt.date} at ${nextAppt.time}.`;
      }
    }

    // 8. Medicine Schedule Query ("When is my medicine?" / "મારી દવા ક્યારે છે?" / "मेरी दवा कब है?")
    const isAskingWhenMedicine =
      (t.includes("when") || t.includes("kab") || t.includes("कब") || t.includes("ક્યારે") || t.includes("কেতিয়া") || t.includes("কখন") || t.includes("कधी")) &&
      (t.includes("medicine") || t.includes("dawa") || t.includes("દવા") || t.includes("दवा") || t.includes("ঔষধ") || t.includes("ওষুধ") || t.includes("औषध"));

    if (store && isAskingWhenMedicine) {
      const scheduledTime = store.reminders.find((r) => r.type === "medicine")?.time || store.medicines[0]?.times[0] || "08:30";
      const medName = store.medicines[0]?.name || "daily medicine";
      const medAnswers: Record<string, string> = {
        gu: `તમારી દવાનો સમય ${scheduledTime} વાગ્યાનો છે (${medName}).`,
        hi: `आपकी दवा का समय ${scheduledTime} बजे है (${medName})।`,
        as: `আপোনাৰ ঔষধৰ সময় ${scheduledTime} বজাত (${medName})।`,
        bn: `আপনার ওষুধের সময় ${scheduledTime} টায় (${medName})।`,
        mr: `आपल्या औषधाची वेळ ${scheduledTime} वाजता आहे (${medName}).`,
        ta: `உங்கள் மருந்து நேரம் ${scheduledTime} (${medName}).`,
        te: `మీ మందుల సమయం ${scheduledTime} (${medName}).`,
        kn: `ನಿಮ್ಮ ಔಷಧಿಯ ಸಮಯ ${scheduledTime} (${medName}).`,
        ml: `നിങ്ങളുടെ മരുന്നിന്റെ സമയം ${scheduledTime} ആണ് (${medName}).`,
        pa: `ਤੁਹਾਡੀ ਦਵਾਈ ਦਾ ਸਮਾਂ ${scheduledTime} ਵਜੇ ਹੈ (${medName})।`,
        or: `ଆପଣଙ୍କ ଔଷଧ ସମୟ ${scheduledTime} (${medName})।`,
        en: `Your medicine is scheduled at ${scheduledTime} (${medName}).`,
      };
      return medAnswers[lang] || medAnswers["en"];
    }

    // 9. Medicine Statement ("My medicine is at 8 PM" / "मेरी दवा 8 बजे है" / "મારી દવા 8 વાગ્યે છે")
    const hasMedStatement =
      (t.includes("my medicine is") || t.includes("medicine is at") || t.includes("dawa 8") || t.includes("दवा 8") || t.includes("દવા 8") || t.includes("दवा है") || t.includes("દવા છે")) &&
      (/\d{1,2}/.test(t) || t.includes("8") || t.includes("pm") || t.includes("બજે") || t.includes("વાગ્યે"));

    if (hasMedStatement && store) {
      const detectedTime = t.includes("8") ? "08:00 PM" : "08:30 AM";
      store.addReminder({
        title: "Evening Medicine",
        time: detectedTime.includes("PM") ? "20:00" : "08:30",
        type: "medicine",
        repeat: "daily",
        notes: "Remembered from voice statement: " + userText,
        active: true,
      });

      const confirmStatements: Record<string, string> = {
        gu: `મેં યાદ રાખી લીધું છે. તમારી દવા ${detectedTime} વાગ્યે છે.`,
        hi: `मैंने याद रख लिया है। आपकी दवा ${detectedTime} बजे है।`,
        as: `মই মনত ৰাখিলোঁ। আপোনাৰ ঔষধ ${detectedTime} বজাত।`,
        bn: `আমি মনে রেখেছি। আপনার ওষুধ ${detectedTime} টায়।`,
        mr: `मी लक्षात ठेवले आहे. आपले औषध ${detectedTime} वाजता आहे.`,
        en: `I have noted that. Your medicine is at ${detectedTime}.`,
      };
      return confirmStatements[lang] || confirmStatements["en"];
    }

    // 10. Personal Memory Bank Lookup: Family Member queries ("Who is Sunita?" / "Who is Aarav?")
    if (t.includes("sunita") || t.includes("सुनीता") || t.includes("સુનીતા") || t.includes("সুনীতা")) {
      const sunitaBio: Record<string, string> = {
        gu: "સુનિતા તમારી વહાલી પુત્રી અને મુખ્ય સંભાળ રાખનાર છે. તે દર રવિવારે હર્બલ ચા લઈને આવે છે અને દરરોજ સાંજે ૫ વાગ્યે તમને ફોન કરે છે.",
        hi: "सुनीता आपकी सुपुत्री और मुख्य देखभालकर्ता हैं। वे हर रविवार हर्बल चाय लाती हैं और रोज़ शाम 5 बजे आपसे बात करती हैं।",
        as: "সুনীতা আপোনাৰ মৰমৰ জীয়াৰী আৰু প্ৰাথমিক সেৱিকা। তেওঁ প্ৰতি দেওবাৰে চাহ লৈ আহে আৰু দৈনিক ৫ বজাত ফোন কৰে।",
        bn: "সুনীতা আপনার প্রিয় কন্যা ও প্রাথমিক সেবিকা। তিনি প্রতি রবিবার চা নিয়ে আসেন এবং প্রতিদিন বিকাল ৫টায় ফোন করেন।",
        mr: "सुनीता आपली कन्या आणि मुख्य काळजीवाहक आहेत. त्या दर रविवारी चहा घेऊन येतात आणि रोज संध्याकाळी फोन करतात.",
        en: "Sunita is your caring daughter and primary caregiver. She visits every Sunday with homemade tea and calls daily at 5 PM.",
      };
      return sunitaBio[lang] || sunitaBio["en"];
    }

    if (t.includes("aarav") || t.includes("आरव") || t.includes("આરવ") || t.includes("আৰভ")) {
      const aaravBio: Record<string, string> = {
        gu: "આરવ તમારો ૮ વર્ષનો વહાલો પૌત્ર છે. તેને તમને સ્કૂલના રંગબેરંગી ચિત્રો બતાવવા અને બિહુ ડાન્સ કરવો ખૂબ ગમે છે.",
        hi: "आरव आपका 8 वर्षीय पोता है। उसे आपको अपनी चित्रकारी दिखाना और बिहू नृत्य करना बहुत पसंद है।",
        as: "আৰভ আপোনাৰ ৮ বছৰীয়া নাতি। তেওঁ ছবি আঁকি দেখুৱাবলৈ আৰু বিহু নাচিবলৈ বৰ ভাল পায়।",
        bn: "আরভ আপনার ৮ বছর বয়সী নাতি। সে ছবি আঁকা দেখাতে এবং বিহু নাচ করতে খুব ভালোবাসে।",
        en: "Aarav is your 8-year-old grandson. He loves showing you his school drawings and dancing Bihu for you.",
      };
      return aaravBio[lang] || aaravBio["en"];
    }

    if (t.includes("rajesh") || t.includes("राजेश") || t.includes("રાજેશ")) {
      const rajeshBio: Record<string, string> = {
        gu: "રાજેશ તમારો પુત્ર છે, જે બેંગલુરુમાં સોફ્ટવેર એન્જિનિયર છે અને દર શનિવારે સાંજે તમને વિડીયો કોલ કરે છે.",
        hi: "राजेश आपके सुपुत्र हैं, जो बेंगलुरु में सॉफ्टवेयर इंजीनियर हैं और हर शनिवार शाम को वीडियो कॉल करते हैं।",
        as: "ৰাজেশ আপোনাৰ পুত্ৰ, যিয়ে বেংগালুৰুত ছফটৱেৰ ইঞ্জিনিয়াৰ হিচাপে কাম কৰে আৰু শনিবাৰে ফোন কৰে।",
        en: "Rajesh is your son who works as a software engineer in Bengaluru and video calls you every Saturday evening.",
      };
      return rajeshBio[lang] || rajeshBio["en"];
    }

    // Default reassuring senior response in the EXACT language
    const fallbackByLang: Record<string, string> = {
      gu: "હું ધ્યાનથી સાંભળી રહ્યો છું. હું તમારી દવાઓ, પાણીના રિમાઇન્ડર, કે યાદોમાં કેવી રીતે મદદ કરી શકું?",
      hi: "मैं सुन रहा हूँ। मैं आपकी दवाओं, पानी के रिमाइंडर, या परिवार की यादों में कैसे मदद करूँ?",
      mr: "मी ऐकत आहे. मी आपल्या औषध किंवा आठवणींमध्ये कशी मदत करू?",
      as: "মই শুনি আছোঁ। মই আপোনাৰ ঔষধ, পানী খোৱাৰ সময় বা স্মৃতি সংৰক্ষণত কেনেকৈ সহায় কৰিব পাৰোঁ?",
      bn: "আমি মনোযোগ দিয়ে শুনছি। আমি আপনার ওষুধ, জল খাওয়ার রিমাইন্ডার বা স্মৃতিতে কীভাবে সাহায্য করতে পারি?",
      ta: "நான் கவனமாகக் கேட்கிறேன். உங்கள் மருந்துகள் அல்லது நினைவூட்டல்களில் எப்படி உதவலாம்?",
      te: "నేను వింటున్నాను. మీ మందులు లేదా రిమైండర్లలో ఎలా సహాయపడగలను?",
      kn: "ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ ಔಷಧಿ ಅಥವಾ ನೆನಪುಗಳಲ್ಲಿ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      ml: "ഞാൻ ശ്രദ്ധിക്കുന്നു. നിങ്ങളുടെ മരുന്നുകളിലോ ഓർമ്മകളിലോ ഞാൻ എങ്ങനെ സഹായിക്കണം?",
      pa: "ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਦਵਾਈ ਜਾਂ ਰੀਮਾਈਂਡਰ ਵਿੱਚ ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?",
      or: "ମୁଁ ଶୁଣୁଛି। ମୁଁ ଆପଣଙ୍କ ଔଷଧ ବା ସ୍ମାରକରେ କିପରି ସାହାଯ୍ୟ କରିବି?",
      en: "I am listening closely. How may I assist you with your medicines, hydration reminders, or cherished memories today?",
    };

    return fallbackByLang[lang] || fallbackByLang["en"];
  }
}

export const conversationalAI = new ConversationalAIEngine();
