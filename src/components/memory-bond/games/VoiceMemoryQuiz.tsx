import { useState } from "react";
import { Volume2, VolumeX, Sparkles, RotateCcw, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakText } from "@/lib/voiceParser";

interface VoiceQuizItem {
  promptAudioText: string;
  question: string;
  options: string[];
  correct: number;
}

const QUIZ_ITEMS: VoiceQuizItem[] = [
  {
    promptAudioText: "Baba, don't forget to take your morning ginger tea and your blood pressure tablet!",
    question: "In the voice note, what two morning items were mentioned?",
    options: ["Ginger tea & Blood pressure tablet", "Coffee & Ice cream", "Cold water & Vitamins", "Sandwich & Apple"],
    correct: 0,
  },
  {
    promptAudioText: "Grandpa, I will come on Sunday evening to show you my new painting of birds!",
    question: "When did the grandchild say they are visiting to show their drawing?",
    options: ["Sunday evening", "Monday morning", "Friday afternoon", "Next month"],
    correct: 0,
  },
];

export function VoiceMemoryQuiz({
  onComplete,
}: {
  onComplete: (score: number, total: number) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const current = QUIZ_ITEMS[currentIdx];

  const handlePlayVoice = () => {
    setIsPlaying(true);
    speakText(current.promptAudioText);
    setTimeout(() => setIsPlaying(false), 4000);
  };

  const handleNext = () => {
    const isCorrect = selectedOpt === current.correct;
    if (isCorrect) setScore((s) => s + 1);

    setSelectedOpt(null);
    if (currentIdx + 1 < QUIZ_ITEMS.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setIsFinished(true);
      onComplete(score + (isCorrect ? 1 : 0), QUIZ_ITEMS.length);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 7: Voice Memory Quiz</h3>
          <p className="text-sm text-muted-foreground">Listen carefully to the voice cue, then answer the question.</p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
          Quiz {currentIdx + 1} / {QUIZ_ITEMS.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <Volume2 className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">Active listening complete!</h4>
          <p className="text-lg text-muted-foreground">
            You scored {score} of {QUIZ_ITEMS.length} in audio recall.
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
            <RotateCcw className="h-5 w-5" /> Listen Again
          </Button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 text-center space-y-6 shadow-sm">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Tap to hear voice note</p>
              <Button
                size="lg"
                onClick={handlePlayVoice}
                className="gap-3 font-bold px-8 py-6 text-lg rounded-2xl"
              >
                <Volume2 className={`h-6 w-6 ${isPlaying ? "animate-bounce" : ""}`} />
                {isPlaying ? "Playing voice cue..." : "Play Voice Cue"}
              </Button>
              <p className="text-xs text-muted-foreground italic">
                (Simulated family voice message with speech audio)
              </p>
            </div>

            <h4 className="text-xl font-bold text-foreground">{current.question}</h4>

            <div className="space-y-3">
              {current.options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOpt(idx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 font-medium transition-all text-base ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/30 hover:bg-secondary/60 border-border text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="lg" disabled={selectedOpt === null} onClick={handleNext} className="px-8 font-bold">
              {currentIdx + 1 === QUIZ_ITEMS.length ? "Finish Quiz" : "Next Voice Cue"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
