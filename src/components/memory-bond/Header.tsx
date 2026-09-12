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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { LANGUAGES, useI18n, type LangCode } from "@/lib/i18n";

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
    <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-10 sm:top-9 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex min-w-0 items-center gap-2.5 sm:gap-3 text-left group transition-all cursor-pointer"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 fill-white/30" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base sm:text-xl font-black tracking-tight text-foreground flex items-center gap-1.5">
              MEMORY BOND
              <span className="hidden md:inline text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                Healthcare AI
              </span>
            </h1>
            <p className="truncate text-xs font-semibold text-muted-foreground hidden sm:block">
              {t("tagline") || "Technology with a human heart — Elderly & Memory Care"}
            </p>
          </div>
        </button>

        {/* Right Tools */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {/* Language Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl gap-1.5 font-bold text-xs h-10 w-10 p-0 sm:w-auto sm:px-3"
              >
                <Languages className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">{currentLangObj.native}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    store.updateProfile({ language: l.code });
                  }}
                  className={`rounded-xl cursor-pointer flex justify-between font-bold py-2 ${
                    lang === l.code ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  <span>{l.native}</span>
                  <span className="text-xs font-normal opacity-80">{l.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Voice Assistant Mic Button */}
          <Button
            onClick={onOpenVoice}
            className="rounded-2xl gap-2 font-bold text-xs h-10 w-10 p-0 sm:w-auto sm:px-4 shadow-sm bg-primary hover:bg-primary/90 text-white"
          >
            <Mic className="h-4 w-4 animate-pulse" />
            <span className="hidden sm:inline">{t("speak")}</span>
          </Button>

          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenNotifications}
            className="relative rounded-2xl h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* User Account / Sign Out Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex rounded-2xl h-10 px-2.5 gap-1.5 text-xs font-bold text-foreground border border-border"
                title="Account Profile"
              >
                <User className="h-4 w-4 text-primary" />
                <span className="truncate max-w-[85px]">{store.profile.full_name.split(" ")[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 space-y-1">
              <div className="px-2 py-1.5 border-b border-border text-xs">
                <div className="font-bold text-foreground truncate">{store.profile.full_name}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider text-primary">
                  {store.profile.role.replace("_", " ")}
                </div>
              </div>
              <DropdownMenuItem
                onClick={onOpenAuth}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Account Settings
              </DropdownMenuItem>
              {onSignOut && (
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="rounded-xl text-xs font-semibold text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  Sign Out
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Offline / Sync Queue Badge (Requirement 20 & 21) */}
          {!store.isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-warning/15 border border-warning/30 text-warning text-xs font-bold" title="Working offline. All progress saved locally.">
              <WifiOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Offline</span>
              {store.syncQueue.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-warning text-slate-950 text-[10px] font-black">
                  {store.syncQueue.length}
                </span>
              )}
            </div>
          ) : store.syncQueue.length > 0 ? (
            <button
              onClick={() => store.triggerSyncNow()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/25 transition-colors cursor-pointer"
              title="Click to sync offline actions to cloud"
            >
              <Wifi className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sync ({store.syncQueue.length})</span>
            </button>
          ) : null}

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("settings")}
            className="rounded-2xl h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>

  );
}

