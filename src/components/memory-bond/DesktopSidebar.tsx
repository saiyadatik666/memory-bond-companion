import React from "react";
import {
  Heart,
  Home,
  Pill,
  Bell,
  Gamepad2,
  Users,
  Sun,
  Calendar,
  Compass,
  Settings,
  Mic,
  ShieldCheck,
  Sparkles,
  WifiOff,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore, UserRole } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { SosHoldControl } from "./SosHoldControl";

export function DesktopSidebar({
  currentTab,
  onNavigate,
  store,
  onOpenVoice,
  onOpenSos,
}: {
  currentTab: string;
  onNavigate: (tab: string) => void;
  store: MemoryBondStore;
  onOpenVoice: () => void;
  onOpenSos: () => void;
}) {
  const { t } = useI18n();
  const role: UserRole = store.profile.role;

  // Navigation Items
  let navItems: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];

  if (role === "caregiver") {
    navItems = [
      { id: "caregiver", label: "Caregiver Overview", icon: ShieldCheck },
      { id: "family", label: "Family & Care Network", icon: Users },
      { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
      { id: "reminders", label: t("reminders") || "Reminders", icon: Bell },
      { id: "appointments", label: t("appointments") || "Appointments", icon: Calendar },
      { id: "routine", label: t("routine") || "Daily Routine", icon: Sun },
      { id: "family_tree", label: "Family Tree & Memories", icon: Users },
      { id: "settings", label: t("settings") || "Settings", icon: Settings },
    ];
  } else {
    // Senior Default
    navItems = [
      { id: "home", label: t("home") || "Today's Plan", icon: Home },
      { id: "medicines", label: t("medicines") || "My Medicines", icon: Pill },
      { id: "reminders", label: t("reminders") || "Smart Reminders", icon: Bell },
      { id: "games", label: t("games") || "Brain Games", icon: Gamepad2 },
      { id: "routine", label: t("routine") || "Daily Routine", icon: Sun },
      { id: "family_tree", label: "Family Tree & Photos", icon: Users },
      { id: "appointments", label: t("appointments") || "Doctor Visits", icon: Calendar },
      { id: "cultural", label: "Cultural Heritage", icon: Compass },
      { id: "settings", label: t("settings") || "Accessibility & Settings", icon: Settings },
    ];
  }

  return (
    <aside
      aria-label="Desktop Sidebar"
      className="hidden lg:flex flex-col w-72 shrink-0 bg-card/90 backdrop-blur-md border-r border-border/80 min-h-[calc(100vh-4rem)] sticky top-14 p-5 shadow-xs z-20"
    >
      {/* User Greeting & Profile Pill */}
      <div className="p-3.5 rounded-2xl bg-secondary/70 border border-border flex items-center gap-3 shadow-xs">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white font-black flex items-center justify-center text-base shadow-sm shadow-primary/20 shrink-0">
          {store.profile.full_name ? store.profile.full_name.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary">
            {role === "caregiver" ? "Caregiver" : "Senior"}
          </p>
          <p className="text-sm font-black text-foreground truncate">
            {store.profile.full_name || "Ramesh Sharma"}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 py-4 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer group select-none ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-black"
                  : "text-foreground/80 hover:bg-secondary hover:text-foreground"
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
              </div>
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-4 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Sticky Utility Box */}
      <div className="pt-3 border-t border-border space-y-3">
        {/* Quick Action: AI Voice Companion */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50/50 border border-sky-200/70 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Companion
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-foreground/80 font-semibold leading-relaxed">
            Need help? Speak naturally anytime in your preferred language.
          </p>
          <Button
            size="sm"
            onClick={onOpenVoice}
            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs h-9 gap-2 shadow-xs cursor-pointer"
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Speak with Companion</span>
          </Button>
        </div>

        {/* Emergency SOS 3-Second Continuous Hold Control */}
        <SosHoldControl variant="sidebarButton" onTrigger={onOpenSos} />

        {/* Offline Sync Status Badge */}
        {!store.isOnline ? (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <WifiOff className="h-3.5 w-3.5 text-amber-600" /> Offline Safe
            </span>
            {store.syncQueue.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {store.syncQueue.length} pending
              </span>
            )}
          </div>
        ) : store.syncQueue.length > 0 ? (
          <button
            type="button"
            onClick={() => store.triggerSyncNow()}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-primary text-[11px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5" /> Syncing updates
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-black">
              {store.syncQueue.length}
            </span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
