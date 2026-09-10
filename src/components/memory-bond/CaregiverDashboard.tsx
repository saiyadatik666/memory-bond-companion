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
  const [isAlertConfigOpen, setIsAlertConfigOpen] = useState<boolean>(false);

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

  return (
    <div className="space-y-6">
      {/* Header & Senior Profile Snapshot */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Caregiver Portal: {store.profile.full_name}
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-success/20 text-success">
                  Connected Caregiver
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Member ID: <span className="font-mono font-bold text-foreground">{store.profile.member_id}</span> • Phone: {store.profile.phone}
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
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-xs"
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

        {/* Caregiver Switcher & Permissions Summary */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-muted-foreground">Logged in as Caregiver:</span>
            <select
              value={selectedCaregiverId}
              onChange={(e) => setSelectedCaregiverId(e.target.value)}
              className="rounded-lg bg-secondary px-3 py-1 font-bold text-foreground border border-border"
            >
              {store.caregiverLinks.map((cg) => (
                <option key={cg.id} value={cg.id}>
                  {cg.caregiver_name} ({cg.relationship})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>Permissions: Medicines, Reminders, Appointments, SOS, Cognitive Performance</span>
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

      {/* Routine & Call Summary */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
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
