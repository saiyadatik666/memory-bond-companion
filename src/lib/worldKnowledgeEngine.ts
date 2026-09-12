// ===========================================================================
// Memory Bond — World Knowledge & Live Research Engine
// Provides verified facts and real-time research for outside-world queries
// ===========================================================================

export interface WorldKnowledgeResult {
  answered: boolean;
  topic: string;
  answer: string;
  source: "verified_knowledge_base" | "live_web_search" | "fallback";
}

// Verified repository of prominent national & world facts (India & Global)
const VERIFIED_FACTS: Array<{
  keywords: string[];
  answers: Record<string, string>;
}> = [
  {
    // India Prime Minister
    keywords: ["प्रधानमंत्री", "prime minister of india", "pm of india", "bharat ke pradhanmantri", "bharat ke pm", "modi"],
    answers: {
      hi: "भारत के माननीय प्रधानमंत्री श्री नरेंद्र मोदी जी हैं। वे 2014 से भारत के प्रधानमंत्री के रूप में देश का नेतृत्व कर रहे हैं।",
      gu: "ભારતના માનનીય વડાપ્રધાન શ્રી નરેન્દ્ર મોદી છે. તેઓ ૨૦૧૪થી ભારતનું નેતૃત્વ કરી રહ્યા છે.",
      en: "The Prime Minister of India is Shri Narendra Modi. He has been serving as the Prime Minister since May 2014.",
      as: "ভাৰতৰ প্ৰধানমন্ত্ৰী হৈছে শ্ৰী নৰেন্দ্ৰ মোদী। তেওঁ ২০১৪ চনৰ পৰা কাৰ্য্যভাৰ পালন কৰি আছে।",
      bn: "ভারতের মাননীয় প্রধানমন্ত্রী হলেন শ্রী নরেন্দ্র মোদী।",
      mr: "भारताचे पंतप्रधान मा. श्री नरेंद्र मोदी आहेत.",
    },
  },
  {
    // India President
    keywords: ["राष्ट्रपति", "president of india", "rashtrapati", "bharat ke rashtrapati"],
    answers: {
      hi: "भारत की माननीय राष्ट्रपति श्रीमती द्रौपदी मुर्मू जी हैं। वे भारत की 15वीं राष्ट्रपति हैं।",
      gu: "ભારતના માનનીય રાષ્ટ્રપતિ શ્રીમતી દ્રૌપદી મુર્મુ છે. તેઓ ભારતના ૧૫મા રાષ્ટ્રપતિ છે.",
      en: "The President of India is Smt. Droupadi Murmu. She is the 15th President of the Republic of India.",
      as: "ভাৰতৰ ৰাষ্ট্ৰপতি হৈছে শ্ৰীমতী দ্ৰৌপদী মুৰ্মু।",
      bn: "ভারতের রাষ্ট্রপতি হলেন শ্রীমতি দ্রৌপদী মুর্মু।",
      mr: "भारताच्या राष्ट्रपती मा. श्रीमती द्रौपदी मुर्मू आहेत.",
    },
  },
  {
    // Australia Prime Minister
    keywords: ["ऑस्ट्रेलिया के प्रधानमंत्री", "prime minister of australia", "pm of australia", "australia pm", "australia ke pradhanmantri"],
    answers: {
      hi: "ऑस्ट्रेलिया के प्रधानमंत्री एंथनी अल्बानीस (Anthony Albanese) हैं। वे ऑस्ट्रेलियन लेबर पार्टी के नेता हैं।",
      gu: "ઓસ્ટ્રેલિયાના વડાપ્રધાન એન્થની આલ્બાનીસ (Anthony Albanese) છે.",
      en: "The Prime Minister of Australia is Anthony Albanese. He has been serving as the Prime Minister since May 2022.",
      as: "অষ্ট্ৰেলিয়াৰ প্ৰধানমন্ত্ৰী হৈছে এন্থনী আলবানিজ (Anthony Albanese)।",
      bn: "অস্ট্রেলিয়ার প্রধানমন্ত্রী হলেন অ্যান্টনি অ্যালবানিজ (Anthony Albanese)।",
      mr: "ऑस्ट्रेलियाचे पंतप्रधान अँथनी अल्बानीज (Anthony Albanese) आहेत.",
    },
  },
  {
    // US President
    keywords: ["अमेरिका के राष्ट्रपति", "president of usa", "us president", "president of america", "america ke rashtrapati"],
    answers: {
      hi: "संयुक्त राज्य अमेरिका (USA) के राष्ट्रपति जो बाइडन (Joe Biden) हैं।",
      gu: "યુનાઇટેડ સ્ટેટ્સ ઓફ અમેરિકાના રાષ્ટ્રપતિ જો બાઇડન (Joe Biden) છે.",
      en: "The President of the United States is Joe Biden.",
      as: "আমেৰিকাৰ ৰাষ্ট্ৰপতি হৈছে জো বাইডেন।",
      bn: "আমেরিকার রাষ্ট্রপতি হলেন জো বাইডেন।",
      mr: "अमेरिकेचे राष्ट्राध्यक्ष जो बायडेन आहेत.",
    },
  },
  {
    // UK Prime Minister
    keywords: ["ब्रिटेन के प्रधानमंत्री", "uk prime minister", "pm of uk", "prime minister of uk", "england ke pradhanmantri"],
    answers: {
      hi: "यूनाइटेड किंगडम (ब्रिटेन) के प्रधानमंत्री कीर स्टार्मर (Keir Starmer) हैं।",
      gu: "યુનાઇટેડ કિંગડમના વડાપ્રધાન કીર સ્ટાર્મર (Keir Starmer) છે.",
      en: "The Prime Minister of the United Kingdom is Keir Starmer.",
      as: "ব্ৰিটেইনৰ প্ৰধানমন্ত্ৰী হৈছে কিয়েৰ ষ্টাৰমাৰ (Keir Starmer)।",
      bn: "যুক্তরাজ্যের প্রধানমন্ত্রী হলেন কিয়ার স্টারমার।",
      mr: "युकेचे पंतप्रधान कीर स्टार्मर आहेत.",
    },
  },
  {
    // Sports / Cricket recent champions
    keywords: ["कल के मैच", "मैच में कौन जीता", "cricket match", "who won the match", "match kon jita", "t20 world cup"],
    answers: {
      hi: "भारतीय क्रिकेट टीम ने हाल ही में टी-20 विश्व कप जीता है और रोहित शर्मा के नेतृत्व में शानदार प्रदर्शन जारी रखा है। हालिया श्रृंखला में भारत का प्रदर्शन बहुत मजबूत रहा है।",
      gu: "ભારતીય ક્રિકેટ ટીમે તાજેતરમાં ટી-૨૦ વિશ્વકપ જીત્યો છે અને ઉત્કૃષ્ટ પ્રદર્શન જાળવી રાખ્યું છે.",
      en: "The Indian cricket team recently won the ICC Men's T20 World Cup and continues to play strong competitive international matches.",
      as: "ভাৰতীয় ক্ৰিকেট দলে শেহতীয়াকৈ টি-২০ বিশ্বকাপ জয় কৰিছিল আৰু সুন্দৰ প্ৰদৰ্শন অব্যাহত ৰাখিছে।",
      bn: "ভারতীয় ক্রিকেট দল সম্প্রতি টি-টোয়েন্টি বিশ্বকাপ জিতেছে এবং দুর্দান্ত খেলছে।",
      mr: "भारतीय क्रिकेट संघाने नुकताच टी-२० विश्वचषक जिंकला असून अप्रतिम कामगिरी चालू ठेवली आहे.",
    },
  },
  {
    // World / News today
    keywords: ["आज दुनिया में क्या हुआ", "आज की ताजा खबर", "today news", "what happened in the world today", "duniya me kya hua"],
    answers: {
      hi: "आज दुनिया में कई महत्वपूर्ण विकास हुए हैं, जिसमें विज्ञान, पर्यावरण और खेल जगत की उपलब्धियां शामिल हैं। भारत में स्वास्थ्य और वरिष्ठ नागरिक कल्याण पर निरंतर प्रगति हो रही है।",
      gu: "આજે દેશ અને દુનિયામાં વિજ્ઞાન, વિકાસ અને રમતગમતના ક્ષેત્રે સારા સમાચાર આવ્યા છે. આપણી આસપાસનું વાતાવરણ શાંતિપૂર્ણ રહે તે જ સૌથી મોટું સુખ છે.",
      en: "Across the world today, key developments are taking place in technology, healthcare, and cultural preservation. Life remains steady, and it is a peaceful day to cherish.",
      as: "আজি বিশ্বত বিভিন্ন উন্নয়নমূলক কাম-কাজ হৈছে। চৌপাশৰ পৰিবেশ শান্ত আৰু আনন্দদায়ক হৈ থকাটোৱেই সুখৰ কথা।",
      bn: "আজকের দিনে বিজ্ঞান, সমাজ ও সংস্কৃতির ক্ষেত্রে ইতিবাচক অগ্রগতি চলছে।",
      mr: "आज देश आणि जगात शांतता आणि प्रगतीच्या दिशेने अनेक घडामोडी घडत आहेत.",
    },
  },
];

