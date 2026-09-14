import React, { useState, useEffect } from "react";
import { RotateCcw, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoryBondLogo } from "./MemoryBondLogo";
import { MemoryBondPulseDots } from "./MemoryBondLoading";

interface AppLoadingScreenProps {
  error?: string | null;
  onRetry?: () => void;
  onSkip?: () => void;
}

export function AppLoadingScreen({ error, onRetry, onSkip }: AppLoadingScreenProps) {
  const [isSlow, setIsSlow] = useState(false);

  // Fail-safe timeout guard: After 3.5 seconds on slow network, offer immediate entry
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSlow(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

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
      className="min-h-screen bg-ambient flex flex-col items-center justify-center p-4 sm:p-6 select-none page-transition-enter"
    >
      <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-card/95 border border-sky-100 dark:border-border shadow-2xl p-8 sm:p-10 text-center space-y-6 backdrop-blur-md">
        {/* Official Memory Bond Logo with Generous Whitespace & Soft Ambient Glow */}
        <div className="relative mx-auto flex flex-col items-center justify-center pt-2">
          <div className="absolute inset-0 max-w-[240px] mx-auto rounded-full bg-primary/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex justify-center">
            <MemoryBondLogo variant="stacked" size="lg" className="mx-auto" priority={true} />
          </div>
        </div>

        {/* Brand Tagline & Senior Care Badge */}
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-black text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
            AI Senior Companion
          </span>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
            Technology with a human heart
          </p>
        </div>

        {/* Error Handling State if Initialization Failed */}
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
          /* Normal Clean Progress State with Subtle Pulse Dots */
          <div className="space-y-3 py-1">
            <div className="flex flex-col items-center justify-center gap-2.5">
              <MemoryBondPulseDots />
              <span className="text-xs sm:text-sm font-bold text-foreground">
                Loading your cognitive companion...
              </span>
            </div>

            {/* Fail-safe slow network fallback: NEVER leaves the user stuck */}
            {isSlow && (
              <div className="pt-2 space-y-3 border-t border-border/60 animate-in fade-in duration-300">
                <p className="text-xs text-muted-foreground font-medium">
                  Connection is slower than usual. You can continue directly:
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  {onSkip && (
                    <Button
                      onClick={onSkip}
                      className="w-full h-11 rounded-2xl font-black text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
                    >
                      <span>Continue to Memory Bond</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="w-full h-11 rounded-2xl font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reload
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
