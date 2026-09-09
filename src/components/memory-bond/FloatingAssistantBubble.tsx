import { useState, useRef, useEffect } from "react";
import { Mic, AlertOctagon, Info, X, ShieldAlert, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface FloatingAssistantBubbleProps {
  onOpenVoice: () => void;
  onOpenSos: () => void;
  disabled?: boolean;
}

export function FloatingAssistantBubble({
  onOpenVoice,
  onOpenSos,
  disabled = false,
}: FloatingAssistantBubbleProps) {
  const { t } = useI18n();
  const [positionY, setPositionY] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Math.min(window.innerHeight * 0.65, window.innerHeight - 150);
    }
    return 400;
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [showAndroidInfo, setShowAndroidInfo] = useState<boolean>(false);

  const pressTimerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const dragStartYRef = useRef<number>(0);
  const dragStartPosYRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  if (disabled) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    hasMovedRef.current = false;
    dragStartYRef.current = e.clientY;
    dragStartPosYRef.current = positionY;
    setIsPressed(true);
    setHoldProgress(0);

    // Progress tick towards 1.5s hold for SOS
    const startTime = Date.now();
    const duration = 1500;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setHoldProgress(pct);
    }, 50);

    pressTimerRef.current = setTimeout(() => {
      // Long press detected: Trigger SOS
      if (!hasMovedRef.current) {
        setIsPressed(false);
        setHoldProgress(0);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        // Haptic feedback if available
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([100, 50, 200]);
        }
        onOpenSos();
      }
    }, duration);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPressed) return;
    const dy = e.clientY - dragStartYRef.current;
    if (Math.abs(dy) > 8) {
      hasMovedRef.current = true;
      setIsDragging(true);
      // Cancel SOS trigger if user is dragging
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setHoldProgress(0);

      const newY = Math.max(80, Math.min(window.innerHeight - 140, dragStartPosYRef.current + dy));
      setPositionY(newY);
    }
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const wasLongPress = holdProgress >= 95;
    const moved = hasMovedRef.current;

    setIsPressed(false);
    setIsDragging(false);
    setHoldProgress(0);

    // If it was a quick tap without drag and not long press, trigger Voice Assistant
    if (!moved && !wasLongPress) {
      onOpenVoice();
    }
  };

  return (
    <>
      <div
        style={{ top: `${positionY}px` }}
        className="fixed right-4 z-40 select-none touch-none flex flex-col items-center group transition-transform duration-75 ease-out"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Floating Bubble Button */}
        <div
          className={`relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all border-3 ${
            holdProgress > 20
              ? "bg-destructive border-white scale-110 text-white"
              : "bg-primary border-white/90 text-primary-foreground hover:scale-105"
          }`}
          style={{
            boxShadow:
              holdProgress > 20
                ? "0 0 25px rgba(239, 68, 68, 0.7)"
                : "0 8px 30px rgba(13, 148, 136, 0.45)",
          }}
          title="Tap for Voice • Hold 1.5s for SOS"
        >
          {/* Circular SVG hold countdown indicator */}
          {isPressed && holdProgress > 0 && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 - (175.9 * holdProgress) / 100}
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* Icon */}
          {holdProgress > 50 ? (
            <AlertOctagon className="h-8 w-8 animate-bounce text-white" />
          ) : (
            <Mic className="h-7 w-7 text-white" />
          )}

          {/* Subtle pulse ring when idle */}
          {!isPressed && !isDragging && (
            <span className="absolute -inset-1 rounded-full border-2 border-primary/40 animate-ping pointer-events-none opacity-40" />
          )}
        </div>

        {/* Caption Label */}
        <div className="mt-1 bg-background/90 text-foreground border border-border/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm flex items-center gap-1">
          {holdProgress > 20 ? (
            <span className="text-destructive font-black">HOLD FOR SOS!</span>
          ) : (
            <>
              <span>Voice</span>
              <span className="opacity-40">•</span>
              <span className="text-destructive">SOS</span>
            </>
          )}
        </div>

        {/* Subtle native Android system overlay info trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAndroidInfo(true);
          }}
          className="mt-0.5 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 p-0.5 transition-opacity"
          title="Android System Overlay details"
        >
          <Info className="h-3 w-3" />
        </button>
      </div>

      {/* Android Overlay Explanation Modal */}
      {showAndroidInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Android Floating Companion</h3>
                  <p className="text-xs text-muted-foreground">Always-on Senior Safety Overlay</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAndroidInfo(false)}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground bg-secondary/30 p-4 rounded-2xl">
              <p className="font-medium text-foreground">
                In the native Android build of <strong>Memory Bond</strong>, this companion bubble floats
                above all third-party applications (dialer, WhatsApp, YouTube, lockscreen).
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground">SYSTEM_ALERT_WINDOW Permission:</strong> Allows
                    Memory Bond to display the floating emergency badge over the OS window manager.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Battery Optimization Whitelist:</strong> Runs
                    a lightweight background service so seniors never lose instant 1-tap voice support.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowAndroidInfo(false)}
                className="rounded-xl font-bold px-5"
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
