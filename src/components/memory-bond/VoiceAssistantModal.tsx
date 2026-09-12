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
  MessageSquare,
  Bot,
  User,
  HelpCircle,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import {
  askVoiceAssistant,
  getLocalOfflineFallback,
  type VoiceAssistantResponse,
} from "@/lib/voiceAssistant.functions";
import { voiceManager } from "@/lib/voiceProvider";
import {
  parseVoiceIntent,
  type VoiceIntent,
  detectLanguage,
  pick,
  cleanAIResponse,
  MEDICINE_TAKEN_SUCCESS_MSG,
  REMINDER_SAVED_SUCCESS_MSG,
  APPOINTMENT_SAVED_SUCCESS_MSG,
  JOURNAL_SAVED_SUCCESS_MSG,
  CANCELLED_MSG,
  ERROR_HEARING_MSG,
  RETRY_LABEL_MSG,
  BARGE_IN_HINT_MSG,
} from "@/lib/voiceParser";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n, LANGUAGES } from "@/lib/i18n";

export type AssistantVoiceState =
  | "idle"        // 🎙️ Tap to speak
  | "listening"   // 🔴 Listening...
  | "processing"  // 🧠 Thinking...
  | "speaking"    // 🔊 Speaking...
  | "error";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  languageName?: string;
  locale?: string;
  timestamp: number;
}

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
  const askAIServerFn = useServerFn(askVoiceAssistant);

  // States with persistent session memory
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>("idle");
  const [currentLocale, setCurrentLocale] = useState<string>(speechLocale || "en-IN");
  const [detectedLangName, setDetectedLangName] = useState<string>("Auto-Detect");
  const [transcript, setTranscript] = useState<string>("");
  const [inputDraft, setInputDraft] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem("mb_voice_chat_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  // Stored clean AI response for Speak Again / Listen Again (Requirements 8 & 9)
  const [lastCleanAIResponse, setLastCleanAIResponse] = useState<string>("");
  const [pendingIntent, setPendingIntent] = useState<VoiceIntent | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<boolean>(true);

  // References to preserve synchronous state across recognition and event loop callbacks
  const isOpenRef = useRef(isOpen);
  const isActiveSessionRef = useRef(false);
  const isThinkingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const currentLocaleRef = useRef(currentLocale);
  const lastCleanAIResponseRef = useRef<string>("");
  const lastLocaleRef = useRef<string>(currentLocale);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const listenTimeoutRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    currentLocaleRef.current = currentLocale;
  }, [currentLocale]);

  // Keep messagesRef in lockstep with messages state & persist to sessionStorage
  useEffect(() => {
    messagesRef.current = messages;
    try {
      sessionStorage.setItem("mb_voice_chat_history", JSON.stringify(messages.slice(-20)));
    } catch {}
  }, [messages]);

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, voiceState]);

  const toggleConversationMode = (enabled: boolean) => {
    setConversationMode(enabled);
    localStorage.setItem("mb_conversation_mode", String(enabled));
  };

  const handleClearChat = () => {
    messagesRef.current = [];
    setMessages([]);
    try {
      sessionStorage.removeItem("mb_voice_chat_history");
    } catch {}
  };

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  // -------------------------------------------------------------------------
  // Interruption / Barge-in: immediately cancel audio if speaking
  // -------------------------------------------------------------------------
  const handleBargeIn = () => {
    voiceManager.stopSpeaking();
    isSpeakingRef.current = false;
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
    if (voiceState === "speaking") {
      setVoiceState("idle");
    }
  };

  // -------------------------------------------------------------------------
  // Clean Stop: Halts session completely until user triggers mic again
  // (Requirement 16)
  // -------------------------------------------------------------------------
  const handleStop = () => {
    isActiveSessionRef.current = false;
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    isThinkingRef.current = false;
    isSpeakingRef.current = false;
    voiceManager.stopSpeaking();
    setVoiceState("idle");
  };

  // -------------------------------------------------------------------------
  // Clean Exit: Stops voice/TTS, mic, continuous loops, closes modal & returns to Home
  // -------------------------------------------------------------------------
  const handleExit = () => {
    // 1. Immediately halt session & any continuous turn loops
    isActiveSessionRef.current = false;
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }

    // 2. Stop microphone/listening if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // 3. Immediately stop any currently playing AI voice/TTS & clear audio queue
    isThinkingRef.current = false;
    isSpeakingRef.current = false;
    voiceManager.stopSpeaking();

    // 4. Clean up audio/conversation states
    setVoiceState("idle");
    setPendingIntent(null);
    setTranscript("");

    // 5. Close Voice Assistant modal
    onClose();

    // 6. Return user directly to Home Screen / Dashboard using existing navigation
    if (onNavigate) {
      const homeTab =
        store?.profile?.role === "caregiver"
          ? "caregiver"
          : store?.profile?.role === "healthcare_worker"
          ? "healthcare"
          : "home";
      onNavigate(homeTab);
    }
  };

  // -------------------------------------------------------------------------
  // Start Listening (🔴 Listening...)
  // -------------------------------------------------------------------------
  const startListening = () => {
    if (!isOpenRef.current) return;

    // CRITICAL (Requirements 6 & 15): If AI is actively speaking, NEVER interrupt or cancel speech!
    if (isSpeakingRef.current || voiceState === "speaking") {
      console.log("Speech is currently active. Ignoring startListening call until speech ends.");
      return;
    }

    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }

    setRecognitionError(null);
    isThinkingRef.current = false;
    isSpeakingRef.current = false;

    if (!SpeechRecognition) {
      setVoiceState("error");
      setRecognitionError(
        "Speech recognition is not supported in this browser. You can still type your questions naturally below."
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

      recognition.lang = currentLocaleRef.current;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        // If speaking started while mic was initializing, abort mic immediately
        if (isSpeakingRef.current) {
          try {
            recognition.abort();
          } catch {}
          return;
        }
        setVoiceState("listening");
      };

      recognition.onresult = (event: any) => {
        // Echo & premature interruption prevention: ignore mic if speaking
        if (isSpeakingRef.current) {
          return;
        }

        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalText += item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        const liveText = (finalText || interimText).trim();
        if (liveText) {
          setTranscript(liveText);
        }

        if (finalText.trim()) {
          const clean = finalText.trim();

          // Echo rejection: Discard if acoustic echo of assistant's own TTS output
          if (voiceManager.isEcho(clean)) {
            return;
          }

          // Process the recognized query
          processQuery(clean);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event?.error;
        if (errType === "no-speech") {
          // Senior paused or room is quiet: continue listening gracefully in continuous mode
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
            }, 300);
          }
          return;
        }

        if (errType === "aborted") {
          return;
        }

        // Only show error if not actively speaking
        if (!isSpeakingRef.current) {
          setVoiceState("error");
          setRecognitionError("Sorry, I couldn't understand that. Please try again.");
        }
      };

      recognition.onend = () => {
        // If assistant is thinking or speaking, DO NOT restart mic
        if (isThinkingRef.current || isSpeakingRef.current) {
          return;
        }

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
      if (!isSpeakingRef.current) {
        setVoiceState("error");
        setRecognitionError(pick(ERROR_HEARING_MSG, currentLocaleRef.current));
      }
    }
  };

  // -------------------------------------------------------------------------
  // Speak Answer (🔊 Speaking...) with Audio & Echo Guard
  // (Requirements 3, 4, 5, 6, 7)
  // -------------------------------------------------------------------------
  const speakAIAnswer = (
    text: string,
    locale: string,
    onFinish?: () => void
  ) => {
    // Clean response before sending to TTS (Requirement 2 & 11)
    const clean = cleanAIResponse(text);
    if (!clean || clean.trim().length === 0) {
      console.log("TTS skipped: cleaned response is empty");
      setVoiceState("idle");
      if (onFinish) onFinish();
      return;
    }

    // 1. Immediately cancel any scheduled listen timeouts so continuous mode cannot fire during speech
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }

    // 2. Abort active speech recognition so mic never picks up assistant speech
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    isThinkingRef.current = false;
    isSpeakingRef.current = true;
    setVoiceState("speaking");

    voiceManager.speak(
      clean,
      locale,
      () => {
        // onStart
        isSpeakingRef.current = true;
        setVoiceState("speaking");
      },
      () => {
        // Speech ended successfully after all chunks finish (Requirements 4, 5, 7)
        isSpeakingRef.current = false;
        if (onFinish) onFinish();

        // Continuous natural conversation: only schedule next turn AFTER all speech has finished
        if (conversationMode && isOpenRef.current && isActiveSessionRef.current) {
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
          }, 500);
        } else {
          setVoiceState("idle");
        }
      },
      (ttsErr) => {
        // On TTS failure: safely return to idle (Requirement 18)
        console.warn("[TTS_ERROR] Playback block/error:", ttsErr);
        isSpeakingRef.current = false;
        if (onFinish) onFinish();
        setVoiceState("idle");
      }
    );
  };

  // -------------------------------------------------------------------------
  // Speak Again / Listen Again (Replays complete last clean AI response)
  // (CRITICAL REQUIREMENTS 8 & 9)
  // -------------------------------------------------------------------------
  const handleSpeakAgain = () => {
    const textToReplay =
      lastCleanAIResponseRef.current ||
      [...messagesRef.current].reverse().find((m) => m.role === "assistant")?.text;

    if (!textToReplay) return;

    // Stop only previous TTS if still playing & reset audio state
    voiceManager.stopSpeaking();
    isSpeakingRef.current = false;
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }

    const replayLocale =
      lastLocaleRef.current ||
      [...messagesRef.current].reverse().find((m) => m.role === "assistant")?.locale ||
      currentLocaleRef.current;

    speakAIAnswer(textToReplay, replayLocale);
  };

  // -------------------------------------------------------------------------
  // Core AI Pipeline: STT -> AI Reasoning -> Automatic Language -> TTS
  // (Full Context Retention via Synchronous messagesRef)
  // -------------------------------------------------------------------------
  const processQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    handleBargeIn();
    isThinkingRef.current = true;
    setVoiceState("processing");
    setRecognitionError(null);

    // 1. Extract previous history from messagesRef BEFORE adding current turn
    const previousTurns = [...messagesRef.current];
    const recentHistory = previousTurns.slice(-8).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    // 2. Append User Message to messagesRef and state synchronously
    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      role: "user",
      text,
      locale: currentLocaleRef.current,
      timestamp: Date.now(),
    };
    const updatedWithUser = [...previousTurns, userMsg];
    messagesRef.current = updatedWithUser;
    setMessages(updatedWithUser);
    setTranscript(text);

    if (store && typeof store.addConversation === "function") {
      store.addConversation(`User: ${text}`);
    }

    // 3. Pre-detect language on client for immediate locale awareness
    const clientDetected = detectLanguage(text, currentLocaleRef.current);
    if (clientDetected) {
      setCurrentLocale(clientDetected);
      currentLocaleRef.current = clientDetected;
    }

    // 4. Call Conversational AI via Secure Server Function (Passing recentHistory)
    let aiResponse: VoiceAssistantResponse;

    try {
      aiResponse = await askAIServerFn({
        data: {
          query: text,
          history: recentHistory,
          context: {
            userName: store.user?.name || "Senior",
            userAge: String(store.user?.age || "72"),
            userRegion: "NER India / Gujarat / India",
            medicinesCount: store.medicines?.length || 0,
            pendingMeds: store.medicines?.map((m) => m.name).join(", "),
            routinesCompleted: `${
              store.routines?.filter((r) => r.completed).length || 0
            } completed`,
            nextAppointment: store.appointments?.[0]?.title,
          },
          preferredLocale: clientDetected || currentLocaleRef.current,
        },
      });
    } catch (err) {
      console.warn("Server AI Function unavailable, using local conversational fallback with history:", err);
      aiResponse = getLocalOfflineFallback(
        text,
        recentHistory,
        clientDetected || currentLocaleRef.current,
        {
          userName: store.user?.name || "Senior",
        }
      );
    }

    isThinkingRef.current = false;

    // 5. Apply Auto-Detected Language & Mirroring
    const finalLocale = aiResponse.detectedLocale || clientDetected || currentLocaleRef.current;
    setCurrentLocale(finalLocale);
    currentLocaleRef.current = finalLocale;
    setDetectedLangName(aiResponse.languageName || "Auto-Detected");

    // Sync app language with detected language
    const matchedLang = LANGUAGES.find(
      (l) => l.speech.toLowerCase() === finalLocale.toLowerCase() || l.speech.startsWith(finalLocale.slice(0, 2))
    );
    if (matchedLang) {
      setLang(matchedLang.code);
      if (store && typeof store.updateLanguage === "function") {
        store.updateLanguage(matchedLang.code);
      }
    }

    // Clean response before using it anywhere (Requirements 2, 3, 17)
    const cleanReply = cleanAIResponse(aiResponse.reply);
    const finalCleanText = cleanReply || "I am here to help you. What would you like to know?";

    // Store as the SINGLE SOURCE OF TRUTH (Requirements 8, 9, 17)
    lastCleanAIResponseRef.current = finalCleanText;
    setLastCleanAIResponse(finalCleanText);
    lastLocaleRef.current = finalLocale;

    // 6. Append Assistant Message to messagesRef and state synchronously (Never raw JSON!)
    const assistantMsg: ChatMessage = {
      id: "a_" + Date.now(),
      role: "assistant",
      text: finalCleanText,
      languageName: aiResponse.languageName,
      locale: finalLocale,
      timestamp: Date.now(),
    };
    const updatedWithAssistant = [...messagesRef.current, assistantMsg];
    messagesRef.current = updatedWithAssistant;
    setMessages(updatedWithAssistant);

    if (store && typeof store.addConversation === "function") {
      store.addConversation(`Assistant: ${finalCleanText}`);
    }

    // 7. Check if user requested a structured care action
    if (aiResponse.suggestedAction && aiResponse.suggestedAction !== "none") {
      try {
        const intent = parseVoiceIntent(text, store, finalLocale, pendingIntent);
        if (intent && intent.type !== "UNKNOWN" && intent.type !== "ANSWER") {
          setPendingIntent(intent);
        }
      } catch {}
    }

    // 8. Speak the answer in the SAME detected language
    speakAIAnswer(finalCleanText, finalLocale);
  };

  // -------------------------------------------------------------------------
  // Care Action Confirmations (Take Medicine, Reminders, Appointments, Games)
  // -------------------------------------------------------------------------
  const handleConfirmIntent = () => {
    if (!pendingIntent) return;

    if (pendingIntent.type === "TAKE_MEDICINE") {
      const medId = pendingIntent.medicineId || store.medicines[0]?.id;
      if (medId) {
        store.takeMedicine(medId);
        speakAIAnswer(
          pick(MEDICINE_TAKEN_SUCCESS_MSG, currentLocaleRef.current),
          currentLocaleRef.current
        );
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
      speakAIAnswer(remFn(pendingIntent.time), currentLocaleRef.current);
    } else if (pendingIntent.type === "CREATE_APPOINTMENT") {
      store.addAppointment({
        title: pendingIntent.title,
        date: pendingIntent.date,
        time: pendingIntent.time,
        kind: "doctor",
        location: pendingIntent.location || "Clinic",
        notes: "Created via Voice Assistant",
      });
      speakAIAnswer(
        pick(APPOINTMENT_SAVED_SUCCESS_MSG, currentLocaleRef.current),
        currentLocaleRef.current
      );
    } else if (pendingIntent.type === "ADD_JOURNAL") {
      store.addJournalEntry({
        title: pendingIntent.title,
        body: pendingIntent.body,
        entry_date: new Date().toISOString().slice(0, 10),
        kind: "voice",
      });
      speakAIAnswer(
        pick(JOURNAL_SAVED_SUCCESS_MSG, currentLocaleRef.current),
        currentLocaleRef.current
      );
    } else if (pendingIntent.type === "NAVIGATE") {
      if (onNavigate) {
        onNavigate(pendingIntent.targetView);
      }
    }

    setPendingIntent(null);
  };

  const handleCancelIntent = () => {
    setPendingIntent(null);
    speakAIAnswer(
      pick(CANCELLED_MSG, currentLocaleRef.current),
      currentLocaleRef.current
    );
  };

  const handleRetry = () => {
    setRecognitionError(null);
    isActiveSessionRef.current = true;
    startListening();
  };

  // -------------------------------------------------------------------------
  // Lifecycle: Auto-start on modal open, clean stop on close
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
    }
  }, [isOpen]);

  // Escape key handler to trigger clean Exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpenRef.current) {
        handleExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const latestAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleExit();
        }
      }}
    >
      <div className="relative w-full max-w-2xl rounded-3xl border-2 border-primary/40 bg-card p-4 sm:p-7 shadow-2xl space-y-5 flex flex-col max-h-[92vh]">
        
        {/* Top Header: STOP Button, Auto-Detected Language Pill, New Topic, Language Selector, Exit Button */}
        <div className="flex items-center justify-between pb-3 border-b border-border/70 shrink-0 gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2">
            {/* Immediate Stop Speaking / Cancel Button */}
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStop}
              className="rounded-full px-3.5 py-1.5 text-xs font-black gap-1.5 shadow-sm hover:scale-105 transition-transform"
            >
              <VolumeX className="h-4 w-4" /> STOP
            </Button>

            {/* Auto-Detected Language Pill Badge */}
            <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-black shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Languages className="h-3.5 w-3.5" />
              <span>{detectedLangName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Clear Chat / Start New Topic Button */}
            {messages.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearChat}
                className="rounded-full text-xs font-bold gap-1 text-muted-foreground hover:text-foreground h-8 px-2.5"
                title="Reset conversation memory for a new topic"
              >
                <RotateCcw className="h-3.5 w-3.5" /> New Topic
              </Button>
            )}

            {/* Optional Manual Language Override */}
            <select
              value={currentLocale}
              onChange={(e) => {
                const newLocale = e.target.value;
                setCurrentLocale(newLocale);
                currentLocaleRef.current = newLocale;
                const matched = LANGUAGES.find((l) => l.speech === newLocale);
                if (matched) {
                  setDetectedLangName(matched.name);
                  setLang(matched.code);
                }
              }}
              className="bg-secondary text-foreground text-xs font-bold rounded-full px-2.5 py-1 border border-border cursor-pointer focus:outline-none max-w-[135px] sm:max-w-none text-ellipsis overflow-hidden"
              title="Manual language override (Auto-detection is default)"
            >
              <option value="auto">🌐 Auto-Detect</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.speech}>
                  {l.native} ({l.label})
                </option>
              ))}
            </select>

            {/* Clearly Visible Exit Button (Accessible, Mobile-Friendly, Top-Right Corner) */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExit}
              className="rounded-full px-3.5 py-1.5 text-xs font-black gap-1.5 border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-all shadow-xs h-8 sm:h-9 shrink-0 hover:scale-105"
              title="Exit Voice Assistant"
              aria-label="Exit Voice Assistant"
            >
              <X className="h-4 w-4" />
              <span>Exit</span>
            </Button>
          </div>
        </div>

        {/* 4 Distinct Voice UI States: 🎙️ Tap to speak | 🔴 Listening... | 🧠 Thinking... | 🔊 Speaking... */}
        <div className="text-center space-y-3 shrink-0">
          {/* Large Central Microphone Button (CRITICAL REQUIREMENT 7) */}
          <div className="flex justify-center">
            <button
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
              className={`h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-2xl focus:outline-none ${
                voiceState === "listening"
                  ? "bg-destructive text-white border-destructive/50 scale-110 shadow-destructive/40 animate-pulse ring-8 ring-destructive/20"
                  : voiceState === "processing"
                  ? "bg-amber-500 text-white border-amber-400 scale-105 shadow-amber-500/30 animate-pulse ring-8 ring-amber-500/20"
                  : voiceState === "speaking"
                  ? "bg-primary text-white border-primary/60 scale-105 shadow-primary/40 animate-pulse ring-8 ring-primary/20"
                  : voiceState === "error"
                  ? "bg-destructive/20 text-destructive border-destructive ring-4 ring-destructive/10"
                  : "bg-primary hover:bg-primary/90 text-white border-primary/30 hover:scale-105 shadow-primary/30"
              }`}
              title={
                voiceState === "speaking"
                  ? "Tap to interrupt speech"
                  : voiceState === "listening"
                  ? "Tap to pause listening"
                  : "Tap to speak"
              }
            >
              {voiceState === "listening" ? (
                <Mic className="h-12 w-12 sm:h-14 sm:w-14 animate-bounce" />
              ) : voiceState === "processing" ? (
                <Sparkles className="h-12 w-12 sm:h-14 sm:w-14 animate-spin" />
              ) : voiceState === "speaking" ? (
                <Volume2 className="h-12 w-12 sm:h-14 sm:w-14 animate-pulse" />
              ) : voiceState === "error" ? (
                <AlertCircle className="h-12 w-12 sm:h-14 sm:w-14" />
              ) : (
                <Mic className="h-12 w-12 sm:h-14 sm:w-14" />
              )}
            </button>
          </div>

          {/* Explicit State Indicator Label */}
          <div className="flex items-center justify-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                voiceState === "listening"
                  ? "bg-destructive animate-ping"
                  : voiceState === "processing"
                  ? "bg-amber-500 animate-pulse"
                  : voiceState === "speaking"
                  ? "bg-primary animate-pulse"
                  : voiceState === "error"
                  ? "bg-destructive"
                  : "bg-muted-foreground/50"
              }`}
            />
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {voiceState === "listening"
                ? "🔴 Listening... (Speak naturally)"
                : voiceState === "processing"
                ? "🧠 Thinking... (Understanding your question)"
                : voiceState === "speaking"
                ? "🔊 Speaking... (Tap button to interrupt)"
                : voiceState === "error"
                ? "⚠️ Speech Error"
                : "🎙️ Tap to speak"}
            </h2>
          </div>

          {voiceState === "speaking" && (
            <p className="text-xs font-bold text-primary animate-pulse">
              {pick(BARGE_IN_HINT_MSG, currentLocaleRef.current)}
            </p>
          )}
        </div>

        {/* Multi-Turn Conversation Stream with Persistent Context Memory (CRITICAL REQUIREMENT 1 & 8) */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto space-y-3 p-3 sm:p-4 rounded-2xl bg-secondary/40 border border-border/70 min-h-[140px] max-h-[260px] scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground space-y-2">
              <Bot className="h-10 w-10 mx-auto opacity-40 text-primary" />
              <p className="font-bold text-sm">
                Speak in any Indian language (Hindi, Gujarati, English, Bengali, Marathi, etc.)
              </p>
              <p className="text-xs text-muted-foreground">
                Ask follow-up questions naturally ("Explain it simply", "Ab Hindi mein samjhao", "હવે ગુજરાતીમાં કહો").
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 text-sm sm:text-base leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground font-semibold rounded-tr-none shadow-md"
                      : "bg-card border-2 border-primary/20 text-foreground font-medium rounded-tl-none shadow-md"
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.role === "assistant" && msg.languageName && (
                    <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {msg.languageName}
                    </span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Live Transcript Bubble while user is speaking */}
          {voiceState === "listening" && transcript && (
            <div className="flex justify-end gap-2">
              <div className="max-w-[80%] rounded-2xl p-3 text-sm bg-primary/20 border border-primary/30 text-foreground italic rounded-tr-none animate-pulse">
                " {transcript} "
              </div>
            </div>
          )}

          {/* Thinking Animation Bubble */}
          {voiceState === "processing" && (
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl p-3 text-sm bg-card border border-border text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
                <span className="font-semibold text-xs">AI is thinking with conversation context...</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls for Latest AI Answer (Speak Again + Listen Again + Ask Question + Stop Speaking) */}
        {latestAssistantMessage && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            {/* Speak Again Button (Requirement 8) */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSpeakAgain}
              className="rounded-xl font-black text-xs gap-1.5 border-primary/60 text-primary hover:bg-primary/10 h-9 px-3.5 shadow-xs"
              title="Replay the complete AI answer"
            >
              <Volume2 className="h-4 w-4" /> 🔊 Speak Again
            </Button>

            {/* Listen Again Button (Requirement 9) */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSpeakAgain}
              className="rounded-xl font-black text-xs gap-1.5 border-primary/30 text-muted-foreground hover:text-foreground h-9 px-3 shadow-xs"
              title="Replay the complete AI answer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Listen Again
            </Button>

            {/* Ask Question Follow-up Button */}
            <Button
              size="sm"
              onClick={() => {
                isActiveSessionRef.current = true;
                handleStop();
                setTimeout(() => {
                  startListening();
                }, 80);
              }}
              className="rounded-xl font-black text-xs gap-1.5 bg-primary text-white hover:bg-primary/90 h-9 px-3.5 shadow-sm"
              title="Ask another question by voice"
            >
              <Mic className="h-4 w-4" /> 🎙️ Ask Question
            </Button>

            {/* Stop Speaking Button (Requirement 16) */}
            {voiceState === "speaking" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStop}
                className="rounded-xl font-black text-xs gap-1.5 h-9 px-3.5 shadow-sm animate-pulse"
                title="Stop speech playback"
              >
                <StopCircle className="h-4 w-4" /> ⏹️ Stop Speaking
              </Button>
            )}
          </div>
        )}

        {/* Structured Action Confirmation Card (Caregiver & Senior Safety) */}
        {pendingIntent && (
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4 space-y-3 shrink-0 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Confirm Action
            </div>
            <p className="text-sm sm:text-base font-bold text-foreground">
              {"confirmationMessage" in pendingIntent
                ? (pendingIntent as any).confirmationMessage
                : "Would you like to execute this action?"}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                onClick={handleConfirmIntent}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 rounded-xl text-sm"
              >
                <Check className="h-4 w-4 mr-1" /> CONFIRM
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelIntent}
                className="font-black h-11 rounded-xl text-sm"
              >
                <X className="h-4 w-4 mr-1" /> CANCEL
              </Button>
            </div>
          </div>
        )}

        {/* Error Notification with User-Friendly Retry (CRITICAL REQUIREMENT 10) */}
        {recognitionError && (
          <div className="rounded-2xl bg-destructive/15 border border-destructive/30 p-3.5 text-center space-y-2 shrink-0 animate-in fade-in">
            <p className="text-xs text-destructive font-bold">{recognitionError}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="rounded-full font-bold border-destructive/40 text-destructive text-xs gap-1.5 h-8"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {pick(RETRY_LABEL_MSG, currentLocaleRef.current)}
            </Button>
          </div>
        )}

        {/* Quick Test Prompt Chips (Covering Hindi, Gujarati, English, Romanized, Mixed) */}
        <div className="flex flex-wrap gap-1.5 justify-center text-xs shrink-0 max-h-16 overflow-y-auto">
          {[
            "What is AI?",
            "Explain it simply",
            "Ab Hindi mein samjhao",
            "હવે ગુજરાતીમાં કહો",
            "kem cho?",
            "mare medicine kyare levani che?",
            "kaise ho?",
            "aaj kya karna hai?",
            "Can you tell me aaj ka routine?",
            "Tell me a short moral story",
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => processQuery(prompt)}
              className="rounded-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold px-2.5 py-1 transition-all border border-border/60 text-[11px]"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Text Fallback Input (CRITICAL REQUIREMENT 10) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputDraft.trim()) {
              processQuery(inputDraft);
              setInputDraft("");
            }
          }}
          className="flex gap-2 shrink-0"
        >
          <Input
            value={inputDraft}
            onChange={(e) => setInputDraft(e.target.value)}
            placeholder="Or type here (e.g. 'What is AI?', 'Explain it simply', 'Ab Hindi mein samjhao')..."
            className="h-11 rounded-2xl text-sm"
          />
          <Button
            type="submit"
            disabled={!inputDraft.trim() || voiceState === "processing"}
            className="h-11 px-4 rounded-2xl font-bold"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Continuous Conversation Toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs text-muted-foreground shrink-0">
          <span>Continuous Natural Conversation:</span>
          <button
            type="button"
            onClick={() => toggleConversationMode(!conversationMode)}
            className={`font-bold px-3 py-0.5 rounded-full border transition-all text-[11px] ${
              conversationMode
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {conversationMode ? "Active (Natural Turn Loop)" : "Single Turn"}
          </button>
        </div>
      </div>
    </div>
  );
}
