import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  X,
  Check,
  Edit3,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  parseVoiceIntent,
  speakText,
  stopSpeaking,
  isSpokenAnswer,
  type VoiceIntent,
  detectLanguage,
} from "@/lib/voiceParser";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n, LANGUAGES } from "@/lib/i18n";

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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentLocale, setCurrentLocale] = useState<string>(speechLocale || "en-IN");
  const [transcript, setTranscript] = useState<string>("");
  const [pendingIntent, setPendingIntent] = useState<VoiceIntent | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);

  // Sync locale when global language changes
  useEffect(() => {
    setCurrentLocale(speechLocale || "en-IN");
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

  // Clean stop on modal close
  useEffect(() => {
    if (!isOpen) {
      handleStop();
      setPendingIntent(null);
      setTranscript("");
      setFeedbackMessage("");
      setIsThinking(false);
    }
  }, [isOpen]);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  // Interruption / Barge-in: immediately cancel audio if speaking
  const handleBargeIn = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    handleBargeIn();
    setRecognitionError(null);
    setIsThinking(false);

    if (!SpeechRecognition) {
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
      recognition.lang = currentLocale;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0]?.[0]?.transcript;
        if (text) {
          // Auto-detect language if Indian script characters are present
          const detected = detectLanguage(text);
          if (detected && detected !== "en-IN") {
            setCurrentLocale(detected);
          }
          setTranscript(text);
          processCommand(text, detected || currentLocale);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== "no-speech") {
          setRecognitionError(`Voice detection note: ${event.error || "Please try speaking again."}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setRecognitionError("Unable to open microphone. Please type your command below.");
    }
  };

  const handleStop = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsListening(false);
    setIsThinking(false);
    stopSpeaking();
    setIsSpeaking(false);
  };

  const speakWithEchoGuard = (msg: string, locale: string, onFinish?: () => void) => {
    // 1. Prevent mic from picking up TTS output
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsListening(false);
    setIsThinking(false);
    setIsSpeaking(true);

    speakText(msg, locale, () => {
      setIsSpeaking(false);
      if (store && typeof store.addConversation === "function") {
        store.addConversation(`Assistant: ${msg}`);
      }
      if (onFinish) onFinish();
      // In continuous conversation mode, automatically re-listen after speaking
      if (conversationMode && isOpen) {
        setTimeout(() => {
          startListening();
        }, 350);
      }
    });
  };

  const processCommand = (text: string, locale?: string) => {
    if (!text.trim()) return;
    handleBargeIn();
    setIsListening(false);
    setIsThinking(true);

    if (store && typeof store.addConversation === "function") {
      store.addConversation(`User: ${text}`);
    }

    const usedLocale = locale || currentLocale || "en-IN";

    // Natural cognitive thinking delay
    setTimeout(() => {
      setIsThinking(false);
      const intent = parseVoiceIntent(text, store, usedLocale, pendingIntent);

      // If intent was confirming the previous pending action
      if (intent.type === "CONFIRM_ACTION") {
        handleConfirmIntent();
        return;
      }

      // If intent was cancelling the previous pending action
      if (intent.type === "CANCEL_ACTION") {
        handleCancelIntent();
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
    }, 320);
  };

  const handleConfirmIntent = () => {
    if (!pendingIntent) return;

    if (pendingIntent.type === "TAKE_MEDICINE") {
      const medId = pendingIntent.medicineId || store.medicines[0]?.id;
      if (medId) {
        store.takeMedicine(medId);
        speakWithEchoGuard("Medicine recorded as taken. Very well done!", currentLocale);
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
      speakWithEchoGuard(`Saved reminder for ${pendingIntent.time}.`, currentLocale);
    } else if (pendingIntent.type === "CREATE_APPOINTMENT") {
      store.addAppointment({
        title: pendingIntent.title,
        date: pendingIntent.date,
        time: pendingIntent.time,
        kind: "doctor",
        location: pendingIntent.location || "Clinic",
        notes: "Created via Voice Assistant",
      });
      speakWithEchoGuard("Doctor appointment confirmed and saved.", currentLocale);
    } else if (pendingIntent.type === "ADD_JOURNAL") {
      store.addJournalEntry({
        title: pendingIntent.title,
        body: pendingIntent.body,
        entry_date: new Date().toISOString().slice(0, 10),
        kind: "voice",
      });
      speakWithEchoGuard("Cherished memory saved to your Memory Bond journal.", currentLocale);
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
    speakWithEchoGuard("Cancelled.", currentLocale);
  };

  if (!isOpen) return null;

  const currentLangObj = LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-primary/40 bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top Control Bar: STOP Speech on left, Language Badge in center, Close on right */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
            className="rounded-full px-3.5 py-1 text-xs font-black gap-1.5 shadow-sm"
          >
            <VolumeX className="h-4 w-4" /> STOP
          </Button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground">
              <Languages className="h-3.5 w-3.5 text-primary" />
              {currentLangObj?.native || "English"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Header & 3-State Visualizer (Listening, Thinking, Speaking) */}
        <div className="text-center space-y-3">
          <div
            className={`mx-auto w-22 h-22 rounded-full border-3 flex items-center justify-center transition-all ${
              isListening
                ? "bg-destructive/15 border-destructive text-destructive scale-110 shadow-xl shadow-destructive/25 animate-pulse"
                : isThinking
                ? "bg-amber-500/15 border-amber-500 text-amber-600 scale-105 shadow-xl shadow-amber-500/20"
                : isSpeaking
                ? "bg-primary/20 border-primary text-primary scale-105 shadow-xl shadow-primary/25 animate-pulse"
                : "bg-primary/10 border-primary/30 text-primary"
            }`}
          >
            {isListening ? (
              <Mic className="h-11 w-11 animate-pulse" />
            ) : isThinking ? (
              <Sparkles className="h-11 w-11 animate-spin text-amber-500" />
            ) : isSpeaking ? (
              <Volume2 className="h-11 w-11 animate-bounce" />
            ) : (
              <MicOff className="h-11 w-11 opacity-70" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-foreground">AI Voice Companion</h3>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Two-Way Multilingual Voice • SIH26003
            </p>
          </div>

          {/* 3-State Live Status Indicator */}
          <div className="flex items-center justify-center gap-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                isListening
                  ? "bg-destructive animate-ping"
                  : isThinking
                  ? "bg-amber-500 animate-pulse"
                  : isSpeaking
                  ? "bg-primary animate-pulse"
                  : "bg-emerald-500"
              }`}
            />
            <span className="text-sm font-bold text-foreground">
              {isListening
                ? "Listening… Speak now"
                : isThinking
                ? "Thinking… Understanding your words"
                : isSpeaking
                ? "Speaking response…"
                : pendingIntent
                ? "Awaiting your confirmation"
                : "Tap microphone or speak below"}
            </span>
          </div>

          {/* Voice Engine Architecture Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/70 border border-border text-[11px] font-bold text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Voice Engine: Web Speech API • BHASHINI Compatible</span>
          </div>
        </div>

        {/* Quick Suggestion Chips (Localized for Indian regional elders) */}
        <div className="flex flex-wrap gap-2 justify-center text-xs">
          {(currentLocale.startsWith("hi")
            ? [
                "कल सुबह 8 बजे दवा याद दिलाना",
                "मेरी अगली दवा कौन सी है?",
                "आज मेरी बेटी घर आई थी",
                "मुझे थोड़ा अकेला लग रहा है",
                "डॉक्टर अपॉइंटमेंट कल 10 बजे",
              ]
            : currentLocale.startsWith("as")
            ? [
                "পুৱা ৮ বজাত ঔষধৰ সংকেত দিয়া",
                "মোৰ পৰৱৰ্তী ঔষধ কি?",
                "মই ঔষধ খালোঁ",
                "আজি মোৰ বৰ শান্তি লাগিছে",
              ]
            : currentLocale.startsWith("bn")
            ? [
                "কাল সকাল ৮ টায় ঔষধ মনে করিয়ে দিও",
                "আমার পরের ঔষধ কি?",
                "আমি ঔষধ খেয়েছি",
                "আজ মনটা খুব ভালো",
              ]
            : currentLocale.startsWith("gu")
            ? [
                "મને સવારે ૮ વાગ્યે દવા યાદ દેવડાવજો",
                "મારી આગલી દવા કઈ છે?",
                "મેં દવા લઈ લીધી",
                "આજે મને ઘણો આનંદ છે",
              ]
            : [
                "Remind me to take medicine at 8 PM",
                "What's my next reminder?",
                "I took my scheduled medicine",
                "Doctor appointment tomorrow 10 AM",
                "I'm feeling a bit lonely today",
              ]
          ).map((sample, i) => (
            <button
              key={i}
              onClick={() => {
                setTranscript(sample);
                processCommand(sample);
              }}
              className="rounded-full bg-secondary/80 hover:bg-secondary px-3 py-1.5 text-foreground font-semibold transition-all border border-border/60 text-xs"
            >
              "{sample}"
            </button>
          ))}
        </div>

        {/* Voice Trigger Microphone Button */}
        <div className="text-center py-1">
          <Button
            size="lg"
            onClick={isListening ? handleStop : startListening}
            className={`h-20 w-20 rounded-full shadow-xl font-bold transition-all ${
              isListening
                ? "bg-destructive hover:bg-destructive/90 text-white scale-105"
                : "bg-primary hover:bg-primary/90 text-white hover:scale-105"
            }`}
          >
            {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </Button>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            {t("bargeInHint") || "Speak anytime to interrupt"}
          </p>
        </div>

        {/* Text Fallback Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            processCommand(transcript);
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

        {recognitionError && (
          <p className="text-xs text-center text-destructive font-medium bg-destructive/10 p-2 rounded-xl">
            {recognitionError}
          </p>
        )}

        {/* Query response banner */}
        {feedbackMessage && !pendingIntent && (
          <div className="rounded-2xl bg-secondary/70 border border-border p-4 text-center space-y-2">
            <Volume2 className="h-6 w-6 text-primary mx-auto" />
            <p className="font-bold text-foreground text-base leading-snug">{feedbackMessage}</p>
          </div>
        )}

        {/* Mandatory Confirmation Modal before creating reminders or recording items */}
        {pendingIntent && !isSpokenAnswer(pendingIntent) && (
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Please Confirm Action
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {pendingIntent.confirmationMessage}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="default"
                onClick={handleConfirmIntent}
                className="bg-success hover:bg-success/90 text-white font-black h-13 rounded-2xl text-base shadow-md"
              >
                <Check className="h-5 w-5 mr-1.5" /> YES, CONFIRM
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelIntent}
                className="font-black h-13 rounded-2xl text-base shadow-md"
              >
                <X className="h-5 w-5 mr-1.5" /> NO, CANCEL
              </Button>
            </div>
          </div>
        )}

        {/* Continuous Conversation Mode Toggle */}
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
            {conversationMode ? "Active (Multi-turn)" : "Single-turn"}
          </button>
        </div>
      </div>
    </div>
  );
}
