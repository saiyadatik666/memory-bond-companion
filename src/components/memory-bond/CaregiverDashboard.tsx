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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";

export function CaregiverDashboard({
  store,
  onNavigate,
}: {
  store: MemoryBondStore;
  onNavigate: (tab: string) => void;
}) {
  const lowStockMeds = store.medicines.filter((m) => m.stock <= m.refill_threshold);
  const todayStr = new Date().toISOString().split("T")[0];
  const routinesDone = store.routines.filter((r) => r.done_date === todayStr).length;
  const recentSos = store.sosEvents[0];

  return (
    <div className="space-y-6">
      {/* Header & Senior Profile Snapshot */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-3xl font-black text-primary">
              👴
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Caregiver Overview: {store.profile.full_name}
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-success/20 text-success">
                  Connected
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Age: {store.profile.age_range} • Phone: {store.profile.phone} • Language: {store.profile.language.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => store.setRole("senior")}
              className="font-bold rounded-xl text-sm"
            >
              Switch to Senior View
            </Button>
          </div>
        </div>
      </div>

      {/* Critical Refill & SOS Alert Banners */}
      {recentSos && (
        <div className="rounded-3xl border-2 border-destructive bg-destructive/10 p-6 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-3 text-destructive font-black text-lg">
            <AlertOctagon className="h-6 w-6 animate-bounce" />
            <span>RECENT SOS EMERGENCY RECORDED</span>
          </div>
          <p className="text-sm text-foreground font-medium">
            Timestamp: {new Date(recentSos.created_at).toLocaleString()} • Location:{" "}
            {recentSos.latitude ? `${recentSos.latitude.toFixed(4)}, ${recentSos.longitude?.toFixed(4)}` : "Unavailable"}
          </p>
        </div>
      )}

      {lowStockMeds.length > 0 && (
        <div className="rounded-3xl border-2 border-warning/50 bg-warning/10 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-warning font-black text-lg">
              <AlertTriangle className="h-6 w-6" />
              <span>MEDICINE REFILL ALERT ({lowStockMeds.length} Items Below Threshold)</span>
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
                  <span className="text-xs text-muted-foreground ml-1">/ thr: {med.refill_threshold}</span>
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
          <div className="text-3xl font-black text-foreground">
            {routinesDone} <span className="text-base font-normal text-muted-foreground">/ {store.routines.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">Activities marked complete</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Medicines</span>
            <Pill className="h-5 w-5 text-teal-500" />
          </div>
          <div className="text-3xl font-black text-foreground">{store.medicines.length}</div>
          <p className="text-xs text-muted-foreground">Active tracked prescriptions</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Appointments</span>
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-foreground">{store.appointments.length}</div>
          <p className="text-xs text-muted-foreground">Upcoming clinic visits</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Games Played</span>
            <Gamepad2 className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-foreground">{store.gameSessions.length}</div>
          <p className="text-xs text-muted-foreground">Mental engagement sessions</p>
        </div>
      </div>

      {/* Detailed Status Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medication Schedule & History */}
        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" /> Active Prescriptions & Schedule
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("medicines")} className="gap-1 text-primary font-bold">
              View All <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {store.medicines.map((med) => (
              <div key={med.id} className="rounded-2xl bg-secondary/30 p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-foreground">{med.name}</h4>
                  <div className="text-xs text-muted-foreground font-medium">
                    {med.dosage} • Times: {med.times.join(", ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">Stock: {med.stock} {med.unit}s</div>
                  <div className="text-xs text-muted-foreground">Dr. {med.doctor || "Consultant"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cognitive Engagement & Journal Summary */}
        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" /> Recent Mental Agility Activity
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("games")} className="gap-1 text-primary font-bold">
              Games Hub <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {store.gameSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No games played yet today.</p>
            ) : (
              store.gameSessions.slice(0, 4).map((gs) => (
                <div key={gs.id} className="rounded-2xl bg-secondary/30 p-4 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground capitalize">
                      {gs.game_key.replace("_", " ")}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {new Date(gs.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="text-right font-black text-primary text-base">
                    Score: {gs.score} / {gs.total}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
