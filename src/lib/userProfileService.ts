// ============================================================================
// Memory Bond — User Profile & Auth Synchronization Service
// Idempotent profile loading, duplicate prevention, and offline-online resilience.
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { type Profile, DEMO_PROFILE, getKey } from "./memoryBondStore";

export interface SyncProfileResult {
  profile: Profile;
  isNew: boolean;
}

/**
 * Idempotently fetches or creates a user profile in Supabase & local storage.
 * Guarantees that duplicate requests will never create multiple profiles.
 */
export async function syncUserProfile(
  user: { id: string; email?: string | null; user_metadata?: Record<string, any> },
  defaultRole: "caregiver" | "senior" = "caregiver"
): Promise<Profile> {
  const userId = user.id;
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    (defaultRole === "senior" ? "Senior Citizen" : "Caregiver");

  const resolvedRole = (user.user_metadata?.role as any) || defaultRole;

  // 1. Check local storage cache first for instant responsiveness
  let cachedProfile: Profile | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(getKey("profile"));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id === userId) {
          cachedProfile = parsed;
        }
      }
    } catch {}
  }

  // 2. Query Supabase profiles table with timeout protection (6s)
  try {
    const fetchPromise = supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Profiles fetch timeout") }), 6000)
    );

    const { data: existingRow, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (!error && existingRow) {
      // Existing profile found!
      const merged: Profile = {
        ...(cachedProfile || DEMO_PROFILE),
        id: existingRow.id,
        member_id: `MB-${existingRow.role.toUpperCase()}-${existingRow.id.slice(0, 6).toUpperCase()}`,
        full_name: existingRow.full_name || fullName,
        role: existingRow.role as any,
        language: existingRow.language || "en",
        font_size: (existingRow.font_size as any) || "normal",
        high_contrast: !!existingRow.high_contrast,
        voice_enabled: existingRow.voice_enabled !== false,
        onboarded: existingRow.onboarded !== false,
        phone: existingRow.phone || "",
        age_range: existingRow.age_range || "",
      };

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(getKey("profile"), JSON.stringify(merged));
        } catch {}
      }

      return merged;
    }

    // If profile does not exist, create it ONCE using upsert to avoid race conditions
    const initialRow = {
      id: userId,
      full_name: fullName,
      role: resolvedRole,
      language: "en",
      font_size: "normal",
      high_contrast: false,
      voice_enabled: true,
      onboarded: true,
    };

    const { data: insertedRow, error: upsertError } = await supabase
      .from("profiles")
      .upsert(initialRow, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (!upsertError && insertedRow) {
      const newProfile: Profile = {
        ...(cachedProfile || DEMO_PROFILE),
        id: insertedRow.id,
        member_id: `MB-${insertedRow.role.toUpperCase()}-${insertedRow.id.slice(0, 6).toUpperCase()}`,
        full_name: insertedRow.full_name || fullName,
        role: insertedRow.role as any,
        language: insertedRow.language || "en",
        font_size: (insertedRow.font_size as any) || "normal",
        high_contrast: !!insertedRow.high_contrast,
        voice_enabled: insertedRow.voice_enabled !== false,
        onboarded: insertedRow.onboarded !== false,
      };

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(getKey("profile"), JSON.stringify(newProfile));
        } catch {}
      }

      return newProfile;
    }
  } catch (err) {
    console.warn("[UserProfileService] Supabase profile sync warning (offline or timeout):", err);
  }

  // 3. Fallback to cached or deterministic new profile
  const fallbackProfile: Profile = cachedProfile || {
    ...DEMO_PROFILE,
    id: userId,
    member_id: `MB-${resolvedRole.toUpperCase()}-${userId.slice(0, 6).toUpperCase()}`,
    full_name: fullName,
    role: resolvedRole,
    onboarded: true,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getKey("profile"), JSON.stringify(fallbackProfile));
    } catch {}
  }

  return fallbackProfile;
}

/**
 * Parses OAuth redirect errors from window.location
 */
export function checkOAuthRedirectError(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const full = hash + search;

    if (!full) return null;

    if (full.includes("error_code=identity_already_exists") || full.includes("identity_already_exists")) {
      return "This Google/Facebook account is already connected to another Memory Bond account. Please sign in to that account first.";
    }

    if (full.includes("error_description=")) {
      const match = full.match(/error_description=([^&]+)/);
      if (match && match[1]) {
        const desc = decodeURIComponent(match[1].replace(/\+/g, " "));
        if (desc.toLowerCase().includes("already registered") || desc.toLowerCase().includes("already exists")) {
          return "This account is already registered. Please sign in using your existing password.";
        }
        return desc;
      }
    }

    if (full.includes("error=access_denied")) {
      return "Sign in was cancelled or denied. Please try again.";
    }
  } catch {}

  return null;
}
