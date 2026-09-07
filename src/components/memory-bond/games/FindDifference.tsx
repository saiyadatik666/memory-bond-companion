import { useState } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PuzzleGrid {
  commonIcon: string;
  oddIcon: string;
  gridSize: number; // e.g. 9 or 12
  oddIndex: number;
}

const PUZZLES: PuzzleGrid[] = [
  { commonIcon: "🌸", oddIcon: "🌺", gridSize: 9, oddIndex: 4 },
  { commonIcon: "🕊️", oddIcon: "🦜", gridSize: 12, oddIndex: 7 },
  { commonIcon: "☕", oddIcon: "🍵", gridSize: 9, oddIndex: 2 },
  { commonIcon: "🍎", oddIcon: "🍓", gridSize: 12, oddIndex: 10 },
];

export function FindDifference({
  onComplete,
}: {
  onComplete: (score: number, total: number) => void;
}) {
  const [puzzleIdx, setPuzzleIdx] = useState<number>(0);
  const [found, setFound] = useState<boolean>(false);
  const [wrongTaps, setWrongTaps] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const current = PUZZLES[puzzleIdx];

  const handleTileClick = (index: number) => {
    if (index === current.oddIndex) {
      setFound(true);
    } else {
      setWrongTaps((w) => w + 1);
    }
  };

  const handleNextPuzzle = () => {
    setFound(false);
    if (puzzleIdx + 1 < PUZZLES.length) {
      setPuzzleIdx((p) => p + 1);
    } else {
      setIsFinished(true);
      onComplete(PUZZLES.length, PUZZLES.length);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 8: Visual Attention - Find the Odd One</h3>
          <p className="text-sm text-muted-foreground">Look across the peaceful grid and tap the one item that is slightly different.</p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
          Puzzle {puzzleIdx + 1} / {PUZZLES.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <Eye className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">Sharp visual attention!</h4>
          <p className="text-lg text-muted-foreground">You found all the different items across every visual puzzle.</p>
          <Button
            size="lg"
            onClick={() => {
              setPuzzleIdx(0);
              setFound(false);
              setWrongTaps(0);
              setIsFinished(false);
            }}
            className="gap-2 font-bold px-8"
          >
            <RotateCcw className="h-5 w-5" /> Play Again
          </Button>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-6 text-center">
          {found ? (
            <div className="rounded-2xl border border-success/30 bg-success/15 p-4 space-y-2 animate-in fade-in">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <p className="font-bold text-lg text-foreground">Found it! You spotted the different item.</p>
              <Button size="lg" onClick={handleNextPuzzle} className="px-8 font-bold">
                {puzzleIdx + 1 === PUZZLES.length ? "Finish All Puzzles" : "Next Puzzle"}
              </Button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground">
              Can you spot the one that does not match?
            </p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-2">
            {Array.from({ length: current.gridSize }).map((_, idx) => {
              const isTheOddOne = idx === current.oddIndex;
              const icon = isTheOddOne ? current.oddIcon : current.commonIcon;
              return (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  className={`h-24 rounded-2xl border-2 text-4xl flex items-center justify-center transition-all ${
                    found && isTheOddOne
                      ? "bg-success/30 border-success scale-110 shadow-lg ring-4 ring-success/30"
                      : "bg-card hover:bg-secondary/40 border-border active:scale-95"
                  }`}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
