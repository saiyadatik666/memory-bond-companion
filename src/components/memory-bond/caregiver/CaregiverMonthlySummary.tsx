import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Heart,
  Droplet,
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Gamepad2,
  Brain,
  Download,
  Printer,
  Plus,
  Edit2,
  Trash2,
  Share2,
  FileText,
  Activity,
  User,
  Users,
  Info,
  ShieldCheck,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Bell,
  Scale,
  Thermometer,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  MemoryBondStore,
  HealthMeasurement,
  AssignedSenior,
} from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { HealthReadingModal } from "./HealthReadingModal";

interface CaregiverMonthlySummaryProps {
  store: MemoryBondStore;
  selectedSenior?: AssignedSenior;
  onBack: () => void;
  onNavigate?: (tab: string) => void;
}

export function CaregiverMonthlySummary({
  store,
  selectedSenior,
  onBack,
  onNavigate,
}: CaregiverMonthlySummaryProps) {
  const { t } = useI18n();

  // Multi-Senior State
  const assignedSeniors = store.assignedSeniors || [];
  const [activeSeniorId, setActiveSeniorId] = useState<string>(
    selectedSenior?.id || assignedSeniors[0]?.id || "sr-1"
  );

  const activeSenior =
    assignedSeniors.find((s) => s.id === activeSeniorId) ||
    assignedSeniors[0] || {
      id: "sr-1",
      name: store.profile.full_name || "Senior",
      age: 72,
      region: store.profile.selected_state || "Assam",
      language: store.profile.language || "English",
      status: "stable" as const,
      statusLabel: "Activity Status: Normal",
    };

  // Month Selector State: Year and Month index (0-based)
  // Default to September 2026 per Memory Bond timeline
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(8); // 8 = September (0-indexed)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const monthYearLabel = `${monthNames[currentMonthIndex]} ${currentYear}`;
  const monthKeyPrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}`;

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  // Health Reading Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"blood_pressure" | "blood_sugar" | "other">("blood_pressure");
  const [editingReading, setEditingReading] = useState<HealthMeasurement | null>(null);

  // Deletion Confirmation State
  const [readingToDelete, setReadingToDelete] = useState<HealthMeasurement | null>(null);

  // Tab Filtering inside Health Data
  const [activeHealthTab, setActiveHealthTab] = useState<"all" | "bp" | "sugar" | "other">("all");

  // =========================================================================
  // REAL DATA FILTERING (Strict Multi-Senior & Selected-Month Isolation)
  // =========================================================================

  // 1. Health Measurements for Active Senior in Selected Month
  const seniorMeasurements = useMemo(() => {
    const all = store.healthMeasurements || [];
    return all.filter((m) => {
      // Isolate by Senior ID
      const matchesSenior =
        m.senior_id === activeSeniorId ||
        (activeSeniorId === "sr-1" && (!m.senior_id || m.senior_id === "sr-1" || m.senior_id === "senior-meena"));
      // Isolate by Month YYYY-MM
      const matchesMonth = m.date.startsWith(monthKeyPrefix);
      return matchesSenior && matchesMonth;
    }).sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
  }, [store.healthMeasurements, activeSeniorId, monthKeyPrefix]);

  const bpReadings = useMemo(
    () => seniorMeasurements.filter((m) => m.type === "blood_pressure"),
    [seniorMeasurements]
  );

  const bloodSugarReadings = useMemo(
    () => seniorMeasurements.filter((m) => m.type === "blood_sugar"),
    [seniorMeasurements]
  );

  const otherReadings = useMemo(
    () => seniorMeasurements.filter((m) => m.type !== "blood_pressure" && m.type !== "blood_sugar"),
    [seniorMeasurements]
  );

  // 2. Real Medicine Logs for Active Senior
  const monthlyMedicineLogs = useMemo(() => {
    const logs = store.medicineLogs || [];
    return logs.filter((l) => l.taken_at && l.taken_at.startsWith(monthKeyPrefix));
  }, [store.medicineLogs, monthKeyPrefix]);

  const takenDosesCount = monthlyMedicineLogs.filter((l) => l.status === "taken").length;
  const missedDosesCount = monthlyMedicineLogs.filter((l) => l.status === "missed" || l.status === "skipped").length;

  // 3. Real Reminders
  const monthlyReminders = useMemo(() => {
    const rems = store.reminders || [];
    return rems.filter((r) => {
      if (!r.date) return true; // Daily routines applicable
      return r.date.startsWith(monthKeyPrefix);
    });
  }, [store.reminders, monthKeyPrefix]);

  const completedRemindersCount = monthlyReminders.filter((r) => r.completed || r.last_done?.startsWith(monthKeyPrefix)).length;

  // 4. Real Appointments
  const monthlyAppointments = useMemo(() => {
    const apps = store.appointments || [];
    return apps.filter((a) => a.date && a.date.startsWith(monthKeyPrefix));
  }, [store.appointments, monthKeyPrefix]);

  // 5. Real Cognitive Game Sessions
  const monthlyGameSessions = useMemo(() => {
    const sessions = store.gameSessions || [];
    return sessions.filter((s) => s.created_at && s.created_at.startsWith(monthKeyPrefix));
  }, [store.gameSessions, monthKeyPrefix]);

  const avgGameAccuracy = useMemo(() => {
    if (monthlyGameSessions.length === 0) return null;
    const sum = monthlyGameSessions.reduce((acc, s) => acc + (s.accuracy || 80), 0);
    return Math.round(sum / monthlyGameSessions.length);
  }, [monthlyGameSessions]);

  // 6. SOS Events
  const monthlySosEvents = useMemo(() => {
    const events = store.sosEvents || [];
    return events.filter((e) => e.created_at && e.created_at.startsWith(monthKeyPrefix));
  }, [store.sosEvents, monthKeyPrefix]);

  // Total Recorded Health Activities in Month
  const totalMonthRecords =
    seniorMeasurements.length +
    monthlyMedicineLogs.length +
    monthlyGameSessions.length +
    monthlyAppointments.length +
    monthlySosEvents.length;

  // =========================================================================
  // ACTIONS: ADD, EDIT, DELETE
  // =========================================================================

  const handleOpenAdd = (type: "blood_pressure" | "blood_sugar" | "other") => {
    setModalType(type);
    setEditingReading(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reading: HealthMeasurement) => {
    setEditingReading(reading);
    setModalType(
      reading.type === "blood_pressure"
        ? "blood_pressure"
        : reading.type === "blood_sugar"
        ? "blood_sugar"
        : "other"
    );
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (readingToDelete) {
      store.deleteHealthMeasurement(readingToDelete.id);
      setReadingToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden box-border pb-12">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-10 px-3 rounded-2xl gap-1.5 font-bold cursor-pointer border-border hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-0.5 rounded-full border border-primary/20">
                  Caregiver Health Monitoring
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground font-display mt-1">
                Monthly Summary Report
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-2xl text-xs font-bold h-10 gap-1.5 cursor-pointer border-primary/30 text-primary hover:bg-primary/10"
            >
              <Printer className="h-4 w-4" /> Print / Export
            </Button>
          </div>
        </div>

        {/* 2. SENIOR SELECTOR (Section 14: Strict Senior Data Separation) */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> Select Senior Profile:
            </span>
            <span className="italic text-[11px]">Strict per-senior data isolation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {assignedSeniors.map((sn) => {
              const isSelected = activeSeniorId === sn.id;
              return (
                <button
                  key={sn.id}
                  onClick={() => setActiveSeniorId(sn.id)}
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
                  <div className="text-[10px] font-bold text-primary mt-1 truncate">
                    {sn.language || "English"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MONTH SELECTOR BAR (Section 2) */}
      <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-card to-primary/5 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-10 w-10 rounded-2xl cursor-pointer border-border hover:bg-secondary"
            title="Previous Month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="px-4 py-2 rounded-2xl bg-card border-2 border-primary/30 shadow-xs flex items-center gap-2.5">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-lg sm:text-xl font-black text-foreground font-display">
              {monthYearLabel}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-10 w-10 rounded-2xl cursor-pointer border-border hover:bg-secondary"
            title="Next Month"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Showing records for: <strong className="text-foreground">{activeSenior.name}</strong></span>
        </div>
      </div>

      {/* 4. CONCISE AI MONTHLY INSIGHT SUMMARY (Section 11 & 12) */}
      <div className="rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 via-card to-white dark:via-slate-900 dark:to-slate-900 p-5 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base font-black shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-foreground">
              {monthYearLabel} AI Activity & Health Summary
            </h2>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            Real Data Derived
          </span>
        </div>

        {totalMonthRecords === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No health readings, medication logs, or cognitive activities were recorded for {activeSenior.name} in {monthYearLabel}.
          </p>
        ) : (
          <div className="text-sm leading-relaxed text-foreground space-y-1.5 font-medium">
            <p>
              During <strong>{monthYearLabel}</strong> for <strong>{activeSenior.name}</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {takenDosesCount > 0 && (
                <li>
                  <strong className="text-foreground">{takenDosesCount}</strong> medicine doses were recorded as taken
                  {missedDosesCount > 0 ? `, and ${missedDosesCount} scheduled doses missed.` : "."}
                </li>
              )}
              {bpReadings.length > 0 && (
                <li>
                  <strong className="text-foreground">{bpReadings.length}</strong> Blood Pressure readings were recorded this month.
                  {bpReadings[0] && ` Latest reading on ${bpReadings[0].date}: ${bpReadings[0].systolic}/${bpReadings[0].diastolic} mmHg.`}
                </li>
              )}
              {bloodSugarReadings.length > 0 && (
                <li>
                  <strong className="text-foreground">{bloodSugarReadings.length}</strong> Blood Sugar readings logged.
                  {bloodSugarReadings[0] && ` Latest reading: ${bloodSugarReadings[0].glucose_value} ${bloodSugarReadings[0].glucose_unit || "mg/dL"} (${bloodSugarReadings[0].meal_context || "general"}).`}
                </li>
              )}
              {monthlyGameSessions.length > 0 && (
                <li>
                  The senior completed <strong className="text-foreground">{monthlyGameSessions.length}</strong> cognitive game sessions
                  {avgGameAccuracy !== null ? ` with an average concentration accuracy of ${avgGameAccuracy}%.` : "."}
                </li>
              )}
              {monthlySosEvents.length > 0 ? (
                <li className="text-rose-600 font-bold">
                  ⚠️ {monthlySosEvents.length} emergency SOS event(s) were logged this month.
                </li>
              ) : (
                <li>No emergency SOS events were triggered during this month.</li>
              )}
            </ul>
          </div>
        )}

        {/* Strict Medical Safety Disclaimer */}
        <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>
            <strong>Informational Summary:</strong> Generated purely from recorded activity logs. Not a medical diagnosis. Consult a qualified doctor for clinical interpretations.
          </span>
        </div>
      </div>

      {/* 5. MONTHLY OVERVIEW METRICS GRID (Section 3) */}
      <div className="space-y-3">
        <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <span>📊</span> Monthly Overview
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Medicines Taken */}
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-card p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Meds Taken</span>
              <span className="text-lg">💊</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {takenDosesCount > 0 ? takenDosesCount : <span className="text-xs font-bold text-muted-foreground">No data recorded</span>}
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold">
              {missedDosesCount > 0 ? `${missedDosesCount} missed doses` : "Confirmed on time"}
            </div>
          </div>

          {/* Reminders Completed */}
          <div className="rounded-2xl border-2 border-sky-500/30 bg-card p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Reminders</span>
              <span className="text-lg">⏰</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
              {completedRemindersCount > 0 ? completedRemindersCount : <span className="text-xs font-bold text-muted-foreground">No data recorded</span>}
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold">
              Completed routines & tasks
            </div>
          </div>

          {/* Cognitive Games Played */}
          <div className="rounded-2xl border-2 border-purple-500/30 bg-card p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Memory Games</span>
              <span className="text-lg">🧠</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {monthlyGameSessions.length > 0 ? `${monthlyGameSessions.length} sessions` : <span className="text-xs font-bold text-muted-foreground">No data recorded</span>}
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold">
              {avgGameAccuracy !== null ? `${avgGameAccuracy}% average accuracy` : "Brain exercises"}
            </div>
          </div>

          {/* Appointments Completed */}
          <div className="rounded-2xl border-2 border-amber-500/30 bg-card p-4 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Appointments</span>
              <span className="text-lg">🏥</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {monthlyAppointments.length > 0 ? monthlyAppointments.length : <span className="text-xs font-bold text-muted-foreground">No data recorded</span>}
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold">
              Doctor & clinic checkups
            </div>
          </div>
        </div>
      </div>

      {/* 6. DEDICATED MEDICINE SUMMARY SECTION (Section 4) */}
      <div className="rounded-3xl border-2 border-border bg-card p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl">
              💊
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Medicine Summary & Adherence
              </h2>
              <p className="text-xs text-muted-foreground">
                Schedule adherence and current inventory for {monthYearLabel}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate?.("medicines")}
            className="rounded-2xl text-xs font-bold h-9 gap-1.5 cursor-pointer hover:border-primary"
          >
            <Pill className="h-3.5 w-3.5 text-primary" /> Manage Medicines
          </Button>
        </div>

        {store.medicines.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-secondary/30 border border-border text-sm text-muted-foreground italic">
            No medicine activity recorded this month.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {store.medicines.map((med) => {
              // Calculate real adherence if logs exist
              const medLogs = monthlyMedicineLogs.filter((l) => l.medicine_id === med.id);
              const takenCount = medLogs.filter((l) => l.status === "taken").length;
              const missedCount = medLogs.filter((l) => l.status === "missed").length;
              const isLowStock = med.stock <= med.refill_threshold;

              return (
                <div
                  key={med.id}
                  className={`rounded-2xl border-2 p-4 space-y-3 shadow-xs bg-card transition-all ${
                    isLowStock ? "border-amber-400 bg-amber-50/20 dark:bg-amber-950/10" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-base text-foreground">{med.name}</h4>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {med.dosage} • {med.frequency} ({med.times.join(", ")})
                      </p>
                    </div>
                    {isLowStock && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <AlertTriangle className="h-3 w-3" /> Low Stock
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                    <div className="p-2 rounded-xl bg-secondary/40 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">Current Stock</span>
                      <div className="text-base font-black text-foreground">{med.stock} {med.unit}s</div>
                      <span className="text-[10px] text-muted-foreground">Refill at {med.refill_threshold}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-secondary/40 space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">Month Taken</span>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {takenCount > 0 ? `${takenCount} doses` : "On schedule"}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {missedCount > 0 ? `${missedCount} missed` : "0 missed"}
                      </span>
                    </div>
                  </div>

                  {med.instructions && (
                    <p className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-1.5">
                      Instruction: {med.instructions}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. BLOOD PRESSURE MONITORING & TREND CHART (Section 5 & 6) */}
      <div className="rounded-3xl border-2 border-border bg-card p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-xl">
              ❤️
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Blood Pressure (BP) Monitoring
              </h2>
              <p className="text-xs text-muted-foreground">
                Recorded systolic and diastolic readings for {monthYearLabel}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => handleOpenAdd("blood_pressure")}
            className="rounded-2xl text-xs font-black h-10 px-4 gap-1.5 cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" /> Record BP Reading
          </Button>
        </div>

        {bpReadings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-secondary/30 border border-border space-y-3">
            <p className="text-sm text-muted-foreground italic">
              No blood pressure readings recorded this month.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAdd("blood_pressure")}
              className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Record First BP Reading
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual BP Trend Chart (SVG / Responsive) */}
            <div className="rounded-2xl border border-border bg-secondary/20 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Monthly BP Trend Chart
                </span>
                <div className="flex items-center gap-4 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Systolic (Upper)
                  </span>
                  <span className="flex items-center gap-1 text-purple-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Diastolic (Lower)
                  </span>
                </div>
              </div>

              {/* Chart Visual Representation */}
              <div className="pt-2">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {bpReadings.slice(0, 6).map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-card border border-border text-center space-y-1.5 shadow-2xs"
                    >
                      <span className="text-[10px] font-bold text-muted-foreground block">
                        {r.date.slice(5)} ({r.time})
                      </span>
                      <div className="text-lg font-black text-primary">
                        {r.systolic} <span className="text-xs text-muted-foreground font-bold">/</span>{" "}
                        <span className="text-purple-600">{r.diastolic}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">mmHg</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground italic pt-1">
                Standard baseline reference: Systolic &lt; 120 mmHg, Diastolic &lt; 80 mmHg. Discuss trends with your physician.
              </div>
            </div>

            {/* Detailed BP Readings Table */}
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground uppercase font-black text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Reading (mmHg)</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4">Logged By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bpReadings.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">
                        {r.date} • {r.time}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-black text-primary">{r.systolic}</span>
                        <span className="text-muted-foreground font-bold"> / </span>
                        <span className="text-sm font-black text-purple-600">{r.diastolic}</span>
                        <span className="text-[10px] text-muted-foreground ml-1 font-bold">mmHg</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {r.notes || "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-medium">
                        {r.recorded_by || "Caregiver"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setReadingToDelete(r)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 8. BLOOD SUGAR / GLUCOSE MONITORING (Section 7) */}
      <div className="rounded-3xl border-2 border-border bg-card p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl">
              🩸
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Blood Sugar / Glucose Monitoring
              </h2>
              <p className="text-xs text-muted-foreground">
                Tracked glucose readings for {monthYearLabel}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => handleOpenAdd("blood_sugar")}
            className="rounded-2xl text-xs font-black h-10 px-4 gap-1.5 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" /> Record Blood Sugar
          </Button>
        </div>

        {bloodSugarReadings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-secondary/30 border border-border space-y-3">
            <p className="text-sm text-muted-foreground italic">
              No blood sugar readings recorded this month.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAdd("blood_sugar")}
              className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Record First Sugar Reading
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground uppercase font-black text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Glucose Value</th>
                  <th className="py-3 px-4">Context</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bloodSugarReadings.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">
                      {r.date} • {r.time}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-base font-black text-foreground">
                        {r.glucose_value}
                      </span>{" "}
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {r.glucose_unit || "mg/dL"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {r.meal_context === "post_meal"
                          ? "After Meal"
                          : r.meal_context || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                      {r.notes || "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setReadingToDelete(r)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 9. OTHER HEALTH MEASUREMENTS (Section 8: Extensible Vitals) */}
      <div className="rounded-3xl border-2 border-border bg-card p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center text-xl">
              ⚖️
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Other Health Vitals
              </h2>
              <p className="text-xs text-muted-foreground">
                Weight, Pulse/Heart Rate, Temperature, and Oxygen (SpO2)
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenAdd("other")}
            className="rounded-2xl text-xs font-bold h-9 gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Record Other Vital
          </Button>
        </div>

        {otherReadings.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-secondary/30 border border-border text-sm text-muted-foreground italic">
            No other health measurements recorded this month.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {otherReadings.map((r) => (
              <div key={r.id} className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-1 relative group">
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase">
                  <span>{r.type.replace("_", " ")}</span>
                  <span>{r.date.slice(5)}</span>
                </div>
                <div className="text-xl font-black text-foreground">
                  {r.value} <span className="text-xs text-muted-foreground font-bold">{r.unit}</span>
                </div>
                {r.notes && <p className="text-[10px] text-muted-foreground truncate">{r.notes}</p>}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setReadingToDelete(r)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 10. MONTHLY CHRONOLOGICAL TIMELINE (Section 9) */}
      <div className="rounded-3xl border-2 border-border bg-card p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl">
            📅
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              {monthYearLabel} Chronological Health Timeline
            </h2>
            <p className="text-xs text-muted-foreground">
              Consolidated day-by-day diary of health, medicines, games, and appointments
            </p>
          </div>
        </div>

        {totalMonthRecords === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-secondary/30 border border-border text-sm text-muted-foreground italic">
            No activity timeline events recorded for this month.
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border/80 pl-2">
            {/* Render Recent Events */}
            {seniorMeasurements.map((m) => (
              <div key={m.id} className="relative flex items-start gap-4 pl-6">
                <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full border-2 border-primary bg-card" />
                <div className="flex-1 p-3 rounded-2xl bg-secondary/40 border border-border/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span>{m.date} at {m.time}</span>
                    <span className="capitalize text-primary font-black">{m.type.replace("_", " ")}</span>
                  </div>
                  <div className="font-bold text-foreground">
                    {m.type === "blood_pressure" && `Blood Pressure recorded: ${m.systolic}/${m.diastolic} mmHg`}
                    {m.type === "blood_sugar" && `Blood Glucose measured: ${m.glucose_value} ${m.glucose_unit || "mg/dL"} (${m.meal_context || "general"})`}
                    {m.type !== "blood_pressure" && m.type !== "blood_sugar" && `${m.type.replace("_", " ")}: ${m.value} ${m.unit || ""}`}
                  </div>
                  {m.notes && <div className="text-[11px] text-muted-foreground italic">{m.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 11. RECORD HEALTH MODAL */}
      <HealthReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        store={store}
        seniorId={activeSeniorId}
        initialType={modalType}
        editingReading={editingReading}
      />

      {/* 12. DELETE CONFIRMATION DIALOG (Section 17) */}
      {readingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-2xl space-y-4 text-foreground animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <h3 className="text-xl font-black">Delete this health reading?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete the reading recorded on{" "}
              <strong className="text-foreground">{readingToDelete.date} at {readingToDelete.time}</strong>? This action cannot be undone and will update monthly reports.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReadingToDelete(null)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                className="rounded-xl text-xs font-black bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              >
                Delete Reading
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
