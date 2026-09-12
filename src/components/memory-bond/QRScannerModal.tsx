import { useState, useRef, useEffect } from "react";
import { X, Camera, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  expectedCodeHint?: string;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScan,
  expectedCodeHint,
}: QRScannerModalProps) {
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasCamera(false);
        setCameraError("Camera access not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setHasCamera(false);
      setCameraError(err.message || "Could not access device camera. Please enter code manually or use simulated scan.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleSimulateCaregiverScan = () => {
    const code = expectedCodeHint || localStorage.getItem("mb_caregiver_unique_code") || "MB-CG-781042";
    stopCamera();
    onScan(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-card border-2 border-border p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">Scan Caregiver QR</h3>
              <p className="text-xs text-muted-foreground">Point your camera at Caregiver's QR code</p>
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
          <div className="absolute inset-8 border-2 border-dashed border-primary rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-sm shadow-primary" />
          </div>

          {/* Fallback info when camera is inactive or denied */}
          {(!hasCamera || cameraError) && (
            <div className="absolute inset-0 bg-slate-900/90 p-4 flex flex-col items-center justify-center text-center space-y-3">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <p className="text-xs text-slate-300 max-w-xs">
                {cameraError || "Camera preview unavailable. You can simulate instant QR scan or enter connection code manually."}
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleSimulateCaregiverScan}
            className="w-full h-12 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white gap-2 shadow-md cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Simulate Instant Caregiver QR Scan
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-full h-10 rounded-2xl text-xs font-semibold cursor-pointer"
          >
            Cancel & Enter Code Manually
          </Button>
        </div>
      </div>
    </div>
  );
}
