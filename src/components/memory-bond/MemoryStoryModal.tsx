import { useState, useEffect } from "react";
import {
  Heart,
  X,
  Sparkles,
  Volume2,
  Mic,
  CheckCircle2,
  Users,
  MessageCircle,
  Clock,
  Compass,
  ChevronRight,
  ChevronLeft,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore, MemoryStory } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

export function MemoryStoryModal({
  isOpen,
  onClose,
  store,
}: {
  isOpen: boolean;
  onClose: () => void;
  store: MemoryBondStore;
}) {
  const { t, speechLocale } = useI18n();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [responseGiven, setResponseGiven] = useState<boolean>(false);
  const [responseType, setResponseType] = useState<"remembered" | "curious" | null>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);

  const stories = store.memoryStories || [];
  const activeStory: MemoryStory | undefined = stories[activeStoryIndex];

  useEffect(() => {
    setResponseGiven(false);
    setResponseType(null);
    setIsVoiceRecording(false);
  }, [activeStoryIndex, isOpen]);

  if (!isOpen || !activeStory) return null;

  const handleHearPrompt = () => {
    stopSpeaking();
    const prompt = activeStory.voicePrompt || `${activeStory.title}. ${activeStory.question}`;
    speakText(prompt, speechLocale);
  };

  const handleRespond = (remembered: boolean) => {
    setResponseGiven(true);
    setResponseType(remembered ? "remembered" : "curious");

    const feedback = remembered
      ? `How heartwarming! This cherished memory is lovingly connected to your family.`
      : `Thank you for taking a moment with this memory. Your family lovingly saved it for you.`;
    speakText(feedback, speechLocale);

    store.recordMemoryStoryReaction(
      activeStory.id,
      remembered,
      remembered ? "Senior recognized memory with joy" : "Senior listened with curiosity"
    );
  };

  const handleVoiceResponse = () => {
    setIsVoiceRecording(true);
    const feedback = "Listening to your memory... Thank you for sharing this thought!";
    speakText(feedback, speechLocale);

    setTimeout(() => {
      setIsVoiceRecording(false);
      handleRespond(true);
    }, 3000);
  };

  const handleNextStory = () => {
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      setActiveStoryIndex(0);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else {
      setActiveStoryIndex(stories.length - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-rose-500/40 bg-card p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-rose-500/15 text-rose-600">
              <Heart className="h-5 w-5 fill-rose-500/20" />
            </span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-rose-600">
                Memory Story (স্মৃতি কথা)
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                {activeStory.title}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-2 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Featured Story Photo / Visual */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-border bg-slate-950 aspect-video shadow-md group">
          <img
            src={activeStory.imageUrl}
            alt={activeStory.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md w-fit">
              <Users className="h-3.5 w-3.5" /> Added by {activeStory.addedBy} ({activeStory.relationship})
            </div>
            <p className="text-base sm:text-lg font-bold leading-snug drop-shadow-sm">
              "{activeStory.description}"
            </p>
          </div>
        </div>

        {/* Story Question & Voice Prompt */}
        <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="text-xl sm:text-2xl font-black text-foreground">
              {activeStory.question}
            </h4>
          </div>

          <p className="text-sm font-semibold text-muted-foreground max-w-lg mx-auto">
            {activeStory.familyContext}
          </p>

          <Button
            size="sm"
            variant="outline"
            onClick={handleHearPrompt}
            className="rounded-2xl gap-2 font-bold text-xs h-11 px-5 text-primary border-primary/30 hover:bg-primary/10 shadow-xs"
          >
            <Volume2 className="h-4 w-4" /> Listen to Voice Prompt
          </Button>
        </div>

        {/* Senior Response Choices */}
        {!responseGiven ? (
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
              Tap your answer or speak to Memory Bond:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRespond(true)}
                className="h-16 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="h-6 w-6" /> Yes, I Remember!
              </button>

              <button
                type="button"
                onClick={() => handleRespond(false)}
                className="h-16 rounded-2xl border-2 border-border bg-card hover:bg-secondary text-foreground font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <MessageCircle className="h-5 w-5 text-primary" /> Tell Me More
              </button>
            </div>

            <Button
              variant="outline"
              onClick={handleVoiceResponse}
              className={`w-full h-14 rounded-2xl font-black text-base gap-2 border-2 border-primary/40 ${
                isVoiceRecording ? "bg-primary text-primary-foreground animate-pulse" : "text-primary hover:bg-primary/10"
              }`}
            >
              <Mic className="h-5 w-5" />
              {isVoiceRecording ? "Listening to your voice..." : "🎙️ Speak Your Memory Aloud"}
            </Button>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-emerald-500/40 bg-emerald-500/10 p-6 text-center space-y-3 animate-in zoom-in-95">
            <div className="text-4xl">❤️</div>
            <h4 className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-200">
              {responseType === "remembered" ? "Memory Connected!" : "Family Story Shared"}
            </h4>
            <p className="text-sm font-semibold text-foreground/90 max-w-md mx-auto leading-relaxed">
              This memory is warmly connected to your family circle. Your caregiver and loved ones can see your engagement.
            </p>
          </div>
        )}

        {/* Carousel Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="ghost"
            onClick={handlePrevStory}
            className="rounded-2xl gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Memory
          </Button>

          <span className="text-xs font-black text-muted-foreground">
            Story {activeStoryIndex + 1} of {stories.length}
          </span>

          <Button
            variant="ghost"
            onClick={handleNextStory}
            className="rounded-2xl gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            Next Memory <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
