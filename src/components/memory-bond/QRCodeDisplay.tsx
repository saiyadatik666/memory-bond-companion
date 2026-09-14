import React, { useMemo } from "react";
import { generateQrMatrix } from "@/lib/qrEncoder";

export function QRCodeDisplay({
  value,
  size = 180,
  className = "",
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const matrix = useMemo(() => generateQrMatrix(value), [value]);
  const padding = 2; // Mandatory quiet zone around QR finders for instant optical camera detection
  const totalCount = matrix.length + padding * 2;
  const moduleSize = size / totalCount;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200 ${className}`}
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
                x={(x + padding) * moduleSize}
                y={(y + padding) * moduleSize}
                width={moduleSize + 0.2}
                height={moduleSize + 0.2}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
