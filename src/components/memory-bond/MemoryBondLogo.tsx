import React from "react";

export function MemoryBondLogo({
  className = "",
  size = "default",
  showText = true,
}: {
  className?: string;
  size?: "sm" | "default" | "lg";
  showText?: boolean;
}) {
  const iconSize = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Curved organic heart emblem matching reference image */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSize} shrink-0 drop-shadow-xs transition-transform hover:scale-105`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mb-leaf-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="mb-heart-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="mb-heart-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Left Green Leaf / Guardian Figure */}
        <path
          d="M 50 82 C 34 72 15 56 15 36 C 15 22 26 12 39 12 C 45 12 48 15 50 18 C 47 27 45 38 48 50 C 50 60 52 70 50 82 Z"
          fill="url(#mb-leaf-green)"
        />

        {/* Right Sky Blue Wing / Care Wing */}
        <path
          d="M 50 82 C 66 72 85 56 85 36 C 85 22 74 12 61 12 C 55 12 52 15 50 18 C 53 27 55 38 52 50 C 50 60 48 70 50 82 Z"
          fill="url(#mb-heart-blue)"
        />

        {/* Inner Gentle Soul / Embracing Family Core */}
        <circle cx="39" cy="30" r="5" fill="#FFFFFF" fillOpacity="0.9" />
        <circle cx="61" cy="30" r="5" fill="#FFFFFF" fillOpacity="0.9" />
        <path
          d="M 33 46 C 35 39 43 39 45 46 C 45 52 35 56 33 46 Z"
          fill="#FFFFFF"
          fillOpacity="0.85"
        />
        <path
          d="M 55 46 C 57 39 65 39 67 46 C 67 52 57 56 55 46 Z"
          fill="#FFFFFF"
          fillOpacity="0.85"
        />
      </svg>

      {showText && (
        <span
          className={`font-black tracking-tight text-[#0F243E] font-display ${textSize} leading-none`}
        >
          Memory Bond
        </span>
      )}
    </div>
  );
}
