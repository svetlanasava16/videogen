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

/** Стереотипные детали: крест, борода, кепка, корона… Неизвестные id игнорируются. */
export function Accessory({ id, hair, skin = "#f0d0b0", geo = DEFAULT_GEO, part = "head" }: { id: string; hair: string; skin?: string; geo?: BodyGeo; part?: "head" | "body" }) {
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
    case "lipstick": return <ellipse cx="150" cy="208" rx="24" ry="7" fill="#c0263e" opacity="0.6" />;
    case "earrings": return (<><circle cx="78" cy="180" r="7" fill="#e0a030" /><circle cx="222" cy="180" r="7" fill="#e0a030" /></>);
    // голова
    case "flat-cap": return <path d="M78 118 Q150 70 222 118 L236 128 Q150 112 78 122 Z" fill="#5b4636" />;
    case "police-cap": return (<><rect x="84" y="78" width="132" height="34" rx="8" fill="#2b3a55" /><path d="M78 112 L222 112 L240 124 L84 124 Z" fill="#111" /><circle cx="150" cy="94" r="8" fill="#c8a227" /></>);
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
    case "tie": return <path d="M144 232 L156 232 L162 300 L150 316 L138 300 Z" fill="#b3261e" />;
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
    default: return null;
  }
}
export const FRONT = new Set(["spots", "sash", "onesie-snaps", "cross", "tie", "bow-tie", "gold-chain", "stethoscope", "apron", "towel", "brooch", "badge", "striped-shirt", "loot-bag", "camera", "collar", "keys", "scythe", "baguette", "suspenders"]);
export const ROBES = new Set(["robe-white", "robe-red", "robe-black"]);
export const BACK = new Set(["hood", "nun-veil", "headscarf"]);
/** Поверх тела без обрезки по контуру (до рук). */
export const OVER = new Set(["fur-coat"]);
/** И на теле, и на голове. */
export const BOTH = new Set(["spots"]);
/** Предметы в руке (рисуются после рук). */
export const HAND = new Set(["loot-bag", "camera", "keys", "scythe", "baguette"]);
/** Обрабатываются ригом, не как обычный аксессуар головы. */
export const RIG = new Set(["hook-hand", "ghost-sheet"]);

