import { useState, useEffect, useCallback } from "react";
import { useMemoryBondStore } from "@/lib/memoryBondStore";
import { Header } from "./Header";
import { DemoControlBar } from "./DemoControlBar";
import { BottomNavigation } from "./BottomNavigation";
import { DesktopSidebar } from "./DesktopSidebar";

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
import { FamilyTreeView } from "./FamilyTreeView";
import { SettingsView } from "./SettingsView";
import { SeniorOnboarding } from "./SeniorOnboarding";
import { LoginScreen } from "./LoginScreen";
import { supabase } from "@/integrations/supabase/client";

// Modals
import { SosModal } from "./SosModal";
import { VoiceAssistantModal } from "./VoiceAssistantModal";
import { NotificationDrawer } from "./NotificationDrawer";
import { AuthModal } from "./AuthModal";
import { Footer } from "./Footer";
import { FloatingAssistantBubble } from "./FloatingAssistantBubble";
import { SIHDemoTourModal } from "./SIHDemoTourModal";
import { MemoryStoryModal } from "./MemoryStoryModal";

export function MemoryBondApp() {
  const store = useMemoryBondStore();

  const [currentTab, setCurrentTab] = useState<string>("home");
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSihDemoOpen, setIsSihDemoOpen] = useState<boolean>(false);
  const [isMemoryStoryOpen, setIsMemoryStoryOpen] = useState<boolean>(false);

  // Requirement 19: Website MUST start with Login / Account Access page
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const session = localStorage.getItem("mb_active_session");
    return !!session;
  });

  // Listen to Supabase auth events (OAuth redirect, sign in, sign out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = session.user;
        const role = (user.user_metadata?.role as any) || "caregiver";
        const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Caregiver";
        store.updateProfile({ full_name: fullName, role });
        store.setRole(role);
        localStorage.setItem(
          "mb_active_session",
          JSON.stringify({
            userId: user.id,
            role,
            email: user.email,
            fullName,
          })
        );
        setIsAuthenticated(true);
        if (role === "caregiver") {
          setCurrentTab("caregiver");
        } else {
          setCurrentTab("home");
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = () => {
    try {
      supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("mb_active_session");
    setIsAuthenticated(false);
    setCurrentTab("caregiver");
  };

  // Global triggers for Memory Story & SIH Demo Tour
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__mb_open_memory_story = () => setIsMemoryStoryOpen(true);
      (window as any).__mb_open_sih_demo = () => setIsSihDemoOpen(true);
    }
    const handleOpenMemoryStory = () => setIsMemoryStoryOpen(true);
    const handleOpenSihDemo = () => setIsSihDemoOpen(true);
    window.addEventListener("mb_open_memory_story", handleOpenMemoryStory);
    window.addEventListener("mb_open_sih_demo", handleOpenSihDemo);
    return () => {
      window.removeEventListener("mb_open_memory_story", handleOpenMemoryStory);
      window.removeEventListener("mb_open_sih_demo", handleOpenSihDemo);
    };
  }, []);

  // Centralized SOS Open with strict anti-restart cooldown guard
  const handleOpenSos = useCallback(() => {
    if (isSosOpen) return;

    if (typeof window !== "undefined") {
      const lockUntil = (window as any).__mb_last_sos_cancelled || 0;
      if (Date.now() < lockUntil) {
        console.warn("[SOS] Suppressed SOS open trigger during cancellation cooldown.");
        return;
      }
    }

    setIsSosOpen(true);
  }, [isSosOpen]);

  const handleCloseSos = useCallback(() => {
    setIsSosOpen(false);
  }, []);

  // Sync tab if user switches role (Senior, Caregiver, Admin / Healthcare Worker)
  useEffect(() => {
    if (store.profile.role === "caregiver" && currentTab === "home") {
      setCurrentTab("caregiver");
    } else if (store.profile.role === "senior" && (currentTab === "caregiver" || currentTab === "healthcare")) {
      setCurrentTab("home");
    } else if (
      (store.profile.role === "admin_healthcare_worker" ||
        store.profile.role === "healthcare_worker" ||
        store.profile.role === "admin") &&
      (currentTab === "home" || currentTab === "caregiver")
    ) {
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

  // Requirement 19: Website MUST start with Login / Account Access page
  if (!isAuthenticated) {
    return (
      <LoginScreen
        store={store}
        onAuthenticated={(role) => {
          setIsAuthenticated(true);
          if (role === "caregiver") {
            store.setRole("caregiver");
            setCurrentTab("caregiver");
          } else {
            store.setRole("senior");
            setCurrentTab("home");
          }
        }}
      />
    );
  }

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
      className={`min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col justify-between pb-24 ${fontClass} ${
        store.profile.high_contrast ? "high-contrast contrast-boost" : ""
      } ${store.profile.reduced_motion ? "reduced-motion" : ""}`}
    >
      {/* Top Demo Bar for Evaluators & Judges */}
      <DemoControlBar
        store={store}
        onOpenSos={handleOpenSos}
        onNavigate={handleNavigate}
        onOpenSihDemo={() => setIsSihDemoOpen(true)}
      />

      {/* Main Header */}
      <Header
        store={store}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
      />

      {/* Main Responsive Body: Left Sidebar on Desktop + Centered Main Canvas */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto flex items-start">
        <DesktopSidebar
          currentTab={currentTab}
          onNavigate={handleNavigate}
          store={store}
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenSos={handleOpenSos}
        />

        {/* Main View Container with safe clearance */}
        <main className="flex-1 min-w-0 px-3 sm:px-6 pt-4 pb-24 sm:pb-28 lg:pb-12 animate-in fade-in">
          {currentTab === "home" && (
            <SeniorHome
              store={store}
              onNavigate={handleNavigate}
              onOpenSos={handleOpenSos}
              onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
            />
          )}

          {currentTab === "caregiver" && (
            store.profile.role !== "senior" ? (
              <CaregiverDashboard store={store} onNavigate={handleNavigate} />
            ) : (
              <SeniorHome
                store={store}
                onNavigate={handleNavigate}
                onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
              />
            )
          )}

          {currentTab === "healthcare" && (
            store.profile.role === "healthcare_worker" || store.profile.role === "admin_healthcare_worker" || store.profile.role === "admin" ? (
              <HealthcareWorkerDashboard store={store} onNavigate={handleNavigate} />
            ) : (
              <SeniorHome
                store={store}
                onNavigate={handleNavigate}
                onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
              />
            )
          )}

          {currentTab === "cultural" && (
            <NorthEastCulturalConnect store={store} />
          )}

          {/* Unified Family Tree replacing standalone sections 6, 7 and 8 */}
          {currentTab === "family_tree" && (
            <FamilyTreeView store={store} initialTab="tree" />
          )}

          {currentTab === "social" && (
            <FamilyTreeView store={store} initialTab="greetings" />
          )}

          {currentTab === "cues" && (
            <FamilyTreeView store={store} initialTab="cues" />
          )}

          {currentTab === "journal" && (
            <FamilyTreeView store={store} initialTab="journal" />
          )}

          {currentTab === "medicines" && <MedicineManagerView store={store} />}

          {currentTab === "reminders" && <RemindersView store={store} />}

          {currentTab === "games" && (
            <CognitiveGamesHub store={store} onNavigate={handleNavigate} />
          )}

          {currentTab === "checkin" && <CognitiveCheckIn store={store} />}

          {currentTab === "routine" && <DailyRoutineView store={store} />}

          {currentTab === "appointments" && <AppointmentsView store={store} />}

          {/* Connect Caregiver & Family: Caregiver/Admin only. If a Senior accesses this, render FamilyTreeView instead */}
          {currentTab === "family" && (
            store.profile.role !== "senior" ? (
              <FamilyManagementView store={store} />
            ) : (
              <FamilyTreeView store={store} initialTab="tree" />
            )
          )}

          {currentTab === "settings" && <SettingsView store={store} />}
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        role={store.profile.role}
        onOpenSos={handleOpenSos}
      />

      {/* Global Modals */}
      <SosModal
        isOpen={isSosOpen}
        onClose={handleCloseSos}
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

      {/* Section 22: Interactive Memory Story Modal */}
      <MemoryStoryModal
        isOpen={isMemoryStoryOpen}
        onClose={() => setIsMemoryStoryOpen(false)}
        store={store}
      />

      {/* Section 39: 17-Step SIH Demo Mode Guided Tour for Evaluators */}
      <SIHDemoTourModal
        isOpen={isSihDemoOpen}
        onClose={() => setIsSihDemoOpen(false)}
        store={store}
        onNavigate={handleNavigate}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenSos={handleOpenSos}
        onOpenMemoryStory={() => setIsMemoryStoryOpen(true)}
      />

      {/* Attractive & Accessible Footer */}
      <Footer
        store={store}
        onNavigate={handleNavigate}
        onOpenSos={handleOpenSos}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Floating Accessibility Companion Bubble (Android Overlay Simulator) */}
      {store.profile.floating_bubble !== false && (
        <FloatingAssistantBubble
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenSos={handleOpenSos}
        />
      )}
    </div>
  );
}
