import React, { useState, useRef, useEffect, useCallback } from "react";
import { AlertOctagon, ShieldAlert, HeartHandshake } from "lucide-react";

export type SosHoldState = "IDLE" | "HOLDING" | "TRIGGERED" | "CANCELLED";

export interface SosHoldControlProps {
  onTrigger: () => void;
  variant?: "heroCard" | "sidebarButton" | "bottomNav" | "compactButton";
  className?: string;
  disabled?: boolean;
}

const HOLD_DURATION_MS = 3000;

export function SosHoldControl({
  onTrigger,
  variant = "compactButton",
  className = "",
  disabled = false,
}: SosHoldControlProps) {
  const [state, setState] = useState<SosHoldState>("IDLE");
  const [progress, setProgress] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(3);
  const [tapHint, setTapHint] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const tapHintTimeoutRef = useRef<any>(null);

  // Check anti-restart cooldown lock
  const isCooldownActive = useCallback(() => {
    if (typeof window === "undefined") return false;
    const lockUntil = (window as any).__mb_last_sos_cancelled || 0;
    return Date.now() < lockUntil;
  }, []);

  const cancelHold = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    activePointerIdRef.current = null;
    startTimeRef.current = 0;
    setProgress(0);
    setSecondsLeft(3);
    setState("IDLE");
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isCooldownActive()) return;

    // Only respond to primary click/touch
    if (e.button !== 0 && e.pointerType === "mouse") return;

    // Capture pointer to prevent losing tracking when dragging slightly
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      activePointerIdRef.current = e.pointerId;
    } catch {}

    setTapHint(false);
    startTimeRef.current = Date.now();
    setState("HOLDING");
    setProgress(0);
    setSecondsLeft(3);

    // Initial soft haptic cue if supported
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(50);
      } catch {}
    }

    const updateFrame = () => {
      if (startTimeRef.current === 0) return;
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      const remainingSec = Math.max(1, Math.ceil((HOLD_DURATION_MS - elapsed) / 1000));

      setProgress(pct);
      setSecondsLeft(remainingSec);

      if (elapsed >= HOLD_DURATION_MS) {
        // Continuous 3-second hold succeeded!
        cancelHold();
        setState("TRIGGERED");

        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate([150, 50, 200]);
          } catch {}
        }

        onTrigger();
      } else {
        animFrameRef.current = requestAnimationFrame(updateFrame);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateFrame);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== null && e.pointerId === activePointerIdRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }

    // If released before 3 seconds, cancel hold & show quick instruction hint if short tap
    const elapsed = startTimeRef.current > 0 ? Date.now() - startTimeRef.current : 0;
    cancelHold();

    if (elapsed > 0 && elapsed < HOLD_DURATION_MS) {
      setTapHint(true);
      if (tapHintTimeoutRef.current) clearTimeout(tapHintTimeoutRef.current);
      tapHintTimeoutRef.current = setTimeout(() => {
        setTapHint(false);
      }, 3000);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== null && e.pointerId === activePointerIdRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
    cancelHold();
  };

  // Block standard click event completely
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Clean up on unmount or blur
  useEffect(() => {
    const handleBlur = () => cancelHold();
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
      cancelHold();
      if (tapHintTimeoutRef.current) clearTimeout(tapHintTimeoutRef.current);
    };
  }, [cancelHold]);

  // ==========================================================================
  // VARIANT 1: Hero Card (Used on SeniorHome.tsx)
  // ==========================================================================
  if (variant === "heroCard") {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border-2 transition-all select-none touch-none ${
          state === "HOLDING"
            ? "border-destructive bg-destructive/10 shadow-xl scale-[0.99]"
            : "border-destructive/30 bg-card hover:border-destructive/60 shadow-md"
        } ${className}`}
      >
        {/* Progress Fill Bar */}
        <div
          className="absolute inset-0 bg-destructive/20 pointer-events-none transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />

        <div className="relative p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 z-10">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                state === "HOLDING"
                  ? "bg-destructive text-white scale-110 animate-pulse"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              <AlertOctagon className="h-9 w-9" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive">
                  24/7 Safety Guard
                </span>
                {state === "HOLDING" && (
                  <span className="text-xs font-bold text-destructive animate-pulse">
                    Holding: {secondsLeft}s left
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                Emergency SOS & Family Alert
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-md">
                Press and hold continuously for 3 seconds to alert your family & doctor.
              </p>
            </div>
          </div>

          {/* Interactive 3-Second Hold Target */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerCancel}
              onClick={handleClick}
              disabled={disabled}
              className={`relative overflow-hidden w-full sm:w-56 h-16 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg active:scale-95 ${
                state === "HOLDING"
                  ? "bg-destructive text-white ring-4 ring-destructive/40 scale-105"
                  : "bg-destructive text-white hover:bg-destructive/90"
              }`}
            >
              {/* Radial or Fill Overlay */}
              <div
                className="absolute inset-0 bg-white/30 pointer-events-none transition-all duration-75"
                style={{ width: `${progress}%` }}
              />

              <AlertOctagon className={`h-6 w-6 ${state === "HOLDING" ? "animate-spin" : "animate-pulse"}`} />
              <span className="relative z-10">
                {state === "HOLDING" ? `HOLD FOR ${secondsLeft}S...` : "HOLD 3S FOR SOS"}
              </span>
            </button>

            {tapHint && (
              <p className="text-xs font-bold text-destructive animate-bounce text-center">
                ⚠️ Hold continuously for 3 full seconds to activate.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VARIANT 2: Sidebar Button (Used on DesktopSidebar.tsx)
  // ==========================================================================
  if (variant === "sidebarButton") {
    return (
      <div className="space-y-1.5 select-none touch-none">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
          onClick={handleClick}
          disabled={disabled}
          className={`relative overflow-hidden w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            state === "HOLDING"
              ? "bg-destructive text-white ring-4 ring-destructive/40 scale-102"
              : "bg-destructive hover:bg-destructive/90 text-white"
          } ${className}`}
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-white/30 pointer-events-none transition-all duration-75"
            style={{ width: `${progress}%` }}
          />

          <AlertOctagon className={`h-5 w-5 shrink-0 ${state === "HOLDING" ? "animate-spin" : "animate-pulse"}`} />
          <span className="relative z-10 truncate">
            {state === "HOLDING" ? `HOLD FOR ${secondsLeft}S...` : "HOLD 3S FOR SOS"}
          </span>
        </button>

        {tapHint && (
          <p className="text-[11px] font-bold text-destructive animate-bounce text-center">
            ⚠️ Hold for 3s to trigger SOS.
          </p>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VARIANT 3: Mobile Bottom Navigation Item (Used on BottomNavigation.tsx)
  // ==========================================================================
  if (variant === "bottomNav") {
    return (
      <div className="relative flex flex-col items-center justify-center select-none touch-none">
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
          onClick={handleClick}
          disabled={disabled}
          className={`relative overflow-hidden w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
            state === "HOLDING"
              ? "bg-destructive text-white ring-4 ring-destructive/40 scale-110 animate-pulse"
              : "bg-destructive text-white hover:bg-destructive/90"
          } ${className}`}
          title="Press & hold 3s for SOS"
        >
          {/* Progress fill */}
          <div
            className="absolute inset-0 bg-white/35 pointer-events-none transition-all duration-75"
            style={{ height: `${progress}%`, top: "auto", bottom: 0 }}
          />

          <AlertOctagon className="h-6 w-6 relative z-10" />
        </button>
        <span className="text-[10px] font-black text-destructive uppercase tracking-wider mt-1">
          {state === "HOLDING" ? `${secondsLeft}s` : "Hold SOS"}
        </span>

        {tapHint && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-slate-900 text-white text-[10px] font-bold text-center shadow-xl animate-in fade-in z-50">
            Press & hold 3s to activate SOS
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VARIANT 4: Compact Button (Default for Footer, Tour, etc.)
  // ==========================================================================
  return (
    <div className="relative inline-block select-none touch-none">
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        onClick={handleClick}
        disabled={disabled}
        className={`relative overflow-hidden px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
          state === "HOLDING"
            ? "bg-destructive text-white ring-2 ring-destructive/40 scale-105"
            : "bg-destructive text-white hover:bg-destructive/90"
        } ${className}`}
      >
        <div
          className="absolute left-0 top-0 bottom-0 bg-white/30 pointer-events-none transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
        <AlertOctagon className="h-4 w-4 shrink-0 relative z-10" />
        <span className="relative z-10">
          {state === "HOLDING" ? `Hold ${secondsLeft}s...` : "Hold 3s SOS"}
        </span>
      </button>

      {tapHint && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold text-center shadow-lg animate-in fade-in z-50">
          Hold 3 seconds for SOS
        </div>
      )}
    </div>
  );
}
