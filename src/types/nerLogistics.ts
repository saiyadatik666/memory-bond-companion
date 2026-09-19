/**
 * NER Accessibility & Smart Logistics Types
 * Domain models for North Eastern Region (NER) road accessibility,
 * predictive disruptions, alternate routes, travel delays,
 * GPS vehicle tracking, essential goods, and district connectivity.
 */

export type RoadAccessibilityStatus = "OPEN" | "PARTIAL" | "BLOCKED";

export type BridgeAccessibilityStatus = "OPEN" | "PARTIAL" | "BLOCKED";

export type DisruptionRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DisruptionRiskType = "landslide" | "flood" | "road_disruption";

export type EssentialGoodsCategory =
  | "Medicines"
  | "Food"
  | "Drinking water"
  | "Construction materials"
  | "Agricultural supplies"
  | "Other essential goods";

export type ShipmentStatus =
  | "DISPATCHED"
  | "IN TRANSIT"
  | "DELAYED"
  | "ARRIVED"
  | "BLOCKED";

export type ShipmentPriority = "CRITICAL_PRIORITY" | "HIGH" | "NORMAL";

export type DistrictConnectivityStatus =
  | "GOOD CONNECTIVITY"
  | "PARTIAL CONNECTIVITY"
  | "DISRUPTED"
  | "SEVERELY DISRUPTED";

export type IncidentType =
  | "Landslide"
  | "Flood"
  | "Road damage"
  | "Bridge damage"
  | "Blocked road"
  | "Accident"
  | "Other";

export type VerificationStatus =
  | "OFFICIAL_VERIFIED"
  | "COMMUNITY_REPORTED"
  | "UNVERIFIED";

export type EmergencyRouteCategory =
  | "Emergency Route"
  | "Medical Access Route"
  | "Essential Goods Route"
  | "Evacuation Route";

export type DataSourceType = "OFFICIAL_API" | "DEMO_DATASET" | "COMMUNITY_FEED";

export type ConnectionStatus = "LIVE" | "SIMULATION" | "OFFLINE";

