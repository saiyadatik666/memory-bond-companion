import { useState, useMemo, useEffect, useRef } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

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
  const { lang } = useI18n();
  const [puzzleIdx, setPuzzleIdx] = useState<number>(0);
  const [found, setFound] = useState<boolean>(false);
  const [wrongTaps, setWrongTaps] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const isSubmittingRef = useRef<boolean>(false);

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
    isSubmittingRef.current = false;
    startTimeRef.current = Date.now();
  }, [level]);

  const handleTileClick = (index: number) => {
    if (found || isFinished || isSubmittingRef.current) return;
    if (index === current.oddIndex) {
      setFound(true);
    } else {
      setWrongTaps((w) => w + 1);
    }
  };

  const handleNextPuzzle = () => {
    if (isSubmittingRef.current) return;
    setFound(false);
    if (puzzleIdx + 1 < activePuzzles.length) {
      setPuzzleIdx((p) => p + 1);
    } else {
      isSubmittingRef.current = true;
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

  const titleText =
    lang === "gu" ? "રમત ૮: દ્રશ્ય એકાગ્રતા - અલગ ચિત્ર શોધો" :
    lang === "hi" ? "खेल 8: दृश्य एकाग्रता - अलग वस्तु पहचानें" :
    lang === "bn" ? "খেলা ৮: দৃষ্টি একাগ্রতা - আলাদা বস্তুটি খুঁজুন" :
    lang === "mr" ? "खेळ ८: दृश्य एकाग्रता - वेगळे चित्र शोधा" :
    lang === "as" ? "খেল ৮: দৃষ্টি মনোযোগ - পৃথক বস্তুটো বাছক" :
    "Game 8: Visual Attention - Find the Odd One";

  const subtitleText =
    lang === "gu" ? "શાંતિથી ખાનાઓમાં જુઓ અને જે વસ્તુ થોડી અલગ છે તેના પર ટેપ કરો." :
    lang === "hi" ? "शांति से खानों में देखें और जो वस्तु थोड़ी अलग है उस पर टैप करें।" :
    lang === "bn" ? "শান্তভাবে গ্রিডটি লক্ষ্য করুন এবং যেটি একটু আলাদা সেটিতে ট্যাপ করুন।" :
    lang === "mr" ? "शांतपणे ग्रिड पहा आणि वेगळ्या घटकावर टॅप करा." :
    lang === "as" ? "মনোযোগেৰে চাওক আৰু সামান্য পৃথক বস্তুটোত আঙুলিৰে চুই দিয়ক।" :
    "Look across the peaceful grid and tap the one item that is slightly different.";

  const nextBtnText =
    puzzleIdx + 1 === activePuzzles.length
      ? (lang === "gu" ? "સ્તર પૂર્ણ કરો" : lang === "hi" ? "स्तर पूरा करें" : lang === "bn" ? "স্তর সম্পূর্ণ করুন" : "Complete Level")
      : (lang === "gu" ? "આગળનો કોયડો ➔" : lang === "hi" ? "अगली पहेली ➔" : lang === "bn" ? "পরবর্তী ধাঁধা ➔" : "Next Puzzle ➔");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-primary bg-primary/15 px-2.5 py-0.5 rounded-full">
              {lang === "gu" ? "સ્તર" : lang === "hi" ? "स्तर" : lang === "bn" ? "স্তর" : "Level"} {level} / 30
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {gridSize} {lang === "gu" ? "ખાના" : lang === "hi" ? "खाने" : lang === "bn" ? "টাইলস" : "Tiles Grid"}
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground mt-1">
            {titleText}
          </h3>
          <p className="text-sm text-muted-foreground">
            {subtitleText}
          </p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs border border-border">
          {lang === "gu" ? "કોયડો" : lang === "hi" ? "पहेली" : lang === "bn" ? "ধাঁধা" : "Puzzle"} {puzzleIdx + 1} / {activePuzzles.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4 animate-in zoom-in-95">
          <Eye className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">
            {lang === "gu" ? "તીક્ષ્ણ દ્રષ્ટિ! ખૂબ સરસ!" : lang === "hi" ? "सटीक दृष्टि! शानदार!" : lang === "bn" ? "তীক্ষ্ণ দৃষ্টি! চমৎকার!" : "Sharp visual attention!"}
          </h4>
          <p className="text-lg text-muted-foreground">
            {lang === "gu"
              ? `તમે સ્તર ${level} ના બધા જ કોયડાઓમાં અલગ વસ્તુ સફળતાપૂર્વક શોધી લીધી!`
              : lang === "hi"
              ? `आपने स्तर ${level} की सभी पहेलियों में अलग वस्तु को सफलतापूर्वक खोज लिया!`
              : lang === "bn"
              ? `আপনি স্তর ${level}-এর সমস্ত ধাঁধায় ভিন্ন বস্তুটি সফলভাবে খুঁজে পেয়েছেন!`
              : `You spotted every different item across all puzzles on Level ${level}!`}
          </p>
        </div>
      ) : (
        <div className="max-w-md mx-auto space-y-6 text-center">
          {found ? (
            <div className="rounded-2xl border border-success/30 bg-success/15 p-4 space-y-2 animate-in fade-in">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <p className="font-bold text-lg text-foreground">
                {lang === "gu"
                  ? `મળી ગયું! તમે ${current.labelOdd} શોધી લીધું!`
                  : lang === "hi"
                  ? `मिल गया! आपने ${current.labelOdd} खोज लिया!`
                  : lang === "bn"
                  ? `পাওয়া গেছে! আপনি ${current.labelOdd} খুঁজে পেয়েছেন!`
                  : `Found it! You spotted the ${current.labelOdd}!`}
              </p>
              <Button size="lg" onClick={handleNextPuzzle} className="px-8 font-bold cursor-pointer">
                {nextBtnText}
              </Button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground">
              {lang === "gu"
                ? "જે વસ્તુ બાકીના કરતાં અલગ છે તે ઓળખો:"
                : lang === "hi"
                ? "क्या आप अलग दिखने वाली वस्तु को पहचान सकते हैं?"
                : lang === "bn"
                ? "যেটি মেলেনি সেটি কি খুঁজে বের করতে পারেন?"
                : "Can you spot the one that does not match?"}
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
