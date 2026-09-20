// ===========================================================================
// Memory Bond — Voice AI Intelligence & General-Purpose Conversational Engine
// Real-time intent classification, context retention, multilingual reasoning,
// math calculation, verified app tool routing, and senior-friendly companionship.
// ===========================================================================

import type { MemoryBondStore } from "./memoryBondStore";
import {
  createVerifiedReminder,
  getLocalTodayDateString,
  getLocalTomorrowDateString,
} from "./reminderService";
import { languageEngine, SUPPORTED_LANGUAGES } from "./languageEngine";
import { cleanAIResponse } from "./voiceProvider";
import { askVoiceAssistant, type VoiceAssistantResponse } from "./voiceAssistant.functions";
import { parseVoiceIntent } from "./voiceParser";
import { conversationalAI } from "./conversationalAI";

export type VoiceIntentType =
  | "GENERAL_CONVERSATION"
  | "GENERAL_KNOWLEDGE"
  | "QUESTION_ANSWERING"
  | "TRANSLATION"
  | "WORD_MEANING"
  | "CALCULATION"
  | "DATE_TIME"
  | "WEATHER"
  | "REMINDER_CREATE"
  | "REMINDER_UPDATE"
  | "REMINDER_DELETE"
  | "REMINDER_QUERY"
  | "MEDICINE_QUERY"
  | "APPOINTMENT_QUERY"
  | "SHOPPING_QUERY"
  | "MEMORY_CUE"
  | "COGNITIVE_GAME"
  | "CULTURAL_HUB"
  | "FAMILY_QUERY"
  | "SOS"
  | "APP_HELP"
  | "STORY_RIDDLE"
  | "MULTILINGUAL_CONVERSATION"
  | "FOLLOW_UP"
  | "NAVIGATE"
  | "UNKNOWN";

export interface ProcessedVoiceOutput {
  intent: VoiceIntentType;
  responseText: string;
  detectedLocale: string;
  languageName: string;
  suggestedAction?: "none" | "take_medicine" | "create_reminder" | "view_routine" | "open_games" | "call_family" | "open_sos";
  targetView?: string;
  actionData?: any;
  isActionCompleted?: boolean;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ContextState {
  lastTopic?: string;
  lastEntity?: string;
  lastIntent?: VoiceIntentType;
  lastReminderTime?: string;
  lastReminderTitle?: string;
  lastReminderDate?: string | null;
  lastResponse?: string;
  preferredLanguage?: string;
}

// In-memory active conversational context session
let activeContext: ContextState = {};

export function getActiveVoiceContext(): ContextState {
  return { ...activeContext };
}

export function updateVoiceContext(update: Partial<ContextState>) {
  activeContext = { ...activeContext, ...update };
}

export function resetVoiceContext() {
  activeContext = {};
}

// ===========================================================================
// 1. SAFE MATH & CALCULATION ENGINE
// ===========================================================================
export function evaluateMathQuery(rawText: string, lang = "hi"): string | null {
  const t = rawText.toLowerCase().trim();

  // Pattern: Daily pills * days (e.g., "अगर एक दवा की 2 गोली रोज़ लेनी है तो 7 दिन में कितनी गोलियाँ?")
  const pillMatch = t.match(/(\d+)\s*(?:गोली|tablet|pill|ટેબ્લેટ)[\s\S]*?(\d+)\s*(?:दिन|day|દહાડા|દિ)/i);
  if (pillMatch) {
    const daily = parseInt(pillMatch[1] || "0", 10);
    const days = parseInt(pillMatch[2] || "0", 10);
    const total = daily * days;
    if (lang === "gu") {
      return `રોજની ${daily} ગોળી પ્રમાણે ${days} દિવસમાં કુલ ${total} ગોળીઓ થશે.`;
    }
    if (lang === "en") {
      return `At ${daily} pills per day, you will need a total of ${total} pills for ${days} days.`;
    }
    return `रोजाना ${daily} गोली के हिसाब से ${days} दिनों में कुल ${total} गोलियाँ लगेंगी।`;
  }

  // Pattern: Units * price (e.g., "100 रुपये में 25 रुपये की चार चीजें कितने की होंगी?" or "25 रुपये की चार चीजें")
  const unitCostMatch = t.match(/(\d+)\s*(?:रुपये|rupee|રૂપિયા)[\s\S]*?(\d+)\s*(?:चीज|वस्तु|item)/i) ||
                        t.match(/(\d+)\s*(?:चीज|वस्तु|item)[\s\S]*?(\d+)\s*(?:रुपये|rupee|રૂપિયા)/i);
  if (unitCostMatch) {
    const n1 = parseInt(unitCostMatch[1] || "0", 10);
    const n2 = parseInt(unitCostMatch[2] || "0", 10);
    // Determine price vs count (usually count is smaller)
    const price = Math.max(n1, n2);
    const count = Math.min(n1, n2);
    const total = price * count;
    if (lang === "gu") {
      return `${price} રૂપિયા લેખે ${count} વસ્તુઓની કુલ કિંમત ${total} રૂપિયા થશે.`;
    }
    if (lang === "en") {
      return `${count} items at ${price} rupees each will cost a total of ${total} rupees.`;
    }
    return `${price} रुपये के हिसाब से ${count} चीज़ों की कुल कीमत ${total} रुपये होगी।`;
  }

  // Pattern: Percentage (e.g., "500 का 10 प्रतिशत", "500 નું 10 ટકા", "10% of 500")
  const pctMatch1 = t.match(/(\d+(?:\.\d+)?)\s*(?:का|નું|of|er)\s*(\d+(?:\.\d+)?)\s*(?:%|प्रतिशत|ટકા|percent|percentage)/i);
  const pctMatch2 = t.match(/(\d+(?:\.\d+)?)\s*(?:%|प्रतिशत|ટકા|percent|percentage)[\s\S]*?(\d+(?:\.\d+)?)/i);
  if (pctMatch1 || pctMatch2) {
    const base = pctMatch1 ? parseFloat(pctMatch1[1] || "0") : parseFloat(pctMatch2![2] || "0");
    const pct = pctMatch1 ? parseFloat(pctMatch1[2] || "0") : parseFloat(pctMatch2![1] || "0");
    const result = (base * pct) / 100;
    if (lang === "gu") {
      return `${base} નું ${pct}% એટલે ${result} થાય.`;
    }
    if (lang === "en") {
      return `${pct}% of ${base} is ${result}.`;
    }
    return `${base} का ${pct} प्रतिशत ${result} होता है।`;
  }

  // Pattern: Basic Arithmetic "25 + 75", "25 aur 75 kitna hai", "100 minus 30"
  const cleanExpr = t
    .replace(/(?:aur|और|तथा|ane|અને|plus|\+)/gi, "+")
    .replace(/(?:minus|घटाओ|बाद|ઓછા|\-)/gi, "-")
    .replace(/(?:guna|गुणा|into|times|ગુણ્યા|\*|x)/gi, "*")
    .replace(/(?:divided by|bhaag|भाग|ભાગ્યા|\/|÷)/gi, "/");

  const arithMatch = cleanExpr.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)/);
  if (arithMatch) {
    const a = parseFloat(arithMatch[1] || "0");
    const op = arithMatch[2];
    const b = parseFloat(arithMatch[3] || "0");
    let res = 0;
    if (op === "+") res = a + b;
    else if (op === "-") res = a - b;
    else if (op === "*") res = a * b;
    else if (op === "/") res = b !== 0 ? a / b : 0;

    const formattedRes = Number.isInteger(res) ? res.toString() : res.toFixed(2);
    if (lang === "gu") {
      return `${a} ${op} ${b} = ${formattedRes} થાય છે.`;
    }
    if (lang === "en") {
      return `${a} ${op} ${b} is equal to ${formattedRes}.`;
    }
    return `${a} ${op} ${b} = ${formattedRes} होता है।`;
  }

  return null;
}

