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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MemoryBondStore, getRecommendedDifficulty } from "@/lib/memoryBondStore";
import { useI18n, getMotivationalFeedback } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

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
  const { t, speechLocale, lang } = useI18n();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "challenging">("easy");

  // In-game progression state
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [highestLevel, setHighestLevel] = useState<number>(1);
  const [bestScore, setBestScore] = useState<number>(0);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(1);
  const [gameStage, setGameStage] = useState<"playing" | "completed">("playing");
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [lastResult, setLastResult] = useState<LastGameResult | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showAiLoop, setShowAiLoop] = useState<boolean>(false);

  // Dynamic Difficulty Adaptation Engine from MemoryBondStore
  const adaptiveRecommendation = useMemo(() => {
    return getRecommendedDifficulty(activeGame || "", store.gameSessions, difficulty);
  }, [activeGame, store.gameSessions, difficulty]);

  const games = [
    {
      id: "card_match",
      title: "Memory Card Match",
      description: "Flip peaceful cards and find identical matching pairs.",
      icon: Layers,
      color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      component: MemoryCardMatch,
    },
    {
      id: "object_recall",
      title: "Keepsake Memory Tray",
      description: "Observe cherished Indian keepsakes on the tray and spot the mystery change.",
      icon: Search,
      color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
      component: ObjectRecall,
    },
    {
      id: "pattern_recall",
      title: "Pattern Recall",
      description: "Watch soothing visual sequences and repeat the pattern.",
      icon: Sparkles,
      color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      component: PatternRecall,
    },
    {
      id: "sequence_memory",
      title: "Number Sequence Memory",
      description: "Remember short number sequences and enter them calmly.",
      icon: Hash,
      color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      component: SequenceMemory,
    },
    {
      id: "routine_recall",
      title: "Daily Routine Recall",
      description: "Gentle reflections reinforcing healthy daily habits.",
      icon: Sun,
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      component: RoutineRecall,
    },
    {
      id: "family_photo",
      title: "Family Photo Memory",
      description: "Familiar faces and heartwarming family relationships.",
      icon: Users,
      color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      component: FamilyPhotoMemory,
    },
    {
      id: "voice_quiz",
      title: "Voice Memory Quiz",
      description: "Listen to audio cues and answer simple recall questions.",
      icon: Volume2,
      color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      component: VoiceMemoryQuiz,
    },
    {
      id: "find_difference",
      title: "Visual Attention (Odd One Out)",
      description: "Calm visual search for the slightly different item.",
      icon: Eye,
      color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
      component: FindDifference,
    },
    {
      id: "word_memory",
      title: "Word Memory Recall",
      description: "Short, pleasant word lists for focused memorization.",
      icon: BookOpen,
      color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      component: WordMemory,
    },
    {
      id: "match_object",
      title: "Match the Object",
      description: "Connect household items with their functional partners.",
      icon: LinkIcon,
      color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      component: MatchTheObject,
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
    else if (activeGame === "sequence_memory" || activeGame === "word_memory" || activeGame === "card_match") gameType = "memory";

    // Record session to central MemoryBondStore with level and cycle tracking
    const diffTag = currentLevel <= 10 ? "easy" : currentLevel <= 20 ? "medium" : "challenging";
    store.recordGameSession(activeGame, score, total, diffTag, {
      gameType,
      accuracy: acc,
      level: currentLevel,
      cycleNumber: store.cycleInfo?.cycleNumber,
      ...extra,
    });

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

          {/* GAME STAGE: PLAYING vs COMPLETED RESULT */}
          {gameStage === "playing" ? (
            <div className="rounded-3xl border border-border bg-card p-4 sm:p-8 shadow-sm">
              <selectedGameObj.component
                key={`${activeGame}_lvl_${currentLevel}_${attemptCount}_${store.profile.selected_state || store.profile.selected_ner_state || "all"}_cycle_${store.cycleInfo.cycleNumber}`}
                level={currentLevel}
                onComplete={handleGameComplete}
                nerState={store.profile.selected_state || store.profile.selected_ner_state || "all"}
                memoryCues={store.memoryCues}
                contacts={store.contacts}
                cycleNumber={store.cycleInfo.cycleNumber}
                cycleSeed={store.cycleInfo.cycleNumber * 7919}
                adaptiveDifficulty={adaptiveRecommendation.recommended}
              />
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
                          <ArrowLeft className="h-5 w-5 mr-1" /> All 10 Games
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
                    const isCurrent = step.status === "in_progress";
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
                        Best Performance Window: <strong className="text-foreground">{store.personalizationInsights.preferredFocusWindow}</strong> • 
                        Avg Session: <strong>{store.personalizationInsights.avgSessionDurationMinutes} mins</strong> • 
                        Trend: <strong className="capitalize text-emerald-700 dark:text-emerald-300">{store.personalizationInsights.performanceTrend}</strong>
                      </p>
                    </div>
                    {store.personalizationInsights.favoriteGames.length > 0 && (
                      <span className="text-muted-foreground">
                        Favorite Game: <strong className="text-foreground">{store.personalizationInsights.favoriteGames[0].name}</strong>
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

          {/* 10 Games Grid (All 10 Games Preserved, Complete & Progress-tracked) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {games.map((g, idx) => {
              const Icon = g.icon;
              const prog = getGameProgress(g.id);
              return (
                <div
                  key={g.id}
                  className="group relative rounded-3xl border-2 border-border bg-card p-6 text-left shadow-xs transition-all hover:border-primary hover:shadow-md flex flex-col justify-between h-64"
                >
                  <div onClick={() => handleSelectGame(g.id)} className="cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${g.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(`${g.title}. ${g.description}`, speechLocale);
                          }}
                          className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          title="Read aloud"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-primary/15 text-primary">
                          Lvl {prog.high}/30
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {g.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                      {g.description}
                    </p>
                  </div>

                  <div
                    onClick={() => handleSelectGame(g.id)}
                    className="pt-3 border-t border-border/60 flex items-center justify-between text-sm font-bold text-primary cursor-pointer"
                  >
                    <span className="text-xs text-muted-foreground font-semibold">
                      {prog.best > 0 ? `Best: ${prog.best}%` : "Ready to Play"}
                    </span>
                    <span className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                      <span>{t("play") || "Play Level"} {prog.cur}</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
