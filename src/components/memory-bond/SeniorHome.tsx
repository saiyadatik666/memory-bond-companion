import React, { useState, useEffect } from "react";
import {
  Brain,
  Pill,
  Droplet,
  Calendar,
  Mic,
  Volume2,
  CheckCircle2,
  Check,
  ChevronRight,
  WifiOff,
  AlertTriangle,
  AlertOctagon,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Phone,
  MessageSquare,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

const MOOD_OPTIONS = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "good", emoji: "🙂", label: "Good" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "worried", emoji: "😟", label: "Worried" },
  { id: "sad", emoji: "😢", label: "Sad" },
];

export function SeniorHome({
  store,
  onNavigate,
  onOpenSos,
  onOpenVoiceAssistant,
}: {
  store: MemoryBondStore;
  onNavigate: (tab: string) => void;
  onOpenSos: () => void;
  onOpenVoiceAssistant: () => void;
}) {
  const { t, speechLocale } = useI18n();
  const [hour, setHour] = useState<number>(9);
  const [justDrankWater, setJustDrankWater] = useState<boolean>(false);
  const [moodSavedToast, setMoodSavedToast] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHour(now.getHours());
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = (() => {
    if (hour < 12) return t("goodMorning") || "Good Morning";
    if (hour < 17) return t("goodAfternoon") || "Good Afternoon";
    return t("goodEvening") || "Good Evening";
  })();

  const rawName = store.profile.full_name?.trim() || "Meena";
  const displayName = rawName.split(" ")[0] || "Meena";

  // Calculate routine completion
  const todayStr = new Date().toISOString().split("T")[0];
  const routinesDone = store.routines.filter((r) => r.done_date === todayStr).length;
  const totalRoutines = store.routines.length || 5;

  // Next medicine details
  const nextMedicine = store.medicines[0] || {
    id: "med-1",
    name: "Metformin 500mg",
    times: ["10:00 AM"],
    dosage: "500mg (1 Tablet)",
  };
  const isMedTakenToday = store.medicineLogs.some(
    (l) => l.medicine_id === nextMedicine.id && l.status === "taken" && l.taken_at.startsWith(todayStr)
  );

  const speakWelcome = () => {
    stopSpeaking();
    speakText(
      `${greeting}, ${displayName}! Ready for today's activities? You have completed ${routinesDone} out of ${totalRoutines} daily routines.`,
      speechLocale || "en-IN"
    );
  };

  const handleAddWater = () => {
    store.addHydrationGlass();
    setJustDrankWater(true);
    setTimeout(() => setJustDrankWater(false), 2000);
  };

  const handleSelectMood = (moodId: string) => {
    store.setTodaysMood(moodId);
    const selected = MOOD_OPTIONS.find((m) => m.id === moodId);
    setMoodSavedToast(`Feeling ${selected?.label} ${selected?.emoji}. Saved to your journal!`);
    setTimeout(() => setMoodSavedToast(null), 3000);
  };

  const handleTakeNextMedicine = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.takeMedicine(nextMedicine.id);
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto select-none">
      {/* ===================================================================== */}
      {/* 1. OFFLINE SYSTEM BANNER (Section 25: North Eastern Region Use Case)   */}
      {/* ===================================================================== */}
      {(!store.isOnline || store.offlineModeForced) && (
        <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/95 p-4 sm:p-5 shadow-sm flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <WifiOff className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-black text-amber-950 flex items-center gap-2">
                <span>📶 You're Offline</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  Local Mode Active
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-amber-900/80 mt-0.5">
                Memory Bond is still working. Your games, reminders and activity logs will sync when you're back online.
              </p>
            </div>
          </div>
          {store.syncQueue.length > 0 && (
            <span className="px-3 py-1.5 rounded-2xl bg-amber-500 text-white text-xs font-black shrink-0 shadow-xs">
              {store.syncQueue.length} pending
            </span>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. HERO GREETING SECTION (Section 10: "Good Morning, Meena ❤️")      */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E2EAF5] shadow-[0_4px_24px_-4px_rgba(15,36,62,0.05)] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-left min-w-0 w-full md:w-auto flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
              Senior Care Companion
            </span>
            <span className="text-xs font-bold text-muted-foreground">•</span>
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Today</span>
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F243E] font-display tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>{greeting}, {displayName}</span>
              <span className="text-rose-500 text-3xl sm:text-4xl">❤️</span>
            </h1>
            <p className="text-base sm:text-lg font-bold text-[#5B728D] mt-1.5 leading-relaxed">
              Ready for today's activities?
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={speakWelcome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F4F8FD] hover:bg-[#EBF3FC] text-[#1E6FD9] border border-[#E2EAF5] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.01]"
              title="Read aloud"
            >
              <Volume2 className="h-4 w-4" />
              <span>Read Aloud</span>
            </button>

            <span className="text-xs font-semibold text-[#829AB1]">
              Caregiver {store.caregiverLinks[0]?.caregiver_name || "Priya Patel"} is connected
            </span>
          </div>
        </div>

        {/* Big Prominent "Talk to Memory Bond" Button (Section 10 & 16) */}
        <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row items-center gap-3">
          <Button
            size="lg"
            onClick={onOpenVoiceAssistant}
            className="w-full sm:w-auto h-16 sm:h-18 px-8 rounded-3xl font-black text-base sm:text-lg bg-gradient-to-r from-primary via-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-xl shadow-primary/25 gap-3.5 cursor-pointer transition-transform hover:scale-[1.02] active:scale-98"
          >
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs uppercase tracking-wider text-blue-100 font-bold">Voice Companion</div>
              <div className="text-base sm:text-lg font-black">Talk to Memory Bond</div>
            </div>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. THE 4 LARGE CARDS (Section 10 Core Specification)                 */}
      {/*    1. 🧠 Today's Brain Activity                                      */}
      {/*    2. 💊 Medicine                                                    */}
      {/*    3. 💧 Hydration                                                   */}
      {/*    4. 📅 Today's Routine                                             */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* CARD 1: 🧠 Today's Brain Activity */}
        <div className="rounded-3xl bg-white border-2 border-purple-200/80 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(15,36,62,0.05)] hover:border-purple-300 transition-all flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-700 border border-purple-300/40 flex items-center justify-center text-3xl shrink-0">
                🧠
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100/70 px-3 py-1 rounded-full">
                  5 Minutes
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#0F243E] font-display mt-1">
                  Today's Brain Activity
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold text-[#5B728D] shrink-0">
              Adaptive Level {store.gameSessions[0]?.level || 2}
            </span>
          </div>

          <p className="text-sm font-semibold text-[#5B728D] leading-relaxed">
            Gentle memory exercise with familiar keepsakes. Keeps your mind active and alert in just 5 relaxing minutes.
          </p>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#EDF2F7]">
            <div className="text-xs font-bold text-[#5B728D] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>AI Recommended: Memory Match</span>
            </div>
            <Button
              size="lg"
              onClick={() => onNavigate("games")}
              className="h-13 px-6 rounded-2xl font-black text-base bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <span>Start Activity</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* CARD 2: 💊 Medicine */}
        <div className="rounded-3xl bg-white border-2 border-teal-200/80 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(15,36,62,0.05)] hover:border-teal-300 transition-all flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/15 text-teal-700 border border-teal-300/40 flex items-center justify-center text-3xl shrink-0">
                💊
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-100/70 px-3 py-1 rounded-full">
                  Next: {nextMedicine.times?.[0] || "10:00 AM"}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#0F243E] font-display mt-1">
                  Medicine Reminder
                </h3>
              </div>
            </div>

            {isMedTakenToday ? (
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Taken
              </span>
            ) : (
              <span className="text-xs font-black text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
                Scheduled
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4F8FD] border border-[#E2EAF5] flex items-center justify-between gap-3">
            <div>
              <div className="font-black text-base text-[#0F243E]">{nextMedicine.name}</div>
              <div className="text-xs font-semibold text-[#5B728D]">{nextMedicine.dosage || "1 Tablet with water"}</div>
            </div>
            <div className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
              10:00 AM
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#EDF2F7]">
            <Button
              variant="outline"
              onClick={() => onNavigate("medicines")}
              className="h-13 px-5 rounded-2xl font-bold text-sm cursor-pointer"
            >
              View Schedule
            </Button>

            <Button
              size="lg"
              onClick={handleTakeNextMedicine}
              disabled={isMedTakenToday}
              className={`h-13 px-6 rounded-2xl font-black text-base gap-2 cursor-pointer shadow-md transition-transform hover:scale-[1.02] ${
                isMedTakenToday
                  ? "bg-emerald-600 text-white opacity-85 cursor-default"
                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20"
              }`}
            >
              {isMedTakenToday ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Taken Today</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Mark as Taken</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* CARD 3: 💧 Hydration */}
        <div className="rounded-3xl bg-white border-2 border-sky-200/80 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(15,36,62,0.05)] hover:border-sky-300 transition-all flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/15 text-sky-700 border border-sky-300/40 flex items-center justify-center text-3xl shrink-0">
                💧
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-sky-800 bg-sky-100/70 px-3 py-1 rounded-full">
                  Daily Goal
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#0F243E] font-display mt-1">
                  Hydration Tracker
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-sky-700 font-display">
                {store.hydrationGlasses}
              </span>
              <span className="text-sm font-bold text-[#829AB1]"> / {store.hydrationTarget} glasses</span>
            </div>
          </div>

          {/* Visual Glass Indicators (8 Glasses) */}
          <div className="space-y-2">
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: store.hydrationTarget }).map((_, idx) => {
                const filled = idx < store.hydrationGlasses;
                return (
                  <div
                    key={idx}
                    className={`h-10 rounded-xl flex items-center justify-center transition-all ${
                      filled
                        ? "bg-sky-500 text-white shadow-xs scale-102"
                        : "bg-sky-50 border border-sky-200 text-sky-300"
                    }`}
                  >
                    <Droplet className={`h-5 w-5 ${filled ? "fill-white" : ""}`} />
                  </div>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-[#5B728D]">
              {store.hydrationGlasses >= store.hydrationTarget
                ? "🎉 Great job! You have reached your daily water goal."
                : `Drink ${store.hydrationTarget - store.hydrationGlasses} more glasses today to stay hydrated.`}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#EDF2F7]">
            <span className="text-xs font-bold text-[#5B728D]">
              {justDrankWater ? "💧 Glass recorded!" : "Tap when you finish a glass"}
            </span>

            <Button
              size="lg"
              onClick={handleAddWater}
              className="h-13 px-6 rounded-2xl font-black text-base bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 gap-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-98"
            >
              <Plus className="h-5 w-5" />
              <span>+ I Drank Water</span>
            </Button>
          </div>
        </div>

        {/* CARD 4: 📅 Today's Routine */}
        <div className="rounded-3xl bg-white border-2 border-amber-200/80 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(15,36,62,0.05)] hover:border-amber-300 transition-all flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-300/40 flex items-center justify-center text-3xl shrink-0">
                📅
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100/70 px-3 py-1 rounded-full">
                  Daily Rhythm
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#0F243E] font-display mt-1">
                  Today's Routine
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-amber-700 font-display">
                {routinesDone}
              </span>
              <span className="text-sm font-bold text-[#829AB1]"> / {totalRoutines} completed</span>
            </div>
          </div>

          {/* Routine Progress bar & preview */}
          <div className="space-y-2">
            <div className="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((routinesDone / totalRoutines) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#5B728D]">
              <span>Morning Routine</span>
              <span>{Math.round((routinesDone / totalRoutines) * 100)}% Done</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#EDF2F7]">
            <span className="text-xs font-bold text-[#5B728D]">
              Next: Afternoon Walk (04:30 PM)
            </span>

            <Button
              size="lg"
              onClick={() => onNavigate("routine")}
              className="h-13 px-6 rounded-2xl font-black text-base bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <span>View Routine</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. MOOD CHECK-IN (Section 23: How are you feeling today?)             */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-white border border-[#E2EAF5] p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,36,62,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#0F243E] font-display flex items-center gap-2">
              <span>How are you feeling today?</span>
              <span>🌸</span>
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#5B728D]">
              Tap an emoji to check in with your companion and family.
            </p>
          </div>

          {moodSavedToast && (
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
              {moodSavedToast}
            </span>
          )}
        </div>

        {/* 5 Large Interactive Mood Buttons */}
        <div className="grid grid-cols-5 gap-2.5 sm:gap-4 pt-1">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = store.todaysMood === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectMood(opt.id)}
                className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95 ${
                  isSelected
                    ? "bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-300/50"
                    : "bg-[#F8FAFD] border-[#E2EAF5] hover:bg-[#F0F5FB]"
                }`}
              >
                <span className="text-3xl sm:text-4xl">{opt.emoji}</span>
                <span className={`text-xs sm:text-sm font-black ${isSelected ? "text-amber-950" : "text-[#5B728D]"}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. FAMILY & SOS SHORTCUTS (Sections 21 & 24)                          */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Family Connection */}
        <div className="rounded-3xl bg-white border border-[#E2EAF5] p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,36,62,0.04)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm">
                  ❤️
                </div>
                <h4 className="text-lg font-black text-[#0F243E] font-display">My Family</h4>
              </div>
              <button
                onClick={() => onNavigate("family_tree")}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                View Photos →
              </button>
            </div>

            <div className="space-y-2.5 pt-3">
              {/* Priya - Daughter */}
              <div className="p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2EAF5] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-700 font-black flex items-center justify-center text-sm">
                    P
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#0F243E]">Priya Patel</div>
                    <div className="text-xs font-semibold text-[#5B728D]">Daughter • Primary Caregiver</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href="tel:+919876543210"
                    className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-2xs"
                    title="Call Priya"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => onNavigate("family_tree")}
                    className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                    title="Message Priya"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Rahul - Son */}
              <div className="p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2EAF5] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-500/15 text-sky-700 font-black flex items-center justify-center text-sm">
                    R
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#0F243E]">Rahul Patel</div>
                    <div className="text-xs font-semibold text-[#5B728D]">Son • Bengaluru</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href="tel:+919876543211"
                    className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-2xs"
                    title="Call Rahul"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SOS Quick Access (Section 24) */}
        <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-white to-rose-50/40 border-2 border-rose-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(15,36,62,0.04)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-sm font-black">
                  🆘
                </div>
                <h4 className="text-lg font-black text-[#0F243E] font-display">SOS Emergency Help</h4>
              </div>
              <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                24/7 Family Alert
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[#5B728D] pt-3 leading-relaxed">
              Need immediate help or feeling unwell? One tap notifies your daughter Priya and emergency contacts with your current location.
            </p>
          </div>

          <Button
            size="lg"
            onClick={onOpenSos}
            className="w-full h-14 rounded-2xl font-black text-base bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 gap-2.5 cursor-pointer transition-transform hover:scale-[1.01] active:scale-98"
          >
            <AlertOctagon className="h-5 w-5" />
            <span>Open SOS Emergency Help</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
