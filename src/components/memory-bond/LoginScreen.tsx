import React, { useState } from "react";
import {
  Heart,
  ShieldCheck,
  QrCode,
  KeyRound,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Eye,
  EyeOff,
  Languages,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { QRScannerModal } from "./QRScannerModal";
import { LANGUAGES, useI18n, type LangCode } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";

interface LoginScreenProps {
  store: MemoryBondStore;
  onAuthenticated: (role: "caregiver" | "senior") => void;
}

export function LoginScreen({ store, onAuthenticated }: LoginScreenProps) {
  const { lang, setLang, t } = useI18n();

  // Onboarding Stage: 'welcome' -> 'language' -> 'role' -> 'caregiver_auth' | 'senior_auth'
  const [stage, setStage] = useState<"welcome" | "language" | "role" | "caregiver_auth" | "senior_auth">(() => {
    if (typeof window !== "undefined" && localStorage.getItem("mb_welcome_completed")) {
      return "role";
    }
    return "welcome";
  });

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Caregiver form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Senior linking state
  const [connectionCode, setConnectionCode] = useState("");
  const [seniorName, setSeniorName] = useState(store.profile.full_name || "Ramesh Sharma");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);
  const [linkingSuccess, setLinkingSuccess] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // Helper to retrieve or create caregiver unique pairing code
  const getOrCreateCaregiverCode = (caregiverId: string) => {
    let existing = localStorage.getItem(`mb_cg_code_${caregiverId}`);
    if (!existing) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      existing = `MB-CG-${randomSuffix}`;
      localStorage.setItem(`mb_cg_code_${caregiverId}`, existing);
      localStorage.setItem("mb_caregiver_unique_code", existing);

      const registered = JSON.parse(localStorage.getItem("mb_registered_caregiver_codes") || "[]");
      if (!registered.includes(existing)) {
        registered.push(existing);
        localStorage.setItem("mb_registered_caregiver_codes", JSON.stringify(registered));
      }
    }
    return existing;
  };

  // CAREGIVER AUTHENTICATION
  const handleCaregiverAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (authMode === "signup") {
        if (!email.trim() || !password.trim()) {
          throw new Error("Please enter both email and password.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || "Caregiver",
              role: "caregiver",
            },
          },
        });

        if (error) throw error;

        const userId = data.user?.id || `cg_${Date.now()}`;
        const caregiverCode = getOrCreateCaregiverCode(userId);

        localStorage.setItem(
          "mb_active_session",
          JSON.stringify({
            userId,
            role: "caregiver",
            email: email.trim(),
            fullName: fullName.trim() || "Caregiver",
            caregiverCode,
          })
        );
        localStorage.setItem("mb_welcome_completed", "true");

        store.updateProfile({
          full_name: fullName.trim() || "Caregiver",
          role: "caregiver",
        });
        store.setRole("caregiver");

        setSuccessMessage("Caregiver account created! Opening Caregiver Dashboard...");
        setTimeout(() => {
          onAuthenticated("caregiver");
        }, 700);
      } else {
        // Sign in
        if (!email.trim() || !password.trim()) {
          throw new Error("Please enter your email and password.");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        const user = data.user;
        const userId = user?.id || `cg_${Date.now()}`;
        const caregiverCode = getOrCreateCaregiverCode(userId);
        const name = user?.user_metadata?.full_name || email.split("@")[0] || "Caregiver";

        localStorage.setItem(
          "mb_active_session",
          JSON.stringify({
            userId,
            role: "caregiver",
            email: user?.email || email,
            fullName: name,
            caregiverCode,
          })
        );
        localStorage.setItem("mb_welcome_completed", "true");

        store.updateProfile({
          full_name: name,
          role: "caregiver",
        });
        store.setRole("caregiver");

        setSuccessMessage("Caregiver signed in! Opening Caregiver Dashboard...");
        setTimeout(() => {
          onAuthenticated("caregiver");
        }, 700);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please check credentials or use Demo Access below.");
    } finally {
      setIsLoading(false);
    }
  };

  // ONE-CLICK CAREGIVER DEMO LOGIN
  const handleDemoCaregiverLogin = () => {
    const demoId = "cg_demo_verified";
    const caregiverCode = getOrCreateCaregiverCode(demoId);

    localStorage.setItem(
      "mb_active_session",
      JSON.stringify({
        userId: demoId,
        role: "caregiver",
        email: "caregiver@memorybond.org",
        fullName: "Sunita Sharma (Caregiver)",
        caregiverCode,
      })
    );
    localStorage.setItem("mb_welcome_completed", "true");

    store.updateProfile({
      full_name: "Sunita Sharma (Caregiver)",
      role: "caregiver",
    });
    store.setRole("caregiver");

    setSuccessMessage("Opening Caregiver Dashboard with demo data...");
    setTimeout(() => {
      onAuthenticated("caregiver");
    }, 600);
  };

  // SENIOR ACCOUNT LINKING VIA CODE / QR
  const handleVerifyAndLinkSenior = (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim().toUpperCase();
    setLinkingError(null);
    setLinkingSuccess(null);
    setIsLinking(true);

    if (!cleanCode) {
      setLinkingError("Please enter a valid Caregiver connection code or scan a QR code.");
      setIsLinking(false);
      return;
    }

    const isValidFormat = cleanCode.startsWith("MB-CG-") || cleanCode === "MB-CAREGIVER-2026";
    if (!isValidFormat) {
      setLinkingError("Invalid code format. Codes must start with 'MB-CG-' (e.g. MB-CG-781042).");
      setIsLinking(false);
      return;
    }

    // Perform pairing
    store.linkCaregiver(cleanCode, "Caregiver Linked");
    localStorage.setItem("mb_linked_caregiver_code", cleanCode);
    localStorage.setItem(
      "mb_active_session",
      JSON.stringify({
        userId: `senior_${Date.now()}`,
        role: "senior",
        fullName: seniorName.trim() || "Ramesh Sharma",
        linkedCaregiverCode: cleanCode,
      })
    );
    localStorage.setItem("mb_welcome_completed", "true");

    store.updateProfile({
      full_name: seniorName.trim() || "Ramesh Sharma",
      role: "senior",
    });
    store.setRole("senior");

    setLinkingSuccess(`Successfully linked to Caregiver (${cleanCode})! Opening Senior Companion...`);
    setTimeout(() => {
      onAuthenticated("senior");
    }, 800);
  };

  // DIRECT SENIOR ENTRY (Without caregiver link upfront)
  const handleDirectSeniorContinue = () => {
    localStorage.setItem(
      "mb_active_session",
      JSON.stringify({
        userId: `senior_${Date.now()}`,
        role: "senior",
        fullName: seniorName.trim() || "Ramesh Sharma",
      })
    );
    localStorage.setItem("mb_welcome_completed", "true");

    store.updateProfile({
      full_name: seniorName.trim() || "Ramesh Sharma",
      role: "senior",
    });
    store.setRole("senior");
    onAuthenticated("senior");
  };

  // ==========================================================================
  // SCREEN 1: WELCOME SCREEN (Requirement 4)
  // ==========================================================================
  if (stage === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500/10 via-background to-primary/10 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-lg rounded-3xl bg-card border-2 border-border/80 shadow-2xl p-8 sm:p-10 text-center space-y-8">
          {/* Logo & Glow */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-xl shadow-primary/30">
              <Heart className="h-11 w-11 fill-white/20 text-white" />
            </div>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full">
              AI Senior Companion
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              MEMORY BOND
            </h1>
            <p className="text-lg sm:text-xl font-bold text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Helping you remember what matters.
            </p>
          </div>

          {/* Key Feature Highlights */}
          <div className="grid grid-cols-2 gap-3 text-left pt-2">
            <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border space-y-1">
              <div className="text-base font-black text-foreground flex items-center gap-1.5">
                <span>💊</span> Medicine
              </div>
              <p className="text-xs text-muted-foreground font-semibold">
                Timely alarms & photo confirmations
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border space-y-1">
              <div className="text-base font-black text-foreground flex items-center gap-1.5">
                <span>🎙️</span> AI Voice
              </div>
              <p className="text-xs text-muted-foreground font-semibold">
                Natural talks in your language
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border space-y-1">
              <div className="text-base font-black text-foreground flex items-center gap-1.5">
                <span>👨‍👩‍👧</span> Family Link
              </div>
              <p className="text-xs text-muted-foreground font-semibold">
                Caregivers paired in one scan
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border space-y-1">
              <div className="text-base font-black text-foreground flex items-center gap-1.5">
                <span>🧠</span> Memory Games
              </div>
              <p className="text-xs text-muted-foreground font-semibold">
                Family photos & brain exercises
              </p>
            </div>
          </div>

          {/* Get Started Button */}
          <Button
            size="lg"
            onClick={() => setStage("language")}
            className="w-full h-16 rounded-2xl text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 gap-3 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <span>Get Started</span>
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SCREEN 2: LANGUAGE SELECTION (Requirement 5)
  // ==========================================================================
  if (stage === "language") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-xl rounded-3xl bg-card border-2 border-border shadow-2xl p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-primary bg-primary/10 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Languages className="h-3.5 w-3.5" /> Language / भाषा
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Choose Your Language
            </h2>
            <p className="text-sm text-muted-foreground">
              Select the language you feel most comfortable speaking and reading
            </p>
          </div>

          {/* 12 Verified Indian Languages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto p-1">
            {LANGUAGES.map((l) => {
              const isSelected = lang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLang(l.code);
                    store.updateProfile({ language: l.code });
                    try {
                      speakText(l.native, l.code);
                    } catch {}
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-lg scale-105"
                      : "bg-secondary/50 hover:bg-secondary border-border text-foreground"
                  }`}
                >
                  <div className="text-xl font-black">{l.native}</div>
                  <div className={`text-xs font-semibold ${isSelected ? "text-white/90" : "text-muted-foreground"}`}>
                    {l.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStage("welcome")}
              className="h-12 px-5 rounded-xl font-bold cursor-pointer gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            <Button
              size="lg"
              onClick={() => setStage("role")}
              className="flex-1 h-14 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-md gap-2 cursor-pointer"
            >
              <span>Continue / आगे बढ़ें</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SCREEN 3: SIMPLE 2-ROLE SELECTION (Requirement 3)
  // ==========================================================================
  if (stage === "role") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-xl rounded-3xl bg-card border-2 border-border shadow-2xl p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
              <Heart className="h-7 w-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              What is your role?
            </h2>
            <p className="text-sm text-muted-foreground">
              Please choose how you will be using Memory Bond today
            </p>
          </div>

          {/* Large Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Senior Card */}
            <button
              type="button"
              onClick={() => setStage("senior_auth")}
              className="group p-6 rounded-3xl border-3 border-border hover:border-primary bg-secondary/30 hover:bg-primary/5 text-left space-y-4 transition-all duration-200 cursor-pointer hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                👴
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground group-hover:text-primary">
                  Senior
                </h3>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Self / Elderly
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  Gentle reminders, medicine alerts, voice conversations, and brain games.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-primary pt-2">
                <span>Enter as Senior</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>

            {/* Caregiver / Family Card */}
            <button
              type="button"
              onClick={() => setStage("caregiver_auth")}
              className="group p-6 rounded-3xl border-3 border-border hover:border-primary bg-secondary/30 hover:bg-primary/5 text-left space-y-4 transition-all duration-200 cursor-pointer hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                👨‍👩‍👧
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground group-hover:text-primary">
                  Caregiver / Family
                </h3>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">
                  Son, Daughter, Guardian
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  Manage medicines, schedule reminders, add family photos, and track wellness.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-primary pt-2">
                <span>Enter as Caregiver</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              onClick={() => setStage("language")}
              className="text-xs font-bold text-muted-foreground cursor-pointer gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Change Language
            </Button>
            <span className="text-xs text-muted-foreground font-semibold">
              Step 2 of 2
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SCREEN 4A: SENIOR LINKING & ACCESS (Requirement 26 & 27)
  // ==========================================================================
  if (stage === "senior_auth") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-md rounded-3xl bg-card border-2 border-border shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <button
              onClick={() => setStage("role")}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-black text-foreground">Senior Access</h2>
              <p className="text-xs text-muted-foreground">Quick link with your caregiver</p>
            </div>
            <div className="w-8" />
          </div>

          {/* Senior Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-bold">What is your name?</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={seniorName}
                onChange={(e) => setSeniorName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="h-12 pl-10 text-base font-bold rounded-2xl"
              />
            </div>
          </div>

          {/* Pairing Options */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-4">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
              Connect to Caregiver's Account
            </div>

            {/* Option 1: Scan QR Code */}
            <Button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full h-14 rounded-2xl font-black text-base bg-primary hover:bg-primary/90 text-white shadow-md gap-2.5 cursor-pointer"
            >
              <Camera className="h-5 w-5" />
              Scan Caregiver's QR Code
            </Button>

            {/* Option 2: Manual 6-Digit Code */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-bold text-muted-foreground">
                Or Type Caregiver Connection Code:
              </Label>
              <div className="flex gap-2">
                <Input
                  value={connectionCode}
                  onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                  placeholder="MB-CG-781042"
                  className="h-12 font-mono font-black tracking-wider uppercase text-base rounded-2xl"
                />
                <Button
                  onClick={() => handleVerifyAndLinkSenior(connectionCode)}
                  disabled={isLinking}
                  className="h-12 px-5 rounded-2xl font-bold bg-primary text-white cursor-pointer"
                >
                  {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link"}
                </Button>
              </div>
            </div>

            {/* Demo Quick Code */}
            <button
              type="button"
              onClick={() => {
                setConnectionCode("MB-CG-781042");
                handleVerifyAndLinkSenior("MB-CG-781042");
              }}
              className="w-full text-center text-xs text-primary hover:underline font-bold pt-1 cursor-pointer"
            >
              Use Demo Code: MB-CG-781042
            </button>
          </div>

          {/* Feedback alerts */}
          {linkingError && (
            <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/40 flex items-start gap-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{linkingError}</span>
            </div>
          )}

          {linkingSuccess && (
            <div className="p-3.5 rounded-2xl bg-success/15 border border-success/40 flex items-start gap-2.5 text-xs text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{linkingSuccess}</span>
            </div>
          )}

          {/* Continue without link */}
          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={handleDirectSeniorContinue}
              className="w-full h-12 rounded-2xl text-xs font-bold cursor-pointer"
            >
              Continue Directly as Senior
            </Button>
          </div>
        </div>

        {/* QR Scanner Modal */}
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(scanned) => {
            setIsScannerOpen(false);
            setConnectionCode(scanned);
            handleVerifyAndLinkSenior(scanned);
          }}
          expectedCodeHint={localStorage.getItem("mb_caregiver_unique_code") || "MB-CG-781042"}
        />
      </div>
    );
  }

  // ==========================================================================
  // SCREEN 4B: CAREGIVER / FAMILY SIGN IN (Requirement 3 & 26)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-3xl bg-card border-2 border-border shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <button
            onClick={() => setStage("role")}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-black text-foreground">Caregiver & Family</h2>
            <p className="text-xs text-muted-foreground">Sign in to manage and assist your senior</p>
          </div>
          <div className="w-8" />
        </div>

        {/* Mode switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary/60 border border-border text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode("signin")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              authMode === "signin"
                ? "bg-primary text-white shadow-sm font-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("signup")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              authMode === "signup"
                ? "bg-primary text-white shadow-sm font-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Caregiver Form */}
        <form onSubmit={handleCaregiverAuth} className="space-y-4">
          {authMode === "signup" && (
            <div className="space-y-1">
              <Label className="text-xs font-bold">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sunita Sharma"
                  className="h-12 pl-10 rounded-2xl text-sm font-semibold"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs font-bold">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="caregiver@family.org"
                className="h-12 pl-10 rounded-2xl text-sm font-semibold"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 pl-10 pr-10 rounded-2xl text-sm font-semibold"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/40 flex items-start gap-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-success/15 border border-success/40 flex items-start gap-2.5 text-xs text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 rounded-2xl font-black text-base bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : authMode === "signup" ? (
              "Create Caregiver Account"
            ) : (
              "Sign In to Caregiver Portal"
            )}
          </Button>
        </form>

        {/* One-Click Instant Caregiver Demo Access */}
        <div className="pt-2 border-t border-border space-y-2">
          <Button
            type="button"
            onClick={handleDemoCaregiverLogin}
            variant="secondary"
            className="w-full h-12 rounded-2xl font-black text-xs gap-2 border border-primary/30 text-foreground cursor-pointer hover:bg-primary/10"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            1-Click Demo Caregiver Portal Access
          </Button>
        </div>
      </div>
    </div>
  );
}
