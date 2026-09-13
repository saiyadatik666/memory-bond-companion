import { useState, useMemo, useRef, useEffect } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { getCulturalPairsForMatching, type NERState } from "@/lib/nerCulturalRepository";

interface MatchPair {
  id: string;
  itemA: { name: string; icon: string };
  itemB: { name: string; icon: string };
}

const FALLBACK_PAIRS: MatchPair[] = [
  { id: "p1", itemA: { name: "Assam Tea Leaves", icon: "🍃" }, itemB: { name: "Warm Tea Pot", icon: "🫖" } },
  { id: "p2", itemA: { name: "Bamboo Cane", icon: "🎋" }, itemB: { name: "Woven Jaapi Hat", icon: "👒" } },
  { id: "p3", itemA: { name: "Reading Book", icon: "📖" }, itemB: { name: "Spectacles", icon: "👓" } },
  { id: "p4", itemA: { name: "Monsoon Rain", icon: "🌧️" }, itemB: { name: "Umbrella", icon: "☂️" } },
  { id: "p5", itemA: { name: "Brass Diya Lamp", icon: "🪔" }, itemB: { name: "Cotton Wick & Oil", icon: "🕯️" } },
  { id: "p6", itemA: { name: "Postcard Letter", icon: "✉️" }, itemB: { name: "Ink Fountain Pen", icon: "✒️" } },
  { id: "p7", itemA: { name: "Handloom Loom", icon: "🧵" }, itemB: { name: "Gamosa Scarf", icon: "🧣" } },
  { id: "p8", itemA: { name: "Bihu Dhol Drum", icon: "🥁" }, itemB: { name: "Pepa Buffalo Horn", icon: "🎺" } },
  { id: "p9", itemA: { name: "Water Pitcher", icon: "🚰" }, itemB: { name: "Drinking Glass", icon: "🥛" } },
  { id: "p10", itemA: { name: "Wall Clock", icon: "⏰" }, itemB: { name: "Winding Key", icon: "🗝️" } },
  { id: "p11", itemA: { name: "Balcony Flower", icon: "🌸" }, itemB: { name: "Watering Can", icon: "🚿" } },
  { id: "p12", itemA: { name: "Clay Cooking Handi", icon: "🍲" }, itemB: { name: "Wooden Ladle", icon: "🥄" } },
  { id: "p13", itemA: { name: "Paint Canvas", icon: "🎨" }, itemB: { name: "Artist Brush", icon: "🖌️" } },
  { id: "p14", itemA: { name: "Postal Envelope", icon: "💌" }, itemB: { name: "Postage Stamp", icon: "🏷️" } },
  { id: "p15", itemA: { name: "Sewing Needle", icon: "🪡" }, itemB: { name: "Silk Spool", icon: "🧶" } },
  { id: "p16", itemA: { name: "Wooden Mortar", icon: "🥣" }, itemB: { name: "Pestle", icon: "🪵" } },
  { id: "p17", itemA: { name: "Temple Pooja Bell", icon: "🔔" }, itemB: { name: "Aarti Lamp", icon: "🪔" } },
  { id: "p18", itemA: { name: "Sandalwood Paste", icon: "🪵" }, itemB: { name: "Incense Dhoop", icon: "🕯️" } },
  { id: "p19", itemA: { name: "Traditional Gate", icon: "🚪" }, itemB: { name: "Brass Key", icon: "🔑" } },
  { id: "p20", itemA: { name: "Morning Newspaper", icon: "📰" }, itemB: { name: "Reading Magnifier", icon: "🔍" } },
  { id: "p21", itemA: { name: "Fresh Tea Leaves", icon: "🍃" }, itemB: { name: "Bamboo Sieve", icon: "🧺" } },
  { id: "p22", itemA: { name: "Violin Bow", icon: "🎻" }, itemB: { name: "Music Sheet", icon: "🎶" } },
  { id: "p23", itemA: { name: "Garden Soil", icon: "🪴" }, itemB: { name: "Hand Trowel", icon: "⛏️" } },
  { id: "p24", itemA: { name: "Woolen Yarn", icon: "🧶" }, itemB: { name: "Knitting Needles", icon: "🥢" } },
  { id: "p25", itemA: { name: "Winter Bed Pillow", icon: "🛏️" }, itemB: { name: "Warm Blanket", icon: "🛋️" } },
  { id: "p26", itemA: { name: "Walking Cane", icon: "🦯" }, itemB: { name: "Comfort Shoes", icon: "👟" } },
  { id: "p27", itemA: { name: "Prescription Bottle", icon: "💊" }, itemB: { name: "Medicine Log Book", icon: "📋" } },
  { id: "p28", itemA: { name: "Balcony Bird Feeder", icon: "🦜" }, itemB: { name: "Grain Seeds", icon: "🌾" } },
  { id: "p29", itemA: { name: "Vintage Radio", icon: "📻" }, itemB: { name: "Song Cassette", icon: "📼" } },
  { id: "p30", itemA: { name: "Photo Album", icon: "📷" }, itemB: { name: "Cherished Frame", icon: "🖼️" } },
];

