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
import { checkScheduledReminders, requestNotificationPermission } from "@/lib/notificationService";

// Modals
import { SosModal } from "./SosModal";
import { VoiceAssistantModal } from "./VoiceAssistantModal";
import { NotificationDrawer } from "./NotificationDrawer";
import { AuthModal } from "./AuthModal";
import { Footer } from "./Footer";
import { FloatingAssistantBubble } from "./FloatingAssistantBubble";
import { SIHDemoTourModal } from "./SIHDemoTourModal";
import { MemoryStoryModal } from "./MemoryStoryModal";
import { SafeRouteErrorBoundary } from "./SafeRouteErrorBoundary";

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

  // Listen to Supabase auth events (OAuth redirect, sign in, sign out) with fail-safe error handling
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      if (supabase && typeof supabase.auth?.onAuthStateChange === "function") {
        const res = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const user = session.user;
            const role = (user.user_metadata?.role as any) || "caregiver";
            const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Caregiver";
            store.updateProfile({ full_name: fullName, role });
            store.setRole(role);
            try {
              localStorage.setItem(
                "mb_active_session",
                JSON.stringify({
                  userId: user.id,
                  role,
                  email: user.email,
                  fullName,
                })
              );
            } catch {}
            setIsAuthenticated(true);
            if (role === "caregiver") {
              setCurrentTab("caregiver");
            } else {
              setCurrentTab("home");
            }
          }
        });
        subscription = res?.data?.subscription;
      }
    } catch (err) {
      console.warn("[MemoryBond App] Supabase auth state listener bypassed safely:", err);
    }

    return () => {
      try {
        subscription?.unsubscribe?.();
      } catch {}
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

  // Scheduled device notifications & reminders watcher (Requirement 14 & 25) with fail-safe error handling
  useEffect(() => {
    try {
      requestNotificationPermission();
      checkScheduledReminders(store);
      const interval = window.setInterval(() => {
        try {
          checkScheduledReminders(store);
        } catch (err) {
          console.debug("[MemoryBond App] Scheduled reminder check tick:", err);
        }
      }, 20000);
      return () => window.clearInterval(interval);
    } catch (err) {
      console.debug("[MemoryBond App] Notification watcher setup bypassed:", err);
    }
  }, [store]);

  // Sync tab if user switches role (Senior vs Caregiver)
  useEffect(() => {
    if (store.profile.role === "caregiver" && currentTab === "home") {
      setCurrentTab("caregiver");
    } else if (store.profile.role === "senior" && currentTab === "caregiver") {
      setCurrentTab("home");
    }
  }, [store.profile.role, currentTab]);

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
    <SafeRouteErrorBoundary>
      <div
        className={`min-h-screen overflow-x-clip bg-background text-foreground flex flex-col justify-between ${fontClass} ${
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

      {/* Main Header — Sticky at the top */}
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
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* Main View Container */}
        <main id="main-content" className="flex-1 min-w-0 px-3 sm:px-6 pt-4 pb-12 animate-in fade-in">
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
            <CaregiverDashboard store={store} onNavigate={handleNavigate} />
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

      {/* Shared Global Footer — ONE single source of truth rendered across every normal page */}
      <Footer
        store={store}
        onNavigate={handleNavigate}
        onOpenSos={handleOpenSos}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Bottom Navigation for Mobile & Tablet */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        role={store.profile.role}
        onOpenSos={handleOpenSos}
        onOpenVoice={() => setIsVoiceOpen(true)}
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

      {/* Floating Accessibility Companion Bubble (Android Overlay Simulator) */}
      {store.profile.floating_bubble !== false && (
        <FloatingAssistantBubble
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenSos={handleOpenSos}
        />
      )}
    </div>
    </SafeRouteErrorBoundary>
  );
}
