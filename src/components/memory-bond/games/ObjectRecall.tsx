import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const OBJECT_POOL = [
  { id: "tea", icon: "🍵", name: "Cup of Tea" },
  { id: "glasses", icon: "👓", name: "Reading Glasses" },
  { id: "clock", icon: "⏰", name: "Alarm Clock" },
  { id: "umbrella", icon: "☂️", name: "Umbrella" },
  { id: "flower", icon: "🌸", name: "Pink Flower" },
  { id: "book", icon: "📖", name: "Holy Book" },
  { id: "keys", icon: "🔑", name: "Door Keys" },
  { id: "apple", icon: "🍎", name: "Red Apple" },
];

export function ObjectRecall({
  onComplete,
}: {
  onComplete: (score: number, total: number) => void;
}) {
  const [phase, setPhase] = useState<"memorize" | "recall" | "result">("memorize");
  const [targetObjects, setTargetObjects] = useState<typeof OBJECT_POOL>([]);
  const [distractorOptions, setDistractorOptions] = useState<typeof OBJECT_POOL>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(6);

  const startRound = () => {
    // Pick 4 target objects
    const shuffled = [...OBJECT_POOL].sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, 4);
    // Pick 4 distractors (total 8 options)
    const options = shuffled.slice(0, 8).sort(() => Math.random() - 0.5);

    setTargetObjects(targets);
    setDistractorOptions(options);
    setSelectedIds([]);
    setCountdown(6);
    setPhase("memorize");
  };

  useEffect(() => {
    startRound();
  }, []);

  useEffect(() => {
    if (phase !== "memorize") return;
    if (countdown <= 0) {
      setPhase("recall");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      if (selectedIds.length < targetObjects.length) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleVerify = () => {
    const correctCount = selectedIds.filter((id) => targetObjects.some((t) => t.id === id)).length;
    setPhase("result");
    onComplete(correctCount, targetObjects.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 2: Object Recall</h3>
          <p className="text-sm text-muted-foreground">Look carefully at the everyday items, then recall them.</p>
        </div>
        <Button variant="outline" onClick={startRound} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Restart
        </Button>
      </div>

      {phase === "memorize" && (
        <div className="space-y-6 text-center py-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-6 py-2 text-lg font-bold text-primary">
            <Clock className="h-5 w-5 animate-pulse" /> Memorize these {targetObjects.length} items ({countdown}s)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {targetObjects.map((obj) => (
              <div key={obj.id} className="rounded-2xl border-2 border-primary/30 bg-card p-6 shadow-sm flex flex-col items-center gap-2">
                <span className="text-5xl">{obj.icon}</span>
                <span className="font-bold text-base text-foreground">{obj.name}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground">Take a deep breath. Objects will hide shortly!</p>
        </div>
      )}

      {phase === "recall" && (
        <div className="space-y-6 text-center py-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2 text-lg font-bold text-foreground">
            Which items did you see? (Selected: {selectedIds.length} / {targetObjects.length})
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {distractorOptions.map((obj) => {
              const isSelected = selectedIds.includes(obj.id);
              return (
                <button
                  key={obj.id}
                  onClick={() => toggleSelect(obj.id)}
                  className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-2 transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-card hover:bg-secondary/60 border-border"
                  }`}
                >
                  <span className="text-4xl">{obj.icon}</span>
                  <span className="font-medium text-sm">{obj.name}</span>
                </button>
              );
            })}
          </div>

          <Button
            size="lg"
            onClick={handleVerify}
            disabled={selectedIds.length === 0}
            className="px-10 py-6 text-lg font-bold"
          >
            Check My Answers
          </Button>
        </div>
      )}

      {phase === "result" && (
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-8 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h4 className="text-3xl font-extrabold text-foreground">Great effort!</h4>
          <p className="text-lg text-muted-foreground">
            You recognized {selectedIds.filter((id) => targetObjects.some((t) => t.id === id)).length} of {targetObjects.length} items correctly.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Button size="lg" onClick={startRound} className="gap-2 font-bold px-8">
              <Sparkles className="h-5 w-5" /> Try Another Round
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
