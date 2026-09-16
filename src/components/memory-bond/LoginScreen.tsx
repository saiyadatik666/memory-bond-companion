import React, { useState } from "react";
import {
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
import { RegionalLanguageSection } from "./RegionalLanguageSection";
import { LANGUAGES, useI18n } from "@/lib/i18n";
import { speakText } from "@/lib/voiceParser";
import { connectSeniorToCaregiver } from "@/lib/caregiverConnectionService";
import { MemoryBondLogo } from "./MemoryBondLogo";
import { SeniorInterestsScreen } from "./SeniorInterestsScreen";

interface LoginScreenProps {
  store: MemoryBondStore;
  onAuthenticated: (role: "caregiver" | "senior") => void;
}

export function LoginScreen({ store, onAuthenticated }: LoginScreenProps) {
  const { lang, setLang, t } = useI18n();

  // Onboarding Stage: 'welcome' -> 'language' -> 'role' -> 'senior_interests' -> 'senior_auth' | 'caregiver_auth'
  const [stage, setStage] = useState<"welcome" | "language" | "role" | "senior_interests" | "caregiver_auth" | "senior_auth">(() => {
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
  const [seniorInterests, setSeniorInterests] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("mb_senior_interests");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return store.profile.interests && store.profile.interests.length > 0
      ? store.profile.interests
      : ["music", "gardening", "family"];
  });
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
        localStorage.setItem("mb_authenticated_user_id", userId);
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
        localStorage.setItem("mb_authenticated_user_id", userId);
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
    localStorage.setItem("mb_authenticated_user_id", demoId);
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
  const handleVerifyAndLinkSenior = async (codeToVerify: string) => {
    if (isLinking) return;
    const cleanCode = codeToVerify.trim().toUpperCase();
    setLinkingError(null);
    setLinkingSuccess(null);
    setIsLinking(true);

    try {
      const result = await connectSeniorToCaregiver({
        code: cleanCode,
        seniorName: seniorName.trim() || store.profile.full_name || "Ramesh Sharma",
        store,
        currentLanguage: lang,
        timeoutMs: 8000,
      });

      if (!result.success) {
        setLinkingError(result.error || "Could not link to caregiver. Please verify the code and try again.");
        return;
      }

      const displayName = result.caregiverName || "Caregiver";
      const successMsg = result.alreadyConnected
        ? `Already linked to Caregiver (${result.code})! Opening Senior Companion...`
        : `Successfully linked to Caregiver ${displayName} (${result.code})! Opening Senior Companion...`;

      setLinkingSuccess(successMsg);

      store.updateProfile({
        interests: seniorInterests,
      });

      setTimeout(() => {
        onAuthenticated("senior");
      }, 750);
    } catch (err: any) {
      console.error("Connection error:", err);
      setLinkingError(err?.message || "An unexpected error occurred during connection.");
    } finally {
      setIsLinking(false);
    }
  };

  // DIRECT SENIOR ENTRY
  const handleDirectSeniorContinue = () => {
    if (isLinking) return;
    const seniorId = `senior_${Date.now()}`;
    const name = seniorName.trim() || "Ramesh Sharma";

    localStorage.setItem(
      "mb_active_session",
      JSON.stringify({
        userId: seniorId,
        role: "senior",
        fullName: name,
        interests: seniorInterests,
      })
    );
    localStorage.setItem("mb_authenticated_user_id", seniorId);
    localStorage.setItem("mb_welcome_completed", "true");

    store.updateProfile({
      full_name: name,
      role: "senior",
      onboarded: true,
      interests: seniorInterests,
    });
    store.setRole("senior");
    onAuthenticated("senior");
  };

  // ==========================================================================
  // SCREEN 1: WELCOME SCREEN (Warm, Clean, Elder-Friendly)
  // ==========================================================================
  if (stage === "welcome") {
    return (
      <div className="min-h-screen bg-ambient flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E2EAF5] shadow-xl p-7 sm:p-10 text-center space-y-7">
          {/* Memory Bond Official Logo with Generous Whitespace */}
          <div className="flex justify-center pt-2">
            <MemoryBondLogo variant="stacked" size="lg" />
          </div>

          {/* Tagline & Badge */}
          <div className="space-y-2.5">
            <span className="text-xs uppercase tracking-widest font-black text-[#1E6FD9] bg-[#E0F2FE] px-4 py-1.5 rounded-full border border-[#BAE6FD]">
              Care Companion
            </span>
            <p className="text-base sm:text-lg font-bold text-[#627D98] max-w-sm mx-auto leading-relaxed">
              Warm like family. Calm like a companion.
            </p>
          </div>

          {/* 4 Pastel Highlights */}
          <div className="grid grid-cols-2 gap-3 text-left pt-1">
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-1">
              <div className="text-sm font-black text-teal-900 flex items-center gap-1.5">
                <span>💊</span> Medicines
              </div>
              <p className="text-xs text-muted-foreground font-semibold">
                Timely alerts & stock tracking
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1">
              <div className="text-sm font-black text-sky-900 flex items-center gap-1.5">
                <span>🎙️</span> AI Voice
              </div>
              <p className="text-xs text-muted-foreground font-semibold">
                Natural talks in your language
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-1">
              <div className="text-sm font-black text-rose-900 flex items-center gap-1.5">
                <span>👨‍👩‍👧</span> Family Link
              </div>
              <p className="text-xs text-muted-foreground font-semibold">
                Caregiver paired in 1 scan
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
              <div className="text-sm font-black text-indigo-900 flex items-center gap-1.5">
                <span>🧠</span> Memory Games
              </div>
              <p className="text-xs text-muted-foreground font-semibold">
                Calm & stimulating exercises
              </p>
            </div>
          </div>

          {/* Get Started Button */}
          <Button
            size="lg"
            onClick={() => setStage("language")}
            className="w-full h-14 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-3 cursor-pointer transition-transform hover:scale-[1.01] active:scale-98"
          >
            <span>{lang === "en" ? "Get Started" : (t("getStarted") || "Get Started")}</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SCREEN 2: LANGUAGE SELECTION
  // ==========================================================================
  if (stage === "language") {
    return (
      <div className="min-h-screen bg-ambient flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-xl rounded-3xl bg-white border border-sky-100 shadow-xl p-5 sm:p-8 space-y-5">
          <div className="text-center space-y-2">
            <div className="flex justify-center pb-1">
              <MemoryBondLogo variant="horizontal" size="sm" />
            </div>
            <div className="inline-flex items-center gap-2 text-primary bg-primary/10 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Languages className="h-3.5 w-3.5" /> {lang === "en" ? "Language" : (t("language") || "Language")}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display">
              {lang === "en" ? "Choose Your Language" : (t("selectLanguage") || "Choose Your Language")}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {lang === "en"
                ? "Select the language you feel most comfortable speaking and reading"
                : (t("chooseLanguageSubtitle") || "Select the language you feel most comfortable speaking and reading")}
            </p>
          </div>

          {/* Clean Expandable Regional Languages Panel */}
          <RegionalLanguageSection
            store={store}
            defaultExpanded={true}
            className="border-primary/25"
          />

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStage("welcome")}
              className="h-11 px-5 rounded-xl font-bold cursor-pointer gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> {lang === "en" ? "Back" : (t("back") || "Back")}
            </Button>

            <Button
              size="lg"
              onClick={() => setStage("role")}
              className="flex-1 h-12 rounded-2xl font-black text-base bg-primary hover:bg-primary/90 text-white shadow-md gap-2 cursor-pointer"
            >
              <span>{lang === "en" ? "Continue" : (t("continue") || "Continue")}</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SCREEN 3: 2-ROLE SELECTION (Senior vs Caregiver)
  // ==========================================================================
  if (stage === "role") {
    return (
      <div className="min-h-screen bg-ambient flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-xl rounded-3xl bg-white border border-sky-100 shadow-xl p-6 sm:p-10 space-y-7">
          <div className="text-center space-y-2">
            <div className="flex justify-center pb-1">
              <MemoryBondLogo variant="horizontal" size="sm" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display">
              {t("rolePrompt") || "What is your role?"}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {t("chooseRole") || "Please choose how you will be using Memory Bond today"}
            </p>
          </div>

          {/* 2 Large Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Senior Card */}
            <button
              type="button"
              onClick={() => setStage("senior_interests")}
              className="group p-6 rounded-3xl border-2 border-amber-200 hover:border-amber-400 bg-amber-50/40 hover:bg-amber-50 text-left space-y-3.5 transition-all cursor-pointer hover:shadow-md hover:scale-[1.01]"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                👴
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-foreground group-hover:text-amber-900 font-display">
                  {t("roleSenior") || "Senior"}
                </h3>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  {t("selfElderly") || "Self / Elderly"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  {t("roleSeniorDesc") || "Gentle reminders, medicine alerts, voice conversations, and brain games."}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 pt-1">
                <span>{t("enterSenior") || "Enter as Senior"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>

            {/* Caregiver Card */}
            <button
              type="button"
              onClick={() => setStage("caregiver_auth")}
              className="group p-6 rounded-3xl border-2 border-sky-200 hover:border-sky-400 bg-sky-50/40 hover:bg-sky-50 text-left space-y-3.5 transition-all cursor-pointer hover:shadow-md hover:scale-[1.01]"
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                👨‍👩‍👧
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-foreground group-hover:text-primary font-display">
                  {t("roleCaregiver") || "Caregiver / Family"}
                </h3>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">
                  {t("familyGuardian") || "Son, Daughter, Guardian"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  {t("roleCaregiverDesc") || "Manage medicines, schedule reminders, add family photos, and track wellness."}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-primary pt-1">
                <span>{t("enterCaregiver") || "Enter as Caregiver"}</span>
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
              <ArrowLeft className="h-3.5 w-3.5" /> {t("changeLanguage") || "Change Language"}
            </Button>
            <span className="text-xs text-muted-foreground font-semibold">
              {t("step2of2") || "Step 2 of 2"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SCREEN 3B: SENIOR INTEREST SELECTION (NEW STEP)
  // ==========================================================================
  if (stage === "senior_interests") {
    return (
      <SeniorInterestsScreen
        initialInterests={seniorInterests}
        onContinue={(selected) => {
          setSeniorInterests(selected);
          store.updateProfile({ interests: selected });
          try {
            localStorage.setItem("mb_senior_interests", JSON.stringify(selected));
          } catch {}
          setStage("senior_auth");
        }}
        onBack={() => setStage("role")}
      />
    );
  }

  // ==========================================================================
  // SCREEN 4A: SENIOR LINKING & ACCESS
  // ==========================================================================
  if (stage === "senior_auth") {
    const isHindi = lang === "hi";
    const isGujarati = lang === "gu";

    const labels = {
      title: isHindi ? "सीनियर एक्सेस" : isGujarati ? "સિનિયર એક્સેસ" : "Senior Access",
      subtitle: isHindi
        ? "अपने केयरगिवर के साथ त्वरित लिंक"
        : isGujarati
        ? "તમારા કેરગીવર સાથે ઝડપી લિંક"
        : "Quick link with your caregiver",
      nameQuestion: isHindi ? "आपका नाम क्या है?" : isGujarati ? "તમારું નામ શું છે?" : "What is your name?",
      namePlaceholder: isHindi ? "उदा. रमेश शर्मा" : isGujarati ? "દા.ત. રમેશ શર્મા" : "e.g. Ramesh Sharma",
      connectHeader: isHindi
        ? "केयरगिवर के खाते से जुड़ें"
        : isGujarati
        ? "કેરગીવરના ખાતા સાથે જોડાઓ"
        : "Connect to Caregiver's Account",
      scanQrBtn: isHindi
        ? "केयरगिवर का क्यूआर कोड स्कैन करें"
        : isGujarati
        ? "કેરગીવરનો QR કોડ સ્કેન કરો"
        : "Scan Caregiver's QR Code",
      orManual: isHindi
        ? "या केयरगिवर कनेक्शन कोड टाइप करें:"
        : isGujarati
        ? "અથવા કેરગીવર કનેક્શન કોડ લખો:"
        : "Or Type Caregiver Connection Code:",
      linkBtn: isHindi ? "जोड़ें" : isGujarati ? "જોડો" : "Link",
      linkingBtn: isHindi ? "जोड़ रहा है..." : isGujarati ? "જોડાઈ રહ્યું છે..." : "Linking...",
      useDemo: isHindi
        ? "डेमो कोड का उपयोग करें: MB-CG-781042"
        : isGujarati
        ? "ડેમો કોડ વાપરો: MB-CG-781042"
        : "Use Demo Code: MB-CG-781042",
      continueDirect: isHindi
        ? "सीधे सीनियर के रूप में जारी रखें"
        : isGujarati
        ? "સીધા સિનિયર તરીકે ચાલુ રાખો"
        : "Continue Directly as Senior",
    };

    return (
      <div className="min-h-screen bg-ambient flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-md rounded-3xl bg-white border border-sky-100 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <button
              onClick={() => setStage("senior_interests")}
              disabled={isLinking}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="flex justify-center pb-1">
                <MemoryBondLogo variant="horizontal" size="sm" />
              </div>
              <h2 className="text-xl font-black text-foreground font-display">{labels.title}</h2>
              <p className="text-xs text-muted-foreground font-medium">{labels.subtitle}</p>
            </div>
            <div className="w-8" />
          </div>

          {/* Senior Name Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">{labels.nameQuestion}</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={seniorName}
                onChange={(e) => setSeniorName(e.target.value)}
                disabled={isLinking}
                placeholder={labels.namePlaceholder}
                className="h-12 pl-10 text-base font-bold rounded-2xl bg-secondary/30"
              />
            </div>
          </div>

          {/* Pairing Options */}
          <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3.5">
            <div className="text-xs font-bold text-sky-900 uppercase tracking-wider text-center">
              {labels.connectHeader}
            </div>

            {/* Option 1: Scan QR Code */}
            <Button
              type="button"
              disabled={isLinking}
              onClick={() => setIsScannerOpen(true)}
              className="w-full h-12 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-sm gap-2 cursor-pointer disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              {labels.scanQrBtn}
            </Button>

            {/* Option 2: Manual Code */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-muted-foreground">
                {labels.orManual}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={connectionCode}
                  onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                  disabled={isLinking}
                  placeholder="MB-CG-781042"
                  className="h-11 font-mono font-black tracking-wider uppercase text-sm rounded-2xl bg-white"
                />
                <Button
                  onClick={() => handleVerifyAndLinkSenior(connectionCode)}
                  disabled={isLinking || !connectionCode.trim()}
                  className="h-11 px-4 rounded-2xl font-bold text-xs bg-primary text-white cursor-pointer disabled:opacity-50 min-w-[4.5rem]"
                >
                  {isLinking ? (
                    <span className="flex items-center gap-1 text-xs">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </span>
                  ) : (
                    labels.linkBtn
                  )}
                </Button>
              </div>
            </div>

            {/* Demo Quick Code */}
            <button
              type="button"
              disabled={isLinking}
              onClick={() => {
                setConnectionCode("MB-CG-781042");
                handleVerifyAndLinkSenior("MB-CG-781042");
              }}
              className="w-full text-center text-xs text-primary hover:underline font-bold pt-1 cursor-pointer disabled:opacity-50"
            >
              {labels.useDemo}
            </button>
          </div>

          {/* Feedback alerts */}
          {linkingError && (
            <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/40 flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{linkingError}</span>
            </div>
          )}

          {linkingSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{linkingSuccess}</span>
            </div>
          )}

          {/* Continue Directly */}
          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              disabled={isLinking}
              onClick={handleDirectSeniorContinue}
              className="w-full h-11 rounded-2xl text-xs font-bold cursor-pointer disabled:opacity-50 bg-white hover:bg-secondary"
            >
              {labels.continueDirect}
            </Button>
          </div>
        </div>

        {/* QR Scanner Modal */}
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          store={store}
          seniorName={seniorName.trim() || store.profile.full_name || "Ramesh Sharma"}
          onScan={(scanned) => {
            setConnectionCode(scanned);
          }}
          onSuccess={() => {
            setIsScannerOpen(false);
            onAuthenticated("senior");
          }}
          expectedCodeHint={localStorage.getItem("mb_caregiver_unique_code") || "MB-CG-781042"}
          alreadyLinkedCode={localStorage.getItem("mb_linked_caregiver_code") || undefined}
        />
      </div>
    );
  }

  // ==========================================================================
  // SCREEN 4B: CAREGIVER / FAMILY SIGN IN
  // ==========================================================================
  return (
    <div className="min-h-screen bg-ambient flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-3xl bg-white border border-sky-100 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <button
            onClick={() => setStage("role")}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="flex justify-center pb-1">
              <MemoryBondLogo variant="horizontal" size="sm" />
            </div>
            <h2 className="text-xl font-black text-foreground font-display">{t("roleCaregiver") || "Caregiver & Family"}</h2>
            <p className="text-xs text-muted-foreground font-medium">{t("manageAndAssistSenior") || "Sign in to manage and assist your senior"}</p>
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
                ? "bg-primary text-white shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("signIn") || "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("signup")}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              authMode === "signup"
                ? "bg-primary text-white shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("signUp") || "Create Account"}
          </button>
        </div>

        {/* Caregiver Form */}
        <form onSubmit={handleCaregiverAuth} className="space-y-4">
          {authMode === "signup" && (
            <div className="space-y-1">
              <Label className="text-xs font-bold">{t("fullName") || "Full Name"}</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sunita Sharma"
                  className="h-11 pl-10 rounded-2xl text-sm font-semibold bg-secondary/30"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs font-bold">{t("email") || "Email Address"}</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="caregiver@family.org"
                className="h-11 pl-10 rounded-2xl text-sm font-semibold bg-secondary/30"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">{t("password") || "Password"}</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 pl-10 pr-10 rounded-2xl text-sm font-semibold bg-secondary/30"
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
            <div className="p-3 rounded-2xl bg-destructive/15 border border-destructive/40 flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : authMode === "signup" ? (
              t("createCaregiverAccount") || "Create Caregiver Account"
            ) : (
              t("signInCaregiverPortal") || "Sign In to Caregiver Portal"
            )}
          </Button>
        </form>

        {/* 1-Click Instant Caregiver Demo Access */}
        <div className="pt-2 border-t border-border space-y-2">
          <Button
            type="button"
            onClick={handleDemoCaregiverLogin}
            variant="secondary"
            className="w-full h-11 rounded-2xl font-black text-xs gap-2 border border-primary/30 text-foreground cursor-pointer hover:bg-primary/10"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            {t("oneClickCaregiverDemo") || "1-Click Demo Caregiver Portal Access"}
          </Button>
        </div>
      </div>
    </div>
  );
}
