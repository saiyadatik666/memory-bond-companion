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
}: {
  store: MemoryBondStore;
  onOpenVoice: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
}) {
  const { lang, setLang, t } = useI18n();
  const unreadCount = store.notifications.filter((n) => !n.read).length;

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-10 sm:top-9 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex min-w-0 items-center gap-2 sm:gap-3 text-left group transition-all"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl aurora-surface flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 fill-white/20" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base sm:text-xl font-black tracking-tight text-foreground flex items-center gap-1.5">
              MEMORY BOND
              <span className="hidden md:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                AI Companion
              </span>
            </h1>
            <p className="truncate text-xs text-muted-foreground hidden sm:block">
              {t("tagline") || "A calm companion for memory, medicines and family"}
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

          {/* User Account / Sign In */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenAuth}
            className="hidden sm:flex rounded-2xl h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
            title="Account / Sign In"
          >
            <User className="h-5 w-5" />
          </Button>

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

