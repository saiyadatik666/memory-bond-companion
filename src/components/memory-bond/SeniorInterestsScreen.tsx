import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  AlertCircle,
  Music,
  Sprout,
  BookOpen,
  Puzzle,
  Sun,
  Utensils,
  Landmark,
  Users,
  Film,
  Newspaper,
  Footprints,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoryBondLogo } from "./MemoryBondLogo";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";
import {
  SENIOR_INTERESTS_LIST,
  getSeniorInterestsTexts,
  getLocalizedInterest,
} from "@/lib/seniorInterestsData";

// Icon mapping using consistent Lucide icons
const INTEREST_LUCIDE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  music: Music,
  gardening: Sprout,
  stories: BookOpen,
  games: Puzzle,
  yoga: Sun,
  cooking: Utensils,
  culture: Landmark,
  family: Users,
  movies: Film,
  news: Newspaper,
  walking: Footprints,
  shopping: ShoppingBag,
};

interface SeniorInterestsScreenProps {
  initialInterests?: string[];
  onContinue: (selectedInterests: string[]) => void;
  onBack: () => void;
}

export function SeniorInterestsScreen({
  initialInterests = ["music", "gardening", "family"],
  onContinue,
  onBack,
}: SeniorInterestsScreenProps) {
  const { lang, speechLocale } = useI18n();

  // Find parent fallback for regional languages if present
  const currentLangObj = LANGUAGES.find((l) => l.code === lang);
  const parentFallback = currentLangObj?.parentFallback;

  // Localized texts matching global language system
  const texts = getSeniorInterestsTexts(lang, parentFallback);

  const [selectedInterests, setSelectedInterests] = useState<string[]>(() => {
    // Check if previously saved in localStorage
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("mb_senior_interests");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return initialInterests && initialInterests.length > 0
      ? initialInterests
      : ["music", "gardening", "family"];
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleInterest = (id: string, label: string) => {
    setValidationError(null);
    setSelectedInterests((prev) => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter((item) => item !== id) : [...prev, id];

      // Subtle audio feedback when selecting
      if (!isSelected) {
        try {
          speakText(label, speechLocale);
        } catch {}
      }

      return next;
    });
  };

  const handleContinue = () => {
    if (selectedInterests.length === 0) {
      setValidationError(texts.selectAlert);
      return;
    }

    try {
      localStorage.setItem("mb_senior_interests", JSON.stringify(selectedInterests));
    } catch {}

    onContinue(selectedInterests);
  };

  return (
    <div className="min-h-screen bg-[#F7FAFD] flex flex-col items-center py-4 px-3 sm:px-6 lg:px-8">
      {/* Main Container constrained to standard desktop width (max-w-[1400px]) */}
      <div className="w-full max-w-[1400px] flex flex-col min-h-[calc(100vh-2rem)] justify-between">
        
        {/* ================================================================= */}
        {/* 1. HEADER & STEP PROGRESS                                         */}
        {/* ================================================================= */}
        <header className="w-full bg-white rounded-2xl sm:rounded-3xl border border-[#E2EAF5] shadow-xs px-3.5 sm:px-6 py-2.5 sm:py-3.5 mb-5 sm:mb-6">
          <div className="flex items-center justify-between gap-2">
            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[#5B728D] hover:text-[#0F243E] hover:bg-slate-100/70 transition-all font-bold text-xs sm:text-sm cursor-pointer shrink-0"
              aria-label={texts.backBtn}
            >
              <ArrowLeft className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              <span className="hidden sm:inline">{texts.backBtn}</span>
            </button>

            {/* Logo in Center */}
            <div className="flex items-center justify-center shrink-0">
              <MemoryBondLogo variant="horizontal" size="sm" />
            </div>

            {/* Step 2 of 3 Indicator */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Progress dots bar (Desktop) */}
              <div
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50/80 border border-sky-100 text-sky-700 font-bold text-xs"
                title="Step 1: Profile | Step 2: Interests | Step 3: Personalization"
              >
                <span>Step 2 of 3</span>
                <div className="flex items-center gap-1 ml-1" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="w-3 h-0.5 bg-primary rounded-full" />
                  <span className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/25" />
                  <span className="w-3 h-0.5 bg-slate-200 rounded-full" />
                  <span className="w-2 h-2 rounded-full border border-slate-300 bg-white" />
                </div>
              </div>

              {/* Mobile compact step badge */}
              <div className="md:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 font-bold text-xs border border-sky-100">
                <span>2 / 3</span>
              </div>
            </div>
          </div>
        </header>

        {/* ================================================================= */}
        {/* 2. MAIN TITLE, SUBTITLE & DYNAMIC PILL                            */}
        {/* ================================================================= */}
        <section className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3 mb-5 sm:mb-6 px-2">
          {/* Subtle selected count pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200/90 text-xs sm:text-sm font-bold shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <span>
              {selectedInterests.length} {texts.selectedCount}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#0F243E] font-display tracking-tight leading-snug">
            {texts.title}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-[#5B728D] font-medium leading-relaxed max-w-xl mx-auto">
            {texts.subtitle}
          </p>
        </section>

        {/* Validation Error Alert if none selected */}
        {validationError && (
          <div
            role="alert"
            className="mb-4 max-w-md mx-auto p-3 sm:p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold animate-in fade-in"
          >
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. 12 INTEREST CARDS GRID                                         */}
        {/* Desktop: EXACTLY 6 columns × 2 rows (xl:grid-cols-6)              */}
        {/* Mobile: 2 columns × 6 rows (grid-cols-2)                          */}
        {/* Tablet: 3 columns / 4 columns responsive                          */}
        {/* ================================================================= */}
        <main
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-3.5 w-full flex-1 mb-6"
          role="group"
          aria-label={texts.title}
        >
          {SENIOR_INTERESTS_LIST.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            const { label, desc } = getLocalizedInterest(interest, lang, parentFallback);
            const IconComponent = INTEREST_LUCIDE_ICONS[interest.id] || Sparkles;

            return (
              <button
                key={interest.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => toggleInterest(interest.id, label)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleInterest(interest.id, label);
                  }
                }}
                className={`group relative p-3 sm:p-3.5 lg:p-4 rounded-2xl sm:rounded-3xl border-2 text-left transition-all duration-150 cursor-pointer select-none flex flex-col justify-between min-h-[125px] sm:min-h-[135px] lg:min-h-[145px] focus:outline-none focus:ring-3 focus:ring-primary/25 ${
                  isSelected
                    ? "border-primary bg-sky-50/70 shadow-xs ring-1 ring-primary/20"
                    : "border-[#E2EAF5] bg-white hover:border-sky-300/80 hover:bg-slate-50/60 shadow-2xs"
                }`}
              >
                {/* Top Row: Circular Icon Container + Selection Check Indicator */}
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isSelected
                        ? "bg-primary text-white shadow-2xs"
                        : "bg-sky-50 text-sky-700 border border-sky-100"
                    }`}
                    aria-hidden="true"
                  >
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.2]" />
                  </div>

                  {/* Elegant Selection Check Circle Indicator */}
                  <div
                    className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-2xs ring-2 ring-primary/20"
                        : "border border-slate-300 bg-slate-50/80 group-hover:border-sky-400"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Content: Title (NO ellipsis truncation, wraps naturally) & Description */}
                <div className="mt-2.5 sm:mt-3 w-full min-w-0">
                  <h2
                    className={`text-xs sm:text-sm font-black tracking-tight leading-snug line-clamp-2 ${
                      isSelected ? "text-primary" : "text-[#0F243E]"
                    }`}
                  >
                    {label}
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-[#5B728D] font-medium leading-normal line-clamp-2 mt-0.5">
                    {desc}
                  </p>
                </div>
              </button>
            );
          })}
        </main>

        {/* ================================================================= */}
        {/* 4. BOTTOM ACTION AREA                                             */}
        {/* Left: Selected count | Right: Continue Button                     */}
        {/* ================================================================= */}
        <footer className="w-full bg-white rounded-2xl sm:rounded-3xl border border-[#E2EAF5] shadow-xs px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Bottom Left Counter & Subtitle */}
          <div className="text-xs sm:text-sm font-bold text-[#5B728D] text-center sm:text-left order-2 sm:order-1">
            <span className="text-[#0F243E] font-black">{selectedInterests.length}</span>{" "}
            <span>{texts.selectedCount}</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-400">
              Memory Bond Personalization
            </span>
          </div>

          {/* Bottom Right Continue Button */}
          <Button
            type="button"
            size="lg"
            onClick={handleContinue}
            className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] h-12 sm:h-13 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-98 order-1 sm:order-2"
          >
            <span>{texts.continueBtn}</span>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </footer>
      </div>
    </div>
  );
}

