import { useState, useEffect, useRef } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Clock, Volume2, Home, MapPin, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Senior-friendly household location spots
export interface HouseholdSpot {
  id: string;
  name: string;
  hindiName: string;
  icon: string;
  color: string;
  bgLight: string;
  borderLight: string;
}

const HOUSEHOLD_SPOTS: HouseholdSpot[] = [
  {
    id: "bedside",
    name: "Bedside Table",
    hindiName: "पलंग के पास की मेज",
    icon: "🛏️",
    color: "text-indigo-600 dark:text-indigo-400",
    bgLight: "bg-indigo-50 dark:bg-indigo-950/30",
    borderLight: "border-indigo-200 dark:border-indigo-800",
  },
  {
    id: "puja",
    name: "Puja Shelf / Mandir",
    hindiName: "पूजा का स्थान",
    icon: "🪔",
    color: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    borderLight: "border-amber-200 dark:border-amber-800",
  },
  {
    id: "desk",
    name: "Reading Desk",
    hindiName: "पढ़ने की मेज",
    icon: "📚",
    color: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    borderLight: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "kitchen",
    name: "Kitchen Counter",
    hindiName: "रसोई का शेल्फ",
    icon: "🍲",
    color: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
    borderLight: "border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "veranda",
    name: "Veranda Bench",
    hindiName: "बरामदे की कुर्सी",
    icon: "🪑",
    color: "text-teal-600 dark:text-teal-400",
    bgLight: "bg-teal-50 dark:bg-teal-950/30",
    borderLight: "border-teal-200 dark:border-teal-800",
  },
  {
    id: "living",
    name: "Living Room Table",
    hindiName: "बैठक की मेज",
    icon: "🛋️",
    color: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
    borderLight: "border-purple-200 dark:border-purple-800",
  },
  {
    id: "wardrobe",
    name: "Wooden Wardrobe",
    hindiName: "अलमारी का दराज",
    icon: "🚪",
    color: "text-rose-600 dark:text-rose-400",
    bgLight: "bg-rose-50 dark:bg-rose-950/30",
    borderLight: "border-rose-200 dark:border-rose-800",
  },
  {
    id: "garden",
    name: "Balcony / Tulsi Pot",
    hindiName: "तुलसी चबूतरा / बालकनी",
    icon: "🪴",
    color: "text-green-600 dark:text-green-400",
    bgLight: "bg-green-50 dark:bg-green-950/30",
    borderLight: "border-green-200 dark:border-green-800",
  },
];

// Meaningful everyday cultural items that seniors frequently place around the home
const HOUSEHOLD_ITEMS = [
  { id: "glasses", icon: "👓", name: "Reading Glasses", hindiName: "पढ़ने का चश्मा" },
  { id: "keys", icon: "🔑", name: "House Keys", hindiName: "घर की चाबियां" },
  { id: "book", icon: "📖", name: "Holy Geeta / Book", hindiName: "धार्मिक पुस्तक" },
  { id: "diya", icon: "🪔", name: "Brass Diya", hindiName: "पीतल का दीया" },
  { id: "tea", icon: "🍵", name: "Cup of Chai", hindiName: "गरम चाय का प्याला" },
  { id: "stick", icon: "🦯", name: "Walking Stick", hindiName: "चलने की छड़ी" },
  { id: "radio", icon: "📻", name: "Vintage Radio", hindiName: "रेडियो" },
  { id: "watch", icon: "⌚", name: "Wrist Watch", hindiName: "हाथ की घड़ी" },
  { id: "pillbox", icon: "💊", name: "Medicine Box", hindiName: "दवाई की डिब्बी" },
  { id: "matka", icon: "🏺", name: "Clay Water Pot", hindiName: "मिट्टी का मटका" },
  { id: "bell", icon: "🔔", name: "Puja Bell", hindiName: "मंदिर की घंटी" },
  { id: "shawl", icon: "🧣", name: "Warm Shawl / Gamusa", hindiName: "मुलायम शॉल / गमोसा" },
  { id: "torch", icon: "🔦", name: "Night Torch", hindiName: "टॉर्च" },
  { id: "pen", icon: "🖊️", name: "Fountain Pen", hindiName: "पैन" },
  { id: "mala", icon: "📿", name: "Japa Mala", hindiName: "जप माला" },
  { id: "cap", icon: "🧢", name: "Sun Cap / Hat", hindiName: "धूप की टोपी" },
];

