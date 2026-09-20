import {
  Settings,
  Type,
  Eye,
  Shield,
  RotateCcw,
  Smartphone,
  Sparkles,
  Award,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { RegionalLanguageSection } from "./RegionalLanguageSection";
import { INDIAN_STATES } from "@/lib/panIndiaCulturalRepository";
import { MemoryBondLogo } from "./MemoryBondLogo";

export function SettingsView({ store }: { store: MemoryBondStore }) {
  const handleFontSizeChange = (size: "normal" | "large" | "xlarge") => {
    store.updateProfile({ font_size: size });
  };

  const handleContrastToggle = (checked: boolean) => {
    store.updateProfile({ high_contrast: checked });
  };

  const handleVoiceToggle = (checked: boolean) => {
    store.updateProfile({ voice_enabled: checked });
  };

  const handleEasyModeToggle = (checked: boolean) => {
    store.updateProfile({ easy_mode: checked });
  };

  const handleReducedMotionToggle = (checked: boolean) => {
    store.updateProfile({ reduced_motion: checked });
  };

  const handleFloatingBubbleToggle = (checked: boolean) => {
    store.updateProfile({ floating_bubble: checked });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" /> Accessibility & System Settings
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Customize senior accessibility, Indian native scripts, and simplified mode.
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Award className="h-4 w-4" /> Senior Citizen Friendly Profile
        </div>
      </div>

      {/* 1. Senior / Easy Mode Toggle Card */}
      <div className="rounded-3xl border-2 border-primary/40 bg-primary/5 p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">
                Senior Easy Mode
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Replaces standard dashboard with ultra-large 2-column tiles, massive fonts, high contrast,
                and direct audio prompts for patients with cognitive memory challenges.
              </p>
            </div>
          </div>
          <Switch
            checked={store.profile.easy_mode}
            onCheckedChange={handleEasyModeToggle}
            className="scale-125"
          />
        </div>
      </div>

      {/* 2. Regional & Indian Languages Section (Clean, Expandable, Elder-Friendly) */}
      <RegionalLanguageSection store={store} />

      {/* 3. Font Size Scaling */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <Type className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Typography Scale (Text Size)</h3>
            <p className="text-sm text-muted-foreground">Adjust text size across the entire application.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { id: "normal", label: "Normal (100%)", example: "Aa" },
            { id: "large", label: "Large (115%)", example: "Aa" },
            { id: "xlarge", label: "Extra Large (132%)", example: "Aa" },
          ].map((item) => {
            const isSelected = store.profile.font_size === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleFontSizeChange(item.id as any)}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"
                }`}
              >
                <span className="text-2xl font-black">{item.example}</span>
                <span className="text-xs font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Vision, Motion & Audio Accessibility */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <Eye className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Vision & Accessibility Preferences</h3>
            <p className="text-sm text-muted-foreground">Contrast, motion damping, and spoken audio assistance.</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {/* High Contrast */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40">
            <div>
              <div className="font-bold text-base text-foreground">High Contrast Mode</div>
              <div className="text-xs text-muted-foreground">
                Deep black borders and high-contrast color tokens for maximum readability.
              </div>
            </div>
            <Switch
              checked={store.profile.high_contrast}
              onCheckedChange={handleContrastToggle}
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40">
            <div>
              <div className="font-bold text-base text-foreground">Reduced Motion</div>
              <div className="text-xs text-muted-foreground">
                Disables animated aurora backgrounds, bouncing icons, and rapid transitions.
              </div>
            </div>
            <Switch
              checked={!!store.profile.reduced_motion}
              onCheckedChange={handleReducedMotionToggle}
            />
          </div>

          {/* Voice Guidance */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40">
            <div>
              <div className="font-bold text-base text-foreground">Voice Guidance & Spoken Readout</div>
              <div className="text-xs text-muted-foreground">
                Enable spoken audio announcements for reminders, medicine confirmations, and routine calls.
              </div>
            </div>
            <Switch
              checked={store.profile.voice_enabled}
              onCheckedChange={handleVoiceToggle}
            />
          </div>

          {/* Longer Response Time (Section 32) */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40">
            <div>
              <div className="font-bold text-base text-foreground">Longer Response Time</div>
              <div className="text-xs text-muted-foreground">
                Gives seniors extended timers and extra countdown time during memory activities and games.
              </div>
            </div>
            <Switch
              checked={store.profile.easy_mode}
              onCheckedChange={handleEasyModeToggle}
            />
          </div>

          {/* Large Buttons (Section 32) */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40">
            <div>
              <div className="font-bold text-base text-foreground">Large Touch Targets & Buttons</div>
              <div className="text-xs text-muted-foreground">
                Expands all interactive buttons and cards to senior-friendly touch dimensions.
              </div>
            </div>
            <Switch
              checked={store.profile.font_size === "xlarge" || store.profile.easy_mode}
              onCheckedChange={(c) => {
                handleEasyModeToggle(c);
                if (c) handleFontSizeChange("large");
              }}
            />
          </div>
        </div>
      </div>

      {/* 5. Floating Accessibility Bubble (Android Companion) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <Smartphone className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Floating Accessibility Companion
            </h3>
            <p className="text-sm text-muted-foreground">
              Docked on-screen bubble for instant voice access and quick hold-for-SOS.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40">
          <div>
            <div className="font-bold text-base text-foreground">Show Floating Companion Bubble</div>
            <div className="text-xs text-muted-foreground">
              Displays draggable bubble on screen edge (Tap for Voice, Hold 1.5s for SOS).
            </div>
          </div>
          <Switch
            checked={store.profile.floating_bubble !== false}
            onCheckedChange={handleFloatingBubbleToggle}
          />
        </div>

        {/* Android Native Explanation Banner */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs space-y-2">
          <div className="font-bold text-foreground flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" /> Native Android Overlay Architecture
          </div>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Web Browser Version:</strong> Operates as an interactive in-app companion bubble within Memory Bond.<br />
            <strong>Native Android APK:</strong> Requests Android's{" "}
            <code className="bg-secondary px-1 py-0.5 rounded font-mono text-[11px] text-foreground">
              SYSTEM_ALERT_WINDOW
            </code>{" "}
            permission and battery optimization whitelist so elderly users can summon the Memory Bond Voice
            Assistant or initiate 5-second SOS from anywhere—even during WhatsApp video calls or on the device homescreen.
          </p>
        </div>
      </div>

      {/* 6. Home State & Regional Cultural Preference (Requirement 13) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Home State & Cultural Heritage (गृह राज्य व संस्कृति)
            </h3>
            <p className="text-sm text-muted-foreground">
              Personalize Cultural Hub, cultural cognitive games, and memories to your native Indian state.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-sm">Selected Indian State</Label>
          <select
            value={store.profile.selected_state || store.profile.selected_ner_state || "Assam"}
            onChange={(e) => {
              store.updateProfile({
                selected_state: e.target.value,
                selected_ner_state: e.target.value,
              });
            }}
            className="w-full h-12 rounded-xl bg-background border border-input px-4 text-base font-bold text-foreground focus:ring-2 focus:ring-primary shadow-xs"
          >
            {INDIAN_STATES.map((st) => (
              <option key={st.name} value={st.name}>
                {st.name} ({st.nativeScript}) — {st.region}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 7. Senior Profile Details */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <MemoryBondLogo variant="icon" size="sm" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Senior Profile & Member ID</h3>
            <p className="text-sm text-muted-foreground">Personal details and official companion registration.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-secondary/30 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Senior Member ID
            </div>
            <div className="text-lg font-mono font-black text-primary">
              {store.profile.member_id || "MB-NER-781003-RAMESH"}
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700">
            Active Caregiver Link
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <Label>Full Name</Label>
            <Input
              value={store.profile.full_name}
              onChange={(e) => store.updateProfile({ full_name: e.target.value })}
              className="rounded-xl mt-1 font-bold"
            />
          </div>
          <div>
            <Label>Emergency Contact Phone</Label>
            <Input
              value={store.profile.phone}
              onChange={(e) => store.updateProfile({ phone: e.target.value })}
              className="rounded-xl mt-1 font-mono"
            />
          </div>
        </div>
      </div>

      {/* 8. Statutory Non-Diagnostic Health & Safety Notice */}
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 p-6 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="font-bold text-base text-foreground">
              Statutory Non-Diagnostic Health & Safety Notice
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Memory Bond</strong> is an assistive cognitive wellness, lifestyle reminder, and family coordination companion created as a dedicated elder-care platform. It does not provide medical diagnosis, therapeutic cures, neurological evaluations, or clinical prescriptions. Always seek guidance from certified physicians, geriatric specialists, or neurologists for any health conditions.
            </p>
          </div>
        </div>
      </div>

      {/* 9. Reset / Demo Controls */}
      <div className="rounded-3xl border border-dashed border-border bg-card p-6 shadow-xs flex items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-foreground">Reset Application Demo Data</h4>
          <p className="text-xs text-muted-foreground">
            Reloads the realistic Indian senior demo dataset (medicines, routines, cues, contacts).
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            store.resetToDemoData();
            alert("Demo data reloaded successfully!");
          }}
          className="gap-2 font-bold rounded-xl"
        >
          <RotateCcw className="h-4 w-4" /> Reset Demo
        </Button>
      </div>
    </div>
  );
}
