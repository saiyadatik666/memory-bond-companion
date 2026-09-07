import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";

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
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const games = [
    {
      id: "card_match",
      title: "Memory Card Match",
      description: "Flip peaceful cards and find identical pairs.",
      icon: Layers,
      color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      component: MemoryCardMatch,
    },
    {
      id: "object_recall",
      title: "Object Recall",
      description: "Memorize everyday items and recall which appeared.",
      icon: Search,
      color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
      component: ObjectRecall,
    },
    {
      id: "pattern_recall",
      title: "Pattern Recall",
      description: "Watch soothing light sequences and repeat the pattern.",
      icon: Sparkles,
      color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      component: PatternRecall,
    },
    {
      id: "sequence_memory",
      title: "Number Sequence Memory",
      description: "Remember short number sequences and enter them.",
      icon: Hash,
      color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      component: SequenceMemory,
    },
    {
      id: "routine_recall",
      title: "Daily Routine Recall",
      description: "Questions reinforcing healthy and peaceful daily habits.",
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
      store.recordGameSession(activeGame, score, total, "easy");
    }
  };

  const selectedGameObj = games.find((g) => g.id === activeGame);

  return (
    <div className="space-y-6">
      {/* Statutory Medical Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-foreground text-sm">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Engagement Purpose Only: </span>
          Memory Bond cognitive games are designed for enjoyable memory stimulation and companion engagement. They are
          strictly not a medical diagnostic or dementia treatment tool.
        </div>
      </div>

      {activeGame && selectedGameObj ? (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setActiveGame(null)}
            className="gap-2 text-foreground font-bold text-base hover:bg-secondary/60"
          >
            <ArrowLeft className="h-5 w-5" /> Back to All Memory Games
          </Button>

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
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-card border border-border px-5 py-3 shadow-xs text-center">
                <div className="text-2xl font-black text-primary">{store.gameSessions.length}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Activities Played</div>
              </div>
            </div>
          </div>

          {/* 10 Games Grid */}
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
                    <span>Play Activity</span>
                    <span className="text-lg">→</span>
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
