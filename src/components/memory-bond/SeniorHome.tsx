import { useState, useEffect } from "react";
import {
  Gamepad2,
  Pill,
  Calendar,
  Users,
  Mic,
  Heart,
  Leaf,
  Compass,
  ShieldAlert,
  Bell,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowRight,
  Volume2,
  WifiOff,
  AlertTriangle,
  Sparkles,
  Sun,
  ShoppingBag,
  Check,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import { SosHoldControl } from "./SosHoldControl";
import { AiRobotAvatar, MemoryGardenIllustration } from "./Illustrations";
import { SENIOR_INTERESTS_LIST, getLocalizedInterest } from "@/lib/seniorInterestsData";

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

  // Daily Routine & Checklist State
  const [shoppingItems, setShoppingItems] = useState([
    { id: "shop-1", name: "Fresh Milk & Curd", done: false },
    { id: "shop-2", name: "Fresh Seasonal Vegetables", done: true },
    { id: "shop-3", name: "Herbal Green Tea & Honey", done: false },
  ]);

  // Interactive local checklist for right-panel reminders
  const [checkedReminders, setCheckedReminders] = useState<Record<string, boolean>>({
    "rem-1": true, // 08:00 AM Morning Medicine
    "rem-2": false, // 10:00 AM Blood Pressure Check
    "rem-3": false, // 02:00 PM Afternoon Medicine
    "rem-4": false, // 06:00 PM Evening Medicine
  });

  const toggleReminderCheck = (id: string) => {
    setCheckedReminders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const routinesDone = store.routines.filter((r) => r.done_date === todayStr).length;
  const nextMedicine = store.medicines[0];
  const lowStockMeds = store.medicines.filter((m) => m.stock <= m.refill_threshold);
  const nextAppointment = store.appointments[0];
  const medsDoneToday = store.medicineLogs.filter(
    (l) => l.taken_at?.slice(0, 10) === todayStr && l.status === "taken"
  ).length;

  const greeting = (() => {
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  const rawName = store.profile.full_name?.trim() || "Dadaji";
  const displayName = rawName.split(" ")[0] || "Dadaji";

  const quoteText = "Small steps every day keep your mind active and happy.";

  const speakWelcome = () => {
    stopSpeaking();
    speakText(
      `${greeting}, ${displayName}. ${quoteText}`,
      speechLocale || "en-IN"
    );
  };

  // -------------------------------------------------------------------------
  // QUICK ACCESS: EXACT 4 × 2 (8 CARDS) — SINGLE SOURCE OF TRUTH
  // Exact Order per Prompt Sections 12, 13, 14, 15, 16, 17, 18, 19, 40:
  // ROW 1: 1. Play Games, 2. SOS Emergency, 3. Appointments, 4. Voice AI
  // ROW 2: 5. Family Tree, 6. Memories, 7. Memory Garden, 8. Cultural Hub
  // -------------------------------------------------------------------------
  const quickAccessItems = [
    // ROW 1
    {
      id: "qa-games",
      title: "Play Games",
      desc: "Mind stimulation",
      icon: Gamepad2,
      onClick: () => onNavigate("games"),
      accentBg: "bg-[#F3E8FF]",
      accentFg: "text-[#7E22CE]",
      iconBg: "bg-[#F3E8FF] text-[#7E22CE]",
      cardBorder: "border-[#E9D5FF] hover:border-[#C084FC]",
      hoverBg: "hover:bg-[#FAF5FF]",
    },
    {
      id: "qa-sos",
      title: "SOS Emergency",
      desc: "Emergency help",
      icon: ShieldAlert,
      onClick: onOpenSos,
      accentBg: "bg-[#FEE2E2]",
      accentFg: "text-[#DC2626]",
      iconBg: "bg-[#FEE2E2] text-[#DC2626]",
      cardBorder: "border-[#FECACA] hover:border-[#F87171]",
      hoverBg: "hover:bg-[#FEF2F2]",
    },
    {
      id: "qa-appointments",
      title: "Appointments",
      desc: "Doctor reviews",
      icon: Calendar,
      onClick: () => onNavigate("appointments"),
      accentBg: "bg-[#E0F2FE]",
      accentFg: "text-[#0284C7]",
      iconBg: "bg-[#E0F2FE] text-[#0284C7]",
      cardBorder: "border-[#BAE6FD] hover:border-[#38BDF8]",
      hoverBg: "hover:bg-[#F0F9FF]",
    },
    {
      id: "qa-voice",
      title: "Voice AI",
      desc: "Speak in regional",
      icon: Mic,
      onClick: onOpenVoiceAssistant,
      accentBg: "bg-[#DBEAFE]",
      accentFg: "text-[#1D4ED8]",
      iconBg: "bg-[#DBEAFE] text-[#1D4ED8]",
      cardBorder: "border-[#BFDBFE] hover:border-[#60A5FA]",
      hoverBg: "hover:bg-[#EFF6FF]",
    },
    // ROW 2
    {
      id: "qa-family-tree",
      title: "Family Tree",
      desc: "Loved ones & ties",
      icon: Users,
      onClick: () => onNavigate("family_tree"),
      accentBg: "bg-[#FCE7F3]",
      accentFg: "text-[#9D174D]",
      iconBg: "bg-[#FCE7F3] text-[#9D174D]",
      cardBorder: "border-[#FBCFE8] hover:border-[#F472B6]",
      hoverBg: "hover:bg-[#FDF2F8]",
    },
    {
      id: "qa-reminders",
      title: "Reminders",
      desc: "Important things",
      icon: Bell,
      onClick: () => onNavigate("reminders"),
      accentBg: "bg-[#EDE9FE]",
      accentFg: "text-[#6D28D9]",
      iconBg: "bg-[#EDE9FE] text-[#6D28D9]",
      cardBorder: "border-[#DDD6FE] hover:border-[#A78BFA]",
      hoverBg: "hover:bg-[#F5F3FF]",
    },
    {
      id: "qa-garden",
      title: "Memory Garden",
      desc: "Daily blooming",
      icon: Leaf,
      onClick: () => onNavigate("routine"),
      accentBg: "bg-[#DCFCE7]",
      accentFg: "text-[#15803D]",
      iconBg: "bg-[#DCFCE7] text-[#15803D]",
      cardBorder: "border-[#BBF7D0] hover:border-[#4ADE80]",
      hoverBg: "hover:bg-[#F0FDF4]",
    },
    {
      id: "qa-cultural",
      title: "Cultural Hub",
      desc: "North East roots",
      icon: Compass,
      onClick: () => onNavigate("cultural"),
      accentBg: "bg-[#CCFBF1]",
      accentFg: "text-[#0F766E]",
      iconBg: "bg-[#CCFBF1] text-[#0F766E]",
      cardBorder: "border-[#99F6E4] hover:border-[#2DD4BF]",
      hoverBg: "hover:bg-[#F0FDFA]",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-7 pb-12">
      {/* Offline Mode Alert */}
      {!store.isOnline && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-900">Offline Safe Mode</div>
              <p className="text-xs font-semibold text-amber-800/80">
                Medicines and games are safely saved on this device.
              </p>
            </div>
          </div>
          {store.syncQueue.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-black shrink-0">
              {store.syncQueue.length} Local Updates
            </span>
          )}
        </div>
      )}

      {/* Critical Medicine Refill Warning if any */}
      {lowStockMeds.length > 0 && (
        <div
          onClick={() => onNavigate("medicines")}
          className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-100/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#0F243E]">
                {lowStockMeds[0]?.name} is running low ({lowStockMeds[0]?.stock} remaining)
              </h4>
              <p className="text-xs text-[#627D98] font-medium">
                Tap to view medicine refill details. Caregiver notified.
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#829AB1] shrink-0" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP 2-COLUMN / 3-SECTION MASTER CANVAS                                */}
      {/* Left/Center (approx 68%): Hero + Daily Summary + Quick Access 4x2 + AI    */}
      {/* Right (approx 32%): Reminders + Appointment + Memory Garden Sprout        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* ======================================================================= */}
        {/* CENTER / MAIN CONTENT (8 COLUMNS ON XL)                                  */}
        {/* ======================================================================= */}
        <div className="xl:col-span-8 space-y-5 sm:space-y-6 min-w-0">
          {/* 1. WELCOME / HERO SECTION matching reference image */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E2EAF5] shadow-[0_4px_24px_-4px_rgba(15,36,62,0.04)] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left Welcome Text */}
            <div className="flex-1 space-y-2.5 text-left min-w-0 w-full">
              <div className="space-y-1">
                <p className="text-lg sm:text-xl font-bold text-[#486581]">
                  {greeting},
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F243E] font-display tracking-tight flex items-center gap-2.5">
                  <span>{displayName}</span>
                  <span className="text-2xl sm:text-3xl">☀️</span>
                </h2>
              </div>

              <p className="text-sm sm:text-base font-semibold text-[#627D98] max-w-md leading-relaxed">
                “{quoteText}”
              </p>

              {/* Subtle heart divider matching reference image */}
              <div className="pt-2 flex items-center gap-3">
                <div className="w-12 h-px bg-[#E2EAF5]" />
                <span className="text-[#0284C7] text-sm">♡</span>
                <div className="w-12 h-px bg-[#E2EAF5]" />
                <button
                  type="button"
                  onClick={speakWelcome}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F8FD] hover:bg-[#EBF3FC] text-[#1E6FD9] border border-[#E2EAF5] text-xs font-bold transition-colors cursor-pointer"
                  title="Read aloud"
                >
                  <Volume2 className="h-3.5 w-3.5" /> Read
                </button>
              </div>
            </div>

            {/* Right Family Photograph matching reference image */}
            <div className="w-full md:w-80 lg:w-96 h-48 sm:h-52 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-[#E2EAF5]/80">
              <img
                src="/images/family_memory_hero.jpg"
                alt="Elderly Indian grandfather spending a happy moment with younger family member reading photo album"
                className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-103"
                loading="eager"
              />
            </div>
          </div>

          {/* Personalized Senior Interests Ribbon */}
          {store.profile.interests && store.profile.interests.length > 0 && (
            <div className="rounded-2xl bg-white border border-[#E2EAF5] p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1E6FD9] shrink-0">
                <Sparkles className="h-4 w-4" />
                <span>
                  {lang === "hi"
                    ? "आपकी रुचियां"
                    : lang === "as"
                    ? "আপোনাৰ ৰুচি"
                    : lang === "bn"
                    ? "আপনার পছন্দ"
                    : lang === "gu"
                    ? "તમારી પસંદ"
                    : "Your Interests"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {store.profile.interests.map((interestId) => {
                  const match = SENIOR_INTERESTS_LIST.find((item) => item.id === interestId);
                  if (!match) return null;
                  const { label } = getLocalizedInterest(match, lang);
                  return (
                    <span
                      key={interestId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#EBF3FC] text-[#0F243E] border border-[#D0E2F7] shadow-2xs hover:bg-[#DCEBFA] transition-colors select-none"
                    >
                      <span>{match.icon}</span>
                      <span>{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. DAILY SUMMARY CARDS (Row of 4) matching reference image */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Today's Games */}
            <div
              onClick={() => onNavigate("games")}
              className="rounded-2xl sm:rounded-3xl bg-white border border-[#E2EAF5] p-4 sm:p-5 shadow-[0_2px_12px_-2px_rgba(15,36,62,0.03)] hover:shadow-md hover:border-[#C084FC]/50 transition-all cursor-pointer flex flex-col justify-between group select-none min-h-[136px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center shadow-xs">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-[#829AB1] group-hover:text-[#7E22CE] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-[#627D98] block">
                  Today's Games
                </span>
                <div className="text-xl sm:text-2xl font-black text-[#0F243E] font-display mt-0.5">
                  2 / 5
                </div>
                <p className="text-[11px] font-semibold text-[#829AB1] mt-0.5 truncate">
                  Play and stay active
                </p>
              </div>
            </div>

            {/* Card 2: Medicines */}
            <div
              onClick={() => onNavigate("medicines")}
              className="rounded-2xl sm:rounded-3xl bg-white border border-[#E2EAF5] p-4 sm:p-5 shadow-[0_2px_12px_-2px_rgba(15,36,62,0.03)] hover:shadow-md hover:border-[#4ADE80]/50 transition-all cursor-pointer flex flex-col justify-between group select-none min-h-[136px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shadow-xs">
                  <Pill className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-[#829AB1] group-hover:text-[#15803D] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-[#627D98] block">
                  Medicines
                </span>
                <div className="text-xl sm:text-2xl font-black text-[#0F243E] font-display mt-0.5">
                  {store.medicines.length > 0 ? "1 due today" : "0 due today"}
                </div>
                <p className="text-[11px] font-semibold text-[#829AB1] mt-0.5 truncate">
                  Stay on track
                </p>
              </div>
            </div>

            {/* Card 3: Appointments */}
            <div
              onClick={() => onNavigate("appointments")}
              className="rounded-2xl sm:rounded-3xl bg-white border border-[#E2EAF5] p-4 sm:p-5 shadow-[0_2px_12px_-2px_rgba(15,36,62,0.03)] hover:shadow-md hover:border-[#38BDF8]/50 transition-all cursor-pointer flex flex-col justify-between group select-none min-h-[136px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shadow-xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-[#829AB1] group-hover:text-[#0284C7] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-[#627D98] block">
                  Appointments
                </span>
                <div className="text-xl sm:text-2xl font-black text-[#0F243E] font-display mt-0.5">
                  {store.appointments.length > 0 ? `${store.appointments.length} scheduled` : "0 today"}
                </div>
                <p className="text-[11px] font-semibold text-[#829AB1] mt-0.5 truncate">
                  Doctor reviews
                </p>
              </div>
            </div>

            {/* Card 4: Family Members */}
            <div
              onClick={() => onNavigate("family_tree")}
              className="rounded-2xl sm:rounded-3xl bg-white border border-[#E2EAF5] p-4 sm:p-5 shadow-[0_2px_12px_-2px_rgba(15,36,62,0.03)] hover:shadow-md hover:border-[#F472B6]/50 transition-all cursor-pointer flex flex-col justify-between group select-none min-h-[136px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#FCE7F3] text-[#9D174D] flex items-center justify-center shadow-xs">
                  <Users className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-[#829AB1] group-hover:text-[#9D174D] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <span className="text-xs font-bold text-[#627D98] block">
                  Family Members
                </span>
                <div className="text-xl sm:text-2xl font-black text-[#0F243E] font-display mt-0.5">
                  5
                </div>
                <p className="text-[11px] font-semibold text-[#829AB1] mt-0.5 truncate">
                  Stay connected
                </p>
              </div>
            </div>
          </div>

          {/* 3. QUICK ACCESS — EXACT 4 × 2 (8 CARDS) matching reference image */}
          <section aria-label="Quick Access Features" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl text-amber-500">✨</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#0F243E] font-display tracking-tight leading-none">
                    Quick Access
                  </h3>
                  <p className="text-xs font-semibold text-[#627D98] mt-1">
                    Explore your favorite features
                  </p>
                </div>
              </div>

              {/* Dynamic 8 Activities Badge matching reference image */}
              <span className="px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7] text-xs font-black shrink-0 border border-[#BAE6FD]">
                {quickAccessItems.length} Activities
              </span>
            </div>

            {/* Responsive arrangement: 2x4 on mobile for elder touch comfort, exact 4x2 on tablet/desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 xs:gap-3 sm:gap-3.5 md:gap-4 w-full">
              {quickAccessItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    aria-label={`${item.title}: ${item.desc}`}
                    className={`group p-3 xs:p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border ${item.cardBorder} ${item.hoverBg} text-left transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-[0_2px_12px_-2px_rgba(15,36,62,0.04)] hover:shadow-md hover:-translate-y-0.5 active:scale-96 select-none min-w-0 w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9] min-h-[112px] xs:min-h-[120px] sm:min-h-[136px] md:min-h-[146px]`}
                  >
                    {/* Top Row: Icon Container + Tap Indicator Arrow */}
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${item.iconBg} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0`}
                      >
                        <Icon className="h-4.5 w-4.5 xs:h-5 xs:h-5 sm:h-5.5 sm:w-5.5" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#829AB1]/70 group-hover:text-[#0F243E] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>

                    {/* Bottom Area: Title + Description with comfortable elder-friendly spacing */}
                    <div className="w-full min-w-0 mt-2 sm:mt-2.5">
                      <div className="text-xs xs:text-sm sm:text-sm md:text-base font-black text-[#0F243E] font-display leading-[1.2] tracking-tight">
                        {item.title}
                      </div>
                      <p className="text-[10px] xs:text-[11px] sm:text-[11px] md:text-xs text-[#627D98] font-semibold mt-1 leading-[1.25] line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. AI ASSISTANT SECTION matching reference banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#E0F2FE] via-[#EDF6FF] to-[#E2EEFC] border border-[#BAE6FD] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left AI Robot Avatar & Text */}
            <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
              <AiRobotAvatar className="w-14 h-14 sm:w-16 sm:h-16" />
              <div className="min-w-0">
                <h4 className="text-lg sm:text-xl font-black text-[#0F243E] font-display leading-tight">
                  Need Help?
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-[#486581] mt-0.5">
                  Talk to your AI Assistant
                </p>
              </div>
            </div>

            {/* Right Action Button */}
            <Button
              onClick={onOpenVoiceAssistant}
              className="h-11 px-6 rounded-full bg-[#1E6FD9] hover:bg-[#1858AE] text-white font-black text-xs sm:text-sm shadow-sm gap-2 cursor-pointer shrink-0 transition-transform active:scale-95"
            >
              <span>Start Chat</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Additional Collapsible Functional Routine Checklist (Preserving existing features) */}
          <div className="rounded-3xl border border-[#E2EAF5] bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#0F243E] font-display">
                    Daily Routine & Needs
                  </h4>
                  <span className="text-[11px] font-semibold text-[#627D98]">
                    {routinesDone} completed today
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("routine")}
                className="h-7 px-3 rounded-full text-xs font-bold border-[#E2EAF5] text-[#1E6FD9] hover:bg-[#F4F8FD]"
              >
                View Routine
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shoppingItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleShoppingItem(item.id)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F4F8FD] hover:bg-[#EBF3FC] border border-[#E2EAF5] cursor-pointer transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                      item.done
                        ? "bg-[#1E6FD9] border-[#1E6FD9] text-white"
                        : "border-[#829AB1] bg-white"
                    }`}
                  >
                    {item.done && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`text-xs font-semibold truncate ${
                      item.done ? "line-through text-[#829AB1]" : "text-[#0F243E]"
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT SIDE PANEL (4 COLUMNS ON XL) matching reference image              */}
        {/* ======================================================================= */}
        <div className="xl:col-span-4 space-y-5 sm:space-y-6">
          {/* CARD 1: TODAY'S REMINDERS matching reference timeline */}
          <div className="rounded-3xl bg-white border border-[#E2EAF5] p-5 shadow-[0_4px_24px_-4px_rgba(15,36,62,0.04)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <h4 className="text-base font-black text-[#0F243E] font-display">
                  Today's Reminders
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("routine")}
                className="text-xs font-bold text-[#1E6FD9] hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Timeline List matching reference image */}
            <div className="space-y-3">
              {/* Item 1: 08:00 AM Morning Medicine */}
              <div
                onClick={() => toggleReminderCheck("rem-1")}
                className="flex items-start justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#F4F8FD] transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-bold text-[#829AB1] w-16 shrink-0 pt-0.5">
                    • 08:00 AM
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0F243E] truncate">
                      Morning Medicine
                    </div>
                    <div className="text-[11px] font-medium text-[#627D98] truncate">
                      {nextMedicine?.name || "Paracetamol 500mg"}
                    </div>
                  </div>
                </div>

                {/* Checked Green Circle */}
                {checkedReminders["rem-1"] ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5 fill-[#DCFCE7]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#CBD5E1] shrink-0 mt-0.5 group-hover:text-[#16A34A]" />
                )}
              </div>

              {/* Item 2: 10:00 AM Blood Pressure Check */}
              <div
                onClick={() => toggleReminderCheck("rem-2")}
                className="flex items-start justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#F4F8FD] transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-bold text-[#829AB1] w-16 shrink-0 pt-0.5">
                    • 10:00 AM
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0F243E] truncate">
                      Blood Pressure Check
                    </div>
                    <div className="text-[11px] font-medium text-[#627D98] truncate">
                      At Home
                    </div>
                  </div>
                </div>

                {checkedReminders["rem-2"] ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5 fill-[#DCFCE7]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#CBD5E1] shrink-0 mt-0.5 group-hover:text-[#16A34A]" />
                )}
              </div>

              {/* Item 3: 02:00 PM Afternoon Medicine */}
              <div
                onClick={() => toggleReminderCheck("rem-3")}
                className="flex items-start justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#F4F8FD] transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-bold text-[#829AB1] w-16 shrink-0 pt-0.5">
                    • 02:00 PM
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0F243E] truncate">
                      Afternoon Medicine
                    </div>
                    <div className="text-[11px] font-medium text-[#627D98] truncate">
                      Vitamin D3
                    </div>
                  </div>
                </div>

                {checkedReminders["rem-3"] ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5 fill-[#DCFCE7]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#CBD5E1] shrink-0 mt-0.5 group-hover:text-[#16A34A]" />
                )}
              </div>

              {/* Item 4: 06:00 PM Evening Medicine */}
              <div
                onClick={() => toggleReminderCheck("rem-4")}
                className="flex items-start justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#F4F8FD] transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-bold text-[#829AB1] w-16 shrink-0 pt-0.5">
                    • 06:00 PM
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0F243E] truncate">
                      Evening Medicine
                    </div>
                    <div className="text-[11px] font-medium text-[#627D98] truncate">
                      Metformin 500mg
                    </div>
                  </div>
                </div>

                {checkedReminders["rem-4"] ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5 fill-[#DCFCE7]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#CBD5E1] shrink-0 mt-0.5 group-hover:text-[#16A34A]" />
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: UPCOMING APPOINTMENT matching reference image */}
          <div className="rounded-3xl bg-white border border-[#E2EAF5] p-5 shadow-[0_4px_24px_-4px_rgba(15,36,62,0.04)] space-y-3">
            <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                <h4 className="text-base font-black text-[#0F243E] font-display">
                  Upcoming Appointment
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("appointments")}
                className="text-xs font-bold text-[#1E6FD9] hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Appointment Detail Card */}
            <div
              onClick={() => onNavigate("appointments")}
              className="p-3.5 rounded-2xl bg-[#F8FAFD] border-l-4 border-l-[#1E6FD9] border border-[#E2EAF5] flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F0F5FB] transition-colors group"
            >
              <div className="min-w-0">
                <span className="text-[11px] font-black text-[#627D98] block">
                  {nextAppointment?.date || "15 Sep 2025"}
                </span>
                <div className="text-sm font-black text-[#0F243E] truncate mt-0.5">
                  {nextAppointment?.title || "General Checkup"}
                </div>
                <div className="text-xs font-semibold text-[#627D98] truncate mt-0.5">
                  {nextAppointment?.doctor || "Dr. Sharma"}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#1E6FD9] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </div>

          {/* CARD 3: MEMORY GARDEN SPROUT CARD matching reference image */}
          <div className="rounded-3xl bg-[#F0FDF4] border border-[#BBF7D0] p-5 shadow-[0_4px_24px_-4px_rgba(15,36,62,0.04)] space-y-3 relative overflow-hidden">
            {/* Header Pill */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-black border border-[#86EFAC]/60">
                <Leaf className="h-3.5 w-3.5" /> Memory Garden
              </span>
            </div>

            {/* Calm Supportive Text */}
            <div>
              <h4 className="text-sm font-black text-[#14532D] font-display">
                Your mind is like a garden...
              </h4>
              <p className="text-xs font-semibold text-[#166534]/90 mt-1 leading-relaxed">
                Keep it watered with good thoughts, happy moments and positive energy.
              </p>
            </div>

            {/* Progress Bar 3/5 */}
            <div className="space-y-1 pt-1">
              <div className="w-full bg-[#DCFCE7] rounded-full h-2 overflow-hidden border border-[#86EFAC]/40">
                <div
                  className="bg-[#16A34A] h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: "60%" }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-black text-[#15803D]">
                <span>3/5</span>
                <span>3/5</span>
              </div>
            </div>

            {/* Visual Sprout & Watering Can Illustration */}
            <div className="pt-2">
              <MemoryGardenIllustration className="w-full h-24" />
            </div>
          </div>

          {/* EMERGENCY SOS 3-SECOND HOLD HERO CONTROL (Preserving accessibility) */}
          <div className="rounded-3xl border border-rose-100 bg-white p-4 shadow-xs">
            <SosHoldControl variant="heroCard" onTrigger={onOpenSos} />
          </div>
        </div>
      </div>
    </div>
  );
}
