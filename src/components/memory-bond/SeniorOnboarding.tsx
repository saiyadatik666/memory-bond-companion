import { useState } from "react";
import {
  Heart,
  Languages,
  User,
  Phone,
  Pill,
  Sun,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { LANGUAGES, useI18n, type LangCode } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

export function SeniorOnboarding({
  store,
  onComplete,
}: {
  store: MemoryBondStore;
  onComplete: () => void;
}) {
  const { lang, setLang, t } = useI18n();
  const [step, setStep] = useState<number>(0);
  const [fullName, setFullName] = useState<string>(store.profile.full_name || "Ramesh Sharma");
  const [ageRange, setAgeRange] = useState<string>("70-79");
  const [phone, setPhone] = useState<string>(store.profile.phone || "+91 98640 55123");
  const [familyPhone, setFamilyPhone] = useState<string>("+91 98765 43210");

  const speakPrompt = (text: string) => {
    speakText(text);
  };

  const handleFinish = () => {
    store.updateProfile({
      full_name: fullName,
      age_range: ageRange,
      phone,
      language: lang,
      onboarded: true,
    });
    onComplete();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border-2 border-border bg-card p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in">
        {/* Progress header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary/20" />
            <span className="font-extrabold text-foreground text-lg">Memory Bond Setup</span>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-muted-foreground">
            Step {step + 1} of 4
          </span>
        </div>

        {/* STEP 0: Select Language */}
        {step === 0 && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                Welcome / स्वागत / স্বাগতম
              </h2>
              <p className="text-base text-muted-foreground">
                Choose the language you feel most comfortable with:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    speakPrompt(`Selected ${l.label}`);
                  }}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    lang === l.code
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                      : "bg-secondary/40 hover:bg-secondary/70 border-border text-foreground"
                  }`}
                >
                  <div className="text-xl font-black">{l.native}</div>
                  <div className="text-xs font-semibold opacity-80">{l.label}</div>
                </button>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => setStep(1)}
              className="w-full h-14 font-black text-lg rounded-2xl gap-2 mt-4"
            >
              Continue <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* STEP 1: Name and Age Range */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                What may we call you?
              </h2>
              <p className="text-sm text-muted-foreground">
                We will personalize your reminders and warm morning greetings.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-bold">Your Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="h-14 text-xl font-bold rounded-2xl mt-1"
                />
              </div>

              <div>
                <Label className="text-base font-bold">Age Group</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {["60-69", "70-79", "80+"].map((rg) => (
                    <button
                      key={rg}
                      type="button"
                      onClick={() => setAgeRange(rg)}
                      className={`h-12 rounded-xl border-2 font-bold text-base transition-all ${
                        ageRange === rg
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/40 border-border"
                      }`}
                    >
                      {rg} years
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(0)} className="rounded-xl h-12 px-6">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(2)} className="rounded-xl h-12 px-8 font-bold">
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Emergency Contact */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                Trusted Family / Caregiver
              </h2>
              <p className="text-sm text-muted-foreground">
                Who should receive SOS notifications and help oversee your medicine refills?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-bold">Primary Caregiver's Phone Number</Label>
                <Input
                  type="tel"
                  value={familyPhone}
                  onChange={(e) => setFamilyPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-14 text-xl font-mono font-bold rounded-2xl mt-1"
                />
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 text-xs text-muted-foreground leading-relaxed">
                Tip: You can add more family members, children, and your doctor anytime in the Family section.
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl h-12 px-6">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="rounded-xl h-12 px-8 font-bold">
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Finish & Ready */}
        {step === 3 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-success/20 border-4 border-success flex items-center justify-center text-success mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-foreground">You are all set!</h2>
              <p className="text-base text-muted-foreground max-w-sm mx-auto">
                Welcome to Memory Bond. Your daily routine, medicine schedule, and cognitive games are ready.
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleFinish}
              className="w-full h-16 font-black text-xl rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl"
            >
              Open My Companion Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
