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

const THEMED_DECKS: Array<{ theme: string; icons: Array<{ icon: string; name: string }> }> = [
  {
    theme: "Garden & Nature",
    icons: [
      { icon: "🪷", name: "Lotus" },
      { icon: "🌹", name: "Rose" },
      { icon: "🌻", name: "Sunflower" },
      { icon: "🌼", name: "Marigold" },
      { icon: "🍃", name: "Betel Leaf" },
      { icon: "🌳", name: "Banyan Tree" },
      { icon: "💮", name: "Jasmine" },
      { icon: "🌾", name: "Golden Paddy" },
      { icon: "🪴", name: "Tulsi Plant" },
    ],
  },
  {
    theme: "Morning & Kitchen",
    icons: [
      { icon: "☕", name: "Chai Cup" },
      { icon: "🪔", name: "Brass Diya" },
      { icon: "🔔", name: "Puja Bell" },
      { icon: "🫖", name: "Tea Kettle" },
      { icon: "🥣", name: "Kheer Bowl" },
      { icon: "🍽️", name: "Thali" },
      { icon: "🥄", name: "Brass Spoon" },
      { icon: "🥛", name: "Warm Milk" },
      { icon: "🍯", name: "Wild Honey" },
    ],
  },
  {
    theme: "Heritage & Fruits",
    icons: [
      { icon: "🥭", name: "Alphonso Mango" },
      { icon: "🍎", name: "Kashmiri Apple" },
      { icon: "🍌", name: "Banana" },
      { icon: "🥥", name: "Coconut" },
      { icon: "🍋", name: "Assam Lemon" },
      { icon: "🫐", name: "Jamun" },
      { icon: "🥜", name: "Cashew Nut" },
      { icon: "🟡", name: "Motichoor Laddoo" },
      { icon: "🍥", name: "Hot Jalebi" },
    ],
  },
  {
    theme: "Birds & Animals",
    icons: [
      { icon: "🦚", name: "Royal Peacock" },
      { icon: "🕊️", name: "Peaceful Dove" },
      { icon: "🐘", name: "Gentle Elephant" },
      { icon: "🐄", name: "Sacred Cow" },
      { icon: "🦌", name: "Spotted Deer" },
      { icon: "🦋", name: "Colorful Butterfly" },
      { icon: "🦜", name: "Talking Parrot" },
      { icon: "🐟", name: "River Fish" },
      { icon: "🐇", name: "White Rabbit" },
    ],
  },
  {
    theme: "Traditional Art & Music",
    icons: [
      { icon: "🥁", name: "Bihu Dhol" },
      { icon: "🪈", name: "Bansuri Flute" },
      { icon: "🪕", name: "Sitar" },
      { icon: "🐚", name: "Sacred Conch" },
      { icon: "🏵️", name: "Rangoli Pattern" },
      { icon: "💐", name: "Floral Garland" },
      { icon: "🪭", name: "Hand Fan" },
      { icon: "🧵", name: "Eri Silk Spool" },
      { icon: "🎨", name: "Alpana Paint" },
    ],
  },
  {
    theme: "Sky & Celebrations",
    icons: [
      { icon: "☀️", name: "Golden Sun" },
      { icon: "🌙", name: "Crescent Moon" },
      { icon: "⭐", name: "Bright Star" },
      { icon: "🌈", name: "Monsoon Rainbow" },
      { icon: "🪁", name: "Sankranti Kite" },
      { icon: "☁️", name: "Silver Cloud" },
      { icon: "🏮", name: "Diwali Lantern" },
      { icon: "🎇", name: "Sparkler" },
      { icon: "👑", name: "Royal Mukut" },
    ],
  },
];

export function MemoryCardMatch({
  onComplete,
  level = 1,
  nerState = "all",
  cycleNumber = 1,
  cycleSeed = 0,
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  nerState?: string;
  cycleNumber?: number;
  cycleSeed?: number;
  adaptiveDifficulty?: string;
}) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [matches, setMatches] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [mismatches, setMismatches] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  // 30 Levels progression for elderly:
  // L1-5: 3 pairs (6 cards)
  // L6-10: 4 pairs (8 cards)
  // L11-15: 5 pairs (10 cards)
  // L16-20: 6 pairs (12 cards)
  // L21-25: 7 pairs (14 cards)
  // L26-30: 8 pairs (16 cards)
  const pairCount = level <= 5 ? 3 : level <= 10 ? 4 : level <= 15 ? 5 : level <= 20 ? 6 : level <= 25 ? 7 : 8;

  // Rotate theme deck deterministically per 8-day cycle
  const themeIndex = (level - 1 + (cycleNumber - 1) * 2) % THEMED_DECKS.length;
  const currentTheme = THEMED_DECKS[themeIndex] || THEMED_DECKS[0]!;

  const initGame = () => {
    // Dynamic NER Cultural Content integration with 8-day cycle offset
    const cultural = getCulturalCardsForMemoryMatch((nerState as NERState) || "all", pairCount);
    const offset = ((level - 1) * 2 + (cycleNumber - 1) * 3) % Math.max(1, currentTheme.icons.length);
    const rotatedIcons = [...currentTheme.icons.slice(offset), ...currentTheme.icons.slice(0, offset)];
    const activeIcons = cultural.length >= pairCount ? cultural : rotatedIcons.slice(0, pairCount);

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
  }, [level, nerState, cycleNumber]);

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
          <h3 className="text-xl font-bold text-foreground">
            Game 1: Memory Card Match (Level {level} of 30)
          </h3>
          <p className="text-sm text-muted-foreground">
            Theme: <span className="font-semibold text-primary">{currentTheme.theme}</span> • Tap any two cards to find matching pairs ({pairCount} pairs to find).
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
