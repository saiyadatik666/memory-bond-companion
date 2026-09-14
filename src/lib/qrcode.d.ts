export interface QRCodeInstance {
  addData(data: string, mode?: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji'): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
  createSvgTag(cellSize?: number, margin?: number): string;
  createTableTag(cellSize?: number, margin?: number): string;
  createDataURL(cellSize?: number, margin?: number): string;
}

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export default function qrcode(typeNumber: number, errorCorrectionLevel: ErrorCorrectionLevel): QRCodeInstance;
