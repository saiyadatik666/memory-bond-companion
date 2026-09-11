import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  X,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Languages,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  parseVoiceIntent,
  parseVoiceIntentAsync,
  speakText,
  stopSpeaking,
  isSpokenAnswer,
  type VoiceIntent,
  detectLanguage,
  pick,
  MEDICINE_TAKEN_SUCCESS_MSG,
  REMINDER_SAVED_SUCCESS_MSG,
  APPOINTMENT_SAVED_SUCCESS_MSG,
  JOURNAL_SAVED_SUCCESS_MSG,
  CANCELLED_MSG,
  ERROR_HEARING_MSG,
  RETRY_LABEL_MSG,
  BARGE_IN_HINT_MSG,
} from "@/lib/voiceParser";
import { voiceManager } from "@/lib/voiceProvider";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n, LANGUAGES } from "@/lib/i18n";

export type AssistantVoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

export function VoiceAssistantModal({
  isOpen,
  onClose,
  store,
  onNavigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  store: MemoryBondStore;
  onNavigate?: (tab: string) => void;
}) {
  const { lang, speechLocale, setLang, t } = useI18n();
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>("idle");
  const [currentLocale, setCurrentLocale] = useState<string>(speechLocale || "en-IN");
  const [transcript, setTranscript] = useState<string>("");
  const [pendingIntent, setPendingIntent] = useState<VoiceIntent | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<boolean>(true);

  // Synchronous refs to protect event loop from stale state
  const isOpenRef = useRef(isOpen);
  const isActiveSessionRef = useRef(false);
  const isThinkingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const currentLocaleRef = useRef(currentLocale);
  const listenTimeoutRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    currentLocaleRef.current = currentLocale;
  }, [currentLocale]);

  // Sync locale when global language changes
  useEffect(() => {
    const loc = speechLocale || "en-IN";
    setCurrentLocale(loc);
    currentLocaleRef.current = loc;
  }, [speechLocale]);

  // Load conversation preference
  useEffect(() => {
    const saved = localStorage.getItem("mb_conversation_mode");
    if (saved !== null) {
      setConversationMode(saved === "true");
    }
  }, []);

  const toggleConversationMode = (enabled: boolean) => {
    setConversationMode(enabled);
    localStorage.setItem("mb_conversation_mode", String(enabled));
  };

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  // -------------------------------------------------------------------------
  // Interruption / Barge-in: immediately cancel audio if speaking
  // -------------------------------------------------------------------------
  const handleBargeIn = () => {
    voiceManager.bargeIn();
    stopSpeaking();
    isSpeakingRef.current = false;
    if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
  };

  // -------------------------------------------------------------------------
  // Clean Stop: Halts session completely until user triggers mic again
  // -------------------------------------------------------------------------
  const handleStop = () => {
    isActiveSessionRef.current = false;
    if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    isThinkingRef.current = false;
    isSpeakingRef.current = false;
    handleBargeIn();
    setVoiceState("idle");
  };

  // -------------------------------------------------------------------------
  // Start Listening with Echo Guard & Hardware AEC priming
  // -------------------------------------------------------------------------
  const startListening = () => {
    if (!isOpenRef.current) return;
    handleBargeIn();
    setRecognitionError(null);
    isThinkingRef.current = false;
    isSpeakingRef.current = false;

    if (!SpeechRecognition) {
      setVoiceState("error");
      setRecognitionError(
        "Speech recognition is not supported in this browser. Please type your message below."
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Use active speech locale
      recognition.lang = currentLocaleRef.current;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState("listening");
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0]?.[0]?.transcript?.trim();
        if (!text) return;

        // Echo rejection: discard if it is an acoustic echo of assistant's own TTS voice
        if (voiceManager.isEcho(text)) {
          return;
        }

        // Barge-in: if assistant was still speaking, cancel TTS immediately
        if (isSpeakingRef.current) {
          handleBargeIn();
        }

        // Auto-detect language and maintain language consistency
        const detected = detectLanguage(text, currentLocaleRef.current);
        if (detected) {
          setCurrentLocale(detected);
          currentLocaleRef.current = detected;
          // Synchronize with i18n store if language code matched
          const langMatch = LANGUAGES.find((l) => l.speech === detected);
          if (langMatch) {
            setLang(langMatch.code);
            if (store && typeof store.updateLanguage === "function") {
              store.updateLanguage(langMatch.code);
            }
          }
        }

        setTranscript(text);
        processCommand(text, detected || currentLocaleRef.current);
      };

      recognition.onerror = (event: any) => {
        const errType = event?.error;
        if (errType === "no-speech") {
          // Senior paused or room is quiet: continue listening gracefully in continuous mode
          if (conversationMode && isOpenRef.current && isActiveSessionRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
            if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
            listenTimeoutRef.current = setTimeout(() => {
              if (isOpenRef.current && isActiveSessionRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
                startListening();
              }
            }, 300);
          }
          return;
        }

        if (errType === "aborted") {
          return;
        }

        // Hardware or permission error
        setVoiceState("error");
        setRecognitionError(pick(ERROR_HEARING_MSG, currentLocaleRef.current));
      };

      recognition.onend = () => {
        // Automatically restart listening if active session is ongoing
        if (
          conversationMode &&
          isOpenRef.current &&
          isActiveSessionRef.current &&
          !isThinkingRef.current &&
          !isSpeakingRef.current
        ) {
          if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
          listenTimeoutRef.current = setTimeout(() => {
            if (
              isOpenRef.current &&
              isActiveSessionRef.current &&
              !isThinkingRef.current &&
              !isSpeakingRef.current
            ) {
              startListening();
            }
          }, 350);
        } else if (!isThinkingRef.current && !isSpeakingRef.current) {
          setVoiceState("idle");
        }
      };

      recognition.start();
    } catch {
      setVoiceState("error");
      setRecognitionError(pick(ERROR_HEARING_MSG, currentLocaleRef.current));
    }
  };

  // -------------------------------------------------------------------------
  // Speak with Echo Guard: halts mic, speaks response, returns to listening
  // -------------------------------------------------------------------------
  const speakWithEchoGuard = (msg: string, locale: string, onFinish?: () => void) => {
    // 1. Prevent mic from picking up TTS output
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    isThinkingRef.current = false;
    isSpeakingRef.current = true;
    setVoiceState("speaking");

    speakText(msg, locale, () => {
      isSpeakingRef.current = false;
      if (store && typeof store.addConversation === "function") {
        store.addConversation(`Assistant: ${msg}`);
      }
      if (onFinish) onFinish();

      // Continuous turn loop: automatically return to listening after 350ms acoustic buffer
      if (conversationMode && isOpenRef.current && isActiveSessionRef.current) {
        if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
        listenTimeoutRef.current = setTimeout(() => {
          if (isOpenRef.current && isActiveSessionRef.current && !isThinkingRef.current) {
            startListening();
          }
        }, 350);
      } else {
        setVoiceState("idle");
      }
    });
  };

  // -------------------------------------------------------------------------
  // Process Spoken/Typed Command
  // -------------------------------------------------------------------------
  const processCommand = async (text: string, locale?: string) => {
    if (!text.trim()) return;
    handleBargeIn();
    isThinkingRef.current = true;
    setVoiceState("processing");

    if (store && typeof store.addConversation === "function") {
      store.addConversation(`User: ${text}`);
    }

    const usedLocale = locale || currentLocaleRef.current || "en-IN";

    try {
      const intent = await parseVoiceIntentAsync(text, store, usedLocale, pendingIntent);
      isThinkingRef.current = false;

      // If intent was confirming previous pending action
      if (intent.type === "CONFIRM_ACTION") {
        handleConfirmIntent();
        return;
      }

      // If intent was cancelling previous pending action
      if (intent.type === "CANCEL_ACTION") {
        handleCancelIntent();
        return;
      }

      if (intent.type === "NAVIGATE") {
        setPendingIntent(null);
        setFeedbackMessage(intent.confirmationMessage);
        speakWithEchoGuard(intent.confirmationMessage, usedLocale, () => {
          if (onNavigate) {
            onNavigate(intent.targetView);
          }
        });
        return;
      }

      if (isSpokenAnswer(intent)) {
        setPendingIntent(null);
        setFeedbackMessage(intent.message);
        speakWithEchoGuard(intent.message, usedLocale);
      } else {
        setPendingIntent(intent);
        setFeedbackMessage("");
        speakWithEchoGuard(intent.confirmationMessage, usedLocale);
      }
    } catch (err) {
      isThinkingRef.current = false;
      setVoiceState("idle");
    }
  };

  // -------------------------------------------------------------------------
  // Intent Actions with 100% Native Language Confirmation
  // -------------------------------------------------------------------------
  const handleConfirmIntent = () => {
    if (!pendingIntent) return;

    if (pendingIntent.type === "TAKE_MEDICINE") {
      const medId = pendingIntent.medicineId || store.medicines[0]?.id;
      if (medId) {
        store.takeMedicine(medId);
        speakWithEchoGuard(pick(MEDICINE_TAKEN_SUCCESS_MSG, currentLocaleRef.current), currentLocaleRef.current);
      }
    } else if (pendingIntent.type === "CREATE_REMINDER") {
      store.addReminder({
        title: pendingIntent.title,
        time: pendingIntent.time,
        type: pendingIntent.reminderType,
        date: pendingIntent.date || null,
        repeat: pendingIntent.date ? "none" : "daily",
        notes: pendingIntent.notes || "Created by Memory Bond Voice Assistant",
        active: true,
      });
      const remFn = pick(REMINDER_SAVED_SUCCESS_MSG, currentLocaleRef.current);
      speakWithEchoGuard(remFn(pendingIntent.time), currentLocaleRef.current);
    } else if (pendingIntent.type === "CREATE_APPOINTMENT") {
      store.addAppointment({
        title: pendingIntent.title,
        date: pendingIntent.date,
        time: pendingIntent.time,
        kind: "doctor",
        location: pendingIntent.location || "Clinic",
        notes: "Created via Voice Assistant",
      });
      speakWithEchoGuard(pick(APPOINTMENT_SAVED_SUCCESS_MSG, currentLocaleRef.current), currentLocaleRef.current);
    } else if (pendingIntent.type === "ADD_JOURNAL") {
      store.addJournalEntry({
        title: pendingIntent.title,
        body: pendingIntent.body,
        entry_date: new Date().toISOString().slice(0, 10),
        kind: "voice",
      });
      speakWithEchoGuard(pick(JOURNAL_SAVED_SUCCESS_MSG, currentLocaleRef.current), currentLocaleRef.current);
    } else if (pendingIntent.type === "NAVIGATE") {
      if (onNavigate) {
        onNavigate(pendingIntent.targetView);
      }
    }

    setPendingIntent(null);
    setTranscript("");
  };

  const handleCancelIntent = () => {
    setPendingIntent(null);
    setTranscript("");
    speakWithEchoGuard(pick(CANCELLED_MSG, currentLocaleRef.current), currentLocaleRef.current);
  };

  const handleRetry = () => {
    setRecognitionError(null);
    isActiveSessionRef.current = true;
    startListening();
  };

  // -------------------------------------------------------------------------
  // Lifecycle: One-time start when modal opens, clean stop when modal closes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      isActiveSessionRef.current = true;
      const timer = setTimeout(() => {
        startListening();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      handleStop();
      setPendingIntent(null);
      setTranscript("");
      setFeedbackMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentLangObj = LANGUAGES.find((l) => l.speech === currentLocale) || LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-primary/40 bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top Control Bar: STOP on left, Language Selector in center, Close on right */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
            className="rounded-full px-3.5 py-1 text-xs font-black gap-1.5 shadow-sm"
          >
            <VolumeX className="h-4 w-4" /> STOP
          </Button>

          {/* Senior-Friendly Universal Multilingual Selector */}
          <div className="flex items-center gap-1.5 bg-secondary/90 px-3 py-1 rounded-full border border-border">
            <Languages className="h-4 w-4 text-primary shrink-0" />
            <select
              value={currentLocale}
              onChange={(e) => {
                const newLocale = e.target.value;
                setCurrentLocale(newLocale);
                currentLocaleRef.current = newLocale;
                const matched = LANGUAGES.find((l) => l.speech === newLocale);
                if (matched) {
                  setLang(matched.code);
                  if (store && typeof store.updateLanguage === "function") {
                    store.updateLanguage(matched.code);
                  }
                }
              }}
              className="bg-transparent text-foreground text-xs font-bold cursor-pointer focus:outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.speech} className="bg-card text-foreground">
                  {l.native} ({l.label})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 5-State Visualizer (Idle, Listening, Processing, Speaking, Error) */}
        <div className="text-center space-y-3">
          <div
            onClick={voiceState === "speaking" ? handleBargeIn : undefined}
            className={`mx-auto w-24 h-24 rounded-full border-3 flex items-center justify-center transition-all cursor-pointer ${
              voiceState === "listening"
                ? "bg-destructive/15 border-destructive text-destructive scale-110 shadow-xl shadow-destructive/25 animate-pulse"
                : voiceState === "processing"
                ? "bg-amber-500/15 border-amber-500 text-amber-600 scale-105 shadow-xl shadow-amber-500/20"
                : voiceState === "speaking"
                ? "bg-primary/20 border-primary text-primary scale-105 shadow-xl shadow-primary/25 animate-pulse"
                : voiceState === "error"
                ? "bg-destructive/10 border-destructive text-destructive"
                : "bg-primary/10 border-primary/30 text-primary hover:scale-105"
            }`}
          >
            {voiceState === "listening" ? (
              <Mic className="h-12 w-12 animate-pulse" />
            ) : voiceState === "processing" ? (
              <Sparkles className="h-12 w-12 animate-spin text-amber-500" />
            ) : voiceState === "speaking" ? (
              <Volume2 className="h-12 w-12 animate-bounce text-primary" />
            ) : voiceState === "error" ? (
              <AlertCircle className="h-12 w-12 text-destructive" />
            ) : (
              <MicOff className="h-12 w-12 opacity-70" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-foreground">AI Voice Companion</h3>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Continuous Multilingual Voice • SIH26003
            </p>
          </div>

          {/* State Indicator Banner */}
          <div className="flex items-center justify-center gap-2.5">
            <span
              className={`inline-block w-3.5 h-3.5 rounded-full ${
                voiceState === "listening"
                  ? "bg-destructive animate-ping"
                  : voiceState === "processing"
                  ? "bg-amber-500 animate-pulse"
                  : voiceState === "speaking"
                  ? "bg-primary animate-pulse"
                  : voiceState === "error"
                  ? "bg-destructive"
                  : "bg-muted-foreground/60"
              }`}
            />
            <span className="text-base font-black text-foreground">
              {voiceState === "listening"
                ? "🎤 Listening to you… (Speak naturally)"
                : voiceState === "processing"
                ? "🧠 Understanding your words…"
                : voiceState === "speaking"
                ? "🔊 Speaking to you… (Tap to interrupt)"
                : voiceState === "error"
                ? "⚠️ Speech Detection Note"
                : pendingIntent
                ? "Awaiting your confirmation"
                : "🎤 Tap to speak"}
            </span>
          </div>

          {voiceState === "speaking" && (
            <p className="text-xs font-bold text-primary animate-pulse">
              {pick(BARGE_IN_HINT_MSG, currentLocaleRef.current)}
            </p>
          )}
        </div>

        {/* Quick Suggestion Chips (Localized across Indian regional elders) */}
        <div className="flex flex-wrap gap-2 justify-center text-xs">
          {(currentLocale.startsWith("gu")
            ? [
                "મારે કાલે સવારે દવા લેવાની છે",
                "કેટલા વાગ્યે?",
                "મારી આગલી દવા કઈ છે?",
                "મને સવારે ૮ વાગ્યે દવા યાદ દેવડાવજો",
                "મેં દવા લઈ લીધી",
              ]
            : currentLocale.startsWith("hi")
            ? [
                "मुझे कल सुबह दवा लेनी है",
                "कल डॉक्टर के पास जाना है",
                "मेरी अगली दवा कौन सी है?",
                "कल सुबह 8 बजे दवा याद दिलाना",
                "मैंने दवा ले ली है",
              ]
            : currentLocale.startsWith("mr")
            ? [
                "मला उद्या सकाळी औषध घ्यायचे आहे",
                "माझे पुढील औषध कोणते आहे?",
                "मी औषध घेतले आहे",
                "उद्या 8 वाजता आठवण करा",
              ]
            : currentLocale.startsWith("as")
            ? [
                "কাইলৈ পুৱা ঔষধ খাব লাগিব",
                "মোৰ পৰৱৰ্তী ঔষধ কি?",
                "মই ঔষধ খালোঁ",
                "পুৱা ৮ বজাত সংকেত দিয়া",
              ]
            : currentLocale.startsWith("bn")
            ? [
                "কাল সকালে ওষুধ খেতে হবে",
                "আমার পরের ওষুধ কি?",
                "আমি ওষুধ খেয়েছি",
                "কাল সকাল ৮ টায় মনে করিয়ে দিও",
              ]
            : currentLocale.startsWith("ta")
            ? [
                "நாளை காலை மருந்து சாப்பிட வேண்டும்",
                "என் அடுத்த மருந்து என்ன?",
                "மருந்து உட்கொண்டேன்",
              ]
            : currentLocale.startsWith("te")
            ? [
                "రేపు ఉదయం మందులు వేసుకోవాలి",
                "నా తదుపరి మందు ఏది?",
                "మందులు వేసుకున్నాను",
              ]
            : currentLocale.startsWith("kn")
            ? [
                "ನಾಳೆ ಬೆಳಿಗ್ಗೆ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಬೇಕು",
                "ನನ್ನ ಮುಂದಿನ ಔಷಧಿ ಯಾವುದು?",
                "ಔಷಧಿ ತೆಗೆದುಕೊಂಡೆ",
              ]
            : currentLocale.startsWith("ml")
            ? [
                "നാളെ രാവിലെ മരുന്ന് കഴിക്കണം",
                "എന്റെ അടുത്ത മരുന്ന് ഏതാണ്?",
              ]
            : currentLocale.startsWith("pa")
            ? [
                "ਕੱਲ੍ਹ ਸਵੇਰੇ ਦਵਾਈ ਲੈਣੀ ਹੈ",
                "ਮੇਰੀ ਅਗਲੀ ਦਵਾਈ ਕਿਹੜੀ ਹੈ?",
              ]
            : currentLocale.startsWith("or")
            ? [
                "କାଲି ସକାଳେ ଔଷଧ ଖାଇବାକୁ ହେବ",
                "ମୋର ପରବର୍ତ୍ତୀ ଔଷଧ କ’ଣ?",
              ]
            : [
                "I need to take medicine tomorrow morning",
                "What is my next reminder?",
                "I took my scheduled medicine",
                "Doctor appointment tomorrow 10 AM",
              ]
          ).map((sample, i) => (
            <button
              key={i}
              onClick={() => {
                setTranscript(sample);
                processCommand(sample, currentLocaleRef.current);
              }}
              className="rounded-full bg-secondary/80 hover:bg-secondary px-3 py-1.5 text-foreground font-semibold transition-all border border-border/60 text-xs"
            >
              "{sample}"
            </button>
          ))}
        </div>

        {/* Central Voice Trigger Button with Barge-In & Continuous Cycle */}
        <div className="text-center py-1">
          <Button
            size="lg"
            onClick={
              voiceState === "speaking"
                ? handleBargeIn
                : voiceState === "listening"
                ? handleStop
                : () => {
                    isActiveSessionRef.current = true;
                    startListening();
                  }
            }
            className={`h-20 w-20 rounded-full shadow-xl font-bold transition-all ${
              voiceState === "listening"
                ? "bg-destructive hover:bg-destructive/90 text-white scale-105"
                : voiceState === "speaking"
                ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                : "bg-primary hover:bg-primary/90 text-white hover:scale-105"
            }`}
          >
            {voiceState === "listening" ? (
              <MicOff className="h-8 w-8" />
            ) : voiceState === "speaking" ? (
              <VolumeX className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            {voiceState === "speaking"
              ? "Tap button or screen to interrupt"
              : conversationMode
              ? "Press once to start continuous conversation"
              : "Tap microphone to speak"}
          </p>
        </div>

        {/* Text Fallback Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            processCommand(transcript, currentLocaleRef.current);
          }}
          className="flex gap-2"
        >
          <Input
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type your message or query here..."
            className="h-12 rounded-2xl text-base"
          />
          <Button type="submit" className="h-12 px-5 rounded-2xl font-bold">
            <Send className="h-5 w-5" />
          </Button>
        </form>

        {/* Senior-Friendly Error Display with Retry */}
        {recognitionError && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-center space-y-2 animate-in fade-in">
            <p className="text-xs text-destructive font-bold">{recognitionError}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="rounded-full font-bold border-destructive/40 hover:bg-destructive/20 text-destructive text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {pick(RETRY_LABEL_MSG, currentLocaleRef.current)}
            </Button>
          </div>
        )}

        {/* Query response banner */}
        {feedbackMessage && !pendingIntent && (
          <div className="rounded-2xl bg-secondary/70 border border-border p-4 text-center space-y-2">
            <Volume2 className="h-6 w-6 text-primary mx-auto" />
            <p className="font-bold text-foreground text-base leading-snug">{feedbackMessage}</p>
          </div>
        )}

        {/* Confirmation Card before creating reminders or recording items */}
        {pendingIntent && !isSpokenAnswer(pendingIntent) && (
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Action Confirmation
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {pendingIntent.confirmationMessage}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="default"
                onClick={handleConfirmIntent}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-13 rounded-2xl text-base shadow-md"
              >
                <Check className="h-5 w-5 mr-1.5" /> CONFIRM
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelIntent}
                className="font-black h-13 rounded-2xl text-base shadow-md"
              >
                <X className="h-5 w-5 mr-1.5" /> CANCEL
              </Button>
            </div>
          </div>
        )}

        {/* Continuous Conversation Mode Preference */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <span>Continuous Conversation:</span>
          <button
            type="button"
            onClick={() => toggleConversationMode(!conversationMode)}
            className={`font-bold px-3 py-1 rounded-full border transition-all ${
              conversationMode
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {conversationMode ? "Active (Continuous)" : "Single-turn"}
          </button>
        </div>
      </div>
    </div>
  );
}
