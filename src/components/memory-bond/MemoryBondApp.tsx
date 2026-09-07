import { useState, useEffect } from "react";
import { useMemoryBondStore } from "@/lib/memoryBondStore";
import { Header } from "./Header";
import { DemoControlBar } from "./DemoControlBar";
import { BottomNavigation } from "./BottomNavigation";

// Views
import { SeniorHome } from "./SeniorHome";
import { CaregiverDashboard } from "./CaregiverDashboard";
import { MedicineManagerView } from "./MedicineManagerView";
import { RemindersView } from "./RemindersView";
import { CognitiveGamesHub } from "./games/CognitiveGamesHub";
import { CognitiveCheckIn } from "./checkin/CognitiveCheckIn";
import { MemoryCuesView } from "./MemoryCuesView";
import { MemoryJournalView } from "./MemoryJournalView";
import { DailyRoutineView } from "./DailyRoutineView";
import { AppointmentsView } from "./AppointmentsView";
import { FamilyManagementView } from "./FamilyManagementView";
import { SettingsView } from "./SettingsView";
import { SeniorOnboarding } from "./SeniorOnboarding";

// Modals
import { SosModal } from "./SosModal";
import { VoiceAssistantModal } from "./VoiceAssistantModal";
import { NotificationDrawer } from "./NotificationDrawer";

export function MemoryBondApp() {
  const store = useMemoryBondStore();

  const [currentTab, setCurrentTab] = useState<string>("home");
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Sync tab if user switches role to caregiver or senior
  useEffect(() => {
    if (store.profile.role === "caregiver" && currentTab === "home") {
      setCurrentTab("caregiver");
    } else if (store.profile.role === "senior" && currentTab === "caregiver") {
      setCurrentTab("home");
    }
  }, [store.profile.role]);

  // Read URL query params if present e.g. ?tab=medicines
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        setCurrentTab(tabParam);
      }
    }
  }, []);

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // If senior is not onboarded, show onboarding
  if (!store.profile.onboarded) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SeniorOnboarding store={store} onComplete={() => store.updateProfile({ onboarded: true })} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between pb-24">
      {/* Top Demo Bar for Evaluators & Judges */}
      <DemoControlBar store={store} onOpenSos={() => setIsSosOpen(true)} />

      {/* Main Header */}
      <Header
        store={store}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 animate-in fade-in">
        {currentTab === "home" && (
          <SeniorHome
            store={store}
            onNavigate={handleNavigate}
            onOpenSos={() => setIsSosOpen(true)}
            onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
          />
        )}

        {currentTab === "caregiver" && (
          <CaregiverDashboard store={store} onNavigate={handleNavigate} />
        )}

        {currentTab === "medicines" && <MedicineManagerView store={store} />}

        {currentTab === "reminders" && <RemindersView store={store} />}

        {currentTab === "games" && <CognitiveGamesHub store={store} />}

        {currentTab === "checkin" && <CognitiveCheckIn store={store} />}

        {currentTab === "cues" && <MemoryCuesView store={store} />}

        {currentTab === "journal" && <MemoryJournalView store={store} />}

        {currentTab === "routine" && <DailyRoutineView store={store} />}

        {currentTab === "appointments" && <AppointmentsView store={store} />}

        {currentTab === "family" && <FamilyManagementView store={store} />}

        {currentTab === "settings" && <SettingsView store={store} />}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        role={store.profile.role}
      />

      {/* Global Modals */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        store={store}
      />

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        store={store}
        onNavigate={handleNavigate}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        store={store}
      />

      {/* Statutory Footer */}
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground space-y-1">
        <p className="font-semibold">
          Memory Bond • AI Cognitive Gaming & Memory Assistance Platform
        </p>
        <p>
          SIH 2026 Problem Statement ID: SIH26003 (North Eastern Region Support). Non-diagnostic engagement system.
        </p>
      </footer>
    </div>
  );
}
