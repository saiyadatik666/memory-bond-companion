// ISO/IEC 18004 Standard QR Matrix Generator (Version 2, EC Level M)
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let x = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = x;
  EXP[i + 255] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 256) x ^= 0x11d;
}
function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function getRsPoly(ecCount: number): number[] {
  let poly: number[] = [1];
  for (let i = 0; i < ecCount; i++) {
    const root = EXP[i];
    const next: number[] = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function computeRS(data: number[], ecCount: number): number[] {
  const genPoly = getRsPoly(ecCount);
  const remainder: number[] = new Array(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    for (let i = 0; i < ecCount - 1; i++) {
      remainder[i] = remainder[i + 1];
    }
    remainder[ecCount - 1] = 0;
    if (factor !== 0) {
      for (let i = 0; i < ecCount; i++) {
        remainder[i] ^= gfMul(genPoly[i + 1], factor);
      }
    }
  }
  return remainder;
}

export function generateQrMatrix(text: string): boolean[][] {
  const size = 25; // Version 2
  const matrix: (boolean | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  const isFunction: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

  const drawFinder = (startX: number, startY: number) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const r = startY + y;
        const c = startX + x;
        if (r >= 0 && r < size && c >= 0 && c < size) {
          isFunction[r][c] = true;
          if (x >= 0 && x <= 6 && y >= 0 && y <= 6) {
            const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
            const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
            matrix[r][c] = isBorder || isInner;
          } else {
            matrix[r][c] = false;
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Alignment pattern V2 at (18, 18)
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const r = 18 + dy;
      const c = 18 + dx;
      isFunction[r][c] = true;
      matrix[r][c] = Math.abs(dy) === 2 || Math.abs(dx) === 2 || (dy === 0 && dx === 0);
    }
  }

  // Timing
  for (let i = 0; i < size; i++) {
    if (!isFunction[6][i]) {
      isFunction[6][i] = true;
      matrix[6][i] = i % 2 === 0;
    }
    if (!isFunction[i][6]) {
      isFunction[i][6] = true;
      matrix[i][6] = i % 2 === 0;
    }
  }

  // Dark module
  isFunction[17][8] = true;
  matrix[17][8] = true;

  // Format info reserve
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // Encode text
  const bitBuf: number[] = [];
  const push = (v: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bitBuf.push((v >> i) & 1);
  };
  push(4, 4); // Byte mode
  const textBytes = new TextEncoder().encode(text.slice(0, 26));
  push(textBytes.length, 8);
  for (let i = 0; i < textBytes.length; i++) push(textBytes[i], 8);

  const maxBits = 28 * 8;
  const termLen = Math.min(4, maxBits - bitBuf.length);
  push(0, termLen);
  while (bitBuf.length % 8 !== 0) bitBuf.push(0);
  const pad = [0xec, 0x11];
  let pIdx = 0;
  while (bitBuf.length < maxBits) {
    push(pad[pIdx % 2], 8);
    pIdx++;
  }

  const dataBytes: number[] = [];
  for (let i = 0; i < bitBuf.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bitBuf[i + j];
    dataBytes.push(b);
  }

  const ecBytes = computeRS(dataBytes, 16);
  const total = [...dataBytes, ...ecBytes];

  const allBits: number[] = [];
  for (const cw of total) {
    for (let i = 7; i >= 0; i--) allBits.push((cw >> i) & 1);
  }

  // Place in matrix
  let bIdx = 0;
  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5;
    const colPair = [rightCol, rightCol - 1];
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of colPair) {
        if (!isFunction[r][c]) {
          const raw = bIdx < allBits.length ? allBits[bIdx++] : 0;
          matrix[r][c] = (raw === 1) !== ((r + c) % 2 === 0);
        }
      }
    }
    upward = !upward;
  }

  // Format bits: EC M (00), Mask 0 (000) => 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const tl = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8],
    [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    matrix[tl[i][0]][tl[i][1]] = formatBits[i] === 1;
  }
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatBits[i] === 1;
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = formatBits[7 + i] === 1;
  }

  return matrix.map((row) => row.map((c) => c === true));
}