// ---------------------------------------------------------------------------
// 1. Road Status
// ---------------------------------------------------------------------------
export interface RoadStatus {
  id: string;
  route_name: string;
  highway_number?: string;
  location: string;
  district: string;
  state: string;
  status: RoadAccessibilityStatus;
  status_label: string;
  incident_information?: string;
  affected_stretch_km?: number;
  last_updated: string;
  source: string;
  is_demo: boolean;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// 2. Bridge Status
// ---------------------------------------------------------------------------
export interface BridgeStatus {
  id: string;
  bridge_name: string;
  river: string;
  route_name: string;
  district: string;
  state: string;
  status: BridgeAccessibilityStatus;
  status_label: string;
  weight_restriction_tonnes?: number;
  incident_information?: string;
  last_updated: string;
  source: string;
  is_demo: boolean;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// 3. Disruption Risk Prediction
// ---------------------------------------------------------------------------
export interface DisruptionRisk {
  id: string;
  location: string;
  district: string;
  state: string;
  risk_type: DisruptionRiskType;
  risk_level: DisruptionRiskLevel;
  expected_time_window: string;
  confidence_percentage?: number | null; // Only if actual model is connected
  model_connected: boolean;
  data_source: string;
  last_update: string;
  is_demo: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// 4. AI Alternate Route Suggestion
// ---------------------------------------------------------------------------
export interface RouteOption {
  route_id: string;
  route_name: string;
  via: string;
  approx_distance_km: number;
  estimated_travel_time_min?: number;
  accessibility_status: RoadAccessibilityStatus;
  known_disruption?: string;
  recommendation_reason: string;
  fuel_stops_available?: boolean;
}

export interface RouteSuggestion {
  id: string;
  start_location: string;
  destination: string;
  current_route: {
    name: string;
    distance_km: number;
    estimated_time_min?: number;
    status: RoadAccessibilityStatus;
    problem_description: string;
  };
  alternative_routes: RouteOption[];
  mapping_api_connected: boolean;
  source: string;
  last_updated: string;
  is_demo: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// 5. Travel Delay Estimation
// ---------------------------------------------------------------------------
export type DelayReason =
  | "Flood"
  | "Landslide"
  | "Road blockage"
  | "Bridge restriction"
  | "Weather disruption"
  | "Traffic"
  | "Infrastructure issue";

export interface TravelDelayRecord {
  id: string;
  route_name: string;
  origin: string;
  destination: string;
  district: string;
  state: string;
  normal_travel_time_min: number;
  current_estimated_travel_time_min: number;
  delay_min: number;
  reason_for_delay: DelayReason;
  reason_description: string;
  last_updated: string;
  source: string;
  is_live_source_connected: boolean;
  is_demo: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// 6. GPS Vehicle Tracking
// ---------------------------------------------------------------------------
export interface GeoCoordinates {
  lat: number;
  lng: number;
  address: string;
}

export interface VehicleTrackingRecord {
  id: string;
  vehicle_id: string;
  vehicle_type: "Truck" | "Van" | "Ambulance" | "Essential Carrier" | "Tanker";
  driver_name_masked: string;
  current_location: GeoCoordinates;
  destination: GeoCoordinates;
  route_name: string;
  status: ShipmentStatus;
  last_gps_update: string;
  eta: string;
  route_path_points: [number, number][];
  tracking_permission_granted: boolean;
  authorized_roles_only: boolean;
  is_gps_hardware_connected: boolean;
  is_demo: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// 7. Essential Goods Shipment Tracking
// ---------------------------------------------------------------------------
export interface EssentialShipmentRecord {
  id: string;
  shipment_id: string;
  vehicle_id: string;
  goods_category: EssentialGoodsCategory;
  priority: ShipmentPriority;
  is_medicine_priority: boolean;
  origin: string;
  destination: string;
  current_location: string;
  status: ShipmentStatus;
  dispatch_time: string;
  expected_arrival: string;
  delay_status: string;
  delay_min: number;
  contents_summary: string;
  consignee_type: "Hospital" | "PHC" | "PDS Depot" | "Disaster Relief" | "Community Center";
  last_updated: string;
  is_demo: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// 8. Blocked Road Alerts
// ---------------------------------------------------------------------------
export interface BlockedRoadAlert {
  id: string;
  road_name: string;
  location: string;
  district: string;
  state: string;
  reason: string;
  timestamp: string;
  suggested_action: string;
  is_active: boolean;
  severity: "HIGH" | "CRITICAL";
  source: string;
  is_demo: boolean;
  created_at: string;
}

export interface UserAlertPreference {
  alerts_enabled: boolean;
  subscribed_districts: string[];
  important_routes: string[];
}

// ---------------------------------------------------------------------------
// 9. Geo-Tagged Field Incident Reports
// ---------------------------------------------------------------------------
export interface FieldIncidentReport {
  id: string;
  incident_type: IncidentType;
  photo_url?: string;
  photo_name?: string;
  description: string;
  gps_location: GeoCoordinates;
  district: string;
  state: string;
  timestamp: string;
  reporter_id_masked: string;
  verification_status: VerificationStatus;
  is_demo: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// 10. District Connectivity Dashboard
// ---------------------------------------------------------------------------
export interface DistrictConnectivityRecord {
  id: string;
  district_name: string;
  state: string;
  connectivity_status: DistrictConnectivityStatus;
  open_routes_count: number;
  blocked_routes_count: number;
  partial_routes_count: number;
  active_incidents_count: number;
  essential_goods_delays_count: number;
  last_updated: string;
  source: string;
  is_demo: boolean;
}

// ---------------------------------------------------------------------------
// 11. Logistics Bottlenecks
// ---------------------------------------------------------------------------
export interface LogisticsBottleneck {
  id: string;
  location: string;
  district: string;
  state: string;
  issue: DelayReason | string;
  affected_route: string;
  severity: DisruptionRiskLevel;
  affected_shipment_count: number | null; // null if actual data unavailable
  is_shipment_data_available: boolean;
  last_update: string;
  source: string;
  is_demo: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// 12. Emergency / Disaster Accessibility Routes
// ---------------------------------------------------------------------------
export interface EmergencyRoute {
  id: string;
  route_name: string;
  category: EmergencyRouteCategory;
  start_location: string;
  destination: string;
  accessibility_status: RoadAccessibilityStatus;
  known_disruption: string;
  is_official_verified: boolean;
  verified_by_agency?: string;
  advisory_notice: string; // "Suggested emergency-access route unless verified"
  last_update: string;
  source: string;
  is_demo: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// 13. Weather Integration Data
// ---------------------------------------------------------------------------
export interface WeatherDataRecord {
  id: string;
  district: string;
  state: string;
  temperature_c: number;
  condition: string;
  rainfall_mm_24h: number;
  is_heavy_rainfall: boolean;
  flood_related_risk: DisruptionRiskLevel;
  weather_alerts: string[];
  is_api_connected: boolean;
  source: string;
  last_updated: string;
  is_demo: boolean;
}

// ---------------------------------------------------------------------------
// 14. Transport Data Sources & Connection State
// ---------------------------------------------------------------------------
export interface TransportDataSource {
  id: string;
  name: string;
  type: "WEATHER_API" | "ROUTING_API" | "GPS_TELEMATICS" | "STATE_TRANSPORT_DB" | "DISASTER_MGMT_FEED";
  is_connected: boolean;
  endpoint?: string;
  last_ping?: string;
  status_label: "Live Connected" | "Not Connected (Demo Mode)";
}

// ---------------------------------------------------------------------------
// Smart Map Layer Toggles
// ---------------------------------------------------------------------------
export interface MapLayerState {
  roads: boolean;
  bridges: boolean;
  blockedRoads: boolean;
  incidents: boolean;
  landslideRisk: boolean;
  floodRisk: boolean;
  vehicles: boolean;
  essentialGoods: boolean;
  districtConnectivity: boolean;
  suggestedAlternateRoutes: boolean;
  emergencyAccessibility: boolean;
}

// ---------------------------------------------------------------------------
// Data Transparency State
// ---------------------------------------------------------------------------
export interface TransparencyMetadata {
  dataSource: string;
  lastUpdated: string;
  connectionStatus: ConnectionStatus;
  isDemo: boolean;
  notice: string;
}
