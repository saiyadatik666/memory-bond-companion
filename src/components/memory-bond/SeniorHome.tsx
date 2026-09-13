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
  WifiOff,
  Heart,
  Bot,
  ShoppingBag,
  Leaf,
  BookOpen,
  ArrowRight,
  PhoneCall,
  Activity,
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

  // Proactive Personalized AI Recommendation
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
    speakText(
      `${greeting}, ${store.profile.full_name}. ${proactiveAiPrompt}. Small steps every day keep your mind active and happy.`,
      speechLocale || "en-IN"
    );
  };

  // -------------------------------------------------------------------------
  // 1. SENIOR EASY MODE VIEW (Ultra-simplified large tiles, high contrast)
  // -------------------------------------------------------------------------
  if (store.profile.easy_mode) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
        {/* Easy Mode Top Banner */}
        <div className="flex items-center justify-between bg-sky-50 border-2 border-sky-200 p-4 rounded-3xl shadow-xs">
          <div className="flex items-center gap-2 text-sky-800 font-black text-sm">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Senior Easy Mode Active (सरल मोड)</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => store.updateProfile({ easy_mode: false })}
            className="rounded-2xl font-black text-xs border-sky-300 text-sky-900 bg-white hover:bg-sky-100 cursor-pointer shadow-xs"
          >
            Switch to Standard View
          </Button>
        </div>

        {/* Easy Mode Hero Card */}
        <div className="rounded-3xl border border-sky-100 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-4xl sm:text-6xl font-black tracking-tight text-foreground font-display">
                {currentTime || "10:00 AM"}
              </div>
              <div className="text-base sm:text-lg font-bold text-muted-foreground mt-1">
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
              className="rounded-2xl font-black gap-2 h-14 px-6 text-base bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-200 shadow-xs cursor-pointer"
            >
              <Volume2 className="h-6 w-6 text-primary" /> Read Aloud
            </Button>
          </div>

          <div className="border-t border-border pt-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display">
              {greeting}, {store.profile.full_name}
            </h2>
            <p className="text-base font-bold text-primary mt-1">
              ✨ {proactiveAiPrompt}
            </p>
          </div>
        </div>

        {/* Emergency SOS Control */}
        <SosHoldControl variant="heroCard" onTrigger={onOpenSos} />

        {/* 4 Massive Action Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tile 1: Routine */}
          <button
            type="button"
            onClick={() => onNavigate("routine")}
            className="rounded-3xl border-2 border-amber-200 bg-amber-50/70 p-6 sm:p-8 text-left space-y-3 hover:border-amber-400 hover:shadow-md active:scale-98 transition-all flex flex-col justify-between min-h-[190px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Sun className="h-9 w-9" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-200/80 text-amber-900">
                1. TODAY
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground font-display">
                {t("today").toUpperCase()} & ROUTINE
              </div>
              <p className="text-base font-bold text-muted-foreground mt-1">
                {routinesDone} of {store.routines.length} completed today
              </p>
            </div>
          </button>

          {/* Tile 2: Medicines */}
          <button
            type="button"
            onClick={() => onNavigate("medicines")}
            className="rounded-3xl border-2 border-teal-200 bg-emerald-50/70 p-6 sm:p-8 text-left space-y-3 hover:border-teal-400 hover:shadow-md active:scale-98 transition-all flex flex-col justify-between min-h-[190px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <Pill className="h-9 w-9" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-teal-200/80 text-teal-900">
                2. MEDICINES
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground font-display">
                {t("medicines").toUpperCase()}
              </div>
              <p className="text-base font-bold text-teal-800 mt-1 truncate">
                {nextMedicine ? `${nextMedicine.name} (${nextMedicine.dosage})` : "All medicines taken"}
              </p>
            </div>
          </button>

          {/* Tile 3: Voice Companion */}
          <button
            type="button"
            onClick={onOpenVoiceAssistant}
            className="rounded-3xl border-2 border-blue-200 bg-sky-50/70 p-6 sm:p-8 text-left space-y-3 hover:border-blue-400 hover:shadow-md active:scale-98 transition-all flex flex-col justify-between min-h-[190px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md">
                <Mic className="h-9 w-9" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-200/80 text-blue-900">
                3. VOICE AI
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground font-display">
                SPEAK TO COMPANION
              </div>
              <p className="text-base font-bold text-muted-foreground mt-1">
                Tap and talk naturally in your language
              </p>
            </div>
          </button>

          {/* Tile 4: Reminders */}
          <button
            type="button"
            onClick={() => onNavigate("reminders")}
            className="rounded-3xl border-2 border-indigo-200 bg-indigo-50/70 p-6 sm:p-8 text-left space-y-3 hover:border-indigo-400 hover:shadow-md active:scale-98 transition-all flex flex-col justify-between min-h-[190px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Bell className="h-9 w-9" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-200/80 text-indigo-900">
                4. REMINDERS
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-foreground font-display">
                SMART REMINDERS
              </div>
              <p className="text-base font-bold text-muted-foreground mt-1">
                Medicines, walking, hydration, shopping
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. STANDARD COMPREHENSIVE VIEW
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in">
      {/* 1. VISIBLE OFFLINE MODE BANNER */}
      {!store.isOnline && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-black text-amber-900 flex items-center gap-2">
                <span>Offline Mode (অফলাইন মোড)</span>
              </div>
              <p className="text-xs font-semibold text-amber-800/80 mt-0.5 max-w-xl">
                Memory Bond is safely working offline. Your medicines and games are stored on your device and will sync automatically.
              </p>
            </div>
          </div>
          {store.syncQueue.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shrink-0">
              {store.syncQueue.length} Updates Saved Locally
            </span>
          )}
        </div>
      )}

      {/* Critical Refill Warning Banner if any */}
      {lowStockMeds.length > 0 && (
        <div
          onClick={() => onNavigate("medicines")}
          className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:bg-amber-100/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-base font-bold text-foreground font-display">
                {t("medicineLow") || "Your medicine is running low."}
              </h4>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                {lowStockMeds[0]?.name} has {lowStockMeds[0]?.stock} {lowStockMeds[0]?.unit}s remaining. Caregiver has been notified.
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      )}

      {/* 2. COMPACT WELCOME HERO SECTION (Requirements 9 & 10) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-white to-emerald-50/40 border border-sky-100 p-5 sm:p-7 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6">
          <div className="space-y-3">
            {/* Top Bar: Pill & Time */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Memory Bond • Daily Care
              </span>
              <span className="text-xs font-bold text-muted-foreground bg-white/90 px-3 py-1 rounded-full border border-border shadow-xs">
                🕒 {currentTime || "10:00 AM"} • {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </span>
              <button
                type="button"
                onClick={() => store.updateProfile({ easy_mode: true })}
                className="inline-flex items-center gap-1 rounded-full bg-white hover:bg-sky-50 px-2.5 py-1 text-xs font-bold text-foreground border border-border transition-colors cursor-pointer shadow-xs"
                title="Switch to Senior Easy Mode"
              >
                <Sliders className="h-3 w-3 text-primary" /> Easy Mode
              </button>
            </div>

            {/* Main Greeting & Quote */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground font-display">
                {greeting}, {store.profile.full_name || "Dadi Ji"} 👋
              </h2>
              <p className="text-sm sm:text-base font-bold text-sky-800 mt-1 italic">
                “Small steps every day keep your mind active and happy.”
              </p>
            </div>

            {/* Proactive AI Whisper */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground/80 bg-white/70 p-2.5 rounded-2xl border border-sky-100/80 max-w-2xl">
              <span className="text-base">✨</span>
              <span>{proactiveAiPrompt}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                size="sm"
                onClick={speakWelcome}
                variant="outline"
                className="rounded-2xl font-bold gap-2 h-10 px-4 text-xs bg-white hover:bg-sky-50 border-sky-200 text-sky-900 shadow-xs cursor-pointer"
              >
                <Volume2 className="h-4 w-4 text-primary" /> Read Aloud
              </Button>
              <Button
                size="sm"
                onClick={onOpenVoiceAssistant}
                className="rounded-2xl font-black gap-2 h-10 px-4 text-xs bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
              >
                <Mic className="h-4 w-4" /> Speak with Companion
              </Button>
            </div>
          </div>

          {/* Warm Indian Family Memory Photograph (Requirement 10) */}
          <div className="relative w-full lg:w-72 sm:h-44 h-40 rounded-2xl overflow-hidden shadow-sm border border-sky-200/60 shrink-0">
            <img
              src="/images/family_memory_hero.jpg"
              alt="Elderly Indian grandfather sharing happy family memory photo album with granddaughter"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent flex items-end p-3">
              <span className="text-[11px] font-black text-white drop-shadow-sm flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
                Cherished Family Memories
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DAILY SUMMARY CARDS (Requirement 11: Real application data, subtle pastels) */}
      <section aria-label="Daily Summary">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-lg sm:text-xl font-black text-foreground font-display flex items-center gap-2">
            <span>Today's Wellness Summary</span>
            <span className="text-xs font-bold text-muted-foreground font-sans">
              (আজিৰ স্বাস্থ্য তথ্য)
            </span>
          </h3>
          <span className="text-xs font-bold text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Today's Games */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-indigo-300 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Gamepad2 className="h-6 w-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                Games
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                Today's Games
              </span>
              <div className="text-xl font-black text-foreground mt-0.5 font-display">
                {store.activityRecommendation?.gameTitle || "Pattern Recall"}
              </div>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Level {store.activityRecommendation?.recommendedLevel || 2} • 10 mins peaceful practice
              </p>
            </div>
            <div className="pt-2 border-t border-indigo-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700">
                Score: {store.cognitiveScore.overall} pts
              </span>
              <Button
                size="sm"
                onClick={() => onNavigate("games")}
                className="h-8 px-3.5 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
              >
                Play ➔
              </Button>
            </div>
          </div>

          {/* Card 2: Medicines */}
          <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-emerald-50/70 to-white p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-teal-300 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Pill className="h-6 w-6" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                medsDoneToday > 0 ? "bg-teal-100 text-teal-800" : "bg-blue-100 text-blue-800"
              }`}>
                {medsDoneToday > 0 ? "✓ Taken" : "Scheduled"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                Medicines
              </span>
              <div className="text-xl font-black text-foreground mt-0.5 truncate font-display">
                {nextMedicine ? nextMedicine.name : "Amlodipine"}
              </div>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                {nextMedicine?.times?.[0] || "8:30 AM"} • After food ({nextMedicine?.stock ?? 28} left)
              </p>
            </div>
            <div className="pt-2 border-t border-teal-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-700">
                {medsDoneToday > 0 ? "Recorded today" : "Due morning"}
              </span>
              {medsDoneToday === 0 ? (
                <Button
                  size="sm"
                  onClick={() => store.takeMedicine("med-1")}
                  className="h-8 px-3 rounded-xl font-black text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                >
                  Mark Taken
                </Button>
              ) : (
                <span className="text-xs font-black text-teal-700">✓ Completed</span>
              )}
            </div>
          </div>

          {/* Card 3: Appointments */}
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-sky-300 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 uppercase tracking-wider">
                Clinic
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                Appointments
              </span>
              <div className="text-xl font-black text-foreground mt-0.5 truncate font-display">
                {nextAppointment ? nextAppointment.title : "Dr. Deepen Barua"}
              </div>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                {nextAppointment ? `${nextAppointment.date} at ${nextAppointment.time}` : "Tomorrow, 4:00 PM • Review"}
              </p>
            </div>
            <div className="pt-2 border-t border-sky-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-700">Family Synced</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate("appointments")}
                className="h-8 px-3 rounded-xl font-bold text-xs border-sky-200 text-sky-900 bg-white hover:bg-sky-50 cursor-pointer"
              >
                View
              </Button>
            </div>
          </div>

          {/* Card 4: Hydration */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-300 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Droplets className="h-6 w-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 uppercase tracking-wider">
                Hydration
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Hydration Tracker
              </span>
              <div className="text-xl font-black text-foreground mt-0.5 font-display">
                {store.hydrationGlasses} of {store.hydrationTarget} Glasses
              </div>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                {store.hydrationGlasses >= store.hydrationTarget ? "Daily goal achieved! 🌟" : "Drink a warm glass with lemon"}
              </p>
            </div>
            <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700">Goal: {store.hydrationTarget} glasses</span>
              <Button
                size="sm"
                onClick={() => store.drinkGlassOfWater()}
                className="h-8 px-3 rounded-xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
              >
                + Drank Water
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAIN CONTENT & RIGHT CONTEXTUAL PANELS (Responsive Grid for Desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT/CENTER 8 COLUMNS: Quick Access Features + Daily Routine */}
        <div className="xl:col-span-8 space-y-6">
          {/* QUICK ACCESS (Requirement 12: 10 Unified Feature Cards) */}
          <section aria-label="Quick Access Features" className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-foreground font-display">
                  Quick Access (সুবিধাসমূহ)
                </h3>
                <p className="text-xs font-semibold text-muted-foreground">
                  Tap any card to open your daily memory, family, and health companion tools
                </p>
              </div>
              <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10">
                10 Activities
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Play Games */}
              <button
                type="button"
                onClick={() => onNavigate("games")}
                className="group p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-indigo-700">Play Games</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">Mind stimulation</p>
                </div>
              </button>

              {/* 2. Medicine Reminders */}
              <button
                type="button"
                onClick={() => onNavigate("medicines")}
                className="group p-3.5 rounded-2xl border border-teal-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-teal-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-teal-700">Medicines</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">Refills & timing</p>
                </div>
              </button>

              {/* 3. Appointments */}
              <button
                type="button"
                onClick={() => onNavigate("appointments")}
                className="group p-3.5 rounded-2xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-sky-700">Appointments</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">Doctor reviews</p>
                </div>
              </button>

              {/* 4. Hydration */}
              <button
                type="button"
                onClick={() => onNavigate("routine")}
                className="group p-3.5 rounded-2xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-blue-700">Hydration</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">Daily water goal</p>
                </div>
              </button>

              {/* 5. Family Tree */}
              <button
                type="button"
                onClick={() => onNavigate("family_tree")}
                className="group p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-rose-700">Family Tree</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">Loved ones & ties</p>
                </div>
              </button>

              {/* 6. Family Memories */}
              <button
                type="button"
                onClick={() => onNavigate("social")}
                className="group p-3.5 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-purple-700">Memories</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">Photos & greetings</p>
                </div>
              </button>

              {/* 7. Voice Assistant */}
              <button
                type="button"
                onClick={onOpenVoiceAssistant}
                className="group p-3.5 rounded-2xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-primary">Voice AI</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">Speak in regional</p>
                </div>
              </button>

              {/* 8. Cherished Notes */}
              <button
                type="button"
                onClick={() => onNavigate("journal")}
                className="group p-3.5 rounded-2xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-amber-700">Cherished Notes</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">Audio diary & joy</p>
                </div>
              </button>

              {/* 9. Memory Garden */}
              <button
                type="button"
                onClick={() => onNavigate("routine")}
                className="group p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-emerald-700">Memory Garden</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">Daily blooming</p>
                </div>
              </button>

              {/* 10. Cultural Hub */}
              <button
                type="button"
                onClick={() => onNavigate("cultural")}
                className="group p-3.5 rounded-2xl border border-teal-100 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-300 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between min-h-[125px] shadow-xs active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground group-hover:text-teal-700">Cultural Hub</div>
                  <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">North East roots</p>
                </div>
              </button>
            </div>
          </section>

          {/* DAILY ROUTINES & SHOPPING CHECKLIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Routine Summary Card */}
            <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-foreground font-display">Daily Routine</h4>
                    <span className="text-[11px] font-bold text-muted-foreground">{routinesDone} of {store.routines.length} completed</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("routine")}
                  className="h-8 px-3 rounded-xl font-bold text-xs"
                >
                  View All
                </Button>
              </div>

              <div className="space-y-2">
                {store.routines.slice(0, 3).map((rt) => {
                  const isDone = rt.done_date === todayStr;
                  return (
                    <div
                      key={rt.id}
                      onClick={() => store.toggleRoutineDone(rt.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                          isDone ? "bg-primary border-primary text-white" : "border-muted-foreground/50 bg-white"
                        }`}>
                          {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-xs font-bold truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {rt.activity}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0">{rt.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Shopping & Pharmacy Checklist */}
            <div className="rounded-3xl border border-purple-100 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-foreground font-display">Daily Needs</h4>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {shoppingItems.filter((i) => i.done).length} of {shoppingItems.length} purchased
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {shoppingItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleShoppingItem(item.id)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50 border border-border/70 hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      item.done ? "bg-purple-600 border-purple-600 text-white" : "border-muted-foreground/50 bg-white"
                    }`}>
                      {item.done && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-bold ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TRANSPARENT AI ADAPTATION ENGINE (Senior-friendly non-clinical view) */}
          <div className="rounded-3xl border border-sky-100 bg-white p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-base font-black text-foreground font-display">
                  Why this game was chosen for you today
                </h4>
              </div>
              <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Personalized
              </span>
            </div>

            <p className="text-xs sm:text-sm text-foreground/80 font-semibold leading-relaxed">
              "{store.activityRecommendation?.whyThisActivityText || "Your recent practice shows strong visual memory and steady recall. Today's Pattern Recall exercise gently sharpens active attention."}"
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-muted-foreground">Focus Area:</span>
                <span className="font-black text-primary">Visual Memory & Focus</span>
              </div>
              <Button
                size="sm"
                onClick={() => onNavigate("games")}
                className="h-8 px-4 rounded-xl font-black text-xs bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
              >
                Start Practice ➔
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLUMNS: Contextual Desktop Panels (AI Assistant, Memory Garden, Emergency SOS) */}
        <div className="xl:col-span-4 space-y-6">
          {/* AI ASSISTANT DEDICATED CARD (Requirement 13) */}
          <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-50/50 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                <Bot className="h-7 w-7" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  Caring AI Companion
                </span>
                <h3 className="text-lg font-black text-foreground font-display mt-0.5">
                  Need Help?
                </h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  Talk to your AI Assistant anytime
                </p>
              </div>
            </div>

            <p className="text-xs text-foreground/80 font-medium leading-relaxed bg-white/80 p-3 rounded-2xl border border-sky-100">
              Ask about your medicines, weather, daily appointments, or just have a peaceful conversation in your language.
            </p>

            <Button
              size="lg"
              onClick={onOpenVoiceAssistant}
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-sm gap-2.5 cursor-pointer active:scale-98"
            >
              <Mic className="h-5 w-5 animate-pulse" />
              <span>🎙️ Talk to AI Assistant</span>
            </Button>
          </div>

          {/* MEMORY GARDEN PREVIEW (Requirement 14) */}
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xs">
            <MemoryGarden store={store} onNavigate={onNavigate} compact={true} />
          </div>

          {/* EMERGENCY SOS 3-SECOND CONTINUOUS HOLD HERO (Reassuring, Clear, Accessible) */}
          <div className="rounded-3xl border border-rose-100 bg-white p-4 shadow-xs">
            <SosHoldControl variant="heroCard" onTrigger={onOpenSos} />
          </div>

          {/* FAMILY & CAREGIVER SYNC QUICK STATUS */}
          <div className="rounded-3xl border border-border bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 fill-rose-500/20 text-rose-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Caregiver Link
                </div>
                <div className="text-sm font-black text-foreground truncate">
                  {primaryCaregiver ? primaryCaregiver.caregiver_name : "Rahul (Son)"}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 shrink-0">
              ● Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
