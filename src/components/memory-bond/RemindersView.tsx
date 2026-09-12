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
  Volume2,
  Footprints,
  Sparkles,
  Mic,
  RotateCcw,
  Edit2,
  History,
  Timer,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MemoryBondStore, Reminder } from "@/lib/memoryBondStore";
import { speakText, startSpeechRecognition } from "@/lib/voiceParser";
import { useI18n } from "@/lib/i18n";

// Memory Bond Reminders Engine — Senior-Friendly Light Theme
export function RemindersView({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale } = useI18n();

  // Natural Language AI quick prompt & direct voice input
  const [naturalInput, setNaturalInput] = useState<string>("");
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "completed">("today");

  // Form State
  const [title, setTitle] = useState<string>("");
  const [time, setTime] = useState<string>("09:00");
  const [date, setDate] = useState<string>("");
  const [type, setType] = useState<Reminder["type"]>("personal");
  const [repeat, setRepeat] = useState<Reminder["repeat"]>("daily");
  const [notes, setNotes] = useState<string>("");

  const todayStr = new Date().toISOString().split("T")[0];

  const getReminderIcon = (remType: Reminder["type"]) => {
    switch (remType) {
      case "medicine":
        return <Pill className="h-5 w-5 text-emerald-600" />;
      case "hydration":
        return <Droplets className="h-5 w-5 text-sky-600" />;
      case "walking":
        return <Footprints className="h-5 w-5 text-teal-600" />;
      case "meal":
        return <Utensils className="h-5 w-5 text-amber-600" />;
      case "shopping":
        return <ShoppingBag className="h-5 w-5 text-purple-600" />;
      case "family_call":
        return <Phone className="h-5 w-5 text-rose-600" />;
      case "routine":
        return <Sun className="h-5 w-5 text-amber-600" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  // Filter into clear groups
  const todayReminders = store.reminders.filter(
    (r) => r.active && (r.repeat === "daily" || !r.date || r.date === todayStr) && r.last_done !== todayStr
  );
  const upcomingReminders = store.reminders.filter(
    (r) => r.active && r.date && r.date > todayStr && r.repeat !== "daily"
  );
  const completedReminders = store.reminders.filter(
    (r) => r.last_done === todayStr
  );

  // Direct Speech Recognition for Reminders
  const handleStartVoiceInput = () => {
    if (isListening) return;
    setIsListening(true);
    const stopFn = startSpeechRecognition(
      speechLocale || "en-IN",
      (text) => {
        setNaturalInput(text);
      },
      (err) => {
        console.warn("Speech recognition error in Reminders:", err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    setTimeout(() => {
      if (stopFn) stopFn();
      setIsListening(false);
    }, 10000);
  };

  // Natural Language Fast Add: parses "Remind me to take my medicine at 8 PM"
  const handleNaturalLanguageSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!naturalInput.trim()) return;

    setIsAiProcessing(true);
    const text = naturalInput.toLowerCase();

    // 1. Time extraction
    let extractedTime = "09:00";
    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] || "00";
      const meridian = timeMatch[3]?.toLowerCase();
      if (meridian === "pm" && h < 12) h += 12;
      if (meridian === "am" && h === 12) h = 0;
      if (!meridian && (text.includes("night") || text.includes("evening") || text.includes("shaam") || text.includes("raat")) && h < 12) {
        h += 12;
      }
      extractedTime = `${h.toString().padStart(2, "0")}:${m}`;
    }

    // 2. Category extraction
    let extractedType: Reminder["type"] = "personal";
    let extractedNotes: string | null = null;
    let isTomorrow = text.includes("tomorrow") || text.includes("kal") || text.includes("कल");

    if (text.includes("doctor") || text.includes("appointment") || text.includes("clinic") || text.includes("hospital") || text.includes("डॉक्टर") || text.includes("अपॉइंटमेंट")) {
      extractedType = "appointment";
    } else if (text.includes("medicine") || text.includes("dawa") || text.includes("दवा") || text.includes("pill") || text.includes("tablet")) {
      extractedType = "medicine";
    } else if (text.includes("walk") || text.includes("tahal") || text.includes("टहल") || text.includes("walking")) {
      extractedType = "walking";
    } else if (text.includes("water") || text.includes("paani") || text.includes("पानी") || text.includes("hydrate") || text.includes("drink")) {
      extractedType = "hydration";
    } else if (text.includes("buy") || text.includes("market") || text.includes("bazaar") || text.includes("rice") || text.includes("tea") || text.includes("shopping") || text.includes("सब्जी") || text.includes("खरीद")) {
      extractedType = "shopping";
      const buyMatch = naturalInput.match(/(?:buy|purchase|खरीदने|लाने)\s+(.+?)(?=\s+tomorrow|\s+at|\s+in|\s+morning|\s+कल|$)/i);
      if (buyMatch && buyMatch[1]) {
        extractedNotes = `Items: ${buyMatch[1].trim()}`;
      } else if (text.includes("rice") || text.includes("tea")) {
        extractedNotes = "Items: rice, tea";
      }
    } else if (text.includes("call") || text.includes("phone") || text.includes("daughter") || text.includes("sunita") || text.includes("बेटी")) {
      extractedType = "family_call";
    }

    // Clean title
    let cleanTitle = naturalInput
      .replace(/^(please\s+)?(remind me to|set a reminder for|reminder for|remind me)\s*/i, "")
      .replace(/कल सुबह|कल शाम|सुबह|शाम|बजे|याद दिलाना|याद दिलाओ/gi, "")
      .replace(/tomorrow\s*(morning|evening|afternoon)?/i, "")
      .replace(/at\s+\d{1,2}(:\d{2})?\s*(am|pm)?/i, "")
      .trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      if (extractedType === "appointment") cleanTitle = "Doctor Appointment";
      else if (extractedType === "medicine") cleanTitle = "Take scheduled medicine";
      else if (extractedType === "walking") cleanTitle = "Gentle daily walk";
      else if (extractedType === "hydration") cleanTitle = "Drink warm water";
      else if (extractedType === "shopping") cleanTitle = extractedNotes ? `Buy ${extractedNotes.replace("Items: ", "")}` : "Pick up fresh groceries";
      else cleanTitle = "Daily task";
    }

    store.addReminder({
      title: cleanTitle,
      time: extractedTime,
      type: extractedType,
      date: isTomorrow ? new Date(Date.now() + 86400000).toISOString().slice(0, 10) : null,
      repeat: isTomorrow ? "none" : "daily",
      notes: extractedNotes,
      active: true,
    });

    speakText(`Reminder created for ${cleanTitle} at ${extractedTime}.`, speechLocale);
    setNaturalInput("");
    setIsAiProcessing(false);
  };

  const handleOpenAdd = () => {
    setEditingReminder(null);
    setTitle("");
    setTime("09:00");
    setDate("");
    setType("personal");
    setRepeat("daily");
    setNotes("");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (rem: Reminder) => {
    setEditingReminder(rem);
    setTitle(rem.title);
    setTime(rem.time);
    setDate(rem.date || "");
    setType(rem.type);
    setRepeat(rem.repeat);
    setNotes(rem.notes || "");
    setIsAddOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingReminder) {
      store.updateReminder(editingReminder.id, {
        title: title.trim(),
        time,
        date: date || null,
        type,
        repeat,
        notes: notes.trim() || null,
      });
    } else {
      store.addReminder({
        title: title.trim(),
        time,
        type,
        date: date || null,
        repeat,
        notes: notes.trim() || null,
        active: true,
      });
    }

    setIsAddOpen(false);
    setEditingReminder(null);
  };

  const handleAnnounceReminder = (rem: Reminder) => {
    speakText(`Reminder: ${rem.title} scheduled for ${rem.time}. Category: ${rem.type}.`, speechLocale);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" /> Smart Reminders Engine
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Natural language reminders for medicines, hydration, walking, market shopping, and doctor visits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-xs">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "today"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today ({todayReminders.length})
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "upcoming"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upcoming ({upcomingReminders.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "completed"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-3.5 w-3.5" /> Done ({completedReminders.length})
            </button>
          </div>

          <Button onClick={handleOpenAdd} className="gap-2 font-bold text-base h-12 px-6 rounded-2xl cursor-pointer">
            <Plus className="h-5 w-5" /> New Reminder
          </Button>
        </div>
      </div>

      {/* NATURAL LANGUAGE AI REMINDER INPUT BAR (Section 5) */}
      <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Sparkles className="h-4 w-4" /> AI Natural Language Reminder Input (बोलकर या लिखकर बनाएं)
        </div>

        <form onSubmit={handleNaturalLanguageSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              placeholder='Try: "Remind me to take medicine at 8 PM" or "Remind me tomorrow morning to buy rice and tea"'
              className="w-full h-14 rounded-2xl bg-card border-2 border-border text-base px-4 pr-14 shadow-xs"
            />
            <button
              type="button"
              onClick={handleStartVoiceInput}
              className={`absolute right-2 top-2 h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? "bg-destructive text-white animate-pulse shadow-md"
                  : "hover:bg-secondary text-primary"
              }`}
              title="Tap to speak your reminder"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
          <Button
            type="submit"
            disabled={!naturalInput.trim() || isAiProcessing}
            className="h-14 px-7 rounded-2xl font-black text-base shadow-sm gap-2"
          >
            <Sparkles className="h-5 w-5" /> Add with AI
          </Button>
        </form>

        {isListening && (
          <p className="text-xs font-bold text-destructive animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />
            Listening... Please speak your reminder now (e.g. "Remind me to take my medicine at 8 PM").
          </p>
        )}

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-muted-foreground font-semibold">Quick templates:</span>
          <button
            type="button"
            onClick={() => setNaturalInput("Remind me to take my medicine at 8 PM")}
            className="px-3 py-1 rounded-full bg-card border border-border hover:border-primary text-foreground font-medium transition-all"
          >
            💊 Take medicine at 8 PM
          </button>
          <button
            type="button"
            onClick={() => setNaturalInput("Remind me tomorrow morning to buy rice and tea")}
            className="px-3 py-1 rounded-full bg-card border border-border hover:border-primary text-foreground font-medium transition-all"
          >
            🛍️ Buy rice and tea tomorrow
          </button>
          <button
            type="button"
            onClick={() => setNaturalInput("Remind me to go for a 20-minute walk at 5 PM")}
            className="px-3 py-1 rounded-full bg-card border border-border hover:border-primary text-foreground font-medium transition-all"
          >
            🚶 Evening walk at 5 PM
          </button>
          <button
            type="button"
            onClick={() => setNaturalInput("Remind me to drink warm water")}
            className="px-3 py-1 rounded-full bg-card border border-border hover:border-primary text-foreground font-medium transition-all"
          >
            💧 Drink warm water
          </button>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {(() => {
          const currentList =
            activeTab === "today"
              ? todayReminders
              : activeTab === "upcoming"
              ? upcomingReminders
              : completedReminders;

          if (currentList.length === 0) {
            return (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-2">
                <Bell className="h-10 w-10 text-primary/40 mx-auto" />
                <h4 className="text-base font-bold text-foreground">
                  {activeTab === "today"
                    ? "All clear for today! No pending reminders."
                    : activeTab === "upcoming"
                    ? "No upcoming reminders scheduled for future dates."
                    : "No completed reminders recorded yet today."}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {activeTab === "today"
                    ? "You are all caught up. Would you like to create a new reminder?"
                    : "Use the voice input or tap '+ New Reminder' above."}
                </p>
              </div>
            );
          }

          return currentList.map((rem) => {
            const isDoneToday = rem.last_done === todayStr;

              return (
                <div
                  key={rem.id}
                  className={`rounded-3xl border-2 bg-card p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-all ${
                    isDoneToday ? "opacity-70 border-success/30 bg-success/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
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
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase">
                          {rem.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1 font-medium">
                        <span className="flex items-center gap-1 font-bold text-primary">
                          <Clock className="h-4 w-4" /> {rem.time}
                        </span>
                        {rem.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Date: {rem.date}
                          </span>
                        )}
                        <span>• Repeat: {rem.repeat}</span>
                        {rem.notes && <span className="font-semibold text-foreground">• {rem.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Snooze, Edit, Announce, Mark Done, Delete */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Snooze Dropdown / Buttons */}
                    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border text-xs">
                      <span className="text-[10px] font-bold text-muted-foreground px-1.5 flex items-center gap-1">
                        <Timer className="h-3 w-3" /> Snooze:
                      </span>
                      <button
                        type="button"
                        onClick={() => store.snoozeReminder(rem.id, 10)}
                        className="px-2 py-1 rounded-lg hover:bg-card text-foreground font-bold transition-colors"
                        title="Snooze 10 minutes"
                      >
                        +10m
                      </button>
                      <button
                        type="button"
                        onClick={() => store.snoozeReminder(rem.id, 60)}
                        className="px-2 py-1 rounded-lg hover:bg-card text-foreground font-bold transition-colors"
                        title="Snooze 1 hour"
                      >
                        +1h
                      </button>
                      <button
                        type="button"
                        onClick={() => store.snoozeReminder(rem.id, 1440)}
                        className="px-2 py-1 rounded-lg hover:bg-card text-foreground font-bold transition-colors"
                        title="Snooze to tomorrow"
                      >
                        Tomorrow
                      </button>
                    </div>

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
                      variant="outline"
                      onClick={() => handleOpenEdit(rem)}
                      className="rounded-xl p-2 text-muted-foreground hover:text-foreground"
                      title="Edit reminder"
                    >
                      <Edit2 className="h-4 w-4" />
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
                      title="Delete reminder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            });
        })()}
      </div>

      {/* Add / Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">
              {editingReminder ? "Edit Reminder" : "Create New Reminder"}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <Label>Reminder Title *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Call daughter Sunita / Evening 20-min walk"
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
                      <SelectItem value="walking">Walking</SelectItem>
                      <SelectItem value="routine">Daily Routine</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="family_call">Family Call</SelectItem>
                      <SelectItem value="meal">Meals</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Date (Optional)</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Notes & Items (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Items: rice, tea, ginger / After lunch"
                  className="rounded-xl mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6">
                  {editingReminder ? "Save Changes" : "Save Reminder"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
