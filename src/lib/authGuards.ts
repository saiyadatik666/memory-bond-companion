import type { UserRole } from "./memoryBondStore";

export type AllowedRole = "senior" | "caregiver";

export interface ActiveSession {
  userId: string;
  role: AllowedRole;
  email?: string;
  fullName?: string;
  caregiverCode?: string;
  interests?: string[];
}

/**
 * Tabs permitted for the Senior role.
 * Senior users should only see Senior features and navigation.
 */
export const SENIOR_ALLOWED_TABS: readonly string[] = [
  "home",
  "games",
  "medicines",
  "appointments",
  "family_tree",
  "journal",
  "cues",
  "social",
  "routine",
  "cultural",
  "reminders",
  "settings",
  "voice",
  "sos",
] as const;

/**
 * Tabs permitted for the Caregiver / Family role.
 * Scoreboard and caregiver monitoring features are restricted to caregivers.
 */
export const CAREGIVER_ALLOWED_TABS: readonly string[] = [
  "caregiver",
  "medicines",
  "appointments",
  "family",
  "family_tree",
  "routine",
  "cultural",
  "reminders",
  "settings",
  "voice",
  "sos",
] as const;

const SENIOR_ALLOWED_SET = new Set(SENIOR_ALLOWED_TABS);
const CAREGIVER_ALLOWED_SET = new Set(CAREGIVER_ALLOWED_TABS);

/**
 * Checks whether a given tab is authorized for the active user role.
 */
export function isTabAuthorized(role: UserRole | string, tab: string): boolean {
  if (role === "senior") {
    return SENIOR_ALLOWED_SET.has(tab);
  }
  if (role === "caregiver" || role === "healthcare_worker" || role === "admin") {
    return CAREGIVER_ALLOWED_SET.has(tab);
  }
  return false;
}

/**
 * Returns the default home dashboard tab for a given role.
 */
export function getDefaultTabForRole(role: UserRole | string): string {
  if (role === "senior") {
    return "home";
  }
  return "caregiver";
}

/**
 * Retrieves the currently active authenticated session from localStorage.
 */
export function getActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mb_active_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.role === "senior" || parsed.role === "caregiver")) {
      return parsed as ActiveSession;
    }
  } catch (err) {
    console.error("[AuthGuards] Failed to parse active session:", err);
  }
  return null;
}

/**
 * Persists an authenticated session.
 */
export function saveActiveSession(session: ActiveSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mb_active_session", JSON.stringify(session));
    localStorage.setItem("mb_authenticated_user_id", session.userId);
  } catch (err) {
    console.error("[AuthGuards] Failed to save active session:", err);
  }
}

/**
 * Clears the active session from storage.
 */
export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("mb_active_session");
    localStorage.removeItem("mb_authenticated_user_id");
  } catch (err) {
    console.error("[AuthGuards] Failed to clear active session:", err);
  }
}
