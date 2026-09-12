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
  Calendar,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { UserRole } from "@/lib/memoryBondStore";
import { SosHoldControl } from "./SosHoldControl";

export function BottomNavigation({
  currentTab,
  onSelectTab,
  role,
  onOpenSos,
}: {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  role: UserRole;
  onOpenSos?: () => void;
}) {
  const { t } = useI18n();

  let tabs: { id: string; label: string; icon: any; isSos?: boolean }[] = [];

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
    // Senior (default per Section 3: Today, Medicines, Games, Family, Routine, SOS)
    tabs = [
      { id: "home", label: t("home") || "Today", icon: Home },
      { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
      { id: "games", label: t("games") || "Games", icon: Gamepad2 },
      { id: "family", label: t("family") || "Family", icon: Heart },
      { id: "routine", label: t("routine") || "Routine", icon: Calendar },
      { id: "sos", label: "SOS", icon: AlertTriangle, isSos: true },
    ];
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-xl mx-auto flex items-center justify-around py-2 px-1 sm:px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.isSos && onOpenSos) {
            return (
              <div key={tab.id} className="flex flex-col items-center justify-center min-w-0 flex-1">
                <SosHoldControl variant="bottomNav" onTrigger={onOpenSos} />
              </div>
            );
          }

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
                  isActive
                    ? "bg-primary/15 text-primary shadow-xs"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] sm:text-xs truncate font-bold tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
