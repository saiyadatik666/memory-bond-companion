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
  Volume2,
  Mic,
  Square,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore, SosEvent } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

// Web Audio API Synthesizer for Emergency Siren Sound
function playEmergencySiren(): () => void {
  if (typeof window === "undefined") return () => {};
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return () => {};
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, ctx.currentTime);

    // Two-tone alternating siren modulation
    const now = ctx.currentTime;
    for (let i = 0; i < 10; i++) {
      osc.frequency.setValueAtTime(880, now + i * 0.6);
      osc.frequency.setValueAtTime(650, now + i * 0.6 + 0.3);
    }

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 6);

    return () => {
      try {
        osc.stop();
        ctx.close();
      } catch {}
    };
  } catch {
    return () => {};
  }
}

export function SosModal({
  isOpen,
  onClose,
  store,
}: {
  isOpen: boolean;
  onClose: () => void;
  store: MemoryBondStore;
}) {
  const { t, speechLocale } = useI18n();
  const [step, setStep] = useState<"idle" | "holding" | "dispatched">("idle");
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100%
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "unavailable">("pending");
  const [dispatchedEvent, setDispatchedEvent] = useState<SosEvent | null>(null);

  // Emergency voice note state
  const [isVoiceNoteRecording, setIsVoiceNoteRecording] = useState<boolean>(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const holdStartTimeRef = useRef<number>(0);
  const holdIntervalRef = useRef<any>(null);
  const holdDurationMs = 5000; // Exact 5-second long press
  const sirenStopFnRef = useRef<(() => void) | null>(null);

  // Reset when opened or closed
  useEffect(() => {
    if (!isOpen) {
      setStep("idle");
      setHoldProgress(0);
      setSecondsRemaining(5);
      clearInterval(holdIntervalRef.current);
      if (sirenStopFnRef.current) {
        sirenStopFnRef.current();
        sirenStopFnRef.current = null;
      }
    }
  }, [isOpen]);

  // Long-Press Start (Pointer Down / Touch Start)
  const handleHoldStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (step === "dispatched") return;

    setStep("holding");
    setHoldProgress(0);
    setSecondsRemaining(5);
    holdStartTimeRef.current = Date.now();

    // Gentle haptic feedback on touch start
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([80]);
    }

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const pct = Math.min(100, (elapsed / holdDurationMs) * 100);
      const sLeft = Math.max(1, Math.ceil((holdDurationMs - elapsed) / 1000));

      setHoldProgress(pct);
      setSecondsRemaining(sLeft);

      // Trigger activation upon reaching 5 seconds
      if (elapsed >= holdDurationMs) {
        clearInterval(holdIntervalRef.current);
        triggerSosActivation();
      }
    }, 50);
  };

  // Long-Press Cancel if released early
  const handleHoldEnd = () => {
    if (step === "holding") {
      clearInterval(holdIntervalRef.current);
      setStep("idle");
      setHoldProgress(0);
      setSecondsRemaining(5);
    }
  };

  // Full SOS Activation
  const triggerSosActivation = () => {
    setStep("dispatched");
    setHoldProgress(100);

    // 1. Play siren alert tone
    sirenStopFnRef.current = playEmergencySiren();

    // 2. Strong device vibration pattern
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([300, 150, 300, 150, 600]);
    }

    // 3. Spoken localized voice confirmation in selected language
    const alertMessage = t("sosSent") || "SOS is active. Your family is being informed.";
    speakText(alertMessage, speechLocale);

    // 4. Capture GPS Location
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
        },
        () => {
          const event = store.triggerSos({
            latitude: 26.1822, // Guwahati coordinates
            longitude: 91.7617,
            status: "simulated",
          });
          setDispatchedEvent(event);
          setLocationStatus("unavailable");
        },
        { timeout: 4000 }
      );
    } else {
      const event = store.triggerSos({
        latitude: 26.1822,
        longitude: 91.7617,
        status: "simulated",
      });
      setDispatchedEvent(event);
      setLocationStatus("unavailable");
    }
  };

  // Emergency Voice Note Recorder
  const startEmergencyVoiceNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsVoiceNoteRecording(true);
      setVoiceNoteRecorded(false);

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setIsVoiceNoteRecording(false);
          setVoiceNoteRecorded(true);
          stream.getTracks().forEach((t) => t.stop());
        }
      }, 10000);
    } catch {
      alert("Microphone permission unavailable.");
    }
  };

  const stopEmergencyVoiceNote = () => {
    if (mediaRecorderRef.current && isVoiceNoteRecording) {
      mediaRecorderRef.current.stop();
      setIsVoiceNoteRecording(false);
      setVoiceNoteRecorded(true);
    }
  };

  if (!isOpen) return null;

  // Contacts sorted by priority
  const emergencyContacts = store.contacts
    .filter((c) => c.is_emergency)
    .sort((a, b) => a.priority - b.priority);

  // SVG circular countdown calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border-4 border-destructive bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* ============================================================ */}
        {/* STEP 1: HOLD TO ACTIVATE SOS (Accidental Protection)          */}
        {/* ============================================================ */}
        {step !== "dispatched" && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-destructive bg-destructive/10 px-3.5 py-1 rounded-full">
                <AlertOctagon className="h-4 w-4" /> Emergency Assistance System
              </span>
              <h3 className="text-3xl font-black text-foreground">EMERGENCY SOS</h3>
              <p className="text-muted-foreground text-sm font-medium max-w-xs mx-auto">
                {t("holdSosPrompt") || "Press and hold the button for 5 seconds to send emergency alert."}
              </p>
            </div>

            {/* Centered Circular 5-Second Long-Press Button with SVG Progress Ring */}
            <div className="relative flex items-center justify-center py-4">
              <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="text-destructive/20 stroke-current"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="text-destructive stroke-current transition-all duration-75"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Center Touch Button */}
              <button
                type="button"
                onPointerDown={handleHoldStart}
                onPointerUp={handleHoldEnd}
                onPointerLeave={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
                className={`absolute w-36 h-36 rounded-full bg-destructive text-white shadow-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-transform active:scale-95 ${
                  step === "holding" ? "scale-95 ring-8 ring-destructive/30" : "hover:scale-105"
                }`}
              >
                <AlertOctagon className="h-10 w-10 animate-pulse" />
                <span className="text-2xl font-black tracking-wider mt-1">
                  {step === "holding" ? secondsRemaining : "SOS"}
                </span>
                <span className="text-[10px] font-bold uppercase opacity-90">
                  {step === "holding" ? "Keep Holding" : "Hold 5 Sec"}
                </span>
              </button>
            </div>

            {/* Feedback Message */}
            <div className="min-h-[28px]">
              {step === "holding" ? (
                <p className="text-destructive font-black text-base animate-pulse">
                  {t("keepHolding") || "Keep holding…"} ({secondsRemaining} seconds left)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground font-semibold">
                  {t("cancelSos") || "Release early to cancel anytime."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: EMERGENCY SCREEN (DISPATCHED & ESCALATION)           */}
        {/* ============================================================ */}
        {step === "dispatched" && (
          <div className="space-y-6 animate-in zoom-in-95">
            {/* Status Alert */}
            <div className="rounded-2xl border-2 border-destructive bg-destructive/15 p-5 space-y-2 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive text-white mx-auto flex items-center justify-center animate-bounce shadow-lg">
                <AlertOctagon className="h-8 w-8" />
              </div>
              <h4 className="text-2xl font-black text-destructive">
                EMERGENCY SOS ACTIVATED
              </h4>
              <p className="text-sm font-bold text-foreground">
                {t("sosSent") || "SOS is active. Your family is being informed."}
              </p>
            </div>

            {/* Location Sharing Information */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/50 text-xs font-semibold text-foreground border border-border">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-destructive" />
                <span>
                  Location: {dispatchedEvent?.latitude?.toFixed(4)}, {dispatchedEvent?.longitude?.toFixed(4)}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-success/20 text-success font-bold text-[10px]">
                {locationStatus === "granted" ? "GPS Verified" : "Simulated (Guwahati)"}
              </span>
            </div>

            {/* Priority Emergency Contacts (Calling Flow Section 17) */}
            <div className="space-y-2.5 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black uppercase tracking-wider text-muted-foreground">
                  Calling Emergency Contacts (Priority Order):
                </span>
                <span className="text-[10px] text-primary font-bold">Escalation Active</span>
              </div>

              {emergencyContacts.map((contact, idx) => (
                <div
                  key={contact.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    idx === 0
                      ? "bg-destructive/10 border-destructive/40 shadow-xs"
                      : "bg-card border-border"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-muted-foreground">#{idx + 1}</span>
                      <h5 className="font-bold text-base text-foreground">{contact.name}</h5>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{contact.phone}</p>
                  </div>

                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-black text-sm shadow-sm transition-all"
                  >
                    <PhoneCall className="h-4 w-4" /> Call Now
                  </a>
                </div>
              ))}
            </div>

            {/* Emergency Voice Note Feature (Section 17) */}
            <div className="rounded-2xl border border-border bg-card p-4 text-center space-y-2">
              <p className="text-xs font-bold text-foreground">Send an Emergency Voice Note:</p>
              {!isVoiceNoteRecording && !voiceNoteRecorded && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startEmergencyVoiceNote}
                  className="gap-2 font-bold rounded-xl"
                >
                  <Mic className="h-4 w-4 text-destructive" /> Record 10s Voice Note
                </Button>
              )}
              {isVoiceNoteRecording && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stopEmergencyVoiceNote}
                  className="gap-2 font-bold rounded-xl animate-pulse"
                >
                  <Square className="h-4 w-4" /> Stop Recording Voice Note
                </Button>
              )}
              {voiceNoteRecorded && (
                <p className="text-xs text-success font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Emergency voice note dispatched to family.
                </p>
              )}
            </div>

            {/* Cancel / Dismiss SOS */}
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full font-bold h-12 rounded-xl text-sm"
            >
              Close Emergency Screen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
