import { useState } from "react";
import {
  HeartHandshake,
  AlertTriangle,
  Pill,
  Calendar,
  CheckCircle2,
  Clock,
  Gamepad2,
  BookOpen,
  AlertOctagon,
  ShieldCheck,
  User,
  RefreshCw,
  Plus,
  ArrowUpRight,
  PhoneCall,
  Lock,
  History,
  TrendingUp,
  Droplets,
  Activity,
  Smile,
  Bell,
  Settings2,
  Sliders,
  Check,
  Users,
  MessageSquare,
  Heart,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";

export function CaregiverDashboard({
  store,
  onNavigate,
}: {
  store: MemoryBondStore;
  onNavigate: (tab: string) => void;
}) {
  const { t } = useI18n();
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string>(
    store.caregiverLinks[0]?.id || "cg-1"
  );
  const [selectedSeniorId, setSelectedSeniorId] = useState<string>("sr-1");
  const [isAlertConfigOpen, setIsAlertConfigOpen] = useState<boolean>(false);
  const [trendTab, setTrendTab] = useState<"daily" | "weekly" | "monthly">("weekly");

  // Caregiver notification config state
  const [alertConfig, setAlertConfig] = useState(
    store.profile.caregiver_alerts || {
      missed_medicines: true,
      low_stock: true,
      sos_emergency: true,
      daily_routine: true,
    }
  );

  const handleToggleAlert = (key: keyof typeof alertConfig) => {
    const updated = { ...alertConfig, [key]: !alertConfig[key] };
    setAlertConfig(updated);
    store.updateProfile({ caregiver_alerts: updated });
  };

  const activeCaregiver = store.caregiverLinks.find((c) => c.id === selectedCaregiverId) || store.caregiverLinks[0];
  const permissions = activeCaregiver?.permissions || {
    medicines: true,
    appointments: true,
    games: true,
    sos: true,
    journal: false,
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const routinesDone = store.routines.filter((r) => r.done_date === todayStr).length;
  const recentSos = store.sosEvents[0];
  const lowStockMeds = store.medicines.filter(
    (m) => m.stock <= m.refill_threshold || (m.daily_usage > 0 && m.stock / m.daily_usage <= 3)
  );
  const missedLogs = store.medicineLogs.filter((l) => l.status === "missed");
  const hydrationReminder = store.reminders.find((r) => r.type === "hydration");
  const hydrationDone = hydrationReminder?.last_done === todayStr;
  const cognitiveDone = store.gameSessions.some((s) => s.created_at.startsWith(todayStr));
  const recentRoutineCall = store.routineCalls[0];

  const assignedSeniors = store.assignedSeniors || [];
  const activeSenior =
    assignedSeniors.find((s) => s.id === selectedSeniorId) ||
    assignedSeniors[0] || {
      id: "sr-1",
      name: store.profile.full_name,
      age: 68,
      region: "Assam",
      status: "stable",
      statusLabel: "🟢 Activity Status: Normal",
      medicineStatus: "2 / 2",
      hydration: `${store.hydrationGlasses || 4} / ${store.hydrationTarget || 6}`,
      routine: "5 / 6",
      gamesCompleted: 2,
      lastActive: "10 minutes ago",
      lastSync: store.lastSyncTime || "2 minutes ago",
      alerts: ["Activity pattern normal"],
      wellnessTrend: "Improving",
    };

  return (
    <div className="space-y-6">
      {/* SECTION 16: GOOD MORNING, CAREGIVER OVERVIEW */}
      <div className="rounded-3xl border-2 border-primary/25 bg-linear-to-br from-primary/10 via-card to-card p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👋</span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">GOOD MORNING, CAREGIVER</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Active caregiver oversight for elderly family members across the North Eastern Region
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-2 text-xs font-black">
              <Users className="h-4 w-4 text-primary" />
              <span>Assigned Seniors:</span>
              <span className="text-primary text-base font-black">5</span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>🟢 Stable activity:</span>
              <span className="font-black">3</span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>🟡 Needs attention:</span>
              <span className="font-black">1</span>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>🔴 Urgent:</span>
              <span className="font-black">1</span>
            </div>
          </div>
        </div>

        {/* Multi-Senior Switcher Bar */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Select Assigned Senior to Monitor:</span>
            <span className="italic">Data syncs automatically</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {assignedSeniors.map((sn) => {
              const isSelected = selectedSeniorId === sn.id;
              return (
                <button
                  key={sn.id}
                  onClick={() => setSelectedSeniorId(sn.id)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm scale-102"
                      : "border-border bg-card hover:bg-secondary/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-sm text-foreground truncate">{sn.name}</span>
                    <span className="text-xs">
                      {sn.status === "stable" ? "🟢" : sn.status === "attention" ? "🟡" : "🔴"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {sn.age} yrs • {sn.region}
                  </div>
                  <div className={`text-[10px] font-bold mt-1 truncate ${
                    sn.status === "stable" ? "text-emerald-600" : sn.status === "attention" ? "text-amber-600" : "text-destructive"
                  }`}>
                    {sn.statusLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Senior Profile & Status Snapshot */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-black text-2xl">
              {activeSenior.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  {activeSenior.name}
                </h2>
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                  activeSenior.status === "stable"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600"
                    : activeSenior.status === "attention"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-600"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-600"
                }`}>
                  {activeSenior.status === "stable" ? "🟢 Activity Status: Normal" : activeSenior.status === "attention" ? "🟡 Needs Attention" : "🔴 Urgent: Action Needed"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Age: {activeSenior.age} • Region: {activeSenior.region} • Last active: <span className="font-semibold text-foreground">{activeSenior.lastActive}</span> • Last sync: <span className="font-mono text-foreground">{activeSenior.lastSync}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAlertConfigOpen(true)}
              className="gap-1.5 font-bold rounded-xl h-11 text-xs"
            >
              <Bell className="h-4 w-4 text-primary" /> Alert Preferences
            </Button>
            <a
              href={`tel:${store.profile.phone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-xs hover:bg-primary/90"
            >
              <PhoneCall className="h-4 w-4" /> Call Senior
            </a>
            <Button
              variant="outline"
              onClick={() => store.setRole("senior")}
              className="font-bold rounded-xl text-sm h-11"
            >
              Senior View
            </Button>
          </div>
        </div>

        {/* Section 16 Core Indicators for Selected Senior */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* 1. Medicine */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Medicine</span>
              <Pill className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-foreground flex items-center gap-1">
              <span>✅</span> {activeSenior.id === "sr-1" ? (missedLogs.length > 0 ? "1 / 2" : "2 / 2") : activeSenior.medicineStatus}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {activeSenior.id === "sr-1" && missedLogs.length > 0 ? "1 missed dose" : "Prescribed on track"}
            </div>
          </div>

          {/* 2. Hydration */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Hydration</span>
              <Droplets className="h-4 w-4 text-sky-600" />
            </div>
            <div className="text-lg font-black text-foreground flex items-center gap-1">
              <span>💧</span> {activeSenior.id === "sr-1" ? `${store.hydrationGlasses || 4} / ${store.hydrationTarget || 6}` : activeSenior.hydration}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              Glasses today
            </div>
          </div>

          {/* 3. Memory Games */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Memory Games</span>
              <Gamepad2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-lg font-black text-foreground flex items-center gap-1">
              <span>🧠</span> {activeSenior.gamesCompleted} completed
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              Adaptive Level 2
            </div>
          </div>

          {/* 4. Routine */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Routine</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-lg font-black text-foreground flex items-center gap-1">
              <span>📅</span> {activeSenior.id === "sr-1" ? `${routinesDone} / ${store.routines.length}` : activeSenior.routine}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              Daily tasks logged
            </div>
          </div>

          {/* 5. Last Active */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Last Active</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-base font-black text-foreground truncate">
              ⏱️ {activeSenior.lastActive}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              Sync: {activeSenior.lastSync}
            </div>
          </div>

          {/* 6. Wellness Trend */}
          <div className="rounded-2xl border-2 border-border bg-secondary/30 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Wellness Trend</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-base font-black text-success flex items-center gap-1">
              <span>↗️</span> {activeSenior.wellnessTrend}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              Non-diagnostic
            </div>
          </div>
        </div>

        {/* SECTION 17: CAREGIVER ALERT SYSTEM (Non-Diagnostic Wording) */}
        <div className="rounded-2xl border-2 border-warning/40 bg-warning/10 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-warning font-black text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Activity Pattern Signals (Section 17)</span>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">
              These indicators are for activity tracking and are not a medical diagnosis.
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-card border border-warning/30 flex items-start gap-2">
              <span className="text-warning font-bold">⚠️</span>
              <div>
                <span className="font-bold text-foreground">Activity pattern needs attention:</span>
                <p className="text-muted-foreground text-[11px]">
                  {activeSenior.status === "urgent"
                    ? "Missed morning medication and no routine check-in recorded."
                    : activeSenior.status === "attention"
                    ? "Slight dip in cognitive game participation this week."
                    : "No concerning deviations; daily pattern is steady."}
                </p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-warning/30 flex items-start gap-2">
              <span className="text-warning font-bold">⚠️</span>
              <div>
                <span className="font-bold text-foreground">Routine Adherence:</span>
                <p className="text-muted-foreground text-[11px]">
                  {routinesDone < store.routines.length ? "Tasks pending for afternoon & evening." : "All routine tasks complete."}
                </p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-warning/30 flex items-start gap-2">
              <span className="text-warning font-bold">⚠️</span>
              <div>
                <span className="font-bold text-foreground">Caregiver Inactivity Watch:</span>
                <p className="text-muted-foreground text-[11px]">
                  Last active {activeSenior.lastActive}. Notification threshold set to 4 hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 18: CAREGIVER ACTIONS (10 Distinct Core Actions) */}
        <div className="pt-2 border-t border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Caregiver Actions (Section 18)
            </span>
            <span className="text-xs text-primary font-bold">10 Available Actions</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-bold">
            <a
              href={`tel:${store.profile.phone}`}
              className="p-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <PhoneCall className="h-3.5 w-3.5 shrink-0" /> 1. Call Senior
            </a>
            <button
              onClick={() => onNavigate("reminders")}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-1.5 transition-all text-foreground cursor-pointer"
            >
              <Send className="h-3.5 w-3.5 text-primary shrink-0" /> 2. Send Reminder
            </button>
            <button
              onClick={() => onNavigate("reminders")}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-1.5 transition-all text-foreground cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-primary shrink-0" /> 3. Add Reminder
            </button>
            <button
              onClick={() => onNavigate("routine")}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-1.5 transition-all text-foreground cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" /> 4. Edit Routine
            </button>
            <button
              onClick={() => onNavigate("appointments")}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-1.5 transition-all text-foreground cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" /> 5. Add Appointment
            </button>
            <button
              onClick={() => onNavigate("medicines")}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-1.5 transition-all text-foreground cursor-pointer"
            >
              <Pill className="h-3.5 w-3.5 text-primary shrink-0" /> 6. Medicine Schedule
            </button>
            <button
              onClick={() => onNavigate("journal")}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-1.5 transition-all text-foreground cursor-pointer"
            >
              <History className="h-3.5 w-3.5 text-primary shrink-0" /> 7. Activity History
            </button>
            <button
              onClick={() => onNavigate("games")}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-1.5 transition-all text-foreground cursor-pointer"
            >
              <Gamepad2 className="h-3.5 w-3.5 text-primary shrink-0" /> 8. Game Performance
            </button>
            <button
              onClick={() => onNavigate("family")}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-1.5 transition-all text-foreground cursor-pointer"
            >
              <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0" /> 9. Family Memories
            </button>
            <button
              onClick={() => setIsAlertConfigOpen(true)}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center gap-1.5 transition-all text-foreground cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 text-primary shrink-0" /> 10. Review Alerts
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 7: CAREGIVER ALERT SYSTEM — 6 CORE STATUSES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Senior Status Indicators (Section 7)
          </h3>
          <span className="text-xs font-bold text-muted-foreground">Live Monitoring</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Medicine Status */}
          <div className={`rounded-2xl border-2 p-4 space-y-1.5 ${
            missedLogs.length > 0 ? "border-destructive/60 bg-destructive/10" : "border-border bg-card"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Medicine</span>
              <Pill className={`h-4 w-4 ${missedLogs.length > 0 ? "text-destructive" : "text-emerald-600"}`} />
            </div>
            <div className={`text-lg font-black ${missedLogs.length > 0 ? "text-destructive" : "text-success"}`}>
              {missedLogs.length > 0 ? "⚠ Missed" : "✓ Taken"}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {missedLogs.length > 0 ? `${missedLogs.length} dose missed` : "All on schedule"}
            </p>
          </div>

          {/* 2. Hydration Status */}
          <div className={`rounded-2xl border-2 p-4 space-y-1.5 ${
            hydrationDone ? "border-border bg-card" : "border-warning/50 bg-warning/10"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Hydration</span>
              <Droplets className={`h-4 w-4 ${hydrationDone ? "text-sky-600" : "text-warning"}`} />
            </div>
            <div className={`text-lg font-black ${hydrationDone ? "text-success" : "text-warning"}`}>
              {hydrationDone ? "✓ Completed" : "⚠ Pending"}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {hydrationDone ? "Warm water logged" : "Drink warm water due"}
            </p>
          </div>

          {/* 3. Cognitive Status */}
          <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Cognitive</span>
              <Gamepad2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className={`text-lg font-black ${cognitiveDone ? "text-success" : "text-primary"}`}>
              {cognitiveDone ? "✓ Completed" : "✓ Active"}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              CES: {store.cognitiveScore.overall} / 100
            </p>
          </div>

          {/* 4. Daily Activity */}
          <div className={`rounded-2xl border-2 p-4 space-y-1.5 ${
            routinesDone < 2 ? "border-warning/50 bg-warning/10" : "border-border bg-card"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Daily Activity</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className={`text-lg font-black ${routinesDone < 2 ? "text-warning" : "text-foreground"}`}>
              {routinesDone < 2 ? "⚠ Low" : "✓ Active"}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {routinesDone} / {store.routines.length} completed
            </p>
          </div>

          {/* 5. Mood Engagement */}
          <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Mood</span>
              <Smile className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-lg font-black text-foreground">
              Normal
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Family calls active
            </p>
          </div>

          {/* 6. Emergency Status */}
          <div className={`rounded-2xl border-2 p-4 space-y-1.5 ${
            recentSos ? "border-destructive/60 bg-destructive/10" : "border-border bg-card"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Emergency</span>
              <AlertOctagon className={`h-4 w-4 ${recentSos ? "text-destructive" : "text-muted-foreground"}`} />
            </div>
            <div className={`text-base font-black ${recentSos ? "text-destructive" : "text-success"}`}>
              {recentSos ? "⚠ Active SOS" : "No active SOS"}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {recentSos ? "Location shared" : "Calm & safe"}
            </p>
          </div>
        </div>
      </div>

      {/* CAREGIVER / FAMILY CARE & CONTACTS (Requirement 10) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-rose-500" /> Family Care & Emergency Contacts
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage authorized family members, alert recipients, and voice memories for senior identification.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onNavigate("family")}
            className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Manage Family Members ({store.contacts.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {store.contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-2 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                  {contact.photo_url ? (
                    <img src={contact.photo_url} alt={contact.name} className="w-full h-full object-cover" />
                  ) : (
                    contact.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-foreground truncate">{contact.name}</div>
                  <div className="text-xs text-muted-foreground">{contact.relationship} • {contact.phone}</div>
                </div>
              </div>

              {contact.voice_memory && (
                <div className="text-xs italic bg-card/60 p-2.5 rounded-xl text-muted-foreground border border-border/50">
                  "{contact.voice_memory}"
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {contact.is_emergency && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-destructive/15 text-destructive border border-destructive/30">
                    SOS Alerts Active
                  </span>
                )}
                {contact.active_for_calls && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
                    Calls Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Refill Warning Banner */}
      {permissions.medicines && lowStockMeds.length > 0 && (
        <div className="rounded-3xl border-2 border-warning/50 bg-warning/10 p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-warning font-black text-lg">
              <AlertTriangle className="h-6 w-6" />
              <span>MEDICINE REFILL ALERT ({lowStockMeds.length} Items Approaching Threshold)</span>
            </div>
            <Button
              size="sm"
              onClick={() => onNavigate("medicines")}
              className="bg-primary text-white font-bold rounded-xl"
            >
              Manage Refills
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lowStockMeds.map((med) => (
              <div key={med.id} className="rounded-2xl bg-card border border-warning/30 p-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-foreground">{med.name}</span>
                  <div className="text-xs text-muted-foreground">{med.dosage} • Daily: {med.daily_usage}</div>
                </div>
                <div className="text-right">
                  <span className="font-black text-destructive text-lg">{med.stock}</span>
                  <span className="text-xs text-muted-foreground ml-1">{med.unit}s left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missed Medicine Escalation Banner */}
      {permissions.medicines && missedLogs.length > 0 && (
        <div className="rounded-3xl border-2 border-destructive/50 bg-destructive/10 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h4 className="font-bold text-foreground">
                Missed Medicine Escalation Recorded Today
              </h4>
              <p className="text-xs text-muted-foreground font-medium">
                Senior logged missed dose at {missedLogs[0]?.scheduled_time || "recent time"}. Please give a gentle check-in call.
              </p>
            </div>
          </div>
          <a
            href={`tel:${store.profile.phone}`}
            className="px-4 py-2 rounded-xl bg-destructive text-white font-bold text-xs inline-flex items-center gap-1.5"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Call to Remind
          </a>
        </div>
      )}

      {/* 3-STAGE REMINDER ESCALATION WORKFLOW (Requirement 15) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> 3-Stage Reminder Escalation Flow
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated progression: Stage 1 (Sent) ➔ Stage 2 (Second Notice) ➔ Stage 3 (Caregiver Alert)
            </p>
          </div>
          {typeof store.simulateEscalationFlow === "function" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => store.simulateEscalationFlow("Evening Donepezil 5mg")}
              className="rounded-xl font-bold text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Test 3-Stage Escalation
            </Button>
          )}
        </div>

        {/* Escalation items timeline */}
        <div className="space-y-3">
          {(store.reminderEscalations || []).map((esc) => {
            const isResolved = esc.status === "resolved";
            const isAlerted = esc.stage === 3 && !isResolved;
            return (
              <div
                key={esc.id}
                className={`rounded-2xl border-2 p-4 transition-all ${
                  isAlerted
                    ? "border-destructive/60 bg-destructive/10"
                    : isResolved
                    ? "border-border bg-secondary/20 opacity-80"
                    : "border-warning/50 bg-warning/10"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{esc.reminder_title}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                      {esc.scheduled_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isResolved ? (
                      <span className="text-xs font-bold text-success flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Acknowledged / Resolved
                      </span>
                    ) : (
                      <>
                        <span className={`text-xs font-black uppercase ${isAlerted ? "text-destructive" : "text-warning"}`}>
                          {isAlerted ? "Stage 3: Caregiver Escalated" : `Stage ${esc.stage}: In Progress`}
                        </span>
                        {typeof store.resolveReminderEscalation === "function" && (
                          <Button
                            size="sm"
                            onClick={() => store.resolveReminderEscalation(esc.id)}
                            className="h-8 px-3 text-xs font-bold rounded-xl"
                          >
                            Mark Handled
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 3 Step Visual Progress */}
                <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs font-bold">
                  <div className={`p-2 rounded-xl border ${
                    esc.stage >= 1 ? "bg-primary/15 border-primary/40 text-primary" : "bg-card border-border text-muted-foreground"
                  }`}>
                    <div>1. First Reminder</div>
                    <div className="text-[10px] font-normal opacity-80">Sent to Senior</div>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    esc.stage >= 2 ? "bg-warning/20 border-warning/50 text-warning" : "bg-card border-border text-muted-foreground"
                  }`}>
                    <div>2. Second Notice</div>
                    <div className="text-[10px] font-normal opacity-80">Unanswered</div>
                  </div>
                  <div className={`p-2 rounded-xl border ${
                    esc.stage === 3 ? "bg-destructive/20 border-destructive/50 text-destructive" : "bg-card border-border text-muted-foreground"
                  }`}>
                    <div>3. Caregiver Alert</div>
                    <div className="text-[10px] font-normal opacity-80">Phone Call / SMS</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HISTORICAL COGNITIVE ENGAGEMENT TRENDS (Requirement 6 & 16) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Historical Performance Trends
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Non-diagnostic cognitive engagement trends across daily, weekly, and monthly activity windows.
            </p>
          </div>

          {/* Timeframe selector tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary border border-border">
            {(["daily", "weekly", "monthly"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTrendTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                  trendTab === tab
                    ? "bg-card text-foreground shadow-xs scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Trend Points Table / Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {(typeof store.getCognitiveTrends === "function" ? store.getCognitiveTrends(trendTab) : []).map((point, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">{point.period}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  {point.sessionCount} session{point.sessionCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{point.overall}</span>
                <span className="text-xs text-muted-foreground font-semibold">/ 100 CES</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold text-muted-foreground pt-1 border-t border-border/50">
                <div>Memory: <span className="text-foreground font-bold">{point.memory}</span></div>
                <div>Attention: <span className="text-foreground font-bold">{point.attention}</span></div>
                <div>Recognition: <span className="text-foreground font-bold">{point.recognition}</span></div>
                <div>Recall: <span className="text-foreground font-bold">{point.recall}</span></div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer footer */}
        <p className="text-[11px] text-muted-foreground italic border-t border-border/60 pt-2">
          Note: Cognitive Engagement Scores reflect activity participation, reaction speed, and memory exercise consistency. They are strictly non-diagnostic wellness indicators.
        </p>
      </div>

      {recentRoutineCall && (
        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Daily Routine Call Summary
            </h4>
            <span className="text-xs font-mono text-muted-foreground">
              {recentRoutineCall.date} at {recentRoutineCall.time}
            </span>
          </div>
          <p className="text-sm text-foreground bg-secondary/30 p-4 rounded-2xl border border-border">
            {recentRoutineCall.summary}
          </p>
        </div>
      )}

      {/* Memory Journal Visibility */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-rose-500" /> Senior Memory Journal
          </h4>
          {permissions.journal ? (
            <span className="text-xs font-bold text-success">Authorized Access</span>
          ) : (
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> Private by Senior's Permission
            </span>
          )}
        </div>

        {!permissions.journal ? (
          <p className="text-sm text-muted-foreground italic">
            The senior has designated private memories confidential. Access can be granted from the senior's family settings.
          </p>
        ) : (
          <div className="space-y-2">
            {store.journal.slice(0, 3).map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-secondary/30 text-sm">
                <span className="font-bold text-foreground">{item.title}</span> — {item.body.slice(0, 80)}...
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configurable Alert Settings Modal */}
      {isAlertConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Caregiver Alert Settings
              </h3>
              <button
                onClick={() => setIsAlertConfigOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-secondary"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Configure alert preferences so you are only notified when meaningful intervention is needed.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border">
                <div>
                  <Label className="font-bold text-sm text-foreground">Missed Medicine Alerts</Label>
                  <p className="text-xs text-muted-foreground">Alert when senior misses scheduled dosage</p>
                </div>
                <Switch
                  checked={alertConfig.missed_medicines}
                  onCheckedChange={() => handleToggleAlert("missed_medicines")}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border">
                <div>
                  <Label className="font-bold text-sm text-foreground">Low Stock & Refill Alerts</Label>
                  <p className="text-xs text-muted-foreground">Alert when &lt; 3 days of medicine remains</p>
                </div>
                <Switch
                  checked={alertConfig.low_stock}
                  onCheckedChange={() => handleToggleAlert("low_stock")}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border">
                <div>
                  <Label className="font-bold text-sm text-foreground">Emergency SOS Alerts</Label>
                  <p className="text-xs text-muted-foreground">Immediate priority call & location dispatch</p>
                </div>
                <Switch
                  checked={alertConfig.sos_emergency}
                  onCheckedChange={() => handleToggleAlert("sos_emergency")}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border">
                <div>
                  <Label className="font-bold text-sm text-foreground">Daily Routine Call Summaries</Label>
                  <p className="text-xs text-muted-foreground">Summary upon daily routine check-in completion</p>
                </div>
                <Switch
                  checked={alertConfig.daily_routine}
                  onCheckedChange={() => handleToggleAlert("daily_routine")}
                />
              </div>
            </div>

            <Button
              onClick={() => setIsAlertConfigOpen(false)}
              className="w-full font-bold rounded-xl h-11"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
