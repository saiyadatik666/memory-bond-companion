/**
 * Memory Bond - High-Precision Universal QR Decoder
 * 
 * Powered by:
 * 1. Native Hardware BarcodeDetector (instant hardware decoding where supported)
 * 2. Client-safe Local jsQR Engine via /js/jsQR.min.js (100% offline, zero network requests)
 * 3. Multi-Region Scanning:
 *    - Region A: Centered Viewfinder ROI (high resolution for elder aiming)
 *    - Region B: Full Camera Frame (wide angle for distance / off-center holding)
 * 4. Dual Polarity ("attemptBoth") for high resilience against screen glare and reflections
 */

export interface QrDecodeResult {
  data: string;
}

let barcodeDetectorInstance: any = null;
let isBarcodeDetectorSupported: boolean | null = null;
let jsQrLoadingPromise: Promise<boolean> | null = null;

/**
 * Dynamically ensures the local jsQR library is loaded on the client from /js/jsQR.min.js
 */
export async function ensureJsQrLoaded(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (typeof (window as any).jsQR === "function") return true;
  if (jsQrLoadingPromise) return jsQrLoadingPromise;

  jsQrLoadingPromise = new Promise<boolean>((resolve) => {
    try {
      const existing = document.querySelector('script[data-qr-lib="jsqr"]');
      if (existing) {
        if (typeof (window as any).jsQR === "function") return resolve(true);
        existing.addEventListener("load", () => resolve(typeof (window as any).jsQR === "function"));
        existing.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.src = "/js/jsQR.min.js";
      script.setAttribute("data-qr-lib", "jsqr");
      script.async = true;
      script.onload = () => resolve(typeof (window as any).jsQR === "function");
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    } catch {
      resolve(false);
    }
  });

  return jsQrLoadingPromise;
}

/**
 * Check if the browser natively supports BarcodeDetector with qr_code format
 */
export async function checkBarcodeDetectorSupport(): Promise<boolean> {
  if (isBarcodeDetectorSupported !== null) return isBarcodeDetectorSupported;
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
    isBarcodeDetectorSupported = false;
    return false;
  }

  try {
    const formats: string[] = await (window as any).BarcodeDetector.getSupportedFormats();
    if (Array.isArray(formats) && formats.includes("qr_code")) {
      barcodeDetectorInstance = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      isBarcodeDetectorSupported = true;
      return true;
    }
  } catch {
    try {
      barcodeDetectorInstance = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      isBarcodeDetectorSupported = true;
      return true;
    } catch {
      isBarcodeDetectorSupported = false;
      return false;
    }
  }

  isBarcodeDetectorSupported = false;
  return false;
}

/**
 * Decodes a live video frame using dual-engine multi-region scanning
 */
export async function scanFrameForQr(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<QrDecodeResult | null> {
  if (!video || video.readyState < 2 || !canvas) {
    return null;
  }

  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;
  if (vWidth === 0 || vHeight === 0) return null;

  // ===========================================================================
  // ENGINE 1: Hardware-Accelerated BarcodeDetector (Chrome Android / Chromium)
  // ===========================================================================
  try {
    const hasBarcode = await checkBarcodeDetectorSupport();
    if (hasBarcode && barcodeDetectorInstance) {
      const barcodes = await barcodeDetectorInstance.detect(video);
      if (barcodes && barcodes.length > 0) {
        const raw = barcodes[0].rawValue || barcodes[0].displayValue;
        if (raw && typeof raw === "string" && raw.trim()) {
          return { data: raw.trim() };
        }
      }
    }
  } catch {
    // Hardware detector fell through; seamlessly proceed to Engine 2
  }

  // ===========================================================================
  // ENGINE 2: Local High-Precision jsQR Engine
  // ===========================================================================
  try {
    const isLoaded = await ensureJsQrLoaded();
    const jsQR = typeof window !== "undefined" ? (window as any).jsQR : null;
    if (!isLoaded || typeof jsQR !== "function") return null;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    // STRATEGY A: Center Viewfinder ROI Crop (High-Resolution Sensor Extraction)
    const minDim = Math.min(vWidth, vHeight);
    const cropX = Math.floor((vWidth - minDim) / 2);
    const cropY = Math.floor((vHeight - minDim) / 2);
    const targetCropSize = Math.min(minDim, 720);

    if (canvas.width !== targetCropSize || canvas.height !== targetCropSize) {
      canvas.width = targetCropSize;
      canvas.height = targetCropSize;
    }

    ctx.drawImage(video, cropX, cropY, minDim, minDim, 0, 0, targetCropSize, targetCropSize);
    const cropImageData = ctx.getImageData(0, 0, targetCropSize, targetCropSize);

    const cropResult = jsQR(cropImageData.data, targetCropSize, targetCropSize, {
      inversionAttempts: "attemptBoth",
    });

    if (cropResult?.data && typeof cropResult.data === "string" && cropResult.data.trim()) {
      return { data: cropResult.data.trim() };
    }

    // STRATEGY B: Full-Frame Multi-Angle Scan
    const maxDim = 800;
    const scale = Math.min(1, maxDim / Math.max(vWidth, vHeight));
    const fullW = Math.floor(vWidth * scale);
    const fullH = Math.floor(vHeight * scale);

    if (canvas.width !== fullW || canvas.height !== fullH) {
      canvas.width = fullW;
      canvas.height = fullH;
    }

    ctx.drawImage(video, 0, 0, fullW, fullH);
    const fullImageData = ctx.getImageData(0, 0, fullW, fullH);

    const fullResult = jsQR(fullImageData.data, fullW, fullH, {
      inversionAttempts: "attemptBoth",
    });

    if (fullResult?.data && typeof fullResult.data === "string" && fullResult.data.trim()) {
      return { data: fullResult.data.trim() };
    }
  } catch (err) {
    console.debug("[QR Decoder] Analysis tick notice:", err);
  }

  return null;
}
