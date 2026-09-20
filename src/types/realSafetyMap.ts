/**
 * Real Safety Map & Navigation System Types
 * Production domain models for real interactive maps, browser geolocation,
 * Open-Meteo live weather & severe alerts, OSRM driving routes, and Nominatim facility search.
 */

export type MapStyleMode = "ROAD" | "SATELLITE" | "TERRAIN";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface LocationState {
  coords: LatLng | null;
  accuracyMeters: number | null;
  isAccuracyLimited: boolean;
  permissionStatus: "prompt" | "granted" | "denied";
  lastUpdated: string | null;
  isTrackingActive: boolean;
  isSharingEnabled: boolean; // Privacy: Default is strictly FALSE
  source: string;
}

// ---------------------------------------------------------------------------
// Distinct Location Architecture (Requirement 1 & 18)
// CURRENT LIVE DEVICE LOCATION and USER-SELECTED MAP LOCATION MUST NEVER MIX
// ---------------------------------------------------------------------------

export interface CurrentLocationState {
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  timestamp: string;
}

export interface SelectedLocationState {
  lat: number;
  lng: number;
  name: string;
  address: string;
  type: string;
  category?: string;
  selectedAt: string;
}

export interface SelectedSearchLocation {
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
  placeId?: string;
  source: "gps" | "manual" | "voice";
}

export type NearbyCategoryType =
  | "hotel"
  | "hospital"
  | "pharmacy"
  | "restaurant"
  | "food"
  | "fuel"
  | "station"
  | "bus"
  | "atm"
  | "police"
  | "shop"
  | "essentials"
  | "nearby"
  | "worship"
  | "parking"
  | "emergency"
  | "doctor"
  | "elder_care";

export interface NearbyPlace {
  id: string;
  name: string;
  category: NearbyCategoryType;
  categoryLabel: string;
  lat: number;
  lng: number;
  distanceKm: number;
  address: string;
  phone?: string | null;
  isOpen24Hours?: boolean;
  source: string;
}

export interface PlaceSearchResult {
  id: string;
  displayName: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  category?: string;
  address?: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name: string;
}

export interface RealRouteResult {
  origin: LatLng;
  originName: string;
  destination: LatLng;
  destinationName: string;
  distanceKm: number;
  durationMin: number;
  durationFormatted: string;
  coordinates: LatLng[]; // Real road polyline coordinates
  steps: RouteStep[];
  source: string;
  calculatedAt: string;
  label?: string; // e.g. "Route 1", "Route 2", "Alternative Route"
  alternatives?: RealRouteResult[];
}

export interface WeatherWarning {
  id: string;
  title: string;
  severity: "ADVISORY" | "WATCH" | "WARNING" | "SEVERE";
  description: string;
  validFrom: string;
  validTo: string;
  issuedTime: string;
  source: string;
}

export interface DailyForecast {
  date: string;
  dayLabel: string;
  weatherCode: number;
  condition: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbability: number;
  precipitationSumMm: number;
}

export interface RealWeatherResult {
  temperatureC: number;
  apparentTempC: number;
  condition: string;
  weatherCode: number;
  precipitationMm: number;
  relativeHumidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  visibilityKm: number | null;
  forecast: DailyForecast[];
  activeWarnings: WeatherWarning[];
  source: string;
  lastUpdated: string;
}

export type LiveWeatherObservation = RealWeatherResult;

export interface EmergencyFacility {
  id: string;
  name: string;
  type: "hospital" | "clinic" | "pharmacy" | "police" | "fire_station" | "emergency" | "doctor" | "elder_care";
  lat: number;
  lng: number;
  distanceKm: number;
  address: string;
  phone: string | null; // Real phone only if present in OSM tags; never fabricated
  isOpen24Hours?: boolean;
  source: string;
}

export interface HelpServiceResult {
  id: string;
  name: string;
  type: "hospital" | "pharmacy" | "emergency" | "doctor" | "elder_care";
  categoryLabel: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  distanceKm: number;
  phone: string | null;
  googleMapsUrl: string;
  isOpen24Hours?: boolean;
  source: string;
}

export interface RoadStatusAnalysis {
  status: "NORMAL_CLEAR" | "TRAFFIC_INFO" | "VERIFIED_INCIDENT" | "CLOSURE" | "HAZARD" | "WEATHER_DISRUPTED" | "DATA_UNAVAILABLE";
  headline: string;
  details: string;
  verifiedClosureReported: boolean;
  weatherNotice?: string;
  source: string;
  lastUpdated: string;
}
