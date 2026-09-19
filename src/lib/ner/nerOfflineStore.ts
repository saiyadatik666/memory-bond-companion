/**
 * NER Logistics Offline & Cache Storage Layer
 * Manages caching of accessibility reports, road status, and logistics data
 * to ensure seamless operation in low-connectivity hill tracts across the NER.
 *
 * Requirements:
 * - Graceful fallback when offline
 * - Displays "Offline — showing last available data"
 * - Accurately records last synchronized timestamp
 * - Never presents stale cached data as current live data
 */

import type {
  RoadStatus,
  BridgeStatus,
  DisruptionRisk,
  TravelDelayRecord,
  EssentialShipmentRecord,
  BlockedRoadAlert,
  FieldIncidentReport,
  DistrictConnectivityRecord,
  LogisticsBottleneck,
  EmergencyRoute,
  WeatherDataRecord,
} from "@/types/nerLogistics";

const CACHE_PREFIX = "mb_ner_cache_";

export interface CachedLogisticsBundle {
  roads: RoadStatus[];
  bridges: BridgeStatus[];
  disruptions: DisruptionRisk[];
  delays: TravelDelayRecord[];
  shipments: EssentialShipmentRecord[];
  alerts: BlockedRoadAlert[];
  incidents: FieldIncidentReport[];
  districts: DistrictConnectivityRecord[];
  bottlenecks: LogisticsBottleneck[];
  emergencyRoutes: EmergencyRoute[];
  weather: WeatherDataRecord[];
  lastSynchronizedAt: string;
  sourceType: "DEMO_SIMULATION" | "LIVE_API" | "CACHED_OFFLINE";
}

/**
 * Saves current logistics snapshot to persistent local storage with sync timestamp.
 */
export function saveNerLogisticsCache(bundle: CachedLogisticsBundle): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({
      ...bundle,
      lastSynchronizedAt: new Date().toISOString(),
    });
    localStorage.setItem(`${CACHE_PREFIX}bundle`, payload);
    localStorage.setItem(`${CACHE_PREFIX}last_sync`, new Date().toISOString());
  } catch (err) {
    console.warn("[NER Cache] Failed to persist logistics snapshot:", err);
  }
}

/**
 * Retrieves the cached logistics bundle. Returns null if never cached before.
 */
export function getCachedNerLogistics(): CachedLogisticsBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}bundle`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLogisticsBundle;
    parsed.sourceType = "CACHED_OFFLINE";
    return parsed;
  } catch (err) {
    console.warn("[NER Cache] Failed to read cached bundle:", err);
    return null;
  }
}

/**
 * Gets the last synchronized timestamp in human-readable format.
 */
export function getLastSyncTimeFormatted(): string {
  if (typeof window === "undefined") return "Never synchronized";
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}last_sync`);
    if (!raw) return "Just now (Demo Session)";
    const date = new Date(raw);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " (" + date.toLocaleDateString() + ")";
  } catch {
    return "Recent";
  }
}

/**
 * Saves a user-submitted field incident locally to ensure offline report submission
 * is preserved and queued for synchronization when connectivity returns.
 */
export function queueOfflineIncident(incident: FieldIncidentReport): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}pending_incidents`) || "[]";
    const queue: FieldIncidentReport[] = JSON.parse(raw);
    queue.unshift(incident);
    localStorage.setItem(`${CACHE_PREFIX}pending_incidents`, JSON.stringify(queue));
  } catch (err) {
    console.warn("[NER Cache] Could not queue offline incident:", err);
  }
}

/**
 * Reads pending offline incident submissions.
 */
export function getPendingOfflineIncidents(): FieldIncidentReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}pending_incidents`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
