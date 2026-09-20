import { useState, useEffect, useCallback, useRef } from "react";
import { useMemoryBondStore } from "@/lib/memoryBondStore";
import { Header } from "./Header";
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
import { FamilyTreeView } from "./FamilyTreeView";
import { SettingsView } from "./SettingsView";
import { SeniorOnboarding } from "./SeniorOnboarding";
import { LoginScreen } from "./LoginScreen";
import { SeniorNerAccessibilityView } from "./ner/SeniorNerAccessibilityView";
import { CaregiverNerAccessibilityView } from "./ner/CaregiverNerAccessibilityView";
import { supabase } from "@/integrations/supabase/client";
import { checkScheduledReminders, requestNotificationPermission } from "@/lib/notificationService";
import {
  isTabAuthorized,
  getDefaultTabForRole,
  getActiveSession,
  clearActiveSession,
  saveActiveSession,
} from "@/lib/authGuards";
import { syncUserProfile } from "@/lib/userProfileService";

// Modals
import { SosModal } from "./SosModal";
import { VoiceAssistantModal } from "./VoiceAssistantModal";
import { NotificationDrawer } from "./NotificationDrawer";
import { Footer } from "./Footer";
import { FloatingAssistantBubble } from "./FloatingAssistantBubble";
import { MemoryStoryModal } from "./MemoryStoryModal";
import { SafeRouteErrorBoundary } from "./SafeRouteErrorBoundary";

