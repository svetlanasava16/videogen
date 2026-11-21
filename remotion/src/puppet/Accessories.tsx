/**
 * Причёски и стереотипные аксессуары куклы. Координаты — в боксе 300×420:
 * голова — центр (150,160), радиусы 76×82; тело начинается с y=230 (нагрудные детали обрезаются по форме тела).
 * Новый аксессуар = новый case в Accessory (+ id в FRONT, если он на теле, или в BACK, если за головой).
 * Слои (Rig.tsx): BACK — за головой; FRONT — на теле, обрезается по форме тела; OVER — поверх тела без обрезки
 * (шуба); BOTH — рисуется и на теле (part="body"), и на голове (part="head"); остальное — на голове поверх лица.
 * Особые id обрабатывает сам риг: hook-hand (крюк вместо левой кисти), bandages (гипс на руке и ноге + повязка
 * на голове отсюда), ghost-sheet (простыня поверх всей фигуры, рисуется последней).
 * geo — размеры тела текущего телосложения: для деталей, которые должны подстраиваться под build.
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

/** Отпечаток губ (поцелуй) с центром в (x, y). */
const Kiss = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <path transform={`translate(${x} ${y}) rotate(${r})`} d="M-13 0 Q-8 -9 -1 -4 L0 -3 L1 -4 Q8 -9 13 0 Q7 3 0 2 Q-7 3 -13 0 Z M-12 2 Q0 13 12 2 Q0 6 -12 2 Z" fill="#d42a4a" />
);

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

/** Лохматые пряди: зубчатая «шапка» сверху и космы по бокам за головой (домовой, леший). */
const jag = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, out: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= n * 2; i++) {
    const a = ((a0 + ((a1 - a0) * i) / (n * 2)) * Math.PI) / 180;
    const k = i % 2 ? 1 + out : 1;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return pts;
};
const SHAGGY_TOP = `M${jag(150, 160, 80, 86, 196, 344, 7, 0.16).join(" L")} Q150 96 70 136 Z`;
const SHAGGY_BACK = `M${jag(150, 168, 88, 96, 140, 400, 12, 0.14).join(" L")} Z`;

/** Причёска поверх головы (и длинные волосы — отдельно, за головой). */
export function HairBack({ style, color }: { style: string; color: string }) {
  if (style === "long") return <path d="M70 150 Q60 260 95 290 L205 290 Q240 260 230 150 Z" fill={color} />;
  if (style === "pigtails") return (<><circle cx="70" cy="190" r="22" fill={color} /><circle cx="230" cy="190" r="22" fill={color} /></>);
  if (style === "shaggy") return <path d={SHAGGY_BACK} fill={color} />;
  return null;
}
export function HairTop({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "short":
    case "long":
    case "pigtails":
      return <path d="M74 150 Q74 76 150 74 Q226 76 226 150 Q206 112 150 108 Q94 112 74 150 Z" fill={color} />;
    case "curly":
      return <g fill={color}>{[90, 115, 140, 165, 190, 210].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 92 : 100} r="22" />)}</g>;
    case "fringe":
      return (<><path d="M74 165 Q72 130 88 118 L92 168 Z" fill={color} /><path d="M226 165 Q228 130 212 118 L208 168 Z" fill={color} /></>);
    case "bun":
      return (<><path d="M74 150 Q74 80 150 78 Q226 80 226 150 Q200 116 150 112 Q100 116 74 150 Z" fill={color} /><circle cx="150" cy="70" r="22" fill={color} /></>);
    case "perm":
      return <g fill={color}>{[85, 110, 135, 160, 185, 212].map((x) => <circle key={x} cx={x} cy="98" r="24" />)}</g>;
    case "wisp":
      return <path d="M144 82 Q136 56 160 50 Q170 50 168 60 Q158 54 152 62 Q148 70 156 82 Z" fill={color} />;
    case "shaggy":
      return <path d={SHAGGY_TOP} fill={color} />;
    case "bald":
      return (<><path d="M76 170 Q74 140 86 130 L92 172 Z" fill={color} /><path d="M224 170 Q226 140 214 130 L208 172 Z" fill={color} /></>);
    default:
      return null;
  }
}

