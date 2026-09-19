import { useState } from "react";
import {
  MapPin,
  Shield,
  AlertCircle,
  CheckCircle2,
  Lock,
  Compass,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationPermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDismiss: () => void;
  isDenied?: boolean;
}

export function LocationPermissionModal({
  isOpen,
  onAllow,
  onDismiss,
  isDenied = false,
}: LocationPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-border p-6 shadow-2xl space-y-5 text-center">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-sky-100 dark:bg-sky-950/60 text-primary flex items-center justify-center text-3xl shadow-sm">
          {isDenied ? "⚠️" : "📍"}
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-black border border-emerald-200">
            <Lock className="h-3.5 w-3.5" />
            <span>Private & Confidential • Sharing is OFF</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            {isDenied ? "Location access is turned off" : "Location Permission"}
          </h3>

          <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
            {isDenied
              ? "Turn on location permission in your browser or phone settings to use live navigation, nearby hospital search, and weather warnings."
              : "Memory Bond needs your location to show your position, nearby roads, weather alerts and safety information."}
          </p>
        </div>

        {/* Privacy reassurance callout */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs text-left text-muted-foreground font-medium space-y-1">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Privacy Guarantee:</span>
          </div>
          <p>
            Your live coordinates stay strictly on your device. Family members or caregivers never receive continuous tracking unless you explicitly choose to share.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            size="lg"
            onClick={onAllow}
            className="w-full h-12 rounded-2xl font-black text-sm bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-md"
          >
            {isDenied ? "Try Again" : "Allow Location"}
          </Button>

          <Button
            variant="ghost"
            onClick={onDismiss}
            className="w-full h-11 rounded-2xl font-bold text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Not Now (Continue with Regional Map)
          </Button>
        </div>
      </div>
    </div>
  );
}
