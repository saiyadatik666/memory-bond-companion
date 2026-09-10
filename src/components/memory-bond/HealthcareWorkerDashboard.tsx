import { useState } from "react";
import {
  Stethoscope,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  FileText,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Filter,
  Pill,
  Sparkles,
  Award,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MemoryBondStore, ClinicalNote } from "@/lib/memoryBondStore";

export function HealthcareWorkerDashboard({
  store,
  onNavigate,
}: {
  store: MemoryBondStore;
  onNavigate: (tab: string) => void;
}) {
  const [isAddNoteOpen, setIsAddNoteOpen] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("p1");
  const [triageFilter, setTriageFilter] = useState<"all" | "green" | "yellow" | "red">("all");

  // New Clinical Note State
  const [workerName, setWorkerName] = useState<string>("Ananya Goswami, CHW");
  const [designation, setDesignation] = useState<string>("ASHA / Community Health Worker");
  const [observation, setObservation] = useState<string>("");
  const [triageStatus, setTriageStatus] = useState<"green" | "yellow" | "red">("green");
  const [actionPlan, setActionPlan] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );

  // 4-Week Cognitive Trend Data (Per Spec: Week 1=52, Week 2=58, Week 3=53, Week 4=60)
  const trendData = [
    { week: "Week 1", score: 52, memory: 50, attention: 55, routineAdherence: 70 },
    { week: "Week 2", score: 58, memory: 56, attention: 60, routineAdherence: 78 },
    { week: "Week 3", score: 53, memory: 52, attention: 54, routineAdherence: 74 },
    { week: "Week 4", score: 60, memory: 62, attention: 58, routineAdherence: 85 },
  ];

  // Component Radar/Bar Data
  const domainBreakdown = [
    { domain: "Memory", score: store.cognitiveScore.memory, status: "Improving", target: 70 },
    { domain: "Attention", score: store.cognitiveScore.attention, status: "Stable", target: 70 },
    { domain: "Recognition", score: store.cognitiveScore.recognition, status: "Improving", target: 70 },
    { domain: "Recall", score: store.cognitiveScore.recall, status: "Stable", target: 70 },
    { domain: "Response Time", score: store.cognitiveScore.response_time, status: "Normal", target: 70 },
    { domain: "Engagement", score: store.cognitiveScore.engagement, status: "High", target: 70 },
  ];

  // Patients Assigned to this Healthcare Worker
  const patients = [
    {
      id: "p1",
      name: store.profile.full_name,
      memberId: store.profile.member_id,
      age: store.profile.age_range,
      triage: "green" as const,
      ces: store.cognitiveScore.overall,
      trend: "improving" as const,
      lastActive: "Today (Morning check complete)",
      missedMeds: store.medicineLogs.filter((l) => l.status === "missed").length,
      primaryCaregiver: "Sunita Sharma (Daughter)",
    },
    {
      id: "p2",
      name: "Biren Gogoi",
      memberId: "MB-NER-781003-GOGOI",
      age: "75-79",
      triage: "yellow" as const,
      ces: 54,
      trend: "declining" as const,
      lastActive: "Yesterday",
      missedMeds: 2,
      primaryCaregiver: "Pranab Gogoi (Son)",
    },
    {
      id: "p3",
      name: "Meena Barman",
      memberId: "MB-NER-781022-BARMAN",
      age: "80+",
      triage: "green" as const,
      ces: 68,
      trend: "stable" as const,
      lastActive: "Today",
      missedMeds: 0,
      primaryCaregiver: "Anita Barman (Daughter)",
    },
  ];

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observation.trim()) return;

    store.addClinicalNote({
      worker_name: workerName.trim(),
      designation: designation.trim(),
      observation: observation.trim(),
      triage_status: triageStatus,
      action_plan: actionPlan.trim() || "Continue routine follow-up.",
      follow_up_date: followUpDate,
    });

    setIsAddNoteOpen(false);
    setObservation("");
    setActionPlan("");
  };

  const filteredPatients = patients.filter((p) => {
    if (triageFilter === "all") return true;
    return p.triage === triageFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-600 text-white flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" /> Clinical Monitoring Portal
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              North-Eastern Region Dementia Assistance (SIH26003)
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-2">
            Healthcare Worker & Community Monitor Dashboard
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Track multi-week cognitive performance trends, routine adherence, and non-diagnostic early warning flags.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddNoteOpen(true)}
            className="rounded-2xl font-bold h-12 px-5 gap-2 bg-primary text-white shadow-xs"
          >
            <Plus className="h-5 w-5" /> Add Observation Note
          </Button>
        </div>
      </div>

      {/* STATUTORY NON-DIAGNOSTIC NOTICE (Section 16 & 17) */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-foreground text-sm">
        <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-black">Monitoring Framework Notice: </span>
          The Cognitive Engagement Score (CES) and status indicators (Green, Yellow, Red) are monitoring flags reflecting activity participation and cognitive game interaction. They do NOT constitute a medical diagnosis. Never diagnose dementia from game scores.
        </div>
      </div>

      {/* AI EARLY WARNING / TREND DETECTION (Section 17) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-black text-lg text-foreground">
                AI Early Warning & Trend Detection Engine (Section 17)
              </h4>
              <p className="text-xs text-muted-foreground">
                Analyzes 4-week moving average to identify persistent cognitive changes.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-success/20 text-success">
            Monitoring Active
          </span>
        </div>

        {/* Diagnostic vs Trend Distinction Card */}
        <div className="rounded-2xl border-2 border-border bg-secondary/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Current Monitored Trend Status for {store.profile.full_name}:</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <span className="text-base font-black text-foreground">
                Stable to Improving (Week 4: 60 / 100 vs Week 1: 52 / 100)
              </span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              4-Week Variance: +8 pts
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            "No persistent decline observed in memory activities over the last 2 weeks. Adherence to morning blood pressure medicine and daily routine calls remains high."
          </p>
        </div>
      </div>

      {/* 4-WEEK TREND GRAPHS & COMPONENT BREAKDOWN (Section 16) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 4-Week Cognitive Performance Trend Graph */}
        <div className="lg:col-span-2 rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-lg font-black text-foreground">
                4-Week Cognitive Engagement Trend (CES)
              </h4>
              <p className="text-xs text-muted-foreground">
                Trend progression: Week 1 (52) → Week 2 (58) → Week 3 (53) → Week 4 (60)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 text-primary">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Cognitive Score
              </span>
              <span className="flex items-center gap-1 text-teal-600">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Routine Adherence
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="week" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis domain={[30, 100]} stroke="#888888" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "1rem",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="oklch(0.52 0.09 205)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "oklch(0.52 0.09 205)" }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="routineAdherence"
                  stroke="oklch(0.6 0.11 165)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Domain Breakdown Indicators (Section 16) */}
        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
          <h4 className="text-lg font-black text-foreground">
            Cognitive Domain Indicators
          </h4>

          <div className="space-y-3">
            {domainBreakdown.map((d) => (
              <div
                key={d.domain}
                className="p-3 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-foreground">{d.domain}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Score: {d.score} / 100
                  </div>
                </div>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    d.status === "Improving"
                      ? "bg-success/20 text-success"
                      : d.status === "High"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {d.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall CES Status:</span>
            <span className="font-black text-success text-sm">Normal / Stable (Green)</span>
          </div>
        </div>
      </div>

      {/* PATIENT TRIAGE LIST (Section 16 Status System: Green, Yellow, Red) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-black text-foreground">
              Assigned Patient Roster & Triage Status
            </h4>
            <p className="text-xs text-muted-foreground">
              GREEN = Normal / Stable • YELLOW = Needs Attention • RED = Flagged Concern
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTriageFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                triageFilter === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              All ({patients.length})
            </button>
            <button
              onClick={() => setTriageFilter("green")}
              className={`px-3 py-1 rounded-lg transition-all ${
                triageFilter === "green" ? "bg-success/20 text-success font-black" : "text-muted-foreground"
              }`}
            >
              Green
            </button>
            <button
              onClick={() => setTriageFilter("yellow")}
              className={`px-3 py-1 rounded-lg transition-all ${
                triageFilter === "yellow" ? "bg-warning/20 text-warning font-black" : "text-muted-foreground"
              }`}
            >
              Yellow
            </button>
            <button
              onClick={() => setTriageFilter("red")}
              className={`px-3 py-1 rounded-lg transition-all ${
                triageFilter === "red" ? "bg-destructive/20 text-destructive font-black" : "text-muted-foreground"
              }`}
            >
              Red
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredPatients.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-wrap items-center justify-between gap-4 ${
                p.triage === "green"
                  ? "border-success/30 bg-success/5"
                  : p.triage === "yellow"
                  ? "border-warning/40 bg-warning/5"
                  : "border-destructive/40 bg-destructive/5"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                    p.triage === "green"
                      ? "bg-success animate-pulse"
                      : p.triage === "yellow"
                      ? "bg-warning"
                      : "bg-destructive"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-base text-foreground">{p.name}</h5>
                    <span className="text-xs font-mono text-muted-foreground">({p.memberId})</span>
                    <span className="text-xs text-muted-foreground">• Age: {p.age}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Caregiver: {p.primaryCaregiver} • Last Active: {p.lastActive}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-black text-foreground">CES: {p.ces} / 100</div>
                  <div
                    className={`text-xs font-bold ${
                      p.triage === "green"
                        ? "text-success"
                        : p.triage === "yellow"
                        ? "text-warning"
                        : "text-destructive"
                    }`}
                  >
                    {p.triage === "green" ? "Normal / Stable" : p.triage === "yellow" ? "Needs Attention" : "Flagged Decline"}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("medicines")}
                  className="rounded-xl text-xs font-bold h-9"
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CLINICAL OBSERVATIONS & AUDIT LOG */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-black text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Clinical Review Notes & Action Plans
          </h4>
          <span className="text-xs text-muted-foreground font-mono">
            {store.clinicalNotes.length} notes recorded
          </span>
        </div>

        <div className="space-y-3">
          {store.clinicalNotes.map((note) => (
            <div key={note.id} className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{note.worker_name}</span>
                  <span className="text-muted-foreground">({note.designation})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      note.triage_status === "green"
                        ? "bg-success/20 text-success"
                        : note.triage_status === "yellow"
                        ? "bg-warning/20 text-warning"
                        : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    Triage: {note.triage_status}
                  </span>
                  <span className="text-muted-foreground font-mono">{note.date}</span>
                </div>
              </div>

              <p className="text-sm text-foreground">{note.observation}</p>

              <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Action Plan: <span className="font-semibold text-foreground">{note.action_plan}</span></span>
                <span>Next Follow-up: <span className="font-mono font-bold text-foreground">{note.follow_up_date}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Clinical Note Modal */}
      {isAddNoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-foreground">
              Add Clinical Review Note
            </h3>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <Label>Observer Name & Designation</Label>
                <Input
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Triage Classification</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(["green", "yellow", "red"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTriageStatus(t)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        triageStatus === t
                          ? t === "green"
                            ? "bg-success text-white shadow-xs"
                            : t === "yellow"
                            ? "bg-warning text-slate-950 shadow-xs"
                            : "bg-destructive text-white shadow-xs"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Clinical Observation & Activity Notes *</Label>
                <Textarea
                  required
                  rows={3}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Record patient interaction, cognitive engagement, orientation, or medicine adherence notes..."
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Action Plan / Recommendations</Label>
                <Input
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  placeholder="e.g. Continue memory games, review in 2 weeks"
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddNoteOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl px-6">
                  Save Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