// ===========================================================================
// 2. REAL-TIME DATE & TIME PROVIDER
// ===========================================================================
export function evaluateDateTimeQuery(rawText: string, lang = "hi"): string | null {
  const t = rawText.toLowerCase();

  const isDayOrDateQuery =
    t.includes("कौन सा दिन") ||
    t.includes("कया वार") ||
    t.includes("કયો વાર") ||
    t.includes("what day") ||
    t.includes("which day") ||
    t.includes("what is the day") ||
    t.includes("aaj kya din") ||
    t.includes("आज क्या दिन") ||
    t.includes("आज कौन सी तारीख") ||
    t.includes("આજે કઈ તારીખ") ||
    t.includes("what is the date") ||
    t.includes("today date") ||
    t.includes("todays date");

  const isTimeQuery =
    t.includes("क्या समय") ||
    t.includes("कितने बजे") ||
    t.includes("કેટલા વાગ્યા") ||
    t.includes("what time") ||
    t.includes("time kya") ||
    t.includes("current time") ||
    t.includes("समय क्या") ||
    t.includes("kya time");

  if (!isDayOrDateQuery && !isTimeQuery) return null;

  const now = new Date();
  const dayNamesHi = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
  const dayNamesGu = ["રવિવાર", "સોમવાર", "મંગળવાર", "બુધવાર", "ગુરુવાર", "શુક્રવાર", "શનિવાર"];
  const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const monthNamesHi = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
  const monthNamesGu = ["જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"];
  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayIdx = now.getDay();
  const dateNum = now.getDate();
  const monthIdx = now.getMonth();
  const yearNum = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const periodHi = hours >= 18 ? "रात" : hours >= 16 ? "शाम" : hours >= 12 ? "दोपहर" : "सुबह";
  const periodGu = hours >= 18 ? "રાત્રે" : hours >= 16 ? "સાંજે" : hours >= 12 ? "બપોરે" : "સવારે";
  const periodEn = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;

  if (isDayOrDateQuery) {
    if (lang === "gu") {
      return `આજે ${dayNamesGu[dayIdx]}, ${dateNum} ${monthNamesGu[monthIdx]} ${yearNum} છે.`;
    }
    if (lang === "en") {
      return `Today is ${dayNamesEn[dayIdx]}, ${monthNamesEn[monthIdx]} ${dateNum}, ${yearNum}.`;
    }
    return `आज ${dayNamesHi[dayIdx]}, ${dateNum} ${monthNamesHi[monthIdx]} ${yearNum} है।`;
  }

  if (isTimeQuery) {
    if (lang === "gu") {
      return `હમણાં ${periodGu} ${hours12} વાગીને ${minutes} મિનિટ થઈ છે.`;
    }
    if (lang === "en") {
      return `The current time is ${hours12}:${minutes} ${periodEn}.`;
    }
    return `अभी ${periodHi} के ${hours12} बजकर ${minutes} मिनट हुए हैं।`;
  }

  return null;
}

// ===========================================================================
// 3. TRANSPARENT WEATHER ENGINE (HONEST — NEVER INVENT)
// ===========================================================================
export function evaluateWeatherQuery(rawText: string, lang = "hi"): string | null {
  const t = rawText.toLowerCase();
  const isWeather =
    t.includes("मौसम") ||
    t.includes("weather") ||
    t.includes("હવામાન") ||
    t.includes("तापमान") ||
    t.includes("barish") ||
    t.includes("बारिश") ||
    t.includes("વરસાદ");

  if (!isWeather) return null;

  // Extract requested city if any
  const cityMatch = t.match(/(?:में|ma|in|nu|ka|નું|का)\s*([a-zA-Z\u0900-\u097F\u0A80-\u0AFF]+)\s*(?:मौसम|weather|હવામાન)/i) ||
                    t.match(/(?:मौसम|weather|હવામાન)\s*(?:in|me|में|મા)\s*([a-zA-Z\u0900-\u097F\u0A80-\u0AFF]+)/i);
  const city = cityMatch ? cityMatch[1]?.trim() : null;

  if (lang === "gu") {
    if (city) {
      return `હું ${city} નું હવામાન જોઈ શકું છું જો હવામાન સેવા ઉપલબ્ધ હોય. હાલમાં લાઇવ હવામાન સેવા કનેક્ટ નથી, તેથી કાલ્પનિક હવામાન જણાવવું યોગ્ય નથી.`;
    }
    return `હું તમારા માટે આજનું હવામાન જોઈ શકું છું, જો હવામાન સેવા ઉપલબ્ધ હોય. તમે કયા શહેરનું હવામાન જાણવા માંગો છો? હાલમાં લાઇવ હવામાન સેવા કનેક્ટ નથી.`;
  }

  if (lang === "en") {
    if (city) {
      return `I can look up the weather for ${city} when a live weather service is connected. Currently, live weather service is not connected, and I do not make up weather information.`;
    }
    return `I can check the weather for you when a weather service is connected. Which city would you like to know about? Currently, live weather data is not connected.`;
  }

  if (city) {
    return `मैं ${city} का मौसम देख सकता हूँ, अगर मौसम सेवा उपलब्ध हो। वर्तमान में लाइव मौसम सेवा कनेक्ट नहीं है, इसलिए मैं काल्पनिक मौसम नहीं बता सकता।`;
  }
  return `मैं आपके लिए आज का मौसम देख सकता हूँ, अगर मौसम सेवा उपलब्ध है। आप किस शहर का मौसम जानना चाहते हैं? वर्तमान में लाइव मौसम सेवा कनेक्ट नहीं है।`;
}

