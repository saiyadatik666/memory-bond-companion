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
  Brain,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MemoryBondStore, getRecommendedDifficulty } from "@/lib/memoryBondStore";
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

export function CognitiveGamesHub({
  store,
  onNavigate,
}: {
  store: MemoryBondStore;
  onNavigate?: (tab: string) => void;
}) {
  const { t, speechLocale } = useI18n();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "challenging">("easy");

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

  const handleGameComplete = (score: number, total: number, extra?: any) => {
    if (activeGame) {
      let gameType: "memory" | "attention" | "recognition" | "recall" | "cultural" = "memory";
      if (activeGame === "pattern_recall" || activeGame === "find_difference") gameType = "attention";
      else if (activeGame === "match_object" || activeGame === "family_photo") gameType = "recognition";
      else if (activeGame === "object_recall" || activeGame === "routine_recall" || activeGame === "voice_quiz") gameType = "recall";
      else if (activeGame === "sequence_memory" || activeGame === "word_memory" || activeGame === "card_match") gameType = "memory";

      store.recordGameSession(activeGame, score, total, difficulty, {
        gameType,
        accuracy: total > 0 ? Math.round((score / total) * 100) : 100,
        ...extra,
      });
      speakText(`${t("wellDone") || "Well done!"} Score: ${score} of ${total}.`, speechLocale);
    }
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
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setActiveGame(null)}
              className="gap-2 text-foreground font-bold text-base hover:bg-secondary/60"
            >
              <ArrowLeft className="h-5 w-5" /> Back to All 10 Games
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  speakText(`${selectedGameObj.title}. ${selectedGameObj.description}`, speechLocale)
                }
                className="rounded-2xl gap-2 font-bold text-xs h-10 px-4 text-primary border-primary/30 hover:bg-primary/10"
                title="Hear game instructions read aloud"
              >
                <Volume2 className="h-4 w-4" /> Listen to Instructions
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Current Level:</span>
                <span className="rounded-full bg-primary/15 text-primary font-bold px-3 py-1 text-xs uppercase">
                  {difficulty}
                </span>
              </div>
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
              {/* Difficulty Switcher */}
              <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-xs">
                {(["easy", "medium", "challenging"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      difficulty === lvl
                        ? "bg-primary text-primary-foreground shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </button>
                ))}
              </div>

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

          {/* Dynamic Difficulty Adaptation Banner */}
          <div className="rounded-3xl border-2 border-primary/30 bg-primary/10 p-5 flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3 max-w-xl">
              <TrendingUp className="h-6 w-6 text-primary shrink-0" />
              <div>
                <div className="text-xs font-black text-primary uppercase tracking-wider">
                  AI Adaptive Difficulty Recommendation
                </div>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {adaptiveRecommendation.rationale} Suggested: {adaptiveRecommendation.recommended.toUpperCase()} (Progression: {adaptiveRecommendation.nextItemsCount} target items).
                </p>
              </div>
            </div>
            {adaptiveRecommendation.recommended !== difficulty && (
              <Button
                size="sm"
                onClick={() => setDifficulty(adaptiveRecommendation.recommended)}
                className="font-black rounded-xl text-xs"
              >
                Switch to {adaptiveRecommendation.recommended.toUpperCase()}
              </Button>
            )}
          </div>

          {/* Quick Cultural Connect Banner */}
          {onNavigate && (
            <div className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl">
                  🌸
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground">
                    Try North Eastern Cultural Heritage Recall
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Recall familiar Assamese and North East items (Jaapi, Gamosa, Kaji Nemu) to boost your CES Recognition domain.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onNavigate("cultural")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs"
              >
                Open Heritage Hub ➔
              </Button>
            </div>
          )}

          {/* 10 Games Grid (All 10 Games Preserved & Accessible) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {games.map((g, idx) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.id}
                  className="group relative rounded-3xl border-2 border-border bg-card p-6 text-left shadow-xs transition-all hover:border-primary hover:shadow-md flex flex-col justify-between h-56"
                >
                  <div onClick={() => setActiveGame(g.id)} className="cursor-pointer">
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
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-muted-foreground">
                          Game #{idx + 1}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {g.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{g.description}</p>
                  </div>

                  <div
                    onClick={() => setActiveGame(g.id)}
                    className="pt-3 border-t border-border/60 flex items-center justify-between text-sm font-bold text-primary cursor-pointer"
                  >
                    <span>{t("play") || "Play Activity"}</span>
                    <span className="text-lg">➔</span>
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
