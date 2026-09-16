import { useState, useRef, useEffect } from "react";
import {
  Search,
  Globe,
  Bell,
  ChevronDown,
  Settings,
  User,
  LogOut,
  Mic,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { LANGUAGES, useI18n, NER_STATES, getLanguagesByState } from "@/lib/i18n";
import { voiceManager } from "@/lib/voiceProvider";
import { MemoryBondLogo } from "./MemoryBondLogo";

interface HeaderProps {
  store: MemoryBondStore;
  onOpenVoice: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
  onSignOut?: () => void;
}

export function Header({
  store,
  onOpenVoice,
  onOpenNotifications,
  onOpenAuth,
  onNavigate,
  onSignOut,
}: HeaderProps) {
  const { lang, setLang, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const unreadCount = store.notifications.filter((n) => !n.read).length;
  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const userDisplayName = store.profile.full_name?.trim() || "Dadaji";
  const firstName = userDisplayName.split(" ")[0] || "Dadaji";

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileSearchOpen]);

  const executeSearch = (rawQuery: string) => {
    if (!rawQuery.trim()) return;
    const q = rawQuery.toLowerCase().trim();
    if (q.includes("game") || q.includes("puzzle") || q.includes("khel") || q.includes("રમત")) onNavigate("games");
    else if (q.includes("med") || q.includes("pill") || q.includes("dawa") || q.includes("દવા")) onNavigate("medicines");
    else if (q.includes("doctor") || q.includes("appoint") || q.includes("clinic")) onNavigate("appointments");
    else if (q.includes("family") || q.includes("photo") || q.includes("tree") || q.includes("parivar") || q.includes("પરિવાર")) onNavigate("family_tree");
    else if (q.includes("remind") || q.includes("routine") || q.includes("dinacharya") || q.includes("દિનચર્યા")) onNavigate("routine");
    else if (q.includes("garden") || q.includes("plant") || q.includes("bagicha")) onNavigate("routine");
    else if (q.includes("cultural") || q.includes("song") || q.includes("festival") || q.includes("garba") || q.includes("bhajan")) onNavigate("cultural");
    else if (q.includes("caregiver") || q.includes("portal") || q.includes("dashboard")) onNavigate("caregiver");
    else if (q.includes("setting") || q.includes("profile") || q.includes("account")) onNavigate("settings");
    else if (q.includes("sos") || q.includes("emergency") || q.includes("help") || q.includes("madad")) onNavigate("home");
    else onOpenVoice();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
    setIsMobileSearchOpen(false);
  };

  const handleQuickCategory = (tab: string) => {
    onNavigate(tab);
    setIsMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8EEF5] px-3 sm:px-6 py-2 sm:py-2.5 transition-colors select-none">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-6">
        {/* Brand Logo visible on all viewports */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(store.profile.role === "caregiver" ? "caregiver" : "home")}
            className="flex items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl p-0.5 transition-transform active:scale-98"
            aria-label="Memory Bond Home"
          >
            <MemoryBondLogo variant="responsive" size="default" />
          </button>
        </div>

        {/* Center/Left: Pill Search Bar matching reference image on tablet & desktop */}
        <form
          onSubmit={handleSearch}
          className="relative flex-1 min-w-[140px] max-w-xs md:max-w-md hidden sm:flex items-center"
        >
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              aria-label="Search activities, medicines, family or voice topics"
              className="w-full h-9 sm:h-10 pl-11 pr-4 rounded-full bg-[#F4F8FD] border border-[#E2EAF5] text-sm font-semibold text-[#0F243E] placeholder-[#829AB1] focus:outline-none focus:border-[#1E6FD9] focus:bg-white focus:ring-2 focus:ring-[#1E6FD9]/15 transition-all shadow-xs"
            />
          </div>
        </form>

        {/* Right Tools & Navigation Controls matching reference */}
        <div className="flex items-center gap-1 sm:gap-2.5 md:gap-3 ml-auto shrink-0">
          {/* Mobile Search Button (Compact round button on mobile, hidden on tablet/desktop) */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            className={`sm:hidden relative w-9 h-9 rounded-full border transition-all flex items-center justify-center cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9] shrink-0 ${
              isMobileSearchOpen
                ? "bg-[#1E6FD9] text-white border-[#1E6FD9]"
                : "border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] text-[#486581] hover:text-[#0F243E]"
            }`}
            aria-label={isMobileSearchOpen ? "Close Search" : "Open Search"}
            aria-expanded={isMobileSearchOpen}
            title="Search"
          >
            {isMobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
          {/* Language Selector Dropdown (Pill shaped with globe & chevron) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 sm:h-10 px-2 sm:px-3.5 rounded-full border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] text-[#0F243E] font-bold text-xs sm:text-sm gap-1 sm:gap-2 shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-[#1E6FD9] shrink-0"
                aria-label="Choose Language"
              >
                <Globe className="h-4 w-4 text-[#486581] shrink-0" />
                <span className="hidden sm:inline truncate max-w-[90px]">{currentLangObj.label}</span>
                <span className="sm:hidden font-mono text-[11px] font-extrabold text-[#1E6FD9]">{currentLangObj.code.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#829AB1] shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 max-h-[75vh] overflow-y-auto rounded-2xl p-2 bg-white border-[#E2EAF5] shadow-xl"
            >
              <div className="px-3 py-1.5 text-[11px] font-extrabold text-[#1E6FD9] uppercase tracking-wider">
                {t("panIndiaLanguages") || t("language")}
              </div>
              {LANGUAGES.filter((l) => !l.state || l.state === "Pan-India").map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => {
                    voiceManager.stopSpeaking();
                    setLang(l.code);
                    store.updateProfile({ language: l.code });
                  }}
                  className={`rounded-xl cursor-pointer flex items-center justify-between font-bold py-2 px-3 text-xs transition-colors ${
                    lang === l.code
                      ? "bg-[#E6F0FC] text-[#1E6FD9] font-black"
                      : "hover:bg-[#F4F8FD] text-[#0F243E]"
                  }`}
                >
                  <span>{l.native}</span>
                  <span className="text-[11px] text-[#627D98] font-normal">{l.label}</span>
                </DropdownMenuItem>
              ))}

              {NER_STATES.map((stateName) => (
                <div key={stateName} className="mt-2">
                  <DropdownMenuSeparator />
                  <div className="px-3 py-1 text-[10px] font-extrabold text-[#627D98] uppercase tracking-wider">
                    {stateName} (NER)
                  </div>
                  {getLanguagesByState(stateName).map((l) => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => {
                        voiceManager.stopSpeaking();
                        setLang(l.code);
                        store.updateProfile({
                          language: l.code,
                          selected_ner_state: stateName,
                          selected_state: stateName,
                        });
                      }}
                      className={`rounded-xl cursor-pointer flex items-center justify-between font-bold py-1.5 px-3 text-xs transition-colors ${
                        lang === l.code
                          ? "bg-[#E6F0FC] text-[#1E6FD9] font-black"
                          : "hover:bg-[#F4F8FD] text-[#0F243E]"
                      }`}
                    >
                      <span>{l.native}</span>
                      <span className="text-[10px] text-[#627D98] font-normal">{l.label}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications Circular Button with Red Badge Dot */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] text-[#486581] hover:text-[#0F243E] flex items-center justify-center transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9] shrink-0"
            aria-label="View Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-white" />
            )}
          </button>

          {/* User Profile Pill matching reference image */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-9 sm:h-10 pl-1 pr-1.5 sm:pr-3 rounded-full border border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] flex items-center gap-1.5 sm:gap-2.5 transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9] shrink-0"
                aria-label="User Profile"
              >
                {/* Circular Profile Avatar */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 border border-[#E2EAF5] bg-[#EBF3FC]">
                  <img
                    src="/images/family_memory_hero.jpg"
                    alt={userDisplayName}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <span className="hidden md:inline text-xs sm:text-sm font-bold text-[#0F243E] max-w-[120px] truncate">
                  {t("welcomeBack")}, {firstName}
                </span>
                <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#829AB1] shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl p-2 bg-white border-[#E2EAF5] shadow-xl space-y-1"
            >
              <div className="px-3 py-2 border-b border-[#EDF2F7]">
                <div className="font-black text-sm text-[#0F243E] truncate">
                  {userDisplayName}
                </div>
                <div className="text-[11px] font-bold text-[#1E6FD9] uppercase tracking-wider mt-0.5">
                  {store.profile.role === "caregiver" ? t("caregiverDashboard") : t("iAmSenior")}
                </div>
              </div>

              <DropdownMenuItem
                onClick={() => onNavigate("settings")}
                className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-[#F4F8FD] text-[#0F243E] flex items-center gap-2"
              >
                <Settings className="h-4 w-4 text-[#627D98]" />
                <span>{t("settings")}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onOpenAuth}
                className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-[#F4F8FD] text-[#0F243E] flex items-center gap-2"
              >
                <User className="h-4 w-4 text-[#627D98]" />
                <span>Switch / Link Account</span>
              </DropdownMenuItem>

              {onSignOut && (
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="rounded-xl text-xs font-bold text-[#DC2626] focus:bg-[#FEE2E2] cursor-pointer py-2 px-3 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t("signOut")}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Expansion Panel */}
      {isMobileSearchOpen && (
        <div className="sm:hidden pt-2.5 pb-1 border-t border-[#E8EEF5] mt-2 animate-in slide-in-from-top-2 fade-in duration-200 space-y-2 max-w-[1600px] mx-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1] pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                aria-label="Search activities, medicines, family or voice topics"
                className="w-full h-10 pl-10 pr-8 rounded-full bg-[#F4F8FD] border border-[#1E6FD9]/40 text-sm font-semibold text-[#0F243E] placeholder-[#829AB1] focus:outline-none focus:border-[#1E6FD9] focus:bg-white focus:ring-2 focus:ring-[#1E6FD9]/20 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#829AB1] hover:text-[#0F243E] cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Button
              type="submit"
              size="sm"
              className="h-10 px-3.5 rounded-full bg-[#1E6FD9] hover:bg-[#1858ad] text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
            >
              Search
            </Button>
          </form>

          {/* Quick Senior-Friendly Category Chips for 1-Tap Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold text-[#486581] no-scrollbar">
            <span className="text-[10px] uppercase font-black tracking-wider text-[#829AB1] shrink-0 mr-0.5">
              Quick:
            </span>
            <button
              type="button"
              onClick={() => handleQuickCategory("medicines")}
              className="px-2.5 py-1 rounded-full bg-[#F4F8FD] border border-[#E2EAF5] hover:border-[#1E6FD9]/40 hover:bg-white text-[#0F243E] shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            >
              💊 {t("medicines") || "Medicines"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickCategory("games")}
              className="px-2.5 py-1 rounded-full bg-[#F4F8FD] border border-[#E2EAF5] hover:border-[#1E6FD9]/40 hover:bg-white text-[#0F243E] shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            >
              🧠 {t("games") || "Games"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickCategory("family_tree")}
              className="px-2.5 py-1 rounded-full bg-[#F4F8FD] border border-[#E2EAF5] hover:border-[#1E6FD9]/40 hover:bg-white text-[#0F243E] shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            >
              👨‍👩‍👧 {t("family") || "Family"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickCategory("appointments")}
              className="px-2.5 py-1 rounded-full bg-[#F4F8FD] border border-[#E2EAF5] hover:border-[#1E6FD9]/40 hover:bg-white text-[#0F243E] shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            >
              📅 {t("appointments") || "Appointments"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                onOpenVoice();
              }}
              className="px-2.5 py-1 rounded-full bg-[#F4F8FD] border border-[#E2EAF5] hover:border-[#1E6FD9]/40 hover:bg-white text-[#0F243E] shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            >
              🎙️ {t("qaVoiceAi") || "Voice AI"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickCategory("routine")}
              className="px-2.5 py-1 rounded-full bg-[#F4F8FD] border border-[#E2EAF5] hover:border-[#1E6FD9]/40 hover:bg-white text-[#0F243E] shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            >
              🌸 {t("routine") || "Routine"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
