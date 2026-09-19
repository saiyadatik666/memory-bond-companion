import { useState, useMemo } from "react";
import {
  Layers,
  MapPin,
  AlertTriangle,
  Truck,
  Shield,
  Navigation,
  Eye,
  EyeOff,
  CloudRain,
  Info,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  MapLayerState,
  RoadStatus,
  BridgeStatus,
  DisruptionRisk,
  VehicleTrackingRecord,
  EssentialShipmentRecord,
  FieldIncidentReport,
  DistrictConnectivityRecord,
} from "@/types/nerLogistics";

interface NerSmartMapProps {
  roads: RoadStatus[];
  bridges: BridgeStatus[];
  risks: DisruptionRisk[];
  vehicles: VehicleTrackingRecord[];
  shipments: EssentialShipmentRecord[];
  incidents: FieldIncidentReport[];
  districts: DistrictConnectivityRecord[];
  isSeniorMode?: boolean;
}

// Visual Node Coordinates mapped onto an SVG canvas (viewBox 0 0 900 650)
interface MapNode {
  id: string;
  name: string;
  state: string;
  x: number;
  y: number;
  status: "OPEN" | "PARTIAL" | "BLOCKED" | "GOOD" | "DISRUPTED";
  district: string;
}

const NER_NODES: MapNode[] = [
  { id: "node-guw", name: "Guwahati", state: "Assam", x: 280, y: 320, status: "OPEN", district: "Kamrup Metropolitan" },
  { id: "node-shl", name: "Shillong", state: "Meghalaya", x: 290, y: 390, status: "GOOD", district: "East Khasi Hills" },
  { id: "node-haf", name: "Haflong", state: "Assam", x: 420, y: 410, status: "BLOCKED", district: "Dima Hasao" },
  { id: "node-sil", name: "Silchar", state: "Assam", x: 410, y: 470, status: "PARTIAL", district: "Cachar" },
  { id: "node-ita", name: "Itanagar", state: "Arunachal Pradesh", x: 490, y: 220, status: "OPEN", district: "Papum Pare" },
  { id: "node-taw", name: "Tawang", state: "Arunachal Pradesh", x: 240, y: 150, status: "PARTIAL", district: "Tawang" },
  { id: "node-dib", name: "Dibrugarh", state: "Assam", x: 670, y: 180, status: "OPEN", district: "Dibrugarh" },
  { id: "node-koh", name: "Kohima", state: "Nagaland", x: 570, y: 360, status: "PARTIAL", district: "Kohima" },
  { id: "node-imp", name: "Imphal", state: "Manipur", x: 560, y: 460, status: "PARTIAL", district: "Imphal West" },
  { id: "node-aiz", name: "Aizawl", state: "Mizoram", x: 430, y: 560, status: "GOOD", district: "Aizawl" },
  { id: "node-aga", name: "Agartala", state: "Tripura", x: 260, y: 520, status: "GOOD", district: "West Tripura" },
  { id: "node-gtx", name: "Gangtok", state: "Sikkim", x: 80, y: 190, status: "DISRUPTED", district: "East Sikkim" },
];

