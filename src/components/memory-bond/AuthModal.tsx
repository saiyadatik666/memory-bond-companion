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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [role, setRole] = useState<"senior" | "caregiver">("senior");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "signup") {
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

        store.updateProfile({
          full_name: fullName || email.split("@")[0] || "Memory Bond User",
          role,
        });
        setSuccessMessage("Account created successfully! You are now signed in.");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          store.updateProfile({
            full_name: data.user.user_metadata?.["full_name"] || email.split("@")[0] || "Memory Bond User",
            role: data.user.user_metadata?.["role"] === "caregiver" ? "caregiver" : "senior",
          });
        }
        setSuccessMessage("Signed in successfully!");
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      // If offline or network error, provide friendly fallback
      setErrorMessage(err.message || "Authentication request failed. You can also use Quick Demo Login below.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = (selectedRole: "senior" | "caregiver") => {
    store.setRole(selectedRole);
    if (selectedRole === "senior") {
      store.updateProfile({ full_name: "Ramesh Sharma", role: "senior" });
    } else {
      store.updateProfile({ full_name: "Sunita Sharma (Caregiver)", role: "caregiver" });
    }
    setSuccessMessage(`Logged in as Demo ${selectedRole === "senior" ? "Senior" : "Caregiver"}!`);
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
    store.updateProfile({ full_name: "Guest User" });
    setSuccessMessage("Signed out.");
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl aurora-surface flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="text-2xl font-black text-foreground">
            {mode === "signin" ? t("signIn") || "Sign In to Memory Bond" : t("signUp") || "Create Your Account"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {mode === "signin"
              ? "Access your saved medicines, routines, and family circle."
              : "Set up your secure profile for senior care or caregiver access."}
          </p>
        </div>

        {/* Quick Demo Login Option for Judges */}
        <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2 text-center">
          <span className="text-xs font-bold text-primary flex items-center justify-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> One-Click Demo Access for Evaluators:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("senior")}
              className="text-xs font-bold rounded-xl"
            >
              👴 Senior User
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoSignIn("caregiver")}
              className="text-xs font-bold rounded-xl"
            >
              👩‍⚕️ Caregiver
            </Button>
          </div>
        </div>

        {/* Email Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label>Full Name *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>
          )}

          <div>
            <Label>{t("email") || "Email Address"} *</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="pl-9 rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label>{t("password") || "Password"} *</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 rounded-xl"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <Label>Your Role</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRole("senior")}
                  className={`p-2.5 rounded-xl border-2 font-bold text-xs transition-all ${
                    role === "senior"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 border-border"
                  }`}
                >
                  {t("iAmSenior") || "I am a Senior"}
                </button>
                <button
                  type="button"
                  onClick={() => setRole("caregiver")}
                  className={`p-2.5 rounded-xl border-2 font-bold text-xs transition-all ${
                    role === "caregiver"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 border-border"
                  }`}
                >
                  {t("iAmCaregiver") || "I am a Caregiver"}
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-center text-destructive font-medium">{errorMessage}</p>
          )}

          {successMessage && (
            <p className="text-xs text-center text-success font-bold">{successMessage}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full font-bold h-12 rounded-xl text-base"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : mode === "signin" ? (
              t("signIn") || "Sign In"
            ) : (
              t("signUp") || "Create Account"
            )}
          </Button>
        </form>

        {/* Toggle mode or Sign out */}
        <div className="flex justify-between items-center text-xs pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-primary font-bold hover:underline"
          >
            {mode === "signin"
              ? "Need an account? Sign Up"
              : "Already have an account? Sign In"}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-destructive font-bold hover:underline flex items-center gap-1"
          >
            <LogOut className="h-3 w-3" /> {t("signOut") || "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
