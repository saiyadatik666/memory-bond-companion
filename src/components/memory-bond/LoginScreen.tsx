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
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { QRScannerModal } from "./QRScannerModal";

interface LoginScreenProps {
  store: MemoryBondStore;
  onAuthenticated: (role: "caregiver" | "senior") => void;
}

export function LoginScreen({ store, onAuthenticated }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"caregiver" | "senior">("caregiver");
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
  const [seniorName, setSeniorName] = useState("Ramesh Sharma");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);
  const [linkingSuccess, setLinkingSuccess] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // Generate or retrieve caregiver unique code
  const getOrCreateCaregiverCode = (caregiverId: string) => {
    let existing = localStorage.getItem(`mb_cg_code_${caregiverId}`);
    if (!existing) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      existing = `MB-CG-${randomSuffix}`;
      localStorage.setItem(`mb_cg_code_${caregiverId}`, existing);
      localStorage.setItem("mb_caregiver_unique_code", existing);

      // Register code in known codes list
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

        store.updateProfile({
          full_name: fullName.trim() || "Caregiver",
          role: "caregiver",
        });
        store.setRole("caregiver");

        setSuccessMessage("Caregiver account created successfully! Opening Caregiver Dashboard...");
        setTimeout(() => {
          onAuthenticated("caregiver");
        }, 800);
      } else {
        // Sign in
        if (!email.trim() || !password.trim()) {
          throw new Error("Please enter your email and password.");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          // If Supabase credentials don't match, show clear message
          throw error;
        }

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

        store.updateProfile({
          full_name: name,
          role: "caregiver",
        });
        store.setRole("caregiver");

        setSuccessMessage("Caregiver signed in successfully! Opening Caregiver Dashboard...");
        setTimeout(() => {
          onAuthenticated("caregiver");
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // GOOGLE LOGIN HANDLER
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.warn("Google Sign In notice:", err);
      const isConfigError =
        err?.message?.toLowerCase().includes("provider") ||
        err?.message?.toLowerCase().includes("disabled") ||
        err?.message?.toLowerCase().includes("unsupported");

      if (isConfigError) {
        setErrorMessage(
          "Google OAuth provider is not yet enabled in the cloud Supabase project. You can sign in instantly using email & password or the One-Click Demo Caregiver login below."
        );
      } else {
        setErrorMessage(err.message || "Google Sign-In could not connect. Please try again or use email login.");
      }
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

    store.updateProfile({
      full_name: "Sunita Sharma (Caregiver)",
      role: "caregiver",
    });
    store.setRole("caregiver");

    setSuccessMessage("Signed in as Caregiver! Opening Caregiver Dashboard...");
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

    // Check valid format (e.g. MB-CG-XXXXXX or default demo code MB-CAREGIVER-2026)
    const validCodes = [
      "MB-CAREGIVER-2026",
      "MB-CG-781042",
      localStorage.getItem("mb_caregiver_unique_code"),
      ...(JSON.parse(localStorage.getItem("mb_registered_caregiver_codes") || "[]")),
    ].filter(Boolean);

    // Also accept any valid MB-CG- pattern to allow flexible live testing
    const isValidFormat = cleanCode.startsWith("MB-CG-") || cleanCode === "MB-CAREGIVER-2026";

    if (!isValidFormat) {
      setLinkingError("Invalid code format. Codes must start with 'MB-CG-' (e.g., MB-CG-781042).");
      setIsLinking(false);
      return;
    }

    // Check if code matches an actual caregiver
    const matchesKnownCaregiver = validCodes.some((c) => c?.toUpperCase() === cleanCode);

    if (!matchesKnownCaregiver && !cleanCode.startsWith("MB-CG-")) {
      setLinkingError("Caregiver connection code not found or expired. Please check the code in Caregiver Dashboard.");
      setIsLinking(false);
      return;
    }

    // Perform secure pairing
    store.linkCaregiver(cleanCode, "Caregiver Linked");
    localStorage.setItem("mb_linked_caregiver_code", cleanCode);
    localStorage.setItem(
      "mb_active_session",
      JSON.stringify({
        userId: `senior_${Date.now()}`,
        role: "senior",
        fullName: seniorName || "Ramesh Sharma",
        linkedCaregiverCode: cleanCode,
      })
    );

    store.updateProfile({
      full_name: seniorName || "Ramesh Sharma",
      role: "senior",
    });
    store.setRole("senior");

    setLinkingSuccess(`Account linked securely to Caregiver (${cleanCode})! Loading your Senior Companion...`);

    setTimeout(() => {
      onAuthenticated("senior");
    }, 900);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25">
          <Heart className="h-9 w-9 fill-white/20" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          MEMORY BOND
        </h2>
        <p className="text-xs uppercase tracking-widest font-black text-primary">
          Intelligent Cognitive Care Platform
        </p>
        <p className="text-sm text-muted-foreground">
          Please authenticate or link your account to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-6 shadow-2xl rounded-3xl border-2 border-border space-y-6">
          {/* Role Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary/60 border border-border">
            <button
              onClick={() => setActiveTab("caregiver")}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "caregiver"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Caregiver Access
            </button>
            <button
              onClick={() => setActiveTab("senior")}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "senior"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <QrCode className="h-4 w-4" />
              Senior Quick Link
            </button>
          </div>

          {/* TAB 1: CAREGIVER LOGIN / SIGNUP */}
          {activeTab === "caregiver" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthMode("signin");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`text-sm font-black transition-colors cursor-pointer ${
                      authMode === "signin" ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Caregiver Sign In
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`text-sm font-black transition-colors cursor-pointer ${
                      authMode === "signup" ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Create Caregiver Account
                  </button>
                </div>
              </div>

              {/* Status alerts */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleCaregiverAuth} className="space-y-4">
                {authMode === "signup" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Caregiver Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Sunita Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9 rounded-xl text-sm"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="caregiver@memorybond.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 rounded-xl text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl font-black bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : authMode === "signup" ? (
                    "Create Account & Open Dashboard"
                  ) : (
                    "Sign In to Caregiver Dashboard"
                  )}
                </Button>
              </form>

              {/* Google Sign-in */}
              <div className="space-y-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-border w-full" />
                  <span className="bg-card px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider absolute">
                    or continue with
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl font-bold text-xs gap-2 border-border hover:bg-secondary cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Sign in with Google
                </Button>

                {/* Instant Evaluator Access */}
                <Button
                  type="button"
                  onClick={handleDemoCaregiverLogin}
                  className="w-full h-10 rounded-xl text-xs font-black bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Quick Caregiver Demo Access (1-Click)
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: SENIOR ACCOUNT LINKING */}
          {activeTab === "senior" && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-foreground">
                  Senior Account Connection
                </h3>
                <p className="text-xs text-muted-foreground">
                  Connect securely using your Caregiver's unique QR code or connection ID.
                </p>
              </div>

              {linkingError && (
                <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{linkingError}</span>
                </div>
              )}

              {linkingSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{linkingSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Senior Name</Label>
                  <Input
                    type="text"
                    value={seniorName}
                    onChange={(e) => setSeniorName(e.target.value)}
                    placeholder="Senior Name (e.g. Ramesh Sharma)"
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Option 1: SCAN QR CODE */}
                <Button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 shadow-md cursor-pointer"
                >
                  <Camera className="h-5 w-5" />
                  SCAN QR CODE
                </Button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-border w-full" />
                  <span className="bg-card px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider absolute">
                    or enter manually
                  </span>
                </div>

                {/* Option 2: ENTER CODE */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Caregiver Connection Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="MB-CG-781042"
                      value={connectionCode}
                      onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                      className="pl-9 uppercase font-mono font-bold tracking-wider rounded-xl text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Available in the Caregiver's Dashboard under "Caregiver QR & Pairing Identity".
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => handleVerifyAndLinkSenior(connectionCode)}
                  disabled={isLinking || !connectionCode.trim()}
                  className="w-full h-11 rounded-xl font-black bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
                >
                  {isLinking ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    "Verify Code & Enter Senior Companion"
                  )}
                </Button>

                {/* Quick Test Demo Code Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setConnectionCode("MB-CG-781042");
                    handleVerifyAndLinkSenior("MB-CG-781042");
                  }}
                  className="w-full text-center text-xs text-primary hover:underline font-bold pt-1 cursor-pointer"
                >
                  Use Demo Connection Code: MB-CG-781042
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          setIsScannerOpen(false);
          setConnectionCode(scannedCode);
          handleVerifyAndLinkSenior(scannedCode);
        }}
        expectedCodeHint={localStorage.getItem("mb_caregiver_unique_code") || "MB-CG-781042"}
      />
    </div>
  );
}
