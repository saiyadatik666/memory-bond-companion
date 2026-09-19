import { useState } from "react";
import {
  Users,
  Gamepad2,
  Bell,
  Wifi,
  WifiOff,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Heart,
  Pill,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { saveActiveSession } from "@/lib/authGuards";

export interface DemoControlBarProps {
  store: MemoryBondStore;
  currentRole: "senior" | "caregiver" | "admin_healthcare_worker" | "healthcare_worker" | "admin";
  currentTab: string;
  onSelectRole: (role: "senior" | "caregiver") => void;
  onNavigate: (tab: string) => void;
}

export function DemoControlBar({
  store,
  currentRole,
  currentTab,
  onSelectRole,
  onNavigate,
}: DemoControlBarProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [justSyncedToast, setJustSyncedToast] = useState<boolean>(false);

  const isSenior = currentRole === "senior";
  const isOffline = store.offlineModeForced;

  const handleSwitchToSenior = () => {
    saveActiveSession("sr-meena-patel", "senior", "Meena Patel");
    store.updateProfile({ role: "senior", full_name: "Meena Patel" });
    store.setRole("senior");
    onSelectRole("senior");
    onNavigate("home");
  };

  const handleSwitchToCaregiver = () => {
    saveActiveSession("cg-priya-patel", "caregiver", "Priya Patel");
    store.updateProfile({ role: "caregiver", full_name: "Priya Patel" });
    store.setRole("caregiver");
    onSelectRole("caregiver");
    onNavigate("caregiver");
  };

  const handleToggleOffline = () => {
    if (!isOffline) {
      store.setOfflineModeForced(true);
    } else {
      store.setOfflineModeForced(false);
      setJustSyncedToast(true);
      setTimeout(() => setJustSyncedToast(false), 4000);
    }
  };

  const handleResetDemoData = () => {
    if (confirm("Reset demo data to initial presentation state?")) {
      try {
        localStorage.clear();
      } catch {}
      window.location.reload();
    }
  };

  return (
    <aside aria-label="Evaluator Demo Controls" className="fixed top-2.5 right-2.5 sm:right-6 z-50 flex flex-col items-end gap-2 max-w-[calc(100vw-20px)] print:hidden">
      {/* Cloud Sync Alert Toast when returning online */}
      {justSyncedToast && (
        <div className="rounded-2xl bg-emerald-600 text-white px-4 py-2.5 shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-2">
          <span className="text-base">☁️</span>
          <div>
            <span className="font-black">Sync Complete: </span>
            <span>8 companion activities & reminders synchronized with caregiver cloud.</span>
          </div>
        </div>
      )}

      {/* Main Control Pill Container */}
      <div className="rounded-3xl border-2 border-primary/40 bg-card/95 backdrop-blur-md shadow-xl text-foreground p-2 sm:p-2.5 transition-all">
        <div className="flex items-center gap-2">
          {/* Badge Label */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-primary/15 text-primary text-xs font-black">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SIH 2026 Evaluation Demo</span>
            <span className="sm:hidden">Demo</span>
          </div>

          {/* Senior Mode Button */}
          <Button
            size="sm"
            onClick={handleSwitchToSenior}
            className={`rounded-2xl text-xs font-black h-8 px-3 gap-1.5 transition-all cursor-pointer ${
              isSenior
                ? "bg-primary text-primary-foreground shadow-xs scale-105"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            <span>👵</span>
            <span>Senior Mode (Meena)</span>
          </Button>

          {/* Caregiver Mode Button */}
          <Button
            size="sm"
            onClick={handleSwitchToCaregiver}
            className={`rounded-2xl text-xs font-black h-8 px-3 gap-1.5 transition-all cursor-pointer ${
              !isSenior
                ? "bg-primary text-primary-foreground shadow-xs scale-105"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            <span>👨‍👩‍👧</span>
            <span>Caregiver Mode (Priya)</span>
          </Button>

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={isExpanded ? "Collapse demo tools" : "Expand demo tools"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Expanded Evaluation Actions Bar */}
        {isExpanded && (
          <div className="pt-2 mt-2 border-t border-border/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Jump To:
              </span>

              {/* Jump to Memory Game */}
              <button
                type="button"
                onClick={() => {
                  if (!isSenior) handleSwitchToSenior();
                  onNavigate("games");
                }}
                className="px-2.5 py-1 rounded-xl bg-secondary/60 hover:bg-primary/20 hover:text-primary font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Gamepad2 className="h-3 w-3 text-primary" /> Memory Game
              </button>

              {/* Jump to Medicines & Routine */}
              <button
                type="button"
                onClick={() => {
                  if (!isSenior) handleSwitchToSenior();
                  onNavigate("medicines");
                }}
                className="px-2.5 py-1 rounded-xl bg-secondary/60 hover:bg-emerald-500/20 hover:text-emerald-600 font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Pill className="h-3 w-3 text-emerald-600" /> Medicines
              </button>

              {/* Jump to Caregiver Alerts */}
              <button
                type="button"
                onClick={() => {
                  if (isSenior) handleSwitchToCaregiver();
                  onNavigate("caregiver");
                }}
                className="px-2.5 py-1 rounded-xl bg-secondary/60 hover:bg-rose-500/20 hover:text-rose-600 font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Bell className="h-3 w-3 text-rose-600" /> Alerts ({store.alerts.filter((a) => !a.resolved).length})
              </button>
            </div>

            {/* Offline Simulation Toggle & Reset Demo Data */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleOffline}
                className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isOffline
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
                title="Toggle offline state to demonstrate rural low-connectivity resilience"
              >
                {isOffline ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                <span>{isOffline ? "📶 Offline Active" : "Simulate Offline"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetDemoData}
                className="px-2 py-1 rounded-xl bg-secondary/40 hover:bg-destructive/15 text-muted-foreground hover:text-destructive font-bold transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset demo data"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
