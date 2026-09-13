import React, { useState, useEffect } from "react";
import { Heart, RotateCcw, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      className="min-h-screen bg-ambient flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300"
    >
      <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-card/95 border border-sky-100 dark:border-border shadow-2xl p-8 sm:p-10 text-center space-y-6 backdrop-blur-md">
        {/* Heart Logo with Soft Glow */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/25">
            <Heart className="h-10 w-10 fill-white/25 text-white animate-pulse" />
          </div>
        </div>

        {/* Title & Brand Tagline in Consistent Clean English */}
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-black text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
            AI Senior Companion
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-display">
            MEMORY BOND
          </h1>
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
          /* Normal Clean Progress State */
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2.5 text-sm font-bold text-foreground">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span>Loading your cognitive companion...</span>
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
