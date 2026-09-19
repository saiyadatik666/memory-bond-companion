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
  Home,
  Pill,
  Calendar,
  Users,
  Sun,
  Compass,
  AlertOctagon,
  Gamepad2,
  Heart,
  Leaf,
  Check,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { MemoryBondStore, UserRole } from "@/lib/memoryBondStore";
import { LANGUAGES, useI18n, NER_STATES, getLanguagesByState } from "@/lib/i18n";
import { voiceManager } from "@/lib/voiceProvider";

export interface HeaderProps {
  store: MemoryBondStore;
  currentTab?: string;
  onOpenVoice: () => void;
  onOpenNotifications: () => void;
  onNavigate: (tab: string) => void;
  onSignOut?: () => void;
  onOpenSos?: () => void;
}

export function Header({
  store,
  currentTab = "caregiver",
  onOpenVoice,
  onOpenNotifications,
  onNavigate,
  onSignOut,
  onOpenSos,
}: HeaderProps) {
  const { lang, setLang, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const role: UserRole = store.profile.role;
  const unreadCount = store.notifications.filter((n) => !n.read).length;
  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const userDisplayName = store.profile.full_name?.trim() || (role === "caregiver" ? "Caregiver" : "Dadaji");
  const firstName = userDisplayName.split(" ")[0] || (role === "caregiver" ? "Caregiver" : "Dadaji");

  // Navigation Items according to Role
  type NavItem = {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isAction?: boolean;
    onAction?: () => void;
    isDanger?: boolean;
  };

  const caregiverNavItems: NavItem[] = [
    { id: "caregiver", label: t("caregiverDashboard") || "Dashboard", icon: Home },
    { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
    { id: "appointments", label: t("appointments") || "Appointments", icon: Calendar },
    { id: "family", label: t("family") || "Care Network", icon: Users },
    { id: "voice", label: t("qaVoiceAi") || "Voice AI", icon: Mic, isAction: true, onAction: onOpenVoice },
    { id: "family_tree", label: t("qaFamilyTree") || "Family Tree", icon: Users },
    { id: "routine", label: t("routine") || "Daily Routine", icon: Sun },
    { id: "cultural", label: t("qaCulturalHub") || "Cultural Hub", icon: Compass },
    { id: "sos", label: t("sos") || "SOS", icon: AlertOctagon, isAction: true, onAction: onOpenSos, isDanger: true },
    { id: "settings", label: t("settings") || "Settings", icon: Settings },
  ];

  const seniorNavItems: NavItem[] = [
    { id: "home", label: t("home") || "Home", icon: Home },
    { id: "games", label: t("games") || "Games", icon: Gamepad2 },
    { id: "medicines", label: t("medicines") || "Medicines", icon: Pill },
    { id: "appointments", label: t("appointments") || "Appointments", icon: Calendar },
    { id: "voice", label: t("qaVoiceAi") || "Voice AI", icon: Mic, isAction: true, onAction: onOpenVoice },
    { id: "family_tree", label: t("qaFamilyTree") || "Family Tree", icon: Users },
    { id: "journal", label: t("journal") || "Memories", icon: Heart },
    { id: "routine", label: t("qaMemoryGarden") || "Memory Garden", icon: Leaf },
    { id: "cultural", label: t("qaCulturalHub") || "Cultural Hub", icon: Compass },
    { id: "sos", label: t("sos") || "SOS", icon: AlertOctagon, isAction: true, onAction: onOpenSos, isDanger: true },
    { id: "settings", label: t("settings") || "Settings", icon: Settings },
  ];

  const mainNavItems = role === "caregiver" ? caregiverNavItems : seniorNavItems;

  // Search keyword routing matching existing logic across all languages
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
    else if (q.includes("caregiver") || q.includes("portal") || q.includes("dashboard")) onNavigate(role === "caregiver" ? "caregiver" : "home");
    else if (q.includes("setting") || q.includes("profile") || q.includes("account")) onNavigate("settings");
    else if (q.includes("sos") || q.includes("emergency") || q.includes("help") || q.includes("madad")) {
      if (onOpenSos) onOpenSos();
      else onNavigate("home");
    } else {
      onOpenVoice();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8EEF5] transition-colors select-none shadow-[0_1px_4px_rgba(15,36,62,0.03)]">
        {/* ==================================================================== */}
        {/* ROW 1: PRIMARY TOP BAR (Logo + Branding + Profile / Controls)        */}
        {/* ==================================================================== */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          {/* Left: Memory Bond Logo + Brand Name */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(role === "caregiver" ? "caregiver" : "home")}
              className="flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl p-0.5 transition-transform active:scale-98 text-left"
              aria-label="Memory Bond Home"
            >
              <img
                src="/images/brand/logo_icon.png"
                alt="Memory Bond"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0 drop-shadow-2xs"
              />
              <div className="flex flex-col leading-none">
                <span className="font-black text-base sm:text-lg md:text-xl tracking-tight text-[#0F243E]">
                  Memory Bond
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#5B728D] tracking-wide mt-0.5 hidden sm:inline">
                  Healthcare & Family Companion
                </span>
              </div>
            </button>

            {/* Desktop Role Badge (Caregiver vs Senior) — Hidden on mobile as per requirement */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-[#EBF3FC] text-[#1E6FD9] border border-[#D0E2FF] ml-1 shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{role === "caregiver" ? t("iAmCaregiver") || "Caregiver" : t("iAmSenior") || "Senior"}</span>
            </div>
          </div>

          {/* Center: Search Bar (Desktop & Tablet: sm+ only — removed from mobile home screen) */}
          <form
            onSubmit={handleSearch}
            className="relative flex-1 min-w-[180px] max-w-xs md:max-w-md lg:max-w-lg hidden sm:flex items-center mx-2"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                aria-label="Search activities, medicines, family or voice topics"
                className="w-full h-9 sm:h-10 pl-10 pr-9 rounded-full bg-[#F4F8FD] border border-[#E2EAF5] text-sm font-semibold text-[#0F243E] placeholder-[#829AB1] focus:outline-none focus:border-[#1E6FD9] focus:bg-white focus:ring-2 focus:ring-[#1E6FD9]/15 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#829AB1] hover:text-[#0F243E] p-1 cursor-pointer"
                  aria-label="Clear search input"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Right Tools & Profile Control */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 ml-auto shrink-0">
            {/* Offline indicator: compact pill when offline, unobtrusive sync dot when online */}
            {(!store.isOnline || store.offlineModeForced) ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                <span>📶</span>
                <span className="hidden xs:inline">Offline</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="h-3 w-3" />
                <span>Synced</span>
              </span>
            )}

            {/* Language Selector Dropdown (Pan-India & NER languages) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 sm:h-9 md:h-10 px-2 sm:px-3 rounded-full border-[#BAE6FD] bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0369A1] font-black text-xs sm:text-sm gap-1.5 shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0284C7] shrink-0 transition-all"
                  aria-label="Choose Language"
                  title={`Language: ${currentLangObj.native} (${currentLangObj.label})`}
                >
                  <Globe className="h-4 w-4 text-[#0284C7] shrink-0" />
                  <span className="font-bold truncate max-w-[65px] sm:max-w-[90px] md:max-w-[120px]">
                    {currentLangObj.native}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[#0284C7] shrink-0 opacity-70 hidden xs:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 max-h-[75vh] overflow-y-auto rounded-2xl p-2 bg-white border-[#E2EAF5] shadow-xl z-50"
              >
                <div className="px-3 py-1.5 text-[11px] font-extrabold text-[#0284C7] uppercase tracking-wider flex items-center justify-between">
                  <span>{t("panIndiaLanguages") || "Languages"}</span>
                  <span className="text-[10px] text-[#627D98] font-normal">22+ Supported</span>
                </div>
                {LANGUAGES.filter((l) => !l.state || l.state === "Pan-India").map((l) => {
                  const isSelected = lang === l.code;
                  return (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => {
                        voiceManager.stopSpeaking();
                        setLang(l.code);
                        store.updateProfile({ language: l.code });
                      }}
                      className={`rounded-xl cursor-pointer flex items-center justify-between font-bold py-2 px-3 text-xs transition-colors ${
                        isSelected
                          ? "bg-[#E0F2FE] text-[#0369A1] font-black"
                          : "hover:bg-[#F4F8FD] text-[#0F243E]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#0284C7] shrink-0" />}
                        <span>{l.native}</span>
                      </div>
                      <span className="text-[11px] text-[#627D98] font-normal">{l.label}</span>
                    </DropdownMenuItem>
                  );
                })}

                {NER_STATES.map((stateName) => (
                  <div key={stateName} className="mt-2">
                    <DropdownMenuSeparator />
                    <div className="px-3 py-1 text-[10px] font-extrabold text-[#627D98] uppercase tracking-wider">
                      {stateName} (NER)
                    </div>
                    {getLanguagesByState(stateName).map((l) => {
                      const isSelected = lang === l.code;
                      return (
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
                            isSelected
                              ? "bg-[#E0F2FE] text-[#0369A1] font-black"
                              : "hover:bg-[#F4F8FD] text-[#0F243E]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="h-3 w-3 text-[#0284C7] shrink-0" />}
                            <span>{l.native}</span>
                          </div>
                          <span className="text-[10px] text-[#627D98] font-normal">{l.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Bell Button with live Red Badge Dot */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] text-[#486581] hover:text-[#0F243E] flex items-center justify-center transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9] shrink-0"
              aria-label="View Notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-white" />
              )}
            </button>

            {/* Profile Button [ 👤 Profile ] — Information & Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-8 sm:h-9 md:h-10 pl-1 pr-1.5 sm:pr-3 rounded-full border border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] flex items-center gap-1.5 sm:gap-2 transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9] shrink-0"
                  aria-label="User Profile"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full overflow-hidden shrink-0 border border-[#D0E2FF] bg-[#EBF3FC]">
                    <img
                      src="/images/family_memory_hero.jpg"
                      alt={userDisplayName}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <span className="hidden sm:inline text-xs sm:text-sm font-bold text-[#0F243E] max-w-[100px] truncate">
                    {firstName}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[#829AB1] shrink-0 opacity-80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 sm:w-72 rounded-2xl p-2.5 bg-white border-[#E2EAF5] shadow-xl space-y-1.5 z-50 animate-in fade-in zoom-in-95"
              >
                {/* Profile Information Header — Non-clickable Role Label (Sections 8 & 9) */}
                <div className="px-3 py-2.5 bg-[#F8FAFD] rounded-xl border border-[#EDF2F7]">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#1E6FD9] shrink-0" />
                    <span className="font-black text-sm text-[#0F243E] truncate">
                      {userDisplayName}
                    </span>
                  </div>
                  <div className="inline-block text-[11px] font-bold text-[#1E6FD9] bg-[#EBF4FE] px-2.5 py-0.5 rounded-full border border-[#D0E2FF] mt-1.5 select-none pointer-events-none">
                    {role === "caregiver" ? "Caregiver Account" : "Senior Account"}
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Settings */}
                <DropdownMenuItem
                  onClick={() => onNavigate("settings")}
                  className="rounded-xl text-xs font-bold cursor-pointer py-2.5 px-3 hover:bg-[#F4F8FD] text-[#0F243E] flex items-center gap-2.5"
                >
                  <Settings className="h-4 w-4 text-[#627D98]" />
                  <span>{t("settings") || "Settings"}</span>
                </DropdownMenuItem>

                {/* Emergency SOS Contacts */}
                {onOpenSos && (
                  <DropdownMenuItem
                    onClick={onOpenSos}
                    className="rounded-xl text-xs font-bold text-rose-600 focus:bg-rose-50 hover:bg-rose-50 cursor-pointer py-2.5 px-3 flex items-center gap-2.5"
                  >
                    <AlertOctagon className="h-4 w-4 text-rose-600" />
                    <span>Emergency SOS Contacts</span>
                  </DropdownMenuItem>
                )}

                {/* Notifications */}
                <DropdownMenuItem
                  onClick={onOpenNotifications}
                  className="rounded-xl text-xs font-bold cursor-pointer py-2.5 px-3 hover:bg-[#F4F8FD] text-[#0F243E] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="h-4 w-4 text-[#627D98]" />
                    <span>{t("notifications") || "Notifications"}</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-destructive text-white text-[10px] font-black">
                      {unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>

                {/* Privacy */}
                <DropdownMenuItem
                  onClick={() => onNavigate("settings")}
                  className="rounded-xl text-xs font-bold cursor-pointer py-2.5 px-3 hover:bg-[#F4F8FD] text-[#0F243E] flex items-center gap-2.5"
                >
                  <Lock className="h-4 w-4 text-[#627D98]" />
                  <span>Privacy</span>
                </DropdownMenuItem>

                {onSignOut && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onSignOut}
                      className="rounded-xl text-xs font-bold text-[#DC2626] focus:bg-[#FEE2E2] hover:bg-[#FEE2E2] cursor-pointer py-2.5 px-3 flex items-center gap-2.5"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t("signOut") || "Sign out"}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Navigation Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] text-[#0F243E] flex items-center justify-center transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9] shrink-0"
              aria-label="Open Navigation Menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* ROW 2 (DESKTOP & TABLET): HORIZONTAL SECONDARY NAVIGATION            */}
        {/* ==================================================================== */}
        <div className="hidden sm:block border-t border-[#E8EEF5] bg-white/95">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
            <nav
              aria-label="Secondary Navigation"
              className="flex items-center gap-1 md:gap-1.5 py-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap select-none"
            >
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isDanger = item.isDanger;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.isAction && item.onAction) {
                        item.onAction();
                      } else {
                        onNavigate(item.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm transition-all duration-150 shrink-0 cursor-pointer ${
                      isDanger
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-extrabold shadow-2xs"
                        : isActive
                        ? "bg-[#EBF4FE] text-[#1E6FD9] font-black shadow-2xs border border-[#D0E2FF]"
                        : "text-[#5B728D] hover:text-[#0F243E] hover:bg-[#F4F8FD] font-bold"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isDanger ? "text-rose-600 animate-pulse" : isActive ? "text-[#1E6FD9]" : "text-[#7188A3]"}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* SLIDE-OVER MOBILE NAVIGATION DRAWER                                   */}
      {/* ==================================================================== */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-[#0F243E]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Drawer Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="relative w-[88vw] max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 z-10"
          >
            {/* Drawer Top Branding & Close Button */}
            <div className="p-4 border-b border-[#E8EEF5] flex items-center justify-between bg-[#F8FAFD]">
              <div className="flex items-center gap-2">
                <img
                  src="/images/brand/logo_icon.png"
                  alt="Memory Bond"
                  className="h-8 w-8 object-contain shrink-0"
                />
                <div>
                  <span className="font-extrabold text-base text-[#0F243E] block leading-tight">
                    Memory Bond
                  </span>
                  <span className="text-[10px] font-extrabold text-[#1E6FD9] uppercase tracking-wider">
                    {role === "caregiver" ? t("iAmCaregiver") || "Caregiver" : t("iAmSenior") || "Senior"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-white text-[#5B728D] hover:text-[#0F243E] transition-colors border border-[#E2EAF5] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer User Card */}
            <div className="p-4 bg-white border-b border-[#E8EEF5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#D0E2FF] bg-[#EBF3FC]">
                  <img
                    src="/images/family_memory_hero.jpg"
                    alt={userDisplayName}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-sm text-[#0F243E] truncate">
                    {userDisplayName}
                  </div>
                  <div className="inline-block text-[11px] font-bold text-[#1E6FD9] bg-[#EBF4FE] px-2.5 py-0.5 rounded-full border border-[#D0E2FF] mt-1 select-none pointer-events-none">
                    {role === "caregiver" ? "Caregiver Account" : "Senior Account"}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Language Switcher inside Mobile Drawer */}
            <div className="p-3.5 bg-[#F8FAFD] border-b border-[#E8EEF5]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#0F243E]">
                  <Globe className="h-4 w-4 text-[#0284C7]" />
                  <span>{t("language") || "Language"}</span>
                </div>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                  {currentLangObj.native}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { code: "en", label: "English" },
                  { code: "hi", label: "हिन्दी" },
                  { code: "gu", label: "ગુજરાતી" },
                  { code: "as", label: "অসমীয়া" },
                  { code: "bn", label: "বাংলা" },
                  { code: "mr", label: "मराठी" },
                ].map((quick) => (
                  <button
                    key={quick.code}
                    type="button"
                    onClick={() => {
                      voiceManager.stopSpeaking();
                      setLang(quick.code);
                      store.updateProfile({ language: quick.code });
                    }}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      lang === quick.code
                        ? "bg-[#0284C7] text-white shadow-xs font-black"
                        : "bg-white border border-[#E2EAF5] text-[#0F243E] hover:bg-[#F0F9FF]"
                    }`}
                  >
                    {quick.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Navigation List with large touch targets (min 48px) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isDanger = item.isDanger;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (item.isAction && item.onAction) {
                        item.onAction();
                      } else {
                        onNavigate(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl min-h-[48px] transition-all duration-150 cursor-pointer text-left ${
                      isDanger
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold shadow-xs"
                        : isActive
                        ? "bg-[#EBF4FE] text-[#1E6FD9] border border-[#D0E2FF] font-black shadow-xs"
                        : "hover:bg-[#F4F8FD] text-[#0F243E] border border-transparent font-bold"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isDanger
                            ? "bg-rose-100 text-rose-600"
                            : isActive
                            ? "bg-[#D0E2FF] text-[#1E6FD9]"
                            : "bg-[#F0F5FA] text-[#5B728D]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#1E6FD9]" />
                    )}
                  </button>
                );
              })}

              {/* Notifications Link inside Drawer */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenNotifications();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl min-h-[48px] hover:bg-[#F4F8FD] text-[#0F243E] font-bold cursor-pointer text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#F0F5FA] text-[#5B728D] shrink-0">
                    <Bell className="h-5 w-5" />
                  </div>
                  <span className="text-sm">{t("notifications") || "Notifications"}</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-destructive text-white text-[11px] font-black">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-[#E8EEF5] bg-[#F8FAFD] space-y-2">

              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black text-[#DC2626] bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t("signOut") || "Sign Out"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