// Major corridors connecting the nodes
const CORRIDORS = [
  { from: "node-gtx", to: "node-guw", id: "nh-10-to-27", label: "NH-10 / NH-27 Corridor", status: "PARTIAL" },
  { from: "node-guw", to: "node-shl", id: "nh-6-guw-shl", label: "NH-6 Guwahati-Shillong Expwy", status: "OPEN" },
  { from: "node-shl", to: "node-sil", id: "nh-6-shl-sil", label: "NH-6 Jowai-Lad Rymbai-Silchar", status: "PARTIAL" },
  { from: "node-guw", to: "node-haf", id: "nh-27-lumding-haf", label: "NH-27 Lumding-Haflong", status: "BLOCKED" },
  { from: "node-haf", to: "node-sil", id: "nh-27-haf-sil", label: "NH-27 Jatinga-Silchar Stretch", status: "BLOCKED" },
  { from: "node-guw", to: "node-ita", id: "nh-15-ita", label: "NH-15 Brahmaputra North Bank", status: "OPEN" },
  { from: "node-guw", to: "node-taw", id: "nh-13-taw", label: "NH-13 Bhalukpong-Tawang", status: "PARTIAL" },
  { from: "node-ita", to: "node-dib", id: "nh-52-dib", label: "NH-52 Pasighat-Dibrugarh (Bogibeel)", status: "OPEN" },
  { from: "node-dib", to: "node-koh", id: "nh-29-koh", label: "NH-29 Dimapur-Kohima Link", status: "PARTIAL" },
  { from: "node-koh", to: "node-imp", id: "nh-2-imp", label: "NH-2 Kohima-Imphal Highway", status: "OPEN" },
  { from: "node-sil", to: "node-aiz", id: "nh-306-aiz", label: "NH-306 Silchar-Vairengte-Aizawl", status: "OPEN" },
  { from: "node-sil", to: "node-aga", id: "nh-8-aga", label: "NH-8 Badarpur-Karimganj-Agartala", status: "OPEN" },
];

