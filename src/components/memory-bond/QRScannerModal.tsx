import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { playNotificationChime } from "@/lib/notificationService";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  expectedCodeHint?: string;
  alreadyLinkedCode?: string;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScan,
  expectedCodeHint,
  alreadyLinkedCode,
}: QRScannerModalProps) {
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<"scanning" | "success" | "error">("scanning");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Extract Caregiver pairing code from scanned payload
  const parseCaregiverCode = useCallback((raw: string): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();

    // 1. Direct code: MB-CG-XXXXXX
    const directMatch = trimmed.match(/MB-CG-[A-Z0-9]{6}/i);
    if (directMatch) return directMatch[0].toUpperCase();

    // 2. JSON format: {"code":"MB-CG-XXXXXX", ...}
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.code && typeof parsed.code === "string") {
        const jsonMatch = parsed.code.match(/MB-CG-[A-Z0-9]{6}/i);
        if (jsonMatch) return jsonMatch[0].toUpperCase();
      }
    } catch {}

    // 3. URL query parameter or hash: ?link=MB-CG-XXXXXX or #link=MB-CG-XXXXXX
    const urlMatch = trimmed.match(/[?&#]link=(MB-CG-[A-Z0-9]{6})/i);
    if (urlMatch) return urlMatch[1].toUpperCase();

    return null;
  }, []);

  const handleProcessCode = useCallback(
    (rawText: string) => {
      setErrorMessage(null);
      const code = parseCaregiverCode(rawText);

      // 1. Invalid Format Check
      if (!code) {
        setScanStatus("error");
        setErrorMessage("Invalid QR code. Please scan a valid Memory Bond Caregiver QR code.");
        return;
      }

      // 2. Already Linked Check
      if (alreadyLinkedCode && code === alreadyLinkedCode.toUpperCase()) {
        setScanStatus("error");
        setErrorMessage(`This senior account is already linked to caregiver code ${code}.`);
        return;
      }

      // 3. Expired QR check (if payload contains timestamp > 24h old)
      if (rawText.includes('"expires":') || rawText.includes('"ts":')) {
        try {
          const parsed = JSON.parse(rawText);
          if (parsed.expires && Date.now() > Number(parsed.expires)) {
            setScanStatus("error");
            setErrorMessage("This QR code has expired. Please ask your caregiver to refresh their QR code.");
            return;
          }
        } catch {}
      }

      // 4. Successful Scan!
      setScannedCode(code);
      setScanStatus("success");
      try {
        playNotificationChime();
      } catch {}

      // Stop scanning loop
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      setTimeout(() => {
        stopCamera();
        onScan(code);
      }, 900);
    },
    [alreadyLinkedCode, onScan, parseCaregiverCode]
  );

  const startCamera = async () => {
    setCameraError(null);
    setErrorMessage(null);
    setScanStatus("scanning");
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasCamera(false);
        setCameraError("Camera access is not supported by your browser. Please enter the code manually.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();

        // Start BarcodeDetector loop if supported by browser (Chromium / Android / Edge)
        if ("BarcodeDetector" in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
            scanIntervalRef.current = window.setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState >= 2) {
                try {
                  const barcodes = await detector.detect(videoRef.current);
                  if (barcodes && barcodes.length > 0) {
                    const rawVal = barcodes[0].rawValue || barcodes[0].displayValue;
                    if (rawVal) {
                      handleProcessCode(rawVal);
                    }
                  }
                } catch {}
              }
            }, 250);
          } catch {
            // BarcodeDetector format not supported, will rely on manual or simulated fallback
          }
        }
      }
    } catch (err: any) {
      setHasCamera(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in your browser settings, or enter the code manually below.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera found on this device. You can enter the caregiver code manually below.");
      } else {
        setCameraError(err.message || "Could not access camera. Please enter code manually.");
      }
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode.trim());
  };

  const handleQuickDemoScan = () => {
    const code = expectedCodeHint || localStorage.getItem("mb_caregiver_unique_code") || "MB-CG-781042";
    handleProcessCode(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-card border-2 border-border p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">Scan Caregiver QR</h3>
              <p className="text-xs text-muted-foreground">
                Point your camera at the QR code on the Caregiver's phone
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder Screen */}
        <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-950 border-2 border-primary/40 flex items-center justify-center">
          {hasCamera && (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Animated Scanning Reticle */}
          {scanStatus === "scanning" && hasCamera && !cameraError && (
            <div className="absolute inset-8 border-2 border-dashed border-primary/80 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-sm shadow-primary" />
            </div>
          )}

          {/* Success Overlay */}
          {scanStatus === "success" && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-center p-4 space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-bounce" />
              <div className="text-lg font-black text-white">QR Code Detected!</div>
              <div className="text-sm font-mono font-bold text-emerald-200 bg-emerald-900/60 px-4 py-1.5 rounded-full border border-emerald-500">
                {scannedCode}
              </div>
              <p className="text-xs text-emerald-300">Connecting senior and caregiver...</p>
            </div>
          )}

          {/* Camera Error / Not Allowed Fallback */}
          {(!hasCamera || cameraError) && (
            <div className="absolute inset-0 bg-slate-900/95 p-5 flex flex-col items-center justify-center text-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-amber-400" />
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                {cameraError || "Camera access unavailable."}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={startCamera}
                className="rounded-xl text-xs gap-1.5 border-slate-700 hover:bg-slate-800 text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try Camera Again
              </Button>
            </div>
          )}
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/40 flex items-start gap-2.5 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Manual Code Entry Form */}
        <form onSubmit={handleManualSubmit} className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Or Enter 6-Digit Code Manually:</span>
            <span className="font-mono text-primary">Format: MB-CG-XXXXXX</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="MB-CG-781042"
                className="h-12 pl-10 font-mono font-black text-base rounded-2xl tracking-wider uppercase"
              />
            </div>
            <Button
              type="submit"
              className="h-12 px-5 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer"
            >
              Verify
            </Button>
          </div>
        </form>

        {/* Quick Demo Test Action */}
        <div className="pt-2 border-t border-border space-y-2">
          <Button
            type="button"
            onClick={handleQuickDemoScan}
            variant="secondary"
            className="w-full h-11 rounded-2xl font-bold gap-2 text-xs cursor-pointer hover:bg-secondary/80"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            1-Click Demo QR Scan ({expectedCodeHint || "MB-CG-781042"})
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-full h-9 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
