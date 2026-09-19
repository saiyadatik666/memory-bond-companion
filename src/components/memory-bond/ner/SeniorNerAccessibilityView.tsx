import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";
import { nerApiService } from "@/lib/ner/nerApiService";
import { NerSmartMap } from "./NerSmartMap";
import {
  DEMO_ROADS,
  DEMO_BRIDGES,
  DEMO_DISRUPTION_RISKS,
  DEMO_VEHICLES,
  DEMO_ESSENTIAL_SHIPMENTS,
  DEMO_INCIDENT_REPORTS,
  DEMO_DISTRICT_CONNECTIVITY,
} from "@/lib/ner/nerDemoData";

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
  const [activeModal, setActiveModal] = useState<"check" | "route" | "alert" | "emergency" | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState("Kamrup Metropolitan (Guwahati)");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [routeFrom, setRouteFrom] = useState("Guwahati");
  const [routeTo, setRouteTo] = useState("Shillong");

  const transparency = nerApiService.getTransparencyMetadata(!store.isOnline || store.offlineModeForced);

  const speakMessage = (text: string) => {
    stopSpeaking();
    speakText(text, speechLocale || "en-IN");
  };

  const handleCheckRoad = () => {
    setActiveModal("check");
    const isHaflong = selectedDistrict.includes("Dima Hasao");
    const isGuwahati = selectedDistrict.includes("Guwahati");
    let msg = "";

    if (isHaflong) {
      msg = "Notice: NH-27 at Dima Hasao is currently blocked near Jatinga due to a mudslide. Please do not travel there today.";
    } else if (isGuwahati) {
      msg = "Good news! Roads in Guwahati and the Brahmaputra bridges are open and accessible.";
    } else {
      msg = `In ${selectedDistrict}, roads have limited accessibility. Travel during daylight hours is advised.`;
    }

    setStatusMessage(msg);
    speakMessage(msg);
  };

  const handleGetRouteHelp = () => {
    setActiveModal("route");
    const isSilchar = routeTo.toLowerCase().includes("silchar");
    let msg = "";

    if (isSilchar) {
      msg = "Guwahati to Silchar via Haflong is blocked. However, the alternative route through Meghalaya via Lad Rymbai is currently moving with single-lane convoys.";
    } else {
      msg = `Route from ${routeFrom} to ${routeTo} is accessible. Normal travel time is expected.`;
    }

    setStatusMessage(msg);
    speakMessage(msg);
  };

  const handleTravelAlert = () => {
    setActiveModal("alert");
    const msg = "Current Travel Alerts: Active landslide block on NH-27 at Jatinga, and heavy monsoon downpour near Cherrapunji. All other key city roads are operating.";
    setStatusMessage(msg);
    speakMessage(msg);
  };

  const handleEmergencyRoute = () => {
    setActiveModal("emergency");
    const msg = "Emergency Green Corridor: The route between Guwahati Medical College and Silchar via Shillong is officially designated for ambulances and medical vehicles.";
    setStatusMessage(msg);
    speakMessage(msg);
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto px-3 sm:px-6 space-y-6 pb-16 select-none box-border">
      {/* 1. Transparent Demo / Simulation Badge */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/30 p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs text-amber-950 dark:text-amber-200 font-bold shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-base">ℹ️</span>
          <span>{transparency.dataSource} — {transparency.notice}</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 text-[11px] font-black uppercase">
          {transparency.connectionStatus}
        </span>
      </div>

      {/* 2. Header: Road & Travel Help */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
              Senior Travel Companion
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#0F243E] dark:text-white tracking-tight mt-1.5 flex items-center gap-2">
            <span>Road & Travel Help</span>
            <span className="text-sky-600">🛣️</span>
          </h1>
          <p className="text-base sm:text-lg font-bold text-[#5B728D] dark:text-slate-300 mt-0.5">
            Safe road checks, travel advice & emergency routes in simple language.
          </p>
        </div>

        {/* Voice read aloud header trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="lg"
            variant="outline"
            onClick={() =>
              speakMessage(
                "Welcome to Road and Travel Help. You can tap Check Road, Get Route Help, Travel Alert, or Emergency Route. Or tap the microphone to speak to me."
              )
            }
            className="rounded-2xl font-black text-sm text-[#1E6FD9] border-[#D0E2FF] bg-[#F4F8FD] hover:bg-[#EBF3FC] gap-2 h-12 shadow-2xs cursor-pointer"
          >
            <Volume2 className="h-5 w-5" />
            <span>Read Options Aloud</span>
          </Button>
        </div>
      </div>

      {/* 3. FOUR VERY LARGE TOUCH BUTTONS (Requirement 17) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
        {/* Button 1: CHECK ROAD */}
        <button
          type="button"
          onClick={handleCheckRoad}
          className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border-3 border-emerald-300 hover:border-emerald-500 text-left transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex flex-col justify-between min-h-[160px] group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
              🛣️
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Check Status
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-[#0F243E] dark:text-white group-hover:text-emerald-700 transition-colors">
              CHECK ROAD
            </h2>
            <p className="text-sm font-bold text-[#5B728D] dark:text-slate-300 mt-1">
              "Is the road open or blocked today?"
            </p>
          </div>
        </button>

        {/* Button 2: GET ROUTE HELP */}
        <button
          type="button"
          onClick={handleGetRouteHelp}
          className="p-6 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-sky-50/40 border-3 border-sky-300 hover:border-sky-500 text-left transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex flex-col justify-between min-h-[160px] group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-3xl shadow-md shadow-sky-600/25 group-hover:scale-105 transition-transform">
              🔄
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-sky-800 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
              Safe Path
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-[#0F243E] dark:text-white group-hover:text-sky-700 transition-colors">
              GET ROUTE HELP
            </h2>
            <p className="text-sm font-bold text-[#5B728D] dark:text-slate-300 mt-1">
              "Show me the safest alternate route"
            </p>
          </div>
        </button>

        {/* Button 3: TRAVEL ALERT */}
        <button
          type="button"
          onClick={handleTravelAlert}
          className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-3 border-amber-300 hover:border-amber-500 text-left transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex flex-col justify-between min-h-[160px] group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-3xl shadow-md shadow-amber-600/25 group-hover:scale-105 transition-transform">
              ⚠️
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              Weather & Landslide
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-[#0F243E] dark:text-white group-hover:text-amber-800 transition-colors">
              TRAVEL ALERT
            </h2>
            <p className="text-sm font-bold text-[#5B728D] dark:text-slate-300 mt-1">
              "Tell me if there is any flood or hazard"
            </p>
          </div>
        </button>

        {/* Button 4: EMERGENCY ROUTE */}
        <button
          type="button"
          onClick={handleEmergencyRoute}
          className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-rose-50/40 border-3 border-rose-300 hover:border-rose-500 text-left transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex flex-col justify-between min-h-[160px] group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-3xl shadow-md shadow-rose-600/25 group-hover:scale-105 transition-transform">
              🚑
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
              Medical & Evacuation
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-black text-[#0F243E] dark:text-white group-hover:text-rose-700 transition-colors">
              EMERGENCY ROUTE
            </h2>
            <p className="text-sm font-bold text-[#5B728D] dark:text-slate-300 mt-1">
              "Find hospitals and verified clear paths"
            </p>
          </div>
        </button>
      </div>

      {/* 4. Active Result Card with Audio Speaker */}
      {statusMessage && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-primary/40 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📢</span>
              <h3 className="text-lg font-black text-foreground">
                Assistant Response
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

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 text-base font-bold text-foreground leading-relaxed">
            {statusMessage}
          </div>

          {activeModal === "check" && (
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="text-xs font-bold text-muted-foreground self-center">
                Select your area:
              </span>
              {[
                "Kamrup Metropolitan (Guwahati)",
                "Dima Hasao (Haflong)",
                "East Khasi Hills (Shillong)",
                "Cachar (Silchar)",
              ].map((dst) => (
                <button
                  key={dst}
                  type="button"
                  onClick={() => {
                    setSelectedDistrict(dst);
                    if (dst.includes("Dima Hasao")) {
                      const m = "Notice: NH-27 at Dima Hasao is currently blocked near Jatinga due to a mudslide. Please avoid this route today.";
                      setStatusMessage(m);
                      speakMessage(m);
                    } else if (dst.includes("Guwahati")) {
                      const m = "Good news! Roads in Guwahati and the Brahmaputra bridges are open and fully accessible.";
                      setStatusMessage(m);
                      speakMessage(m);
                    } else {
                      const m = `In ${dst}, roads have limited accessibility. Travel in daylight only.`;
                      setStatusMessage(m);
                      speakMessage(m);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    selectedDistrict === dst
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {dst.split("(")[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Simplified Smart Map for Seniors */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-foreground">
              Regional Road Map
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Green roads are open. Red roads have blockages.
            </p>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            Tap on any city circle
          </span>
        </div>

        <NerSmartMap
          roads={DEMO_ROADS}
          bridges={DEMO_BRIDGES}
          risks={DEMO_DISRUPTION_RISKS}
          vehicles={DEMO_VEHICLES}
          shipments={DEMO_ESSENTIAL_SHIPMENTS}
          incidents={DEMO_INCIDENT_REPORTS}
          districts={DEMO_DISTRICT_CONNECTIVITY}
          isSeniorMode={true}
        />
      </div>

      {/* 6. Friendly AI Voice Floating Action Bar for Seniors */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
            🎙️
          </div>
          <div>
            <h3 className="text-lg font-black">Ask by Speaking Anytime</h3>
            <p className="text-xs text-white/90 font-medium">
              Say: "Is the road open?", "Where is the medicine vehicle?", or "Show road alerts"
            </p>
          </div>
        </div>

        <Button
          size="lg"
          onClick={onOpenVoiceAssistant}
          className="w-full sm:w-auto h-12 px-6 rounded-2xl font-black text-sm bg-white text-sky-700 hover:bg-white/90 active:scale-95 shadow-md cursor-pointer shrink-0"
        >
          <span>Tap to Speak Now</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
