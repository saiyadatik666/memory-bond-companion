import { useState, useEffect, useRef } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCulturalWordsForMemory, type NERState } from "@/lib/nerCulturalRepository";

const DEFAULT_WORD_LEVELS = [
  { targets: ["Chai", "Book", "Smile"], choices: ["Chai", "Coffee", "Book", "Pen", "Smile", "Tears"] },
  { targets: ["River", "Morning", "Breeze", "Jasmine"], choices: ["River", "Ocean", "Morning", "Night", "Breeze", "Storm", "Jasmine", "Rose"] },
  { targets: ["Tea", "Temple", "Bell", "Sun", "Flower"], choices: ["Tea", "Juice", "Temple", "Palace", "Bell", "Drum", "Sun", "Moon", "Flower", "Grass"] },
  { targets: ["Bamboo", "Bihu", "Flute", "Mountain", "Stream"], choices: ["Bamboo", "Pine", "Bihu", "Diwali", "Flute", "Guitar", "Mountain", "Valley", "Stream", "Desert"] },
  { targets: ["Harvest", "Paddy", "Song", "Sister", "Diya"], choices: ["Harvest", "Store", "Paddy", "Wheat", "Song", "Story", "Sister", "Cousin", "Diya", "Torch"] },
  { targets: ["Brahmaputra", "Sunrise", "Peace", "Family", "Health"], choices: ["Brahmaputra", "Ganga", "Sunrise", "Sunset", "Peace", "War", "Family", "Crowd", "Health", "Pills"] },
  { targets: ["Mango", "Garden", "Butterfly", "Shade", "Swing"], choices: ["Mango", "Apple", "Garden", "Desert", "Butterfly", "Beetle", "Shade", "Heat", "Swing", "Bench"] },
  { targets: ["Cardamom", "Ginger", "Honey", "Bread", "Rice"], choices: ["Cardamom", "Chili", "Ginger", "Garlic", "Honey", "Salt", "Bread", "Stone", "Rice", "Flour"] },
  { targets: ["Mist", "Valley", "Cedar", "Pathway", "Cottage"], choices: ["Mist", "Smoke", "Valley", "Hill", "Cedar", "Bush", "Pathway", "Highway", "Cottage", "Tower"] },
  { targets: ["Raindrop", "Balcony", "Cloud", "Sparrow", "Greenery"], choices: ["Raindrop", "Hail", "Balcony", "Basement", "Cloud", "Sun", "Sparrow", "Crow", "Greenery", "Pavement"] },
  { targets: ["Starlight", "Candle", "Hearth", "Blanket", "Lullaby"], choices: ["Starlight", "Neon", "Candle", "Bulb", "Hearth", "Furnace", "Blanket", "Rug", "Lullaby", "Alarm"] },
  { targets: ["Muga Silk", "Shuttle", "Weaver", "Thread", "Motif"], choices: ["Muga Silk", "Cotton", "Shuttle", "Needle", "Weaver", "Tailor", "Thread", "Rope", "Motif", "Plain"] },
  { targets: ["Kite", "Marbles", "Laughter", "Bicycle", "Pond"], choices: ["Kite", "Balloon", "Marbles", "Dice", "Laughter", "Silence", "Bicycle", "Motorbike", "Pond", "Puddle"] },
  { targets: ["Gulmohar", "Marigold", "Hibiscus", "Garland", "Perfume"], choices: ["Gulmohar", "Oak", "Marigold", "Thistle", "Hibiscus", "Weed", "Garland", "Chain", "Perfume", "Smoke"] },
  { targets: ["Boat", "Paddle", "Current", "Horizon", "Fisherman"], choices: ["Boat", "Ship", "Paddle", "Oar", "Current", "Still", "Horizon", "Ground", "Fisherman", "Sailor"] },
  { targets: ["Parchment", "Scholar", "Library", "Quill", "Clock"], choices: ["Parchment", "Plastic", "Scholar", "Novice", "Library", "Shop", "Quill", "Marker", "Clock", "Sundial"] },
  { targets: ["Dusk", "Firefly", "Shadow", "Crickets", "Silence"], choices: ["Dusk", "Noon", "Firefly", "Moth", "Shadow", "Light", "Crickets", "Frogs", "Silence", "Traffic"] },
  { targets: ["Tea Leaf", "Basket", "Pruning", "Dewdrop", "Estate"], choices: ["Tea Leaf", "Pine", "Basket", "Box", "Pruning", "Cutting", "Dewdrop", "Ice", "Estate", "Factory"] },
  { targets: ["Vendor", "Spices", "Basket", "Fruit", "Coins"], choices: ["Vendor", "Buyer", "Spices", "Flour", "Basket", "Carton", "Fruit", "Grains", "Coins", "Notes"] },
  { targets: ["Snow", "Summit", "Prayer Flags", "Glacier", "Eagle"], choices: ["Snow", "Sand", "Summit", "Cave", "Prayer Flags", "Ribbon", "Glacier", "Volcano", "Eagle", "Falcon"] },
  { targets: ["Petrichor", "Thunder", "Lotus Pond", "Umbrella", "Breeze"], choices: ["Petrichor", "Dust", "Thunder", "Siren", "Lotus Pond", "Swamp", "Umbrella", "Coat", "Breeze", "Gale"] },
  { targets: ["Dhol", "Folk Dance", "Feast", "Rangoli", "Sweets"], choices: ["Dhol", "Drum", "Folk Dance", "Drill", "Feast", "Snack", "Rangoli", "Chalk", "Sweets", "Sour"] },
  { targets: ["Tulsi", "Turmeric", "Neem", "Amla", "Mint"], choices: ["Tulsi", "Grass", "Turmeric", "Saffron", "Neem", "Ivy", "Amla", "Plum", "Mint", "Sage"] },
  { targets: ["Deer", "Fern", "Waterfall", "Moss", "Canopy"], choices: ["Deer", "Goat", "Fern", "Cactus", "Waterfall", "Tap", "Moss", "Lichen", "Canopy", "Roof"] },
  { targets: ["Armchair", "Veranda", "Newspaper", "Tea Cup", "Sparrow"], choices: ["Armchair", "Stool", "Veranda", "Attic", "Newspaper", "Tablet", "Tea Cup", "Bottle", "Sparrow", "Pigeon"] },
  { targets: ["Seashell", "Waves", "Coconut Palm", "Sand", "Gull"], choices: ["Seashell", "Stone", "Waves", "Tide", "Coconut Palm", "Birch", "Sand", "Mud", "Gull", "Pelican"] },
  { targets: ["Golden Leaf", "Crisp Air", "Lantern", "Cider", "Hearth"], choices: ["Golden Leaf", "Twig", "Crisp Air", "Fog", "Lantern", "Torch", "Cider", "Juice", "Hearth", "Stove"] },
  { targets: ["Constellation", "Galaxy", "Calm Wind", "Deep Rest", "Peace"], choices: ["Constellation", "Satellite", "Galaxy", "Nebula", "Calm Wind", "Gust", "Deep Rest", "Nap", "Peace", "Quiet"] },
  { targets: ["Neermahal", "Loktak", "Hornbill", "Cheraw", "Kanchenjunga"], choices: ["Neermahal", "Palace", "Loktak", "Lake", "Hornbill", "Parrot", "Cheraw", "Kathak", "Kanchenjunga", "Everest"] },
  { targets: ["Harmony", "Serenity", "Vitality", "Gratitude", "Longevity", "Wisdom"], choices: ["Harmony", "Clash", "Serenity", "Stress", "Vitality", "Lethargy", "Gratitude", "Regret", "Longevity", "Wisdom"] },
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
