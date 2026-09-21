import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Gamepad2,
  ArrowLeft,
  Award,
  Sparkles,
  ShieldAlert,
  Layers,
  Search,
  Hash,
  Sun,
  Users,
  Volume2,
  Eye,
  BookOpen,
  Link as LinkIcon,
  TrendingUp,
  Brain,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Trophy,
  Star,
  Lock,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Compass,
  Check,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MemoryBondStore, getRecommendedDifficulty } from "@/lib/memoryBondStore";
import { useI18n, getMotivationalFeedback } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";
import { GameArtwork } from "./GameArtwork";

import { MemoryCardMatch } from "./MemoryCardMatch";
import { ObjectRecall } from "./ObjectRecall";
import { PatternRecall } from "./PatternRecall";
import { SequenceMemory } from "./SequenceMemory";
import { RoutineRecall } from "./RoutineRecall";
import { FamilyPhotoMemory } from "./FamilyPhotoMemory";
import { VoiceMemoryQuiz } from "./VoiceMemoryQuiz";
import { FindDifference } from "./FindDifference";
import { WordMemory } from "./WordMemory";
import { MatchTheObject } from "./MatchTheObject";
import { NERCulturalMemoryGame } from "./NERCulturalMemoryGame";
import { RealMemoryRecallGame } from "./RealMemoryRecallGame";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onCatch?: (err: any) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GameErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error("[COGNITIVE_GAME_ERROR]", error);
    this.props.onCatch?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface LastGameResult {
  score: number;
  total: number;
  accuracy: number;
  completedLevel: number;
  nextLevel: number;
  isAdvance: boolean;
  headline: string;
  spoken: string;
  nextRecommendation: string;
}

