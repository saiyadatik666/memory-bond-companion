import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Compass,
  Search,
  Plus,
  Minus,
  Layers,
  Shield,
  Clock,
  Phone,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  Car,
  CloudRain,
  Radio,
  Building2,
  Utensils,
  Fuel,
  Train,
  CircleDollarSign,
  ShoppingBag,
  Target,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  latLngToPixel,
  pixelToLatLng,
  getTileUrl,
  calculateDistanceKm,
  searchPlacesNominatim,
  searchGeocodingOSM,
  calculateRouteOSRM,
  fetchLiveWeatherOpenMeteo,
  searchNearbyPOIs,
  sanitizeSearchQuery,
  getTrafficNotice,
  DEFAULT_INDIA_CENTER,
  DEFAULT_NER_CENTER,
  TILE_SIZE,
} from "@/lib/safety/realMapService";
import type {
  LatLng,
  MapStyleMode,
  PlaceSearchResult,
  RealRouteResult,
  RealWeatherResult,
  EmergencyFacility,
  LocationState,
  SelectedLocationState,
  NearbyCategoryType,
  NearbyPlace,
} from "@/types/realSafetyMap";

interface RealInteractiveMapProps {
  initialCenter?: LatLng;
  initialZoom?: number;
  locationState: LocationState;
  onCenterOnLocation: () => void;
  activeRoute?: RealRouteResult | null;
  selectedLocation?: SelectedLocationState | null;
  onSelectLocation?: (loc: SelectedLocationState) => void;
  onClearSelectedLocation?: () => void;
  onSelectDestination?: (dest: LatLng, name: string) => void;
  onRequestRouteFromCurrent?: (dest: SelectedLocationState) => void;
  facilities?: EmergencyFacility[];
  isSeniorMode?: boolean;
  hideEmbeddedSearch?: boolean;
  className?: string;
}

