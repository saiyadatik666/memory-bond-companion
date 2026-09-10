import { useState, useEffect } from "react";
import { useMemoryBondStore } from "@/lib/memoryBondStore";
import { Header } from "./Header";
import { DemoControlBar } from "./DemoControlBar";
import { BottomNavigation } from "./BottomNavigation";

// Views
import { SeniorHome } from "./SeniorHome";
import { CaregiverDashboard } from "./CaregiverDashboard";
import { HealthcareWorkerDashboard } from "./HealthcareWorkerDashboard";
import { NorthEastCulturalConnect } from "./NorthEastCulturalConnect";
import { SocialEngagementModule } from "./SocialEngagementModule";
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
import { AuthModal } from "./AuthModal";
import { Footer } from "./Footer";
import { FloatingAssistantBubble } from "./FloatingAssistantBubble";

export function MemoryBondApp() {
  const store = useMemoryBondStore();

  const [currentTab, setCurrentTab] = useState<string>("home");
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Sync tab if user switches role (Senior, Caregiver, Healthcare Worker, Admin)
  useEffect(() => {
    if (store.profile.role === "caregiver" && currentTab === "home") {
      setCurrentTab("caregiver");
    } else if (store.profile.role === "senior" && (currentTab === "caregiver" || currentTab === "healthcare")) {
      setCurrentTab("home");
    } else if (store.profile.role === "healthcare_worker" && (currentTab === "home" || currentTab === "caregiver")) {
      setCurrentTab("healthcare");
    } else if (store.profile.role === "admin" && currentTab === "home") {
      setCurrentTab("healthcare");
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

  const fontClass =
    store.profile.font_size === "xlarge"
      ? "text-scale-xlarge"
      : store.profile.font_size === "large"
      ? "text-scale-large"
      : "text-scale-normal";

  return (
    <div
      className={`min-h-screen bg-background text-foreground flex flex-col justify-between pb-24 ${fontClass} ${
        store.profile.high_contrast ? "high-contrast contrast-boost" : ""
      } ${store.profile.reduced_motion ? "reduced-motion" : ""}`}
    >
      {/* Top Demo Bar for Evaluators & Judges */}
      <DemoControlBar
        store={store}
        onOpenSos={() => setIsSosOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Main Header */}
      <Header
        store={store}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
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

        {currentTab === "healthcare" && (
          <HealthcareWorkerDashboard store={store} onNavigate={handleNavigate} />
        )}

        {currentTab === "cultural" && (
          <NorthEastCulturalConnect store={store} />
        )}

        {currentTab === "social" && (
          <SocialEngagementModule store={store} />
        )}

        {currentTab === "medicines" && <MedicineManagerView store={store} />}

        {currentTab === "reminders" && <RemindersView store={store} />}

        {currentTab === "games" && (
          <CognitiveGamesHub store={store} onNavigate={handleNavigate} />
        )}

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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        store={store}
      />

      {/* Attractive & Accessible Footer */}
      <Footer
        store={store}
        onNavigate={handleNavigate}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Floating Accessibility Companion Bubble (Android Overlay Simulator) */}
      {store.profile.floating_bubble !== false && (
        <FloatingAssistantBubble
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenSos={() => setIsSosOpen(true)}
        />
      )}
    </div>
  );
}
