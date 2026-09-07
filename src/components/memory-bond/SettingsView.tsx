import { useState } from "react";
import {
  Settings,
  Languages,
  Type,
  Eye,
  Volume2,
  Bell,
  Shield,
  User,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n, LANGUAGES, type LangCode } from "@/lib/i18n";

export function SettingsView({ store }: { store: MemoryBondStore }) {
  const { lang, setLang, t } = useI18n();

  const handleFontSizeChange = (size: "normal" | "large" | "xlarge") => {
    store.updateProfile({ font_size: size });
  };

  const handleContrastToggle = (checked: boolean) => {
    store.updateProfile({ high_contrast: checked });
  };

  const handleVoiceToggle = (checked: boolean) => {
    store.updateProfile({ voice_enabled: checked });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" /> Accessibility & App Settings
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Customize typography scale, Indian language, high contrast, and voice assistance.
          </p>
        </div>
      </div>

      {/* 1. Multilingual Support (8 Indian Languages) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <Languages className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Language (भाषा / ভাষা / ભાષા / மொழி)</h3>
            <p className="text-sm text-muted-foreground">
              Select your native Indian script for navigation, audio voice, and reminders.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {LANGUAGES.map((l) => {
            const isSelected = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  store.updateProfile({ language: l.code });
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-24 ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"
                }`}
              >
                <span className="text-lg font-bold">{l.native}</span>
                <span className="text-xs font-semibold opacity-80">{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Font Size Scaling */}
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

      {/* 3. High Contrast & Voice Guidance */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <Eye className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Vision & Audio Accessibility</h3>
            <p className="text-sm text-muted-foreground">Enhanced contrast and spoken audio assistance.</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
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

          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40">
            <div>
              <div className="font-bold text-base text-foreground">Voice Guidance & Readout</div>
              <div className="text-xs text-muted-foreground">
                Enable spoken audio announcements for reminders and game feedback.
              </div>
            </div>
            <Switch
              checked={store.profile.voice_enabled}
              onCheckedChange={handleVoiceToggle}
            />
          </div>
        </div>
      </div>

      {/* 4. Senior Profile Details */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">User Profile</h3>
            <p className="text-sm text-muted-foreground">Personal details and contact info.</p>
          </div>
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
            <Label>Phone Number</Label>
            <Input
              value={store.profile.phone}
              onChange={(e) => store.updateProfile({ phone: e.target.value })}
              className="rounded-xl mt-1 font-mono"
            />
          </div>
        </div>
      </div>

      {/* 5. Reset / Demo Controls */}
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