/** Затемнить (k > 0) или осветлить (k < 0) цвет #rrggbb. */
export function shadeHex(hex: string, k: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? c * (1 - k) : c + (255 - c) * -k)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("")}`;
}

/*
 * Форма и спецодежда (outfits). Рисуются на теле (FRONT, обрезка по контуру тела) нижним слоем (LAYER 0),
 * жилеты и халат — поверх (LAYER 1), остальные нагрудные детали (галстук, значок, фартук) — ещё выше.
 * Рукава, нашивки на манжетах, погоны на плечах и цвет брюк задаёт OUTFIT (их рисует риг на руках и ногах).
 * Шапки — отдельные аксессуары, чтобы их можно было смешивать.
 */
const GOLD = "#d9a92a";
const WHITE = "#f7f6f1";
const SHIRT = "#f4f4ef";
const RED = "#b3261e";
const BUTTON_DARK = "#2b1d14";
const PILOT = "#1e2a44";
const POLICE = "#5f7088";
const KHAKI = "#757645";
const OLIVE = "#56603e";
const STEW = "#233660";
const COAT = "#fbfbf8";
const NAVY = "#1f2d50";
const PRISON = "#e6e2d6";

export type Outfit = {
  /** цвет рукавов (иначе — look.clothes) */ sleeve?: string;
  /** цвет брюк (иначе — темнее look.clothes) */ pants?: string;
  /** нашивки на манжетах: цвет и число полос */ cuff?: { color: string; n: number };
  /** погоны на плечах: цвет, кант, звёздочки */ board?: { color: string; edge?: string; stars?: number; star?: string };
  /** поперечные полосы на рукавах (тюремная роба) */ stripes?: string;
};
export const OUTFIT: Record<string, Outfit> = {
  "pilot-uniform": { sleeve: PILOT, pants: PILOT, cuff: { color: GOLD, n: 4 } },
  "police-uniform": { sleeve: POLICE, pants: shadeHex(POLICE, 0.35), board: { color: POLICE, edge: RED, stars: 2, star: GOLD } },
  "military-uniform": { sleeve: KHAKI, pants: shadeHex(KHAKI, 0.3), board: { color: RED, edge: shadeHex(RED, 0.3) } },
  "officer-uniform": { sleeve: OLIVE, pants: shadeHex(OLIVE, 0.35), board: { color: GOLD, edge: RED, stars: 3, star: "#8a6a10" } },
  "chef-whites": { sleeve: WHITE, pants: "#3a3a3e" },
  construction: { pants: "#3d5a80" },
  "stewardess-uniform": { sleeve: STEW, pants: shadeHex(STEW, 0.18), cuff: { color: GOLD, n: 1 } },
  "doctor-coat": { sleeve: COAT },
  prisoner: { sleeve: PRISON, pants: "#3a3a3e", stripes: "#2b2b2b" },
  sailor: { sleeve: NAVY, pants: NAVY },
  // ноги под полотенцем голые: брюк нет (тон кожи большинства кукол; рукава — look.clothes цвета кожи)
  "towel-wrap": { pants: "#efc8a0" },
};
/** Слой нагрудных деталей: 0 — форма (низ), 1 — жилет/халат поверх, остальное — 2. */
export const LAYER: Record<string, number> = {
  "pilot-uniform": 0, "police-uniform": 0, "military-uniform": 0, "officer-uniform": 0, "chef-whites": 0, construction: 1,
  suit: 0, "stewardess-uniform": 0, "doctor-coat": 1, prisoner: 0, sailor: 0, "traffic-vest": 1, "striped-shirt": 0,
};
/** Сводная спецификация формы по списку аксессуаров (последний выигрывает). */
export function outfitOf(acc: string[]): Outfit {
  const o: Outfit = {};
  for (const a of acc) if (OUTFIT[a]) Object.assign(o, OUTFIT[a]);
  return o;
}

/** Пятиконечная звезда. */
const star = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
};
export const Star = ({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) => <path d={star(cx, cy, r)} fill={fill} />;

/** Опорные точки тела: c — центр, L/R — видимая грудь между руками, h — высота корпуса. */
const frame = (g: BodyGeo) => {
  const h = g.bottom - g.top, L = g.bx + 24, R = g.bx + g.w - 24;
  return { c: 150, h, L, R, iw: R - L, top: g.top, bottom: g.bottom, bx: g.bx, w: g.w };
};
/** Сплошная заливка корпуса (обрезается по контуру тела) + «живот» у полных. */
const Base = ({ g, color }: { g: BodyGeo; color: string }) => (
  <>
    <rect x={g.bx - 40} y={g.top - 12} width={g.w + 80} height={g.bottom - g.top + 60} fill={color} />
    {g.w >= 220 && <ellipse cx={150} cy={g.bottom - 50} rx={g.w / 2 - 6} ry={60} fill={shadeHex(color, isDark(color) ? -0.06 : 0.035)} />}
  </>
);
/** Вырез (рубашка) до глубины vy. */
const Vneck = ({ top, vy, color, half = 26 }: { top: number; vy: number; color: string; half?: number }) => <path d={`M${150 - half} ${top - 8} L150 ${vy} L${150 + half} ${top - 8} Z`} fill={color} />;
/** Лацканы вдоль выреза. */
const Lapels = ({ top, vy, color, half = 26, edge }: { top: number; vy: number; color: string; half?: number; edge?: string }) => {
  const d = vy - top;
  const side = (s: number) => `M${150 - s * half} ${top - 8} L${150 - s * 1} ${vy} L${150 - s * 20} ${top + d * 0.58} L${150 - s * 44} ${top + d * 0.32} L${150 - s * 36} ${top + d * 0.2} L${150 - s * 42} ${top + 2} Z`;
  return <g fill={color} stroke={edge} strokeWidth={edge ? 3 : 0} strokeLinejoin="round">{[1, -1].map((s) => <path key={s} d={side(s)} />)}</g>;
};
/** Галстук: узел у шеи и лопасть до y1. */
const TieShape = ({ y0, y1, color }: { y0: number; y1: number; color: string }) => (
  <g>
    <path d={`M${150 - 10} ${y0} L${150 + 10} ${y0} L${150 + 7} ${y0 + 16} L${150 - 7} ${y0 + 16} Z`} fill={shadeHex(color, 0.18)} />
    <path d={`M${150 - 7} ${y0 + 16} L${150 + 7} ${y0 + 16} L${150 + 12} ${y1 - 12} L150 ${y1} L${150 - 12} ${y1 - 12} Z`} fill={color} />
    <path d={`M${150 + 2} ${y0 + 22} L${150 + 8} ${y1 - 14}`} stroke={shadeHex(color, -0.25)} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
  </g>
);
/** Ряд пуговиц от y0 до y1 по x. */
const Buttons = ({ x, y0, y1, n, color = GOLD, r = 5.5 }: { x: number; y0: number; y1: number; n: number; color?: string; r?: number }) => (
  <g fill={color}>{Array.from({ length: n }, (_, i) => <circle key={i} cx={x} cy={n === 1 ? y0 : y0 + ((y1 - y0) * i) / (n - 1)} r={r} />)}</g>
);
/** Карман с клапаном (cx — центр, y — верх клапана). */
const Pocket = ({ cx, y, w, color, button }: { cx: number; y: number; w: number; color: string; button?: string }) => (
  <g>
    <rect x={cx - w / 2} y={y} width={w} height={w * 0.8} rx={4} fill={shadeHex(color, 0.07)} />
    <path d={`M${cx - w / 2 - 2} ${y} H${cx + w / 2 + 2} V${y + w * 0.22} Q${cx} ${y + w * 0.42} ${cx - w / 2 - 2} ${y + w * 0.22} Z`} fill={shadeHex(color, 0.16)} />
    {button && <circle cx={cx} cy={y + w * 0.24} r={3.5} fill={button} />}
  </g>
);
/** Ремень с пряжкой. */
const Belt = ({ g, y, color = "#5a3a22", buckle = GOLD, starOn }: { g: BodyGeo; y: number; color?: string; buckle?: string; starOn?: boolean }) => (
  <g>
    <rect x={g.bx - 10} y={y} width={g.w + 20} height={15} fill={color} />
    <rect x={150 - 13} y={y - 3} width={26} height={21} rx={3} fill={buckle} />
    {starOn ? <Star cx={150} cy={y + 7.5} r={7} fill={shadeHex(buckle, 0.35)} /> : <rect x={150 - 7} y={y + 3} width={14} height={9} rx={2} fill={shadeHex(buckle, 0.3)} />}
  </g>
);
/** Светоотражающий жилет: заливка с V-вырезом, две горизонтальные и две вертикальные серебристые полосы. */
const HiVis = ({ g, color }: { g: BodyGeo; color: string }) => {
  const { c, h, iw, top, bx, w } = frame(g);
  const vy = top + h * 0.34;
  const band = (y: number) => <rect x={bx - 20} y={y} width={w + 40} height={13} fill="#e8e8e2" />;
  const s1 = top + h * 0.56, s2 = top + h * 0.8;
  return (
    <g>
      <path d={`M${bx - 40} ${top - 12} H${c - 30} L${c} ${vy} L${c + 30} ${top - 12} H${bx + w + 40} V${g.bottom + 40} H${bx - 40} Z`} fill={color} />
      {[-1, 1].map((s) => <rect key={s} x={c + s * iw * 0.3 - 6.5} y={top - 10} width={13} height={s1 - top + 10} fill="#e8e8e2" />)}
      {band(s1)}{band(s2)}
      <path d={`M${c} ${vy} V${g.bottom + 10}`} stroke={shadeHex(color, 0.25)} strokeWidth={3} />
    </g>
  );
};
/** Козырная фуражка: тулья (шире околыша), околыш, козырёк вперёд (по взгляду), кокарда. */
const PeakedCap = ({ crown, band, badge, cord }: { crown: string; band: string; badge?: React.ReactNode; cord?: string }) => (
  <g>
    <path d="M86 104 L64 80 Q62 64 92 60 Q150 48 208 60 Q238 64 236 80 L214 104 Z" fill={crown} />
    <path d="M64 80 Q150 66 236 80 Q236 72 226 68 Q150 58 74 68 Q64 72 64 80 Z" fill={shadeHex(crown, -0.12)} />
    <rect x={84} y={98} width={132} height={22} rx={4} fill={band} />
    {cord && <path d="M94 118 L206 118" stroke={cord} strokeWidth={4} strokeLinecap="round" />}
    <path d="M88 118 L214 118 Q248 120 250 131 Q206 136 88 127 Z" fill="#151515" />
    {badge}
  </g>
);

/** Стереотипные детали: крест, борода, кепка, корона… Неизвестные id игнорируются. */
export function Accessory({ id, hair, skin = "#f0d0b0", geo = DEFAULT_GEO, part = "head", clothes }: { id: string; hair: string; skin?: string; geo?: BodyGeo; part?: "head" | "body"; clothes?: string }) {
  const { bx, w, top, bottom, legH } = geo;
  switch (id) {
    // новые: лицо и голова
    case "high-drawn-eyebrows": // тонкие нарисованные брови высоко на лбу (свои брови риг прячет)
      return <g stroke="#2b1d14" strokeWidth="3.5" fill="none" strokeLinecap="round"><path d="M102 132 Q116 106 142 120" /><path d="M198 132 Q184 106 158 120" /></g>;
    case "black-eye": // синяк вокруг правого (для зрителя) глаза — кольцом, глаз остаётся виден
      return (<><circle cx="178" cy="153" r="21" stroke="#8a5a9a" strokeWidth="8" fill="none" opacity="0.45" /><circle cx="178" cy="153" r="17" stroke="#5b2a6a" strokeWidth="6" fill="none" opacity="0.7" /></>);
    case "eye-patch":
      return (<g fill="#151515"><path d="M164 142 L96 96 M194 158 L224 166" stroke="#151515" strokeWidth="5" strokeLinecap="round" /><path d="M157 146 Q160 130 180 130 Q200 132 200 150 Q198 172 178 172 Q160 170 157 146 Z" /></g>);
    case "lipstick-marks":
      return (<><Kiss x={104} y={194} r={-18} /><Kiss x={198} y={190} r={14} /><Kiss x={164} y={116} r={8} /></>);
    case "santa-hat":
      return (<><path d="M88 100 Q100 36 160 34 Q214 34 240 96 L246 112 L214 104 Q206 70 196 64 Q160 96 88 100 Z" fill="#b3261e" /><rect x="78" y="88" width="146" height="26" rx="13" fill="#f6f2e8" /><circle cx="246" cy="114" r="15" fill="#f6f2e8" /></>);
    case "big-beard": // большая лохматая борода + усы, рот остаётся виден
      return (<g fill={hair}><path d="M116 196 Q150 180 184 196 Q166 202 150 198 Q134 202 116 196 Z" /><path d={`M80 172 Q84 228 104 222 Q120 236 150 236 Q180 236 196 222 Q216 228 220 172 Q238 250 214 300 L204 284 L192 318 L176 300 L162 336 L150 304 L138 336 L124 300 L108 318 L96 284 L86 300 Q62 250 80 172 Z`} /></g>);
    case "bandages": // повязка на лбу с узлом + пластырь крест-накрест на щеке (гипс на руке и ноге рисует риг)
      return (<><path d="M76 120 Q150 84 224 120 L226 140 Q150 108 74 140 Z" fill={PLASTER} /><path d="M222 118 L246 104 L244 126 Z M222 132 L248 140 L232 152 Z" fill={PLASTER} /><g transform="rotate(25 172 230)" fill="#efe6d6"><rect x="160" y="226" width="24" height="8" rx="3" /><rect x="168" y="218" width="8" height="24" rx="3" /></g></>);
    case "spots": { // пятна (далматинец; на тёмной шкуре — светлые)
      const c = spotColor(skin);
      if (part === "body") return <g fill={c}>{[[0.25, 40, 18], [0.72, 70, 15], [0.42, 0.62, 17], [0.82, -32, 12], [0.14, -46, 12], [0.58, 16, 9], [0.3, -14, 9]].map(([fx, fy, r], i) => <circle key={i} cx={bx + w * fx} cy={fy > 1 ? top + fy : fy < 0 ? bottom + fy : top + (bottom - top) * fy} r={r} />)}</g>;
      return <g fill={c}><circle cx="104" cy="114" r="11" /><circle cx="198" cy="112" r="8" /><circle cx="206" cy="200" r="9" /><circle cx="96" cy="196" r="7" /><circle cx="150" cy="96" r="6" /></g>;
    }
    // новые: тело
    case "fur-coat": { // длинная пушистая шуба поверх одежды (рисуется без обрезки, ниже тела)
      const hem = bottom + legH * 0.45;
      const fluff = (y: number, x0: number, x1: number, r: number) => { const out = []; for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / (r * 1.5)))) out.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={r} />); return out; };
      return (
        <g>
          <path d={`M${bx + 30} ${top} H${bx + w - 30} Q${bx + w + 8} ${top} ${bx + w + 10} ${top + 44} L${bx + w + 28} ${hem} H${bx - 28} L${bx - 10} ${top + 44} Q${bx - 8} ${top} ${bx + 30} ${top} Z`} fill={FUR} />
          <rect x={147} y={top + 24} width={6} height={hem - top - 30} rx={3} fill="#4a301f" />
          <g fill={FUR_TRIM}>{fluff(hem, bx - 24, bx + w + 24, 13)}{fluff(top + 6, 104, 196, 15)}</g>
          {[0.3, 0.55].map((k) => <rect key={k} x={140} y={top + 24 + (hem - top) * k} width={20} height={8} rx={4} fill={FUR_TRIM} />)}
        </g>
      );
    }
    case "towel-wrap": { // банное полотенце вокруг пояса (голый торс — look.clothes цвета кожи); рисуется без обрезки, поверх ног
      const y0 = bottom - 46, hem = bottom + legH * 0.5;
      const L0 = bx - 8, R0 = bx + w + 8, L1 = bx - 20, R1 = bx + w + 20;
      const tx = bx + w * 0.66; // край запаха
      return (
        <g>
          <path d={`M${L0} ${y0} Q150 ${y0 - 8} ${R0} ${y0} L${R1} ${hem} Q150 ${hem + 12} ${L1} ${hem} Z`} fill="#f4f1ea" />
          {[0.72, 0.82].map((k) => <path key={k} d={`M${L0 + (L1 - L0) * k - 1} ${y0 + (hem - y0) * k} Q150 ${y0 + (hem - y0) * k + 10} ${R0 + (R1 - R0) * k + 1} ${y0 + (hem - y0) * k}`} stroke="#7fb3d5" strokeWidth={7} fill="none" />)}
          <path d={`M${tx} ${y0 - 3} Q${tx + 10} ${(y0 + hem) / 2} ${tx + 4} ${hem + 6}`} stroke="#ddd8ca" strokeWidth={4} fill="none" />
          <path d={`M${tx - 4} ${y0 - 2} L${tx + 22} ${y0 - 4} L${tx + 12} ${y0 + 22} Z`} fill="#e6e1d4" />
          <path d={`M${L0 + 14} ${y0 + 20} Q${L0 + 8} ${(y0 + hem) / 2} ${L1 + 18} ${hem - 4}`} stroke="#e6e1d4" strokeWidth={4} fill="none" />
        </g>
      );
    }
    case "sash": // кушак на крестьянской рубахе
      return (<><rect x={bx} y={bottom - 44} width={w} height={14} fill="#c8553d" /><path d={`M${bx + w * 0.3} ${bottom - 32} l-8 34 h10 l4 -30 l6 30 h10 l-6 -34 z`} fill="#c8553d" /></>);
    case "onesie-snaps": // кнопки на ползунках
      return <g fill="#f6f2e8">{[0.25, 0.5, 0.75].map((k) => <circle key={k} cx={150} cy={top + (bottom - top) * k} r={6} />)}</g>;
    // лицо
    case "beard": return <path d="M88 185 Q90 250 150 262 Q210 250 212 185 Q190 215 150 218 Q110 215 88 185 Z" fill={hair} />;
    case "white-beard": return <path d="M84 180 Q86 270 150 290 Q214 270 216 180 Q190 220 150 222 Q110 220 84 180 Z" fill="#f2f2f2" />;
    case "goatee": return <path d="M135 222 Q150 252 165 222 Z" fill={hair} />;
    case "stubble": return <ellipse cx="150" cy="212" rx="48" ry="26" fill="#00000018" />;
    case "mustache": return <path d="M116 196 Q150 182 184 196 Q150 206 116 196 Z" fill={hair} />;
    case "mustache-curled": return <path d="M108 190 Q130 200 150 192 Q170 200 192 190 Q196 206 180 204 Q150 208 120 204 Q104 206 108 190 Z" fill={hair} />;
    case "side-curls": return (<><path d="M80 160 q-10 30 4 50" stroke={hair} strokeWidth="8" fill="none" /><path d="M220 160 q10 30 -4 50" stroke={hair} strokeWidth="8" fill="none" /></>);
    case "glasses": return <g stroke="#2b1d14" strokeWidth="5" fill="none"><rect x="102" y="138" width="40" height="28" rx="6" /><rect x="158" y="138" width="40" height="28" rx="6" /><path d="M142 150 h16" /></g>;
    case "round-glasses": return <g stroke="#2b1d14" strokeWidth="5" fill="none"><circle cx="122" cy="152" r="20" /><circle cx="178" cy="152" r="20" /><path d="M142 152 h16" /></g>;
    case "cat-eye-glasses": return <g stroke="#5b2a6a" strokeWidth="6" fill="none"><path d="M98 140 L146 142 L140 166 L106 166 Z" /><path d="M202 140 L154 142 L160 166 L194 166 Z" /></g>;
    case "dark-glasses": return <g fill="#111"><rect x="100" y="140" width="44" height="24" rx="8" /><rect x="156" y="140" width="44" height="24" rx="8" /><rect x="142" y="148" width="16" height="5" /></g>;
    case "monocle": return <circle cx="178" cy="152" r="18" stroke="#c8a227" strokeWidth="5" fill="none" />;
    case "eye-mask": return <path d="M90 140 Q150 126 210 140 L206 166 Q178 172 160 160 L140 160 Q122 172 94 166 Z" fill="#111" />;
    case "freckles": return <g fill="#c06a3a">{[[112, 180], [122, 186], [132, 180], [168, 180], [178, 186], [188, 180]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" />)}</g>;
    case "red-nose": return <circle cx="150" cy="178" r="14" fill="#d9363e" />;
    case "mole": return <circle cx="186" cy="196" r="4" fill="#3a2a20" />;
    case "lipstick": return null; // губы рисует Face (обводка рта цветом помады, двигается вместе с ртом)
    case "earrings": return (<><circle cx="78" cy="180" r="7" fill="#e0a030" /><circle cx="222" cy="180" r="7" fill="#e0a030" /></>);
    // голова
    case "flat-cap": return <path d="M78 118 Q150 70 222 118 L236 128 Q150 112 78 122 Z" fill="#5b4636" />;
    case "army-cap": return (<><path d="M80 112 Q150 60 220 112 Z" fill="#4b5a3a" /><circle cx="150" cy="96" r="7" fill="#b3261e" /></>);
    case "helmet": return <path d="M72 128 Q150 44 228 128 Z" fill="#4b5a3a" />;
    case "shako": return (<><rect x="104" y="40" width="92" height="72" rx="6" fill="#7a2e2e" /><rect x="104" y="40" width="92" height="12" fill="#c8a227" /></>);
    case "papakha": return <rect x="88" y="62" width="124" height="54" rx="22" fill="#3a2a20" />;
    case "chef-hat": return (<><rect x="108" y="64" width="84" height="44" fill="#fff" /><circle cx="120" cy="58" r="22" fill="#fff" /><circle cx="150" cy="50" r="24" fill="#fff" /><circle cx="180" cy="58" r="22" fill="#fff" /></>);
    case "nurse-cap": return (<><path d="M110 98 L190 98 L180 74 L120 74 Z" fill="#fff" /><path d="M146 80 h8 v14 h-8 z M140 84 h20 v6 h-20 z" fill="#d9363e" /></>);
    case "crown": return <path d="M100 100 L104 56 L126 82 L150 50 L174 82 L196 56 L200 100 Z" fill="#e0b030" />;
    case "halo": return <ellipse cx="150" cy="56" rx="58" ry="12" fill="none" stroke="#f5d76e" strokeWidth="8" />;
    case "horns": return (<><path d="M100 95 L88 40 L122 85 Z" fill="#b3261e" /><path d="M200 95 L212 40 L178 85 Z" fill="#b3261e" /></>);
    case "kippah": return <path d="M118 84 Q150 64 182 84 Z" fill="#1c2a4a" />;
    case "black-hat": return (<><rect x="104" y="48" width="92" height="52" rx="8" fill="#111" /><rect x="80" y="96" width="140" height="12" rx="6" fill="#111" /></>);
    case "bowler": return (<><path d="M106 100 Q106 52 150 52 Q194 52 194 100 Z" fill="#1d1d1d" /><rect x="88" y="96" width="124" height="10" rx="5" fill="#1d1d1d" /></>);
    case "cowboy-hat": return (<><path d="M108 100 Q112 50 150 56 Q188 50 192 100 Z" fill="#8a5a2b" /><path d="M60 102 Q150 124 240 102 Q240 92 150 100 Q60 92 60 102 Z" fill="#8a5a2b" /></>);
    case "beret": return <ellipse cx="140" cy="84" rx="66" ry="22" fill="#2b2b2b" />;
    case "tyrolean-hat": return (<><path d="M104 102 Q110 52 150 54 Q190 52 196 102 Z" fill="#3e5a2e" /><path d="M188 70 l24 -30" stroke="#c8553d" strokeWidth="5" /></>);
    case "aerodrome-cap": return <ellipse cx="150" cy="92" rx="96" ry="26" fill="#3a3a3a" />;
    case "straw-hat": return (<><ellipse cx="150" cy="100" rx="104" ry="18" fill="#e3c36a" /><path d="M110 100 Q112 60 150 60 Q188 60 190 100 Z" fill="#e3c36a" /></>);
    case "headscarf": return <path d="M64 170 Q60 70 150 64 Q240 70 236 170 Q220 120 150 112 Q80 120 64 170 Z M120 236 L150 270 L180 236 Z" fill="#c8553d" />;
    case "curlers": return <g fill="#7fb3d5">{[96, 124, 152, 180, 206].map((x) => <rect key={x} x={x - 9} y="76" width="18" height="26" rx="8" />)}</g>;
    case "turban": return <ellipse cx="150" cy="84" rx="82" ry="34" fill="#f2f2f2" />;
    case "hood": return <path d="M60 210 Q50 60 150 54 Q250 60 240 210 Q226 120 150 110 Q74 120 60 210 Z" fill="#1d1d1d" />;
    case "zucchetto": return <path d="M122 82 Q150 66 178 82 Z" fill="#f2f2f2" />;
    case "nun-veil": return <path d="M62 250 Q50 64 150 58 Q250 64 238 250 L222 250 Q228 120 150 112 Q72 120 78 250 Z" fill="#1d1d1d" />;
    case "bows": return (<><path d="M50 172 l20 12 -20 12 z M90 172 l-20 12 20 12 z" fill="#d9363e" /><path d="M210 172 l20 12 -20 12 z M250 172 l-20 12 20 12 z" fill="#d9363e" /></>);
    case "headset": return <path d="M72 160 Q72 80 150 78 Q228 80 228 160 M228 160 Q228 200 186 206" stroke="#2b2b2b" strokeWidth="7" fill="none" />;
    case "cowlick": return <path d="M146 76 q-4 -26 16 -30 q-12 12 -6 30 z" fill="#c98a3c" />;
    // тело
    case "cross": return (<><path d="M138 232 L150 262 L162 232" stroke="#c8a227" strokeWidth="3" fill="none" /><rect x="145" y="262" width="10" height="44" fill="#c8a227" /><rect x="133" y="274" width="34" height="9" fill="#c8a227" /></>);
    case "tie": { // галстук: уголки воротника рубашки, узел, лопасть до середины корпуса
      const y1 = top + Math.max(70, (bottom - top) * 0.5);
      return (<><path d="M124 230 L148 240 L136 254 Z M176 230 L152 240 L164 254 Z" fill="#f4f4ef" /><TieShape y0={236} y1={y1} color="#b3261e" /></>);
    }
    case "bow-tie": return <path d="M126 236 L150 246 L174 236 L174 258 L150 248 L126 258 Z" fill="#111" />;
    case "gold-chain": return <path d="M104 236 Q150 300 196 236" stroke="#e0b030" strokeWidth="8" fill="none" />;
    case "stethoscope": return <path d="M114 236 Q110 290 150 296 Q190 290 186 236 M150 296 v20" stroke="#2b2b2b" strokeWidth="5" fill="none" />;
    case "apron": return <path d="M100 270 L200 270 L208 420 L92 420 Z" fill="#f2e6d0" opacity="0.95" />;
    case "towel": return <rect x="190" y="228" width="28" height="64" rx="6" fill="#f2f2f2" />;
    case "brooch": return <circle cx="122" cy="256" r="9" fill="#e0a030" />;
    case "badge": return <path d="M112 262 l10 -14 10 14 -10 14 z" fill="#e0b030" />;
    case "striped-shirt": return <g fill="#111">{[250, 280, 310, 340, 370, 400].map((y) => <rect key={y} x="62" y={y} width="176" height="12" />)}</g>;
    case "loot-bag": return (<><ellipse cx="248" cy="340" rx="40" ry="46" fill="#9a8a6a" /><text x="230" y="352" fontSize="34" fontWeight="900" fill="#2b1d14">$</text></>);
    case "camera": return <rect x="122" y="292" width="56" height="38" rx="6" fill="#2b2b2b" />;
    case "collar": return <rect x="98" y="226" width="104" height="14" rx="7" fill="#c8553d" />;
    case "robe-white": return <rect x="56" y="228" width="188" height="192" rx="40" fill="#f6f2e8" />;
    case "robe-red": return <rect x="56" y="228" width="188" height="192" rx="40" fill="#b3261e" />;
    case "robe-black": return <rect x="56" y="228" width="188" height="192" rx="40" fill="#1d1d1d" />;
    case "keys": return <g stroke="#c8a227" strokeWidth="6" fill="none"><circle cx="232" cy="300" r="12" /><path d="M232 312 v40 h10 M232 330 h8" /></g>;
    case "scythe": return <path d="M262 420 L262 180 Q200 170 180 210" stroke="#5b4636" strokeWidth="8" fill="none" />;
    case "baguette": return <rect x="230" y="250" width="18" height="120" rx="9" fill="#d9a65a" transform="rotate(20 239 310)" />;
    case "suspenders": return (<><rect x="96" y="232" width="12" height="188" fill="#5b4636" /><rect x="192" y="232" width="12" height="188" fill="#5b4636" /></>);
    // форма и спецодежда (тело; рукава, манжеты, погоны, брюки — OUTFIT, рисует риг)
    case "pilot-uniform": { // тёмно-синий двубортный китель, белая рубашка с чёрным галстуком, «крылышки», золото на манжетах
      const f = frame(geo), vy = f.top + f.h * 0.42;
      return (
        <g>
          <Base g={geo} color={PILOT} />
          <Vneck top={f.top} vy={vy} color={SHIRT} />
          <TieShape y0={f.top + 8} y1={vy - 4} color="#151515" />
          <Lapels top={f.top} vy={vy} color={shadeHex(PILOT, -0.1)} />
          {[-1, 1].map((s) => <Buttons key={s} x={150 + s * 17} y0={vy + 14} y1={f.bottom - 26} n={3} />)}
          <g transform={`translate(${150 - f.iw * 0.3} ${f.top + f.h * 0.5})`} fill={GOLD}>
            <path d="M-26 -2 Q-14 -10 0 -4 Q14 -10 26 -2 Q14 2 0 2 Q-14 2 -26 -2 Z" />
            <circle cx={0} cy={-2} r={6} />
          </g>
          {[-1, 1].map((s) => <rect key={s} x={150 + s * f.iw * 0.32 - f.iw * 0.13} y={f.bottom - f.h * 0.24} width={f.iw * 0.26} height={6} rx={3} fill={shadeHex(PILOT, 0.25)} />)}
        </g>
      );
    }
    case "police-uniform": { // серо-синий китель милиции: голубая рубашка с галстуком, красный кант, значок, карманы, ремень
      const f = frame(geo), vy = f.top + f.h * 0.36, belt = f.top + f.h * 0.7;
      return (
        <g>
          <Base g={geo} color={POLICE} />
          <Vneck top={f.top} vy={vy} color="#b9cde6" />
          <TieShape y0={f.top + 8} y1={vy - 4} color="#22304a" />
          <Lapels top={f.top} vy={vy} color={shadeHex(POLICE, 0.08)} edge={RED} />
          <Buttons x={150} y0={vy + 14} y1={belt - 12} n={Math.max(2, Math.round((belt - vy) / 30))} />
          {[-1, 1].map((s) => <Pocket key={s} cx={150 + s * f.iw * 0.3} y={vy + 2} w={f.iw * 0.24} color={POLICE} button={GOLD} />)}
          <g transform={`translate(${150 + f.iw * 0.3} ${vy + 4 + f.iw * 0.34})`}>
            <circle r={10} fill={GOLD} /><circle r={6.5} fill={RED} /><Star cx={0} cy={0} r={5} fill={GOLD} />
          </g>
          <Belt g={geo} y={belt} color="#3b2a1e" />
        </g>
      );
    }
    case "traffic-vest": // салатовый светоотражающий жилет (ГАИ/ДПС), поверх формы
      return <HiVis g={geo} color="#c6e03a" />;
    case "military-uniform": { // гимнастёрка цвета хаки: стойка, планка с пуговицами, нагрудные карманы, ремень со звездой
      const f = frame(geo), belt = f.top + f.h * 0.66;
      return (
        <g>
          <Base g={geo} color={KHAKI} />
          <rect x={150 - 32} y={f.top - 8} width={64} height={24} rx={6} fill={shadeHex(KHAKI, 0.12)} />
          <rect x={150 - 8} y={f.top} width={16} height={f.h * 0.38} rx={3} fill={shadeHex(KHAKI, 0.1)} />
          <Buttons x={150} y0={f.top + 18} y1={f.top + f.h * 0.34} n={3} color="#4a4a2a" r={4.5} />
          {[-1, 1].map((s) => <Pocket key={s} cx={150 + s * f.iw * 0.3} y={f.top + f.h * 0.14} w={f.iw * 0.26} color={KHAKI} button="#4a4a2a" />)}
          <Belt g={geo} y={belt} color="#5a3a22" buckle={GOLD} starOn />
        </g>
      );
    }
    case "officer-uniform": { // офицерский китель: лацканы, рубашка с галстуком, планки и медали, золотые пуговицы, ремень
      const f = frame(geo), vy = f.top + f.h * 0.34, belt = f.top + f.h * 0.68;
      const rib = ["#b3261e", "#e0b030", "#3d6fb3", "#5b8c5a", "#c8553d", "#f2f2f2"];
      const bx0 = 150 - f.iw * 0.44, by0 = vy - 6;
      return (
        <g>
          <Base g={geo} color={OLIVE} />
          <Vneck top={f.top} vy={vy} color="#b9b08a" />
          <TieShape y0={f.top + 8} y1={vy - 4} color="#3a3a2a" />
          <Lapels top={f.top} vy={vy} color={shadeHex(OLIVE, 0.1)} edge={RED} />
          <Buttons x={150} y0={vy + 14} y1={belt - 12} n={Math.max(2, Math.round((belt - vy) / 30))} />
          <g>{rib.map((col, i) => <rect key={i} x={bx0 + (i % 3) * 12} y={by0 + Math.floor(i / 3) * 8} width={11} height={7} fill={col} />)}</g>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${bx0 + 8 + i * 20} ${by0 + 22})`}>
              <path d="M-5 0 H5 L3 10 H-3 Z" fill={i ? "#3d6fb3" : "#b3261e"} /><circle cx={0} cy={16} r={7} fill={GOLD} />
            </g>
          ))}
          <g transform={`translate(${150 + f.iw * 0.32} ${vy + 8})`}><Star cx={0} cy={0} r={11} fill={RED} /><circle r={4} fill={GOLD} /></g>
          <Belt g={geo} y={belt} color="#4a2e1a" buckle={GOLD} starOn />
        </g>
      );
    }
    case "chef-whites": { // белый двубортный китель повара: стойка, два ряда пуговиц, красный шейный платок
      const f = frame(geo), dx = Math.max(14, f.iw * 0.14);
      return (
        <g>
          <Base g={geo} color={WHITE} />
          <rect x={150 - 34} y={f.top - 8} width={68} height={26} rx={8} fill="#e6e3d8" />
          <path d={`M${150 + dx + 14} ${f.top + 18} V${f.bottom + 10}`} stroke="#d8d4c6" strokeWidth={4} />
          <path d={`M${150 - 34} ${f.top + 18} Q${150 + dx} ${f.top + 22} ${150 + dx + 14} ${f.top + 18}`} stroke="#d8d4c6" strokeWidth={4} fill="none" />
          {[-1, 1].map((s) => <Buttons key={s} x={150 + s * dx} y0={f.top + 36} y1={f.bottom - 22} n={Math.max(3, Math.round(f.h / 45))} color="#b3ad98" r={5} />)}
          <path d="M132 236 L168 236 L156 262 L150 268 L144 262 Z" fill="#c8302e" />
          <circle cx={150} cy={246} r={8} fill={shadeHex("#c8302e", 0.15)} />
        </g>
      );
    }
    case "construction": { // оранжевый светоотражающий жилет поверх рабочей рубашки (рубашка — look.clothes)
      return <HiVis g={geo} color="#f2771a" />;
    }
    case "suit": { // пиджак цвета look.clothes с лацканами, белая рубашка, платочек, пуговицы (галстук — tie / bow-tie)
      const f = frame(geo), col = clothes ?? "#2f2f3a", vy = f.top + f.h * 0.5;
      return (
        <g>
          <Base g={geo} color={col} />
          <Vneck top={f.top} vy={vy} color={SHIRT} />
          <Lapels top={f.top} vy={vy} color={shadeHex(col, isDark(col) ? -0.12 : 0.15)} />
          <Buttons x={150} y0={vy + 16} y1={vy + 44} n={2} color={shadeHex(col, isDark(col) ? -0.3 : 0.4)} r={5} />
          <rect x={150 - f.iw * 0.4} y={f.top + f.h * 0.36} width={f.iw * 0.22} height={5} rx={2} fill={shadeHex(col, 0.25)} />
          <path d={`M${150 - f.iw * 0.36} ${f.top + f.h * 0.36} l6 -12 l6 9 l6 -10 l4 13 z`} fill={SHIRT} />
          {[-1, 1].map((s) => <rect key={s} x={150 + s * f.iw * 0.3 - f.iw * 0.13} y={f.bottom - f.h * 0.22} width={f.iw * 0.26} height={6} rx={3} fill={shadeHex(col, 0.25)} />)}
        </g>
      );
    }
    case "stewardess-uniform": { // приталенный тёмно-синий жакет с золотыми пуговицами, шейный платок, юбка темнее
      const f = frame(geo), vy = f.top + f.h * 0.26, waist = f.top + f.h * 0.56;
      return (
        <g>
          <Base g={geo} color={shadeHex(STEW, 0.18)} />
          <path d={`M${geo.bx - 40} ${f.top - 12} H${geo.bx + geo.w + 40} V${waist} Q150 ${waist + 22} ${geo.bx - 40} ${waist} Z`} fill={STEW} />
          <Vneck top={f.top} vy={vy} color={SHIRT} half={22} />
          <Lapels top={f.top} vy={vy} color={shadeHex(STEW, -0.12)} half={22} />
          <Buttons x={150} y0={vy + 16} y1={waist - 4} n={2} />
          <g transform={`translate(${150 - f.iw * 0.3} ${vy + 18})`} fill={GOLD}><path d="M-16 -1 Q-8 -7 0 -3 Q8 -7 16 -1 Q8 2 0 2 Q-8 2 -16 -1 Z" /><circle r={4} cy={-1} /></g>
          <path d="M128 238 L172 238 L150 262 Z" fill="#d23b33" />
          <path d="M150 246 L176 262 L166 274 Z M150 246 L180 250 L176 264 Z" fill="#e8564d" />
          <circle cx={150} cy={246} r={7} fill="#a82a24" />
          {[[138, 243], [158, 243], [148, 254]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={2.5} fill="#f6f2e8" />)}
        </g>
      );
    }
    case "doctor-coat": { // белый халат нараспашку поверх одежды: лацканы, нагрудный карман с ручками, нижние карманы
      const f = frame(geo), gap = Math.max(14, f.iw * 0.16), vy = f.top + f.h * 0.4;
      const panel = (s: number) => `M${150 - s * 200} ${f.top - 12} H${150 - s * 24} L${150 - s * gap} ${vy} V${f.bottom + 30} H${150 - s * 200} Z`;
      const lapel = (s: number) => `M${150 - s * 24} ${f.top - 12} L${150 - s * gap} ${vy} L${150 - s * (gap + 16)} ${f.top + (vy - f.top) * 0.45} L${150 - s * 46} ${f.top + 6} Z`;
      const px = 150 - f.iw * 0.34;
      return (
        <g>
          {[1, -1].map((s) => <path key={s} d={panel(s)} fill={COAT} />)}
          {[1, -1].map((s) => <path key={`l${s}`} d={lapel(s)} fill="#e6e6df" />)}
          <path d={`M${150 - gap} ${vy} V${f.bottom + 30} M${150 + gap} ${vy} V${f.bottom + 30}`} stroke="#dedcd2" strokeWidth={3} />
          <rect x={px - 3} y={f.top + f.h * 0.38 - 18} width={4} height={22} rx={2} fill="#3d6fb3" />
          <rect x={px + 4} y={f.top + f.h * 0.38 - 14} width={4} height={18} rx={2} fill="#c8302e" />
          <rect x={px - f.iw * 0.12} y={f.top + f.h * 0.38} width={f.iw * 0.24} height={f.iw * 0.2} rx={3} fill="#ecebe4" />
          {[-1, 1].map((s) => <rect key={s} x={150 + s * f.iw * 0.32 - f.iw * 0.13} y={f.bottom - f.h * 0.28} width={f.iw * 0.26} height={f.iw * 0.2} rx={3} fill="#ecebe4" />)}
          <Buttons x={150 + gap + 9} y0={vy + 20} y1={f.bottom - 30} n={2} color="#d6d4ca" r={4.5} />
        </g>
      );
    }
    case "prisoner": { // полосатая роба с номером на груди (рукава в полоску рисует риг)
      const f = frame(geo);
      const ys: number[] = [];
      for (let y = f.top + 8; y < f.bottom + 20; y += 26) ys.push(y);
      return (
        <g>
          <Base g={geo} color={PRISON} />
          <g fill="#2b2b2b">{ys.map((y) => <rect key={y} x={geo.bx - 40} y={y} width={geo.w + 80} height={12} />)}</g>
          <rect x={150 + f.iw * 0.04} y={f.top + f.h * 0.22} width={Math.min(64, f.iw * 0.44)} height={26} rx={3} fill="#f6f2e8" />
          <text x={150 + f.iw * 0.04 + Math.min(64, f.iw * 0.44) / 2} y={f.top + f.h * 0.22 + 19} fontSize={17} fontWeight={900} fontFamily="Arial, sans-serif" textAnchor="middle" fill="#2b1d14">0451</text>
        </g>
      );
    }
    case "sailor": { // флотская форменка: тельняшка в вырезе, синий воротник-гюйс с белыми полосами
      const f = frame(geo), vy = f.top + f.h * 0.4, half = 26;
      const ts: number[] = [];
      for (let y = f.top - 4; y < vy; y += 11) ts.push(y);
      const hw = (y: number) => (half * (vy - y)) / (vy - (f.top - 8));
      const band = (s: number) => `M${150 - s * half} ${f.top - 8} L150 ${vy} L${150 - s * 30} ${vy - 2} L${150 - s * 58} ${f.top - 8} Z`;
      return (
        <g>
          <Base g={geo} color={NAVY} />
          <Vneck top={f.top} vy={vy} color="#f6f2e8" half={half} />
          <g fill="#2a4a8a">{ts.map((y) => <rect key={y} x={150 - hw(y + 3)} y={y} width={2 * hw(y + 3)} height={5} />)}</g>
          {[1, -1].map((s) => <path key={s} d={band(s)} fill="#3f6db3" />)}
          {[1, -1].map((s) => [12, 19].map((o) => <path key={`${s}${o}`} d={`M${150 - s * (half + o)} ${f.top - 8} L${150 - s * (o * 0.55)} ${vy - 2 - o * 0.1}`} stroke="#f6f2e8" strokeWidth={2.5} />))}
          <path d={`M${150 - 9} ${vy - 4} L${150 + 9} ${vy - 4} L${150 + 5} ${vy + 10} L${150 - 5} ${vy + 10} Z`} fill="#151515" />
        </g>
      );
    }
    // шапки к форме
    case "pilot-cap": // тёмно-синяя фуражка лётчика: золотой шнур, кокарда с крылышками
      return <PeakedCap crown={PILOT} band="#151515" cord={GOLD} badge={<g fill={GOLD}><path d="M120 86 Q134 78 150 84 Q166 78 180 86 Q166 92 150 90 Q134 92 120 86 Z" /><circle cx={150} cy={86} r={7} /><circle cx={150} cy={109} r={5} /></g>} />;
    case "police-cap": // фуражка милиции: серо-синяя тулья, красный околыш, кокарда
      return <PeakedCap crown={POLICE} band={RED} badge={<g><ellipse cx={150} cy={109} rx={11} ry={9} fill={GOLD} /><circle cx={150} cy={109} r={4.5} fill={RED} /><Star cx={150} cy={82} r={9} fill={GOLD} /></g>} />;
    case "officer-cap": // офицерская фуражка хаки: красный околыш, золотой шнур, звезда
      return <PeakedCap crown={OLIVE} band={RED} cord={GOLD} badge={<g><circle cx={150} cy={86} r={11} fill={GOLD} /><Star cx={150} cy={86} r={8} fill={RED} /><circle cx={150} cy={109} r={5} fill={GOLD} /></g>} />;
    case "bath-hat": // войлочная банная шапка-колпак с отогнутыми полями
      return (<><path d="M88 112 Q84 70 112 52 Q140 30 150 22 Q160 30 188 52 Q216 70 212 112 Z" fill="#e3d6bb" /><path d="M150 22 Q146 14 152 8 Q158 14 150 22 Z" fill="#d2c3a3" /><path d="M118 60 Q150 46 182 60" stroke="#d2c3a3" strokeWidth={4} fill="none" /><path d="M66 112 Q150 92 234 112 Q238 128 222 130 Q150 116 78 130 Q62 128 66 112 Z" fill="#d6c7a8" /><path d="M76 120 Q150 104 224 120" stroke="#c8553d" strokeWidth={4} strokeDasharray="8 7" fill="none" /></>);
    case "hard-hat": // жёлтая строительная каска
      return (<><path d="M76 116 Q76 46 150 44 Q224 46 224 116 Z" fill="#f2c230" /><path d="M140 46 Q150 44 160 46 L162 112 H138 Z" fill="#f7d966" /><path d="M64 112 H232 Q246 114 248 124 H64 Q58 118 64 112 Z" fill="#e0ab18" /></>);
    case "stewardess-hat": // маленькая шляпка-таблетка набок
      return (<g transform="rotate(-10 168 80)"><rect x={122} y={56} width={92} height={36} rx={12} fill={STEW} /><rect x={122} y={82} width={92} height={8} rx={4} fill={GOLD} /><path d="M160 70 Q166 64 172 70 Q166 74 160 70 Z" fill={GOLD} /></g>);
    case "sailor-cap": // бескозырка: белый верх, чёрный околыш, ленточки сзади
      return (<><path d="M84 102 Q150 92 216 102 L216 118 Q150 112 84 118 Z" fill="#151515" /><ellipse cx={150} cy={90} rx={84} ry={18} fill="#f6f2e8" /><path d="M96 108 H204" stroke={GOLD} strokeWidth={3} /><path d="M88 108 L50 150 L58 158 L92 116 Z M90 114 L60 170 L68 176 L96 118 Z" fill="#151515" /></>);
    case "prisoner-cap": // полосатая шапочка
      return (<><path d="M96 104 Q96 70 150 68 Q204 70 204 104 Z" fill={PRISON} /><g fill="#2b2b2b"><rect x={100} y={78} width={100} height={8} /><rect x={96} y={94} width={108} height={8} /></g></>);
    default: return null;
  }
}
export const FRONT = new Set(["pilot-uniform", "police-uniform", "traffic-vest", "military-uniform", "officer-uniform", "chef-whites", "construction", "suit", "stewardess-uniform", "doctor-coat", "prisoner", "sailor", "spots", "sash", "onesie-snaps", "cross", "tie", "bow-tie", "gold-chain", "stethoscope", "apron", "towel", "brooch", "badge", "striped-shirt", "loot-bag", "camera", "collar", "keys", "scythe", "baguette", "suspenders"]);
export const ROBES = new Set(["robe-white", "robe-red", "robe-black"]);
export const BACK = new Set(["hood", "nun-veil", "headscarf"]);
/** Поверх тела без обрезки по контуру (до рук). */
export const OVER = new Set(["fur-coat", "towel-wrap"]);
/** И на теле, и на голове. */
export const BOTH = new Set(["spots"]);
/** Предметы в руке (рисуются после рук). */
export const HAND = new Set(["loot-bag", "camera", "keys", "scythe", "baguette"]);
/** Обрабатываются ригом, не как обычный аксессуар головы. */
export const RIG = new Set(["hook-hand", "ghost-sheet"]);