export function RealInteractiveMap({
  initialCenter = DEFAULT_INDIA_CENTER,
  initialZoom = 5,
  locationState,
  onCenterOnLocation,
  activeRoute,
  selectedLocation: externalSelectedLocation,
  onSelectLocation,
  onClearSelectedLocation,
  onSelectDestination,
  onRequestRouteFromCurrent,
  facilities = [],
  isSeniorMode = false,
  hideEmbeddedSearch = false,
  className = "",
}: RealInteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Map viewport state
  const [center, setCenter] = useState<LatLng>(initialCenter);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [mapMode, setMapMode] = useState<MapStyleMode>("ROAD");
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Separate Internal Selected Location state fallback (Requirement 1, 2, 3)
  const [internalSelectedLocation, setInternalSelectedLocation] =
    useState<SelectedLocationState | null>(null);
  const activeSelectedLoc =
    externalSelectedLocation !== undefined
      ? externalSelectedLocation
      : internalSelectedLocation;

  // Dragging & Click discrimination
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; center: LatLng } | null>(null);
  const dragDistanceRef = useRef(0);

  // Clean Search state (Requirement 10)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Nearby POI state (Requirement 12)
  const [activeNearbyCategory, setActiveNearbyCategory] =
    useState<NearbyCategoryType | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  // Traffic modal state (Requirement 11)
  const [trafficModalOpen, setTrafficModalOpen] = useState(false);
  const [isMapTypeOpen, setIsMapTypeOpen] = useState(false);

  // Selected Pin Bottom Sheet
  const [activePin, setActivePin] = useState<{
    title: string;
    type: string;
    lat: number;
    lng: number;
    address?: string;
    phone?: string | null;
    isCurrentLocation?: boolean;
    isSelectedLocation?: boolean;
  } | null>(null);

  // Update container dimensions on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 800,
          height: containerRef.current.clientHeight || 500,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Center on GPS initially only if no destination is already selected
  const hasCenteredInitialRef = useRef(false);
  useEffect(() => {
    if (
      locationState.coords &&
      locationState.permissionStatus === "granted" &&
      !hasCenteredInitialRef.current &&
      !activeSelectedLoc
    ) {
      setCenter(locationState.coords);
      setZoom(14);
      hasCenteredInitialRef.current = true;
    }
  }, [locationState.coords, locationState.permissionStatus, activeSelectedLoc]);

  // Center on active route if provided
  useEffect(() => {
    if (activeRoute && activeRoute.coordinates.length > 0) {
      const midIdx = Math.floor(activeRoute.coordinates.length / 2);
      setCenter(activeRoute.coordinates[midIdx]);
      setZoom(10);
    }
  }, [activeRoute]);

  // When external selected location changes, smoothly re-center camera on it (Requirement 14)
  useEffect(() => {
    if (externalSelectedLocation) {
      setCenter({
        lat: externalSelectedLocation.lat,
        lng: externalSelectedLocation.lng,
      });
      setZoom((prev) => Math.max(prev, 12));
    }
  }, [externalSelectedLocation?.lat, externalSelectedLocation?.lng]);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragDistanceRef.current = 0;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      center: { ...center },
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragDistanceRef.current += Math.abs(dx) + Math.abs(dy);

    const currentPixel = latLngToPixel(
      dragStartRef.current.center.lat,
      dragStartRef.current.center.lng,
      zoom
    );
    const newPixel = { x: currentPixel.x - dx, y: currentPixel.y - dy };
    const newCenter = pixelToLatLng(newPixel.x, newPixel.y, zoom);
    setCenter(newCenter);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const wasClick = dragDistanceRef.current < 6;
    setIsDragging(false);
    dragStartRef.current = null;

    // Handle map tap to set selected location (Requirement 3)
    if (wasClick && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Ignore clicks on floating toolbars and buttons
      if (clickY < 110 || clickX > dimensions.width - 70) return;

      const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
      const clickedPixel = {
        x: centerPixel.x - dimensions.width / 2 + clickX,
        y: centerPixel.y - dimensions.height / 2 + clickY,
      };
      const clickedCoord = pixelToLatLng(clickedPixel.x, clickedPixel.y, zoom);

      const newLoc: SelectedLocationState = {
        lat: Number(clickedCoord.lat.toFixed(5)),
        lng: Number(clickedCoord.lng.toFixed(5)),
        name: `Location (${clickedCoord.lat.toFixed(4)}, ${clickedCoord.lng.toFixed(4)})`,
        address: `Map point: ${clickedCoord.lat.toFixed(4)}°N, ${clickedCoord.lng.toFixed(4)}°E`,
        type: "User-Selected Map Location",
        selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setInternalSelectedLocation(newLoc);
      onSelectLocation?.(newLoc);
      onSelectDestination?.({ lat: newLoc.lat, lng: newLoc.lng }, newLoc.name);

      setActivePin({
        title: newLoc.name,
        type: "Selected Location",
        lat: newLoc.lat,
        lng: newLoc.lng,
        address: newLoc.address,
        isSelectedLocation: true,
      });
    }
  };

  // Touch handlers for mobile devices
  const touchStartRef = useRef<{ x: number; y: number; center: LatLng } | null>(null);
  const touchDistanceRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchDistanceRef.current = 0;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        center: { ...center },
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchDistanceRef.current += Math.abs(dx) + Math.abs(dy);

      const currentPixel = latLngToPixel(
        touchStartRef.current.center.lat,
        touchStartRef.current.center.lng,
        zoom
      );
      const newPixel = { x: currentPixel.x - dx, y: currentPixel.y - dy };
      const newCenter = pixelToLatLng(newPixel.x, newPixel.y, zoom);
      setCenter(newCenter);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(18, z + 1));
  const zoomOut = () => setZoom((z) => Math.max(3, z - 1));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  // Center camera on user's current live GPS (Requirement 14)
  const handleCenterOnCurrentLocation = () => {
    if (locationState.coords) {
      setCenter(locationState.coords);
      setZoom((z) => Math.max(z, 13));
    }
    onCenterOnLocation();
  };

  // Center camera on user-selected location (Requirement 14)
  const handleCenterOnSelectedLocation = () => {
    if (activeSelectedLoc) {
      setCenter({ lat: activeSelectedLoc.lat, lng: activeSelectedLoc.lng });
      setZoom((z) => Math.max(z, 13));
    }
  };

  // Project any LatLng to screen coordinates
  const projectToScreen = useCallback(
    (lat: number, lng: number) => {
      const centerPx = latLngToPixel(center.lat, center.lng, zoom);
      const targetPx = latLngToPixel(lat, lng, zoom);
      return {
        x: targetPx.x - centerPx.x + dimensions.width / 2,
        y: targetPx.y - centerPx.y + dimensions.height / 2,
      };
    },
    [center, zoom, dimensions]
  );

  // Compute visible slippy tiles
  const visibleTiles = useMemo(() => {
    const centerPx = latLngToPixel(center.lat, center.lng, zoom);
    const halfW = dimensions.width / 2;
    const halfH = dimensions.height / 2;

    const minX = Math.floor((centerPx.x - halfW) / TILE_SIZE);
    const maxX = Math.floor((centerPx.x + halfW) / TILE_SIZE);
    const minY = Math.floor((centerPx.y - halfH) / TILE_SIZE);
    const maxY = Math.floor((centerPx.y + halfH) / TILE_SIZE);

    const maxTile = Math.pow(2, zoom);
    const tiles: { key: string; x: number; y: number; z: number; left: number; top: number; url: string }[] = [];

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (y < 0 || y >= maxTile) continue;
        const wrappedX = ((x % maxTile) + maxTile) % maxTile;

        const tileLeft = x * TILE_SIZE - centerPx.x + halfW;
        const tileTop = y * TILE_SIZE - centerPx.y + halfH;
        const url = getTileUrl(wrappedX, y, zoom, mapMode);

        tiles.push({
          key: `${zoom}-${wrappedX}-${y}`,
          x: wrappedX,
          y,
          z: zoom,
          left: tileLeft,
          top: tileTop,
          url,
        });
      }
    }
    return tiles;
  }, [center, zoom, dimensions, mapMode]);

  // Clean Search handler (Requirement 9 & 10)
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = sanitizeSearchQuery(searchQuery);
    if (!cleanQ || cleanQ.length < 2) return;

    setIsSearching(true);
    const results = await searchPlacesNominatim(cleanQ, center.lat, center.lng);
    setSearchResults(results);
    setIsSearching(false);
    setShowSearchDropdown(true);
  };

  // Selecting a search result sets selectedLocation (Requirement 3 & 9)
  const handleSelectSearchResult = (place: PlaceSearchResult) => {
    const newLoc: SelectedLocationState = {
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      address: place.displayName,
      type: place.category || "Search Result",
      selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setInternalSelectedLocation(newLoc);
    onSelectLocation?.(newLoc);
    onSelectDestination?.({ lat: place.lat, lng: place.lng }, place.name);

    setCenter({ lat: place.lat, lng: place.lng });
    setZoom(13);
    setShowSearchDropdown(false);

    setActivePin({
      title: place.name,
      type: place.category || "Selected Destination",
      lat: place.lat,
      lng: place.lng,
      address: place.displayName,
      isSelectedLocation: true,
    });
  };

  // Nearby Category selection (Requirement 12)
  const handleToggleNearbyCategory = async (cat: NearbyCategoryType) => {
    if (activeNearbyCategory === cat) {
      setActiveNearbyCategory(null);
      setNearbyPlaces([]);
      return;
    }

    setActiveNearbyCategory(cat);
    setIsLoadingNearby(true);

    // Query around selected location if active, otherwise user GPS, otherwise map center
    const targetLat = activeSelectedLoc?.lat ?? locationState.coords?.lat ?? center.lat;
    const targetLng = activeSelectedLoc?.lng ?? locationState.coords?.lng ?? center.lng;

    const places = await searchNearbyPOIs(targetLat, targetLng, cat);
    setNearbyPlaces(places);
    setIsLoadingNearby(false);
  };

  // Selecting a nearby POI sets it as selectedLocation (Requirement 12)
  const handleSelectNearbyPlace = (poi: NearbyPlace) => {
    const newLoc: SelectedLocationState = {
      lat: poi.lat,
      lng: poi.lng,
      name: poi.name,
      address: poi.address,
      type: poi.categoryLabel,
      selectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setInternalSelectedLocation(newLoc);
    onSelectLocation?.(newLoc);
    onSelectDestination?.({ lat: poi.lat, lng: poi.lng }, poi.name);

    setCenter({ lat: poi.lat, lng: poi.lng });
    setZoom(14);

    setActivePin({
      title: poi.name,
      type: poi.categoryLabel,
      lat: poi.lat,
      lng: poi.lng,
      address: poi.address,
      phone: poi.phone,
      isSelectedLocation: true,
    });
  };

  // Route Polyline SVG Path
  const routeSvgPath = useMemo(() => {
    if (!activeRoute || activeRoute.coordinates.length < 2) return "";
    return activeRoute.coordinates
      .map((coord, idx) => {
        const pt = projectToScreen(coord.lat, coord.lng);
        return `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      })
      .join(" ");
  }, [activeRoute, projectToScreen]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[540px] sm:h-[620px] rounded-3xl overflow-hidden select-none border border-border bg-slate-900 shadow-lg ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsDragging(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* 1. Real Slippy Map Tile Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {visibleTiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            loading="lazy"
            crossOrigin="anonymous"
            className="absolute w-[256px] h-[256px] object-cover transition-opacity duration-200"
            style={{
              transform: `translate3d(${tile.left}px, ${tile.top}px, 0)`,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = "0.2";
            }}
          />
        ))}
      </div>

      {/* 2. Route Polyline SVG Overlay */}
      {routeSvgPath && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <path
            d={routeSvgPath}
            fill="none"
            stroke="#1E40AF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
          <path
            d={routeSvgPath}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* 3. Real Markers Overlay (Distinct Location Separation) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* A) Current Live Location Marker (Blue Pulsing Marker) */}
        {locationState.coords && (
          (() => {
            const pt = projectToScreen(
              locationState.coords.lat,
              locationState.coords.lng
            );
            const isVisible =
              pt.x >= -40 &&
              pt.x <= dimensions.width + 40 &&
              pt.y >= -40 &&
              pt.y <= dimensions.height + 40;
            if (!isVisible) return null;

            return (
              <div
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  transform: `translate3d(${pt.x - 14}px, ${pt.y - 14}px, 0)`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin({
                    title: "My Current Live Position",
                    type: "Current Location (Device GPS)",
                    lat: locationState.coords!.lat,
                    lng: locationState.coords!.lng,
                    address: locationState.isAccuracyLimited
                      ? "GPS accuracy is limited."
                      : `GPS Accuracy: ±${Math.round(
                          locationState.accuracyMeters || 10
                        )}m | Updated: ${locationState.lastUpdated || "Live"}`,
                    isCurrentLocation: true,
                  });
                }}
              >
                <div className="relative flex items-center justify-center w-7 h-7 group">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-sky-500 border-2 border-white shadow-md shadow-sky-500/50 items-center justify-center text-[10px]">
                    📍
                  </span>
                </div>
              </div>
            );
          })()
        )}

        {/* B) User-Selected Map Location Marker (Red Pin with Label) */}
        {activeSelectedLoc && (
          (() => {
            const pt = projectToScreen(
              activeSelectedLoc.lat,
              activeSelectedLoc.lng
            );
            const isVisible =
              pt.x >= -60 &&
              pt.x <= dimensions.width + 60 &&
              pt.y >= -60 &&
              pt.y <= dimensions.height + 60;
            if (!isVisible) return null;

            return (
              <div
                className="absolute pointer-events-auto cursor-pointer flex flex-col items-center z-30"
                style={{
                  transform: `translate3d(${pt.x - 20}px, ${pt.y - 48}px, 0)`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin({
                    title: activeSelectedLoc.name,
                    type: activeSelectedLoc.type || "Selected Location",
                    lat: activeSelectedLoc.lat,
                    lng: activeSelectedLoc.lng,
                    address: activeSelectedLoc.address,
                    isSelectedLocation: true,
                  });
                }}
              >
                <div className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[11px] shadow-lg border border-white whitespace-nowrap mb-1">
                  📍 {activeSelectedLoc.name || "Selected Location"}
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center text-base shadow-xl border-2 border-white ring-4 ring-amber-400/30 animate-pulse">
                  📍
                </div>
              </div>
            );
          })()
        )}

        {/* C) Nearby POI Places Markers */}
        {nearbyPlaces.map((poi) => {
          const pt = projectToScreen(poi.lat, poi.lng);
          const isVisible =
            pt.x >= -30 &&
            pt.x <= dimensions.width + 30 &&
            pt.y >= -30 &&
            pt.y <= dimensions.height + 30;
          if (!isVisible) return null;

          const icon =
            poi.category === "hotel"
              ? "🏨"
              : poi.category === "hospital"
              ? "🏥"
              : poi.category === "pharmacy"
              ? "💊"
              : poi.category === "restaurant"
              ? "🍽️"
              : poi.category === "fuel"
              ? "⛽"
              : poi.category === "station"
              ? "🚆"
              : poi.category === "atm"
              ? "🏧"
              : poi.category === "police"
              ? "🚓"
              : poi.category === "shop"
              ? "🛒"
              : "📍";

          return (
            <div
              key={poi.id}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                transform: `translate3d(${pt.x - 13}px, ${pt.y - 13}px, 0)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectNearbyPlace(poi);
              }}
            >
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-md border-2 border-white group-hover:scale-125 transition-transform">
                {icon}
              </div>
            </div>
          );
        })}

        {/* D) Emergency Facilities & Nearby Help Markers (Requirement 14) */}
        {facilities.map((fac) => {
          const pt = projectToScreen(fac.lat, fac.lng);
          const isVisible =
            pt.x >= -30 &&
            pt.x <= dimensions.width + 30 &&
            pt.y >= -30 &&
            pt.y <= dimensions.height + 30;
          if (!isVisible) return null;

          const facType = fac.type || "hospital";
          const icon =
            facType === "hospital"
              ? "🏥"
              : facType === "pharmacy"
              ? "💊"
              : facType === "emergency"
              ? "🚑"
              : facType === "doctor" || facType === "clinic"
              ? "👨‍⚕️"
              : facType === "elder_care"
              ? "🏠"
              : "🏥";

          const bgClass =
            facType === "hospital"
              ? "bg-rose-600"
              : facType === "pharmacy"
              ? "bg-emerald-600"
              : facType === "emergency"
              ? "bg-red-700"
              : facType === "doctor" || facType === "clinic"
              ? "bg-indigo-600"
              : facType === "elder_care"
              ? "bg-teal-600"
              : "bg-rose-600";

          return (
            <div
              key={fac.id}
              className="absolute pointer-events-auto cursor-pointer group z-20"
              style={{
                transform: `translate3d(${pt.x - 14}px, ${pt.y - 14}px, 0)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActivePin({
                  title: fac.name,
                  type: facType === "hospital" ? "Hospital" : facType,
                  lat: fac.lat,
                  lng: fac.lng,
                  address: `${fac.address} (${fac.distanceKm} km away)`,
                  phone: fac.phone,
                });
              }}
            >
              <div className={`w-8 h-8 rounded-full ${bgClass} text-white flex items-center justify-center text-xs shadow-md border-2 border-white group-hover:scale-125 transition-transform`}>
                {icon}
              </div>
            </div>
          );
        })}

        {/* E) Active Route Endpoints */}
        {activeRoute && (
          <>
            {(() => {
              const pt = projectToScreen(
                activeRoute.origin.lat,
                activeRoute.origin.lng
              );
              return (
                <div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    transform: `translate3d(${pt.x - 14}px, ${pt.y - 28}px, 0)`,
                  }}
                >
                  <div className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-[10px] shadow border border-white">
                    Start
                  </div>
                </div>
              );
            })()}

            {(() => {
              const pt = projectToScreen(
                activeRoute.destination.lat,
                activeRoute.destination.lng
              );
              return (
                <div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    transform: `translate3d(${pt.x - 16}px, ${pt.y - 28}px, 0)`,
                  }}
                >
                  <div className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] shadow border border-white">
                    End
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* 4. Top Controls: Clean Search Bar & Location Context Banner (Only when not provided externally) */}
      {!hideEmbeddedSearch && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-[420px] z-30 pointer-events-auto space-y-2">
          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-border shadow-md px-3 py-1.5 gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place, road, hospital, destination..."
                className="border-0 shadow-none focus-visible:ring-0 text-xs font-bold h-8 p-0 bg-transparent"
              />
              {isSearching && <span className="animate-spin text-xs">⏳</span>}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs font-bold px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-xl p-2 max-h-60 overflow-y-auto space-y-1 text-xs z-50">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full p-2.5 rounded-xl hover:bg-muted/70 text-left transition-all cursor-pointer flex items-start gap-2"
                  >
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-black text-foreground truncate">
                        {res.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {res.displayName}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Horizontal Quick Nearby POIs Chips (Requirement 12) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "hotel", label: "Hotels", icon: "🏨" },
              { id: "hospital", label: "Hospitals", icon: "🏥" },
              { id: "pharmacy", label: "Pharmacies", icon: "💊" },
              { id: "restaurant", label: "Food", icon: "🍽️" },
              { id: "fuel", label: "Petrol", icon: "⛽" },
              { id: "station", label: "Railway", icon: "🚆" },
              { id: "atm", label: "ATMs", icon: "🏧" },
              { id: "police", label: "Police", icon: "🚓" },
              { id: "shop", label: "Shops", icon: "🛒" },
            ].map((cat) => {
              const isActive = activeNearbyCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    handleToggleNearbyCategory(cat.id as NearbyCategoryType)
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black whitespace-nowrap shadow-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-600 text-white scale-102"
                      : "bg-white/90 dark:bg-slate-900/90 text-foreground hover:bg-white border border-border/80"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Destination Active Banner */}
          {activeSelectedLoc && (
            <div className="flex items-center justify-between p-2 px-3 rounded-2xl bg-rose-50/95 dark:bg-rose-950/90 border border-rose-200 text-xs shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm shrink-0">🎯</span>
                <div className="truncate">
                  <span className="font-black text-rose-950 dark:text-rose-100">
                    Selected Destination:{" "}
                  </span>
                  <span className="font-bold text-rose-800 dark:text-rose-200">
                    {activeSelectedLoc.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCenterOnSelectedLocation}
                  title="Center on this destination"
                  className="px-2 py-0.5 rounded-lg bg-rose-200 text-rose-900 text-[10px] font-black uppercase cursor-pointer hover:bg-rose-300"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInternalSelectedLocation(null);
                    onClearSelectedLocation?.();
                    setActivePin(null);
                  }}
                  className="p-1 text-rose-700 hover:text-rose-950 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Senior-Friendly Right Controls Toolbar */}
      <div className="absolute right-3 top-3 sm:top-auto sm:bottom-8 z-30 flex flex-col gap-2 pointer-events-auto">
        {/* Zoom Controls */}
        <div className="flex flex-col rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-border shadow-md overflow-hidden">
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Zoom in"
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/80 font-black text-lg transition-colors cursor-pointer border-b border-border/60"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Zoom out"
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/80 font-black text-lg transition-colors cursor-pointer"
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>

        {/* My Current Live Location Button (Requirement 2 & 14) */}
        <button
          type="button"
          onClick={handleCenterOnCurrentLocation}
          title="Center on my current live location"
          className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-border shadow-md flex items-center justify-center text-primary hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors cursor-pointer"
        >
          <Navigation className="h-5 w-5 fill-primary/20" />
        </button>

        {/* Center on Selected Destination Button (Requirement 14) */}
        {activeSelectedLoc && (
          <button
            type="button"
            onClick={handleCenterOnSelectedLocation}
            title="Center on selected destination"
            className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-700 border-2 border-rose-300 shadow-md flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer animate-pulse"
          >
            <Target className="h-5 w-5" />
          </button>
        )}

        {/* Honest Traffic Notice Toggle (Requirement 11) */}
        <button
          type="button"
          onClick={() => setTrafficModalOpen((prev) => !prev)}
          title="Traffic Information"
          className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-border shadow-md flex items-center justify-center text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors cursor-pointer"
        >
          <Car className="h-5 w-5" />
        </button>

        {/* Map Style Switcher (Road / Satellite / Terrain) - Collapsible Menu (Requirement 13 & 14) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMapTypeOpen((prev) => !prev)}
            title="Choose Map View (Road, Satellite, Terrain)"
            aria-label="Choose Map View"
            className={`w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-border shadow-md flex items-center justify-center transition-colors cursor-pointer ${
              isMapTypeOpen ? "bg-primary/10 border-primary text-primary" : "text-foreground hover:bg-muted"
            }`}
          >
            <Layers className="h-5 w-5" />
          </button>

          {isMapTypeOpen && (
            <div className="absolute right-13 bottom-0 sm:top-0 sm:bottom-auto rounded-2xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-border shadow-2xl p-1.5 flex flex-col gap-1 text-xs font-black z-50 min-w-[125px] animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] text-muted-foreground uppercase font-black tracking-wider border-b border-border/50">
                Map View
              </div>
              {(["ROAD", "SATELLITE", "TERRAIN"] as MapStyleMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setMapMode(mode);
                    setIsMapTypeOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2 ${
                    mapMode === mode
                      ? "bg-primary text-white shadow-2xs"
                      : "text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>{mode === "ROAD" ? "🗺️ Road" : mode === "SATELLITE" ? "🛰️ Satellite" : "⛰️ Terrain"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Honest Traffic Notice Banner (Requirement 11) */}
      {trafficModalOpen && (
        <div className="absolute top-28 right-3 max-w-xs z-40 p-3.5 rounded-2xl bg-amber-50 text-amber-950 border border-amber-300 shadow-xl text-xs space-y-2 pointer-events-auto animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-black text-amber-900">
              <Car className="h-4 w-4 text-amber-700" />
              <span>Live Traffic Layer Status</span>
            </div>
            <button
              type="button"
              onClick={() => setTrafficModalOpen(false)}
              className="text-amber-800 font-bold p-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-amber-900">
            {getTrafficNotice().notice}
          </p>
          <div className="text-[10px] font-bold text-amber-700 uppercase">
            Data Source: OpenStreetMap Standard Geometry
          </div>
        </div>
      )}

      {/* 7. Active Pin Bottom Sheet (Clean Action Center) */}
      {activePin && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-40 rounded-3xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-border p-4 sm:p-5 shadow-2xl space-y-3 pointer-events-auto animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                {activePin.type}
              </span>
              <h4 className="text-base font-black text-foreground mt-1">
                {activePin.title}
              </h4>
              {activePin.address && (
                <p className="text-xs text-muted-foreground font-medium mt-0.5 line-clamp-2">
                  {activePin.address}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setActivePin(null)}
              className="p-1 text-muted-foreground hover:text-foreground font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Get Route From Current Live Location (Requirement 5 & 7) */}
            {!activePin.isCurrentLocation && (
              <Button
                size="sm"
                onClick={() => {
                  const destLoc: SelectedLocationState = {
                    lat: activePin.lat,
                    lng: activePin.lng,
                    name: activePin.title,
                    address: activePin.address || "",
                    type: activePin.type,
                    selectedAt: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  };
                  setInternalSelectedLocation(destLoc);
                  onSelectLocation?.(destLoc);
                  onSelectDestination?.(
                    { lat: activePin.lat, lng: activePin.lng },
                    activePin.title
                  );
                  onRequestRouteFromCurrent?.(destLoc);
                  setActivePin(null);
                }}
                className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-white cursor-pointer"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Route From My Location</span>
              </Button>
            )}

            {/* Set as Destination without routing yet */}
            {!activePin.isCurrentLocation && !activePin.isSelectedLocation && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const destLoc: SelectedLocationState = {
                    lat: activePin.lat,
                    lng: activePin.lng,
                    name: activePin.title,
                    address: activePin.address || "",
                    type: activePin.type,
                    selectedAt: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  };
                  setInternalSelectedLocation(destLoc);
                  onSelectLocation?.(destLoc);
                  setActivePin(null);
                }}
                className="rounded-xl font-bold text-xs gap-1 cursor-pointer border-rose-300 text-rose-800"
              >
                <Target className="h-3.5 w-3.5" />
                <span>Select Place</span>
              </Button>
            )}

            {activePin.phone && (
              <a
                href={`tel:${activePin.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call: {activePin.phone}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 8. Bottom Legal Attribution (Mandatory for OpenStreetMap & Esri) */}
      <div className="absolute bottom-1 left-3 z-20 pointer-events-none text-[10px] text-black/70 dark:text-white/70 bg-white/70 dark:bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-xs font-medium">
        © OpenStreetMap contributors • Esri • OpenTopoMap
      </div>
    </div>
  );
}
