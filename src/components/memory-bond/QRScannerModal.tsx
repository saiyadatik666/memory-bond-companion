import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Shield,
  Heart,
  User,
  Users,
  AlertTriangle,
  Loader2,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemoryBondLogo } from "./MemoryBondLogo";
import { playNotificationChime } from "@/lib/notificationService";
import { useI18n } from "@/lib/i18n";
import type { MemoryBondStore } from "@/lib/memoryBondStore";
import { scanFrameForQr } from "@/lib/qrDecoder";
import {
  extractAndNormalizeCaregiverCode,
  validateCaregiverCodeFormat,
  resolveCaregiverProfile,
  connectSeniorToCaregiver,
  type ResolvedCaregiverProfile,
} from "@/lib/caregiverConnectionService";

export type ScannerStage =
  | "STARTING_CAMERA"
  | "SCANNING"
  | "CONFIRMATION"
  | "CONNECTING"
  | "SUCCESS"
  | "INVALID_QR"
  | "EXPIRED_QR"
  | "CAMERA_ERROR";

export interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (code: string) => void;
  onSuccess?: () => void;
  store?: MemoryBondStore;
  seniorName?: string;
  expectedCodeHint?: string;
  alreadyLinkedCode?: string;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScan,
  onSuccess,
  store,
  seniorName = "Ramesh Sharma",
  expectedCodeHint,
  alreadyLinkedCode,
}: QRScannerModalProps) {
  const { lang, t } = useI18n();

  // Centralized Localization following Memory Bond standards
  const labels = useMemo(() => {
    if (lang === "hi") {
      return {
        back: "वापस",
        header: "पारिवारिक QR स्कैन करें",
        instruction: "अपने परिवार के सदस्य का QR कोड स्कैन करें",
        subInstruction: "QR कोड को फ्रेम के अंदर रखें।",
        putHere: "QR कोड यहाँ रखें",
        scanAgain: "फिर से स्कैन करें",
        trustMsg: "केवल किसी ऐसे व्यक्ति का QR कोड स्कैन करें जिस पर आप भरोसा करते हैं।",
        startingCamera: "कैमरा शुरू हो रहा है...",
        holdSteady: "कृपया अपने डिवाइस को स्थिर रखें",
        qrFound: "QR कोड मिल गया",
        connectWithPrefix: "",
        connectWithSuffix: " से जुड़ें?",
        reviewDetails: "कृपया जुड़ने से पहले अपने परिवार के सदस्य का विवरण जांचें।",
        familyMember: "परिवार का सदस्य",
        relationship: "रिश्ता",
        verificationCode: "सत्यापन कोड",
        confirmConnection: "कनेक्शन की पुष्टि करें",
        connecting: "जोड़ रहा है...",
        connectedSuccess: "सफलतापूर्वक जुड़ गया!",
        nowConnected: "अब आप अपने परिवार के सदस्य से जुड़ चुके हैं।",
        linkedTo: "से जुड़े",
        continueToHome: "होम पर जाएं",
        invalidQr: "अमान्य QR कोड",
        invalidQrDesc: "यह QR कोड एक मान्य Memory Bond परिवार कनेक्शन नहीं है।",
        expiredQr: "इस QR कोड की समय सीमा समाप्त हो गई है।",
        expiredQrDesc: "अपने परिवार के सदस्य से एक नया QR कोड बनाने के लिए कहें।",
        cameraNeeded: "पारिवारिक QR कोड स्कैन करने के लिए कैमरा एक्सेस आवश्यक है।",
        tryAgain: "पुनः प्रयास करें",
        backToLogin: "लॉगिन पर वापस जाएं",
      };
    }
    if (lang === "gu") {
      return {
        back: "પાછા જાઓ",
        header: "પરિવારનો QR સ્કેન કરો",
        instruction: "તમારા પરિવારના સભ્યનો QR કોડ સ્કેન કરો",
        subInstruction: "QR કોડને ફ્રેમની અંદર રાખો.",
        putHere: "QR કોડ અહીં રાખો",
        scanAgain: "ફરી સ્કેન કરો",
        trustMsg: "માત્ર તમે વિશ્વાસ કરતા હોય તેવી વ્યક્તિનો જ QR કોડ સ્કેન કરો.",
        startingCamera: "કૅમેરો શરૂ થઈ રહ્યો છે...",
        holdSteady: "કૃપા કરીને તમારા ઉપકરણને સ્થિર રાખો",
        qrFound: "QR કોડ મળ્યો",
        connectWithPrefix: "",
        connectWithSuffix: " સાથે જોડાઓ?",
        reviewDetails: "કૃપા કરીને જોડાતા પહેલાં તમારા પરિવારના સભ્યની વિગતો તપાસો.",
        familyMember: "પરિવારના સભ્ય",
        relationship: "સંબંધ",
        verificationCode: "ચકાસણી કોડ",
        confirmConnection: "જોડાણની પુષ્ટિ કરો",
        connecting: "જોડાઈ રહ્યું છે...",
        connectedSuccess: "સફળતાપૂર્વક જોડાયા!",
        nowConnected: "હવે તમે તમારા પરિવારના સભ્ય સાથે જોડાયેલા છો.",
        linkedTo: "સાથે જોડાયેલા",
        continueToHome: "હોમ પર આગળ વધો",
        invalidQr: "અમાન્ય QR કોડ",
        invalidQrDesc: "આ QR કોડ માન્ય Memory Bond કૌટુંબિક જોડાણ નથી.",
        expiredQr: "આ QR કોડ સમાપ્ત થઈ ગયો છે.",
        expiredQrDesc: "તમારા પરિવારના સભ્યને નવો QR કોડ બનાવવા માટે કહો.",
        cameraNeeded: "કૌટુંબિક QR કોડ સ્કેન કરવા માટે કૅમેરા ઍક્સેસ જરૂરી છે.",
        tryAgain: "ફરી પ્રયાસ કરો",
        backToLogin: "લૉગિન પર પાછા જાઓ",
      };
    }
    return {
      back: "Back",
      header: "Scan Family QR",
      instruction: "Scan your family member’s QR code",
      subInstruction: "Place the QR code inside the frame.",
      putHere: "Put the QR code here",
      scanAgain: "Scan Again",
      trustMsg: "Only scan a QR code from someone you trust.",
      startingCamera: "Starting camera...",
      holdSteady: "Please hold your device steady",
      qrFound: "QR Code Found",
      connectWithPrefix: "Connect with ",
      connectWithSuffix: "?",
      reviewDetails: "Please review your family member’s details before connecting.",
      familyMember: "Family Member",
      relationship: "Relationship",
      verificationCode: "Verification Code",
      confirmConnection: "Confirm Connection",
      connecting: "Connecting...",
      connectedSuccess: "Connected Successfully!",
      nowConnected: "You’re now connected with your family member.",
      linkedTo: "Linked to",
      continueToHome: "Continue to Home",
      invalidQr: "Invalid QR Code",
      invalidQrDesc: "This QR code is not a valid Memory Bond family connection.",
      expiredQr: "This QR code has expired.",
      expiredQrDesc: "Ask your family member to generate a new QR code.",
      cameraNeeded: "Camera access is needed to scan the family QR code.",
      tryAgain: "Try Again",
      backToLogin: "Back to Login",
    };
  }, [lang]);

  // Stage state machine
  const [stage, setStage] = useState<ScannerStage>("STARTING_CAMERA");
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Detected family member payload
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [familyProfile, setFamilyProfile] = useState<ResolvedCaregiverProfile | null>(null);

  // In-flight connection state
  const [connectError, setConnectError] = useState<string | null>(null);

  // Video & Stream DOM refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // ==========================================================================
  // CAMERA LIFECYCLE & TEARDOWN
  // ==========================================================================
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {}
    }
  }, []);

  // Dedicated scanner frame-pump loop
  const startScanLoop = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = window.setInterval(async () => {
      if (isProcessingRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 2 || !canvasRef.current) return;

      try {
        const result = await scanFrameForQr(videoRef.current, canvasRef.current);
        if (result?.data && !isProcessingRef.current) {
          handleQrDetected(result.data);
        }
      } catch (scanErr) {
        console.debug("[Scanner] Frame analysis tick notice:", scanErr);
      }
    }, 220);
  }, []);

  // Initialize camera and start video stream
  const startCamera = useCallback(async () => {
    stopCamera();
    isProcessingRef.current = false;
    setCameraError(null);
    setStage("STARTING_CAMERA");

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported by your browser on this device.");
        setStage("CAMERA_ERROR");
        return;
      }

      // Elder-friendly camera config: prefers environment (back camera) with sensible fallback
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (envErr) {
        // If ideal environment facing failed (e.g. desktop webcam), try general video
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("muted", "true");
        await videoRef.current.play();

        setStage("SCANNING");
        startScanLoop();
      }
    } catch (err: any) {
      console.warn("[Scanner] Camera activation error:", err);
      let readable = "Camera access is needed to scan the family QR code.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        readable = "Camera access was denied. Please allow camera permission in your browser to scan the family QR code.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        readable = "No camera found on this device. You can also connect using the 6-digit code.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        readable = "Camera is currently busy in another application. Please close other camera apps and try again.";
      }
      setCameraError(readable);
      setStage("CAMERA_ERROR");
    }
  }, [stopCamera, startScanLoop]);

  // Handle incoming raw scanned string
  const handleQrDetected = useCallback(
    (rawText: string) => {
      // 1. DUPLICATE SCAN PROTECTION: Lock immediately
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      // 2. STOP SCANNING & STOP CAMERA IMMEDIATELY
      stopCamera();

      // Audio confirmation chime
      try {
        playNotificationChime();
      } catch {}

      // 3. Parse & normalize code
      const { code, caregiverName: hintName, relationship: hintRel, expires } =
        extractAndNormalizeCaregiverCode(rawText);

      // 4. Invalid Format check
      if (!code || !validateCaregiverCodeFormat(code)) {
        setStage("INVALID_QR");
        return;
      }

      // 5. Expired QR check
      if (expires && Date.now() > expires) {
        setStage("EXPIRED_QR");
        return;
      }

      // 6. Resolve real family profile
      const resolved = resolveCaregiverProfile(code, hintName, hintRel);
      setDetectedCode(code);
      setFamilyProfile(resolved);
      setStage("CONFIRMATION");
    },
    [stopCamera]
  );

  // Senior taps "Confirm Connection"
  const handleConfirmConnection = async () => {
    if (!detectedCode || !store) {
      // If store wasn't provided, notify parent callback directly
      if (detectedCode && onScan) {
        onScan(detectedCode);
      }
      setStage("SUCCESS");
      return;
    }

    setConnectError(null);
    setStage("CONNECTING");

    try {
      const result = await connectSeniorToCaregiver({
        code: detectedCode,
        seniorName,
        store,
        currentLanguage: lang,
        timeoutMs: 9000,
      });

      if (!result.success) {
        setConnectError(result.error || "Could not complete family connection. Please try again.");
        setStage("CONFIRMATION");
        return;
      }

      // Call parent onScan if registered
      if (onScan) {
        onScan(detectedCode);
      }

      // Show warm success screen
      setStage("SUCCESS");
    } catch (err: any) {
      setConnectError(err?.message || "Connection could not complete. Please scan again.");
      setStage("CONFIRMATION");
    }
  };

  // Senior taps "Scan Again"
  const handleScanAgain = () => {
    stopCamera();
    isProcessingRef.current = false;
    setDetectedCode(null);
    setFamilyProfile(null);
    setConnectError(null);
    startCamera();
  };

  // Senior taps "Continue to Home" on success
  const handleContinueToHome = () => {
    stopCamera();
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  // Exit & cleanup on modal open / close
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      isProcessingRef.current = false;
      setStage("STARTING_CAMERA");
      setDetectedCode(null);
      setFamilyProfile(null);
      setConnectError(null);
    }

    return () => {
      stopCamera();
      isProcessingRef.current = false;
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan Family QR Code"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
    >
      {/* Hidden scratch canvas used strictly for mathematical image frame decode */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-card border-2 border-sky-100 dark:border-border shadow-2xl p-5 sm:p-7 text-foreground my-auto space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* ================================================================= */}
        {/* STAGE 1 & 2: SCANNER VIEW (Live Camera + Scanning Frame)          */}
        {/* ================================================================= */}
        {(stage === "STARTING_CAMERA" || stage === "SCANNING") && (
          <div className="space-y-4">
            {/* Top Bar: ← Back button and Header */}
            <div className="flex items-center justify-between border-b border-border/70 pb-3.5">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 -ml-1 rounded-xl text-primary hover:bg-sky-50 dark:hover:bg-secondary font-extrabold text-sm sm:text-base cursor-pointer transition-colors"
                aria-label="Back to login"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>{labels.back}</span>
              </button>

              <h2 className="text-lg sm:text-xl font-black text-foreground font-display text-center">
                {labels.header}
              </h2>

              <div className="w-14" />
            </div>

            {/* Instruction Banner */}
            <div className="text-center space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0F243E] dark:text-foreground">
                {labels.instruction}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#627D98]">
                {labels.subInstruction}
              </p>
            </div>

            {/* Camera Viewfinder Screen */}
            <div className="relative w-full aspect-square max-h-[320px] rounded-3xl overflow-hidden bg-slate-950 border-3 border-primary/40 shadow-inner flex items-center justify-center">
              {/* Live Video Preview Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Starting Camera Spinner */}
              {stage === "STARTING_CAMERA" && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4 space-y-3 z-20 animate-in fade-in">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-white">{labels.startingCamera}</p>
                  <p className="text-xs text-slate-300">{labels.holdSteady}</p>
                </div>
              )}

              {/* High-Contrast Rounded Scanning Frame with Soft Blue Accent */}
              {stage === "SCANNING" && (
                <div className="absolute inset-6 sm:inset-8 pointer-events-none flex flex-col items-center justify-between z-10">
                  {/* Outer corner frame styling with primary blue tint */}
                  <div className="w-full h-full rounded-3xl border-3 border-primary/90 relative shadow-[0_0_24px_rgba(30,111,217,0.35)]">
                    {/* Corner Reticles */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl" />

                    {/* Subtle, Calm Animated Scanning Line */}
                    <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent shadow-[0_0_8px_#38BDF8] animate-pulse" />

                    {/* Centered Guide Badge */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-extrabold text-white tracking-wide border border-white/20 whitespace-nowrap">
                      {labels.putHere}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Below Camera: 🔄 Scan Again button */}
            <div className="space-y-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleScanAgain}
                className="w-full h-12 rounded-2xl font-black text-sm border-sky-200 hover:border-primary hover:bg-sky-50 dark:hover:bg-secondary gap-2 text-foreground cursor-pointer shadow-xs"
              >
                <RotateCcw className="h-4 w-4 text-primary" />
                <span>{labels.scanAgain}</span>
              </Button>

              {/* Clear, Friendly Trust Safety Message */}
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#627D98] bg-sky-50/70 dark:bg-secondary/40 py-2.5 px-3 rounded-2xl border border-sky-100 dark:border-border">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span>{labels.trustMsg}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STAGE 3: CONFIRMATION SCREEN (Show Real Family Member Information)*/}
        {/* ================================================================= */}
        {(stage === "CONFIRMATION" || stage === "CONNECTING") && familyProfile && (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            {/* Success Badge */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{labels.qrFound}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-foreground font-display">
                {labels.connectWithPrefix}{familyProfile.name.split(" ")[0]}{labels.connectWithSuffix}
              </h3>

              <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                {labels.reviewDetails}
              </p>
            </div>

            {/* REAL Family Information Card */}
            <div className="rounded-3xl border-2 border-sky-100 bg-sky-50/50 dark:bg-secondary/30 p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-3.5 pb-3 border-b border-sky-100 dark:border-border">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-primary/20 shrink-0">
                  {familyProfile.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    {labels.familyMember}
                  </div>
                  <div className="text-xl font-black text-foreground">
                    {familyProfile.name}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-left">
                <div className="p-3 rounded-2xl bg-white dark:bg-card border border-sky-100 dark:border-border">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase">
                    {labels.relationship}
                  </div>
                  <div className="text-sm font-black text-foreground mt-0.5">
                    {familyProfile.relationship}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-card border border-sky-100 dark:border-border">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase">
                    {labels.verificationCode}
                  </div>
                  <div className="text-sm font-mono font-black text-primary mt-0.5">
                    {detectedCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Error message if connection failed */}
            {connectError && (
              <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-start gap-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{connectError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <Button
                type="button"
                size="lg"
                disabled={stage === "CONNECTING"}
                onClick={handleConfirmConnection}
                className="w-full h-14 rounded-2xl font-black text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-2 cursor-pointer transition-transform active:scale-98"
              >
                {stage === "CONNECTING" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{labels.connecting}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>{labels.confirmConnection}</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={stage === "CONNECTING"}
                onClick={handleScanAgain}
                className="w-full h-11 rounded-2xl font-extrabold text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {labels.scanAgain}
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STAGE 4: SUCCESS SCREEN (Warm Memory Bond Celebration)            */}
        {/* ================================================================= */}
        {stage === "SUCCESS" && (
          <div className="py-4 text-center space-y-5 animate-in zoom-in-95 duration-300">
            {/* Glowing Heart Logo Celebration */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xl shadow-rose-500/25">
                <Heart className="h-10 w-10 fill-white text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground font-display">
                {labels.connectedSuccess}
              </h3>
              <p className="text-sm sm:text-base font-bold text-[#627D98] max-w-xs mx-auto leading-relaxed">
                {labels.nowConnected}
              </p>
            </div>

            {familyProfile && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                <CheckCircle2 className="h-4 w-4" />
                <span>{labels.linkedTo} {familyProfile.name} ({familyProfile.relationship})</span>
              </div>
            )}

            <div className="pt-3">
              <Button
                type="button"
                size="lg"
                onClick={handleContinueToHome}
                className="w-full h-14 rounded-2xl font-black text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 cursor-pointer transition-transform active:scale-98"
              >
                {labels.continueToHome}
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STAGE 5: INVALID QR ERROR SCREEN                                  */}
        {/* ================================================================= */}
        {stage === "INVALID_QR" && (
          <div className="py-2 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-600 mx-auto flex items-center justify-center">
              <AlertCircle className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-foreground font-display">
                {labels.invalidQr}
              </h3>
              <p className="text-sm font-semibold text-muted-foreground max-w-xs mx-auto">
                {labels.invalidQrDesc}
              </p>
            </div>

            <div className="pt-3">
              <Button
                type="button"
                size="lg"
                onClick={handleScanAgain}
                className="w-full h-12 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-md gap-2 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{labels.scanAgain}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STAGE 6: EXPIRED QR ERROR SCREEN                                  */}
        {/* ================================================================= */}
        {stage === "EXPIRED_QR" && (
          <div className="py-2 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-600 mx-auto flex items-center justify-center">
              <Clock className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-foreground font-display">
                {labels.expiredQr}
              </h3>
              <p className="text-sm font-semibold text-muted-foreground max-w-xs mx-auto">
                {labels.expiredQrDesc}
              </p>
            </div>

            <div className="pt-3">
              <Button
                type="button"
                size="lg"
                onClick={handleScanAgain}
                className="w-full h-12 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-md gap-2 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{labels.scanAgain}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STAGE 7: CAMERA ERROR SCREEN (Permission Denied / Unavailable)    */}
        {/* ================================================================= */}
        {stage === "CAMERA_ERROR" && (
          <div className="py-2 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-foreground font-display">
                {labels.cameraNeeded}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {cameraError || labels.cameraNeeded}
              </p>
            </div>

            <div className="space-y-2.5 pt-3">
              <Button
                type="button"
                size="lg"
                onClick={handleScanAgain}
                className="w-full h-12 rounded-2xl font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-md gap-2 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{labels.tryAgain}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="w-full h-11 rounded-2xl font-extrabold text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {labels.backToLogin}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
