import React from "react";

/**
 * Friendly 3D-styled AI Companion Robot matching the reference image
 */
export function AiRobotAvatar({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0 drop-shadow-sm select-none`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="robot-head" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="85%" stopColor="#E2EEFC" />
          <stop offset="100%" stopColor="#CBE2FA" />
        </radialGradient>
        <linearGradient id="robot-visor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="robot-ear" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Antenna */}
      <circle cx="50" cy="14" r="5" fill="#38BDF8" />
      <rect x="48" y="17" width="4" height="8" rx="2" fill="#94A3B8" />

      {/* Head Base */}
      <rect
        x="18"
        y="24"
        width="64"
        height="56"
        rx="26"
        fill="url(#robot-head)"
        stroke="#BAD7F6"
        strokeWidth="2"
      />

      {/* Side Headphones */}
      <rect x="12" y="42" width="7" height="20" rx="3.5" fill="url(#robot-ear)" />
      <rect x="81" y="42" width="7" height="20" rx="3.5" fill="url(#robot-ear)" />

      {/* Visor / Face Screen */}
      <rect x="25" y="36" width="50" height="28" rx="14" fill="url(#robot-visor)" />

      {/* Gentle Smiling Eyes */}
      <ellipse cx="38" cy="50" rx="4" ry="5.5" fill="#7DD3FC" />
      <ellipse cx="62" cy="50" rx="4" ry="5.5" fill="#7DD3FC" />
      <circle cx="39" cy="48" r="1.8" fill="#FFFFFF" />
      <circle cx="63" cy="48" r="1.8" fill="#FFFFFF" />

      {/* Soft Rosy Cheeks */}
      <circle cx="30" cy="56" r="3" fill="#FDA4AF" fillOpacity="0.7" />
      <circle cx="70" cy="56" r="3" fill="#FDA4AF" fillOpacity="0.7" />

      {/* Friendly Smile */}
      <path
        d="M 46 54 Q 50 58 54 54"
        stroke="#BAE6FD"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Body Hint */}
      <path
        d="M 32 82 C 32 78 68 78 68 82 L 72 94 C 72 97 28 97 28 94 Z"
        fill="#E2EEFC"
        stroke="#BAD7F6"
        strokeWidth="1.5"
      />
      <circle cx="50" cy="88" r="3" fill="#38BDF8" />
    </svg>
  );
}

/**
 * Memory Garden Sprout Illustration matching the reference image
 */
export function MemoryGardenIllustration({ className = "w-full h-28" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none pointer-events-none`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="garden-soil" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8A5A36" />
          <stop offset="50%" stopColor="#A0693E" />
          <stop offset="100%" stopColor="#8A5A36" />
        </linearGradient>
        <linearGradient id="garden-leaf-left" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
        <linearGradient id="garden-leaf-right" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id="garden-watering-can" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Distant soft trees/hills */}
      <path
        d="M 0 120 C 30 90 70 85 110 100 C 150 115 190 95 240 100 C 280 105 300 95 320 120 Z"
        fill="#E8F6ED"
      />
      <path
        d="M 20 120 C 50 98 85 96 125 106 C 170 118 210 104 260 108 C 290 110 310 105 320 120 Z"
        fill="#D4EEDC"
      />

      {/* Soil Mound */}
      <ellipse cx="230" cy="112" rx="45" ry="12" fill="url(#garden-soil)" />
      <ellipse cx="230" cy="110" rx="38" ry="8" fill="#B27B4D" opacity="0.6" />

      {/* Sprout Stem */}
      <path
        d="M 230 110 Q 230 85 226 70"
        stroke="#16A34A"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Left Sprout Leaf */}
      <path
        d="M 226 80 C 205 75 195 60 215 55 C 225 55 228 70 226 80 Z"
        fill="url(#garden-leaf-left)"
      />

      {/* Right Sprout Leaf */}
      <path
        d="M 226 72 C 248 68 255 52 238 46 C 228 46 226 62 226 72 Z"
        fill="url(#garden-leaf-right)"
      />

      {/* Top Leaf Bud */}
      <ellipse cx="225" cy="58" rx="4" ry="7" fill="#86EFAC" transform="rotate(-15 225 58)" />

      {/* Watering Can on the right */}
      <g transform="translate(280, 52) rotate(-22)">
        {/* Can Body */}
        <path
          d="M 0 14 C 0 8 16 8 16 14 L 14 32 C 14 36 2 36 2 32 Z"
          fill="url(#garden-watering-can)"
        />
        {/* Spout */}
        <path d="M 14 18 L 26 12 L 27 16 L 14 24 Z" fill="#0284C7" />
        <ellipse cx="26.5" cy="14" rx="2.5" ry="4" fill="#38BDF8" />
        {/* Handle */}
        <path
          d="M 0 12 C -6 12 -6 32 0 32"
          stroke="#0284C7"
          strokeWidth="2.5"
          fill="none"
        />
      </g>

      {/* Falling Water Droplets */}
      <circle cx="266" cy="74" r="2" fill="#38BDF8" />
      <circle cx="258" cy="84" r="2.5" fill="#38BDF8" />
      <circle cx="248" cy="94" r="2" fill="#38BDF8" />

      {/* Soft Grass tufts */}
      <path d="M 12 120 Q 15 108 20 120" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
      <path d="M 45 120 Q 50 105 55 120" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
      <path d="M 140 120 Q 145 110 150 120" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
      <path d="M 295 120 Q 300 110 305 120" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