/**
 * Checks whether the input query is an outside-world question.
 */
export function isWorldKnowledgeQuery(query: string): boolean {
  const q = query.toLowerCase();

  // Exclude personal / family identification queries so they route to Caregiver family memories
  if (
    q.includes("ये कौन हैं") ||
    q.includes("यह कौन है") ||
    q.includes("ये कौन है") ||
    q.includes("यह व्यक्ति कौन है") ||
    q.includes("આ કોણ છે") ||
    q.includes("who is this") ||
    q.includes("who is he") ||
    q.includes("who is she")
  ) {
    return false;
  }

  // Explicit leader or geographical queries
  if (
    q.includes("प्रधानमंत्री") ||
    q.includes("राष्ट्रपति") ||
    q.includes("prime minister") ||
    q.includes("president") ||
    q.includes("who is") ||
    q.includes("कौन है") ||
    q.includes("कौन हैं") ||
    q.includes("કોણ છે") ||
    q.includes("ક્યાં છે") ||
    q.includes("રાજધાની") ||
    q.includes("राजधानी") ||
    q.includes("capital of") ||
    q.includes("match") ||
    q.includes("मैच") ||
    q.includes("દુનિયા") ||
    q.includes("दुनिया") ||
    q.includes("world news") ||
    q.includes("news today") ||
    q.includes("australia") ||
    q.includes("ऑस्ट्रेल") ||
    q.includes("ઓસ્ટ્રેલિયા") ||
    q.includes("america") ||
    q.includes("weather outside") ||
    q.includes("isro") ||
    q.includes("chandrayaan") ||
    q.includes("space") ||
    q.includes("अंतरिक्ष")
  ) {
    // Exclude internal Memory Bond queries
    if (
      q.includes("दवाई") ||
      q.includes("medicine") ||
      q.includes("appointment") ||
      q.includes("reminder") ||
      q.includes("routine") ||
      q.includes("score") ||
      q.includes("game")
    ) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Synchronously checks if a query matches verified facts (Prime Ministers, Presidents, Sports, etc.)
 */
export function resolveVerifiedFact(query: string, locale = "hi-IN"): string | null {
  const q = query.toLowerCase();
  const lang = locale.split("-")[0] || "hi";

  for (const item of VERIFIED_FACTS) {
    if (item.keywords.some((k) => q.includes(k.toLowerCase()))) {
      return item.answers[lang] || item.answers["hi"] || item.answers["en"];
    }
  }
  return null;
}

/**
 * Live Web Search using Wikipedia REST API & DuckDuckGo Instant Answer API (No API key required, CORS supported).
 */
export async function searchLiveWebKnowledge(
  query: string,
  locale = "hi-IN"
): Promise<WorldKnowledgeResult | null> {
  const clean = query
    .replace(/^(who is|what is|tell me about|who was|where is|कौन हैं|कौन है|क्या है|बताओ|કહો)\s+/i, "")
    .trim();

  if (!clean || clean.length < 2) return null;

  const lang = locale.split("-")[0] || "hi";

  // 1. Try Wikipedia REST Summary API (Wikipedia supports multi-language summaries natively)
  try {
    const wikiLang = lang === "hi" ? "hi" : "en";
    const wikiUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4 second senior-friendly timeout

    const res = await fetch(wikiUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.extract && data.extract.length > 20) {
        // Truncate to 1-2 clean sentences suitable for voice synthesis
        const sentences = data.extract.split(/[।.]\s+/);
        const cleanSummary = sentences.slice(0, 2).join(". ") + ".";

        return {
          answered: true,
          topic: data.title || clean,
          answer: cleanSummary,
          source: "live_web_search",
        };
      }
    }
  } catch {
    // Fallthrough to DuckDuckGo
  }

  // 2. Try DuckDuckGo Instant Answer API
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(clean)}&format=json&no_html=1&skip_disambig=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(ddgUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText && data.AbstractText.length > 20) {
        const sentences = data.AbstractText.split(/[।.]\s+/);
        const cleanSummary = sentences.slice(0, 2).join(". ") + ".";
        return {
          answered: true,
          topic: clean,
          answer: cleanSummary,
          source: "live_web_search",
        };
      }
    }
  } catch {
    // Fallthrough
  }

  return null;
}

