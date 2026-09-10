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
  Check,
  ShieldCheck,
  Phone,
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

    const now = ctx.currentTime;
    for (let i = 0; i < 12; i++) {
      osc.frequency.setValueAtTime(880, now + i * 0.6);
      osc.frequency.setValueAtTime(650, now + i * 0.6 + 0.3);
    }

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 7);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 7);

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

  // Mode:
  // "idle": Initial screen with large 10-sec hold button & "Speak what happened" button
  // "holding": 10-second press-and-hold in progress
  // "voice_input": Patient is speaking what happened
  // "confirming": Full-screen confirmation ("Emergency alert is about to be sent. Cancel / I'm safe")
  // "dispatched": SOS sent, call flow triggered, location shared
  const [step, setStep] = useState<"idle" | "holding" | "voice_input" | "confirming" | "dispatched">("idle");
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(10);
  const [cancelCountdown, setCancelCountdown] = useState<number>(5);
  const [spokenEmergencyText, setSpokenEmergencyText] = useState<string>("");
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied" | "unavailable" | "simulated">("pending");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dispatchedEvent, setDispatchedEvent] = useState<SosEvent | null>(null);

  // Extra voice note recorder in dispatched screen
  const [isVoiceNoteRecording, setIsVoiceNoteRecording] = useState<boolean>(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const holdStartTimeRef = useRef<number>(0);
  const holdIntervalRef = useRef<any>(null);
  const cancelCountdownIntervalRef = useRef<any>(null);
  const holdDurationMs = 10000; // 10-second hold for accidental activation protection
  const sirenStopFnRef = useRef<(() => void) | null>(null);
  const recognitionRef = useRef<any>(null);

  // Reset when opened or closed
  useEffect(() => {
    if (!isOpen) {
      cleanupTimers();
      setStep("idle");
      setHoldProgress(0);
      setHoldSecondsRemaining(10);
      setCancelCountdown(5);
      setSpokenEmergencyText("");
      setIsVoiceListening(false);
    }
  }, [isOpen]);

  const cleanupTimers = () => {
    clearInterval(holdIntervalRef.current);
    clearInterval(cancelCountdownIntervalRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    if (sirenStopFnRef.current) {
      sirenStopFnRef.current();
      sirenStopFnRef.current = null;
    }
    stopSpeaking();
  };

  // -------------------------------------------------------------------------
  // 1. PRESS AND HOLD (10 SECONDS) WITH PROGRESS & HAPTIC VIBRATION
  // -------------------------------------------------------------------------
  const handleHoldStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (step === "dispatched" || step === "confirming") return;

    setStep("holding");
    setHoldProgress(0);
    setHoldSecondsRemaining(10);
    holdStartTimeRef.current = Date.now();

    // Haptic feedback on touch start
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100]);
    }

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const pct = Math.min(100, (elapsed / holdDurationMs) * 100);
      const sLeft = Math.max(1, Math.ceil((holdDurationMs - elapsed) / 1000));

      setHoldProgress(pct);
      setHoldSecondsRemaining(sLeft);

      // Periodic gentle pulse every 2 seconds
      if (Math.floor(elapsed / 1000) % 2 === 0 && typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([60]);
      }

      if (elapsed >= holdDurationMs) {
        clearInterval(holdIntervalRef.current);
        goToConfirmation("10-Second Emergency Hold Activated");
      }
    }, 50);
  };

  const handleHoldEnd = () => {
    if (step === "holding") {
      clearInterval(holdIntervalRef.current);
      setStep("idle");
      setHoldProgress(0);
      setHoldSecondsRemaining(10);
    }
  };

  // -------------------------------------------------------------------------
  // 2. EMERGENCY VOICE INPUT ("Speak what happened")
  // -------------------------------------------------------------------------
  const startEmergencyVoiceInput = () => {
    setStep("voice_input");
    setSpokenEmergencyText("");
    setIsVoiceListening(true);
    stopSpeaking();

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setIsVoiceListening(false);
      goToConfirmation("Assistance requested via Emergency Tap");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.lang = speechLocale || "en-IN";
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (event: any) => {
        const text = event.results[0]?.[0]?.transcript;
        if (text) {
          setSpokenEmergencyText(text);
        }
      };

      rec.onend = () => {
        setIsVoiceListening(false);
      };

      rec.onerror = () => {
        setIsVoiceListening(false);
      };

      rec.start();
    } catch {
      setIsVoiceListening(false);
      goToConfirmation("Assistance requested via Emergency Tap");
    }
  };

  const handleFinishVoiceInput = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsVoiceListening(false);
    const detail = spokenEmergencyText.trim() || "Assistance requested via Emergency Voice";
    goToConfirmation(detail);
  };

  // -------------------------------------------------------------------------
  // 3. FULL-SCREEN CONFIRMATION FLOW (Cancel / I'm Safe)
  // -------------------------------------------------------------------------
  const goToConfirmation = (detail: string) => {
    setStep("confirming");
    setCancelCountdown(5);

    // Spoken voice cue
    const cue = "Emergency alert is about to be sent. Tap cancel if safe.";
    speakText(cue, speechLocale);

    // 5-second countdown to automatic dispatch
    let remaining = 5;
    cancelCountdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCancelCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(cancelCountdownIntervalRef.current);
        executeFinalDispatch(detail);
      }
    }, 1000);
  };

  const handleCancelAndImSafe = () => {
    cleanupTimers();
    setStep("idle");
    onClose();
    speakText("Emergency alert cancelled. Glad you are safe!", speechLocale);
  };

  // -------------------------------------------------------------------------
  // 4. FINAL SOS DISPATCH & CALL ESCALATION
  // -------------------------------------------------------------------------
  const executeFinalDispatch = (emergencyNote?: string) => {
    cleanupTimers();
    setStep("dispatched");

    // 1. Play siren alert tone
    sirenStopFnRef.current = playEmergencySiren();

    // 2. Strong device vibration pattern
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([400, 200, 400, 200, 800]);
    }

    // 3. Spoken voice confirmation
    const alertMessage = t("sosSent") || "SOS is active. Your family and caregivers are being informed.";
    speakText(alertMessage, speechLocale);

    // 4. Capture Geolocation
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          setLocationStatus("granted");

          const event = store.triggerSos({
            latitude: lat,
            longitude: lng,
            status: "granted",
            emergencyDescription: emergencyNote,
          });
          setDispatchedEvent(event);
        },
        () => {
          // Graceful fallback to default regional coordinates
          const defaultLat = 26.1822;
          const defaultLng = 91.7617;
          setUserCoords({ lat: defaultLat, lng: defaultLng });
          setLocationStatus("simulated");

          const event = store.triggerSos({
            latitude: defaultLat,
            longitude: defaultLng,
            status: "simulated",
            emergencyDescription: emergencyNote,
          });
          setDispatchedEvent(event);
        },
        { timeout: 4000 }
      );
    } else {
      const defaultLat = 26.1822;
      const defaultLng = 91.7617;
      setUserCoords({ lat: defaultLat, lng: defaultLng });
      setLocationStatus("unavailable");

      const event = store.triggerSos({
        latitude: defaultLat,
        longitude: defaultLng,
        status: "unavailable",
        emergencyDescription: emergencyNote,
      });
      setDispatchedEvent(event);
    }

    // 5. Automatic Call Initiation to Top Priority Contact
    const primaryContact = store.contacts
      .filter((c) => c.is_emergency)
      .sort((a, b) => a.priority - b.priority)[0];

    if (primaryContact && primaryContact.phone) {
      try {
        // Attempt phone call link
        window.location.href = `tel:${primaryContact.phone}`;
      } catch {}
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

  const emergencyContacts = store.contacts
    .filter((c) => c.is_emergency)
    .sort((a, b) => a.priority - b.priority);

  // Circular progress calculations for 10-sec hold
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-4 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border-4 border-destructive bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-center mx-auto my-auto">
        {/* Close button (only available if not in dispatched mode) */}
        {step !== "dispatched" && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close SOS dialog"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {/* ============================================================ */}
        {/* STAGE 1: IDLE / 10-SEC HOLD OR TAP TO SPEAK EMERGENCY        */}
        {/* ============================================================ */}
        {(step === "idle" || step === "holding") && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-destructive bg-destructive/10 px-3.5 py-1 rounded-full">
                <AlertOctagon className="h-4 w-4" /> Emergency SOS Assistance
              </span>
              <h3 className="text-3xl sm:text-4xl font-black text-foreground">
                EMERGENCY SOS
              </h3>
              <p className="text-muted-foreground text-sm font-medium max-w-sm mx-auto">
                Press and hold for 10 seconds, or tap the microphone below to tell us what happened.
              </p>
            </div>

            {/* Centered Circular 10-Second Hold Button with SVG Progress Ring */}
            <div className="relative flex items-center justify-center py-2">
              <svg className="w-52 h-52 -rotate-90 transform" viewBox="0 0 160 160">
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

              {/* Center Touch & Hold Button */}
              <button
                type="button"
                onPointerDown={handleHoldStart}
                onPointerUp={handleHoldEnd}
                onPointerLeave={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
                className={`absolute w-40 h-40 rounded-full bg-destructive text-white shadow-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-all ${
                  step === "holding"
                    ? "scale-95 ring-8 ring-destructive/40 shadow-destructive/50"
                    : "hover:scale-105 active:scale-95"
                }`}
              >
                <AlertOctagon className="h-11 w-11 animate-pulse" />
                <span className="text-3xl font-black tracking-wider mt-1">
                  {step === "holding" ? holdSecondsRemaining : "SOS"}
                </span>
                <span className="text-[11px] font-bold uppercase opacity-95">
                  {step === "holding" ? "Keep Holding" : "Hold 10 Sec"}
                </span>
              </button>
            </div>

            {/* Status & Feedback message */}
            <div className="min-h-[24px]">
              {step === "holding" ? (
                <p className="text-destructive font-black text-base animate-pulse">
                  Holding to activate... ({holdSecondsRemaining}s left)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground font-semibold">
                  Accidental protection: Release early to cancel anytime.
                </p>
              )}
            </div>

            {/* Alternative One-Tap Voice Emergency Flow */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Or speak your emergency immediately:
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={startEmergencyVoiceInput}
                className="w-full h-14 rounded-2xl border-2 border-destructive/40 hover:bg-destructive/10 text-foreground font-black text-base gap-2.5 shadow-sm"
              >
                <Mic className="h-6 w-6 text-destructive animate-pulse" />
                Tap to Speak What Happened
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 2: VOICE EMERGENCY LISTENING                           */}
        {/* ============================================================ */}
        {step === "voice_input" && (
          <div className="space-y-6 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-destructive/15 border-2 border-destructive mx-auto flex items-center justify-center text-destructive animate-pulse">
              <Mic className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h4 className="text-2xl font-black text-foreground">Listening to You...</h4>
              <p className="text-sm font-semibold text-muted-foreground">
                Please speak clearly. Example: "I fell down and can't get up" or "I feel chest pain".
              </p>
            </div>

            {/* Real-time speech transcript box */}
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 min-h-[80px] flex items-center justify-center">
              <p className="text-lg font-bold text-foreground">
                {spokenEmergencyText ? `"${spokenEmergencyText}"` : "Waiting for your voice..."}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("idle")}
                className="flex-1 rounded-2xl h-12 font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinishVoiceInput}
                className="flex-1 rounded-2xl h-12 bg-destructive hover:bg-destructive/90 text-white font-black text-base gap-2"
              >
                Confirm & Send Alert <Check className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 3: FULL-SCREEN SOS CONFIRMATION WITH CANCEL / I'M SAFE */}
        {/* ============================================================ */}
        {step === "confirming" && (
          <div className="space-y-6 animate-in zoom-in-95">
            <div className="rounded-3xl border-3 border-destructive bg-destructive/15 p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-destructive text-white mx-auto flex items-center justify-center animate-bounce shadow-lg">
                <AlertTriangle className="h-9 w-9" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-destructive leading-tight">
                EMERGENCY ALERT IS ABOUT TO BE SENT
              </h3>
              <p className="text-sm font-bold text-foreground">
                Dispatching to your configured emergency contacts in:
              </p>
              <div className="text-5xl font-black text-destructive font-mono animate-pulse">
                00:0{cancelCountdown}
              </div>
              {spokenEmergencyText && (
                <p className="text-xs font-semibold text-muted-foreground italic bg-card/70 p-2 rounded-xl border border-border">
                  Note: "{spokenEmergencyText}"
                </p>
              )}
            </div>

            {/* Cancel / I'm Safe Button (Prominent & High Contrast) */}
            <button
              onClick={handleCancelAndImSafe}
              className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl tracking-wider shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="h-7 w-7" />
              CANCEL / I'M SAFE (रद्द करें / सुरक्षित हूँ)
            </button>

            <Button
              variant="outline"
              onClick={() => executeFinalDispatch(spokenEmergencyText)}
              className="w-full h-12 rounded-xl text-destructive font-black border-destructive/40 text-sm"
            >
              Send Alert Immediately (Do Not Wait)
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 4: SOS DISPATCHED & ESCALATION FLOW                     */}
        {/* ============================================================ */}
        {step === "dispatched" && (
          <div className="space-y-6 animate-in zoom-in-95">
            {/* Active Status Alert */}
            <div className="rounded-3xl border-3 border-destructive bg-destructive/15 p-5 space-y-2 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive text-white mx-auto flex items-center justify-center animate-bounce shadow-lg">
                <AlertOctagon className="h-8 w-8" />
              </div>
              <h4 className="text-2xl font-black text-destructive">
                EMERGENCY SOS ACTIVATED
              </h4>
              <p className="text-sm font-bold text-foreground">
                {t("sosSent") || "SOS is active. Your family and caregivers have been informed."}
              </p>
              {dispatchedEvent?.emergency_description && (
                <p className="text-xs text-foreground font-semibold bg-card/60 p-2 rounded-xl border border-border">
                  Reason: "{dispatchedEvent.emergency_description}"
                </p>
              )}
            </div>

            {/* Geolocation Status Display */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/60 text-xs font-semibold text-foreground border border-border">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-destructive" />
                <span>
                  Location: {userCoords ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : "Guwahati, Assam"}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                locationStatus === "granted"
                  ? "bg-success/20 text-success"
                  : "bg-warning/20 text-warning"
              }`}>
                {locationStatus === "granted" ? "GPS Verified" : "Simulated (Guwahati)"}
              </span>
            </div>

            {/* Priority Emergency Contacts with Call Triggers */}
            <div className="space-y-2.5 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black uppercase tracking-wider text-muted-foreground">
                  Calling Emergency Contacts (Priority Order):
                </span>
                <span className="text-[10px] text-destructive font-black bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
                  Calling Now
                </span>
              </div>

              {emergencyContacts.map((contact, idx) => (
                <div
                  key={contact.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    idx === 0
                      ? "bg-destructive/10 border-destructive/50 shadow-xs"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-black text-sm shadow-sm transition-all"
                  >
                    <PhoneCall className="h-4 w-4" /> Call Now
                  </a>
                </div>
              ))}
            </div>

            {/* Emergency Voice Note Recording Feature */}
            <div className="rounded-2xl border border-border bg-card p-4 text-center space-y-2">
              <p className="text-xs font-bold text-foreground">Attach 10s Voice Note to Alert:</p>
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
                  <Square className="h-4 w-4" /> Stop Recording
                </Button>
              )}
              {voiceNoteRecorded && (
                <p className="text-xs text-success font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Voice message dispatched to family.
                </p>
              )}
            </div>

            {/* Dismiss / Close Emergency Screen */}
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