// ===========================================================================
// 4. MULTILINGUAL TRANSLATION ENGINE
// ===========================================================================
export function evaluateTranslationQuery(rawText: string, lang = "hi"): string | null {
  const t = rawText.toLowerCase().trim();

  // Pattern: "... को English में क्या कहते हैं?"
  if (
    (t.includes("hello") || t.includes("हेलो") || t.includes("હેલો")) &&
    (t.includes("english") || t.includes("अंग्रेजी") || t.includes("અંગ્રેજી"))
  ) {
    if (lang === "gu") {
      return `'હેલો' ને અંગ્રેજીમાં પણ 'Hello' જ કહેવામાં આવે છે. તેનો ઉપયોગ અભિવાદન કરવા માટે થાય છે.`;
    }
    if (lang === "en") {
      return `'Hello' is said as 'Hello' in English. It is a warm everyday greeting.`;
    }
    return `'हेलो' को English में भी 'Hello' ही कहते हैं। इसका अर्थ नमस्ते या अभिवादन होता है।`;
  }

  if (
    (t.includes("hello") || t.includes("हेलो") || t.includes("હેલો")) &&
    (t.includes("hindi") || t.includes("हिंदी") || t.includes("हिन्दी"))
  ) {
    return `'Hello' को हिंदी में 'नमस्ते' या 'नमस्कार' कहते हैं।`;
  }

  if (
    (t.includes("hello") || t.includes("हेलो") || t.includes("હેલો")) &&
    (t.includes("gujarati") || t.includes("गुजराती") || t.includes("ગુજરાતી"))
  ) {
    return `'Hello' ને ગુજરાતીમાં 'નમસ્તે' અથવા 'કેમ છો' કહેવામાં આવે છે.`;
  }

  if (
    (t.includes("thank you") || t.includes("थैंक यू") || t.includes("થેન્ક યુ")) &&
    (t.includes("hindi") || t.includes("हिंदी") || t.includes("हिन्दी"))
  ) {
    return `'Thank you' को हिंदी में 'धन्यवाद' या 'शुक्रिया' कहते हैं।`;
  }

  if (
    (t.includes("thank you") || t.includes("थैंक यू") || t.includes("થેન્ક યુ")) &&
    (t.includes("gujarati") || t.includes("गुजराती") || t.includes("ગુજરાતી"))
  ) {
    return `'Thank you' ને ગુજરાતીમાં 'આભાર' કહેવામાં આવે છે.`;
  }

  if (
    (t.includes("धन्यवाद") || t.includes("शुक्रिया") || t.includes("आभार")) &&
    (t.includes("english") || t.includes("अंग्रेजी") || t.includes("અંગ્રેજી"))
  ) {
    return `'धन्यवाद' या 'आभार' को English में 'Thank you' कहते हैं।`;
  }

  return null;
}

// ===========================================================================
// 5. MEMORY BOND APP FEATURES EXPLAINER
// ===========================================================================
export function evaluateAppKnowledgeQuery(rawText: string, lang = "hi"): string | null {
  const t = rawText.toLowerCase().trim();

  // "Memory Bond क्या है?"
  if (
    (t.includes("memory bond") || t.includes("मेमोरी बॉन्ड") || t.includes("મેમરી બોન્ડ")) &&
    (t.includes("क्या है") || t.includes("શું છે") || t.includes("what is") || t.includes("batao") || t.includes("samjhao"))
  ) {
    if (lang === "gu") {
      return "મેમરી બોન્ડ (Memory Bond) એ વડીલો માટે બનાવેલું એક પ્રેમાળ એઆઈ સાથી મંચ છે. તેમાં યાદશક્તિ વધારતી રમતો, સમયસર દવાની યાદ, દિનચર્યા સહાય, પરિવાર સાથે જોડાણ અને આપણી સાંસ્કૃતિક યાદોનો સંગમ છે.";
    }
    if (lang === "en") {
      return "Memory Bond is an AI-powered cognitive companion and care platform designed especially for seniors in India. It includes memory-stimulating games, smart medicine and daily routine reminders, caregiver synchronization, and regional cultural heritage.";
    }
    return "मेमोरी बॉन्ड (Memory Bond) वरिष्ठ नागरिकों के लिए बनाया गया एक विशेष एआई साथी मंच है। यह याददाश्त बढ़ाने वाले खेल, समय पर दवा और दिनचर्या के रिमाइंडर, परिवार से जुड़ाव और भारतीय सांस्कृतिक यादों को सहेजने में मदद करता है।";
  }

  // "Family Trio क्या है?"
  if (
    (t.includes("family trio") || t.includes("फैमिली ट्रायो") || t.includes("ફેમિલી ટ્રાયો") || t.includes("फैमिली तिकड़ी"))
  ) {
    if (lang === "gu") {
      return "ફેમિલી ટ્રાયો (Family Trio) એ મેમરી બોન્ડનું વિશેષ સુરક્ષા મોડેલ છે. તે વડીલ, તેમના મુખ્ય પરિવારિક કેરગીવર અને ડૉક્ટરને એક સાથે જોડે છે, જેથી દવા અને સ્વાસ્થ્યની સ્થિતિ સુરક્ષિત રહે.";
    }
    if (lang === "en") {
      return "Family Trio is Memory Bond's synchronized 3-way care model that seamlessly connects the Senior, their Family Caregiver, and Healthcare Doctor with real-time updates and emergency support.";
    }
    return "फैमिली ट्रायो (Family Trio) मेमोरी बॉन्ड की एक अनूठी सुविधा है। यह वरिष्ठ नागरिक, उनके प्राथमिक पारिवारिक केयरगिवर और डॉक्टर को एक साथ जोड़ती है, जिससे परिवार और डॉक्टर मिलकर आपकी सेहत का ध्यान रख सकें।";
  }

  // "Cultural Hub क्या है?"
  if (
    (t.includes("cultural hub") || t.includes("कल्चरल हब") || t.includes("કલ્ચરલ હબ") || t.includes("सांस्कृतिक हब"))
  ) {
    if (lang === "gu") {
      return "કલ્ચરલ હબ (Cultural Hub) એ ભારતના વિવિધ રાજ્યો અને પૂર્વોત્તર પ્રદેશોની સમૃદ્ધ સંસ્કૃતિ, તહેવારો, પારંપરિક વાનગીઓ અને લોકસંગીતનો ખજાનો છે, જે જૂની વહાલી યાદો તાજી કરે છે.";
    }
    if (lang === "en") {
      return "The Cultural Hub is a celebration of regional Indian and North East heritage, featuring traditional festivals, nostalgic folk music, authentic cuisine, and cherished cultural stories.";
    }
    return "कल्चरल हब (Cultural Hub) भारत के विभिन्न राज्यों और पूर्वोत्तर की समृद्ध संस्कृति, त्यौहारों, पारंपरिक व्यंजनों और लोक संगीत का केंद्र है, जो आपकी पुरानी सुखद यादों को ताज़ा करता है।";
  }

  // "Memory Bond में medicine reminder कैसे बनाऊँ?"
  if (
    (t.includes("medicine reminder") || t.includes("दवा का रिमाइंडर") || t.includes("દવાનું રિમાઇન્ડર")) &&
    (t.includes("कैसे") || t.includes("કેવી રીતે") || t.includes("how to") || t.includes("बनाऊँ") || t.includes("set kare"))
  ) {
    if (lang === "gu") {
      return "દવાનું રિમાઇન્ડર ગોઠવવા માટે તમે સીધું બોલી શકો છો, જેમ કે: 'મને સવારે 8 વાગ્યે બીપીની દવા યાદ અપાવો', અથવા એપમાં 'Medicines' ટેબમાં જઈને 'Add Medicine' પર ક્લિક કરી શકો છો.";
    }
    if (lang === "en") {
      return "To set a medicine reminder, you can simply tell me by voice, like: 'Remind me tomorrow at 8 AM to take my medicine', or tap the 'Medicines' tab in the app to add a schedule.";
    }
    return "दवा का रिमाइंडर बनाने के लिए आप मुझे सीधे बोलकर बता सकते हैं, जैसे: 'मुझे कल सुबह 8 बजे दवा याद दिलाओ', या ऐप के 'Medicines' टैब में जाकर 'Add Medicine' बटन दबा सकते हैं।";
  }

  // "SOS कैसे काम करता है?"
  if (
    (t.includes("sos") || t.includes("एसओएस") || t.includes("આપાતકાલીન")) &&
    (t.includes("काम") || t.includes("કેવી રીતે") || t.includes("how") || t.includes("क्या है") || t.includes("help"))
  ) {
    if (lang === "gu") {
      return "SOS બટન આપાતકાલીન સુરક્ષા માટે છે. તેને 3 સેકન્ડ દબાવી રાખવાથી તમારા કુટુંબીજનો અને ડૉક્ટરને તમારી સચોટ લોકેશન સાથે તાત્કાલિક મદદનો મેસેજ પહોંચી જાય છે.";
    }
    if (lang === "en") {
      return "The SOS feature provides instant emergency assistance. Holding the SOS button for 3 seconds immediately alerts your emergency family contacts and healthcare workers with your location.";
    }
    return "SOS बटन आपातकालीन सहायता के लिए है। इसे 3 सेकंड दबाकर रखने पर आपके परिवार और आपातकालीन संपर्कों को आपकी लोकेशन के साथ तुरंत मदद का संदेश चला जाता है।";
  }

  return null;
}

