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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Active caregiver connection (default: primary caregiver Sunita)
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string>(
    store.caregiverLinks[0]?.id || "cg-1"
  );

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
                  Active Connection
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Member ID: <span className="font-mono font-bold text-foreground">{store.profile.member_id}</span> • Phone: {store.profile.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${store.profile.phone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-xs"
            >
              <PhoneCall className="h-4 w-4" /> Call Senior
            </a>
            <Button
              variant="outline"
              onClick={() => store.setRole("senior")}
              className="font-bold rounded-xl text-sm"
            >
              Switch to Senior View
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
            <span>Permissions granted by senior: Medicines, Appointments, SOS, Games</span>
          </div>
        </div>
      </div>

      {/* Critical Refill & SOS Alert Banners */}
      {permissions.sos && recentSos && (
        <div className="rounded-3xl border-2 border-destructive bg-destructive/10 p-6 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-3 text-destructive font-black text-lg">
            <AlertOctagon className="h-6 w-6 animate-bounce" />
            <span>RECENT SOS EMERGENCY ALERT DISPATCHED</span>
          </div>
          <p className="text-sm text-foreground font-medium">
            Time: {new Date(recentSos.created_at).toLocaleString()} • Notified: {recentSos.notified} • Location:{" "}
            {recentSos.latitude ? `${recentSos.latitude.toFixed(4)}, ${recentSos.longitude?.toFixed(4)}` : "Guwahati, Assam"}
          </p>
        </div>
      )}

      {/* Missed Medicine Notification to Caregiver */}
      {permissions.medicines && missedLogs.length > 0 && (
        <div className="rounded-3xl border-2 border-warning/50 bg-warning/10 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-warning shrink-0" />
            <div>
              <h4 className="font-bold text-foreground">
                Missed Medicine Dose Recorded Today ({missedLogs.length})
              </h4>
              <p className="text-xs text-muted-foreground font-medium">
                Senior logged a missed dose at {missedLogs[0]?.scheduled_time || "recent time"}. Please verify gently.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onNavigate("medicines")}
            className="font-bold rounded-xl text-xs"
          >
            Review Medicines
          </Button>
        </div>
      )}

      {/* Medicine Refill Threshold Banner */}
      {permissions.medicines && lowStockMeds.length > 0 && (
        <div className="rounded-3xl border-2 border-warning/50 bg-warning/10 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-warning font-black text-lg">
              <AlertTriangle className="h-6 w-6" />
              <span>MEDICINE REFILL ALERT ({lowStockMeds.length} Items Running Low)</span>
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
                  <div className="text-xs text-muted-foreground">{med.dosage}</div>
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

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Routine</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {routinesDone} / {store.routines.length}
          </div>
          <p className="text-xs text-muted-foreground">Daily routines completed</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Medicines Due</span>
            <Pill className="h-5 w-5 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {permissions.medicines ? store.medicines.length : "Restricted"}
          </div>
          <p className="text-xs text-muted-foreground">Active daily prescriptions</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Games Played</span>
            <Gamepad2 className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {permissions.games ? store.gameSessions.length : "Restricted"}
          </div>
          <p className="text-xs text-muted-foreground">Total cognitive sessions</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Appointments</span>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {permissions.appointments ? store.appointments.length : "Restricted"}
          </div>
          <p className="text-xs text-muted-foreground">Upcoming medical visits</p>
        </div>
      </div>

      {/* Daily Routine Call Summary Section */}
      {recentRoutineCall && (
        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Recent Daily Routine Call Summary
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

      {/* Journal / Memory Section (Privacy Restricted unless permitted) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-rose-500" /> Memory Journal Access
          </h4>
          {permissions.journal ? (
            <span className="text-xs font-bold text-success">Authorized</span>
          ) : (
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> Private by Senior's Permission
            </span>
          )}
        </div>

        {!permissions.journal ? (
          <p className="text-sm text-muted-foreground italic">
            The senior has kept private journal memories confidential. Caregiver visibility can be granted from the Family Circle settings.
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
    </div>
  );
}
