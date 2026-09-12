import { useState, useEffect, useRef } from "react";
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
  WifiOff,
  Heart,
  Bot,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import { MemoryGarden } from "./MemoryGarden";
import { SosHoldControl } from "./SosHoldControl";

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
  // Kept in state so server and first client render agree (no hydration mismatch)
  const [hour, setHour] = useState<number>(9);

  // Daily Shopping & Quick Checklist State (Section 13)
  const [shoppingItems, setShoppingItems] = useState([
    { id: "shop-1", name: "Fresh Milk & Curd (दूध और दही)", done: false },
    { id: "shop-2", name: "Fresh Seasonal Vegetables (सब्ज़ियाँ)", done: true },
    { id: "shop-3", name: "Herbal Green Tea & Honey (हर्बल चाय)", done: false },
  ]);

  const toggleShoppingItem = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  // Anti-restart cooldown check
  const isSosCooldownActive = () => {
    if (typeof window !== "undefined") {
      const lockUntil = (window as any).__mb_last_sos_cancelled || 0;
      if (Date.now() < lockUntil) return true;
    }
    return false;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHour(now.getHours());
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

        {/* EMERGENCY SOS SECTION — STRICT 3-SECOND CONTINUOUS HOLD */}
        <SosHoldControl variant="heroCard" onTrigger={onOpenSos} />

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
      {/* 1. VISIBLE OFFLINE MODE BANNER (SIH 2026 Section 24 & 25) */}
      {!store.isOnline && (
        <div className="rounded-3xl border-3 border-amber-500 bg-amber-500/15 p-5 sm:p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <WifiOff className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
                <span>🟠 OFFLINE MODE (অফলাইন মোড)</span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mt-0.5 max-w-xl">
                Memory Bond is still working. Your medicines, routines, and games are saved locally and will synchronize automatically when connectivity returns.
              </p>
            </div>
          </div>
          {store.syncQueue.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shrink-0 shadow-xs">
              {store.syncQueue.length} Activity Updates Stored Locally
            </span>
          )}
        </div>
      )}

      {/* 2. WELCOMING TOP SECTION (Section 5) */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-50/90 via-indigo-50/50 to-amber-50/60 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-amber-950/20 border border-border p-6 sm:p-9 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-black text-primary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Memory Bond • Technology with a human heart
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground bg-card px-3 py-1 rounded-full border border-border shadow-xs">
              🕒 {currentTime || "10:00 AM"} • {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </span>
            <button
              onClick={() => store.updateProfile({ easy_mode: true })}
              className="inline-flex items-center gap-1.5 rounded-full bg-card hover:bg-secondary px-3 py-1 text-xs font-bold text-foreground transition-all border border-border shadow-xs cursor-pointer"
              title="Activate Senior Easy Mode"
            >
              <Sliders className="h-3.5 w-3.5 text-primary" /> Easy Mode
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6 pt-1">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              {greeting}, {store.profile.full_name || "Dadi Ji"} 👋
            </h1>
            <p className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              {proactiveAiPrompt}
            </p>
          </div>

          <Button
            size="lg"
            onClick={speakWelcome}
            variant="outline"
            className="rounded-2xl font-black gap-2 h-12 px-5 text-sm bg-card hover:bg-secondary border border-border text-foreground shadow-xs shrink-0 cursor-pointer"
          >
            <Volume2 className="h-5 w-5 text-primary" /> Read Aloud
          </Button>
        </div>

        {/* 7 Core Capability Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/80 text-xs font-bold text-muted-foreground">
          <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs">🧠 Cognitive Games</span>
          <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs">🎙️ Voice Assistant</span>
          <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs">💊 Smart Medicines</span>
          <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs">❤️ Family Moments</span>
          <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs">👨‍👩‍👧 Caregiver Sync</span>
          <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs">📡 Offline Ready</span>
          <span className="px-3 py-1 rounded-full bg-card border border-border shadow-xs">🌏 Cultural Hub</span>
        </div>
      </div>

      {/* 3. WARM HUMAN AI COMPANION SECTION (Section 5 & 6) */}
      <div className="rounded-3xl bg-card border-2 border-primary/25 p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/40 transition-all">
        <div className="flex items-center gap-4.5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0">
            <Bot className="h-9 w-9 text-primary" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              ✨ Your AI Companion
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
              Always here to help you.
            </h3>
            <p className="text-sm font-semibold text-muted-foreground mt-0.5">
              Tap to talk anytime in English, हिन्दी, অসমীয়া, বাংলা, ગુજરાતી, or Marathi.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <Button
            size="lg"
            onClick={onOpenVoiceAssistant}
            className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-base shadow-md gap-3 cursor-pointer"
          >
            <Mic className="h-5 w-5 animate-pulse" />
            <span>🎙️ Speak with Companion</span>
          </Button>
        </div>
      </div>

      {/* 4. SENIOR "WHAT DO I NEED TO DO TODAY?" DASHBOARD (Section 5) */}
      <div id="senior-todays-plan" className="rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
              TODAY'S PRIORITIES (আজিৰ কাম)
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
              What do I need to do today?
            </h3>
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-xl border border-border">
            📅 {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </div>
        </div>

        {/* 8 Clear Daily Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Medicines */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-teal-500/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Pill className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                    💊 Medicines
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {nextMedicine ? `${nextMedicine.name} (${nextMedicine.dosage})` : "Blood Pressure (Amlodipine 5mg)"}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    Time: {nextMedicine?.times?.[0] || "8:30 AM"} • After breakfast
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                medsDoneToday > 0 ? "bg-teal-100 text-teal-800 border border-teal-200" : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}>
                {medsDoneToday > 0 ? "✓ Taken" : "○ Upcoming"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">
                Stock: {nextMedicine?.stock ?? 28} left
              </span>
              {medsDoneToday === 0 ? (
                <Button
                  size="sm"
                  onClick={() => store.takeMedicine("med-1")}
                  className="h-10 px-5 rounded-xl font-black text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                >
                  Mark as Taken
                </Button>
              ) : (
                <span className="text-xs font-black text-teal-700 dark:text-teal-400">
                  ✓ Recorded
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Today's Reminders */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-sky-500/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                    🔔 Today's Reminder
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {nextReminder ? nextReminder.title : "Gentle 20-min Evening Walk"}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    Time: {nextReminder ? nextReminder.time : "5:30 PM"} • Fresh air & movement
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                Scheduled
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">
                {store.reminders.length} reminders configured
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate("reminders")}
                className="h-10 px-4 rounded-xl font-bold text-xs"
              >
                View All Reminders
              </Button>
            </div>
          </div>

          {/* Card 3: Daily Tasks & Routine */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sun className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                    📅 Daily Tasks & Routine
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {routinesDone} of {store.routines.length} Tasks Completed
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    Morning tea, medicine, watering plants, sunlight
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                {Math.round((routinesDone / Math.max(1, store.routines.length)) * 100)}% Done
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">
                Keep up the peaceful rhythm!
              </span>
              <Button
                size="sm"
                onClick={() => onNavigate("routine")}
                className="h-10 px-4 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Checklist ➔
              </Button>
            </div>
          </div>

          {/* Card 4: Appointments */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-blue-500/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                    🩺 Medical Appointment
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {nextAppointment ? nextAppointment.title : "Dr. Deepen Barua (Review)"}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {nextAppointment ? `${nextAppointment.date} at ${nextAppointment.time}` : "Tomorrow at 4:00 PM • Neurological Clinic"}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                Confirmed
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">
                Family & Caregiver synced
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate("appointments")}
                className="h-10 px-4 rounded-xl font-bold text-xs"
              >
                View Appointment
              </Button>
            </div>
          </div>

          {/* Card 5: Shopping List & Daily Needs (Section 13) */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    🛒 Daily Shopping & Needs
                  </div>
                  <div className="text-base font-black text-foreground">
                    Quick Grocery & Pharmacy Checklist
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                {shoppingItems.filter((i) => i.done).length} / {shoppingItems.length}
              </span>
            </div>
            {/* Checklist Items with Large Checkboxes */}
            <div className="space-y-1.5 pt-1">
              {shoppingItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleShoppingItem(item.id)}
                  className="flex items-center gap-3 p-2 rounded-xl bg-card border border-border/70 hover:bg-secondary/60 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => {}}
                    className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer shrink-0 accent-primary"
                  />
                  <span className={`text-xs font-bold ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: Memory Games */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Gamepad2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                    🧠 Memory Games
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {store.activityRecommendation?.gameTitle || "Pattern Recall"} (Level 2)
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    Calm cognitive exercise • 10 minutes
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                Recommended
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">
                Best Score: {store.cognitiveScore.overall} pts
              </span>
              <Button
                size="sm"
                onClick={() => onNavigate("games")}
                className="h-10 px-5 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
              >
                Play Game ➔
              </Button>
            </div>
          </div>

          {/* Card 7: Family & Loved Ones */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-rose-500/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                    ❤️ Family Connection
                  </div>
                  <div className="text-lg font-black text-foreground">
                    Rahul (Son) — Primary Contact
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    Available for call & photo memory review
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">
                Last checked in today
              </span>
              <Button
                size="sm"
                onClick={() => onNavigate("family")}
                className="h-10 px-5 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Call Family ➔
              </Button>
            </div>
          </div>

          {/* Card 8: Health & Hydration */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-teal-500/40 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Droplets className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                    💧 Health & Hydration
                  </div>
                  <div className="text-lg font-black text-foreground">
                    {store.hydrationGlasses} / {store.hydrationTarget} Glasses Drank
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {store.hydrationGlasses >= store.hydrationTarget ? "Daily hydration goal achieved!" : "Drink warm water with lemon"}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                Hydration
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">
                Target: {store.hydrationTarget} glasses
              </span>
              <Button
                size="sm"
                onClick={() => store.drinkGlassOfWater()}
                className="h-10 px-4 rounded-xl font-black text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
              >
                + I Drank Water
              </Button>
            </div>
          </div>
        </div>

        {/* Large Button: START TODAY'S ACTIVITY */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate("games")}
            className="w-full h-18 sm:h-20 rounded-3xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xl sm:text-2xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-98 cursor-pointer border-2 border-white/20"
          >
            <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse" />
            START TODAY'S ACTIVITY (আজিৰ কাম আৰম্ভ কৰক)
          </button>
        </div>
      </div>

      {/* 4. AI ADAPTATION EXPLANATION (SIH 2026 Section 6) */}
      <div className="rounded-3xl border-2 border-primary/30 bg-card p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="text-xl font-black text-foreground">
              🤖 Why this activity? (এই খেল কিয়?)
            </h4>
          </div>
          <span className="text-xs font-semibold text-muted-foreground italic">
            Transparent Adaptive Intelligence Engine
          </span>
        </div>

        <p className="text-base text-foreground font-semibold leading-relaxed">
          "{store.activityRecommendation?.whyThisActivityText || "Your recent performance shows strong pattern recognition (85%) but lower attention consistency (62%). Memory Bond recommends Pattern Recall — Level 2."}"
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {store.activityRecommendation?.dimensionScores.patternRecognition || 85}%
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase mt-1">
              Pattern Recognition
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {store.activityRecommendation?.dimensionScores.attention || 62}%
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase mt-1">
              Attention
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center">
            <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
              {store.activityRecommendation?.dimensionScores.recall || 78}%
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase mt-1">
              Recall
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <span className="font-bold text-foreground">Recommended Activity: </span>
            <span className="font-black text-primary">🧩 {store.activityRecommendation?.gameTitle || "Pattern Recall"}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="font-bold text-foreground">Difficulty: </span>
            <span className="font-black text-primary">Level {store.activityRecommendation?.recommendedLevel || 2}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="font-bold text-muted-foreground">Goal: </span>
            <span className="font-semibold text-foreground">{store.activityRecommendation?.primaryGoal || "Improve visual memory and attention."}</span>
          </div>
          <Button size="sm" onClick={() => onNavigate("games")} className="rounded-xl font-black text-xs h-10 px-4">
            Play Activity ➔
          </Button>
        </div>
      </div>

      {/* 5. DEDICATED CENTERED EMERGENCY SOS HERO (STRICT 3-SECOND CONTINUOUS HOLD) */}
      <SosHoldControl variant="heroCard" onTrigger={onOpenSos} />

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

      {/* DYNAMIC COGNITIVE PROFILE RIBBON (Requirement 1 & 2) */}
      {store.dynamicCognitiveProfile && (
        <div className="rounded-3xl border-2 border-border bg-card p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-base sm:text-lg font-black text-foreground">
                Your Dynamic Cognitive Wellness Profile
              </h3>
            </div>
            <span className="text-xs font-semibold text-muted-foreground italic">
              Non-diagnostic wellness & engagement indicators
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
            {[
              { label: "Memory", val: store.dynamicCognitiveProfile.memory, color: "text-rose-500 bg-rose-500/10" },
              { label: "Attention", val: store.dynamicCognitiveProfile.attention, color: "text-amber-500 bg-amber-500/10" },
              { label: "Recognition", val: store.dynamicCognitiveProfile.recognition, color: "text-emerald-500 bg-emerald-500/10" },
              { label: "Recall", val: store.dynamicCognitiveProfile.recall, color: "text-sky-500 bg-sky-500/10" },
              { label: "Reaction", val: store.dynamicCognitiveProfile.reactionTime, color: "text-indigo-500 bg-indigo-500/10" },
              { label: "Consistency", val: store.dynamicCognitiveProfile.consistency, color: "text-purple-500 bg-purple-500/10" },
              { label: "Engagement", val: store.dynamicCognitiveProfile.engagement, color: "text-teal-500 bg-teal-500/10" },
            ].map((dim) => (
              <div key={dim.label} className="p-3 rounded-2xl bg-secondary/30 border border-border text-center space-y-1">
                <div className="text-xs font-bold text-muted-foreground">{dim.label}</div>
                <div className={`text-xl font-black py-0.5 rounded-lg ${dim.color}`}>{dim.val}</div>
                <div className="text-[10px] text-muted-foreground font-semibold">/ 100</div>
              </div>
            ))}
          </div>

          {/* AI Activity Recommendation Card (Requirement 3) */}
          {store.activityRecommendation && (
            <div
              onClick={() => onNavigate("games")}
              className="rounded-2xl border-2 border-primary/30 bg-primary/10 p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-primary/15 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xl shrink-0">
                  🎯
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-primary">
                    AI Recommended For You
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-foreground">
                    {store.activityRecommendation.headline}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {store.activityRecommendation.rationale}
                  </p>
                </div>
              </div>
              <Button size="sm" className="rounded-xl font-black text-xs gap-1">
                Play Now ➔
              </Button>
            </div>
          )}
        </div>
      )}

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

          {/* 6. FAMILY TREE (Merged Sections 6, 7, and 8) */}
          <button
            onClick={() => onNavigate("family_tree")}
            className="group rounded-3xl border-2 border-rose-500/30 bg-rose-500/5 p-6 text-center space-y-3 shadow-sm hover:border-rose-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center h-44 cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <Users className="h-8 w-8" />
            </div>
            <span className="text-lg font-black text-foreground group-hover:text-rose-600">
              6. FAMILY TREE
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
