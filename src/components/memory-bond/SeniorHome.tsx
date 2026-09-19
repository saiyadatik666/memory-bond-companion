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
  BookOpen,
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

  // Use Amlodipine 5mg as primary medication if store empty or first
  const nextMedicine = store.medicines[0] || {
    id: "med-1",
    name: "Amlodipine 5mg",
    times: ["10:00 AM"],
    dosage: "5 mg (1 Tablet)",
  };
  const isMedTakenToday = store.medicineLogs.some(
    (l) => l.medicine_id === nextMedicine.id && l.status === "taken" && l.taken_at.startsWith(todayStr)
  );

  const speakWelcome = () => {
    stopSpeaking();
    speakText(
      `${greeting}, ${displayName}! Ready for today's activities? Today's memory match activity is waiting for you.`,
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
    setMoodSavedToast(`Feeling ${selected?.label} ${selected?.emoji}.`);
    setTimeout(() => setMoodSavedToast(null), 3000);
  };

  const handleTakeNextMedicine = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.takeMedicine(nextMedicine.id);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 space-y-5 sm:space-y-6 pb-12 sm:pb-16 select-none box-border">
      {/* ===================================================================== */}
      {/* 1. COMPACT OFFLINE SYNC STRIP (Section 27: Unobtrusive Indicator)     */}
      {/* ===================================================================== */}
      {(!store.isOnline || store.offlineModeForced) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 px-3.5 py-2 flex items-center justify-between text-xs text-amber-950 font-bold shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>📶</span>
            <span>Offline mode active — changes will sync automatically when you're online.</span>
          </div>
          {store.syncQueue.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-black shrink-0">
              {store.syncQueue.length} pending
            </span>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. GREETING HEADER (Section 4 & 6: "Good morning, Meena ❤️")          */}
      {/* ===================================================================== */}
      <div className="pt-1 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0F243E] tracking-tight flex items-center gap-2 flex-wrap">
            <span>{greeting}, {displayName}</span>
            <span className="text-rose-500 inline-block">❤️</span>
          </h1>
          <p className="text-sm sm:text-base font-bold text-[#5B728D] mt-0.5">
            Ready for today's activities?
          </p>
        </div>

        {/* Read aloud voice trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={speakWelcome}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4F8FD] hover:bg-[#EBF3FC] text-[#1E6FD9] border border-[#D0E2FF] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Read greeting aloud"
            aria-label="Read greeting aloud"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Read Aloud</span>
          </button>

          <span className="text-[11px] font-semibold text-[#829AB1] hidden sm:inline">
            Caregiver connected
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. PRIMARY ACTION: 🧠 TODAY'S MEMORY ACTIVITY (Section 6 & 32 HERO)   */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-gradient-to-br from-[#FAF5FF] via-white to-[#F3E8FF]/60 border-2 border-purple-200/90 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(147,51,234,0.08)] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100/90 px-3 py-1 rounded-full border border-purple-200">
              Today's Memory Activity
            </span>
            <span className="text-xs font-bold text-[#627D98]">• 5 min</span>
          </div>
          <span className="text-xs font-black text-purple-600 bg-white px-2.5 py-0.5 rounded-full border border-purple-100 shadow-2xs">
            Adaptive Lvl {store.gameSessions[0]?.level || 1}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-3xl shrink-0 shadow-md shadow-purple-600/25">
            🧠
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#0F243E] tracking-tight">
              Memory Match
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#5B728D] mt-0.5">
              "Remember today's objects"
            </p>
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => onNavigate("games")}
          className="w-full h-12 sm:h-14 rounded-2xl font-black text-base bg-purple-600 hover:bg-purple-700 active:scale-98 text-white shadow-md shadow-purple-600/25 gap-2 cursor-pointer transition-all"
        >
          <span>Start Activity</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ===================================================================== */}
      {/* 4. NEXT CARE TASK: 💊 MEDICINE REMINDER (Section 6, 7, 8 COMPACT)     */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-white border-2 border-teal-200/90 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.06)] space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">💊</span>
            <h3 className="text-base sm:text-lg font-black text-[#0F243E]">Next Medicine</h3>
          </div>
          {isMedTakenToday ? (
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
              <Check className="h-3.5 w-3.5 stroke-[3]" /> Taken
            </span>
          ) : (
            <span className="text-xs font-black text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
              Scheduled
            </span>
          )}
        </div>

        {/* Medicine Details row */}
        <div className="p-3 rounded-2xl bg-[#F4F8FD] border border-[#E2EAF5] flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-black text-base text-[#0F243E] truncate">{nextMedicine.name}</div>
            <div className="text-xs font-semibold text-[#5B728D] truncate">
              {nextMedicine.dosage || "5 mg (1 Tablet)"}
            </div>
          </div>
          <div className="text-xs font-extrabold text-teal-800 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs shrink-0">
            {nextMedicine.times?.[0] || "10:00 AM"}
          </div>
        </div>

        {/* Action Buttons: strictly stacked vertically on narrow screens, zero overflow */}
        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            size="lg"
            onClick={handleTakeNextMedicine}
            disabled={isMedTakenToday}
            className={`w-full sm:flex-1 h-12 rounded-2xl font-black text-sm sm:text-base gap-2 cursor-pointer transition-all shadow-xs ${
              isMedTakenToday
                ? "bg-emerald-600 text-white opacity-90 cursor-default"
                : "bg-teal-600 hover:bg-teal-700 active:scale-98 text-white shadow-teal-600/20"
            }`}
          >
            {isMedTakenToday ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>✓ Taken Today</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>✓ Taken</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => onNavigate("medicines")}
            className="w-full sm:w-auto h-12 px-4 rounded-2xl font-bold text-xs sm:text-sm text-[#486581] hover:text-[#0F243E] border-[#E2EAF5] cursor-pointer"
          >
            View Schedule
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. TODAY'S PROGRESS: 💧 HYDRATION & 🧩 ROUTINE (Section 6, 9, 10)     */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* HYDRATION CARD (Compact 5 / 8 glasses with droplets) */}
        <div className="rounded-3xl bg-white border border-sky-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">💧</span>
              <h3 className="text-base font-black text-[#0F243E]">Hydration</h3>
            </div>
            <span className="text-sm font-black text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              {store.hydrationGlasses} / {store.hydrationTarget} glasses
            </span>
          </div>

          {/* Visual 8-glass indicators */}
          <div className="grid grid-cols-8 gap-1.5 py-1">
            {Array.from({ length: store.hydrationTarget }).map((_, idx) => {
              const filled = idx < store.hydrationGlasses;
              return (
                <div
                  key={idx}
                  className={`h-8 rounded-lg flex items-center justify-center transition-all ${
                    filled
                      ? "bg-sky-500 text-white shadow-2xs"
                      : "bg-sky-50 border border-sky-200 text-sky-300"
                  }`}
                >
                  <Droplet className={`h-4 w-4 ${filled ? "fill-white" : ""}`} />
                </div>
              );
            })}
          </div>

          <Button
            size="sm"
            onClick={handleAddWater}
            className="w-full h-11 rounded-xl font-black text-xs sm:text-sm bg-sky-600 hover:bg-sky-700 active:scale-98 text-white shadow-xs gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Water</span>
          </Button>
        </div>

        {/* ACTIVITIES CARD (Compact 3 / 5 completed) */}
        <div className="rounded-3xl bg-white border border-amber-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧩</span>
              <h3 className="text-base font-black text-[#0F243E]">Activities</h3>
            </div>
            <span className="text-sm font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {routinesDone} / {totalRoutines} done
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1 py-1">
            <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((routinesDone / totalRoutines) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] font-semibold text-[#5B728D] flex justify-between">
              <span>Daily Routine</span>
              <span>{Math.round((routinesDone / totalRoutines) * 100)}% Completed</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("routine")}
            className="w-full h-11 rounded-xl font-black text-xs sm:text-sm text-amber-900 border-amber-300 hover:bg-amber-50 active:scale-98 shadow-xs cursor-pointer"
          >
            View Routine →
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. MOOD CHECK-IN (Section 8: How are you feeling today? ❤️)           */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-white border border-[#E2EAF5] p-4 sm:p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-black text-[#0F243E] flex items-center gap-1.5">
            <span>How are you feeling today?</span>
            <span className="text-rose-500">❤️</span>
          </h3>
          {moodSavedToast && (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
              {moodSavedToast}
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = store.todaysMood === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectMood(opt.id)}
                className={`p-2 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 min-h-[64px] sm:min-h-[72px] ${
                  isSelected
                    ? "bg-amber-50 border-amber-400 ring-2 ring-amber-300/40 shadow-xs"
                    : "bg-[#F8FAFD] border-[#E2EAF5] hover:bg-[#F0F5FB]"
                }`}
              >
                <span className="text-2xl sm:text-3xl">{opt.emoji}</span>
                <span
                  className={`text-[11px] sm:text-xs font-bold truncate ${
                    isSelected ? "text-amber-950 font-black" : "text-[#5B728D]"
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. QUICK ACCESS (Play Games, My Reminders, Family, Cultural Hub)      */}
      {/* ===================================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F243E] tracking-tight flex items-center gap-1.5">
              <span>Quick Access</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#5B728D]">
              Your everyday features
            </p>
          </div>
        </div>

        {/* 2x2 Grid on Mobile, 4-in-a-row on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Card 1: 🧠 Play Games */}
          <button
            type="button"
            onClick={() => onNavigate("games")}
            className="group p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#E2EAF5] hover:border-purple-300 hover:bg-purple-50/30 text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 flex flex-col justify-between min-h-[96px] sm:min-h-[104px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg sm:text-xl group-hover:scale-105 transition-transform shrink-0">
                🧠
              </div>
              <ChevronRight className="h-4 w-4 text-[#829AB1]/60 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
            <div className="mt-2 min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#0F243E] group-hover:text-purple-900 truncate">
                Play Games
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#5B728D] truncate">
                Memory & puzzles
              </div>
            </div>
          </button>

          {/* Card 2: 💊 My Reminders */}
          <button
            type="button"
            onClick={() => onNavigate("reminders")}
            className="group p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#E2EAF5] hover:border-teal-300 hover:bg-teal-50/30 text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 flex flex-col justify-between min-h-[96px] sm:min-h-[104px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-lg sm:text-xl group-hover:scale-105 transition-transform shrink-0">
                💊
              </div>
              <ChevronRight className="h-4 w-4 text-[#829AB1]/60 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
            <div className="mt-2 min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#0F243E] group-hover:text-teal-900 truncate">
                My Reminders
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#5B728D] truncate">
                Medicines & tasks
              </div>
            </div>
          </button>

          {/* Card 3: ❤️ Family */}
          <button
            type="button"
            onClick={() => onNavigate("family_tree")}
            className="group p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#E2EAF5] hover:border-rose-300 hover:bg-rose-50/30 text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 flex flex-col justify-between min-h-[96px] sm:min-h-[104px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg sm:text-xl group-hover:scale-105 transition-transform shrink-0">
                ❤️
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 hidden sm:inline">
                  Priya ❤️
                </span>
                <ChevronRight className="h-4 w-4 text-[#829AB1]/60 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
            <div className="mt-2 min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#0F243E] group-hover:text-rose-900 truncate">
                Family
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#5B728D] truncate">
                Connect with loved ones
              </div>
            </div>
          </button>

          {/* Card 4: 🌍 Cultural Hub (Replaces Memory Journal per requirements 23-30) */}
          {(() => {
            const userInterests = store.profile?.interests || [];
            let culturalSuggestion = "Culture, stories & traditions";
            let culturalBadge = "Explore";
            if (userInterests.includes("stories")) {
              culturalSuggestion = "Folk stories & inspiring tales";
              culturalBadge = "Stories ✨";
            } else if (userInterests.includes("music")) {
              culturalSuggestion = "Traditional songs & bhajans";
              culturalBadge = "Music 🎵";
            } else if (userInterests.includes("culture")) {
              culturalSuggestion = "Heritage & sacred traditions";
              culturalBadge = "Heritage 🛕";
            } else if (userInterests.includes("cooking")) {
              culturalSuggestion = "Traditional tastes & recipes";
              culturalBadge = "Taste 🍲";
            }

            return (
              <button
                type="button"
                onClick={() => onNavigate("cultural")}
                className="group p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#E2EAF5] hover:border-amber-300 hover:bg-amber-50/30 text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 flex flex-col justify-between min-h-[96px] sm:min-h-[104px]"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg sm:text-xl group-hover:scale-105 transition-transform shrink-0">
                    🌍
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 hidden sm:inline">
                      {culturalBadge}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#829AB1]/60 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
                <div className="mt-2 min-w-0">
                  <div className="text-xs sm:text-sm font-black text-[#0F243E] group-hover:text-amber-950 truncate">
                    Cultural Hub
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold text-[#5B728D] truncate">
                    {culturalSuggestion}
                  </div>
                </div>
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
