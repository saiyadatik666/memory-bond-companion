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
  BookOpen,
  HelpCircle,
  Settings,
  Mic,
  AlertOctagon,
  Stethoscope,
  Activity,
  WifiOff,
  Wifi,
  Sparkles,
  ShieldCheck,
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

  // Define navigational tabs based on role
  let navItems: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];

  if (role === "admin_healthcare_worker" || role === "healthcare_worker" || role === "admin") {
    navItems = [
      { id: "healthcare", label: "Triage & Admin", icon: Stethoscope },
      { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
      { id: "appointments", label: "Clinics & Visits", icon: Calendar },
      { id: "checkin", label: "Cognitive Check-In", icon: Activity },
      { id: "family", label: t("family") || "Family Links", icon: Users },
      { id: "settings", label: t("settings") || "Settings", icon: Settings },
    ];
  } else if (role === "caregiver") {
    navItems = [
      { id: "caregiver", label: "Caregiver Overview", icon: ShieldCheck },
      { id: "family", label: "Connect Caregiver & Family", icon: Users },
      { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
      { id: "reminders", label: t("reminders") || "Reminders", icon: Bell },
      { id: "appointments", label: t("appointments") || "Appointments", icon: Calendar },
      { id: "routine", label: t("routine") || "Daily Routine", icon: Sun },
      { id: "family_tree", label: "Family Tree", icon: BookOpen },
      { id: "settings", label: t("settings") || "Settings", icon: Settings },
    ];
  } else {
    // Senior Default
    navItems = [
      { id: "home", label: t("home") || "Today's Plan", icon: Home },
      { id: "medicines", label: t("medicines") || "My Medicines", icon: Pill },
      { id: "reminders", label: t("reminders") || "Reminders", icon: Bell },
      { id: "games", label: t("games") || "Brain Games", icon: Gamepad2 },
      { id: "routine", label: t("routine") || "Daily Routine & Tasks", icon: Sun },
      { id: "family_tree", label: "Family Tree", icon: Users },
      { id: "appointments", label: t("appointments") || "Doctor Visits", icon: Calendar },
      { id: "cultural", label: "Cultural Hub", icon: Compass },
      { id: "settings", label: t("settings") || "Accessibility & Settings", icon: Settings },
    ];
  }

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-card border-r border-border min-h-[calc(100vh-2.5rem)] sticky top-10 p-5 shadow-xs z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-border">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
          <Heart className="h-6 w-6 fill-primary/20 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-foreground">
              MEMORY BOND
            </span>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground truncate">
            Technology with a human heart
          </p>
        </div>
      </div>

      {/* Senior Greeting & Status */}
      <div className="my-4 p-3.5 rounded-2xl bg-secondary/50 border border-border/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-black flex items-center justify-center text-sm shadow-xs shrink-0">
          {store.profile.full_name ? store.profile.full_name.charAt(0) : "D"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {role === "caregiver" ? "Caregiver Account" : "Senior Profile"}
          </p>
          <p className="text-sm font-black text-foreground truncate">
            {store.profile.full_name || "Dadi Ji"}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 py-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer group ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground/80 hover:bg-secondary/70 hover:text-foreground"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-muted-foreground group-hover:text-primary"
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

      {/* Quick Action Card: AI Voice Companion */}
      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <div className="p-3.5 rounded-2xl bg-linear-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-950/20 dark:to-indigo-950/20 border border-primary/20 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Companion
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-foreground/80 font-medium">
            Speak anytime in Hindi, English, Gujarati, or your regional language.
          </p>
          <Button
            onClick={onOpenVoice}
            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs h-10 gap-2 shadow-xs cursor-pointer"
          >
            <Mic className="h-4 w-4" />
            <span>Open Voice Assistant</span>
          </Button>
        </div>

        {/* Emergency SOS 3-Second Hold Control */}
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
            onClick={() => store.triggerSyncNow()}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-primary text-[11px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5" /> Syncing queue
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
