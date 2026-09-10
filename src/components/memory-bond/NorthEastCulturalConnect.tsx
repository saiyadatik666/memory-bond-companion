import { useState } from "react";
import {
  MapPin,
  Sparkles,
  Volume2,
  Award,
  Heart,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Music,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

export interface CulturalItem {
  id: string;
  name: string;
  nativeName: string;
  state: "Assam" | "Meghalaya" | "Nagaland" | "Manipur" | "Mizoram" | "Arunachal Pradesh" | "Tripura" | "Sikkim";
  category: "craft" | "attire" | "nature" | "music" | "festival" | "food";
  emoji: string;
  description: string;
  culturalMemory: string;
  question: string;
  options: string[];
  correctOption: string;
}

const NE_CULTURAL_ITEMS: CulturalItem[] = [
  {
    id: "gamosa",
    name: "Gamosa",
    nativeName: "ফুলাম গামোচা",
    state: "Assam",
    category: "attire",
    emoji: "🧣",
    description: "Traditional white rectangular woven cotton cloth with red floral borders, presented as a symbol of deep respect and love.",
    culturalMemory: "Remembering Bihu mornings when elders receive fresh Phulam Gamosa woven with love on the handloom.",
    question: "Which sacred Assamese textile has bright red woven patterns on white cotton?",
    options: ["Gamosa", "Pashmina", "Banarasi"],
    correctOption: "Gamosa",
  },
  {
    id: "jaapi",
    name: "Jaapi (Assam Sun Hat)",
    nativeName: "জাপি",
    state: "Assam",
    category: "craft",
    emoji: "👒",
    description: "Conical hat crafted from bamboo, cane, and large Tokou palm leaves, adorned with red, black, and green felt motifs.",
    culturalMemory: "Farmers wearing the cooling Jaapi in lush green paddy fields and decorative Jaapi adorning welcoming living room walls.",
    question: "What is this traditional conical bamboo hat that protects farmers from rain and sun?",
    options: ["Jaapi", "Pagri", "Topi"],
    correctOption: "Jaapi",
  },
  {
    id: "assam_tea",
    name: "Assam Orthodox Tea",
    nativeName: "অসম চাহ",
    state: "Assam",
    category: "food",
    emoji: "☕",
    description: "World-renowned rich, malty black tea harvested from Camellia sinensis var. assamica in misty Brahmaputra valley gardens.",
    culturalMemory: "The comforting fragrance of warm morning chai brewed with fresh tea leaves and cardamom on a cool winter dawn.",
    question: "Which famous North Eastern brew is celebrated worldwide for its rich malty flavour?",
    options: ["Assam Black Tea", "Filter Coffee", "Coconut Water"],
    correctOption: "Assam Black Tea",
  },
  {
    id: "kaji_nemu",
    name: "Kaji Nemu (Assam Lemon)",
    nativeName: "কাজী নেমু",
    state: "Assam",
    category: "nature",
    emoji: "🍋",
    description: "Distinctive elongated GI-tagged lemon famous for its uplifting fragrance, tender seeds, and refreshing juice.",
    culturalMemory: "Squeezing fresh aromatic Kaji Nemu over warm steamed rice, masor tenga (sour fish curry), and dal.",
    question: "Which fragrant elongated lemon with GI tag is essential to traditional Assamese thalis?",
    options: ["Kaji Nemu", "Sweet Lime", "Valencia Orange"],
    correctOption: "Kaji Nemu",
  },
  {
    id: "pepa_dhol",
    name: "Pepa & Dhol",
    nativeName: "পেঁপা আৰু ঢোল",
    state: "Assam",
    category: "music",
    emoji: "🎺",
    description: "The Pepa is a hornpipe crafted from a buffalo horn and bamboo; the Dhol is the rhythmic heartbeat of Rongali Bihu celebrations.",
    culturalMemory: "The lively, high-pitched melodies echoing across villages during spring, welcoming renewal and fertility.",
    question: "Which indigenous instrument is carved from a buffalo horn and played during Rongali Bihu?",
    options: ["Pepa", "Flute", "Shehnai"],
    correctOption: "Pepa",
  },
  {
    id: "hornbill",
    name: "Hornbill Festival & Morung",
    nativeName: "হৰ্ণবিল মহোৎসৱ",
    state: "Nagaland",
    category: "festival",
    emoji: "🪶",
    description: "Celebration uniting all 16 major Naga tribes in Kisama with vibrant traditional warrior dances, woodcarving, and folk ballads.",
    culturalMemory: "Gathering around the crackling evening hearth, sharing stories of bravery and tribal heritage under starry Kohima skies.",
    question: "Which major cultural festival in Nagaland is named after a majestic forest bird?",
    options: ["Hornbill Festival", "Sunburn Festival", "Konark Festival"],
    correctOption: "Hornbill Festival",
  },
  {
    id: "root_bridges",
    name: "Living Root Bridges",
    nativeName: "Jingkieng Jri",
    state: "Meghalaya",
    category: "nature",
    emoji: "🌿",
    description: "Ingenious aerial bridges hand-woven by the Khasi and Jaintia peoples from living Ficus elastica tree roots over gushing rivers.",
    culturalMemory: "Walking safely across sacred rainforest streams surrounded by gentle monsoon mists and chirping cicadas.",
    question: "What ancient bio-engineering marvel do the Khasi people weave from living tree roots?",
    options: ["Living Root Bridges", "Suspension Wire Bridge", "Bamboo Raft"],
    correctOption: "Living Root Bridges",
  },
  {
    id: "cheraw",
    name: "Cheraw (Bamboo Dance)",
    nativeName: "Cheraw Lam",
    state: "Mizoram",
    category: "music",
    emoji: "🎋",
    description: "Graceful traditional dance where dancers step in and out between pairs of horizontal bamboo staves tapped to rhythmic tempo.",
    culturalMemory: "The joyful rhythmic clack of bamboo poles and bright traditional Puan skirts swinging during Chapchar Kut.",
    question: "Which rhythmic Mizo dance involves agile steps between tapping bamboo poles?",
    options: ["Cheraw Dance", "Garba", "Kathak"],
    correctOption: "Cheraw Dance",
  },
  {
    id: "phumdis",
    name: "Loktak Lake & Floating Phumdis",
    nativeName: "Loktak Pat",
    state: "Manipur",
    category: "nature",
    emoji: "🌊",
    description: "The largest freshwater lake in North East India, famous for floating biomass islands and the rare Sangai dancing deer.",
    culturalMemory: "Gliding across calm waters at sunrise, admiring fishermen casting nets from dugout canoes.",
    question: "Which famous lake in Manipur is known worldwide for its unique floating islands (phumdis)?",
    options: ["Loktak Lake", "Dal Lake", "Chilika Lake"],
    correctOption: "Loktak Lake",
  },
  {
    id: "rhino",
    name: "One-Horned Rhinoceros of Kaziranga",
    nativeName: "এশিঙীয়া গঁড়",
    state: "Assam",
    category: "nature",
    emoji: "🦏",
    description: "The pride of Assam wandering freely through the tall elephant grasses and wetlands of UNESCO World Heritage Kaziranga.",
    culturalMemory: "Spotting a mother rhino and calf quietly grazing in the morning mist near the Mihimukh safari tower.",
    question: "Which world-famous wild animal is the iconic symbol of Kaziranga National Park?",
    options: ["Greater One-Horned Rhino", "Royal Bengal Tiger", "Snow Leopard"],
    correctOption: "Greater One-Horned Rhino",
  },
];

const NE_STATES = [
  "All States",
  "Assam",
  "Meghalaya",
  "Nagaland",
  "Manipur",
  "Mizoram",
  "Arunachal Pradesh",
  "Tripura",
  "Sikkim",
] as const;

export function NorthEastCulturalConnect({ store }: { store: MemoryBondStore }) {
  const { speechLocale } = useI18n();
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [activeItem, setActiveItem] = useState<CulturalItem | null>(null);
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const filteredItems = NE_CULTURAL_ITEMS.filter(
    (item) => selectedState === "All States" || item.state === selectedState
  );

  const startQuiz = () => {
    setQuizMode(true);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return; // prevent double clicks
    setSelectedAnswer(option);

    const currentQ = filteredItems[quizIndex];
    const isCorrect = option === currentQ.correctOption;
    if (isCorrect) {
      setQuizScore((s) => s + 1);
      speakText("Correct! Wonderful memory.", speechLocale);
    } else {
      speakText(`That was close! The correct answer is ${currentQ.correctOption}.`, speechLocale);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex < filteredItems.length - 1) {
      setQuizIndex((idx) => idx + 1);
      setSelectedAnswer(null);
    } else {
      // Finished quiz! Record session into store
      setQuizFinished(true);
      const finalScore = quizScore;
      const total = filteredItems.length;
      store.recordGameSession("cultural_connect", finalScore, total, "easy", {
        gameType: "cultural",
        accuracy: total > 0 ? Math.round((finalScore / total) * 100) : 100,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Statutory Medical Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-foreground text-sm">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Cultural Reminiscence & Cognitive Engagement: </span>
          Familiar regional items, sounds, and stories spark heartwarming nostalgic recall and meaningful conversation.
          This is an assistive engagement module, not a medical diagnosis or dementia cure.
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600/20 via-teal-500/15 to-primary/10 border-2 border-emerald-500/30 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5" /> SIH26003 North Eastern Region Connect
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
              🌸 Asom & North East Heritage Hub
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Gentle cultural memory cues celebrating Assam and the Seven Sisters. Recall beloved songs, festivals, tea gardens,
              traditional weaves, and regional treasures.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={startQuiz}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md gap-2 h-12 px-6"
            >
              <Sparkles className="h-5 w-5" /> Start Cultural Recall Quiz
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                speakText(
                  "Welcome to the North East Heritage Hub. Explore familiar items from Assam, Meghalaya, Nagaland and all North Eastern states to refresh fond memories.",
                  speechLocale
                )
              }
              className="rounded-2xl gap-2 font-bold h-12 text-xs"
            >
              <Volume2 className="h-4 w-4" /> Listen to Overview
            </Button>
          </div>
        </div>

        {/* State Filter Tabs */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {NE_STATES.map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedState(st);
                setQuizMode(false);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                selectedState === st
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-card/80 hover:bg-card text-muted-foreground border border-border"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* QUIZ MODE INTERACTION */}
      {quizMode ? (
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-card p-6 sm:p-8 shadow-sm max-w-2xl mx-auto space-y-6">
          {!quizFinished ? (
            <>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{filteredItems[quizIndex]?.emoji}</span>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Question {quizIndex + 1} of {filteredItems.length}
                    </span>
                    <h3 className="text-xl font-black text-foreground">
                      {filteredItems[quizIndex]?.name} ({filteredItems[quizIndex]?.state})
                    </h3>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuizMode(false)}
                  className="text-xs font-bold"
                >
                  Exit Quiz
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-lg font-bold text-foreground">
                  {filteredItems[quizIndex]?.question}
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {filteredItems[quizIndex]?.options.map((opt) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = opt === filteredItems[quizIndex]?.correctOption;

                    let btnClass = "border-border bg-secondary/40 text-foreground hover:bg-secondary/80";
                    if (selectedAnswer) {
                      if (isCorrect) {
                        btnClass = "border-success bg-success/15 text-success font-black";
                      } else if (isSelected) {
                        btnClass = "border-destructive bg-destructive/15 text-destructive font-black";
                      }
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        disabled={!!selectedAnswer}
                        className={`p-4 rounded-2xl border-2 text-left font-bold text-base transition-all flex items-center justify-between cursor-pointer ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {selectedAnswer && isCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm space-y-2 animate-in fade-in">
                    <div className="font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <Heart className="h-4 w-4" /> Cultural Memory Note:
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {filteredItems[quizIndex]?.culturalMemory}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    speakText(
                      `${filteredItems[quizIndex]?.question}. ${filteredItems[quizIndex]?.culturalMemory}`,
                      speechLocale
                    )
                  }
                  className="rounded-2xl gap-2 font-bold text-xs"
                >
                  <Volume2 className="h-4 w-4" /> Read Aloud
                </Button>

                {selectedAnswer && (
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl gap-2 px-6"
                  >
                    {quizIndex < filteredItems.length - 1 ? "Next Question" : "Finish Quiz"} <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center space-y-6 py-6 animate-in fade-in">
              <Award className="mx-auto h-20 w-20 text-emerald-600" />
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                  Cultural Recall Complete!
                </h3>
                <p className="text-muted-foreground text-base">
                  You scored {quizScore} of {filteredItems.length} correct. Your recognition activity has been logged to your Cognitive Engagement Score.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 max-w-sm mx-auto text-left">
                <span className="text-xs font-bold text-muted-foreground uppercase">Domain Impact</span>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  Recognition + Cultural Connect (20% CES Domain)
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  onClick={startQuiz}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl gap-2"
                >
                  <RotateCcw className="h-4 w-4" /> Retake Quiz
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setQuizMode(false)}
                  className="rounded-2xl font-bold"
                >
                  Explore Cultural Gallery
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CULTURAL ITEMS GALLERY GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-xs">
                    {item.emoji}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                      {item.state}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        speakText(
                          `${item.name}. ${item.nativeName}. From ${item.state}. ${item.description}. ${item.culturalMemory}`,
                          speechLocale
                        )
                      }
                      className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-emerald-600 transition-colors"
                      title="Listen to story"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-foreground group-hover:text-emerald-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {item.nativeName}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border text-xs text-muted-foreground space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-rose-500" /> Fond Memory:
                  </div>
                  <p className="italic">{item.culturalMemory}</p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground capitalize">
                  Category: {item.category}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setActiveItem(item);
                    speakText(
                      `${item.name}. Memory cue: ${item.culturalMemory}. Question: ${item.question}`,
                      speechLocale
                    );
                  }}
                  className="text-xs font-black text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-xl"
                >
                  Recall Item ➔
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Detail Modal if activeItem */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="rounded-3xl border-2 border-emerald-500/40 bg-card p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{activeItem.emoji}</span>
                <div>
                  <h3 className="text-2xl font-black text-foreground">{activeItem.name}</h3>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {activeItem.nativeName} • {activeItem.state}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveItem(null)}
                className="font-bold text-base"
              >
                ✕
              </Button>
            </div>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {activeItem.description}
            </p>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
                <Heart className="h-4 w-4" /> Heartwarming Memory Reflection:
              </div>
              <p className="text-sm text-foreground italic leading-relaxed">
                "{activeItem.culturalMemory}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() =>
                  speakText(
                    `${activeItem.name}. ${activeItem.nativeName}. ${activeItem.description}. ${activeItem.culturalMemory}`,
                    speechLocale
                  )
                }
                className="rounded-2xl gap-2 font-bold text-xs"
              >
                <Volume2 className="h-4 w-4" /> Listen
              </Button>

              <Button
                onClick={() => {
                  setActiveItem(null);
                  startQuiz();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs gap-1.5"
              >
                Take Challenge <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
