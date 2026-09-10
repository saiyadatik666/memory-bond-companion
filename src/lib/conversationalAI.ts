// ===========================================================================
// Memory Bond — Conversational AI Engine (SIH 2026 — SIH26003)
// Natural Multi-Turn Contextual Assistance, Empathy, and Localized Voice Dialogue
// ===========================================================================

import type { MemoryBondStore } from "./memoryBondStore";

export interface ConversationTurn {
  role: "user" | "assistant";
  text: string;
  locale: string;
  timestamp: number;
}

export interface ConversationContext {
  lastActionPrompt?: {
    type: "medicine" | "reminder" | "appointment" | "journal" | "routine";
    data?: any;
    promptText: string;
  };
  turns: ConversationTurn[];
}

// Empathy & Companion Knowledge Bank for Elder Well-being across Indian Languages
const EMPATHY_RESPONSES: Record<string, { loneliness: string; tired: string; happy: string; tea: string; weather: string }> = {
  "hi-IN": {
    loneliness: "मैं हमेशा आपके साथ हूँ। क्या आप परिवार की कोई प्यारी याद सुनना चाहेंगे या कोई शांत खेल खेलना चाहेंगे?",
    tired: "कृपया थोड़ा आराम कर लीजिए। एक गिलास गुनगुना पानी पीजिए और शांति से बैठिए।",
    happy: "यह सुनकर मेरा दिल खुश हो गया! आपकी मुस्कान ही हमारी सबसे बड़ी खुशी है।",
    tea: "गर्म चाय की एक चुस्की मन को बहुत सुकून देती है। क्या आपने कुछ हल्का नाश्ता भी किया?",
    weather: "आज का मौसम शांत और सुखद है। आप थोड़ी देर खिड़की के पास या बालकनी में बैठ सकते हैं।",
  },
  "as-IN": {
    loneliness: "মই সদায় আপোনাৰ লগত আছোঁ। আপুনি পৰিয়ালৰ পুৰণি স্মৃতি মনত পেলাব খোজে নে শান্ত খেল এটা খেলিব?",
    tired: "অনুগ্ৰহ কৰি অলপ জিৰণি লওক। এগিলাচ কুহুমীয়া পানী খাওক আৰু শান্তভাৱে বহক।",
    happy: "শুনি বৰ আনন্দ পালোঁ! আপোনাৰ হাঁহিয়ে আমাৰ আটাইতকৈ ডাঙৰ সুখ।",
    tea: "গৰম অসম চাহৰ এক কাপে মনলৈ বৰ শান্তি আনে। লগত কিবা লঘু আহাৰ খালেনে?",
    weather: "আজিৰ বতৰ বৰ মনোৰম। আপুনি বাৰাণ্ডাত অলপ সময় বহিব পাৰে।",
  },
  "bn-IN": {
    loneliness: "আমি সবসময় আপনার সাথে আছি। পরিবারের কোনো সুন্দর স্মৃতি শুনতে চান নাকি একটা শান্ত খেলা খেলবেন?",
    tired: "অনুগ্রহ করে একটু বিশ্রাম নিন। এক গ্লাস ঈষদুষ্ণ জল পান করে শান্ত হয়ে বসুন।",
    happy: "শুনে খুব ভালো লাগলো! আপনার মুখের হাসিই আমাদের সবচেয়ে বড় আনন্দ।",
    tea: "এক কাপ গরম চা শরীর ও মন জুড়িয়ে দেয়। সাথে কিছু হালকা খেয়েছেন তো?",
    weather: "আজকের আবহাওয়া খুব সুন্দর ও শান্ত। আপনি কিছুক্ষণ বারান্দায় বসতে পারেন।",
  },
  "gu-IN": {
    loneliness: "હું હંમેશા તમારી સાથે છું. શું તમે પરિવારની કોઈ વહાલી યાદ સાંભળવા માંગો છો?",
    tired: "કૃપા કરીને થોડો આરામ કરો. એક ગ્લાસ હુંફાળું પાણી પીઓ અને શાંતિથી બેસો.",
    happy: "આ સાંભળીને ખૂબ આનંદ થયો! તમારું હાસ્ય જ અમારું સાચું સુખ છે.",
    tea: "ગરમ ચા મનને ઘણી શાંતિ આપે છે. શું તમે સાથે કંઈક હળવો નાસ્તો લીધો?",
    weather: "આજનું હવામાન ઘણું શાંત છે. તમે થોડીવાર બાલકનીમાં બેસી શકો છો.",
  },
  "mr-IN": {
    loneliness: "मी सदैव आपल्या सोबत आहे. आपल्याला कुटुंबाची एखादी छान आठवण ऐकायची आहे का?",
    tired: "कृपया थोडी विश्रांती घ्या. एक ग्लास कोमट पाणी प्या आणि शांत बसा.",
    happy: "हे ऐकून खूप आनंद झाला! आपले हसू हीच आमची खरी ताकद आहे.",
    tea: "गरम चहाचा एक घोट मनाला खूप तृप्ती देतो. सोबत काही हलका खाल्ला का?",
    weather: "आजचे वातावरण शांत आणि आल्हाददायक आहे.",
  },
  "ta-IN": {
    loneliness: "நான் எப்போதும் உங்களுடன் இருக்கிறேன். குடும்பத்தின் இனிய நினைவுகளைப் பகிரலாமா?",
    tired: "தயவுசெய்து சிறிது ஓய்வெடுங்கள். கொஞ்சம் வெதுவெதுப்பான நீர் அருந்துங்கள்.",
    happy: "இதைக் கேட்டு மிக்க மகிழ்ச்சி! உங்கள் புன்னகையே எங்கள் செல்வம்.",
    tea: "சூடான தேநீர் மனதிற்கு அமைதி தரும். ஏதாவது சிற்றுண்டி சாப்பிட்டீர்களா?",
    weather: "இன்றைய வானிலை மிகவும் இனிமையாக உள்ளது.",
  },
  "te-IN": {
    loneliness: "నేను ఎల్లప్పుడూ మీతోనే ఉన్నాను. కుటుంబ మధుర జ్ఞాపకాలను గుర్తుచేసుకుందామా?",
    tired: "దయచేసి కాసేపు విశ్రాంతి తీసుకోండి. కొద్దిగా గోరువెచ్చని నీరు త్రాగండి.",
    happy: "ఇది విని చాలా సంతోషంగా ఉంది! మీ చిరునవ్వే మా ఆనందం.",
    tea: "వేడి టీ మనసుకు ఎంతో ప్రశాంతతను ఇస్తుంది.",
    weather: "ఈ రోజు వాతావరణం చాలా ఆహ్లాదకరంగా ఉంది.",
  },
  "kn-IN": {
    loneliness: "ನಾನು ಸದಾ ನಿಮ್ಮೊಂದಿಗಿದ್ದೇನೆ. ಕುಟುಂಬದ ಸುಂದರ ನೆನಪುಗಳನ್ನು ಕೇಳಲು ಇಷ್ಟಪಡುವಿರಾ?",
    tired: "ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ. ಸ್ವಲ್ಪ ಬೆಚ್ಚಗಿನ ನೀರನ್ನು ಕುಡಿಯಿರಿ.",
    happy: "ಇದನ್ನು ಕೇಳಿ ತುಂಬಾ ಸಂತೋಷವಾಯಿತು! ನಿಮ್ಮ ನಗುವೇ ನಮ್ಮ ಶಕ್ತಿ.",
    tea: "ಬಿಸಿ ಚಹಾ ಮನಸ್ಸಿಗೆ ಹಿತ ನೀಡುತ್ತದೆ.",
    weather: "ಇಂದಿನ ಹವಾಮಾನವು ತುಂಬಾ ಆಹ್ಲಾದಕರವಾಗಿದೆ.",
  },
  "ml-IN": {
    loneliness: "ഞാൻ എപ്പോഴും നിങ്ങളോടൊപ്പമുണ്ട്. കുടുംബത്തിന്റെ നല്ല ഓർമ്മകൾ പങ്കുവെക്കണോ?",
    tired: "ദയവായി അല്പം വിശ്രമിക്കൂ. ചൂടുവെള്ളം കുടിച്ച് ശാന്തമായി ഇരിക്കൂ.",
    happy: "ഇത് കേട്ടതിൽ അതിയായ സന്തോഷം!",
    tea: "ഒരു കപ്പ് ചൂടുചായ മനസ്സിന് സമാധാനം നൽകുന്നു.",
    weather: "ഇന്നത്തെ കാലാവസ്ഥ ശാന്തവും സുഖകരവുമാണ്.",
  },
  "pa-IN": {
    loneliness: "ਮੈਂ ਹਮੇਸ਼ਾ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ। ਕੀ ਤੁਸੀਂ ਪਰਿਵਾਰ ਦੀ ਕੋਈ ਮਿੱਠੀ ਯਾਦ ਸੁਣਨਾ ਚਾਹੋਗੇ?",
    tired: "ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹਾ ਆਰਾਮ ਕਰੋ। ਗਰਮ ਪਾਣੀ ਪੀ ਕੇ ਸ਼ਾਂਤੀ ਨਾਲ ਬੈਠੋ।",
    happy: "ਇਹ ਸੁਣ ਕੇ ਬਹੁਤ ਖੁਸ਼ੀ ਹੋਈ! ਤੁਹਾਡੀ ਮੁਸਕਰਾਹਟ ਹੀ ਸਾਡਾ ਸਰਮਾਇਆ ਹੈ।",
    tea: "ਗਰਮ ਚਾਹ ਮਨ ਨੂੰ ਬੜਾ ਸਕੂਨ ਦਿੰਦੀ ਹੈ।",
    weather: "ਅੱਜ ਦਾ ਮੌਸਮ ਬਹੁਤ ਸੁਹਾਵਣਾ ਹੈ।",
  },
  "or-IN": {
    loneliness: "ମୁଁ ସବୁବେଳେ ଆପଣଙ୍କ ସହିତ ଅଛି। ପରିବାରର କୌଣସି ସୁନ୍ଦର ସ୍ମୃତି ମନେ ପକାଇବା କି?",
    tired: "ଦୟାକରି ଟିକେ ବିଶ୍ରାମ ନିଅନ୍ତୁ। ଗ୍ଲାସେ ଉଷୁମ ପାଣି ପିଇ ଶାନ୍ତ ଭାବେ ବସନ୍ତୁ।",
    happy: "ଏହା ଶୁଣି ବହୁତ ଖୁସି ଲାଗିଲା!",
    tea: "ଗରମ ଚାହା ମନକୁ ଶାନ୍ତି ଦିଏ।",
    weather: "ଆଜିର ପାଣିପାଗ ବହୁତ ଶାନ୍ତ ଓ ସୁନ୍ଦର।",
  },
  "en-IN": {
    loneliness: "I am always right here with you. Would you like to hear a cherished family memory or play a peaceful game?",
    tired: "Please take a comfortable rest. Drink a glass of warm water and relax peacefully.",
    happy: "It brings me such joy to hear that! Your cheerful spirit brightens the entire day.",
    tea: "A warm cup of tea brings so much comfort. Did you also have a light snack with it?",
    weather: "The day feels calm and peaceful. Sitting near the window or balcony might be lovely.",
  },
};

