import React, { useMemo } from "react";
import { generateQrMatrix } from "@/lib/qrEncoder";

export interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  showQuietZoneBorder?: boolean;
}

export function QRCodeDisplay({
  value,
  size = 190,
  className = "",
  showQuietZoneBorder = true,
}: QRCodeDisplayProps) {
  // ISO/IEC 18004 Standard QR Matrix via Kazuhiko Arase Reference Engine
  const matrix = useMemo(() => {
    try {
      const cleanValue = typeof value === "string" && value.trim() ? value.trim() : "MB-CG-781042";
      return generateQrMatrix(cleanValue);
    } catch (err) {
      console.error("[QRCodeDisplay] Generation error:", err);
      return generateQrMatrix("MB-CG-781042");
    }
  }, [value]);

  // Standard 4-module quiet zone as mandated by ISO/IEC 18004 for instant Google Lens / camera detection
  const quietZone = 4;
  const moduleCount = matrix.length;
  const totalGridSize = moduleCount + quietZone * 2;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-3 bg-white rounded-3xl ${
        showQuietZoneBorder ? "border-2 border-slate-200 shadow-md" : ""
      } ${className}`}
      style={{ width: size + 24, minWidth: size + 24 }}
    >
      <svg
        viewBox={`0 0 ${totalGridSize} ${totalGridSize}`}
        width={size}
        height={size}
        className="block w-full h-auto aspect-square select-none"
        shapeRendering="crispEdges"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Memory Bond QR Code for ${value}`}
      >
        {/* Solid white background encompassing entire grid including 4-module quiet zone */}
        <rect
          x="0"
          y="0"
          width={totalGridSize}
          height={totalGridSize}
          fill="#ffffff"
        />

        {/* High-contrast, sharp QR modules */}
        {matrix.map((row, y) =>
          row.map((isDark, x) =>
            isDark ? (
              <rect
                key={`${x}-${y}`}
                x={x + quietZone}
                y={y + quietZone}
                width={1}
                height={1}
                fill="#000000"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
