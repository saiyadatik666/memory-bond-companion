import { useState, useEffect } from "react";
import {
  Sun,
  Pill,
  Bell,
  Gamepad2,
  HelpCircle,
  Mic,
  Users,
  AlertOctagon,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ClipboardCheck,
  Volume2,
  Sliders,
  Check,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

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
  const { t, lang, speechLocale } = useI18n();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const routinesDone = store.routines.filter((r) => r.done_date === todayStr).length;
  const nextMedicine = store.medicines[0];
  const nextReminder = store.reminders.find((r) => r.active && r.last_done !== todayStr);
  const nextAppointment = store.appointments[0];
  const lowStockMeds = store.medicines.filter((m) => m.stock <= m.refill_threshold);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  const speakEasyModeWelcome = () => {
    stopSpeaking();
    const speech =
      lang === "hi"
        ? `नमस्ते ${store.profile.full_name} जी। समय है ${currentTime}। आज के लिए आपकी दवाइयाँ और दिनचर्या तैयार हैं।`
        : `Namaste ${store.profile.full_name}. The time is ${currentTime}. Your daily routine and medicines are ready. Tap any large button.`;
    speakText(speech, speechLocale || "en-IN");
  };

  // -------------------------------------------------------------------------
  // 1. SENIOR EASY MODE VIEW (Ultra-simplified 2-column massive tiles)
  // -------------------------------------------------------------------------
  if (store.profile.easy_mode) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
        {/* Easy Mode Top Ribbon */}
        <div className="flex items-center justify-between bg-primary/10 border-2 border-primary/30 p-4 rounded-3xl">
          <div className="flex items-center gap-2 text-primary font-black text-sm">
            <Sparkles className="h-5 w-5" /> Senior Easy Mode Active (सरल मोड)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => store.updateProfile({ easy_mode: false })}
            className="rounded-2xl font-bold border-2 border-primary/40 text-foreground hover:bg-primary/20"
          >
            Switch to Standard View
          </Button>
        </div>

        {/* Easy Mode Massive Hero */}
        <div className="rounded-3xl border-3 border-foreground/30 bg-card p-6 sm:p-8 shadow-md text-card-foreground space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
                {currentTime || "10:00 AM"}
              </div>
              <div className="text-lg sm:text-xl font-bold text-muted-foreground mt-1">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            <Button
              size="lg"
              onClick={speakEasyModeWelcome}
              className="rounded-2xl font-black gap-2 h-14 px-6 text-base bg-secondary hover:bg-secondary/80 text-foreground border-2 border-border shadow-xs"
            >
              <Volume2 className="h-6 w-6 text-primary" /> Read Aloud
            </Button>
          </div>

          <div className="border-t-2 border-border pt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {greeting}, {store.profile.full_name}
            </h2>
            <p className="text-base font-semibold text-muted-foreground mt-0.5">
              Everything is calm and safe. Tap a button below for what you need.
            </p>
          </div>
        </div>

        {/* 4 Massive Essential Action Tiles (2-Column Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tile 1: Routine & Today */}
          <button
            onClick={() => onNavigate("routine")}
            className="rounded-3xl border-3 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 p-6 sm:p-8 text-left space-y-3 hover:border-amber-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex flex-col justify-between min-h-[200px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Sun className="h-9 w-9" />
              </div>
              <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200">
                1. TODAY
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                {t("today").toUpperCase()} & ROUTINE
              </div>
              <p className="text-base font-bold text-muted-foreground mt-1">
                {routinesDone} of {store.routines.length} completed today
              </p>
            </div>
          </button>

          {/* Tile 2: Medicines */}
          <button
            onClick={() => onNavigate("medicines")}
            className="rounded-3xl border-3 border-teal-500/50 bg-teal-50/50 dark:bg-teal-950/20 p-6 sm:p-8 text-left space-y-3 hover:border-teal-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex flex-col justify-between min-h-[200px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <Pill className="h-9 w-9" />
              </div>
              <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-teal-500/20 text-teal-900 dark:text-teal-200">
                2. MEDICINE
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                {t("medicines").toUpperCase()}
              </div>
              <p className="text-base font-bold text-teal-700 dark:text-teal-300 mt-1">
                {nextMedicine ? `${nextMedicine.name} (${nextMedicine.dosage})` : "All medicines taken"}
              </p>
            </div>
          </button>

          {/* Tile 3: Tap & Speak Assistant */}
          <button
            onClick={onOpenVoiceAssistant}
            className="rounded-3xl border-3 border-primary/50 bg-primary/10 p-6 sm:p-8 text-left space-y-3 hover:border-primary hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex flex-col justify-between min-h-[200px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Mic className="h-9 w-9" />
              </div>
              <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-primary/20 text-primary">
                3. VOICE
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                SPEAK TO COMPANION
              </div>
              <p className="text-base font-bold text-muted-foreground mt-1">
                Tap here and ask anything in your language
              </p>
            </div>
          </button>

          {/* Tile 4: High-Visibility SOS */}
          <button
            onClick={onOpenSos}
            className="rounded-3xl border-3 border-destructive bg-destructive/15 p-6 sm:p-8 text-left space-y-3 hover:bg-destructive hover:text-white hover:scale-[1.02] active:scale-95 transition-all shadow-md flex flex-col justify-between min-h-[200px] group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-destructive text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <AlertOctagon className="h-9 w-9" />
              </div>
              <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-destructive text-white">
                4. EMERGENCY
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-destructive group-hover:text-white">
                {t("sos").toUpperCase()} (मदद)
              </div>
              <p className="text-base font-bold text-destructive/80 group-hover:text-white/90 mt-1">
                Call caregiver & send emergency location
              </p>
            </div>
          </button>
        </div>

        {/* Quick Games & Memories Button in Easy Mode */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button
            size="lg"
            variant="outline"
            onClick={() => onNavigate("games")}
            className="rounded-2xl h-16 text-lg font-bold border-2 border-border gap-2"
          >
            <Gamepad2 className="h-6 w-6 text-indigo-600" /> Play Memory Games
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onNavigate("journal")}
            className="rounded-2xl h-16 text-lg font-bold border-2 border-border gap-2"
          >
            <HeartHandshake className="h-6 w-6 text-rose-600" /> Cherished Memories
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. STANDARD COMPREHENSIVE VIEW (All Features + Easy Mode Switcher)
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Friendly Warm Hero Card */}
      <div className="relative overflow-hidden rounded-3xl aurora-surface p-6 sm:p-10 shadow-lg text-white">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> Memory Bond Companion
            </div>
            {/* Quick Senior Easy Mode Toggle on Hero */}
            <button
              onClick={() => store.updateProfile({ easy_mode: true })}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/25 hover:bg-white/35 px-3 py-1 text-xs font-bold transition-all"
              title="Activate Senior Easy Mode"
            >
              <Sliders className="h-3.5 w-3.5" /> Switch to Easy Mode
            </button>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {greeting}, {store.profile.full_name}
          </h2>
          <p className="text-base sm:text-lg text-white/90 font-medium leading-relaxed">
            Wishing you a peaceful and cheerful day. Everything you need is right here.
          </p>

          {/* Quick AI Voice Trigger button right on the banner */}
          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={onOpenVoiceAssistant}
              className="bg-white text-foreground hover:bg-white/90 font-bold rounded-2xl gap-2.5 h-14 px-6 text-base shadow-md"
            >
              <Mic className="h-5 w-5 text-primary" /> {t("speak") || "Tap & Speak to Assistant"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("routine")}
              className="bg-white/15 border-white/30 text-white hover:bg-white/25 font-bold rounded-2xl gap-2 h-14 px-5 text-base"
            >
              <Sun className="h-5 w-5" /> Today's Routine
            </Button>
          </div>
        </div>

        {/* Decorative background orb */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Critical Refill Warning Banner if any */}
      {lowStockMeds.length > 0 && (
        <div
          onClick={() => onNavigate("medicines")}
          className="rounded-3xl border-2 border-warning/60 bg-warning/15 p-5 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:bg-warning/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-warning shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-foreground">
                {t("medicineLow") || "Your medicine is running low."}
              </h4>
              <p className="text-sm text-muted-foreground font-medium">
                {lowStockMeds[0]?.name} has {lowStockMeds[0]?.stock} {lowStockMeds[0]?.unit}s remaining. Tap to check refill.
              </p>
            </div>
          </div>
          <ChevronRight className="h-6 w-6 text-foreground shrink-0" />
        </div>
      )}

      {/* Senior Status Overview Ribbon: Next Med, Next Reminder, Appts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Next Medicine */}
        <div
          onClick={() => onNavigate("medicines")}
          className="rounded-3xl border-2 border-border bg-card p-5 shadow-xs space-y-2 cursor-pointer hover:border-primary/50 transition-all"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">{t("nextMedicine")}</span>
            <Pill className="h-5 w-5 text-teal-600" />
          </div>
          {nextMedicine ? (
            <div>
              <div className="text-xl font-bold text-foreground">{nextMedicine.name}</div>
              <div className="text-sm font-semibold text-primary">
                {nextMedicine.dosage} • {nextMedicine.times[0] || "08:30"}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No upcoming dose</div>
          )}
        </div>

        {/* Next Reminder */}
        <div
          onClick={() => onNavigate("reminders")}
          className="rounded-3xl border-2 border-border bg-card p-5 shadow-xs space-y-2 cursor-pointer hover:border-primary/50 transition-all"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">{t("nextReminder")}</span>
            <Bell className="h-5 w-5 text-sky-600" />
          </div>
          {nextReminder ? (
            <div>
              <div className="text-xl font-bold text-foreground truncate">{nextReminder.title}</div>
              <div className="text-sm font-semibold text-primary">At {nextReminder.time}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">All reminders completed today</div>
          )}
        </div>

        {/* Today's Appointments & Routine */}
        <div
          onClick={() => onNavigate("routine")}
          className="rounded-3xl border-2 border-border bg-card p-5 shadow-xs space-y-2 cursor-pointer hover:border-primary/50 transition-all"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">{t("progressToday")}</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">
              {routinesDone} of {store.routines.length} Done
            </div>
            <div className="text-sm font-semibold text-muted-foreground">Daily routine rhythm</div>
          </div>
        </div>
      </div>

      {/* 8 PRIMARY LARGE ACTION CARDS (Per Section 5 of Spec) */}
      <div>
        <h3 className="text-xl font-black text-foreground mb-4">Quick Activities</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. TODAY */}
          <button
            onClick={() => onNavigate("routine")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Sun className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              1. {t("today").toUpperCase()}
            </span>
          </button>

          {/* 2. MEDICINES */}
          <button
            onClick={() => onNavigate("medicines")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44"
          >
            <div className="w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <Pill className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              2. {t("medicines").toUpperCase()}
            </span>
          </button>

          {/* 3. MY REMINDERS */}
          <button
            onClick={() => onNavigate("reminders")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44"
          >
            <div className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              <Bell className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              3. {t("reminders").toUpperCase()}
            </span>
          </button>

          {/* 4. MEMORY GAMES */}
          <button
            onClick={() => onNavigate("games")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Gamepad2 className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              4. {t("games").toUpperCase()}
            </span>
          </button>

          {/* 5. MEMORY CUES */}
          <button
            onClick={() => onNavigate("cues")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
              <HelpCircle className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              5. {t("cues").toUpperCase()}
            </span>
          </button>

          {/* 6. VOICE NOTE / JOURNAL */}
          <button
            onClick={() => onNavigate("journal")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <Mic className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              6. {t("voiceNote").toUpperCase()}
            </span>
          </button>

          {/* 7. FAMILY */}
          <button
            onClick={() => onNavigate("family")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Users className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              7. {t("family").toUpperCase()}
            </span>
          </button>

          {/* 8. SOS (High Visibility Emergency Button) */}
          <button
            onClick={onOpenSos}
            className="group rounded-3xl border-3 border-destructive bg-destructive/10 p-6 text-center space-y-3 shadow-md hover:bg-destructive hover:text-white active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-destructive text-white flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse">
              <AlertOctagon className="h-9 w-9" />
            </div>
            <span className="text-lg font-black text-destructive group-hover:text-white">
              8. {t("sos").toUpperCase()}
            </span>
          </button>
        </div>
      </div>

      {/* Memory Check-in Quick Card */}
      <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-foreground">{t("checkin")}</h4>
            <p className="text-sm text-muted-foreground font-medium">
              5-minute non-diagnostic mental agility and orientation check.
            </p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={() => onNavigate("checkin")}
          className="font-bold rounded-2xl px-6 h-12 text-base"
        >
          Start Check-in
        </Button>
      </div>
    </div>
  );
}
