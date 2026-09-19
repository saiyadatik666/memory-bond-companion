import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Clock,
  Volume2,
  Eye,
  EyeOff,
  Trophy,
  ArrowRight,
  Check,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

export interface RealMemoryGameProps {
  onComplete: (score: number, total: number, extra?: any) => void;
  onBackToHome?: () => void;
  onPlayAnother?: () => void;
  previousAccuracy?: number;
}

interface RecallItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

const ALL_CANDIDATE_ITEMS: RecallItem[] = [
  { id: "apple", name: "Red Apple", emoji: "🍎", category: "food" },
  { id: "tea", name: "Warm Chai", emoji: "☕", category: "drink" },
  { id: "keys", name: "Brass Key", emoji: "🔑", category: "object" },
  { id: "flower", name: "Lotus Flower", emoji: "🌸", category: "nature" },
  { id: "book", name: "Family Book", emoji: "📖", category: "daily" },
  { id: "bell", name: "Puja Bell", emoji: "🔔", category: "cultural" },
  { id: "watch", name: "Pocket Watch", emoji: "⌚", category: "daily" },
  { id: "diya", name: "Brass Diya", emoji: "🪔", category: "cultural" },
  { id: "glasses", name: "Reading Glasses", emoji: "👓", category: "daily" },
  { id: "bird", name: "Sparrow", emoji: "🐦", category: "nature" },
  { id: "mango", name: "Ripe Mango", emoji: "🥭", category: "food" },
  { id: "feather", name: "Peacock Quill", emoji: "🪶", category: "nature" },
];

