/**
 * NER Smart Logistics Database Schema
 * SQL/Relational definitions conforming to Section 20 of Requirements:
 * - road_status
 * - bridge_status
 * - road_incidents
 * - district_connectivity
 * - disruption_risks
 * - route_suggestions
 * - travel_delays
 * - vehicles
 * - vehicle_locations
 * - essential_shipments
 * - blocked_road_alerts
 * - weather_data
 * - transport_data_sources
 */

export const NER_DATABASE_TABLES_SQL = `
-- 1. road_status
CREATE TABLE IF NOT EXISTS public.road_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name VARCHAR(255) NOT NULL,
    highway_number VARCHAR(64),
    location VARCHAR(255) NOT NULL,
    district VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('OPEN', 'PARTIAL', 'BLOCKED')),
    status_label VARCHAR(128) NOT NULL,
    incident_information TEXT,
    affected_stretch_km NUMERIC(6, 2),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(255) NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status VARCHAR(64) NOT NULL DEFAULT 'UNVERIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. bridge_status
CREATE TABLE IF NOT EXISTS public.bridge_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bridge_name VARCHAR(255) NOT NULL,
    river VARCHAR(128) NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    district VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('OPEN', 'PARTIAL', 'BLOCKED')),
    status_label VARCHAR(128) NOT NULL,
    weight_restriction_tonnes NUMERIC(5, 2),
    incident_information TEXT,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(255) NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status VARCHAR(64) NOT NULL DEFAULT 'UNVERIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. road_incidents (geo-tagged field incident reports)
CREATE TABLE IF NOT EXISTS public.road_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(64) NOT NULL,
    photo_url TEXT,
    description TEXT NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    reporter_id_masked VARCHAR(64) NOT NULL,
    verification_status VARCHAR(64) NOT NULL DEFAULT 'COMMUNITY_REPORTED',
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. district_connectivity
CREATE TABLE IF NOT EXISTS public.district_connectivity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_name VARCHAR(128) NOT NULL UNIQUE,
    state VARCHAR(64) NOT NULL,
    connectivity_status VARCHAR(64) NOT NULL,
    open_routes_count INTEGER NOT NULL DEFAULT 0,
    blocked_routes_count INTEGER NOT NULL DEFAULT 0,
    partial_routes_count INTEGER NOT NULL DEFAULT 0,
    active_incidents_count INTEGER NOT NULL DEFAULT 0,
    essential_goods_delays_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(255) NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. disruption_risks (landslide, flood, disruption predictions)
CREATE TABLE IF NOT EXISTS public.disruption_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(255) NOT NULL,
    district VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    risk_type VARCHAR(64) NOT NULL,
    risk_level VARCHAR(32) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    expected_time_window VARCHAR(128) NOT NULL,
    confidence_percentage NUMERIC(5, 2),
    model_connected BOOLEAN NOT NULL DEFAULT FALSE,
    data_source VARCHAR(255) NOT NULL,
    last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. route_suggestions (AI alternate routes)
CREATE TABLE IF NOT EXISTS public.route_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    current_route_data JSONB NOT NULL,
    alternative_routes_data JSONB NOT NULL,
    mapping_api_connected BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(255) NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. travel_delays
CREATE TABLE IF NOT EXISTS public.travel_delays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    district VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    normal_travel_time_min INTEGER NOT NULL,
    current_estimated_travel_time_min INTEGER NOT NULL,
    delay_min INTEGER NOT NULL DEFAULT 0,
    reason_for_delay VARCHAR(128) NOT NULL,
    reason_description TEXT,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(255) NOT NULL,
    is_live_source_connected BOOLEAN NOT NULL DEFAULT FALSE,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id VARCHAR(64) NOT NULL UNIQUE,
    vehicle_type VARCHAR(64) NOT NULL,
    driver_name_masked VARCHAR(128),
    tracking_permission_granted BOOLEAN NOT NULL DEFAULT TRUE,
    is_gps_hardware_connected BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(255) NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. vehicle_locations
CREATE TABLE IF NOT EXISTS public.vehicle_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id VARCHAR(64) NOT NULL REFERENCES public.vehicles(vehicle_id) ON DELETE CASCADE,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    address TEXT NOT NULL,
    route_name VARCHAR(255),
    status VARCHAR(64) NOT NULL,
    eta VARCHAR(64),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. essential_shipments
CREATE TABLE IF NOT EXISTS public.essential_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id VARCHAR(64) NOT NULL UNIQUE,
    vehicle_id VARCHAR(64) NOT NULL,
    goods_category VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    is_medicine_priority BOOLEAN NOT NULL DEFAULT FALSE,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    current_location VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    dispatch_time TIMESTAMPTZ NOT NULL,
    expected_arrival TIMESTAMPTZ NOT NULL,
    delay_status VARCHAR(64) NOT NULL,
    delay_min INTEGER NOT NULL DEFAULT 0,
    contents_summary TEXT,
    consignee_type VARCHAR(64) NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(255) NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. blocked_road_alerts
CREATE TABLE IF NOT EXISTS public.blocked_road_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    road_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    district VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suggested_action TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    severity VARCHAR(32) NOT NULL DEFAULT 'HIGH',
    source VARCHAR(255) NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. weather_data
CREATE TABLE IF NOT EXISTS public.weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    temperature_c NUMERIC(4, 1) NOT NULL,
    condition VARCHAR(64) NOT NULL,
    rainfall_mm_24h NUMERIC(6, 1) NOT NULL,
    is_heavy_rainfall BOOLEAN NOT NULL DEFAULT FALSE,
    flood_related_risk VARCHAR(32) NOT NULL,
    weather_alerts TEXT[],
    is_api_connected BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(255) NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_demo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 13. transport_data_sources
CREATE TABLE IF NOT EXISTS public.transport_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    endpoint TEXT,
    last_ping TIMESTAMPTZ,
    status_label VARCHAR(64) NOT NULL DEFAULT 'Not Connected (Demo Mode)'
);
`;
