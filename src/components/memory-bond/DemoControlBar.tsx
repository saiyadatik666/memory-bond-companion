import { useState } from "react";
import {
  Sparkles,
  Users,
  Pill,
  Wifi,
  WifiOff,
  RotateCcw,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  ShieldCheck,
  MapPin,
  Heart,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";

export function DemoControlBar({
  store,
  onOpenSos,
  onNavigate,
}: {
  store: MemoryBondStore;
  onOpenSos: () => void;
  onNavigate?: (tab: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Quick simulation actions for Judges
  const simulateLowStock = () => {
    const medicine = store.medicines[0];
    if (!medicine) return;
    store.updateMedicine(medicine.id, { stock: 2, refill_threshold: 6 });
    alert(`Simulated low stock for ${medicine.name}! Check Medicines tab & Caregiver dashboard.`);
  };

  return (
    <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          <span className="text-primary font-black uppercase tracking-wider">Demo Evaluator Bar</span>
          <span className="text-muted-foreground hidden sm:inline">|</span>
          <span className="text-muted-foreground hidden sm:inline">SIH26003 North East Dementia Care Prototype</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* 4-Role Switcher (Section 16 & 21) */}
          <div className="flex items-center bg-secondary/80 rounded-xl p-1 font-bold">
            <button
              onClick={() => {
                store.setRole("senior");
                onNavigate?.("home");
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                store.profile.role === "senior"
                  ? "bg-card text-primary shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👴 Senior
            </button>
            <button
              onClick={() => {
                store.setRole("caregiver");
                onNavigate?.("caregiver");
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                store.profile.role === "caregiver"
                  ? "bg-card text-primary shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👩‍⚕️ Caregiver
            </button>
            <button
              onClick={() => {
                store.setRole("admin_healthcare_worker");
                onNavigate?.("healthcare");
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                store.profile.role === "admin_healthcare_worker" ||
                store.profile.role === "healthcare_worker" ||
                store.profile.role === "admin"
                  ? "bg-card text-primary shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Combined Admin & Healthcare Worker role (SIH Section 30)"
            >
              🩺 Admin / Healthcare Worker
            </button>
          </div>

          {/* Network & Sync Status (Per Section 20 of Spec) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border bg-secondary font-bold text-xs">
            {!store.isOnline ? (
              <span className="flex items-center gap-1 text-destructive font-black">
                <WifiOff className="h-3.5 w-3.5" /> Offline
              </span>
            ) : store.isSyncing ? (
              <span className="flex items-center gap-1 text-primary animate-pulse font-black">
                <RotateCcw className="h-3.5 w-3.5 animate-spin" /> Syncing...
              </span>
            ) : store.syncQueue.length > 0 ? (
              <span className="flex items-center gap-1 text-warning font-bold">
                <Wifi className="h-3.5 w-3.5" /> Queued ({store.syncQueue.length})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-success font-bold">
                <Wifi className="h-3.5 w-3.5" /> Synced
              </span>
            )}
          </div>

          {/* Network Simulator Toggle */}
          <button
            onClick={() => store.setOfflineModeForced(!store.offlineModeForced)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
              store.offlineModeForced
                ? "bg-destructive/10 border-destructive text-destructive font-black"
                : "bg-secondary border-border text-foreground hover:bg-secondary/70"
            }`}
            title="Toggle Offline Simulation"
          >
            {store.offlineModeForced ? "Simulate Online" : "Simulate Offline"}
          </button>

          {/* Quick Simulation Dropdown toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 rounded-xl text-xs gap-1 font-bold"
          >
            Judge Tests {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Expanded Quick Tests Tray */}
      {isExpanded && (
        <div className="border-t border-border bg-secondary/40 px-4 py-3 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-muted-foreground">Evaluation Shortcuts:</span>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (typeof store.simulateEscalationFlow === "function") {
                  store.simulateEscalationFlow("Evening Donepezil 5mg");
                  onNavigate?.("caregiver");
                }
              }}
              className="h-8 text-xs font-bold rounded-xl gap-1.5 text-warning border-warning/40"
              title="Test 1: Notice Sent -> Test 2: Second Notice -> Test 3: Caregiver Alert"
            >
              <Pill className="h-3.5 w-3.5 text-warning" /> Test 3-Stage Escalation
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                for (let i = 0; i < 4; i++) {
                  store.recordGameSession("card_match", 1, 5, "easy", {
                    accuracy: 25,
                    responseTimeMs: 8200,
                    gameType: "memory",
                  });
                }
                onNavigate?.("healthcare");
              }}
              className="h-8 text-xs font-bold rounded-xl gap-1.5 text-destructive border-destructive/40"
              title="Simulate 2-week memory decline to trigger non-diagnostic AI early warning"
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Test 2-Wk Decline Alert
            </Button>

            {store.syncQueue.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => store.triggerSyncNow()}
                className="h-8 text-xs font-bold rounded-xl gap-1.5 text-primary border-primary/40"
                title="Synchronize queued offline actions to cloud"
              >
                <Wifi className="h-3.5 w-3.5" /> Flush Sync ({store.syncQueue.length})
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={simulateLowStock}
              className="h-8 text-xs font-bold rounded-xl gap-1.5"
            >
              <Pill className="h-3.5 w-3.5 text-warning" /> Trigger Low Medicine Stock
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onOpenSos}
              className="h-8 text-xs font-bold rounded-xl gap-1.5 text-destructive border-destructive/40"
            >
              <AlertOctagon className="h-3.5 w-3.5" /> Test 5-Second SOS Emergency
            </Button>


            {onNavigate && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("cultural")}
                  className="h-8 text-xs font-bold rounded-xl gap-1.5 text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                >
                  <MapPin className="h-3.5 w-3.5" /> North East Cultural Hub
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("social")}
                  className="h-8 text-xs font-bold rounded-xl gap-1.5 text-rose-600 border-rose-500/40 hover:bg-rose-500/10"
                >
                  <Heart className="h-3.5 w-3.5" /> Family Greetings Feed
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate("checkin")}
                  className="h-8 text-xs font-bold rounded-xl gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" /> Cognitive Baseline & CES
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                store.resetToDemoData();
                alert("Realistic North Eastern Region demo dataset refreshed!");
              }}
              className="h-8 text-xs font-bold rounded-xl gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reload Demo Dataset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
