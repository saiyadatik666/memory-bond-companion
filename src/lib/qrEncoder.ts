import qrcode, { type ErrorCorrectionLevel } from "./qrcode";

export interface QrMatrixOptions {
  errorCorrectionLevel?: ErrorCorrectionLevel;
}

/**
 * Generate a mathematically standard, ISO/IEC 18004 compliant QR matrix.
 * Uses Kazuhiko Arase's reference JIS X 0510 / ISO 18004 engine:
 * - Auto-detects minimal version required for payload (Version 1-40)
 * - Evaluates all 8 mask patterns and selects the one with the minimal penalty score
 * - Generates standard BCH format information and Reed-Solomon codewords
 * - Fully decodable by Google Lens, ZXing, iOS Camera, Android Camera, and jsQR
 */
export function generateQrMatrix(
  text: string,
  options?: QrMatrixOptions
): boolean[][] {
  const ecLevel: ErrorCorrectionLevel = options?.errorCorrectionLevel || "M";
  
  // typeNumber 0 = auto-select optimal version (1 to 40)
  const qr = qrcode(0, ecLevel);
  qr.addData(text || "MB-CG-781042", "Byte");
  qr.make();

  const count = qr.getModuleCount();
  const matrix: boolean[][] = [];
  for (let r = 0; r < count; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < count; c++) {
      row.push(qr.isDark(r, c));
    }
    matrix.push(row);
  }
  return matrix;
}
