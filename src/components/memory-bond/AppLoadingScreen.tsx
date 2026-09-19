import React, { useState, useEffect } from "react";
import { RotateCcw, ArrowRight, AlertCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoryBondLogo } from "./MemoryBondLogo";

interface AppLoadingScreenProps {
  error?: string | null;
  onRetry?: () => void;
  onSkip?: () => void;
}

export function AppLoadingScreen({ error, onRetry, onSkip }: AppLoadingScreenProps) {
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(65), 400);
    const timer2 = setTimeout(() => setProgress(100), 900);
    const timer3 = setTimeout(() => {
      if (onSkip) onSkip();
    }, 1400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onSkip]);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-ambient flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300"
    >
      <div className="w-full max-w-md rounded-3xl bg-white/98 dark:bg-card/98 border border-sky-100 dark:border-border shadow-2xl p-8 sm:p-10 text-center space-y-6 backdrop-blur-md">
        {/* Official Memory Bond Logo with Ambient Glow */}
        <div className="relative mx-auto flex flex-col items-center justify-center pt-2">
          <div className="absolute inset-0 max-w-[240px] mx-auto rounded-full bg-primary/15 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex justify-center">
            <MemoryBondLogo variant="stacked" size="lg" className="mx-auto" priority={true} />
          </div>
        </div>

        {/* Brand Information & Mission */}
        <div className="space-y-2 pt-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-primary bg-primary/10 px-4 py-1 rounded-full border border-primary/20 tracking-wider uppercase">
            <span>AI Cognitive Care for Seniors</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
            <span>Technology with a Human Heart</span>
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>

        {/* Error State */}
        {error ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-start gap-2.5 text-left text-xs text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Initialization could not complete</p>
                <p className="opacity-90 font-mono text-[11px] mt-0.5">{error}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                className="flex-1 h-12 rounded-2xl font-bold gap-2 text-sm bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" /> Try Again
              </Button>
              {onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="flex-1 h-12 rounded-2xl font-bold text-sm cursor-pointer"
                >
                  Continue Anyway
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Smooth 1-2s Progress Animation */
          <div className="space-y-4 py-2">
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pt-1">
              <span>Opening your companion...</span>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Skip</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
