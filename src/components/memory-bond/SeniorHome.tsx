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
  Footprints,
  Compass,
  MessageCircle,
  Droplets,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import { MemoryGarden } from "./MemoryGarden";

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
  const lowStockMeds = store.medicines.filter((m) => m.stock <= m.refill_threshold);
  const nextAppointment = store.appointments[0];
  const primaryCaregiver = store.caregiverLinks[0];
  const hydrationReminder = store.reminders.find((r) => r.type === "hydration");
  const isHydrated = hydrationReminder ? hydrationReminder.last_done === todayStr : false;
  const medsDoneToday = store.medicineLogs.filter(
    (l) => l.taken_at?.slice(0, 10) === todayStr && l.status === "taken"
  ).length;

  const hour = new Date().getHours();
  const greeting = (() => {
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  // Proactive Personalized AI Recommendation (Section 12)
  const proactiveAiPrompt = (() => {
    if (hour >= 8 && hour < 12) {
      return lang === "hi"
        ? `शुभ प्रभात ${store.profile.full_name} जी। क्या आप आज का शांत मेमोरी गेम खेलना चाहेंगे?`
        : `Good morning ${store.profile.full_name}. Would you like to play your morning memory activity?`;
    } else if (hour >= 16 && hour < 19) {
      return lang === "hi"
        ? `${store.profile.full_name} जी, शाम की ताज़ा हवा में 20 मिनट टहलने का समय हो गया है।`
        : `${store.profile.full_name}, it is a pleasant time for your gentle 20-minute evening walk.`;
    }
    return lang === "hi"
      ? `${store.profile.full_name} जी, आपकी दवाइयाँ और दिनचर्या पूरी तरह तैयार हैं।`
      : `${store.profile.full_name}, everything is calm and safe. What would you like to do?`;
  })();

  const speakWelcome = () => {
    stopSpeaking();
    speakText(proactiveAiPrompt, speechLocale || "en-IN");
  };

  // -------------------------------------------------------------------------
  // 1. SENIOR EASY MODE VIEW (Ultra-simplified large tiles, high contrast)
  // -------------------------------------------------------------------------
  if (store.profile.easy_mode) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
        {/* Easy Mode Top Banner */}
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

        {/* Easy Mode Massive Hero Card */}
        <div className="rounded-3xl border-3 border-foreground/30 bg-card p-6 sm:p-8 shadow-md text-card-foreground space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
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
              onClick={speakWelcome}
              className="rounded-2xl font-black gap-2 h-14 px-6 text-base bg-secondary hover:bg-secondary/80 text-foreground border-2 border-border shadow-xs"
            >
              <Volume2 className="h-6 w-6 text-primary" /> Read Aloud
            </Button>
          </div>

          <div className="border-t-2 border-border pt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {greeting}, {store.profile.full_name}
            </h2>
            <p className="text-base font-bold text-primary mt-1">
              ✨ {proactiveAiPrompt}
            </p>
          </div>
        </div>

        {/* EMERGENCY SOS SECTION — CENTERED & HIGHLY PROMINENT (Section 4) */}
        <div className="rounded-3xl border-4 border-destructive bg-destructive/10 p-6 sm:p-8 shadow-lg text-center flex flex-col items-center justify-center space-y-4">
          <span className="text-xs font-black uppercase tracking-widest text-destructive bg-destructive/15 px-4 py-1 rounded-full">
            Emergency Assistance System
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-destructive">
            NEED HELP IMMEDIATELY?
          </h3>
          <p className="text-sm font-bold text-foreground max-w-sm mx-auto">
            One tap to speak with AI or call your family & emergency services.
          </p>
          <button
            type="button"
            onClick={onOpenSos}
            className="w-full sm:w-80 h-20 rounded-3xl bg-destructive hover:bg-destructive/90 text-white font-black text-2xl tracking-wider shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
          >
            <AlertOctagon className="h-9 w-9 animate-pulse" />
            {t("sos").toUpperCase()} (मदद लें)
          </button>
        </div>

        {/* 4 Massive Essential Action Tiles (2-Column Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tile 1: Routine & Today */}
          <button
            onClick={() => onNavigate("routine")}
            className="rounded-3xl border-3 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 p-6 sm:p-8 text-left space-y-3 hover:border-amber-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex flex-col justify-between min-h-[190px]"
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
            className="rounded-3xl border-3 border-teal-500/50 bg-teal-50/50 dark:bg-teal-950/20 p-6 sm:p-8 text-left space-y-3 hover:border-teal-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex flex-col justify-between min-h-[190px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <Pill className="h-9 w-9" />
              </div>
              <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-teal-500/20 text-teal-900 dark:text-teal-200">
                2. MEDICINES
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

          {/* Tile 3: Voice Companion */}
          <button
            onClick={onOpenVoiceAssistant}
            className="rounded-3xl border-3 border-primary/50 bg-primary/10 p-6 sm:p-8 text-left space-y-3 hover:border-primary hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex flex-col justify-between min-h-[190px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Mic className="h-9 w-9" />
              </div>
              <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-primary/20 text-primary">
                3. VOICE AI
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                SPEAK TO COMPANION
              </div>
              <p className="text-base font-bold text-muted-foreground mt-1">
                Tap and talk naturally in your language
              </p>
            </div>
          </button>

          {/* Tile 4: Reminders & Walk */}
          <button
            onClick={() => onNavigate("reminders")}
            className="rounded-3xl border-3 border-sky-500/50 bg-sky-50/50 dark:bg-sky-950/20 p-6 sm:p-8 text-left space-y-3 hover:border-sky-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex flex-col justify-between min-h-[190px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                <Bell className="h-9 w-9" />
              </div>
              <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-sky-500/20 text-sky-900 dark:text-sky-200">
                4. REMINDERS
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                SMART REMINDERS
              </div>
              <p className="text-base font-bold text-muted-foreground mt-1">
                Medicines, walking, hydration, shopping
              </p>
            </div>
          </button>
        </div>

        {/* Quick Cultural Connect & Games */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button
            size="lg"
            variant="outline"
            onClick={() => onNavigate("cultural")}
            className="rounded-2xl h-16 text-lg font-bold border-2 border-emerald-500/40 gap-2 bg-emerald-500/10 text-foreground"
          >
            <Compass className="h-6 w-6 text-emerald-600" /> North-East Cultural Hub
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onNavigate("social")}
            className="rounded-2xl h-16 text-lg font-bold border-2 border-rose-500/40 gap-2 bg-rose-500/10 text-foreground"
          >
            <MessageCircle className="h-6 w-6 text-rose-600" /> Family Voice Feed
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. STANDARD COMPREHENSIVE VIEW
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Friendly Warm Hero Card with Proactive Personalization */}
      <div className="relative overflow-hidden rounded-3xl aurora-surface p-6 sm:p-10 shadow-lg text-white">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> Memory Bond Companion
            </div>
            <button
              onClick={() => store.updateProfile({ easy_mode: true })}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/25 hover:bg-white/35 px-3 py-1 text-xs font-bold transition-all cursor-pointer"
              title="Activate Senior Easy Mode"
            >
              <Sliders className="h-3.5 w-3.5" /> Switch to Easy Mode
            </button>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {greeting}, {store.profile.full_name}
          </h2>
          <p className="text-base sm:text-lg text-white/95 font-semibold leading-relaxed">
            ✨ {proactiveAiPrompt}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={onOpenVoiceAssistant}
              className="bg-white text-foreground hover:bg-white/90 font-black rounded-2xl gap-2.5 h-14 px-6 text-base shadow-md"
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

        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* DEDICATED CENTERED EMERGENCY SOS HERO (Section 4) */}
      <div className="rounded-3xl border-4 border-destructive bg-destructive/10 p-6 sm:p-8 shadow-lg text-center flex flex-col items-center justify-center space-y-4 mx-auto w-full">
        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-destructive bg-destructive/15 px-4 py-1.5 rounded-full">
          <AlertOctagon className="h-4 w-4" /> Priority Safety & SOS Assistance (आपत्कालीन मदद)
        </div>
        
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-2xl sm:text-3xl font-black text-destructive tracking-tight">
            NEED IMMEDIATE HELP? (मदद चाहिए?)
          </h3>
          <p className="text-sm sm:text-base font-semibold text-foreground">
            One tap to speak with AI or instantly notify family & emergency services with your location.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSos}
          className="w-full sm:w-96 h-18 sm:h-20 rounded-3xl bg-destructive hover:bg-destructive/90 text-white font-black text-xl sm:text-2xl tracking-wider shadow-2xl flex items-center justify-center gap-3.5 transition-transform active:scale-95 cursor-pointer mx-auto"
        >
          <AlertOctagon className="h-8 w-8 sm:h-9 sm:w-9 animate-pulse shrink-0" />
          <span>{t("sos").toUpperCase()} (मदद लें / TAP FOR SOS)</span>
        </button>

        <p className="text-xs text-muted-foreground font-semibold">
          10-second hold protection or direct voice emergency interaction available.
        </p>
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
                {lowStockMeds[0]?.name} has {lowStockMeds[0]?.stock} {lowStockMeds[0]?.unit}s remaining (~{Math.floor(lowStockMeds[0]?.stock / (lowStockMeds[0]?.daily_usage || 1))} days). Caregiver notified.
              </p>
            </div>
          </div>
          <ChevronRight className="h-6 w-6 text-foreground shrink-0" />
        </div>
      )}

      {/* Senior Status Overview Ribbon: Next Med, Reminder/Tasks, Appointment, Hydration, Caregiver, CES Score */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Medicine Status */}
        <div
          onClick={() => onNavigate("medicines")}
          className="rounded-3xl border-2 border-border bg-card p-4 sm:p-5 shadow-xs space-y-1.5 cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t("medicines")}</span>
            <Pill className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground truncate">{nextMedicine ? nextMedicine.name : "Meds"}</div>
            <div className="text-xs font-semibold text-primary">
              {medsDoneToday > 0 ? `✓ ${medsDoneToday} Taken Today` : nextMedicine?.times[0] ? `At ${nextMedicine.times[0]}` : "All Done"}
            </div>
          </div>
        </div>

        {/* 2. Next Reminder & Tasks */}
        <div
          onClick={() => onNavigate("reminders")}
          className="rounded-3xl border-2 border-border bg-card p-4 sm:p-5 shadow-xs space-y-1.5 cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reminder</span>
            <Bell className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground truncate">
              {nextReminder ? nextReminder.title : "Daily Tasks"}
            </div>
            <div className="text-xs font-semibold text-primary">
              {nextReminder ? `${nextReminder.time}` : "Completed"}
            </div>
          </div>
        </div>

        {/* 3. Appointment Status */}
        <div
          onClick={() => onNavigate("appointments")}
          className="rounded-3xl border-2 border-border bg-card p-4 sm:p-5 shadow-xs space-y-1.5 cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Appointment</span>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground truncate">
              {nextAppointment ? nextAppointment.title : "Doctor Visit"}
            </div>
            <div className="text-xs font-semibold text-primary">
              {nextAppointment ? `${nextAppointment.date} • ${nextAppointment.time}` : "No clinic today"}
            </div>
          </div>
        </div>

        {/* 4. Hydration Status */}
        <div
          onClick={() => onNavigate("routine")}
          className="rounded-3xl border-2 border-border bg-card p-4 sm:p-5 shadow-xs space-y-1.5 cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hydration</span>
            <Droplets className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">
              {isHydrated ? "Hydrated" : "Drink Water"}
            </div>
            <div className="text-xs font-semibold text-primary">
              {isHydrated ? "✓ Goal Met Today" : "💧 Warm glass advised"}
            </div>
          </div>
        </div>

        {/* 5. Family & Caregiver Connection Status */}
        <div
          onClick={() => onNavigate("family")}
          className="rounded-3xl border-2 border-border bg-card p-4 sm:p-5 shadow-xs space-y-1.5 cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Caregiver</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground truncate">
              {primaryCaregiver ? primaryCaregiver.caregiver_name.split(" ")[0] : "Family"}
            </div>
            <div className="text-xs font-semibold text-emerald-400">
              ● Connected & Safe
            </div>
          </div>
        </div>

        {/* 6. Cognitive Engagement Score (CES) */}
        <div
          onClick={() => onNavigate("games")}
          className="rounded-3xl border-2 border-border bg-card p-4 sm:p-5 shadow-xs space-y-1.5 cursor-pointer hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mind CES</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-lg font-black text-foreground">
              {store.cognitiveScore.overall} / 100
            </div>
            <div className="text-xs font-bold text-success">
              Active Engagement
            </div>
          </div>
        </div>
      </div>

      {/* Memory Garden (Section 1 & 5) */}
      <MemoryGarden store={store} onNavigate={onNavigate} compact={true} />

      {/* 8 PRIMARY LARGE ACTION TILES */}
      <div>
        <h3 className="text-xl font-black text-foreground mb-4">Daily Activities & Memory Support</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. TODAY */}
          <button
            onClick={() => onNavigate("routine")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
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
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
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
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
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
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Gamepad2 className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              4. {t("games").toUpperCase()}
            </span>
          </button>

          {/* 5. NER CULTURAL CONNECT (Section 14) */}
          <button
            onClick={() => onNavigate("cultural")}
            className="group rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3 shadow-sm hover:border-emerald-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Compass className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-emerald-600">
              5. CULTURAL HUB
            </span>
          </button>

          {/* 6. SOCIAL & FAMILY FEED (Section 18) */}
          <button
            onClick={() => onNavigate("social")}
            className="group rounded-3xl border-2 border-rose-500/30 bg-rose-500/5 p-6 text-center space-y-3 shadow-sm hover:border-rose-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <MessageCircle className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-rose-600">
              6. FAMILY GREETINGS
            </span>
          </button>

          {/* 7. MEMORY CUES */}
          <button
            onClick={() => onNavigate("cues")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
              <HelpCircle className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              7. {t("cues").toUpperCase()}
            </span>
          </button>

          {/* 8. MEMORY JOURNAL */}
          <button
            onClick={() => onNavigate("journal")}
            className="group rounded-3xl border-2 border-border bg-card p-6 text-center space-y-3 shadow-sm hover:border-primary hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <HeartHandshake className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-primary">
              8. CHERISHED NOTES
            </span>
          </button>
        </div>
      </div>

      {/* Memory Check-in Baseline Quick Card */}
      <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-foreground">{t("checkin")} & Baseline Profile</h4>
            <p className="text-sm text-muted-foreground font-medium">
              5-minute non-diagnostic mental agility and orientation check-in.
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
