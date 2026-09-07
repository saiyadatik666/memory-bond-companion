import { useState } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoutineQuestion {
  question: string;
  options: string[];
  correct: number;
  reflection: string;
}

const QUESTIONS: RoutineQuestion[] = [
  {
    question: "What is typically the healthiest thing to drink right after waking up in the morning?",
    options: ["A warm glass of water or lemon water", "Cold soda with ice", "Heavy sugary syrup", "Direct bitter medicine"],
    correct: 0,
    reflection: "Warm water gently awakens your digestive system and hydrates your brain!",
  },
  {
    question: "When taking morning blood pressure tablets, what is recommended?",
    options: ["Skip whenever you feel fine", "Take consistently around the same time after breakfast", "Only take at midnight", "Take 4 tablets at once"],
    correct: 1,
    reflection: "Consistency at the same time each morning keeps blood pressure smooth and steady.",
  },
  {
    question: "When is the most pleasant and safe time for a gentle outdoor walk in the garden?",
    options: ["During peak hot midday sun", "Pleasant early morning or mild evening breeze", "In pitch darkness without lights", "During heavy thunderstorms"],
    correct: 1,
    reflection: "Early morning or mild evening walks give fresh oxygen and keep joints flexible.",
  },
];

export function RoutineRecall({
  onComplete,
}: {
  onComplete: (score: number, total: number) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const currentQ = QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    setSelectedOpt(idx);
  };

  const handleNext = () => {
    if (selectedOpt === currentQ.correct) {
      setScore((s) => s + 1);
    }
    setSelectedOpt(null);
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setIsFinished(true);
      onComplete(score + (selectedOpt === currentQ.correct ? 1 : 0), QUESTIONS.length);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 5: Daily Routine Recall</h3>
          <p className="text-sm text-muted-foreground">Calm questions to reinforce peaceful, healthy daily habits.</p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
          Question {currentIdx + 1} / {QUESTIONS.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <Heart className="mx-auto h-16 w-16 text-success fill-success/20" />
          <h4 className="text-3xl font-extrabold text-foreground">Heartwarming effort!</h4>
          <p className="text-lg text-muted-foreground">
            You completed the routine reflection with {score} / {QUESTIONS.length} thoughtful answers.
          </p>
          <Button
            size="lg"
            onClick={() => {
              setCurrentIdx(0);
              setSelectedOpt(null);
              setScore(0);
              setIsFinished(false);
            }}
            className="gap-2 font-bold px-8"
          >
            <RotateCcw className="h-5 w-5" /> Review Again
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h4 className="text-xl font-bold text-foreground leading-relaxed mb-6">
              {currentQ.question}
            </h4>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-medium text-base ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/30 hover:bg-secondary/60 border-border"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={selectedOpt === null}
              onClick={handleNext}
              className="px-8 font-bold"
            >
              {currentIdx + 1 === QUESTIONS.length ? "Finish Activity" : "Next Question"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
