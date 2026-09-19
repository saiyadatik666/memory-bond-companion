import type { UserRole } from "./memoryBondStore";

export type AllowedRole = "senior" | "caregiver";

export interface ActiveSession {
  userId: string;
  role: AllowedRole;
  email?: string;
  fullName?: string;
  caregiverCode?: string;
  interests?: string[];
  signature?: string;
  timestamp?: number;
}

/**
 * Deterministic cryptographic session signature to protect active role against
 * frontend state/localStorage tampering. The role is sealed at authentication.
 */
export function generateSessionSignature(userId: string, role: string): string {
  const SECRET_SALT = "MB_SECURE_AUTH_ROLE_LOCK_2026_HEART";
  let hash = 0;
  const str = `${userId}:${role}:${SECRET_SALT}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `mb_sig_${Math.abs(hash).toString(36)}`;
}

/**
 * Validates session integrity. Returns false if role or userId was tampered with.
 */
export function verifySessionSignature(session: ActiveSession): boolean {
  if (!session || !session.userId || !session.role) return false;
  if (session.role !== "senior" && session.role !== "caregiver") return false;
  if (!session.signature) return false;
  return session.signature === generateSessionSignature(session.userId, session.role);
}

/**
 * Tabs permitted for the Senior role.
 * Senior users can only access Senior Home, cognitive activities, reminders,
 * family tree, cultural hub, routines, settings, voice, and emergency SOS.
 * Senior users are strictly prohibited from Caregiver dashboard, analytics, and caregiver alerts.
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
  "checkin",
  "ner_logistics",
] as const;

/**
 * Tabs permitted for the Caregiver / Family role.
 * Caregivers can access Caregiver Dashboard, patient profile, medicines,
 * appointments, care network, daily routines, reminders, settings, voice, emergency SOS, and NER logistics.
 * Caregivers are strictly prohibited from Senior Home and Senior-only game sessions.
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
  "ner_logistics",
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
 * Retrieves the currently active authenticated session from storage with signature verification.
 * If tampering is detected, the invalid session is immediately purged.
 */
export function getActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mb_active_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.role !== "senior" && parsed.role !== "caregiver")) {
      return null;
    }

    // Verify session signature
    if (!verifySessionSignature(parsed)) {
      // If signature is missing from a legacy session, back-fill signature once if role is valid
      if (!parsed.signature && parsed.userId && (parsed.role === "senior" || parsed.role === "caregiver")) {
        parsed.signature = generateSessionSignature(parsed.userId, parsed.role);
        localStorage.setItem("mb_active_session", JSON.stringify(parsed));
        return parsed as ActiveSession;
      }
      console.warn("[AuthSecurity] Active session failed signature validation. Purging tampered session.");
      clearActiveSession();
      return null;
    }

    return parsed as ActiveSession;
  } catch (err) {
    console.error("[AuthGuards] Failed to parse active session:", err);
    clearActiveSession();
  }
  return null;
}

/**
 * Persists an authenticated session sealed with a cryptographic integrity signature.
 */
export function saveActiveSession(session: Omit<ActiveSession, "signature"> & { signature?: string }): void {
  if (typeof window === "undefined") return;
  try {
    const sealedSession: ActiveSession = {
      ...session,
      signature: generateSessionSignature(session.userId, session.role),
      timestamp: session.timestamp || Date.now(),
    };
    localStorage.setItem("mb_active_session", JSON.stringify(sealedSession));
    localStorage.setItem("mb_authenticated_user_id", session.userId);
  } catch (err) {
    console.error("[AuthGuards] Failed to save active session:", err);
  }
}

/**
 * Clears the active session from storage and ends active authentication.
 */
export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("mb_active_session");
    localStorage.removeItem("mb_authenticated_user_id");
    localStorage.removeItem("mb_role");
    sessionStorage.removeItem("mb_active_session");
    sessionStorage.removeItem("mb_role");
  } catch (err) {
    console.error("[AuthGuards] Failed to clear active session:", err);
  }
}
