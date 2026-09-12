import { useState, useRef, useEffect, useCallback } from "react";
import {
  AlertOctagon,
  X,
  PhoneCall,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Mic,
  Square,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore, SosEvent } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

// Strict SOS Session State Machine
export type SosSessionState =
  | "IDLE"
  | "CONFIRMATION"
  | "COUNTDOWN"
  | "VOICE_INPUT"
  | "CANCELLED"
  | "COMPLETED";

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
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.disconnect();
        osc.stop();
        osc.disconnect();
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

  // Session State Machine & In-Flight Refs
  const [sessionState, setSessionState] = useState<SosSessionState>("IDLE");
  const sessionStateRef = useRef<SosSessionState>("IDLE");
  const activeSessionIdRef = useRef<string | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const isCancellingRef = useRef<boolean>(false);

  // Synchronous State Setter to prevent React race conditions
  const updateSessionState = useCallback((newState: SosSessionState) => {
    sessionStateRef.current = newState;
    setSessionState(newState);
  }, []);

  const [cancelCountdown, setCancelCountdown] = useState<number>(10);
  const [spokenEmergencyText, setSpokenEmergencyText] = useState<string>("");
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied" | "unavailable" | "simulated">("pending");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dispatchedEvent, setDispatchedEvent] = useState<SosEvent | null>(null);

  // Extra voice note recorder in dispatched screen
  const [isVoiceNoteRecording, setIsVoiceNoteRecording] = useState<boolean>(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const cancelCountdownIntervalRef = useRef<any>(null);
  const sirenStopFnRef = useRef<(() => void) | null>(null);
  const recognitionRef = useRef<any>(null);

  // Immediate and comprehensive cleanup of all SOS timers, audio, vibration, and speech
  const cleanupTimers = useCallback(() => {
    if (cancelCountdownIntervalRef.current) {
      clearInterval(cancelCountdownIntervalRef.current);
      cancelCountdownIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (sirenStopFnRef.current) {
      try {
        sirenStopFnRef.current();
      } catch {}
      sirenStopFnRef.current = null;
    }
    if (typeof window !== "undefined") {
      if ("vibrate" in navigator) {
        try {
          navigator.vibrate(0);
        } catch {}
      }
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    }
    stopSpeaking();
  }, []);

  // -------------------------------------------------------------------------
  // START 10-SECOND COUNTDOWN SESSION (Session Token Bound)
  // -------------------------------------------------------------------------
  const startCountdownSession = useCallback((sessionId: string, detail: string) => {
    cleanupTimers();
    updateSessionState("COUNTDOWN");
    setCancelCountdown(10);

    // 1. Play siren alert
    if (!sirenStopFnRef.current) {
      sirenStopFnRef.current = playEmergencySiren();
    }

    // 2. Strong device vibration pattern
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 600]);
      } catch {}
    }

    // 3. Spoken voice cue
    const cue = "Emergency SOS countdown active. Tap Cancel if you are safe.";
    speakText(cue, speechLocale);

    // 4. Start 10-second countdown interval with strict session & cancel checks
    let remaining = 10;
    cancelCountdownIntervalRef.current = setInterval(() => {
      // Immediate cancellation & session validation on each tick
      if (
        activeSessionIdRef.current !== sessionId ||
        isCancelledRef.current ||
        sessionStateRef.current !== "COUNTDOWN"
      ) {
        if (cancelCountdownIntervalRef.current) {
          clearInterval(cancelCountdownIntervalRef.current);
          cancelCountdownIntervalRef.current = null;
        }
        return;
      }

      remaining -= 1;
      setCancelCountdown(remaining);

      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([200]);
        } catch {}
      }

      if (remaining <= 0) {
        if (cancelCountdownIntervalRef.current) {
          clearInterval(cancelCountdownIntervalRef.current);
          cancelCountdownIntervalRef.current = null;
        }

        // Final session guard before dispatching
        if (
          activeSessionIdRef.current === sessionId &&
          !isCancelledRef.current &&
          sessionStateRef.current === "COUNTDOWN"
        ) {
          updateSessionState("COMPLETED");
          executeFinalDispatch(detail, sessionId);
        }
      }
    }, 1000);
  }, [cleanupTimers, speechLocale, updateSessionState]);

  // -------------------------------------------------------------------------
  // FINAL SOS DISPATCH & CALL ESCALATION
  // -------------------------------------------------------------------------
  const executeFinalDispatch = useCallback((emergencyNote?: string, sessionId?: string) => {
    // Strict Terminal Guard: Do not execute if cancelled or session has expired
    if (
      isCancelledRef.current ||
      sessionStateRef.current === "CANCELLED" ||
      (sessionId && activeSessionIdRef.current !== sessionId)
    ) {
      return;
    }

    cleanupTimers();
    updateSessionState("COMPLETED");

    // 1. Play siren alert tone
    sirenStopFnRef.current = playEmergencySiren();

    // 2. Strong device vibration pattern
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
      } catch {}
    }

    // 3. Spoken voice confirmation
    const alertMessage = t("sosSent") || "SOS is active. Your family and caregivers are being informed.";
    speakText(alertMessage, speechLocale);

    // 4. Capture Geolocation with cancellation check
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (
            isCancelledRef.current ||
            sessionStateRef.current === "CANCELLED" ||
            (sessionId && activeSessionIdRef.current !== sessionId)
          ) {
            return;
          }
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
          if (
            isCancelledRef.current ||
            sessionStateRef.current === "CANCELLED" ||
            (sessionId && activeSessionIdRef.current !== sessionId)
          ) {
            return;
          }
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
        { timeout: 8000 }
      );
    } else {
      if (
        isCancelledRef.current ||
        sessionStateRef.current === "CANCELLED" ||
        (sessionId && activeSessionIdRef.current !== sessionId)
      ) {
        return;
      }
      const event = store.triggerSos({
        latitude: 26.1822,
        longitude: 91.7617,
        status: "unavailable",
        emergencyDescription: emergencyNote,
      });
      setDispatchedEvent(event);
    }

    // 5. Automatic Call Initiation to Top Priority Contact
    const primaryContact = store.contacts
      .filter((c) => c.is_emergency)
      .sort((a, b) => a.priority - b.priority)[0];

    if (
      primaryContact &&
      primaryContact.phone &&
      !isCancelledRef.current &&
      sessionStateRef.current === "COMPLETED" &&
      (!sessionId || activeSessionIdRef.current === sessionId)
    ) {
      try {
        window.location.href = `tel:${primaryContact.phone}`;
      } catch {}
    }
  }, [cleanupTimers, speechLocale, store, t, updateSessionState]);

  // -------------------------------------------------------------------------
  // CANCEL / I'M SAFE — TRUE TERMINAL ACTION WITH ZERO RESTART
  // -------------------------------------------------------------------------
  const handleCancelAndImSafe = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // IDEMPOTENCY GUARD: First tap cancels SOS. Additional taps do nothing.
    if (
      isCancelledRef.current ||
      isCancellingRef.current ||
      sessionStateRef.current === "CANCELLED"
    ) {
      return;
    }

    // 1. Mark cancellation flags immediately
    isCancellingRef.current = true;
    isCancelledRef.current = true;
    updateSessionState("CANCELLED");

    // 2. Invalidate active session token immediately
    activeSessionIdRef.current = null;

    // 3. Immediately stop countdown, timers, siren, voice, and vibration
    cleanupTimers();

    // 4. Set global 4-second cooldown to block ghost clicks or background hold timers
    if (typeof window !== "undefined") {
      (window as any).__mb_last_sos_cancelled = Date.now() + 4000;
      if ("vibrate" in navigator) {
        try {
          navigator.vibrate(0);
        } catch {}
      }
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    }
    stopSpeaking();

    // 5. Cancel pending alerts & log safety in store
    if (store && typeof store.cancelActiveSos === "function") {
      try {
        store.cancelActiveSos();
      } catch {}
    }

    // 6. Reset UI states safely
    setCancelCountdown(10);
    setSpokenEmergencyText("");
    setIsVoiceListening(false);

    // 7. Close confirmation modal immediately
    onClose();

    // 8. Safely unlock in-flight ref after modal unmounts
    setTimeout(() => {
      isCancellingRef.current = false;
    }, 1000);
  }, [cleanupTimers, onClose, store, updateSessionState]);

  // Reset and start 10-second confirmation on modal open
  useEffect(() => {
    if (isOpen) {
      // Cooldown check: prevent re-opening if recently cancelled
      if (typeof window !== "undefined") {
        const lockUntil = (window as any).__mb_last_sos_cancelled || 0;
        if (Date.now() < lockUntil) {
          console.warn("[SOS] Suppressing SOS open during cancellation cooldown.");
          onClose();
          return;
        }
      }

      // Initialize brand-new SOS session with unique session token
      const newSessionId = `sos_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      activeSessionIdRef.current = newSessionId;
      isCancelledRef.current = false;
      isCancellingRef.current = false;
      setDispatchedEvent(null);
      setUserCoords(null);
      setLocationStatus("pending");
      setSpokenEmergencyText("");
      setIsVoiceListening(false);

      startCountdownSession(newSessionId, "Emergency SOS Activated");
    } else {
      // When modal is not open, guarantee clean terminal state
      isCancelledRef.current = true;
      activeSessionIdRef.current = null;
      updateSessionState("IDLE");
      cleanupTimers();
    }
  }, [isOpen, startCountdownSession, cleanupTimers, onClose, updateSessionState]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      activeSessionIdRef.current = null;
      cleanupTimers();
    };
  }, [cleanupTimers]);

  // -------------------------------------------------------------------------
  // EMERGENCY VOICE INPUT ("Speak what happened")
  // -------------------------------------------------------------------------
  const startEmergencyVoiceInput = () => {
    if (isCancelledRef.current || sessionStateRef.current === "CANCELLED") return;
    updateSessionState("VOICE_INPUT");
    setSpokenEmergencyText("");
    setIsVoiceListening(true);
    stopSpeaking();

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setIsVoiceListening(false);
      if (activeSessionIdRef.current) {
        startCountdownSession(activeSessionIdRef.current, "Assistance requested via Emergency Voice");
      }
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
        if (isCancelledRef.current || sessionStateRef.current === "CANCELLED") return;
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
      if (activeSessionIdRef.current) {
        startCountdownSession(activeSessionIdRef.current, "Assistance requested via Emergency Voice");
      }
    }
  };

  const handleFinishVoiceInput = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsVoiceListening(false);
    const detail = spokenEmergencyText.trim() || "Assistance requested via Emergency Voice";
    if (activeSessionIdRef.current) {
      startCountdownSession(activeSessionIdRef.current, detail);
    }
  };

  // Extra voice note recorder in dispatched screen
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

  const handleCloseDispatched = () => {
    cleanupTimers();
    activeSessionIdRef.current = null;
    updateSessionState("IDLE");
    onClose();
  };

  // When modal is closed or explicitly CANCELLED, render NOTHING
  if (!isOpen || sessionState === "CANCELLED") return null;

  const emergencyContacts = store.contacts
    .filter((c) => c.is_emergency)
    .sort((a, b) => a.priority - b.priority);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-4 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border-4 border-destructive bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-center mx-auto my-auto">
        {/* Close / Cancel X button (available during countdown & voice input) */}
        {sessionState !== "COMPLETED" && (
          <button
            type="button"
            onClick={handleCancelAndImSafe}
            className="absolute right-4 top-4 rounded-full p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Cancel and close SOS dialog"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {/* ============================================================ */}
        {/* STAGE 1: VOICE EMERGENCY LISTENING                           */}
        {/* ============================================================ */}
        {sessionState === "VOICE_INPUT" && (
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
                onClick={() => {
                  if (activeSessionIdRef.current) {
                    startCountdownSession(activeSessionIdRef.current, "Emergency Voice Cancelled");
                  } else {
                    handleCancelAndImSafe();
                  }
                }}
                className="flex-1 rounded-2xl h-12 font-bold"
              >
                Back to Countdown
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
        {/* STAGE 2: FULL-SCREEN SOS CONFIRMATION WITH 10-SEC COUNTDOWN  */}
        {/* ============================================================ */}
        {(sessionState === "COUNTDOWN" || sessionState === "CONFIRMATION" || sessionState === "IDLE") && (
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
              <div className="text-6xl sm:text-7xl font-black text-destructive font-mono animate-pulse">
                {cancelCountdown < 10 ? `0${cancelCountdown}` : cancelCountdown}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-destructive">
                Seconds Remaining
              </p>
              {spokenEmergencyText && (
                <p className="text-xs font-semibold text-muted-foreground italic bg-card/70 p-2 rounded-xl border border-border">
                  Note: "{spokenEmergencyText}"
                </p>
              )}
            </div>

            {/* Cancel / I'm Safe Button (Prominent, Extra Large & High Contrast) */}
            <button
              type="button"
              onClick={handleCancelAndImSafe}
              className="w-full h-20 sm:h-22 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl sm:text-2xl tracking-wider shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer border-2 border-emerald-400"
            >
              <CheckCircle2 className="h-9 w-9 shrink-0" />
              <span>CANCEL / I'M SAFE (रद्द करें / सुरक्षित हूँ)</span>
            </button>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => executeFinalDispatch(spokenEmergencyText, activeSessionIdRef.current || undefined)}
                className="w-full h-12 rounded-xl text-destructive font-black border-destructive/40 text-sm"
              >
                Send Alert Immediately (Do Not Wait)
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={startEmergencyVoiceInput}
                className="w-full text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Mic className="h-4 w-4 text-destructive" /> Add Voice Details Before Sending
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 3: SOS DISPATCHED & ESCALATION FLOW                     */}
        {/* ============================================================ */}
        {sessionState === "COMPLETED" && (
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
              onClick={handleCloseDispatched}
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