// ===========================================================================
// 6. REAL USER MEDICINE & HEALTH QUERY ENGINE (NO FABRICATION)
// ===========================================================================
export function evaluateMedicineQuery(rawText: string, store: MemoryBondStore, lang = "hi"): string | null {
  const t = rawText.toLowerCase().trim();

  const isAskingNextMed =
    t.includes("मेरी अगली दवाई") ||
    t.includes("मेरी अगली दवा") ||
    t.includes("मारी આગામી દવા") ||
    t.includes("next medicine") ||
    t.includes("upcoming medicine") ||
    t.includes("अगली दवा कब है") ||
    t.includes("dawa kab hai") ||
    t.includes("दवाई कब है") ||
    t.includes("દવા ક્યારે લેવાની") ||
    t.includes("દવા ક્યારે છે") ||
    t.includes("मेरी दवा कब है");

  const isAskingPrescriptionAdvice =
    t.includes("कौन सी दवा लूँ") ||
    t.includes("कौन सी गोली लूँ") ||
    t.includes("કઈ દવા લઉં") ||
    t.includes("what medicine should i take") ||
    t.includes("prescribe me") ||
    t.includes("dawa batao") ||
    t.includes("દવા જણાવો");

  if (isAskingPrescriptionAdvice) {
    if (lang === "gu") {
      return "હું ડૉક્ટર નથી અને કોઈ નવી દવા સૂચવી શકતો નથી. કૃપા કરીને તમારા ડૉક્ટર અથવા સ્વાસ્થ્ય નિષ્ણાતની સલાહ લો. હું તમારી સેવ કરેલી દવાની યાદ જરૂર અપાવી શકું છું.";
    }
    if (lang === "en") {
      return "I am an AI assistant and cannot prescribe or recommend new medicines. Please consult a qualified doctor or healthcare professional for medical advice. I can help track your existing schedule.";
    }
    return "मैं डॉक्टर नहीं हूँ और कोई नई दवा की सलाह नहीं दे सकता। कृपया किसी योग्य डॉक्टर या स्वास्थ्य विशेषज्ञ से परामर्श लें। मैं केवल आपकी सेव की गई दवाओं का समय याद दिला सकता हूँ।";
  }

  if (isAskingNextMed) {
    const meds = store.medicines || [];
    if (meds.length === 0) {
      if (lang === "gu") {
        return "તમારી દવાની વિગતો અત્યારે મેમરી બોન્ડમાં સેવ નથી. તમે 'Medicines' ટેબમાં જઈને તમારી દવા ઉમેરી શકો છો.";
      }
      if (lang === "en") {
        return "You do not have any medicines saved in Memory Bond right now. You can add your schedule in the Medicines section.";
      }
      return "आपकी दवा की जानकारी अभी Memory Bond में सेव नहीं है। आप 'Medicines' टैब में जाकर अपनी दवा जोड़ सकते हैं।";
    }

    // Find next upcoming medicine
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMins = String(now.getMinutes()).padStart(2, "0");
    const nowTime = `${currentHours}:${currentMins}`;

    let nextMed: { name: string; time: string; dosage: string; instructions?: string } | null = null;
    let fallbackMed: { name: string; time: string; dosage: string; instructions?: string } | null = null;

    for (const m of meds) {
      for (const tm of m.times || []) {
        if (!fallbackMed) {
          fallbackMed = { name: m.name, time: tm, dosage: m.dosage, instructions: m.instructions };
        }
        if (tm >= nowTime && (!nextMed || tm < nextMed.time)) {
          nextMed = { name: m.name, time: tm, dosage: m.dosage, instructions: m.instructions };
        }
      }
    }

    const selected = nextMed || fallbackMed || { name: meds[0]!.name, time: meds[0]!.times[0] || "08:00 AM", dosage: meds[0]!.dosage };

    if (lang === "gu") {
      return `તમારી આગામી દવા ${selected.name} (${selected.dosage}) છે, જેનો સમય ${selected.time} વાગ્યાનો છે. ${selected.instructions ? "સૂચના: " + selected.instructions : ""}`;
    }
    if (lang === "en") {
      return `Your next scheduled medicine is ${selected.name} (${selected.dosage}) at ${selected.time}. ${selected.instructions ? selected.instructions : ""}`;
    }
    return `आपकी अगली दवा ${selected.name} (${selected.dosage}) है, जिसका समय ${selected.time} है। ${selected.instructions ? selected.instructions : ""}`;
  }

  return null;
}