export function CognitiveGamesHub({
  store,
  onNavigate,
}: {
  store: MemoryBondStore;
  onNavigate?: (tab: string) => void;
}) {
  const { t, speechLocale, lang, gameStrings } = useI18n();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "challenging">("easy");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // In-game progression state
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [highestLevel, setHighestLevel] = useState<number>(1);
  const [bestScore, setBestScore] = useState<number>(0);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(1);
  const [gameStage, setGameStage] = useState<"playing" | "completed" | "error">("playing");
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [lastResult, setLastResult] = useState<LastGameResult | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showAiLoop, setShowAiLoop] = useState<boolean>(false);

  const [pendingGame, setPendingGame] = useState<string | null>(null);

  // Dynamic Difficulty Adaptation Engine from MemoryBondStore
  const adaptiveRecommendation = useMemo(() => {
    return getRecommendedDifficulty(activeGame || "", store.gameSessions, difficulty);
  }, [activeGame, store.gameSessions, difficulty]);

  const getLocalizedGame = useCallback((gameId: string) => {
    const isHi = lang === "hi";
    const isGu = lang === "gu";
    const isAs = lang === "as";

    const dict: Record<string, { title: string; summary: string; instruction: string }> = {
      pattern_recall: {
        title: isHi ? "पैटर्न मिलान" : isGu ? "પેટર્ન મેળવો" : isAs ? "প্যাটাৰ্ন মিলোৱা" : "Pattern Match",
        summary: isHi
          ? "आकारों के शांत क्रम को देखें और अगला सही आकार चुनें।"
          : isGu
          ? "આકારનો ક્રમ યાદ રાખો અને તે જ ક્રમમાં પસંદ કરો."
          : isAs
          ? "ক্ৰমটো মনত ৰাখি সেইদৰে সজাওক।"
          : "Watch the soothing sequence and pick the next pattern.",
        instruction: isHi
          ? "क्रम को ध्यान से देखें और अगला आकार चुनें।"
          : isGu
          ? "આકારનો ક્રમ યાદ રાખો અને તે જ ક્રમમાં પસંદ કરો."
          : isAs
          ? "ক্ৰমটো মনত ৰাখি সেইদৰে সজাওক।"
          : "Watch the pattern and repeat the sequence in order.",
      },
      card_match: {
        title: isHi ? "कार्ड जोड़ी मिलान" : isGu ? "કાર્ડ જોડી મેળવો" : isAs ? "কাৰ্ড যোৰ মিলোৱা" : "Memory Card Match",
        summary: isHi
          ? "समान चित्रों वाले दो कार्ड पलटें और शांति से जोड़े बनाएं।"
          : isGu
          ? "સરખા ચિત્રવાળા બે કાર્ડ પસંદ કરો અને જોડી બનાવો."
          : isAs
          ? "একে ছবিৰ দুখন কাৰ্ড বাছি যোৰ সাজক।"
          : "Flip peaceful cards and find identical matching pairs.",
        instruction: isHi
          ? "देखिए और समान तस्वीरें मिलाइए।"
          : isGu
          ? "સરખા ચિત્રવાળા બે કાર્ડ પસંદ કરો અને જોડી બનાવો."
          : isAs
          ? "একে ছবিৰ দুখন কাৰ্ড বাছি যোৰ সাজক।"
          : "Flip peaceful cards and find matching pairs.",
      },
      real_memory: {
        title: isHi ? "याददाश्त और पहचान" : isGu ? "સ્મૃતિ અને ઓળખ" : isAs ? "স্মৃতি আৰু চিনাক্তকৰণ" : "Memory Match & Recall",
        summary: isHi
          ? "थाली पर रखी 4 परिचित वस्तुओं (सेब, चाय, चाबी, कमल) को याद रखें।"
          : isGu
          ? "થાલી પર રાખેલી 4 વસ્તુઓ (સફરજન, ચા, ચાવી, કમળ) યાદ રાખો."
          : isAs
          ? "কাঁহীত থকা ৪টা চিনাকি বস্তু (আপেল, চাহ, চাবি, পদুম) মনত ৰাখক।"
          : "Remember 4 familiar objects (🍎, ☕, 🔑, 🌸) and recall them.",
        instruction: isHi
          ? "थाली पर रखी वस्तुओं को ध्यान से देखें और याद रखें।"
          : isGu
          ? "થાલી પર રાખેલી વસ્તુઓ ધ્યાનથી જુઓ અને યાદ રાખો."
          : isAs
          ? "বস্তুবোৰ মনোযোগেৰে চাই মনত ৰাখক।"
          : "Observe the keepsakes on the tray and remember them.",
      },
      sequence_memory: {
        title: isHi ? "संख्या क्रम याददाश्त" : isGu ? "આંકડા ક્રમ સ્મૃતિ" : isAs ? "সংখ্যা ক্ৰম স্মৃতি" : "Number Sequence Memory",
        summary: isHi
          ? "दिखाए गए नंबरों को याद रखें और उसी क्रम में शांत मन से दर्ज करें।"
          : isGu
          ? "દર્શાવેલા આંકડા યાદ રાખીને તે જ ક્રમમાં દાખલ કરો."
          : isAs
          ? "নম্বৰবোৰ মনত ৰাখক আৰু একে ক্ৰমত লিখক।"
          : "Remember short number sequences and enter them calmly.",
        instruction: isHi
          ? "दिखाए गए नंबर याद रखें और उसी क्रम में दर्ज करें।"
          : isGu
          ? "દર્શાવેલા આંકડા યાદ રાખીને તે જ ક્રમમાં દાખલ કરો."
          : isAs
          ? "নম্বৰবোৰ মনত ৰাখক আৰু একে ক্ৰমত লিখক।"
          : "Remember the numbers shown and enter them in order.",
      },
      find_difference: {
        title: isHi ? "अलग पहचानें (एकाग्रता)" : isGu ? "જુદું ઓળખો (ધ્યાન)" : isAs ? "ভিন্নটো চিনাক্ত কৰা" : "Visual Attention (Odd One Out)",
        summary: isHi
          ? "शांत ग्रिड में से अलग दिखने वाली एक वस्तु पर टैप करें।"
          : isGu
          ? "ગ્રીડમાં જુદી પડતી એક વસ્તુ પર ટેપ કરો."
          : isAs
          ? "বেলেগ বস্তু এটা চিনাক্ত কৰক।"
          : "Calm visual search for the slightly different item in a pattern.",
        instruction: isHi
          ? "ग्रिड में से अलग दिखने वाली वस्तु पर टैप करें।"
          : isGu
          ? "ગ્રીડમાં જુદી પડતી એક વસ્તુ પર ટેપ કરો."
          : isAs
          ? "বেলেগ বস্তু এটা চিনাক্ত কৰক।"
          : "Look across the peaceful grid and tap the odd one out.",
      },
      word_memory: {
        title: isHi ? "शब्द याददाश्त" : isGu ? "શબ્દ સ્મૃતિ" : isAs ? "শব্দ স্মৃতি" : "Word Memory Recall",
        summary: isHi
          ? "सुखद व सुकून भरे शब्दों की छोटी सूची पढ़ें और याद रखें।"
          : isGu
          ? "શાંતિથી શબ્દો વાંચો અને યાદ રાખીને પસંદ કરો."
          : isAs
          ? "শব্দবোৰ পঢ়ি মনত ৰাখক।"
          : "Short, pleasant word lists for peaceful memorization.",
        instruction: isHi
          ? "शांति से शब्दों को पढ़ें और याद रखकर चुनें।"
          : isGu
          ? "શાંતિથી શબ્દો વાંચો અને યાદ રાખીને પસંદ કરો."
          : isAs
          ? "শব্দবোৰ পঢ়ি মনত ৰাখক।"
          : "Read and remember the calm words, then pick them out.",
      },
      family_photo: {
        title: isHi ? "पारिवारिक फोटो स्मृति" : isGu ? "કૌટુંબિક ફોટો સ્મૃતિ" : isAs ? "পৰিয়ালৰ ফটো স্মৃতি" : "Family Photo Memory",
        summary: isHi
          ? "परिवार के प्रिय सदस्यों और पुरानी मधुर यादों को पहचानें।"
          : isGu
          ? "પરિવારના વહાલા સભ્યો અને જૂની યાદોને ઓળખો."
          : isAs
          ? "পৰিয়ালৰ মৰমৰ মানুহবোৰ চিনি পাওক।"
          : "Familiar faces and heartwarming family relationships.",
        instruction: isHi
          ? "परिवार के प्रिय सदस्यों और प्यारी यादों को पहचानें।"
          : isGu
          ? "પરિવારના વહાલા સભ્યો અને જૂની યાદોને ઓળખો."
          : isAs
          ? "পৰিয়ালৰ মৰমৰ মানুহবোৰ চিনি পাওক।"
          : "Look at the familiar faces and recognize family members.",
      },
      routine_recall: {
        title: isHi ? "दैनिक दिनचर्या स्मृति" : isGu ? "દૈનિક દિનચર્યા સ્મૃતિ" : isAs ? "দৈনন্দিন ৰুটিন স্মৃতি" : "Daily Routine Recall",
        summary: isHi
          ? "आज की दैनिक गतिविधियों (सुबह, चाय, दवा, सैर) को याद करें।"
          : isGu
          ? "આજની દૈનિક આદતો (સવાર, ચા, દવા, ચાલવું) વિશે યાદ કરો."
          : isAs
          ? "দৈনন্দিন স্বাস্থ্যৱান অভ্যাসৰ বিষয়ে উত্তৰ দিয়ক।"
          : "Remember and sequence today's healthy daily activities.",
        instruction: isHi
          ? "दैनिक स्वस्थ दिनचर्या के बारे में शांत मन से उत्तर दें।"
          : isGu
          ? "દૈનિક સ્વસ્થ આદતો વિશે શાંત મનથી જવાબ આપો."
          : isAs
          ? "দৈনন্দিন স্বাস্থ্যৱান অভ্যাসৰ বিষয়ে উত্তৰ দিয়ক।"
          : "Calm questions reinforcing healthy daily habits.",
      },
      match_object: {
        title: isHi ? "वस्तुओं की जोड़ी" : isGu ? "વસ્તુઓની જોડી બનાવો" : isAs ? "বস্তুৰ যোৰ মিলাওক" : "Match the Object",
        summary: isHi
          ? "घरेलू दैनिक वस्तुओं को उनके सही साथी (चाय-प्याली, ताला-चाबी) से जोड़ें।"
          : isGu
          ? "સંબંધિત ઘરની વસ્તુઓની યોગ્ય જોડી બનાવો."
          : isAs
          ? "সম্পৰ্ক থকা বস্তুবোৰ মিলাওক।"
          : "Connect household items with their natural partners.",
        instruction: isHi
          ? "जुड़ी हुई वस्तुओं के सही जोड़े बनाएं।"
          : isGu
          ? "સંબંધિત ઘરની વસ્તુઓની યોગ્ય જોડી બનાવો."
          : isAs
          ? "সম্পৰ্ক থকা বস্তুবোৰ মিলাওক।"
          : "Connect everyday items with their natural partners.",
      },
      voice_quiz: {
        title: isHi ? "आवाज़ स्मृति प्रश्नोत्तरी" : isGu ? "અવાજ સ્મૃતિ ક્વિઝ" : isAs ? "কণ্ঠস্বৰ স্মৃতি কুইজ" : "Voice Memory Quiz",
        summary: isHi
          ? "सुरीली आवाज़ सुनकर सरल याददाश्त प्रश्नों के उत्तर दें।"
          : isGu
          ? "ધ્યાનથી અવાજ સાંભળો અને સાચો વિકલ્પ પસંદ કરો."
          : isAs
          ? "কথাখিনি শুনি সঠিক উত্তৰ বাছক।"
          : "Listen to gentle audio cues and answer recall questions.",
        instruction: isHi
          ? "आवाज़ ध्यान से सुनें और सही उत्तर चुनें।"
          : isGu
          ? "ધ્યાનથી અવાજ સાંભળો અને સાચો વિકલ્પ પસંદ કરો."
          : isAs
          ? "কথাখিনি শুনি সঠিক উত্তৰ বাছক।"
          : "Listen to the audio cue and pick the correct recall answer.",
      },
      ner_cultural_memory: {
        title: isHi ? "पूर्वोत्तर सांस्कृतिक धरोहर" : isGu ? "પૂર્વોત્તર સાંસ્કૃતિક વારસો" : isAs ? "উত্তৰ-পূব সাংস্কৃতিক স্মৃতি" : "Cultural Keepsakes Recall",
        summary: isHi
          ? "पूर्वोत्तर की सांस्कृतिक धरोहरों का क्रम याद रखें व पहचानें।"
          : isGu
          ? "સાંસ્કૃતિક વસ્તુઓનો ક્રમ ધ્યાનથી યાદ રાખો."
          : isAs
          ? "উত্তৰ-পূবৰ সাংস্কৃতিক বস্তুবোৰৰ ক্ৰম মনত ৰাখক।"
          : "Culturally familiar North East keepsakes tray recall.",
        instruction: isHi
          ? "सांस्कृतिक वस्तुओं का क्रम ध्यान से याद रखें।"
          : isGu
          ? "સાંસ્કૃતિક વસ્તુઓનો ક્રમ ધ્યાનથી યાદ રાખો."
          : isAs
          ? "উত্তৰ-পূবৰ সাংস্কৃতিক বস্তুবোৰৰ ক্ৰম মনত ৰাখক।"
          : "Remember the sequence of culturally familiar keepsakes.",
      },
      object_recall: {
        title: isHi ? "स्मृति थाली" : isGu ? "સ્મૃતિ થાળી" : isAs ? "স্মৃতি কাঁহী" : "Keepsake Memory Tray",
        summary: isHi
          ? "थाली पर रखी वस्तुओं को ध्यान से देखें और बदलाव पहचानें।"
          : isGu
          ? "થાલી પર રાખેલી વસ્તુઓ ધ્યાનથી જુઓ અને ફેરફાર ઓળખો."
          : isAs
          ? "কাঁহীত থকা বস্তুবোৰ চাই পৰিৱৰ্তন চিনি উলিয়াওক।"
          : "Observe cherished Indian keepsakes on the tray and spot the change.",
        instruction: isHi
          ? "थाली पर रखी वस्तुओं को ध्यान से देखें और बदलाव पहचानें।"
          : isGu
          ? "થાલી પર રાખેલી વસ્તુઓ ધ્યાનથી જુઓ અને ફેરફાર ઓળખો."
          : isAs
          ? "কাঁহীত থকা বস্তুবোৰ মনোযোগেৰে চাই পৰিৱৰ্তন চিনি উলিয়াওক।"
          : "Observe keepsakes on the tray and spot the mystery change.",
      },
    };

    return (
      dict[gameId] || {
        title: gameId.replace(/_/g, " "),
        summary: "Engaging memory and attention activity.",
        instruction: "Follow the gentle instructions on screen to play.",
      }
    );
  }, [lang]);

  const games = [
    {
      id: "real_memory",
      title: "Memory Match & Recall",
      description: "Remember 4 familiar objects (🍎, ☕, 🔑, 🌸) and identify them from a tray of choices.",
      icon: Sparkles,
      color: "bg-primary/15 text-primary border-primary/30",
      category: "memory",
      duration: "5 minutes",
      difficultyLabel: "Easy",
      component: RealMemoryRecallGame,
    },
    {
      id: "card_match",
      title: "Memory Card Match",
      description: "Flip peaceful cards and find identical matching pairs.",
      icon: Layers,
      color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      category: "memory",
      duration: "5 minutes",
      difficultyLabel: "Easy",
      component: MemoryCardMatch,
    },
    {
      id: "ner_cultural_memory",
      title: "Cultural Keepsakes Recall",
      description: "Culturally familiar North East keepsakes tray recall and recognition.",
      icon: Compass,
      color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      category: "memory",
      duration: "5 minutes",
      difficultyLabel: "Easy",
      component: NERCulturalMemoryGame,
    },
    {
      id: "find_difference",
      title: "Visual Attention (Odd One Out)",
      description: "Calm visual search for the slightly different item in a pattern.",
      icon: Eye,
      color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
      category: "attention",
      duration: "3 minutes",
      difficultyLabel: "Easy",
      component: FindDifference,
    },
    {
      id: "object_recall",
      title: "Keepsake Memory Tray",
      description: "Observe cherished Indian keepsakes on the tray and spot the mystery change.",
      icon: Search,
      color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
      category: "attention",
      duration: "4 minutes",
      difficultyLabel: "Medium",
      component: ObjectRecall,
    },
    {
      id: "pattern_recall",
      title: "Pattern Recognition",
      description: "Watch soothing visual sequences and complete the next item (🔵 → 🔴 → 🔵 → ?).",
      icon: Sparkles,
      color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      category: "pattern",
      duration: "4 minutes",
      difficultyLabel: "Adaptive",
      component: PatternRecall,
    },
    {
      id: "sequence_memory",
      title: "Number Sequence Memory",
      description: "Remember short number sequences and enter them calmly.",
      icon: Hash,
      color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      category: "pattern",
      duration: "3 minutes",
      difficultyLabel: "Medium",
      component: SequenceMemory,
    },
    {
      id: "routine_recall",
      title: "Daily Routine Recall",
      description: "Remember and sequence today's daily activities: wake up, breakfast, medicine, walk.",
      icon: Sun,
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      category: "recall",
      duration: "3 minutes",
      difficultyLabel: "Easy",
      component: RoutineRecall,
    },
    {
      id: "voice_quiz",
      title: "Voice Memory Quiz",
      description: "Listen to audio cues and answer simple recall questions.",
      icon: Volume2,
      color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      category: "recall",
      duration: "4 minutes",
      difficultyLabel: "Easy",
      component: VoiceMemoryQuiz,
    },
    {
      id: "match_object",
      title: "Match the Object",
      description: "Connect household items with their functional partners.",
      icon: LinkIcon,
      color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      category: "recognition",
      duration: "3 minutes",
      difficultyLabel: "Easy",
      component: MatchTheObject,
    },
    {
      id: "family_photo",
      title: "Family Photo Memory",
      description: "Familiar faces and heartwarming family relationships.",
      icon: Users,
      color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      category: "recognition",
      duration: "5 minutes",
      difficultyLabel: "Gentle",
      component: FamilyPhotoMemory,
    },
    {
      id: "word_memory",
      title: "Word Memory Recall",
      description: "Short, pleasant word lists for focused memorization.",
      icon: BookOpen,
      color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      category: "memory",
      duration: "4 minutes",
      difficultyLabel: "Medium",
      component: WordMemory,
    },
  ];

  // Helper to read persistent level data for any game (Expanded to 30 levels)
  const getGameProgress = useCallback((gameId: string) => {
    try {
      const cur = parseInt(localStorage.getItem(`mb_game_level_${gameId}`) || "1", 10) || 1;
      const high = parseInt(localStorage.getItem(`mb_game_highest_${gameId}`) || "1", 10) || 1;
      const best = parseInt(localStorage.getItem(`mb_game_best_${gameId}`) || "0", 10) || 0;
      return { cur: Math.max(1, Math.min(30, cur)), high: Math.max(1, Math.min(30, high)), best };
    } catch {
      return { cur: 1, high: 1, best: 0 };
    }
  }, []);

  // When a game is selected, load its persistent level & stats
  const handleSelectGame = (gameId: string) => {
    const { cur, high, best } = getGameProgress(gameId);
    setActiveGame(gameId);
    setCurrentLevel(cur);
    setHighestLevel(high);
    setSelectedTier(cur <= 10 ? 1 : cur <= 20 ? 2 : 3);
    setBestScore(best);
    setGameStage("playing");
    setAttemptCount(0);
    setLastResult(null);
    setShowResetConfirm(false);
  };

  const handleGameComplete = (score: number, total: number, extra?: any) => {
    if (!activeGame) return;

    const acc = total > 0 ? Math.round((score / total) * 100) : 100;
    const isAdvance = acc >= 50 && currentLevel < 30;
    const nextLevel = isAdvance ? currentLevel + 1 : currentLevel;

    // Update best score
    const newBest = Math.max(bestScore, acc);
    setBestScore(newBest);
    try {
      localStorage.setItem(`mb_game_best_${activeGame}`, String(newBest));
    } catch {}

    // Update highest level and current level persistence
    if (isAdvance) {
      const newHighest = Math.max(highestLevel, nextLevel);
      setHighestLevel(newHighest);
      try {
        localStorage.setItem(`mb_game_highest_${activeGame}`, String(newHighest));
        localStorage.setItem(`mb_game_level_${activeGame}`, String(nextLevel));
      } catch {}
    }

    // Determine domain category
    let gameType: "memory" | "attention" | "recognition" | "recall" | "cultural" = "memory";
    if (activeGame === "pattern_recall" || activeGame === "find_difference") gameType = "attention";
    else if (activeGame === "match_object" || activeGame === "family_photo") gameType = "recognition";
    else if (activeGame === "object_recall" || activeGame === "routine_recall" || activeGame === "voice_quiz") gameType = "recall";
    else if (activeGame === "sequence_memory" || activeGame === "word_memory" || activeGame === "card_match" || activeGame === "real_memory") gameType = "memory";

    // Record session to central MemoryBondStore with level and cycle tracking
    const diffTag = currentLevel <= 10 ? "easy" : currentLevel <= 20 ? "medium" : "challenging";
    store.recordGameSession(activeGame, score, total, diffTag, {
      gameType,
      accuracy: acc,
      level: currentLevel,
      cycleNumber: store.cycleInfo?.cycleNumber,
      ...extra,
    });

    if (activeGame === "real_memory") {
      // RealMemoryRecallGame has its own self-contained Section 15 interactive celebration result screen
      return;
    }

    // Native multilingual respectful motivational feedback
    const motivation = getMotivationalFeedback(lang, currentLevel, acc, isAdvance);
    speakText(motivation.spoken, speechLocale);

    setLastResult({
      score,
      total,
      accuracy: acc,
      completedLevel: currentLevel,
      nextLevel,
      isAdvance,
      headline: motivation.headline,
      spoken: motivation.spoken,
      nextRecommendation: motivation.nextRecommendation,
    });

    setGameStage("completed");
  };

  // Immediate in-game Next Level launch without leaving the game
  const handleNextLevel = useCallback(() => {
    if (!lastResult || !activeGame) return;
    const targetLevel = lastResult.nextLevel;
    setCurrentLevel(targetLevel);
    try {
      localStorage.setItem(`mb_game_level_${activeGame}`, String(targetLevel));
    } catch {}
    setAttemptCount((c) => c + 1);
    setGameStage("playing");
    setLastResult(null);
  }, [lastResult, activeGame]);

  // Voice AI listener for "अगला level शुरू करो" or "Next level"
  useEffect(() => {
    const handleVoiceNextLevel = () => {
      if (gameStage === "completed" && lastResult) {
        handleNextLevel();
      } else if (activeGame) {
        if (currentLevel < 30) {
          const target = currentLevel + 1;
          setCurrentLevel(target);
          try {
            localStorage.setItem(`mb_game_level_${activeGame}`, String(target));
          } catch {}
          setAttemptCount((c) => c + 1);
          setGameStage("playing");
          setLastResult(null);
        }
      } else {
        const recId = store.activityRecommendation?.recommendedGameId || "pattern_recall";
        handleSelectGame(recId);
      }
    };

    window.addEventListener("mb_start_next_level", handleVoiceNextLevel);
    return () => window.removeEventListener("mb_start_next_level", handleVoiceNextLevel);
  }, [gameStage, lastResult, activeGame, currentLevel, handleNextLevel, store.activityRecommendation]);

  // Replay current level
  const handleReplayCurrentLevel = () => {
    setAttemptCount((c) => c + 1);
    setGameStage("playing");
    setLastResult(null);
  };

  // Explicit Reset Confirmation
  const handleConfirmReset = () => {
    if (!activeGame) return;
    try {
      localStorage.removeItem(`mb_game_level_${activeGame}`);
      localStorage.removeItem(`mb_game_highest_${activeGame}`);
      localStorage.removeItem(`mb_game_best_${activeGame}`);
    } catch {}
    setCurrentLevel(1);
    setHighestLevel(1);
    setBestScore(0);
    setShowResetConfirm(false);
    setAttemptCount((c) => c + 1);
    setGameStage("playing");
    setLastResult(null);
  };

  const selectedGameObj = games.find((g) => g.id === activeGame);
  const ces = store.cognitiveScore;

  return (
    <div className="space-y-6">
      {/* Statutory Medical Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-foreground text-sm">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Cognitive Engagement Only: </span>
          {t("notMedical") ||
            "Memory Bond cognitive games are designed for enjoyable memory stimulation and companion engagement. They are strictly not a medical diagnostic or dementia treatment tool."}
        </div>
      </div>

      {activeGame && selectedGameObj ? (
        <div className="space-y-6">
          {/* Active Game Top Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs">
            <Button
              variant="ghost"
              onClick={() => {
                setActiveGame(null);
                setGameStage("playing");
                setLastResult(null);
              }}
              className="gap-2 text-foreground font-bold text-base hover:bg-secondary/60 rounded-2xl"
            >
              <ArrowLeft className="h-5 w-5" /> {t("back") || "Back to All 10 Games"}
            </Button>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  speakText(`${selectedGameObj.title}. Level ${currentLevel}. ${selectedGameObj.description}`, speechLocale)
                }
                className="rounded-2xl gap-2 font-bold text-xs h-10 px-4 text-primary border-primary/30 hover:bg-primary/10"
                title="Hear game instructions read aloud"
              >
                <Volume2 className="h-4 w-4" /> {t("readAloud") || "Instructions"}
              </Button>

              {/* Reset Game Progress with Safe Confirmation */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="rounded-2xl gap-1.5 font-semibold text-xs h-10 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Reset level progress"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reset
              </Button>

              {/* Current Level Pill */}
              <div className="flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-2xl px-3 py-1.5">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-xs font-black text-primary uppercase">
                  Level {currentLevel} of 30
                </span>
              </div>
            </div>
          </div>

          {/* Level Switcher (Senior-friendly 30-Level Tier Tabs & Selector) */}
          <div className="bg-secondary/30 rounded-3xl p-4 border border-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-foreground uppercase tracking-wider">
                  Select Level (1–30):
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Highest Unlocked: Level {highestLevel} of 30
                </span>
              </div>

              {/* Tier Tabs */}
              <div className="flex items-center gap-1 bg-card rounded-2xl p-1 border border-border">
                {([1, 2, 3] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTier(t)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedTier === t
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === 1 ? "Levels 1–10" : t === 2 ? "Levels 11–20" : "Levels 21–30"}
                  </button>
                ))}
              </div>
            </div>

            {/* 10 Level Buttons for Selected Tier */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 10 }, (_, i) => (selectedTier - 1) * 10 + 1 + i).map((lvl) => {
                const isUnlocked = lvl <= highestLevel;
                const isCurrent = lvl === currentLevel;
                return (
                  <button
                    key={lvl}
                    disabled={!isUnlocked}
                    onClick={() => {
                      if (isUnlocked) {
                        setCurrentLevel(lvl);
                        try {
                          localStorage.setItem(`mb_game_level_${activeGame}`, String(lvl));
                        } catch {}
                        setAttemptCount((c) => c + 1);
                        setGameStage("playing");
                        setLastResult(null);
                      }
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : isUnlocked
                        ? "bg-card border border-border text-foreground hover:border-primary shadow-2xs"
                        : "bg-muted/40 text-muted-foreground/40 cursor-not-allowed border border-transparent"
                    }`}
                  >
                    <span className="text-[10px] mb-0.5 opacity-80">
                      {lvl > highestLevel ? <Lock className="h-3 w-3" /> : <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                    </span>
                    <span>Lvl {lvl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Progress Confirmation Dialog */}
          {showResetConfirm && (
            <div className="rounded-3xl border-2 border-destructive/50 bg-destructive/10 p-5 space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-black text-destructive">
                    Reset Game Progress for {selectedGameObj.title}?
                  </h4>
                  <p className="text-sm text-foreground/90 mt-1">
                    This will safely reset your saved level and best score back to Level 1. Your overall cognitive history remains safely recorded.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Keep My Progress
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmReset}
                  className="rounded-xl text-xs font-black"
                >
                  Yes, Reset to Level 1
                </Button>
              </div>
            </div>
          )}

          {/* GAME STAGE: PLAYING vs COMPLETED RESULT vs ERROR */}
          {gameStage === "error" ? (
            <div className="rounded-3xl border-2 border-destructive/40 bg-card p-6 sm:p-10 shadow-lg space-y-6 text-center animate-in fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/15 text-destructive mx-auto">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground">
                  {gameStrings?.somethingWentWrong || "Something went wrong. Please try again."}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {lang === "gu"
                    ? "કંઈક સમસ્યા થઈ છે. ફરી પ્રયાસ કરો."
                    : lang === "hi"
                    ? "कुछ समस्या हुई है। कृपया फिर कोशिश करें।"
                    : lang === "bn"
                    ? "কিছু সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
                    : "Please try again or return to the game menu."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Button
                  size="lg"
                  onClick={() => {
                    setGameStage("playing");
                    setAttemptCount((c) => c + 1);
                  }}
                  className="rounded-2xl font-black px-6 py-6 bg-primary text-primary-foreground shadow-md cursor-pointer"
                >
                  <RotateCcw className="h-5 w-5 mr-1" />
                  {gameStrings?.tryAgain || (lang === "gu" ? "ફરી પ્રયાસ કરો" : lang === "hi" ? "फिर कोशिश करें" : "TRY AGAIN")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    setActiveGame(null);
                    setGameStage("playing");
                    setLastResult(null);
                  }}
                  className="rounded-2xl font-bold px-6 py-6 border-border cursor-pointer"
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />
                  {gameStrings?.exitGame || (lang === "gu" ? "રમતમાંથી બહાર નીકળો" : lang === "hi" ? "गेम से बाहर निकलें" : "EXIT GAME")}
                </Button>
              </div>
            </div>
          ) : gameStage === "playing" ? (
            <div className="rounded-3xl border border-border bg-card p-4 sm:p-8 shadow-sm">
              <GameErrorBoundary
                onCatch={() => setGameStage("error")}
                fallback={
                  <div className="p-8 text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                    <p className="text-base font-bold text-foreground">
                      {gameStrings?.somethingWentWrong || "Something went wrong. Please try again."}
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <Button onClick={() => setAttemptCount((c) => c + 1)} className="rounded-xl font-bold">
                        {gameStrings?.tryAgain || "TRY AGAIN"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveGame(null);
                          setGameStage("playing");
                        }}
                        className="rounded-xl font-bold"
                      >
                        {gameStrings?.exitGame || "EXIT GAME"}
                      </Button>
                    </div>
                  </div>
                }
              >
                {(() => {
                  const GameComp = selectedGameObj.component as any;
                  return (
                    <GameComp
                      key={`${activeGame}_lvl_${currentLevel}_${attemptCount}_${store.profile.selected_state || store.profile.selected_ner_state || "all"}_cycle_${store.cycleInfo.cycleNumber}`}
                      level={currentLevel}
                      onComplete={handleGameComplete}
                      onBackToHome={() => {
                        setActiveGame(null);
                        setGameStage("playing");
                        setLastResult(null);
                        onNavigate?.("home");
                      }}
                      onPlayAnother={() => {
                        setAttemptCount((c) => c + 1);
                        setGameStage("playing");
                        setLastResult(null);
                      }}
                      previousAccuracy={store.gameSessions.length > 0 ? store.gameSessions[store.gameSessions.length - 1].accuracy : 74}
                      nerState={store.profile.selected_state || store.profile.selected_ner_state || "all"}
                      memoryCues={store.memoryCues}
                      contacts={store.contacts}
                      cycleNumber={store.cycleInfo.cycleNumber}
                      cycleSeed={store.cycleInfo.cycleNumber * 7919}
                      adaptiveDifficulty={adaptiveRecommendation.recommended}
                    />
                  );
                })()}
              </GameErrorBoundary>
            </div>
          ) : (
            /* COMPLETED RESULT SCREEN WITH PROMINENT "NEXT LEVEL" BUTTON */
            lastResult && (
              <div className="rounded-3xl border-2 border-primary/40 bg-card p-6 sm:p-10 shadow-lg space-y-8 animate-in zoom-in-95 text-center">
                {/* Celebration Header */}
                <div className="space-y-3">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/15 border-2 border-primary/30 text-4xl shadow-inner mx-auto">
                    {lastResult.isAdvance ? "🌟" : "🌸"}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-foreground">
                    Level {lastResult.completedLevel} Complete!
                  </h2>
                  <p className="text-lg text-muted-foreground font-semibold">
                    {lastResult.headline}
                  </p>
                </div>

                {/* Score & Accuracy Readout */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                  <div className="rounded-2xl bg-secondary/40 border border-border p-4">
                    <div className="text-3xl font-black text-primary">{lastResult.accuracy}%</div>
                    <div className="text-xs font-bold text-muted-foreground uppercase mt-1">Accuracy</div>
                  </div>
                  <div className="rounded-2xl bg-secondary/40 border border-border p-4">
                    <div className="text-3xl font-black text-foreground">
                      {lastResult.score} / {lastResult.total}
                    </div>
                    <div className="text-xs font-bold text-muted-foreground uppercase mt-1">Correct Items</div>
                  </div>
                  <div className="rounded-2xl bg-secondary/40 border border-border p-4">
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {bestScore}%
                    </div>
                    <div className="text-xs font-bold text-muted-foreground uppercase mt-1">Best Record</div>
                  </div>
                </div>

                {/* Native Motivational Feedback Box */}
                <div className="rounded-3xl bg-primary/10 border border-primary/25 p-5 max-w-xl mx-auto text-left flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => speakText(lastResult.spoken, speechLocale)}
                    className="p-3 rounded-2xl bg-primary text-primary-foreground shrink-0 shadow-md hover:scale-105 transition-all cursor-pointer"
                    title="Hear encouragement again"
                  >
                    <Volume2 className="h-6 w-6" />
                  </button>
                  <div>
                    <div className="text-xs font-black text-primary uppercase tracking-wider">
                      AI Companion Encouragement
                    </div>
                    <p className="text-base font-bold text-foreground mt-1 leading-relaxed">
                      "{lastResult.spoken}"
                    </p>
                  </div>
                </div>

                {/* BIG PROMINENT NEXT LEVEL BUTTON or LEVEL 30 GRAND CELEBRATION */}
                <div className="max-w-xl mx-auto space-y-3 pt-2">
                  {lastResult.completedLevel >= 30 && lastResult.accuracy >= 50 ? (
                    <div className="rounded-3xl border-2 border-amber-500/50 bg-amber-500/10 p-6 space-y-4 shadow-xl animate-in zoom-in-95">
                      <div className="text-5xl">🏆</div>
                      <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                        Grand Master! Level 30 Conquered!
                      </h3>
                      <p className="text-sm sm:text-base font-semibold text-foreground/90 leading-relaxed">
                        Incredible achievement! You have completed all 30 levels of {selectedGameObj.title}. Your memory, attention, and cognitive endurance are truly inspiring!
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                        <Button
                          onClick={handleReplayCurrentLevel}
                          size="lg"
                          className="rounded-2xl font-black text-base px-6 py-6 bg-primary text-primary-foreground shadow-md"
                        >
                          <RotateCcw className="h-5 w-5 mr-1" /> Replay Level 30
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActiveGame(null);
                            setGameStage("playing");
                            setLastResult(null);
                          }}
                          size="lg"
                          className="rounded-2xl font-bold text-base px-6 py-6 border-border"
                        >
                          <ArrowLeft className="h-5 w-5 mr-1" /> All Cognitive Games
                        </Button>
                      </div>
                    </div>
                  ) : lastResult.isAdvance ? (
                    <Button
                      onClick={handleNextLevel}
                      size="lg"
                      className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-3xl gap-3 animate-pulse border-2 border-primary-foreground/20 cursor-pointer"
                    >
                      <span>{t("nextLevel") || "NEXT LEVEL"}</span>
                      <span className="text-sm sm:text-base font-normal opacity-90">
                        (Level {lastResult.nextLevel} of 30)
                      </span>
                      <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleReplayCurrentLevel}
                      size="lg"
                      className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-3xl gap-3 cursor-pointer"
                    >
                      <span>{t("tryAnother") || "PLAY AGAIN"}</span>
                      <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8 ml-1" />
                    </Button>
                  )}

                  {lastResult.completedLevel < 30 && (
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={handleReplayCurrentLevel}
                        className="rounded-2xl font-bold text-sm h-12 px-5 gap-2 border-border"
                      >
                        <RotateCcw className="h-4 w-4" /> Replay Level {lastResult.completedLevel}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setActiveGame(null);
                          setGameStage("playing");
                          setLastResult(null);
                        }}
                        className="rounded-2xl font-bold text-sm h-12 px-5 gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="h-4 w-4" /> All 10 Games
                      </Button>
                    </div>
                  )}
                </div>

                {/* Persistent Cognitive Progress Strip */}
                <div className="pt-4 border-t border-border/80 flex flex-wrap items-center justify-around gap-4 text-xs text-muted-foreground font-bold max-w-xl mx-auto">
                  <span>Level Unlocked: {highestLevel} of 30</span>
                  <span>•</span>
                  <span>Total Sessions: {store.gameSessions.length}</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Live CES: {ces.overall}/100</span>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        /* ALL 10 GAMES HUB VIEW */
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6 border border-border">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
                <Gamepad2 className="h-8 w-8 text-primary" /> Cognitive Gaming Center
              </h2>
              <p className="text-muted-foreground mt-1 text-base">
                10 gentle, senior-friendly exercises with no stressful timers and continuous adaptive progression.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Sessions count */}
              <div className="rounded-2xl bg-card border border-border px-4 py-2 shadow-xs text-center">
                <div className="text-lg font-black text-primary">{store.gameSessions.length}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Played</div>
              </div>

              {/* Live CES score mini badge */}
              <div className="rounded-2xl bg-card border border-border px-4 py-2 shadow-xs text-center">
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{ces.overall}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">CES Score</div>
              </div>
            </div>
          </div>

          {/* 8-Day Content Refresh Cycle Engine (Requirements 9, 10, 16) */}
          <div className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
                  🔄
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-foreground">
                      8-Day Content Cycle #{store.cycleInfo.cycleNumber} ({store.cycleInfo.cycleContentSet})
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                      Day {store.cycleInfo.daysElapsedInCycle} of 8 ({store.cycleInfo.daysRemainingInCycle}d until refresh)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                    Every 8 days, fresh questions, objects, and challenges refresh across all 30 levels. Your historical accuracy, best scores, and trends are continuously preserved!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    store.advanceCycle();
                    speakText(`Advanced to next 8-day cycle with fresh content set.`, speechLocale);
                  }}
                  className="rounded-xl font-bold text-xs gap-1.5 h-9 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                  title="Simulate advancing to next 8-day cycle"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Advance 8-Day Cycle (Demo)
                </Button>
              </div>
            </div>

            {/* Cycle Performance Comparison History */}
            {store.cycleInfo.historicalCycleComparison.length > 1 && (
              <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                  Improvement Across Cycles:
                </span>
                {store.cycleInfo.historicalCycleComparison.map((c) => (
                  <span
                    key={c.cycleNumber}
                    className="inline-flex items-center gap-1.5 bg-card/80 border border-border px-2.5 py-1 rounded-xl font-semibold"
                  >
                    <span>Cycle {c.cycleNumber} ({c.contentSet}):</span>
                    <strong className="text-primary">{c.avgAccuracy}% Acc</strong>
                    <span className="text-muted-foreground text-[10px]">(Highest Lvl {c.highestLevelReached}/30)</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI-Based Activity Recommendation Hero Card (Requirement 3 & Complete AI Loop) */}
          {store.activityRecommendation && (
            <div className="rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-md space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-3xl shrink-0">
                    🎯
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/15 px-3 py-1 rounded-full">
                        AI Recommended Next Activity
                      </span>
                      {store.activityRecommendation.isOptimalTime && (
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 rounded-full flex items-center gap-1">
                          <Sun className="h-3 w-3" /> Focus Window (9 AM – 11 AM)
                        </span>
                      )}
                      <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full capitalize">
                        Focus: {store.activityRecommendation.focusDomain}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground mt-2">
                      {store.activityRecommendation.headline}
                    </h3>
                    <p className="text-sm font-semibold text-foreground/90 mt-1 max-w-2xl leading-relaxed">
                      {store.activityRecommendation.rationale}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleSelectGame(store.activityRecommendation.recommendedGameId)}
                  size="lg"
                  className="rounded-2xl px-6 py-6 font-black text-base shadow-md bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0 cursor-pointer"
                >
                  <span>Start Recommended Game</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Statutory Non-Diagnostic Note */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="italic">{store.activityRecommendation.timeContextPrompt}</span>
                <span className="font-semibold text-primary/80">Tailored to your current wellness balance</span>
              </div>
            </div>
          )}

          {/* Complete AI Cognitive Care Loop & Dynamic Profile (Requirements 1, 2, 7) */}
          <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary text-2xl">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-foreground">
                      Complete AI Cognitive Care Loop
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Live 9-Step Closed Loop
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Continuous feedback cycle connecting clinical assessment, adaptive gaming, performance analysis, and care recommendations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiLoop((prev) => !prev)}
                  className="rounded-xl font-bold text-xs gap-1.5 h-10 border-border"
                >
                  {showAiLoop ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showAiLoop ? "Hide Loop Details" : "View 9-Step Loop"}
                </Button>
              </div>
            </div>

            {/* Dynamic Cognitive Profile: 7 Measurable Dimensions (Requirement 2) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-primary" /> Dynamic Cognitive Dimensions (Wellness Indicators)
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Updated from {store.gameSessions.length} sessions • Non-Diagnostic
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {[
                  { label: "Memory", val: store.profile.dynamic_cognitive_profile?.memory ?? 62, icon: "🧠", color: "text-indigo-600 dark:text-indigo-400" },
                  { label: "Attention", val: store.profile.dynamic_cognitive_profile?.attention ?? 71, icon: "🎯", color: "text-amber-600 dark:text-amber-400" },
                  { label: "Recognition", val: store.profile.dynamic_cognitive_profile?.recognition ?? 55, icon: "👁️", color: "text-teal-600 dark:text-teal-400" },
                  { label: "Reaction Time", val: store.profile.dynamic_cognitive_profile?.reaction_time ?? 68, icon: "⚡", color: "text-sky-600 dark:text-sky-400" },
                  { label: "Recall", val: store.profile.dynamic_cognitive_profile?.recall ?? 48, icon: "🔄", color: "text-rose-600 dark:text-rose-400" },
                  { label: "Consistency", val: store.profile.dynamic_cognitive_profile?.consistency ?? 61, icon: "📊", color: "text-purple-600 dark:text-purple-400" },
                  { label: "Engagement", val: store.profile.dynamic_cognitive_profile?.engagement ?? 73, icon: "🌟", color: "text-emerald-600 dark:text-emerald-400" },
                ].map((dim) => (
                  <div key={dim.label} className="rounded-2xl border border-border bg-secondary/30 p-3 space-y-1 text-center">
                    <div className="text-base">{dim.icon}</div>
                    <div className={`text-xl font-black ${dim.color}`}>{dim.val}</div>
                    <div className="text-[10px] font-bold text-muted-foreground truncate uppercase">{dim.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expandable 9-Step AI Cognitive Care Loop Timeline */}
            {showAiLoop && (
              <div className="pt-3 border-t border-border/80 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(store.cognitiveCareLoopSteps || []).map((step) => {
                    const isDone = step.status === "completed";
                    const isCurrent = step.status === "active" || (step.status as any) === "in_progress";
                    return (
                      <div
                        key={step.step}
                        className={`rounded-2xl border-2 p-3.5 space-y-1.5 transition-all ${
                          isDone
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : isCurrent
                            ? "border-primary/60 bg-primary/10 shadow-xs"
                            : "border-border bg-secondary/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-card border border-border">
                            Step {step.step}
                          </span>
                          <span className={`text-xs font-black capitalize ${
                            isDone ? "text-emerald-700 dark:text-emerald-300" : isCurrent ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {isDone ? "✓ Complete" : isCurrent ? "• Active" : "Scheduled"}
                          </span>
                        </div>
                        <div className="text-sm font-black text-foreground">{step.title}</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                        {step.metric && (
                          <div className="text-[11px] font-mono font-bold text-primary pt-1 border-t border-border/40">
                            {step.metric}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Patient Personalization Engine Snapshot (Requirement 7) */}
                {store.personalizationInsights && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-primary uppercase text-[10px] tracking-wider">
                        Personalization Engine Profile
                      </span>
                      <p className="text-foreground font-semibold">
                        Best Performance Window: <strong className="text-foreground">{store.personalizationInsights.preferredTimeWindow || (store.personalizationInsights as any).preferredFocusWindow || "Morning"}</strong> • 
                        Avg Session: <strong>{Math.round((store.personalizationInsights.avgSessionDurationMs || 300000) / 60000)} mins</strong> • 
                        Suggestion: <strong className="capitalize text-emerald-700 dark:text-emerald-300">{store.personalizationInsights.proactiveSuggestion || "Keep practicing"}</strong>
                      </p>
                    </div>
                    {store.personalizationInsights.favoriteGame && (
                      <span className="text-muted-foreground">
                        Favorite Game: <strong className="text-foreground">{store.personalizationInsights.favoriteGame.title}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* North Eastern Cultural Region Cognitive Content Selector (Requirement 8) */}
          <div className="rounded-3xl border border-border bg-secondary/30 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎋</span>
                <div>
                  <h4 className="text-base font-black text-foreground">North Eastern Region Cultural Hub</h4>
                  <p className="text-xs text-muted-foreground">
                    Culturally familiar items configured across all 8 NER states for memory, recognition, and recall activities.
                  </p>
                </div>
              </div>
              {onNavigate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("cultural")}
                  className="rounded-xl font-bold text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  Cultural Deep Dive ➔
                </Button>
              )}
            </div>

            {/* Clickable state filter pills that dynamically customize cognitive games */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => store.setSelectedNerState("all")}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  !store.profile.selected_ner_state || store.profile.selected_ner_state === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card border-border/80 text-foreground hover:border-primary"
                }`}
              >
                🌐 All NER States
              </button>
              {[
                { name: "Assam", icon: "🍃", note: "Tea & Bihu" },
                { name: "Meghalaya", icon: "🌧️", note: "Bridges & Rain" },
                { name: "Nagaland", icon: "🎺", note: "Hornbill & Shawls" },
                { name: "Mizoram", icon: "🎋", note: "Cheraw Bamboo" },
                { name: "Manipur", icon: "🪷", note: "Loktak & Ras" },
                { name: "Arunachal Pradesh", icon: "🏔️", note: "Orchids & Dawn" },
                { name: "Tripura", icon: "🏰", note: "Neermahal" },
                { name: "Sikkim", icon: "🌸", note: "Kanchenjunga" },
              ].map((state) => {
                const isSelected = store.profile.selected_ner_state === state.name;
                return (
                  <button
                    key={state.name}
                    type="button"
                    onClick={() => store.setSelectedNerState(state.name)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary scale-105"
                        : "bg-card border-border/80 text-foreground hover:border-primary"
                    }`}
                  >
                    <span>{state.icon}</span>
                    <span>{state.name}</span>
                    <span className={`text-[10px] font-normal ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      ({state.note})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 11: Category Filter & Subtitle */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border p-5 rounded-3xl">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2">
                  Brain Activities 🧠
                </h2>
                <p className="text-base text-muted-foreground font-semibold mt-1">
                  "Let's exercise your memory for a few minutes."
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary/50 px-4 py-2 rounded-2xl">
                <span>{games.length} total activities</span>
                <span>•</span>
                <span className="text-primary">Adaptive Difficulty</span>
              </div>
            </div>

            {/* Category Filter Pills (Section 11) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {[
                { id: "all", label: "🌟 All Activities", count: games.length },
                { id: "memory", label: "🧠 Memory", count: games.filter((g) => g.category === "memory").length },
                { id: "attention", label: "🎯 Attention", count: games.filter((g) => g.category === "attention").length },
                { id: "pattern", label: "🔷 Pattern Recognition", count: games.filter((g) => g.category === "pattern").length },
                { id: "recall", label: "🕐 Daily Recall", count: games.filter((g) => g.category === "recall").length },
                { id: "recognition", label: "👀 Recognition", count: games.filter((g) => g.category === "recognition").length },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-2xl border text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                        : "bg-card border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MOBILE VIEW: Senior-Friendly Photographic/Visual Game Cards (Section 11) */}
          <div className="flex flex-col gap-4 sm:hidden">
            {games
              .filter((g) => selectedCategory === "all" || g.category === selectedCategory)
              .map((g) => {
                const localized = getLocalizedGame(g.id);
                const prog = getGameProgress(g.id);
                return (
                  <div
                    key={g.id}
                    className="rounded-3xl border-2 border-border/80 bg-card p-4 text-left shadow-xs flex flex-col gap-3 group transition-all hover:border-primary/50"
                  >
                    {/* Game Visual Artwork (Section 11 & 12) */}
                    <div className="w-full overflow-hidden rounded-2xl">
                      <GameArtwork gameId={g.id} compact />
                    </div>

                    {/* Game Name & One-line Explanation */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="text-lg font-black text-foreground truncate">
                          {localized.title}
                        </h3>
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                          Lvl {prog.cur}/30
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {localized.summary}
                      </p>
                    </div>

                    {/* Prominent Senior-Friendly PLAY Button (Section 11) */}
                    <Button
                      onClick={() => setPendingGame(g.id)}
                      className="w-full h-14 rounded-2xl font-black text-base shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 transition-transform"
                    >
                      <Play className="h-5 w-5 fill-white" />
                      <span>{lang === "hi" ? "खेलें" : lang === "gu" ? "રમો" : lang === "as" ? "খেলক" : "PLAY"}</span>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                );
              })}
          </div>

          {/* TABLET & DESKTOP VIEW: Multi-Column Visual Game Cards Grid (Section 11) */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {games
              .filter((g) => selectedCategory === "all" || g.category === selectedCategory)
              .map((g) => {
                const localized = getLocalizedGame(g.id);
                const prog = getGameProgress(g.id);
                const progressPct = Math.round((prog.high / 30) * 100);
                return (
                  <div
                    key={g.id}
                    className="group rounded-3xl border-2 border-border/80 bg-card p-5 text-left shadow-sm transition-all hover:border-primary/60 hover:shadow-lg flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      {/* Top Custom Game Visual (Section 11 & 12) */}
                      <div className="w-full overflow-hidden rounded-2xl shadow-xs">
                        <GameArtwork gameId={g.id} />
                      </div>

                      {/* Header: Title, Category & Audio */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-secondary text-foreground/85 border border-border/60">
                              ⏱️ {g.duration}
                            </span>
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              Lvl {prog.cur}/30
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakText(`${localized.title}. ${localized.instruction}`, speechLocale)}
                            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Read instruction aloud"
                            aria-label="Read game title aloud"
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Game Name */}
                        <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                          {localized.title}
                        </h3>

                        {/* Short One-Line Explanation */}
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed min-h-[36px]">
                          {localized.summary}
                        </p>
                      </div>

                      {/* Progress Bar & Best Score */}
                      <div className="bg-secondary/30 rounded-2xl p-3 border border-border/60 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-muted-foreground">Level {prog.cur} of 30</span>
                          <span className="font-extrabold text-foreground">
                            {prog.best > 0 ? `Best: ${prog.best}%` : "Ready to Start"}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-border/60 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(5, progressPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Prominent Senior-Friendly PLAY Button (Section 11) */}
                    <div className="pt-4 mt-1">
                      <Button
                        onClick={() => setPendingGame(g.id)}
                        className="w-full h-14 rounded-2xl font-black text-lg shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-98"
                      >
                        <Play className="h-5 w-5 fill-white" />
                        <span>{lang === "hi" ? "खेलें" : lang === "gu" ? "રમો" : lang === "as" ? "খেলক" : "PLAY"}</span>
                        <ArrowRight className="h-5 w-5 ml-auto" />
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* ========================================================================= */}
          {/* Pre-Game Simple Instruction Modal (Section 15)                             */}
          {/* ========================================================================= */}
          {pendingGame && (() => {
            const pendingGameObj = games.find((g) => g.id === pendingGame);
            const localized = getLocalizedGame(pendingGame);
            if (!pendingGameObj) return null;

            return (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                <div
                  className="relative w-full max-w-lg bg-card border-2 border-primary/40 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Game Artwork Preview */}
                  <div className="w-full overflow-hidden rounded-2xl shadow-inner">
                    <GameArtwork gameId={pendingGame} />
                  </div>

                  {/* Game Title & Category Badge */}
                  <div className="text-center space-y-1">
                    <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {pendingGameObj.category.toUpperCase()} • {pendingGameObj.duration}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-foreground pt-1">
                      {localized.title}
                    </h3>
                  </div>

                  {/* Simple Instruction Box (Section 15: "देखिए और समान तस्वीरें मिलाइए।") */}
                  <div className="bg-secondary/50 rounded-2xl p-5 border-2 border-primary/20 text-center space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      {lang === "hi" ? "खेल निर्देश" : lang === "gu" ? "રમત સૂચના" : lang === "as" ? "খেলৰ নিৰ্দেশনা" : "Game Instruction"}
                    </span>
                    <p className="text-lg sm:text-xl font-black text-foreground leading-relaxed">
                      "{localized.instruction}"
                    </p>
                    <button
                      type="button"
                      onClick={() => speakText(localized.instruction, speechLocale)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline cursor-pointer pt-1"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>
                        {lang === "hi" ? "निर्देश सुनें" : lang === "gu" ? "સૂચના સાંભળો" : lang === "as" ? "নিৰ্দেশনা শুনক" : "Listen to Instruction"}
                      </span>
                    </button>
                  </div>

                  {/* Start Button & Back Button (Section 15: [ START GAME ]) */}
                  <div className="space-y-3 pt-2">
                    <Button
                      onClick={() => {
                        const gid = pendingGame;
                        setPendingGame(null);
                        handleSelectGame(gid);
                      }}
                      className="w-full h-16 rounded-2xl font-black text-xl shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-98"
                    >
                      <Play className="h-6 w-6 fill-white" />
                      <span>
                        {lang === "hi" ? "खेल शुरू करें" : lang === "gu" ? "રમત શરૂ કરો" : lang === "as" ? "খেল আৰম্ভ কৰক" : "START GAME"}
                      </span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setPendingGame(null)}
                      className="w-full h-11 rounded-2xl font-bold text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1.5" />
                      <span>{lang === "hi" ? "वापस जाएं" : lang === "gu" ? "પાછા જાઓ" : lang === "as" ? "উভতি যাওক" : "Back to Games"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
