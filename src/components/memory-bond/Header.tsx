import {
  Heart,
  Mic,
  Bell,
  Languages,
  Settings,
  User,
  Wifi,
  WifiOff,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { LANGUAGES, useI18n } from "@/lib/i18n";

export function Header({
  store,
  onOpenVoice,
  onOpenNotifications,
  onOpenAuth,
  onNavigate,
  onSignOut,
}: {
  store: MemoryBondStore;
  onOpenVoice: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
  onSignOut?: () => void;
}) {
  const { lang, setLang, t } = useI18n();
  const unreadCount = store.notifications.filter((n) => !n.read).length;
  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header className="border-b border-border/80 bg-card/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Name (Requirement 19: "Memory Bond" MUST ALWAYS remain in English) */}
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 sm:gap-3.5 text-left group transition-all cursor-pointer select-none"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-sm shadow-primary/20 group-hover:scale-105 group-active:scale-95 transition-transform">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 fill-white/30 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground font-display">
                MEMORY BOND
              </h1>
              <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Care Companion
              </span>
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground truncate hidden md:block">
              {t("tagline") || "Technology with a human heart — Elderly & Memory Care"}
            </p>
          </div>
        </button>

        {/* Right Tools & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Language Selector Dropdown (Preserving all native scripts) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl gap-1.5 font-bold text-xs h-10 px-2.5 sm:px-3.5 border-border bg-card hover:bg-secondary text-foreground cursor-pointer shadow-xs"
                title="Select language"
              >
                <Languages className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">{currentLangObj.native}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 bg-card border-border shadow-lg">
              <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Select Language
              </div>
              {LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    store.updateProfile({ language: l.code });
                  }}
                  className={`rounded-xl cursor-pointer flex items-center justify-between font-bold py-2 px-3 text-xs transition-colors ${
                    lang === l.code ? "bg-primary text-primary-foreground font-black" : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <span>{l.native}</span>
                  <span className={`text-[11px] font-normal ${lang === l.code ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {l.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Voice Assistant Quick Action */}
          <Button
            size="sm"
            onClick={onOpenVoice}
            className="rounded-2xl gap-2 font-bold text-xs h-10 px-3 sm:px-4 bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/25 cursor-pointer transition-all active:scale-95"
            title="Open AI Voice Assistant"
          >
            <Mic className="h-4 w-4 animate-pulse" />
            <span className="hidden sm:inline font-black">{t("speak")}</span>
          </Button>

          {/* Offline / Sync Queue Status */}
          {!store.isOnline ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold"
              title="Working offline. All progress saved locally."
            >
              <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden md:inline">Offline</span>
              {store.syncQueue.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                  {store.syncQueue.length}
                </span>
              )}
            </div>
          ) : store.syncQueue.length > 0 ? (
            <button
              type="button"
              onClick={() => store.triggerSyncNow()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/25 transition-colors cursor-pointer"
              title="Click to sync offline actions to cloud"
            >
              <Wifi className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sync ({store.syncQueue.length})</span>
            </button>
          ) : null}

          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenNotifications}
            className="relative rounded-2xl h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* User Profile Pill & Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl h-10 px-2.5 sm:px-3 gap-2 text-xs font-bold text-foreground border-border bg-card hover:bg-secondary cursor-pointer shadow-xs"
                title="User Profile & Settings"
              >
                <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-xs shrink-0">
                  {store.profile.full_name ? store.profile.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="hidden sm:inline truncate max-w-[90px]">
                  {store.profile.full_name.split(" ")[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-card border-border shadow-lg space-y-1">
              <div className="px-3 py-2 border-b border-border/80">
                <div className="font-black text-sm text-foreground truncate">
                  {store.profile.full_name}
                </div>
                <div className="text-[11px] font-bold text-primary uppercase tracking-wider mt-0.5">
                  {store.profile.role === "caregiver" ? "Caregiver Account" : "Senior Account"}
                </div>
              </div>

              <DropdownMenuItem
                onClick={() => onNavigate("settings")}
                className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-secondary flex items-center gap-2"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Accessibility & Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onOpenAuth}
                className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-secondary flex items-center gap-2"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Switch / Link Account</span>
              </DropdownMenuItem>

              {onSignOut && (
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="rounded-xl text-xs font-bold text-destructive focus:bg-destructive/10 cursor-pointer py-2 px-3"
                >
                  Sign Out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Settings Shortcut (Mobile/Tablet) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("settings")}
            className="rounded-2xl h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer sm:hidden"
            title="Accessibility Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
