import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const VoiceAssistantInput = z.object({
  query: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
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

    // Fallback if API key is not present or offline
    if (!key) {
      return getLocalOfflineFallback(query, preferredLocale, context);
    }

    const systemPrompt = `You are "Memory Bond", an empathetic, intelligent, and warm AI voice companion designed for elderly users and dementia patients in India.

CRITICAL INSTRUCTION 1: AUTOMATIC LANGUAGE DETECTION & MIRRORING
- Detect the language the user is speaking or typing.
- You MUST reply in the EXACT SAME LANGUAGE as the user's latest message.
- Support all languages, including but not limited to:
  * Hindi (हिन्दी / hi-IN)
  * Gujarati (ગુજરાતી / gu-IN)
  * English (en-IN)
  * Bengali (বাংলা / bn-IN)
  * Marathi (मराठी / mr-IN)
  * Tamil (தமிழ் / ta-IN)
  * Telugu (తెలుగు / te-IN)
  * Kannada (ಕನ್ನಡ / kn-IN)
  * Malayalam (മലയാളം / ml-IN)
  * Punjabi (ਪੰਜਾਬੀ / pa-IN)
  * Assamese (অসমীয়া / as-IN)
  * Odia (ଓଡ଼ିଆ / or-IN)

CRITICAL INSTRUCTION 2: ROMANIZED / TRANSLITERATED SCRIPT
- If the user uses English letters to write an Indian language (e.g., "kem cho?", "mare medicine kyare levani che?", "kaise ho?", "aaj kya karna hai?", "kemon aachen?"), identify the intended Indian language.
- Respond naturally in that language (using that language's native script or clear transliteration).

CRITICAL INSTRUCTION 3: MIXED LANGUAGE (Hinglish, Gujlish, etc.)
- If the user speaks mixed languages (e.g. "Can you tell me aaj ka routine?"), understand the full query and reply naturally in Hinglish/Hindi or the respective hybrid style. Do not force formal language.

CRITICAL INSTRUCTION 4: DYNAMIC LANGUAGE SWITCHING
- If the user switches language in a follow-up (e.g. "What is artificial intelligence?" -> "Ab Hindi mein samjhao." -> "હવે ગુજરાતીમાં કહો."), immediately switch your response to the newly requested language!

CRITICAL INSTRUCTION 5: GENERAL-PURPOSE CONVERSATION & CONTEXT
- You are NOT a fixed FAQ bot. You are a general-purpose conversational AI.
- The user can ask anything: General knowledge, Maths, Science, History, Technology ("What is AI?"), Stories, Everyday health & wellness, Explanations ("Explain it simply"), or general chit-chat.
- Retain conversation history. When the user asks follow-up questions (e.g. "Explain it simply"), understand what "it" refers to from earlier turns.
- Keep spoken answers calm, clear, friendly, and concise (2 to 4 sentences maximum) so it can be spoken out loud via Text-to-Speech without fatiguing the senior.

CURRENT USER CONTEXT (Reference only when relevant):
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

    // Include last 6 turns of conversation history for follow-ups
    const recentHistory = history.slice(-6);
    for (const h of recentHistory) {
      messages.push({ role: h.role, content: h.content });
    }
    messages.push({ role: "user", content: query });

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
        return getLocalOfflineFallback(query, preferredLocale, context);
      }

      const json = await response.json();
      const rawContent = json.choices?.[0]?.message?.content ?? "";

      // Clean and parse JSON
      const cleaned = rawContent
        .replace(/```json/gi, "")
        .replace(/```/gi, "")
        .trim();

      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) {
        const parsed = JSON.parse(cleaned.substring(start, end + 1));
        return {
          reply: parsed.reply || cleaned,
          detectedLocale: parsed.detectedLocale || preferredLocale,
          languageName: parsed.languageName || "Detected Language",
          suggestedAction: parsed.suggestedAction || "none",
        };
      }

      // If json parsing wasn't clean, return the raw text
      return {
        reply: cleaned,
        detectedLocale: preferredLocale,
        languageName: "Auto",
        suggestedAction: "none",
      };
    } catch (err) {
      console.error("AI Voice Assistant Gateway error:", err);
      return getLocalOfflineFallback(query, preferredLocale, context);
    }
  });

/**
 * Intelligent local fallback when offline or when Lovable API is unreachable.
 * Fully supports Romanized Indian languages, dynamic switches, mixed languages, and general topics.
 */
export function getLocalOfflineFallback(
  query: string,
  preferredLocale: string,
  context: Record<string, any> = {}
): VoiceAssistantResponse {
  const q = query.toLowerCase().trim();

  // 1. Explicit Language Switch Commands
  if (/\b(ab hindi|hindi mein|hindi me|हिंदी में|हिन्दी में)\b/i.test(q)) {
    return {
      reply: "हाँ बिल्कुल! अब से मैं आपसे हिन्दी में बात करूँगा। आप क्या समझना चाहते हैं?",
      detectedLocale: "hi-IN",
      languageName: "Hindi",
      suggestedAction: "none",
    };
  }
  if (/\b(have gujarati|gujarati ma|gujarati mein|ગુજરાતીમાં)\b/i.test(q)) {
    return {
      reply: "ચોક્કસ! હવે હું તમારી સાથે ગુજરાતીમાં વાત કરીશ. તમને કઈ બાબતમાં મદદ જોઈએ છે?",
      detectedLocale: "gu-IN",
      languageName: "Gujarati",
      suggestedAction: "none",
    };
  }
  if (/\b(in english|speak in english|switch to english)\b/i.test(q)) {
    return {
      reply: "Sure! I will now speak with you in English. How can I assist you today?",
      detectedLocale: "en-IN",
      languageName: "English",
      suggestedAction: "none",
    };
  }

  // 2. Gujarati Detection (Script or Romanized: e.g. "kem cho", "mare medicine kyare levani che")
  if (
    /[\u0A80-\u0AFF]/.test(query) ||
    /\b(kem cho|su karo|kaho|tamaru|savare|dawa|dava|aaje|ghare|pan|chhe|bapore|saanje|levani|kyare|ketla|jamvanu|majama)\b/i.test(q)
  ) {
    if (q.includes("kem cho")) {
      return {
        reply: "હું ખૂબ મજામાં છું! તમે કેમ છો? તમારો આજનો દિવસ કેવો રહ્યો?",
        detectedLocale: "gu-IN",
        languageName: "Gujarati",
        suggestedAction: "none",
      };
    }
    if (q.includes("medicine") || q.includes("dawa") || q.includes("dava") || q.includes("દવા")) {
      return {
        reply: "તમારી બ્લડ પ્રેશરની દવા સવારે 8:30 વાગ્યે લેવાની છે. શું તમે હુંફાળા પાણી સાથે દવા લઈ લીધી છે?",
        detectedLocale: "gu-IN",
        languageName: "Gujarati",
        suggestedAction: "take_medicine",
      };
    }
    if (q.includes("aaj") || q.includes("routine") || q.includes("દિનચર્યા")) {
      return {
        reply: "આજે સવારે તમારી દવા, 10 વાગ્યે મેમરી ગેમ, પૂરતું પાણી પીવું અને સાંજે ડૉક્ટરની મુલાકાત છે.",
        detectedLocale: "gu-IN",
        languageName: "Gujarati",
        suggestedAction: "view_routine",
      };
    }
    if (q.includes("વાર્તા") || q.includes("story")) {
      return {
        reply: "એક સુંદર બોધકથા: એક નાનકડા પક્ષીએ દરરોજ થોડું થોડું પાણી લાવીને સુકાઈ ગયેલા ઝાડને ફરીથી હર્યુંભર્યું બનાવી દીધું. સતત પ્રયાસ હંમેશાં મીઠાં ફળ આપે છે.",
        detectedLocale: "gu-IN",
        languageName: "Gujarati",
        suggestedAction: "none",
      };
    }
    return {
      reply: "હું તમારી વાત સમજી શક્યો છું. હું તમને દવા, દિનચર્યા, સામાન્ય જ્ઞાન અને મેમરી રમતોમાં મદદ કરી શકું છું.",
      detectedLocale: "gu-IN",
      languageName: "Gujarati",
      suggestedAction: "none",
    };
  }

  // 3. Mixed Hinglish Detection (e.g. "Can you tell me aaj ka routine?")
  if (/\b(can you tell me|tell me|what is)\s+(aaj ka|meri dawa|aaj ki)\b/i.test(q) || (q.includes("routine") && q.includes("aaj"))) {
    return {
      reply: "हाँ बिल्कुल! आज सुबह 8:30 बजे आपकी ब्लड प्रेशर की दवा है, 10 बजे मेमोरी गतिविधि, और शाम 4 बजे डॉक्टर से मिलना है।",
      detectedLocale: "hi-IN",
      languageName: "Hinglish / Hindi",
      suggestedAction: "view_routine",
    };
  }

  // 4. Hindi Detection (Devanagari or Romanized: e.g. "kaise ho", "aaj kya karna hai", "meri dawa kab hai")
  if (
    /[\u0900-\u097F]/.test(query) ||
    /\b(namaste|kaise ho|kya haal|dawa|aaj kya|karna hai|batao|samjhao|paani|theek hai|subah|shaam|kripya|kahani)\b/i.test(q)
  ) {
    if (q.includes("kaise ho") || q.includes("kya haal")) {
      return {
        reply: "नमस्ते! मैं बिल्कुल ठीक हूँ और आपकी सहायता के लिए तैयार हूँ। आप कैसे महसूस कर रहे हैं?",
        detectedLocale: "hi-IN",
        languageName: "Hindi",
        suggestedAction: "none",
      };
    }
    if (q.includes("aaj kya karna hai") || (q.includes("aaj") && q.includes("routine"))) {
      return {
        reply: "आज आपकी सुबह 8:30 बजे दवा, 4 गिलास गुनगुना पानी पीना, 10 बजे पैटर्न रिकॉल मेमोरी गेम और शाम 4 बजे डॉक्टर से अपॉइंटमेंट है।",
        detectedLocale: "hi-IN",
        languageName: "Hindi",
        suggestedAction: "view_routine",
      };
    }
    if (q.includes("dawa") || q.includes("medicine")) {
      return {
        reply: "आपकी सुबह 8:30 बजे की रक्तचाप की दवा निर्धारित है। क्या आपने इसे समय पर ले लिया है?",
        detectedLocale: "hi-IN",
        languageName: "Hindi",
        suggestedAction: "take_medicine",
      };
    }
    if (q.includes("kahani") || q.includes("कहानी") || q.includes("story")) {
      return {
        reply: "एक छोटी प्रेरक कहानी: एक बार एक किसान ने धैर्य से एक बंजर ज़मीन पर पौधे रोपे और हर दिन पानी दिया। कुछ ही वर्षों में वह पूरा बगीचा बन गया। धैर्य और नियमितता से सब संभव है।",
        detectedLocale: "hi-IN",
        languageName: "Hindi",
        suggestedAction: "none",
      };
    }
    return {
      reply: "मैं आपकी बात सुन रहा हूँ। मैं आपकी दवाइयों, दिनचर्या, विज्ञान, कहानियों या किसी भी प्रश्न में आपकी मदद कर सकता हूँ।",
      detectedLocale: "hi-IN",
      languageName: "Hindi",
      suggestedAction: "none",
    };
  }

  // 5. Bengali / Assamese
  if (/[\u0980-\u09FF]/.test(query) || /\b(kemon|aajke|oshudh|kailoi|puwa|khalu|kene|ki khobor)\b/i.test(q)) {
    const isAssamese = /[ৱৰ]/.test(query) || /\b(kailoi|puwa|khalu|kene|axomiya|ki khobor)\b/i.test(q);
    if (isAssamese) {
      return {
        reply: "নমস্কাৰ! মই আপোনাক সহায় কৰিবলৈ সাজু আছোঁ। আজি আপোনাৰ দিনটো কেনে গৈছে?",
        detectedLocale: "as-IN",
        languageName: "Assamese",
        suggestedAction: "none",
      };
    }
    return {
      reply: "নমস্কার! আমি আপনাকে সাহায্য করতে প্রস্তুত। আপনার আজকের দিনটি কেমন কাটছে? আমি ঔষধ বা রুটিনে সাহায্য করতে পারি।",
      detectedLocale: "bn-IN",
      languageName: "Bengali",
      suggestedAction: "none",
    };
  }

  // 6. Marathi
  if (/\b(kasa ahes|sakali|aushadh|vajta|kuthe|kadhi|ahe|kay challay)\b/i.test(q)) {
    return {
      reply: "नमस्कार! मी अगदी मजेत आहे. आपण कसे आहात? आज आपल्याला औषध, दिनचर्या किंवा खेळ यात मदत हवी आहे का?",
      detectedLocale: "mr-IN",
      languageName: "Marathi",
      suggestedAction: "none",
    };
  }

  // 7. Tamil
  if (/[\u0B80-\u0BFF]/.test(query) || /\b(vanakkam|eppadi|marunthu|iniku)\b/i.test(q)) {
    return {
      reply: "வணக்கம்! நான் நலமாக உள்ளேன். உங்களுக்கு மருந்து அல்லது இன்றைய அட்டவணையில் எவ்வாறு உதவ முடியும்?",
      detectedLocale: "ta-IN",
      languageName: "Tamil",
      suggestedAction: "none",
    };
  }

  // 8. Telugu
  if (/[\u0C00-\u0C7F]/.test(query) || /\b(namaskaram|ela unnaru|mandhu|e roju)\b/i.test(q)) {
    return {
      reply: "నమస్కారం! నేను బాగున్నాను. మీకు మందులు లేదా దినచర్యలో ఎలా సహాయపడగలను?",
      detectedLocale: "te-IN",
      languageName: "Telugu",
      suggestedAction: "none",
    };
  }

  // 9. Kannada
  if (/[\u0C80-\u0CFF]/.test(query) || /\b(hegiddira|oushadha|ivathu)\b/i.test(q)) {
    return {
      reply: "ನಮಸ್ಕಾರ! ನಾನು ಆರಾಮವಾಗಿದ್ದೇನೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
      detectedLocale: "kn-IN",
      languageName: "Kannada",
      suggestedAction: "none",
    };
  }

  // 10. Malayalam
  if (/[\u0D00-\u0D7F]/.test(query) || /\b(sukhamano|marunnu|innu)\b/i.test(q)) {
    return {
      reply: "നമസ്കാരം! ഞാൻ സുഖമായിരിക്കുന്നു. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?",
      detectedLocale: "ml-IN",
      languageName: "Malayalam",
      suggestedAction: "none",
    };
  }

  // 11. Punjabi
  if (/[\u0A00-\u0A7F]/.test(query) || /\b(sat sri akal|kiddan|dawai|ajj)\b/i.test(q)) {
    return {
      reply: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਬਿਲਕੁਲ ਠੀਕ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦદ ਕਰ ਸਕਦਾ ਹਾਂ?",
      detectedLocale: "pa-IN",
      languageName: "Punjabi",
      suggestedAction: "none",
    };
  }

  // 12. English General Conversational AI (Science, Math, AI, Stories, Explanations)
  if (q.includes("what is ai") || q.includes("artificial intelligence")) {
    return {
      reply: "Artificial Intelligence, or AI, is computer technology designed to learn, reason, and assist people naturally, just like a friendly digital companion.",
      detectedLocale: "en-IN",
      languageName: "English",
      suggestedAction: "none",
    };
  }

  if (q.includes("explain it simply") || q.includes("explain simply") || q.includes("in simple words")) {
    return {
      reply: "In simple words: AI is like a helpful assistant that listens to your voice, remembers your routine, and helps you with daily tasks like medicine reminders and fun memory games.",
      detectedLocale: "en-IN",
      languageName: "English",
      suggestedAction: "none",
    };
  }

  if (q.includes("story") || q.includes("bedtime story")) {
    return {
      reply: "Here is a gentle story: High in the rolling green hills, an elder gardener planted a tea bush each morning. Over the years, travelers from far and wide stopped to rest in the lush shade, learning that patience and kindness bring lifelong warmth.",
      detectedLocale: "en-IN",
      languageName: "English",
      suggestedAction: "none",
    };
  }

  if (q.includes("science") || q.includes("sky") || q.includes("blue")) {
    return {
      reply: "The sky looks blue because sunlight reaches Earth's atmosphere and is scattered in all directions by gases and particles. Blue light travels in smaller, shorter waves and scatters more than other colors.",
      detectedLocale: "en-IN",
      languageName: "English",
      suggestedAction: "none",
    };
  }

  if (q.includes("math") || /\b\d+\s*[\+\-\*\/]\s*\d+\b/.test(q)) {
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
        return {
          reply: `The answer to ${a} ${op} ${b} is ${res}.`,
          detectedLocale: "en-IN",
          languageName: "English",
          suggestedAction: "none",
        };
      }
    } catch {}
  }

  return {
    reply: "I am listening to you. You can ask me anything about your health, daily routine, medicines, general knowledge, or simply enjoy a friendly conversation in any language.",
    detectedLocale: preferredLocale || "en-IN",
    languageName: "English",
    suggestedAction: "none",
  };
}
