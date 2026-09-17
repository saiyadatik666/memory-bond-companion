import { useState, useEffect } from "react";
import {
  Gamepad2,
  Calendar,
  Mic,
  Clock,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowRight,
  Volume2,
  WifiOff,
  AlertTriangle,
  AlertOctagon,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import { AiRobotAvatar } from "./Illustrations";

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

  // Interactive local checklist for Home reminders
  const [checkedReminders, setCheckedReminders] = useState<Record<string, boolean>>({
    "rem-1": true,  // 08:00 AM Morning Medicine
    "rem-2": false, // 10:00 AM Blood Pressure Check
    "rem-3": false, // 02:00 PM Afternoon Reminder
    "rem-4": false, // 06:00 PM Evening Medicine
  });

  const toggleReminderCheck = (id: string) => {
    setCheckedReminders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHour(now.getHours());
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const nextMedicine = store.medicines[0];
  const lowStockMeds = store.medicines.filter((m) => m.stock <= m.refill_threshold);
  const nextAppointment = store.appointments[0];

  const greeting = (() => {
    if (hour < 12) return t("goodMorning");
    if (hour < 17) return t("goodAfternoon");
    return t("goodEvening");
  })();

  const rawName = store.profile.full_name?.trim() || "Dadaji";
  const displayName = rawName.split(" ")[0] || "Dadaji";
  const quoteText = t("smallStepsQuote");

  const speakWelcome = () => {
    stopSpeaking();
    speakText(
      `${greeting}, ${displayName}. ${quoteText}`,
      speechLocale || "en-IN"
    );
  };

  // -------------------------------------------------------------------------
  // QUICK ACCESS: EXACTLY 4 CORE ACTIONS AS MANDATED BY SPECIFICATION
  // 1. Play Games, 2. Reminders, 3. Voice AI, 4. SOS Emergency
  // -------------------------------------------------------------------------
  const quickAccessItems = [
    {
      id: "qa-games",
      title: t("qaPlayGames") || "Play Games",
      desc: t("qaPlayGamesDesc") || "Keep your mind sharp",
      icon: Gamepad2,
      onClick: () => onNavigate("games"),
      iconBg: "bg-[#F3E8FF] text-[#7E22CE]",
      cardBorder: "border-[#E9D5FF] hover:border-[#C084FC]",
      hoverBg: "hover:bg-[#FAF5FF]",
    },
    {
      id: "qa-reminders",
      title: t("reminders") || "Reminders",
      desc: t("qaRemindersDesc") || "Check today's schedule",
      icon: Bell,
      onClick: () => onNavigate("reminders"),
      iconBg: "bg-[#EDE9FE] text-[#6D28D9]",
      cardBorder: "border-[#DDD6FE] hover:border-[#A78BFA]",
      hoverBg: "hover:bg-[#F5F3FF]",
    },
    {
      id: "qa-voice",
      title: t("qaVoiceAi") || "Voice AI",
      desc: t("qaVoiceAiDesc") || "Speak with your companion",
      icon: Mic,
      onClick: onOpenVoiceAssistant,
      iconBg: "bg-[#DBEAFE] text-[#1D4ED8]",
      cardBorder: "border-[#BFDBFE] hover:border-[#60A5FA]",
      hoverBg: "hover:bg-[#EFF6FF]",
    },
    {
      id: "qa-sos",
      title: t("qaEmergencySos") || "SOS Emergency",
      desc: t("qaEmergencySosDesc") || "Instant help alert",
      icon: AlertOctagon,
      onClick: onOpenSos,
      iconBg: "bg-[#FEE2E2] text-[#DC2626]",
      cardBorder: "border-[#FECACA] hover:border-[#F87171]",
      hoverBg: "hover:bg-[#FEF2F2]",
      isEmergency: true,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 pb-12 max-w-[1600px] mx-auto select-none">
      {/* ===================================================================== */}
      {/* 1. CONDITIONAL SYSTEM ALERTS (ONLY SHOWN WHEN RELEVANT)               */}
      {/* ===================================================================== */}
      {!store.isOnline && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-900">{t("offlineSafeMode")}</div>
              <p className="text-xs font-semibold text-amber-800/80">
                {t("offlineSafeDesc")}
              </p>
            </div>
          </div>
          {store.syncQueue.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-black shrink-0">
              {store.syncQueue.length} {t("localUpdates")}
            </span>
          )}
        </div>
      )}

      {/* Critical Medicine Refill Warning (Only when low stock medicines exist) */}
      {lowStockMeds.length > 0 && (
        <div
          onClick={() => onNavigate("medicines")}
          className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3 sm:p-3.5 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-100/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#0F243E]">
                {lowStockMeds[0]?.name} – {t("medicineLow")}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#627D98] font-medium">
                {t("tapRefillDetails")}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#829AB1] shrink-0" />
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. WELCOME / HERO SECTION (Compact, Warm, Senior-Friendly)            */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E2EAF5] shadow-[0_4px_24px_-4px_rgba(15,36,62,0.04)] p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
        {/* Left Welcome Text */}
        <div className="flex-1 space-y-2 text-left min-w-0 w-full">
          <div>
            <p className="text-base sm:text-lg font-bold text-[#5B728D]">
              {greeting},
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0F243E] font-display tracking-tight flex items-center gap-2 mt-0.5">
              <span>{displayName}</span>
              <span className="text-2xl sm:text-3xl">☀️</span>
            </h2>
          </div>

          <p className="text-xs sm:text-sm md:text-base font-semibold text-[#5B728D] max-w-lg leading-relaxed pt-0.5">
            “{quoteText}”
          </p>

          <div className="pt-2 flex items-center gap-3">
            <div className="w-10 h-px bg-[#E2EAF5]" />
            <span className="text-[#0284C7] text-xs">♡</span>
            <div className="w-10 h-px bg-[#E2EAF5]" />

            <button
              type="button"
              onClick={speakWelcome}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F8FD] hover:bg-[#EBF3FC] text-[#1E6FD9] border border-[#E2EAF5] text-xs font-bold transition-colors cursor-pointer"
              title="Read aloud"
            >
              <Volume2 className="h-3.5 w-3.5" /> {t("readAloudBtn")}
            </button>
          </div>
        </div>

        {/* Right Family Photograph (Compact, attractive, responsive) */}
        <div className="w-full md:w-72 lg:w-80 h-40 sm:h-44 md:h-48 rounded-2xl overflow-hidden shadow-2xs shrink-0 border border-[#E2EAF5]/80">
          <img
            src="/images/family_memory_hero.jpg"
            alt="Family moment"
            className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-103"
            loading="eager"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. TODAY'S REMINDERS & UPCOMING APPOINTMENT (BALANCED 2-COLUMN GRID)  */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* CARD 1: TODAY'S REMINDERS (TOP 4 KEY REMINDERS WITH VIEW ALL) */}
        <div className="rounded-3xl bg-white border border-[#E2EAF5] p-5 shadow-[0_4px_24px_-4px_rgba(15,36,62,0.04)] space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <h4 className="text-base font-black text-[#0F243E] font-display">
                  {t("todaysReminders") || "Today's Reminders"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("routine")}
                className="text-xs font-bold text-[#1E6FD9] hover:underline cursor-pointer"
              >
                {t("viewAll") || "View all"} →
              </button>
            </div>

            {/* Timeline List of Top 4 Reminders */}
            <div className="space-y-2 pt-2">
              {/* Item 1: 08:00 AM Morning Medicine */}
              <div
                onClick={() => toggleReminderCheck("rem-1")}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#F4F8FD] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-[#829AB1] w-18 shrink-0">
                    08:00 AM
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0F243E] truncate">
                      {t("morningMedicine") || "Morning Medicine"}
                    </div>
                    <div className="text-[11px] font-medium text-[#627D98] truncate">
                      {nextMedicine?.name || "Paracetamol 500mg"}
                    </div>
                  </div>
                </div>

                {checkedReminders["rem-1"] ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0 fill-[#DCFCE7]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#CBD5E1] shrink-0 group-hover:text-[#16A34A]" />
                )}
              </div>

              {/* Item 2: 10:00 AM Blood Pressure Check */}
              <div
                onClick={() => toggleReminderCheck("rem-2")}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#F4F8FD] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-[#829AB1] w-18 shrink-0">
                    10:00 AM
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0F243E] truncate">
                      {t("bloodPressureCheck") || "Blood Pressure Check"}
                    </div>
                    <div className="text-[11px] font-medium text-[#627D98] truncate">
                      {t("atHome") || "At Home Checkup"}
                    </div>
                  </div>
                </div>

                {checkedReminders["rem-2"] ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0 fill-[#DCFCE7]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#CBD5E1] shrink-0 group-hover:text-[#16A34A]" />
                )}
              </div>

              {/* Item 3: 02:00 PM Afternoon Reminder */}
              <div
                onClick={() => toggleReminderCheck("rem-3")}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#F4F8FD] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-[#829AB1] w-18 shrink-0">
                    02:00 PM
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0F243E] truncate">
                      {t("afternoonMedicine") || "Afternoon Reminder"}
                    </div>
                    <div className="text-[11px] font-medium text-[#627D98] truncate">
                      Vitamin D3 & Hydration
                    </div>
                  </div>
                </div>

                {checkedReminders["rem-3"] ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0 fill-[#DCFCE7]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#CBD5E1] shrink-0 group-hover:text-[#16A34A]" />
                )}
              </div>

              {/* Item 4: 06:00 PM Evening Medicine */}
              <div
                onClick={() => toggleReminderCheck("rem-4")}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#F4F8FD] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-[#829AB1] w-18 shrink-0">
                    06:00 PM
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0F243E] truncate">
                      {t("eveningMedicine") || "Evening Medicine"}
                    </div>
                    <div className="text-[11px] font-medium text-[#627D98] truncate">
                      Metformin 500mg
                    </div>
                  </div>
                </div>

                {checkedReminders["rem-4"] ? (
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0 fill-[#DCFCE7]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#CBD5E1] shrink-0 group-hover:text-[#16A34A]" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: UPCOMING APPOINTMENT (NEXT APPOINTMENT WITH VIEW ALL) */}
        <div className="rounded-3xl bg-white border border-[#E2EAF5] p-5 shadow-[0_4px_24px_-4px_rgba(15,36,62,0.04)] space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                <h4 className="text-base font-black text-[#0F243E] font-display">
                  {t("upcomingAppointment") || "Upcoming Appointment"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("appointments")}
                className="text-xs font-bold text-[#1E6FD9] hover:underline cursor-pointer"
              >
                {t("viewAll") || "View all"} →
              </button>
            </div>

            {/* Next Appointment Card */}
            <div
              onClick={() => onNavigate("appointments")}
              className="mt-3 p-4 rounded-2xl bg-[#F8FAFD] border-l-4 border-l-[#1E6FD9] border border-[#E2EAF5] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F0F5FB] transition-colors group"
            >
              <div className="min-w-0 space-y-1">
                <span className="text-xs font-black text-[#1E6FD9] block uppercase tracking-wider">
                  {nextAppointment?.date || "15 Sep 2025"}
                </span>
                <div className="text-base font-black text-[#0F243E] truncate">
                  {nextAppointment?.title || "General Health Checkup"}
                </div>
                <div className="text-xs font-semibold text-[#627D98] truncate">
                  {nextAppointment?.doctor || "Dr. Sharma"} • {nextAppointment?.location || "Apollo Clinic"}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white border border-[#E2EAF5] flex items-center justify-center text-[#1E6FD9] group-hover:translate-x-1 transition-transform shrink-0 shadow-2xs">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Quick Supportive Note */}
          <div className="p-3 rounded-2xl bg-[#F0F7FF] border border-[#D0E2FF] text-xs font-semibold text-[#1E6FD9] flex items-center gap-2">
            <span className="text-base">📋</span>
            <span>Caregiver and family have been automatically notified.</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. QUICK ACCESS (EXACTLY 4 LARGE CARDS: 4-COL DESKTOP, 2x2 MOBILE)    */}
      {/* ===================================================================== */}
      <section aria-label="Quick Access Features" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl text-amber-500">✨</span>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#0F243E] font-display tracking-tight leading-none">
                {t("quickAccess") || "Quick Access"}
              </h3>
              <p className="text-xs font-semibold text-[#627D98] mt-1">
                {t("exploreFeatures") || "Quickly open your daily actions"}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Cards: Desktop 4 in 1 row, Mobile 2x2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          {quickAccessItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                aria-label={`${item.title}: ${item.desc}`}
                className={`group p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border ${item.cardBorder} ${item.hoverBg} text-left transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-[0_2px_12px_-2px_rgba(15,36,62,0.04)] hover:shadow-md hover:-translate-y-0.5 active:scale-96 select-none min-w-0 w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9] min-h-[120px] sm:min-h-[136px]`}
              >
                {/* Top Row: Icon Container + Tap Indicator Arrow */}
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0`}
                  >
                    <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#829AB1]/70 group-hover:text-[#0F243E] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                {/* Bottom Area: Title + Subtitle with comfortable elder-friendly typography */}
                <div className="w-full min-w-0 mt-2.5">
                  <div className={`text-sm sm:text-base font-black font-display leading-[1.2] tracking-tight truncate ${item.isEmergency ? "text-[#DC2626]" : "text-[#0F243E]"}`}>
                    {item.title}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#627D98] font-semibold mt-1 leading-[1.25] truncate">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. NEED HELP? / AI ASSISTANT BANNER (COMPACT & CLEAN)                 */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#E0F2FE] via-[#EDF6FF] to-[#E2EEFC] border border-[#BAE6FD] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
          <AiRobotAvatar className="w-12 h-12 sm:w-14 sm:h-14 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-base sm:text-lg font-black text-[#0F243E] font-display leading-tight">
              {t("needHelp") || "Need Help?"}
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-[#486581] mt-0.5 truncate">
              {t("talkToAiAssistant") || "Talk to your friendly Memory Bond AI Assistant"}
            </p>
          </div>
        </div>

        <Button
          onClick={onOpenVoiceAssistant}
          className="h-10 px-5 rounded-full bg-[#1E6FD9] hover:bg-[#1858AE] text-white font-black text-xs sm:text-sm shadow-sm gap-2 cursor-pointer shrink-0 transition-transform active:scale-95"
        >
          <span>{t("startChat") || "Start Chat"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
