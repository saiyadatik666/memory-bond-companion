import { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Eye,
  ArrowRight,
  Clock,
  Undo2,
  Award,
  AlertCircle,
  Compass,
  Grid3X3,
  Layers,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

// ============================================================================
// Visual Theme Sets for 30 Diverse Levels & 8-Day Cycle Variations
// ============================================================================

// 1. Shapes (Levels 1–5)
const SHAPES = [
  { id: "star", symbol: "⭐", label: "Gold Star", bg: "bg-amber-500/20 text-amber-500 border-amber-500/40" },
  { id: "diamond", symbol: "🔷", label: "Blue Diamond", bg: "bg-sky-500/20 text-sky-500 border-sky-500/40" },
  { id: "circle", symbol: "🟢", label: "Emerald Circle", bg: "bg-emerald-500/20 text-emerald-500 border-emerald-500/40" },
  { id: "triangle", symbol: "🔺", label: "Crimson Triangle", bg: "bg-rose-500/20 text-rose-500 border-rose-500/40" },
  { id: "heart", symbol: "💜", label: "Purple Heart", bg: "bg-purple-500/20 text-purple-500 border-purple-500/40" },
  { id: "square", symbol: "🟧", label: "Orange Square", bg: "bg-orange-500/20 text-orange-500 border-orange-500/40" },
];

// 2. Cultural Everyday Items (Levels 6–10)
const CULTURAL_ITEMS = [
  { id: "diya", symbol: "🪔", label: "Brass Diya", bg: "bg-amber-500/20 text-amber-600 border-amber-500/40" },
  { id: "tea", symbol: "☕", label: "Assam Tea", bg: "bg-orange-500/20 text-orange-600 border-orange-500/40" },
  { id: "lotus", symbol: "🪷", label: "Pink Lotus", bg: "bg-rose-500/20 text-rose-600 border-rose-500/40" },
  { id: "bell", symbol: "🔔", label: "Temple Bell", bg: "bg-yellow-500/20 text-yellow-600 border-yellow-500/40" },
  { id: "flute", symbol: "🪈", label: "Bamboo Flute", bg: "bg-teal-500/20 text-teal-600 border-teal-500/40" },
  { id: "paddy", symbol: "🌾", label: "Golden Paddy", bg: "bg-lime-500/20 text-lime-600 border-lime-500/40" },
  { id: "jaapi", symbol: "👒", label: "Woven Jaapi", bg: "bg-emerald-500/20 text-emerald-600 border-emerald-500/40" },
  { id: "drum", symbol: "🥁", label: "Bihu Dhol", bg: "bg-indigo-500/20 text-indigo-600 border-indigo-500/40" },
];

// 3. Directional Patterns (Levels 16–20)
const DIRECTIONS = [
  { id: "up", symbol: "⬆️", label: "Up / North", bg: "bg-indigo-500/20 text-indigo-500 border-indigo-500/40" },
  { id: "right", symbol: "➡️", label: "Right / East", bg: "bg-teal-500/20 text-teal-500 border-teal-500/40" },
  { id: "down", symbol: "⬇️", label: "Down / South", bg: "bg-amber-500/20 text-amber-500 border-amber-500/40" },
  { id: "left", symbol: "⬅️", label: "Left / West", bg: "bg-rose-500/20 text-rose-500 border-rose-500/40" },
  { id: "up_right", symbol: "↗️", label: "Up-Right", bg: "bg-purple-500/20 text-purple-500 border-purple-500/40" },
  { id: "down_left", symbol: "↙️", label: "Down-Left", bg: "bg-cyan-500/20 text-cyan-500 border-cyan-500/40" },
];

// 4. Nature & Celestial Symbols (Levels 21–25)
const NATURE_SYMBOLS = [
  { id: "sun", symbol: "☀️", label: "Morning Sun", bg: "bg-amber-500/20 text-amber-500 border-amber-500/40" },
  { id: "moon", symbol: "🌙", label: "Crescent Moon", bg: "bg-indigo-500/20 text-indigo-500 border-indigo-500/40" },
  { id: "cloud", symbol: "☁️", label: "Peaceful Cloud", bg: "bg-sky-500/20 text-sky-500 border-sky-500/40" },
  { id: "tree", symbol: "🌳", label: "Banyan Tree", bg: "bg-emerald-500/20 text-emerald-500 border-emerald-500/40" },
  { id: "flower", symbol: "🌸", label: "Cherry Blossom", bg: "bg-rose-500/20 text-rose-500 border-rose-500/40" },
  { id: "bird", symbol: "🕊️", label: "White Dove", bg: "bg-teal-500/20 text-teal-500 border-teal-500/40" },
];

export interface PatternRecallProps {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  nerState?: string;
  memoryCues?: any[];
  cycleNumber?: number;
  cycleSeed?: number;
  adaptiveDifficulty?: "easy" | "medium" | "challenging";
}

export function PatternRecall({
  onComplete,
  level = 1,
  nerState = "all",
  cycleNumber = 1,
  cycleSeed = 0,
  adaptiveDifficulty = "medium",
}: PatternRecallProps) {
  const { lang, speechLocale } = useI18n();

  // Tier classification across 30 Levels
  // 1-5: Simple Visual Shapes
  // 6-10: Cultural Items in 2x3 Grid
  // 11-15: 3x3 Grid Sequenced Positions
  // 16-20: Directional Arrow Paths
  // 21-25: Celestial & Nature Symbols with Shorter Observation
  // 26-29: Advanced Multi-Grid Arrangement
  // 30: Grand Master Synthesis
  const tierInfo = useMemo(() => {
    // Adaptive difficulty adjustment:
    // "easy" provides +35% observation time for low-stress elderly recall
    // "challenging" provides crisp, engaging observation time
    const obsModifier = adaptiveDifficulty === "easy" ? 1.35 : adaptiveDifficulty === "challenging" ? 0.85 : 1.0;

    if (level <= 5) {
      return {
        tierName: "Tier 1: Simple Shapes",
        mode: "sequence" as const,
        pool: SHAPES,
        count: Math.min(5, Math.max(3, level + 1)), // L1=3, L2=3, L3=4, L4=4, L5=5
        obsTimeSec: Math.round(6 * obsModifier),
        description: "Watch the shapes in order, then recreate the exact sequence.",
      };
    } else if (level <= 10) {
      return {
        tierName: "Tier 2: Cultural Grid Positions",
        mode: "grid_positions" as const,
        pool: CULTURAL_ITEMS,
        gridSize: 6, // 2x3 grid
        count: Math.min(4, Math.max(2, level - 4)), // L6=2, L7=3, L8=3, L9=4, L10=4
        obsTimeSec: Math.round(7 * obsModifier),
        description: "Remember which cultural items are placed in each grid square.",
      };
    } else if (level <= 15) {
      return {
        tierName: "Tier 3: 3x3 Spatial Sequences",
        mode: "grid_sequence" as const,
        pool: SHAPES,
        gridSize: 9, // 3x3 grid
        count: Math.min(5, Math.max(3, level - 9)), // L11=3, L12=3, L13=4, L14=4, L15=5
        obsTimeSec: Math.round(7 * obsModifier),
        description: "Follow the sequence of highlighted squares across the 3x3 grid.",
      };
    } else if (level <= 20) {
      return {
        tierName: "Tier 4: Directional Paths",
        mode: "sequence" as const,
        pool: DIRECTIONS,
        count: Math.min(6, Math.max(3, level - 14)), // L16=3, L17=4, L18=4, L19=5, L20=6
        obsTimeSec: Math.round(6 * obsModifier),
        description: "Remember the directional journey, step by step.",
      };
    } else if (level <= 25) {
      return {
        tierName: "Tier 5: Nature & Celestial Matrix",
        mode: "sequence" as const,
        pool: NATURE_SYMBOLS,
        count: Math.min(6, Math.max(4, level - 19)), // L21=4, L22=4, L23=5, L24=5, L25=6
        obsTimeSec: Math.round(5 * obsModifier), // Shorter observation time
        description: "Focus closely on these soothing nature symbols and recall their order.",
      };
    } else if (level <= 29) {
      return {
        tierName: "Tier 6: Advanced Mixed Memory",
        mode: "grid_positions" as const,
        pool: [...CULTURAL_ITEMS, ...NATURE_SYMBOLS],
        gridSize: 9, // 3x3 grid
        count: Math.min(6, Math.max(4, level - 23)), // L26=4, L27=5, L28=5, L29=6
        obsTimeSec: Math.round(8 * obsModifier),
        description: "Memorize the positions of multiple items on the 3x3 matrix.",
      };
    } else {
      // Level 30 Grand Master Challenge
      return {
        tierName: "Level 30: Grand Master Pattern Challenge",
        mode: "sequence" as const,
        pool: [...SHAPES, ...CULTURAL_ITEMS, ...DIRECTIONS],
        count: 6,
        obsTimeSec: Math.round(8 * obsModifier),
        description: "The ultimate memory celebration! Recall a diverse 6-item visual sequence.",
      };
    }
  }, [level, adaptiveDifficulty]);

  // Game Phases: "observe" -> "recall" -> "feedback"
  const [phase, setPhase] = useState<"observe" | "recall" | "feedback">("observe");
  const [countdown, setCountdown] = useState<number>(tierInfo.obsTimeSec);
  const [userSelection, setUserSelection] = useState<any[]>([]);
  const [selectedPaletteItem, setSelectedPaletteItem] = useState<any>(null);
  const [mistakes, setMistakes] = useState<number>(0);
  const [scoreResult, setScoreResult] = useState<{ score: number; total: number; acc: number } | null>(null);

  // Target challenge definition
  const [targetSequence, setTargetSequence] = useState<any[]>([]);
  const [targetGridPositions, setTargetGridPositions] = useState<{ index: number; item: any }[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  // Generate distinct pattern for this level (incorporating 8-Day Cycle seed)
  const generatePattern = () => {
    setUserSelection([]);
    setSelectedPaletteItem(null);
    setMistakes(0);
    setScoreResult(null);

    // Deterministic shuffle seeded by level and 8-day cycle to guarantee fresh variation every cycle
    const cycleOffset = (cycleNumber - 1) * 7;
    const poolShuffled = [...tierInfo.pool].sort(
      (a, b) => ((a.id.charCodeAt(0) * (level + cycleOffset + 7)) % 17) - ((b.id.charCodeAt(0) * (level + cycleOffset + 13)) % 17)
    );

    if (tierInfo.mode === "sequence") {
      const selected = poolShuffled.slice(0, tierInfo.count);
      setTargetSequence(selected);
      setTargetGridPositions([]);
    } else if (tierInfo.mode === "grid_positions") {
      const gridSize = tierInfo.gridSize || 6;
      // Deterministic distinct cell indices based on level and cycle
      const indices: number[] = [];
      let step = 0;
      while (indices.length < tierInfo.count && step < 50) {
        const idx = (Math.floor(Math.sin((level * 13) + (cycleOffset * 7) + step) * 10000) >>> 0) % gridSize;
        if (!indices.includes(idx)) indices.push(idx);
        step++;
      }
      // Fallback if needed
      for (let i = 0; i < gridSize && indices.length < tierInfo.count; i++) {
        if (!indices.includes(i)) indices.push(i);
      }

      const positions = indices.map((idx, i) => ({
        index: idx,
        item: poolShuffled[i % poolShuffled.length],
      }));
      setTargetGridPositions(positions);
      setTargetSequence([]);
      // Preselect first palette item for smooth senior interaction
      if (poolShuffled.length > 0) {
        setSelectedPaletteItem(poolShuffled[0]);
      }
    } else if (tierInfo.mode === "grid_sequence") {
      const gridSize = tierInfo.gridSize || 9;
      const seq: number[] = [];
      let step = 0;
      while (seq.length < tierInfo.count && step < 50) {
        const cell = (Math.floor(Math.cos((level * 17) + (cycleOffset * 5) + step) * 10000) >>> 0) % gridSize;
        if (seq[seq.length - 1] !== cell) seq.push(cell);
        step++;
      }
      for (let i = 0; seq.length < tierInfo.count; i++) {
        seq.push(i % gridSize);
      }
      setTargetSequence(seq);
      setTargetGridPositions([]);
    }

    setCountdown(tierInfo.obsTimeSec);
    setPhase("observe");
  };

  useEffect(() => {
    generatePattern();
  }, [level, cycleNumber, adaptiveDifficulty]);

  // Observation Timer
  useEffect(() => {
    if (phase !== "observe") return;
    if (countdown <= 0) {
      setPhase("recall");
      startTimeRef.current = Date.now();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  // Skip observation early if user is ready
  const handleReadyToRecall = () => {
    setPhase("recall");
    startTimeRef.current = Date.now();
  };

  // User input handlers for sequence mode
  const handleSelectPaletteItem = (item: any) => {
    if (phase !== "recall") return;
    if (tierInfo.mode === "sequence") {
      if (userSelection.length < targetSequence.length) {
        setUserSelection((prev) => [...prev, item]);
      }
    }
  };

  // User input handler for grid cell clicking
  const handleGridCellClick = (cellIndex: number) => {
    if (phase !== "recall") return;

    if (tierInfo.mode === "grid_sequence") {
      if (userSelection.length < targetSequence.length) {
        setUserSelection((prev) => [...prev, cellIndex]);
      }
    } else if (tierInfo.mode === "grid_positions") {
      // Toggle or place selected item into cell
      const existing = userSelection.find((p) => p.index === cellIndex);
      if (existing) {
        setUserSelection((prev) => prev.filter((p) => p.index !== cellIndex));
      } else if (selectedPaletteItem) {
        setUserSelection((prev) => [...prev, { index: cellIndex, item: selectedPaletteItem }]);
      }
    }
  };

  const handleUndo = () => {
    setUserSelection((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setUserSelection([]);
  };

  // Evaluate answer and advance to feedback
  const handleCheckAnswer = () => {
    let score = 0;
    let total = 1;

    if (tierInfo.mode === "sequence") {
      total = targetSequence.length;
      targetSequence.forEach((target, i) => {
        if (userSelection[i] && userSelection[i].id === target.id) {
          score += 1;
        }
      });
    } else if (tierInfo.mode === "grid_sequence") {
      total = targetSequence.length;
      targetSequence.forEach((cell, i) => {
        if (userSelection[i] === cell) {
          score += 1;
        }
      });
    } else if (tierInfo.mode === "grid_positions") {
      total = targetGridPositions.length;
      targetGridPositions.forEach((target) => {
        const found = userSelection.find(
          (u) => u.index === target.index && u.item.id === target.item.id
        );
        if (found) score += 1;
      });
    }

    const calculatedAcc = total > 0 ? Math.round((score / total) * 100) : 100;
    const elapsedMs = Math.max(1200, Date.now() - startTimeRef.current);

    setScoreResult({ score, total, acc: calculatedAcc });
    setPhase("feedback");

    // Invoke parent CognitiveGamesHub completion
    onComplete(score, total, {
      accuracy: calculatedAcc,
      responseTimeMs: elapsedMs,
      mistakes,
      attempts: 1,
      level,
      tier: tierInfo.tierName,
      gameType: "attention",
    });
  };

  return (
    <div className="space-y-6">
      {/* Level Header with Senior-Friendly Mode Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/30 rounded-2xl p-4 border border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/15 px-3 py-0.5 rounded-full">
              Level {level} of 30
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {tierInfo.tierName}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">
            Game 3: Pattern Recall
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
            {tierInfo.description}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={generatePattern}
          className="rounded-xl font-bold text-xs gap-1.5 h-10 border-border"
        >
          <RotateCcw className="h-4 w-4" /> Reset Challenge
        </Button>
      </div>

      {/* ==================================================================== */}
      {/* PHASE 1: OBSERVE PATTERN (Countdown with "I'm Ready" Button)          */}
      {/* ==================================================================== */}
      {phase === "observe" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Instructions Banner */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-4 py-1.5 rounded-full text-sm font-black animate-pulse">
              <Eye className="h-4 w-4" /> OBSERVE CAREFULLY ({countdown}s)
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground">
              Take your time to memorize this visual pattern:
            </p>
          </div>

          {/* OBSERVATION STAGE: Sequence vs Grid */}
          {tierInfo.mode === "sequence" ? (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-6 bg-secondary/40 rounded-3xl border-2 border-primary/30 min-h-[140px]">
              {targetSequence.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 shadow-md transition-all scale-105 ${item.bg} w-24 h-28 sm:w-28 sm:h-32`}
                >
                  <span className="text-3xl sm:text-4xl">{item.symbol}</span>
                  <span className="text-[11px] font-black mt-2 text-center leading-tight">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-bold opacity-70 mt-0.5">#{idx + 1}</span>
                </div>
              ))}
            </div>
          ) : tierInfo.mode === "grid_positions" ? (
            <div className="max-w-md mx-auto p-4 bg-secondary/40 rounded-3xl border-2 border-primary/30">
              <div
                className={`grid gap-3 ${
                  (tierInfo.gridSize || 6) === 6 ? "grid-cols-3" : "grid-cols-3"
                }`}
              >
                {Array.from({ length: tierInfo.gridSize || 6 }).map((_, idx) => {
                  const targetItem = targetGridPositions.find((p) => p.index === idx);
                  return (
                    <div
                      key={idx}
                      className={`h-24 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                        targetItem
                          ? `${targetItem.item.bg} shadow-md scale-102`
                          : "border-border/60 bg-card/60"
                      }`}
                    >
                      {targetItem ? (
                        <>
                          <span className="text-3xl sm:text-4xl">{targetItem.item.symbol}</span>
                          <span className="text-[10px] font-black mt-1 text-center truncate max-w-[80px]">
                            {targetItem.item.label}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground/40">Empty</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 3x3 Grid Sequence Stage */
            <div className="max-w-xs mx-auto p-4 bg-secondary/40 rounded-3xl border-2 border-primary/30">
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: 9 }).map((_, idx) => {
                  const seqStep = targetSequence.indexOf(idx);
                  const isInSeq = seqStep !== -1;
                  return (
                    <div
                      key={idx}
                      className={`h-20 rounded-2xl border-2 flex items-center justify-center text-lg font-black transition-all ${
                        isInSeq
                          ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                          : "border-border/60 bg-card/60 text-muted-foreground/30"
                      }`}
                    >
                      {isInSeq ? `Step ${seqStep + 1}` : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Ready Button */}
          <div className="text-center pt-2">
            <Button
              onClick={handleReadyToRecall}
              size="lg"
              className="rounded-2xl px-8 py-6 text-base font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2 cursor-pointer"
            >
              <span>I'm Ready to Recall</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PHASE 2: RECALL & RECREATE PATTERN                                    */}
      {/* ==================================================================== */}
      {phase === "recall" && (
        <div className="space-y-6 animate-in zoom-in-95">
          <div className="text-center space-y-1">
            <h4 className="text-xl sm:text-2xl font-black text-foreground">
              Now Recreate the Pattern!
            </h4>
            <p className="text-sm font-semibold text-muted-foreground">
              {tierInfo.mode === "sequence"
                ? `Tap items below to fill the ${targetSequence.length} sequence slots in order.`
                : tierInfo.mode === "grid_positions"
                ? `Select an item below, then tap a square to place it in the grid.`
                : `Tap the 3x3 squares in the sequence they lit up.`}
            </p>
          </div>

          {/* SLOTS DISPLAY (User's Answers so Far) */}
          {tierInfo.mode === "sequence" ? (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-5 bg-card rounded-3xl border-2 border-border min-h-[140px]">
              {Array.from({ length: targetSequence.length }).map((_, idx) => {
                const filled = userSelection[idx];
                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center p-3 rounded-3xl border-2 transition-all w-24 h-28 sm:w-28 sm:h-32 ${
                      filled
                        ? `${filled.bg} shadow-sm`
                        : "border-dashed border-border bg-secondary/20"
                    }`}
                  >
                    {filled ? (
                      <>
                        <span className="text-3xl sm:text-4xl">{filled.symbol}</span>
                        <span className="text-[11px] font-black mt-2 text-center leading-tight">
                          {filled.label}
                        </span>
                        <span className="text-[10px] font-bold opacity-70">Slot #{idx + 1}</span>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">
                        Slot #{idx + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : tierInfo.mode === "grid_positions" ? (
            /* Interactive Grid Placement */
            <div className="max-w-md mx-auto p-4 bg-card rounded-3xl border-2 border-border">
              <div
                className={`grid gap-3 ${
                  (tierInfo.gridSize || 6) === 6 ? "grid-cols-3" : "grid-cols-3"
                }`}
              >
                {Array.from({ length: tierInfo.gridSize || 6 }).map((_, idx) => {
                  const placed = userSelection.find((p) => p.index === idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleGridCellClick(idx)}
                      className={`h-24 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                        placed
                          ? `${placed.item.bg} shadow-md`
                          : "border-dashed border-border/80 bg-secondary/20 hover:border-primary"
                      }`}
                    >
                      {placed ? (
                        <>
                          <span className="text-3xl">{placed.item.symbol}</span>
                          <span className="text-[10px] font-bold mt-1 truncate max-w-[80px]">
                            {placed.item.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground mt-0.5">(Tap to remove)</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground/60">
                          {selectedPaletteItem ? `Place ${selectedPaletteItem.symbol}` : "Tap to place"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 3x3 Grid Sequence Tap */
            <div className="max-w-xs mx-auto p-4 bg-card rounded-3xl border-2 border-border">
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: 9 }).map((_, idx) => {
                  const stepOrder = userSelection.indexOf(idx);
                  const isSelected = stepOrder !== -1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleGridCellClick(idx)}
                      className={`h-20 rounded-2xl border-2 flex items-center justify-center text-lg font-black transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                          : "border-border bg-secondary/30 hover:border-primary text-muted-foreground"
                      }`}
                    >
                      {isSelected ? `Step ${stepOrder + 1}` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PALETTE CHOICES (For sequence & object placing) */}
          {(tierInfo.mode === "sequence" || tierInfo.mode === "grid_positions") && (
            <div className="space-y-2">
              <div className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {tierInfo.mode === "sequence"
                  ? "Available Items Palette (Tap to Add)"
                  : "Select an Item below, then tap a square above:"}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {tierInfo.pool.map((item) => {
                  const isCurrentlyChosen = tierInfo.mode === "grid_positions" && selectedPaletteItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (tierInfo.mode === "sequence") {
                          handleSelectPaletteItem(item);
                        } else {
                          setSelectedPaletteItem(item);
                        }
                      }}
                      className={`px-4 py-3 rounded-2xl border-2 flex items-center gap-2 text-sm font-black shadow-xs hover:scale-105 transition-all cursor-pointer ${item.bg} ${
                        isCurrentlyChosen ? "ring-4 ring-primary shadow-md scale-105" : ""
                      }`}
                    >
                      <span className="text-2xl">{item.symbol}</span>
                      <span>{item.label}</span>
                      {isCurrentlyChosen && <Check className="h-4 w-4 ml-1 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls: Undo, Clear, Check Answer */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleUndo}
              disabled={userSelection.length === 0}
              className="rounded-2xl font-bold text-sm h-12 px-5 gap-2 border-border"
            >
              <Undo2 className="h-4 w-4" /> Undo Last
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={userSelection.length === 0}
              className="rounded-2xl font-bold text-sm h-12 px-5 gap-2 border-border"
            >
              Clear All
            </Button>
            <Button
              onClick={handleCheckAnswer}
              disabled={userSelection.length === 0}
              className="rounded-2xl font-black text-base h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2 cursor-pointer"
            >
              <Check className="h-5 w-5" /> Check My Answer
            </Button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PHASE 3: COMPLETED FEEDBACK & EVALUATION                               */}
      {/* ==================================================================== */}
      {phase === "feedback" && scoreResult && (
        <div className="rounded-3xl border-2 border-primary/40 bg-card p-6 sm:p-8 shadow-lg text-center space-y-6 animate-in zoom-in-95">
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/15 border border-primary/30 text-3xl mx-auto shadow-inner">
              {scoreResult.acc >= 75 ? "🌟" : "🌸"}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground">
              {scoreResult.acc >= 75 ? "Excellent Recall!" : "Good Effort!"}
            </h3>
            <p className="text-base text-muted-foreground font-semibold">
              You matched {scoreResult.score} out of {scoreResult.total} items correctly ({scoreResult.acc}% Accuracy).
            </p>
          </div>

          {/* Comparison readout */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="rounded-2xl bg-secondary/40 border border-border p-3">
              <div className="text-2xl font-black text-primary">{scoreResult.acc}%</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">Accuracy</div>
            </div>
            <div className="rounded-2xl bg-secondary/40 border border-border p-3">
              <div className="text-2xl font-black text-foreground">
                {scoreResult.score} / {scoreResult.total}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">Correct Positions</div>
            </div>
          </div>

          <div className="pt-2 text-xs font-bold text-muted-foreground">
            Progress is safely recorded. Press the large "NEXT LEVEL" button below to advance!
          </div>
        </div>
      )}
    </div>
  );
}
