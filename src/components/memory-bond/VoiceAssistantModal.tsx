import { useState, useEffect } from "react";
import { Mic, MicOff, Send, X, Check, Edit3, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseVoiceIntent, speakText, type VoiceIntent, detectLanguage } from "@/lib/voiceParser";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";

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
  const { speechLocale } = useI18n();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [detectedLocale, setDetectedLocale] = useState<string>(speechLocale || "en-IN");
  const [transcript, setTranscript] = useState<string>("");
  const [pendingIntent, setPendingIntent] = useState<VoiceIntent | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Load this browser preference after hydration so server rendering stays safe.
  const [conversationMode, setConversationMode] = useState(false);

  useEffect(() => {
    setConversationMode(localStorage.getItem("conversationMode") === "true");
  }, []);

  // Check speech recognition API support
  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const startListening = () => {
    // Prevent starting if already speaking
    if (isSpeaking) return;
    setRecognitionError(null);
    if (!SpeechRecognition) {
      setRecognitionError(
        "Speech recognition is not supported in this browser. Please type your message below.",
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      // Use previously detected locale if available
      recognition.lang = detectedLocale || speechLocale || "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        const lang = detectLanguage(text);
        setDetectedLocale(lang);
        setTranscript(text);
        processCommand(text, lang);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setRecognitionError(
          `Could not detect voice (${event.error || "error"}). Try typing below.`,
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setRecognitionError("Unable to access microphone. Please type your command.");
    }
  };

  const processCommand = (text: string, locale?: string) => {
    if (!text.trim()) return;
    // Record user input
    if (store && typeof store.addConversation === "function") {
      store.addConversation(`User: ${text}`);
    }
    const usedLocale = locale || detectedLocale || speechLocale || "en-IN";
    const intent = parseVoiceIntent(text, store, usedLocale);

    if (isSpokenAnswer(intent)) {
      setPendingIntent(null);
      setFeedbackMessage(intent.message);
      speakWithTracking(intent.message, usedLocale);
    } else {
      setPendingIntent(intent);
      setFeedbackMessage("");
      speakWithTracking(intent.confirmationMessage, usedLocale);
    }
  };

  // Wrapper to handle speaking state
  const speakWithTracking = (msg: string, locale: string) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.lang = locale;
    utterance.rate = 0.9;
    utterance.onend = () => {
      setIsSpeaking(false);
      // Record assistant response
      if (store && typeof store.addConversation === "function") {
        store.addConversation(`Assistant: ${msg}`);
      }
      // If conversation mode is enabled, restart listening automatically
      if (conversationMode) {
        startListening();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleConfirmIntent = () => {
    if (!pendingIntent) return;

    if (pendingIntent.type === "TAKE_MEDICINE") {
      const medId = pendingIntent.medicineId || store.medicines[0]?.id;
      if (medId) {
        store.takeMedicine(medId);
        speakText("Recorded that you took your medicine. Well done!", speechLocale);
      }
    } else if (pendingIntent.type === "CREATE_REMINDER") {
      store.addReminder({
        title: pendingIntent.title,
        time: pendingIntent.time,
        type: pendingIntent.reminderType,
        date: null,
        repeat: "daily",
        notes: "Created by AI Voice Assistant",
        active: true,
      });
      speakText(`Saved reminder for ${pendingIntent.time}.`, speechLocale);
    } else if (pendingIntent.type === "CREATE_APPOINTMENT") {
      store.addAppointment({
        title: pendingIntent.title,
        date: pendingIntent.date,
        time: pendingIntent.time,
        kind: "doctor",
        location: pendingIntent.location || "Clinic",
        notes: "Created via Voice Assistant",
      });
      speakText("Appointment saved.", speechLocale);
    } else if (pendingIntent.type === "NAVIGATE") {
      if (onNavigate) {
        onNavigate(pendingIntent.targetView);
      }
    }

    setPendingIntent(null);
    setTranscript("");
    onClose();
  };

  const handleCancelIntent = () => {
    setPendingIntent(null);
    setTranscript("");
    speakWithTracking("Cancelled.", detectedLocale || speechLocale || "en-IN");
  };

  if (!isOpen) return null;

  const handleStop = () => {
    if (isListening) {
      // No direct stop, but we can cancel the recognition by creating a new instance and calling abort if available
      // For simplicity, we rely on SpeechRecognition onend when we cancel speech synthesis
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-primary/30 bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-6 w-6" />
        </button>
        {/* STOP button */}
        <button
          onClick={handleStop}
          className="absolute left-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-destructive hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary">
            <Mic className={`h-8 w-8 ${isListening ? "animate-pulse text-destructive" : ""}`} />
          </div>
          <h3 className="text-2xl font-black text-foreground">AI Voice Companion</h3>
          <p className="text-sm text-muted-foreground">
            Speak naturally in your preferred language or type below.
          </p>
        </div>

        {/* Suggestions chips */}
        <div className="flex flex-wrap gap-2 justify-center text-xs">
          {[
            "Remind me to take medicine at 8 PM",
            "Remind me to buy vegetables tomorrow",
            "Doctor appointment is on Friday at 10 AM",
            "I took my medicine",
            "What's my next reminder?",
          ].map((sample, i) => (
            <button
              key={i}
              onClick={() => {
                setTranscript(sample);
                processCommand(sample);
              }}
              className="rounded-full bg-secondary/70 hover:bg-secondary px-3 py-1.5 text-foreground font-medium transition-all"
            >
              "{sample}"
            </button>
          ))}
        </div>

        {/* Voice Trigger Button */}
        <div className="text-center py-2">
          <Button
            size="lg"
            onClick={startListening}
            className={`h-20 w-20 rounded-full shadow-lg text-white font-bold transition-all ${
              isListening
                ? "bg-destructive animate-ping"
                : "bg-primary hover:bg-primary/90 hover:scale-105"
            }`}
          >
            {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </Button>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {isListening ? "Listening... Speak now" : "Tap microphone to speak"}
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
            placeholder="Or type command here..."
            className="h-12 rounded-2xl text-base"
          />
          <Button type="submit" className="h-12 px-5 rounded-2xl font-bold">
            <Send className="h-5 w-5" />
          </Button>
        </form>

        {recognitionError && (
          <p className="text-xs text-center text-destructive font-medium">{recognitionError}</p>
        )}

        {/* Query response */}
        {feedbackMessage && (
          <div className="rounded-2xl bg-secondary/50 border border-border p-4 text-center space-y-2">
            <Volume2 className="h-6 w-6 text-primary mx-auto" />
            <p className="font-bold text-foreground">{feedbackMessage}</p>
          </div>
        )}

        {/* Mandatory Confirmation Modal / Dialog before important actions */}
        {pendingIntent && pendingIntent.type !== "QUERY_NEXT_REMINDER" && (
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Please Confirm Action
            </div>
            <p className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {pendingIntent.confirmationMessage}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                variant="default"
                onClick={handleConfirmIntent}
                className="bg-success hover:bg-success/90 text-white font-bold h-12 rounded-xl text-base"
              >
                <Check className="h-5 w-5 mr-1" /> YES
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPendingIntent(null);
                }}
                className="font-bold h-12 rounded-xl"
              >
                <Edit3 className="h-5 w-5 mr-1" /> EDIT
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelIntent}
                className="font-bold h-12 rounded-xl text-base"
              >
                <X className="h-5 w-5 mr-1" /> CANCEL
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
