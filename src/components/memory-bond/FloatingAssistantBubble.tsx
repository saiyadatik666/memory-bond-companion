import { useState } from "react";
import { Mic, ShieldAlert } from "lucide-react";

interface FloatingAssistantBubbleProps {
  onOpenVoice: () => void;
  onOpenSos: () => void;
  disabled?: boolean;
}

export function FloatingAssistantBubble({
  onOpenVoice,
  onOpenSos,
  disabled = false,
}: FloatingAssistantBubbleProps) {
  if (disabled) return null;

  return (
    <div
      className="fixed right-2.5 min-[380px]:right-4 sm:right-6 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-8 z-40 flex flex-col items-center gap-2.5 sm:gap-3 select-none pointer-events-auto"
      aria-label="Floating Controls"
    >
      {/* 1. SOS Emergency Button (Positioned safely ABOVE Voice AI as per Section 12 Option B) */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onOpenSos}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] active:scale-95 text-white shadow-[0_4px_14px_rgba(220,38,38,0.4)] flex items-center justify-center transition-all cursor-pointer border-2 border-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#DC2626]/30"
          aria-label="Trigger Emergency SOS"
          title="Emergency SOS Help"
        >
          <ShieldAlert className="h-5 w-5 drop-shadow-xs" />
        </button>
        <span className="text-[9px] font-black text-[#DC2626] bg-white/95 px-1.5 py-0.5 rounded-full shadow-xs border border-[#FECACA] mt-0.5 tracking-wider uppercase">
          SOS
        </span>
      </div>

      {/* 2. Voice AI Floating Button (Section 11: 56–64px circular mic above bottom nav) */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onOpenVoice}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1E6FD9] hover:bg-[#1858AE] active:scale-95 text-white shadow-[0_8px_24px_rgba(30,111,217,0.38)] flex items-center justify-center transition-all cursor-pointer border-2 border-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E6FD9]/30"
          aria-label="Speak to AI Voice Assistant"
          title="Speak to Voice Assistant"
        >
          <Mic className="h-6 w-6 sm:h-7 sm:w-7 drop-shadow-xs animate-pulse" />
        </button>
        <span className="text-[10px] font-black text-[#1E6FD9] bg-white/95 px-2 py-0.5 rounded-full shadow-xs border border-[#D0E2FF] mt-1 tracking-tight">
          Voice AI
        </span>
      </div>
    </div>
  );
}
