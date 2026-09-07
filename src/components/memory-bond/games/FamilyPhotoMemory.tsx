import { useState } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FamilyProfile {
  name: string;
  relation: string;
  avatar: string;
  detail: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

const FAMILY_PROFILES: FamilyProfile[] = [
  {
    name: "Sunita Sharma",
    relation: "Daughter (Primary Caregiver)",
    avatar: "👩‍💼",
    detail: "Brings herbal tea on Sundays and calls daily at 5 PM.",
    question: "Who is this family member who visits every Sunday with homemade tea?",
    options: ["Sunita (Daughter)", "Meera (Nurse)", "Ananya (Neighbor)", "Pooja (Pharmacist)"],
    correctAnswer: "Sunita (Daughter)",
  },
  {
    name: "Aarav",
    relation: "Grandson (Age 8)",
    avatar: "👦",
    detail: "Loves to show his school art drawings and dance Bihu.",
    question: "Who is your grandson who loves to show you his colorful drawings?",
    options: ["Aarav", "Rohan", "Kabir", "Arjun"],
    correctAnswer: "Aarav",
  },
  {
    name: "Rajesh Sharma",
    relation: "Son",
    avatar: "👨‍💻",
    detail: "Works as a software engineer in Bengaluru and video calls on weekends.",
    question: "Which son calls you from Bengaluru every Saturday evening?",
    options: ["Rajesh", "Vikram", "Suresh", "Manoj"],
    correctAnswer: "Rajesh",
  },
];

export function FamilyPhotoMemory({
  onComplete,
}: {
  onComplete: (score: number, total: number) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const current = FAMILY_PROFILES[currentIdx];

  const handleNext = () => {
    const isCorrect = selected === current.correctAnswer;
    if (isCorrect) setScore((s) => s + 1);

    setSelected(null);
    if (currentIdx + 1 < FAMILY_PROFILES.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setIsFinished(true);
      onComplete(score + (isCorrect ? 1 : 0), FAMILY_PROFILES.length);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 6: Family Photo & Face Recall</h3>
          <p className="text-sm text-muted-foreground">Reconnect with familiar faces and loved ones.</p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
          Card {currentIdx + 1} / {FAMILY_PROFILES.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <Users className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">Beautiful memories!</h4>
          <p className="text-lg text-muted-foreground">
            You recognized {score} of {FAMILY_PROFILES.length} family profiles with warmth.
          </p>
          <Button
            size="lg"
            onClick={() => {
              setCurrentIdx(0);
              setSelected(null);
              setScore(0);
              setIsFinished(false);
            }}
            className="gap-2 font-bold px-8"
          >
            <RotateCcw className="h-5 w-5" /> Play Again
          </Button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
            <div className="w-28 h-28 rounded-full bg-primary/10 border-4 border-primary/20 mx-auto flex items-center justify-center text-6xl shadow-inner">
              {current.avatar}
            </div>
            <h4 className="text-xl font-bold text-foreground">{current.question}</h4>
            <p className="text-sm text-muted-foreground italic">"{current.detail}"</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {current.options.map((opt, idx) => {
                const isSelected = selected === opt;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelected(opt)}
                    className={`p-4 rounded-2xl border-2 font-bold text-base transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="lg" disabled={!selected} onClick={handleNext} className="px-8 font-bold">
              {currentIdx + 1 === FAMILY_PROFILES.length ? "Finish Recall" : "Next Face"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