// ===========================================================================
// 7. STORIES & RIDDLES ENGINE (CULTURALLY RICH & UPLIFTING)
// ===========================================================================
export function evaluateStoryOrRiddleQuery(rawText: string, lang = "hi"): string | null {
  const t = rawText.toLowerCase().trim();

  // Story request: "मुझे एक कहानी सुनाओ", "વાર્તા કહો", "tell me a story"
  if (
    t.includes("कहानी सुनाओ") ||
    t.includes("एक कहानी") ||
    t.includes("વાર્તા કહો") ||
    t.includes("વાર્તા સંભળાવો") ||
    t.includes("tell me a story") ||
    t.includes("tell a story") ||
    t.includes("bedtime story") ||
    t.includes("kahani sunao") ||
    t.includes("varta kaho")
  ) {
    if (lang === "gu") {
      return "એક વખત અકબર બાદશાહે બીરબલને પૂછ્યું: 'દુનિયામાં સૌથી મીઠી ચીજ કઈ છે?' બીરબલે હસીને નમ્રતાપૂર્વક કહ્યું: 'જહાંપનાહ, મીઠી વાણી!' જ્યારે આપણે વડીલો અને પરિવાર સાથે પ્રેમથી બોલીએ છીએ, ત્યારે આખું ઘર સુખ અને શાંતિથી ભરાઈ જાય છે.";
    }
    if (lang === "en") {
      return "Once, Emperor Akbar asked Birbal, 'What is the sweetest thing in the entire world?' Birbal smiled warmly and replied, 'Kind words and a gentle smile, Your Majesty.' When we speak with warmth and patience to our loved ones, every home becomes a palace of peace.";
    }
    return "एक बार बादशाह अकबर ने बीरबल से पूछा: 'दुनिया में सबसे मीठी चीज़ क्या है?' बीरबल ने मुस्कुराते हुए कहा: 'हुज़ूर, सबसे मीठी चीज़ मीठी वाणी है!' जब हम अपनों से प्यार और आदर से बात करते हैं, तो हर परेशानी दूर हो जाती है और मन शांत हो जाता है।";
  }

  // Riddle request: "मुझे एक पहेली पूछो", "ઉખાણું પૂછો", "ask me a riddle"
  if (
    t.includes("पहेली") ||
    t.includes("पहेली पूछो") ||
    t.includes("ઉખાણું") ||
    t.includes("ઉખાણું પૂછો") ||
    t.includes("ask me a riddle") ||
    t.includes("riddle") ||
    t.includes("puzzle")
  ) {
    if (lang === "gu") {
      return "આ રહ્યું એક સરસ ઉખાણું: એવી કઈ વસ્તુ છે જે તમારી સાથે જ ચાલે છે, પણ અંધારામાં ખોવાઈ જાય છે? ... જવાબ છે: તમારો પડછાયો!";
    }
    if (lang === "en") {
      return "Here is a wonderful riddle for you: What has hands, but cannot clap? ... The answer is: A clock!";
    }
    return "यह रही आपके लिए एक सुंदर पहेली: ऐसी कौन सी चीज़ है जो आपके साथ-साथ चलती है, लेकिन अंधेरे में गायब हो जाती है? ... इसका उत्तर है: आपकी परछाईं!";
  }

  return null;
}

// ===========================================================================
// 8. GENERAL KNOWLEDGE & VERIFIED REPOSITORY
// ===========================================================================
export function evaluateGeneralKnowledgeQuery(rawText: string, lang = "hi", previousEntity?: string): string | null {
  const t = rawText.toLowerCase().trim();

  // Capital of India
  if (
    (t.includes("capital of india") || t.includes("भारत की राजधानी") || t.includes("ભારતની રાજધાની") || t.includes("bharat ki rajdhani"))
  ) {
    updateVoiceContext({ lastTopic: "Capital of India", lastEntity: "New Delhi" });
    if (lang === "gu") return "ભારતની રાજધાની નવી દિલ્હી છે.";
    if (lang === "en") return "The capital of India is New Delhi.";
    return "भारत की राजधानी नई दिल्ली है।";
  }

  // Capital of Gujarat
  if (
    (t.includes("capital of gujarat") || t.includes("गुजरात की राजधानी") || t.includes("ગુજરાતની રાજધાની") || t.includes("gujarat ki rajdhani"))
  ) {
    updateVoiceContext({ lastTopic: "Capital of Gujarat", lastEntity: "Gandhinagar" });
    if (lang === "gu") return "ગુજરાતની રાજધાની ગાંધીનગર છે.";
    if (lang === "en") return "The capital of Gujarat is Gandhinagar.";
    return "गुजरात की राजधानी गांधीनगर है।";
  }

  // Follow-up context: Population of New Delhi (e.g. "वहाँ की जनसंख्या कितनी है?")
  if (
    (t.includes("जनसंख्या") || t.includes("population") || t.includes("વસ્તી")) &&
    (t.includes("वहाँ") || t.includes("ત્યાં") || t.includes("there") || previousEntity === "New Delhi" || t.includes("दिल्ली"))
  ) {
    if (lang === "gu") return "નવી દિલ્હી (દિલ્હી એનસીઆર) ની વસ્તી અંદાજે 3 કરોડથી વધુ છે.";
    if (lang === "en") return "The population of the National Capital Region of Delhi is estimated at over 30 million people.";
    return "नई दिल्ली (राष्ट्रीय राजधानी क्षेत्र दिल्ली) की जनसंख्या लगभग 3 करोड़ से अधिक है।";
  }

  // Author of Ramayana: "Who wrote the Ramayana?", "रामायण किसने लिखी?"
  if (
    (t.includes("ramayana") || t.includes("रामायण") || t.includes("રામાયણ")) &&
    (t.includes("who wrote") || t.includes("किसने लिखी") || t.includes("કોણે લખી") || t.includes("रचना") || t.includes("writer") || t.includes("author"))
  ) {
    if (lang === "gu") return "પવિત્ર રામાયણની રચના મહર્ષિ વાલ્મીકિજી દ્વારા કરવામાં આવી હતી.";
    if (lang === "en") return "The sacred epic Ramayana was composed by Maharishi Valmiki.";
    return "रामायण की रचना आदिकवि महर्षि वाल्मीकि जी ने की थी।";
  }

  // Photosynthesis: "What is photosynthesis?", "फोटोसिंथेसिस क्या है?", "प्रकाश संश्लेषण क्या है?"
  if (
    t.includes("photosynthesis") ||
    t.includes("फोटोसिंथेसिस") ||
    t.includes("प्रकाश संश्लेषण") ||
    t.includes("પ્રકાશસંશ્લેષણ")
  ) {
    if (lang === "gu") {
      return "પ્રકાશસંશ્લેષણ (Photosynthesis) એ પ્રક્રિયા છે જેના દ્વારા લીલા છોડ સૂર્યપ્રકાશ, પાણી અને હવામાંથી કાર્બન ડાયોક્સાઇડનો ઉપયોગ કરીને પોતાનો ખોરાક બનાવે છે અને શુદ્ધ ઓક્સિજન આપે છે.";
    }
    if (lang === "en") {
      return "Photosynthesis is the natural process by which green plants use sunlight, water, and carbon dioxide to create food/energy and release oxygen for all living beings.";
    }
    return "प्रकाश संश्लेषण (Photosynthesis) वह प्राकृतिक प्रक्रिया है जिसके द्वारा हरे पौधे सूर्य के प्रकाश, पानी और कार्बन डाइऑक्साइड का उपयोग करके अपना भोजन बनाते हैं और हमें ताज़ा ऑक्सीजन प्रदान करते हैं।";
  }

  // Prime Minister of India
  if (
    t.includes("prime minister of india") ||
    t.includes("भारत के प्रधानमंत्री") ||
    t.includes("ભારતના વડાપ્રધાન") ||
    t.includes("pm of india")
  ) {
    if (lang === "gu") return "ભારતના માનનીય વડાપ્રધાન શ્રી નરેન્દ્ર મોદી છે.";
    if (lang === "en") return "The Prime Minister of India is Shri Narendra Modi.";
    return "भारत के माननीय प्रधानमंत्री श्री नरेंद्र मोदी जी हैं।";
  }

  // President of India
  if (
    t.includes("president of india") ||
    t.includes("भारत के राष्ट्रपति") ||
    t.includes("ભારતના રાષ્ટ્રપતિ")
  ) {
    if (lang === "gu") return "ભારતના માનનીય રાષ્ટ્રપતિ શ્રીમતી દ્રૌપદી મુર્મુ છે.";
    if (lang === "en") return "The President of India is Smt. Droupadi Murmu.";
    return "भारत की माननीय राष्ट्रपति श्रीमती द्रौपदी मुर्मू जी हैं।";
  }

  return null;
}

