import {
  Home,
  Pill,
  Bell,
  Gamepad2,
  Users,
  Sun,
  Stethoscope,
  Activity,
  Heart,
  Compass,
  Calendar,
  Settings,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { UserRole } from "@/lib/memoryBondStore";

export function BottomNavigation({
  currentTab,
  onSelectTab,
  role,
}: {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  role: UserRole;
}) {
  const { t } = useI18n();

  let tabs: { id: string; label: string; icon: any }[] = [];

  if (role === "admin_healthcare_worker" || role === "healthcare_worker" || role === "admin") {
    tabs = [
      { id: "healthcare", label: "Triage & Admin", icon: Stethoscope },
      { id: "medicines", label: t("medicines") || "Meds", icon: Pill },
      { id: "appointments", label: "Clinics", icon: Calendar },
      { id: "checkin", label: "CES", icon: Activity },
      { id: "settings", label: "Settings", icon: Settings },
    ];
  } else if (role === "caregiver") {
    tabs = [
      { id: "caregiver", label: "Dashboard", icon: Home },
      { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
      { id: "appointments", label: t("appointments") || "Appointments", icon: Bell },
      { id: "routine", label: t("routine") || "Routine", icon: Sun },
      { id: "family", label: t("family") || "Family", icon: Users },
    ];
  } else {
    // Senior (default)
    tabs = [
      { id: "home", label: t("home") || "Home", icon: Home },
      { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
      { id: "reminders", label: t("reminders") || "Reminders", icon: Bell },
      { id: "games", label: t("games") || "Games", icon: Gamepad2 },
      { id: "cultural", label: "Culture", icon: Compass },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-lg mx-auto flex items-center justify-around py-1.5 px-1 sm:px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1 px-1 sm:px-2 rounded-2xl transition-all cursor-pointer min-w-0 flex-1 ${
                isActive
                  ? "text-primary font-black scale-105"
                  : "text-muted-foreground hover:text-foreground font-semibold"
              }`}
            >
              <div
                className={`p-1 sm:p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-primary/15 text-primary shadow-xs" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </div>
              <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-[62px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
