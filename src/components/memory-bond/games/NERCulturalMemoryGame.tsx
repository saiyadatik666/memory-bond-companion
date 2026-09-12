import { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Eye,
  Clock,
  Volume2,
  Award,
  Compass,
  ArrowRight,
  HelpCircle,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";
import { NER_CULTURAL_CATALOG, type CulturalItemDetail } from "@/lib/nerCulturalRepository";

export interface NERCulturalMemoryGameProps {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  nerState?: string;
  adaptiveDifficulty?: "easy" | "medium" | "challenging";
  cycleNumber?: number;
  cycleSeed?: number;
}

export function NERCulturalMemoryGame({
  onComplete,
  level = 1,
  nerState = "all",
  adaptiveDifficulty = "medium",
  cycleNumber = 1,
  cycleSeed = 0,
}: NERCulturalMemoryGameProps) {
  const { lang, speechLocale } = useI18n();

  // Phase: "memorize" -> "test" -> "result"
  const [phase, setPhase] = useState<"memorize" | "test" | "result">("memorize");
  const [secondsLeft, setSecondsLeft] = useState<number>(7);
  const [testMode, setTestMode] = useState<"first" | "last" | "missing">("first");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(1);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const timerRef = useRef<any>(null);

  // Filter cultural catalog by state if applicable
  const availableItems = useMemo(() => {
    let pool = NER_CULTURAL_CATALOG;
    if (nerState && nerState !== "all") {
      const stateFiltered = pool.filter((item) => item.state.toLowerCase() === nerState.toLowerCase());
      if (stateFiltered.length >= 5) pool = stateFiltered;
    }
    return pool;
  }, [nerState]);

  // 30 Levels progression for elderly:
  // L1-5: 3 items (8s base)
  // L6-10: 4 items (7s base)
  // L11-15: 5 items (6s base)
  // L16-20: 6 items (6s base)
  // L21-25: 7 items (5s base)
  // L26-30: 8 items (5s base)
  const itemCount =
    level <= 5 ? 3 :
    level <= 10 ? 4 :
    level <= 15 ? 5 :
    level <= 20 ? 6 :
    level <= 25 ? 7 : 8;

  const baseObsTime = Math.max(
    4,
    (level <= 5 ? 8 : level <= 10 ? 7 : level <= 20 ? 6 : 5) +
      (adaptiveDifficulty === "easy" ? 2 : adaptiveDifficulty === "challenging" ? -1 : 0)
  );

  // Pick unique items for this round rotated with 8-day cycle offset
  const targetItems = useMemo(() => {
    const cycleOffset = ((cycleNumber - 1) * 3 + (level - 1) * 2) % Math.max(1, availableItems.length);
    const rotated = [...availableItems.slice(cycleOffset), ...availableItems.slice(0, cycleOffset)];
    const shuffled = [...rotated].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, itemCount);
  }, [availableItems, itemCount, level, cycleNumber]);

  // For "missing" mode, remove 1 item; for "first"/"last", use corresponding index
  const missingItem = useMemo(() => {
    return targetItems[Math.floor(Math.random() * targetItems.length)] || targetItems[0];
  }, [targetItems]);

  const shownItemsAfterHide = useMemo(() => {
    return targetItems.filter((it) => it.id !== missingItem.id);
  }, [targetItems, missingItem]);

  // Options pool for the test question
  const questionOptions = useMemo(() => {
    const correctItem =
      testMode === "first" ? targetItems[0] :
      testMode === "last" ? targetItems[targetItems.length - 1] :
      missingItem;

    const others = availableItems
      .filter((it) => it.id !== correctItem.id)
      .slice(0, 3);
    return [correctItem, ...others].sort(() => 0.5 - Math.random());
  }, [availableItems, targetItems, missingItem, testMode]);

  // Start observation timer
  useEffect(() => {
    setPhase("memorize");
    setSecondsLeft(baseObsTime);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setStartTime(Date.now());

    // Alternate test mode across the 30 levels:
    // Levels 1-10: alternating "first" and "missing"
    // Levels 11-20: alternating "first", "last", and "missing"
    // Levels 21-30: alternating "last", "missing", "first"
    if (level <= 10) {
      setTestMode(level % 2 === 1 ? "first" : "missing");
    } else if (level <= 20) {
      const m = level % 3;
      setTestMode(m === 0 ? "last" : m === 1 ? "first" : "missing");
    } else {
      const m = level % 3;
      setTestMode(m === 0 ? "missing" : m === 1 ? "last" : "first");
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase("test");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [level, baseObsTime]);

  const handleSelectOption = (item: CulturalItemDetail) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(item.id);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;

    const correctItem =
      testMode === "first" ? targetItems[0] :
      testMode === "last" ? targetItems[targetItems.length - 1] :
      missingItem;
    const correct = selectedAnswer === correctItem.id;
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    const completionTimeMs = Date.now() - startTime;
    const score = correct ? 1 : 0;

    const voiceMsg = correct
      ? `Wonderful recall! You recognized the ${correctItem.name} correctly.`
      : `That was close! The correct object was the ${correctItem.name}.`;
    speakText(voiceMsg, speechLocale);

    onComplete(score, 1, {
      gameType: "cultural",
      accuracy: correct ? 100 : 0,
      responseTimeMs: completionTimeMs,
      attempts,
      level,
    });
  };

  const correctTarget =
    testMode === "first" ? targetItems[0] :
    testMode === "last" ? targetItems[targetItems.length - 1] :
    missingItem;

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-card-foreground">
      {/* Game Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/15 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" /> NER Cultural Memory
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              Level {level}
            </span>
          </div>
          <h3 className="text-2xl font-black text-foreground mt-1">
            Remember These Objects (বস্তু মনত ৰখা)
          </h3>
        </div>

        {phase === "memorize" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 font-black text-sm animate-pulse">
            <Clock className="h-4 w-4" /> {secondsLeft}s remaining
          </div>
        )}
      </div>

      {/* PHASE 1: OBSERVATION / MEMORIZE */}
      {phase === "memorize" && (
        <div className="space-y-5 animate-in fade-in">
          <div className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-2">
            <p className="text-base sm:text-lg font-bold text-foreground">
              Look carefully at these {targetItems.length} culturally familiar objects from the North East:
            </p>
            <p className="text-xs text-muted-foreground font-semibold">
              Notice the order from left to right. They will hide in a few seconds!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {targetItems.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl border-2 border-border bg-card p-4 text-center space-y-2 shadow-xs hover:border-primary transition-all"
              >
                <div className="text-4xl">{item.icon}</div>
                <div className="text-xs font-black text-foreground leading-tight">
                  {item.name}
                </div>
                {item.nativeName && (
                  <div className="text-[10px] font-semibold text-emerald-600">
                    {item.nativeName}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground font-bold">
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 2: TEST QUESTION */}
      {phase === "test" && (
        <div className="space-y-6 animate-in zoom-in-95">
          <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-center space-y-2">
            <h4 className="text-xl sm:text-2xl font-black text-foreground">
              {testMode === "first"
                ? "Which object was placed FIRST on the tray?"
                : testMode === "last"
                ? "Which object was placed LAST on the tray?"
                : "Which object is MISSING from the tray?"}
            </h4>
            <p className="text-sm font-semibold text-muted-foreground">
              {testMode === "first"
                ? "Recall the very first item you observed on the left (#1)."
                : testMode === "last"
                ? `Recall the very last item you observed on the right (#${targetItems.length}).`
                : "One item has been removed from the cultural tray."}
            </p>
          </div>

          {/* Tray display for missing mode */}
          {testMode === "missing" && (
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                Remaining Tray Objects:
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {shownItemsAfterHide.map((it) => (
                  <div
                    key={it.id}
                    className="px-3 py-2 rounded-xl bg-card border border-border flex items-center gap-2 text-sm font-bold shadow-xs"
                  >
                    <span className="text-2xl">{it.icon}</span>
                    <span>{it.name}</span>
                  </div>
                ))}
                <div className="px-4 py-2 rounded-xl border-2 border-dashed border-primary/40 text-primary font-black text-sm flex items-center gap-1.5 animate-pulse">
                  <HelpCircle className="h-4 w-4" /> ? (Missing)
                </div>
              </div>
            </div>
          )}

          {/* Multiple Choice Options */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
              Tap your answer below:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {questionOptions.map((opt) => {
                const isChosen = selectedAnswer === opt.id;
                const showSuccess = isAnswerChecked && opt.id === correctTarget.id;
                const showWrong = isAnswerChecked && isChosen && !isCorrect;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-2xl border-2 text-left flex items-center gap-3.5 transition-all cursor-pointer shadow-xs ${
                      showSuccess
                        ? "border-success bg-success/15 font-black ring-2 ring-success"
                        : showWrong
                        ? "border-destructive bg-destructive/15 font-black"
                        : isChosen
                        ? "border-primary bg-primary/15 ring-2 ring-primary font-black"
                        : "border-border bg-card hover:border-primary/50 font-bold"
                    }`}
                  >
                    <span className="text-3xl shrink-0">{opt.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-base text-foreground truncate">{opt.name}</div>
                      {opt.nativeName && (
                        <div className="text-xs text-muted-foreground">{opt.nativeName}</div>
                      )}
                    </div>
                    {showSuccess && <Check className="h-6 w-6 text-success shrink-0" />}
                    {showWrong && <X className="h-6 w-6 text-destructive shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirmation & Evaluation */}
          {!isAnswerChecked ? (
            <Button
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer}
              className="w-full h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
            >
              <Check className="h-5 w-5 mr-2" /> Confirm Answer (উত্তর পৰীক্ষা কৰক)
            </Button>
          ) : (
            <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 text-center space-y-3 animate-in zoom-in-95">
              <div className="text-3xl">{isCorrect ? "🌟" : "🌸"}</div>
              <h5 className="text-xl font-black text-foreground">
                {isCorrect ? "Excellent Recall!" : "Good Try!"}
              </h5>
              <p className="text-sm font-semibold text-muted-foreground">
                {isCorrect
                  ? `You remembered the ${correctTarget.name} correctly.`
                  : `The correct object was the ${correctTarget.name} (${correctTarget.nativeName || ""}).`}
              </p>
              <p className="text-xs font-bold text-muted-foreground">
                {correctTarget.reminiscenceStory}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
