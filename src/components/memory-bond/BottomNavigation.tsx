import React from "react";
import {
  Home,
  Gamepad2,
  Users,
  Mic,
  Settings,
  Pill,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { UserRole } from "@/lib/memoryBondStore";

export function BottomNavigation({
  currentTab,
  onSelectTab,
  role,
  onOpenSos,
  onOpenVoice,
}: {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  role: UserRole;
  onOpenSos?: () => void;
  onOpenVoice?: () => void;
}) {
  const { t } = useI18n();

  // Mobile Bottom Navigation: Most essential sections per Section 3
  // Home, Games, Family, Voice, Settings
  const seniorTabs: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; isVoiceAction?: boolean }[] = [
    { id: "home", label: t("home") || "Home", icon: Home },
    { id: "games", label: t("games") || "Games", icon: Gamepad2 },
    { id: "family_tree", label: t("family") || "Family", icon: Users },
    { id: "voice", label: t("speak") || "Voice", icon: Mic, isVoiceAction: true },
    { id: "settings", label: t("settings") || "Settings", icon: Settings },
  ];

  const caregiverTabs: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; isVoiceAction?: boolean }[] = [
    { id: "caregiver", label: "Dashboard", icon: Home },
    { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
    { id: "appointments", label: t("appointments") || "Appointments", icon: Calendar },
    { id: "family", label: t("family") || "Family", icon: Users },
    { id: "settings", label: t("settings") || "Settings", icon: Settings },
  ];

  const tabs = role === "caregiver" ? caregiverTabs : seniorTabs;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-xl border-t border-border/80 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around py-1 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          const handleClick = () => {
            if (tab.isVoiceAction && onOpenVoice) {
              onOpenVoice();
            } else {
              onSelectTab(tab.id);
            }
          };

          return (
            <button
              key={tab.id}
              type="button"
              onClick={handleClick}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-2xl transition-all duration-200 cursor-pointer min-w-0 flex-1 touch-target select-none ${
                isActive
                  ? "text-primary font-black"
                  : "text-muted-foreground hover:text-foreground font-bold"
              }`}
            >
              <div
                className={`p-1.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary scale-110 shadow-xs"
                    : tab.isVoiceAction
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${tab.isVoiceAction ? "animate-pulse" : ""}`} />
              </div>
              <span className="text-[11px] truncate font-black tracking-tight mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
