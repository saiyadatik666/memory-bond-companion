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

  // Mobile Bottom Navigation: Most essential sections per Section 26
  const seniorTabs = [
    { id: "home", label: t("home") || "Home", icon: Home },
    { id: "games", label: t("games") || "Games", icon: Gamepad2 },
    { id: "family_tree", label: t("family") || "Family", icon: Users },
    { id: "voice", label: "Voice", icon: Mic, isVoiceAction: true },
    { id: "settings", label: t("settings") || "Settings", icon: Settings },
  ];

  const caregiverTabs = [
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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8EEF5] shadow-[0_-4px_20px_rgba(15,36,62,0.04)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
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
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-2xl transition-all duration-200 cursor-pointer min-w-0 flex-1 select-none ${
                isActive
                  ? "text-[#1E6FD9] font-black"
                  : "text-[#627D98] hover:text-[#0F243E] font-bold"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-[#E6F0FC] text-[#1E6FD9] scale-105"
                    : tab.isVoiceAction
                    ? "bg-[#E0F2FE] text-[#0284C7]"
                    : "text-[#627D98]"
                }`}
              >
                <Icon className={`h-5 w-5 ${tab.isVoiceAction ? "animate-pulse" : ""}`} />
              </div>
              <span className="text-[11px] truncate font-black tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
