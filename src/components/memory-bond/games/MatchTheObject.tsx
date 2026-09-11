import { useState, useMemo } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchPair {
  id: string;
  itemA: { name: string; icon: string };
  itemB: { name: string; icon: string };
}

// Cultural everyday items including North Eastern cultural items (Bamboo, Tea, Loom, Rain, Lantern)
const ALL_PAIRS: MatchPair[] = [
  { id: "p1", itemA: { name: "Assam Tea Leaves", icon: "🍃" }, itemB: { name: "Warm Tea Pot", icon: "🫖" } },
  { id: "p2", itemA: { name: "Bamboo Cane", icon: "🎋" }, itemB: { name: "Woven Jaapi Hat", icon: "👒" } },
  { id: "p3", itemA: { name: "Reading Book", icon: "📖" }, itemB: { name: "Spectacles", icon: "👓" } },
  { id: "p4", itemA: { name: "Monsoon Rain", icon: "🌧️" }, itemB: { name: "Umbrella", icon: "☂️" } },
  { id: "p5", itemA: { name: "Brass Diya Lamp", icon: "🪔" }, itemB: { name: "Cotton Wick & Oil", icon: "🕯️" } },
  { id: "p6", itemA: { name: "Postcard Letter", icon: "✉️" }, itemB: { name: "Ink Fountain Pen", icon: "✒️" } },
  { id: "p7", itemA: { name: "Handloom Loom", icon: "🧵" }, itemB: { name: "Gamosa Scarf", icon: "🧣" } },
  { id: "p8", itemA: { name: "Bihu Dhol Drum", icon: "🥁" }, itemB: { name: "Pepa Buffalo Horn", icon: "🎺" } },
];

export function MatchTheObject({
  onComplete,
  level = 1,
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
}) {
  const activePairs = useMemo(
    () => ALL_PAIRS.slice(0, Math.min(ALL_PAIRS.length, Math.max(3, level + 2))),
    [level]
  );

  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Shuffled right-side items
  const [rightItems, setRightItems] = useState(() =>
    [...activePairs].sort(() => Math.random() - 0.5)
  );

  const resetGame = () => {
    setSelectedA(null);
    setSelectedB(null);
    setMatchedIds([]);
    setIsFinished(false);
    setRightItems([...activePairs].sort(() => Math.random() - 0.5));
  };

  const checkMatch = (aId: string, bId: string) => {
    if (aId === bId) {
      const nextMatched = [...matchedIds, aId];
      setMatchedIds(nextMatched);
      setSelectedA(null);
      setSelectedB(null);
      if (nextMatched.length === activePairs.length) {
        setIsFinished(true);
        onComplete(activePairs.length, activePairs.length, {
          gameType: "recognition",
          accuracy: 100,
        });
      }
    } else {
      setTimeout(() => {
        setSelectedA(null);
        setSelectedB(null);
      }, 700);
    }
  };

  const handleSelectA = (pairId: string) => {
    if (matchedIds.includes(pairId)) return;
    setSelectedA(pairId);
    if (selectedB) checkMatch(pairId, selectedB);
  };

  const handleSelectB = (pairId: string) => {
    if (matchedIds.includes(pairId)) return;
    setSelectedB(pairId);
    if (selectedA) checkMatch(selectedA, pairId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 10: Match the Connected Object</h3>
          <p className="text-sm text-muted-foreground">Match each item on the left with its functional companion on the right.</p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
          Matched: {matchedIds.length} / {activePairs.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <LinkIcon className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">All pairs connected!</h4>
          <p className="text-lg text-muted-foreground">You associated every everyday object with its natural companion.</p>
          <Button size="lg" onClick={resetGame} className="gap-2 font-bold px-8">
            <RotateCcw className="h-5 w-5" /> Play Again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-2xl mx-auto">
          {/* Left column */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-center text-muted-foreground uppercase">Items</p>
            {activePairs.map((pair) => {
              const isMatched = matchedIds.includes(pair.id);
              const isSelected = selectedA === pair.id;
              return (
                <button
                  key={pair.id}
                  disabled={isMatched}
                  onClick={() => handleSelectA(pair.id)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    isMatched
                      ? "bg-success/20 border-success/40 opacity-70"
                      : isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-card hover:bg-secondary/60 border-border text-foreground"
                  }`}
                >
                  <span className="text-3xl">{pair.itemA.icon}</span>
                  <span className="font-bold text-base">{pair.itemA.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-center text-muted-foreground uppercase">Matches with</p>
            {rightItems.map((pair) => {
              const isMatched = matchedIds.includes(pair.id);
              const isSelected = selectedB === pair.id;
              return (
                <button
                  key={pair.id}
                  disabled={isMatched}
                  onClick={() => handleSelectB(pair.id)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    isMatched
                      ? "bg-success/20 border-success/40 opacity-70"
                      : isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-card hover:bg-secondary/60 border-border text-foreground"
                  }`}
                >
                  <span className="text-3xl">{pair.itemB.icon}</span>
                  <span className="font-bold text-base">{pair.itemB.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
