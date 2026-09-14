import React from "react";

export type MemoryBondLogoVariant =
  | "horizontal"
  | "icon"
  | "stacked"
  | "app-icon"
  | "responsive";

export type MemoryBondLogoSize = "xs" | "sm" | "default" | "md" | "lg" | "xl" | "hero";

export interface MemoryBondLogoProps {
  className?: string;
  variant?: MemoryBondLogoVariant;
  size?: MemoryBondLogoSize;
  showText?: boolean;
  alt?: string;
  priority?: boolean;
}

export function MemoryBondLogo({
  className = "",
  variant = "horizontal",
  size = "default",
  showText = true,
  alt = "Memory Bond",
  priority = true,
}: MemoryBondLogoProps) {
  // Height constraints per size for horizontal logo (aspect ratio ~2.71:1)
  const horizontalHeight =
    size === "xs"
      ? "h-6"
      : size === "sm"
      ? "h-8 sm:h-9"
      : size === "default"
      ? "h-10 sm:h-11 md:h-12"
      : size === "md"
      ? "h-11 sm:h-12 md:h-13"
      : size === "lg"
      ? "h-13 sm:h-16"
      : size === "xl"
      ? "h-18 sm:h-24"
      : "h-24 sm:h-32 md:h-36";

  // Dimensions for icon-only (aspect ratio ~1:1)
  const iconDimensions =
    size === "xs"
      ? "h-6 w-6"
      : size === "sm"
      ? "h-8 w-8"
      : size === "default"
      ? "h-10 w-10 sm:h-11 sm:w-11"
      : size === "md"
      ? "h-11 w-11 sm:h-12 sm:w-12"
      : size === "lg"
      ? "h-14 w-14 sm:h-16 sm:w-16"
      : size === "xl"
      ? "h-18 w-18 sm:h-24 sm:w-24"
      : "h-24 w-24 sm:h-32 sm:w-32";

  // Dimensions for stacked logo (aspect ratio ~0.93:1)
  const stackedHeight =
    size === "xs"
      ? "h-12"
      : size === "sm"
      ? "h-16"
      : size === "default"
      ? "h-20 sm:h-24"
      : size === "md"
      ? "h-24 sm:h-28"
      : size === "lg"
      ? "h-28 sm:h-32"
      : size === "xl"
      ? "h-36 sm:h-44"
      : "h-44 sm:h-52";

  // Variant 1: Responsive Logo (Icon on mobile < sm, Full Horizontal on sm+)
  if (variant === "responsive") {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        {/* Mobile: Compact Official Icon only (Prevents squeezing on 360px-430px) */}
        <img
          src="/images/brand/logo_icon.png"
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={`block sm:hidden ${iconDimensions} object-contain shrink-0 drop-shadow-2xs transition-transform hover:scale-105`}
        />
        {/* Tablet / Desktop: Full Primary Horizontal Logo */}
        <img
          src="/images/brand/logo_horizontal.png"
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={`hidden sm:block ${horizontalHeight} w-auto object-contain shrink-0 drop-shadow-2xs transition-transform hover:scale-102`}
        />
      </div>
    );
  }

  // Variant 2: Icon Only (Heart + 2 figures + Neural Brain Emblem)
  if (variant === "icon" || !showText) {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src="/images/brand/logo_icon.png"
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={`${iconDimensions} object-contain shrink-0 drop-shadow-2xs transition-transform hover:scale-105`}
        />
      </div>
    );
  }

  // Variant 3: Stacked Logo (Icon centered above wordmark)
  if (variant === "stacked") {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src="/images/brand/logo_stacked.png"
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={`${stackedHeight} w-auto object-contain shrink-0 drop-shadow-2xs transition-transform hover:scale-102`}
        />
      </div>
    );
  }

  // Variant 4: App Icon (in soft squircle)
  if (variant === "app-icon") {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src="/images/brand/logo_app_icon.png"
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={`${iconDimensions} object-contain shrink-0 drop-shadow-sm transition-transform hover:scale-105`}
        />
      </div>
    );
  }

  // Variant 5 (Default): Primary Horizontal Official Logo
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/images/brand/logo_horizontal.png"
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`${horizontalHeight} w-auto object-contain shrink-0 drop-shadow-2xs transition-transform hover:scale-102`}
      />
    </div>
  );
}
