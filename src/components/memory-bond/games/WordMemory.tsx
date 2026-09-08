import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const WORD_LISTS = [
  {
    targets: ["River", "Morning", "Breeze", "Jasmine"],
    choices: ["River", "Ocean", "Morning", "Night", "Breeze", "Storm", "Jasmine", "Rose"],
  },
  {
    targets: ["Chai", "Book", "Garden", "Smile"],
    choices: ["Chai", "Coffee", "Book", "Pen", "Garden", "Street", "Smile", "Tears"],
  },
];

export function WordMemory({
  onComplete,
}: {
  onComplete: (score: number, total: number) => void;
}) {
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [phase, setPhase] = useState<"read" | "recall" | "result">("read");
  const [countdown, setCountdown] = useState<number>(6);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  const current = WORD_LISTS[levelIdx];

  if (!current) return null;

  const startLevel = (idx = 0) => {
    setLevelIdx(idx);
    setSelectedWords([]);
    setCountdown(6);
    setPhase("read");
  };

  useEffect(() => {
    startLevel(0);
  }, []);

  useEffect(() => {
    if (phase !== "read") return;
    if (countdown <= 0) {
      setPhase("recall");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  const toggleWord = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else {
      if (selectedWords.length < current.targets.length) {
        setSelectedWords([...selectedWords, word]);
      }
    }
  };

  const handleCheck = () => {
    const correctCount = selectedWords.filter((w) => current.targets.includes(w)).length;
    setPhase("result");
    onComplete(correctCount, current.targets.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 9: Word Memory Recall</h3>
          <p className="text-sm text-muted-foreground">Read and remember the calm words, then pick them out from the list.</p>
        </div>
        <Button variant="outline" onClick={() => startLevel(levelIdx)} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Restart
        </Button>
      </div>

      {phase === "read" && (
        <div className="text-center py-8 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-6 py-2 text-lg font-bold text-primary">
            <Clock className="h-5 w-5 animate-pulse" /> Memorize these words ({countdown}s)
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-xl mx-auto">
            {current.targets.map((word, i) => (
              <div
                key={i}
                className="px-8 py-5 rounded-2xl bg-card border-2 border-primary/40 text-2xl font-bold text-foreground shadow-sm"
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
            Tap the words you remember ({selectedWords.length} / {current.targets.length} selected):
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {current.choices.map((word, i) => {
              const isSelected = selectedWords.includes(word);
              return (
                <button
                  key={i}
                  onClick={() => toggleWord(word)}
                  className={`p-4 rounded-2xl border-2 font-bold text-lg transition-all ${
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
            className="px-8 py-6 text-lg font-bold"
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
            You recalled {selectedWords.filter((w) => current.targets.includes(w)).length} of {current.targets.length} target words accurately.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            {levelIdx + 1 < WORD_LISTS.length ? (
              <Button size="lg" onClick={() => startLevel(levelIdx + 1)} className="gap-2 font-bold px-8">
                <Sparkles className="h-5 w-5" /> Next Word List
              </Button>
            ) : (
              <Button size="lg" onClick={() => startLevel(0)} className="gap-2 font-bold px-8">
                <RotateCcw className="h-5 w-5" /> Play Again
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
