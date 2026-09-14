import { useState } from "react";
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
  const { lang, setLang } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const unreadCount = store.notifications.filter((n) => !n.read).length;
  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const userDisplayName = store.profile.full_name?.trim() || "Dadaji";
  const firstName = userDisplayName.split(" ")[0] || "Dadaji";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes("game") || q.includes("puzzle")) onNavigate("games");
    else if (q.includes("med") || q.includes("pill") || q.includes("dawa")) onNavigate("medicines");
    else if (q.includes("doctor") || q.includes("appoint")) onNavigate("appointments");
    else if (q.includes("family") || q.includes("photo")) onNavigate("family_tree");
    else if (q.includes("remind") || q.includes("routine")) onNavigate("routine");
    else if (q.includes("garden")) onNavigate("routine");
    else if (q.includes("cultural") || q.includes("song")) onNavigate("cultural");
    else onOpenVoice();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8EEF5] px-4 sm:px-6 py-2.5 sm:py-3 transition-colors select-none">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Mobile / Tablet Logo (hidden on large screens because sidebar displays logo) */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => onNavigate(store.profile.role === "caregiver" ? "caregiver" : "home")}
            className="flex items-center cursor-pointer focus-visible:outline-none"
          >
            <MemoryBondLogo size="sm" />
          </button>
        </div>

        {/* Center/Left: Pill Search Bar matching reference image */}
        <form
          onSubmit={handleSearch}
          className="relative flex-1 max-w-md hidden sm:flex items-center"
        >
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#829AB1] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              aria-label="Search activities, medicines, family or voice topics"
              className="w-full h-10 pl-11 pr-4 rounded-full bg-[#F4F8FD] border border-[#E2EAF5] text-sm font-semibold text-[#0F243E] placeholder-[#829AB1] focus:outline-none focus:border-[#1E6FD9] focus:bg-white focus:ring-2 focus:ring-[#1E6FD9]/15 transition-all shadow-xs"
            />
          </div>
        </form>

        {/* Right Tools & Navigation Controls matching reference */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Language Selector Dropdown (Pill shaped with globe & chevron) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 rounded-full border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] text-[#0F243E] font-bold text-xs sm:text-sm gap-2 shadow-xs cursor-pointer focus-visible:ring-1 focus-visible:ring-[#1E6FD9]"
                aria-label="Choose Language"
              >
                <Globe className="h-4 w-4 text-[#486581]" />
                <span className="truncate max-w-[90px]">{currentLangObj.label}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#829AB1]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 max-h-[75vh] overflow-y-auto rounded-2xl p-2 bg-white border-[#E2EAF5] shadow-xl"
            >
              <div className="px-3 py-1.5 text-[11px] font-extrabold text-[#1E6FD9] uppercase tracking-wider">
                Pan-India Languages
              </div>
              {LANGUAGES.filter((l) => !l.state).map((l) => (
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
            className="relative w-10 h-10 rounded-full border border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] text-[#486581] hover:text-[#0F243E] flex items-center justify-center transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9]"
            aria-label="View Notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-white" />
            )}
          </button>

          {/* User Profile Pill matching reference image */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-10 pl-1 pr-3 rounded-full border border-[#E2EAF5] bg-white hover:bg-[#F4F8FD] flex items-center gap-2.5 transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E6FD9]"
                aria-label="User Profile"
              >
                {/* Circular Profile Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#E2EAF5] bg-[#EBF3FC]">
                  <img
                    src="/images/family_memory_hero.jpg"
                    alt={userDisplayName}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#0F243E] max-w-[120px] truncate">
                  Hello, {firstName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#829AB1] shrink-0" />
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
                  {store.profile.role === "caregiver" ? "Caregiver Account" : "Senior Account"}
                </div>
              </div>

              <DropdownMenuItem
                onClick={() => onNavigate("settings")}
                className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 hover:bg-[#F4F8FD] text-[#0F243E] flex items-center gap-2"
              >
                <Settings className="h-4 w-4 text-[#627D98]" />
                <span>Accessibility & Settings</span>
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
                  <span>Sign Out</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
