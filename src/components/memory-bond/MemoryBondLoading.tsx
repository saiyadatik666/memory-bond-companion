import React from "react";
import { MemoryBondLogo } from "./MemoryBondLogo";

export interface MemoryBondLoadingProps {
  label?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * Three subtle pulsing dots with soft stagger fade
 * Senior-friendly, calm, no large spinning wheels or jarring motion.
 */
export function MemoryBondPulseDots({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`} aria-hidden="true">
      <span className="h-2 w-2 rounded-full bg-[#1E6FD9] pulse-dot-1" />
      <span className="h-2 w-2 rounded-full bg-[#1E6FD9] pulse-dot-2" />
      <span className="h-2 w-2 rounded-full bg-[#1E6FD9] pulse-dot-3" />
    </div>
  );
}

/**
 * Inline loading state for smaller widgets, buttons or status lines
 */
export function MemoryBondLoadingInline({
  label = "Loading...",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2.5 text-xs font-bold text-[#486581] ${className}`}
    >
      <MemoryBondPulseDots />
      {label && <span>{label}</span>}
    </div>
  );
}

/**
 * Card-level or section-level loading state with soft Memory Bond brand glow
 */
export function MemoryBondLoadingCard({
  label = "Loading your cognitive companion...",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 rounded-3xl bg-white border border-[#E2EAF5] shadow-xs space-y-3.5 select-none ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#1E6FD9]/10 blur-xl pointer-events-none" />
        <MemoryBondLogo variant="icon" size="sm" />
      </div>
      <MemoryBondPulseDots />
      {label && (
        <p className="text-xs font-semibold text-[#627D98] text-center">{label}</p>
      )}
    </div>
  );
}
