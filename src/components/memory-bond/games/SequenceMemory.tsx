import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SequenceMemory({
  onComplete,
  level = 1,
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
}) {
  const digitLength = Math.min(8, Math.max(3, level + 2)); // Level 1=3, Level 2=4, Level 3=5, Level 4=6, Level 5=7, Level 6=8

  const [digits, setDigits] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [phase, setPhase] = useState<"show" | "input" | "result">("show");
  const [countdown, setCountdown] = useState<number>(4);

  const generateSequence = (length = digitLength) => {
    const seq = Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
    setDigits(seq);
    setUserInput("");
    setCountdown(4);
    setPhase("show");
  };

  useEffect(() => {
    generateSequence(digitLength);
  }, [level]);

  const startTimeRef = useState<{ current: number }>({ current: Date.now() })[0];

  useEffect(() => {
    if (phase !== "show") return;
    if (countdown <= 0) {
      startTimeRef.current = Date.now();
      setPhase("input");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  const handleKey = (num: number) => {
    if (userInput.length < digits.length) {
      setUserInput((prev) => prev + num.toString());
    }
  };

  const handleBackspace = () => {
    setUserInput((prev) => prev.slice(0, -1));
  };

  const handleCheck = () => {
    setPhase("result");
    const targetStr = digits.join("");
    const isCorrect = userInput === targetStr;
    const elapsedMs = Math.max(1000, Date.now() - startTimeRef.current);
    
    // Count exact character matches
    let matchCount = 0;
    for (let i = 0; i < digits.length; i++) {
      if (userInput[i] === String(digits[i])) matchCount++;
    }
    const calculatedAcc = Math.round((matchCount / digits.length) * 100);
    const scoreVal = isCorrect ? digits.length : matchCount;

    onComplete(scoreVal, digits.length, {
      gameType: "memory",
      accuracy: calculatedAcc,
      responseTimeMs: elapsedMs,
      attempts: 1,
      errors: digits.length - matchCount,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 4: Number Sequence Memory</h3>
          <p className="text-sm text-muted-foreground">Remember the numbers shown, then enter them in the same order.</p>
        </div>
        <Button variant="outline" onClick={() => generateSequence(4)} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Restart
        </Button>
      </div>

      {phase === "show" && (
        <div className="text-center py-8 space-y-6">
          <p className="text-muted-foreground">Remember these numbers ({countdown}s left):</p>
          <div className="flex justify-center gap-4">
            {digits.map((d, i) => (
              <div
                key={i}
                className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-card border-2 border-primary/40 flex items-center justify-center text-4xl sm:text-5xl font-extrabold text-primary shadow-lg"
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "input" && (
        <div className="max-w-sm mx-auto space-y-6 text-center">
          <div className="rounded-2xl border-2 border-border bg-card p-4 min-h-[4.5rem] flex items-center justify-center text-3xl font-mono tracking-widest text-foreground font-bold">
            {userInput ? userInput : <span className="text-muted-foreground text-xl">Tap numbers below</span>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <Button
                key={n}
                variant="outline"
                onClick={() => handleKey(n)}
                className="h-16 text-2xl font-bold rounded-2xl"
              >
                {n}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={handleBackspace}
              className="h-16 text-lg font-bold rounded-2xl col-span-1"
            >
              <Delete className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleKey(0)}
              className="h-16 text-2xl font-bold rounded-2xl col-span-1"
            >
              0
            </Button>
            <Button
              onClick={handleCheck}
              disabled={userInput.length === 0}
              className="h-16 text-lg font-bold rounded-2xl col-span-1"
            >
              Check
            </Button>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-8 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h4 className="text-3xl font-extrabold text-foreground">
            {userInput === digits.join("") ? "Spot on! Excellent memory!" : "Good try! Great practice!"}
          </h4>
          <p className="text-lg text-muted-foreground">
            Target was: <strong>{digits.join(" ")}</strong> | You entered: <strong>{userInput || "(none)"}</strong>
          </p>
          <Button size="lg" onClick={() => generateSequence(digits.length)} className="gap-2 font-bold px-8">
            <Sparkles className="h-5 w-5" /> Next Sequence
          </Button>
        </div>
      )}
    </div>
  );
}
