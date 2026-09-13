import React, { useState, useMemo } from "react";
import {
  Languages,
  Globe,
  ChevronDown,
  Check,
  Search,
  Volume2,
  Sparkles,
} from "lucide-react";
import { LANGUAGES, NER_STATES, useI18n, type LangCode } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";
import { voiceManager } from "@/lib/voiceProvider";
import type { MemoryBondStore } from "@/lib/memoryBondStore";

interface RegionalLanguageSectionProps {
  store?: MemoryBondStore;
  onLanguageSelect?: (langCode: LangCode) => void;
  defaultExpanded?: boolean;
  compact?: boolean;
  className?: string;
}

export function RegionalLanguageSection({
  store,
  onLanguageSelect,
  defaultExpanded = false,
  compact = false,
  className = "",
}: RegionalLanguageSectionProps) {
  const { lang, setLang, t } = useI18n();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [selectedRegionTab, setSelectedRegionTab] = useState<string>("Pan-India");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get current language details
  const currentLang = useMemo(() => {
    return LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  }, [lang]);

  // Filter languages by selected region and optional search query
  const filteredLanguages = useMemo(() => {
    let list = LANGUAGES as readonly (typeof LANGUAGES)[number][];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(
        (l) =>
          l.label.toLowerCase().includes(q) ||
          l.native.toLowerCase().includes(q) ||
          (l.state && l.state.toLowerCase().includes(q))
      );
    }

    if (selectedRegionTab === "Pan-India") {
      return list.filter((l) => l.state === "Pan-India");
    } else if (selectedRegionTab === "All") {
      return list;
    } else {
      return list.filter(
        (l) => l.state && l.state.toLowerCase().includes(selectedRegionTab.toLowerCase())
      );
    }
  }, [selectedRegionTab, searchQuery]);

  // Handle language switch with feedback and persistence
  const handleSelect = (code: LangCode) => {
    try {
      voiceManager.stopSpeaking();
    } catch {}

    setLang(code);

    if (store) {
      const matched = LANGUAGES.find((l) => l.code === code);
      store.updateProfile({
        language: code,
        selected_ner_state: matched?.state !== "Pan-India" ? matched?.state : store.profile.selected_ner_state,
        selected_state: matched?.state || store.profile.selected_state,
      });
    }

    if (onLanguageSelect) {
      onLanguageSelect(code);
    }

    // Audible confirmation in the chosen language for elderly convenience
    try {
      const chosen = LANGUAGES.find((l) => l.code === code);
      if (chosen) {
        speakText(chosen.native, chosen.code);
      }
    } catch {}
  };

  return (
    <div
      className={`w-full rounded-3xl border-2 transition-all duration-300 ${
        isExpanded
          ? "border-primary/40 bg-card shadow-md"
          : "border-border/80 bg-card/90 hover:border-primary/30 hover:bg-card shadow-xs"
      } ${className}`}
    >
      {/* ==================================================================== */}
      {/* 1. COLLAPSED ROW / CARD HEADER (Always Visible, Elder Accessible)     */}
      {/* ==================================================================== */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className={`w-full text-left flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
          compact ? "p-4 sm:p-5" : "p-5 sm:p-6"
        }`}
      >
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
            <Languages className="h-6 w-6 text-primary" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight font-display">
                Regional & Indian Languages
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {LANGUAGES.length} Languages
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate mt-0.5">
              Choose your preferred language
            </p>
          </div>
        </div>

        {/* Selected Language Badge + Expand/Collapse Arrow */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="hidden xs:flex sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border text-foreground font-bold text-xs shadow-2xs">
            <span className="text-primary font-black">{currentLang.native}</span>
            <span className="text-muted-foreground text-[11px]">({currentLang.label})</span>
          </div>

          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center bg-secondary/50 text-foreground transition-transform duration-300 ${
              isExpanded ? "rotate-180 bg-primary/10 text-primary" : ""
            }`}
          >
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </button>

      {/* ==================================================================== */}
      {/* 2. EXPANDED PANEL (Smooth Grid of All 70 Indian & NER Languages)       */}
      {/* ==================================================================== */}
      {isExpanded && (
        <div className="border-t border-border/70 p-4 sm:p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
          {/* Helper bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>
                Currently speaking & displaying in:{" "}
                <strong className="text-foreground">{currentLang.label} ({currentLang.native})</strong>
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages or states..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              />
            </div>
          </div>

          {/* Region Tabs (Pan-India + 8 NER States + All) */}
          {!searchQuery && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {["Pan-India", ...NER_STATES, "All"].map((tab) => {
                const isActive = selectedRegionTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedRegionTab(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs scale-102"
                        : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          )}

          {/* Clean, Responsive Grid of Language Cards (Elder Friendly) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[55vh] overflow-y-auto p-1 custom-scrollbar w-full">
            {filteredLanguages.map((l) => {
              const isSelected = lang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code as LangCode)}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[76px] cursor-pointer relative select-none ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02] ring-2 ring-primary/20"
                      : "bg-secondary/30 hover:bg-secondary/70 border-border/70 hover:border-primary/40 text-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-base sm:text-lg font-black tracking-tight leading-tight">
                      {l.native}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-1 text-[11px] font-semibold opacity-85">
                    <span className="truncate">{l.label}</span>
                    {l.state && l.state !== "Pan-India" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 shrink-0">
                        {l.state.split(" ")[0]}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Collapse Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
            <span>
              Showing {filteredLanguages.length} of {LANGUAGES.length} verified languages
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="font-bold text-primary hover:underline cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
