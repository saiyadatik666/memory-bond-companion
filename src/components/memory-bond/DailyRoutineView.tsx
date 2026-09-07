import { useState } from "react";
import {
  Sun,
  Plus,
  Clock,
  CheckCircle2,
  Coffee,
  Pill,
  Brain,
  Utensils,
  Phone,
  Moon,
  Bed,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { speakText } from "@/lib/voiceParser";

export function DailyRoutineView({ store }: { store: MemoryBondStore }) {
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [time, setTime] = useState<string>("16:00");
  const [activity, setActivity] = useState<string>("");
  const [icon, setIcon] = useState<string>("sun");

  const todayStr = new Date().toISOString().split("T")[0];

  const getRoutineIcon = (iconName: string) => {
    switch (iconName) {
      case "sun":
        return <Sun className="h-6 w-6 text-amber-500" />;
      case "coffee":
        return <Coffee className="h-6 w-6 text-amber-700" />;
      case "pill":
        return <Pill className="h-6 w-6 text-emerald-600" />;
      case "brain":
        return <Brain className="h-6 w-6 text-indigo-500" />;
      case "utensils":
        return <Utensils className="h-6 w-6 text-orange-500" />;
      case "phone":
        return <Phone className="h-6 w-6 text-rose-500" />;
      case "moon":
        return <Moon className="h-6 w-6 text-blue-500" />;
      case "bed":
        return <Bed className="h-6 w-6 text-violet-500" />;
      default:
        return <Sun className="h-6 w-6 text-amber-500" />;
    }
  };

  const handleToggleDone = (id: string, actName: string, isDone: boolean) => {
    store.toggleRoutineDone(id);
    if (!isDone) {
      speakText(`Well done on completing: ${actName}!`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;

    store.addRoutine({
      time,
      activity: activity.trim(),
      icon,
      done_date: null,
    });

    setIsAddOpen(false);
    setActivity("");
  };

  const completedCount = store.routines.filter((r) => r.done_date === todayStr).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Sun className="h-8 w-8 text-primary" /> Visual Daily Routine
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Structured rhythm of the day with large icons, calm pacing, and clear progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-card border border-border px-5 py-2.5 font-bold shadow-xs text-sm">
            Today: {completedCount} / {store.routines.length} Done
          </span>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold text-base h-12 px-6 rounded-2xl">
            <Plus className="h-5 w-5" /> Add Routine
          </Button>
        </div>
      </div>

      {/* Routine Timeline */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {store.routines.map((rt) => {
          const isDone = rt.done_date === todayStr;

          return (
            <div
              key={rt.id}
              className={`rounded-3xl border-2 p-5 flex items-center justify-between gap-4 transition-all shadow-xs ${
                isDone
                  ? "bg-success/10 border-success/40 opacity-75"
                  : "bg-card border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center shadow-inner">
                  {getRoutineIcon(rt.icon)}
                </div>
                <div>
                  <span className="text-sm font-black text-primary tracking-wide flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {rt.time}
                  </span>
                  <h3
                    className={`text-xl font-bold text-foreground mt-0.5 ${
                      isDone ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {rt.activity}
                  </h3>
                </div>
              </div>

              <Button
                size="lg"
                variant={isDone ? "outline" : "default"}
                onClick={() => handleToggleDone(rt.id, rt.activity, isDone)}
                className={`gap-2 font-bold rounded-2xl px-6 ${
                  isDone
                    ? "border-success text-success hover:bg-success/15"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                <CheckCircle2 className="h-5 w-5" />
                {isDone ? "Completed" : "Mark Done"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Add Daily Routine Item</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Activity Name *</Label>
                <Input
                  required
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="e.g. Afternoon Garden Walk"
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Icon</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sun">Sun / Morning</SelectItem>
                    <SelectItem value="coffee">Tea / Coffee</SelectItem>
                    <SelectItem value="pill">Medicine</SelectItem>
                    <SelectItem value="brain">Brain / Memory Game</SelectItem>
                    <SelectItem value="utensils">Meals / Lunch</SelectItem>
                    <SelectItem value="phone">Family Call</SelectItem>
                    <SelectItem value="moon">Evening / Dinner</SelectItem>
                    <SelectItem value="bed">Bedtime / Sleep</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6">
                  Save Routine
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
