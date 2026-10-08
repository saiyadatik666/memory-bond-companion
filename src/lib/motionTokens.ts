import { useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";

/**
 * Standard motion transitions tailored for Memory Bond:
 * Calm, senior-friendly, responsive, and performance-optimized.
 */

export const smoothSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const gentleEase: Transition = {
  duration: 0.25,
  ease: [0.25, 1, 0.5, 1],
};

export const quickEase: Transition = {
  duration: 0.16,
  ease: [0.25, 1, 0.5, 1],
};

export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.25, 1, 0.5, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.16, ease: [0.25, 1, 0.5, 1] },
  },
};

export const reducedPageTransitionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.08 } },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.25, 1, 0.5, 1] },
  },
};

export const cardInteractiveVariants = {
  hover: { y: -3, transition: { duration: 0.2, ease: "easeOut" } },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const modalOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export const drawerVariants: Variants = {
  initial: { x: "100%", opacity: 0.9 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
  },
  exit: {
    x: "100%",
    opacity: 0.9,
    transition: { duration: 0.22, ease: "easeInOut" },
  },
};

export const mobileMenuVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.18, ease: "easeInOut" },
  },
};

/**
 * Hook to determine if motion should be minimal/disabled
 * Checks both system prefers-reduced-motion and store reduced_motion profile setting
 */
export function useAppReducedMotion(profileReducedMotion?: boolean): boolean {
  const systemReduced = useReducedMotion();
  return Boolean(systemReduced || profileReducedMotion);
}
