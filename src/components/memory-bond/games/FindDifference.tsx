import { useState, useMemo, useEffect } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PuzzlePair {
  commonIcon: string;
  oddIcon: string;
  labelCommon: string;
  labelOdd: string;
}

const PUZZLE_CATALOG: PuzzlePair[] = [
  { commonIcon: "🌸", oddIcon: "🌻", labelCommon: "Cherry Blossom", labelOdd: "Sunflower" },
  { commonIcon: "🕊️", oddIcon: "🦜", labelCommon: "White Dove", labelOdd: "Parrot" },
  { commonIcon: "☕", oddIcon: "🍵", labelCommon: "Hot Tea", labelOdd: "Green Tea" },
  { commonIcon: "🍎", oddIcon: "🍓", labelCommon: "Red Apple", labelOdd: "Strawberry" },
  { commonIcon: "👒", oddIcon: "🎓", labelCommon: "Sun Hat", labelOdd: "Cap" },
  { commonIcon: "🪷", oddIcon: "🌷", labelCommon: "Lotus", labelOdd: "Tulip" },
  { commonIcon: "🪔", oddIcon: "🕯️", labelCommon: "Brass Diya", labelOdd: "Candle" },
  { commonIcon: "🍃", oddIcon: "🌿", labelCommon: "Leaf", labelOdd: "Herb" },
  { commonIcon: "🫖", oddIcon: "☕", labelCommon: "Teapot", labelOdd: "Cup" },
  { commonIcon: "🎋", oddIcon: "🎍", labelCommon: "Bamboo", labelOdd: "Pine Bamboo" },
  { commonIcon: "🎺", oddIcon: "🎷", labelCommon: "Horn", labelOdd: "Saxophone" },
  { commonIcon: "🎻", oddIcon: "🎸", labelCommon: "Violin", labelOdd: "Guitar" },
  { commonIcon: "🍊", oddIcon: "🍋", labelCommon: "Orange", labelOdd: "Lemon" },
  { commonIcon: "🍇", oddIcon: "🫐", labelCommon: "Grapes", labelOdd: "Blueberries" },
  { commonIcon: "🔔", oddIcon: "🛎️", labelCommon: "Temple Bell", labelOdd: "Counter Bell" },
  { commonIcon: "📖", oddIcon: "📓", labelCommon: "Book", labelOdd: "Notebook" },
  { commonIcon: "🌲", oddIcon: "🌳", labelCommon: "Pine Tree", labelOdd: "Oak Tree" },
  { commonIcon: "🌙", oddIcon: "🌛", labelCommon: "Crescent Moon", labelOdd: "Moon Face" },
  { commonIcon: "🌾", oddIcon: "🌽", labelCommon: "Golden Paddy", labelOdd: "Corn" },
  { commonIcon: "🍵", oddIcon: "🍶", labelCommon: "Tea Bowl", labelOdd: "Water Flask" },
  { commonIcon: "🌺", oddIcon: "🌸", labelCommon: "Hibiscus", labelOdd: "Blossom" },
  { commonIcon: "🦋", oddIcon: "🐝", labelCommon: "Butterfly", labelOdd: "Honeybee" },
  { commonIcon: "🍁", oddIcon: "🍂", labelCommon: "Maple Leaf", labelOdd: "Fallen Leaf" },
  { commonIcon: "🌞", oddIcon: "☀️", labelCommon: "Sun Face", labelOdd: "Bright Sun" },
  { commonIcon: "🚣", oddIcon: "🛶", labelCommon: "Rowboat", labelOdd: "Canoe" },
  { commonIcon: "🧣", oddIcon: "🧤", labelCommon: "Gamosa Scarf", labelOdd: "Gloves" },
  { commonIcon: "🏡", oddIcon: "🏠", labelCommon: "Garden Home", labelOdd: "Cottage" },
  { commonIcon: "🧺", oddIcon: "👜", labelCommon: "Woven Basket", labelOdd: "Handbag" },
  { commonIcon: "🪙", oddIcon: "🎖️", labelCommon: "Gold Coin", labelOdd: "Medal" },
  { commonIcon: "👑", oddIcon: "💎", labelCommon: "Golden Crown", labelOdd: "Diamond" },
];

