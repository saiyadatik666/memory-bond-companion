import { useState, useEffect } from "react";
import {
  Navigation,
  Shield,
  Layers,
  MapPin,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealInteractiveMap } from "@/components/memory-bond/safety/RealInteractiveMap";
import { LocationPermissionModal } from "@/components/memory-bond/safety/LocationPermissionModal";
import {
  searchNearbyEmergencyFacilities,
  DEFAULT_NER_CENTER,
} from "@/lib/safety/realMapService";
import type {
  LocationState,
  RealRouteResult,
  EmergencyFacility,
  LatLng,
} from "@/types/realSafetyMap";

interface NerSmartMapProps {
  roads?: any[];
  bridges?: any[];
  risks?: any[];
  vehicles?: any[];
  shipments?: any[];
  incidents?: any[];
  districts?: any[];
  isSeniorMode?: boolean;
  onSelectRoute?: (route: RealRouteResult) => void;
}

export function NerSmartMap({
  isSeniorMode = false,
  onSelectRoute,
}: NerSmartMapProps) {
  // Real Geolocation State
  const [locationState, setLocationState] = useState<LocationState>({
    coords: null,
    accuracyMeters: null,
    isAccuracyLimited: false,
    permissionStatus: "prompt",
    lastUpdated: null,
    isTrackingActive: false,
    isSharingEnabled: false, // Strict privacy: Sharing is OFF by default
    source: "Browser HTML5 Geolocation API",
  });

  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [activeRoute, setActiveRoute] = useState<RealRouteResult | null>(null);

  // Request real location from device
  const requestLocation = () => {
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

        setLocationState((prev) => ({
          ...prev,
          coords,
          accuracyMeters: accuracy,
          isAccuracyLimited: accuracy > 100,
          permissionStatus: "granted",
          lastUpdated: now,
          isTrackingActive: true,
        }));
        setIsPermissionModalOpen(false);
        setIsPermissionDenied(false);

        // Fetch real nearby emergency facilities around current user position
        searchNearbyEmergencyFacilities(coords.lat, coords.lng, "hospital").then(setFacilities);
      },
      (err) => {
        console.warn("[RealMap] Geolocation denied or unavailable:", err.message);
        setLocationState((prev) => ({
          ...prev,
          permissionStatus: "denied",
        }));
        setIsPermissionDenied(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  };

  // On initial mount, attempt soft permission query if supported
  useEffect(() => {
    if (typeof navigator !== "undefined" && "permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as any })
        .then((status) => {
          if (status.state === "granted") {
            requestLocation();
          } else if (status.state === "denied") {
            setIsPermissionDenied(true);
          }
        })
        .catch(() => {});
    }

    // Default facility query for regional center
    searchNearbyEmergencyFacilities(DEFAULT_NER_CENTER.lat, DEFAULT_NER_CENTER.lng, "hospital").then(
      setFacilities
    );
  }, []);

  return (
    <div className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden space-y-3">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-primary flex items-center justify-center font-black shrink-0">
            <Navigation className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-foreground">
                Live Interactive Safety Map
              </h3>
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                OpenStreetMap Live
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              Real geographic coordinates, live Open-Meteo weather, and verified road routing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy Toggle: Sharing is strictly OFF by default */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background border border-border text-xs font-bold text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Location Sharing: <strong>{locationState.isSharingEnabled ? "ON" : "OFF"}</strong></span>
          </div>

          {locationState.coords ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-200">
              ✓ Location Active
            </span>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsPermissionModalOpen(true)}
              className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer bg-primary text-white"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Enable My Location</span>
            </Button>
          )}
        </div>
      </div>

      {/* Real Interactive Map Canvas */}
      <div className="p-3 sm:p-4">
        <RealInteractiveMap
          initialCenter={locationState.coords || DEFAULT_NER_CENTER}
          initialZoom={locationState.coords ? 13 : 10}
          locationState={locationState}
          onCenterOnLocation={() => {
            if (locationState.coords) {
              // Location already present
            } else {
              setIsPermissionModalOpen(true);
            }
          }}
          activeRoute={activeRoute}
          facilities={facilities}
          isSeniorMode={isSeniorMode}
          onSelectDestination={(dest, name) => {
            if (locationState.coords) {
              import("@/lib/safety/realMapService").then(({ calculateRouteOSRM }) => {
                calculateRouteOSRM(locationState.coords!, dest, "My Location", name).then((r) => {
                  if (r) {
                    setActiveRoute(r);
                    onSelectRoute?.(r);
                  }
                });
              });
            } else {
              setIsPermissionModalOpen(true);
            }
          }}
        />
      </div>

      {/* Location Permission Explanation Modal */}
      <LocationPermissionModal
        isOpen={isPermissionModalOpen}
        onAllow={requestLocation}
        onDismiss={() => setIsPermissionModalOpen(false)}
        isDenied={isPermissionDenied}
      />
    </div>
  );
}
