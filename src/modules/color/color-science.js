function srgbToLinear(u) {
  const n = u / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
}

function linearToXYZ(r, g, b) {
  return [
    (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047,
    (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.0,
    (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883
  ];
}

function f(t) {
  return t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29;
}

export function rgbToLab(r, g, b) {
  const [x, y, z] = linearToXYZ(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaE76(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function deltaE00(lab1, lab2) {
  // Compact CIEDE2000 implementation
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const avgLp = (L1 + L2) / 2;
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const avgC = (c1 + c2) / 2;
  const G = 0.5 * (1 - Math.sqrt((avgC ** 7) / (avgC ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) + 2 * Math.PI) % (2 * Math.PI);
  const h2p = (Math.atan2(b2, a2p) + 2 * Math.PI) % (2 * Math.PI);
  const dLp = L2 - L1;
  const dCp = c2p - c1p;
  let dhp = h2p - h1p;
  if (Math.abs(dhp) > Math.PI) dhp += dhp > 0 ? -2 * Math.PI : 2 * Math.PI;
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(dhp / 2);
  const avgL = (L1 + L2) / 2;
  const avgCp = (c1p + c2p) / 2;
  let avgh = (h1p + h2p) / 2;
  if (Math.abs(h1p - h2p) > Math.PI) avgh += Math.PI;
  const T = 1 - 0.17 * Math.cos(avgh - Math.PI / 6) + 0.24 * Math.cos(2 * avgh) + 0.32 * Math.cos(3 * avgh + Math.PI / 30) - 0.2 * Math.cos(4 * avgh - 63 * Math.PI / 180);
  const dRo = 30 * Math.PI / 180 * Math.exp(-(((avgh * 180 / Math.PI - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt((avgCp ** 7) / (avgCp ** 7 + 25 ** 7));
  const SL = 1 + (0.015 * (avgL - 50) ** 2) / Math.sqrt(20 + (avgL - 50) ** 2);
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const RT = -Math.sin(2 * dRo) * RC;
  return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH));
}
