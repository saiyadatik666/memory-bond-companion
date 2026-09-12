import { useState } from "react";
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
  User,
  Heart,
  Stethoscope,
  Compass,
  Mic,
  ArrowRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";

export interface SIHDemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: MemoryBondStore;
  onNavigate: (tab: string) => void;
  onOpenVoice: () => void;
  onOpenSos: () => void;
  onOpenMemoryStory: () => void;
}

interface DemoStep {
  stepNumber: number;
  title: string;
  role: "Senior" | "Caregiver" | "Healthcare Worker" | "System";
  description: string;
  actionLabel: string;
  icon: any;
  action: () => void;
}

export function SIHDemoTourModal({
  isOpen,
  onClose,
  store,
  onNavigate,
  onOpenVoice,
  onOpenSos,
  onOpenMemoryStory,
}: SIHDemoTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const demoSteps: DemoStep[] = [
    {
      stepNumber: 1,
      title: "1. Select Senior (Ramesh Das)",
      role: "Senior",
      description: "Switch to Senior mode for Ramesh Das, 68, from Assam, living with memory support needs.",
      actionLabel: "Select Senior View",
      icon: User,
      action: () => {
        store.setRole("senior");
        onNavigate("home");
      },
    },
    {
      stepNumber: 2,
      title: "2. Open Today's Plan",
      role: "Senior",
      description: "Elderly users immediately see 'Today's Plan' with pending medicine, hydration, activity, and appointment.",
      actionLabel: "View Today's Plan",
      icon: CheckCircle2,
      action: () => {
        store.setRole("senior");
        onNavigate("home");
      },
    },
    {
      stepNumber: 3,
      title: "3. Ask Voice Assistant",
      role: "Senior",
      description: "Senior taps 'Ask Memory Bond' and asks: 'Aaj mujhe kya karna hai?' in their language.",
      actionLabel: "Open Voice Assistant",
      icon: Mic,
      action: () => {
        onOpenVoice();
      },
    },
    {
      stepNumber: 4,
      title: "4. Start Cognitive Game",
      role: "Senior",
      description: "Senior launches Pattern Recall Level 2 recommended by the AI engine.",
      actionLabel: "Launch Pattern Recall",
      icon: Sparkles,
      action: () => {
        onNavigate("games");
      },
    },
    {
      stepNumber: 5,
      title: "5. Complete Game Session",
      role: "Senior",
      description: "Senior matches sequence patterns and scores 85% accuracy.",
      actionLabel: "Simulate Game Completion",
      icon: Award,
      action: () => {
        store.recordGameSession("pattern_recall", 4, 5, "medium", {
          accuracy: 85,
          responseTimeMs: 3400,
          gameType: "attention",
          level: 2,
        });
        onNavigate("games");
      },
    },
    {
      stepNumber: 6,
      title: "6. AI Adjusts Difficulty",
      role: "System",
      description: "High accuracy triggers gradual progression: Level 2 -> Level 3 with explainable 'Why this activity?' rationale.",
      actionLabel: "Inspect AI Explanation",
      icon: Sparkles,
      action: () => {
        onNavigate("home");
      },
    },
    {
      stepNumber: 7,
      title: "7. Turn Offline Mode ON",
      role: "System",
      description: "Simulate zero internet connectivity in remote NER hill areas. Orange OFFLINE MODE banner activates.",
      actionLabel: "Activate Offline Mode",
      icon: WifiOff,
      action: () => {
        store.setOfflineModeForced(true);
      },
    },
    {
      stepNumber: 8,
      title: "8. Complete Activity Offline",
      role: "Senior",
      description: "Senior drinks a glass of water and marks medicine dose while completely offline. Action is safely queued locally.",
      actionLabel: "Record Offline Activity",
      icon: CheckCircle2,
      action: () => {
        store.drinkGlassOfWater();
      },
    },
    {
      stepNumber: 9,
      title: "9. Turn Online Mode ON",
      role: "System",
      description: "Network connectivity is restored. System detects connectivity and prepares offline queue flush.",
      actionLabel: "Restore Network",
      icon: Wifi,
      action: () => {
        store.setOfflineModeForced(false);
      },
    },
    {
      stepNumber: 10,
      title: "10. Synchronize Data",
      role: "System",
      description: "Syncs offline actions to cloud servers with SYNCING -> SYNC COMPLETE confirmation.",
      actionLabel: "Flush Sync Queue",
      icon: RotateCcw,
      action: () => {
        store.triggerSyncNow();
      },
    },
    {
      stepNumber: 11,
      title: "11. Switch to Caregiver",
      role: "Caregiver",
      description: "Caregiver Anita views overview of 5 assigned seniors with activity status badges (3 Stable, 1 Attention, 1 Urgent).",
      actionLabel: "Open Caregiver Portal",
      icon: User,
      action: () => {
        store.setRole("caregiver");
        onNavigate("caregiver");
      },
    },
    {
      stepNumber: 12,
      title: "12. Show Updated Activity",
      role: "Caregiver",
      description: "Caregiver verifies Ramesh's synced activities: Medicine 2/2, Hydration 5/6, Games 2, Routine 5/6.",
      actionLabel: "Inspect Senior Status",
      icon: CheckCircle2,
      action: () => {
        onNavigate("caregiver");
      },
    },
    {
      stepNumber: 13,
      title: "13. Show Caregiver Alert",
      role: "Caregiver",
      description: "Non-diagnostic alert: 'Activity pattern needs attention: missed evening dose' triggers multi-stage notice.",
      actionLabel: "Simulate Caregiver Alert",
      icon: ShieldCheck,
      action: () => {
        store.simulateEscalationFlow("Evening Donepezil 5mg");
        onNavigate("caregiver");
      },
    },
    {
      stepNumber: 14,
      title: "14. Switch to Healthcare Worker",
      role: "Healthcare Worker",
      description: "Community health worker (ASHA) accesses authorized patient triage dashboard.",
      actionLabel: "Open Healthcare Portal",
      icon: Stethoscope,
      action: () => {
        store.setRole("admin_healthcare_worker");
        onNavigate("healthcare");
      },
    },
    {
      stepNumber: 15,
      title: "15. Patient Attention Triage",
      role: "Healthcare Worker",
      description: "Review High, Medium, and Low attention signals based on objective adherence without medical diagnosis.",
      actionLabel: "Review Triage Priority",
      icon: Stethoscope,
      action: () => {
        onNavigate("healthcare");
      },
    },
    {
      stepNumber: 16,
      title: "16. Open Family Memory Story",
      role: "Senior",
      description: "Demonstrate 📸 MEMORY STORY: personal photo reminiscence, audio voice prompt, and emotional connection.",
      actionLabel: "Launch Memory Story",
      icon: Heart,
      action: () => {
        onOpenMemoryStory();
      },
    },
    {
      stepNumber: 17,
      title: "17. Show NER Cultural Memory Game",
      role: "Senior",
      description: "Demonstrate NER Cultural Memory 'Remember These Objects' featuring Phulam Gamosa, Assam Jaapi, and regional items.",
      actionLabel: "Launch Cultural Game",
      icon: Compass,
      action: () => {
        store.setRole("senior");
        onNavigate("cultural");
      },
    },
  ];

  const currentStep = demoSteps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < demoSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleExecute = () => {
    currentStep.action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-3 border-primary/50 bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-primary/15 text-primary text-2xl">
              🎯
            </span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-primary">
                SIH 2026 Evaluation Suite
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                Memory Bond Live Demo Guide
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Step {currentStep.stepNumber} of {demoSteps.length}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-black uppercase">
              Role: {currentStep.role}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{
                width: `${(currentStep.stepNumber / demoSteps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Current Step Card */}
        <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 sm:p-8 space-y-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-inner">
            <currentStep.icon className="h-8 w-8" />
          </div>

          <h4 className="text-2xl font-black text-foreground">
            {currentStep.title}
          </h4>

          <p className="text-base text-foreground/90 font-medium max-w-lg mx-auto leading-relaxed">
            {currentStep.description}
          </p>

          <div className="pt-2">
            <Button
              size="lg"
              onClick={handleExecute}
              className="h-16 px-8 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" /> {currentStep.actionLabel}
            </Button>
          </div>
        </div>

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="outline"
            disabled={currentStepIndex === 0}
            onClick={handlePrev}
            className="rounded-2xl gap-1 text-xs font-bold h-11"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Step
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-2xl text-xs font-bold text-muted-foreground"
          >
            Close Guide
          </Button>

          {currentStepIndex < demoSteps.length - 1 ? (
            <Button
              onClick={handleNext}
              className="rounded-2xl gap-1 text-xs font-bold h-11 bg-primary text-primary-foreground shadow-xs"
            >
              Next Step <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onClose}
              className="rounded-2xl gap-1 text-xs font-black h-11 bg-success text-white shadow-xs"
            >
              Finish Demo 🎉
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
