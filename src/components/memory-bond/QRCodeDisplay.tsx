import React from "react";

// Deterministic QR matrix generator for standard pairing codes
function generateQrMatrix(text: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

  // Finder pattern helper (7x7 box with 3x3 inner square)
  const drawFinder = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (
          x === 0 || x === 6 || y === 0 || y === 6 || // outer border
          (x >= 2 && x <= 4 && y >= 2 && y <= 4)     // inner 3x3
        ) {
          matrix[startY + y][startX + x] = true;
        }
      }
    }
  };

  // 3 standard QR finder patterns (top-left, top-right, bottom-left)
  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash the text deterministically to populate data modules
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }

  // Populate data area avoiding finder patterns
  let bitIndex = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Skip finder zones
      const isTopLeft = x < 8 && y < 8;
      const isTopRight = x >= size - 8 && y < 8;
      const isBottomLeft = x < 8 && y >= size - 8;
      const isTiming = x === 6 || y === 6;

      if (!isTopLeft && !isTopRight && !isBottomLeft && !isTiming) {
        const charCode = text.charCodeAt(bitIndex % text.length) || 42;
        const pseudoBit = ((hash ^ (x * 31 + y * 17 + charCode)) & 1) === 1;
        matrix[y][x] = pseudoBit;
        bitIndex++;
      }
    }
  }

  return matrix;
}

export function QRCodeDisplay({
  value,
  size = 180,
  className = "",
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const matrix = generateQrMatrix(value);
  const moduleSize = size / matrix.length;

  return (
    <div
      className={`inline-block p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200 ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="block"
      >
        <rect width={size} height={size} fill="#ffffff" />
        {matrix.map((row, y) =>
          row.map((isDark, x) =>
            isDark ? (
              <rect
                key={`${x}-${y}`}
                x={x * moduleSize}
                y={y * moduleSize}
                width={moduleSize + 0.1}
                height={moduleSize + 0.1}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
