/**
 * Общие помощники куклы: тип фигуры, телосложение по умолчанию, геометрия тела, цвета (мех, гипс, пятна),
 * простыня-привидение. Одежда, аксессуары и причёски — данные: content/wardrobe/*.json, рисует их puppet/wardrobe.tsx.
 */
export const DEFAULT_HAIR: Record<string, { color: string; style: string }> = {
  man: { color: "#3a2a20", style: "short" },
  woman: { color: "#6b3e26", style: "long" },
  boy: { color: "#c98a3c", style: "short" },
  girl: { color: "#8a4b2a", style: "pigtails" },
  "old-man": { color: "#d9d9d9", style: "bald" },
  "old-woman": { color: "#e3e3e3", style: "perm" },
  baby: { color: "#c98a3c", style: "wisp" },
};

export const ANIMALS = ["bear", "hare", "dog", "cat", "bird", "cow", "horse", "penguin"];
export const isChild = (k: string) => k === "boy" || k === "girl";
/** Телосложение по умолчанию для типа фигуры (если в look.build не задано). */
export const defaultBuild = (k: string) => (isChild(k) ? "child" : k === "baby" ? "baby" : k === "penguin" ? "squat" : undefined);

/** Геометрия тела текущего телосложения (координаты бокса куклы). */
export type BodyGeo = { bx: number; w: number; top: number; bottom: number; legH: number };
const DEFAULT_GEO: BodyGeo = { bx: 60, w: 180, top: 230, bottom: 405, legH: 120 };

/** Тёмная ли кожа (для контрастных пятен). */
export const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 110;
};
export const spotColor = (skin: string) => (isDark(skin) ? "#f2f2f2" : "#2b1d14");
export const FUR = "#6e4a32";
export const FUR_TRIM = "#c9a27a";
export const PLASTER = "#f4f1ea";

/** Простыня-привидение: накрывает голову и тело до колен, лицо видно в вырезе (рисуется последней). */
export function GhostSheet({ geo }: { geo: BodyGeo }) {
  const L = geo.bx - 34;
  const R = geo.bx + geo.w + 34;
  const hem = geo.bottom + geo.legH * 0.55;
  const n = 5;
  const step = (R - L) / n;
  let wave = "";
  for (let i = n - 1; i >= 0; i--) wave += ` Q${L + step * (i + 0.5)} ${hem + 24} ${L + step * i} ${hem}`;
  const outer = `M${L} ${hem} L${geo.bx - 14} ${geo.top + 40} Q64 214 68 150 Q72 56 150 54 Q228 56 232 150 Q236 214 ${geo.bx + geo.w + 14} ${geo.top + 40} L${R} ${hem}${wave} Z`;
  const hole = "M92 178 A58 60 0 1 0 208 178 A58 60 0 1 0 92 178 Z";
  return (
    <g>
      <path d={`${outer} ${hole}`} fill="#f7f5f0" fillRule="evenodd" />
      {/* складки */}
      <path d={`M${geo.bx + 20} ${geo.top + 70} Q${geo.bx + 10} ${geo.bottom} ${geo.bx + 4} ${hem - 4} M${geo.bx + geo.w - 20} ${geo.top + 70} Q${geo.bx + geo.w - 10} ${geo.bottom} ${geo.bx + geo.w - 4} ${hem - 4}`} stroke="#d9d4c8" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Затемнить (k > 0) или осветлить (k < 0) цвет #rrggbb. */
export function shadeHex(hex: string, k: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c * (1 - k) : c + (255 - c) * -k)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("")}`;
}
