import { useState } from "react";
import { Pill, Plus, AlertTriangle, CheckCircle2, Clock, UserCheck, RefreshCw, Trash2, FileText, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export function MedicineManagerView({ store }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [refillMedId, setRefillMedId] = useState(null);
    const [refillAmount, setRefillAmount] = useState(30);
    const [refillNote, setRefillNote] = useState("");
    // New Medicine Form State
    const [name, setName] = useState("");
    const [dosage, setDosage] = useState("1 tablet");
    const [unit, setUnit] = useState("tablet");
    const [stock, setStock] = useState(30);
    const [dailyUsage, setDailyUsage] = useState(1);
    const [refillThreshold, setRefillThreshold] = useState(6);
    const [warnDays, setWarnDays] = useState(5);
    const [timesStr, setTimesStr] = useState("08:30");
    const [instructions, setInstructions] = useState("Take after food with water.");
    const [doctor, setDoctor] = useState("");
    const [notes, setNotes] = useState("");
    const handleSaveMedicine = (e) => {
        e.preventDefault();
        if (!name.trim())
            return;
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
        // Reset form
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
    const lowStockMeds = store.medicines.filter((m) => m.stock <= m.refill_threshold || (m.daily_usage > 0 && m.stock / m.daily_usage <= m.warn_days));
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Pill className="h-8 w-8 text-primary"/> Medicine & Refill Manager
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Track daily dosages, stock levels, and automatic refill alerts.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 font-bold text-base h-12 px-6 rounded-2xl">
          <Plus className="h-5 w-5"/> Add New Medicine
        </Button>
      </div>

      {/* Critical Low Stock Warning Banner */}
      {lowStockMeds.length > 0 && (<div className="rounded-3xl border-2 border-destructive/40 bg-destructive/10 p-6 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-3 text-destructive font-black text-lg">
            <AlertTriangle className="h-7 w-7 animate-bounce"/>
            <span>MEDICINE RUNNING LOW ({lowStockMeds.length} items need refill)</span>
          </div>
          <p className="text-sm text-foreground font-medium">
            Caregiver alert is active. Please replenish these prescriptions before they run out:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {lowStockMeds.map((med) => (<div key={med.id} className="flex items-center gap-2 rounded-xl bg-card border border-destructive/30 px-3 py-1.5 shadow-xs text-sm font-bold text-foreground">
                <span>{med.name}</span>
                <span className="text-destructive">({med.stock} {med.unit}s left)</span>
                <button onClick={() => setRefillMedId(med.id)} className="text-xs text-primary underline ml-1 hover:text-primary/80">
                  Refill Now
                </button>
              </div>))}
          </div>
        </div>)}

      {/* Medicines Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {store.medicines.map((med) => {
            const isLow = med.stock <= med.refill_threshold;
            const daysLeft = med.daily_usage > 0 ? Math.floor(med.stock / med.daily_usage) : 99;
            return (<div key={med.id} className={`rounded-3xl border-2 bg-card p-6 shadow-sm space-y-4 transition-all ${isLow ? "border-destructive/60 bg-destructive/5" : "border-border"}`}>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">{med.name}</h3>
                    {isLow && (<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-destructive text-white">
                        Refill Soon
                      </span>)}
                  </div>
                  <p className="text-sm font-semibold text-primary">{med.dosage}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${isLow ? "text-destructive" : "text-foreground"}`}>
                    {med.stock} <span className="text-sm font-normal text-muted-foreground">{med.unit}s</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">~{daysLeft} days remaining</div>
                </div>
              </div>

              {/* Instructions */}
              {med.instructions && (<div className="rounded-2xl bg-secondary/40 p-3 text-sm text-foreground flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5"/>
                  <span>{med.instructions}</span>
                </div>)}

              {/* Times & Doctor */}
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary"/>
                  <span>Times: {med.times.join(", ")}</span>
                </div>
                {med.doctor && (<div className="flex items-center gap-1.5 truncate">
                    <UserCheck className="h-4 w-4 text-primary"/>
                    <span className="truncate">{med.doctor}</span>
                  </div>)}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border/80">
                <Button size="sm" onClick={() => store.takeMedicine(med.id)} disabled={med.stock <= 0} className="bg-success hover:bg-success/90 text-white font-bold rounded-xl gap-1.5 px-4">
                  <CheckCircle2 className="h-4 w-4"/> I Took It
                </Button>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setRefillMedId(med.id)} className="rounded-xl gap-1 font-semibold text-xs">
                    <RefreshCw className="h-3.5 w-3.5"/> Add Refill
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => store.deleteMedicine(med.id)} className="rounded-xl text-destructive hover:bg-destructive/10 p-2">
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              </div>
            </div>);
        })}
      </div>

      {/* Refill Dialog Modal */}
      {refillMedId && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-xl space-y-5 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary"/> Log Medicine Refill
            </h3>
            <p className="text-sm text-muted-foreground">
              Add new supply to update the inventory and resolve low-stock warnings.
            </p>

            <div className="space-y-4">
              <div>
                <Label>Quantity to Add (tablets / units)</Label>
                <div className="flex gap-2 mt-1">
                  {[10, 20, 30, 60].map((amt) => (<Button key={amt} type="button" variant={refillAmount === amt ? "default" : "outline"} onClick={() => setRefillAmount(amt)} className="flex-1 font-bold rounded-xl">
                      +{amt}
                    </Button>))}
                </div>
                <Input type="number" value={refillAmount} onChange={(e) => setRefillAmount(Number(e.target.value))} className="mt-2 rounded-xl"/>
              </div>

              <div>
                <Label>Refill Note / Pharmacy (Optional)</Label>
                <Input value={refillNote} onChange={(e) => setRefillNote(e.target.value)} placeholder="e.g. Purchased from Apollo Pharmacy" className="rounded-xl mt-1"/>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setRefillMedId(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleExecuteRefill} className="bg-primary font-bold rounded-xl px-6">
                Confirm Refill
              </Button>
            </div>
          </div>
        </div>)}

      {/* Add New Medicine Modal */}
      {isAddModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-5 my-8 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Add New Prescription</h3>

            <form onSubmit={handleSaveMedicine} className="space-y-4">
              <div>
                <Label>Medicine Name *</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metformin / Amlodipine" className="rounded-xl mt-1"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dosage</Label>
                  <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 500 mg" className="rounded-xl mt-1"/>
                </div>
                <div>
                  <Label>Unit Type</Label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="tablet, capsule, syrup" className="rounded-xl mt-1"/>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Current Stock</Label>
                  <Input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} className="rounded-xl mt-1"/>
                </div>
                <div>
                  <Label>Daily Usage</Label>
                  <Input type="number" value={dailyUsage} onChange={(e) => setDailyUsage(Number(e.target.value))} className="rounded-xl mt-1"/>
                </div>
                <div>
                  <Label>Refill Alert At</Label>
                  <Input type="number" value={refillThreshold} onChange={(e) => setRefillThreshold(Number(e.target.value))} className="rounded-xl mt-1"/>
                </div>
              </div>

              <div>
                <Label>Scheduled Time(s) (comma separated)</Label>
                <Input value={timesStr} onChange={(e) => setTimesStr(e.target.value)} placeholder="08:30, 20:30" className="rounded-xl mt-1"/>
              </div>

              <div>
                <Label>Doctor / Prescriber (Optional)</Label>
                <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="Dr. Name & Specialization" className="rounded-xl mt-1"/>
              </div>

              <div>
                <Label>Usage Instructions</Label>
                <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="After breakfast, with water..." className="rounded-xl mt-1" rows={2}/>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6">
                  Save Medicine
                </Button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
