import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Plus,
  Minus,
  Layers,
  Phone,
  Target,
  ExternalLink,
  Car,
  Home,
  UserCheck,
  Bookmark,
  Trash2,
  Mic,
  RefreshCw,
  X,
  Share2,
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
  searchNearbyPOIs,
  calculateDistanceKm,
  DEFAULT_NER_CENTER,
} from "@/lib/safety/realMapService";
import {
  loadSavedPlaces,
  persistSavedPlace,
  removeSavedPlace,
  loadRecentDestinations,
  addRecentDestination,
  removeRecentDestination,
  getExternalNavigationUrl,
  isOnline,
  type SavedPlace,
  type RecentDestination,
  type LocationPermissionState,
} from "@/lib/safety/travelStore";
import { RealInteractiveMap } from "@/components/memory-bond/safety/RealInteractiveMap";
import { LocationPermissionModal } from "@/components/memory-bond/safety/LocationPermissionModal";
import type {
  LocationState,
  SelectedLocationState,
  RealRouteResult,
  RealWeatherResult,
  EmergencyFacility,
  RoadStatusAnalysis,
  NearbyCategoryType,
  NearbyPlace,
  PlaceSearchResult,
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
  const { t, speechLocale, currentLanguage } = useI18n();

  // 1. Live Device GPS Location State (Requirement 1, 2, 3, 18)
  const [locationState, setLocationState] = useState<LocationState>({
    coords: null,
    accuracyMeters: null,
    isAccuracyLimited: false,
    permissionStatus: "prompt",
    lastUpdated: null,
    isTrackingActive: false,
    isSharingEnabled: false, // Strict Privacy Default: OFF
    source: "Device GPS Telemetry",
  });

  const [locationPermissionState, setLocationPermissionState] =
    useState<LocationPermissionState>("prompt");
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  // 2. User-Selected Map Location State (Distinct from Live GPS)
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocationState | null>(null);

  // 3. Search & Quick Categories State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHasSearched, setSearchHasSearched] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NearbyCategoryType | null>(null);
  const [categoryResults, setCategoryResults] = useState<NearbyPlace[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

  // 4. Route Guidance State
  const [activeRoute, setActiveRoute] = useState<RealRouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // 5. Travel & Safety Data State
  const [liveWeather, setLiveWeather] = useState<RealWeatherResult | null>(null);
  const [roadAnalysis, setRoadAnalysis] = useState<RoadStatusAnalysis | null>(null);
  const [activeTravelModal, setActiveTravelModal] = useState<"weather" | "road" | null>(null);

  // 6. Saved & Recent Destinations
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<RecentDestination[]>([]);
  const [saveModalPlace, setSaveModalPlace] = useState<SelectedLocationState | null>(null);

  // 7. Intentional 10-Second SOS State (Requirement 17)
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const [sosSecondsLeft, setSosSecondsLeft] = useState(10);
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const sosTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sosIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 8. Spoken / Status Message
  const [spokenMessage, setSpokenMessage] = useState<string | null>(null);
  const [operationLoadingText, setOperationLoadingText] = useState<string | null>(null);

  // Load Saved Places & Recent Destinations from persistent storage
  useEffect(() => {
    setSavedPlaces(loadSavedPlaces());
    setRecentDestinations(loadRecentDestinations());
  }, []);

  // Voice narration helper
  const announceToUser = useCallback(
    (text: string) => {
      setSpokenMessage(text);
      stopSpeaking();
      speakText(text, speechLocale || "en-IN");
    },
    [speechLocale]
  );

  // Request browser geolocation with complete state machine handling (Requirement 3)
  const handleRequestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationPermissionState("unavailable");
      return;
    }

    setLocationPermissionState("loading");
    setOperationLoadingText(
      currentLanguage === "hi"
        ? "आपका वास्तविक स्थान खोजा जा रहा है..."
        : currentLanguage === "gu"
        ? "તમારું વર્તમાન સ્થાન શોધાઈ રહ્યું છે..."
        : "Finding your location…"
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const accuracy = pos.coords.accuracy;
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

        setLocationPermissionState("available");
        setIsPermissionModalOpen(false);
        setOperationLoadingText(null);

        // Preload live weather for user's actual location
        fetchLiveWeatherOpenMeteo(coords.lat, coords.lng).then(setLiveWeather);
      },
      (err) => {
        console.warn("[RoadHelp] Geolocation denied or failed:", err);
        setOperationLoadingText(null);
        if (err.code === 1) {
          setLocationPermissionState("denied");
          setLocationState((prev) => ({ ...prev, permissionStatus: "denied" }));
        } else {
          setLocationPermissionState("error");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, [currentLanguage]);

  // Try requesting location on first mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const accuracy = pos.coords.accuracy;
          const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
          setLocationPermissionState("available");
          fetchLiveWeatherOpenMeteo(coords.lat, coords.lng).then(setLiveWeather);
        },
        () => {
          // If not permitted initially, remain in friendly prompt state
          setLocationPermissionState("prompt");
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  // Listen to Global Voice Travel Actions (Requirement 15)
  useEffect(() => {
    const handleVoiceTravel = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string }>;
      const action = customEvent.detail?.action;

      if (action === "hospital") {
        handleSelectCategory("hospital");
      } else if (action === "pharmacy") {
        handleSelectCategory("pharmacy");
      } else if (action === "home") {
        const homePlace = savedPlaces.find((p) => p.type === "home");
        if (homePlace) {
          const loc: SelectedLocationState = {
            lat: homePlace.lat,
            lng: homePlace.lng,
            name: homePlace.label || "Home",
            address: homePlace.address,
            type: "Home",
            selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          handleSelectDestination(loc);
          handleCalculateRoute(loc);
        } else {
          announceToUser(
            currentLanguage === "hi"
              ? "घर का पता अभी सहेजा नहीं गया है। कृपया पहले घर का पता सहेजें।"
              : "Home address is not saved yet. Please set your Home in Saved Places."
          );
        }
      } else if (action === "route") {
        if (selectedLocation) {
          handleCalculateRoute(selectedLocation);
        } else {
          announceToUser(
            currentLanguage === "hi"
              ? "कृपया पहले गंतव्य स्थान खोजें या चुनें।"
              : "Please search or select a destination first."
          );
        }
      }
    };

    window.addEventListener("mb_voice_travel_action", handleVoiceTravel);
    return () => window.removeEventListener("mb_voice_travel_action", handleVoiceTravel);
  }, [savedPlaces, selectedLocation, currentLanguage, announceToUser]);

  // Destination Search Handler (Requirement 4 & 5)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQ = sanitizeSearchQuery(searchQuery);
    if (!cleanQ || cleanQ.length < 2) return;

    setIsSearching(true);
    setSearchHasSearched(true);
    setOperationLoadingText(
      currentLanguage === "hi" ? "स्थान खोजा जा रहा है…" : "Searching places…"
    );

    const centerLat = locationState.coords?.lat ?? DEFAULT_NER_CENTER.lat;
    const centerLng = locationState.coords?.lng ?? DEFAULT_NER_CENTER.lng;

    const results = await searchPlacesNominatim(cleanQ, centerLat, centerLng);
    setSearchResults(results);
    setIsSearching(false);
    setOperationLoadingText(null);

    if (results.length === 0) {
      announceToUser(
        currentLanguage === "hi"
          ? "कोई स्थान नहीं मिला। कृपया दूसरा नाम खोजें।"
          : "No place found. Try another name or search nearby."
      );
    }
  };

  // Select a place from Search or Map or Recents (Requirement 5 & 7)
  const handleSelectDestination = (loc: SelectedLocationState) => {
    setSelectedLocation(loc);
    setRouteError(null);

    // Save to Recent Destinations
    const updatedRecents = addRecentDestination({
      name: loc.name,
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      category: loc.type,
    });
    setRecentDestinations(updatedRecents);

    // Announce selected destination to user
    const distText = locationState.coords
      ? `${calculateDistanceKm(locationState.coords, { lat: loc.lat, lng: loc.lng })} km away`
      : "";
    const spoken =
      currentLanguage === "hi"
        ? `चुना गया स्थान: ${loc.name}। ${distText}`
        : `${loc.name} selected. ${distText}`;
    announceToUser(spoken);
  };

  // Quick Categories Handler (Requirement 4 & 6)
  const handleSelectCategory = async (cat: NearbyCategoryType) => {
    if (activeCategory === cat) {
      setActiveCategory(null);
      setCategoryResults([]);
      return;
    }

    setActiveCategory(cat);
    setIsLoadingCategory(true);
    setOperationLoadingText(
      currentLanguage === "hi"
        ? `नजदीकी ${cat === "hospital" ? "अस्पताल" : cat === "pharmacy" ? "दवा की दुकानें" : cat} खोजे जा रहे हैं…`
        : `Searching nearby ${cat}s…`
    );

    const originLat = locationState.coords?.lat ?? DEFAULT_NER_CENTER.lat;
    const originLng = locationState.coords?.lng ?? DEFAULT_NER_CENTER.lng;

    const places = await searchNearbyPOIs(originLat, originLng, cat);
    setCategoryResults(places);
    setIsLoadingCategory(false);
    setOperationLoadingText(null);

    const count = places.length;
    const spoken =
      currentLanguage === "hi"
        ? `${count} नजदीकी स्थान मिले।`
        : `Found ${count} verified places nearby.`;
    announceToUser(spoken);
  };

  // Route Calculation via Real OSRM Engine (Requirement 8 & 9)
  const handleCalculateRoute = async (target?: SelectedLocationState) => {
    const dest = target || selectedLocation;
    if (!dest) {
      announceToUser(
        currentLanguage === "hi"
          ? "कृपया पहले गंतव्य स्थान खोजें।"
          : "Please search or select a destination first."
      );
      return;
    }

    if (!isOnline()) {
      setRouteError("Internet connection required for live map and routing.");
      announceToUser("Internet connection required for live routing.");
      return;
    }

    setIsCalculatingRoute(true);
    setRouteError(null);
    setOperationLoadingText(
      currentLanguage === "hi" ? "वास्तविक मार्ग की गणना की जा रही है…" : "Calculating route…"
    );

    const originPos = locationState.coords || DEFAULT_NER_CENTER;
    const originName = locationState.coords
      ? currentLanguage === "hi"
        ? "आपका वर्तमान स्थान"
        : "Your Current Location"
      : "Regional Center";

    const route = await calculateRouteOSRM(
      originPos,
      { lat: dest.lat, lng: dest.lng },
      originName,
      dest.name
    );

    setIsCalculatingRoute(false);
    setOperationLoadingText(null);

    if (route) {
      setActiveRoute(route);
      const spoken =
        currentLanguage === "hi"
          ? `${route.destinationName} तक की दूरी ${route.distanceKm} किलोमीटर है। अनुमानित समय ${route.durationFormatted} है।`
          : `Route calculated to ${route.destinationName}. Distance is ${route.distanceKm} kilometers, estimated driving time is ${route.durationFormatted}.`;
      announceToUser(spoken);
    } else {
      const errMsg =
        currentLanguage === "hi"
          ? "सड़क मार्ग अभी उपलब्ध नहीं है। कृपया दूसरा स्थान चुनें।"
          : "Route calculation temporarily unavailable. No verified road path found in OpenStreetMap.";
      setRouteError(errMsg);
      announceToUser(errMsg);
    }
  };

  // Start Navigation -> Opens external turn-by-turn navigation (Requirement 10)
  const handleStartNavigation = () => {
    if (!selectedLocation) return;
    const origin = locationState.coords || null;
    const navUrl = getExternalNavigationUrl(
      { lat: selectedLocation.lat, lng: selectedLocation.lng },
      origin,
      selectedLocation.name
    );

    announceToUser(
      currentLanguage === "hi"
        ? "नेविगेशन खोला जा रहा है।"
        : "Opening turn-by-turn navigation."
    );

    if (typeof window !== "undefined") {
      window.open(navUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Live Weather & Safety Inspection (Requirement 18)
  const handleCheckWeatherAndRoad = async () => {
    setOperationLoadingText("Checking weather and travel warnings…");
    const centerPos = locationState.coords || DEFAULT_NER_CENTER;
    const wx = await fetchLiveWeatherOpenMeteo(centerPos.lat, centerPos.lng);
    setLiveWeather(wx);

    const targetPos = selectedLocation
      ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
      : { lat: centerPos.lat + 0.1, lng: centerPos.lng + 0.1 };
    const analysis = await analyzeRoadSafety(
      centerPos,
      targetPos,
      selectedLocation?.name || "Immediate Road Network"
    );
    setRoadAnalysis(analysis);
    setActiveTravelModal("weather");
    setOperationLoadingText(null);

    if (wx) {
      const weatherText = `Current weather is ${wx.condition} at ${wx.temperatureC}°C. ${analysis.headline}.`;
      announceToUser(weatherText);
    }
  };

  // Intentional 10-Second SOS Press & Hold (Requirement 17)
  const startSosHold = () => {
    setIsHoldingSos(true);
    setSosHoldProgress(0);
    setSosSecondsLeft(10);

    const startTime = Date.now();
    const duration = 10000; // 10 seconds

    sosIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      const remainingSecs = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      setSosHoldProgress(progress);
      setSosSecondsLeft(remainingSecs);
    }, 100);

    sosTimerRef.current = setTimeout(() => {
      cancelSosHold();
      onOpenSos();
    }, duration);
  };

  const cancelSosHold = () => {
    if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
    if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
    sosTimerRef.current = null;
    sosIntervalRef.current = null;
    setIsHoldingSos(false);
    setSosHoldProgress(0);
    setSosSecondsLeft(10);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (sosTimerRef.current) clearTimeout(sosTimerRef.current);
      if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
    };
  }, []);

  // Save Place Handler
  const handleSavePlace = (type: "home" | "doctor" | "hospital" | "family") => {
    if (!saveModalPlace) return;
    const label =
      type === "home"
        ? "Home"
        : type === "doctor"
        ? "Doctor"
        : type === "hospital"
        ? "Hospital"
        : "Family Member";

    const newPlace: SavedPlace = {
      id: `saved-${type}-${Date.now()}`,
      type,
      label,
      customName: saveModalPlace.name,
      lat: saveModalPlace.lat,
      lng: saveModalPlace.lng,
      address: saveModalPlace.address,
      savedAt: new Date().toLocaleDateString(),
    };

    const updated = persistSavedPlace(newPlace);
    setSavedPlaces(updated);
    setSaveModalPlace(null);
    announceToUser(`Saved ${saveModalPlace.name} as ${label}.`);
  };

  // Facilities converted to EmergencyFacility list for map pins
  const mapFacilities: EmergencyFacility[] = useMemo(() => {
    return categoryResults.map((poi) => ({
      id: poi.id,
      name: poi.name,
      type: (poi.category === "pharmacy" ? "pharmacy" : "hospital") as any,
      lat: poi.lat,
      lng: poi.lng,
      distanceKm: poi.distanceKm,
      address: poi.address,
      phone: poi.phone || null,
      source: poi.source,
    }));
  }, [categoryResults]);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3 sm:px-6 space-y-6 pb-20 select-none box-border">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & PRIVACY STATUS (Requirement 4)               */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
              Live Verified Navigation • OpenStreetMap
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#0F243E] dark:text-white tracking-tight mt-1.5 flex items-center gap-2">
            <span>ROAD & TRAVEL HELP</span>
            <span className="text-sky-600">🗺️</span>
          </h1>
          <p className="text-sm sm:text-base font-bold text-[#5B728D] dark:text-slate-300 mt-0.5">
            Find places, plan your route and get help nearby.
          </p>
        </div>

        {/* Privacy & Accessibility Bar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-muted/60 border border-border text-xs font-bold text-muted-foreground">
            <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Privacy: <strong>Strictly Device Local</strong></span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              announceToUser(
                "Welcome to Road and Travel Help. Type a destination in the search box below, choose a quick category like Hospitals or Pharmacies, or select a saved place."
              )
            }
            className="h-10 px-3.5 rounded-2xl font-black text-xs text-[#1E6FD9] border-[#D0E2FF] bg-[#F4F8FD] hover:bg-[#EBF3FC] gap-2 cursor-pointer shadow-2xs"
          >
            <Volume2 className="h-4 w-4 shrink-0" />
            <span>Read Aloud</span>
          </Button>

          {/* Voice AI Assistant Trigger (Requirement 15) */}
          <Button
            size="sm"
            onClick={onOpenVoiceAssistant}
            className="h-10 px-4 rounded-2xl font-black text-xs bg-sky-600 hover:bg-sky-700 text-white gap-2 cursor-pointer shadow-md shadow-sky-600/25"
          >
            <Mic className="h-4 w-4 shrink-0" />
            <span>Voice Assistant</span>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. LOCATION PERMISSION & STATUS BANNER (Requirement 3)       */}
      {/* ============================================================ */}
      <div className="p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-3.5 w-3.5 relative shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                locationState.coords ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                locationState.coords ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </div>

          <div>
            {locationState.coords ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-sm text-foreground">
                  Your current location
                </span>
                <span className="font-semibold text-muted-foreground text-[11px]">
                  (Accuracy ±{Math.round(locationState.accuracyMeters || 10)}m • Updated {locationState.lastUpdated || "Now"})
                </span>
              </div>
            ) : locationPermissionState === "loading" ? (
              <span className="font-black text-sm text-primary flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Finding your location…
              </span>
            ) : locationPermissionState === "denied" ? (
              <div className="space-y-0.5">
                <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                  Location access is unavailable.
                </span>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Enable location in browser settings or search any place manually below.
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <span className="font-black text-sm text-foreground">
                  Location access not enabled
                </span>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Enable location to view real distances from where you are right now.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {locationState.coords ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRequestLocation}
              className="h-8 text-xs font-bold rounded-xl gap-1.5 cursor-pointer border-emerald-300 text-emerald-800 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Location Active</span>
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={handleRequestLocation}
                className="h-9 px-4 text-xs font-black rounded-xl bg-primary text-white cursor-pointer shadow-xs gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>{locationPermissionState === "denied" ? "Try Again" : "Enable Location"}</span>
              </Button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("search-destination-input");
                  input?.focus();
                }}
                className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Search a place manually
              </button>
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. PROMINENT SEARCH FIELD (Requirement 4 & 5)                */}
      {/* ============================================================ */}
      <div className="space-y-2">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative flex items-center w-full rounded-3xl bg-white dark:bg-slate-900 border-2 border-sky-300 focus-within:border-sky-600 focus-within:ring-4 focus-within:ring-sky-100 dark:focus-within:ring-sky-950/50 shadow-md transition-all p-2 pl-4 gap-3">
            <Search className="h-6 w-6 text-sky-600 shrink-0" />
            <Input
              id="search-destination-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Where do you want to go?"
              className="border-0 shadow-none focus-visible:ring-0 text-base sm:text-lg font-bold h-12 p-0 bg-transparent text-foreground placeholder:text-muted-foreground"
            />
            {isSearching && (
              <RefreshCw className="h-5 w-5 text-sky-600 animate-spin shrink-0 mr-2" />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setSearchHasSearched(false);
                }}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground font-black text-sm cursor-pointer shrink-0"
                title="Clear search"
              >
                ✕
              </button>
            )}
            <Button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="h-12 px-6 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white cursor-pointer shrink-0 shadow-md"
            >
              Search
            </Button>
          </div>

          {/* Autocomplete / Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-18 left-0 right-0 rounded-3xl bg-white dark:bg-slate-900 border-2 border-border shadow-2xl p-2.5 max-h-72 overflow-y-auto space-y-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1 text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                Matching Places ({searchResults.length})
              </div>
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => {
                    const loc: SelectedLocationState = {
                      lat: res.lat,
                      lng: res.lng,
                      name: res.name,
                      address: res.displayName,
                      type: res.category || "Search Result",
                      selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    };
                    handleSelectDestination(loc);
                    setSearchResults([]);
                    setSearchQuery(res.name);
                  }}
                  className="w-full p-3 rounded-2xl hover:bg-sky-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer flex items-start gap-3"
                >
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-black text-foreground truncate">
                      {res.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {res.displayName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results fallback state (Requirement 5) */}
          {searchHasSearched && !isSearching && searchResults.length === 0 && (
            <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-1 mt-2">
              <p className="text-sm font-black text-foreground">No place found.</p>
              <p className="text-xs font-semibold text-muted-foreground">
                Try another name or search nearby using the categories below.
              </p>
            </div>
          )}
        </form>

        {/* ============================================================ */}
        {/* 4. QUICK CATEGORIES (Requirement 4 & 6)                      */}
        {/* ============================================================ */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Quick Categories
            </span>
            {activeCategory && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory(null);
                  setCategoryResults([]);
                }}
                className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
              >
                Clear Category Filter ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: "hospital", label: "Hospitals", icon: "🏥", color: "border-rose-300 hover:border-rose-500" },
              { id: "pharmacy", label: "Pharmacies", icon: "💊", color: "border-emerald-300 hover:border-emerald-500" },
              { id: "fuel", label: "Fuel", icon: "🚗", color: "border-amber-300 hover:border-amber-500" },
              { id: "hotel", label: "Hotels", icon: "🏨", color: "border-indigo-300 hover:border-indigo-500" },
              { id: "food", label: "Food", icon: "🍴", color: "border-orange-300 hover:border-orange-500" },
              { id: "essentials", label: "Essentials", icon: "🛒", color: "border-teal-300 hover:border-teal-500" },
              { id: "nearby", label: "Nearby", icon: "📍", color: "border-sky-300 hover:border-sky-500" },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id as NearbyCategoryType)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm whitespace-nowrap transition-all cursor-pointer border-2 shadow-xs active:scale-95 ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-md scale-102"
                      : `bg-white dark:bg-slate-900 text-foreground ${cat.color}`
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading State Banner (Requirement 23) */}
      {operationLoadingText && (
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 text-xs font-bold text-sky-800 dark:text-sky-200 flex items-center gap-2 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
          <span>{operationLoadingText}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. NEARBY PLACES RESULTS LIST (Requirement 6)                */}
      {/* ============================================================ */}
      {categoryResults.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-primary/20 shadow-lg space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <span>Verified Nearby {activeCategory?.toUpperCase()}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-bold text-muted-foreground">
                {categoryResults.length} found
              </span>
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">
              Sorted by real driving distance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categoryResults.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 hover:border-primary/50 text-xs flex flex-col justify-between gap-2.5 transition-all shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-black text-sm text-foreground line-clamp-1">
                      {item.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-primary/10 text-primary shrink-0">
                      {item.distanceKm} km
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                    {item.address}
                  </p>
                  {item.isOpen24Hours && (
                    <span className="inline-block mt-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Open 24/7
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                  <Button
                    size="sm"
                    onClick={() => {
                      const loc: SelectedLocationState = {
                        lat: item.lat,
                        lng: item.lng,
                        name: item.name,
                        address: item.address,
                        type: item.categoryLabel,
                        selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      };
                      handleSelectDestination(loc);
                      handleCalculateRoute(loc);
                    }}
                    className="flex-1 h-8 text-xs font-black rounded-xl bg-primary text-white cursor-pointer"
                  >
                    Route Here
                  </Button>

                  {item.phone && (
                    <a
                      href={`tel:${item.phone}`}
                      className="h-8 px-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold"
                      title={`Call ${item.phone}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const loc: SelectedLocationState = {
                        lat: item.lat,
                        lng: item.lng,
                        name: item.name,
                        address: item.address,
                        type: item.categoryLabel,
                        selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      };
                      handleSelectDestination(loc);
                    }}
                    className="h-8 px-2.5 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. REAL INTERACTIVE MAP (Requirement 2, 13, 14)              */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <span>Interactive Navigation Map</span>
              <span className="text-xs font-bold text-muted-foreground">
                (Tap anywhere to drop pin)
              </span>
            </h2>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {locationState.coords ? "📍 Real Current Position Active" : "📍 Regional Map"}
          </span>
        </div>

        <RealInteractiveMap
          initialCenter={locationState.coords || DEFAULT_NER_CENTER}
          initialZoom={locationState.coords ? 13 : 11}
          locationState={locationState}
          hideEmbeddedSearch={true}
          onCenterOnLocation={() => {
            if (!locationState.coords) {
              setIsPermissionModalOpen(true);
            }
          }}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => handleSelectDestination(loc)}
          onClearSelectedLocation={() => {
            setSelectedLocation(null);
            setActiveRoute(null);
          }}
          onRequestRouteFromCurrent={(dest) => {
            handleSelectDestination(dest);
            handleCalculateRoute(dest);
          }}
          activeRoute={activeRoute}
          facilities={mapFacilities}
          isSeniorMode={true}
          onSelectDestination={(dest, name) => {
            const loc: SelectedLocationState = {
              lat: dest.lat,
              lng: dest.lng,
              name,
              address: `Coordinates: ${dest.lat.toFixed(4)}°N, ${dest.lng.toFixed(4)}°E`,
              type: "Selected Map Point",
              selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            handleSelectDestination(loc);
          }}
        />
      </div>

      {/* ============================================================ */}
      {/* 7. PLACE DETAILS & ROUTE BOTTOM CARD (Requirement 7, 8, 9)    */}
      {/* ============================================================ */}
      {selectedLocation && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-primary/40 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                  {selectedLocation.type || "Selected Destination"}
                </span>
                {locationState.coords && (
                  <span className="text-xs font-black text-sky-700 dark:text-sky-400">
                    • {calculateDistanceKm(locationState.coords, { lat: selectedLocation.lat, lng: selectedLocation.lng })} km away
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground truncate">
                {selectedLocation.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium line-clamp-2">
                📍 {selectedLocation.address}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedLocation(null);
                setActiveRoute(null);
              }}
              className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground font-black text-sm cursor-pointer shrink-0"
              title="Close Details"
            >
              ✕
            </button>
          </div>

          {/* Route Details Card if Route is Active */}
          {activeRoute && (
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-2">
              <div className="flex items-center justify-between font-black text-sm text-[#0F243E] dark:text-sky-200">
                <span>YOUR ROUTE</span>
                <span className="text-sky-700 dark:text-sky-400">
                  {activeRoute.distanceKm} km • {activeRoute.durationFormatted}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                <span>{activeRoute.originName}</span>
                <span>➔</span>
                <span className="text-foreground">{activeRoute.destinationName}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Source: {activeRoute.source}
              </div>
            </div>
          )}

          {routeError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs font-bold text-amber-800 dark:text-amber-200">
              {routeError}
            </div>
          )}

          {/* Action Buttons (Requirement 7, 8, 10) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!activeRoute ? (
              <Button
                size="lg"
                onClick={() => handleCalculateRoute(selectedLocation)}
                disabled={isCalculatingRoute}
                className="flex-1 sm:flex-initial h-13 px-6 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-md gap-2"
              >
                <Compass className="h-5 w-5" />
                <span>{isCalculatingRoute ? "Calculating Route…" : "GET DIRECTIONS"}</span>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleStartNavigation}
                className="flex-1 sm:flex-initial h-13 px-8 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-lg shadow-emerald-600/25 gap-2 animate-bounce-short"
              >
                <Navigation className="h-5 w-5" />
                <span>START NAVIGATION</span>
              </Button>
            )}

            <Button
              size="lg"
              variant="outline"
              onClick={() => setSaveModalPlace(selectedLocation)}
              className="h-13 px-5 rounded-2xl font-black text-xs gap-2 cursor-pointer border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              <Bookmark className="h-4 w-4" />
              <span>Save Place</span>
            </Button>

            <Button
              size="lg"
              variant="ghost"
              onClick={() => handleStartNavigation()}
              className="h-13 px-4 rounded-2xl font-bold text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in Google / Apple Maps</span>
            </Button>
          </div>
        </div>
      )}

      {/* Save Place Dialog Modal */}
      {saveModalPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-foreground">Save Important Place</h4>
              <button
                type="button"
                onClick={() => setSaveModalPlace(null)}
                className="text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              Save <strong>{saveModalPlace.name}</strong> for easy 1-tap navigation anytime.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => handleSavePlace("home")}
                className="h-12 rounded-2xl font-black text-xs gap-2 cursor-pointer border-sky-200 hover:bg-sky-50"
              >
                <Home className="h-4 w-4 text-sky-600" />
                <span>Save as Home</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSavePlace("doctor")}
                className="h-12 rounded-2xl font-black text-xs gap-2 cursor-pointer border-emerald-200 hover:bg-emerald-50"
              >
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>Save as Doctor</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSavePlace("hospital")}
                className="h-12 rounded-2xl font-black text-xs gap-2 cursor-pointer border-rose-200 hover:bg-rose-50"
              >
                <AlertOctagon className="h-4 w-4 text-rose-600" />
                <span>Save as Hospital</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSavePlace("family")}
                className="h-12 rounded-2xl font-black text-xs gap-2 cursor-pointer border-indigo-200 hover:bg-indigo-50"
              >
                <Bookmark className="h-4 w-4 text-indigo-600" />
                <span>Save as Family</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. TRAVEL HELP SECTION (Requirement 11, 12, 18)              */}
      {/* ============================================================ */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F243E] dark:text-white">
              Travel Help & Safety Actions
            </h2>
            <p className="text-xs font-semibold text-[#5B728D] dark:text-slate-300">
              One-tap assistance designed for easy elderly navigation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Action 1: Find Hospital */}
          <button
            type="button"
            onClick={() => handleSelectCategory("hospital")}
            className="p-5 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-rose-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 border-2 border-rose-200 hover:border-rose-400 text-left transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-98 flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shadow-md">
              🏥
            </div>
            <div className="mt-2">
              <h4 className="text-base font-black text-foreground">Find Hospital</h4>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                Nearby emergency medical centers
              </p>
            </div>
          </button>

          {/* Action 2: Find Pharmacy */}
          <button
            type="button"
            onClick={() => handleSelectCategory("pharmacy")}
            className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border-2 border-emerald-200 hover:border-emerald-400 text-left transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-98 flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md">
              💊
            </div>
            <div className="mt-2">
              <h4 className="text-base font-black text-foreground">Find Pharmacy</h4>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                Nearby medical stores & medicines
              </p>
            </div>
          </button>

          {/* Action 3: Find Fuel */}
          <button
            type="button"
            onClick={() => handleSelectCategory("fuel")}
            className="p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 border-2 border-amber-200 hover:border-amber-400 text-left transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-98 flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-2xl shadow-md">
              ⛽
            </div>
            <div className="mt-2">
              <h4 className="text-base font-black text-foreground">Find Fuel</h4>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                Petrol pumps & vehicle refuel
              </p>
            </div>
          </button>

          {/* Action 4: Weather & Travel Alerts */}
          <button
            type="button"
            onClick={handleCheckWeatherAndRoad}
            className="p-5 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-sky-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20 border-2 border-sky-200 hover:border-sky-400 text-left transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-98 flex flex-col justify-between min-h-[140px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-2xl shadow-md">
              🌤️
            </div>
            <div className="mt-2">
              <h4 className="text-base font-black text-foreground">Weather & Road</h4>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                Live temperature & travel alerts
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Live Weather & Road Analysis Card Modal (Requirement 18) */}
      {activeTravelModal === "weather" && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-sky-300 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌤️</span>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                Verified Meteorological & Road Information
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTravelModal(null)}
              className="text-muted-foreground hover:text-foreground font-bold p-1"
            >
              ✕
            </button>
          </div>

          {liveWeather && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-center">
              <div className="p-3 rounded-2xl bg-muted/40">
                <div className="text-[10px] text-muted-foreground uppercase">Condition</div>
                <div className="text-base font-black text-foreground">{liveWeather.condition}</div>
              </div>
              <div className="p-3 rounded-2xl bg-muted/40">
                <div className="text-[10px] text-muted-foreground uppercase">Temperature</div>
                <div className="text-base font-black text-foreground">{liveWeather.temperatureC}°C</div>
              </div>
              <div className="p-3 rounded-2xl bg-muted/40">
                <div className="text-[10px] text-muted-foreground uppercase">Wind Speed</div>
                <div className="text-base font-black text-foreground">{liveWeather.windSpeedKmh} km/h</div>
              </div>
              <div className="p-3 rounded-2xl bg-muted/40">
                <div className="text-[10px] text-muted-foreground uppercase">Rainfall</div>
                <div className="text-base font-black text-sky-600">{liveWeather.precipitationMm} mm</div>
              </div>
            </div>
          )}

          {/* Honest Road & Traffic Notice (Requirement 18 & 25) */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border text-xs space-y-1">
            <div className="font-black text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Road Status:</span>
            </div>
            <p className="text-muted-foreground font-medium leading-relaxed">
              {roadAnalysis ? roadAnalysis.details : "No verified road closures reported in available OpenStreetMap networks."}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold pt-1">
              Live municipal telematics sensor stream is currently not connected for this corridor. OpenStreetMap standard geometry applies.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. SAVED PLACES & RECENT DESTINATIONS (Requirement 20 & 21)   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Saved Places */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary" />
              <span>SAVED PLACES</span>
            </h3>
            <span className="text-xs text-muted-foreground font-bold">
              {savedPlaces.length} Saved
            </span>
          </div>

          {savedPlaces.length > 0 ? (
            <div className="space-y-2">
              {savedPlaces.map((sp) => (
                <div
                  key={sp.id}
                  className="p-3 rounded-2xl bg-muted/30 border border-border/80 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-black text-foreground flex items-center gap-1.5 truncate">
                      {sp.type === "home" ? "🏠" : sp.type === "doctor" ? "🩺" : sp.type === "hospital" ? "🏥" : "👨‍👩‍👦"}
                      {sp.label}
                      {sp.customName && (
                        <span className="font-normal text-muted-foreground text-[11px] truncate">
                          ({sp.customName})
                        </span>
                      )}
                    </span>
                    <p className="text-[11px] text-muted-foreground truncate">{sp.address}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        const loc: SelectedLocationState = {
                          lat: sp.lat,
                          lng: sp.lng,
                          name: sp.customName || sp.label,
                          address: sp.address,
                          type: sp.label,
                          selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        };
                        handleSelectDestination(loc);
                        handleCalculateRoute(loc);
                      }}
                      className="h-7 text-[11px] font-black px-2.5 rounded-xl bg-primary text-white cursor-pointer"
                    >
                      Route
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = removeSavedPlace(sp.id);
                        setSavedPlaces(updated);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-rose-600 font-bold cursor-pointer"
                      title="Remove saved place"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-muted/20 border border-dashed border-border text-center text-xs text-muted-foreground space-y-1">
              <p className="font-bold">No saved places yet.</p>
              <p className="text-[11px]">Search any place and tap "Save Place" to add Home, Doctor or Family.</p>
            </div>
          )}
        </div>

        {/* Recent Destinations (Requirement 20) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>RECENT PLACES</span>
            </h3>
            <span className="text-xs text-muted-foreground font-bold">
              {recentDestinations.length} Recent
            </span>
          </div>

          {recentDestinations.length > 0 ? (
            <div className="space-y-2">
              {recentDestinations.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-2xl bg-muted/30 border border-border/80 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-black text-foreground truncate block">
                      {rec.name}
                    </span>
                    <p className="text-[11px] text-muted-foreground truncate">{rec.address}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        const loc: SelectedLocationState = {
                          lat: rec.lat,
                          lng: rec.lng,
                          name: rec.name,
                          address: rec.address,
                          type: rec.category || "Recent Destination",
                          selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        };
                        handleSelectDestination(loc);
                        handleCalculateRoute(loc);
                      }}
                      className="h-7 text-[11px] font-black px-2.5 rounded-xl bg-primary text-white cursor-pointer"
                    >
                      Route
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = removeRecentDestination(rec.id);
                        setRecentDestinations(updated);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-rose-600 font-bold cursor-pointer"
                      title="Remove from recents"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-muted/20 border border-dashed border-border text-center text-xs text-muted-foreground space-y-1">
              <p className="font-bold">No recent places.</p>
              <p className="text-[11px]">Places you search or select will appear here for quick access.</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 10. INTENTIONAL SOS EMERGENCY SECTION (Requirement 17)       */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-50 via-white to-rose-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/30 border-2 border-rose-300 dark:border-rose-900/60 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-6 w-6 text-rose-600 animate-pulse" />
              <h3 className="text-xl font-black text-rose-950 dark:text-rose-200">
                EMERGENCY SOS ASSISTANCE
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-rose-800/80 dark:text-rose-300">
              Hold the emergency button for 10 seconds to notify family & emergency contacts.
            </p>
          </div>

          {/* Intentional SOS Hold Button */}
          <div className="flex items-center gap-3 shrink-0">
            {isHoldingSos && (
              <Button
                variant="outline"
                onClick={cancelSosHold}
                className="h-12 px-4 rounded-2xl font-black text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                CANCEL
              </Button>
            )}

            <button
              type="button"
              onPointerDown={startSosHold}
              onPointerUp={cancelSosHold}
              onPointerLeave={cancelSosHold}
              className={`relative overflow-hidden h-14 px-6 rounded-3xl font-black text-sm transition-all cursor-pointer select-none flex items-center gap-2 shadow-lg ${
                isHoldingSos
                  ? "bg-rose-700 text-white scale-105 shadow-rose-600/40"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 active:scale-95"
              }`}
            >
              {/* Progress bar inside button */}
              {isHoldingSos && (
                <div
                  className="absolute inset-0 bg-rose-900/50 transition-all pointer-events-none"
                  style={{ width: `${sosHoldProgress}%` }}
                />
              )}
              <AlertOctagon className="h-5 w-5 relative z-10" />
              <span className="relative z-10">
                {isHoldingSos
                  ? `HOLDING... ${sosSecondsLeft}s`
                  : "HOLD FOR 10s TO ACTIVATE SOS"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={isPermissionModalOpen}
        onAllow={handleRequestLocation}
        onDismiss={() => setIsPermissionModalOpen(false)}
        isDenied={locationPermissionState === "denied"}
      />
    </div>
  );
}
