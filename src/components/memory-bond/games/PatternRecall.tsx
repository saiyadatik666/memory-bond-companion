import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const TILES = [
  { id: 0, label: "Aurora Teal", color: "bg-teal-500", glow: "ring-8 ring-teal-300 scale-105" },
  { id: 1, label: "Warm Amber", color: "bg-amber-500", glow: "ring-8 ring-amber-300 scale-105" },
  { id: 2, label: "Calm Indigo", color: "bg-indigo-500", glow: "ring-8 ring-indigo-300 scale-105" },
  { id: 3, label: "Subtle Mint", color: "bg-emerald-500", glow: "ring-8 ring-emerald-300 scale-105" },
];

export function PatternRecall({
  onComplete,
  level = 1,
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
}) {
  const seqLength = Math.min(8, Math.max(3, level + 2)); // Level 1=3, Level 2=4, Level 3=5, Level 4=6, Level 5=7, Level 6=8

  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [isPlayingSeq, setIsPlayingSeq] = useState<boolean>(false);
  const [status, setStatus] = useState<"idle" | "watching" | "repeating" | "success" | "retry">("idle");
  const [mistakes, setMistakes] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(1);
  const startTimeRef = useState<{ current: number }>({ current: Date.now() })[0];

  const startLevel = (length = seqLength) => {
    const newSeq = Array.from({ length }, () => Math.floor(Math.random() * 4));
    setSequence(newSeq);
    setUserSequence([]);
    setMistakes(0);
    setAttempts(1);
    setStatus("watching");
    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    setIsPlayingSeq(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      const tile = seq[i];
      if (tile === undefined) continue;
      setActiveTile(tile);
      await new Promise((r) => setTimeout(r, 600));
      setActiveTile(null);
    }
    setIsPlayingSeq(false);
    startTimeRef.current = Date.now();
    setStatus("repeating");
  };

  useEffect(() => {
    startLevel(seqLength);
  }, [level]);

  const handleTileClick = (tileId: number) => {
    if (isPlayingSeq || status !== "repeating") return;

    // Flash clicked tile
    setActiveTile(tileId);
    setTimeout(() => setActiveTile(null), 300);

    const nextUserSeq = [...userSequence, tileId];
    setUserSequence(nextUserSeq);

    const stepIndex = nextUserSeq.length - 1;
    if (tileId !== sequence[stepIndex]) {
      // Gentle retry
      setMistakes((m) => m + 1);
      setAttempts((a) => a + 1);
      setStatus("retry");
      return;
    }

    if (nextUserSeq.length === sequence.length) {
      // Completed level
      const elapsedMs = Math.max(800, Date.now() - startTimeRef.current);
      const calculatedAcc = Math.max(30, Math.round(100 - mistakes * 20));
      setStatus("success");
      onComplete(sequence.length, sequence.length, {
        gameType: "attention",
        accuracy: calculatedAcc,
        responseTimeMs: elapsedMs,
        attempts: attempts,
        errors: mistakes,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 3: Pattern Recall</h3>
          <p className="text-sm text-muted-foreground">Watch the light patterns, then repeat the same sequence.</p>
        </div>
        <Button variant="outline" onClick={() => startLevel(3)} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Restart
        </Button>
      </div>

      <div className="text-center py-2">
        {status === "watching" && (
          <p className="text-lg font-bold text-primary animate-pulse">Watch carefully as tiles light up...</p>
        )}
        {status === "repeating" && (
          <p className="text-lg font-bold text-foreground">
            Now your turn! Tap the colors in order ({userSequence.length} / {sequence.length})
          </p>
        )}
        {status === "success" && (
          <div className="rounded-3xl border border-success/30 bg-success/10 p-6 space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h4 className="text-2xl font-bold text-foreground">Wonderful! Pattern matched!</h4>
            <p className="text-muted-foreground">Your focus and rhythm were spot-on.</p>
            <Button onClick={() => startLevel(sequence.length + 1)} className="gap-2">
              <Play className="h-4 w-4" /> Next Level ({sequence.length + 1} steps)
            </Button>
          </div>
        )}
        {status === "retry" && (
          <div className="rounded-3xl border border-warning/30 bg-warning/10 p-6 space-y-3">
            <h4 className="text-2xl font-bold text-foreground">Good try! Let's watch again</h4>
            <p className="text-muted-foreground">No hurry at all. We will replay the pattern for you.</p>
            <Button onClick={() => { setUserSequence([]); setStatus("watching"); playSequence(sequence); }}>
              Replay Pattern
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4">
        {TILES.map((t) => {
          const isActive = activeTile === t.id;
          return (
            <button
              key={t.id}
              disabled={isPlayingSeq || status === "success"}
              onClick={() => handleTileClick(t.id)}
              className={`h-36 rounded-3xl transition-all duration-200 cursor-pointer shadow-md ${t.color} ${
                isActive ? t.glow : "opacity-85 hover:opacity-100"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
