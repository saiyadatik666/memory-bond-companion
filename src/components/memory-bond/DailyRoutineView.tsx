import { useState } from "react";
import {
  Sun,
  Plus,
  Clock,
  CheckCircle2,
  Coffee,
  Pill,
  Brain,
  Utensils,
  Phone,
  Moon,
  Bed,
  Sparkles,
  PhoneCall,
  Volume2,
  Mic,
  BookmarkCheck,
  Check,
  X,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import { useI18n } from "@/lib/i18n";

export function DailyRoutineView({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale } = useI18n();
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [time, setTime] = useState<string>("16:00");
  const [activity, setActivity] = useState<string>("");
  const [icon, setIcon] = useState<string>("sun");

  // Daily Routine Call Modal State
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [callStep, setCallStep] = useState<number>(0);
  const [answers, setAnswers] = useState<{ topic: string; question: string; answer: string }[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [promptToSaveMemory, setPromptToSaveMemory] = useState<string | null>(null);
  const [memorySavedBadge, setMemorySavedBadge] = useState<boolean>(false);
  const [callCompleted, setCallCompleted] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const routineQuestions = [
    {
      topic: "Sleep & Morning",
      question: t("routineQuestion1") || "Good day! How was your morning today? Did you sleep peacefully?",
      quickOptions: ["Slept very peacefully for 7 hours", "Woke up early and feel refreshed", "A little restless, but fine now"],
    },
    {
      topic: "Breakfast & Chai",
      question: t("routineQuestion2") || "Did you have a warm breakfast and your morning tea or water?",
      quickOptions: ["Had warm Assam tea and roti with vegetables", "Drank a glass of warm water & had idlis", "Having light toast right now"],
    },
    {
      topic: "Morning Medicine",
      question: t("routineQuestion3") || "Have you taken your scheduled morning medicine today?",
      quickOptions: ["Yes, took morning tablets right on time", "Taking it right after this conversation", "Caregiver reminded me already"],
    },
    {
      topic: "Outdoor & Fresh Air",
      question: t("routineQuestion4") || "Did you go outside, sit in the balcony, or water any plants?",
      quickOptions: ["Watered the holy tulsi plant in the balcony", "Sat in the morning sunshine for 20 minutes", "Walked gently in the corridor"],
    },
    {
      topic: "Family & Social Connection",
      question: t("routineQuestion5") || "Did you meet or speak with family, neighbors, or friends today?",
      quickOptions: ["Spoke to my daughter Sunita on the phone", "Waved to my kind neighbor Mr. Gogoi", "Quiet peaceful morning so far"],
    },
    {
      topic: "Important Reminders",
      question: t("routineQuestion6") || "Is there anything special or important you want to remember for today?",
      quickOptions: ["Everything is under control", "Need to buy fresh coriander from market", "Doctor appointment review in a few days"],
    },
  ];

  const startRoutineCall = () => {
    setIsCallActive(true);
    setCallStep(0);
    setAnswers([]);
    setCurrentInput("");
    setPromptToSaveMemory(null);
    setMemorySavedBadge(false);
    setCallCompleted(false);

    // Speak initial question
    const firstQ = routineQuestions[0]?.question;
    if (firstQ) {
      speakText(firstQ, speechLocale);
    }
  };

  const handleSelectQuickAnswer = (ansText: string) => {
    setCurrentInput(ansText);
    submitAnswer(ansText);
  };

  const submitAnswer = (userAns: string) => {
    const qObj = routineQuestions[callStep];
    if (!qObj || !userAns.trim()) return;

    const newAnswers = [...answers, { topic: qObj.topic, question: qObj.question, answer: userAns.trim() }];
    setAnswers(newAnswers);

    // Section 12: Daily Routine + Voice Memory Connection
    // Check if the answer contains something meaningful to offer saving
    const meaningfulKeywords = ["daughter", "sunita", "aarav", "grandson", "bihu", "garden", "tulsi", "friend", "flower", "বেটি", "নাতি", "সুনীতা"];
    const isMeaningful = meaningfulKeywords.some((k) => userAns.toLowerCase().includes(k));

    if (isMeaningful && !promptToSaveMemory) {
      setPromptToSaveMemory(userAns.trim());
      speakText(
        t("saveMemoryPrompt") || "That sounds memorable! Would you like me to save this as a cherished memory in Memory Bond?",
        speechLocale
      );
      return;
    }

    proceedToNextQuestion(newAnswers);
  };

  const proceedToNextQuestion = (currentAnswersList: typeof answers) => {
    setPromptToSaveMemory(null);
    setCurrentInput("");

    if (callStep + 1 < routineQuestions.length) {
      const nextStep = callStep + 1;
      setCallStep(nextStep);
      const nextQ = routineQuestions[nextStep]?.question;
      if (nextQ) {
        speakText(nextQ, speechLocale);
      }
    } else {
      // Completed all questions
      setCallCompleted(true);
      const summaryText = `Daily call completed. Answers: ${currentAnswersList.map((a) => `${a.topic}: ${a.answer}`).join("; ")}`;
      store.recordDailyRoutineCall({
        date: todayStr,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        answers: currentAnswersList,
        summary: "Senior completed daily morning check-in cheerfully with good orientation.",
      });
      speakText(t("callSummaryNote") || "You had a wonderful chat today. Stay cheerful and hydrated!", speechLocale);
    }
  };

  const handleConfirmSaveMemory = () => {
    if (!promptToSaveMemory) return;

    store.addJournalEntry({
      title: "Memory from Daily Routine Call",
      body: promptToSaveMemory,
      entry_date: todayStr,
      kind: "text",
    });

    setMemorySavedBadge(true);
    speakText(t("memorySavedConfirm") || "Saved to your Memory Bond journal!", speechLocale);
    setTimeout(() => {
      proceedToNextQuestion(answers);
    }, 1200);
  };

  const handleDeclineSaveMemory = () => {
    proceedToNextQuestion(answers);
  };

  const closeCall = () => {
    stopSpeaking();
    setIsCallActive(false);
  };

  const getRoutineIcon = (iconName: string) => {
    switch (iconName) {
      case "sun":
        return <Sun className="h-6 w-6 text-amber-500" />;
      case "coffee":
        return <Coffee className="h-6 w-6 text-amber-700" />;
      case "pill":
        return <Pill className="h-6 w-6 text-emerald-600" />;
      case "brain":
        return <Brain className="h-6 w-6 text-indigo-500" />;
      case "utensils":
        return <Utensils className="h-6 w-6 text-orange-500" />;
      case "phone":
        return <Phone className="h-6 w-6 text-rose-500" />;
      case "moon":
        return <Moon className="h-6 w-6 text-blue-500" />;
      case "bed":
        return <Bed className="h-6 w-6 text-violet-500" />;
      default:
        return <Sun className="h-6 w-6 text-amber-500" />;
    }
  };

  const handleToggleDone = (id: string, actName: string, isDone: boolean) => {
    store.toggleRoutineDone(id);
    if (!isDone) {
      speakText(`Well done on completing: ${actName}!`, speechLocale);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;

    store.addRoutine({
      time,
      activity: activity.trim(),
      icon,
      done_date: null,
    });

    setIsAddOpen(false);
    setActivity("");
  };

  const completedCount = store.routines.filter((r) => r.done_date === todayStr).length;

  return (
    <div className="space-y-6">
      {/* 1. Interactive "Daily Routine Call" Feature Banner (Section 10 of Prompt) */}
      <div className="rounded-3xl aurora-surface p-6 sm:p-8 shadow-lg text-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> Featured Daily Interaction
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              {t("dailyRoutineCall") || "Daily Routine Call"}
            </h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              {t("routineCallDesc") ||
                "A warm, natural daily conversation to check on your morning, medicines, and well-being."}
            </p>
          </div>

          <Button
            size="lg"
            onClick={startRoutineCall}
            className="bg-white text-foreground hover:bg-white/90 font-black rounded-2xl gap-2.5 h-14 px-8 text-base shadow-lg hover:scale-105 transition-all"
          >
            <PhoneCall className="h-5 w-5 text-primary animate-bounce" />
            {t("startRoutineCall") || "Start Daily Routine Call"}
          </Button>
        </div>
      </div>

      {/* Routine Timeline Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Sun className="h-7 w-7 text-primary" /> Visual Routine Schedule
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Structured rhythm of the day with large icons and clear progress tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-card border border-border px-4 py-2 font-bold shadow-xs text-sm">
            Today: {completedCount} / {store.routines.length} Done
          </span>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold text-sm h-11 px-5 rounded-2xl">
            <Plus className="h-4 w-4" /> Add Routine
          </Button>
        </div>
      </div>

      {/* Routine Items List */}
      <div className="space-y-3.5 max-w-2xl mx-auto">
        {store.routines.map((rt) => {
          const isDone = rt.done_date === todayStr;

          return (
            <div
              key={rt.id}
              className={`rounded-3xl border-2 p-5 flex items-center justify-between gap-4 transition-all shadow-xs ${
                isDone
                  ? "bg-success/10 border-success/40 opacity-80"
                  : "bg-card border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center shadow-inner shrink-0">
                  {getRoutineIcon(rt.icon)}
                </div>
                <div>
                  <span className="text-xs font-black text-primary tracking-wide flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {rt.time}
                  </span>
                  <h4
                    className={`text-lg sm:text-xl font-bold text-foreground mt-0.5 ${
                      isDone ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {rt.activity}
                  </h4>
                </div>
              </div>

              <Button
                size="lg"
                variant={isDone ? "outline" : "default"}
                onClick={() => handleToggleDone(rt.id, rt.activity, isDone)}
                className={`gap-2 font-bold rounded-2xl px-6 h-12 shrink-0 ${
                  isDone
                    ? "border-success text-success hover:bg-success/15"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                {isDone ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> Completed
                  </>
                ) : (
                  "Mark Done"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Interactive Daily Routine Call Dialog Modal */}
      {isCallActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-primary/40 bg-card p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
            {/* Top Close Button */}
            <button
              onClick={closeCall}
              className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary">
                <PhoneCall className="h-8 w-8 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-foreground">
                {t("dailyRoutineCall") || "Daily Routine Call"}
              </h3>
              {!callCompleted && (
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t("routineCallQuestion") || "Question"} {callStep + 1} of {routineQuestions.length} •{" "}
                  {routineQuestions[callStep]?.topic}
                </p>
              )}
            </div>

            {/* Conversation Flow */}
            {!callCompleted ? (
              <div className="space-y-5">
                {/* Active Question Box with Read-Aloud */}
                <div className="rounded-2xl border-2 border-primary/30 bg-primary/10 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg sm:text-xl font-black text-foreground leading-snug">
                      "{routineQuestions[callStep]?.question}"
                    </p>
                    <button
                      onClick={() =>
                        speakText(routineQuestions[callStep]?.question || "", speechLocale)
                      }
                      className="p-2 rounded-xl bg-card border border-primary/30 text-primary hover:bg-primary/20 shrink-0 shadow-xs"
                      title="Read aloud"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Section 12: Cherished Memory Offer Prompt if meaningful comment detected */}
                {promptToSaveMemory ? (
                  <div className="rounded-2xl border-2 border-warning bg-warning/15 p-5 space-y-4 animate-in fade-in">
                    <div className="flex items-center gap-2 text-warning-foreground font-black text-sm uppercase">
                      <BookmarkCheck className="h-5 w-5 text-warning" /> Cherished Moment Detected
                    </div>
                    <p className="text-base font-bold text-foreground">
                      {t("saveMemoryPrompt") ||
                        "That sounds like a wonderful moment! Would you like me to save this into your Memory Bond journal?"}
                    </p>
                    <p className="text-xs italic text-muted-foreground">"{promptToSaveMemory}"</p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        variant="default"
                        onClick={handleConfirmSaveMemory}
                        className="bg-success hover:bg-success/90 text-white font-bold h-12 rounded-xl"
                      >
                        <Check className="h-5 w-5 mr-1" /> Yes, Save Memory
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeclineSaveMemory}
                        className="font-bold h-12 rounded-xl"
                      >
                        Continue Call
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Senior-Friendly Quick Answer Options */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Tap a quick response:</p>
                      <div className="space-y-2">
                        {routineQuestions[callStep]?.quickOptions.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectQuickAnswer(opt)}
                            className="w-full text-left p-3.5 rounded-2xl border-2 border-border bg-card hover:bg-secondary/70 hover:border-primary font-bold text-sm text-foreground transition-all shadow-xs"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Or Type / Speak Custom Answer */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitAnswer(currentInput);
                      }}
                      className="flex gap-2 pt-1"
                    >
                      <Input
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        placeholder="Or speak / type your answer..."
                        className="h-12 rounded-2xl text-sm"
                      />
                      <Button
                        type="submit"
                        disabled={!currentInput.trim()}
                        className="h-12 px-5 font-bold rounded-2xl"
                      >
                        Next
                      </Button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              /* Completion Screen */
              <div className="text-center space-y-5 py-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-success/20 text-success mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-foreground">
                    {t("callCompleted") || "Daily Routine Call Completed!"}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {t("callSummaryNote") ||
                      "You had a wonderful chat today. Stay cheerful, hydrated, and have a peaceful day!"}
                  </p>
                </div>

                <div className="rounded-2xl bg-secondary/40 border border-border p-4 text-left text-xs space-y-1.5 max-h-48 overflow-y-auto">
                  <span className="font-black text-primary uppercase">Summary of Today's Call:</span>
                  {answers.map((a, idx) => (
                    <div key={idx} className="text-foreground">
                      <span className="font-bold">{a.topic}: </span>
                      <span>{a.answer}</span>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  onClick={closeCall}
                  className="w-full font-black text-base h-13 rounded-2xl shadow-md"
                >
                  {t("finishCall") || "Done"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Routine Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Add Custom Routine</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Time (24h format)</Label>
                <Input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl mt-1 font-mono text-lg font-bold"
                />
              </div>

              <div>
                <Label>Activity Name *</Label>
                <Input
                  required
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="e.g. Evening walk in the garden"
                  className="rounded-xl mt-1 font-semibold"
                />
              </div>

              <div>
                <Label>Category Icon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sun">Morning Sun</SelectItem>
                    <SelectItem value="coffee">Tea / Breakfast</SelectItem>
                    <SelectItem value="pill">Medicine</SelectItem>
                    <SelectItem value="brain">Brain Game</SelectItem>
                    <SelectItem value="utensils">Lunch / Meal</SelectItem>
                    <SelectItem value="phone">Family Call</SelectItem>
                    <SelectItem value="moon">Night Medicine</SelectItem>
                    <SelectItem value="bed">Rest & Sleep</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-xl font-bold bg-primary">
                  Save Routine
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
