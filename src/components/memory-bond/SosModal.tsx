import { useState, useRef, useEffect } from "react";
import {
  AlertOctagon,
  X,
  PhoneCall,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore, SosEvent } from "@/lib/memoryBondStore";

export function SosModal({
  isOpen,
  onClose,
  store,
}: {
  isOpen: boolean;
  onClose: () => void;
  store: MemoryBondStore;
}) {
  // Step 1: holding (10s), Step 2: confirm dialog, Step 3: sent success
  const [step, setStep] = useState<"hold" | "confirm" | "dispatched">("hold");
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100%
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "unavailable">("pending");
  const [dispatchedEvent, setDispatchedEvent] = useState<SosEvent | null>(null);

  const holdTimerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const holdDurationMs = 10000; // 10 full seconds

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setStep("hold");
      setHoldProgress(0);
      setIsHolding(false);
      clearInterval(progressIntervalRef.current);
      clearTimeout(holdTimerRef.current);
    }
  }, [isOpen]);

  const startHold = () => {
    setIsHolding(true);
    setHoldProgress(0);

    // Haptic vibration where supported
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / holdDurationMs) * 100);
      setHoldProgress(pct);

      if (elapsed >= holdDurationMs) {
        clearInterval(progressIntervalRef.current);
        setIsHolding(false);
        setStep("confirm"); // Step 2: Confirmation modal!
      }
    }, 100);
  };

  const cancelHold = () => {
    if (step === "hold") {
      setIsHolding(false);
      setHoldProgress(0);
      clearInterval(progressIntervalRef.current);
      clearTimeout(holdTimerRef.current);
    }
  };

  const handleConfirmSendSos = () => {
    // Attempt geolocation
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const event = store.triggerSos({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            status: "granted",
          });
          setDispatchedEvent(event);
          setLocationStatus("granted");
          setStep("dispatched");
        },
        (err) => {
          const event = store.triggerSos({
            latitude: null,
            longitude: null,
            status: "unavailable",
          });
          setDispatchedEvent(event);
          setLocationStatus("unavailable");
          setStep("dispatched");
        },
        { timeout: 5000 }
      );
    } else {
      const event = store.triggerSos({
        latitude: null,
        longitude: null,
        status: "unavailable",
      });
      setDispatchedEvent(event);
      setLocationStatus("unavailable");
      setStep("dispatched");
    }
  };

  if (!isOpen) return null;

  const primaryContact = store.contacts.find((c) => c.is_emergency) || store.contacts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border-4 border-destructive bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-6 w-6" />
        </button>

        {/* STEP 1: 10-Second Press and Hold */}
        {step === "hold" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="mx-auto w-20 h-20 rounded-full bg-destructive/15 border-4 border-destructive flex items-center justify-center text-destructive animate-pulse">
                <AlertOctagon className="h-10 w-10" />
              </div>
              <h3 className="text-3xl font-black text-foreground">EMERGENCY SOS</h3>
              <p className="text-base text-muted-foreground font-medium">
                To prevent accidental triggers, press and hold the SOS button firmly for <strong>10 seconds</strong>.
              </p>
            </div>

            {/* Circular Hold Button */}
            <div className="relative mx-auto w-48 h-48 flex items-center justify-center">
              {/* Circular SVG progress ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="86"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted/30"
                  fill="transparent"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="86"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-destructive transition-all duration-100"
                  fill="transparent"
                  strokeDasharray="540"
                  strokeDashoffset={540 - (540 * holdProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>

              <button
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                className="w-36 h-36 rounded-full bg-destructive hover:bg-destructive/90 text-white font-black text-2xl shadow-2xl active:scale-95 transition-transform flex flex-col items-center justify-center select-none cursor-pointer"
              >
                <span>SOS</span>
                <span className="text-xs font-normal opacity-90 mt-1">
                  {isHolding ? "Keep holding..." : "HOLD 10s"}
                </span>
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-black text-destructive">
                {isHolding ? `${Math.ceil((100 - holdProgress) / 10)}s remaining...` : "Press & Hold SOS button"}
              </div>
              <p className="text-xs text-muted-foreground">
                Release anytime to cancel before 10 seconds.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Full-Screen Confirmation Dialog */}
        {step === "confirm" && (
          <div className="space-y-6 py-4 animate-in zoom-in-95">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/15 border-4 border-destructive flex items-center justify-center text-destructive">
              <AlertTriangle className="h-10 w-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                Send Emergency Alert?
              </h3>
              <p className="text-lg text-foreground font-semibold">
                Are you sure you want to send an emergency alert to all your trusted family contacts?
              </p>
            </div>

            <div className="rounded-2xl bg-secondary/50 p-4 text-left text-sm space-y-2 border border-border">
              <p className="font-bold text-foreground">Will notify contacts:</p>
              {store.contacts.map((c) => (
                <div key={c.id} className="flex justify-between font-medium text-muted-foreground">
                  <span>{c.name} ({c.relationship})</span>
                  <span className="font-mono">{c.phone}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setStep("hold");
                  setHoldProgress(0);
                  onClose();
                }}
                className="h-16 text-xl font-bold rounded-2xl border-2"
              >
                CANCEL
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={handleConfirmSendSos}
                className="h-16 text-xl font-black rounded-2xl bg-destructive hover:bg-destructive/90 shadow-xl"
              >
                SEND SOS
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Dispatched confirmation & Call Trigger */}
        {step === "dispatched" && (
          <div className="space-y-6 py-4 animate-in zoom-in-95">
            <div className="mx-auto w-20 h-20 rounded-full bg-success/20 border-4 border-success flex items-center justify-center text-success">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-foreground">EMERGENCY ALERT SENT</h3>
              <p className="text-muted-foreground text-base">
                Event logged and caregiver alert dispatched in-app.
              </p>
            </div>

            <div className="rounded-2xl bg-secondary/60 p-4 text-left text-sm space-y-2 border border-border">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>
                  Location:{" "}
                  {locationStatus === "granted" && dispatchedEvent?.latitude
                    ? `${dispatchedEvent.latitude.toFixed(4)}, ${dispatchedEvent.longitude?.toFixed(4)}`
                    : "Location unavailable / denied"}
                </span>
              </div>
              <div className="text-muted-foreground">
                <strong>Notified:</strong> {dispatchedEvent?.notified}
              </div>
              <div className="text-xs text-muted-foreground italic pt-1 border-t border-border">
                Note: In this working demo, alerts are recorded in the Caregiver Dashboard & notification center.
              </div>
            </div>

            {primaryContact && (
              <a
                href={`tel:${primaryContact.phone}`}
                className="inline-flex items-center justify-center gap-3 w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-lg hover:bg-primary/90 transition-all"
              >
                <PhoneCall className="h-6 w-6" /> Call {primaryContact.name}
              </a>
            )}

            <Button
              variant="outline"
              onClick={onClose}
              className="w-full h-12 font-bold rounded-2xl"
            >
              Close Emergency Screen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