export interface ObjectRecallProps {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  nerState?: string;
  cycleNumber?: number;
  cycleSeed?: number;
  adaptiveDifficulty?: string;
}

interface Placement {
  item: typeof HOUSEHOLD_ITEMS[0];
  spot: HouseholdSpot;
}

export function ObjectRecall({
  onComplete,
  level = 1,
  nerState = "all",
  cycleNumber = 1,
  cycleSeed = 0,
  adaptiveDifficulty = "medium",
}: ObjectRecallProps) {
  const [phase, setPhase] = useState<"memorize" | "recall" | "result">("memorize");
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [availableSpots, setAvailableSpots] = useState<HouseholdSpot[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Array<{ itemId: string; selectedSpotId: string; isCorrect: boolean }>>([]);
  const [countdown, setCountdown] = useState<number>(10);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const recallStartRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());
  const [questionDurations, setQuestionDurations] = useState<number[]>([]);

  // 30 Gradual levels:
  // L1-5: 2 items across 3 candidate spots (very gentle introduction)
  // L6-10: 3 items across 4 candidate spots
  // L11-15: 3 items across 5 candidate spots (2 distractor spots)
  // L16-20: 4 items across 6 candidate spots
  // L21-25: 4 items across 7 candidate spots
  // L26-30: 5 items across 8 candidate spots
  const targetItemCount =
    level <= 5 ? 2 :
    level <= 10 ? 3 :
    level <= 15 ? 3 :
    level <= 20 ? 4 :
    level <= 25 ? 4 : 5;

  const candidateSpotCount =
    level <= 5 ? 3 :
    level <= 10 ? 4 :
    level <= 15 ? 5 :
    level <= 20 ? 6 :
    level <= 25 ? 7 : 8;

  const startRound = () => {
    // 8-Day content refresh rotation:
    // Cycle and level determine deterministic offsets so items and placements differ every cycle
    const itemOffset = ((level - 1) * 3 + (cycleNumber - 1) * 5 + cycleSeed) % HOUSEHOLD_ITEMS.length;
    const rotatedItems = [...HOUSEHOLD_ITEMS.slice(itemOffset), ...HOUSEHOLD_ITEMS.slice(0, itemOffset)];

    const spotOffset = ((level - 1) * 2 + (cycleNumber - 1) * 3) % HOUSEHOLD_SPOTS.length;
    const rotatedSpots = [...HOUSEHOLD_SPOTS.slice(spotOffset), ...HOUSEHOLD_SPOTS.slice(0, spotOffset)];

    const chosenSpots = rotatedSpots.slice(0, candidateSpotCount);
    // Shuffle spots order for the question options so it's not strictly predictable
    const activeSpots = [...chosenSpots].sort(() => Math.random() - 0.5);

    // Pick items to place
    const chosenItems = rotatedItems.slice(0, targetItemCount);

    // Assign each item to a unique spot among chosenSpots
    const spotPool = [...activeSpots].sort(() => Math.random() - 0.5);
    const newPlacements: Placement[] = chosenItems.map((item, idx) => ({
      item,
      spot: spotPool[idx],
    }));

    setPlacements(newPlacements);
    setAvailableSpots(activeSpots);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuestionDurations([]);

    // Senior-friendly observation timer:
    // Generous observation time based on items count, +35% for easy adaptive pace
    const baseSecs = Math.max(8, targetItemCount * 3 + 3);
    const memorizeSeconds = adaptiveDifficulty === "easy" ? Math.round(baseSecs * 1.35) : baseSecs;
    setCountdown(memorizeSeconds);
    setPhase("memorize");
  };

  useEffect(() => {
    startRound();
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [level, nerState, cycleNumber, adaptiveDifficulty]);

  // Memorize countdown timer
  useEffect(() => {
    if (phase !== "memorize") return;
    if (countdown <= 0) {
      setPhase("recall");
      recallStartRef.current = Date.now();
      questionStartRef.current = Date.now();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  // Voice narration for senior accessibility
  const speakPlacements = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const hindiScript = placements
      .map((p) => `${p.item.hindiName}, ${p.spot.hindiName} पर रखा है।`)
      .join(" ");

    const textToSpeak = `ध्यान से याद रखें: ${hindiScript}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.88; // Gentle, clear speed for seniors
    utterance.lang = "hi-IN";

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSpotSelect = (spotId: string) => {
    if (phase !== "recall") return;

    const currentPlacement = placements[currentQuestionIndex];
    if (!currentPlacement) return;

    const duration = Date.now() - questionStartRef.current;
    const isCorrect = currentPlacement.spot.id === spotId;

    const updatedAnswers = [
      ...answers,
      {
        itemId: currentPlacement.item.id,
        selectedSpotId: spotId,
        isCorrect,
      },
    ];
    const updatedDurations = [...questionDurations, duration];

    setAnswers(updatedAnswers);
    setQuestionDurations(updatedDurations);

    // If more questions remain in this level, advance
    if (currentQuestionIndex + 1 < placements.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      questionStartRef.current = Date.now();
    } else {
      // Completed all questions in round!
      finishRound(updatedAnswers, updatedDurations);
    }
  };

  const finishRound = (
    finalAnswers: Array<{ itemId: string; selectedSpotId: string; isCorrect: boolean }>,
    durations: number[]
  ) => {
    const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
    const errors = finalAnswers.filter((a) => !a.isCorrect).length;
    const accuracy = Math.round((correctCount / placements.length) * 100);
    const avgResponseTimeMs = Math.round(
      durations.reduce((a, b) => a + b, 0) / Math.max(1, durations.length)
    );

    setPhase("result");

    onComplete(correctCount, placements.length, {
      gameType: "spatial_vault",
      accuracy,
      responseTimeMs: avgResponseTimeMs,
      attempts: finalAnswers.length,
      errors,
      level,
      cycleNumber,
    });
  };

  const currentTargetPlacement = placements[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-amber-500/10 to-emerald-500/10 border border-primary/20 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/20 p-3 text-primary">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">Spatial Home Vault: Level {level} of 30</h3>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                Cycle {cycleNumber}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Remember where everyday items are kept in the home to strengthen spatial-episodic memory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={startRound} className="gap-2 rounded-xl">
            <RotateCcw className="h-4 w-4" /> Restart
          </Button>
        </div>
      </div>

      {/* PHASE 1: MEMORIZE / PLACE IN HOUSE */}
      {phase === "memorize" && (
        <div className="space-y-6 text-center py-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-6 py-2 text-base sm:text-lg font-bold text-primary">
              <Clock className="h-5 w-5 animate-pulse" /> Memorize Placement ({countdown}s)
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={speakPlacements}
              disabled={isSpeaking}
              className="gap-2 rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <Volume2 className={`h-4 w-4 ${isSpeaking ? "animate-bounce" : ""}`} />
              {isSpeaking ? "Speaking..." : "Listen Aloud"}
            </Button>
          </div>

          <p className="text-base text-foreground font-medium max-w-xl mx-auto">
            Take your time to observe where each item is resting in your home:
          </p>

          {/* Household room spots visual grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {availableSpots.map((spot) => {
              const placed = placements.find((p) => p.spot.id === spot.id);
              return (
                <div
                  key={spot.id}
                  className={`relative rounded-3xl border-2 p-5 text-left transition-all ${
                    placed
                      ? `${spot.bgLight} ${spot.borderLight} shadow-md ring-2 ring-primary/20 scale-[1.02]`
                      : "bg-card/60 border-dashed border-border/70 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{spot.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{spot.name}</h4>
                        <p className="text-xs text-muted-foreground">{spot.hindiName}</p>
                      </div>
                    </div>
                  </div>

                  {placed ? (
                    <div className="mt-3 rounded-2xl bg-card border border-border p-4 flex items-center gap-3 shadow-inner">
                      <span className="text-4xl">{placed.item.icon}</span>
                      <div>
                        <span className="block font-extrabold text-sm text-primary">{placed.item.name}</span>
                        <span className="text-xs text-muted-foreground">{placed.item.hindiName}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-muted-foreground/30 p-4 text-center">
                      <span className="text-xs text-muted-foreground italic">Spot is empty</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <p className="text-sm text-muted-foreground">Relax and take a breath. Items will hide when time expires.</p>
            <Button
              size="lg"
              onClick={() => {
                setPhase("recall");
                recallStartRef.current = Date.now();
                questionStartRef.current = Date.now();
              }}
              className="gap-2 rounded-2xl font-bold bg-primary text-primary-foreground shadow-md hover:scale-105 transition-transform"
            >
              I Remember! Start Recall <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PHASE 2: SPATIAL RECALL (SENIOR-FRIENDLY ONE-TOUCH RECALL) */}
      {phase === "recall" && currentTargetPlacement && (
        <div className="space-y-6 text-center py-2 max-w-3xl mx-auto">
          {/* Progress badge */}
          <div className="flex items-center justify-between text-sm text-muted-foreground px-4">
            <span className="font-semibold">
              Item {currentQuestionIndex + 1} of {placements.length}
            </span>
            <span className="font-bold text-primary">Level {level} Progress</span>
          </div>

          {/* Current Target item prompt */}
          <div className="rounded-3xl border-2 border-primary/40 bg-card p-6 shadow-md text-center space-y-3">
            <div className="inline-flex p-4 rounded-3xl bg-primary/10 text-6xl shadow-inner">
              {currentTargetPlacement.item.icon}
            </div>
            <div>
              <h4 className="text-2xl font-extrabold text-foreground">
                Where did you place the {currentTargetPlacement.item.name}?
              </h4>
              <p className="text-base font-medium text-muted-foreground mt-1">
                {currentTargetPlacement.item.hindiName} को आपने किस स्थान पर रखा था?
              </p>
            </div>
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            Tap the correct household spot below:
          </p>

          {/* Candidate spots to choose from */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availableSpots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => handleSpotSelect(spot.id)}
                className={`group rounded-3xl border-2 p-5 text-left transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm hover:shadow-lg ${spot.bgLight} ${spot.borderLight}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{spot.icon}</span>
                  <div>
                    <h5 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                      {spot.name}
                    </h5>
                    <p className="text-xs text-muted-foreground font-medium">{spot.hindiName}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 3: RESULT AND PERFORMANCE FEEDBACK */}
      {phase === "result" && (
        <div className="rounded-3xl border border-primary/30 bg-card p-8 text-center space-y-6 max-w-2xl mx-auto shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h4 className="text-3xl font-extrabold text-foreground">Memory Vault Completed!</h4>
            <p className="text-lg text-muted-foreground">
              You correctly recalled {answers.filter((a) => a.isCorrect).length} of {placements.length} household placements.
            </p>
          </div>

          {/* Performance stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-secondary/50 p-4 border border-border">
              <span className="text-xs text-muted-foreground font-medium">Accuracy</span>
              <p className="text-2xl font-black text-primary">
                {Math.round((answers.filter((a) => a.isCorrect).length / placements.length) * 100)}%
              </p>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-4 border border-border">
              <span className="text-xs text-muted-foreground font-medium">Avg Time</span>
              <p className="text-2xl font-black text-foreground">
                {(
                  questionDurations.reduce((a, b) => a + b, 0) /
                  Math.max(1, questionDurations.length) /
                  1000
                ).toFixed(1)}s
              </p>
            </div>
            <div className="rounded-2xl bg-secondary/50 p-4 border border-border">
              <span className="text-xs text-muted-foreground font-medium">Level</span>
              <p className="text-2xl font-black text-amber-500">{level} / 30</p>
            </div>
          </div>

          {/* Review of placed items */}
          <div className="space-y-2 text-left rounded-2xl bg-secondary/30 p-4 border border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Round Summary:</span>
            <div className="space-y-2">
              {placements.map((p) => {
                const ans = answers.find((a) => a.itemId === p.item.id);
                const isCorrect = ans?.isCorrect ?? false;
                const chosenSpot = availableSpots.find((s) => s.id === ans?.selectedSpotId);
                return (
                  <div
                    key={p.item.id}
                    className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span>{p.item.icon}</span>
                      <span className="font-semibold text-foreground">{p.item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Placed at: {p.spot.name}</span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                          <AlertCircle className="h-3 w-3" /> Chose {chosenSpot?.name || "None"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <Button size="lg" onClick={startRound} className="gap-2 font-bold px-8 cursor-pointer rounded-2xl">
              <Sparkles className="h-5 w-5" /> Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
