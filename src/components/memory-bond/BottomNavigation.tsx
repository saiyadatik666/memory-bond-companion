import React from "react";
import {
  Home,
  Gamepad2,
  Users,
  Mic,
  Settings,
  Pill,
  Calendar,
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

  // Exactly 4 primary senior destinations as required in Section 13
  const seniorTabs = [
    { id: "home", label: t("home") || "Home", icon: Home },
    { id: "games", label: t("games") || "Games", icon: Gamepad2 },
    { id: "reminders", label: t("reminders") || "Reminders", icon: Pill },
    { id: "family_tree", label: t("family") || "Family", icon: Users },
  ];

  const caregiverTabs = [
    { id: "caregiver", label: t("caregiverDashboard") || "Dashboard", icon: Home },
    { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
    { id: "appointments", label: t("appointments") || "Appointments", icon: Calendar },
    { id: "family", label: t("family") || "Care Network", icon: Users },
  ];

  const tabs = role === "caregiver" ? caregiverTabs : seniorTabs;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8EEF5] shadow-[0_-4px_24px_rgba(15,36,62,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-[60px] sm:h-[62px] px-1 sm:px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1 sm:py-1.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl transition-all duration-150 cursor-pointer min-w-0 flex-1 select-none min-h-[44px] active:scale-95 ${
                isActive
                  ? "text-[#1E6FD9] font-black"
                  : "text-[#627D98] hover:text-[#0F243E] font-bold"
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-[#E6F0FC] text-[#1E6FD9] scale-105"
                    : "text-[#627D98]"
                }`}
              >
                <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <span className="text-[10px] min-[360px]:text-[11px] truncate font-extrabold tracking-tight max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
