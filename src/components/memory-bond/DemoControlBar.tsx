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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";

export function DemoControlBar({
  store,
  onOpenSos,
}: {
  store: MemoryBondStore;
  onOpenSos: () => void;
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
          <span className="text-muted-foreground hidden sm:inline">SIH26003 Dementia Care Prototype</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Role Switcher */}
          <div className="flex items-center bg-secondary/80 rounded-xl p-1 font-bold">
            <button
              onClick={() => store.setRole("senior")}
              className={`px-3 py-1 rounded-lg transition-all ${
                store.profile.role === "senior"
                  ? "bg-card text-primary shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👴 Senior View
            </button>
            <button
              onClick={() => store.setRole("caregiver")}
              className={`px-3 py-1 rounded-lg transition-all ${
                store.profile.role === "caregiver"
                  ? "bg-card text-primary shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👩‍⚕️ Caregiver View
            </button>
          </div>

          {/* Network Simulator */}
          <button
            onClick={() => store.setOfflineModeForced(!store.offlineModeForced)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold border transition-all ${
              store.offlineModeForced
                ? "bg-destructive/10 border-destructive text-destructive"
                : "bg-secondary border-border text-foreground"
            }`}
            title="Toggle Offline Simulation"
          >
            {store.offlineModeForced ? (
              <>
                <WifiOff className="h-3.5 w-3.5" /> Offline Mode
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-success" /> Online
              </>
            )}
          </button>

          {/* Quick Simulation Dropdown toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 rounded-xl text-xs gap-1 font-bold"
          >
            Judge Quick Tests {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Expanded Quick Tests Tray */}
      {isExpanded && (
        <div className="border-t border-border bg-secondary/40 px-4 py-3 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground">Simulation Shortcuts:</span>

            <Button
              size="sm"
              variant="outline"
              onClick={simulateLowStock}
              className="h-8 text-xs font-bold rounded-xl gap-1.5"
            >
              <Pill className="h-3.5 w-3.5 text-warning" /> Trigger Low Medicine Stock Alert
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onOpenSos}
              className="h-8 text-xs font-bold rounded-xl gap-1.5 text-destructive border-destructive/40"
            >
              <AlertOctagon className="h-3.5 w-3.5" /> Test 10s SOS Workflow
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                store.resetToDemoData();
                alert("Demo data refreshed!");
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