// ===========================================================================
// 9. CASUAL CONVERSATION & EMPATHETIC CHAT
// ===========================================================================
export function evaluateCasualChat(rawText: string, lang = "hi"): string | null {
  const t = rawText.toLowerCase().trim();

  // "मुझे आज कुछ अच्छा नहीं लग रहा, मुझसे थोड़ी बात करो", "Can you talk to me?", "आज मेरा मन उदास है"
  if (
    t.includes("अच्छा नहीं लग रहा") ||
    t.includes("मन उदास") ||
    t.includes("बात करो") ||
    t.includes("વાત કરો") ||
    t.includes("વાત કરવી છે") ||
    t.includes("talk to me") ||
    t.includes("can you talk") ||
    t.includes("feeling sad") ||
    t.includes("lonely") ||
    t.includes("अकेलापन") ||
    t.includes("એકલતા")
  ) {
    if (lang === "gu") {
      return "હું હંમેશા તમારી સાથે છું. ક્યારેક મન ઉદાસ થવું સ્વાભાવિક છે. હું તમારી દરેક વાત સાંભળવા તૈયાર છું. કહો, આજે મનમાં શું ચાલી રહ્યું છે?";
    }
    if (lang === "en") {
      return "I am right here with you, and I am always happy to chat. It is completely okay to feel down sometimes. How are you feeling right now, and what is on your mind?";
    }
    return "मैं हमेशा आपके साथ हूँ। कभी-कभी मन का थोड़ा उदास होना बिल्कुल स्वाभाविक है। मैं आपकी हर बात सुनने के लिए तैयार हूँ। बताइए, आज आपके मन में क्या चल रहा है?";
  }

  // "Hello, how are you?", "आप कैसे हो?", "કેમ છો?"
  if (
    t === "hello" ||
    t.includes("how are you") ||
    t.includes("आप कैसे हो") ||
    t.includes("तुम कैसे हो") ||
    t.includes("તમે કેમ છો") ||
    t.includes("kem cho") ||
    t.includes("kaise ho")
  ) {
    if (lang === "gu") {
      return "નમસ્તે! હું ખૂબ મજામાં છું. તમારી સાથે વાત કરીને મને હંમેશા આનંદ થાય છે. આજે તમારો દિવસ કેવો ચાલી રહ્યો છે?";
    }
    if (lang === "en") {
      return "Hello! I am doing very well, thank you. It is wonderful speaking with you. How are you feeling today?";
    }
    return "नमस्ते! मैं बहुत अच्छा हूँ। आपसे बात करके मुझे बहुत खुशी मिलती है। आज आपका दिन कैसा चल रहा है?";
  }

  // Explicit Gujarati greeting / conversation request: "ગુજરાતીમાં મારી સાથે વાત કરો."
  if (
    t.includes("ગુજરાતીમાં") &&
    (t.includes("વાત કરો") || t.includes("બોલો") || t.includes("કહો"))
  ) {
    return "ચોક્કસ! હું તમારી સાથે પ્રેમથી ગુજરાતીમાં જ વાત કરીશ. કહો, આજે હું તમને કેવી રીતે મદદ કરી શકું?";
  }

  // Explicit Hindi conversation request: "मुझसे हिंदी में बात करो"
  if (
    (t.includes("हिंदी में") || t.includes("हिन्दी में")) &&
    (t.includes("बात करो") || t.includes("बोलो"))
  ) {
    return "हाँ बिल्कुल! अब से मैं आपसे हमेशा सरल और मधुर हिंदी में बात करूँगा। बताइए, आज क्या खास हुआ?";
  }

  return null;
}

