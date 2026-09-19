import { useState, useEffect } from "react";
import {
  MapPin,
  AlertTriangle,
  Truck,
  Shield,
  Navigation,
  CloudRain,
  Radio,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Search,
  Plus,
  Sliders,
  Filter,
  Eye,
  Send,
  Camera,
  Activity,
  Phone,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { nerApiService } from "@/lib/ner/nerApiService";
import { NerSmartMap } from "./NerSmartMap";
import type {
  RoadStatus,
  BridgeStatus,
  DisruptionRisk,
  RouteSuggestion,
  TravelDelayRecord,
  VehicleTrackingRecord,
  EssentialShipmentRecord,
  BlockedRoadAlert,
  FieldIncidentReport,
  DistrictConnectivityRecord,
  LogisticsBottleneck,
  EmergencyRoute,
  WeatherDataRecord,
  TransportDataSource,
  IncidentType,
} from "@/types/nerLogistics";

interface CaregiverNerAccessibilityViewProps {
  store: MemoryBondStore;
  onOpenVoiceAssistant?: () => void;
  onOpenSos?: () => void;
  onNavigate?: (tab: string) => void;
}

type ActiveSection =
  | "overview"
  | "roads"
  | "risks"
  | "routes"
  | "delays"
  | "vehicles"
  | "shipments"
  | "alerts"
  | "incidents"
  | "districts"
  | "bottlenecks"
  | "emergency"
  | "weather"
  | "smartmap"
  | "democontrol";

export function CaregiverNerAccessibilityView({
  store,
  onOpenVoiceAssistant,
  onOpenSos,
  onNavigate,
}: CaregiverNerAccessibilityViewProps) {
  const { t } = useI18n();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<ActiveSection>("overview");

  // Filter States
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [roadStatusFilter, setRoadStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Route Planning Inputs
  const [startInput, setStartInput] = useState<string>("Guwahati (Assam)");
  const [destInput, setDestInput] = useState<string>("Silchar (Barak Valley, Assam)");

  // Incident Submission Form Modal State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType>("Landslide");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [incidentDistrict, setIncidentDistrict] = useState("Dima Hasao");
  const [incidentState, setIncidentState] = useState("Assam");
  const [incidentLocation, setIncidentLocation] = useState("Jatinga Valley km 142");
  const [gpsConsentGranted, setGpsConsentGranted] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [incidentSubmittedToast, setIncidentSubmittedToast] = useState(false);

  // Data States
  const [roads, setRoads] = useState<RoadStatus[]>([]);
  const [bridges, setBridges] = useState<BridgeStatus[]>([]);
  const [risks, setRisks] = useState<DisruptionRisk[]>([]);
  const [routeSuggestions, setRouteSuggestions] = useState<RouteSuggestion[]>([]);
  const [delays, setDelays] = useState<TravelDelayRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleTrackingRecord[]>([]);
  const [shipments, setShipments] = useState<EssentialShipmentRecord[]>([]);
  const [alerts, setAlerts] = useState<BlockedRoadAlert[]>([]);
  const [incidents, setIncidents] = useState<FieldIncidentReport[]>([]);
  const [districts, setDistricts] = useState<DistrictConnectivityRecord[]>([]);
  const [bottlenecks, setBottlenecks] = useState<LogisticsBottleneck[]>([]);
  const [emergencyRoutes, setEmergencyRoutes] = useState<EmergencyRoute[]>([]);
  const [weather, setWeather] = useState<WeatherDataRecord[]>([]);
  const [transportSources, setTransportSources] = useState<TransportDataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load logistics data on mount
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        r,
        b,
        risk,
        routes,
        d,
        v,
        s,
        al,
        inc,
        dist,
        bot,
        em,
        wx,
        src,
      ] = await Promise.all([
        nerApiService.getRoadStatuses(),
        nerApiService.getBridgeStatuses(),
        nerApiService.getDisruptionRisks(),
        nerApiService.getRouteSuggestions(startInput, destInput),
        nerApiService.getTravelDelays(),
        nerApiService.getVehicles(store.profile.role),
        nerApiService.getEssentialShipments(),
        nerApiService.getBlockedAlerts(),
        nerApiService.getIncidentReports(),
        nerApiService.getDistrictConnectivity(),
        nerApiService.getLogisticsBottlenecks(),
        nerApiService.getEmergencyRoutes(),
        nerApiService.getWeatherData(),
        nerApiService.getTransportDataSources(),
      ]);

      setRoads(r);
      setBridges(b);
      setRisks(risk);
      setRouteSuggestions(routes);
      setDelays(d);
      setVehicles(v);
      setShipments(s);
      setAlerts(al);
      setIncidents(inc);
      setDistricts(dist);
      setBottlenecks(bot);
      setEmergencyRoutes(em);
      setWeather(wx);
      setTransportSources(src);
    } catch (err) {
      console.error("[NER Logistics] Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [store.profile.role]);

  // Transparency metadata
  const transparency = nerApiService.getTransparencyMetadata(
    !store.isOnline || store.offlineModeForced
  );

  // Filtered Roads
  const filteredRoads = roads.filter((road) => {
    if (districtFilter !== "all" && road.district !== districtFilter) return false;
    if (roadStatusFilter !== "all" && road.status !== roadStatusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        road.route_name.toLowerCase().includes(q) ||
        road.location.toLowerCase().includes(q) ||
        road.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // GPS Permission Requester for Incident Reporting
  const handleRequestGps = () => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoordinates({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsConsentGranted(true);
          setGpsError(null);
        },
        (err) => {
          setGpsError("GPS permission not granted. You can type the location manually.");
          setGpsConsentGranted(false);
        }
      );
    } else {
      setGpsError("Geolocation is not supported in this browser. Please enter location manually.");
    }
  };

  // Submit Incident Handler
  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc.trim()) return;

    await nerApiService.submitIncidentReport({
      incident_type: incidentType,
      description: incidentDesc,
      district: incidentDistrict,
      state: incidentState,
      address: incidentLocation,
      latitude: gpsCoordinates?.lat,
      longitude: gpsCoordinates?.lng,
      photo_name: "field_report_photo.jpg",
    });

    setIsIncidentModalOpen(false);
    setIncidentDesc("");
    setIncidentSubmittedToast(true);
    setTimeout(() => setIncidentSubmittedToast(false), 4000);
    loadData();
  };

  // Demo Control Panel Actions
  const handleToggleRoad = (roadId: string) => {
    nerApiService.toggleRoadBlockSimulation(roadId);
    loadData();
  };

  const handleResetDemo = () => {
    nerApiService.resetToDefaultDemo();
    loadData();
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden box-border">
      {/* 1. TOP TRANSPARENCY NOTICE (Section 21) */}
      <div className="rounded-3xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-amber-800 dark:text-amber-300 font-black text-xs uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full">
              DATA SOURCE TRANSPARENCY
            </span>
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
              {transparency.notice}
            </span>
          </div>
          <p className="text-xs text-amber-900/80 dark:text-amber-300/80 font-medium">
            Source: <strong>{transparency.dataSource}</strong> | Last Updated: <strong>{transparency.lastUpdated}</strong> | Mode: <strong>{transparency.connectionStatus}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-xl bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100 text-xs font-black uppercase">
            {transparency.connectionStatus === "LIVE" ? "🟢 LIVE" : "🟡 DEMO / SIMULATION"}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            className="rounded-xl font-bold text-xs gap-1 cursor-pointer bg-white text-amber-950 border-amber-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Incident Submitted Confirmation Toast */}
      {incidentSubmittedToast && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 text-emerald-950 p-4 flex items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Incident Report Submitted. The event now appears on the field map.</span>
          </div>
          <span className="text-xs font-black uppercase bg-emerald-200 px-2 py-0.5 rounded-full text-emerald-900">
            Recorded
          </span>
        </div>
      )}

      {/* 2. CAREGIVER HEADER & SUB-NAVIGATION BAR */}
      <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#1E6FD9] bg-[#EBF3FC] dark:bg-sky-950 px-3 py-1 rounded-full border border-[#D0E2FF] dark:border-sky-800">
                North Eastern Region Logistics Suite
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground font-display mt-1.5 flex items-center gap-2">
              <span>NER Accessibility & Smart Logistics</span>
              <span className="text-sky-600">🗺️</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground mt-0.5">
              Road, bridge, route, and essential-goods accessibility monitoring across Assam, Meghalaya, Arunachal, Manipur, Mizoram, Nagaland, Tripura & Sikkim.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsIncidentModalOpen(true)}
              className="rounded-2xl font-black text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Report Road Incident</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("democontrol")}
              className="rounded-2xl font-bold text-xs sm:text-sm border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200 cursor-pointer gap-1.5"
            >
              <Sliders className="h-4 w-4 text-amber-600" />
              <span>SIH Demo Controls</span>
            </Button>
          </div>
        </div>

        {/* Sub-Navigation Tabs Carousel / Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 no-scrollbar border-t border-border/60">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "roads", label: "Roads & Bridges", icon: Navigation },
            { id: "risks", label: "Disruption Risk", icon: AlertTriangle },
            { id: "routes", label: "AI Alternate Routes", icon: Sparkles },
            { id: "delays", label: "Travel Delays", icon: Clock },
            { id: "vehicles", label: "GPS Vehicles", icon: Truck },
            { id: "shipments", label: "Essential Goods", icon: Shield },
            { id: "alerts", label: "Road Alerts", icon: AlertOctagon },
            { id: "incidents", label: "Field Reports", icon: FileText },
            { id: "districts", label: "Districts", icon: MapPin },
            { id: "bottlenecks", label: "Bottlenecks", icon: Filter },
            { id: "emergency", label: "Emergency Corridors", icon: Phone },
            { id: "weather", label: "Weather", icon: CloudRain },
            { id: "smartmap", label: "Smart Map", icon: Layers },
            { id: "democontrol", label: "Demo Panel", icon: Sliders },
          ].map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => setActiveTab(tabItem.id as ActiveSection)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none ${
                  isActive
                    ? "bg-[#1E6FD9] text-white shadow-xs scale-102"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tabItem.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TAB CONTENT RENDERERS */}

      {/* =================================================================== */}
      {/* OVERVIEW TAB                                                        */}
      {/* =================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Total Routes
                </span>
                <span className="text-xl">🛣️</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                {roads.length}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-emerald-600">
                  {roads.filter((r) => r.status === "OPEN").length} Open
                </span>
                <span>•</span>
                <span className="text-rose-600">
                  {roads.filter((r) => r.status === "BLOCKED").length} Blocked
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Disruption Risks
                </span>
                <span className="text-xl">⛰️</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                {risks.length}
              </div>
              <div className="text-xs font-bold text-amber-600">
                {risks.filter((r) => r.risk_level === "CRITICAL").length} Critical Hazard Warnings
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Essential Shipments
                </span>
                <span className="text-xl">💊</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                {shipments.length}
              </div>
              <div className="text-xs font-bold text-teal-600">
                {shipments.filter((s) => s.is_medicine_priority).length} High-Priority Medical Shipments
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Field Incidents
                </span>
                <span className="text-xl">⚠️</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                {incidents.length}
              </div>
              <div className="text-xs font-bold text-sky-600">
                Geo-tagged & Verified
              </div>
            </div>
          </div>

          {/* Embedded Central Smart Map */}
          <NerSmartMap
            roads={roads}
            bridges={bridges}
            risks={risks}
            vehicles={vehicles}
            shipments={shipments}
            incidents={incidents}
            districts={districts}
            isSeniorMode={false}
          />

          {/* Highlights Grid: Critical Blockages + Medical Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Critical Blockages Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-rose-600" />
                  <span>Critical Blockages Requiring Attention</span>
                </h3>
                <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {roads.filter((r) => r.status === "BLOCKED").length} Active
                </span>
              </div>

              <div className="space-y-2.5">
                {roads
                  .filter((r) => r.status === "BLOCKED")
                  .map((road) => (
                    <div
                      key={road.id}
                      className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-black text-rose-950 dark:text-rose-200">
                          {road.route_name}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-200 text-rose-900 shrink-0">
                          Blocked
                        </span>
                      </div>
                      <div className="text-muted-foreground font-semibold">
                        Location: {road.location} ({road.district}, {road.state})
                      </div>
                      {road.incident_information && (
                        <div className="text-rose-900 dark:text-rose-300 font-bold">
                          Reason: {road.incident_information}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Critical Medical Shipments Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-teal-600" />
                  <span>Priority Medicine Shipments</span>
                </h3>
                <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  High Priority
                </span>
              </div>

              <div className="space-y-2.5">
                {shipments
                  .filter((s) => s.is_medicine_priority)
                  .map((ship) => (
                    <div
                      key={ship.id}
                      className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-black text-teal-950 dark:text-teal-200">
                            {ship.shipment_id}
                          </span>
                          <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-teal-200 text-teal-900">
                            {ship.goods_category}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                          {ship.delay_status}
                        </span>
                      </div>
                      <div className="text-muted-foreground font-medium">
                        Destination: <strong>{ship.destination}</strong>
                      </div>
                      <div className="text-xs font-bold text-teal-900 dark:text-teal-300">
                        Contents: {ship.contents_summary}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ROADS & BRIDGES TAB                                                 */}
      {/* =================================================================== */}
      {activeTab === "roads" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search routes or towns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs w-48 sm:w-64 rounded-xl"
                />
              </div>

              <select
                value={roadStatusFilter}
                onChange={(e) => setRoadStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-bold text-foreground cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="OPEN">Open (Accessible)</option>
                <option value="PARTIAL">Partial (Limited)</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            <div className="text-xs font-bold text-muted-foreground">
              Showing {filteredRoads.length} of {roads.length} road segments
            </div>
          </div>

          {/* Road Cards Grid */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-foreground">
              Road Accessibility Records
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredRoads.map((road) => {
                const isOpen = road.status === "OPEN";
                const isBlocked = road.status === "BLOCKED";

                return (
                  <div
                    key={road.id}
                    className={`p-4 sm:p-5 rounded-3xl border text-xs space-y-3 transition-all ${
                      isBlocked
                        ? "bg-rose-50/40 border-rose-200"
                        : isOpen
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-amber-50/40 border-amber-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-sm text-foreground">
                          {road.route_name}
                        </div>
                        <div className="text-muted-foreground font-semibold">
                          Location: {road.location} ({road.district}, {road.state})
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-black uppercase shrink-0 ${
                          isOpen
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isBlocked
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {road.status_label}
                      </span>
                    </div>

                    {road.incident_information && (
                      <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 text-xs font-medium text-foreground">
                        <strong>Incident:</strong> {road.incident_information}
                      </div>
                    )}

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground border-t border-border/40">
                      <span>Source: {road.source}</span>
                      <span>Updated: {road.last_updated}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bridge Status Cards */}
          <div className="space-y-3 pt-4">
            <h3 className="text-base font-black text-foreground">
              Major Bridge Accessibility Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {bridges.map((bridge) => (
                <div
                  key={bridge.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs text-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-sm text-foreground">
                        {bridge.bridge_name}
                      </div>
                      <div className="text-muted-foreground font-semibold">
                        Over: {bridge.river} | {bridge.district}, {bridge.state}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        bridge.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-800"
                          : bridge.status === "BLOCKED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {bridge.status_label}
                    </span>
                  </div>

                  {bridge.weight_restriction_tonnes !== undefined && (
                    <div className="text-muted-foreground">
                      Weight limit: <strong>{bridge.weight_restriction_tonnes} tonnes</strong>
                    </div>
                  )}

                  {bridge.incident_information && (
                    <div className="p-2 rounded-xl bg-muted/40 text-muted-foreground text-[11px]">
                      {bridge.incident_information}
                    </div>
                  )}

                  <div className="flex justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-1">
                    <span>Source: {bridge.source}</span>
                    <span>{bridge.last_updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* DISRUPTION RISK PREDICTIONS TAB                                     */}
      {/* =================================================================== */}
      {activeTab === "risks" && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-muted/20 border border-border text-xs font-semibold flex items-center gap-2">
            <span className="text-base">ℹ️</span>
            <span>
              Prediction models are currently running in <strong>Simulation Mode</strong>. Machine learning early warning confidence percentages will display once live geotechnical sensor streams are configured.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {risks.map((risk) => {
              const isCritical = risk.risk_level === "CRITICAL";
              const isHigh = risk.risk_level === "HIGH";

              return (
                <div
                  key={risk.id}
                  className={`p-5 rounded-3xl border text-xs space-y-3 ${
                    isCritical
                      ? "bg-rose-50/50 border-rose-300"
                      : isHigh
                      ? "bg-amber-50/50 border-amber-300"
                      : "bg-sky-50/50 border-sky-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {risk.risk_type.replace("_", " ")}
                      </div>
                      <div className="font-black text-base text-foreground">
                        {risk.location}
                      </div>
                      <div className="text-muted-foreground font-semibold">
                        {risk.district}, {risk.state}
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        isCritical
                          ? "bg-rose-600 text-white shadow-xs"
                          : isHigh
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-sky-600 text-white"
                      }`}
                    >
                      {risk.risk_level} RISK
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-background/90 border border-border/60 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Expected Window:</span>
                      <span className="font-bold">{risk.expected_time_window}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Model Status:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {risk.model_connected ? "Live Model" : "Prediction model not connected (Simulation)"}
                      </span>
                    </div>
                    {risk.notes && (
                      <div className="pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                        {risk.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                    <span>Source: {risk.data_source}</span>
                    <span>Updated: {risk.last_update}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* AI ALTERNATE ROUTES TAB                                             */}
      {/* =================================================================== */}
      {activeTab === "routes" && (
        <div className="space-y-6">
          {/* Route Origin/Destination Form */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-4">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <span>AI Route Analysis & Alternate Bypass Finder</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black text-muted-foreground uppercase">
                  Start Location
                </Label>
                <Input
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  placeholder="e.g. Guwahati (Assam)"
                  className="rounded-xl h-11 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black text-muted-foreground uppercase">
                  Destination
                </Label>
                <Input
                  value={destInput}
                  onChange={(e) => setDestInput(e.target.value)}
                  placeholder="e.g. Silchar (Barak Valley, Assam)"
                  className="rounded-xl h-11 text-xs font-bold"
                />
              </div>
            </div>

            <Button
              onClick={async () => {
                const res = await nerApiService.getRouteSuggestions(startInput, destInput);
                setRouteSuggestions(res);
              }}
              className="w-full h-11 rounded-2xl font-black text-xs sm:text-sm bg-primary text-white cursor-pointer"
            >
              Analyze Corridor & Find Safe Bypass Routes
            </Button>
          </div>

          {/* Route Results */}
          <div className="space-y-4">
            {routeSuggestions.map((sugg) => (
              <div
                key={sugg.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h4 className="text-base font-black text-foreground">
                      {sugg.start_location} ➔ {sugg.destination}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Analysis mode: {sugg.source}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Demo Routing Mode
                  </span>
                </div>

                {/* Current Affected Route */}
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-rose-950 dark:text-rose-200 text-sm">
                      Current Route: {sugg.current_route.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-black uppercase text-[10px]">
                      {sugg.current_route.status}
                    </span>
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Distance: <strong>{sugg.current_route.distance_km} km</strong> | Estimated: <strong>{Math.round((sugg.current_route.estimated_time_min || 0) / 60)} hours</strong>
                  </div>
                  <div className="text-rose-900 dark:text-rose-300 font-bold">
                    Disruption: {sugg.current_route.problem_description}
                  </div>
                </div>

                {/* Alternate Options */}
                <div className="space-y-3 pt-1">
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Recommended Alternatives
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sugg.alternative_routes.map((alt) => (
                      <div
                        key={alt.route_id}
                        className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 text-xs space-y-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="font-black text-emerald-950 dark:text-emerald-200 text-sm">
                            {alt.route_name}
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black uppercase text-[10px] shrink-0">
                            {alt.accessibility_status}
                          </span>
                        </div>

                        <div className="text-muted-foreground">
                          Via: <strong>{alt.via}</strong>
                        </div>

                        <div className="flex justify-between font-semibold text-muted-foreground">
                          <span>Approx: {alt.approx_distance_km} km</span>
                          <span>Time: ~{Math.round((alt.estimated_travel_time_min || 0) / 60)} hrs</span>
                        </div>

                        {alt.known_disruption && (
                          <div className="text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                            ⚠️ Note: {alt.known_disruption}
                          </div>
                        )}

                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                          ✓ Reason: {alt.recommendation_reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TRAVEL DELAYS TAB                                                   */}
      {/* =================================================================== */}
      {activeTab === "delays" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-muted/20 border border-border text-xs font-semibold flex items-center justify-between">
            <span>Estimated in Demo Mode (Simulation)</span>
            <span className="text-muted-foreground">Live telematics not connected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delays.map((del) => (
              <div
                key={del.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs text-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-sm text-foreground">
                      {del.route_name}
                    </div>
                    <div className="text-muted-foreground font-semibold">
                      {del.origin} ➔ {del.destination} ({del.district}, {del.state})
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    +{del.delay_min} mins Delay
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-muted/30 text-center">
                  <div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase">
                      Normal Time
                    </div>
                    <div className="text-base font-black text-foreground">
                      {Math.round(del.normal_travel_time_min / 60)}h {del.normal_travel_time_min % 60}m
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase">
                      Current Estimate
                    </div>
                    <div className="text-base font-black text-rose-600">
                      {Math.round(del.current_estimated_travel_time_min / 60)}h {del.current_estimated_travel_time_min % 60}m
                    </div>
                  </div>
                </div>

                <div className="text-xs font-medium text-foreground">
                  <strong>Reason:</strong> {del.reason_for_delay} — {del.reason_description}
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-1">
                  <span>Source: {del.source}</span>
                  <span>{del.last_updated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* GPS VEHICLES & ESSENTIAL GOODS TAB                                  */}
      {/* =================================================================== */}
      {(activeTab === "vehicles" || activeTab === "shipments") && (
        <div className="space-y-6">
          {/* Privacy & Permission Notice */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-700" />
              <span>
                Authorized Telematics View: Vehicles tracked with authorized GPS driver consent only.
              </span>
            </div>
            <span className="text-[11px] font-black uppercase text-sky-800 bg-sky-200 px-2.5 py-0.5 rounded-full">
              Demo Vehicle Tracking
            </span>
          </div>

          {/* Essential Goods Shipments Table/Cards */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-600" />
              <span>Essential Goods & Medical Consignments</span>
            </h3>

            <div className="space-y-3">
              {shipments.map((ship) => (
                <div
                  key={ship.id}
                  className={`p-4 sm:p-5 rounded-3xl border text-xs space-y-3 ${
                    ship.is_medicine_priority
                      ? "bg-teal-50/40 border-teal-300"
                      : "bg-white dark:bg-slate-900 border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-foreground">
                        {ship.shipment_id}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {ship.goods_category}
                      </span>
                      {ship.is_medicine_priority && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          CRITICAL MEDICINE PRIORITY
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        ship.status === "IN TRANSIT"
                          ? "bg-sky-100 text-sky-800"
                          : ship.status === "ARRIVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : ship.status === "DELAYED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {ship.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground">
                    <div>
                      Vehicle: <strong>{ship.vehicle_id}</strong>
                    </div>
                    <div>
                      Origin: <strong>{ship.origin}</strong>
                    </div>
                    <div>
                      Destination: <strong>{ship.destination}</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 text-foreground font-medium flex flex-wrap justify-between items-center gap-2">
                    <div>
                      Contents: <strong>{ship.contents_summary}</strong>
                    </div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      ETA: {ship.expected_arrival} ({ship.delay_status})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Fleet Cards */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-sky-600" />
              <span>Active Telematics Fleet</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs text-xs space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-foreground">
                      {v.vehicle_id}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {v.vehicle_type}
                    </span>
                  </div>

                  <div className="text-muted-foreground">
                    Driver: <strong>{v.driver_name_masked}</strong>
                  </div>

                  <div className="text-xs font-medium text-foreground">
                    Current: {v.current_location.address}
                  </div>

                  <div className="flex justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300">
                    <span>ETA: {v.eta}</span>
                    <span>GPS: {v.last_gps_update}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ROAD ALERTS TAB                                                     */}
      {/* =================================================================== */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground">
              Active Blocked Road Alerts
            </h3>
            <span className="text-xs font-bold text-muted-foreground">
              Emergency Broadcast Feed
            </span>
          </div>

          <div className="space-y-3">
            {alerts.map((al) => (
              <div
                key={al.id}
                className="p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/30 border-2 border-rose-300 text-xs space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black uppercase text-[10px]">
                      ROAD BLOCKED
                    </span>
                    <h4 className="text-base font-black text-rose-950 dark:text-rose-200 mt-1">
                      {al.road_name}
                    </h4>
                    <p className="text-muted-foreground font-semibold">
                      Location: {al.location} ({al.district}, {al.state})
                    </p>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground shrink-0">
                    {al.timestamp}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-rose-200 text-foreground font-medium space-y-1">
                  <div>
                    <strong>Reason:</strong> {al.reason}
                  </div>
                  <div className="text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Suggested Action: {al.suggested_action}</span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground">
                  Source: {al.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* FIELD INCIDENT REPORTS TAB                                          */}
      {/* =================================================================== */}
      {activeTab === "incidents" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-foreground">
                Geo-Tagged Field Incident Reports
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Verified community & authorized emergency worker submissions
              </p>
            </div>

            <Button
              onClick={() => setIsIncidentModalOpen(true)}
              className="rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Submit New Incident</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs text-xs space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      {inc.incident_type}
                    </span>
                    <h4 className="font-black text-sm text-foreground mt-1">
                      {inc.district}, {inc.state}
                    </h4>
                    <p className="text-muted-foreground font-semibold">
                      {inc.gps_location.address}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-muted text-muted-foreground">
                    {inc.verification_status}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-muted/40 text-foreground font-medium">
                  {inc.description}
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-1">
                  <span>Reporter: {inc.reporter_id_masked}</span>
                  <span>{inc.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* DISTRICT CONNECTIVITY TAB                                           */}
      {/* =================================================================== */}
      {activeTab === "districts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground">
              NER District-Wise Connectivity Matrix
            </h3>
            <span className="text-xs font-bold text-muted-foreground">
              All 8 NER States
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {districts.map((dist) => {
              const isGood = dist.connectivity_status === "GOOD CONNECTIVITY";
              const isSevere = dist.connectivity_status === "SEVERELY DISRUPTED";

              return (
                <div
                  key={dist.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs text-xs space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-black text-sm text-foreground">
                        {dist.district_name}
                      </div>
                      <div className="text-muted-foreground font-semibold">
                        {dist.state}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isGood
                          ? "bg-emerald-100 text-emerald-800"
                          : isSevere
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {dist.connectivity_status.split(" ")[0]}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-muted/40 text-center text-[11px] font-bold">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Open</div>
                      <div className="text-emerald-700 font-black">{dist.open_routes_count}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Partial</div>
                      <div className="text-amber-700 font-black">{dist.partial_routes_count}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Blocked</div>
                      <div className="text-rose-700 font-black">{dist.blocked_routes_count}</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                    <span>Incidents: {dist.active_incidents_count}</span>
                    <span>Delays: {dist.essential_goods_delays_count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* BOTTLENECKS & EMERGENCY CORRIDORS TAB                               */}
      {/* =================================================================== */}
      {(activeTab === "bottlenecks" || activeTab === "emergency") && (
        <div className="space-y-6">
          {/* Bottlenecks Monitoring */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4 text-rose-600" />
              <span>Critical Logistics Bottlenecks</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bottlenecks.map((bot) => (
                <div
                  key={bot.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs text-xs space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        {bot.severity} SEVERITY
                      </span>
                      <h4 className="font-black text-sm text-foreground mt-1">
                        {bot.location}
                      </h4>
                      <p className="text-muted-foreground font-semibold">
                        {bot.district}, {bot.state}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 text-foreground font-medium space-y-1">
                    <div>
                      <strong>Affected Route:</strong> {bot.affected_route}
                    </div>
                    <div>
                      <strong>Issue:</strong> {bot.issue}
                    </div>
                    <div>
                      <strong>Affected Shipments:</strong>{" "}
                      {bot.is_shipment_data_available && bot.affected_shipment_count !== null
                        ? `${bot.affected_shipment_count} consignments delayed`
                        : "Data unavailable"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Corridors */}
          <div className="space-y-3 pt-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span>Emergency / Disaster Accessible Routes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emergencyRoutes.map((em) => (
                <div
                  key={em.id}
                  className="p-5 rounded-3xl bg-sky-50/40 dark:bg-sky-950/30 border border-sky-200 text-xs space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-200 text-sky-900">
                        {em.category}
                      </span>
                      <h4 className="font-black text-sm text-foreground mt-1">
                        {em.route_name}
                      </h4>
                      <p className="text-muted-foreground font-semibold">
                        {em.start_location} ➔ {em.destination}
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {em.accessibility_status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 text-foreground font-medium">
                    {em.advisory_notice}
                  </div>

                  {em.is_official_verified && (
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      ✓ Verified by: {em.verified_by_agency}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* WEATHER TAB                                                         */}
      {/* =================================================================== */}
      {activeTab === "weather" && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-muted/20 border border-border text-xs font-semibold flex items-center justify-between">
            <span>Weather API Integration Layer</span>
            <span className="text-muted-foreground">
              Status: Weather API not connected (Simulation Mode)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weather.map((w) => (
              <div
                key={w.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs text-xs space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-black text-base text-foreground">
                      {w.district}, {w.state}
                    </h4>
                    <p className="text-sm font-bold text-sky-600 mt-0.5">
                      {w.condition}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-foreground">
                      {w.temperature_c}°C
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-muted/30 text-center font-bold">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      24h Rainfall
                    </div>
                    <div className="text-base text-foreground">{w.rainfall_mm_24h} mm</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      Flood Risk
                    </div>
                    <div className="text-base text-rose-600">{w.flood_related_risk}</div>
                  </div>
                </div>

                {w.weather_alerts.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-900 dark:text-amber-200 font-bold text-[11px]">
                    ⚠️ {w.weather_alerts[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SMART MAP TAB                                                       */}
      {/* =================================================================== */}
      {activeTab === "smartmap" && (
        <div className="space-y-4">
          <NerSmartMap
            roads={roads}
            bridges={bridges}
            risks={risks}
            vehicles={vehicles}
            shipments={shipments}
            incidents={incidents}
            districts={districts}
            isSeniorMode={false}
          />
        </div>
      )}

      {/* =================================================================== */}
      {/* SIH DEMO CONTROL PANEL (Section 25)                                */}
      {/* =================================================================== */}
      {activeTab === "democontrol" && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-2 border-amber-300 shadow-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-200 px-3 py-1 rounded-full">
                SIH PRESENTATION TOOLKIT
              </span>
              <h3 className="text-xl font-black text-foreground mt-1.5">
                NER Demo Simulation Control Panel
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Designed for Smart India Hackathon jury live demonstrations to test dynamic road blockages, weather disruptions, and rerouting.
              </p>
            </div>

            <Button
              onClick={handleResetDemo}
              variant="outline"
              className="rounded-xl font-bold text-xs border-amber-400 text-amber-950 bg-white hover:bg-amber-100 cursor-pointer"
            >
              Reset All to Baseline
            </Button>
          </div>

          <div className="space-y-4 text-xs">
            <h4 className="font-black text-sm text-foreground">
              1. Toggle Dynamic Road Blockage Simulation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roads.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl bg-background border border-border flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-black text-foreground truncate">{r.route_name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{r.district}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleToggleRoad(r.id)}
                    className={`rounded-xl font-black text-xs cursor-pointer ${
                      r.status === "OPEN"
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {r.status === "OPEN" ? "Trigger Block" : "Clear Road"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200 text-xs text-muted-foreground space-y-1 font-medium">
            <p>
              • All changes update the Central Smart Map and Senior Mode responses instantly.
            </p>
            <p>
              • Data Source transparency indicators automatically preserve "Demo Mode" labeling.
            </p>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* REPORT FIELD INCIDENT MODAL (Section 9)                             */}
      {/* =================================================================== */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="text-lg font-black text-foreground">
                  Report Road Incident
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(false)}
                className="text-muted-foreground hover:text-foreground font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIncidentSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="font-bold text-foreground">Incident Type</Label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background font-bold text-foreground cursor-pointer"
                >
                  <option value="Landslide">Landslide</option>
                  <option value="Flood">Flood / Submerged Carriageway</option>
                  <option value="Road damage">Road Damage / Potholes / Scour</option>
                  <option value="Bridge damage">Bridge Structural Damage</option>
                  <option value="Blocked road">Blocked Road / Fallen Tree</option>
                  <option value="Accident">Vehicle Breakdown / Accident</option>
                  <option value="Other">Other Disruption</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-bold text-foreground">District</Label>
                  <Input
                    value={incidentDistrict}
                    onChange={(e) => setIncidentDistrict(e.target.value)}
                    placeholder="e.g. Dima Hasao"
                    className="rounded-xl h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-foreground">State</Label>
                  <Input
                    value={incidentState}
                    onChange={(e) => setIncidentState(e.target.value)}
                    placeholder="e.g. Assam"
                    className="rounded-xl h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-foreground">Location / Route Name</Label>
                <Input
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  placeholder="e.g. NH-27 Jatinga Valley km 142"
                  className="rounded-xl h-10"
                  required
                />
              </div>

              {/* GPS Location Permission Control (Section 9 & 23) */}
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">GPS Location Access</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRequestGps}
                    className="rounded-xl text-xs font-bold gap-1 cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{gpsConsentGranted ? "✓ GPS Acquired" : "Request Device GPS"}</span>
                  </Button>
                </div>
                {gpsError && (
                  <p className="text-[11px] text-amber-700 font-semibold">{gpsError}</p>
                )}
                {gpsCoordinates && (
                  <p className="text-[11px] text-emerald-700 font-bold">
                    Coordinates: {gpsCoordinates.lat.toFixed(4)}, {gpsCoordinates.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-foreground">Detailed Description</Label>
                <textarea
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Describe severity, estimated debris width, machinery requirements..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-input bg-background font-medium text-foreground text-xs resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 h-11 rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                >
                  Submit Incident Report
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="h-11 rounded-2xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
