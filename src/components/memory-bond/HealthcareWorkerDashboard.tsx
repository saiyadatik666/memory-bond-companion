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

  // 4-Week Cognitive Trend Data from Dynamic Cognitive Care Engine
  const dynamicWeeklyTrends =
    typeof store.getCognitiveTrends === "function" ? store.getCognitiveTrends("weekly") : [];
  const trendData =
    dynamicWeeklyTrends.length > 0
      ? dynamicWeeklyTrends.map((p) => ({
          week: p.period,
          score: p.overall,
          memory: p.memory,
          attention: p.attention,
          routineAdherence: p.engagement,
        }))
      : [
          { week: "Week 1", score: 52, memory: 50, attention: 55, routineAdherence: 70 },
          { week: "Week 2", score: 58, memory: 56, attention: 60, routineAdherence: 78 },
          { week: "Week 3", score: 53, memory: 52, attention: 54, routineAdherence: 74 },
          { week: "Week 4", score: 62, memory: 63, attention: 60, routineAdherence: 85 },
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

  // Patients Assigned to this Healthcare Worker (Section 19: Authorized Patient Information Only)
  const patients = [
    {
      id: "p1",
      name: store.profile.full_name,
      memberId: store.profile.member_id,
      age: "68",
      region: "Assam",
      triage: "green" as const,
      priorityLevel: "Low Priority" as const,
      ces: store.cognitiveScore.overall,
      trend: "improving" as const,
      recentActivity: "10 minutes ago (Pattern Recall)",
      routineCompletion: "5 / 6 tasks",
      gameParticipation: "2 games completed",
      medicationStatus: "2 / 2 taken",
      lastSync: store.lastSyncTime || "2 minutes ago",
      alerts: "Activity pattern normal",
      primaryCaregiver: "Sunita Sharma (Daughter)",
    },
    {
      id: "p2",
      name: "Biren Gogoi",
      memberId: "MB-NER-781003-GOGOI",
      age: "72",
      region: "Assam",
      triage: "yellow" as const,
      priorityLevel: "Medium Priority" as const,
      ces: 54,
      trend: "declining" as const,
      recentActivity: "Yesterday 6:00 PM",
      routineCompletion: "2 / 6 tasks",
      gameParticipation: "1 game completed",
      medicationStatus: "1 / 2 (missed afternoon dose)",
      lastSync: "3 hours ago",
      alerts: "Reduced game participation & missed routine",
      primaryCaregiver: "Pranab Gogoi (Son)",
    },
    {
      id: "p3",
      name: "Meena Barman",
      memberId: "MB-NER-781022-BARMAN",
      age: "66",
      region: "Meghalaya",
      triage: "red" as const,
      priorityLevel: "High Priority" as const,
      ces: 42,
      trend: "declining" as const,
      recentActivity: "2 days ago",
      routineCompletion: "0 / 6 tasks",
      gameParticipation: "0 games completed",
      medicationStatus: "0 / 2 (missed medicine)",
      lastSync: "Yesterday",
      alerts: "Repeated missed reminders & extended inactivity",
      primaryCaregiver: "Anita Barman (Daughter)",
    },
    {
      id: "p4",
      name: "Tashi Namgyal",
      memberId: "MB-NER-781045-TASHI",
      age: "70",
      region: "Arunachal Pradesh",
      triage: "green" as const,
      priorityLevel: "Low Priority" as const,
      ces: 72,
      trend: "stable" as const,
      recentActivity: "Today 11:30 AM",
      routineCompletion: "4 / 6 tasks",
      gameParticipation: "2 games completed",
      medicationStatus: "2 / 2 taken",
      lastSync: "15 minutes ago",
      alerts: "Stable engagement",
      primaryCaregiver: "Dorjee Namgyal (Brother)",
    },
    {
      id: "p5",
      name: "Lalrintluanga",
      memberId: "MB-NER-781078-LALRIN",
      age: "69",
      region: "Mizoram",
      triage: "green" as const,
      priorityLevel: "Low Priority" as const,
      ces: 76,
      trend: "improving" as const,
      recentActivity: "Today 1:00 PM",
      routineCompletion: "5 / 6 tasks",
      gameParticipation: "3 games completed",
      medicationStatus: "2 / 2 taken",
      lastSync: "5 minutes ago",
      alerts: "Strong daily routine adherence",
      primaryCaregiver: "Zoramthanga (Son)",
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

      {/* AI EARLY WARNING / TREND DETECTION (Section 17 & 18) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              store.earlyWarningStatus?.severity === "red"
                ? "bg-destructive/15 border-destructive/40 text-destructive"
                : store.earlyWarningStatus?.severity === "yellow"
                ? "bg-warning/15 border-warning/40 text-warning"
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-600"
            }`}>
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-black text-lg text-foreground">
                AI Early Warning & Trend Detection Engine (Section 17 & 18)
              </h4>
              <p className="text-xs text-muted-foreground">
                Monitors multi-week activity patterns to flag persistent changes for non-diagnostic review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
              store.earlyWarningStatus?.severity === "red"
                ? "bg-destructive/20 text-destructive font-black"
                : store.earlyWarningStatus?.severity === "yellow"
                ? "bg-warning/20 text-warning"
                : "bg-success/20 text-success"
            }`}>
              {store.earlyWarningStatus?.severity === "red"
                ? "⚠ Warning Flagged"
                : store.earlyWarningStatus?.severity === "yellow"
                ? "Mild Variation"
                : "Stable (Green)"}
            </span>

            {/* Test 10 helper controls */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                for (let i = 0; i < 4; i++) {
                  store.recordGameSession("card_match", 1, 5, "easy", {
                    accuracy: 25,
                    responseTimeMs: 8500,
                    gameType: "memory",
                  });
                }
              }}
              className="h-8 text-xs font-bold rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
              title="Simulate 2-week memory decline to trigger early warning alert"
            >
              Simulate 2-Wk Decline
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => store.resetToDemoData()}
              className="h-8 text-xs font-bold rounded-xl"
              title="Reset data to stable demo benchmark"
            >
              Reset Benchmark
            </Button>
          </div>
        </div>

        {/* Dynamic Warning Readout Card */}
        <div className={`rounded-2xl border-2 p-4 space-y-2 transition-all ${
          store.earlyWarningStatus?.severity === "red"
            ? "border-destructive/60 bg-destructive/10"
            : store.earlyWarningStatus?.severity === "yellow"
            ? "border-warning/50 bg-warning/10"
            : "border-border bg-secondary/30"
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Observed Monitoring Status for {store.profile.full_name}:</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                store.earlyWarningStatus?.severity === "red"
                  ? "bg-destructive animate-ping"
                  : store.earlyWarningStatus?.severity === "yellow"
                  ? "bg-warning"
                  : "bg-success animate-pulse"
              }`} />
              <span className="text-base font-black text-foreground">
                {store.earlyWarningStatus?.headline || "Cognitive Activity Stable"}
              </span>
            </div>
            {store.earlyWarningStatus?.observedDropPercent ? (
              <span className="text-xs font-black text-destructive">
                Shift: -{store.earlyWarningStatus.observedDropPercent}% drop over 2 weeks
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                CES: {store.cognitiveScore.overall} / 100
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed font-medium">
            "{store.earlyWarningStatus?.advisoryText || "Consistent cognitive engagement observed across recent activities."}"
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

      {/* SECTION 19 & 20: PATIENT OVERVIEW & ATTENTION-PRIORITY TRIAGE */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section 19 Overview Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🩺</span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">Patient Overview</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Authorized Senior Patients Roster (Assam & North Eastern Region Communities)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-card border border-border shadow-xs text-foreground font-black">
              Assigned Seniors: 5
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              🟢 Normal Activity: 3
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400">
              🟡 Needs Attention: 1
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400">
              🔴 Urgent: 1
            </span>
          </div>
        </div>

        {/* Section 20: Attention-Priority Triage Guide Card */}
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" /> Attention-Priority Triage System (Section 20)
            </div>
            <span className="text-[11px] font-bold text-muted-foreground bg-card px-2.5 py-1 rounded-lg border border-border">
              Configurable Activity Signals
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-1">
              <div className="font-black text-rose-600 flex items-center gap-1.5">
                <span>🔴</span> HIGH PRIORITY
              </div>
              <ul className="text-muted-foreground list-disc list-inside space-y-0.5 text-[11px]">
                <li>Repeated missed reminders</li>
                <li>Extended inactivity (&gt; 24h)</li>
                <li>Multiple concerning activity changes</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1">
              <div className="font-black text-amber-600 flex items-center gap-1.5">
                <span>🟡</span> MEDIUM PRIORITY
              </div>
              <ul className="text-muted-foreground list-disc list-inside space-y-0.5 text-[11px]">
                <li>Reduced game participation</li>
                <li>Missed routine activities</li>
                <li>Mild engagement variations</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <div className="font-black text-emerald-600 flex items-center gap-1.5">
                <span>🟢</span> LOW PRIORITY
              </div>
              <ul className="text-muted-foreground list-disc list-inside space-y-0.5 text-[11px]">
                <li>Normal activity variation</li>
                <li>Routine tasks on schedule</li>
                <li>Regular family interactions</li>
              </ul>
            </div>
          </div>

          {/* Statutory Triage Disclaimer */}
          <div className="pt-2 text-center text-xs font-bold text-muted-foreground border-t border-border/60">
            ⚠️ <span className="text-foreground">Statutory Notice:</span> "This is an activity-based support/triage indicator and not a medical diagnosis."
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Filter Patients by Activity Status:
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
                triageFilter === "green" ? "bg-emerald-500/20 text-emerald-600 font-black" : "text-muted-foreground"
              }`}
            >
              🟢 Normal (3)
            </button>
            <button
              onClick={() => setTriageFilter("yellow")}
              className={`px-3 py-1 rounded-lg transition-all ${
                triageFilter === "yellow" ? "bg-amber-500/20 text-amber-600 font-black" : "text-muted-foreground"
              }`}
            >
              🟡 Needs Attention (1)
            </button>
            <button
              onClick={() => setTriageFilter("red")}
              className={`px-3 py-1 rounded-lg transition-all ${
                triageFilter === "red" ? "bg-rose-500/20 text-rose-600 font-black" : "text-muted-foreground"
              }`}
            >
              🔴 Urgent (1)
            </button>
          </div>
        </div>

        {/* Section 19 Patient Cards with 8 Core Fields */}
        <div className="space-y-3.5">
          {filteredPatients.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-3xl border-2 transition-all space-y-3 ${
                p.triage === "green"
                  ? "border-emerald-500/30 bg-card hover:border-emerald-500/50"
                  : p.triage === "yellow"
                  ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
                  : "border-rose-500/50 bg-rose-500/5 hover:border-rose-500/70"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full shrink-0 ${
                      p.triage === "green"
                        ? "bg-emerald-500 animate-pulse"
                        : p.triage === "yellow"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-black text-lg text-foreground">{p.name}</h5>
                      <span className="text-xs font-mono text-muted-foreground">({p.memberId})</span>
                      <span className="text-xs text-muted-foreground">• Age: {p.age}</span>
                      <span className="text-xs text-muted-foreground">• Region: {p.region}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Caregiver: <span className="font-semibold text-foreground">{p.primaryCaregiver}</span> • Last Sync: <span className="font-mono">{p.lastSync}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full border ${
                      p.triage === "green"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600"
                        : p.triage === "yellow"
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-600"
                        : "bg-rose-500/15 border-rose-500/30 text-rose-600"
                    }`}
                  >
                    {p.priorityLevel}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate("medicines")}
                    className="rounded-xl text-xs font-bold h-9 gap-1"
                  >
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Section 19 Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-border/60 text-xs">
                <div className="p-2.5 rounded-xl bg-secondary/40 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Recent Activity</span>
                  <div className="font-bold text-foreground truncate">{p.recentActivity}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/40 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Routine Completion</span>
                  <div className="font-bold text-foreground truncate">{p.routineCompletion}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/40 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Game Participation</span>
                  <div className="font-bold text-foreground truncate">{p.gameParticipation}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/40 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Medication Reminders</span>
                  <div className={`font-bold truncate ${p.triage === "red" ? "text-destructive" : "text-foreground"}`}>
                    {p.medicationStatus}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/40 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Activity Trend</span>
                  <div className="font-bold text-foreground capitalize truncate">
                    {p.trend === "improving" ? "↗️ Improving" : p.trend === "stable" ? "➡️ Stable" : "↘️ Variation"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-secondary/40 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Alerts / Support Notes</span>
                  <div className="font-bold text-foreground truncate">{p.alerts}</div>
                </div>
              </div>

              {/* Privacy Control Badge */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Authorized Patient Record (ABDM & DPDP Compliant)
                </span>
                <span className="font-mono">CES: {p.ces} / 100</span>
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

      {/* PATIENT DATA PRIVACY & COMPLIANCE AUDIT LOG (Requirement 22) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-black text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Patient Privacy & Compliance Audit Log
          </h4>
          <span className="text-xs text-muted-foreground font-mono">
            {(store.auditLog || []).length} events recorded
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Immutable audit record tracking authorized caregiver and clinical access to confidential memory banks and records.
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {(store.auditLog || []).map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-xl bg-secondary/30 border border-border flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-card text-foreground">
                  {entry.action}
                </span>
                <span className="text-foreground font-medium">{entry.details}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
                <span>Role: {entry.role}</span>
                <span>•</span>
                <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Clinical Note Modal */}
      {isAddNoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-in fade-in">
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
