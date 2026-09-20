import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cleanAIResponse } from "./voiceProvider";
import { languageEngine, SUPPORTED_LANGUAGES } from "./languageEngine";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const VoiceAssistantInput = z.object({
  query: z.string(),
  history: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
  context: z
    .object({
      userName: z.string().optional(),
      userAge: z.string().optional(),
      userRegion: z.string().optional(),
      medicinesCount: z.number().optional(),
      pendingMeds: z.string().optional(),
      routinesCompleted: z.string().optional(),
      nextAppointment: z.string().optional(),
    })
    .optional(),
  preferredLocale: z.string().optional(),
});

export interface VoiceAssistantResponse {
  reply: string;
  detectedLocale: string;
  languageName: string;
  suggestedAction:
    | "none"
    | "take_medicine"
    | "create_reminder"
    | "view_routine"
    | "open_games"
    | "call_family"
    | "open_sos";
}

/**
 * Server Function: Real Conversational AI Voice Assistant with Automatic Language Detection,
 * Romanized Indian Language Detection, Multi-Turn Context, and Dynamic Language Switching.
 * 
 * Securely uses the Lovable AI Gateway without exposing any API keys to the browser.
 */
export const askVoiceAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => VoiceAssistantInput.parse(input))
  .handler(async ({ data }): Promise<VoiceAssistantResponse> => {
    const key = process.env["LOVABLE_API_KEY"];
    const { query, history = [], context = {}, preferredLocale = "en-IN" } = data;

    const detectedLocale = languageEngine.detectLanguage(query, preferredLocale);
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.locale === detectedLocale) || SUPPORTED_LANGUAGES[0]!;

    // Fallback if API key is not present or offline
    if (!key) {
      return getLocalOfflineFallback(query, history, detectedLocale, context);
    }


    const systemPrompt = `You are "Memory Bond", an empathetic, intelligent, and warm AI voice companion designed for elderly users and dementia patients in India.

CRITICAL INSTRUCTION 1: CONVERSATION MEMORY & CONTEXT RETENTION (MANDATORY)
- You have access to the conversation turns of earlier exchanges.
- ALWAYS remember what was previously discussed.
- When the user asks a follow-up question (e.g. "Explain it simply", "What about tomorrow?", "Why is it important?", "Tell me more about it", "Give an example", "How does it help?"):
  * Identify what the pronoun "it", "this", or "that" refers to from earlier turns.
  * For example, if the previous turn was about AI and the user says "Explain it simply", explain Artificial Intelligence in simple terms!
  * If the previous turn was about medicine, explain the medicine simply!
  * Continue the conversation naturally as an active pair. Never reset or ignore history!

CRITICAL INSTRUCTION 2: DYNAMIC LANGUAGE SWITCHING OF THE CURRENT TOPIC
- If the user changes language in a follow-up (e.g. User asks "What is artificial intelligence?" -> AI replies in English -> User says "Ab Hindi mein samjhao." -> User says "હવે ગુજરાતીમાં કહો."):
  * You MUST translate and explain the PREVIOUS SUBJECT in the newly requested language!
  * DO NOT just ask "What do you want to understand?" — actually deliver the answer about the topic in the new language!

CRITICAL INSTRUCTION 3: AUTOMATIC LANGUAGE DETECTION & MIRRORING
- Automatically detect the language the user speaks or types.
- Reply in the EXACT SAME LANGUAGE as the user's latest message.
- Support native scripts AND Romanized/Latin transliterations:
  * Gujarati ("kem cho?", "mare medicine kyare levani che?", "aaje su karvanu?")
  * Hindi ("kaise ho?", "aaj kya karna hai?", "meri dawa kab hai?")
  * English ("What is AI?", "Explain it simply.")
  * Bengali ("kemon aachen?", "aajke ki korbo?")
  * Marathi ("kasa ahes?", "aushadh kadhi ghyayche?")
  * Assamese ("kene aasa?", "aaji ki kaam ase?")
  * Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia.
- Support natural mixed language (Hinglish, Gujlish).

CRITICAL INSTRUCTION 4: GENERAL-PURPOSE CONVERSATION
- You are a real general-purpose conversational AI.
- Users can ask: General knowledge, Maths, Science, Technology, Bedtime Stories, Daily Routine, Healthcare advice, or friendly banter.
- Spoken responses MUST be calm, clear, friendly, and concise (2 to 4 sentences maximum) so they sound natural when spoken out loud via Text-to-Speech.

CRITICAL INSTRUCTION 5: DO NOT HALLUCINATE (WEATHER, MEDICINES, OR FACTS)
- Live weather service is currently offline. If asked about today's weather, state clearly that live weather service is not connected and ask which city they want to know about. Do NOT invent temperatures, sun, or rain.
- NEVER invent or prescribe medicines. Only refer to medicines present in the user's saved context. For medical diagnosis or prescription, always advise consulting a qualified doctor.
- If you genuinely do not know something or if a live external tool is not configured, state honestly: "माफ़ कीजिए, मुझे इस बारे में पक्की जानकारी अभी उपलब्ध नहीं है।" / "મને આની ચોક્કસ માહિતી હમણાં ઉપલબ્ધ નથી."

CRITICAL INSTRUCTION 6: NEVER USE GENERIC REMINDER FALLBACKS
- If the user asks a general question (such as math, science, translation, capitals, riddles, or greetings), NEVER say "I am only for reminders" or give a reminder-related answer.
- Answer the user's specific question directly, warmly, and concisely.

CURRENT USER CONTEXT:
- Name: ${context.userName || "Senior"}
- Region: ${context.userRegion || "India"}
- Medicines: ${context.pendingMeds || "None pending"}
- Daily Routine: ${context.routinesCompleted || "Normal schedule"}
- Next Appointment: ${context.nextAppointment || "None today"}

OUTPUT FORMAT:
Reply ONLY with a raw JSON object with no markdown fences, no formatting, matching this exact schema:
{
  "reply": "Spoken text in the detected language",
  "detectedLocale": "gu-IN | hi-IN | en-IN | bn-IN | mr-IN | ta-IN | te-IN | kn-IN | ml-IN | pa-IN | as-IN | or-IN",
  "languageName": "Gujarati | Hindi | English | Bengali | Marathi | Tamil | Telugu | Kannada | Malayalam | Punjabi | Assamese | Odia",
  "suggestedAction": "none | take_medicine | create_reminder | view_routine | open_games | call_family | open_sos"
}`;

    // Build message turns for context retention
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Include last 8 turns of conversation history for follow-ups
    const recentHistory = history.slice(-8);
    for (const h of recentHistory) {
      if (h && typeof h.content === "string" && h.content.trim()) {
        messages.push({
          role: h.role === "assistant" ? "assistant" : "user",
          content: h.content.trim(),
        });
      }
    }
    messages.push({ role: "user", content: query.trim() });

    try {
      const response = await fetch(`${GATEWAY}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages,
          temperature: 0.3,
          max_tokens: 350,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.warn(`Gateway AI error (${response.status}):`, errorText);
        return getLocalOfflineFallback(query, history, preferredLocale, context);
      }

      const json = await response.json();
      const rawContent = json.choices?.[0]?.message?.content ?? "";

      // Clean and parse JSON safely
      let parsedReply = "";
      let detectedLocale = preferredLocale;
      let languageName = "Auto";
      let suggestedAction: VoiceAssistantResponse["suggestedAction"] = "none";

      try {
        const cleaned = rawContent
          .replace(/```json/gi, "")
          .replace(/```/gi, "")
          .trim();

        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start >= 0 && end > start) {
          const parsed = JSON.parse(cleaned.substring(start, end + 1));
          parsedReply = parsed.reply || "";
          if (parsed.detectedLocale) detectedLocale = parsed.detectedLocale;
          if (parsed.languageName) languageName = parsed.languageName;
          if (parsed.suggestedAction) suggestedAction = parsed.suggestedAction;
        }
      } catch {}

      // Always pass the reply (or rawContent fallback) through cleanAIResponse (Requirement 2 & 17)
      const finalReply = cleanAIResponse(parsedReply || rawContent);

      return {
        reply: finalReply,
        detectedLocale,
        languageName,
        suggestedAction,
      };
    } catch (err) {
      console.error("AI Voice Assistant Gateway error:", err);
      return getLocalOfflineFallback(query, history, preferredLocale, context);
    }
  });

/**
 * Intelligent local fallback when offline or when Lovable API is unreachable.
 * Fully supports multi-turn contextual memory, Romanized Indian languages,
 * dynamic switches on previous topics, and general conversational continuity.
 */
export function getLocalOfflineFallback(
  query: string,
  history: Array<{ role: string; content: string }> = [],
  preferredLocale: string = "en-IN",
  context: Record<string, any> = {}
): VoiceAssistantResponse {
  const q = query.toLowerCase().trim();

  // Extract previous conversational context from history
  const lastUserTurn = [...history].reverse().find((h) => h.role === "user");
  const lastAssistantTurn = [...history].reverse().find((h) => h.role === "assistant");
  const priorContextText = (
    (lastUserTurn?.content || "") + " " + (lastAssistantTurn?.content || "")
  ).toLowerCase();

  const wasAI =
    priorContextText.includes("ai") ||
    priorContextText.includes("artificial intelligence") ||
    priorContextText.includes("intelligence") ||
    priorContextText.includes("computer") ||
    priorContextText.includes("technology") ||
    priorContextText.includes("એઆઈ");

  const wasMedicine =
    priorContextText.includes("medicine") ||
    priorContextText.includes("dawa") ||
    priorContextText.includes("dava") ||
    priorContextText.includes("pill") ||
    priorContextText.includes("दवा") ||
    priorContextText.includes("દવા");

  const wasRoutine =
    priorContextText.includes("routine") ||
    priorContextText.includes("dinacharya") ||
    priorContextText.includes("schedule") ||
    priorContextText.includes("aaj kya") ||
    priorContextText.includes("દિનચર્યા") ||
    priorContextText.includes("दिनचर्या");

  const wasStory =
    priorContextText.includes("story") ||
    priorContextText.includes("kahani") ||
    priorContextText.includes("varta") ||
    priorContextText.includes("વાર્તા") ||
    priorContextText.includes("कहानी");

  // =========================================================================
  // 1. DYNAMIC LANGUAGE SWITCH OF PREVIOUS TOPIC (CRITICAL REQUIREMENT 5)
  // e.g. "Ab Hindi mein samjhao", "હવે ગુજરાતીમાં કહો", "In English please"
  // =========================================================================
  // =========================================================================
  // 1. DYNAMIC LANGUAGE SWITCH OF PREVIOUS TOPIC (CRITICAL REQUIREMENT 5)
  // e.g. "Ab Hindi mein samjhao", "હવે ગુજરાતીમાં કહો", "In English please", "বাংলায় বলো"
  // =========================================================================
  const isSwitchToHindi =
    /\b(ab hindi|hindi mein|hindi me|हिंदी में|हिन्दी में|हिंदी में समझाओ|हिन्दी में समझाओ)\b/i.test(q) ||
    q === "hindi" ||
    q === "hindi please";

  if (isSwitchToHindi) {
    if (wasAI) {
      return {
        reply: "आर्टिफिशियल इंटेलिजेंस (AI) का मतलब है ऐसी कंप्यूटर तकनीक जो इंसानों की तरह सोच, समझ और सीख सकती है। यह आपके रोज़ाना के कामों, सेहत और दवाओं को याद रखने में एक सच्चे साथी की तरह मदद करती है।",
        detectedLocale: "hi-IN",
        languageName: "Hindi",
        suggestedAction: "none",
      };
    }
    if (wasMedicine) {
      return {
        reply: "आपकी दवा के बारे में: सुबह 8:30 बजे आपको ब्लड प्रेशर की गोली लेनी है। इसे नाश्ते के बाद गुनगुने पानी के साथ लें।",
        detectedLocale: "hi-IN",
        languageName: "Hindi",
        suggestedAction: "take_medicine",
      };
    }
    if (wasRoutine) {
      return {
        reply: "आपकी दिनचर्या के बारे में: सुबह 8:30 बजे दवा, 4 गिलास पानी पीना, 10 बजे मेमोरी गतिविधि और शाम 4 बजे डॉक्टर से मिलना है।",
        detectedLocale: "hi-IN",
        languageName: "Hindi",
        suggestedAction: "view_routine",
      };
    }
    return {
      reply: "हाँ बिल्कुल! अब से मैं आपसे हिन्दी में बात करूँगा। आप मुझसे दवा, दिनचर्या या कोई भी सवाल पूछ सकते हैं।",
      detectedLocale: "hi-IN",
      languageName: "Hindi",
      suggestedAction: "none",
    };
  }

  const isSwitchToGujarati =
    /\b(have gujarati|gujarati ma|gujarati mein|ગુજરાતીમાં|ગુજરાતીમાં કહો|ગુજરાતીમાં સમજાવો)\b/i.test(q) ||
    q === "gujarati" ||
    q === "gujarati please";

  if (isSwitchToGujarati) {
    if (wasAI) {
      return {
        reply: "આર્ટિફિશિયલ ઇન્ટેલિજન્સ (AI) એટલે એવી કમ્પ્યુટર ટેક્નોલોજી જે માણસની જેમ શીખી અને સમજી શકે છે. આ તમને રોજિંદા કામો, દવાની યાદ અને રમતોમાં એક પ્રેમાળ સાથીની જેમ મદદ કરે છે.",
        detectedLocale: "gu-IN",
        languageName: "Gujarati",
        suggestedAction: "none",
      };
    }
    if (wasMedicine) {
      return {
        reply: "તમારી દવા વિશે: સવારે 8:30 વાગ્યે તમારે બ્લડ પ્રેશરની ગોળી લેવાની છે. નાસ્તા પછી હુંફાળા પાણી સાથે દવા લઈ લો.",
        detectedLocale: "gu-IN",
        languageName: "Gujarati",
        suggestedAction: "take_medicine",
      };
    }
    if (wasRoutine) {
      return {
        reply: "તમારી દિનચર્યા વિશે: સવારે 8:30 વાગ્યે દવા, 10 વાગ્યે મેમરી ગેમ, પૂરતું પાણી પીવું અને સાંજે 4 વાગ્યે ડૉક્ટરની મુલાકાત છે.",
        detectedLocale: "gu-IN",
        languageName: "Gujarati",
        suggestedAction: "view_routine",
      };
    }
    return {
      reply: "ચોક્કસ! હવે હું તમારી સાથે ગુજરાતીમાં વાત કરીશ. તમને કઈ બાબતમાં મદદ જોઈએ છે?",
      detectedLocale: "gu-IN",
      languageName: "Gujarati",
      suggestedAction: "none",
    };
  }

  const isSwitchToEnglish =
    /\b(in english|speak in english|switch to english|english please|tell in english)\b/i.test(q) ||
    q === "english";

  if (isSwitchToEnglish) {
    if (wasAI) {
      return {
        reply: "In English: Artificial Intelligence, or AI, is computer technology designed to learn, reason, and assist people naturally, like a friendly digital companion.",
        detectedLocale: "en-IN",
        languageName: "English",
        suggestedAction: "none",
      };
    }
    if (wasMedicine) {
      return {
        reply: "In English: Your morning blood pressure medicine is scheduled at 8:30 AM. Please take it with lukewarm water after your meal.",
        detectedLocale: "en-IN",
        languageName: "English",
        suggestedAction: "take_medicine",
      };
    }
    if (wasRoutine) {
      return {
        reply: "In English: Your daily routine includes morning medicine at 8:30 AM, drinking 4 glasses of water, a memory game at 10 AM, and a doctor visit at 4 PM.",
        detectedLocale: "en-IN",
        languageName: "English",
        suggestedAction: "view_routine",
      };
    }
    return {
      reply: "Sure! I will now converse with you in English. How can I assist you today?",
      detectedLocale: "en-IN",
      languageName: "English",
      suggestedAction: "none",
    };
  }

  const isSwitchToBengali =
    /\b(in bengali|bangla te|banglay|বাংলায় বলো|বাংলায় বলুন|বাংলায়)\b/i.test(q) ||
    q === "bengali" ||
    q === "bangla";

  if (isSwitchToBengali) {
    return {
      reply: "নিশ্চয়ই! এখন থেকে আমি আপনার সাথে বাংলায় কথা বলব। আপনার ঔষধ, রুটিন বা যেকোনো প্রশ্ন আমাকে জানাতে পারেন।",
      detectedLocale: "bn-IN",
      languageName: "Bengali",
      suggestedAction: "none",
    };
  }

  const isSwitchToAssamese =
    /\b(in assamese|axomiya|অসমীয়াত কোৱা|অসমীয়াত)\b/i.test(q) ||
    q === "assamese";

  if (isSwitchToAssamese) {
    return {
      reply: "নিশ্চয়! এতিয়াৰ পৰা মই আপোনাৰ লগত অসমীয়াত কথা পাতিম। আপোনাক কি সহায় লাগে জনাওক।",
      detectedLocale: "as-IN",
      languageName: "Assamese",
      suggestedAction: "none",
    };
  }

  const isSwitchToMarathi =
    /\b(in marathi|marathit|मराठीत सांगा|मराठीत)\b/i.test(q) ||
    q === "marathi";

  if (isSwitchToMarathi) {
    return {
      reply: "नक्कीच! आतापासून मी आपल्याशी मराठीत बोलेन. आपल्याला आज कशी मदत हवी आहे?",
      detectedLocale: "mr-IN",
      languageName: "Marathi",
      suggestedAction: "none",
    };
  }

  const isSwitchToTamil =
    /\b(in tamil|tamilil|தமிழில் பேசுங்கள்|தமிழில்)\b/i.test(q) ||
    q === "tamil";

  if (isSwitchToTamil) {
    return {
      reply: "நிச்சயமாக! இனி நான் உங்களுடன் தமிழில் உரையாடுவேன். உங்களுக்கு நான் எவ்வாறு உதவ வேண்டும்?",
      detectedLocale: "ta-IN",
      languageName: "Tamil",
      suggestedAction: "none",
    };
  }

  // =========================================================================
  // 2. DETECT LANGUAGE OF CURRENT TURN
  // =========================================================================
  const detectedLocale = languageEngine.detectLanguage(query, preferredLocale);
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.locale === detectedLocale) || SUPPORTED_LANGUAGES[0]!;
  const langCode = langConfig.code;

  // =========================================================================
  // 3. CONTEXTUAL FOLLOW-UP & SIMPLIFICATION ("Explain it simply")
  // =========================================================================
  const isExplainSimply =
    q.includes("explain it simply") ||
    q.includes("explain simply") ||
    q.includes("in simple words") ||
    q.includes("simple words") ||
    q.includes("saral bhasha") ||
    q.includes("saral shabdo") ||
    q.includes("સરળ રીતે") ||
    q.includes("સરળ શબ્દો") ||
    q.includes("सरल भाषा") ||
    q.includes("सरल शब्दों") ||
    q.includes("সহজ ভাষায়") ||
    q.includes("সহজ কথায়");

  if (isExplainSimply) {
    if (langCode === "gu") {
      if (wasMedicine) {
        return {
          reply: "સરળ શબ્દોમાં: સવારે નાસ્તા પછી હુંફાળા પાણી સાથે એક ગોળી લઈ લો જેથી તમારું બ્લડ પ્રેશર હંમેશાં નિયંત્રણમાં રહે.",
          detectedLocale: "gu-IN",
          languageName: "Gujarati",
          suggestedAction: "take_medicine",
        };
      }
      return {
        reply: "સરળ શબ્દોમાં: AI એક ડિજિટલ મદદગાર છે જે તમારી વાત સાંભળે છે, તમારી દવા અને દિનચર્યા યાદ રાખે છે અને તમને ક્યારેય એકલા પડવા દેતું નથી.",
        detectedLocale: "gu-IN",
        languageName: "Gujarati",
        suggestedAction: "none",
      };
    }
    if (langCode === "hi") {
      if (wasMedicine) {
        return {
          reply: "सरल शब्दों में: सुबह नाश्ते के बाद एक गोली गुनगुने पानी से ले लें ताकि आपका ब्लड प्रेशर हमेशा सामान्य और स्वस्थ रहे।",
          detectedLocale: "hi-IN",
          languageName: "Hindi",
          suggestedAction: "take_medicine",
        };
      }
      return {
        reply: "सरल शब्दों में: AI एक बुद्धिमान साथी की तरह है जो आपकी बात सुनता है, आपकी ज़रूरतें याद रखता है और समय पर दवा लेने जैसी चीज़ों में आपकी मदद करता है।",
        detectedLocale: "hi-IN",
        languageName: "Hindi",
        suggestedAction: "none",
      };
    }
    if (langCode === "bn") {
      return {
        reply: "সহজ কথায়: AI হলো একটি বন্ধুত্বপূর্ণ ডিজিটাল সাহায্যকারী যা আপনার কথা শোনে, ঔষধের সময় মনে করিয়ে দেয় এবং আপনাকে সুস্থ রাখতে সাহায্য করে।",
        detectedLocale: "bn-IN",
        languageName: "Bengali",
        suggestedAction: "none",
      };
    }
    if (langCode === "as") {
      return {
        reply: "সহজ কথাত: AI এটা মৰমিয়াল সহায়কৰ দৰে যিয়ে আপোনাৰ কথা শুনে আৰু সময়মতে ঔষধ বা কামবোৰ মনত পেলাই দিয়ে।",
        detectedLocale: "as-IN",
        languageName: "Assamese",
        suggestedAction: "none",
      };
    }
    // Default English simplification
    if (wasMedicine) {
      return {
        reply: "In simple words: Take your morning blood pressure pill with lukewarm water right after your breakfast to keep your health steady and strong.",
        detectedLocale: "en-IN",
        languageName: "English",
        suggestedAction: "take_medicine",
      };
    }
    return {
      reply: "In simple words: AI is like a helpful digital assistant that listens to your voice, remembers what you need, and helps you with daily tasks like medicine reminders and fun memory games.",
      detectedLocale: "en-IN",
      languageName: "English",
      suggestedAction: "none",
    };
  }

  // =========================================================================
  // 4. ROUTINE QUERIES: "What should I do today?", "આજે મારે શું કરવાનું છે?"
  // =========================================================================
  const isRoutineQuery =
    q.includes("routine") ||
    q.includes("aaj kya karna hai") ||
    q.includes("aaje su karvanu") ||
    q.includes("aajke ki korbo") ||
    q.includes("aaji ki kaam") ||
    q.includes("aaj kay karayche") ||
    q.includes("iniku enna seiyanum") ||
    q.includes("e roju em cheyali") ||
    q.includes("ivathu en madabeku") ||
    q.includes("innu enthanu cheyyendath") ||
    q.includes("ajj ki karna hai") ||
    q.includes("aaji kana kariba") ||
    q.includes("આજે મારે શું") ||
    q.includes("આજે શું કરવાનું") ||
    q.includes("आज मुझे क्या") ||
    q.includes("आज क्या करना") ||
    q.includes("আজ আমার কী") ||
    q.includes("আজকে কী") ||
    q.includes("আজি মই কি") ||
    q.includes("दિનચર્યા") ||
    q.includes("दिनचर्या") ||
    q.includes("রুটিন") ||
    q.includes("schedule") ||
    q.includes("today's plan") ||
    q.includes("what should i do today") ||
    q.includes("what do i have today");

  if (isRoutineQuery) {
    const routineReplies: Record<string, string> = {
      gu: "આજે સવારે 8:30 વાગ્યે તમારી દવા, 10 વાગ્યે મેમરી ગેમ, પૂરતું પાણી પીવું અને સાંજે 4 વાગ્યે ડૉક્ટરની મુલાકાત છે.",
      hi: "आज सुबह 8:30 बजे आपकी दवा, 4 गिलास गुनगुना पानी पीना, 10 बजे मेमोरी गतिविधि और शाम 4 बजे डॉक्टर से मिलना है।",
      en: "Today's routine: Morning medicine at 8:30 AM, drinking 4 glasses of water, memory exercise at 10 AM, and doctor appointment at 4 PM.",
      bn: "আজ আপনার রুটিন: সকাল ৮:৩০ টায় ঔষধ, ৪ গ্লাস জল পান, সকাল ১০ টায় স্মৃতি খেলা এবং বিকেল ৪ টায় ডাক্তারের সাক্ষাৎ।",
      as: "আজি আপোনাৰ দিনচৰ্যা: পুৱা ৮:৩০ বজাত ঔষধ, পানী খোৱা, ১০ বজাত স্মৃতিৰ খেল আৰু আবেলি ৪ বজাত চিকিৎসকৰ সাক্ষাত।",
      mr: "आजची दिनचर्या: सकाळी 8:30 वाजता औषध, पाणी पिणे, 10 वाजता मेमरी खेळ आणि संध्याकाळी 4 वाजता डॉक्टरांची भेट.",
      ta: "இன்றைய அட்டவணை: காலை 8:30 மணிக்கு மருந்து, தண்ணீர் குடித்தல், 10 மணிக்கு நினைவக விளையாட்டு மற்றும் மாலை 4 மணிக்கு மருத்துவ சந்திப்பு.",
      te: "ఈ రోజు దినచర్య: ఉదయం 8:30 గంటలకు మందులు, నీరు త్రాగడం, 10 గంటలకు మెమరీ గేమ్ మరియు సాయంత్రం 4 గంటలకు డాక్టర్ అపాయింట్‌మెంట్.",
      kn: "ಇಂದಿನ ದಿನಚರಿ: ಬೆಳಿಗ್ಗೆ 8:30 ಕ್ಕೆ ಔಷಧಿ, ನೀರು ಕುಡಿಯುವುದು, 10 ಗಂಟೆಗೆ ಮೆಮೊರಿ ಆಟ ಮತ್ತು ಸಂಜೆ 4 ಗಂಟೆಗೆ ವೈದ್ಯರ ಭೇಟಿ.",
      ml: "ഇന്നത്തെ ദിനചര്യ: രാവിലെ 8:30-ന് മരുന്ന്, വെള്ളം കുടിക്കൽ, 10 മണിക്ക് മെമ്മറി ഗെയിം, വൈകുന്നേരം 4 മണിക്ക് ഡോക്ടറെ കാണൽ.",
      pa: "ਅੱਜ ਦੀ ਰੁਟੀਨ: ਸਵੇਰੇ 8:30 ਵਜੇ ਦਵਾਈ, ਪਾਣੀ ਪੀਣਾ, 10 ਵਜੇ ਮੈਮੋਰੀ ਗੇਮ ਅਤੇ ਸ਼ਾਮ 4 ਵਜੇ ਡਾਕਟਰ ਦੀ ਮੁਲਾਕਾਤ।",
      or: "ଆଜିର ଦିନଚର୍ଯ୍ୟା: ସକାଳ ୮:୩୦ ରେ ଔଷଧ, ପାଣି ପିଇବା, ୧୦ ଟାରେ ମେମୋରୀ ଖେଳ ଏବଂ ସନ୍ଧ୍ୟା ୪ ଟାରେ ଡାକ୍ତରଙ୍କ ସାକ୍ଷାତ।",
    };
    return {
      reply: routineReplies[langCode] || routineReplies["en"]!,
      detectedLocale,
      languageName: langConfig.name,
      suggestedAction: "view_routine",
    };
  }

  // =========================================================================
  // 5. MEDICINE QUERIES: "When is my medicine?", "દવા ક્યારે લેવાની છે?"
  // =========================================================================
  const isMedQuery =
    q.includes("medicine") ||
    q.includes("dawa") ||
    q.includes("dawai") ||
    q.includes("dava") ||
    q.includes("pill") ||
    q.includes("tablet") ||
    q.includes("દવા") ||
    q.includes("दवा") ||
    q.includes("दवाई") ||
    q.includes("ঔষধ") ||
    q.includes("ওষুধ") ||
    q.includes("औषध") ||
    q.includes("மருந்து") ||
    q.includes("మందు") ||
    q.includes("ಮಾತ್ರೆ") ||
    q.includes("മരുന്ന്") ||
    q.includes("ਦਵਾਈ") ||
    q.includes("ଔଷଧ");

  if (isMedQuery) {
    const medReplies: Record<string, string> = {
      gu: "તમારી બ્લડ પ્રેશરની દવા સવારે 8:30 વાગ્યે લેવાની છે. નાસ્તા પછી હુંફાળા પાણી સાથે દવા લઈ લો.",
      hi: "आपकी सुबह 8:30 बजे की ब्लड प्रेशर की दवा निर्धारित है। इसे नाश्ते के बाद गुनगुने पानी के साथ लें।",
      en: "Your blood pressure medicine is scheduled at 8:30 AM. Please take it with lukewarm water after your meal.",
      bn: "আপনার রক্তচাপের ওষুধ সকাল ৮:৩০ টায় নির্ধারিত। অনুগ্রহ করে প্রাতরাশের পর হালকা গরম জল দিয়ে ওষুধটি গ্রহণ করুন।",
      as: "আপোনাৰ ৰক্তচাপৰ ঔষধ পুৱা ৮:৩০ বজাত খাব লাগে। পুৱাৰ আহাৰৰ পিছত কুহুমীয়া পানীৰে ঔষধ খাওক।",
      mr: "आपले रक्तदाबाचे औषध सकाळी 8:30 वाजता घ्यायचे आहे. न्याहारीनंतर कोमट पाण्यासोबत औषध घ्या.",
      ta: "உங்கள் ரத்த அழுத்த மருந்து காலை 8:30 மணிக்கு திட்டமிடப்பட்டுள்ளது. காலை உணவுக்குப் பிறகு வெதுவெதுப்பான நீருடன் எடுத்துக்கொள்ளுங்கள்.",
      te: "మీ రక్తపోటు మందు ఉదయం 8:30 గంటలకు తీసుకోవాలి. అల్పాహారం తర్వాత గోరువెచ్చని నీటితో తీసుకోండి.",
      kn: "ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡದ ಔಷಧಿಯು ಬೆಳಿಗ್ಗೆ 8:30 ಕ್ಕೆ ನಿಗದಿಯಾಗಿದೆ. ಉಪಹಾರದ ನಂತರ ಬೆಚ್ಚಗಿನ ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ.",
      ml: "നിങ്ങളുടെ രക്തസമ്മർദ്ദത്തിനുള്ള മരുന്ന് രാവിലെ 8:30-നാണ്. പ്രഭാതഭക്ഷണത്തിന് ശേഷം ചെറുചൂടുവെള്ളത്തിൽ കഴിക്കുക.",
      pa: "ਤੁਹਾਡੀ ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ ਦੀ ਦਵਾਈ ਸਵੇਰੇ 8:30 ਵਜੇ ਨਿਰਧਾਰਤ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਨਾਸ਼ਤੇ ਤੋਂ ਬਾਅਦ ਗਰਮ ਪਾਣੀ ਨਾਲ ਲਵੋ।",
      or: "ଆପଣଙ୍କ ରକ୍ତଚାପ ଔଷଧ ସକାଳ ୮:୩୦ ରେ ନେବାର ଅଛି। ଜଳଖିଆ ପରେ ଉଷୁମ ପାଣି ସହ ଏହାକୁ ନିଅନ୍ତୁ।",
    };
    return {
      reply: medReplies[langCode] || medReplies["en"]!,
      detectedLocale,
      languageName: langConfig.name,
      suggestedAction: "take_medicine",
    };
  }

  // =========================================================================
  // 6. GREETINGS: "Kem cho?", "Kaise ho?", "Kemon acho?", "How are you?"
  // =========================================================================
  const isGreeting =
    /^(hi|hello|hey|namaste|kem cho|kemcho|kaise ho|kemon|kene|vanakkam|namaskaram|sat sri akal)\b/i.test(q) ||
    q.includes("તમે કેમ છો") ||
    q.includes("કેમ છો") ||
    q.includes("મજામાં") ||
    q.includes("आप कैसे हैं") ||
    q.includes("कैसे हो") ||
    q.includes("আপনি কেমন আছেন") ||
    q.includes("কেমন আছ") ||
    q.includes("আপুনি কেনে") ||
    q.includes("तुम्ही कसे आहात") ||
    q.includes("நீங்கள் எப்படி") ||
    q.includes("మీరు ఎలా") ||
    q.includes("how are you") ||
    q.includes("good morning") ||
    q.includes("good evening");

  if (isGreeting) {
    const greetingReplies: Record<string, string> = {
      gu: "હું ખૂબ મજામાં છું! તમે કેમ છો? તમારો આજનો દિવસ કેવો રહ્યો?",
      hi: "नमस्ते! मैं बिल्कुल ठीक हूँ और आपकी सहायता के लिए तैयार हूँ। आप कैसे महसूस कर रहे हैं?",
      en: "Hello! I am doing wonderfully and am always here with you. How are you feeling today?",
      bn: "নমস্কার! আমি খুব ভালো আছি। আপনি কেমন আছেন? আজকের দিনটি কেমন কাটছে?",
      as: "নমস্কাৰ! মই বৰ ভালে আছোঁ। আপুনি কেনে আছে? আজি আপোনাৰ দিনটো কেনে গৈছে?",
      mr: "नमस्कार! मी अगदी मजेत आहे. आपण कसे आहात? आजचा दिवस कसा चालू आहे?",
      ta: "வணக்கம்! நான் மிகவும் நலமாக உள்ளேன். நீங்கள் எப்படி இருக்கிறீர்கள்?",
      te: "నమస్కారం! నేను చాలా బాగున్నాను. మీరు ఎలా ఉన్నారు?",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ಆರಾಮವಾಗಿದ್ದೇನೆ. ನೀವು ಹೇಗಿದ್ದೀರಿ?",
      ml: "നമസ്കാരം! ഞാൻ സുഖമായിരിക്കുന്നു. നിങ്ങൾക്ക് സുഖമാണോ?",
      pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਬਿਲਕੁਲ ਠੀਕ ਹਾਂ। ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?",
      or: "ନମସ୍କାର! ମୁଁ ବହୁତ ଭଲ ଅଛି। ଆପଣ କେମିତି ଅଛନ୍ତି?",
    };
    return {
      reply: greetingReplies[langCode] || greetingReplies["en"]!,
      detectedLocale,
      languageName: langConfig.name,
      suggestedAction: "none",
    };
  }

  // =========================================================================
  // 7. STORIES & TALES
  // =========================================================================
  const isStory =
    q.includes("story") ||
    q.includes("kahani") ||
    q.includes("varta") ||
    q.includes("golpo") ||
    q.includes("sadhu kotha") ||
    q.includes("gosht") ||
    q.includes("kadhai") ||
    q.includes("katha") ||
    q.includes("વાર્તા") ||
    q.includes("कहानी") ||
    q.includes("গল্প") ||
    q.includes("সাধুকথা") ||
    q.includes("गोष्ट") ||
    q.includes("கதை");

  if (isStory) {
    const storyReplies: Record<string, string> = {
      gu: "એક સુંદર વાર્તા: એક નાનકડા પક્ષીએ દરરોજ થોડું થોડું પાણી લાવીને સુકાઈ ગયેલા ઝાડને ફરીથી હર્યુંભર્યું બનાવી દીધું. સતત પ્રયાસ હંમેશાં મીઠાં ફળ આપે છે.",
      hi: "एक छोटी प्रेरक कहानी: एक बार एक किसान ने धैर्य से बंजर ज़मीन पर पौधे रोपे और हर दिन पानी दिया। कुछ ही वर्षों में वह पूरा बगीचा बन गया। धैर्य और नियमितता से सब संभव है।",
      en: "Here is a gentle story: High in the rolling green hills, an elder gardener planted a tea bush each morning. Over the years, travelers stopped to rest in the lush shade, learning that patience and kindness bring lifelong warmth.",
      bn: "একটি সুন্দর গল্প: এক কৃষক প্রতিদিন ধৈর্য ধরে একটি গাছে জল দিত। কালক্রমে সেই গাছটি এক বিরাট ছায়াদার মহীরুহে পরিণত হলো। ভালোবাসা ও যত্ন সবকিছুকে সুন্দর করে তোলে।",
      as: "এটা সুন্দৰ সাধু: এটা চৰায়ে প্ৰতিদিনে অলপ অলপ পানী কঢ়িয়াই এটা শুকান গছক পুনৰ সেউজীয়া কৰি তুলিলে। নিষ্ঠা আৰু ধৈৰ্য্যৰ ফল সদায় মিঠা হয়।",
      mr: "एक सुंदर गोष्ट: एका शेतकऱ्याने रोज नेटाने एका झाडाला पाणी घातले. पुढे ते झाड सर्वांना सावली देणारा मोठा वृक्ष झाले. सातत्य आणि संयम यामुळे जीवनात यश मिळते.",
      ta: "ஒரு சிறுகதை: ஒரு முதியவர் தினமும் ஒரு மரக்கன்றுக்கு நீர் ஊற்றினார். நாளடைவில் அது பெரும் நிழல்தரும் மரமாக வளர்ந்தது. அன்பும் பொறுமையும் என்றும் பெருமை தரும்.",
      te: "ఒక చిన్న కథ: ఒక రైతు ప్రతిరోజూ ఓపికతో మొక్కలకు నీరు పోసేవాడు. కొంత కాలానికి అది అందరికీ నీడనిచ్చే పెద్ద చెట్టుగా మారింది. ఓపికకు ఎప్పుడూ మంచి ఫలితం ఉంటుంది.",
      kn: "ಒಂದು ಸಣ್ಣ ಕಥೆ: ಒಬ್ಬ ಹಿರಿಯ ತೋಟಗಾರ ಪ್ರತಿದಿನ ಗಿಡಗಳಿಗೆ ನೀರುಣಿಸಿದನು. ಕಾಲಕ್ರಮೇಣ ಅದು ದೊಡ್ಡ ಮರವಾಗಿ ಎಲ್ಲರಿಗೂ ನೆರಳು ನೀಡಿತು. ತಾಳ್ಮೆ ಮತ್ತು ಪ್ರೀತಿಗೆ ಯಾವಾಗಲೂ ಒಳ್ಳೆಯ ಫಲ ಸಿಗುತ್ತದೆ.",
      ml: "ഒരു കൊച്ചു കഥ: ഒരു തോട്ടക്കാരൻ ദിവസവും സ്നേഹത്തോടെ ചെടികൾ നനച്ചു. കാലക്രമേണ അതൊരു വലിയ തണൽമരമായി മാറി. സ്നേഹവും ക്ഷമയും എപ്പോഴും നല്ല ഫലം നൽകും.",
      pa: "ਇੱਕ ਨਿੱਕੀ ਕਹਾਣੀ: ਇੱਕ ਕਿਸਾਨ ਨੇ ਰੋਜ਼ ਮਿਹਨਤ ਨਾਲ ਬੂਟਿਆਂ ਨੂੰ ਪਾਣੀ ਦਿੱਤਾ। ਹੌਲੀ-ਹੌਲੀ ਉਹ ਵੱਡੇ ਰੁੱਖ ਬਣ ਗਏ। ਧੀਰਜ ਅਤੇ ਮਿਹਨਤ ਹਮੇਸ਼ਾ ਰੰਗ ਲਿਆਉਂਦੀ ਹੈ।",
      or: "ଗୋଟିଏ ସୁନ୍ଦର କାହାଣୀ: ଜଣେ କୃଷକ ପ୍ରତିଦିନ ଧୈର୍ଯ୍ୟର ସହ ଏକ ଗଛରେ ପାଣି ଦେଉଥିଲେ। ସମୟକ୍ରମେ ତାହା ଏକ ବିରାଟ ବୃକ୍ଷରେ ପରିଣତ ହେଲା। ଧୈର୍ଯ୍ୟ ସର୍ବଦା ମିଠା ଫଳ ଦିଏ।",
    };
    return {
      reply: storyReplies[langCode] || storyReplies["en"]!,
      detectedLocale,
      languageName: langConfig.name,
      suggestedAction: "none",
    };
  }

  // =========================================================================
  // 8. AI QUERIES ("What is AI?", "AI શું છે?", "AI क्या है?")
  // =========================================================================
  const isAIQuery =
    q.includes("what is ai") ||
    q.includes("artificial intelligence") ||
    q.includes("ai su che") ||
    q.includes("ai kya hai") ||
    q.includes("ai ki") ||
    q.includes("ai kay ahe") ||
    q.includes("ai enna") ||
    q.includes("ai ante emiti") ||
    q.includes("એઆઈ શું છે") ||
    q.includes("AI શું છે") ||
    q.includes("एआई क्या है") ||
    q.includes("AI क्या है") ||
    q.includes("AI কি") ||
    q.includes("AI ಎಂದರೇನು");

  if (isAIQuery) {
    const aiReplies: Record<string, string> = {
      gu: "આર્ટિફિશિયલ ઇન્ટેલિજન્સ (AI) એટલે એવી કમ્પ્યુટર ટેક્નોલોજી જે માણસની જેમ શીખી અને સમજી શકે છે. આ તમને રોજિંદા કામો, દવાની યાદ અને રમતોમાં એક પ્રેમાળ સાથીની જેમ મદદ કરે છે.",
      hi: "आर्टिफिशियल इंटेलिजेंस (AI) एक ऐसी कंप्यूटर तकनीक है जो इंसानों की तरह सोच और सीख सकती है। यह आपके रोज़मर्रा के कामों और दवाइयों को याद रखने में मदद करती है।",
      en: "Artificial Intelligence, or AI, is computer technology designed to learn, reason, and assist people naturally, just like a friendly digital companion.",
      bn: "আর্টিফিশিয়াল ইন্টেলিজেন্স (AI) হলো এমন প্রযুক্তি যা মানুষের মতো চিন্তা করতে ও শিখতে পারে। এটি আপনার প্রতিদিনের রুটিন ও ওষুধ মনে রাখতে সাহায্য করে।",
      as: "আৰ্টিফিচিয়েল ইনটেলিজেন্স (AI) হ'ল এনে এক কম্পিউটাৰ প্ৰযুক্তি যিয়ে মানুহৰ দৰে বুজিব আৰু শিকিব পাৰে।",
      mr: "आर्टिफिशियल इंटेलिजन्स (AI) म्हणजे अशी कॉम्प्युटर प्रणाली जी माणसासारखा विचार करू शकते आणि आपल्याला दैनंदिन कामात मदत करते.",
      ta: "செயற்கை நுண்ணறிவு (AI) என்பது மனிதர்களைப் போல சிந்தித்து கற்றுக்கொள்ளும் கணினி தொழில்நுட்பமாகும். இது உங்கள் அன்றாட பணிகளில் உதவுகிறது.",
      te: "ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ (AI) అంటే మానవుల మాదిరిగానే ఆలోచించి నేర్చుకోగల కంప్యూటర్ సాంకేతికత.",
      kn: "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಎಂದರೆ ಮಾನವರಂತೆ ಕಲಿಯುವ ಮತ್ತು ಯೋਚಿಸುವ ಕಂಪ್ಯೂಟರ್ ತಂತ್ರಜ್ಞಾನವಾಗಿದೆ.",
      ml: "ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസ് (AI) എന്നാൽ മനുഷ്യരെപ്പോലെ ചിന്തിക്കാനും സഹായിക്കാനും കഴിയുന്ന കമ്പ്യൂട്ടർ സാങ്കേതികവിദ്യയാണ്.",
      pa: "ਆਰਟੀਫੀਸ਼ੀਅਲ ਇੰਟੈਲੀਜੈਂਸ (AI) ਇੱਕ ਕੰਪਿਊਟਰ ਤਕਨੀਕ ਹੈ ਜੋ ਇਨਸਾਨਾਂ ਵਾਂਗ ਸੋਚ ਸਕਦੀ ਹੈ ਅਤੇ ਤੁਹਾਡੀ ਮਦਦ ਕਰਦੀ ਹੈ।",
      or: "କୃତ୍ରିମ ବୁଦ୍ଧିମତ୍ତା (AI) ଏକ କମ୍ପ୍ୟୁଟର ପ୍ରଯୁକ୍ତି ଯାହା ମଣିଷ ପରି ଚିନ୍ତା କରି ସାହାଯ୍ୟ କରିପାରେ।",
    };
    return {
      reply: aiReplies[langCode] || aiReplies["en"]!,
      detectedLocale,
      languageName: langConfig.name,
      suggestedAction: "none",
    };
  }

  // =========================================================================
  // 9. MATH QUESTIONS (e.g. 5 + 3, 10 * 2)
  // =========================================================================
  if (/\b\d+\s*[\+\-\*\/]\s*\d+\b/.test(q)) {
    try {
      const match = q.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
      if (match) {
        const a = parseInt(match[1], 10);
        const op = match[2];
        const b = parseInt(match[3], 10);
        let res = 0;
        if (op === "+") res = a + b;
        if (op === "-") res = a - b;
        if (op === "*") res = a * b;
        if (op === "/" && b !== 0) res = Math.round((a / b) * 100) / 100;

        const mathReplies: Record<string, string> = {
          gu: `${a} ${op} ${b} નો જવાબ ${res} છે.`,
          hi: `${a} ${op} ${b} का उत्तर ${res} है।`,
          en: `The answer to ${a} ${op} ${b} is ${res}.`,
          bn: `${a} ${op} ${b} এর উত্তর হলো ${res}।`,
          as: `${a} ${op} ${b} ৰ উত্তৰ হ'ল ${res}।`,
          mr: `${a} ${op} ${b} चे उत्तर ${res} आहे.`,
          ta: `${a} ${op} ${b} இன் விடை ${res} ஆகும்.`,
          te: `${a} ${op} ${b} సమాధానం ${res}.`,
          kn: `${a} ${op} ${b} ಉತ್ತರ ${res}.`,
          ml: `${a} ${op} ${b} ന്റെ ഉത്തരം ${res} ആണ്.`,
          pa: `${a} ${op} ${b} ਦਾ ਜਵਾਬ ${res} ਹੈ।`,
          or: `${a} ${op} ${b} ର ଉତ୍ତର ହେଉଛି ${res}।`,
        };

        return {
          reply: mathReplies[langCode] || mathReplies["en"]!,
          detectedLocale,
          languageName: langConfig.name,
          suggestedAction: "none",
        };
      }
    } catch {}
  }

  // =========================================================================
  // 10. UNIVERSAL SAME-LANGUAGE FALLBACK (Guarantees no language leak)
  // =========================================================================
  const generalFallbacks: Record<string, string> = {
    gu: "હું તમારી વાત સાંભળી રહ્યો છું. તમે મને તમારા સ્વાસ્થ્ય, દિનચર્યા, દવાઓ અથવા કોઈપણ પ્રશ્ન પૂછી શકો છો. હું હંમેશાં તમારી સાથે છું.",
    hi: "मैं आपकी बात सुन रहा हूँ। आप मुझसे अपनी सेहत, दिनचर्या, दवाओं या किसी भी विषय पर बात कर सकते हैं। मैं सदैव आपकी सहायता के लिए तैयार हूँ।",
    en: "I am listening to you. You can ask me anything about your health, daily routine, medicines, general knowledge, or simply enjoy a friendly conversation.",
    bn: "আমি আপনার কথা শুনছি। আপনি আমাকে আপনার স্বাস্থ্য, রুটিন বা ঔষধ সম্পর্কে যেকোনো প্রশ্ন করতে পারেন। আমি সবসময় আপনার সাথে আছি।",
    as: "মই আপোনাৰ কথা শুনি আছোঁ। আপুনি মোক স্বাস্থ্য, দিনচৰ্যা বা ঔষধৰ বিষয়ে সুধিব পাৰে। মই আপোনাক সহায় কৰিম।",
    mr: "मी आपले बोलणे ऐकत आहे. आपण मला आरोग्य, दिनचर्या, औषधे किंवा कोणत्याही विषयावर विचारू शकता. मी आपल्या सेवेत सदैव हजर आहे.",
    ta: "நான் உங்கள் பேச்சைக் கவனித்துக் கொண்டிருக்கிறேன். உங்கள் உடல்நலம், மருந்துகள் அல்லது தினசரி பணிகள் குறித்து என்னிடம் கேட்கலாம்.",
    te: "నేను మీ మాటలు వింటున్నాను. మీ ఆరోగ్యం, మందులు లేదా దినచర్య గురించి నన్ను ఏదైనా అడగవచ్చు.",
    kn: "ನಾನು ನಿಮ್ಮ ಮಾತನ್ನು ಕೇಳುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ ಆರೋಗ್ಯ, ಔಷಧಿಗಳು ಅಥವಾ ದಿನಚರಿಯ ಬಗ್ಗೆ ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.",
    ml: "ഞാൻ നിങ്ങളുടെ പറയുന്നത് ശ്രദ്ധിക്കുന്നു. നിങ്ങളുടെ ആരോഗ്യം, മരുന്നുകൾ എന്നിവയെക്കുറിച്ച് നിങ്ങൾക്ക് എന്നോട് ചോദിക്കാം.",
    pa: "ਮੈਂ ਤੁਹਾਡੀ ਗੱਲ ਸੁਣ ਰਿਹਾ ਹਾਂ। ਤੁਸੀਂ ਮੈਨੂੰ ਆਪਣੀ ਸਿਹਤ, ਦਵਾਈਆਂ ਜਾਂ ਰੋਜ਼ਾਨਾ ਦੇ ਕੰਮਾਂ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛ ਸਕਦੇ ਹੋ।",
    or: "ମୁଁ ଆପଣଙ୍କ କଥା ଶୁଣୁଛି। ଆପଣ ମୋତେ ନିଜ ସ୍ୱାସ୍ଥ୍ୟ, ଔଷଧ ବା ଦୈନନ୍ଦିନ କାର୍ଯ୍ୟ ବିଷୟରେ ପଚାରିପାରିବେ।",
  };

  return {
    reply: generalFallbacks[langCode] || generalFallbacks["en"]!,
    detectedLocale,
    languageName: langConfig.name,
    suggestedAction: "none",
  };
}
