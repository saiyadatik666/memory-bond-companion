import { useState, useEffect } from "react";
import {
  Heart,
  Activity,
  Calendar,
  Clock,
  FileText,
  X,
  Check,
  Droplet,
  Scale,
  Thermometer,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HealthMeasurement, MemoryBondStore } from "@/lib/memoryBondStore";

interface HealthReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: MemoryBondStore;
  seniorId: string;
  initialType?: "blood_pressure" | "blood_sugar" | "other";
  editingReading?: HealthMeasurement | null;
}

export function HealthReadingModal({
  isOpen,
  onClose,
  store,
  seniorId,
  initialType = "blood_pressure",
  editingReading = null,
}: HealthReadingModalProps) {
  const [measurementCategory, setMeasurementCategory] = useState<
    "blood_pressure" | "blood_sugar" | "other"
  >(initialType);

  // Form Fields
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [time, setTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [notes, setNotes] = useState<string>("");

  // Blood Pressure
  const [systolic, setSystolic] = useState<string>("120");
  const [diastolic, setDiastolic] = useState<string>("80");

  // Blood Sugar
  const [glucoseValue, setGlucoseValue] = useState<string>("100");
  const [glucoseUnit, setGlucoseUnit] = useState<"mg/dL" | "mmol/L">("mg/dL");
  const [mealContext, setMealContext] = useState<
    "fasting" | "post_meal" | "random" | "bedtime"
  >("fasting");

  // Other Vitals
  const [otherType, setOtherType] = useState<
    "weight" | "heart_rate" | "temperature" | "spo2"
  >("heart_rate");
  const [otherValue, setOtherValue] = useState<string>("72");

  const [formError, setFormError] = useState<string | null>(null);

  // Synchronize on open or edit change
  useEffect(() => {
    if (editingReading) {
      setDate(editingReading.date);
      setTime(editingReading.time);
      setNotes(editingReading.notes || "");

      if (editingReading.type === "blood_pressure") {
        setMeasurementCategory("blood_pressure");
        setSystolic(String(editingReading.systolic || 120));
        setDiastolic(String(editingReading.diastolic || 80));
      } else if (editingReading.type === "blood_sugar") {
        setMeasurementCategory("blood_sugar");
        setGlucoseValue(String(editingReading.glucose_value || 100));
        setGlucoseUnit(editingReading.glucose_unit || "mg/dL");
        setMealContext(editingReading.meal_context || "fasting");
      } else {
        setMeasurementCategory("other");
        setOtherType(
          editingReading.type as "weight" | "heart_rate" | "temperature" | "spo2"
        );
        setOtherValue(String(editingReading.value || ""));
      }
    } else {
      setMeasurementCategory(initialType);
      setDate(new Date().toISOString().slice(0, 10));
      setTime(new Date().toTimeString().slice(0, 5));
      setNotes("");
      setSystolic("120");
      setDiastolic("80");
      setGlucoseValue("100");
      setGlucoseUnit("mg/dL");
      setMealContext("fasting");
      setOtherType("heart_rate");
      setOtherValue("72");
    }
    setFormError(null);
  }, [isOpen, editingReading, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const seniorTargetId = seniorId || "sr-1";

    if (measurementCategory === "blood_pressure") {
      const sys = parseInt(systolic, 10);
      const dia = parseInt(diastolic, 10);
      if (isNaN(sys) || sys < 50 || sys > 260) {
        setFormError("Please enter a valid Systolic BP between 50 and 260 mmHg.");
        return;
      }
      if (isNaN(dia) || dia < 30 || dia > 160) {
        setFormError("Please enter a valid Diastolic BP between 30 and 160 mmHg.");
        return;
      }

      if (editingReading) {
        store.updateHealthMeasurement(editingReading.id, {
          date,
          time,
          systolic: sys,
          diastolic: dia,
          notes: notes.trim(),
        });
      } else {
        store.addHealthMeasurement({
          senior_id: seniorTargetId,
          type: "blood_pressure",
          date,
          time,
          systolic: sys,
          diastolic: dia,
          notes: notes.trim(),
          recorded_by: "Caregiver",
        });
      }
    } else if (measurementCategory === "blood_sugar") {
      const glu = parseFloat(glucoseValue);
      if (isNaN(glu) || glu <= 0 || glu > 900) {
        setFormError("Please enter a valid Blood Glucose value.");
        return;
      }

      if (editingReading) {
        store.updateHealthMeasurement(editingReading.id, {
          date,
          time,
          glucose_value: glu,
          glucose_unit: glucoseUnit,
          meal_context: mealContext,
          notes: notes.trim(),
        });
      } else {
        store.addHealthMeasurement({
          senior_id: seniorTargetId,
          type: "blood_sugar",
          date,
          time,
          glucose_value: glu,
          glucose_unit: glucoseUnit,
          meal_context: mealContext,
          notes: notes.trim(),
          recorded_by: "Caregiver",
        });
      }
    } else {
      const val = parseFloat(otherValue);
      if (isNaN(val) || val <= 0) {
        setFormError("Please enter a valid numeric measurement value.");
        return;
      }

      const unitMap: Record<string, string> = {
        weight: "kg",
        heart_rate: "bpm",
        temperature: "°F",
        spo2: "%",
      };

      if (editingReading) {
        store.updateHealthMeasurement(editingReading.id, {
          type: otherType,
          date,
          time,
          value: val,
          unit: unitMap[otherType],
          notes: notes.trim(),
        });
      } else {
        store.addHealthMeasurement({
          senior_id: seniorTargetId,
          type: otherType,
          date,
          time,
          value: val,
          unit: unitMap[otherType],
          notes: notes.trim(),
          recorded_by: "Caregiver",
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-5 sm:p-7 shadow-2xl space-y-5 text-foreground max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl">
              {measurementCategory === "blood_pressure"
                ? "❤️"
                : measurementCategory === "blood_sugar"
                ? "🩸"
                : "📊"}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground font-display">
                {editingReading ? "Edit Health Reading" : "Record Health Reading"}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Accurate logging for medical review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Switcher Tabs (Only if creating new reading) */}
        {!editingReading && (
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-secondary/60 border border-border">
            <button
              type="button"
              onClick={() => setMeasurementCategory("blood_pressure")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                measurementCategory === "blood_pressure"
                  ? "bg-card text-primary shadow-sm font-black border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="h-3.5 w-3.5" />
              <span>Blood Pressure</span>
            </button>
            <button
              type="button"
              onClick={() => setMeasurementCategory("blood_sugar")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                measurementCategory === "blood_sugar"
                  ? "bg-card text-primary shadow-sm font-black border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Droplet className="h-3.5 w-3.5" />
              <span>Blood Sugar</span>
            </button>
            <button
              type="button"
              onClick={() => setMeasurementCategory("other")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                measurementCategory === "other"
                  ? "bg-card text-primary shadow-sm font-black border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Other Vitals</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error notice */}
          {formError && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
              {formError}
            </div>
          )}

          {/* Blood Pressure Fields */}
          {measurementCategory === "blood_pressure" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Systolic (Upper)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      placeholder="120"
                      className="h-14 text-2xl font-black rounded-2xl text-center border-2 border-border focus:border-primary"
                    />
                    <span className="absolute right-3 top-4 text-xs text-muted-foreground font-bold">
                      mmHg
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Typical: 100 - 130</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Diastolic (Lower)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      placeholder="80"
                      className="h-14 text-2xl font-black rounded-2xl text-center border-2 border-border focus:border-primary"
                    />
                    <span className="absolute right-3 top-4 text-xs text-muted-foreground font-bold">
                      mmHg
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Typical: 60 - 85</span>
                </div>
              </div>

              {/* Informational Guideline Card */}
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/80 text-[11px] text-muted-foreground space-y-1">
                <div className="font-bold text-foreground">Standard Reference Guide:</div>
                <div className="flex items-center justify-between">
                  <span>Normal baseline:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">&lt; 120 / &lt; 80 mmHg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Elevated check:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">120-129 / &lt; 80 mmHg</span>
                </div>
                <p className="pt-1 text-[10px] text-muted-foreground/90 italic">
                  *Reference only. Always consult a healthcare professional for clinical advice.
                </p>
              </div>
            </div>
          )}

          {/* Blood Sugar Fields */}
          {measurementCategory === "blood_sugar" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Blood Glucose
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={glucoseValue}
                    onChange={(e) => setGlucoseValue(e.target.value)}
                    placeholder="98"
                    className="h-14 text-2xl font-black rounded-2xl text-center border-2 border-border focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Unit
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 h-14 p-1.5 rounded-2xl bg-secondary border border-border items-center">
                    <button
                      type="button"
                      onClick={() => setGlucoseUnit("mg/dL")}
                      className={`h-full rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        glucoseUnit === "mg/dL"
                          ? "bg-card text-foreground shadow-sm font-black border border-border"
                          : "text-muted-foreground"
                      }`}
                    >
                      mg/dL
                    </button>
                    <button
                      type="button"
                      onClick={() => setGlucoseUnit("mmol/L")}
                      className={`h-full rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        glucoseUnit === "mmol/L"
                          ? "bg-card text-foreground shadow-sm font-black border border-border"
                          : "text-muted-foreground"
                      }`}
                    >
                      mmol/L
                    </button>
                  </div>
                </div>
              </div>

              {/* Context Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Measurement Context
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "fasting", label: "Fasting", icon: "🌅" },
                    { id: "post_meal", label: "After Meal", icon: "🍽️" },
                    { id: "random", label: "Random", icon: "⏰" },
                    { id: "bedtime", label: "Bedtime", icon: "🌙" },
                  ].map((ctx) => (
                    <button
                      key={ctx.id}
                      type="button"
                      onClick={() => setMealContext(ctx.id as any)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        mealContext === ctx.id
                          ? "border-primary bg-primary/10 text-primary shadow-xs font-black"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <span>{ctx.icon}</span>
                      <span>{ctx.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other Vitals Fields */}
          {measurementCategory === "other" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Measurement Type
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "weight", label: "Weight", unit: "kg", icon: Scale },
                    { id: "heart_rate", label: "Heart Rate", unit: "bpm", icon: Heart },
                    { id: "temperature", label: "Temp", unit: "°F", icon: Thermometer },
                    { id: "spo2", label: "SpO2", unit: "%", icon: Percent },
                  ].map((t) => {
                    const IconComponent = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setOtherType(t.id as any)}
                        className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          otherType === t.id
                            ? "border-primary bg-primary/10 text-primary shadow-xs font-black"
                            : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Measurement Value
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={otherValue}
                    onChange={(e) => setOtherValue(e.target.value)}
                    placeholder="Value"
                    className="h-14 text-2xl font-black rounded-2xl text-center border-2 border-border focus:border-primary"
                  />
                  <span className="absolute right-3 top-4 text-xs text-muted-foreground font-bold">
                    {otherType === "weight"
                      ? "kg"
                      : otherType === "heart_rate"
                      ? "bpm"
                      : otherType === "temperature"
                      ? "°F"
                      : "%"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Date & Time Picker */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl text-xs font-bold border border-border"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Time
              </Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 rounded-xl text-xs font-bold border border-border"
                required
              />
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Notes / Symptoms (Optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Taken after morning herbal tea. Senior felt energetic."
              className="rounded-xl text-xs font-medium border border-border min-h-[70px] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-5 rounded-2xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 px-6 rounded-2xl text-xs font-black bg-primary text-primary-foreground gap-2 cursor-pointer shadow-md hover:bg-primary/90"
            >
              <Check className="h-4 w-4" />
              {editingReading ? "Update Reading" : "Save Health Reading"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
