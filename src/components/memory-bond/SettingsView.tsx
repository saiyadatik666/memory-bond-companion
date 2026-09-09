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
  Smartphone,
  Sparkles,
  Zap,
  Sliders,
  Cpu,
  HelpCircle,
  Activity,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n, LANGUAGES, type LangCode } from "@/lib/i18n";
import { speakText, stopSpeaking } from "@/lib/voiceParser";

export function SettingsView({ store }: { store: MemoryBondStore }) {
  const { lang, setLang, t, speechLocale } = useI18n();
  const [testSpeechStatus, setTestSpeechStatus] = useState<string>("");

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

  const handleVoiceProviderChange = (provider: "web_speech" | "bhashini" | "google_cloud") => {
    store.updateProfile({ voice_provider: provider });
    if (typeof window !== "undefined") {
      localStorage.setItem("mb_voice_provider", provider);
    }
  };

  const testVoiceSample = () => {
    stopSpeaking();
    setTestSpeechStatus("Playing voice sample...");
    const sampleText =
      lang === "hi"
        ? "नमस्ते! मैं आपका मेमोरी बॉन्ड साथी हूँ।"
        : lang === "as"
        ? "নমস্কাৰ! মই আপোনাৰ মেম'ৰি বণ্ড সংগী।"
        : lang === "bn"
        ? "নমস্কার! আমি আপনার মেমোরি বন্ড সঙ্গী।"
        : "Namaste! I am your Memory Bond companion, here to assist your peaceful day.";

    speakText(sampleText, speechLocale || "en-IN", () => {
      setTestSpeechStatus("Voice test completed successfully.");
      setTimeout(() => setTestSpeechStatus(""), 3000);
    });
  };

  const currentProvider = store.profile.voice_provider || "web_speech";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-secondary/30 p-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" /> Accessibility & System Settings
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Customize senior accessibility, Indian native scripts, voice AI providers, and simplified mode.
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
                Senior Easy Mode (सरल मोड / সৰল মোড)
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

      {/* 2. Multilingual Support (12 Indian Languages) */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <Languages className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Regional Language (12 Indian Languages & Scripts)
            </h3>
            <p className="text-sm text-muted-foreground">
              Select your native Indian language for navigation, screen text, and voice audio feedback.
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
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 ring-2 ring-primary/30"
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

      {/* 3. Voice Provider Architecture */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <Cpu className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Voice Engine Provider</h3>
            <p className="text-sm text-muted-foreground">
              Select speech recognition and synthesis backend for Indian regional accents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            {
              id: "web_speech",
              title: "Web Speech API",
              subtitle: "Local / Offline",
              badge: "On-Device",
              desc: "Fastest zero-latency speech recognition and synthesis. Fully offline resilient.",
            },
            {
              id: "bhashini",
              title: "BHASHINI AI",
              subtitle: "National AI Mission",
              badge: "NER Specialized",
              desc: "Optimized for Assamese, Bengali, and North-Eastern dialects via Gov. of India NLTM.",
            },
            {
              id: "google_cloud",
              title: "Google Cloud Speech",
              subtitle: "Cloud Neural TTS",
              badge: "High Accuracy",
              desc: "Deep neural voices with calm senior cadence and multilingual noise cancellation.",
            },
          ].map((prov) => {
            const isSelected = currentProvider === prov.id;
            return (
              <button
                key={prov.id}
                onClick={() => handleVoiceProviderChange(prov.id as any)}
                className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-sm ring-2 ring-primary/20"
                    : "bg-secondary/30 hover:bg-secondary/60 border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-base font-bold text-foreground block">{prov.title}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{prov.subtitle}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    {prov.badge}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {prov.desc}
                </p>
                {isSelected && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Check className="h-4 w-4" /> Active Provider
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Test Speech Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-secondary/20 p-4 rounded-2xl">
          <div className="text-sm font-medium text-foreground">
            Test current voice synthesis in <strong>{LANGUAGES.find((l) => l.code === lang)?.label}</strong>:
            {testSpeechStatus && (
              <span className="text-xs font-bold text-primary ml-2 animate-pulse">
                {testSpeechStatus}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testVoiceSample}
            className="rounded-xl font-bold gap-2"
          >
            <Volume2 className="h-4 w-4 text-primary" /> Test Voice Readout
          </Button>
        </div>
      </div>

      {/* 4. Font Size Scaling */}
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

      {/* 5. Vision, Motion & Audio Accessibility */}
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
        </div>
      </div>

      {/* 6. Floating Accessibility Bubble (Android Companion) */}
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
            In native packaging, Memory Bond registers a foreground service with Android's{" "}
            <code className="bg-secondary px-1 py-0.5 rounded font-mono text-[11px] text-foreground">
              SYSTEM_ALERT_WINDOW
            </code>{" "}
            permission and requests battery optimization whitelist. This allows elderly users to summon
            the Memory Bond Voice Assistant or initiate 5-second SOS even while on phone calls or home screen.
          </p>
        </div>
      </div>

      {/* 7. Senior Profile Details */}
      <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Senior Profile & Member ID</h3>
            <p className="text-sm text-muted-foreground">Personal details and registration information.</p>
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

      {/* 8. Reset / Demo Controls */}
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
