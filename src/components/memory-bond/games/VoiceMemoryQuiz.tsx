import { useState, useMemo, useRef, useEffect } from "react";
import { Volume2, VolumeX, Sparkles, RotateCcw, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import { useI18n } from "@/lib/i18n";

interface VoiceQuizItem {
  promptAudioText: string;
  question: string;
  options: string[];
  correct: number;
}

const GUJARATI_VOICE_QUIZ_ITEMS: VoiceQuizItem[] = [
  {
    promptAudioText: "દાદાજી, સવારના નાસ્તા પછી આદુવાળી ચા અને બીપીની દવા લેવાનું ભૂલતા નહીં!",
    question: "વોઈસ નોટમાં સવારની કઈ બે વસ્તુઓ યાદ કરાવી હતી?",
    options: ["આદુવાળી ચા અને બીપીની દવા", "ઠંડુ દૂધ અને બિસ્કિટ", "ફળનો રસ અને વિટામિન", "કોફી અને આઈસ્ક્રીમ"],
    correct: 0,
  },
  {
    promptAudioText: "કાલે સાંજે નવરાત્રીનો ગરબા કાર્યક્રમ સોસાયટીના ગ્રાઉન્ડમાં સાત વાગ્યે શરૂ થશે.",
    question: "નવરાત્રી ગરબા કાર્યક્રમ કયા સમયે શરૂ થશે?",
    options: ["સાંજે સાત વાગ્યે", "બપોરે બે વાગ્યે", "સવારે નવ વાગ્યે", "રાત્રે અગિયાર વાગ્યે"],
    correct: 0,
  },
  {
    promptAudioText: "સુનીતાએ યાદ કરાવ્યું છે કે બપોરે ગરમ ખમણ અને છાશ સાથે શાંતિથી ભોજન કરજો.",
    question: "બપોરના ભોજનમાં સુનીતાએ કઈ વાનગી લેવા કહ્યું?",
    options: ["ગરમ ખમણ અને છાશ", "સમોસા અને પકોડા", "ચીઝ પીત્ઝા", "મીઠાઈ અને કેક"],
    correct: 0,
  },
  {
    promptAudioText: "ડૉક્ટર પંડ્યા સાથે તમારી તપાસ ગુરુવારે સવારે દસ વાગ્યે નક્કી થઈ છે.",
    question: "ડૉક્ટર પંડ્યા સાથે તપાસ ક્યારે છે?",
    options: ["ગુરુવારે સવારે ૧૦ વાગ્યે", "સોમવારે બપોરે ૨ વાગ્યે", "શનિવારે સાંજે", "રવિવારે સવારે"],
    correct: 0,
  },
  {
    promptAudioText: "બાલકનીમાં તુલસી ક્યારે સવારની કુમળી ધૂપ આવે તે પહેલાં પાણી સીંચવાનું યાદ રાખજો.",
    question: "બાલકનીમાં કયા છોડને પાણી આપવાનું કહ્યું છે?",
    options: ["પવિત્ર તુલસીનો છોડ", "ગુલાબનો છોડ", "મની પ્લાન્ટ", "પીપળાનું ઝાડ"],
    correct: 0,
  },
];

const HINDI_VOICE_QUIZ_ITEMS: VoiceQuizItem[] = [
  {
    promptAudioText: "बाउजी, नाश्ते के बाद गर्म अदरक की चाय और अपनी बीपी की गोली लेना न भूलें!",
    question: "वॉइस नोट में सुबह की कौन सी दो चीज़ें याद दिलाई गई थीं?",
    options: ["अदरक की चाय और बीपी की गोली", "ठंडा दूध और बिस्कुट", "सेब का रस और विटामिन", "कॉफी और आइसक्रीम"],
    correct: 0,
  },
  {
    promptAudioText: "दादाजी, आपकी बेटी सुनीता ने कहा है कि वह रविवार को आपके लिए ताज़ा खीर और मिठाई ला रही है!",
    question: "सुनीता रविवार को क्या ला रही है?",
    options: ["ताज़ा खीर और मिठाई", "बाज़ार से नए कपड़े", "लाइब्रेरी से किताबें", "बगीचे के औज़ार"],
    correct: 0,
  },
  {
    promptAudioText: "बालकनी में पवित्र तुलसी के पौधे में सुबह की धूप से पहले पानी डालना याद रखें।",
    question: "बालकनी में किस पौधे को पानी देने की याद दिलाई गई?",
    options: ["पवित्र तुलसी का पौधा", "गुलाब की झाड़ी", "मनी प्लांट", "रबर प्लांट"],
    correct: 0,
  },
  {
    promptAudioText: "डॉ. बरुआ के साथ आपका रूटीन चेकअप गुरुवार सुबह 10 बजे है।",
    question: "डॉक्टर के साथ चेकअप किस समय है?",
    options: ["गुरुवार सुबह 10 बजे", "सोमवार दोपहर 2 बजे", "शनिवार शाम", "शुक्रवार सुबह"],
    correct: 0,
  },
  {
    promptAudioText: "आरव शाम 5 बजे आपके साथ कैरम खेलने आ रहा है।",
    question: "पोता आरव शाम 5 बजे क्या करने आ रहा है?",
    options: ["कैरम खेलने", "क्रिकेट खेलने", "गृहकार्य करने", "वीडियो गेम खेलने"],
    correct: 0,
  },
];

const ALL_VOICE_QUIZ_ITEMS: VoiceQuizItem[] = [
  {
    promptAudioText: "Baba, don't forget to take your warm ginger tea and your blood pressure tablet after breakfast!",
    question: "In the voice note, what two morning items were mentioned?",
    options: ["Ginger tea & Blood pressure tablet", "Cold milk & Biscuit", "Apple juice & Multivitamin", "Coffee & Ice cream"],
    correct: 0,
  },
  {
    promptAudioText: "Dadaji, your daughter Sunita called to say she is bringing fresh homemade pitha and sweets for Bihu this Sunday!",
    question: "What is daughter Sunita bringing this Sunday?",
    options: ["Homemade pitha and sweets for Bihu", "New clothes from the market", "Books from the library", "Gardening tools"],
    correct: 0,
  },
  {
    promptAudioText: "Grandpa, don't forget to water the holy tulsi plant in the balcony before the sunshine gets too warm!",
    question: "Which plant in the balcony did the voice note remind to water?",
    options: ["Holy tulsi plant in the balcony", "Rose bush in the backyard", "Money plant near the television", "Fern in the kitchen"],
    correct: 0,
  },
  {
    promptAudioText: "Maaji, Dr. Barua confirmed your routine health checkup is on Thursday morning at 10 AM.",
    question: "When is the scheduled consultation with Dr. Barua?",
    options: ["Thursday at 10 AM", "Monday at 2 PM", "Saturday evening", "Friday morning"],
    correct: 0,
  },
  {
    promptAudioText: "Aarav is coming over at 5 PM to practice his Bihu dance steps with you in the living room.",
    question: "What activity is grandson Aarav practicing with you at 5 PM?",
    options: ["Bihu dance steps", "Cricket batting", "Math homework", "Playing video games"],
    correct: 0,
  },
  {
    promptAudioText: "Please remind Sunita to buy organic Assam tea leaves and mustard oil from the market.",
    question: "Which two grocery items should be purchased from the market?",
    options: ["Assam tea leaves & mustard oil", "Rice & wheat flour", "Spices & sweets", "Apples & bananas"],
    correct: 0,
  },
  {
    promptAudioText: "This evening at 6:30, the community radio will broadcast traditional Assamese folk songs.",
    question: "What program will be on the radio at 6:30 PM?",
    options: ["Traditional Assamese folk songs", "Evening political news", "Weather update", "Cricket match commentary"],
    correct: 0,
  },
  {
    promptAudioText: "Rajesh called from Bengaluru to say he will video call you this Saturday at 7 PM after dinner.",
    question: "At what time is son Rajesh calling on Saturday?",
    options: ["Saturday at 7 PM", "Sunday morning", "Monday afternoon", "Friday night"],
    correct: 0,
  },
  {
    promptAudioText: "Your neighbor Mrs. Kalita brought fresh garden mint leaves and lemons for your afternoon digestive drink.",
    question: "What garden items did Mrs. Kalita bring for you?",
    options: ["Fresh mint leaves & lemons", "Heavy spices", "Packaged chips", "Flowers only"],
    correct: 0,
  },
  {
    promptAudioText: "The colony pharmacy called to confirm that your Amlodipine blood pressure refill will be delivered at 11 AM tomorrow.",
    question: "What is arriving from the pharmacy at 11 AM tomorrow?",
    options: ["Blood pressure medicine refill", "Eyeglasses", "New clothes", "Newspaper"],
    correct: 0,
  },
  {
    promptAudioText: "The weather announcement noted pleasant breezes and mild sunshine throughout the morning.",
    question: "What kind of weather is expected for the morning?",
    options: ["Pleasant breezes and mild sunshine", "Heavy snowfall", "Blazing heat wave", "Dust storm"],
    correct: 0,
  },
  {
    promptAudioText: "Sunita reminded you to take a glass of lukewarm water before your peaceful afternoon rest.",
    question: "What healthy habit did Sunita suggest before afternoon rest?",
    options: ["Drinking a glass of lukewarm water", "Drinking strong coffee", "Eating heavy sweets", "Skipping water"],
    correct: 0,
  },
  {
    promptAudioText: "Granddaughter Ananya is performing a peaceful classical sitar piece at the school music hall on Friday at 4 PM.",
    question: "What musical instrument is Ananya playing on Friday?",
    options: ["Classical sitar", "Electric guitar", "Heavy drums", "Trumpet"],
    correct: 0,
  },
  {
    promptAudioText: "Your routine fasting blood test at Apollo Clinic is scheduled for Monday morning at 8:00 AM.",
    question: "When is the scheduled morning fasting blood test?",
    options: ["Monday morning at 8:00 AM", "Wednesday afternoon", "Saturday evening", "Sunday night"],
    correct: 0,
  },
  {
    promptAudioText: "The neighborhood community temple has an evening bhajan chanting session at 5:30 PM today.",
    question: "What evening spiritual event takes place at 5:30 PM?",
    options: ["Community bhajan chanting session", "Soccer match", "Movie screening", "Shopping market"],
    correct: 0,
  },
  {
    promptAudioText: "The postman delivered a heartfelt handwritten postcard from your childhood friend Deepali Bora in Tezpur.",
    question: "Who sent the handwritten postcard from Tezpur?",
    options: ["Childhood friend Deepali Bora", "Tax officer", "Unknown stranger", "Store clerk"],
    correct: 0,
  },
  {
    promptAudioText: "Dr. Barua suggested wearing anti-skid cotton slippers inside the house to keep your steps steady and safe.",
    question: "What footwear did the doctor recommend for safety at home?",
    options: ["Anti-skid slippers with firm grip", "High heels", "Slippery socks", "Heavy boots"],
    correct: 0,
  },
  {
    promptAudioText: "Sunita placed your silver anniversary photo album on the middle shelf of the living room bookcase.",
    question: "Where is the cherished anniversary album kept?",
    options: ["Middle shelf of the living room bookcase", "Under the floorboards", "Outside in the garden", "In the dark attic"],
    correct: 0,
  },
  {
    promptAudioText: "Before bed tonight at 9:30, remember to enjoy a cup of warm chamomile tea and take your night Donepezil tablet.",
    question: "What two night items were mentioned before sleep?",
    options: ["Warm chamomile tea & night tablet", "Cold soda & spicy chips", "Heavy dinner only", "Coffee & ice cream"],
    correct: 0,
  },
  {
    promptAudioText: "Your brother Vikram sent a wooden box containing organic orthodox green tea leaves from his garden in Jorhat.",
    question: "What gift did brother Vikram send from Jorhat?",
    options: ["Organic green tea leaves", "Old books", "Tools", "Shoes"],
    correct: 0,
  },
  {
    promptAudioText: "Grandson Aarav won first prize at school for his watercolor painting of a sunrise over the tea gardens!",
    question: "What won first prize in Aarav's school art competition?",
    options: ["Watercolor painting of tea garden sunrise", "Paper airplane", "Math test", "Clay pot"],
    correct: 0,
  },
  {
    promptAudioText: "Cousin Manoj invited you and Sunita to visit his organic litchi orchard during next month's holiday.",
    question: "Where did cousin Manoj invite you to visit?",
    options: ["Organic litchi orchard", "Busy airport", "Crowded cinema", "Office building"],
    correct: 0,
  },
  {
    promptAudioText: "The evening sandhya aarti lamp in the sacred veranda should be lit at 6:00 PM as the sun sets.",
    question: "At what time should the evening brass lamp be lit?",
    options: ["6:00 PM at sunset", "Noon at 12 PM", "Midnight", "3 AM"],
    correct: 0,
  },
  {
    promptAudioText: "After tonight's light dinner, take a relaxing 15-minute indoor stroll to help smooth digestion.",
    question: "What activity is recommended after dinner for digestion?",
    options: ["A relaxing 15-minute indoor stroll", "Running sprint", "Heavy weightlifting", "Loud shouting"],
    correct: 0,
  },
  {
    promptAudioText: "Sunita checked the calendar and noted that the family Bihu feast will be celebrated at home this Sunday afternoon.",
    question: "When will the family Bihu feast take place?",
    options: ["This Sunday afternoon", "Next year", "Last month", "On Tuesday night"],
    correct: 0,
  },
  {
    promptAudioText: "The morning delivery brought the Assam Tribune newspaper with the daily memory crossword puzzle.",
    question: "What newspaper arrived with the daily crossword?",
    options: ["Assam Tribune newspaper", "Magazine only", "Comic book", "Flyer"],
    correct: 0,
  },
  {
    promptAudioText: "The radio announcer announced a half-hour program of calming bamboo flute music starting at 2 PM.",
    question: "What soothing music starts on the radio at 2 PM?",
    options: ["Calming bamboo flute music", "Rock concert", "Marching band", "Sports talk"],
    correct: 0,
  },
  {
    promptAudioText: "Remember that the spare gate key is safely placed in the carved wooden box beside your reading lamp.",
    question: "Where is the spare gate key kept?",
    options: ["Carved wooden box beside the reading lamp", "In the kitchen sink", "Outside on the street", "Lost in the grass"],
    correct: 0,
  },
  {
    promptAudioText: "All four generations of the Sharma family will gather for the grand Golden Reunion dinner this coming weekend!",
    question: "What major family milestone is being celebrated this weekend?",
    options: ["Grand Golden Family Reunion dinner", "Sports tournament", "Office conference", "Solo trip"],
    correct: 0,
  },
  {
    promptAudioText: "Nurse Kavita checked your morning pulse and noted your heart rate was a calm, steady 72 beats per minute.",
    question: "What was your steady resting heart rate recorded by Nurse Kavita?",
    options: ["72 beats per minute", "150 beats per minute", "40 beats per minute", "Unknown pulse"],
    correct: 0,
  },
  {
    promptAudioText: "The morning sunshine on the veranda is ideal for enjoying your warm cup of ginger tulsi tea before 8:30 AM.",
    question: "What morning beverage is recommended on the sunny veranda before 8:30 AM?",
    options: ["Ginger tulsi tea", "Iced soda", "Bitter gourd juice only", "Cold water with ice"],
    correct: 0,
  },
  {
    promptAudioText: "Grandson Aarav asked if you can teach him how to play the traditional Assamese bamboo flute this Sunday afternoon.",
    question: "Which traditional musical instrument did Aarav ask you to teach him?",
    options: ["Traditional bamboo flute", "Electric keyboard", "Drums", "Violin"],
    correct: 0,
  },
  {
    promptAudioText: "Pharmacist Alok delivered your fresh month's supply of Donepezil memory tablets in the child-safe green container.",
    question: "In what color container did the memory medicine arrive?",
    options: ["Child-safe green container", "Clear glass bottle", "Black metal box", "Paper bag"],
    correct: 0,
  },
  {
    promptAudioText: "Daughter Sunita placed your reading spectacles on top of the holy Bhagavad Gita on your wooden study table.",
    question: "Where are your reading spectacles safely resting?",
    options: ["On top of the holy Bhagavad Gita on the study table", "Under the bed", "In the bathroom", "On the kitchen stove"],
    correct: 0,
  },
];

export function VoiceMemoryQuiz({
  onComplete,
  level = 1,
  memoryCues = [],
  cycleNumber = 1,
  cycleSeed = 0,
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  memoryCues?: any[];
  cycleNumber?: number;
  cycleSeed?: number;
}) {
  const { lang, speechLocale } = useI18n();
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const isSubmittingRef = useRef<boolean>(false);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Synthesize personal memory bank quiz items if available
  const personalQuizItems: VoiceQuizItem[] = (memoryCues || [])
    .filter((c) => c.detail && (c.category === "voice_memory" || c.category === "family_member" || c.category === "child" || c.category === "story"))
    .map((c) => ({
      promptAudioText: `Here is a note from your personal memory bank: ${c.title}. ${c.detail}`,
      question: `According to this personal note, what is the detail regarding ${c.title}?`,
      options: [
        c.detail.slice(0, 50),
        "Routine grocery shopping",
        "A distant relative from another city",
        "A forgotten schedule",
      ],
      correct: 0,
    }));

  const basePool =
    lang === "gu"
      ? GUJARATI_VOICE_QUIZ_ITEMS
      : lang === "hi"
      ? HINDI_VOICE_QUIZ_ITEMS
      : ALL_VOICE_QUIZ_ITEMS;
  const allItemsPool = [...personalQuizItems, ...basePool];

  // Pick 2 tailored items per level, permuted by 8-Day Cycle
  const activeItems = useMemo(() => {
    const cycleOffset = (cycleNumber - 1) * 5;
    const baseIdx = ((level - 1) * 2 + cycleOffset) % allItemsPool.length;
    const rawItems = [
      allItemsPool[baseIdx] || allItemsPool[0],
      allItemsPool[(baseIdx + 1) % allItemsPool.length] || allItemsPool[1],
    ];

    // Shuffle options deterministically so option 0 is not predictable
    return rawItems.map((item, itemIdx) => {
      const correctText = item.options[item.correct];
      const shift = ((level * 3) + (itemIdx * 7) + (cycleNumber * 2)) % item.options.length;
      const shuffledOptions = [...item.options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = (i + shift) % (i + 1);
        const temp = shuffledOptions[i];
        shuffledOptions[i] = shuffledOptions[j];
        shuffledOptions[j] = temp;
      }
      const newCorrectIdx = shuffledOptions.indexOf(correctText);
      return {
        ...item,
        options: shuffledOptions,
        correct: newCorrectIdx >= 0 ? newCorrectIdx : 0,
      };
    });
  }, [level, cycleNumber, allItemsPool.length]);

  const current = activeItems[currentIdx];

  if (!current) return null;

  const handlePlayVoice = () => {
    setIsPlaying(true);
    setHasPlayedAudio(true);
    speakText(current.promptAudioText, speechLocale, () => {
      setIsPlaying(false);
    });
  };

  const handleNext = () => {
    if (selectedOpt === null || isSubmittingRef.current) return;
    stopSpeaking();
    setIsPlaying(false);

    const isCorrect = selectedOpt === current.correct;
    const nextScore = score + (isCorrect ? 1 : 0);
    if (isCorrect) {
      setScore(nextScore);
    } else {
      setMistakes((m) => m + 1);
    }

    setSelectedOpt(null);
    if (currentIdx + 1 < activeItems.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      isSubmittingRef.current = true;
      const elapsedMs = Math.max(1500, Date.now() - startTimeRef.current);
      const calculatedAcc = Math.round((nextScore / activeItems.length) * 100);
      setIsFinished(true);
      onComplete(nextScore, activeItems.length, {
        gameType: "recall",
        accuracy: calculatedAcc,
        responseTimeMs: elapsedMs,
        attempts: activeItems.length + mistakes,
        errors: mistakes + (isCorrect ? 0 : 1),
      });
    }
  };

  const titleText =
    lang === "gu" ? "રમત ૭: અવાજ સ્મરણ ક્વિઝ" :
    lang === "hi" ? "खेल 7: स्वर स्मरण प्रश्नोत्तरी" :
    lang === "bn" ? "খেলা ৭: ভয়েস মেমরি কুইজ" :
    lang === "mr" ? "खेळ ७: ध्वनी स्मरण क्विझ" :
    lang === "as" ? "খেল ৭: কণ্ঠস্বৰ স্মৃতি কুইজ" :
    "Game 7: Voice Memory Quiz";

  const subtitleText =
    lang === "gu" ? "ધ્યાનપૂર્વક અવાજ સાંભળો અને પછી સાચો જવાબ આપો." :
    lang === "hi" ? "ध्यानपूर्वक आवाज़ सुनें और फिर प्रश्न का उत्तर दें।" :
    lang === "bn" ? "মনোযোগ সহকারে ভয়েস শুনুন এবং প্রশ্নের উত্তর দিন।" :
    lang === "mr" ? "काळजीपूर्वक आवाज ऐका आणि प्रश्नाचे उत्तर द्या." :
    lang === "as" ? "মনোযোগেৰে কণ্ঠস্বৰ শুনক আৰু প্ৰশ্নৰ উত্তৰ দিয়ক।" :
    "Listen carefully to the voice cue, then answer the question.";

  const nextBtnText =
    currentIdx + 1 === activeItems.length
      ? (lang === "gu" ? "ક્વિઝ પૂર્ણ કરો" : lang === "hi" ? "क्विज़ समाप्त करें" : lang === "bn" ? "কুইজ শেষ করুন" : "Finish Quiz")
      : (lang === "gu" ? "આગળનો સંકેત" : lang === "hi" ? "अगला संकेत" : lang === "bn" ? "পরবর্তী সংকেত" : "Next Voice Cue");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">{titleText}</h3>
          <p className="text-sm text-muted-foreground">{subtitleText}</p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
          {lang === "gu" ? "ક્વિઝ" : lang === "hi" ? "प्रश्नोत्तरी" : lang === "bn" ? "কুইজ" : "Quiz"} {currentIdx + 1} / {activeItems.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <Volume2 className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">
            {lang === "gu" ? "શ્રવણ સ્મરણ પૂર્ણ!" : lang === "hi" ? "सक्रिय श्रवण पूर्ण!" : lang === "bn" ? "শ্রবণ স্মরণ সম্পন্ন!" : "Active listening complete!"}
          </h4>
          <p className="text-lg text-muted-foreground">
            {lang === "gu"
              ? `તમે ${activeItems.length} માંથી ${score} સાચા જવાબો આપ્યા.`
              : lang === "hi"
              ? `आपने ${activeItems.length} में से ${score} सही उत्तर दिए।`
              : lang === "bn"
              ? `আপনি ${activeItems.length}টির মধ্যে ${score}টি সঠিক উত্তর দিয়েছেন।`
              : `You scored ${score} of ${activeItems.length} in audio recall.`}
          </p>
          <Button
            size="lg"
            onClick={() => {
              isSubmittingRef.current = false;
              setCurrentIdx(0);
              setSelectedOpt(null);
              setScore(0);
              setIsFinished(false);
              startTimeRef.current = Date.now();
            }}
            className="gap-2 font-bold px-8"
          >
            <RotateCcw className="h-5 w-5" /> {lang === "gu" ? "ફરી સાંભળો" : lang === "hi" ? "पुनः सुनें" : lang === "bn" ? "আবার শুনুন" : "Listen Again"}
          </Button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 text-center space-y-6 shadow-sm">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                {lang === "gu" ? "અવાજ સાંભળવા માટે ટેપ કરો" : lang === "hi" ? "आवाज़ सुनने के लिए टैप करें" : lang === "bn" ? "ভয়েস শুনতে ট্যাপ করুন" : "Tap to hear voice note"}
              </p>
              <Button
                size="lg"
                onClick={handlePlayVoice}
                className="gap-3 font-bold px-8 py-6 text-lg rounded-2xl cursor-pointer"
              >
                {isPlaying ? <Sparkles className="h-6 w-6 animate-spin" /> : <Volume2 className="h-6 w-6" />}
                {isPlaying
                  ? (lang === "gu" ? "બોલાઈ રહ્યું છે..." : lang === "hi" ? "आवाज़ बज रही है..." : lang === "bn" ? "কথা বলছে..." : "Speaking...")
                  : (lang === "gu" ? "અવાજ રેકોર્ડિંગ સાંભળો" : lang === "hi" ? "वॉइस रिकॉर्डिंग सुनें" : lang === "bn" ? "ভয়েস রেকর্ড শুনুন" : "Play Voice Recording")}
              </Button>
              <p className="text-xs text-muted-foreground italic">
                {lang === "gu" ? "(સ્પષ્ટ અવાજમાં સંદેશ)" : lang === "hi" ? "(स्पष्ट स्वर में संदेश)" : lang === "bn" ? "(স্পষ্ট কণ্ঠে বার্তা)" : "(Clear family voice message audio)"}
              </p>
            </div>

            <h4 className="text-2xl font-bold text-foreground">{current.question}</h4>

            <div className="space-y-3">
              {current.options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOpt(idx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 font-medium transition-all text-base cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/30 hover:bg-secondary/60 border-border text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="lg" disabled={selectedOpt === null} onClick={handleNext} className="px-8 font-bold cursor-pointer">
              {nextBtnText}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
