import { useState } from "react";
import {
  Pill,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  UserCheck,
  RefreshCw,
  Trash2,
  FileText,
  AlertCircle,
  XCircle,
  SkipForward,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MemoryBondStore, Medicine } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

export function MedicineManagerView({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale } = useI18n();
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [refillMedId, setRefillMedId] = useState<string | null>(null);
  const [refillAmount, setRefillAmount] = useState<number>(30);
  const [refillNote, setRefillNote] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"prescriptions" | "history">("prescriptions");

  // New Medicine Form State
  const [name, setName] = useState<string>("");
  const [dosage, setDosage] = useState<string>("1 tablet");
  const [unit, setUnit] = useState<string>("tablet");
  const [stock, setStock] = useState<number>(30);
  const [dailyUsage, setDailyUsage] = useState<number>(1);
  const [refillThreshold, setRefillThreshold] = useState<number>(6);
  const [warnDays, setWarnDays] = useState<number>(3);
  const [timesStr, setTimesStr] = useState<string>("08:30");
  const [instructions, setInstructions] = useState<string>("Take once daily after breakfast with water.");
  const [doctor, setDoctor] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    store.addMedicine({
      name: name.trim(),
      dosage,
      unit,
      stock: Number(stock),
      daily_usage: Number(dailyUsage),
      refill_threshold: Number(refillThreshold),
      warn_days: Number(warnDays),
      times: timesStr.split(",").map((t) => t.trim()),
      frequency: "daily",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null,
      instructions,
      doctor,
      notes,
    });

    setIsAddModalOpen(false);
    setName("");
    setDosage("1 tablet");
    setStock(30);
    setDailyUsage(1);
    setRefillThreshold(6);
  };

  const handleExecuteRefill = () => {
    if (refillMedId) {
      store.refillMedicine(refillMedId, Number(refillAmount), refillNote);
      setRefillMedId(null);
      setRefillNote("");
    }
  };

  const handleMarkDose = (id: string, medName: string, status: "taken" | "missed" | "skipped") => {
    store.markMedicineStatus(id, status);
    if (status === "taken") {
      speakText(`${t("taken") || "Recorded as taken"}: ${medName}`, speechLocale);
    } else if (status === "missed") {
      speakText(`${medName} marked as missed. Caregiver has been informed.`, speechLocale);
    }
  };

  // Medicines needing refill: stock <= threshold or days remaining <= 3
  const lowStockMeds = store.medicines.filter(
    (m) => m.stock <= m.refill_threshold || (m.daily_usage > 0 && m.stock / m.daily_usage <= 3)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Pill className="h-8 w-8 text-primary" /> {t("medicines") || "Smart Medicine & Refill Manager"}
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Track daily doses, stock levels, and automatic 2–3 day refill warnings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-xs">
            <button
              onClick={() => setActiveTab("prescriptions")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "prescriptions"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Prescriptions ({store.medicines.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-4 w-4" /> Dose History ({store.medicineLogs.length})
            </button>
          </div>

          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 font-bold text-base h-12 px-5 rounded-2xl">
            <Plus className="h-5 w-5" /> Add Medicine
          </Button>
        </div>
      </div>

      {/* Statutory Non-Diagnostic Disclaimer (Section 6) */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-foreground text-sm">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Medical Disclaimer: </span>
          Memory Bond is a daily companion and reminder assistant for seniors and caregivers. It does not provide medical diagnoses or prescribe medications. Please consult qualified healthcare professionals for medical advice.
        </div>
      </div>

      {/* Gentle Refill Reminder Banner (Section 7: 2-3 days remaining) */}
      {lowStockMeds.length > 0 && (
        <div className="rounded-3xl border-2 border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/20 p-5 sm:p-6 space-y-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3 text-amber-900 dark:text-amber-200 font-black text-base sm:text-lg">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
            <span>⚠ REFILL REMINDER: {lowStockMeds.length} medicine(s) running low (2–3 days supply remaining)</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-semibold">
            Caregiver and family have been gently notified to help prepare a refill soon:
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {lowStockMeds.map((med) => {
              const daysLeft = med.daily_usage > 0 ? Math.floor(med.stock / med.daily_usage) : 0;
              return (
                <div
                  key={med.id}
                  className="flex items-center gap-2 rounded-2xl bg-card border border-amber-300 px-3.5 py-2 shadow-xs text-sm font-bold text-foreground"
                >
                  <span>{med.name}</span>
                  <span className="text-amber-700 font-semibold text-xs">
                    ({med.stock} {med.unit}s left • ~{daysLeft} days)
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setRefillMedId(med.id)}
                    className="h-8 text-xs font-bold rounded-xl px-3 ml-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Refill Now
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 1: Active Prescriptions with Taken / Missed / Skipped Actions */}
      {activeTab === "prescriptions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {store.medicines.map((med) => {
            const daysLeft = med.daily_usage > 0 ? Math.floor(med.stock / med.daily_usage) : 99;
            const isLow = med.stock <= med.refill_threshold || daysLeft <= 3;

            // Check if logged today
            const todayLog = store.medicineLogs.find((l) => l.medicine_id === med.id);
            const isTaken = todayLog?.status === "taken";

            return (
              <div
                key={med.id}
                className={`rounded-3xl border-2 bg-card p-6 shadow-sm space-y-4 transition-all ${
                  isLow ? "border-amber-400/60 bg-amber-50/20" : "border-border"
                }`}
              >
                {/* Header with Visual Status State (✓ Taken / ○ Upcoming / ⚠ Low Stock) */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-foreground">{med.name}</h3>
                      {isTaken ? (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                          ✓ Taken
                        </span>
                      ) : isLow ? (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          ⚠ Low Stock (~{daysLeft}d)
                        </span>
                      ) : (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                          ○ Upcoming
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-primary">{med.dosage}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-2xl font-black ${isLow ? "text-amber-700" : "text-foreground"}`}>
                      {med.stock} <span className="text-sm font-normal text-muted-foreground">{med.unit}s</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold">
                      ~{daysLeft} days left
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                {med.instructions && (
                  <div className="rounded-2xl bg-secondary/40 p-3 text-sm text-foreground flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{med.instructions}</span>
                  </div>
                )}

                {/* Schedule Times & Doctor */}
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Times: {med.times.join(", ")}</span>
                  </div>
                  {med.doctor && (
                    <div className="flex items-center gap-1.5 truncate">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <span className="truncate">{med.doctor}</span>
                    </div>
                  )}
                </div>

                {/* Status indicator if recorded today */}
                {todayLog && (
                  <div className="rounded-xl bg-secondary/60 px-3 py-1.5 text-xs font-semibold flex items-center justify-between text-foreground">
                    <span>Status: Recorded as {todayLog.status.toUpperCase()}</span>
                    <span className="text-muted-foreground font-mono">
                      {new Date(todayLog.taken_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}

                {/* Action Buttons: TAKEN, MISSED, SKIPPED */}
                <div className="pt-3 border-t border-border/80 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {/* 1. TAKEN */}
                    <Button
                      size="sm"
                      onClick={() => handleMarkDose(med.id, med.name, "taken")}
                      disabled={med.stock <= 0}
                      className="bg-success hover:bg-success/90 text-white font-bold rounded-xl gap-1 h-10 text-xs shadow-xs"
                    >
                      <CheckCircle2 className="h-4 w-4" /> {t("markTaken") || "I Took It"}
                    </Button>

                    {/* 2. MISSED */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkDose(med.id, med.name, "missed")}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 font-bold rounded-xl gap-1 h-10 text-xs"
                    >
                      <XCircle className="h-4 w-4" /> {t("markMissed") || "Missed"}
                    </Button>

                    {/* 3. SKIPPED */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkDose(med.id, med.name, "skipped")}
                      className="hover:bg-secondary font-semibold rounded-xl gap-1 h-10 text-xs text-muted-foreground"
                    >
                      <SkipForward className="h-4 w-4" /> {t("markSkipped") || "Skip"}
                    </Button>
                  </div>

                  {/* Refill & Delete */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => setRefillMedId(med.id)}
                      className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> + Add Refill Supply
                    </button>
                    <button
                      onClick={() => store.deleteMedicine(med.id)}
                      className="text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Medicine Intake History (Medicine कब ली गई?) */}
      {activeTab === "history" && (
        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">Intake History & Timestamps</h3>
              <p className="text-sm text-muted-foreground">
                Chronological record of confirmed doses, missed medications, and postponements.
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              Total Logged: {store.medicineLogs.length}
            </span>
          </div>

          {store.medicineLogs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No dose history recorded yet. Tap "I Took It" on any medicine to create logs.
            </div>
          ) : (
            <div className="space-y-3">
              {store.medicineLogs.map((log) => {
                const med = store.medicines.find((m) => m.id === log.medicine_id);
                return (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-secondary/30 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          log.status === "taken"
                            ? "bg-success/20 text-success"
                            : log.status === "missed"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {log.status === "taken" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : log.status === "missed" ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          <SkipForward className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-base">
                          {med ? med.name : "Medicine"} ({med?.dosage || "Dose"})
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Scheduled: {log.scheduled_time || "As per routine"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          log.status === "taken"
                            ? "bg-success/15 text-success"
                            : log.status === "missed"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-warning/15 text-warning"
                        }`}
                      >
                        {log.status}
                      </span>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {new Date(log.taken_at).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Refill Dialog Modal */}
      {refillMedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-5 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" /> Log Medicine Refill
            </h3>
            <p className="text-sm text-muted-foreground">
              Add new supply to update inventory and resolve 2–3 day low-stock warnings.
            </p>

            <div className="space-y-4">
              <div>
                <Label>Quantity to Add (tablets / units)</Label>
                <div className="flex gap-2 mt-1 mb-2">
                  {[10, 20, 30, 60].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant={refillAmount === amt ? "default" : "outline"}
                      onClick={() => setRefillAmount(amt)}
                      className="flex-1 font-bold rounded-xl"
                    >
                      +{amt}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(Math.max(1, Number(e.target.value)))}
                  className="rounded-xl font-mono text-lg font-bold"
                />
              </div>

              <div>
                <Label>Refill Note / Pharmacy (Optional)</Label>
                <Input
                  value={refillNote}
                  onChange={(e) => setRefillNote(e.target.value)}
                  placeholder="e.g. Apollo Pharmacy, 1 month supply"
                  className="rounded-xl mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRefillMedId(null)}
                  className="flex-1 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteRefill}
                  className="flex-1 rounded-xl font-bold bg-primary"
                >
                  Add to Stock
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Add New Prescription</h3>

            <form onSubmit={handleSaveMedicine} className="space-y-4">
              <div>
                <Label>Medicine Name *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amlodipine"
                  className="rounded-xl mt-1 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Dosage *</Label>
                  <Input
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 5 mg"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Unit Type</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="tablet / capsule / drops"
                    className="rounded-xl mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Starting Stock Quantity *</Label>
                  <Input
                    required
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="rounded-xl mt-1 font-mono font-bold"
                  />
                </div>
                <div>
                  <Label>Refill Threshold (Warn when remaining $\le$)</Label>
                  <Input
                    type="number"
                    value={refillThreshold}
                    onChange={(e) => setRefillThreshold(Number(e.target.value))}
                    className="rounded-xl mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label>Daily Intake Times (comma-separated 24h) *</Label>
                <Input
                  required
                  value={timesStr}
                  onChange={(e) => setTimesStr(e.target.value)}
                  placeholder="08:30, 20:30"
                  className="rounded-xl mt-1 font-mono"
                />
              </div>

              <div>
                <Label>Doctor / Prescribing Specialist</Label>
                <Input
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  placeholder="e.g. Dr. Deepen Barua (Cardiologist)"
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Instructions & Food Advice</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Take with warm water after breakfast..."
                  className="rounded-xl mt-1"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-xl font-bold bg-primary">
                  Save Medicine
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