export function MemoryBondApp() {
  const store = useMemoryBondStore();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const session = getActiveSession();
    return !!session;
  });

  // Role resolution from authoritative session
  const currentRole = store.profile.role;

  // Active Tab State with Route Guard Protection
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const session = getActiveSession();
      const role = session?.role || "senior";
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && isTabAuthorized(role, tabParam)) {
        return tabParam;
      }
      return getDefaultTabForRole(role);
    }
    return "home";
  });

  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMemoryStoryOpen, setIsMemoryStoryOpen] = useState<boolean>(false);

  // Synchronize store profile role with active authenticated session on mount & updates
  useEffect(() => {
    const session = getActiveSession();
    if (!session && isAuthenticated) {
      console.warn("[AuthSecurity] No valid authenticated session found. Requiring authentication.");
      setIsAuthenticated(false);
      return;
    }
    if (session?.role) {
      if (store.profile.role !== session.role) {
        store.updateProfile({
          role: session.role,
          full_name: session.fullName || store.profile.full_name,
        });
        store.setRole(session.role);
      }
    }

    // Guard against local storage tampering from other windows or devtools (Section 4 & 18)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mb_active_session" || e.key === "mb_role") {
        const currentValidSession = getActiveSession();
        if (!currentValidSession) {
          console.warn("[AuthSecurity] Active session was cleared or tampered with. Logging out.");
          clearActiveSession();
          setIsAuthenticated(false);
        } else if (currentValidSession.role !== store.profile.role) {
          console.warn("[AuthSecurity] Unauthorized role switch attempt detected in storage. Restoring locked session.");
          store.setRole(currentValidSession.role);
          store.updateProfile({ role: currentValidSession.role });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [store.profile.role, store.profile.full_name, isAuthenticated]);

  // Listen to Supabase auth events (OAuth redirect, sign in, sign out) with fail-safe error handling
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      if (supabase && typeof supabase.auth?.onAuthStateChange === "function") {
        const res = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const user = session.user;
            const role = (user.user_metadata?.role as any) === "senior" ? "senior" : "caregiver";
            try {
              const syncedProfile = await syncUserProfile(user, role);
              const fullName = syncedProfile.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Caregiver";
              store.updateProfile({ full_name: fullName, role: syncedProfile.role || role });
              store.setRole(syncedProfile.role || role);
              saveActiveSession({
                userId: user.id,
                role: (syncedProfile.role as any) || role,
                email: user.email,
                fullName,
              });
              store.reloadUserData?.();
              setIsAuthenticated(true);
              const defaultTab = getDefaultTabForRole(syncedProfile.role || role);
              setCurrentTab(defaultTab);
            } catch (err) {
              console.warn("[MemoryBond App] Profile sync during auth change:", err);
            }
          }
        });
        subscription = res?.data?.subscription;
      }

      // Check initial session on mount
      if (supabase && typeof supabase.auth?.getSession === "function") {
        supabase.auth.getSession().then(async ({ data }) => {
          if (data?.session?.user && !getActiveSession()) {
            const user = data.session.user;
            const role = (user.user_metadata?.role as any) === "senior" ? "senior" : "caregiver";
            const syncedProfile = await syncUserProfile(user, role);
            const fullName = syncedProfile.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Caregiver";
            store.updateProfile({ full_name: fullName, role: syncedProfile.role || role });
            store.setRole(syncedProfile.role || role);
            saveActiveSession({
              userId: user.id,
              role: (syncedProfile.role as any) || role,
              email: user.email,
              fullName,
            });
            store.reloadUserData?.();
            setIsAuthenticated(true);
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("[MemoryBond App] Supabase auth state listener bypassed safely:", err);
    }

    return () => {
      try {
        subscription?.unsubscribe?.();
      } catch {}
    };
  }, [store]);

  // Strict Sign Out Flow: destroys session and returns to login page for clean role selection
  const handleSignOut = useCallback(() => {
    try {
      supabase.auth.signOut();
    } catch {}
    clearActiveSession();
    setIsAuthenticated(false);
    store.setRole("senior");
    store.reloadUserData?.();
    setCurrentTab("home");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.search = "";
      url.hash = "";
      window.history.replaceState(null, "", url.toString());
    }
  }, [store]);

  // Global trigger for Memory Story
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__mb_open_memory_story = () => setIsMemoryStoryOpen(true);
    }
    const handleOpenMemoryStory = () => setIsMemoryStoryOpen(true);
    window.addEventListener("mb_open_memory_story", handleOpenMemoryStory);
    return () => {
      window.removeEventListener("mb_open_memory_story", handleOpenMemoryStory);
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

  // Scheduled device notifications & reminders watcher with fail-safe error handling
  useEffect(() => {
    let interval: number | undefined;
    try {
      requestNotificationPermission();
      checkScheduledReminders(store);
      interval = window.setInterval(() => {
        try {
          checkScheduledReminders(store);
        } catch (err) {
          console.debug("[MemoryBond App] Scheduled reminder check tick:", err);
        }
      }, 20000);
    } catch (err) {
      console.debug("[MemoryBond App] Notification watcher setup bypassed:", err);
    }
    return () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [store]);

  // Direct URL parameter synchronization & Route Guard Protection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const enforceUrlRoute = () => {
      const session = getActiveSession();
      const role = session?.role || store.profile.role;
      const params = new URLSearchParams(window.location.search);

      // Requirement 17: Disallow role switching through URL (?role=senior / ?role=caregiver / /switch-role)
      let urlChanged = false;
      if (params.has("role")) {
        console.warn("[Security] Role override through URL query rejected. Role is locked to active authenticated session.");
        params.delete("role");
        urlChanged = true;
      }
      if (params.has("switch-role")) {
        params.delete("switch-role");
        urlChanged = true;
      }
      if (urlChanged) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`
        );
      }

      const tabParam = params.get("tab");

      if (tabParam) {
        if (isTabAuthorized(role, tabParam)) {
          if (tabParam !== currentTab) {
            setCurrentTab(tabParam);
          }
        } else {
          // Direct URL violation: redirect immediately to authorized role dashboard
          const defaultTab = getDefaultTabForRole(role);
          console.warn(
            `[RouteGuard] Direct URL access to '${tabParam}' forbidden for role '${role}'. Redirecting to '${defaultTab}'.`
          );
          setCurrentTab(defaultTab);
          params.set("tab", defaultTab);
          window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
        }
      }
    };

    enforceUrlRoute();
    window.addEventListener("popstate", enforceUrlRoute);
    return () => window.removeEventListener("popstate", enforceUrlRoute);
  }, [store.profile.role, currentTab]);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Authoritative Navigation with Route Guard Enforcement
  const handleNavigate = useCallback(
    (tab: string) => {
      const session = getActiveSession();
      const role = session?.role || store.profile.role;

      // Guard: Block navigation to unauthorized routes
      if (!isTabAuthorized(role, tab)) {
        const fallback = getDefaultTabForRole(role);
        console.warn(
          `[RouteGuard] Navigation to '${tab}' blocked for role '${role}'. Remaining on authorized view '${fallback}'.`
        );
        if (currentTab !== fallback) {
          setCurrentTab(fallback);
        }
        return;
      }

      if (tab === currentTab && !isTransitioning) {
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }

      // Synchronize browser URL query param cleanly
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.replaceState(null, "", url.toString());
      }

      // If reduced motion is enabled, switch immediately without delay
      if (store.profile.reduced_motion) {
        window.scrollTo({ top: 0, behavior: "instant" });
        setCurrentTab(tab);
        return;
      }

      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }

      // Smooth, subtle transition (70ms exit, scroll reset, enter)
      setIsTransitioning(true);
      navTimeoutRef.current = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        setCurrentTab(tab);
        setIsTransitioning(false);
      }, 70);
    },
    [currentTab, isTransitioning, store.profile.reduced_motion, store.profile.role]
  );

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  // Requirement 19 & 2: Website starts with Login Screen; Role is chosen only during login
  if (!isAuthenticated) {
    return (
      <LoginScreen
        store={store}
        onAuthenticated={(role) => {
          setIsAuthenticated(true);
          const defaultTab = getDefaultTabForRole(role);
          store.setRole(role);
          store.updateProfile({ role });
          setCurrentTab(defaultTab);
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", defaultTab);
            window.history.replaceState(null, "", url.toString());
          }
        }}
      />
    );
  }

  // If senior is not onboarded, show onboarding
  if (!store.profile.onboarded && currentRole === "senior") {
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
        className={`min-h-screen overflow-x-clip bg-background text-foreground flex flex-col ${fontClass} ${
          store.profile.high_contrast ? "high-contrast contrast-boost" : ""
        } ${store.profile.reduced_motion ? "reduced-motion" : ""}`}
      >
        {/* Main Header — Clean, sticky at top-0 */}
        <Header
          store={store}
          currentTab={currentTab}
          onOpenVoice={() => setIsVoiceOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
          onOpenSos={handleOpenSos}
        />

        {/* Main Responsive Body Canvas */}
        <div className="flex-1 w-full max-w-[1600px] mx-auto flex items-start">
          <main id="main-content" className="flex-1 w-full min-w-0 px-3 sm:px-6 pt-4 pb-24 md:pb-12">
            <div
              key={currentTab}
              className={isTransitioning ? "page-transition-exit" : "page-transition-enter"}
            >
              {/* Senior Home: Accessible ONLY to Senior role */}
              {currentTab === "home" && (
                currentRole === "senior" ? (
                  <SeniorHome
                    store={store}
                    onNavigate={handleNavigate}
                    onOpenSos={handleOpenSos}
                    onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
                  />
                ) : (
                  <CaregiverDashboard store={store} onNavigate={handleNavigate} />
                )
              )}

              {/* Caregiver Dashboard: Accessible ONLY to Caregiver / Family role */}
              {currentTab === "caregiver" && (
                currentRole !== "senior" ? (
                  <CaregiverDashboard store={store} onNavigate={handleNavigate} />
                ) : (
                  <SeniorHome
                    store={store}
                    onNavigate={handleNavigate}
                    onOpenSos={handleOpenSos}
                    onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
                  />
                )
              )}

              {currentTab === "healthcare" && (
                currentRole !== "senior" ? (
                  <CaregiverDashboard store={store} onNavigate={handleNavigate} />
                ) : (
                  <SeniorHome
                    store={store}
                    onNavigate={handleNavigate}
                    onOpenSos={handleOpenSos}
                    onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
                  />
                )
              )}

              {currentTab === "cultural" && (
                <NorthEastCulturalConnect store={store} />
              )}

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

              {/* Care Network: Caregiver only. If accessed by senior, route to FamilyTreeView */}
              {currentTab === "family" && (
                currentRole !== "senior" ? (
                  <FamilyManagementView store={store} />
                ) : (
                  <FamilyTreeView store={store} initialTab="tree" />
                )
              )}

              {/* 9. NER Accessibility & Smart Logistics */}
              {currentTab === "ner_logistics" && (
                currentRole === "senior" ? (
                  <SeniorNerAccessibilityView
                    store={store}
                    onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
                    onOpenSos={handleOpenSos}
                    onNavigate={handleNavigate}
                  />
                ) : (
                  <CaregiverNerAccessibilityView
                    store={store}
                    onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
                    onOpenSos={handleOpenSos}
                    onNavigate={handleNavigate}
                  />
                )
              )}

              {currentTab === "settings" && <SettingsView store={store} />}
            </div>
          </main>
        </div>

        {/* Global Footer */}
        <Footer
          store={store}
          onNavigate={handleNavigate}
          onOpenSos={handleOpenSos}
          onOpenVoice={() => setIsVoiceOpen(true)}
        />

        {/* Mobile & Tablet Bottom Navigation */}
        <BottomNavigation
          currentTab={currentTab}
          onSelectTab={handleNavigate}
          role={currentRole}
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

        {/* Interactive Memory Story Modal */}
        <MemoryStoryModal
          isOpen={isMemoryStoryOpen}
          onClose={() => setIsMemoryStoryOpen(false)}
          store={store}
        />

        {/* Floating Accessibility Companion Bubble */}
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