export function NerSmartMap({
  roads,
  bridges,
  risks,
  vehicles,
  shipments,
  incidents,
  districts,
  isSeniorMode = false,
}: NerSmartMapProps) {
  // Layer toggles
  const [layers, setLayers] = useState<MapLayerState>({
    roads: true,
    bridges: !isSeniorMode,
    blockedRoads: true,
    incidents: !isSeniorMode,
    landslideRisk: !isSeniorMode,
    floodRisk: !isSeniorMode,
    vehicles: !isSeniorMode,
    essentialGoods: true,
    districtConnectivity: false,
    suggestedAlternateRoutes: true,
    emergencyAccessibility: true,
  });

  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(!isSeniorMode);

  const toggleLayer = (key: keyof MapLayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const nodeMap = useMemo(() => {
    const map = new Map<string, MapNode>();
    NER_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  return (
    <div className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Map Header & Legend Control Bar */}
      <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-primary flex items-center justify-center font-black">
            <Navigation className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-foreground">
                NER Smart Accessibility Map
              </h3>
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Demo Map View
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              Interactive 8-State North Eastern Regional Logistics & Disruption Topology
            </p>
          </div>
        </div>

        {/* Toggle layer toolbar for Caregiver mode */}
        {!isSeniorMode && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsLayerControlOpen(!isLayerControlOpen)}
            className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{isLayerControlOpen ? "Hide Layer Controls" : "Configure 11 Layers"}</span>
          </Button>
        )}
      </div>

      {/* Layer Toggles Panel (Collapsible) */}
      {isLayerControlOpen && !isSeniorMode && (
        <div className="p-3 sm:p-4 bg-background/80 border-b border-border/60 text-xs font-semibold">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
            <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              Active Visual Layers (11 Total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setLayers({
                    roads: true,
                    bridges: true,
                    blockedRoads: true,
                    incidents: true,
                    landslideRisk: true,
                    floodRisk: true,
                    vehicles: true,
                    essentialGoods: true,
                    districtConnectivity: true,
                    suggestedAlternateRoutes: true,
                    emergencyAccessibility: true,
                  })
                }
                className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
              >
                Turn All ON
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={() =>
                  setLayers({
                    roads: true,
                    bridges: false,
                    blockedRoads: true,
                    incidents: false,
                    landslideRisk: false,
                    floodRisk: false,
                    vehicles: false,
                    essentialGoods: false,
                    districtConnectivity: false,
                    suggestedAlternateRoutes: false,
                    emergencyAccessibility: false,
                  })
                }
                className="text-[11px] text-muted-foreground hover:underline font-bold cursor-pointer"
              >
                Reset Simple
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { key: "roads", label: "1. Roads", icon: "🛣️" },
              { key: "bridges", label: "2. Bridges", icon: "🌉" },
              { key: "blockedRoads", label: "3. Blocked Roads", icon: "⛔" },
              { key: "incidents", label: "4. Incidents", icon: "⚠️" },
              { key: "landslideRisk", label: "5. Landslide Risk", icon: "⛰️" },
              { key: "floodRisk", label: "6. Flood Risk", icon: "🌊" },
              { key: "vehicles", label: "7. Vehicles", icon: "🚚" },
              { key: "essentialGoods", label: "8. Essential Goods", icon: "💊" },
              { key: "districtConnectivity", label: "9. Districts", icon: "🗺️" },
              { key: "suggestedAlternateRoutes", label: "10. Alternate Routes", icon: "🔄" },
              { key: "emergencyAccessibility", label: "11. Emergency Access", icon: "🛡️" },
            ].map((layerItem) => {
              const active = layers[layerItem.key as keyof MapLayerState];
              return (
                <button
                  key={layerItem.key}
                  type="button"
                  onClick={() => toggleLayer(layerItem.key as keyof MapLayerState)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] transition-all cursor-pointer font-bold ${
                    active
                      ? "bg-primary/10 border-primary text-primary font-black shadow-2xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{layerItem.icon}</span>
                  <span className="truncate">{layerItem.label}</span>
                  {active ? <Eye className="h-3 w-3 ml-auto shrink-0" /> : <EyeOff className="h-3 w-3 ml-auto shrink-0 opacity-50" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SVG Canvas Map */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[560px] bg-gradient-to-b from-[#0F1E33] via-[#10243E] to-[#0A1626] text-white select-none overflow-hidden">
        {/* Subtle Map Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
          <defs>
            <pattern id="ner-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ner-grid)" />
        </svg>

        {/* Interactive SVG Layer Topology */}
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Layer 1: Road Corridors */}
          {layers.roads && (
            <g id="layer-corridors">
              {CORRIDORS.map((c) => {
                const n1 = nodeMap.get(c.from);
                const n2 = nodeMap.get(c.to);
                if (!n1 || !n2) return null;

                const isBlocked = c.status === "BLOCKED";
                const isPartial = c.status === "PARTIAL";

                let strokeColor = "#10B981"; // Green (Open)
                let strokeDash = "none";
                let strokeWidth = 3;

                if (isBlocked && layers.blockedRoads) {
                  strokeColor = "#EF4444"; // Red (Blocked)
                  strokeDash = "6 4";
                  strokeWidth = 4;
                } else if (isPartial) {
                  strokeColor = "#F59E0B"; // Amber (Partial)
                  strokeDash = "8 3";
                  strokeWidth = 3.5;
                }

                return (
                  <g key={c.id}>
                    <line
                      x1={n1.x}
                      y1={n1.y}
                      x2={n2.x}
                      y2={n2.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      strokeLinecap="round"
                      opacity={0.85}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Layer 10: Suggested Alternate Green Bypass Route (Guwahati to Silchar via Meghalaya) */}
          {layers.suggestedAlternateRoutes && (
            <g id="layer-alt-routes" opacity={0.95}>
              <path
                d="M 280 320 Q 300 370 290 390 T 360 440 T 410 470"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="4"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Layer 11: Emergency Accessible Corridors */}
          {layers.emergencyAccessibility && (
            <g id="layer-emergency-corridors">
              <line
                x1={410}
                y1={470}
                x2={260}
                y2={520}
                stroke="#A855F7"
                strokeWidth="3.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                opacity={0.9}
              />
            </g>
          )}

          {/* Layer 5: Landslide Risk Area Halo */}
          {layers.landslideRisk && (
            <g id="layer-landslide-zones">
              <circle cx={420} cy={410} r={32} fill="#EF4444" opacity={0.25} />
              <circle cx={420} cy={410} r={20} fill="#EF4444" opacity={0.35} />
              <text x={430} y={395} fill="#FCA5A5" fontSize="10" fontWeight="900">
                ⛰️ Landslide Zone
              </text>
            </g>
          )}

          {/* Layer 6: Flood Risk Area Halo */}
          {layers.floodRisk && (
            <g id="layer-flood-zones">
              <circle cx={530} cy={270} r={28} fill="#3B82F6" opacity={0.25} />
              <text x={540} y={265} fill="#93C5FD" fontSize="10" fontWeight="900">
                🌊 Brahmaputra Spate
              </text>
            </g>
          )}

          {/* Layer 2: Bridges */}
          {layers.bridges && (
            <g id="layer-bridges">
              {/* Saraighat Bridge near Guwahati */}
              <circle cx={295} cy={305} r={7} fill="#0EA5E9" stroke="#FFF" strokeWidth="2" />
              {/* Bogibeel Bridge near Dibrugarh */}
              <circle cx={655} cy={165} r={7} fill="#0EA5E9" stroke="#FFF" strokeWidth="2" />
            </g>
          )}

          {/* Layer 7 & 8: Active Vehicles & Essential Goods Shipments */}
          {layers.vehicles && (
            <g id="layer-vehicles">
              {/* Vehicle 1 (Medicine carrier near Lad Rymbai) */}
              <g transform="translate(350, 430)">
                <circle cx={0} cy={0} r={11} fill="#0D9488" stroke="#FFF" strokeWidth="2" />
                <text x={-6} y={4} fontSize="11">💊</text>
              </g>
              {/* Vehicle 2 (Food carrier near Dirang) */}
              <g transform="translate(360, 185)">
                <circle cx={0} cy={0} r={11} fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
                <text x={-6} y={4} fontSize="11">🚚</text>
              </g>
            </g>
          )}

          {/* Regional Hub Nodes */}
          <g id="layer-nodes">
            {NER_NODES.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              let fill = "#10B981"; // Open/Good
              if (node.status === "BLOCKED" || node.status === "DISRUPTED") fill = "#EF4444";
              else if (node.status === "PARTIAL") fill = "#F59E0B";

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Outer Pulsing Ring if Selected or Blocked */}
                  {(isSelected || node.status === "BLOCKED") && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={15}
                      fill={fill}
                      opacity={0.35}
                      className="animate-ping"
                    />
                  )}
                  {/* Outer selection border */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 10 : 7.5}
                    fill={fill}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  {/* Label */}
                  <text
                    x={node.x + 11}
                    y={node.y + 4}
                    fill="#FFFFFF"
                    fontSize={isSelected ? "12" : "11"}
                    fontWeight={isSelected ? "900" : "700"}
                    className="drop-shadow-md"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Details Popup Card */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-foreground border border-border shadow-xl space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-black tracking-tight">{selectedNode.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">District:</span>
                <span className="font-bold">{selectedNode.district} ({selectedNode.state})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedNode.status === "OPEN" || selectedNode.status === "GOOD"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : selectedNode.status === "BLOCKED" || selectedNode.status === "DISRUPTED"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {selectedNode.status}
                </span>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-muted-foreground border-t border-border/60">
              {selectedNode.status === "BLOCKED"
                ? "⚠️ Active landslide reported on NH-27 approaches. Heavy trucks held at staging posts."
                : selectedNode.status === "PARTIAL"
                ? "⚠️ Single-lane convoy or weather-regulated movement in effect."
                : "✓ Corridors clear for all verified essential and passenger transport."}
            </div>
          </div>
        )}

        {/* Legend Overlay at Top-Right */}
        <div className="absolute top-3 right-3 p-2.5 rounded-2xl bg-black/60 backdrop-blur-sm text-[11px] font-bold text-white border border-white/10 hidden md:block space-y-1">
          <div className="text-[10px] uppercase text-white/60 tracking-wider font-extrabold pb-0.5">
            Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Accessible Road</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Limited / Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Blocked / Severe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            <span>AI Alternate Bypass</span>
          </div>
        </div>
      </div>
    </div>
  );
}
