import { useState, useMemo, useRef } from "react";
import { Sparkles, RotateCcw, CheckCircle2, Users, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryCue } from "@/lib/memoryBondStore";

interface FamilyProfile {
  name: string;
  relation: string;
  avatar: string;
  detail: string;
  question: string;
  options: string[];
  correctAnswer: string;
  voiceMessage?: string;
}

const DEFAULT_FAMILY_PROFILES: FamilyProfile[] = [
  {
    name: "Sunita Sharma",
    relation: "Daughter (Primary Caregiver)",
    avatar: "👩‍💼",
    detail: "Brings herbal tea on Sundays and calls daily at 5 PM.",
    question: "Who is this family member who visits every Sunday with homemade tea?",
    options: ["Sunita (Daughter)", "Meera (Nurse)", "Ananya (Neighbor)", "Pooja (Pharmacist)"],
    correctAnswer: "Sunita (Daughter)",
    voiceMessage: "Namaste Pitaji! Remember to take your morning walk. I will visit you this Sunday with warm herbal tea!",
  },
  {
    name: "Aarav",
    relation: "Grandson (Age 8)",
    avatar: "👦",
    detail: "Loves to show his school art drawings and dance Bihu.",
    question: "Who is your grandson who loves to show you his colorful drawings?",
    options: ["Aarav", "Rohan", "Kabir", "Arjun"],
    correctAnswer: "Aarav",
    voiceMessage: "Dadu! I drew a big green tea garden in my drawing book for you. See you soon!",
  },
  {
    name: "Rajesh Sharma",
    relation: "Son",
    avatar: "👨‍💻",
    detail: "Works as a software engineer in Bengaluru and video calls on weekends.",
    question: "Which son calls you from Bengaluru every Saturday evening?",
    options: ["Rajesh", "Vikram", "Suresh", "Manoj"],
    correctAnswer: "Rajesh",
    voiceMessage: "Pranam Pitaji. Sending love from Bengaluru. Hope your blood pressure check was good today!",
  },
  {
    name: "Deepali Bora",
    relation: "Lifelong Friend from Tezpur",
    avatar: "👵",
    detail: "Went to school together and shared memories of monsoon picnics.",
    question: "Which cherished school friend from Tezpur visited during last Bihu?",
    options: ["Deepali Bora", "Geeta Devi", "Rani Kalita", "Sita Sharma"],
    correctAnswer: "Deepali Bora",
    voiceMessage: "Ramesh-da, remembering our school days by the Tezpur hills. Wishing you peaceful health!",
  },
  {
    name: "Kamala",
    relation: "Elder Sister",
    avatar: "🧕",
    detail: "Sings melodious Borgeet and sends Assam winter pitha sweets.",
    question: "Who is your loving elder sister who sings soothing traditional hymns?",
    options: ["Kamala", "Lata", "Usha", "Shanti"],
    correctAnswer: "Kamala",
    voiceMessage: "May Lord Krishna keep you blessed and peaceful always, my dear brother.",
  },
  {
    name: "Ancestral Brahmaputra Home",
    relation: "Beloved Village Home",
    avatar: "🏡",
    detail: "Surrounded by swaying bamboo groves and fragrant tea gardens.",
    question: "Where was your childhood ancestral home located?",
    options: ["Near the Brahmaputra banks in Assam", "In Mumbai city", "In Delhi center", "In Chennai port"],
    correctAnswer: "Near the Brahmaputra banks in Assam",
    voiceMessage: "The river breezes and bamboo groves of our ancestral home bring tranquility to the soul.",
  },
];

