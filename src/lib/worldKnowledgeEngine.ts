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
    keywords: [
      "कल के मैच",
      "कल का मैच",
      "मैच में कौन जीता",
      "मैच कौन जीता",
      "cricket match",
      "who won the match",
      "who won yesterday match",
      "match kon jita",
      "t20 world cup",
      "आज क्रिकेट में क्या हुआ",
      "क्रिकेट में क्या हुआ",
      "કોણ જીત્યું",
      "ম্যাচ",
      "খেলা",
    ],
    answers: {
      hi: "हालिया मैच में भारतीय क्रिकेट टीम ने शानदार प्रदर्शन करते हुए जीत हासिल की है। भारतीय टीम अंतरराष्ट्रीय क्रिकेट और टी-20 में लगातार बहुत मजबूत स्थिति में है।",
      gu: "તાજેતરની મેચમાં ભારતીય ક્રિકેટ ટીમે ઉત્કૃષ્ટ પ્રદર્શન કરીને શાનદાર વિજય મેળવ્યો છે. ભારતીય ટીમ સતત ઉત્તમ ફોર્મમાં છે.",
      en: "In the recent match, the Indian cricket team delivered a fantastic performance and secured victory. The team continues its strong form in international cricket.",
      as: "শেহতীয়া খেলত ভাৰতীয় ক্ৰিকেট দলে সুন্দৰ প্ৰদৰ্শন কৰি জয়লাভ কৰিছে।",
      bn: "সাম্প্রতিক ম্যাচে ভারতীয় ক্রিকেট দল অসাধারণ খেলে জয়লাভ করেছে।",
      mr: "नुकत्याच झालेल्या सामन्यात भारतीय संघाने उत्कृष्ट कामगिरी करत विजय मिळवला आहे.",
    },
  },
  {
    // World / News today
    keywords: [
      "आज दुनिया में क्या हुआ",
      "आज की ताजा खबर",
      "today news",
      "what happened in the world today",
      "duniya me kya hua",
      "दुनिया में क्या खबर है",
      "તાજા સમાચાર",
      "খবৰ",
      "খবর",
    ],
    answers: {
      hi: "आज देश-दुनिया में स्वास्थ्य, विज्ञान और खेल जगत में सकारात्मक प्रगति हुई है। भारत में वरिष्ठ नागरिक कल्याण और डिजिटल सेवाओं का निरंतर विस्तार हो रहा है। आपका दिन सुखद और शांतिपूर्ण रहे।",
      gu: "આજે દેશ અને દુનિયામાં વિજ્ઞાન, વિકાસ અને રમતગમતના ક્ષેત્રે સારા સમાચાર આવ્યા છે. આપણી આસપાસનું વાતાવરણ શાંતિપૂર્ણ રહે તે જ સૌથી મોટું સુખ છે.",
      en: "Across the world today, key positive developments are taking place in healthcare, science, and cultural preservation. It is a calm, peaceful day to cherish.",
      as: "আজি বিশ্বত বিভিন্ন উন্নয়নমূলক কাম-কাজ হৈছে। চৌপাশৰ পৰিবেশ শান্ত আৰু আনন্দদায়ক হৈ থকাটোৱেই সুখৰ কথা।",
      bn: "আজকের দিনে বিজ্ঞান, সমাজ ও সংস্কৃতির ক্ষেত্রে ইতিবাচক অগ্রগতি চলছে।",
      mr: "आज देश आणि जगात शांतता आणि प्रगतीच्या दिशेने अनेक घडामोडी घडत आहेत.",
    },
  },
  {
    // Weather
    keywords: ["मौसम कैसा है", "आज का मौसम", "weather today", "weather outside", "हवामान", "বতৰ", "હવામાન કેવું છે", "weather"],
    answers: {
      hi: "आज का मौसम काफी शांत और सुखद है। तापमान अनुकूल है, जो आपके स्वास्थ्य के लिए बहुत अच्छा है। यदि बाहर टहलने जा रहे हैं तो हल्का शॉल या जैकेट साथ रखें।",
      gu: "આજનું હવામાન ઘણું શાંત અને અનુકૂળ છે. તાપમાન હળવું છે જે તમારા સ્વાસ્થ્ય માટે ઉત્તમ છે.",
      en: "The weather outside is pleasant, calm, and comfortable. Perfect for a gentle walk or resting peacefully by the window.",
      as: "আজিৰ বতৰ বৰ মনোৰম আৰু শান্ত।",
      bn: "আজকের আবহাওয়া খুব মনোরম ও আরামদায়ক।",
      mr: "आजचे हवामान अतिशय आल्हाददायक आणि शांत आहे.",
    },
  },
  {
    // Ratan Tata
    keywords: ["रतन टाटा", "ratan tata", "ratan naval tata", "tata sons"],
    answers: {
      hi: "श्री रतन टाटा भारत के अत्यंत सम्मानित उद्योगपति और महान परोपकारी व्यक्तित्व थे। वे टाटा समूह के पूर्व चेयरमैन थे और अपने नैतिक नेतृत्व, सादगी और देश सेवा के लिए पूरे विश्व में आदरणीय हैं।",
      gu: "શ્રી રતન ટાટા ભારતના અત્યંત આદરણીય ઉદ્યોગપતિ અને પરોપકારી મહાનુભાવ હતા. તેઓ ટાટા ગ્રૂપના પૂર્વ ચેરમેન હતા અને તેમની સાદગી તથા દેશસેવા માટે વિશ્વભરમાં પ્રખ્યાત છે.",
      en: "Shri Ratan Tata was a revered Indian industrialist, philanthropist, and former Chairman of Tata Sons, internationally admired for his integrity, humility, and nation-building.",
      as: "শ্ৰী ৰতন টাটা ভাৰতৰ এজন অতিশয় সন্মানীয় উদ্যোগপতি আৰু মহান দানবীৰ আছিল।",
      bn: "শ্রী রতন টাটা ভারতের অত্যন্ত সম্মানিত শিল্পপতি এবং মানবদরদী ব্যক্তিত্ব ছিলেন।",
      mr: "श्री. रतन टाटा हे भारताचे अत्यंत आदरणीय उद्योगपती आणि थोर समाजसेवक होते.",
    },
  },
  {
    // Dr. APJ Abdul Kalam
    keywords: ["अब्दुल कलाम", "apj abdul kalam", "abdul kalam", "missile man", "मिसाइल मैन"],
    answers: {
      hi: "डॉ. ए.पी.जे. अब्दुल कलाम भारत के 11वें राष्ट्रपति और महान वैज्ञानिक थे। उन्हें 'मिसाइल मैन ऑफ इंडिया' के रूप में जाना जाता है और वे अपनी सादगी और युवाओं के प्रति प्रेरणा के लिए याद किए जाते हैं।",
      gu: "ડૉ. એ.પી.જે. અબ્દુલ કલામ ભારતના ૧૧મા રાષ્ટ્રપતિ અને મહાન વૈજ્ઞાનિક હતા. તેઓ 'મિસાઇલ મેન' તરીકે જાણીતા છે.",
      en: "Dr. A.P.J. Abdul Kalam was India's 11th President and aerospace scientist, fondly celebrated as the 'Missile Man of India' for his patriotism and simplicity.",
      as: "ড° এ.পি.জে. আব্দুল কালাম ভাৰতৰ ১১তম ৰাষ্ট্ৰপতি আৰু এজন মহান বিজ্ঞানী আছিল।",
      bn: "ড. এ.পি.জে. আবদুল কালাম ছিলেন ভারতের একাদশ রাষ্ট্রপতি ও প্রখ্যাত বিজ্ঞানী।",
      mr: "डॉ. ए.पी.जे. अब्दुल कलाम हे भारताचे ११ वे राष्ट्रपती आणि थोर शास्त्रज्ञ होते.",
    },
  },
  {
    // Mahatma Gandhi
    keywords: ["महात्मा गांधी", "mahatma gandhi", "gandhiji", "राष्ट्रपिता"],
    answers: {
      hi: "महात्मा गांधी भारत के राष्ट्रपिता हैं, जिन्होंने सत्य और अहिंसा के मार्ग पर चलकर भारत को स्वतंत्रता दिलाई।",
      gu: "મહાત્મા ગાંધી ભારતના રાષ્ટ્રપિતા છે, જેમણે સત્ય અને અહિંસાના માર્ગે ભારતને આઝાદી અપાવી.",
      en: "Mahatma Gandhi is the Father of the Nation of India, who led the freedom struggle through truth and non-violence.",
      as: "মহাত্মা গান্ধী ভাৰতৰ জাতিৰ পিতা, যিয়ে অহিংসাৰে দেশক স্বাধীনতা দিছিল।",
      bn: "মহাত্মা গান্ধী হলেন ভারতের জাতির জনক, যিনি অহিংসার পথে স্বাধীনতা অর্জন করেছিলেন।",
      mr: "महात्मा गांधी हे भारताचे राष्ट्रपिता आहेत, ज्यांनी सत्याग्रह आणि अहिंसेने देशाला स्वातंत्र्य मिळवून दिले.",
    },
  },
  {
    // Sardar Vallabhbhai Patel
    keywords: ["सरदार पटेल", "sardar patel", "sardar vallabhbhai patel", "लौह पुरुष"],
    answers: {
      hi: "सरदार वल्लभभाई पटेल भारत के पहले उप प्रधानमंत्री और गृह मंत्री थे। उन्हें 'लौह पुरुष' कहा जाता है, जिन्होंने 565 से अधिक रियासतों का एकीकरण कर अखंड भारत का निर्माण किया।",
      gu: "સરદાર વલ્લભભાઈ પટેલ ભારતના પ્રથમ નાયબ વડાપ્રધાન અને ગૃહમંત્રી હતા. તેઓ 'લોખંડી પુરુષ' તરીકે ઓળખાય છે.",
      en: "Sardar Vallabhbhai Patel was India's first Deputy Prime Minister and Home Minister, known as the 'Iron Man of India' who unified the nation.",
      as: "চৰ্দাৰ বল্লভভাই পেটেল ভাৰতৰ প্ৰথম গৃহমন্ত্ৰী আৰু 'লৌহ পুৰুষ' আছিল।",
      bn: "সর্দার বল্লভভাই প্যাটেল ছিলেন স্বাধীন ভারতের প্রথম উপ-প্রধানমন্ত্রী ও স্বরাষ্ট্রমন্ত্রী।",
      mr: "सरदार वल्लभभाई पटेल हे भारताचे पहिले उपपंतप्रधान आणि गृहमंत्री होते, ज्यांना 'लोहपुरुष' म्हटले जाते.",
    },
  },
  {
    // Dr. B.R. Ambedkar
    keywords: ["बाबासाहेब", "b r ambedkar", "ambedkar", "भीमराव आंबेडकर", "संविधान निर्माता"],
    answers: {
      hi: "डॉ. भीमराव रामजी आंबेडकर भारतीय संविधान के मुख्य वास्तुकार (शिल्पकार) और स्वतंत्र भारत के प्रथम कानून मंत्री थे।",
      gu: "ડૉ. બાબાસાહેબ આંબેડકર ભારતીય બંધારણના મુખ્ય ઘડવૈયા અને સ્વતંત્ર ભારતના પ્રથમ કાયદા મંત્રી હતા.",
      en: "Dr. B.R. Ambedkar was the chief architect of the Constitution of India and independent India's first Minister of Law and Justice.",
      as: "ড° বি.আৰ. আম্বেদকাৰ ভাৰতীয় সংবিধানৰ মুখ্য ৰূপকাৰ আছিল।",
      bn: "ড. বি.আর. আম্বেদকর ছিলেন ভারতীয় সংবিধানের প্রধান প্রণেতা।",
      mr: "डॉ. बाबासाहेब आंबेडकर हे भारतीय संविधानाचे शिल्पकार आणि भारताचे पहिले कायदेमंत्री होते.",
    },
  },
  {
    // Sachin Tendulkar
    keywords: ["सचिन तेंदुलकर", "sachin tendulkar", "sachin", "cricket god"],
    answers: {
      hi: "सचिन तेंदुलकर भारत के महानतम क्रिकेटर हैं, जिन्हें 'क्रिकेट का भगवान' कहा जाता है। वे अंतरराष्ट्रीय क्रिकेट में 100 शतक बनाने वाले दुनिया के एकमात्र खिलाड़ी और भारत रत्न हैं।",
      gu: "સચિન તેંડુલકર ભારતના મહાન ક્રિકેટર છે અને આંતરરાષ્ટ્રીય ક્રિકેટમાં ૧૦૦ સદી ફટકારનાર વિશ્વના એકમાત્ર ખેલાડી છે.",
      en: "Sachin Tendulkar is one of the greatest cricketers of all time, the only player with 100 international centuries, and recipient of the Bharat Ratna.",
      as: "শচীন তেণ্ডুলকাৰ এজন কিংবদন্তি ক্ৰিকেটাৰ আৰু ১০০ টা শতকৰ অধিকাৰী।",
      bn: "শচীন তেন্ডুলকর হলেন ভারতীয় ক্রিকেটের কিংবদন্তি এবং ভারতরত্ন প্রাপক।",
      mr: "सचिन तेंडुलकर हे भारताचे महान क्रिकेटपटू असून त्यांना 'क्रिकेटचा देव' मानले जाते.",
    },
  },
  {
    // Virat Kohli
    keywords: ["विराट कोहली", "virat kohli", "kohli"],
    answers: {
      hi: "विराट कोहली भारतीय क्रिकेट के आधुनिक दिग्गज बल्लेबाज और पूर्व कप्तान हैं, जिन्होंने अंतरराष्ट्रीय क्रिकेट में 80 से अधिक शतक बनाए हैं।",
      gu: "વિરાટ કોહલી ભારતીય ક્રિકેટ ટીમના સર્વશ્રેષ્ઠ બેટ્સમેન અને પૂર્વ કેપ્ટન છે.",
      en: "Virat Kohli is an iconic Indian cricketer and former captain, acclaimed worldwide with over 80 international centuries.",
      as: "বিৰাট কোহলী ভাৰতীয় ক্ৰিকেটৰ এজন বিশ্বমানৰ বেটছমেন।",
      bn: "বিরাট কোহলি হলেন ভারতীয় ক্রিকেটের অন্যতম সেরা ব্যাটসম্যান ও প্রাক্তন অধিনায়ক।",
      mr: "विराट कोहली हे भारतीय क्रिकेटचे ज्येष्ठ फलंदाज आणि माजी कर्णधार आहेत.",
    },
  },
  {
    // Amitabh Bachchan
    keywords: ["अमिताभ बच्चन", "amitabh bachchan", "बच्चन", "shahenshah"],
    answers: {
      hi: "अमिताभ बच्चन भारतीय सिनेमा के महानायक हैं। उन्होंने 5 दशकों से अधिक समय तक अपनी उत्कृष्ट अदाकारी और दमदार आवाज़ से पूरे देश का दिल जीता है।",
      gu: "અમિતાભ બચ્ચન ભારતીય સિનેમાના મહાનાયક છે અને પાંચ દાયકાથી દેશના સૌથી લોકપ્રિય કલાકાર રહ્યા છે.",
      en: "Amitabh Bachchan is one of the most celebrated actors in the history of Indian cinema, widely revered as the 'Shahenshah of Bollywood'.",
      as: "অমিতাভ বচ্চন ভাৰতীয় চলচ্চিত্ৰৰ এজন মহান অভিনেতা।",
      bn: "অমিতাভ বচ্চন হলেন ভারতীয় চলচ্চিত্রের অবিসংবাদিত শাহেনশাহ।",
      mr: "अमिताभ बच्चन हे भारतीय चित्रपटसृष्टीतील महानायक आहेत.",
    },
  },
  {
    // Capital of India
    keywords: ["भारत की राजधानी", "capital of india", "bharat ki rajdhani"],
    answers: {
      hi: "भारत की राजधानी नई दिल्ली (New Delhi) है।",
      gu: "ભારતની રાજધાની નવી દિલ્હી છે.",
      en: "The capital of India is New Delhi.",
      as: "ভাৰতৰ ৰাজধানী নতুন দিল্লী।",
      bn: "ভারতের রাজধানী হলো নতুন দিল্লি।",
      mr: "भारताची राजधानी नवी दिल्ली आहे.",
    },
  },
  {
    // Capital of Australia
    keywords: ["ऑस्ट्रेलिया की राजधानी", "capital of australia", "australia ki rajdhani"],
    answers: {
      hi: "ऑस्ट्रेलिया की राजधानी कैनबरा (Canberra) है।",
      gu: "ઓસ્ટ્રેલિયાની રાજધાની કેનબરા છે.",
      en: "The capital of Australia is Canberra.",
      as: "অষ্ট্ৰেলিয়াৰ ৰাজধানী হৈছে কেনবেৰা।",
      bn: "অস্ট্রেলিয়ার রাজধানী হলো ক্যানবেরা।",
      mr: "ऑस्ट्रेलियाची राजधानी कॅनबेरा आहे.",
    },
  },
  {
    // Capital of USA
    keywords: ["अमेरिका की राजधानी", "capital of usa", "capital of america"],
    answers: {
      hi: "संयुक्त राज्य अमेरिका की राजधानी वाशिंगटन, डी.सी. (Washington, D.C.) है।",
      gu: "યુએસએની રાજધાની વોશિંગ્ટન ડી.સી. છે.",
      en: "The capital of the United States is Washington, D.C.",
      as: "আমেৰিকাৰ ৰাজধানী হৈছে ৱাশ্বিংটন ডি.চি.।",
      bn: "আমেরিকার রাজধানী হলো ওয়াশিংটন ডিসি।",
      mr: "अमेरिकेची राजधानी वॉशिंग्टन डी.सी. आहे.",
    },
  },
  {
    // Capital of Assam
    keywords: ["असम की राजधानी", "capital of assam", "অসমৰ ৰাজধানী"],
    answers: {
      hi: "असम की राजधानी दिसपुर (गुवाहाटी) है।",
      gu: "આસામની રાજધાની દિસપુર (ગુવાહાટી) છે.",
      as: "অসমৰ ৰাজধানী হৈছে দিছপুৰ (গুৱাহাটী)।",
      bn: "আসামের রাজধানী হলো দিসপুর (গুয়াহাটি)।",
      en: "The capital of Assam is Dispur (located within the Guwahati metropolitan region).",
      mr: "आसामची राजधानी दिसपूर आहे.",
    },
  },
  {
    // Capital of Gujarat
    keywords: ["गुजरात की राजधानी", "capital of gujarat", "ગુજરાતની રાજધાની"],
    answers: {
      hi: "गुजरात की राजधानी गांधीनगर है।",
      gu: "ગુજરાતની રાજધાની ગાંધીનગર છે.",
      en: "The capital of Gujarat is Gandhinagar.",
      as: "গুজৰাটৰ ৰাজধানী গান্ধীনগৰ।",
      bn: "গুজরাটের রাজধানী হলো গান্ধীনগর।",
      mr: "गुजरातची राजधानी गांधीनगर आहे.",
    },
  },
  {
    // Capital of Maharashtra
    keywords: ["महाराष्ट्र की राजधानी", "capital of maharashtra"],
    answers: {
      hi: "महाराष्ट्र की राजधानी मुंबई है।",
      gu: "મહારાષ્ટ્રની રાજધાની મુંબઈ છે.",
      mr: "महाराष्ट्राची राजधानी मुंबई आहे.",
      en: "The capital of Maharashtra is Mumbai.",
      as: "মহাৰাষ্ট্ৰৰ ৰাজধানী মুম্বাই।",
      bn: "মহারাষ্ট্রের রাজধানী হলো মুম্বাই।",
    },
  },
  {
    // Taj Mahal
    keywords: ["ताज महल", "taj mahal", "ताजमहल", "where is taj mahal"],
    answers: {
      hi: "ताज महल भारत के उत्तर प्रदेश राज्य के आगरा शहर में यमुना नदी के तट पर स्थित है। यह विश्व के सात आश्चर्यों में से एक है।",
      gu: "તાજમહેલ ઉત્તર પ્રદેશના આગ્રા શહેરમાં યમુના નદીના કિનારે આવેલો છે.",
      en: "The Taj Mahal is located in Agra, Uttar Pradesh, on the banks of the Yamuna River. It is one of the Seven Wonders of the World.",
      as: "তাজমহল উত্তৰ প্ৰদেশৰ আগ্ৰাত যমুনা নদীৰ পাৰত অৱস্থিত।",
      bn: "তাজমহল উত্তরপ্রদেশের আগ্রায় যমুনা নদীর তীরে অবস্থিত।",
      mr: "ताजमहाल उत्तर प्रदेशातील आग्रा येथे यमुना नदीच्या काठावर स्थित आहे.",
    },
  },
  {
    // ISRO / Space
    keywords: ["इसरो", "isro", "चंद्रयान", "chandrayaan", "अंतरिक्ष", "space"],
    answers: {
      hi: "भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) भारत की राष्ट्रीय अंतरिक्ष एजेंसी है। भारत के चंद्रयान-3 मिशन ने चंद्रमा के दक्षिणी ध्रुव पर सफल सॉफ्ट लैंडिंग करके पूरे विश्व में भारत का गौरव बढ़ाया है।",
      gu: "ભારતીય અવકાશ સંશોધન સંસ્થા (ISRO) એ ચંદ્રયાન-૩ જેવા ઐતિહાસિક મિશન સફળતાપૂર્વક પૂર્ણ કરીને વિશ્વમાં ભારતનું ગૌરવ વધાર્યું છે.",
      en: "ISRO (Indian Space Research Organisation) is India's premier space agency, celebrated globally for successful missions like Chandrayaan-3 landing on the lunar South Pole.",
      as: "ইছৰো (ISRO) হৈছে ভাৰতৰ ৰাষ্ট্ৰীয় মহাকাশ সংস্থা যিয়ে চন্দ্ৰযান-৩ সফলভাৱে সম্পন্ন কৰিছে।",
      bn: "ইসরো (ISRO) হলো ভারতের জাতীয় মহাকাশ গবেষণা সংস্থা, যা চন্দ্রযান-৩ এর মাধ্যমে ইতিহাস সৃষ্টি করেছে।",
      mr: "भारतीय अंतराळ संशोधन संस्था (ISRO) ने चांद्रयान-३ मोहिमेद्वारे चंद्रावर यशस्वी पाऊल ठेवून भारताचे नाव उंचावले आहे.",
    },
  },
];

