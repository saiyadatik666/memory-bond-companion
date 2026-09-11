import { useState, useEffect, useRef } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCulturalObjectsForRecall, type NERState } from "@/lib/nerCulturalRepository";

const FALLBACK_POOL = [
  { id: "tea", icon: "🍵", name: "Cup of Tea" },
  { id: "glasses", icon: "👓", name: "Reading Glasses" },
  { id: "clock", icon: "⏰", name: "Alarm Clock" },
  { id: "umbrella", icon: "☂️", name: "Umbrella" },
  { id: "flower", icon: "🌸", name: "Pink Flower" },
  { id: "book", icon: "📖", name: "Holy Book" },
  { id: "keys", icon: "🔑", name: "Door Keys" },
  { id: "apple", icon: "🍎", name: "Red Apple" },
  { id: "jaapi", icon: "👒", name: "Assam Jaapi" },
  { id: "lamp", icon: "🪔", name: "Brass Diya" },
  { id: "bag", icon: "👜", name: "Market Bag" },
  { id: "bell", icon: "🔔", name: "Temple Bell" },
  { id: "slipper", icon: "🩴", name: "Comfort Slippers" },
  { id: "water_pot", icon: "🏺", name: "Clay Matka" },
  { id: "radio", icon: "📻", name: "Vintage Radio" },
  { id: "walking_stick", icon: "🦯", name: "Walking Stick" },
  { id: "fan", icon: "🪭", name: "Handheld Fan" },
  { id: "pen", icon: "🖊️", name: "Fountain Pen" },
  { id: "mango", icon: "🥭", name: "Sweet Mango" },
  { id: "conch", icon: "🐚", name: "Shankh Shell" },
  { id: "towel", icon: "🧣", name: "Soft Gamusa" },
  { id: "plate", icon: "🍽️", name: "Brass Thali" },
  { id: "beads", icon: "📿", name: "Japa Mala" },
  { id: "torch", icon: "🔦", name: "Night Torch" },
  { id: "comb", icon: "🪮", name: "Wooden Comb" },
  { id: "mirror", icon: "🪞", name: "Hand Mirror" },
  { id: "spoon", icon: "🥄", name: "Brass Spoon" },
  { id: "kettle", icon: "🫖", name: "Tea Kettle" },
  { id: "candle", icon: "🕯️", name: "Wax Candle" },
  { id: "leaf", icon: "🍃", name: "Betel Leaf" },
  { id: "padlock", icon: "🔒", name: "Iron Lock" },
  { id: "scissors", icon: "✂️", name: "Craft Scissors" },
  { id: "cap", icon: "🧢", name: "Sun Cap" },
  { id: "banana", icon: "🍌", name: "Ripe Banana" },
  { id: "coconut", icon: "🥥", name: "Fresh Coconut" },
  { id: "drum", icon: "🥁", name: "Folk Dhol" },
];

export function ObjectRecall({
  onComplete,
  level = 1,
  nerState = "all",
  cycleNumber = 1,
  cycleSeed = 0,
  adaptiveDifficulty = "medium",
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  nerState?: string;
  cycleNumber?: number;
  cycleSeed?: number;
  adaptiveDifficulty?: string;
}) {
  const [phase, setPhase] = useState<"memorize" | "recall" | "result">("memorize");
  const [targetObjects, setTargetObjects] = useState<Array<{ id: string; icon: string; name: string }>>([]);
  const [distractorOptions, setDistractorOptions] = useState<Array<{ id: string; icon: string; name: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(7);
  const recallStartRef = useRef<number>(Date.now());

  // 30 Levels progression:
  // L1-5: 3 items (6 options)
  // L6-10: 4 items (8 options)
  // L11-15: 5 items (10 options)
  // L16-20: 6 items (12 options)
  // L21-25: 7 items (14 options)
  // L26-30: 8 items (16 options)
  const targetCount = level <= 5 ? 3 : level <= 10 ? 4 : level <= 15 ? 5 : level <= 20 ? 6 : level <= 25 ? 7 : 8;
  const totalOptionsCount = Math.min(FALLBACK_POOL.length, targetCount * 2);

  const startRound = () => {
    const cultural = getCulturalObjectsForRecall((nerState as NERState) || "all", targetCount + 6);
    const basePool = cultural.length >= targetCount + 4 ? cultural : FALLBACK_POOL;

    // Shift pool start index deterministically based on level and 8-day cycle so each cycle and level has distinct objects
    const offset = ((level - 1) * 3 + (cycleNumber - 1) * 7) % basePool.length;
    const rotatedPool = [...basePool.slice(offset), ...basePool.slice(0, offset)];

    const targets = rotatedPool.slice(0, targetCount);
    // Mix targets with remaining pool items for options
    const distractors = rotatedPool.slice(targetCount, totalOptionsCount);
    const combinedOptions = [...targets, ...distractors].sort(() => Math.random() - 0.5);

    setTargetObjects(targets);
    setDistractorOptions(combinedOptions);
    setSelectedIds([]);
    // Senior-friendly observation time: generous 6 to 10 seconds, +35% for easy adaptive pace
    const baseSecs = Math.min(10, Math.max(6, targetCount + 2));
    const memorizeSeconds = adaptiveDifficulty === "easy" ? Math.round(baseSecs * 1.35) : baseSecs;
    setCountdown(memorizeSeconds);
    setPhase("memorize");
  };

  useEffect(() => {
    startRound();
  }, [level, nerState, cycleNumber, adaptiveDifficulty]);

  useEffect(() => {
    if (phase !== "memorize") return;
    if (countdown <= 0) {
      setPhase("recall");
      recallStartRef.current = Date.now();
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
    const errors = selectedIds.filter((id) => !targetObjects.some((t) => t.id === id)).length;
    const accuracy = Math.round((correctCount / targetObjects.length) * 100);
    const elapsedMs = Math.max(1500, Date.now() - recallStartRef.current);

    setPhase("result");
    onComplete(correctCount, targetObjects.length, {
      gameType: "recall",
      accuracy,
      responseTimeMs: Math.round(elapsedMs / Math.max(1, selectedIds.length)),
      attempts: selectedIds.length,
      errors,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 2: Object Recall (Level {level} of 30)</h3>
          <p className="text-sm text-muted-foreground">Look carefully at the everyday cultural items, then recall them.</p>
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <p className="text-muted-foreground text-sm">Take a deep breath. Objects will hide shortly!</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPhase("recall");
                recallStartRef.current = Date.now();
              }}
              className="font-bold text-primary"
            >
              I'm Ready to Recall Now
            </Button>
          </div>
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
                  className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-2 transition-all cursor-pointer ${
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
            className="px-10 py-6 text-lg font-bold cursor-pointer"
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
            <Button size="lg" onClick={startRound} className="gap-2 font-bold px-8 cursor-pointer">
              <Sparkles className="h-5 w-5" /> Try Another Round
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