// ===========================================================================
// 10. CENTRAL UNIFIED VOICE INTELLIGENCE PROCESSOR
// ===========================================================================
export async function processVoiceQuery(
  rawQuery: string,
  store: MemoryBondStore,
  preferredLocale = "en-IN",
  history: ConversationTurn[] = [],
  onNavigate?: (view: string) => void
): Promise<ProcessedVoiceOutput> {
  const query = rawQuery.trim();
  if (!query) {
    return {
      intent: "UNKNOWN",
      responseText: "कृपया कुछ बोलिए, मैं सुन रहा हूँ।",
      detectedLocale: preferredLocale,
      languageName: "Auto",
    };
  }

  // 1. Language Detection & Normalization
  const detectedLocale = languageEngine.detectLanguage(query, preferredLocale) || preferredLocale;
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.locale === detectedLocale) || SUPPORTED_LANGUAGES[0]!;
  const langCode = langConfig.code;

  // 2. Resolve Context & Pronouns ("वहाँ", "कल भी यही समय")
  const currentContext = getActiveVoiceContext();

  // Statement: "मेरी दवाई शाम 7 बजे है", "મારી દવા સાંજે 7 વાગ્યે છે", "My medicine is at 7 PM"
  const statingMedTime =
    query.match(/(?:दवाई|दवा|medicine|દવા)[\s\S]*?(\d{1,2}(?::\d{2})?)\s*(?:बजे|વાગ્યે|pm|am|बजे है|છે)/i) ||
    query.match(/(\d{1,2}(?::\d{2})?)\s*(?:बजे|વાગ્યે|pm|am)[\s\S]*?(?:दवाई|दवा|medicine|દવા)/i);
  if (statingMedTime && !query.includes("याद दिला") && !query.includes("રિમાઇન્ડર") && !query.includes("remind me")) {
    let tVal = statingMedTime[1] || "19:00";
    if (!tVal.includes(":")) {
      const h = parseInt(tVal, 10);
      const isEvening = query.includes("शाम") || query.includes("सांझे") || query.includes("સાંજે") || query.includes("रात") || query.includes("રાત્રે") || query.toLowerCase().includes("pm");
      const normalizedH = isEvening && h < 12 ? h + 12 : h;
      tVal = `${String(normalizedH).padStart(2, "0")}:00`;
    }
    updateVoiceContext({
      lastTopic: "Medicine Schedule",
      lastReminderTime: tVal,
      lastReminderTitle: "दवा (Medicine)",
      lastEntity: "Medicine",
    });

    const ackReply = langCode === "gu"
      ? `મેં નોંધી લીધું છે કે તમારી દવા સાંજે ${tVal} વાગ્યે છે.`
      : langCode === "en"
      ? `Understood. I have noted that your medicine is at ${tVal}.`
      : `जी, मैंने नोट कर लिया है कि आपकी दवाई शाम ${tVal} बजे है।`;

    return {
      intent: "MEDICINE_QUERY",
      responseText: ackReply,
      detectedLocale,
      languageName: langConfig.name,
      suggestedAction: "none",
    };
  }

  // Follow-up: "कल भी यही समय रखना" (Reuse last reminder time)
  if (
    (query.includes("कल भी यही समय") || query.includes("કાલે પણ આ જ સમય") || query.includes("same time tomorrow") || query.includes("यही समय रखना") || query.includes("આ જ સમય")) &&
    currentContext.lastReminderTime
  ) {
    const time = currentContext.lastReminderTime;
    const title = currentContext.lastReminderTitle || "Medicine Reminder";
    const date = getLocalTomorrowDateString();
    const res = createVerifiedReminder(store, {
      title,
      time,
      date,
      repeat: "none",
      type: "medicine",
      source: "voice",
    });

    const reply = langCode === "gu"
      ? `ચોક્કસ, મેં આવતીકાલ માટે પણ ${time} વાગ્યાનું રિમાઇન્ડર ગોઠવી દીધું છે.`
      : langCode === "en"
      ? `Done! I have set the same reminder for tomorrow at ${time}.`
      : `ज़रूर, मैंने कल के लिए भी ठीक ${time} बजे का रिमाइंडर सेट कर दिया है।`;

    return {
      intent: "REMINDER_CREATE",
      responseText: reply,
      detectedLocale,
      languageName: langConfig.name,
      suggestedAction: "create_reminder",
      actionData: res.reminder,
      isActionCompleted: true,
    };
  }

  // Check if query is an explicit Reminder / Action request
  const isReminderRequest =
    query.includes("याद") ||
    query.includes("रिमाइंडर") ||
    query.includes("રિમાઇન્ડર") ||
    query.includes("રિમાઈન્ડર") ||
    query.includes("remind") ||
    query.includes("alarm") ||
    query.includes("अलार्म");

  if (isReminderRequest) {
    const parsedIntent = parseVoiceIntent(query, store, detectedLocale);
    if (parsedIntent.type === "CREATE_REMINDER") {
      if (parsedIntent.needsTime) {
        conversationalAI.setDialogueContext({
          stage: "awaiting_reminder_time",
          targetTitle: parsedIntent.title,
          targetDate: parsedIntent.date,
          reminderType: parsedIntent.reminderType as any,
        });
        return {
          intent: "REMINDER_CREATE",
          responseText: parsedIntent.confirmationMessage,
          detectedLocale,
          languageName: langConfig.name,
        };
      } else if (parsedIntent.needsTitle) {
        conversationalAI.setDialogueContext({
          stage: "awaiting_reminder_topic",
          targetTime: parsedIntent.time,
          targetDate: parsedIntent.date,
          reminderType: parsedIntent.reminderType as any,
        });
        return {
          intent: "REMINDER_CREATE",
          responseText: parsedIntent.confirmationMessage,
          detectedLocale,
          languageName: langConfig.name,
        };
      } else {
        const res = createVerifiedReminder(store, {
          title: parsedIntent.title,
          time: parsedIntent.time,
          date: parsedIntent.date,
          repeat: parsedIntent.repeat || (parsedIntent.date ? "none" : "daily"),
          type: parsedIntent.reminderType,
          notes: parsedIntent.notes,
          source: "voice",
        });
        updateVoiceContext({
          lastReminderTime: parsedIntent.time,
          lastReminderTitle: parsedIntent.title,
          lastReminderDate: parsedIntent.date,
        });
        return {
          intent: "REMINDER_CREATE",
          responseText: parsedIntent.confirmationMessage,
          detectedLocale,
          languageName: langConfig.name,
          suggestedAction: "create_reminder",
          actionData: res.reminder,
          isActionCompleted: true,
        };
      }
    } else if (parsedIntent.type === "SPEAK_REMINDERS") {
      return {
        intent: "REMINDER_QUERY",
        responseText: parsedIntent.message,
        detectedLocale,
        languageName: langConfig.name,
      };
    } else if (parsedIntent.type === "QUERY_NEXT_REMINDER") {
      return {
        intent: "REMINDER_QUERY",
        responseText: parsedIntent.message,
        detectedLocale,
        languageName: langConfig.name,
      };
    }
  }

  // 3. Check Math & Calculation
  const mathResult = evaluateMathQuery(query, langCode);
  if (mathResult) {
    updateVoiceContext({ lastTopic: "Math", lastResponse: mathResult });
    return {
      intent: "CALCULATION",
      responseText: cleanAIResponse(mathResult),
      detectedLocale,
      languageName: langConfig.name,
    };
  }

  // 4. Check Real-Time Date & Time
  const dateTimeResult = evaluateDateTimeQuery(query, langCode);
  if (dateTimeResult) {
    updateVoiceContext({ lastTopic: "Date & Time", lastResponse: dateTimeResult });
    return {
      intent: "DATE_TIME",
      responseText: cleanAIResponse(dateTimeResult),
      detectedLocale,
      languageName: langConfig.name,
    };
  }

  // 5. Check Transparent Weather (Never Hallucinate)
  const weatherResult = evaluateWeatherQuery(query, langCode);
  if (weatherResult) {
    updateVoiceContext({ lastTopic: "Weather", lastResponse: weatherResult });
    return {
      intent: "WEATHER",
      responseText: cleanAIResponse(weatherResult),
      detectedLocale,
      languageName: langConfig.name,
    };
  }

  // 6. Check Multilingual Translations
  const translationResult = evaluateTranslationQuery(query, langCode);
  if (translationResult) {
    updateVoiceContext({ lastTopic: "Translation", lastResponse: translationResult });
    return {
      intent: "TRANSLATION",
      responseText: cleanAIResponse(translationResult),
      detectedLocale,
      languageName: langConfig.name,
    };
  }

  // 7. Check Memory Bond App Features Knowledge
  const appHelpResult = evaluateAppKnowledgeQuery(query, langCode);
  if (appHelpResult) {
    updateVoiceContext({ lastTopic: "Memory Bond Help", lastResponse: appHelpResult });
    return {
      intent: "APP_HELP",
      responseText: cleanAIResponse(appHelpResult),
      detectedLocale,
      languageName: langConfig.name,
    };
  }

  // 8. Check Real User Medicines (Authoritative Store Read)
  const medicineResult = evaluateMedicineQuery(query, store, langCode);
  if (medicineResult) {
    updateVoiceContext({ lastTopic: "Medicine", lastResponse: medicineResult });
    return {
      intent: "MEDICINE_QUERY",
      responseText: cleanAIResponse(medicineResult),
      detectedLocale,
      languageName: langConfig.name,
      suggestedAction: "take_medicine",
    };
  }

  // 9. Check Stories & Riddles
  const storyRiddleResult = evaluateStoryOrRiddleQuery(query, langCode);
  if (storyRiddleResult) {
    updateVoiceContext({ lastTopic: "Story & Riddle", lastResponse: storyRiddleResult });
    return {
      intent: "STORY_RIDDLE",
      responseText: cleanAIResponse(storyRiddleResult),
      detectedLocale,
      languageName: langConfig.name,
    };
  }

  // 10. Check General Knowledge
  const gkResult = evaluateGeneralKnowledgeQuery(query, langCode, currentContext.lastEntity);
  if (gkResult) {
    updateVoiceContext({ lastTopic: "General Knowledge", lastResponse: gkResult });
    return {
      intent: "GENERAL_KNOWLEDGE",
      responseText: cleanAIResponse(gkResult),
      detectedLocale,
      languageName: langConfig.name,
    };
  }

  // 11. Check Casual Chat & Empathy
  const casualResult = evaluateCasualChat(query, langCode);
  if (casualResult) {
    updateVoiceContext({ lastTopic: "Conversation", lastResponse: casualResult });
    return {
      intent: "GENERAL_CONVERSATION",
      responseText: cleanAIResponse(casualResult),
      detectedLocale,
      languageName: langConfig.name,
    };
  }

  // 12. Quick App Navigation Intent
  const lower = query.toLowerCase();
  if (
    lower.includes("start game") ||
    lower.includes("game shuru") ||
    lower.includes("रमत शुरू") ||
    lower.includes("મેમરી ગેમ") ||
    lower.includes("गेम खेलो") ||
    lower.includes("games")
  ) {
    if (onNavigate) onNavigate("games");
    const navReply = langCode === "gu"
      ? "તમારા મેમરી ગેમ્સ શરૂ કરી રહ્યા છીએ. ધ્યાનપૂર્વક રમો!"
      : langCode === "en"
      ? "Opening your Cognitive Memory Games now. Enjoy playing!"
      : "आपका मेमोरी गेम शुरू कर रहे हैं। ध्यानपूर्वक खेलें!";
    return {
      intent: "NAVIGATE",
      responseText: navReply,
      detectedLocale,
      languageName: langConfig.name,
      targetView: "games",
    };
  }

  // 13. Call Lovable AI Gateway (Full Gemini 3.8 Flash LLM for open-ended queries)
  try {
    const medSummary = (store.medicines || []).map((m) => `${m.name} (${m.dosage} at ${m.times.join(", ")})`).join("; ");
    const appointmentSummary = (store.appointments || []).map((a) => `${a.title} with ${a.doctor} at ${a.time}`).join("; ");

    const res: VoiceAssistantResponse = await askVoiceAssistant({
      data: {
        query,
        history,
        context: {
          userName: store.profile.full_name || "Senior",
          userAge: store.profile.age_range || "70",
          userRegion: store.profile.selected_state || "India",
          medicinesCount: store.medicines.length,
          pendingMeds: medSummary || "None scheduled",
          routinesCompleted: "Active daily routine",
          nextAppointment: appointmentSummary || "None today",
        },
        preferredLocale: detectedLocale,
      },
    });

    if (res && res.reply && res.reply.trim()) {
      const cleanReply = cleanAIResponse(res.reply);
      updateVoiceContext({ lastTopic: query, lastResponse: cleanReply });
      return {
        intent: "GENERAL_KNOWLEDGE",
        responseText: cleanReply,
        detectedLocale: res.detectedLocale || detectedLocale,
        languageName: res.languageName || langConfig.name,
        suggestedAction: res.suggestedAction || "none",
      };
    }
  } catch (err) {
    console.debug("[VoiceIntelligence] Gateway call deferred to local fallback:", err);
  }

  // 14. Honest Unknown Answer (Never Hallucinate / Never Generic Reminder)
  const unknownFallback =
    langCode === "gu"
      ? "માફ કરજો, મને આ બાબતે અત્યારે ચોક્કસ માહિતી ઉપલબ્ધ નથી. તમે તમારી દવા, દિનચર્યા કે અન્ય કોઈ વિષય વિશે પૂછી શકો છો."
      : langCode === "en"
      ? "I apologize, but I do not have verified information on that topic right now. Feel free to ask about your medicines, routines, or general questions."
      : "माफ़ कीजिए, मुझे इस विषय पर अभी पक्की जानकारी उपलब्ध नहीं है। आप मुझसे अपनी दवा, दिनचर्या, या किसी अन्य विषय के बारे में पूछ सकते हैं।";

  return {
    intent: "UNKNOWN",
    responseText: unknownFallback,
    detectedLocale,
    languageName: langConfig.name,
  };
}
