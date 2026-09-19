import { useState, useEffect } from "react";
import {
  MapPin,
  Volume2,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
  PhoneCall,
  Navigation,
  Sparkles,
  Compass,
  Lock,
  CloudRain,
  Clock,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import {
  fetchLiveWeatherOpenMeteo,
  calculateRouteOSRM,
  searchNearbyEmergencyFacilities,
  analyzeRoadSafety,
  searchPlacesNominatim,
  sanitizeSearchQuery,
  DEFAULT_NER_CENTER,
} from "@/lib/safety/realMapService";
import { RealInteractiveMap } from "@/components/memory-bond/safety/RealInteractiveMap";
import { LocationPermissionModal } from "@/components/memory-bond/safety/LocationPermissionModal";
import type {
  LocationState,
  SelectedLocationState,
  RealRouteResult,
  RealWeatherResult,
  EmergencyFacility,
  RoadStatusAnalysis,
  LatLng,
} from "@/types/realSafetyMap";

interface SeniorNerAccessibilityViewProps {
  store: MemoryBondStore;
  onOpenVoiceAssistant: () => void;
  onOpenSos: () => void;
  onNavigate?: (tab: string) => void;
}

export function SeniorNerAccessibilityView({
  store,
  onOpenVoiceAssistant,
  onOpenSos,
  onNavigate,
}: SeniorNerAccessibilityViewProps) {
  const { t, speechLocale } = useI18n();

  // A) Current Live Device Location State (Requirement 1, 2, 18)
  const [locationState, setLocationState] = useState<LocationState>({
    coords: null,
    accuracyMeters: null,
    isAccuracyLimited: false,
    permissionStatus: "prompt",
    lastUpdated: null,
    isTrackingActive: false,
    isSharingEnabled: false, // Strict Privacy Default = OFF
    source: "Device GPS Telemetry",
  });

  // B) User-Selected Map Location State (Requirement 1, 3, 4, 18)
  // Stored completely independently from locationState. GPS updates NEVER overwrite this.
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocationState | null>(null);

  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // Active Results State
  const [activeModal, setActiveModal] = useState<"check" | "route" | "alert" | "emergency" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [roadAnalysis, setRoadAnalysis] = useState<RoadStatusAnalysis | null>(null);
  const [liveWeather, setLiveWeather] = useState<RealWeatherResult | null>(null);
  const [activeRoute, setActiveRoute] = useState<RealRouteResult | null>(null);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Custom route search
  const [destinationQuery, setDestinationQuery] = useState("");

  const speakMessage = (text: string) => {
    stopSpeaking();
    speakText(text, speechLocale || "en-IN");
  };

  // Request browser location
  const handleRequestLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setIsPermissionDenied(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const accuracy = pos.coords.accuracy;
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Update ONLY currentLocation. Notice selectedLocation is untouched! (Requirement 2 & 3)
        setLocationState({
          coords,
          accuracyMeters: accuracy,
          isAccuracyLimited: accuracy > 100,
          permissionStatus: "granted",
          lastUpdated: now,
          isTrackingActive: true,
          isSharingEnabled: false,
          source: "Device GPS Telemetry",
        });
        setIsPermissionModalOpen(false);
        setIsPermissionDenied(false);

        // Preload real weather & nearby facilities for senior's coordinates
        fetchLiveWeatherOpenMeteo(coords.lat, coords.lng).then(setLiveWeather);
        searchNearbyEmergencyFacilities(coords.lat, coords.lng, "hospital").then(setFacilities);
      },
      (err) => {
        console.warn("[SeniorSafety] Geolocation denied:", err);
        setLocationState((prev) => ({ ...prev, permissionStatus: "denied" }));
        setIsPermissionDenied(true);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // 1. CHECK ROAD: Real road & weather safety analysis (Requirement 4 & 6)
  // Uses selectedLocation if user selected one; otherwise checks immediate corridor around user GPS.
  const handleCheckRoad = async () => {
    setActiveModal("check");
    setIsLoading(true);
    const userPos = locationState.coords || DEFAULT_NER_CENTER;

    if (selectedLocation) {
      const targetPos = { lat: selectedLocation.lat, lng: selectedLocation.lng };
      const targetName = selectedLocation.name;
      const analysis = await analyzeRoadSafety(userPos, targetPos, targetName);
      setRoadAnalysis(analysis);

      const spoken = `Inspecting road toward ${targetName}. ${analysis.headline}. ${analysis.details}`;
      setStatusMessage(spoken);
      speakMessage(spoken);
    } else {
      const destPos = { lat: userPos.lat + 0.15, lng: userPos.lng + 0.15 };
      const analysis = await analyzeRoadSafety(userPos, destPos, "Immediate Travel Corridor");
      setRoadAnalysis(analysis);

      const spoken = `${analysis.headline}. ${analysis.details}`;
      setStatusMessage(spoken);
      speakMessage(spoken);
    }
    setIsLoading(false);
  };

  // 2. GET ROUTE HELP: Real OSRM route calculation (Requirement 5 & 7)
  // ORIGIN = Current Live Location (locationState.coords)
  // DESTINATION = Selected Map Location (selectedLocation)
  const handleGetRouteHelp = async (customDest?: string | SelectedLocationState) => {
    setActiveModal("route");
    setIsLoading(true);
    const originPos = locationState.coords || DEFAULT_NER_CENTER;
    let targetDest: { lat: number; lng: number; name: string } | null = null;

    if (typeof customDest === "object" && customDest !== null) {
      targetDest = { lat: customDest.lat, lng: customDest.lng, name: customDest.name };
      setSelectedLocation(customDest);
    } else if (typeof customDest === "string" && customDest.trim()) {
      const cleanQ = sanitizeSearchQuery(customDest);
      if (cleanQ) {
        const results = await searchPlacesNominatim(cleanQ, originPos.lat, originPos.lng);
        if (results.length > 0) {
          const first = results[0];
          targetDest = { lat: first.lat, lng: first.lng, name: first.name };
          const newLoc: SelectedLocationState = {
            lat: first.lat,
            lng: first.lng,
            name: first.name,
            address: first.displayName,
            type: first.category || "Search Result",
            selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setSelectedLocation(newLoc);
        }
      }
    } else if (selectedLocation) {
      targetDest = { lat: selectedLocation.lat, lng: selectedLocation.lng, name: selectedLocation.name };
    } else if (destinationQuery.trim()) {
      const cleanQ = sanitizeSearchQuery(destinationQuery);
      if (cleanQ) {
        const results = await searchPlacesNominatim(cleanQ, originPos.lat, originPos.lng);
        if (results.length > 0) {
          const first = results[0];
          targetDest = { lat: first.lat, lng: first.lng, name: first.name };
          const newLoc: SelectedLocationState = {
            lat: first.lat,
            lng: first.lng,
            name: first.name,
            address: first.displayName,
            type: first.category || "Search Result",
            selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setSelectedLocation(newLoc);
        }
      }
    }

    if (!targetDest) {
      const msg = "Please search or select a destination on the map below to calculate route guidance.";
      setStatusMessage(msg);
      speakMessage(msg);
      setIsLoading(false);
      return;
    }

    const originName = locationState.coords ? "My Current Location" : "Regional Center";
    const route = await calculateRouteOSRM(
      originPos,
      { lat: targetDest.lat, lng: targetDest.lng },
      originName,
      targetDest.name
    );

    if (route) {
      setActiveRoute(route);
      const spoken = `Route calculated from ${route.originName} to ${route.destinationName}. Distance is ${route.distanceKm} kilometers, estimated driving time is ${route.durationFormatted}.`;
      setStatusMessage(spoken);
      speakMessage(spoken);
    } else {
      const msg = `Route calculation temporarily unavailable between current location and ${targetDest.name}. No verified road path found in OpenStreetMap.`;
      setStatusMessage(msg);
      speakMessage(msg);
    }
    setIsLoading(false);
  };

  // 3. TRAVEL ALERT: Real live weather & severe alert inspection
  const handleTravelAlert = async () => {
    setActiveModal("alert");
    setIsLoading(true);
    const userPos = locationState.coords || DEFAULT_NER_CENTER;
    const wx = await fetchLiveWeatherOpenMeteo(userPos.lat, userPos.lng);
    setLiveWeather(wx);

    if (wx) {
      let msg = `Current weather is ${wx.condition} at ${wx.temperatureC} degrees Celsius. Wind speed is ${wx.windSpeedKmh} kilometers per hour.`;
      if (wx.activeWarnings.length > 0) {
        msg += ` Warning: ${wx.activeWarnings[0].title}. ${wx.activeWarnings[0].description}`;
      } else {
        msg += " No verified weather or disaster warning currently active for your area.";
      }
      setStatusMessage(msg);
      speakMessage(msg);
    } else {
      const msg = "Live weather data temporarily unavailable. Please check your internet connection.";
      setStatusMessage(msg);
      speakMessage(msg);
    }
    setIsLoading(false);
  };

  // 4. EMERGENCY ROUTE: Real nearby hospital search & direct routing
  const handleEmergencyRoute = async () => {
    setActiveModal("emergency");
    setIsLoading(true);
    const userPos = locationState.coords || DEFAULT_NER_CENTER;
    const facs = await searchNearbyEmergencyFacilities(userPos.lat, userPos.lng, "hospital");
    setFacilities(facs);

    if (facs.length > 0) {
      const nearest = facs[0];
      const route = await calculateRouteOSRM(
        userPos,
        { lat: nearest.lat, lng: nearest.lng },
        "My Location",
        nearest.name
      );
      if (route) setActiveRoute(route);

      const spoken = `Nearest emergency medical facility is ${nearest.name}, approximately ${nearest.distanceKm} kilometers away. Route guidance is active on the map.`;
      setStatusMessage(spoken);
      speakMessage(spoken);
    } else {
      const msg = "Searching emergency medical centers. No hospital found within immediate 25 kilometer radius.";
      setStatusMessage(msg);
      speakMessage(msg);
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto px-3 sm:px-6 space-y-6 pb-16 select-none box-border">
      {/* 1. Header with Privacy Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 dark:bg-sky-950 px-3 py-1 rounded-full border border-sky-200">
              Live Safety & Accessibility System
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#0F243E] dark:text-white tracking-tight mt-1.5 flex items-center gap-2">
            <span>Road & Travel Safety Help</span>
            <span className="text-sky-600">🛡️</span>
          </h1>
          <p className="text-sm sm:text-base font-bold text-[#5B728D] dark:text-slate-300 mt-0.5">
            Real GPS position, live weather observations, and verified road navigation.
          </p>
        </div>

        {/* Privacy & Location Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs font-bold text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Location Sharing: <strong>OFF (Private)</strong></span>
          </div>

          <Button
            size="sm"
            onClick={locationState.coords ? undefined : () => setIsPermissionModalOpen(true)}
            variant={locationState.coords ? "outline" : "default"}
            className="rounded-2xl font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{locationState.coords ? "✓ Position Active" : "Find My Location"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              speakMessage(
                "Welcome to Road and Travel Safety. Tap Check Road, Get Route Help, Travel Alert, or Emergency Route for real verified guidance."
              )
            }
            className="rounded-2xl font-black text-xs text-[#1E6FD9] border-[#D0E2FF] bg-[#F4F8FD] hover:bg-[#EBF3FC] gap-1.5 cursor-pointer shadow-2xs"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Read Aloud</span>
          </Button>
        </div>
      </div>

      {/* Location Separation Context Status Strip (Requirement 1, 2, 3, 4, 18) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-border shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Current Live GPS Location State */}
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${locationState.coords ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${locationState.coords ? "bg-emerald-500" : "bg-amber-500"}`} />
            </span>
            <span className="font-bold text-muted-foreground">Live GPS Origin:</span>
            {locationState.coords ? (
              <span className="font-black text-foreground">
                {locationState.coords.lat.toFixed(4)}°N, {locationState.coords.lng.toFixed(4)}°E
                <span className="ml-1 text-[11px] text-muted-foreground font-semibold">
                  (±{Math.round(locationState.accuracyMeters || 10)}m)
                </span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsPermissionModalOpen(true)}
                className="font-black text-primary hover:underline cursor-pointer"
              >
                Tap to enable GPS
              </button>
            )}
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-border" />

          {/* User-Selected Map Location State */}
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="font-bold text-muted-foreground">Selected Destination:</span>
            {selectedLocation ? (
              <div className="flex items-center gap-1.5">
                <span className="font-black text-rose-700 dark:text-rose-400 max-w-[200px] truncate" title={selectedLocation.name}>
                  {selectedLocation.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation(null);
                    setActiveRoute(null);
                  }}
                  title="Clear selected destination"
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer"
                >
                  ✕ Clear
                </button>
              </div>
            ) : (
              <span className="font-medium text-muted-foreground italic">
                None (Tap any point on map or search)
              </span>
            )}
          </div>
        </div>

        {/* Action hint */}
        {selectedLocation && (
          <Button
            size="sm"
            onClick={() => handleGetRouteHelp(selectedLocation)}
            className="h-7 text-xs font-black px-3 rounded-xl bg-primary text-white cursor-pointer ml-auto"
          >
            Route to Selected ➔
          </Button>
        )}
      </div>

      {/* 2. FOUR VERY LARGE TOUCH BUTTONS (Requirement 17) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
        {/* Button 1: CHECK ROAD */}
        <button
          type="button"
          onClick={handleCheckRoad}
          className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border-3 border-emerald-300 hover:border-emerald-500 text-left transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex flex-col justify-between min-h-[160px] group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
              🛣️
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Live Check
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-[#0F243E] dark:text-white group-hover:text-emerald-700 transition-colors">
              CHECK ROAD
            </h2>
            <p className="text-sm font-bold text-[#5B728D] dark:text-slate-300 mt-1">
              "Check current road conditions & weather on your route"
            </p>
          </div>
        </button>

        {/* Button 2: GET ROUTE HELP */}
        <button
          type="button"
          onClick={() => handleGetRouteHelp()}
          className="p-6 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-sky-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20 border-3 border-sky-300 hover:border-sky-500 text-left transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex flex-col justify-between min-h-[160px] group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-3xl shadow-md shadow-sky-600/25 group-hover:scale-105 transition-transform">
              🔄
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-sky-800 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
              Real Road Route
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-[#0F243E] dark:text-white group-hover:text-sky-700 transition-colors">
              GET ROUTE HELP
            </h2>
            <p className="text-sm font-bold text-[#5B728D] dark:text-slate-300 mt-1">
              "Calculate real driving distances & travel times"
            </p>
          </div>
        </button>

        {/* Button 3: TRAVEL ALERT */}
        <button
          type="button"
          onClick={handleTravelAlert}
          className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border-3 border-amber-300 hover:border-amber-500 text-left transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex flex-col justify-between min-h-[160px] group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-3xl shadow-md shadow-amber-600/25 group-hover:scale-105 transition-transform">
              ⚠️
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              Real Weather & Alerts
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-[#0F243E] dark:text-white group-hover:text-amber-800 transition-colors">
              TRAVEL ALERT
            </h2>
            <p className="text-sm font-bold text-[#5B728D] dark:text-slate-300 mt-1">
              "See live temperature, rainfall, wind & severe warnings"
            </p>
          </div>
        </button>

        {/* Button 4: EMERGENCY ROUTE */}
        <button
          type="button"
          onClick={handleEmergencyRoute}
          className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-rose-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 border-3 border-rose-300 hover:border-rose-500 text-left transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex flex-col justify-between min-h-[160px] group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-3xl shadow-md shadow-rose-600/25 group-hover:scale-105 transition-transform">
              🚑
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
              Nearby Hospitals
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-[#0F243E] dark:text-white group-hover:text-rose-700 transition-colors">
              EMERGENCY ROUTE
            </h2>
            <p className="text-sm font-bold text-[#5B728D] dark:text-slate-300 mt-1">
              "Find nearest medical facilities and get an evacuation path"
            </p>
          </div>
        </button>
      </div>

      {/* 3. Detailed Results Card with Audio Replay */}
      {statusMessage && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-primary/40 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📢</span>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                Verified Information
              </h3>
            </div>
            <Button
              size="sm"
              onClick={() => speakMessage(statusMessage)}
              className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-white cursor-pointer"
            >
              <Volume2 className="h-4 w-4" />
              <span>Listen Again</span>
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 text-sm sm:text-base font-bold text-foreground leading-relaxed">
            {statusMessage}
          </div>

          {/* Quick Destination Selectors for Route Help */}
          {activeModal === "route" && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">
                  Quick Destination:
                </span>
                {[
                  "Shillong, Meghalaya",
                  "Guwahati Medical College",
                  "Tezpur, Assam",
                  "Silchar, Assam",
                  "Dispur Hospital",
                ].map((town) => (
                  <button
                    key={town}
                    type="button"
                    onClick={() => {
                      setDestinationQuery(town);
                      handleGetRouteHelp(town);
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-bold border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    {town}
                  </button>
                ))}
              </div>

              {activeRoute && (
                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 text-xs space-y-1">
                  <div className="flex justify-between font-black text-sky-950 dark:text-sky-200">
                    <span>Route: {activeRoute.originName} ➔ {activeRoute.destinationName}</span>
                    <span>{activeRoute.distanceKm} km • {activeRoute.durationFormatted}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Source: {activeRoute.source} | Calculated: {activeRoute.calculatedAt}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Weather Forecast Breakdown */}
          {activeModal === "alert" && liveWeather && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-center">
                <div className="p-2.5 rounded-xl bg-muted/40">
                  <div className="text-[10px] text-muted-foreground uppercase">Temperature</div>
                  <div className="text-base font-black text-foreground">{liveWeather.temperatureC}°C</div>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40">
                  <div className="text-[10px] text-muted-foreground uppercase">Rainfall</div>
                  <div className="text-base font-black text-sky-600">{liveWeather.precipitationMm} mm</div>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40">
                  <div className="text-[10px] text-muted-foreground uppercase">Wind Speed</div>
                  <div className="text-base font-black text-foreground">{liveWeather.windSpeedKmh} km/h</div>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40">
                  <div className="text-[10px] text-muted-foreground uppercase">Humidity</div>
                  <div className="text-base font-black text-foreground">{liveWeather.relativeHumidity}%</div>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground pt-1 flex justify-between">
                <span>Source: {liveWeather.source}</span>
                <span>Updated: {liveWeather.lastUpdated}</span>
              </div>
            </div>
          )}

          {/* Nearby Hospitals List */}
          {activeModal === "emergency" && facilities.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Nearby Medical Facilities ({facilities.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {facilities.slice(0, 4).map((fac) => (
                  <div
                    key={fac.id}
                    className="p-3 rounded-2xl bg-background border border-border text-xs space-y-1.5"
                  >
                    <div className="font-black text-foreground truncate">{fac.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{fac.address}</div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-black text-rose-600">{fac.distanceKm} km away</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          const userPos = locationState.coords || DEFAULT_NER_CENTER;
                          calculateRouteOSRM(
                            userPos,
                            { lat: fac.lat, lng: fac.lng },
                            "My Location",
                            fac.name
                          ).then((r) => {
                            if (r) setActiveRoute(r);
                          });
                        }}
                        className="h-7 text-[11px] font-bold px-2.5 rounded-lg bg-primary text-white cursor-pointer"
                      >
                        Navigate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. REAL INTERACTIVE MAP */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">
              Live Interactive Map
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Real OpenStreetMap road network. Drag to move, pinch or use + / - to zoom.
            </p>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {locationState.coords ? "📍 Showing Current Position" : "📍 Regional Center View"}
          </span>
        </div>

        <RealInteractiveMap
          initialCenter={locationState.coords || DEFAULT_NER_CENTER}
          initialZoom={locationState.coords ? 13 : 11}
          locationState={locationState}
          onCenterOnLocation={() => {
            if (!locationState.coords) {
              setIsPermissionModalOpen(true);
            }
          }}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            setDestinationQuery(loc.name);
          }}
          onClearSelectedLocation={() => {
            setSelectedLocation(null);
            setActiveRoute(null);
          }}
          onRequestRouteFromCurrent={(dest) => {
            handleGetRouteHelp(dest);
          }}
          activeRoute={activeRoute}
          facilities={facilities}
          isSeniorMode={true}
          onSelectDestination={(dest, name) => {
            const loc: SelectedLocationState = {
              lat: dest.lat,
              lng: dest.lng,
              name,
              address: `Coordinates: ${dest.lat.toFixed(4)}°N, ${dest.lng.toFixed(4)}°E`,
              type: "Selected Location",
              selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setSelectedLocation(loc);
            setDestinationQuery(name);
            handleGetRouteHelp(loc);
          }}
        />
      </div>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={isPermissionModalOpen}
        onAllow={handleRequestLocation}
        onDismiss={() => setIsPermissionModalOpen(false)}
        isDenied={isPermissionDenied}
      />
    </div>
  );
}
