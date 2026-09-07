import {
  Home,
  Pill,
  Bell,
  Gamepad2,
  Users,
  Sun,
  Settings,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function BottomNavigation({
  currentTab,
  onSelectTab,
  role,
}: {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  role: "senior" | "caregiver";
}) {
  const { t } = useI18n();

  const tabs =
    role === "senior"
      ? [
          { id: "home", label: t("home") || "Home", icon: Home },
          { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
          { id: "reminders", label: t("reminders") || "Reminders", icon: Bell },
          { id: "games", label: t("games") || "Games", icon: Gamepad2 },
          { id: "family", label: t("family") || "Family", icon: Users },
        ]
      : [
          { id: "caregiver", label: "Dashboard", icon: Home },
          { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
          { id: "appointments", label: t("appointments") || "Appointments", icon: Bell },
          { id: "routine", label: t("routine") || "Routine", icon: Sun },
          { id: "family", label: t("family") || "Family", icon: Users },
        ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? "text-primary font-black scale-105"
                  : "text-muted-foreground hover:text-foreground font-semibold"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
