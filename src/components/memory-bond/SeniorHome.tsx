import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Friendly Warm Hero Card */}
      <div className="relative overflow-hidden rounded-3xl aurora-surface p-6 sm:p-10 shadow-lg text-white">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> Memory Bond Companion
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {greeting}, {store.profile.full_name}
          </h2>
          <p className="text-base sm:text-lg text-white/90 font-medium leading-relaxed">
            Wishing you a peaceful and cheerful day. Everything you need is right here.
          </p>

          {/* Quick AI Voice Trigger button right on the banner */}
          <div className="pt-2">
            <Button
              size="lg"
              onClick={onOpenVoiceAssistant}
              className="bg-white text-foreground hover:bg-white/90 font-bold rounded-2xl gap-2.5 h-14 px-6 text-base shadow-md"
            >
              <Mic className="h-5 w-5 text-primary" /> {t("speak") || "Tap & Speak to Assistant"}
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
