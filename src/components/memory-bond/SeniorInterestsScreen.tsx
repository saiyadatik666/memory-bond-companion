import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  AlertCircle,
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
    <div className="min-h-screen bg-ambient flex flex-col items-center justify-center p-3.5 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl rounded-3xl bg-white border border-sky-100 shadow-xl p-5 sm:p-8 md:p-10 space-y-6 sm:space-y-8 my-4 sm:my-8">
        {/* Top Navigation & Branding Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all font-bold text-sm sm:text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={texts.backBtn}
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{texts.backBtn}</span>
          </button>

          <div className="flex items-center gap-2">
            <MemoryBondLogo variant="horizontal" size="sm" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary text-primary font-black text-xs sm:text-sm">
            <span>{texts.stepIndicator}</span>
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-primary bg-primary/10 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>{selectedInterests.length} {texts.selectedCount}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground font-display leading-tight">
            {texts.title}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
            {texts.subtitle}
          </p>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center gap-2.5 text-amber-900 font-bold text-sm sm:text-base animate-in shake"
          >
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 12 Selectable Interest Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-1"
          role="group"
          aria-label={texts.title}
        >
          {SENIOR_INTERESTS_LIST.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            const { label, desc } = getLocalizedInterest(interest, lang, parentFallback);

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
                className={`relative group p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 sm:gap-4 select-none focus:outline-none focus:ring-4 focus:ring-primary/20 ${
                  isSelected
                    ? "border-primary bg-sky-50/70 shadow-md scale-[1.015] ring-2 ring-primary/25"
                    : "border-border/90 bg-white hover:border-primary/40 hover:bg-slate-50/60 shadow-xs"
                }`}
              >
                {/* Large Recognizable Emoji Icon */}
                <div
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 transition-transform group-hover:scale-105 ${
                    isSelected
                      ? "bg-primary/15 border border-primary/20"
                      : "bg-secondary/70 border border-border"
                  }`}
                  aria-hidden="true"
                >
                  {interest.icon}
                </div>

                {/* Interest Title & Description */}
                <div className="flex-1 min-w-0 pr-2">
                  <h2
                    className={`text-base sm:text-lg font-black tracking-tight leading-snug truncate ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {label}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed mt-0.5">
                    {desc}
                  </p>
                </div>

                {/* Visual Selection Indicator (Not relying on color alone) */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-sm ring-2 ring-primary/30"
                      : "border-2 border-border/90 bg-slate-50 group-hover:border-primary/40"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Action Section with Large Primary Button */}
        <div className="pt-4 sm:pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm font-semibold text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
            <span>{selectedInterests.length} {texts.selectedCount}</span>
            <span className="mx-2">•</span>
            <span>Memory Bond Care Companion</span>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleContinue}
            className="w-full sm:w-auto min-w-[220px] sm:min-w-[260px] h-14 sm:h-16 rounded-2xl text-lg sm:text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-98 order-1 sm:order-2"
          >
            <span>{texts.continueBtn}</span>
            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
