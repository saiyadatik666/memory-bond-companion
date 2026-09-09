import { useState } from "react";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  FileText,
  Trash2,
  Stethoscope,
  Building2,
  Activity,
  Users,
  Volume2,
  CheckCircle2,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MemoryBondStore, Appointment } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

export function AppointmentsView({ store }: { store: MemoryBondStore }) {
  const { t, speechLocale } = useI18n();
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [filterKind, setFilterKind] = useState<string>("all");

  const [title, setTitle] = useState<string>("");
  const [kind, setKind] = useState<Appointment["kind"]>("doctor");
  const [date, setDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [time, setTime] = useState<string>("10:30");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const getKindIcon = (k: Appointment["kind"]) => {
    switch (k) {
      case "doctor":
        return <Stethoscope className="h-5 w-5 text-teal-600" />;
      case "hospital":
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case "test":
        return <Activity className="h-5 w-5 text-purple-600" />;
      case "family":
        return <Users className="h-5 w-5 text-rose-600" />;
      default:
        return <Calendar className="h-5 w-5 text-primary" />;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    store.addAppointment({
      title: title.trim(),
      kind,
      date,
      time,
      location: location.trim(),
      notes: notes.trim(),
    });

    setIsAddOpen(false);
    setTitle("");
    setLocation("");
    setNotes("");
  };

  const handleSpeakAppointment = (app: Appointment) => {
    stopSpeaking();
    const dateFormatted = new Date(app.date).toLocaleDateString("en-IN", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const message = `${app.title}. Scheduled for ${dateFormatted} at ${app.time}. Location: ${
      app.location || "Not specified"
    }. ${app.notes ? `Note: ${app.notes}` : ""}`;
    speakText(message, speechLocale || "en-IN");
  };

  const filteredAppointments = store.appointments.filter((app) => {
    if (filterKind === "all") return true;
    return app.kind === filterKind;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" /> {t("appointments")} & Doctor Visits
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Never miss doctor reviews, diagnostic lab tests, or family visits. Caregiver synchronized.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 font-bold text-base h-12 px-6 rounded-2xl shadow-sm"
        >
          <Plus className="h-5 w-5" /> Schedule Appointment
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 mr-2">
          <Filter className="h-3.5 w-3.5" /> Filter:
        </span>
        {[
          { id: "all", label: "All Scheduled" },
          { id: "doctor", label: "Doctor Consultations" },
          { id: "test", label: "Diagnostic Lab Tests" },
          { id: "hospital", label: "Hospital Visits" },
          { id: "family", label: "Family Events" },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilterKind(chip.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filterKind === chip.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-2 rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No appointments match the selected filter.
          </div>
        ) : (
          filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between hover:border-primary/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                      {getKindIcon(app.kind)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{app.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs uppercase font-bold text-primary tracking-wider">
                          {app.kind} Appointment
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Caregiver Synced
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => store.deleteAppointment(app.id)}
                    className="rounded-xl text-destructive hover:bg-destructive/10 p-2 shrink-0"
                    title="Delete appointment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 pt-2 text-sm text-foreground">
                  <div className="flex items-center gap-2 font-semibold">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      {new Date(app.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span>{app.time}</span>
                  </div>

                  {app.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate font-medium">{app.location}</span>
                    </div>
                  )}

                  {app.notes && (
                    <div className="rounded-2xl bg-secondary/40 p-3 text-xs text-foreground flex items-start gap-2 font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span>{app.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  Reminders active in audio & notifications
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSpeakAppointment(app)}
                  className="gap-2 font-bold rounded-xl"
                >
                  <Volume2 className="h-4 w-4 text-primary" /> Read Aloud
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">Schedule Appointment</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Appointment Title *</Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dr. Nilotpal Dutta - Neurological Review"
                  className="rounded-xl mt-1 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={kind} onValueChange={(val: Appointment["kind"]) => setKind(val)}>
                    <SelectTrigger className="rounded-xl mt-1 font-semibold">
                      <SelectValue placeholder="Kind" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor Visit</SelectItem>
                      <SelectItem value="hospital">Hospital / Clinic</SelectItem>
                      <SelectItem value="test">Medical Test</SelectItem>
                      <SelectItem value="family">Family Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-xl mt-1 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="rounded-xl mt-1 font-semibold"
                  />
                </div>
                <div>
                  <Label>Location / Room</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Clinic name & address"
                    className="rounded-xl mt-1 font-medium"
                  />
                </div>
              </div>

              <div>
                <Label>Preparation Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Fasting required, bring previous prescription, daughter Sunita will accompany..."
                  className="rounded-xl mt-1 font-medium"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6">
                  Save Appointment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