export class ConversationalAIEngine {
  private _context: ConversationContext = {
    turns: [],
  };

  public getContext(): ConversationContext {
    return this._context;
  }

  public recordTurn(role: "user" | "assistant", text: string, locale: string) {
    this._context.turns.push({
      role,
      text,
      locale,
      timestamp: Date.now(),
    });
    // Keep last 10 turns in session memory
    if (this._context.turns.length > 10) {
      this._context.turns.shift();
    }
  }

  public setPendingAction(actionPrompt: ConversationContext["lastActionPrompt"]) {
    this._context.lastActionPrompt = actionPrompt;
  }

  public clearPendingAction() {
    this._context.lastActionPrompt = undefined;
  }

  // Generates natural conversational response when standard intent is conversational
  public generateConversationalReply(
    userText: string,
    locale = "en-IN",
    store?: MemoryBondStore
  ): string {
    const t = userText.toLowerCase().trim();
    const lang = locale.split("-")[0] || "en";
    const bank = EMPATHY_RESPONSES[locale] || EMPATHY_RESPONSES[`${lang}-IN`] || EMPATHY_RESPONSES["en-IN"];

    // 1. Feelings of Loneliness or Isolation
    if (
      t.includes("lonely") ||
      t.includes("alone") ||
      t.includes("अकेला") ||
      t.includes("एकांत") ||
      t.includes("অকলশৰীয়া") ||
      t.includes("একাকী") ||
      t.includes("એકલા") ||
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
      t.includes("थकान") ||
      t.includes("ক্লান্ত") ||
      t.includes("થાક") ||
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
      t.includes("आनंद") ||
      t.includes("সুখী") ||
      t.includes("આનંદ") ||
      t.includes("मजा") ||
      t.includes("സന്തോഷം")
    ) {
      return bank.happy;
    }

    // 4. Tea / Water / Refreshment
    if (
      t.includes("chai") ||
      t.includes("tea") ||
      t.includes("coffee") ||
      t.includes("चाय") ||
      t.includes("চা") ||
      t.includes("ચા") ||
      t.includes("காபி")
    ) {
      return bank.tea;
    }

    // 5. Weather / Morning Calm
    if (
      t.includes("weather") ||
      t.includes("mausam") ||
      t.includes("मौसम") ||
      t.includes("বতৰ") ||
      t.includes("আবহাওয়া") ||
      t.includes("હવામાન") ||
      t.includes("हवामान")
    ) {
      return bank.weather;
    }

    // 6. Senior asking who you are / App Identity
    if (
      t.includes("who are you") ||
      t.includes("tum kaun ho") ||
      t.includes("तुम कौन हो") ||
      t.includes("আপুনি কোন") ||
      t.includes("তুমি কে") ||
      t.includes("તમે કોણ છો")
    ) {
      if (locale.startsWith("hi")) {
        return "मैं Memory Bond का आपका मित्र और सहायक हूँ। मैं आपकी दवाएं, यादें और दिनचर्या को प्यार से सहेजता हूँ।";
      }
      if (locale.startsWith("as")) {
        return "মই Memory Bond ৰ আপোনাৰ মৰমৰ সংগী। মই আপোনাৰ ঔষধ, স্মৃতি আৰু দিনটোৰ কাম মনত ৰখাত সহায় কৰোঁ।";
      }
      if (locale.startsWith("bn")) {
        return "আমি Memory Bond এর আপনার বিশ্বস্ত সঙ্গী। আমি আপনার ওষুধ, স্মৃতি ও দৈনন্দিন রুটিন যত্নে মনে রাখি।";
      }
      return "I am your caring Memory Bond companion, here to assist you with medicines, cherished memories, and daily routines.";
    }

    // 7. Contextual memory check if user mentions doctor or medicine
    if (store && (t.includes("doctor") || t.includes("डॉक्टर") || t.includes("ଡାକ୍ତର"))) {
      const nextAppt = store.appointments[0];
      if (nextAppt) {
        if (locale.startsWith("hi")) {
          return `आपकी अगली डॉक्टर मुलाकात ${nextAppt.title} के लिए ${nextAppt.date} को ${nextAppt.time} बजे है।`;
        }
        return `Your next scheduled doctor consultation is "${nextAppt.title}" on ${nextAppt.date} at ${nextAppt.time}.`;
      }
    }

    // Default senior-friendly reassuring fallback
    if (locale.startsWith("hi")) {
      return "मैं सुन रहा हूँ। मैं आपकी दवाओं, पानी के रिमाइंडर, या परिवार की यादों में कैसे मदद करूँ?";
    }
    if (locale.startsWith("as")) {
      return "মই শুনি আছোঁ। মই আপোনাৰ ঔষধ, পানী খোৱাৰ সময়, বা দিনলিপিৰ স্মৃতি সংৰক্ষণত কেনেকৈ সহায় কৰিব পাৰোঁ?";
    }
    if (locale.startsWith("bn")) {
      return "আমি মনোযোগ দিয়ে শুনছি। আমি আপনার ওষুধ, জল খাওয়ার রিমাইন্ডার বা স্মৃতি সংরক্ষণে কীভাবে সাহায্য করতে পারি?";
    }
    return "I am listening closely. How may I assist you with your medicines, hydration reminders, or cherished memories today?";
  }
}

export const conversationalAI = new ConversationalAIEngine();
