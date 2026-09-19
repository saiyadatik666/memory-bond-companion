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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  latLngToPixel,
  pixelToLatLng,
  getTileUrl,
  calculateDistanceKm,
  searchPlacesNominatim,
  calculateRouteOSRM,
  fetchLiveWeatherOpenMeteo,
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
} from "@/types/realSafetyMap";

interface RealInteractiveMapProps {
  initialCenter?: LatLng;
  initialZoom?: number;
  locationState: LocationState;
  onCenterOnLocation: () => void;
  activeRoute?: RealRouteResult | null;
  onSelectDestination?: (dest: LatLng, name: string) => void;
  facilities?: EmergencyFacility[];
  isSeniorMode?: boolean;
  className?: string;
}

export function RealInteractiveMap({
  initialCenter = DEFAULT_NER_CENTER,
  initialZoom = 11,
  locationState,
  onCenterOnLocation,
  activeRoute,
  onSelectDestination,
  facilities = [],
  isSeniorMode = false,
  className = "",
}: RealInteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Map state
  const [center, setCenter] = useState<LatLng>(initialCenter);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [mapMode, setMapMode] = useState<MapStyleMode>("ROAD");
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; center: LatLng } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);

  // Selected Pin Bottom Sheet
  const [activePin, setActivePin] = useState<{
    title: string;
    type: string;
    lat: number;
    lng: number;
    address?: string;
    phone?: string | null;
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

  // Sync center when user's location is acquired
  useEffect(() => {
    if (locationState.coords && locationState.permissionStatus === "granted") {
      setCenter(locationState.coords);
    }
  }, [locationState.coords]);

  // Center on active route if provided
  useEffect(() => {
    if (activeRoute && activeRoute.coordinates.length > 0) {
      const midIdx = Math.floor(activeRoute.coordinates.length / 2);
      setCenter(activeRoute.coordinates[midIdx]);
      setZoom(10);
    }
  }, [activeRoute]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
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

    // Convert pixel delta back to LatLng delta
    const currentPixel = latLngToPixel(dragStartRef.current.center.lat, dragStartRef.current.center.lng, zoom);
    const newPixel = { x: currentPixel.x - dx, y: currentPixel.y - dy };
    const newCenter = pixelToLatLng(newPixel.x, newPixel.y, zoom);
    setCenter(newCenter);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Touch handlers for mobile
  const touchStartRef = useRef<{ x: number; y: number; center: LatLng } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
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

      const currentPixel = latLngToPixel(touchStartRef.current.center.lat, touchStartRef.current.center.lng, zoom);
      const newPixel = { x: currentPixel.x - dx, y: currentPixel.y - dy };
      const newCenter = pixelToLatLng(newPixel.x, newPixel.y, zoom);
      setCenter(newCenter);
    }
  };

  // Zoom helpers
  const zoomIn = () => setZoom((z) => Math.min(z + 1, 18));
  const zoomOut = () => setZoom((z) => Math.max(z - 1, 4));

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  // Calculate Visible Tiles using Web Mercator math
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
        if (y < 0 || y >= maxTile) continue; // Y coordinates are bounded
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

  // Search input handler
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchPlacesNominatim(searchQuery, center.lat, center.lng);
    setSearchResults(results);
    setIsSearching(false);
    setShowSearchDropdown(true);
  };

  const handleSelectSearchResult = (place: PlaceSearchResult) => {
    setCenter({ lat: place.lat, lng: place.lng });
    setZoom(13);
    setSelectedPlace(place);
    setShowSearchDropdown(false);
    setActivePin({
      title: place.name,
      type: place.category || "Search Result",
      lat: place.lat,
      lng: place.lng,
      address: place.displayName,
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
      className={`relative w-full h-[520px] sm:h-[600px] rounded-3xl overflow-hidden select-none border border-border bg-slate-900 shadow-lg ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
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
              // Graceful fallback for occasional tile failure
              (e.target as HTMLImageElement).style.opacity = "0.2";
            }}
          />
        ))}
      </div>

      {/* 2. Route Polyline SVG Overlay */}
      {routeSvgPath && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {/* Route casing for contrast */}
          <path
            d={routeSvgPath}
            fill="none"
            stroke="#1E40AF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
          {/* Route primary line */}
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

      {/* 3. Real Markers Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* User Current Location Marker */}
        {locationState.coords && (
          (() => {
            const pt = projectToScreen(locationState.coords.lat, locationState.coords.lng);
            const isVisible =
              pt.x >= -30 && pt.x <= dimensions.width + 30 && pt.y >= -30 && pt.y <= dimensions.height + 30;
            if (!isVisible) return null;

            return (
              <div
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  transform: `translate3d(${pt.x - 14}px, ${pt.y - 14}px, 0)`,
                }}
                onClick={() =>
                  setActivePin({
                    title: "My Current Position",
                    type: "Current Location",
                    lat: locationState.coords!.lat,
                    lng: locationState.coords!.lng,
                    address: locationState.isAccuracyLimited
                      ? "Location accuracy is limited."
                      : `GPS Accuracy: ±${Math.round(locationState.accuracyMeters || 10)} meters`,
                  })
                }
              >
                <div className="relative flex items-center justify-center w-7 h-7">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-sky-500 border-2 border-white shadow-md shadow-sky-500/50 items-center justify-center text-[10px]">
                    📍
                  </span>
                </div>
              </div>
            );
          })()
        )}

        {/* Searched Place Pin */}
        {selectedPlace && (
          (() => {
            const pt = projectToScreen(selectedPlace.lat, selectedPlace.lng);
            return (
              <div
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  transform: `translate3d(${pt.x - 14}px, ${pt.y - 32}px, 0)`,
                }}
                onClick={() =>
                  setActivePin({
                    title: selectedPlace.name,
                    type: selectedPlace.category || "Search Result",
                    lat: selectedPlace.lat,
                    lng: selectedPlace.lng,
                    address: selectedPlace.displayName,
                  })
                }
              >
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-sm shadow-lg border-2 border-white">
                  📍
                </div>
              </div>
            );
          })()
        )}

        {/* Active Route Origin & Destination Markers */}
        {activeRoute && (
          <>
            {(() => {
              const pt = projectToScreen(activeRoute.origin.lat, activeRoute.origin.lng);
              return (
                <div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{ transform: `translate3d(${pt.x - 12}px, ${pt.y - 28}px, 0)` }}
                >
                  <div className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-[10px] shadow border border-white">
                    Start
                  </div>
                </div>
              );
            })()}

            {(() => {
              const pt = projectToScreen(activeRoute.destination.lat, activeRoute.destination.lng);
              return (
                <div
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{ transform: `translate3d(${pt.x - 12}px, ${pt.y - 28}px, 0)` }}
                >
                  <div className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] shadow border border-white">
                    Destination
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Nearby Emergency Facilities Markers */}
        {facilities.map((fac) => {
          const pt = projectToScreen(fac.lat, fac.lng);
          const isVisible =
            pt.x >= -30 && pt.x <= dimensions.width + 30 && pt.y >= -30 && pt.y <= dimensions.height + 30;
          if (!isVisible) return null;

          return (
            <div
              key={fac.id}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                transform: `translate3d(${pt.x - 14}px, ${pt.y - 14}px, 0)`,
              }}
              onClick={() =>
                setActivePin({
                  title: fac.name,
                  type: fac.type === "hospital" ? "Hospital / Medical Center" : fac.type,
                  lat: fac.lat,
                  lng: fac.lng,
                  address: `${fac.address} (${fac.distanceKm} km away)`,
                  phone: fac.phone,
                })
              }
            >
              <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-md border-2 border-white group-hover:scale-115 transition-transform">
                🏥
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Top Real Search Bar */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-96 z-30 pointer-events-auto">
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
                className="text-muted-foreground hover:text-foreground text-xs font-bold px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-xl p-2 max-h-60 overflow-y-auto space-y-1 text-xs">
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full p-2.5 rounded-xl hover:bg-muted/70 text-left transition-all cursor-pointer flex items-start gap-2"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-black text-foreground truncate">{res.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{res.displayName}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* 5. Senior-Friendly Controls Toolbar (Large buttons on Right) */}
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

        {/* My Location Button */}
        <button
          type="button"
          onClick={onCenterOnLocation}
          title="Center on my current location"
          className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-border shadow-md flex items-center justify-center text-primary hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors cursor-pointer"
        >
          <Navigation className="h-5 w-5 fill-primary/20" />
        </button>

        {/* Map Style Switcher (Road / Satellite / Terrain) */}
        <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-border shadow-md p-1 flex flex-col gap-1 text-[10px] font-black">
          {(["ROAD", "SATELLITE", "TERRAIN"] as MapStyleMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMapMode(mode)}
              className={`px-2 py-1.5 rounded-xl transition-all cursor-pointer ${
                mapMode === mode
                  ? "bg-primary text-white shadow-2xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {mode === "ROAD" ? "Road" : mode === "SATELLITE" ? "Satellite" : "Terrain"}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Active Pin Information Bottom Sheet */}
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
            {onSelectDestination && (
              <Button
                size="sm"
                onClick={() => {
                  onSelectDestination({ lat: activePin.lat, lng: activePin.lng }, activePin.title);
                  setActivePin(null);
                }}
                className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-white cursor-pointer"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Get Route</span>
              </Button>
            )}

            {activePin.phone ? (
              <a
                href={`tel:${activePin.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call: {activePin.phone}</span>
              </a>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">
                Phone not publicly listed
              </span>
            )}
          </div>
        </div>
      )}

      {/* 7. Bottom Legal Attribution (Mandatory for OpenStreetMap & Esri) */}
      <div className="absolute bottom-1 left-3 z-20 pointer-events-none text-[10px] text-black/70 dark:text-white/70 bg-white/70 dark:bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-xs font-medium">
        © OpenStreetMap contributors • Esri • OpenTopoMap
      </div>
    </div>
  );
}
