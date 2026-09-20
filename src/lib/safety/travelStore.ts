/**
 * Memory Bond - Road & Travel Help Store & Utilities
 * Manages persistent Saved Places, Recent Destinations, Location State,
 * and External Navigation links for elderly users and caregivers.
 */

import type { LatLng, SelectedLocationState } from "@/types/realSafetyMap";

export type LocationPermissionState =
  | "available"
  | "prompt"
  | "denied"
  | "unavailable"
  | "loading"
  | "error";

export type SavedPlaceType = "home" | "doctor" | "hospital" | "family" | "favorite";

export interface SavedPlace {
  id: string;
  type: SavedPlaceType;
  label: string;
  customName?: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string | null;
  savedAt: string;
}

export interface RecentDestination {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  timestamp: string;
}

const STORAGE_SAVED_PLACES_KEY = "mb_saved_places";
const STORAGE_RECENT_DESTINATIONS_KEY = "mb_recent_destinations";

/**
 * Default initial saved places structure (empty or preset placeholders for elderly setup)
 */
export function loadSavedPlaces(): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_PLACES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[TravelStore] Failed to load saved places:", err);
    return [];
  }
}

export function persistSavedPlace(place: SavedPlace): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = loadSavedPlaces();
    // Replace if same type or id
    const filtered = existing.filter((p) => p.id !== place.id && p.type !== place.type);
    const updated = [place, ...filtered];
    localStorage.setItem(STORAGE_SAVED_PLACES_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("[TravelStore] Failed to persist saved place:", err);
    return [];
  }
}

export function removeSavedPlace(id: string): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = loadSavedPlaces();
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_SAVED_PLACES_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("[TravelStore] Failed to remove saved place:", err);
    return [];
  }
}

/**
 * Load recent destinations (max 8)
 */
export function loadRecentDestinations(): RecentDestination[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_DESTINATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[TravelStore] Failed to load recent destinations:", err);
    return [];
  }
}

/**
 * Add a recent destination with deduplication
 */
export function addRecentDestination(item: Omit<RecentDestination, "id" | "timestamp">): RecentDestination[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = loadRecentDestinations();
    // Deduplicate by name or coordinates within 50m
    const filtered = existing.filter(
      (r) =>
        r.name.toLowerCase() !== item.name.toLowerCase() &&
        (Math.abs(r.lat - item.lat) > 0.001 || Math.abs(r.lng - item.lng) > 0.001)
    );

    const newEntry: RecentDestination = {
      ...item,
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newEntry, ...filtered].slice(0, 8);
    localStorage.setItem(STORAGE_RECENT_DESTINATIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("[TravelStore] Failed to add recent destination:", err);
    return [];
  }
}

export function removeRecentDestination(id: string): RecentDestination[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = loadRecentDestinations();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_RECENT_DESTINATIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("[TravelStore] Failed to remove recent destination:", err);
    return [];
  }
}

export function clearRecentDestinations(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_RECENT_DESTINATIONS_KEY);
  } catch (err) {
    console.warn("[TravelStore] Failed to clear recent destinations:", err);
  }
}

/**
 * Generate external turn-by-turn navigation URL for Google Maps, Apple Maps, or Universal Map intent
 */
export function getExternalNavigationUrl(destination: LatLng, origin?: LatLng | null, destinationName?: string): string {
  const destStr = `${destination.lat},${destination.lng}`;
  const isApple = typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);

  if (origin) {
    const origStr = `${origin.lat},${origin.lng}`;
    if (isApple) {
      return `https://maps.apple.com/?saddr=${origStr}&daddr=${destStr}&dirflg=d`;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${origStr}&destination=${destStr}&travelmode=driving`;
  }

  if (isApple) {
    return `https://maps.apple.com/?q=${encodeURIComponent(destinationName || "Destination")}&ll=${destStr}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${destStr}`;
}

/**
 * Check if the browser currently has internet connectivity
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
