import { useState, useEffect, useRef } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function SequenceMemory({
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
  const { lang, gameStrings } = useI18n();

  // 30 Levels progression:
  // L1-5: 3 digits
  // L6-10: 4 digits
  // L11-15: 5 digits
  // L16-20: 6 digits
  // L21-25: 7 digits
  // L26-30: 8 digits
  const digitLength = level <= 5 ? 3 : level <= 10 ? 4 : level <= 15 ? 5 : level <= 20 ? 6 : level <= 25 ? 7 : 8;

  const [digits, setDigits] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [phase, setPhase] = useState<"show" | "input" | "result">("show");
  const [countdown, setCountdown] = useState<number>(5);
  const startTimeRef = useRef<number>(Date.now());
  const isSubmittedRef = useRef<boolean>(false);

  const generateSequence = (length = digitLength) => {
    isSubmittedRef.current = false;
    const seq: number[] = [];
    const cycleOffset = (cycleNumber - 1) * 7;
    let seedVal = level * 31 + cycleOffset;

    while (seq.length < length) {
      seedVal = (seedVal * 1103515245 + 12345) & 0x7fffffff;
      const nextNum = (seedVal % 9) + 1;
      if (seq.length >= 2 && seq[seq.length - 1] === nextNum && seq[seq.length - 2] === nextNum) {
        continue;
      }
      seq.push(nextNum);
    }
    setDigits(seq);
    setUserInput("");
    const baseSeconds = Math.min(8, Math.max(4, length + 1));
    const showSeconds = adaptiveDifficulty === "easy" ? Math.round(baseSeconds * 1.35) : baseSeconds;
    setCountdown(showSeconds);
    setPhase("show");
  };

  useEffect(() => {
    generateSequence(digitLength);
  }, [level, cycleNumber, adaptiveDifficulty]);

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
    if (isSubmittedRef.current || phase !== "input") return;
    isSubmittedRef.current = true;
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
          <h3 className="text-xl font-bold text-foreground">
            {lang === "gu" ? "ગેમ ૪: નંબર સિક્વન્સ મેમરી" : lang === "hi" ? "गेम 4: नंबर सीक्वेंस मेमोरी" : "Game 4: Number Sequence Memory"} ({gameStrings?.level || "Level"} {level} {gameStrings?.of || "of"} 30)
          </h3>
          <p className="text-sm text-muted-foreground">
            {gameStrings?.instructions?.sequenceMemory || "Remember the numbers shown, then enter them in the same order."}
          </p>
        </div>
        <Button variant="outline" onClick={() => generateSequence(digitLength)} className="gap-2">
          <RotateCcw className="h-4 w-4" /> {gameStrings?.reset || "Restart"}
        </Button>
      </div>

      {phase === "show" && (
        <div className="text-center py-8 space-y-6">
          <p className="text-muted-foreground font-medium">
            {lang === "gu"
              ? `આ આંકડા યાદ રાખો (${countdown} ${gameStrings?.secondsRemaining || "સેકન્ડ બાકી"}):`
              : lang === "hi"
              ? `इन अंकों को याद रखें (${countdown} ${gameStrings?.secondsRemaining || "सेकंड शेष"}):`
              : `Remember these numbers (${countdown}s left):`}
          </p>
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
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                startTimeRef.current = Date.now();
                setPhase("input");
              }}
              className="font-bold text-primary"
            >
              {lang === "gu" ? "હું આંકડા દાખલ કરવા તૈયાર છું" : lang === "hi" ? "मैं अंक दर्ज करने के लिए तैयार हूँ" : "I'm Ready to Enter Numbers"}
            </Button>
          </div>
        </div>
      )}

      {phase === "input" && (
        <div className="max-w-sm mx-auto space-y-6 text-center">
          <div className="rounded-2xl border-2 border-border bg-card p-4 min-h-[4.5rem] flex items-center justify-center text-3xl font-mono tracking-widest text-foreground font-bold">
            {userInput ? userInput : <span className="text-muted-foreground text-xl">{lang === "gu" ? "નીચે આપેલા આંકડા પર ટેપ કરો" : lang === "hi" ? "नीचे दिए गए अंकों पर टैप करें" : "Tap numbers below"}</span>}
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
              disabled={userInput.length === 0 || isSubmittedRef.current}
              className="h-16 text-lg font-bold rounded-2xl col-span-1 cursor-pointer"
            >
              {gameStrings?.checkAnswer || "Check"}
            </Button>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-8 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h4 className="text-3xl font-extrabold text-foreground">
            {userInput === digits.join("")
              ? gameStrings?.spotOn || "Spot on! Excellent memory!"
              : gameStrings?.goodTry || "Good try! Great practice!"}
          </h4>
          <p className="text-lg text-muted-foreground">
            {lang === "gu"
              ? `સાચો ક્રમ હતો: ${digits.join(" ")} | તમે દાખલ કર્યો: ${userInput || "(કંઈ નહીં)"}`
              : lang === "hi"
              ? `सही क्रम था: ${digits.join(" ")} | आपने दर्ज किया: ${userInput || "(कुछ नहीं)"}`
              : `Target was: ${digits.join(" ")} | You entered: ${userInput || "(none)"}`}
          </p>
          <Button size="lg" onClick={() => generateSequence(digits.length)} className="gap-2 font-bold px-8 cursor-pointer">
            <Sparkles className="h-5 w-5" /> {gameStrings?.restart || "Next Sequence"}
          </Button>
        </div>
      )}
    </div>
  );
}
