import { useState } from "react";
import {
  Heart,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  MapPin,
  Smile,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

const INDIAN_STATES = [
  { id: "Gujarat", name: "Gujarat (ગુજરાત)", region: "West India", defaultInterest: "Garba" },
  { id: "Assam", name: "Assam (অসম)", region: "North-East India", defaultInterest: "Folk Songs" },
  { id: "Maharashtra", name: "Maharashtra (महाराष्ट्र)", region: "West India", defaultInterest: "Festivals" },
  { id: "West Bengal", name: "West Bengal (বাংলা)", region: "East India", defaultInterest: "Stories" },
  { id: "Punjab", name: "Punjab (ਪੰਜਾਬ)", region: "North India", defaultInterest: "Farming" },
  { id: "Tamil Nadu", name: "Tamil Nadu (தமிழ்நாடு)", region: "South India", defaultInterest: "Music" },
  { id: "Karnataka", name: "Karnataka (ಕರ್ನಾಟಕ)", region: "South India", defaultInterest: "Culture" },
  { id: "Kerala", name: "Kerala (കേരളം)", region: "South India", defaultInterest: "Nature" },
  { id: "Telangana", name: "Telangana / AP (తెలుగు)", region: "South India", defaultInterest: "Food" },
  { id: "Rajasthan", name: "Rajasthan (राजस्थान)", region: "North India", defaultInterest: "Art" },
  { id: "Uttar Pradesh", name: "Uttar Pradesh (उत्तर प्रदेश)", region: "North India", defaultInterest: "Culture" },
  { id: "Odisha", name: "Odisha (ଓଡ଼ିଶା)", region: "East India", defaultInterest: "Art" },
];

const INTEREST_OPTIONS = [
  { id: "Food", label: "Food", icon: "🍲", desc: "Traditional dishes & recipes" },
  { id: "Music", label: "Music", icon: "🎵", desc: "Bhajans, classical & melodies" },
  { id: "Garba", label: "Garba", icon: "💃", desc: "Festive dance & songs" },
  { id: "Cricket", label: "Cricket", icon: "🏏", desc: "Match commentary & legends" },
  { id: "Sports", label: "Sports", icon: "⚽", desc: "Yoga, walking & games" },
  { id: "Nature", label: "Nature", icon: "🌳", desc: "Gardens, rivers & sunshine" },
  { id: "Animals", label: "Animals", icon: "🐦", desc: "Birds, pets & wildlife" },
  { id: "Movies", label: "Movies", icon: "🎬", desc: "Golden era cinema & classics" },
  { id: "Stories", label: "Stories", icon: "📖", desc: "Folktales & memoirs" },
  { id: "Festivals", label: "Festivals", icon: "🪔", desc: "Diwali, Bihu, Navratri" },
  { id: "Farming", label: "Farming", icon: "🌾", desc: "Crops, harvest & village life" },
  { id: "Art", label: "Art", icon: "🎨", desc: "Rangoli, painting & crafts" },
  { id: "Puzzles", label: "Puzzles", icon: "🧩", desc: "Gentle brain games" },
  { id: "Family", label: "Family", icon: "👨‍👩‍👧", desc: "Children & grand-children" },
  { id: "Culture", label: "Culture", icon: "🛕", desc: "Temples & sacred heritage" },
];

export function SeniorOnboarding({
  store,
  onComplete,
}: {
  store: MemoryBondStore;
  onComplete: () => void;
}) {
  const { lang, t, speechLocale } = useI18n();
  const [step, setStep] = useState<number>(0);

  // Region / State
  const [selectedState, setSelectedState] = useState<string>(
    store.profile.selected_state || (lang === "gu" ? "Gujarat" : lang === "as" ? "Assam" : "Gujarat")
  );

  // Profile details
  const [fullName, setFullName] = useState<string>(store.profile.full_name || "Ramesh Sharma");
  const [ageRange, setAgeRange] = useState<string>(store.profile.age_range || "70-79");
  const [phone, setPhone] = useState<string>(store.profile.phone || "+91 98640 55123");
  const [familyPhone, setFamilyPhone] = useState<string>("+91 98765 43210");

  // Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    store.profile.interests || (lang === "gu" ? ["Garba", "Music", "Food", "Family"] : ["Family", "Music", "Food", "Cricket"])
  );

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    store.updateProfile({
      full_name: fullName.trim() || "Ramesh Sharma",
      age_range: ageRange,
      phone,
      selected_state: selectedState,
      interests: selectedInterests,
      language: lang,
      onboarded: true,
    });
    onComplete();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl rounded-3xl border-2 border-border bg-card p-6 sm:p-10 shadow-2xl space-y-6 animate-in fade-in">
        {/* Progress header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Heart className="h-4 w-4 fill-primary/20 text-primary" />
            </div>
            <span className="font-extrabold text-foreground text-base sm:text-lg">
              Memory Bond Setup
            </span>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-secondary text-primary">
            Step {step + 1} of 4
          </span>
        </div>

        {/* ================================================================= */}
        {/* STEP 0: Select State / Region (Requirement 19)                    */}
        {/* ================================================================= */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                <MapPin className="h-3.5 w-3.5" /> {lang === "en" ? "Region" : (t("region") || "Region")}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                Which State are you from?
              </h2>
              <p className="text-sm text-muted-foreground">
                This helps us personalize your reminders, local music, and cultural cues.
              </p>
            </div>

            {/* Indian State Cards */}
            <div className="grid grid-cols-2 gap-2.5 max-h-[46vh] overflow-y-auto p-1">
              {INDIAN_STATES.map((st) => {
                const isSelected = selectedState === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedState(st.id);
                      try {
                        speakText(st.name, speechLocale);
                      } catch {}
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? "bg-primary text-white border-primary shadow-md scale-[1.02]"
                        : "bg-secondary/40 hover:bg-secondary border-border text-foreground"
                    }`}
                  >
                    <div className="font-black text-sm sm:text-base leading-tight">
                      {st.name}
                    </div>
                    <div className={`text-[11px] font-semibold ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                      {st.region}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              size="lg"
              onClick={() => setStep(1)}
              className="w-full h-14 font-black text-lg rounded-2xl gap-2 mt-3 cursor-pointer bg-primary text-white shadow-md"
            >
              <span>Continue</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 1: Name and Age Range                                        */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                What may we call you?
              </h2>
              <p className="text-sm text-muted-foreground">
                We will personalize your morning greetings and voice reminders.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-bold">Your Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="h-14 pl-10 text-xl font-bold rounded-2xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-bold">Age Group</Label>
                <div className="grid grid-cols-3 gap-2.5 mt-1">
                  {["60-69", "70-79", "80+"].map((rg) => (
                    <button
                      key={rg}
                      type="button"
                      onClick={() => setAgeRange(rg)}
                      className={`h-12 rounded-xl border-2 font-bold text-base transition-all cursor-pointer ${
                        ageRange === rg
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-secondary/40 border-border hover:bg-secondary"
                      }`}
                    >
                      {rg} years
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                className="rounded-xl h-12 px-6 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="rounded-xl h-12 px-8 font-bold cursor-pointer bg-primary text-white"
              >
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: Interests Selection (Requirement 20)                      */}
        {/* ================================================================= */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                <Smile className="h-3.5 w-3.5" /> {lang === "en" ? "Interests" : (t("interestsPrompt") || "Interests")}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                What do you enjoy?
              </h2>
              <p className="text-sm text-muted-foreground">
                Tap the topics you love. We personalize memory games and stories around them.
              </p>
            </div>

            {/* Visual Interest Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[46vh] overflow-y-auto p-1">
              {INTEREST_OPTIONS.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterest(item.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[86px] ${
                      isSelected
                        ? "bg-primary/15 border-primary shadow-sm"
                        : "bg-secondary/40 hover:bg-secondary/70 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{item.icon}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-sm text-foreground">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-xl h-12 px-6 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="rounded-xl h-12 px-8 font-bold cursor-pointer bg-primary text-white"
              >
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: Finish & Ready                                            */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center text-emerald-600 mx-auto animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-foreground">You are all set!</h2>
              <p className="text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Welcome, <span className="font-bold text-foreground">{fullName}</span>! Your medicine reminders, daily routines, and personalized {selectedState} cultural cues are ready.
              </p>
            </div>

            {/* Selected Summary Pill */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                📍 {selectedState}
              </span>
              {selectedInterests.slice(0, 3).map((int) => (
                <span key={int} className="px-3 py-1 rounded-full bg-primary/15 text-xs font-bold text-primary">
                  ✨ {int}
                </span>
              ))}
            </div>

            <Button
              size="lg"
              onClick={handleFinish}
              className="w-full h-16 font-black text-xl rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl cursor-pointer"
            >
              Open My Companion Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
