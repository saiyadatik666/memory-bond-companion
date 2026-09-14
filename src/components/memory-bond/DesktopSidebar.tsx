import React from "react";
import {
  Home,
  Gamepad2,
  Pill,
  Calendar,
  Mic,
  Users,
  Heart,
  Leaf,
  Compass,
  Bell,
  ShieldAlert,
  Settings,
  ShieldCheck,
  Sun,
} from "lucide-react";
import type { MemoryBondStore, UserRole } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { MemoryBondLogo } from "./MemoryBondLogo";

interface DesktopSidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  store: MemoryBondStore;
  onOpenVoice: () => void;
  onOpenSos: () => void;
  onOpenNotifications?: () => void;
}

export function DesktopSidebar({
  currentTab,
  onNavigate,
  store,
  onOpenVoice,
  onOpenSos,
  onOpenNotifications,
}: DesktopSidebarProps) {
  const { t } = useI18n();
  const role: UserRole = store.profile.role;
  const unreadCount = store.notifications.filter((n) => !n.read).length || 3;

  // Primary Navigation mapping based on role & matching reference image
  type NavItem = {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isAction?: boolean;
    onAction?: () => void;
  };

  const seniorNavItems: NavItem[] = [
    { id: "home", label: t("home") || "Home", icon: Home },
    { id: "games", label: t("games") || "Games", icon: Gamepad2 },
    { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
    { id: "appointments", label: t("appointments") || "Appointments", icon: Calendar },
    { id: "voice", label: "Voice AI", icon: Mic, isAction: true, onAction: onOpenVoice },
    { id: "family_tree", label: "Family Tree", icon: Users },
    { id: "journal", label: "Memories", icon: Heart },
    { id: "routine", label: "Memory Garden", icon: Leaf },
    { id: "cultural", label: "Cultural Hub", icon: Compass },
  ];

  const caregiverNavItems: NavItem[] = [
    { id: "caregiver", label: "Dashboard", icon: Home },
    { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
    { id: "appointments", label: t("appointments") || "Appointments", icon: Calendar },
    { id: "family", label: "Care Network", icon: Users },
    { id: "voice", label: "Voice AI", icon: Mic, isAction: true, onAction: onOpenVoice },
    { id: "family_tree", label: "Family Tree", icon: Users },
    { id: "routine", label: "Daily Routine", icon: Sun },
    { id: "cultural", label: "Cultural Hub", icon: Compass },
  ];

  const mainNavItems = role === "caregiver" ? caregiverNavItems : seniorNavItems;

  const secondaryNavItems: NavItem[] = [
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      isAction: true,
      onAction: onOpenNotifications,
    },
    {
      id: "sos",
      label: "SOS",
      icon: ShieldAlert,
      isAction: true,
      onAction: onOpenSos,
    },
    {
      id: "settings",
      label: t("settings") || "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      aria-label="Desktop Sidebar"
      className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 bg-white/95 backdrop-blur-md border-r border-[#E8EEF5] sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-y-auto px-4 py-4 shadow-[2px_0_16px_rgba(15,36,62,0.02)] z-20 justify-between select-none"
    >
      <div>
        {/* Navigation Category Header with Official Brand Icon */}
        <div className="px-3 pb-3 pt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MemoryBondLogo variant="icon" size="xs" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#486581]">
              {role === "caregiver" ? "Caregiver Portal" : "Senior Companion"}
            </span>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
        </div>

        {/* Primary Navigation */}
        <nav aria-label="Main Navigation" className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            const handleClick = () => {
              if (item.isAction && item.onAction) {
                item.onAction();
              } else {
                onNavigate(item.id);
              }
            };

            return (
              <button
                key={item.id}
                type="button"
                onClick={handleClick}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-[14px] font-bold transition-all text-left cursor-pointer group select-none ${
                  isActive
                    ? "bg-[#E6F0FC] text-[#1E6FD9] font-black shadow-xs"
                    : "text-[#486581] hover:bg-[#F2F7FC] hover:text-[#0F243E]"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive
                      ? "text-[#1E6FD9] stroke-[2.2]"
                      : "text-[#627D98] group-hover:text-[#1E6FD9]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Subtle Divider */}
        <div className="my-4 border-t border-[#EDF2F7] mx-2" />

        {/* Secondary Navigation */}
        <nav aria-label="Secondary Navigation" className="space-y-1">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            const handleClick = () => {
              if (item.isAction && item.onAction) {
                item.onAction();
              } else {
                onNavigate(item.id);
              }
            };

            return (
              <button
                key={item.id}
                type="button"
                onClick={handleClick}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[14px] font-bold transition-all text-left cursor-pointer group select-none ${
                  isActive
                    ? "bg-[#E6F0FC] text-[#1E6FD9] font-black"
                    : "text-[#486581] hover:bg-[#F2F7FC] hover:text-[#0F243E]"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      item.id === "sos"
                        ? "text-[#DC2626]"
                        : isActive
                        ? "text-[#1E6FD9] stroke-[2.2]"
                        : "text-[#627D98] group-hover:text-[#1E6FD9]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {/* Notifications Red Count Badge */}
                {item.id === "notifications" && unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Botanical Artwork & Emotional Warmth Footer */}
      <div className="pt-6 relative mt-auto px-2 select-none pointer-events-none">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="text-[12px] font-bold text-[#627D98] leading-tight">
              Together
            </p>
            <p className="text-[12px] font-bold text-[#627D98] leading-tight">
              for a brighter
            </p>
            <p className="text-[12px] font-bold text-[#627D98] leading-tight flex items-center gap-1">
              tomorrow <span className="text-[#0284C7] font-sans">♡</span>
            </p>
          </div>

          {/* Soft Botanical Leaf Graphic matching reference bottom-left */}
          <div className="w-16 h-16 shrink-0 opacity-85">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path
                d="M 68 76 C 60 55 42 42 20 40 C 25 58 38 72 68 76 Z"
                fill="#C6E9D5"
                fillOpacity="0.75"
              />
              <path
                d="M 68 76 C 50 68 35 52 30 25 C 48 26 62 45 68 76 Z"
                fill="#D4F1DF"
                fillOpacity="0.85"
              />
              <path
                d="M 68 76 C 45 74 25 65 10 50 C 22 62 44 72 68 76 Z"
                fill="#A7DFC0"
                fillOpacity="0.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
}