export function RealMemoryRecallGame({
  onComplete,
  onBackToHome,
  onPlayAnother,
  previousAccuracy = 74,
}: RealMemoryGameProps) {
  const { t, speechLocale } = useI18n();

  // Stages: "memorize" -> "recall" -> "result"
  const [stage, setStage] = useState<"memorize" | "recall" | "result">("memorize");
  const [countdown, setCountdown] = useState<number>(5);

  // Targets (4 objects) and Choices (8 objects: 4 targets + 4 distractors)
  const [targets, setTargets] = useState<RecallItem[]>([]);
  const [choices, setChoices] = useState<RecallItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Performance tracking
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [resultData, setResultData] = useState<{
    correctCount: number;
    incorrectCount: number;
    accuracy: number;
    responseSeconds: number;
    adjustmentText: string;
    adjustmentType: "increased" | "maintained" | "reduced";
  } | null>(null);

  // Initialize targets and choices
  useEffect(() => {
    // Pick 4 targets
    const shuffled = [...ALL_CANDIDATE_ITEMS].sort(() => 0.5 - Math.random());
    const selectedTargets = shuffled.slice(0, 4);
    const distractors = shuffled.slice(4, 8);
    const combinedChoices = [...selectedTargets, ...distractors].sort(() => 0.5 - Math.random());

    setTargets(selectedTargets);
    setChoices(combinedChoices);
    setStage("memorize");
    setCountdown(5);
    setSelectedIds([]);
    setResultData(null);
  }, []);

  // Memorization countdown timer
  useEffect(() => {
    if (stage !== "memorize") return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Transition to recall stage
      setStage("recall");
      setStartTime(Date.now());
      try {
        speakText("Which objects did you see? Select the four objects you remember.", speechLocale);
      } catch {}
    }
  }, [countdown, stage, speechLocale]);

  const handleSkipMemorize = () => {
    setStage("recall");
    setStartTime(Date.now());
    try {
      speakText("Which objects did you see? Select the four objects you remember.", speechLocale);
    } catch {}
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCheckAnswers = () => {
    const responseSec = Math.max(2, Math.round((Date.now() - startTime) / 1000));
    setElapsedSeconds(responseSec);

    const targetIds = new Set(targets.map((t) => t.id));
    let correct = 0;
    let incorrect = 0;

    selectedIds.forEach((id) => {
      if (targetIds.has(id)) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const accuracy = Math.round((correct / 4) * 100);

    // AI Adaptive Difficulty computation
    let adjustmentType: "increased" | "maintained" | "reduced" = "maintained";
    let adjustmentText = "Difficulty maintained for your rhythm. Great steady participation!";

    if (accuracy >= 75) {
      adjustmentType = "increased";
      adjustmentText = "Difficulty increased slightly for your next activity based on your high accuracy.";
    } else if (accuracy < 50) {
      adjustmentType = "reduced";
      adjustmentText = "Difficulty reduced slightly for your next activity to ensure calm and relaxing engagement.";
    }

    const calculatedResult = {
      correctCount: correct,
      incorrectCount: incorrect,
      accuracy,
      responseSeconds: responseSec,
      adjustmentText,
      adjustmentType,
    };

    setResultData(calculatedResult);
    setStage("result");

    // Persist real interaction to store
    onComplete(correct, 4, {
      accuracy,
      responseTimeMs: responseSec * 1000,
      attempts: selectedIds.length,
      errors: incorrect,
      gameType: "memory",
      level: 2,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white border border-[#E2EAF5] shadow-xl p-6 sm:p-10 select-none animate-in fade-in duration-300">
      {/* =================================================================== */}
      {/* STAGE 1: MEMORIZE (Section 12: Show 4 objects for several seconds) */}
      {/* =================================================================== */}
      {stage === "memorize" && (
        <div className="space-y-6 text-center animate-in fade-in duration-200">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-3.5 py-1 rounded-full">
              Observation Phase
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F243E] font-display">
              Remember these 4 objects
            </h2>
            <p className="text-sm sm:text-base font-semibold text-[#5B728D]">
              Look carefully at these objects. They will hide in <span className="font-black text-purple-700">{countdown} seconds</span>.
            </p>
          </div>

          {/* 4 Objects Display (Section 12: 🍎 ☕ 🔑 🌸) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
            {targets.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-[#F8FAFD] border-2 border-purple-200/80 shadow-sm flex flex-col items-center justify-center gap-2 transform transition-transform hover:scale-105"
              >
                <span className="text-5xl sm:text-6xl">{item.emoji}</span>
                <span className="font-black text-sm text-[#0F243E] mt-1">{item.name}</span>
              </div>
            ))}
          </div>

          {/* Calm Countdown Indicator */}
          <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden max-w-xs mx-auto">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSkipMemorize}
              variant="outline"
              className="h-12 px-6 rounded-2xl font-bold text-sm cursor-pointer hover:border-purple-300"
            >
              <span>I Remember Them Now</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STAGE 2: RECALL (Section 12: Show 8 choices, select what was seen)  */}
      {/* =================================================================== */}
      {stage === "recall" && (
        <div className="space-y-6 text-center animate-in fade-in duration-200">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
              Recall Phase
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F243E] font-display">
              Which objects did you see?
            </h2>
            <p className="text-sm font-semibold text-[#5B728D]">
              Tap the 4 objects that were shown on the previous screen.
            </p>
          </div>

          {/* Selection counter badge */}
          <div className="inline-flex items-center gap-2 text-xs font-black px-4 py-1.5 rounded-full bg-secondary text-foreground">
            <span>Selected: {selectedIds.length} of 4</span>
          </div>

          {/* 8 Choices Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 py-2">
            {choices.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  className={`p-4 rounded-3xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 min-h-[110px] ${
                    isSelected
                      ? "bg-primary/15 border-primary shadow-md scale-103"
                      : "bg-[#F8FAFD] border-[#E2EAF5] hover:bg-[#F0F5FB]"
                  }`}
                >
                  <div className="relative">
                    <span className="text-4xl sm:text-5xl">{item.emoji}</span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-[#0F243E] mt-1">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <Button
              size="lg"
              onClick={handleCheckAnswers}
              disabled={selectedIds.length === 0}
              className="w-full sm:w-auto h-14 px-10 rounded-2xl font-black text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-2 cursor-pointer"
            >
              <span>Submit My Answer</span>
              <CheckCircle2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STAGE 3: RESULT SCREEN (Sections 14 & 15: AI Adaptive Difficulty)    */}
      {/* =================================================================== */}
      {stage === "result" && resultData && (
        <div className="space-y-6 text-center animate-in fade-in duration-300">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center text-3xl shadow-xs">
              🎉
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F243E] font-display">
              Great job! 🎉
            </h2>
            <p className="text-sm font-semibold text-[#5B728D]">
              Activity completed successfully. Your real interaction results are recorded below:
            </p>
          </div>

          {/* 3 Metric Summary Badges (Section 15: Score, Correct, Response Time) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="text-2xl sm:text-3xl font-black text-purple-700 font-display">
                {resultData.accuracy}%
              </div>
              <div className="text-xs font-bold text-purple-900 mt-0.5">Score</div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
              <div className="text-2xl sm:text-3xl font-black text-teal-700 font-display">
                {resultData.correctCount} / 4
              </div>
              <div className="text-xs font-bold text-teal-900 mt-0.5">Correct</div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
              <div className="text-2xl sm:text-3xl font-black text-sky-700 font-display">
                {resultData.responseSeconds}s
              </div>
              <div className="text-xs font-bold text-sky-900 mt-0.5">Response Time</div>
            </div>
          </div>

          {/* TRANSPARENT AI ACTIVITY ADJUSTMENT (Section 14 Core Requirement) */}
          <div className="p-5 rounded-3xl bg-[#F0F7FF] border-2 border-[#BAE6FD] text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" />
                <span>AI Activity Adjustment</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                Non-diagnostic engagement adaptation
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center py-1 border-y border-[#D0E2FF]/60">
              <div>
                <div className="text-xs font-bold text-[#5B728D]">Previous Performance</div>
                <div className="text-xl font-black text-[#0F243E]">{previousAccuracy}%</div>
              </div>
              <div>
                <div className="text-xs font-bold text-[#5B728D]">Current Performance</div>
                <div className="text-xl font-black text-primary">{resultData.accuracy}%</div>
              </div>
            </div>

            <div className="text-xs sm:text-sm font-bold text-[#0F243E] flex items-start gap-2 pt-1">
              <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>AI Recommendation: “{resultData.adjustmentText}”</span>
            </div>
          </div>

          {/* Action Buttons (Section 15: Play Another / Back to Home) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onPlayAnother && (
              <Button
                size="lg"
                onClick={onPlayAnother}
                className="w-full sm:w-auto h-13 px-7 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                <span>Play Another Activity</span>
              </Button>
            )}

            {onBackToHome && (
              <Button
                variant="outline"
                size="lg"
                onClick={onBackToHome}
                className="w-full sm:w-auto h-13 px-7 rounded-2xl font-black text-sm cursor-pointer"
              >
                <span>Back to Home</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
