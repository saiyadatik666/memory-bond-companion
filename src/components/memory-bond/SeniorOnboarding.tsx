import { useState } from "react";
import {
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Check,
  Languages,
  Brain,
  Pill,
  Calendar,
  Droplet,
  Users,
} from "lucide-react";
import { MemoryBondLogo } from "./MemoryBondLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

const ONBOARDING_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "mni", name: "Manipuri / Meitei", nativeName: "মৈতৈলোন্ / Meiteilon", flag: "🇮🇳" },
];

const HELP_TOPICS = [
  { id: "memory", label: "Memory Activities", icon: Brain, desc: "Gentle brain games & object recall", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "medicines", label: "Medicine Reminders", icon: Pill, desc: "Timely medicine alerts & dosages", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "routine", label: "Daily Routine", icon: Calendar, desc: "Morning walks, meals & rest", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "hydration", label: "Hydration", icon: Droplet, desc: "Water reminders throughout the day", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "family", label: "Family Connection", icon: Users, desc: "Quick calls, photos & greetings", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

export function SeniorOnboarding({
  store,
  onComplete,
}: {
  store: MemoryBondStore;
  onComplete: () => void;
}) {
  const { lang, setLang, t, speechLocale } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Name
  const [fullName, setFullName] = useState<string>(
    store.profile.full_name || "Meena Patel"
  );

  // Step 2: Language (synced with i18n)
  const [selectedLang, setSelectedLang] = useState<string>(lang || "en");

  // Step 3: Help topics (multi-select)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "memory",
    "medicines",
    "routine",
    "hydration",
  ]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLang(code);
    setLang(code);
    try {
      speakText(code === "hi" ? "नमस्ते" : code === "as" ? "নমস্কাৰ" : "Hello", speechLocale);
    } catch {}
  };

  const handleFinish = () => {
    const cleanName = fullName.trim() || "Meena Patel";
    store.updateProfile({
      full_name: cleanName,
      language: selectedLang,
      onboarded: true,
    });
    // Save to active session
    try {
      const raw = localStorage.getItem("mb_active_session");
      if (raw) {
        const session = JSON.parse(raw);
        session.fullName = cleanName;
        localStorage.setItem("mb_active_session", JSON.stringify(session));
      }
    } catch {}
    onComplete();
  };

  return (
    <div className="min-h-screen bg-ambient flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E2EAF5] shadow-xl p-6 sm:p-10 space-y-6">
        {/* Progress header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <MemoryBondLogo variant="icon" size="xs" />
            <span className="font-extrabold text-foreground text-base sm:text-lg">
              Memory Bond Setup
            </span>
          </div>
          <span className="text-xs font-black px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Step {step} of 3
          </span>
        </div>

        {/* =================================================================== */}
        {/* STEP 1: What should we call you?                                    */}
        {/* =================================================================== */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center text-2xl mb-1">
                👋
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display">
                What should we call you?
              </h2>
              <p className="text-sm text-muted-foreground font-semibold">
                We'll use this to greet you warmly every morning.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-sm font-bold text-foreground">Your Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Meena Patel"
                  className="h-14 pl-12 text-lg sm:text-xl font-bold rounded-2xl border-2 focus-visible:ring-primary"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground font-medium pt-1">
                Tip: You can use your first name or nickname (e.g. Meena, Dadi, Dadaji).
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => setStep(2)}
              disabled={!fullName.trim()}
              className="w-full h-14 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-md gap-2 cursor-pointer mt-4"
            >
              <span>Continue</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: Choose your language                                        */}
        {/* =================================================================== */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center text-2xl mb-1">
                🌐
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display">
                Choose your language
              </h2>
              <p className="text-sm text-muted-foreground font-semibold">
                Select the language you feel most comfortable speaking and reading.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {ONBOARDING_LANGUAGES.map((l) => {
                const isSelected = selectedLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageSelect(l.code)}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-black shadow-sm"
                        : "bg-secondary/30 border-border hover:bg-secondary/60 text-foreground font-bold"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{l.flag}</span>
                      <div>
                        <div className="text-base leading-tight">{l.name}</div>
                        <div className="text-xs opacity-75 font-semibold">{l.nativeName}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="h-12 px-6 rounded-xl font-bold cursor-pointer gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                size="lg"
                onClick={() => setStep(3)}
                className="flex-1 h-12 rounded-2xl font-black text-base bg-primary hover:bg-primary/90 text-white shadow-md gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: What would you like help with? (Multi-select)               */}
        {/* =================================================================== */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center text-2xl mb-1">
                ❤️
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display">
                What would you like help with?
              </h2>
              <p className="text-sm text-muted-foreground font-semibold">
                Choose as many as you like. We can adjust this anytime.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {HELP_TOPICS.map((topic) => {
                const Icon = topic.icon;
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-xs scale-[1.01]"
                        : "bg-secondary/30 border-border hover:bg-secondary/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${topic.color} border`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-black text-sm sm:text-base text-foreground">
                          {topic.label}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {topic.desc}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-muted-foreground/40 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="h-12 px-6 rounded-xl font-bold cursor-pointer gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                size="lg"
                onClick={handleFinish}
                className="flex-1 h-12 rounded-2xl font-black text-base bg-primary hover:bg-primary/90 text-white shadow-md gap-2 cursor-pointer"
              >
                <span>Enter Memory Bond</span>
                <CheckCircle2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