export function MatchTheObject({
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
  memoryCues?: any[];
}) {
  // Scaling pairs: 3 to 6 pairs across levels 1–30 (adaptive if easy)
  const basePairCount = level <= 5 ? 3 : level <= 12 ? 4 : level <= 22 ? 5 : 6;
  const pairCount = adaptiveDifficulty === "easy" ? Math.max(3, basePairCount - 1) : basePairCount;

  const activePairs = useMemo(() => {
    const cultural = getCulturalPairsForMatching((nerState as NERState) || "all", pairCount);
    if (cultural.length >= pairCount) return cultural;
    // Rotate across 30 pairs based on level and 8-Day Cycle
    const cycleOffset = (cycleNumber - 1) * 7;
    const offset = ((level - 1) * 3 + cycleOffset) % FALLBACK_PAIRS.length;
    const rotated = [...FALLBACK_PAIRS.slice(offset), ...FALLBACK_PAIRS.slice(0, offset)];
    return rotated.slice(0, pairCount);
  }, [level, nerState, pairCount, cycleNumber]);

  const { lang } = useI18n();
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const timeoutRef = useRef<any>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // Shuffled right-side items
  const [rightItems, setRightItems] = useState(() =>
    [...activePairs].sort(() => Math.random() - 0.5)
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resetGame = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSelectedA(null);
    setSelectedB(null);
    setMatchedIds([]);
    setIsFinished(false);
    setIsChecking(false);
    isSubmittingRef.current = false;
    setAttempts(0);
    setMistakes(0);
    startTimeRef.current = Date.now();
    setRightItems([...activePairs].sort(() => Math.random() - 0.5));
  };

  const checkMatch = (aId: string, bId: string) => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (aId === bId) {
      const nextMatched = [...matchedIds, aId];
      setMatchedIds(nextMatched);
      setSelectedA(null);
      setSelectedB(null);
      setIsChecking(false);

      if (nextMatched.length === activePairs.length) {
        isSubmittingRef.current = true;
        setIsFinished(true);
        const elapsedMs = Math.max(1500, Date.now() - startTimeRef.current);
        const accuracy = Math.max(10, Math.min(100, Math.round((activePairs.length / nextAttempts) * 100)));
        onComplete(activePairs.length, activePairs.length, {
          gameType: "recognition",
          accuracy,
          responseTimeMs: Math.round(elapsedMs / activePairs.length),
          attempts: nextAttempts,
          errors: mistakes,
        });
      }
    } else {
      setMistakes((m) => m + 1);
      setIsChecking(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setSelectedA(null);
        setSelectedB(null);
        setIsChecking(false);
      }, 700);
    }
  };

  const handleSelectA = (pairId: string) => {
    if (isChecking || isFinished || isSubmittingRef.current || matchedIds.includes(pairId)) return;
    setSelectedA(pairId);
    if (selectedB) checkMatch(pairId, selectedB);
  };

  const handleSelectB = (pairId: string) => {
    if (isChecking || isFinished || isSubmittingRef.current || matchedIds.includes(pairId)) return;
    setSelectedB(pairId);
    if (selectedA) checkMatch(selectedA, pairId);
  };

  const titleText =
    lang === "gu" ? `રમત ૧૦: જોડાયેલ વસ્તુઓની જોડી (સ્તર ${level})` :
    lang === "hi" ? `खेल 10: संबंधित वस्तुओं का मिलान (स्तर ${level})` :
    lang === "bn" ? `খেলা ১০: সম্পর্কিত বস্তুর জোড়া মেলানো (স্তর ${level})` :
    lang === "mr" ? `खेळ १०: संबंधित वस्तूंच्या जोड्या जुळवा (पातळी ${level})` :
    lang === "as" ? `খেল ১০: সম্বন্ধিত বস্তুর মিলোৱা (স্তৰ ${level})` :
    `Game 10: Match the Connected Object (Level ${level})`;

  const subtitleText =
    lang === "gu" ? `ડાબી બાજુની દરેક વસ્તુને જમણી બાજુના તેના યોગ્ય જોડીદાર સાથે મેળવો (${activePairs.length} જોડીઓ).` :
    lang === "hi" ? `बाईं ओर की प्रत्येक वस्तु को दाईं ओर उसके प्राकृतिक साथी से मिलाएं (${activePairs.length} जोड़े)।` :
    lang === "bn" ? `বাম পাশের প্রতিটি বস্তুকে ডান পাশের তার স্বাভাবিক সঙ্গীর সাথে মেলান (${activePairs.length}টি জোড়া)।` :
    lang === "mr" ? `डाव्या बाजूची प्रत्येक वस्तू उजव्या बाजूच्या तिच्या जोडीदाराशी जुळवा (${activePairs.length} जोड्या).` :
    lang === "as" ? `বাওঁফালৰ প্ৰতিটো বস্তু সোঁফালৰ প্ৰাকৃতিক সংগীৰ লগত মিলাওক (${activePairs.length}যোৰ)।` :
    `Match each cultural item on the left with its functional companion on the right (${activePairs.length} pairs).`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">{titleText}</h3>
          <p className="text-sm text-muted-foreground">{subtitleText}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
            {lang === "gu" ? "જોડાયેલ" : lang === "hi" ? "मिले" : lang === "bn" ? "মেলানো" : "Matched"}: {matchedIds.length} / {activePairs.length}
          </span>
          <Button variant="outline" onClick={resetGame} className="gap-2 cursor-pointer">
            <RotateCcw className="h-4 w-4" /> {lang === "gu" ? "ફરી શરૂ" : lang === "hi" ? "रीसेट" : lang === "bn" ? "রিসেট" : "Reset"}
          </Button>
        </div>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <LinkIcon className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">
            {lang === "gu" ? "બધી જ જોડીઓ જોડાઈ ગઈ!" : lang === "hi" ? "सभी जोड़े जुड़ गए!" : lang === "bn" ? "সব জোড়া মিলে গেছে!" : "All pairs connected!"}
          </h4>
          <p className="text-lg text-muted-foreground">
            {lang === "gu"
              ? `તમે ${attempts} પ્રયાસોમાં તમામ ${activePairs.length} વસ્તુઓને તેમના યોગ્ય જોડીદાર સાથે જોડી દીધી.`
              : lang === "hi"
              ? `आपने ${attempts} प्रयासों में सभी ${activePairs.length} वस्तुओं को उनके प्राकृतिक साथियों से जोड़ दिया।`
              : lang === "bn"
              ? `আপনি ${attempts}টি প্রচেষ্টায় সমস্ত ${activePairs.length}টি বস্তুকে তাদের সঠিক সঙ্গীর সাথে মিলিয়েছেন।`
              : `You associated all ${activePairs.length} everyday items with their natural partners in ${attempts} attempts.`}
          </p>
          <Button size="lg" onClick={resetGame} className="gap-2 font-bold px-8 cursor-pointer">
            <RotateCcw className="h-5 w-5" /> {lang === "gu" ? "ફરી રમો" : lang === "hi" ? "फिर खेलें" : lang === "bn" ? "আবার খেলুন" : "Play Again"}
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
                      ? "bg-success/15 border-success/30 opacity-60 line-through"
                      : isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-102"
                      : "bg-card hover:bg-secondary/60 border-border"
                  }`}
                >
                  <span className="text-3xl">{pair.itemA.icon}</span>
                  <span className="font-bold text-sm text-left">{pair.itemA.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-center text-muted-foreground uppercase">Natural Partners</p>
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
                      ? "bg-success/15 border-success/30 opacity-60 line-through"
                      : isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-102"
                      : "bg-card hover:bg-secondary/60 border-border"
                  }`}
                >
                  <span className="text-3xl">{pair.itemB.icon}</span>
                  <span className="font-bold text-sm text-left">{pair.itemB.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
