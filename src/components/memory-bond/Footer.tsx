import {
  Heart,
  Brain,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  Mic,
  ArrowUp,
  Activity,
  Pill,
  Gamepad2,
  Users,
  Settings,
  Calendar,
  LifeBuoy,
  Clock,
  Radio,
  Lock,
} from "lucide-react";
import { LANGUAGES, useI18n, type LangCode } from "@/lib/i18n";
import type { MemoryBondStore } from "@/lib/memoryBondStore";

interface FooterProps {
  store: MemoryBondStore;
  onNavigate: (tab: string) => void;
  onOpenSos: () => void;
  onOpenVoice: () => void;
  onOpenAuth: () => void;
}

export function Footer({
  store,
  onNavigate,
  onOpenSos,
  onOpenVoice,
  onOpenAuth,
}: FooterProps) {
  const { lang, setLang, t } = useI18n();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLanguageChange = (code: LangCode) => {
    setLang(code);
    store.updateProfile({ language: code });
  };

  const isCaregiver = store.profile.role === "caregiver";

  const toggleRole = () => {
    const nextRole = isCaregiver ? "senior" : "caregiver";
    store.updateProfile({ role: nextRole });
    onNavigate(nextRole === "caregiver" ? "caregiver" : "home");
  };

  return (
    <footer className="relative mt-12 bg-card/90 dark:bg-card/40 backdrop-blur-2xl border-t border-border/80 text-foreground transition-colors overflow-hidden">
      {/* Aurora Top Accent Gradient Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 opacity-90 shadow-[0_0_12px_rgba(20,184,166,0.5)]" />

      {/* Quick Interactive Utility Bar */}
      <div className="border-b border-border/60 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Role Switcher & Live Pulse */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 border border-border text-foreground font-medium shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>System: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Online & Encrypted</strong></span>
            </div>

            <button
              onClick={toggleRole}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all cursor-pointer font-bold"
              title="Click to toggle Senior / Caregiver role"
            >
              <Users className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              <span>Current Role: <strong>{isCaregiver ? "Caregiver Portal" : "Senior Companion"}</strong></span>
              <span className="text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-black ml-1">
                Switch
              </span>
            </button>
          </div>

          {/* Right: Instant Assistance Triggers & Back to Top */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/15 hover:bg-teal-500/25 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition-all font-bold cursor-pointer hover:shadow-sm"
            >
              <Mic className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
              <span>Voice Assistant</span>
            </button>

            <button
              onClick={onOpenSos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-all font-bold cursor-pointer hover:shadow-sm"
            >
              <PhoneCall className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>Emergency SOS</span>
            </button>

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-all font-semibold cursor-pointer shadow-sm group"
              title="Back to Top"
            >
              <ArrowUp className="h-3.5 w-3.5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Top</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Brand, Mission & Hackathon Badges (Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Heart className="h-6 w-6 fill-white/25" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight font-display bg-gradient-to-r from-teal-600 via-cyan-600 to-primary dark:from-teal-300 dark:via-cyan-300 dark:to-primary bg-clip-text text-transparent">
                  MEMORY BOND
                </h3>
                <p className="text-xs font-semibold text-muted-foreground">
                  AI Cognitive Gaming & Memory Companion
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              A serene, accessible digital companion designed with large touch surfaces, gentle memory stimulation, and natural voice guidance to support elders and families facing cognitive decline.
            </p>

            {/* SIH 2026 & Trust Badges */}
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-bold">
                <Sparkles className="h-3 w-3 text-teal-500" />
                SIH 2026 • SIH26003
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                <ShieldCheck className="h-3 w-3 text-primary" />
                NER Multilingual Support
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold">
                <Radio className="h-3 w-3 text-emerald-500" />
                Offline-First Architecture
              </span>
            </div>
          </div>

          {/* Column 2: Senior Daily Navigation (Span 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-foreground/90 flex items-center gap-2">
              <Heart className="h-4 w-4 text-teal-500" />
              Senior Companion
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button
                  onClick={() => onNavigate("home")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                  {t("home") || "Home Dashboard"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("medicines")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Pill className="h-3.5 w-3.5 text-teal-500" />
                  {t("medicines") || "Medicine Manager & Stock"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("reminders")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Clock className="h-3.5 w-3.5 text-teal-500" />
                  {t("reminders") || "Smart Voice Reminders"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("games")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Gamepad2 className="h-3.5 w-3.5 text-teal-500" />
                  {t("games") || "10 Cognitive Memory Games"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("checkin")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Brain className="h-3.5 w-3.5 text-teal-500" />
                  {t("checkin") || "Cognitive Agility Check-in"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("journal")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Mic className="h-3.5 w-3.5 text-teal-500" />
                  {t("journal") || "Voice Journal & Audio Notes"}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Caregiver & Family Network (Span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-foreground/90 flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-500" />
              Family & Care
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button
                  onClick={() => onNavigate("caregiver")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Activity className="h-3.5 w-3.5 text-cyan-500" />
                  {t("caregiverDashboard") || "Caregiver Console"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("routine")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Clock className="h-3.5 w-3.5 text-cyan-500" />
                  {t("routine") || "Daily Routine Plan"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("appointments")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                  {t("appointments") || "Doctor Appointments"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("family")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Users className="h-3.5 w-3.5 text-cyan-500" />
                  {t("family") || "Family Contact Circle"}
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAuth}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Lock className="h-3.5 w-3.5 text-cyan-500" />
                  {store.profile.fullName ? "Account Profile" : "Sign In / Evaluator Demo"}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("settings")}
                  className="hover:text-primary hover:translate-x-1 transition-all flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Settings className="h-3.5 w-3.5 text-cyan-500" />
                  {t("settings") || "Settings & Accessibility"}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Emergency Helplines & Safety Contacts (Span 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-foreground/90 flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-rose-500" />
              National Helplines
            </h4>
            <div className="space-y-2.5">
              <a
                href="tel:112"
                className="group flex items-center justify-between p-2.5 rounded-xl bg-background/80 hover:bg-rose-500/10 border border-border hover:border-rose-500/30 transition-all text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 group-hover:scale-105 transition-transform">
                    <PhoneCall className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">National Emergency</p>
                    <p className="text-[11px] text-muted-foreground">Police, Fire & Medical</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md">
                  112
                </span>
              </a>

              <a
                href="tel:14567"
                className="group flex items-center justify-between p-2.5 rounded-xl bg-background/80 hover:bg-teal-500/10 border border-border hover:border-teal-500/30 transition-all text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600 group-hover:scale-105 transition-transform">
                    <Heart className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Elder Line Helpline</p>
                    <p className="text-[11px] text-muted-foreground">Govt. Senior Support</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-1 rounded-md">
                  14567
                </span>
              </a>

              <a
                href="tel:108"
                className="group flex items-center justify-between p-2.5 rounded-xl bg-background/80 hover:bg-amber-500/10 border border-border hover:border-amber-500/30 transition-all text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 group-hover:scale-105 transition-transform">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Ambulance Service</p>
                    <p className="text-[11px] text-muted-foreground">Medical Immediate</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
                  108
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Multilingual Selector Strip */}
        <div className="mt-8 pt-6 border-t border-border/70">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>🌐</span> Regional & Indian Languages (NER Focus)
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Click any language to change voice & interface instantly
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {LANGUAGES.map((l) => {
              const isSelected = lang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-102"
                      : "bg-background/80 hover:bg-muted text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-sm font-black">{l.native}</span>
                  <span className="text-[10px] opacity-75 font-normal">{l.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Regulatory Medical Disclaimer Box */}
        <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 text-xs text-muted-foreground flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-foreground">
              Statutory Non-Diagnostic Health & Safety Notice
            </p>
            <p className="leading-relaxed">
              <strong>Memory Bond</strong> is an assistive cognitive wellness, lifestyle reminder, and family coordination companion created for the <strong>Smart India Hackathon (SIH 2026)</strong> under Problem Statement ID <code>SIH26003</code>. It does not provide medical diagnosis, therapeutic cures, neurological evaluations, or clinical prescriptions. Always seek guidance from certified physicians, geriatric specialists, or neurologists for any health conditions.
            </p>
          </div>
        </div>

        {/* Sub-Footer Copyright & Credits */}
        <div className="mt-8 pt-6 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground text-center sm:text-left">
          <p>
            © 2026 <strong>Memory Bond Companion</strong>. Built with compassion for our elders. All rights reserved.
          </p>

          <div className="flex items-center gap-4 flex-wrap justify-center text-[11px] font-semibold">
            <button
              onClick={() => onNavigate("settings")}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Accessibility Controls
            </button>
            <span>•</span>
            <button
              onClick={onOpenAuth}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Evaluator Demo Mode
            </button>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              WCAG AAA Inspired
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
