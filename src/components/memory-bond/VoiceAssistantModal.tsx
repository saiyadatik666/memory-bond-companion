import { useState, useEffect, useRef, useCallback } from "react";
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
  ExternalLink,
  StopCircle,
  Clock,
  Calendar,
  Pill,
  Droplets,
  Footprints,
  Phone,
  Sun,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { voiceManager } from "@/lib/voiceProvider";
import {
  parseVoiceIntent,
  type VoiceIntent,
  detectLanguage,
  extractExplicitTime,
  cleanAIResponse,
} from "@/lib/voiceParser";
import { conversationalAI } from "@/lib/conversationalAI";
import {
  createVerifiedReminder,
  getTodayReminders,
  getNextReminder,
  formatTime12h,
  getLocalTomorrowDateString,
  getLocalTodayDateString,
} from "@/lib/reminderService";
import { requestNotificationPermission } from "@/lib/notificationService";
import type { MemoryBondStore, Reminder } from "@/lib/memoryBondStore";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { languageEngine, SUPPORTED_LANGUAGES } from "@/lib/languageEngine";
import { processVoiceQuery, type ConversationTurn } from "@/lib/voiceIntelligence";
import { MemoryBondLogo } from "./MemoryBondLogo";

export type AssistantVoiceState =
  | "idle"        // 🎤 Tap to speak
  | "listening"   // 🔴 Listening...
  | "processing"  // ⏳ Thinking...
  | "responding"  // 🔊 Speaking...
  | "done"        // ✓ Done
  | "error";      // ⚠️ Error

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
  const { lang, speechLocale, setLang } = useI18n();

  // Core Pipeline State
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>("idle");
  const [currentLocale, setCurrentLocale] = useState<string>(speechLocale || "en-IN");
  const [detectedLangName, setDetectedLangName] = useState<string>("Auto-Detect");
  const [transcript, setTranscript] = useState<string>("");
  const [inputDraft, setInputDraft] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastResponseText, setLastResponseText] = useState<string>("");
  const [lastCreatedReminder, setLastCreatedReminder] = useState<Reminder | null>(null);

  // Synchronous references across speech recognition & event loops
  const isOpenRef = useRef(isOpen);
  const voiceStateRef = useRef<AssistantVoiceState>("idle");
  const currentLocaleRef = useRef(currentLocale);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const debounceTimerRef = useRef<any>(null);
  const latestHeardTranscriptRef = useRef<string>("");
  const isSpeechActiveRef = useRef<boolean>(false);
  const lastActionCompletedRef = useRef<boolean>(false);
  const conversationHistoryRef = useRef<ConversationTurn[]>([]);

  // Keep refs synchronized
  useEffect(() => {
    isOpenRef.current = isOpen;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isOpen) {
      // Request browser notification permissions so alerts can pop up on device
      requestNotificationPermission().catch(() => {});
      setVoiceState("idle");
      setTranscript("");
      setErrorMessage(null);
      setLastCreatedReminder(null);
      setLastResponseText("");
      lastActionCompletedRef.current = false;
      // Auto-start listening on open for seamless experience
      timer = setTimeout(() => {
        if (isOpenRef.current) {
          startListening();
        }
      }, 300);
    } else {
      cleanupAllAudio();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    currentLocaleRef.current = currentLocale;
  }, [currentLocale]);

  useEffect(() => {
    const loc = speechLocale || "en-IN";
    setCurrentLocale(loc);
    currentLocaleRef.current = loc;
  }, [speechLocale]);

  // Comprehensive Cleanup function
  const cleanupAllAudio = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    latestHeardTranscriptRef.current = "";

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    voiceManager.stopSpeaking();
    isSpeechActiveRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllAudio();
    };
  }, [cleanupAllAudio]);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  // -------------------------------------------------------------------------
  // Speech Recognition Lifecycle Controller
  // -------------------------------------------------------------------------
  const startListening = () => {
    if (!isOpenRef.current) return;

    // 1. Cancel any active speech synthesis or old recognition instance
    cleanupAllAudio();
    latestHeardTranscriptRef.current = "";
    setErrorMessage(null);
    setTranscript("");

    if (!SpeechRecognition) {
      setVoiceState("error");
      setErrorMessage(
        "Speech recognition is not supported in this browser. You can type your request naturally below."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = currentLocaleRef.current;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        if (!isOpenRef.current) {
          try { recognition.abort(); } catch {}
          return;
        }
        setVoiceState("listening");
        setErrorMessage(null);

        // Silence Watchdog: 7.5 seconds without speech -> prompt user & return to IDLE
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && voiceStateRef.current === "listening" && !latestHeardTranscriptRef.current.trim()) {
            try {
              recognitionRef.current.abort();
            } catch {}
            setVoiceState("idle");
            const noHearMsg = currentLocaleRef.current.startsWith("hi")
              ? "माफ़ कीजिए, मुझे कुछ सुनाई नहीं दिया। कृपया दोबारा बोलें।"
              : "Sorry, I didn't hear anything. Tap to speak again.";
            setErrorMessage(noHearMsg);
          }
        }, 7500);
      };

      recognition.onresult = (event: any) => {
        // Clear silence timeout as soon as audio is received
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        let fullText = "";
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0]) {
            fullText += (fullText ? " " : "") + res[0].transcript;
          }
        }

        const trimmed = fullText.trim();
        if (trimmed) {
          latestHeardTranscriptRef.current = trimmed;
          setTranscript(trimmed);
        }

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }

        // Wait 900ms of quiet after speech before submitting query
        if (trimmed) {
          debounceTimerRef.current = setTimeout(() => {
            const query = latestHeardTranscriptRef.current.trim();
            if (query && voiceStateRef.current === "listening") {
              if (voiceManager.isEcho(query)) return;
              try {
                if (recognitionRef.current) {
                  recognitionRef.current.onend = null;
                  recognitionRef.current.abort();
                  recognitionRef.current = null;
                }
              } catch {}
              processQuery(query);
            }
          }, 900);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event?.error;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        if (errType === "aborted") {
          return;
        }

        if (errType === "not-allowed" || errType === "service-not-allowed") {
          setVoiceState("error");
          setErrorMessage("Microphone access is needed to use Voice AI. Please allow microphone permissions or type below.");
          return;
        }

        if (errType === "network") {
          setVoiceState("error");
          setErrorMessage("I'm having trouble connecting. Please check your internet connection or try again.");
          return;
        }

        if (errType === "no-speech") {
          // If speech was accumulated before silence event, process it immediately!
          const pending = latestHeardTranscriptRef.current.trim();
          if (pending && voiceStateRef.current === "listening") {
            if (!voiceManager.isEcho(pending)) {
              processQuery(pending);
              return;
            }
          }
          setVoiceState("idle");
          setErrorMessage(
            currentLocaleRef.current.startsWith("hi")
              ? "मैंने आपको नहीं सुना। कृपया दोबारा बोलें।"
              : "I didn't hear you. Please tap the microphone to try again."
          );
          return;
        }

        if (errType === "audio-capture") {
          setVoiceState("error");
          setErrorMessage("Could not access microphone. Please check your audio input device.");
          return;
        }

        setVoiceState("idle");
        setErrorMessage("Sorry, I couldn't hear clearly. Please tap the microphone to retry.");
      };

      recognition.onend = () => {
        if (voiceStateRef.current === "processing" || voiceStateRef.current === "responding") {
          return;
        }
        // If speech was gathered before end, execute it!
        const pending = latestHeardTranscriptRef.current.trim();
        if (pending && voiceStateRef.current === "listening") {
          if (!voiceManager.isEcho(pending)) {
            processQuery(pending);
            return;
          }
        }
        if (voiceStateRef.current === "listening") {
          setVoiceState("idle");
        }
      };

      recognition.start();
    } catch {
      setVoiceState("error");
      setErrorMessage("Could not start microphone. You can type your request below.");
    }
  };

  // -------------------------------------------------------------------------
  // TTS Response Speaker
  // -------------------------------------------------------------------------
  const speakResponse = (text: string, locale: string, onFinish?: () => void) => {
    const clean = cleanAIResponse(text);
    if (!clean || clean.trim().length === 0) {
      setVoiceState(lastActionCompletedRef.current ? "done" : "idle");
      if (onFinish) onFinish();
      return;
    }

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
        recognitionRef.current = null;
      } catch {}
    }

    isSpeechActiveRef.current = true;
    setVoiceState("responding");

    voiceManager.speak(
      clean,
      locale,
      () => {
        // onStart
        setVoiceState("responding");
      },
      () => {
        // onEnd
        isSpeechActiveRef.current = false;
        if (onFinish) onFinish();

        // Check if multi-turn dialogue expects user follow-up (e.g. asking for missing time/topic)
        const dialogueStage = conversationalAI.getDialogueState().stage;
        if (dialogueStage !== "idle" && isOpenRef.current) {
          setTimeout(() => {
            if (isOpenRef.current) {
              startListening();
            }
          }, 350);
        } else {
          // Action completed -> stay on DONE; otherwise IDLE
          setVoiceState(lastActionCompletedRef.current ? "done" : "idle");
        }
      },
      (err) => {
        console.warn("[VoiceAssistantModal] TTS playback notice:", err);
        isSpeechActiveRef.current = false;
        if (onFinish) onFinish();
        setVoiceState(lastActionCompletedRef.current ? "done" : "idle");
      }
    );
  };

  // -------------------------------------------------------------------------
  // Unified Core Intent & Action Pipeline
  // (Both Voice and Text input flow through this EXACT same engine)
  // -------------------------------------------------------------------------
  const processQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    cleanupAllAudio();
    setVoiceState("processing");
    setErrorMessage(null);
    setTranscript(text);

    // 1. Detect language on client
    let detectedLocale = languageEngine.detectLanguage(text, currentLocaleRef.current) || currentLocaleRef.current;
    setCurrentLocale(detectedLocale);
    currentLocaleRef.current = detectedLocale;
    const detectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.locale === detectedLocale);
    if (detectedLangObj) {
      setDetectedLangName(detectedLangObj.name);
    }

    let finalResponseText = "";
    let isActionCompleted = false;

    // STAGE 1: Check Multi-Turn Dialogue (e.g. user answering "8 AM" to previous "What time?")
    const currentDialogue = conversationalAI.getDialogueState();
    if (currentDialogue.stage !== "idle") {
      try {
        const dialogueResult = conversationalAI.handleMultiTurnDialogue(
          text,
          store,
          detectedLocale,
          extractExplicitTime
        );

        if (dialogueResult && dialogueResult.handled && dialogueResult.responseText) {
          finalResponseText = cleanAIResponse(dialogueResult.responseText);
          if (dialogueResult.action === "create_reminder" && dialogueResult.actionData) {
            setLastCreatedReminder(dialogueResult.actionData);
            isActionCompleted = true;
          }
        }
      } catch (e) {
        console.warn("[VoiceAssistantModal] Multi-turn dialogue error:", e);
      }
    }

    // STAGE 2: Full Multi-Intent Voice AI Intelligence Engine
    if (!finalResponseText) {
      try {
        const intelResult = await processVoiceQuery(
          text,
          store,
          detectedLocale,
          conversationHistoryRef.current,
          onNavigate
        );

        if (intelResult && intelResult.responseText) {
          finalResponseText = cleanAIResponse(intelResult.responseText);

          if (intelResult.detectedLocale) {
            detectedLocale = intelResult.detectedLocale;
            setCurrentLocale(detectedLocale);
            currentLocaleRef.current = detectedLocale;
          }
          if (intelResult.languageName) {
            setDetectedLangName(intelResult.languageName);
          }

          if (intelResult.suggestedAction === "create_reminder" && intelResult.actionData) {
            setLastCreatedReminder(intelResult.actionData);
            isActionCompleted = true;
          } else if (intelResult.isActionCompleted) {
            isActionCompleted = true;
          }
        }
      } catch (err) {
        console.error("[VoiceAssistantModal] Voice intelligence engine error:", err);
      }
    }

    // STAGE 3: Honest Senior-Friendly Fallback (Never Generic Reminder)
    if (!finalResponseText) {
      if (detectedLocale.startsWith("gu")) {
        finalResponseText = "માફ કરજો, મને આ બાબતે અત્યારે ચોક્કસ માહિતી ઉપલબ્ધ નથી. તમે બીજો કોઈ પ્રશ્ન પૂછી શકો છો.";
      } else if (detectedLocale.startsWith("hi")) {
        finalResponseText = "माफ़ कीजिए, मुझे इस विषय पर अभी पक्की जानकारी उपलब्ध नहीं है। आप मुझसे कोई अन्य प्रश्न पूछ सकते हैं।";
      } else {
        finalResponseText = "I apologize, but I do not have verified information on that topic right now. Feel free to ask me something else.";
      }
    }

    // Keep conversational history for multi-turn pronoun & topic retention
    conversationHistoryRef.current.push({ role: "user", content: text });
    conversationHistoryRef.current.push({ role: "assistant", content: finalResponseText });
    if (conversationHistoryRef.current.length > 16) {
      conversationHistoryRef.current = conversationHistoryRef.current.slice(-16);
    }

    setLastResponseText(finalResponseText);

    lastActionCompletedRef.current = isActionCompleted;
    if (isActionCompleted) {
      setVoiceState("done");
    }

    // Speak response cleanly
    speakResponse(finalResponseText, detectedLocale);
  };

  // User cancel handler
  const handleCancel = () => {
    cleanupAllAudio();
    conversationalAI.resetDialogue();
    setVoiceState("idle");
    setTranscript("");
    setErrorMessage(null);
  };

  // Exit modal handler
  const handleExit = () => {
    cleanupAllAudio();
    conversationalAI.resetDialogue();
    onClose();
  };

  const getReminderBadgeIcon = (type?: Reminder["type"]) => {
    switch (type) {
      case "medicine":
        return <Pill className="h-5 w-5 text-emerald-600" />;
      case "hydration":
        return <Droplets className="h-5 w-5 text-sky-600" />;
      case "walking":
        return <Footprints className="h-5 w-5 text-teal-600" />;
      case "family_call":
        return <Phone className="h-5 w-5 text-rose-600" />;
      case "appointment":
        return <Calendar className="h-5 w-5 text-purple-600" />;
      case "routine":
      default:
        // Plant/routine representation
        return <span className="text-xl">🌱</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-card border-2 border-border/80 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <MemoryBondLogo size="sm" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                Memory Bond Voice AI
              </h3>
              <p className="text-xs text-muted-foreground">
                Reliable Voice Assistant • {detectedLangName}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Close Voice AI"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Central State Display */}
        <div className="flex flex-col items-center justify-center min-h-[220px] py-4 text-center space-y-4">
          {/* Main Status & Animation */}
          {voiceState === "listening" && (
            <div className="flex flex-col items-center space-y-3 animate-in zoom-in-95">
              <div className="relative flex items-center justify-center">
                {/* Subtle pulse ring */}
                <div className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-ping duration-1000" />
                <div className="relative w-20 h-20 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg shadow-destructive/30">
                  <Mic className="h-9 w-9 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-destructive flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-ping" />
                  Listening...
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  "Tell me what you need"
                </p>
              </div>
            </div>
          )}

          {voiceState === "processing" && (
            <div className="flex flex-col items-center space-y-3 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center text-primary shadow-sm">
                <Sparkles className="h-9 w-9 text-primary animate-spin duration-1500" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-primary">Thinking...</p>
                <p className="text-sm text-muted-foreground">Understanding your request...</p>
              </div>
            </div>
          )}

          {voiceState === "responding" && (
            <div className="flex flex-col items-center space-y-3 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                <Volume2 className="h-9 w-9 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-primary">Speaking...</p>
              </div>
            </div>
          )}

          {voiceState === "done" && (
            <div className="flex flex-col items-center space-y-3 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Check className="h-10 w-10 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-black text-emerald-600">✓ Done</p>
              </div>
            </div>
          )}

          {voiceState === "error" && (
            <div className="flex flex-col items-center space-y-3 animate-in zoom-in-95">
              <div className="w-18 h-18 rounded-full bg-destructive/15 text-destructive flex items-center justify-center border border-destructive/30">
                <AlertCircle className="h-9 w-9" />
              </div>
              <p className="text-sm font-bold text-destructive max-w-xs">
                {errorMessage || "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          {voiceState === "idle" && (
            <div className="flex flex-col items-center space-y-3 animate-in zoom-in-95">
              <button
                type="button"
                onClick={startListening}
                className="w-20 h-20 rounded-full bg-secondary hover:bg-secondary/80 border-2 border-primary/40 flex items-center justify-center text-primary shadow-md hover:scale-105 transition-all cursor-pointer"
                title="Tap to speak"
              >
                <Mic className="h-9 w-9" />
              </button>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">Tap to speak</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Say something like: "Remind me tomorrow at 8 AM to water the plants"
                </p>
              </div>
            </div>
          )}

          {/* Live Transcript / Response Text Display */}
          {transcript && (
            <div className="w-full rounded-2xl bg-secondary/40 border border-border p-3 text-sm text-foreground italic font-medium max-h-24 overflow-y-auto">
              "{transcript}"
            </div>
          )}

          {/* Spoken Response Text */}
          {lastResponseText && voiceState !== "listening" && voiceState !== "idle" && (
            <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed max-w-md">
              {lastResponseText}
            </p>
          )}

          {/* VERIFIED CREATED REMINDER CARD (Requirement 14 & 30) */}
          {lastCreatedReminder && (
            <div className="w-full rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4 text-left space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Saved to Reminders Database</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {lastCreatedReminder.type}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                  {getReminderBadgeIcon(lastCreatedReminder.type)}
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-foreground">
                    {lastCreatedReminder.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1 text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime12h(lastCreatedReminder.time, currentLocale)}
                    </span>
                    {lastCreatedReminder.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {lastCreatedReminder.date === getLocalTomorrowDateString()
                          ? "Tomorrow"
                          : lastCreatedReminder.date === getLocalTodayDateString()
                          ? "Today"
                          : lastCreatedReminder.date}
                      </span>
                    )}
                    {lastCreatedReminder.repeat && lastCreatedReminder.repeat !== "none" && (
                      <span>• Repeat: {lastCreatedReminder.repeat}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct View in Reminders button */}
              {onNavigate && (
                <Button
                  size="sm"
                  onClick={() => {
                    cleanupAllAudio();
                    onNavigate("reminders");
                    onClose();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-9 text-xs gap-1.5 mt-1 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Reminders Screen
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips (Covering Core Test Cases) */}
        {voiceState === "idle" && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {[
              "Kal 8 baje mujhe paudhon ko pani dene ka reminder laga do.",
              "Tomorrow at 8 AM remind me to water the plants.",
              "Every day at 9 AM remind me to drink water.",
              "Remind me to take my medicine tomorrow at 8 PM.",
              "What reminders do I have today?",
              "What's my next reminder?",
            ].map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => processQuery(prompt)}
                className="px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-all border border-border/60 text-[11px] cursor-pointer"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        )}

        {/* Action Controls (Cancel / Stop Speaking / Close) */}
        <div className="flex items-center justify-center gap-3">
          {voiceState === "listening" && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-2xl font-bold h-11 px-6 border-border cursor-pointer"
            >
              Cancel
            </Button>
          )}

          {voiceState === "responding" && (
            <Button
              variant="destructive"
              onClick={() => {
                voiceManager.stopSpeaking();
                setVoiceState("idle");
              }}
              className="rounded-2xl font-bold h-11 px-6 gap-2 cursor-pointer"
            >
              <StopCircle className="h-4 w-4" /> Stop Speaking
            </Button>
          )}

          {(voiceState === "done" || voiceState === "idle" || voiceState === "error") && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={startListening}
                className="rounded-2xl font-bold h-11 px-5 gap-2 cursor-pointer text-primary border-primary/40 hover:bg-primary/10"
              >
                <Mic className="h-4 w-4" /> {voiceState === "done" ? "Ask Another" : "Tap to Speak"}
              </Button>
              <Button
                onClick={handleExit}
                className="rounded-2xl font-bold h-11 px-6 cursor-pointer"
              >
                Close
              </Button>
            </div>
          )}
        </div>

        {/* Text Fallback Input Bar (Requirement 28) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputDraft.trim()) {
              processQuery(inputDraft);
              setInputDraft("");
            }
          }}
          className="flex gap-2 pt-2 border-t border-border/40"
        >
          <Input
            value={inputDraft}
            onChange={(e) => setInputDraft(e.target.value)}
            placeholder="Or type your request here (e.g. 'Tomorrow at 8 AM remind me to water the plants')..."
            className="h-11 rounded-2xl text-sm bg-secondary/30"
          />
          <Button
            type="submit"
            disabled={!inputDraft.trim() || voiceState === "processing"}
            className="h-11 px-4 rounded-2xl font-bold cursor-pointer shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