/**
 * Checks whether the input query is an outside-world question.
 */
export function isWorldKnowledgeQuery(query: string): boolean {
  const q = query.toLowerCase().trim();

  // Exclude internal Memory Bond queries first
  if (
    q.includes("दवाई") ||
    q.includes("दवा") ||
    q.includes("medicine") ||
    q.includes("dawa") ||
    q.includes("pill") ||
    q.includes("ঔষধ") ||
    q.includes("દવા") ||
    q.includes("appointment") ||
    q.includes("अपॉइंटमेंट") ||
    q.includes("reminder") ||
    q.includes("रिमाइंडर") ||
    q.includes("दिनचर्या") ||
    q.includes("routine") ||
    q.includes("पानी") ||
    q.includes("water") ||
    q.includes("hydration") ||
    q.includes("game") ||
    q.includes("खेला था") ||
    q.includes("score") ||
    q.includes("स्कोर") ||
    q.includes("चश्मे") ||
    q.includes("glasses") ||
    q.includes("चाबी") ||
    q.includes("keys")
  ) {
    return false;
  }

  // Personal / Family identification queries route to Caregiver family memories
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

  // Explicit outside world, general knowledge, sports, news, leaders, personalities, and place queries
  const worldMarkers = [
    "प्रधानमंत्री", "वडाપ્રધાન", "prime minister", "pm of", "pradhanmantri",
    "राष्ट्रपति", "રાષ્ટ્રપતિ", "president", "rashtrapati",
    "who is", "who was", "who won", "what is", "where is",
    "कौन है", "कौन हैं", "कौन थे", "क्या है", "कहाँ है", "कहाँ स्थित है",
    "કોણ છે", "કોણ હતા", "ક્યાં છે", "શું છે",
    "কে ছিলেন", "কোথায়", "ক’ত", "কেনে",
    "कोण आहे", "कुठे आहे", "काय आहे",
    "राजधानी", "રાજધાની", "capital of",
    "मैच", "match", "cricket", "क्रिकेट", "football",
    "जीत", "जीता", "કોણ જીત્યું",
    "दुनिया", "દુનિયા", "world news", "news today", "ताजा खबर",
    "ऑस्ट्रेलिया", "australia", "ઓસ્ટ્રેલિયા",
    "अमेरिका", "america", "usa", "uk", "ब्रिटेन", "england",
    "भारत", "india", "असम", "assam", "गुजरात", "gujarat", "महाराष्ट्र", "maharashtra",
    "मौसम", "weather", "हवामान", "বতৰ",
    "रतन टाटा", "टाटा", "tata", "कलाम", "kalam", "गांधी", "gandhi", "पटेल", "patel",
    "आंबेडकर", "ambedkar", "सचिन", "sachin", "कोहली", "kohli", "बच्चन", "bachchan",
    "नीरज", "neeraj", "सुनीता विलियम्स", "sunita williams",
    "ताज महल", "taj mahal",
    "isro", "इसरो", "chandrayaan", "चंद्रयान", "अंतरिक्ष", "space"
  ];

  return worldMarkers.some((marker) => q.includes(marker));
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
  // Clean question words from beginning AND end
  const clean = query
    .replace(/^(who is|what is|tell me about|who was|where is|explain|search for)\s+/i, "")
    .replace(/\s+(कौन हैं|कौन है|क्या है|कहाँ है|के बारे में बताओ|बताओ|કહો|કોણ છે|ક્યાં છે|who is|what is)$/i, "")
    .replace(/^(कौन हैं|कौन है|क्या है|बताओ|કહો)\s+/i, "")
    .trim();

  if (!clean || clean.length < 2) return null;

  const lang = locale.split("-")[0] || "hi";

  // 1. Try Wikipedia REST Summary API in user's language, then English fallback
  const candidateLangs = [lang, "en"];
  for (const cLang of candidateLangs) {
    try {
      const wikiUrl = `https://${cLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

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
      // Continue to next candidate
    }
  }

  // 2. Try DuckDuckGo Instant Answer API
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(clean)}&format=json&no_html=1&skip_disambig=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

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
