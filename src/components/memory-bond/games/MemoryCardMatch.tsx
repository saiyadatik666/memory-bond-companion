import { useState, useEffect, useRef } from "react";
import { Sparkles, RotateCcw, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCulturalCardsForMemoryMatch, type NERState } from "@/lib/nerCulturalRepository";

interface Card {
  id: number;
  icon: string;
  name: string;
  flipped: boolean;
  matched: boolean;
}

const FALLBACK_ICONS = [
  { icon: "🪷", name: "Lotus" },
  { icon: "☕", name: "Tea Cup" },
  { icon: "🪔", name: "Diya" },
  { icon: "🌳", name: "Tree" },
  { icon: "🕊️", name: "Dove" },
  { icon: "📖", name: "Book" },
  { icon: "🌾", name: "Paddy" },
  { icon: "🍎", name: "Apple" },
];

export function MemoryCardMatch({
  onComplete,
  level = 1,
  nerState = "all",
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  nerState?: string;
}) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matches, setMatches] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [mismatches, setMismatches] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  const pairCount = Math.min(8, Math.max(3, level + 2)); // Level 1=3 pairs, Level 2=4, Level 3=5, Level 4=6, Level 5=7, Level 6=8

  const initGame = () => {
    // Dynamic NER Cultural Content integration
    const cultural = getCulturalCardsForMemoryMatch((nerState as NERState) || "all", pairCount);
    const activeIcons = cultural.length >= pairCount ? cultural : FALLBACK_ICONS.slice(0, pairCount);

    const deck: Card[] = [];
    let id = 0;
    activeIcons.forEach((item) => {
      deck.push({ id: id++, icon: item.icon, name: item.name, flipped: false, matched: false });
      deck.push({ id: id++, icon: item.icon, name: item.name, flipped: false, matched: false });
    });
    // Shuffle
    deck.sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelected([]);
    setMatches(0);
    setMoves(0);
    setMismatches(0);
    setIsCompleted(false);
    startTimeRef.current = Date.now();
  };

  useEffect(() => {
    initGame();
  }, [level, nerState]);

  const handleCardClick = (index: number) => {
    const card = cards[index];
    if (!card || card.flipped || card.matched || selected.length === 2) return;

    const newCards = [...cards];
    newCards[index] = { ...card, flipped: true };
    setCards(newCards);

    const newSelected = [...selected, index];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [firstIdx, secondIdx] = newSelected;
      if (firstIdx === undefined || secondIdx === undefined) return;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];
      if (!firstCard || !secondCard) return;

      if (firstCard.icon === secondCard.icon) {
        // Matched!
        setTimeout(() => {
          setCards((prev) => {
            return prev.map((item, itemIndex) =>
              itemIndex === firstIdx || itemIndex === secondIdx ? { ...item, matched: true } : item
            );
          });
          setMatches((prev) => {
            const nextMatches = prev + 1;
            if (nextMatches === pairCount) {
              setIsCompleted(true);
              const elapsedMs = Math.max(2000, Date.now() - startTimeRef.current);
              // Calculate genuine accuracy: pairCount / totalMoves
              const accuracy = Math.max(10, Math.min(100, Math.round((pairCount / nextMoves) * 100)));
              onComplete(pairCount, pairCount, {
                gameType: "memory",
                accuracy,
                responseTimeMs: Math.round(elapsedMs / pairCount),
                attempts: nextMoves,
                errors: Math.max(0, nextMoves - pairCount),
              });
            }
            return nextMatches;
          });
          setSelected([]);
        }, 500);
      } else {
        // Mismatch
        setMismatches((m) => m + 1);
        setTimeout(() => {
          setCards((prev) => {
            return prev.map((item, itemIndex) =>
              itemIndex === firstIdx || itemIndex === secondIdx ? { ...item, flipped: false } : item
            );
          });
          setSelected([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 1: Memory Card Match (Level {level})</h3>
          <p className="text-sm text-muted-foreground">
            Tap any two cards to find matching pairs ({pairCount} pairs to find).
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
            Pairs: {matches} / {pairCount}
          </span>
          <Button variant="outline" onClick={initGame} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {isCompleted ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
          <Award className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">Well done! Excellent effort!</h4>
          <p className="text-lg text-muted-foreground">
            You found all {pairCount} pairs in {moves} turns. Your memory engagement is wonderful!
          </p>
          <Button size="lg" onClick={initGame} className="gap-2 font-bold px-8 py-6 text-lg">
            <Sparkles className="h-5 w-5" /> Play Again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`h-24 sm:h-28 rounded-2xl border-2 text-4xl flex items-center justify-center transition-all duration-300 font-sans ${
                card.matched
                  ? "bg-success/20 border-success/40 scale-95 opacity-80"
                  : card.flipped
                  ? "bg-card border-primary shadow-md scale-100"
                  : "bg-primary/15 hover:bg-primary/25 border-primary/30 hover:scale-105 active:scale-95"
              }`}
            >
              {card.flipped || card.matched ? card.icon : "✨"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