export function FindDifference({
  onComplete,
  level = 1,
  cycleNumber = 1,
  cycleSeed = 0,
  adaptiveDifficulty = "medium",
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  cycleNumber?: number;
  cycleSeed?: number;
  adaptiveDifficulty?: string;
  nerState?: string;
  memoryCues?: any[];
}) {
  const [puzzleIdx, setPuzzleIdx] = useState<number>(0);
  const [found, setFound] = useState<boolean>(false);
  const [wrongTaps, setWrongTaps] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const startTimeRef = useState<{ current: number }>({ current: Date.now() })[0];

  // Grid size scales with level (adaptive if user is in easy mode)
  const gridSize = useMemo(() => {
    if (adaptiveDifficulty === "easy") {
      if (level <= 10) return 6;
      if (level <= 20) return 8;
      return 9;
    }
    if (level <= 5) return 6;
    if (level <= 12) return 8;
    if (level <= 20) return 9;
    if (level <= 26) return 12;
    return 16;
  }, [level, adaptiveDifficulty]);

  // Select 3 varied puzzles for this level from the 30-item catalog (permuted by 8-Day Cycle)
  const activePuzzles = useMemo(() => {
    const cycleOffset = (cycleNumber - 1) * 7;
    const baseIdx = (level - 1 + cycleOffset) % PUZZLE_CATALOG.length;
    const puzzles = [
      PUZZLE_CATALOG[baseIdx % PUZZLE_CATALOG.length],
      PUZZLE_CATALOG[(baseIdx + 7) % PUZZLE_CATALOG.length],
      PUZZLE_CATALOG[(baseIdx + 13) % PUZZLE_CATALOG.length],
    ];

    return puzzles.map((p, pIdx) => {
      // Deterministic but pseudo-random oddIndex based on level & puzzle index
      const oddIndex = ((level * 3 + pIdx * 5 + cycleOffset + 2) % gridSize);
      return {
        ...p,
        gridSize,
        oddIndex,
      };
    });
  }, [level, gridSize, cycleNumber]);

  const current = activePuzzles[puzzleIdx] || activePuzzles[0];

  useEffect(() => {
    setPuzzleIdx(0);
    setFound(false);
    setWrongTaps(0);
    setIsFinished(false);
    startTimeRef.current = Date.now();
  }, [level]);

  const handleTileClick = (index: number) => {
    if (found || isFinished) return;
    if (index === current.oddIndex) {
      setFound(true);
    } else {
      setWrongTaps((w) => w + 1);
    }
  };

  const handleNextPuzzle = () => {
    setFound(false);
    if (puzzleIdx + 1 < activePuzzles.length) {
      setPuzzleIdx((p) => p + 1);
    } else {
      const elapsedMs = Math.max(1000, Date.now() - startTimeRef.current);
      const totalTaps = activePuzzles.length + wrongTaps;
      const calculatedAcc = Math.max(30, Math.round((activePuzzles.length / totalTaps) * 100));
      setIsFinished(true);
      onComplete(activePuzzles.length, activePuzzles.length, {
        gameType: "attention",
        accuracy: calculatedAcc,
        responseTimeMs: elapsedMs,
        attempts: totalTaps,
        errors: wrongTaps,
        level,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-primary bg-primary/15 px-2.5 py-0.5 rounded-full">
              Level {level} of 30
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {gridSize} Tiles Grid
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mt-1">
            Game 8: Visual Attention - Find the Odd One
          </h3>
          <p className="text-sm text-muted-foreground">
            Look across the peaceful grid and tap the one item that is slightly different.
          </p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs border border-border">
          Puzzle {puzzleIdx + 1} / {activePuzzles.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4 animate-in zoom-in-95">
          <Eye className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">Sharp visual attention!</h4>
          <p className="text-lg text-muted-foreground">
            You spotted every different item across all puzzles on Level {level}!
          </p>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-6 text-center">
          {found ? (
            <div className="rounded-2xl border border-success/30 bg-success/15 p-4 space-y-2 animate-in fade-in">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <p className="font-bold text-lg text-foreground">
                Found it! You spotted the {current.labelOdd}!
              </p>
              <Button size="lg" onClick={handleNextPuzzle} className="px-8 font-bold cursor-pointer">
                {puzzleIdx + 1 === activePuzzles.length ? "Complete Level" : "Next Puzzle ➔"}
              </Button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground">
              Can you spot the one that does not match?
            </p>
          )}

          <div
            className={`grid gap-3 p-2 ${
              gridSize <= 6
                ? "grid-cols-3"
                : gridSize <= 9
                ? "grid-cols-3"
                : gridSize <= 12
                ? "grid-cols-4"
                : "grid-cols-4"
            }`}
          >
            {Array.from({ length: current.gridSize }).map((_, idx) => {
              const isTheOddOne = idx === current.oddIndex;
              const icon = isTheOddOne ? current.oddIcon : current.commonIcon;
              return (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  className={`h-24 rounded-2xl border-2 text-4xl flex items-center justify-center transition-all cursor-pointer ${
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