export function FamilyPhotoMemory({
  onComplete,
  level = 1,
  memoryCues = [],
}: {
  onComplete: (score: number, total: number, extra?: any) => void;
  level?: number;
  memoryCues?: MemoryCue[];
}) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());

  // Merge Personal Memory Bank cues if available
  const activeProfiles = useMemo(() => {
    const customProfiles: FamilyProfile[] = memoryCues
      .filter((c) => ["person", "family_member", "child", "friend", "home", "place", "village"].includes(c.category))
      .map((c) => ({
        name: c.title,
        relation: c.category === "home" || c.category === "place" || c.category === "village" ? "Beloved Place" : "Family Member",
        avatar: c.category === "home" || c.category === "place" || c.category === "village" ? "🏡" : "👵",
        detail: c.detail,
        question: `Do you recognize this cherished personal memory: ${c.title}?`,
        options: [c.title, "Temple Visit", "Hospital Visit", "Shopping Market"],
        correctAnswer: c.title,
        voiceMessage: c.detail,
      }));

    const pool = customProfiles.length > 0 ? [...customProfiles, ...DEFAULT_FAMILY_PROFILES] : DEFAULT_FAMILY_PROFILES;
    const count = Math.min(pool.length, Math.max(2, level + 1));
    return pool.slice(0, count);
  }, [memoryCues, level]);

  const current = activeProfiles[currentIdx];

  const playVoiceMessage = () => {
    if (!current?.voiceMessage || isPlayingVoice) return;
    setIsPlayingVoice(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(current.voiceMessage);
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingVoice(false), 2500);
    }
  };

  const handleNext = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsPlayingVoice(false);

    const isCorrect = selected === current?.correctAnswer;
    const nextScore = score + (isCorrect ? 1 : 0);
    if (isCorrect) setScore(nextScore);

    setSelected(null);
    if (currentIdx + 1 < activeProfiles.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      setIsFinished(true);
      const elapsedMs = Math.max(2000, Date.now() - startTimeRef.current);
      const accuracy = Math.round((nextScore / activeProfiles.length) * 100);
      onComplete(nextScore, activeProfiles.length, {
        gameType: "recognition",
        accuracy,
        responseTimeMs: Math.round(elapsedMs / activeProfiles.length),
        attempts: activeProfiles.length,
        errors: activeProfiles.length - nextScore,
      });
    }
  };

  if (!current) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary/40 p-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Game 6: Family Photo & Memory Recall (Level {level})</h3>
          <p className="text-sm text-muted-foreground">Reconnect with familiar faces, personal places, and loved ones.</p>
        </div>
        <span className="rounded-xl bg-card px-4 py-2 font-bold shadow-xs">
          Card {currentIdx + 1} / {activeProfiles.length}
        </span>
      </div>

      {isFinished ? (
        <div className="rounded-3xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
          <Users className="mx-auto h-16 w-16 text-success" />
          <h4 className="text-3xl font-extrabold text-foreground">Beautiful memories!</h4>
          <p className="text-lg text-muted-foreground">
            You recognized {score} of {activeProfiles.length} family profiles and personal memories with warmth.
          </p>
          <Button
            size="lg"
            onClick={() => {
              setCurrentIdx(0);
              setSelected(null);
              setScore(0);
              setIsFinished(false);
              startTimeRef.current = Date.now();
            }}
            className="gap-2 font-bold px-8 cursor-pointer"
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

            {/* Voice Message playback option */}
            {current.voiceMessage && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={playVoiceMessage}
                  className={`rounded-2xl gap-2 text-xs font-bold cursor-pointer ${
                    isPlayingVoice ? "bg-primary text-primary-foreground animate-pulse" : "text-primary border-primary/30"
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                  {isPlayingVoice ? "Playing Voice Message..." : "Hear Voice Message 🔊"}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {current.options.map((opt, idx) => {
                const isSelected = selected === opt;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelected(opt)}
                    className={`p-4 rounded-2xl border-2 font-bold text-base transition-all cursor-pointer ${
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
            <Button size="lg" disabled={!selected} onClick={handleNext} className="px-8 font-bold cursor-pointer">
              {currentIdx + 1 === activeProfiles.length ? "Finish Recall" : "Next Face"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
