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
  searchLocationsNominatim,
  reverseGeocodeToLocation,
  searchNearbyHelpServices,
  sanitizeSearchQuery,
  searchNearbyPOIs,
  calculateDistanceKm,
  DEFAULT_INDIA_CENTER,
  DEFAULT_SELECTED_LOCATION,
  DEFAULT_NER_CENTER,
  isInsideIndia,
} from "@/lib/safety/realMapService";
import {
  loadSavedPlaces,
  persistSavedPlace,
  removeSavedPlace,
  loadRecentDestinations,
  addRecentDestination,
  removeRecentDestination,
  getExternalNavigationUrl,
  buildExactGoogleMapsUrl,
  buildExactGoogleMapsDirectionsUrl,
  loadSelectedSearchLocation,
  saveSelectedSearchLocation,
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
  SelectedSearchLocation,
  HelpServiceResult,
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

  // 1B. Primary Selected Search Location - Source of Truth (Requirement 1)
  const [selectedSearchLocation, setSelectedSearchLocation] = useState<SelectedSearchLocation>(() => {
    return loadSelectedSearchLocation() || DEFAULT_SELECTED_LOCATION;
  });

  // Nearby Help Services State (Requirement 2, 3, 4, 18)
  const [activeHelpCategory, setActiveHelpCategory] = useState<
    "hospital" | "pharmacy" | "emergency" | "doctor" | "elder_care"
  >("hospital");
  const [helpServices, setHelpServices] = useState<HelpServiceResult[]>([]);
  const [helpSearchNotice, setHelpSearchNotice] = useState<string | null>(null);
  const [isLoadingHelpServices, setIsLoadingHelpServices] = useState(false);

  // Search input & autocomplete state for search bar directly above map (Problem 2)
  const [searchLocationQuery, setSearchLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<SelectedSearchLocation[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Voice Search states (Requirement 10 & 11)
  const [isListening, setIsListening] = useState(false);
  const [voiceConfirmation, setVoiceConfirmation] = useState<{
    transcript: string;
    location?: SelectedSearchLocation;
  } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // 2. User-Selected Map Location State (Destination for Routing)
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocationState | null>(null);

  // 3. Quick Categories State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHasSearched, setSearchHasSearched] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NearbyCategoryType | null>(null);
  const [categoryResults, setCategoryResults] = useState<NearbyPlace[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

  // 4. Route Guidance State
  const [activeRoute, setActiveRoute] = useState<RealRouteResult | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<RealRouteResult[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // 5. Travel & Safety Data State
  const [liveWeather, setLiveWeather] = useState<RealWeatherResult | null>(null);
  const [destinationWeather, setDestinationWeather] = useState<RealWeatherResult | null>(null);
  const [nearestHospitals, setNearestHospitals] = useState<NearbyPlace[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [roadAnalysis, setRoadAnalysis] = useState<RoadStatusAnalysis | null>(null);
  const [activeTravelModal, setActiveTravelModal] = useState<"weather" | "road" | null>(null);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  // 6. Saved & Recent Destinations
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<RecentDestination[]>([]);
  const [saveModalPlace, setSaveModalPlace] = useState<SelectedLocationState | null>(null);

  // 7. Intentional 3-Second SOS State (Requirement 16)
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const [sosSecondsLeft, setSosSecondsLeft] = useState(3);
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

        // Preload live weather, nearby hospitals, and road condition for user's real Indian coordinates
        fetchLiveWeatherOpenMeteo(coords.lat, coords.lng).then(setLiveWeather);
        searchNearbyPOIs(coords.lat, coords.lng, "hospital").then(setNearestHospitals);
        analyzeRoadSafety(coords, { lat: coords.lat + 0.04, lng: coords.lng + 0.04 }, "Local Highway Corridor").then(setRoadAnalysis);
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
          searchNearbyPOIs(coords.lat, coords.lng, "hospital").then(setNearestHospitals);
          analyzeRoadSafety(coords, { lat: coords.lat + 0.04, lng: coords.lng + 0.04 }, "Local Highway Corridor").then(setRoadAnalysis);
        },
        () => {
          // If not permitted initially, remain in friendly prompt state
          setLocationPermissionState("prompt");
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  // 1C. Location-Aware Help Services Fetcher (Requirements 1, 2, 3, 4)
  const loadNearbyServices = useCallback(
    async (
      loc: SelectedSearchLocation,
      cat: "hospital" | "pharmacy" | "emergency" | "doctor" | "elder_care"
    ) => {
      setIsLoadingHelpServices(true);
      setHelpSearchNotice(null);

      const res = await searchNearbyHelpServices(loc, cat);
      setHelpServices(res.results);
      setHelpSearchNotice(res.message);
      setIsLoadingHelpServices(false);

      // Preload live weather and road analysis for this selected location
      fetchLiveWeatherOpenMeteo(loc.latitude, loc.longitude).then(setLiveWeather);
      analyzeRoadSafety(
        { lat: loc.latitude, lng: loc.longitude },
        { lat: loc.latitude + 0.04, lng: loc.longitude + 0.04 },
        loc.name
      ).then(setRoadAnalysis);
    },
    []
  );

  // Automatically refresh nearby help services when selected location or category changes
  useEffect(() => {
    loadNearbyServices(selectedSearchLocation, activeHelpCategory);
  }, [selectedSearchLocation, activeHelpCategory, loadNearbyServices]);

  // Select a new location as the primary search center (Requirement 1 & 6)
  const handleSelectSearchLocation = useCallback(
    (loc: SelectedSearchLocation) => {
      setSelectedSearchLocation(loc);
      saveSelectedSearchLocation(loc);
      setSearchLocationQuery("");
      setLocationSuggestions([]);
      setVoiceConfirmation(null);
      setVoiceError(null);
      setSelectedLocation(null);
      setActiveRoute(null);
      setAvailableRoutes([]);

      const spoken =
        currentLanguage === "hi"
          ? `स्थान चुना गया: ${loc.name}, ${loc.state}। नजदीकी सेवाएं अपडेट की जा रही हैं।`
          : currentLanguage === "gu"
          ? `સ્થળ પસંદ થયું: ${loc.name}, ${loc.state}। નજીકની સેવાઓ અપડેટ થઈ રહી છે.`
          : `Selected search location: ${loc.name}, ${loc.state}. Updating nearby services.`;
      announceToUser(spoken);
    },
    [currentLanguage, announceToUser]
  );

  // Handle manual typing in location search bar (Requirement 9)
  const handleLocationInputChange = (val: string) => {
    setSearchLocationQuery(val);
    setVoiceError(null);
    setVoiceConfirmation(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim() || val.trim().length < 2) {
      setLocationSuggestions([]);
      setIsSearchingLocations(false);
      return;
    }

    setIsSearchingLocations(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocationsNominatim(val);
      setLocationSuggestions(results);
      setIsSearchingLocations(false);
    }, 280);
  };

  // Voice Search Handler (Requirement 10 & 11)
  const startVoiceSearch = useCallback(() => {
    setVoiceError(null);
    setVoiceConfirmation(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        currentLanguage === "hi"
          ? "इस ब्राउज़र में वॉयस सर्च समर्थित नहीं है। कृपया लिखकर खोजें।"
          : currentLanguage === "gu"
          ? "આ બ્રાઉઝરમાં વોઇસ સર્ચ સપોર્ટેડ નથી. કૃપા કરીને ટાઇપ કરીને શોધો."
          : "Voice search is not supported in this browser. Please type your location manually."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang =
        currentLanguage === "gu" ? "gu-IN" : currentLanguage === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        announceToUser(
          currentLanguage === "hi"
            ? "कृपया शहर या स्थान का नाम बोलें..."
            : currentLanguage === "gu"
            ? "કૃપા કરીને શહેર અથવા સ્થળનું નામ બોલો..."
            : "Please say a city or location..."
        );
      };

      recognition.onresult = async (event: any) => {
        setIsListening(false);
        const transcript = event.results[0][0].transcript?.trim();
        if (!transcript) return;

        setSearchLocationQuery(transcript);
        announceToUser(`Searching for ${transcript}`);

        // Geocode speech to locations
        const locations = await searchLocationsNominatim(transcript);
        if (locations.length > 0) {
          const topLoc = locations[0];
          setVoiceConfirmation({
            transcript,
            location: topLoc,
          });
          setLocationSuggestions(locations);
        } else {
          setVoiceConfirmation({
            transcript,
          });
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        console.warn("[VoiceSearch] Error:", event.error);
        if (event.error === "not-allowed") {
          setVoiceError(
            "Microphone access is required for voice search. You can still type your location manually."
          );
        } else {
          setVoiceError("No speech detected. Please tap the microphone and try speaking again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn("[VoiceSearch] Exception:", err);
      setIsListening(false);
      setVoiceError(
        "Microphone access could not be started. You can still type your location manually."
      );
    }
  }, [currentLanguage, announceToUser]);

  // Use Device GPS as current search location
  const handleUseDeviceLocationAsSearchCenter = useCallback(async () => {
    if (!locationState.coords) {
      handleRequestLocation();
      return;
    }
    setOperationLoadingText("Finding city for your GPS location…");
    const gpsLoc = await reverseGeocodeToLocation(locationState.coords.lat, locationState.coords.lng);
    setOperationLoadingText(null);
    if (gpsLoc) {
      handleSelectSearchLocation(gpsLoc);
    } else {
      handleSelectSearchLocation({
        name: "My Location",
        city: "Current Location",
        state: "India",
        country: "India",
        latitude: locationState.coords.lat,
        longitude: locationState.coords.lng,
        displayName: `Coordinates: ${locationState.coords.lat.toFixed(4)}, ${locationState.coords.lng.toFixed(4)}`,
        source: "gps",
      });
    }
  }, [locationState.coords, handleRequestLocation, handleSelectSearchLocation]);

  // Multi-lingual Voice Alert announcer (Requirement 11 & 12)
  const speakTravelAlert = useCallback(() => {
    let text = "";
    if (liveWeather && liveWeather.activeWarnings.length > 0) {
      const topWarning = liveWeather.activeWarnings[0];
      if (currentLanguage === "hi") {
        text = `ध्यान दें। आपके इलाके में ${topWarning.title} की चेतावनी उपलब्ध है।`;
      } else if (currentLanguage === "gu") {
        text = `ધ્યાન આપો. તમારા વિસ્તારમાં ${topWarning.title} ની ચેતવણી ઉપલબ્ધ છે.`;
      } else {
        text = `Attention. A verified weather warning is active in your area: ${topWarning.title}.`;
      }
    } else if (roadAnalysis && roadAnalysis.verifiedClosureReported) {
      if (currentLanguage === "hi") {
        text = "ध्यान दें। आपके रास्ते पर सड़क से जुड़ी एक यात्रा चेतावनी उपलब्ध है।";
      } else if (currentLanguage === "gu") {
        text = "ધ્યાન આપો. તમારા રસ્તા પર માર્ગ સંબંધી યાત્રા ચેતવણી ઉપલબ્ધ છે.";
      } else {
        text = "Attention. A verified travel disruption is reported along your route.";
      }
    } else {
      if (currentLanguage === "hi") {
        text = "अभी आपके रास्ते के लिए कोई महत्वपूर्ण यात्रा चेतावनी उपलब्ध नहीं है।";
      } else if (currentLanguage === "gu") {
        text = "હમણાં તમારા રસ્તા માટે કોઈ મહત્વપૂર્ણ યાત્રા ચેતવણી ઉપલબ્ધ નથી.";
      } else {
        text = "No important travel alerts are currently reported for your route.";
      }
    }
    announceToUser(text);
  }, [liveWeather, roadAnalysis, currentLanguage, announceToUser]);

  // Refresh All Live Data (Requirement 22)
  const handleRefreshAll = useCallback(() => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLastRefreshedTime(now);
    setOperationLoadingText("Refreshing live road, weather and emergency status…");

    const centerPos = locationState.coords || DEFAULT_INDIA_CENTER;
    const promises: Promise<any>[] = [
      fetchLiveWeatherOpenMeteo(centerPos.lat, centerPos.lng).then(setLiveWeather),
    ];

    if (locationState.coords) {
      promises.push(
        searchNearbyPOIs(locationState.coords.lat, locationState.coords.lng, "hospital").then(
          setNearestHospitals
        )
      );
    }

    if (selectedLocation) {
      promises.push(
        fetchLiveWeatherOpenMeteo(selectedLocation.lat, selectedLocation.lng).then(
          setDestinationWeather
        )
      );
      promises.push(
        analyzeRoadSafety(
          centerPos,
          { lat: selectedLocation.lat, lng: selectedLocation.lng },
          selectedLocation.name
        ).then(setRoadAnalysis)
      );
    } else {
      promises.push(
        analyzeRoadSafety(
          centerPos,
          { lat: centerPos.lat + 0.05, lng: centerPos.lng + 0.05 },
          "Immediate Regional Corridor"
        ).then(setRoadAnalysis)
      );
    }

    Promise.all(promises).finally(() => {
      setOperationLoadingText(null);
      announceToUser(
        currentLanguage === "hi"
          ? "लाइव जानकारी अपडेट हो गई है।"
          : currentLanguage === "gu"
          ? "લાઇવ માહિતી અપડેટ થઈ ગઈ છે."
          : "Live information has been refreshed."
      );
    });
  }, [locationState.coords, selectedLocation, currentLanguage, announceToUser]);

  // Listen to Global Voice Travel Actions (Requirement 11, 12, 15)
  useEffect(() => {
    const handleVoiceTravel = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: string }>;
      const action = customEvent.detail?.action;

      if (action === "hospital") {
        handleSelectCategory("hospital");
      } else if (action === "pharmacy") {
        handleSelectCategory("pharmacy");
      } else if (action === "weather" || action === "road") {
        speakTravelAlert();
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
              : currentLanguage === "gu"
              ? "ઘરનું સરનામું હજુ સેવ નથી થયું. કૃપા કરીને પહેલા સેવ કરો."
              : "Home address is not saved yet. Please set your Home in Saved Places."
          );
        }
      } else if (action === "route") {
        if (selectedLocation) {
          handleCalculateRoute(selectedLocation);
        } else {
          const input = document.getElementById("search-destination-input");
          input?.focus();
          announceToUser(
            currentLanguage === "hi"
              ? "कृपया पहले भारत में अपना गंतव्य स्थान खोजें।"
              : currentLanguage === "gu"
              ? "કૃપા કરીને પહેલા ભારતમાં તમારું સ્થળ શોધો."
              : "Please search or select a destination in India first."
          );
        }
      }
    };

    window.addEventListener("mb_voice_travel_action", handleVoiceTravel);
    return () => window.removeEventListener("mb_voice_travel_action", handleVoiceTravel);
  }, [savedPlaces, selectedLocation, currentLanguage, announceToUser, speakTravelAlert]);

  // Destination Search Handler (Strictly restricted to India - Requirement 1)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQ = sanitizeSearchQuery(searchQuery);
    if (!cleanQ || cleanQ.length < 2) return;

    setIsSearching(true);
    setSearchHasSearched(true);
    setOperationLoadingText(
      currentLanguage === "hi"
        ? "भारत में स्थान खोजा जा रहा है…"
        : currentLanguage === "gu"
        ? "ભારતમાં સ્થળ શોધાઈ રહ્યું છે…"
        : "Searching places in India…"
    );

    const centerLat = locationState.coords?.lat ?? DEFAULT_INDIA_CENTER.lat;
    const centerLng = locationState.coords?.lng ?? DEFAULT_INDIA_CENTER.lng;

    const results = await searchPlacesNominatim(cleanQ, centerLat, centerLng);
    // Explicitly enforce India-only boundary (Requirement 1)
    const indiaOnlyResults = results.filter((p) => isInsideIndia(p.lat, p.lng));
    setSearchResults(indiaOnlyResults);
    setIsSearching(false);
    setOperationLoadingText(null);

    if (indiaOnlyResults.length === 0) {
      announceToUser(
        currentLanguage === "hi"
          ? "भारत में कोई स्थान नहीं मिला। कृपया दूसरा नाम खोजें।"
          : currentLanguage === "gu"
          ? "ભારતમાં કોઈ સ્થળ મળ્યું નથી. કૃપા કરીને બીજું નામ શોધો."
          : "No place found within India. Please try another search."
      );
    }
  };

  // Select a place from Search or Map or Recents (Requirement 4, 7, 9)
  const handleSelectDestination = (loc: SelectedLocationState) => {
    setSelectedLocation(loc);
    setActiveRoute(null);
    setAvailableRoutes([]);
    setRouteError(null);

    // Real weather for destination (Requirement 9)
    fetchLiveWeatherOpenMeteo(loc.lat, loc.lng).then(setDestinationWeather);

    // Real road status analysis for route (Requirement 4)
    const originPos = locationState.coords || DEFAULT_INDIA_CENTER;
    analyzeRoadSafety(originPos, { lat: loc.lat, lng: loc.lng }, loc.name).then(setRoadAnalysis);

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
        : currentLanguage === "gu"
        ? `પસંદ કરેલ સ્થળ: ${loc.name}. ${distText}`
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

    if (!locationState.coords) {
      const errMsg =
        currentLanguage === "hi"
          ? "आपका वर्तमान स्थान उपलब्ध नहीं है। मार्ग गणना के लिए स्थान अनुमति सक्षम करें।"
          : currentLanguage === "gu"
          ? "તમારું વર્તમાન સ્થાન ઉપલબ્ધ નથી. રસ્તો ગણવા માટે લોકેશન ચાલુ કરો."
          : "Your current location is unavailable. Enable location to calculate the route.";
      setRouteError(errMsg);
      announceToUser(errMsg);
      setIsPermissionModalOpen(true);
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

    const originPos = locationState.coords;
    const originName =
      currentLanguage === "hi"
        ? "आपका वर्तमान स्थान"
        : currentLanguage === "gu"
        ? "તમારું વર્તમાન સ્થાન"
        : "Your Current Location";

    const route = await calculateRouteOSRM(
      originPos,
      { lat: dest.lat, lng: dest.lng },
      originName,
      dest.name
    );

    setIsCalculatingRoute(false);
    setOperationLoadingText(null);

    if (route) {
      const all = [route, ...(route.alternatives || [])];
      setAvailableRoutes(all);
      setActiveRoute(all[0]);
      const spoken =
        currentLanguage === "hi"
          ? `${route.destinationName} तक की दूरी ${route.distanceKm} किलोमीटर है। अनुमानित समय ${route.durationFormatted} है।`
          : `Route calculated to ${route.destinationName}. Distance is ${route.distanceKm} kilometers, estimated driving time is ${route.durationFormatted}.`;
      announceToUser(spoken);
    } else {
      setAvailableRoutes([]);
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
    const centerPos = locationState.coords || DEFAULT_INDIA_CENTER;
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
    setOperationLoadingText(null);

    if (wx) {
      const weatherText = `Current weather is ${wx.condition} at ${wx.temperatureC}°C. ${analysis.headline}.`;
      announceToUser(weatherText);
    }
  };

  // Intentional 3-Second SOS Press & Hold (Requirement 16)
  const startSosHold = () => {
    setIsHoldingSos(true);
    setSosHoldProgress(0);
    setSosSecondsLeft(3);

    const startTime = Date.now();
    const duration = 3000; // Exactly 3 seconds (Requirement 16)

    sosIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      const remainingSecs = Math.max(1, Math.ceil((duration - elapsed) / 1000));
      setSosHoldProgress(progress);
      setSosSecondsLeft(remainingSecs);
    }, 100);

    sosTimerRef.current = setTimeout(() => {
      cancelSosHold();
      if (locationState.coords) {
        store.setSeniorCoordinates?.(locationState.coords.lat, locationState.coords.lng);
      }
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
    setSosSecondsLeft(3);
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

      {/* Offline Alert Strip (Requirement 23) */}
      {!isOnline() && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2 shadow-xs">
          <span className="text-lg">📶</span>
          <span>Live road, weather and route information requires an internet connection.</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. YOUR TRAVEL STATUS (Requirement 21 & 22)                  */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-sky-200 dark:border-sky-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                YOUR TRAVEL STATUS
              </h2>
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Live safety, road, weather and emergency readiness summary
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <span className="text-[11px] font-bold text-muted-foreground">
              LAST UPDATED: <strong className="text-foreground">{lastRefreshedTime}</strong>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshAll}
              className="h-8 px-3 rounded-xl font-black text-xs text-primary border-primary/30 hover:bg-sky-50 gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>REFRESH</span>
            </Button>
          </div>
        </div>

        {/* 5 Indicator Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs font-semibold">
          {/* Location Indicator */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider">
                📍 Location
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  locationState.coords ? "bg-emerald-500" : "bg-amber-500 animate-ping"
                }`}
              />
            </div>
            <div>
              {locationState.coords ? (
                <div className="font-black text-emerald-700 dark:text-emerald-300 truncate">
                  Available (GPS Live)
                </div>
              ) : (
                <div className="font-black text-rose-700 dark:text-rose-400 truncate">
                  Your location is unavailable.
                </div>
              )}
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                {locationState.coords
                  ? `Accuracy ±${Math.round(locationState.accuracyMeters || 10)}m`
                  : "Enable GPS to calculate exact routes"}
              </div>
            </div>
            {!locationState.coords && (
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  className="px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-black cursor-pointer hover:bg-primary/90"
                >
                  TRY AGAIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("search-destination-input");
                    el?.focus();
                  }}
                  className="px-2 py-1 rounded-lg bg-muted text-foreground text-[10px] font-bold cursor-pointer hover:bg-muted/80"
                >
                  SEARCH MANUALLY
                </button>
              </div>
            )}
          </div>

          {/* Road Condition Indicator */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider">
                🛣 Road
              </span>
              <span className="text-xs">
                {roadAnalysis?.verifiedClosureReported ? "⚠️" : "✅"}
              </span>
            </div>
            <div>
              <div className="font-black text-foreground truncate">
                {roadAnalysis ? roadAnalysis.headline : "No verified disruption found."}
              </div>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {roadAnalysis?.source || "OpenStreetMap verified road network"}
              </p>
            </div>
          </div>

          {/* Weather Indicator */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider">
                🌦 Weather
              </span>
              <span className="text-xs">
                {liveWeather ? "🌡️" : "⏳"}
              </span>
            </div>
            <div>
              <div className="font-black text-foreground truncate">
                {liveWeather
                  ? `${liveWeather.condition}, ${liveWeather.temperatureC}°C`
                  : "Checking live weather…"}
              </div>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {liveWeather
                  ? `Wind ${liveWeather.windSpeedKmh} km/h • Rain ${liveWeather.precipitationMm} mm`
                  : "Open-Meteo Meteorological Feed"}
              </p>
            </div>
          </div>

          {/* Alerts Indicator */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider">
                ⚠ Alerts
              </span>
              <span className="text-xs">
                {liveWeather && liveWeather.activeWarnings.length > 0 ? "🚨" : "🛡️"}
              </span>
            </div>
            <div>
              <div
                className={`font-black truncate ${
                  liveWeather && liveWeather.activeWarnings.length > 0
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {liveWeather && liveWeather.activeWarnings.length > 0
                  ? liveWeather.activeWarnings[0].title
                  : "No important alert"}
              </div>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {liveWeather && liveWeather.activeWarnings.length > 0
                  ? liveWeather.activeWarnings[0].severity
                  : "Regional corridor is clear"}
              </p>
            </div>
          </div>

          {/* Nearest Hospital Indicator */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider">
                🏥 Hospital
              </span>
              <span className="text-xs">🚑</span>
            </div>
            <div>
              <div className="font-black text-rose-950 dark:text-rose-200 truncate">
                {nearestHospitals[0]?.name || "Searching nearby hospitals…"}
              </div>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {nearestHospitals[0]
                  ? `${nearestHospitals[0].distanceKm} km away • Verified OSM`
                  : "Emergency route ready on tap"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2B. REAL DEVICE LOCATION BANNER (Requirements 1 & 2)         */}
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
            ) : (
              <div className="space-y-0.5">
                <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                  Your location is unavailable.
                </span>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Enable location in browser settings or search any Indian location manually.
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
                <span>TRY AGAIN</span>
              </Button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("search-destination-input");
                  input?.focus();
                }}
                className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                SEARCH LOCATION MANUALLY
              </button>
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. LOCATION & SEARCH BAR DIRECTLY ABOVE MAP (Requirements 8-11) */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-sky-300 dark:border-sky-800 shadow-md space-y-4">
        {/* Active Search Location Header (Requirement 1, 6 & 7) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <span className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                CURRENT SEARCH LOCATION • PRIMARY GEOGRAPHIC REFERENCE
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground mt-1 flex flex-wrap items-baseline gap-2">
              <span>{selectedSearchLocation.city || selectedSearchLocation.name}, {selectedSearchLocation.state}</span>
              <span className="text-xs font-bold text-muted-foreground">({selectedSearchLocation.country})</span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                Single Source of Truth
              </span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              All healthcare, doctors, pharmacies and emergency help services below are centered strictly around this location.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUseDeviceLocationAsSearchCenter}
              className="h-9 px-3.5 rounded-xl font-bold text-xs gap-1.5 cursor-pointer border-sky-300 text-sky-800 dark:text-sky-200 hover:bg-sky-50 shadow-2xs"
              title="Set search center using your device GPS"
            >
              <MapPin className="h-3.5 w-3.5 text-sky-600" />
              <span>Use My Location</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const el = document.getElementById("senior-location-search-input");
                el?.focus();
              }}
              className="h-9 px-3.5 rounded-xl font-bold text-xs gap-1.5 cursor-pointer border-border hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Change City</span>
            </Button>
          </div>
        </div>

        {/* Senior-Friendly Search Bar with Integrated Microphone (Requirements 8, 9, 10, 19) */}
        <div className="relative">
          <div className="relative flex items-center w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border-3 border-sky-400 focus-within:border-sky-600 focus-within:ring-4 focus-within:ring-sky-100 dark:focus-within:ring-sky-950/60 shadow-lg transition-all p-2 pl-4 sm:pl-5 gap-2 sm:gap-3">
            <Search className="h-6 w-6 text-sky-600 shrink-0" />
            <Input
              id="senior-location-search-input"
              value={searchLocationQuery}
              onChange={(e) => handleLocationInputChange(e.target.value)}
              placeholder={
                currentLanguage === "hi"
                  ? "शहर, क्षेत्र या स्थान खोजें (उदा: Mahesana, Vadodara, Ahmedabad)..."
                  : currentLanguage === "gu"
                  ? "શહેર અથવા સ્થળ શોધો (દા.ત: Mahesana, Vadodara, Ahmedabad)..."
                  : "Search city, area or location (e.g. Mahesana, Vadodara, Ahmedabad)..."
              }
              className="border-0 shadow-none focus-visible:ring-0 text-base sm:text-lg font-bold h-12 p-0 bg-transparent text-foreground placeholder:text-muted-foreground"
            />

            {/* Clear Button */}
            {searchLocationQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchLocationQuery("");
                  setLocationSuggestions([]);
                  setVoiceConfirmation(null);
                }}
                className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground font-black text-sm cursor-pointer shrink-0"
                title="Clear"
              >
                ✕
              </button>
            )}

            {/* Senior-Friendly Microphone Button (Requirement 10 & 19) */}
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-black text-sm flex items-center gap-2 cursor-pointer transition-all shrink-0 shadow-md ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse ring-4 ring-rose-300"
                  : "bg-sky-600 hover:bg-sky-700 text-white active:scale-95"
              }`}
              title="Search location using voice"
            >
              <Mic className={`h-5 w-5 ${isListening ? "animate-bounce" : ""}`} />
              <span className="hidden sm:inline">
                {isListening ? "Listening…" : "Voice Search"}
              </span>
            </button>
          </div>

          {/* Voice Listening Active Indicator (Requirement 10 & 11) */}
          {isListening && (
            <div className="mt-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-300 text-rose-950 dark:text-rose-100 flex items-center justify-between text-xs sm:text-sm font-black shadow-md animate-pulse">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-spin">🎙️</span>
                <div>
                  <div className="font-black text-sm">Listening... Please say a city or location</div>
                  <div className="text-xs font-semibold text-rose-800 dark:text-rose-300 mt-0.5">
                    Example: "Mahesana Gujarat", "Vadodara", or "Ahmedabad"
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsListening(false)}
                className="h-8 px-3 rounded-xl border-rose-300 text-rose-900 hover:bg-rose-100 font-bold text-xs"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Voice Confirmation Card (Requirement 11) */}
          {voiceConfirmation && (
            <div className="mt-2.5 p-4 sm:p-5 rounded-2xl bg-sky-50 dark:bg-sky-950/90 border-2 border-sky-400 shadow-lg text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎙️</span>
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase">Voice Recognized</div>
                  <div className="font-black text-base sm:text-lg text-foreground">
                    Did you mean:{" "}
                    <span className="text-primary underline">
                      {voiceConfirmation.location?.displayName || voiceConfirmation.transcript}
                    </span>
                    ?
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {voiceConfirmation.location ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (voiceConfirmation.location) {
                        handleSelectSearchLocation(voiceConfirmation.location);
                      }
                    }}
                    className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm cursor-pointer shadow-md gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Yes, use this location</span>
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setVoiceConfirmation(null);
                    startVoiceSearch();
                  }}
                  className="h-11 px-4 rounded-xl font-bold text-xs cursor-pointer border-sky-300 hover:bg-sky-100"
                >
                  <Mic className="h-3.5 w-3.5 text-sky-600" />
                  <span>Search again</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setVoiceConfirmation(null)}
                  className="h-11 px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Microphone Permission / Voice Error (Requirement 17 Case E) */}
          {voiceError && (
            <div className="mt-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{voiceError}</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceError(null)}
                className="text-xs font-black underline ml-2 cursor-pointer"
              >
                Dismiss ✕
              </button>
            </div>
          )}

          {/* Autocomplete Suggestions Dropdown (Requirements 9 & 17 Case B) */}
          {locationSuggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 rounded-3xl bg-white dark:bg-slate-900 border-2 border-sky-300 shadow-2xl p-2.5 max-h-72 overflow-y-auto space-y-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1 text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                Select Location ({locationSuggestions.length} suggestions)
              </div>
              {locationSuggestions.map((loc, idx) => (
                <button
                  key={`${loc.name}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSearchLocation(loc)}
                  className="w-full p-3 rounded-2xl hover:bg-sky-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer flex items-start gap-3 border border-transparent hover:border-sky-200"
                >
                  <MapPin className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-black text-foreground truncate">
                      {loc.name}, {loc.state}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {loc.displayName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. REAL INTERACTIVE MAP (Immediately Below Search Bar)        */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <span>Interactive Healthcare & Navigation Map</span>
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Centered on 📍 <strong>{selectedSearchLocation.city || selectedSearchLocation.name}, {selectedSearchLocation.state}</strong>
            </p>
          </div>
          <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
            📍 0–25 km verified radius
          </span>
        </div>

        <RealInteractiveMap
          initialCenter={{
            lat: selectedSearchLocation.latitude,
            lng: selectedSearchLocation.longitude,
          }}
          initialZoom={12}
          locationState={locationState}
          hideEmbeddedSearch={true}
          onCenterOnLocation={() => {
            if (!locationState.coords) {
              setIsPermissionModalOpen(true);
            }
          }}
          selectedLocation={
            selectedLocation || {
              lat: selectedSearchLocation.latitude,
              lng: selectedSearchLocation.longitude,
              name: selectedSearchLocation.city || selectedSearchLocation.name,
              address: selectedSearchLocation.displayName,
              type: "Selected Search Center",
              selectedAt: "",
            }
          }
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
      {/* 5. NEARBY HELP & SERVICES (Directly Below Map)                */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-sky-200 dark:border-sky-800 shadow-md space-y-4">
        {/* Category Selector Tabs (Requirements 2, 14, 18) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <span>Nearby Help Services</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 font-bold border border-sky-300">
                Around {selectedSearchLocation.city || selectedSearchLocation.name}
              </span>
            </h3>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Verified facilities sorted strictly by distance from {selectedSearchLocation.city || selectedSearchLocation.name}
            </p>
          </div>

          <div className="text-xs font-bold text-muted-foreground flex items-center gap-1 self-start sm:self-auto">
            <span>Center:</span>
            <strong className="text-foreground">
              {selectedSearchLocation.city || selectedSearchLocation.name}, {selectedSearchLocation.state}
            </strong>
          </div>
        </div>

        {/* 5 Prominent Service Category Buttons (Requirement 18) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: "hospital", label: "Hospitals", icon: "🏥", color: "border-rose-300 text-rose-900" },
            { id: "pharmacy", label: "Pharmacies", icon: "💊", color: "border-emerald-300 text-emerald-900" },
            { id: "emergency", label: "Emergency", icon: "🚑", color: "border-red-300 text-red-900" },
            { id: "doctor", label: "Doctors", icon: "👨‍⚕️", color: "border-indigo-300 text-indigo-900" },
            { id: "elder_care", label: "Elder Care", icon: "🏠", color: "border-teal-300 text-teal-900" },
          ].map((cat) => {
            const isActive = activeHelpCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveHelpCategory(cat.id as any)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl font-black text-xs sm:text-sm cursor-pointer transition-all border-2 shadow-xs active:scale-95 ${
                  isActive
                    ? "bg-primary text-white border-primary shadow-md scale-102"
                    : `bg-muted/30 hover:bg-muted text-foreground ${cat.color}`
                }`}
              >
                <span className="text-base sm:text-lg">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Distance Notice / Fallback Message (Requirement 3 & 17 Case C) */}
        {helpSearchNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <span className="text-base">ℹ️</span>
            <span>{helpSearchNotice}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoadingHelpServices && (
          <div className="p-6 rounded-2xl bg-muted/20 border border-border text-center space-y-2">
            <RefreshCw className="h-6 w-6 text-primary animate-spin mx-auto" />
            <p className="text-xs font-bold text-muted-foreground">
              Searching verified {activeHelpCategory} services near {selectedSearchLocation.city || selectedSearchLocation.name}…
            </p>
          </div>
        )}

        {/* Results List Sorted by Distance (Requirements 3, 4, 5, 15, 18) */}
        {!isLoadingHelpServices && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {helpServices.map((svc) => (
              <div
                key={svc.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-border/90 hover:border-primary/50 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-black text-sm sm:text-base text-foreground line-clamp-1">
                      {svc.name}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase bg-primary/10 text-primary shrink-0">
                      {svc.distanceKm} km
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {svc.categoryLabel}
                    </span>
                    {svc.isOpen24Hours && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Open 24/7
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    📍 {svc.address}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                  {/* Google Maps Exact Result Button (Requirement 5 & 15) */}
                  <a
                    href={svc.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 font-black text-xs cursor-pointer shadow-xs transition-colors"
                    title={`Open ${svc.name} in Google Maps`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in Maps</span>
                  </a>

                  {/* Route Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const loc: SelectedLocationState = {
                        lat: svc.lat,
                        lng: svc.lng,
                        name: svc.name,
                        address: svc.address,
                        type: svc.categoryLabel,
                        selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      };
                      handleSelectDestination(loc);
                      handleCalculateRoute(loc);
                    }}
                    className="h-9 px-3 text-xs font-black rounded-xl border-primary/40 text-primary hover:bg-sky-50 cursor-pointer gap-1"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Route</span>
                  </Button>

                  {/* Phone Call Button */}
                  {svc.phone && (
                    <a
                      href={`tel:${svc.phone}`}
                      className="h-9 px-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs"
                      title={`Call ${svc.phone}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading State Banner (Requirement 23) */}
      {operationLoadingText && (
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 text-xs font-bold text-sky-800 dark:text-sky-200 flex items-center gap-2 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
          <span>{operationLoadingText}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. ROUTE STATUS & TRAVEL CHECK (When Destination Selected)   */}
      {/* ============================================================ */}
      {selectedLocation && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-primary/40 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                  ROUTE STATUS
                </span>
                {locationState.coords && (
                  <span className="text-xs font-black text-sky-700 dark:text-sky-400">
                    • {calculateDistanceKm(locationState.coords, { lat: selectedLocation.lat, lng: selectedLocation.lng })} km straight line
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
                setAvailableRoutes([]);
                setDestinationWeather(null);
              }}
              className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground font-black text-sm cursor-pointer shrink-0"
              title="Close destination"
            >
              ✕
            </button>
          </div>

          {/* Real Route Calculation Card */}
          {activeRoute && (
            <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-200 dark:border-sky-800/80 pb-2.5">
                <div className="flex items-center gap-2 font-black text-sm text-[#0F243E] dark:text-sky-200">
                  <span>{activeRoute.originName}</span>
                  <span>↓</span>
                  <span>{activeRoute.destinationName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-sky-300 text-sky-800 dark:text-sky-300">
                    {activeRoute.label || "Route 1"}
                  </span>
                  <span className="text-sm font-black text-primary">
                    {activeRoute.distanceKm} km • {activeRoute.durationFormatted}
                  </span>
                </div>
              </div>

              {/* Alternative Routes Comparison */}
              {availableRoutes.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 py-1 border-b border-sky-200/60 dark:border-sky-800/60">
                  <span className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                    Available Routes:
                  </span>
                  {availableRoutes.map((r, idx) => {
                    const isSelected = activeRoute.label === r.label;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveRoute(r)}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-white dark:bg-slate-900 text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {r.label || `Route ${idx + 1}`}: {r.distanceKm} km ({r.durationFormatted})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Real Values Display */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-border">
                  <div className="text-[10px] uppercase text-muted-foreground font-black">Driving Distance</div>
                  <div className="text-base font-black text-foreground mt-0.5">{activeRoute.distanceKm} km</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-border">
                  <div className="text-[10px] uppercase text-muted-foreground font-black">Estimated Travel Time</div>
                  <div className="text-base font-black text-foreground mt-0.5">{activeRoute.durationFormatted}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-border">
                  <div className="text-[10px] uppercase text-muted-foreground font-black">Road Condition</div>
                  <div className="text-xs font-bold text-foreground mt-1 truncate">
                    {roadAnalysis ? roadAnalysis.headline : "No verified disruption found."}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-border">
                  <div className="text-[10px] uppercase text-muted-foreground font-black">Travel Alert</div>
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300 mt-1 truncate">
                    {liveWeather && liveWeather.activeWarnings.length > 0 ? liveWeather.activeWarnings[0].title : "No important alert"}
                  </div>
                </div>
              </div>

              {/* TRAVEL CHECK Section */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-border space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  TRAVEL CHECK
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">🛣️</span>
                    <div>
                      <strong className="block text-foreground">ROAD</strong>
                      <span className="text-muted-foreground text-[11px]">
                        {roadAnalysis ? roadAnalysis.headline : "No verified disruption found."}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">🌦️</span>
                    <div>
                      <strong className="block text-foreground">WEATHER</strong>
                      <span className="text-muted-foreground text-[11px]">
                        {destinationWeather ? `${destinationWeather.condition}, ${destinationWeather.temperatureC}°C` : "Weather nominal."}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">⚠️</span>
                    <div>
                      <strong className="block text-foreground">ALERTS</strong>
                      <span className="text-muted-foreground text-[11px]">
                        {liveWeather && liveWeather.activeWarnings.length > 0 ? liveWeather.activeWarnings[0].title : "No verified travel alerts."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground">
                Calculated with: {activeRoute.source}
              </div>
            </div>
          )}

          {routeError && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 text-xs font-bold text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Unable to calculate the route right now.</span>
              </div>
              <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                {routeError}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => handleCalculateRoute(selectedLocation)}
                  className="h-8 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-black text-xs cursor-pointer"
                >
                  TRY AGAIN
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedLocation(null);
                    setActiveRoute(null);
                  }}
                  className="h-8 px-3 rounded-xl border-amber-400 text-amber-900 dark:text-amber-200 font-bold text-xs cursor-pointer"
                >
                  CHANGE DESTINATION
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!activeRoute ? (
              <Button
                size="lg"
                onClick={() => handleCalculateRoute(selectedLocation)}
                disabled={isCalculatingRoute}
                className="flex-1 sm:flex-initial h-13 px-6 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-md gap-2"
              >
                <Compass className="h-5 w-5" />
                <span>{isCalculatingRoute ? "Calculating Route…" : "CALCULATE ROUTE"}</span>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleStartNavigation}
                className="flex-1 sm:flex-initial h-13 px-8 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-lg shadow-emerald-600/25 gap-2 animate-bounce-short"
              >
                <Navigation className="h-5 w-5 fill-white" />
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
              onClick={handleStartNavigation}
              className="h-13 px-4 rounded-2xl font-bold text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in Navigation App</span>
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. WEATHER NEAR YOU & TRAVEL ALERTS                          */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20 border-2 border-sky-200 dark:border-sky-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              🌦️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  WEATHER NEAR YOU
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Real-Time Weather
                </span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground">
                Verified meteorological observations for your current location in India
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={speakTravelAlert}
              className="h-9 px-3.5 rounded-xl font-black text-xs text-sky-700 border-sky-300 hover:bg-sky-50 gap-1.5 cursor-pointer"
            >
              <Volume2 className="h-4 w-4" />
              <span>Read Weather</span>
            </Button>
          </div>
        </div>

        {/* Real Weather Details Cards */}
        {liveWeather ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs text-center font-bold">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 shadow-2xs">
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Condition</div>
              <div className="text-base font-black text-foreground mt-1 truncate">{liveWeather.condition}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 shadow-2xs">
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Temperature</div>
              <div className="text-base font-black text-foreground mt-1">{liveWeather.temperatureC}°C</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 shadow-2xs">
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Rainfall</div>
              <div className="text-base font-black text-sky-600 mt-1">{liveWeather.precipitationMm} mm</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 shadow-2xs">
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Wind Speed</div>
              <div className="text-base font-black text-foreground mt-1">{liveWeather.windSpeedKmh} km/h</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 shadow-2xs col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Warning</div>
              <div className="text-sm font-black mt-1 truncate text-amber-700 dark:text-amber-300">
                {liveWeather.activeWarnings.length > 0 ? liveWeather.activeWarnings[0].title : "None Active"}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-muted/20 border border-dashed border-border text-center text-xs text-muted-foreground">
            {locationState.coords
              ? "Fetching live weather observations…"
              : "Enable location to view real weather at your current position."}
          </div>
        )}

        {/* Travel Alerts */}
        {liveWeather && liveWeather.activeWarnings.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>ACTIVE TRAVEL ALERT</span>
            </div>
            {liveWeather.activeWarnings.map((w, idx) => (
              <div key={idx} className="text-xs text-amber-950 dark:text-amber-100 space-y-0.5">
                <div className="font-black text-sm">{w.title}</div>
                <p className="font-semibold text-[11px] text-amber-900/80">{w.description}</p>
                <div className="text-[10px] text-muted-foreground pt-1">
                  Severity: {w.severity} • Source: Open-Meteo Meteorological Warning Stream
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Destination Weather Comparison if Destination is selected */}
        {selectedLocation && destinationWeather && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-foreground flex items-center gap-1.5">
                <span>🎯 Destination Weather:</span>
                <strong className="text-primary">{selectedLocation.name}</strong>
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">
                {destinationWeather.condition} • {destinationWeather.temperatureC}°C • Rain: {destinationWeather.precipitationMm} mm
              </span>
            </div>
            {destinationWeather.precipitationMm > 0 ? (
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200">
                🌧️ Rain may affect your destination ({selectedLocation.name}). Carry umbrella or plan extra travel time.
              </p>
            ) : (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200">
                ☀️ Clear weather expected at your destination ({selectedLocation.name}).
              </p>
            )}
          </div>
        )}
      </div>

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
      {/* 10. INTENTIONAL 3-SECOND SOS EMERGENCY SECTION (Requirement 16) */}
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
              Hold the emergency button for 3 seconds to notify family & emergency contacts.
            </p>
          </div>

          {/* Intentional SOS Hold Button */}
          <div className="flex items-center gap-3 shrink-0">
            {isHoldingSos && (
              <Button
                variant="outline"
                onClick={cancelSosHold}
                className="h-14 px-4 rounded-2xl font-black text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                CANCEL
              </Button>
            )}

            <button
              type="button"
              onPointerDown={startSosHold}
              onPointerUp={cancelSosHold}
              onPointerLeave={cancelSosHold}
              className={`relative overflow-hidden h-14 px-7 rounded-3xl font-black text-sm transition-all cursor-pointer select-none flex items-center gap-2.5 shadow-lg ${
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
                  ? `HOLDING... ${sosSecondsLeft}`
                  : "HOLD FOR 3 SECONDS"}
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
