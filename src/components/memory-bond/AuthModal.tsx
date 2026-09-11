import { useState } from "react";
import {
  LogIn,
  UserPlus,
  LogOut,
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Sparkles,
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { MemoryBondStore, UserRole } from "@/lib/memoryBondStore";
import { useI18n } from "@/lib/i18n";

export function AuthModal({
  isOpen,
  onClose,
  store,
}: {
  isOpen: boolean;
  onClose: () => void;
  store: MemoryBondStore;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [role, setRole] = useState<UserRole>("senior");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Password strength helper
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: "", color: "" };
    if (pass.length < 6) return { label: "Too short (min 6 chars)", color: "text-rose-500" };
    if (pass.length < 9) return { label: "Good", color: "text-amber-500" };
    return { label: "Strong & Secure", color: "text-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          throw new Error("For security, password must be at least 6 characters long.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        });

        if (error) throw error;

        // Strict user data isolation
        const userId = data.user?.id || `user_${Date.now()}`;
        localStorage.setItem("mb_authenticated_user_id", userId);

        store.updateProfile({
          full_name: fullName || email.split("@")[0] || "Memory Bond User",
          role,
        });
        store.setRole(role);

        setSuccessMessage("Account created successfully! You are now securely signed in.");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const userRole = (data.user.user_metadata?.["role"] as UserRole) || "senior";
          const userName = data.user.user_metadata?.["full_name"] || email.split("@")[0] || "Memory Bond User";
          localStorage.setItem("mb_authenticated_user_id", data.user.id);

          store.updateProfile({
            full_name: userName,
            role: userRole,
          });
          store.setRole(userRole);
        }
        setSuccessMessage("Signed in successfully!");
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication request failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your email address to receive password reset link.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      setSuccessMessage("Password recovery email has been sent. Please check your inbox.");
    } catch (err: any) {
      setErrorMessage(err.message || "Could not send reset email. Please verify your email address.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || "Google Sign-In is unavailable or not configured in Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = (selectedRole: UserRole) => {
    store.setRole(selectedRole);
    localStorage.setItem("mb_authenticated_user_id", `demo_${selectedRole}`);
    if (selectedRole === "senior") {
      store.updateProfile({ full_name: "Ramesh Sharma", role: "senior" });
    } else if (selectedRole === "caregiver") {
      store.updateProfile({ full_name: "Sunita Sharma (Caregiver)", role: "caregiver" });
    } else if (selectedRole === "healthcare_worker") {
      store.updateProfile({ full_name: "Ananya Goswami, CHW", role: "healthcare_worker" });
    } else {
      store.updateProfile({ full_name: "Admin Coordinator", role: "admin" });
    }
    setSuccessMessage(`Logged in as Demo ${selectedRole.replace("_", " ").toUpperCase()}!`);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("mb_authenticated_user_id");
    store.updateProfile({ full_name: "Guest User", role: "senior" });
    store.setRole("senior");
    setSuccessMessage("Signed out safely.");
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl aurora-surface flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="text-2xl font-black text-foreground">
            {mode === "signin"
              ? t("signIn") || "Sign In to Memory Bond"
              : mode === "signup"
              ? t("signUp") || "Create Your Account"
              : "Reset Your Password"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {mode === "signin"
              ? "Access your saved medicines, daily routines, and family circle."
              : mode === "signup"
              ? "Set up your secure, isolated account for senior care or caregiver access."
              : "Enter your registered email and we will send a password reset link."}
          </p>
        </div>

        {/* Google Sign-In Button */}
        {mode !== "forgot" && (
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 rounded-2xl border-2 border-border hover:bg-secondary/60 flex items-center justify-center gap-3 font-bold text-base cursor-pointer shadow-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
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
              Continue with Google
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border w-full"></div>
              <span className="bg-card px-3 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Or with Email
              </span>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot" ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label className="text-sm font-bold">{t("email") || "Email Address"} *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-9 rounded-2xl h-11 text-base"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" /> {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-bold h-12 rounded-2xl text-base cursor-pointer"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* SIGN IN / SIGN UP FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label className="text-sm font-bold">Full Name *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="pl-9 rounded-2xl h-11 text-base"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-bold">{t("email") || "Email Address"} *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-9 rounded-2xl h-11 text-base"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold">{t("password") || "Password"} *</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 rounded-2xl h-11 text-base"
                />
              </div>
              {mode === "signup" && password.length > 0 && (
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Strength:</span>
                  <span className={`font-bold ${strength.color}`}>{strength.label}</span>
                </div>
              )}
            </div>

            {mode === "signup" && (
              <div>
                <Label className="text-sm font-bold">Select Account Role</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRole("senior")}
                    className={`p-2.5 rounded-2xl border-2 font-bold text-xs transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                      role === "senior"
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    👴 Senior User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("caregiver")}
                    className={`p-2.5 rounded-2xl border-2 font-bold text-xs transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                      role === "caregiver"
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    👩‍⚕️ Caregiver / Family
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("healthcare_worker")}
                    className={`p-2.5 rounded-2xl border-2 font-bold text-xs transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                      role === "healthcare_worker"
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    🩺 Health Worker
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`p-2.5 rounded-2xl border-2 font-bold text-xs transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                      role === "admin"
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-secondary/40 border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    🛡️ Administrator
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" /> {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-bold h-12 rounded-2xl text-base cursor-pointer shadow-md"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "signin" ? (
                t("signIn") || "Sign In Securely"
              ) : (
                t("signUp") || "Create Secure Account"
              )}
            </Button>
          </form>
        )}

        {/* Quick Demo Login Option */}
        <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2 text-center">
          <span className="text-xs font-bold text-primary flex items-center justify-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Instant Senior & Caregiver Demo Login:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("senior")}
              className="text-xs font-bold rounded-xl h-9 px-1 cursor-pointer"
            >
              👴 Senior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("caregiver")}
              className="text-xs font-bold rounded-xl h-9 px-1 cursor-pointer"
            >
              👩‍⚕️ Caregiver
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("healthcare_worker")}
              className="text-xs font-bold rounded-xl h-9 px-1 cursor-pointer"
            >
              🩺 Healthcare
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("admin")}
              className="text-xs font-bold rounded-xl h-9 px-1 cursor-pointer"
            >
              🛡️ Admin
            </Button>
          </div>
        </div>

        {/* Footer: Toggle Mode / Secure Sign Out */}
        <div className="flex justify-between items-center text-xs pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary font-bold hover:underline cursor-pointer"
          >
            {mode === "signin"
              ? "Need an account? Sign Up"
              : "Already have an account? Sign In"}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-destructive font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> {t("signOut") || "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
