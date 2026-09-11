import { useState, useEffect, useRef } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCulturalWordsForMemory, type NERState } from "@/lib/nerCulturalRepository";

const DEFAULT_WORD_LEVELS = [
  {
    targets: ["Chai", "Book", "Smile"],
    choices: ["Chai", "Coffee", "Book", "Pen", "Smile", "Tears"],
  },
  {
    targets: ["River", "Morning", "Breeze", "Jasmine"],
    choices: ["River", "Ocean", "Morning", "Night", "Breeze", "Storm", "Jasmine", "Rose"],
  },
  {
    targets: ["Tea", "Temple", "Bell", "Sun", "Flower"],
    choices: ["Tea", "Juice", "Temple", "Palace", "Bell", "Drum", "Sun", "Moon", "Flower", "Grass"],
  },
  {
    targets: ["Bamboo", "Bihu", "Flute", "Mountain", "Stream", "Clouds"],
    choices: ["Bamboo", "Pine", "Bihu", "Diwali", "Flute", "Guitar", "Mountain", "Valley", "Stream", "Desert", "Clouds", "Dust"],
  },
  {
    targets: ["Harvest", "Paddy", "Song", "Sister", "Diya", "Porch", "Rain"],
    choices: ["Harvest", "Store", "Paddy", "Wheat", "Song", "Story", "Sister", "Cousin", "Diya", "Torch", "Porch", "Roof", "Rain", "Snow"],
  },
  {
    targets: ["Brahmaputra", "Sunrise", "Peace", "Family", "Health", "Harmony", "Wisdom", "Home"],
    choices: ["Brahmaputra", "Ganga", "Sunrise", "Sunset", "Peace", "War", "Family", "Crowd", "Health", "Pills", "Harmony", "Noise", "Wisdom", "School", "Home", "Office"],
  },
];

export function WordMemory({
  onComplete,
  level = 1,
  nerState = "all",
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  nerState?: string;
}) {
  const safeLevelIdx = Math.min(DEFAULT_WORD_LEVELS.length - 1, Math.max(0, level - 1));
  const defaultCurrent = DEFAULT_WORD_LEVELS[safeLevelIdx] || DEFAULT_WORD_LEVELS[0];

  const targetCount = Math.min(8, Math.max(3, level + 2));
  const culturalWords = getCulturalWordsForMemory((nerState as NERState) || "all", targetCount);
  const targets = culturalWords.length >= targetCount ? culturalWords : defaultCurrent.targets;

  // Build choices pool
  const choices = Array.from(new Set([...targets, ...defaultCurrent.choices])).sort(() => Math.random() - 0.5);

  const [phase, setPhase] = useState<"read" | "recall" | "result">("read");
  const [countdown, setCountdown] = useState<number>(6);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const recallStartRef = useRef<number>(Date.now());

  const startLevel = () => {
    setSelectedWords([]);
    setCountdown(6);
    setPhase("read");
  };

  useEffect(() => {
    startLevel();
  }, [level, nerState]);

  useEffect(() => {
    if (phase !== "read") return;
    if (countdown <= 0) {
      setPhase("recall");
      recallStartRef.current = Date.now();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  const toggleWord = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else {
      if (selectedWords.length < targets.length) {
        setSelectedWords([...selectedWords, word]);
      }
    }
  };

  const handleCheck = () => {
    const correctCount = selectedWords.filter((w) => targets.includes(w)).length;
    const errors = selectedWords.filter((w) => !targets.includes(w)).length;
    const accuracy = Math.round((correctCount / targets.length) * 100);
    const elapsedMs = Math.max(1500, Date.now() - recallStartRef.current);

    setPhase("result");
    onComplete(correctCount, targets.length, {
      gameType: "memory",
      accuracy,
      responseTimeMs: Math.round(elapsedMs / Math.max(1, selectedWords.length)),
      attempts: selectedWords.length,
      errors,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 9: Word Memory Recall (Level {level})</h3>
          <p className="text-sm text-muted-foreground">Read and remember the calm words, then pick them out from the list.</p>
        </div>
        <Button variant="outline" onClick={startLevel} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Restart
        </Button>
      </div>

      {phase === "read" && (
        <div className="text-center py-8 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-6 py-2 text-lg font-bold text-primary">
            <Clock className="h-5 w-5 animate-pulse" /> Memorize these {targets.length} words ({countdown}s)
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-xl mx-auto">
            {targets.map((word, i) => (
              <div
                key={i}
                className="px-6 py-4 rounded-2xl bg-card border-2 border-primary/40 text-xl sm:text-2xl font-bold text-foreground shadow-sm"
              >
                {word}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground">Read each word slowly and picture it in your mind.</p>
        </div>
      )}

      {phase === "recall" && (
        <div className="max-w-xl mx-auto space-y-6 text-center">
          <p className="text-lg font-bold text-foreground">
            Tap the words you remember ({selectedWords.length} / {targets.length} selected):
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {choices.map((word, i) => {
              const isSelected = selectedWords.includes(word);
              return (
                <button
                  key={i}
                  onClick={() => toggleWord(word)}
                  className={`p-4 rounded-2xl border-2 font-bold text-base sm:text-lg transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                      : "bg-card hover:bg-secondary/50 border-border text-foreground"
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>

          <Button
            size="lg"
            onClick={handleCheck}
            disabled={selectedWords.length === 0}
            className="px-8 py-6 text-lg font-bold cursor-pointer"
          >
            Check My Recall
          </Button>
        </div>
      )}

      {phase === "result" && (
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-8 text-center space-y-4">
          <BookOpen className="mx-auto h-16 w-16 text-primary" />
          <h4 className="text-3xl font-extrabold text-foreground">Wonderful effort!</h4>
          <p className="text-lg text-muted-foreground">
            You recalled {selectedWords.filter((w) => targets.includes(w)).length} of {targets.length} target words accurately.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Button size="lg" onClick={startLevel} className="gap-2 font-bold px-8 cursor-pointer">
              <RotateCcw className="h-5 w-5" /> Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
