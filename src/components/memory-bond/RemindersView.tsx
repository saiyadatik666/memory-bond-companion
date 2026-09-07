import { useState } from "react";
import {
  Bell,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  Phone,
  ShoppingBag,
  Droplets,
  Utensils,
  Pill,
  Sun,
  User,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MemoryBondStore, Reminder } from "@/lib/memoryBondStore";
import { speakText } from "@/lib/voiceParser";

export function RemindersView({ store }: { store: MemoryBondStore }) {
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [time, setTime] = useState<string>("09:00");
  const [type, setType] = useState<Reminder["type"]>("personal");
  const [repeat, setRepeat] = useState<Reminder["repeat"]>("daily");
  const [notes, setNotes] = useState<string>("");

  const getReminderIcon = (remType: Reminder["type"]) => {
    switch (remType) {
      case "medicine":
        return <Pill className="h-5 w-5 text-emerald-500" />;
      case "hydration":
        return <Droplets className="h-5 w-5 text-sky-500" />;
      case "meal":
        return <Utensils className="h-5 w-5 text-amber-500" />;
      case "shopping":
        return <ShoppingBag className="h-5 w-5 text-purple-500" />;
      case "family_call":
        return <Phone className="h-5 w-5 text-rose-500" />;
      case "routine":
        return <Sun className="h-5 w-5 text-amber-600" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    store.addReminder({
      title: title.trim(),
      time,
      type,
      date: null,
      repeat,
      notes: notes.trim() || null,
      active: true,
    });

    setIsAddOpen(false);
    setTitle("");
    setNotes("");
  };

  const handleAnnounceReminder = (rem: Reminder) => {
    speakText(`Reminder: ${rem.title} scheduled for ${rem.time}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" /> Smart Reminders
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Gentle notifications for medicines, hydration, meals, family calls, and daily tasks.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold text-base h-12 px-6 rounded-2xl">
          <Plus className="h-5 w-5" /> New Reminder
        </Button>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {store.reminders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No active reminders. Tap "New Reminder" or ask the Voice Assistant!
          </div>
        ) : (
          store.reminders.map((rem) => {
            const isDoneToday = rem.last_done === new Date().toISOString().split("T")[0];

            return (
              <div
                key={rem.id}
                className={`rounded-3xl border-2 bg-card p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-all ${
                  isDoneToday ? "opacity-65 border-success/30 bg-success/5" : "border-border"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                    {getReminderIcon(rem.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-lg font-bold text-foreground ${
                          isDoneToday ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {rem.title}
                      </h4>
                      {isDoneToday && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-success/20 text-success">
                          Completed Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 font-medium">
                      <span className="flex items-center gap-1 font-bold text-primary">
                        <Clock className="h-4 w-4" /> {rem.time}
                      </span>
                      <span>• Repeat: {rem.repeat}</span>
                      {rem.notes && <span>• {rem.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAnnounceReminder(rem)}
                    className="rounded-xl p-2 text-muted-foreground hover:text-foreground"
                    title="Speak reminder aloud"
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>

                  <Button
                    size="sm"
                    variant={isDoneToday ? "outline" : "default"}
                    onClick={() => store.markReminderDone(rem.id)}
                    className="rounded-xl gap-1.5 font-bold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isDoneToday ? "Done" : "Mark Done"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => store.deleteReminder(rem.id)}
                    className="rounded-xl text-destructive hover:bg-destructive/10 p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Create New Reminder</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Reminder Title *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Call daughter Sunita / Drink warm water"
                  className="rounded-xl mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Scheduled Time</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={type} onValueChange={(val: any) => setType(val)}>
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="hydration">Hydration</SelectItem>
                      <SelectItem value="meal">Meals</SelectItem>
                      <SelectItem value="family_call">Family Call</SelectItem>
                      <SelectItem value="routine">Daily Routine</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Repeat Frequency</Label>
                <Select value={repeat} onValueChange={(val: any) => setRepeat(val)}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Repeat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="none">One-time only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional gentle instruction..."
                  className="rounded-xl mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6">
                  Save Reminder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