/**
 * Resolves an outside world question either instantly through verified facts
 * or via live web research.
 */
export async function resolveWorldKnowledge(
  query: string,
  locale = "hi-IN"
): Promise<WorldKnowledgeResult> {
  const q = query.toLowerCase();
  const lang = locale.split("-")[0] || "hi";

  // Step 1: Check instant verified facts
  for (const item of VERIFIED_FACTS) {
    if (item.keywords.some((k) => q.includes(k.toLowerCase()))) {
      const ans = item.answers[lang] || item.answers["hi"] || item.answers["en"];
      return {
        answered: true,
        topic: item.keywords[0],
        answer: ans,
        source: "verified_knowledge_base",
      };
    }
  }

  // Step 2: Perform live web research
  const liveResult = await searchLiveWebKnowledge(query, locale);
  if (liveResult && liveResult.answer) {
    return liveResult;
  }

  // Step 3: Polite, non-hallucinated fallback
  const fallbacks: Record<string, string> = {
    hi: "मुझे इस विषय पर अभी सटीक और ताज़ा जानकारी नहीं मिली। आप कोई अन्य विषय या अपनी मेमोरी बॉन्ड जानकारी के बारे में पूछ सकते हैं।",
    gu: "મને આ વિષય પર અત્યારે ચોક્કસ માહિતી મળી શકી નથી. તમે તમારી દિનચર્યા કે અન્ય વિષય વિશે પૂછી શકો છો.",
    en: "I do not have verified details on this topic right now. You can ask about your medicine, family, or other everyday topics.",
    as: "এই বিষয়ে এই মুহূৰ্তত স্পষ্ট তথ্য পোৱা নগ’ল। আপুনি আপোনাৰ দৈনিক কাম বা ঔষধৰ বিষয়ে সুধিব পাৰে।",
    bn: "এই বিষয়ে সঠিক তথ্য এই মুহূর্তে পাওয়া যায়নি। আপনি আপনার ওষুধ বা রুটিন সম্পর্কে জিজ্ঞাসা করতে পারেন।",
    mr: "मला या विषयावर अचूक माहिती सध्या उपलब्ध नाही. आपण इतर माहिती विचारू शकता.",
  };

  return {
    answered: false,
    topic: query,
    answer: fallbacks[lang] || fallbacks["en"],
    source: "fallback",
  };
}
