import { useState, useMemo } from "react";
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
  Link,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
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

export function CognitiveGamesHub({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale } = useI18n();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "challenging">("easy");

  // Calculate Adaptive Recommendation based on recent sessions
  const adaptiveSuggestion = useMemo(() => {
    if (store.gameSessions.length < 3) return null;
    const recent = store.gameSessions.slice(-3);
    const avgRatio = recent.reduce((sum, s) => sum + (s.total > 0 ? s.score / s.total : 1), 0) / recent.length;

    if (avgRatio >= 0.85 && difficulty === "easy") {
      return {
        message: "You have been performing wonderfully! Try Medium difficulty for a gentle new stimulus.",
        target: "medium" as const,
      };
    }
    if (avgRatio <= 0.45 && difficulty !== "easy") {
      return {
        message: "Relax and enjoy. Let's switch back to Easy mode for calm and comfortable play.",
        target: "easy" as const,
      };
    }
    return null;
  }, [store.gameSessions, difficulty]);

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
      title: "Object Recall",
      description: "Memorize everyday cultural items and recall which appeared.",
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
      icon: Link,
      color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      component: MatchTheObject,
    },
  ];

  const handleGameComplete = (score: number, total: number) => {
    if (activeGame) {
      store.recordGameSession(activeGame, score, total, difficulty);
      speakText(`${t("wellDone") || "Well done!"} Score: ${score} of ${total}.`, speechLocale);
    }
  };

  const selectedGameObj = games.find((g) => g.id === activeGame);

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
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setActiveGame(null)}
              className="gap-2 text-foreground font-bold text-base hover:bg-secondary/60"
            >
              <ArrowLeft className="h-5 w-5" /> Back to All 10 Games
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Current Level:</span>
              <span className="rounded-full bg-primary/15 text-primary font-bold px-3 py-1 text-xs uppercase">
                {difficulty}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 sm:p-8 shadow-sm">
            <selectedGameObj.component onComplete={handleGameComplete} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
                <Gamepad2 className="h-8 w-8 text-primary" /> Cognitive Gaming Center
              </h2>
              <p className="text-muted-foreground mt-1 text-base">
                10 gentle, senior-friendly exercises with no stressful timers.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Adaptive Difficulty Switcher */}
              <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-xs">
                {(["easy", "medium", "challenging"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      difficulty === lvl
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-card border border-border px-5 py-2.5 shadow-xs text-center">
                <div className="text-xl font-black text-primary">{store.gameSessions.length}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Played</div>
              </div>
            </div>
          </div>

          {/* Adaptive Feedback Recommendation Banner if available */}
          {adaptiveSuggestion && (
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/10 p-4 flex items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary shrink-0" />
                <p className="text-sm font-semibold text-foreground">{adaptiveSuggestion.message}</p>
              </div>
              <Button
                size="sm"
                onClick={() => setDifficulty(adaptiveSuggestion.target)}
                className="font-bold rounded-xl shrink-0"
              >
                Switch to {adaptiveSuggestion.target}
              </Button>
            </div>
          )}

          {/* 10 Games Grid (All 10 Games Preserved & Accessible) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {games.map((g, idx) => {
              const Icon = g.icon;
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGame(g.id)}
                  className="group relative rounded-3xl border-2 border-border bg-card p-6 text-left shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-[0.98] flex flex-col justify-between h-56"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${g.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-muted-foreground">
                        Game #{idx + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {g.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{g.description}</p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-sm font-bold text-primary">
                    <span>{t("play") || "Play Activity"}</span>
                    <span className="text-lg">➔</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
