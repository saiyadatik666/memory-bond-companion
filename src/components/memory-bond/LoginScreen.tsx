import React, { useState, useEffect } from "react";
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
import { saveActiveSession } from "@/lib/authGuards";
import { syncUserProfile, checkOAuthRedirectError } from "@/lib/userProfileService";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for OAuth redirect errors upon returning from Google / Facebook
  useEffect(() => {
    const redirectErr = checkOAuthRedirectError();
    if (redirectErr) {
      setErrorMessage(redirectErr);
      setStage("caregiver_auth");
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.hash = "";
        url.search = "";
        window.history.replaceState(null, "", url.toString());
      }
    }
  }, []);

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
        const emailTrimmed = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
          throw new Error("Please enter a valid email address.");
        }
        if (!password || password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password,
          options: {
            data: {
              full_name: fullName.trim() || "Caregiver",
              role: "caregiver",
            },
          },
        });

        if (error) {
          const errLower = error.message?.toLowerCase() || "";
          if (errLower.includes("already registered") || errLower.includes("already exists")) {
            throw new Error("An account with this email already exists. Please sign in instead.");
          }
          throw error;
        }

        if (data.user) {
          const synced = await syncUserProfile(data.user, "caregiver");
          const caregiverCode = getOrCreateCaregiverCode(data.user.id);
          const resolvedName = synced.full_name || fullName.trim() || "Caregiver";

          saveActiveSession({
            userId: data.user.id,
            role: "caregiver",
            email: data.user.email || emailTrimmed,
            fullName: resolvedName,
            caregiverCode,
          });
          localStorage.setItem("mb_welcome_completed", "true");

          store.updateProfile({
            full_name: resolvedName,
            role: "caregiver",
          });
          store.setRole("caregiver");
          store.reloadUserData?.();

          if (!data.session) {
            setSuccessMessage("Caregiver account created! If email confirmation is required, please check your inbox before signing in.");
          } else {
            setSuccessMessage("Caregiver account created! Opening Caregiver Dashboard...");
            setTimeout(() => {
              onAuthenticated("caregiver");
            }, 600);
          }
        }
      } else {
        // Sign in - strictly authenticates existing account
        const emailTrimmed = email.trim();
        if (!emailTrimmed || !password.trim()) {
          throw new Error("Please enter both your email and password.");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password,
        });

        if (error) {
          console.warn("[Auth] Sign-in error:", error);
          const errLower = error.message?.toLowerCase() || "";
          if (errLower.includes("invalid login credentials") || error.status === 400) {
            throw new Error("Incorrect email or password. Please try again. If you don't have an account, please create one first.");
          }
          if (errLower.includes("email not confirmed")) {
            throw new Error("Your email address is not verified yet. Please check your email inbox for the confirmation link.");
          }
          if (errLower.includes("fetch") || errLower.includes("network") || errLower.includes("connection")) {
            throw new Error("We couldn't connect right now. Please check your internet connection and try again.");
          }
          throw error;
        }

        const user = data.user;
        if (!user) {
          throw new Error("No account found with this email. Please create an account first.");
        }

        const synced = await syncUserProfile(user, "caregiver");
        const caregiverCode = getOrCreateCaregiverCode(user.id);
        const name = synced.full_name || user.user_metadata?.full_name || emailTrimmed.split("@")[0] || "Caregiver";

        saveActiveSession({
          userId: user.id,
          role: "caregiver",
          email: user.email || emailTrimmed,
          fullName: name,
          caregiverCode,
        });
        localStorage.setItem("mb_welcome_completed", "true");

        store.updateProfile({
          full_name: name,
          role: "caregiver",
        });
        store.setRole("caregiver");
        store.reloadUserData?.();

        setSuccessMessage("Welcome back! Opening Caregiver Dashboard...");
        setTimeout(() => {
          onAuthenticated("caregiver");
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please check credentials or use Demo Access below.");
    } finally {
      setIsLoading(false);
    }
  };

  // PASSWORD RECOVERY / FORGOT PASSWORD
  const handleForgotPassword = async () => {
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorMessage("Please enter your email address in the field above first, then click 'Forgot password?'.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const redirectOrigin = typeof window !== "undefined"
        ? window.location.origin
        : "https://memory-bond-ai.lovable.app";
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
        redirectTo: `${redirectOrigin}/`,
      });
      if (error) throw error;
      setSuccessMessage(`Password recovery instructions sent to ${emailTrimmed}! Please check your email inbox.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not send password reset email. Please verify your email and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // OAUTH SOCIAL SIGN IN (Google / Facebook)
  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const redirectOrigin = typeof window !== "undefined"
        ? window.location.origin
        : "https://memory-bond-ai.lovable.app";
      const redirectTo = `${redirectOrigin}/`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: provider === "google" ? {
            access_type: "offline",
            prompt: "consent",
          } : undefined,
        },
      });

      if (error) {
        if (error.message?.includes("provider is not enabled") || error.message?.includes("Unsupported provider")) {
          throw new Error(
            `${provider === "google" ? "Google" : "Facebook"} login is ready in Memory Bond, but requires activating the ${provider === "google" ? "Google" : "Facebook"} provider in your Supabase Auth dashboard (Authentication -> Providers).`
          );
        }
        throw error;
      }
    } catch (err: any) {
      console.error(`${provider} OAuth error:`, err);
      if (err.message?.includes("fetch") || err.message?.includes("network")) {
        setErrorMessage("We couldn't connect right now. Please check your internet connection and try again.");
      } else {
        setErrorMessage(
          err.message || `${provider === "google" ? "Google" : "Facebook"} sign-in could not be completed. Please try again.`
        );
      }
      setIsLoading(false);
    }
  };

  // ONE-CLICK CAREGIVER DEMO LOGIN (Priya Patel)
  const handleDemoCaregiverLogin = () => {
    const demoId = "cg_demo_priya";
    const caregiverCode = getOrCreateCaregiverCode(demoId);

    saveActiveSession({
      userId: demoId,
      role: "caregiver",
      email: "priya.patel@memorybond.org",
      fullName: "Priya Patel (Caregiver)",
      caregiverCode,
    });
    localStorage.setItem("mb_welcome_completed", "true");

    store.updateProfile({
      full_name: "Priya Patel (Caregiver)",
      role: "caregiver",
    });
    store.setRole("caregiver");

    setSuccessMessage("Opening Caregiver Dashboard for Priya Patel...");
    setTimeout(() => {
      onAuthenticated("caregiver");
    }, 500);
  };

  // ONE-CLICK FULL EVALUATION DEMO (Meena Patel - Senior Mode)
  const handleStartFullDemo = () => {
    const seniorId = "demo_senior_meena";
    const caregiverCode = "MB-CG-781042";

    saveActiveSession({
      userId: seniorId,
      role: "senior",
      fullName: "Meena Patel",
      caregiverCode,
    });
    localStorage.setItem("mb_welcome_completed", "true");

    store.updateProfile({
      full_name: "Meena Patel",
      role: "senior",
      onboarded: true,
    });
    store.setRole("senior");

    setSuccessMessage("Launching Memory Bond Demo for Meena Patel...");
    setTimeout(() => {
      onAuthenticated("senior");
    }, 400);
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
        seniorName: seniorName.trim() || store.profile.full_name || "Meena Patel",
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

      saveActiveSession({
        userId: `senior_${Date.now()}`,
        role: "senior",
        fullName: seniorName.trim() || store.profile.full_name || "Meena Patel",
        caregiverCode: cleanCode,
        interests: seniorInterests,
      });
      localStorage.setItem("mb_welcome_completed", "true");

      store.updateProfile({
        full_name: seniorName.trim() || store.profile.full_name || "Meena Patel",
        role: "senior",
        onboarded: true,
        interests: seniorInterests,
      });
      store.setRole("senior");

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
    const name = seniorName.trim() || "Meena Patel";

    saveActiveSession({
      userId: seniorId,
      role: "senior",
      fullName: name,
      interests: seniorInterests,
    });
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
  // SCREEN 1: WELCOME SCREEN (Section 8: Warm, Emotionally Supportive, 2 Roles)
  // ==========================================================================
  if (stage === "welcome") {
    return (
      <div className="min-h-screen bg-ambient flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 select-none">
        <div className="w-full max-w-xl rounded-3xl bg-white border border-[#E2EAF5] shadow-xl p-6 sm:p-10 space-y-6">
          {/* Top Bar: Logo & Language Selector Dropdown */}
          <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-4">
            <div className="flex items-center gap-2">
              <MemoryBondLogo variant="horizontal" size="sm" />
            </div>

            {/* Language Selector (Default: English) */}
            <div className="flex items-center gap-1.5 bg-[#F4F8FD] border border-[#E2EAF5] px-2.5 py-1 rounded-xl">
              <Languages className="h-3.5 w-3.5 text-primary" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="as">অসমীয়া (Assamese)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="mni">মৈতৈলোন্ (Manipuri)</option>
              </select>
            </div>
          </div>

          {/* Heading & Emotional Subtitle (Section 8) */}
          <div className="text-center space-y-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F243E] font-display flex items-center justify-center gap-2">
              <span>Welcome to Memory Bond</span>
              <span className="text-rose-500">❤️</span>
            </h1>
            <p className="text-sm sm:text-base font-semibold text-[#5B728D] max-w-md mx-auto leading-relaxed">
              A smarter way to stay connected, engaged and supported.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
              Technology with a Human Heart
            </div>
          </div>

          {/* TWO LARGE OPTIONS (Section 8 & 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Option 1: 👵 I'm a Senior */}
            <button
              type="button"
              onClick={() => {
                if (!store.profile.onboarded) {
                  // Direct to simple senior onboarding
                  handleDirectSeniorContinue();
                } else {
                  handleDirectSeniorContinue();
                }
              }}
              className="group p-5 rounded-3xl border-2 border-amber-200 hover:border-amber-400 bg-amber-50/40 hover:bg-amber-50 text-left space-y-3 transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01]"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                👵
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#0F243E] group-hover:text-amber-900 font-display">
                  I'm a Senior
                </h3>
                <p className="text-xs font-semibold text-[#5B728D] leading-relaxed">
                  Simple and accessible experience with gentle brain activities, reminders & voice assistance.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 pt-1">
                <span>Start Senior Mode</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>

            {/* Option 2: 👨‍👩‍👧 I'm a Caregiver */}
            <button
              type="button"
              onClick={() => setStage("caregiver_auth")}
              className="group p-5 rounded-3xl border-2 border-sky-200 hover:border-sky-400 bg-sky-50/40 hover:bg-sky-50 text-left space-y-3 transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01]"
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                👨‍👩‍👧
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-[#0F243E] group-hover:text-primary font-display">
                  I'm a Caregiver
                </h3>
                <p className="text-xs font-semibold text-[#5B728D] leading-relaxed">
                  Monitor and support your loved one with activity tracking, alerts & daily routines.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-primary pt-1">
                <span>Caregiver Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>

          {/* ONE-CLICK EVALUATOR / DEMO BUTTON (Section 39) */}
          <div className="p-4 rounded-2xl bg-[#F0F7FF] border border-[#BAE6FD] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left min-w-0">
              <div className="text-xs font-black text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Instant Evaluator Demo Mode</span>
              </div>
              <p className="text-[11px] font-semibold text-[#5B728D] mt-0.5">
                Experience full connected flow as Meena Patel (Senior) paired with Priya Patel (Caregiver).
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleStartFullDemo}
              className="h-10 px-4 rounded-xl font-black text-xs bg-primary hover:bg-primary/90 text-white shadow-xs shrink-0 cursor-pointer"
            >
              <span>Explore Demo</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          {/* 5 SYSTEM HIGHLIGHTS (Section 3 & 45) */}
          <div className="pt-2 border-t border-[#EDF2F7]">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px] font-bold text-[#5B728D]">
              <div className="p-2 rounded-xl bg-slate-50">🧠 Cognitive Games</div>
              <div className="p-2 rounded-xl bg-slate-50">🎤 Voice AI</div>
              <div className="p-2 rounded-xl bg-slate-50">💊 Smart Reminders</div>
              <div className="p-2 rounded-xl bg-slate-50">👨‍👩‍👧 Family Care</div>
              <div className="p-2 rounded-xl bg-slate-50 col-span-2 sm:col-span-1">📶 Offline Support</div>
            </div>
          </div>

          {/* Section 46: HOW IT WORKS (Play → Learn → Adapt → Connect → Support) */}
          <div className="rounded-2xl border border-[#E2EAF5] bg-[#F8FAFC] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                How Memory Bond Works
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                5-Step Care Loop
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-left">
              <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                <div className="text-[10px] font-black text-primary uppercase">01 — Play</div>
                <div className="text-xs font-bold text-foreground">Cognitive Game</div>
                <p className="text-[10px] text-muted-foreground leading-tight">Senior completes enjoyable memory activity.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                <div className="text-[10px] font-black text-emerald-600 uppercase">02 — Learn</div>
                <div className="text-xs font-bold text-foreground">Record Data</div>
                <p className="text-[10px] text-muted-foreground leading-tight">Records actual accuracy and reaction rhythm.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                <div className="text-[10px] font-black text-indigo-600 uppercase">03 — Adapt</div>
                <div className="text-xs font-bold text-foreground">AI Adjustment</div>
                <p className="text-[10px] text-muted-foreground leading-tight">Difficulty gently calibrates to ensure calm engagement.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                <div className="text-[10px] font-black text-amber-600 uppercase">04 — Connect</div>
                <div className="text-xs font-bold text-foreground">Family Circle</div>
                <p className="text-[10px] text-muted-foreground leading-tight">Caregivers stay informed with live updates.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-border/80 space-y-0.5">
                <div className="text-[10px] font-black text-rose-600 uppercase">05 — Support</div>
                <div className="text-xs font-bold text-foreground">Daily Routine</div>
                <p className="text-[10px] text-muted-foreground leading-tight">Reminders & alerts assist with medicines & water.</p>
              </div>
            </div>
          </div>

          {/* Section 47: NORTH EASTERN REGION FOCUS */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/50 p-4 space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎋</span>
              <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                Designed for Connected Care — Even in Remote Communities
              </h4>
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Tailored for elderly individuals and rural families across the North Eastern Region: multilingual voice interaction (Assamese, Bengali, Manipuri), offline-first local storage, simple high-contrast touch targets, and culturally adaptable memory objects.
            </p>
          </div>
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

          {/* Forgot password (sign-in mode only) */}
          {authMode === "signin" && (
            <div className="text-right">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleForgotPassword}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
          )}

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

          {/* Divider */}
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleOAuthLogin("google")}
            className="w-full h-11 rounded-2xl border-2 border-[#E2EAF5] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all flex items-center justify-center gap-3 font-bold text-sm text-[#1A2B4B] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {/* Google SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.96 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.16C6.51 42.62 14.62 48 24 48z"/>
              <path fill="#FBBC05" d="M10.53 28.64A14.52 14.52 0 0 1 9.5 24c0-1.62.28-3.19.76-4.64l-7.98-6.16A23.93 23.93 0 0 0 0 24c0 3.77.9 7.34 2.5 10.48l8.03-5.84z"/>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.89C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.5 13.52l8.03 6.16C12.43 13.72 17.74 9.5 24 9.5z"/>
            </svg>
            Continue with Google
          </button>

          {/* Facebook OAuth Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleOAuthLogin("facebook")}
            className="w-full h-11 rounded-2xl border-2 border-[#E2EAF5] bg-white hover:bg-[#F0F4FF] hover:border-[#CBD5E1] transition-all flex items-center justify-center gap-3 font-bold text-sm text-[#1A2B4B] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {/* Facebook SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
              <linearGradient id="fb_grad" x1="6.228" x2="42.077" y1="4.896" y2="43.432" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#0062e0"/>
                <stop offset="1" stopColor="#19afff"/>
              </linearGradient>
              <path fill="url(#fb_grad)" d="M42 24c0-9.941-8.059-18-18-18S6 14.059 6 24c0 8.984 6.576 16.422 15.18 17.78V29.25h-4.57V24h4.57v-3.968c0-4.508 2.685-6.996 6.794-6.996 1.969 0 4.028.351 4.028.351v4.429h-2.269c-2.236 0-2.931 1.387-2.931 2.81V24h4.993l-.798 5.25H26.8V41.78C35.424 40.422 42 32.984 42 24z"/>
            </svg>
            Continue with Facebook
          </button>
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
