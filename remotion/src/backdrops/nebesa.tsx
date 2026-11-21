import { Canvas, Cloud, W, H, type BackdropProps } from "./parts";
import { Glow } from "./bolnitsa";

/**
 * Фон «nebesa»: врата рая на облаках (Апостол Пётр с книгой), варианты hell (пещера с огнём и котлом),
 * garden-of-eden (сад с яблоней и змеем), space (космос и лунная поверхность),
 * crossroads (развилка в облаках: дорога вверх к вратам рая и вниз в огненный провал, указатель, весы и пюпитр судьи).
 * Метки — простые доли ширины (средний план, стопы y≈1275): у пюпитра слева, у врат по центру, на облаке справа.
 */

/** Осветлить (k>0) или затемнить (k<0) цвет #rrggbb. */
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  const t = k < 0 ? 0 : 255;
  const p = Math.abs(k);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (t - v) * p));
  return `#${((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1)}`;
};

/** Детерминированный «шум». */
const rnd = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Вертикальный градиент на весь кадр (небо). stops: [offset, color][]. */
const Sky = ({ id, stops, y0 = 0, y1 = H }: { id: string; stops: [number, string][]; y0?: number; y1?: number }) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        {stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
      </linearGradient>
    </defs>
    <rect x={0} y={y0} width={W} height={y1 - y0} fill={`url(#${id})`} />
  </>
);

/** Искорка-звёздочка с четырьмя лучами. */
const Sparkle = ({ x, y, r = 14, color = "#fff6d0", o = 0.9 }: { x: number; y: number; r?: number; color?: string; o?: number }) => (
  <path d={`M${x} ${y - r} Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y} Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r} Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y} Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r} Z`} fill={color} opacity={o} />
);

/** Облачный пол с бугристым краем. */
const CloudFloor = ({ top, color, shadow }: { top: number; color: string; shadow: string }) => (
  <g>
    <g fill={shadow}>
      {Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={i * 120 + 20} cy={top + 10 + (i % 2) * 14} r={70} />)}
    </g>
    <g fill={color}>
      {Array.from({ length: 10 }).map((_, i) => <circle key={i} cx={i * 120 + 50} cy={top + 30 + (i % 2) * 18} r={66} />)}
      <rect x={0} y={top + 40} width={W} height={H - top - 40} />
    </g>
  </g>
);

/** Ряд пушистых облаков-«барашков» (полоса). */
const CloudBank = ({ y, color, r = 90, step = 140, seed = 0, o = 1 }: { y: number; color: string; r?: number; step?: number; seed?: number; o?: number }) => (
  <g fill={color} opacity={o}>
    {Array.from({ length: Math.ceil(W / step) + 2 }).map((_, i) => (
      <circle key={i} cx={i * step - step / 2 + rnd(i + seed) * 40} cy={y - rnd(i * 3 + seed) * r * 0.5} r={r * (0.75 + rnd(i * 7 + seed) * 0.4)} />
    ))}
    <rect x={0} y={y} width={W} height={r} />
  </g>
);

const Rays = ({ cx, cy, color, n = 12, opacity = 0.1 }: { cx: number; cy: number; color: string; n?: number; opacity?: number }) => (
  <g fill={color} opacity={opacity}>
    {Array.from({ length: n }).map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      const b = a + Math.PI / n / 1.4;
      const R = 1400;
      return <path key={i} d={`M${cx} ${cy} L${cx + Math.cos(a) * R} ${cy + Math.sin(a) * R} L${cx + Math.cos(b) * R} ${cy + Math.sin(b) * R} Z`} />;
    })}
  </g>
);

/** Завиток (для ковки ворот). */
const Curl = ({ x, y, r, flip = 1, color, w = 6 }: { x: number; y: number; r: number; flip?: number; color: string; w?: number }) => (
  <path d={`M${x} ${y} q${flip * r} ${-r * 0.2} ${flip * r} ${-r} q0 ${-r * 0.6} ${-flip * r * 0.5} ${-r * 0.6} q${-flip * r * 0.35} 0 ${-flip * r * 0.3} ${r * 0.35}`} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Пушистое облако с плоским низом: (x, y) — левый нижний угол, w×h; снизу голубая тень. */
const Puff = ({ x, y, w, h, seed = 0, color = "#ffffff", shadow = "#dfe8f5", o = 1 }: { x: number; y: number; w: number; h: number; seed?: number; color?: string; shadow?: string; o?: number }) => {
  const n = Math.max(3, Math.round(w / (h * 0.75)));
  const cs = Array.from({ length: n }).map((_, i) => {
    const t = i / (n - 1);
    const r = h * (0.32 + 0.34 * Math.sin(Math.PI * (0.12 + 0.76 * t)) + rnd(i + seed) * 0.14);
    return { cx: x + w * (0.1 + 0.8 * t) + (rnd(i * 3 + seed) - 0.5) * h * 0.2, cy: y - r * 0.8, r };
  });
  return (
    <g opacity={o}>
      <g fill={shadow}>
        {cs.map((c, i) => <circle key={i} cx={c.cx} cy={c.cy + h * 0.1} r={c.r} />)}
        <rect x={x} y={y - h * 0.4} width={w} height={h * 0.4} rx={h * 0.2} />
      </g>
      <g fill={color}>
        {cs.map((c, i) => <circle key={i} cx={c.cx} cy={c.cy} r={c.r * 0.96} />)}
        <rect x={x + h * 0.08} y={y - h * 0.48} width={w - h * 0.16} height={h * 0.36} rx={h * 0.18} />
      </g>
    </g>
  );
};

type Bld = { x: number; base: number; w: number; h: number; body: string; side: string; roof: string; win?: string };

/** Башня облачного города: корпус с тенью, арочные окна, карниз, крыша (купол, шпиль или луковка) со шпильком. */
const Tower = ({ x, base, w, h, body, side, roof, win, kind = "dome" }: Bld & { kind?: "dome" | "spire" | "onion" }) => {
  const top = base - h;
  const l = x - w / 2;
  const rw = w / 2 + 5;
  const tip = kind === "spire" ? top - 8 - w * 1.7 : kind === "onion" ? top - 8 - w * 1.15 : top - 8 - rw * 0.95;
  const rows = Math.max(1, Math.floor((h - 60) / 70));
  const cols = w > 70 ? 2 : 1;
  const ww = Math.min(16, w * 0.24);
  return (
    <g>
      <rect x={l} y={top} width={w} height={h} fill={body} />
      <rect x={x + w * 0.22} y={top} width={w * 0.28} height={h} fill={side} />
      {win &&
        Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const wx = cols === 1 ? x : x + (c ? w * 0.2 : -w * 0.2);
            const wy = top + 30 + r * 70;
            return <path key={`${r}-${c}`} d={`M${wx - ww / 2} ${wy + 28} V${wy + ww / 2} A${ww / 2} ${ww / 2} 0 0 1 ${wx + ww / 2} ${wy + ww / 2} V${wy + 28} Z`} fill={win} />;
          }),
        )}
      <rect x={l - 6} y={top - 8} width={w + 12} height={12} rx={4} fill={roof} />
      {kind === "dome" && <path d={`M${x - rw} ${top - 8} A${rw} ${rw * 0.95} 0 0 1 ${x + rw} ${top - 8} Z`} fill={roof} />}
      {kind === "spire" && <path d={`M${l - 4} ${top - 8} L${x} ${tip} L${l + w + 4} ${top - 8} Z`} fill={roof} />}
      {kind === "onion" && (
        <path d={`M${l} ${top - 8} C${l - w * 0.3} ${top - w * 0.5} ${x - w * 0.12} ${top - w * 0.8} ${x} ${tip} C${x + w * 0.12} ${top - w * 0.8} ${l + w + w * 0.3} ${top - w * 0.5} ${l + w} ${top - 8} Z`} fill={roof} />
      )}
      <rect x={x - 1.5} y={tip - 22} width={3} height={24} fill={roof} />
      <circle cx={x} cy={tip - 24} r={4.5} fill={roof} />
    </g>
  );
};

/** Ротонда: барабан с колоннадой, купол с фонариком. */
const Rotunda = ({ x, base, w, h, body, side, roof, win }: Bld) => {
  const top = base - h;
  const l = x - w / 2;
  const dw = w * 0.36;
  return (
    <g>
      <rect x={l} y={top} width={w} height={h} fill={body} />
      <rect x={x + w * 0.2} y={top} width={w * 0.3} height={h} fill={side} />
      {Array.from({ length: 6 }).map((_, k) => (
        <rect key={k} x={l + 10 + (k * (w - 26)) / 5} y={top + 16} width={6} height={h - 26} rx={3} fill={win ?? side} opacity={0.9} />
      ))}
      <rect x={l - 8} y={top - 10} width={w + 16} height={14} rx={5} fill={roof} />
      <rect x={x - dw} y={top - 44} width={dw * 2} height={36} fill={body} />
      <rect x={x + dw * 0.4} y={top - 44} width={dw * 0.6} height={36} fill={side} />
      <path d={`M${x - dw - 6} ${top - 42} A${dw + 6} ${(dw + 6) * 0.85} 0 0 1 ${x + dw + 6} ${top - 42} Z`} fill={roof} />
      <path d={`M${x - dw * 0.5} ${top - 42 - dw * 0.7} A${dw} ${dw} 0 0 1 ${x - dw * 0.1} ${top - 42 - (dw + 6) * 0.84}`} stroke="#ffffff" strokeWidth={4} fill="none" opacity={0.45} />
      <rect x={x - 6} y={top - 42 - (dw + 6) * 0.85 - 18} width={12} height={20} rx={3} fill={roof} />
      <circle cx={x} cy={top - 42 - (dw + 6) * 0.85 - 22} r={5} fill={roof} />
    </g>
  );
};

/** Крошечный ангел вдали — абстрактный силуэт: крылья, капля-тело, нимб. */
const TinyAngel = ({ x, y, s = 1, gold }: { x: number; y: number; s?: number; gold: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.9}>
    <path d="M-3 -4 C-10 -16 -26 -18 -30 -6 C-20 -9 -12 -3 -4 2 Z" fill="#ffffff" />
    <path d="M3 -4 C10 -16 26 -18 30 -6 C20 -9 12 -3 4 2 Z" fill="#ffffff" />
    <path d="M-4 -3 Q0 -8 4 -3 L7 14 H-7 Z" fill="#ffffff" />
    <circle cx={0} cy={-8} r={4} fill="#ffffff" />
    <ellipse cx={0} cy={-15} rx={5.5} ry={2} fill="none" stroke={gold} strokeWidth={1.8} />
  </g>
);

/** Летящий голубь. */
const Dove = ({ x, y, s = 1, flip = 1 }: { x: number; y: number; s?: number; flip?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`} fill="#ffffff">
    <path d="M-22 2 Q-4 -6 14 0 Q24 -2 28 -8 Q30 0 20 6 Q4 12 -14 8 L-28 12 Z" />
    <path d="M-4 0 Q-10 -30 -30 -36 Q-14 -20 -16 2 Z" />
    <path d="M2 0 Q10 -26 26 -32 Q14 -16 10 2 Z" opacity={0.85} />
    <circle cx={22} cy={-4} r={1.6} fill="#5a6070" />
  </g>
);

/** Лавровый венок: листья по кругу с разрывом сверху. */
const Wreath = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <g>
    {Array.from({ length: 16 }).map((_, i) => {
      const a = -90 + 18 + (i * 324) / 15;
      const rad = (a * Math.PI) / 180;
      const px = x + Math.cos(rad) * r;
      const py = y + Math.sin(rad) * r;
      return <ellipse key={i} cx={px} cy={py} rx={r * 0.3} ry={r * 0.12} fill={i % 2 ? "#7aa860" : "#5c8c48"} transform={`rotate(${a + 90 + (i % 2 ? 28 : -28)} ${px} ${py})`} />;
    })}
    <path d={`M${x - 8} ${y + r + 2} l-10 16 l8 -2 l2 8 Z M${x + 8} ${y + r + 2} l10 16 l-8 -2 l-2 8 Z`} fill="#c8553d" />
  </g>
);

/**
 * Жемчужные врата (в координатах большого вида: центр x=540, основание y≈1084, ширина 158…922, верх ≈395).
 * Две жемчужные колонны с золотыми капителями, арка с жемчугом и замковым камнем, веерная решётка в тимпане,
 * створки приоткрыты внутрь — в щель льётся свет, за решёткой виден сияющий дворец.
 */
const PearlyGate = ({ gold }: { gold: string }) => {
  const goldL = shade(gold, 0.45);
  const goldD = shade(gold, -0.25);
  const pearl = "#f6efe3";
  const pearlD = "#e2d5bf";
  const cx = 540;
  const sy = 590; // линия пят арки
  const tr = 604; // верх фрамуги
  const inner = { rx: 250, ry: 100 };
  const outer = { rx: 370, ry: 160 };
  const opening = `M290 1080 V${sy} A${inner.rx} ${inner.ry} 0 0 1 790 ${sy} V1080 Z`;
  const leaves = [
    { hx: 290, fx: 442 },
    { hx: 790, fx: 638 },
  ];
  const lit = { body: "#fffaf0", side: "#f7ecd6", roof: "#f3dc94", win: "#fff3c8" };
  return (
    <g>
      <defs>
        <linearGradient id="gate-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff0c0" />
          <stop offset="0.55" stopColor="#fffaea" />
          <stop offset="1" stopColor="#fffdf6" />
        </linearGradient>
        <clipPath id="gate-open">
          <path d={opening} />
        </clipPath>
        <clipPath id="gate-tymp">
          <path d={`M290 ${tr} V${sy} A${inner.rx} ${inner.ry} 0 0 1 790 ${sy} V${tr} Z`} />
        </clipPath>
      </defs>
      {/* свет и сияющий дворец за вратами */}
      <path d={opening} fill="url(#gate-light)" />
      <g clipPath="url(#gate-open)">
        <g opacity={0.6}>
          <Tower x={400} base={1000} w={46} h={260} kind="spire" {...lit} />
          <Tower x={680} base={1000} w={46} h={260} kind="spire" {...lit} />
          <Rotunda x={540} base={1010} w={220} h={170} {...lit} />
          <Puff x={250} y={1060} w={580} h={120} seed={31} shadow="#fbf0d6" />
        </g>
        <Rays cx={540} cy={840} color="#ffffff" n={18} opacity={0.4} />
        <Glow cx={540} cy={900} rx={280} ry={340} color="#ffffff" opacity={0.8} />
      </g>
      {/* веерная решётка тимпана */}
      <g clipPath="url(#gate-tymp)" stroke={gold} strokeWidth={6} strokeLinecap="round">
        {Array.from({ length: 13 }).map((_, i) => {
          const a = Math.PI * (1 + (i + 0.5) / 13);
          return <line key={i} x1={cx} y1={tr} x2={cx + Math.cos(a) * 420} y2={tr + Math.sin(a) * 420} />;
        })}
        <path d={`M${cx - 160} ${tr} A160 72 0 0 1 ${cx + 160} ${tr}`} fill="none" />
      </g>
      <path d={`M${cx - 50} ${tr} A50 46 0 0 1 ${cx + 50} ${tr} Z`} fill={gold} />
      <path d={`M${cx - 30} ${tr} A30 28 0 0 1 ${cx + 30} ${tr} Z`} fill={goldL} />
      <rect x={290} y={tr} width={500} height={16} fill={gold} />
      <rect x={290} y={tr + 3} width={500} height={4} fill={goldL} opacity={0.8} />
      {/* створки, приоткрытые внутрь */}
      {leaves.map(({ hx, fx }, k) => {
        const P = (u: number, v: number): [number, number] => [lerp(hx, fx, u), lerp(lerp(648, 668, u), lerp(1080, 1064, u), v)];
        const poly = [P(0, 0), P(1, 0), P(1, 1), P(0, 1)];
        const n = 7;
        const sx = (fx - hx) / 250;
        const [mx, my] = P(0.5, 0.18);
        const [lx, ly] = P(0.5, 0.5);
        const [kx, ky] = P(0.88, 0.47);
        return (
          <g key={k}>
            <path d={`M${poly.map((p) => p.join(" ")).join(" L")} Z`} fill="#b8901c" opacity={0.08} />
            {Array.from({ length: n + 1 }).map((_, i) => {
              const u = i / n;
              const [x1, y1] = P(u, 0);
              const [x2, y2] = P(u, 1);
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={gold} strokeWidth={lerp(9, 6, u)} />
                  <path d={`M${x1} ${y1 - 30} L${x1 + 7} ${y1 - 15} L${x1 + 3} ${y1 - 13} V${y1} H${x1 - 3} V${y1 - 13} L${x1 - 7} ${y1 - 15} Z`} fill={gold} />
                </g>
              );
            })}
            {[0.36, 0.64].map((f) => {
              const [x1, y1] = P(0, f);
              const [x2, y2] = P(1, f);
              return (
                <g key={f}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={gold} strokeWidth={9} />
                  <line x1={x1} y1={y1 - 2} x2={x2} y2={y2 - 2} stroke={goldL} strokeWidth={2.5} />
                </g>
              );
            })}
            {/* медальон с жемчужиной */}
            <ellipse cx={mx} cy={my} rx={44 * sx} ry={44} fill="none" stroke={gold} strokeWidth={7} />
            <ellipse cx={mx} cy={my} rx={30 * sx} ry={30} fill="none" stroke={goldL} strokeWidth={3} />
            <ellipse cx={mx} cy={my} rx={14 * sx} ry={14} fill={pearl} />
            <ellipse cx={mx - 4 * sx} cy={my - 4} rx={5 * sx} ry={5} fill="#ffffff" />
            {/* лира из завитков */}
            <g transform={`translate(${lx} ${ly + 44}) scale(${sx} 1)`}>
              <Curl x={-6} y={0} r={46} flip={-1} color={gold} w={6} />
              <Curl x={6} y={0} r={46} flip={1} color={gold} w={6} />
              <circle cx={0} cy={6} r={7} fill={gold} />
            </g>
            {/* нижняя панель: ромбовая решётка */}
            {(() => {
              const a = P(0, 0.66);
              const b = P(1, 0.66);
              const c = P(1, 0.98);
              const d = P(0, 0.98);
              const m1 = P(0.5, 0.66);
              const m2 = P(1, 0.82);
              const m3 = P(0.5, 0.98);
              const m4 = P(0, 0.82);
              const ctr = P(0.5, 0.82);
              return (
                <g stroke={gold} strokeWidth={5} fill="none" strokeLinecap="round">
                  <path d={`M${a.join(" ")} L${c.join(" ")} M${b.join(" ")} L${d.join(" ")}`} />
                  <path d={`M${m1.join(" ")} L${m2.join(" ")} L${m3.join(" ")} L${m4.join(" ")} Z`} />
                  <circle cx={ctr[0]} cy={ctr[1]} r={9} fill={goldL} stroke={gold} />
                </g>
              );
            })()}
            <path d={`M${poly.map((p) => p.join(" ")).join(" L")} Z`} fill="none" stroke={gold} strokeWidth={12} strokeLinejoin="round" />
            <path d={`M${poly[0].join(" ")} L${poly[1].join(" ")}`} stroke={goldL} strokeWidth={3} />
            {/* кольцо-ручка у свободного края */}
            <circle cx={kx} cy={ky} r={13} fill="none" stroke={goldD} strokeWidth={5} />
            <circle cx={kx} cy={ky - 13} r={5} fill={gold} />
          </g>
        );
      })}
      {/* щель между створками светится */}
      <Glow cx={540} cy={860} rx={90} ry={260} color="#ffffff" opacity={0.7} />
      {/* арка: жемчужная лента в золотых бортах, жемчуг, розетки, замковый камень, гребень из завитков */}
      <path d={`M170 ${sy} A${outer.rx} ${outer.ry} 0 0 1 910 ${sy} L790 ${sy} A${inner.rx} ${inner.ry} 0 0 0 290 ${sy} Z`} fill={pearl} />
      <path d={`M226 ${sy} A314 128 0 0 1 854 ${sy}`} stroke={pearlD} strokeWidth={34} fill="none" opacity={0.5} />
      <path d={`M170 ${sy} A${outer.rx} ${outer.ry} 0 0 1 910 ${sy}`} stroke={gold} strokeWidth={12} fill="none" />
      <path d={`M182 ${sy} A358 150 0 0 1 898 ${sy}`} stroke={goldL} strokeWidth={3} fill="none" />
      <path d={`M290 ${sy} A${inner.rx} ${inner.ry} 0 0 1 790 ${sy}`} stroke={gold} strokeWidth={10} fill="none" />
      {Array.from({ length: 15 }).map((_, i) => {
        const a = Math.PI + ((i + 0.5) / 15) * Math.PI;
        const px = cx + Math.cos(a) * 312;
        const py = sy + Math.sin(a) * 130;
        if (Math.abs(px - cx) < 40) return null;
        return i % 3 === 1 ? (
          <g key={i}>
            <circle cx={px} cy={py} r={13} fill={gold} />
            <circle cx={px} cy={py} r={6} fill={goldL} />
          </g>
        ) : (
          <g key={i}>
            <circle cx={px + 2} cy={py + 2} r={10} fill={pearlD} />
            <circle cx={px} cy={py} r={10} fill="#ffffff" />
            <circle cx={px - 3} cy={py - 3} r={3.5} fill="#ffffff" opacity={0.9} />
          </g>
        );
      })}
      {[-1, 1].map((d) => (
        <g key={d}>
          {/* завитки-филигрань на плечах арки */}
          <Curl x={cx + d * 250} y={472} r={26} flip={d} color={gold} w={5} />
          <Curl x={cx + d * 160} y={452} r={22} flip={-d} color={gold} w={5} />
          <Curl x={cx + d * 38} y={446} r={22} flip={d} color={gold} w={6} />
          {/* лавровые веточки у замкового камня */}
          {[0, 1, 2, 3].map((j) => (
            <ellipse key={j} cx={cx + d * (44 + j * 18)} cy={470 + j * 5} rx={12} ry={5} fill={j % 2 ? "#7aa860" : "#5c8c48"} transform={`rotate(${d * (20 + j * 6)} ${cx + d * (44 + j * 18)} ${470 + j * 5})`} />
          ))}
        </g>
      ))}
      <path d={`M${cx - 34} 424 H${cx + 34} L${cx + 24} 506 H${cx - 24} Z`} fill={gold} />
      <path d={`M${cx - 26} 430 H${cx + 26} L${cx + 19} 498 H${cx - 19} Z`} fill={goldD} opacity={0.35} />
      <circle cx={cx} cy={462} r={17} fill={pearl} />
      <circle cx={cx - 5} cy={457} r={6} fill="#ffffff" />
      <circle cx={cx} cy={430} r={11} fill={gold} />
      <Sparkle x={cx} y={430} r={20} o={0.9} />
      {/* колонны */}
      {[170, 790].map((px) => (
        <g key={px}>
          <rect x={px + 8} y={sy} width={104} height={430} fill={pearl} />
          <rect x={px + 92} y={sy} width={20} height={430} fill={pearlD} opacity={0.85} />
          <rect x={px + 12} y={sy} width={8} height={430} fill="#ffffff" opacity={0.7} />
          {[26, 40, 80, 94].map((fx) => (
            <rect key={fx} x={px + fx} y={sy + 30} width={3} height={380} rx={1.5} fill={pearlD} />
          ))}
          <rect x={px + 52} y={sy + 34} width={16} height={390} rx={8} fill={gold} opacity={0.9} />
          {Array.from({ length: 9 }).map((_, i) => {
            const y = sy + 56 + i * 42;
            if (y > 740 && y < 830) return null;
            return (
              <g key={i}>
                <circle cx={px + 60} cy={y} r={10} fill="#ffffff" />
                <circle cx={px + 57} cy={y - 3} r={3.5} fill="#fdf8ee" />
              </g>
            );
          })}
          <circle cx={px + 60} cy={784} r={30} fill={pearl} />
          <circle cx={px + 60} cy={784} r={16} fill={gold} />
          <circle cx={px + 55} cy={779} r={5} fill={goldL} />
          <Wreath x={px + 60} y={784} r={40} />
          {/* капитель с волютами */}
          <rect x={px + 4} y={sy + 2} width={112} height={12} fill={goldD} />
          <rect x={px - 14} y={sy - 28} width={148} height={32} rx={9} fill={gold} />
          <rect x={px - 14} y={sy - 28} width={148} height={8} rx={4} fill={goldL} />
          {[px - 8, px + 128].map((vx) => (
            <g key={vx}>
              <circle cx={vx} cy={sy - 8} r={17} fill={gold} />
              <circle cx={vx} cy={sy - 8} r={9} fill={goldL} />
              <circle cx={vx} cy={sy - 8} r={4} fill={goldD} />
            </g>
          ))}
          {/* база */}
          <rect x={px - 2} y={1004} width={124} height={28} rx={6} fill={pearlD} />
          <rect x={px - 12} y={1028} width={144} height={56} rx={8} fill={gold} />
          <rect x={px - 12} y={1028} width={144} height={10} rx={5} fill={goldL} />
          <rect x={px + 8} y={1046} width={104} height={24} rx={6} fill={goldD} opacity={0.35} />
          {/* жемчужный шар на плече арки */}
          <rect x={px + 46} y={480} width={28} height={36} rx={6} fill={gold} />
          <rect x={px + 40} y={474} width={40} height={10} rx={5} fill={goldD} />
          <circle cx={px + 60} cy={452} r={24} fill={pearl} />
          <circle cx={px + 52} cy={444} r={8} fill="#ffffff" />
          <path d={`M${px + 60} 416 Q${px + 66} 426 ${px + 60} 432 Q${px + 54} 426 ${px + 60} 416 Z`} fill={gold} />
        </g>
      ))}
      {/* жемчужный порог */}
      <rect x={130} y={1076} width={820} height={26} rx={8} fill={pearl} />
      <rect x={130} y={1076} width={820} height={6} rx={3} fill={gold} />
      <rect x={130} y={1096} width={820} height={6} rx={3} fill={pearlD} />
    </g>
  );
};

/** Пюпитр-ресепшен: колонна, наклонная доска с большой раскрытой книгой, закладки, чернильница с пером, звонок. */
const Lectern = ({ x, gold, bell = true }: { x: number; gold: string; bell?: boolean }) => {
  const goldD = shade(gold, -0.25);
  const goldL = shade(gold, 0.45);
  return (
    <g transform={`translate(${x} 0)`}>
      <ellipse cx={0} cy={1190} rx={100} ry={12} fill="#c9d6e6" opacity={0.75} />
      <rect x={-62} y={1164} width={124} height={24} rx={10} fill={goldD} />
      <rect x={-46} y={1146} width={92} height={22} rx={8} fill={gold} />
      <rect x={-46} y={1146} width={92} height={6} rx={3} fill={goldL} />
      <rect x={-18} y={1004} width={36} height={146} fill="#f6efe3" />
      <rect x={6} y={1004} width={12} height={146} fill="#e2d5bf" />
      {[1018, 1080, 1132].map((y) => <rect key={y} x={-23} y={y} width={46} height={10} rx={5} fill={gold} />)}
      {/* боковые полочки */}
      <ellipse cx={128} cy={1000} rx={26} ry={7} fill={goldD} />
      {bell && <ellipse cx={-128} cy={1000} rx={26} ry={7} fill={goldD} />}
      {/* наклонная доска */}
      <path d="M-112 1008 H112 L102 888 H-102 Z" fill={goldD} />
      <path d="M-104 1000 H104 L96 896 H-96 Z" fill={gold} opacity={0.5} />
      {/* книга: подложка страниц, страницы, строки */}
      <path d="M-104 1000 Q-52 984 0 998 Q52 984 104 1000 L98 900 Q52 888 0 902 Q-52 888 -98 900 Z" fill="#d9caa9" />
      <path d="M-98 994 Q-50 980 -2 994 V902 Q-50 888 -94 898 Z" fill="#fffaf0" />
      <path d="M98 994 Q50 980 2 994 V902 Q50 888 94 898 Z" fill="#f4ebd8" />
      <path d="M0 902 V996" stroke="#cbbd9c" strokeWidth={4} />
      {Array.from({ length: 7 }).map((_, i) => {
        const y = 918 + i * 10;
        return (
          <g key={i} stroke="#b4a88f" strokeWidth={3} strokeLinecap="round" fill="none">
            <path d={`M-84 ${y + 2} Q-50 ${y - 6} ${i === 3 ? -40 : -14} ${y + 1}`} />
            <path d={`M14 ${y + 1} Q50 ${y - 6} ${i === 5 ? 50 : 84} ${y + 2}`} />
          </g>
        );
      })}
      <rect x={-110} y={998} width={220} height={14} rx={6} fill={gold} />
      <rect x={-110} y={998} width={220} height={4} rx={2} fill={goldL} />
      {/* закладки */}
      <path d="M-6 996 V1052 l4 -7 l4 7 V996 Z" fill="#c8553d" />
      <path d="M6 996 V1040 l4 -7 l4 7 V996 Z" fill="#4a6fa5" />
      {/* чернильница и перо */}
      <rect x={116} y={976} width={26} height={22} rx={6} fill="#2b2a3a" />
      <ellipse cx={129} cy={976} rx={10} ry={4} fill="#4a4a5c" />
      <path d="M128 978 Q144 926 178 870 Q172 916 136 978 Z" fill="#ffffff" />
      <path d="M131 976 Q148 928 174 878" stroke="#d7dce6" strokeWidth={2} fill="none" />
      {/* звонок ресепшена */}
      {bell && (
        <g>
          <rect x={-150} y={992} width={44} height={8} rx={3} fill={goldD} />
          <path d={`M-146 993 A18 16 0 0 1 -110 993 Z`} fill={gold} />
          <path d="M-140 986 A12 10 0 0 1 -128 978" stroke={goldL} strokeWidth={3} fill="none" />
          <rect x={-130} y={970} width={4} height={8} fill={goldD} />
          <circle cx={-128} cy={969} r={4.5} fill={gold} />
        </g>
      )}
    </g>
  );
};

/** Арфа, прислонённая к колонне (основание в (x, y), наклон rot). */
const Harp = ({ x, y, gold, rot = -14 }: { x: number; y: number; gold: string; rot?: number }) => {
  const goldL = shade(gold, 0.45);
  const goldD = shade(gold, -0.25);
  return (
    <g>
      <ellipse cx={x + 40} cy={y + 2} rx={70} ry={9} fill="#c9d6e6" opacity={0.7} />
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <g stroke="#fff3cf" strokeWidth={2.5}>
          {[22, 34, 46, 58, 70, 82].map((sx) => (
            <line key={sx} x1={sx} y1={-222 + sx * 0.2} x2={sx} y2={-((sx - 8) / 92) * 196} />
          ))}
        </g>
        <path d="M8 0 L100 -196" stroke={gold} strokeWidth={24} strokeLinecap="round" />
        <path d="M14 -6 L98 -186" stroke={goldL} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
        <path d="M4 -218 C34 -258 66 -196 100 -206" stroke={gold} strokeWidth={14} fill="none" strokeLinecap="round" />
        <rect x={-4} y={-226} width={16} height={226} rx={7} fill={gold} />
        <rect x={0} y={-220} width={4} height={210} fill={goldL} opacity={0.8} />
        <circle cx={4} cy={-232} r={11} fill={goldL} />
        <rect x={-14} y={-12} width={48} height={14} rx={6} fill={goldD} />
      </g>
    </g>
  );
};

const Heaven = ({ palette }: BackdropProps) => {
  const gold = palette.accent;
  const goldL = shade(gold, 0.45);
  const goldD = shade(gold, -0.25);
  const far = { body: "#dde5f4", side: "#cfd9ee", roof: "#e8dcb4", win: "#f4eedc" };
  const near = { body: "#f6f0e4", side: "#e7dccb", roof: gold, win: "#ffe6a0" };
  return (
    <>
      <Sky id="heaven-sky2" stops={[[0, "#8fb9ea"], [0.2, "#b4d1f1"], [0.33, palette.wall], [0.46, "#fff1d6"], [0.6, "#fff8ec"], [1, "#ffffff"]]} />
      <Rays cx={540} cy={720} color="#fff3c4" n={16} opacity={0.3} />
      <Glow cx={540} cy={740} rx={720} ry={660} color="#fff3c4" opacity={0.75} />
      {/* облака высоко (над плашкой рассказчика) и по бокам */}
      <Puff x={-60} y={128} w={330} h={92} seed={1} o={0.85} />
      <Puff x={700} y={112} w={420} h={104} seed={4} o={0.85} />
      <Puff x={-90} y={640} w={320} h={120} seed={7} o={0.95} />
      <Puff x={850} y={610} w={320} h={110} seed={9} o={0.95} />
      {/* дальний облачный город */}
      {(
        [
          [30, 44, 420, "spire"],
          [96, 70, 330, "dome"],
          [150, 40, 480, "spire"],
          [930, 40, 480, "spire"],
          [985, 70, 330, "dome"],
          [1050, 44, 420, "spire"],
        ] as const
      ).map(([x, w, h, k]) => (
        <Tower key={x} x={x} base={1010} w={w} h={h} kind={k} {...far} />
      ))}
      <TinyAngel x={66} y={520} s={0.8} gold={gold} />
      <TinyAngel x={118} y={566} s={0.6} gold={gold} />
      <TinyAngel x={1010} y={540} s={0.75} gold={gold} />
      <Puff x={-80} y={1040} w={300} h={120} seed={13} shadow="#e2e9f5" />
      <Puff x={860} y={1040} w={300} h={120} seed={15} shadow="#e2e9f5" />
      {/* ближний ряд: ротонды и башни-луковки с золотыми куполами */}
      <Tower x={150} base={1100} w={54} h={310} kind="onion" {...near} />
      <Rotunda x={62} base={1100} w={130} h={200} {...near} />
      <Tower x={930} base={1100} w={54} h={310} kind="onion" {...near} />
      <Rotunda x={1018} base={1100} w={130} h={200} {...near} />
      <Puff x={-70} y={1120} w={340} h={130} seed={17} />
      <Puff x={810} y={1120} w={340} h={130} seed={19} />
      {/* врата */}
      <PearlyGate gold={gold} />
      {/* золотые ступени к вратам */}
      {[0, 1, 2, 3].map((i) => {
        const y0 = 1100 + i * 22.5;
        const x0 = 330 - i * 32;
        const x1 = 750 + i * 32;
        return (
          <g key={i}>
            <rect x={x0} y={y0} width={x1 - x0} height={22.5} fill="#efcf72" />
            <rect x={x0} y={y0} width={x1 - x0} height={8} fill="#fff0c2" />
            <rect x={x0} y={y0 + 19} width={x1 - x0} height={3.5} fill={goldD} opacity={0.45} />
          </g>
        );
      })}
      {/* облачный пол */}
      <rect x={0} y={1186} width={W} height={H - 1186} fill="#ffffff" />
      <defs>
        <linearGradient id="heaven-path" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6d77a" stopOpacity={0.55} />
          <stop offset="0.35" stopColor="#f8e3a0" stopOpacity={0.3} />
          <stop offset="1" stopColor="#fbecc0" stopOpacity={0.12} />
        </linearGradient>
        <linearGradient id="heaven-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4c8" stopOpacity={0.9} />
          <stop offset="1" stopColor="#fff8e0" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M234 1190 H846 L1000 ${H} H80 Z`} fill="url(#heaven-path)" />
      <path d={`M234 1190 L80 ${H} M846 1190 L1000 ${H}`} stroke={goldL} strokeWidth={4} opacity={0.5} />
      {[1236, 1300, 1700, 1850].map((y) => {
        const t = (y - 1190) / (H - 1190);
        return <rect key={y} x={lerp(234, 80, t)} y={y} width={lerp(612, 920, t)} height={3 + t * 4} fill={gold} opacity={0.16} />;
      })}
      {/* свет из щели врат льётся на ступени и облака */}
      <path d={`M446 1066 H634 L900 ${H} H180 Z`} fill="url(#heaven-beam)" opacity={0.55} />
      {/* облачные клубы у линии ног и по краям пола */}
      <Puff x={-60} y={1230} w={390} h={140} seed={21} />
      <Puff x={760} y={1230} w={400} h={150} seed={23} />
      <Puff x={-120} y={1330} w={300} h={80} seed={25} shadow="#ecf1f8" />
      <Puff x={900} y={1310} w={300} h={70} seed={27} shadow="#ecf1f8" />
      <Puff x={-140} y={1960} w={420} h={200} seed={29} shadow="#e8eef7" />
      <Puff x={800} y={1960} w={440} h={220} seed={33} shadow="#e8eef7" />
      {/* арфа у правой колонны и пюпитр слева */}
      <Harp x={936} y={1186} gold={gold} />
      <Lectern x={150} gold={gold} />
      {/* голуби и искорки */}
      <Dove x={92} y={770} s={0.9} />
      <Dove x={150} y={812} s={0.65} />
      <Dove x={990} y={760} s={0.85} flip={-1} />
      <Dove x={600} y={1000} s={0.55} flip={-1} />
      {[[90, 930], [1000, 900], [330, 480], [750, 480], [40, 1080], [1050, 1060], [450, 1150], [640, 1160], [250, 690], [840, 700]].map(([x, y], i) => (
        <Sparkle key={i} x={x} y={y} r={8 + (i % 3) * 5} o={0.9} />
      ))}
    </>
  );
};

const Flame = ({ x, y, s = 1, o = 1 }: { x: number; y: number; s?: number; o?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M-60 0 C-80 -60 -30 -90 -20 -160 C10 -110 0 -80 20 -120 C40 -80 80 -60 60 0 Z" fill="#e0702a" />
    <path d="M-34 0 C-44 -40 -14 -60 -8 -100 C10 -70 10 -50 20 -70 C34 -46 46 -30 34 0 Z" fill="#f2b030" />
    <path d="M-14 0 C-18 -20 -4 -30 0 -48 C8 -30 14 -20 12 0 Z" fill="#fde29a" />
  </g>
);

/** Цепь из звеньев (свисает сверху). */
const Chain = ({ x, y0, y1 }: { x: number; y0: number; y1: number }) => (
  <g>
    {Array.from({ length: Math.floor((y1 - y0) / 26) }).map((_, i) => (
      <rect key={i} x={x - (i % 2 ? 3 : 9)} y={y0 + i * 26} width={i % 2 ? 6 : 18} height={32} rx={9} fill="none" stroke="#2a1614" strokeWidth={6} />
    ))}
    <path d={`M${x} ${y1} q0 30 -20 30 q-14 0 -14 -14`} stroke="#3a2a28" strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
);

const Hell = () => {
  const rock = "#3a1410";
  return (
    <>
      <Sky id="hell-sky" stops={[[0, "#2a0c0a"], [0.45, "#5a1f1a"], [0.6, "#7a2a1c"], [1, "#2a0e0a"]]} />
      <Glow cx={540} cy={980} rx={620} ry={420} color="#e0602a" opacity={0.45} />
      <ellipse cx={540} cy={900} rx={560} ry={460} fill="#7a2a20" opacity={0.7} />
      <ellipse cx={540} cy={1000} rx={380} ry={260} fill="#93372a" opacity={0.6} />
      {/* дальние скалы и лавопады */}
      <path d="M150 1110 L220 820 L290 900 L340 760 L420 1110 Z" fill="#4a1812" />
      <path d="M640 1110 L700 800 L760 880 L830 740 L930 1110 Z" fill="#4a1812" />
      {[[330, 770, 120], [818, 750, 140]].map(([x, y, h], i) => (
        <g key={i}>
          <Glow cx={x} cy={y + h} rx={80} ry={h} color="#ff8a2a" opacity={0.5} />
          <path d={`M${x - 14} ${y} Q${x - 30} ${y + h} ${x - 34} ${y + h + 300} H${x + 30} Q${x + 24} ${y + h} ${x + 12} ${y} Z`} fill="#e0702a" />
          <path d={`M${x - 6} ${y + 6} Q${x - 16} ${y + h} ${x - 16} ${y + h + 290} H${x + 12} Q${x + 10} ${y + h} ${x + 5} ${y + 6} Z`} fill="#f2b030" />
          <path d={`M${x - 2} ${y + 20} Q${x - 6} ${y + h} ${x - 4} ${y + h + 280} H${x + 3} Q${x + 3} ${y + h} ${x + 1} ${y + 20} Z`} fill="#fde29a" />
        </g>
      ))}
      {/* лавовое озеро вдали */}
      <ellipse cx={540} cy={1112} rx={420} ry={30} fill="#f2902a" />
      <ellipse cx={540} cy={1106} rx={330} ry={16} fill="#fde29a" opacity={0.8} />
      <Glow cx={540} cy={1100} rx={480} ry={120} color="#ffb04a" opacity={0.5} />
      {/* своды и сталактиты */}
      <path d="M0 0 H1080 V120 Q960 110 900 140 L870 230 L840 140 Q700 120 620 130 L590 190 L560 130 Q420 120 300 140 L270 220 L240 140 Q120 110 0 130 Z" fill={rock} />
      <path d="M0 0 H130 Q110 300 150 520 Q90 760 140 1000 Q80 1100 0 1150 Z" fill={rock} />
      <path d="M1080 0 H950 Q980 260 930 480 Q990 720 945 960 Q1000 1080 1080 1120 Z" fill={rock} />
      {/* трещины в стенах с отсветом */}
      <path d="M40 300 l30 60 l-10 50 l40 70 M1040 380 l-30 50 l14 60 l-36 60" stroke="#f2902a" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
      <Chain x={60} y0={0} y1={130} />
      <Chain x={1010} y0={0} y1={110} />
      {/* огонь у стен */}
      <Glow cx={200} cy={1080} rx={260} ry={200} color="#ff8a2a" opacity={0.45} />
      <Flame x={250} y={1110} s={0.7} o={0.8} />
      <Flame x={190} y={1120} s={1.3} />
      <Flame x={300} y={1110} s={0.9} />
      <Flame x={110} y={1130} s={1.0} />
      <Flame x={980} y={1120} s={0.8} />
      <Flame x={1050} y={1125} s={1.1} />
      {/* пол */}
      <path d="M0 1130 Q300 1100 540 1120 T1080 1110 V1920 H0 Z" fill="#4a1a14" />
      <path d="M0 1130 Q300 1100 540 1120 T1080 1110 V1146 Q800 1136 540 1150 T0 1160 Z" fill="#00000030" />
      {/* каменные плиты пола и светящиеся трещины */}
      <g fill="#3a140f" opacity={0.6}>
        {[[90, 1420, 120], [880, 1460, 140], [300, 1640, 160], [760, 1720, 150], [520, 1300, 90]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.22} />
        ))}
      </g>
      {[
        "M160 1230 l80 14 l50 -10 l60 20",
        "M740 1250 l50 -12 l70 16",
        "M40 1540 l90 20 l40 -14 l70 26",
        "M640 1580 l60 -16 l80 22 l60 -10",
        "M420 1820 l70 -20 l60 16",
      ].map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#ff8a2a" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.25} />
          <path d={d} stroke="#f2b030" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} />
        </g>
      ))}
      <rect x={0} y={1130} width={W} height={H - 1130} fill="#000000" opacity={0.12} />
      {/* котёл */}
      <g>
        <Glow cx={890} cy={1180} rx={220} ry={90} color="#ff8a2a" opacity={0.6} />
        <Flame x={850} y={1190} s={0.8} />
        <Flame x={930} y={1190} s={0.7} />
        <rect x={780} y={1110} width={16} height={80} fill="#1e1a1a" transform="rotate(12 788 1150)" />
        <rect x={990} y={1110} width={16} height={80} fill="#1e1a1a" transform="rotate(-12 998 1150)" />
        <path d="M760 980 H1040 Q1050 1130 900 1140 Q750 1130 760 980 Z" fill="#2a2424" />
        <path d="M780 1000 Q790 1100 860 1124" stroke="#ffffff" strokeWidth={8} fill="none" opacity={0.08} />
        <rect x={740} y={960} width={320} height={36} rx={18} fill="#3a3232" />
        <ellipse cx={900} cy={966} rx={140} ry={14} fill="#e0702a" />
        <ellipse cx={880} cy={964} rx={70} ry={6} fill="#f2b030" />
        <circle cx={860} cy={940} r={14} fill="#f2b030" />
        <circle cx={930} cy={926} r={10} fill="#f2b030" />
        <circle cx={900} cy={900} r={7} fill="#f2b030" opacity={0.8} />
        <path d="M850 880 q-20 -40 10 -80 q30 -40 0 -80" stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.08} strokeLinecap="round" />
        <path d="M940 890 q20 -30 -6 -70" stroke="#ffffff" strokeWidth={8} fill="none" opacity={0.07} strokeLinecap="round" />
        <rect x={800} y={1040} width={40} height={12} rx={6} fill="#ffffff" opacity={0.12} />
      </g>
      {/* вилы у стены */}
      <g transform="rotate(-10 150 1190)">
        <rect x={144} y={700} width={12} height={490} fill="#b08a5a" />
        <path d="M110 700 V640 h10 v50 h20 v-60 h20 v60 h20 v-50 h10 v60 Z" fill="#9aa3ad" />
      </g>
      {/* искры в воздухе */}
      {Array.from({ length: 34 }).map((_, i) => {
        const x = rnd(i + 3) * W;
        const y = 500 + rnd(i + 77) * 700;
        if (y > 150 && y < 430) return null;
        return <circle key={i} cx={x} cy={y} r={2 + rnd(i + 5) * 4} fill={i % 3 ? "#f2b030" : "#ff7a3a"} opacity={0.5 + rnd(i) * 0.5} />;
      })}
    </>
  );
};

/** Круглое дерево вдали (силуэт). */
const FarTree = ({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-6} y={-40} width={12} height={40} fill="#7a6a4a" opacity={0.8} />
    <circle cx={0} cy={-70} r={46} fill={c} />
    <circle cx={-26} cy={-54} r={30} fill={c} />
    <circle cx={26} cy={-56} r={32} fill={c} />
  </g>
);

/** Пальма: изогнутый ствол с кольцами, веер листьев, кокосы. (x, y) — основание. */
const Palm = ({ x, y, s = 1, flip = 1 }: { x: number; y: number; s?: number; flip?: number }) => {
  const top = { x: 46, y: -330 };
  const fronds: [number, number][] = [[-110, -300], [-70, -400], [20, -440], [120, -400], [170, -300], [-40, -250], [110, -250]];
  return (
    <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
      <path d="M-12 0 C-6 -120 10 -240 40 -334 L56 -330 C28 -240 14 -120 14 0 Z" fill="#8a6a44" />
      {Array.from({ length: 11 }).map((_, i) => {
        const t = i / 11;
        const cx = lerp(1, 48, t * t);
        const cy = -t * 320;
        return <path key={i} d={`M${cx - 12} ${cy} q12 6 24 0`} stroke="#6a4e30" strokeWidth={3} fill="none" />;
      })}
      {fronds.map(([ex, ey], i) => {
        const mx = (top.x + ex) / 2;
        const my = (top.y + ey) / 2 - 30;
        const dx = ex - top.x;
        const dy = ey - top.y;
        const len = Math.hypot(dx, dy) || 1;
        const px = (-dy / len) * 26;
        const py = (dx / len) * 26;
        return (
          <g key={i}>
            <path d={`M${top.x} ${top.y} Q${mx + px} ${my + py} ${ex} ${ey} Q${mx - px * 0.3} ${my - py * 0.3} ${top.x} ${top.y + 8} Z`} fill={i % 2 ? "#4f8a4a" : "#5d9a52"} />
            <path d={`M${top.x} ${top.y} Q${mx} ${my} ${ex} ${ey}`} stroke="#3f7a40" strokeWidth={3} fill="none" />
          </g>
        );
      })}
      {[[36, -320], [54, -316], [46, -306]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={12} fill="#7a5a30" />)}
    </g>
  );
};

/** Кипарис вдали. */
const Cypress = ({ x, y, h, c = "#5f9a55" }: { x: number; y: number; h: number; c?: string }) => (
  <g>
    <rect x={x - 3} y={y - 14} width={6} height={14} fill="#7a6a4a" />
    <path d={`M${x} ${y - h} C${x + h * 0.2} ${y - h * 0.7} ${x + h * 0.18} ${y - h * 0.2} ${x} ${y - 10} C${x - h * 0.18} ${y - h * 0.2} ${x - h * 0.2} ${y - h * 0.7} ${x} ${y - h} Z`} fill={c} />
  </g>
);

/** Павлин с раскрытым хвостом. (x, y) — стопы. */
const Peacock = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={70} ry={8} fill="#000000" opacity={0.12} />
    {Array.from({ length: 13 }).map((_, i) => {
      const a = Math.PI * (1.08 + (i / 12) * 0.84);
      const ex = Math.cos(a) * 118;
      const ey = -60 + Math.sin(a) * 104;
      return <path key={`f${i}`} d={`M0 -54 L${ex - 14} ${ey} Q${ex} ${ey - 14} ${ex + 14} ${ey} Z`} fill={i % 2 ? "#3f8f6a" : "#4fa070"} />;
    })}
    {Array.from({ length: 13 }).map((_, i) => {
      const a = Math.PI * (1.08 + (i / 12) * 0.84);
      const ex = Math.cos(a) * 104;
      const ey = -60 + Math.sin(a) * 92;
      return (
        <g key={`e${i}`}>
          <ellipse cx={ex} cy={ey} rx={11} ry={13} fill="#e8c45a" />
          <ellipse cx={ex} cy={ey} rx={7} ry={9} fill="#2a8a8a" />
          <ellipse cx={ex} cy={ey + 1} rx={3.5} ry={4.5} fill="#24407a" />
        </g>
      );
    })}
    <path d="M-10 -6 L-14 0 M8 -6 L12 0" stroke="#b08a5a" strokeWidth={4} strokeLinecap="round" />
    <ellipse cx={0} cy={-34} rx={22} ry={30} fill="#2a5fa8" />
    <path d="M-6 -58 Q-10 -90 4 -104 Q16 -96 8 -88 Q4 -76 8 -56 Z" fill="#2a5fa8" />
    <circle cx={6} cy={-100} r={10} fill="#2f6cb8" />
    <path d="M14 -100 l12 3 l-12 3 Z" fill="#e0a030" />
    <circle cx={9} cy={-102} r={2.2} fill="#ffffff" />
    {[-6, 0, 6].map((d) => (
      <g key={d}>
        <line x1={4 + d * 0.5} y1={-108} x2={4 + d} y2={-124} stroke="#2a5fa8" strokeWidth={2} />
        <circle cx={4 + d} cy={-126} r={3} fill="#3f8f6a" />
      </g>
    ))}
    <path d="M-16 -40 Q0 -54 16 -40" stroke="#5a8fd0" strokeWidth={4} fill="none" opacity={0.7} />
  </g>
);

/** Лев и ягнёнок лежат рядом (мелко, вдали). */
const LionLamb = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={80} ry={7} fill="#000000" opacity={0.1} />
    {/* лев */}
    <ellipse cx={-20} cy={-14} rx={36} ry={16} fill="#d8a650" />
    <path d="M-56 -10 q-14 -4 -16 -16" stroke="#d8a650" strokeWidth={5} fill="none" strokeLinecap="round" />
    <circle cx={-74} cy={-28} r={5} fill="#a8682a" />
    <circle cx={14} cy={-26} r={22} fill="#b9722e" />
    <circle cx={18} cy={-24} r={13} fill="#e2b25c" />
    <circle cx={22} cy={-27} r={1.8} fill="#2b1d14" />
    <ellipse cx={27} cy={-20} rx={3} ry={2} fill="#7a4a2a" />
    {/* ягнёнок */}
    <g fill="#fbf8f2">
      <circle cx={50} cy={-12} r={12} />
      <circle cx={62} cy={-16} r={13} />
      <circle cx={74} cy={-12} r={11} />
      <rect x={46} y={-14} width={34} height={12} rx={6} />
    </g>
    <ellipse cx={84} cy={-20} rx={8} ry={10} fill="#4a3a34" />
    <ellipse cx={80} cy={-28} rx={6} ry={3} fill="#4a3a34" transform="rotate(-30 80 -28)" />
    <circle cx={86} cy={-22} r={1.5} fill="#ffffff" />
  </g>
);

const Eden = ({ palette }: BackdropProps) => {
  const leaf = "#4f8a4a";
  return (
    <>
      <Sky id="eden-sky2" stops={[[0, "#94c8ee"], [0.3, "#c4e2f6"], [0.44, palette.wall], [0.55, "#f6f4dc"], [1, "#f4f6e0"]]} y1={1100} />
      <Rays cx={540} cy={640} color="#fff8d8" n={14} opacity={0.22} />
      <Glow cx={540} cy={660} rx={600} color="#fff6d0" opacity={0.85} />
      {/* радуга */}
      {["#f2a0a0", "#f2c08a", "#f2e08a", "#b8e0a0", "#a0c8f0", "#c0a8e8"].map((c, i) => (
        <path key={c} d={`M${70 + i * 18} 920 A${470 - i * 18} ${470 - i * 18} 0 0 1 ${1010 - i * 18} 920`} stroke={c} strokeWidth={18} fill="none" opacity={0.3} />
      ))}
      <Puff x={-50} y={124} w={320} h={86} seed={71} o={0.85} />
      <Puff x={720} y={110} w={380} h={96} seed={73} o={0.85} />
      <Puff x={20} y={560} w={230} h={80} seed={75} o={0.9} />
      <Puff x={600} y={520} w={200} h={70} seed={77} o={0.8} />
      {/* птицы клином */}
      <g stroke="#4a5a6a" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.65}>
        {[[250, 610, 1], [290, 630, 0.8], [215, 636, 0.8], [330, 652, 0.7], [180, 660, 0.7]].map(([x, y, k], i) => (
          <path key={i} d={`M${x} ${y} q${12 * k} ${-12 * k} ${24 * k} 0 q${12 * k} ${-12 * k} ${24 * k} 0`} />
        ))}
      </g>
      {/* дальние горы со снегом */}
      <path d="M0 800 L90 700 L170 760 L300 610 L420 740 L520 650 L640 760 L760 630 L880 740 L980 660 L1080 720 V900 H0 Z" fill="#c9d4ea" />
      <path d="M300 610 L336 652 L318 650 L300 664 L282 650 L268 648 Z M760 630 L796 670 L776 668 L760 682 L746 668 L726 670 Z M520 650 L546 680 L520 690 L498 678 Z M980 660 L1004 688 L980 696 L960 686 Z" fill="#ffffff" opacity={0.9} />
      {/* ближние горы со скалой и водопадом */}
      <path d="M0 860 L120 760 L230 820 L340 720 L420 760 L470 740 L560 830 L700 770 L840 850 L960 780 L1080 840 V940 H0 Z" fill="#b2c6d4" />
      <path d="M340 720 L420 760 L470 740 L480 960 H360 Z" fill="#a6b8c6" />
      <g>
        <path d="M392 756 h52 v214 h-52 z" fill="#d6eef8" />
        {[398, 410, 422, 434].map((x, i) => <rect key={x} x={x} y={762 + i * 6} width={4} height={196 - i * 10} rx={2} fill="#ffffff" opacity={0.85} />)}
        <path d="M392 756 q26 -10 52 0" stroke="#ffffff" strokeWidth={5} fill="none" />
      </g>
      {/* холмы с рощами */}
      <path d="M0 900 Q260 800 540 880 T1080 850 V1010 H0 Z" fill="#a7d48a" />
      {[[100, 898, 0.5], [170, 884, 0.42], [640, 886, 0.46], [700, 876, 0.38], [980, 862, 0.5], [1040, 870, 0.4]].map(([x, y, s], i) => (
        <FarTree key={i} x={x} y={y} s={s} c={i % 2 ? "#86bb70" : "#7cb266"} />
      ))}
      {[[240, 882, 70], [262, 886, 54], [560, 890, 64], [590, 892, 50], [860, 872, 74]].map(([x, y, h], i) => <Cypress key={i} x={x} y={y} h={h} />)}
      {/* олень на холме */}
      <g fill="#a07a50" transform="translate(660 912) scale(0.85)">
        <ellipse cx={0} cy={0} rx={34} ry={16} />
        <rect x={-26} y={6} width={6} height={30} />
        <rect x={20} y={6} width={6} height={30} />
        <rect x={-12} y={8} width={6} height={28} />
        <rect x={8} y={8} width={6} height={28} />
        <path d="M24 -6 L38 -34 L48 -30 L34 -2 Z" />
        <ellipse cx={46} cy={-36} rx={12} ry={8} />
        <path d="M40 -42 l-6 -18 M40 -50 l-10 -4 M46 -42 l6 -18 M48 -52 l8 -4" stroke="#a07a50" strokeWidth={3} />
        <circle cx={-6} cy={-4} r={3} fill="#f4e8d4" />
        <circle cx={6} cy={2} r={2.5} fill="#f4e8d4" />
      </g>
      <path d="M0 960 Q300 890 620 950 T1080 930 V1100 H0 Z" fill="#8cc673" />
      {/* ручей из озера */}
      <path d="M260 990 Q200 1010 230 1030 T140 1070 L40 1080 Q120 1056 150 1036 T210 1000 Z" fill="#b8e0f0" />
      <path d="M200 1018 q-10 8 -30 12 M120 1066 q-20 4 -40 6" stroke="#ffffff" strokeWidth={3} fill="none" opacity={0.8} />
      {/* озеро у подножия водопада */}
      <ellipse cx={420} cy={978} rx={250} ry={30} fill="#bfe3f2" />
      <ellipse cx={420} cy={972} rx={200} ry={16} fill="#d4eef8" />
      {[[330, 978, 40], [470, 984, 56], [560, 976, 30]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={3} rx={1.5} fill="#ffffff" opacity={0.85} />)}
      <Puff x={360} y={986} w={130} h={44} seed={79} color="#ffffff" shadow="#e6f3f8" o={0.85} />
      <LionLamb x={560} y={1030} s={0.9} />
      {/* луг */}
      <rect x={0} y={1040} width={W} height={H - 1040} fill="#7fb860" />
      <defs>
        <linearGradient id="eden-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.12} />
          <stop offset="0.3" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#1f4a20" stopOpacity={0.28} />
        </linearGradient>
      </defs>
      <rect x={0} y={1040} width={W} height={H - 1040} fill="url(#eden-grass)" />
      <g stroke="#5f9a48" strokeWidth={4} strokeLinecap="round" opacity={0.6}>
        {Array.from({ length: 80 }).map((_, i) => {
          const x = rnd(i + 1) * W;
          const y = 1080 + rnd(i + 40) * 820;
          if (y > 1370 && y < 1610 && x > 120 && x < 960) return null;
          const s = 0.6 + (y - 1080) / 600;
          return <path key={i} d={`M${x} ${y} l${-6 * s} ${-16 * s} M${x} ${y} l0 ${-20 * s} M${x} ${y} l${6 * s} ${-16 * s}`} />;
        })}
      </g>
      {/* пальма слева за кустами */}
      <Palm x={70} y={1150} s={0.95} />
      {/* яблоня */}
      <g>
        <ellipse cx={910} cy={1192} rx={160} ry={22} fill="#000000" opacity={0.14} />
        <path d="M876 1190 C880 1060 900 960 870 860 H950 C930 960 950 1060 964 1190 Z" fill="#7a5236" />
        <path d="M876 1190 q-30 0 -44 6 h60 Z M964 1190 q30 0 44 6 h-60 Z" fill="#6a4630" />
        <path d="M890 1150 q10 -60 0 -120 M930 1120 q-6 -40 4 -80 M904 1000 q8 -30 0 -60" stroke="#5a3a24" strokeWidth={5} fill="none" opacity={0.6} />
        <path d="M900 920 C840 880 800 870 760 860 L770 840 C810 850 860 860 910 890 Z" fill="#7a5236" />
        <path d="M930 900 C980 870 1020 850 1060 840 L1062 860 C1020 870 980 890 940 920 Z" fill="#7a5236" />
        <g fill={leaf}>
          <circle cx={910} cy={700} r={180} />
          <circle cx={760} cy={780} r={120} />
          <circle cx={1050} cy={790} r={130} />
          <circle cx={1000} cy={600} r={110} />
          <circle cx={820} cy={620} r={100} />
        </g>
        <g fill="#5d9a52">
          <circle cx={870} cy={640} r={90} />
          <circle cx={1010} cy={720} r={70} />
          <circle cx={790} cy={740} r={50} />
          <circle cx={940} cy={790} r={60} />
        </g>
        <g fill="#6aaa5e" opacity={0.75}>
          <circle cx={850} cy={590} r={40} />
          <circle cx={980} cy={560} r={36} />
          <circle cx={780} cy={700} r={26} />
          <circle cx={1030} cy={660} r={28} />
        </g>
        <g fill="#3f7a40" opacity={0.5}>
          <circle cx={900} cy={840} r={50} />
          <circle cx={1010} cy={860} r={40} />
        </g>
        {[[800, 760], [880, 830], [960, 640], [1040, 800], [760, 860], [900, 720], [1000, 880], [850, 600], [1060, 700], [930, 560], [820, 680], [990, 760], [870, 900], [1030, 600]].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={22} fill="#d23c32" />
            <circle cx={x + 6} cy={y + 6} r={14} fill="#b82c26" opacity={0.5} />
            <circle cx={x - 7} cy={y - 7} r={6} fill="#ffffff" opacity={0.5} />
            <rect x={x - 1} y={y - 30} width={3} height={10} fill="#5a3a24" />
            <ellipse cx={x + 8} cy={y - 26} rx={8} ry={4} fill="#6aaa5e" transform={`rotate(-30 ${x + 8} ${y - 26})`} />
          </g>
        ))}
        <circle cx={840} cy={1180} r={14} fill="#d23c32" />
        <circle cx={990} cy={1186} r={12} fill="#c23028" />
        <circle cx={1030} cy={1182} r={11} fill="#d23c32" />
        {/* змей на ветке */}
        <path d="M770 850 C760 900 800 910 790 950 C782 980 750 975 752 950" stroke="#6aa84f" strokeWidth={18} fill="none" strokeLinecap="round" />
        <path d="M770 860 C764 900 796 912 788 946" stroke="#f2d060" strokeWidth={4} fill="none" strokeDasharray="6 10" />
        <ellipse cx={754} cy={944} rx={18} ry={13} fill="#6aa84f" />
        <circle cx={748} cy={940} r={3.5} fill="#2b1d14" />
        <path d="M738 952 l-14 4 l4 -6 l-4 -6 z" fill="#d23c32" />
      </g>
      {/* павлин у яблони */}
      <Peacock x={690} y={1188} s={0.85} />
      {/* пышные кусты слева и лианы */}
      <g>
        <ellipse cx={60} cy={1130} rx={130} ry={110} fill="#4f8a4a" />
        <ellipse cx={190} cy={1150} rx={90} ry={70} fill="#5d9a52" />
        <ellipse cx={120} cy={1100} rx={60} ry={40} fill="#6aaa5e" opacity={0.7} />
        <ellipse cx={260} cy={1170} rx={60} ry={34} fill="#4f8a4a" />
        <path d="M40 1190 Q0 1000 70 920 Q60 1040 100 1190 Z" fill="#3f7a40" />
        <path d="M120 1190 Q170 1030 250 990 Q190 1080 160 1190 Z" fill="#3f7a40" />
        <path d="M-10 1060 Q40 1000 20 940" stroke="#3f7a40" strokeWidth={10} fill="none" strokeLinecap="round" />
        {[[150, 1110, "#f2a0c0"], [80, 1080, "#ffffff"], [210, 1130, "#f2c230"], [40, 1150, "#f2a0c0"], [250, 1160, "#ffffff"], [110, 1150, "#c8a0f0"], [180, 1100, "#ffffff"]].map(([x, y, c], i) => (
          <g key={i}>
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a} cx={(x as number) + Math.cos((a * Math.PI) / 180) * 7} cy={(y as number) + Math.sin((a * Math.PI) / 180) * 7} r={6} fill={c as string} />
            ))}
            <circle cx={x as number} cy={y as number} r={4} fill="#f2c230" />
          </g>
        ))}
      </g>
      {/* кролик в траве */}
      <g transform="translate(340 1180)" fill="#e8e0d4">
        <ellipse cx={0} cy={0} rx={26} ry={18} />
        <circle cx={22} cy={-14} r={13} />
        <ellipse cx={20} cy={-36} rx={5} ry={15} />
        <ellipse cx={30} cy={-34} rx={5} ry={14} transform="rotate(15 30 -34)" />
        <circle cx={-24} cy={-4} r={7} fill="#ffffff" />
        <circle cx={26} cy={-16} r={2.5} fill="#2b1d14" />
      </g>
      {/* цветы */}
      {[[60, 1060, "#f2a0c0"], [200, 1090, "#ffffff"], [140, 1040, "#f2c230"], [300, 1170, "#f2a0c0"], [560, 1180, "#ffffff"], [60, 1310, "#f2c230"], [1000, 1320, "#f2a0c0"], [460, 1150, "#f2c230"], [610, 1160, "#c8a0f0"], [40, 1700, "#f2a0c0"], [1040, 1760, "#ffffff"], [1020, 1250, "#f2c230"], [420, 1120, "#ffffff"], [520, 1130, "#f2a0c0"], [80, 1860, "#c8a0f0"], [960, 1880, "#f2c230"]].map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          <line x1={x as number} y1={y as number} x2={x as number} y2={(y as number) + 20} stroke="#4f8a4a" strokeWidth={4} />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={(x as number) + Math.cos((a * Math.PI) / 180) * 12} cy={(y as number) + Math.sin((a * Math.PI) / 180) * 12} r={10} fill={c as string} />
          ))}
          <circle cx={x as number} cy={y as number} r={7} fill={palette.accent} />
        </g>
      ))}
      {/* бабочки */}
      {[[330, 760, "#f2a030", 0, 1], [200, 980, "#f2a0c0", -10, 0.7], [560, 1040, "#a0c8f0", 12, 0.6], [1010, 1000, "#f2d060", -14, 0.6]].map(([x, y, c, r, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <ellipse cx={-14} cy={0} rx={16} ry={22} fill={c as string} transform="rotate(-20)" />
          <ellipse cx={14} cy={0} rx={16} ry={22} fill={c as string} transform="rotate(20)" />
          <circle cx={-14} cy={-4} r={5} fill="#ffffff" opacity={0.6} />
          <circle cx={14} cy={-4} r={5} fill="#ffffff" opacity={0.6} />
          <rect x={-3} y={-14} width={6} height={30} rx={3} fill="#2b1d14" />
        </g>
      ))}
      {[[480, 700], [140, 860], [620, 980]].map(([x, y], i) => <Sparkle key={i} x={x} y={y} r={10} o={0.8} />)}
    </>
  );
};

const Space = () => {
  const stars = Array.from({ length: 140 }).map((_, i) => ({ x: rnd(i) * W, y: rnd(i + 500) * 1120, r: 1.5 + rnd(i + 900) * 3.5 }));
  return (
    <>
      <Sky id="space-sky" stops={[[0, "#0f1328"], [0.5, "#1d2340"], [1, "#2a2650"]]} y1={1200} />
      {/* туманности и Млечный путь */}
      <Glow cx={260} cy={900} rx={420} ry={260} color="#8a5ac8" opacity={0.35} />
      <Glow cx={860} cy={420} rx={360} ry={240} color="#3a8ac8" opacity={0.3} />
      <Glow cx={640} cy={980} rx={300} ry={160} color="#c85a8a" opacity={0.22} />
      <path d="M-100 1050 Q400 700 1180 300 L1180 460 Q500 820 -100 1180 Z" fill="#ffffff" opacity={0.05} />
      <path d="M-100 1090 Q420 760 1180 360 L1180 410 Q460 800 -100 1130 Z" fill="#ffffff" opacity={0.05} />
      {stars
        .filter((s) => !(s.y > 140 && s.y < 430 && rnd(Math.round(s.x)) < 0.6))
        .map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={i % 7 === 0 ? "#f5d77a" : i % 11 === 0 ? "#a8c8ff" : "#ffffff"} opacity={0.5 + (i % 3) * 0.17} />)}
      {[[90, 520], [980, 860], [430, 760], [700, 1000], [300, 100], [1000, 120]].map(([x, y], i) => (
        <Sparkle key={i} x={x} y={y} r={10 + (i % 2) * 6} color="#ffffff" o={0.9} />
      ))}
      {/* далёкая спиральная галактика */}
      <g transform="translate(470 560) rotate(-25)" opacity={0.8}>
        <ellipse cx={0} cy={0} rx={70} ry={22} fill="#c8b8ff" opacity={0.25} />
        <path d="M0 0 q40 -20 70 0 q-30 -30 -70 -8 q-40 20 -70 0 q30 30 70 8 Z" fill="#e8deff" opacity={0.5} />
        <circle cx={0} cy={0} r={8} fill="#ffffff" />
      </g>
      {/* падающая звезда */}
      <path d="M560 850 L740 780" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.5} />
      <circle cx={740} cy={780} r={6} fill="#ffffff" />
      {/* планета с кольцом */}
      <g transform="translate(820 600)">
        <Glow cx={0} cy={0} rx={200} color="#e0a030" opacity={0.3} />
        <ellipse cx={0} cy={0} rx={190} ry={40} fill="none" stroke="#c8a07a" strokeWidth={14} transform="rotate(-15)" opacity={0.6} />
        <circle cx={0} cy={0} r={115} fill="#e0a030" />
        <path d="M-112 -30 Q0 -10 112 -40 V-20 Q0 10 -114 -6 Z" fill="#c8553d" opacity={0.6} />
        <path d="M-104 40 Q0 60 108 30 V48 Q0 80 -96 60 Z" fill="#c8553d" opacity={0.4} />
        <path d="M-90 -70 Q0 -84 80 -78" stroke="#f2c860" strokeWidth={10} fill="none" opacity={0.5} />
        <path d="M30 -115 A115 115 0 0 1 115 0 A115 115 0 0 1 0 115 A150 150 0 0 0 30 -115 Z" fill="#000000" opacity={0.18} />
        <path d="M-190 0 A190 40 0 0 0 190 0" fill="none" stroke="#e8c49a" strokeWidth={14} transform="rotate(-15)" />
        <circle cx={-160} cy={-110} r={18} fill="#b8b0a8" />
        <circle cx={-164} cy={-114} r={5} fill="#9a928a" />
      </g>
      {/* Земля с облаками и сиянием атмосферы */}
      <g transform="translate(200 640)">
        <Glow cx={0} cy={0} rx={100} color="#7ab8ff" opacity={0.5} />
        <circle cx={0} cy={0} r={56} fill="#4a7fc0" />
        <path d="M-30 -40 Q-10 -30 -16 -6 Q-36 4 -44 -14 Z M10 0 Q36 -10 40 20 Q20 40 6 24 Z" fill="#6aa84f" />
        <path d="M-40 10 q20 -6 40 4 M0 -30 q20 -6 30 6" stroke="#ffffff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
        <path d="M20 -52 A56 56 0 0 1 20 52 A70 70 0 0 0 20 -52 Z" fill="#000000" opacity={0.2} />
      </g>
      {/* спутник */}
      <g transform="translate(620 470) rotate(20)">
        <rect x={-14} y={-10} width={28} height={20} rx={3} fill="#c8c8d0" />
        <rect x={-60} y={-8} width={40} height={16} fill="#3a5a9a" />
        <rect x={20} y={-8} width={40} height={16} fill="#3a5a9a" />
        {[-50, -38, 30, 42].map((x) => <rect key={x} x={x} y={-8} width={2} height={16} fill="#8ab0e0" />)}
        <path d="M0 -10 v-14" stroke="#c8c8d0" strokeWidth={3} />
        <circle cx={0} cy={-26} r={4} fill="#f2c230" />
      </g>
      {/* лунная поверхность */}
      <path d="M0 1080 Q260 1040 520 1080 T1080 1060 V1920 H0 Z" fill="#9a9aa6" />
      <path d="M0 1080 Q260 1040 520 1080 T1080 1060 V1080 Q800 1090 520 1100 T0 1100 Z" fill="#ffffff" opacity={0.12} />
      <path d="M0 1160 Q300 1130 560 1150 T1080 1140 V1920 H0 Z" fill="#a9a9b4" />
      <defs>
        <linearGradient id="moon-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#1d1d30" stopOpacity={0.35} />
        </linearGradient>
      </defs>
      <rect x={0} y={1140} width={W} height={H - 1140} fill="url(#moon-shade)" />
      {[[300, 1100, 60], [760, 1090, 46], [920, 1210, 70], [120, 1230, 40], [80, 1560, 90], [1000, 1700, 110], [620, 1110, 26]].map(([x, y, r]) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.28} fill="#7d7d8a" />
          <ellipse cx={x} cy={y + r * 0.06} rx={r * 0.8} ry={r * 0.2} fill="#8c8c98" />
          <path d={`M${x - r} ${y} A${r} ${r * 0.28} 0 0 0 ${x + r} ${y}`} stroke="#c4c4ce" strokeWidth={4} fill="none" opacity={0.6} />
        </g>
      ))}
      {/* камни */}
      {[[440, 1150, 22], [980, 1130, 30], [30, 1180, 26], [700, 1170, 14]].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + r * 0.4} rx={r * 1.2} ry={r * 0.25} fill="#000000" opacity={0.15} />
          <path d={`M${x - r} ${y + r * 0.4} Q${x - r} ${y - r * 0.6} ${x} ${y - r * 0.7} Q${x + r} ${y - r * 0.5} ${x + r} ${y + r * 0.4} Z`} fill="#8a8a96" />
          <path d={`M${x - r * 0.6} ${y - r * 0.2} Q${x - r * 0.2} ${y - r * 0.6} ${x + r * 0.3} ${y - r * 0.55}`} stroke="#b8b8c4" strokeWidth={4} fill="none" />
        </g>
      ))}
      {/* следы от ракеты к флажку */}
      <g fill="#8a8a96" opacity={0.7}>
        {Array.from({ length: 7 }).map((_, i) => (
          <ellipse key={i} cx={240 + i * 46} cy={1196 + (i % 2) * 14 + i * 4} rx={10} ry={5} />
        ))}
      </g>
      <g>
        <rect x={570} y={1050} width={5} height={150} fill="#c8c8d0" />
        <rect x={575} y={1052} width={70} height={44} fill="#c8553d" />
        <rect x={575} y={1066} width={70} height={14} fill="#f4f1ea" />
        <ellipse cx={572} cy={1200} rx={16} ry={4} fill="#000000" opacity={0.2} />
      </g>
      {/* ракетка */}
      <g transform="translate(150 1170)">
        <ellipse cx={0} cy={4} rx={70} ry={12} fill="#000000" opacity={0.2} />
        <path d="M-50 0 L-30 -80 H30 L50 0 Z" fill="#c8553d" />
        <path d="M-30 -60 Q-34 -220 0 -280 Q34 -220 30 -60 Z" fill="#f2efe8" />
        <path d="M-12 -70 Q-16 -200 0 -260" stroke="#ffffff" strokeWidth={6} fill="none" />
        <path d="M30 -60 Q34 -200 0 -280 Q20 -200 18 -60 Z" fill="#000000" opacity={0.08} />
        <path d="M-18 -240 Q0 -290 18 -240 Z" fill="#c8553d" />
        <circle cx={0} cy={-160} r={18} fill="#4a6fa5" />
        <circle cx={0} cy={-160} r={10} fill="#a9c7d9" />
        <rect x={-34} y={-110} width={68} height={8} fill="#c8553d" />
      </g>
    </>
  );
};

/* ---------- crossroads: развилка в облаках — дорога вверх к вратам рая и вниз к аду ---------- */

/** Лента дороги по осевым точкам {x, y, w}: многоугольник из левого и правого края. */
const ribbon = (pts: { x: number; y: number; w: number }[], squash = 1) => {
  const L: string[] = [];
  const R: string[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    L.push(`${(p.x + (nx * p.w) / 2).toFixed(1)} ${(p.y + (ny * p.w * squash) / 2).toFixed(1)}`);
    R.push(`${(p.x - (nx * p.w) / 2).toFixed(1)} ${(p.y - (ny * p.w * squash) / 2).toFixed(1)}`);
  });
  return `M${L.join(" L")} L${R.reverse().join(" L")} Z`;
};

/** Поперечные ступени-полоски вдоль дороги (между соседними осевыми точками, k — доля). */
const rungs = (pts: { x: number; y: number; w: number }[], per = 2) => {
  const out: { x1: number; y1: number; x2: number; y2: number; w: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = 0; j < per; j++) {
      const t = (j + 0.5) / per;
      const a = pts[i];
      const b = pts[i + 1];
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const w = (a.w + (b.w - a.w) * t) * 0.86;
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = -(b.y - a.y) / len;
      const ny = (b.x - a.x) / len;
      out.push({ x1: x + (nx * w) / 2, y1: y + (ny * w) / 2, x2: x - (nx * w) / 2, y2: y - (ny * w) / 2, w });
    }
  }
  return out;
};

/** Нимб (значок рая на указателе): золотое кольцо с крылышками. */
const HaloIcon = ({ x, y, s = 1, gold }: { x: number; y: number; s?: number; gold: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-14 4 q-22 -4 -34 -22 q14 4 22 0 q-12 -6 -16 -16 q14 8 28 12 Z" fill="#ffffff" />
    <path d="M14 4 q22 -4 34 -22 q-14 4 -22 0 q12 -6 16 -16 q-14 8 -28 12 Z" fill="#ffffff" />
    <ellipse cx={0} cy={0} rx={22} ry={9} fill="none" stroke={gold} strokeWidth={7} />
    <ellipse cx={0} cy={-2} rx={22} ry={9} fill="none" stroke={shade(gold, 0.5)} strokeWidth={2} />
  </g>
);

/** Вилы (значок ада на указателе). */
const ForkIcon = ({ x, y, s = 1, color = "#f2b030" }: { x: number; y: number; s?: number; color?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    <rect x={-3} y={-10} width={6} height={44} rx={3} />
    <path d="M-16 -10 V-30 l3 -6 l3 6 V-14 h7 V-34 l3 -7 l3 7 V-14 h7 V-30 l3 -6 l3 6 V-10 Z" />
  </g>
);

const Crossroads = ({ palette }: BackdropProps) => {
  const gold = palette.accent;
  const goldL = shade(gold, 0.45);
  const goldD = shade(gold, -0.25);
  // врата рая наверху слева: масштаб большого вида
  const gs = 0.4;
  const gx = 252;
  const gb = 786;
  // золотая лестница: от подножия (метка left-road, x≈216) вверх к вратам
  const N = 16;
  const st = Array.from({ length: N + 1 }).map((_, i) => {
    const t = i / N;
    const e = 0.45 * t + 0.55 * (1 - (1 - t) * (1 - t));
    return { y: lerp(1194, gb + 26, e), x: lerp(226, gx, t), w: lerp(210, 92, t) };
  });
  const sideTop = (p: { x: number; y: number; w: number }, d: number) => p.x + (d * p.w) / 2;
  // ствол дороги от зрителя к развилке
  const trunk = [
    { x: 540, y: H + 20, w: 520 },
    { x: 540, y: 1560, w: 400 },
    { x: 540, y: 1330, w: 300 },
    { x: 540, y: 1215, w: 230 },
  ];
  const toStairs = [
    { x: 520, y: 1218, w: 190 },
    { x: 420, y: 1212, w: 190 },
    { x: 300, y: 1202, w: 200 },
    { x: 236, y: 1196, w: 210 },
  ];
  // тёмная дорога вниз: от развилки к краю провала
  const down = [
    { x: 570, y: 1220, w: 200 },
    { x: 680, y: 1210, w: 190 },
    { x: 780, y: 1194, w: 170 },
    { x: 850, y: 1172, w: 150 },
  ];
  const hole = { cx: 880, cy: 1112, rx: 220, ry: 60 };
  const cobbles = (pts: { x: number; y: number; w: number }[]) => {
    const out: { x: number; y: number; rx: number; ry: number; a: number }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = -(b.y - a.y) / len;
      const ny = (b.x - a.x) / len;
      for (let j = 0; j < 4; j++) {
        const t = (j + 0.5) / 4;
        const w = lerp(a.w, b.w, t);
        for (let k = -2; k <= 2; k++) {
          const off = (k + (j % 2 ? 0.5 : 0)) * w * 0.19;
          if (Math.abs(off) > w * 0.42) continue;
          out.push({ x: lerp(a.x, b.x, t) + nx * off, y: lerp(a.y, b.y, t) + ny * off * 0.35, rx: w * 0.085, ry: w * 0.05, a: ang });
        }
      }
    }
    return out;
  };
  return (
    <>
      <Sky id="cross-sky2" stops={[[0, "#9cbfea"], [0.26, palette.wall], [0.5, "#fff0da"], [0.62, "#fbe6da"], [1, "#ffffff"]]} />
      {/* слева — свет рая, справа внизу — отсвет ада */}
      <Rays cx={gx} cy={650} color="#fff3c4" n={16} opacity={0.36} />
      <Glow cx={gx} cy={660} rx={560} color="#fff3c4" opacity={0.75} />
      <Glow cx={880} cy={1040} rx={480} ry={340} color="#e0502a" opacity={0.5} />
      <Glow cx={900} cy={860} rx={300} ry={260} color="#ff7a3a" opacity={0.22} />
      <Puff x={640} y={122} w={440} h={104} seed={41} o={0.85} />
      <Puff x={-60} y={110} w={280} h={84} seed={43} o={0.8} />
      <Puff x={700} y={600} w={260} h={90} seed={45} o={0.85} shadow="#ecd2cc" />
      {/* дальние облака: справа подсвечены красным снизу */}
      <Puff x={-60} y={1000} w={600} h={120} seed={47} shadow="#e2e9f5" />
      <Puff x={520} y={1010} w={620} h={120} seed={49} shadow="#ebc4b8" />
      {/* дым и искры над провалом */}
      {[[800, 1040, 180, 64, 0.24], [830, 960, 200, 66, 0.2], [790, 880, 210, 70, 0.16], [840, 800, 220, 72, 0.12], [810, 720, 230, 74, 0.08]].map(([x, y, w, h, o], i) => (
        <Puff key={i} x={x} y={y} w={w} h={h} seed={60 + i} color="#7a5a56" shadow="#5a3e3a" o={o} />
      ))}
      {Array.from({ length: 26 }).map((_, i) => (
        <circle key={i} cx={680 + rnd(i + 40) * 380} cy={760 + rnd(i + 90) * 340} r={2 + rnd(i) * 4} fill={i % 2 ? "#f2b030" : "#ff7a3a"} opacity={0.6 + rnd(i + 7) * 0.4} />
      ))}
      {/* облачный остров с вратами рая */}
      <Glow cx={gx} cy={660} rx={240} ry={280} color="#ffffff" opacity={0.85} />
      <Puff x={50} y={806} w={420} h={110} seed={51} shadow="#f3e6c4" />
      <g transform={`translate(${gx - 540 * gs} ${gb - 1090 * gs}) scale(${gs})`}>
        <PearlyGate gold={gold} />
      </g>
      <TinyAngel x={96} y={600} s={0.7} gold={gold} />
      <TinyAngel x={460} y={560} s={0.6} gold={gold} />
      <Dove x={430} y={640} s={0.7} flip={-1} />
      <Dove x={120} y={680} s={0.6} />
      {/* облачный пол */}
      <CloudFloor top={1060} color="#ffffff" shadow="#e4edf7" />
      <Glow cx={880} cy={1120} rx={330} ry={130} color="#ff6a3a" opacity={0.45} />
      {/* огненный провал в облаках справа */}
      <g>
        <ellipse cx={hole.cx} cy={hole.cy + 6} rx={hole.rx + 20} ry={hole.ry + 14} fill="#e8c4ba" />
        <ellipse cx={hole.cx} cy={hole.cy} rx={hole.rx} ry={hole.ry} fill="#3a1410" />
        <ellipse cx={hole.cx} cy={hole.cy + 8} rx={hole.rx * 0.88} ry={hole.ry * 0.72} fill="#7a2418" />
        <ellipse cx={hole.cx} cy={hole.cy + 14} rx={hole.rx * 0.66} ry={hole.ry * 0.48} fill="#c8401e" />
        <ellipse cx={hole.cx} cy={hole.cy + 18} rx={hole.rx * 0.42} ry={hole.ry * 0.28} fill="#f2902a" />
        <ellipse cx={hole.cx} cy={hole.cy + 20} rx={hole.rx * 0.2} ry={hole.ry * 0.13} fill="#fde29a" />
        <Flame x={hole.cx - 150} y={hole.cy - 4} s={0.45} o={0.95} />
        <Flame x={hole.cx - 50} y={hole.cy - 10} s={0.7} />
        <Flame x={hole.cx + 70} y={hole.cy - 8} s={0.85} />
        <Flame x={hole.cx + 165} y={hole.cy - 2} s={0.5} o={0.95} />
        {/* ступени дороги уходят в глубину */}
        {Array.from({ length: 6 }).map((_, i) => {
          const y = hole.cy + hole.ry * 0.8 - i * 12;
          const w = 130 - i * 18;
          const x = lerp(hole.cx - 40, hole.cx + 8, i / 5);
          return (
            <g key={i} opacity={1 - i * 0.12}>
              <rect x={x - w / 2} y={y - 8} width={w} height={10} rx={3} fill="#2a0c0a" />
              <rect x={x - w / 2} y={y - 8} width={w} height={2.5} fill="#ff8a2a" opacity={0.8} />
            </g>
          );
        })}
        <Glow cx={hole.cx} cy={hole.cy - 30} rx={260} ry={110} color="#ff6a2a" opacity={0.45} />
        {/* обугленный ближний край */}
        <path d={`M${hole.cx - hole.rx} ${hole.cy + 4} Q${hole.cx} ${hole.cy + hole.ry * 2.1} ${hole.cx + hole.rx} ${hole.cy + 4}`} stroke="#7a4a40" strokeWidth={8} fill="none" opacity={0.55} />
      </g>
      {/* ствол дороги и короткий золотой отрезок к лестнице */}
      <path d={ribbon(trunk)} fill="#f4ecd6" />
      <path d={ribbon(trunk.map((p) => ({ ...p, w: p.w * 0.7 })))} fill="#f8f1de" />
      {rungs(trunk, 3).map((r, i) => <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#e0d2b0" strokeWidth={4 + i * 0.6} opacity={0.6} />)}
      <path d={ribbon(toStairs.map((p) => ({ ...p, w: p.w + 24 })), 0.32)} fill="#ffffff" />
      <path d={ribbon(toStairs, 0.32)} fill="#f7e2a0" />
      {toStairs.slice(0, -1).map((a, i) => <line key={i} x1={(a.x + toStairs[i + 1].x) / 2} y1={(a.y + toStairs[i + 1].y) / 2 - 28} x2={(a.x + toStairs[i + 1].x) / 2 - 8} y2={(a.y + toStairs[i + 1].y) / 2 + 28} stroke={gold} strokeWidth={3} opacity={0.5} />)}
      {/* тёмная брусчатка вниз к провалу, с тлеющими трещинами */}
      <path d={ribbon(down.map((p) => ({ ...p, w: p.w + 24 })), 0.34)} fill="#3a2220" />
      <path d={ribbon(down, 0.34)} fill="#4a2e2a" />
      {cobbles(down).map((c, i) => (
        <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={i % 3 ? "#6e4a44" : "#5e3e3a"} transform={`rotate(${c.a} ${c.x} ${c.y})`} />
      ))}
      {["M610 1222 l30 -6 l18 8 l26 -10", "M720 1206 l24 -2 l14 -10 l20 4", "M800 1186 l18 -8 l14 2 l12 -12"].map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#ff8a2a" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.25} />
          <path d={d} stroke="#f2b030" strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.95} />
        </g>
      ))}
      {/* золотая лестница в небо: подступенки, проступи, балюстрада с жемчужными шарами */}
      <Glow cx={250} cy={1000} rx={220} ry={280} color="#fff3c4" opacity={0.7} />
      <path d={`M${gx - 46} ${gb + 26} H${gx + 46} L${226 + 105} 1194 H${226 - 105} Z`} fill="#fff6d6" opacity={0.5} />
      {st
        .slice(0, -1)
        .map((a, i) => {
          const b = st[i + 1];
          const rH = (a.y - b.y) * 0.5;
          return (
            <g key={i}>
              <path d={`M${a.x - a.w / 2} ${a.y - rH} H${a.x + a.w / 2} L${b.x + b.w / 2} ${b.y} H${b.x - b.w / 2} Z`} fill="#fdf0c4" />
              <rect x={a.x - a.w / 2} y={a.y - rH} width={a.w} height={rH} fill="#ecc75a" />
              <rect x={a.x - a.w / 2} y={a.y - rH} width={a.w} height={Math.max(1.5, rH * 0.18)} fill="#fff6d8" />
              <rect x={a.x - a.w / 2} y={a.y - Math.max(1.5, rH * 0.14)} width={a.w} height={Math.max(1.5, rH * 0.14)} fill={goldD} opacity={0.5} />
            </g>
          );
        })
        .reverse()}
      {[-1, 1].map((d) => {
        const posts = st.filter((_, i) => i % 2 === 0);
        const ph = (p: { w: number }) => 52 * (p.w / 210);
        return (
          <g key={d}>
            <path d={`M${st.map((p) => `${sideTop(p, d)} ${p.y}`).join(" L")}`} stroke={goldD} strokeWidth={6} fill="none" strokeLinejoin="round" />
            {posts.map((p, i) => (
              <g key={i}>
                <rect x={sideTop(p, d) - 3 * (p.w / 210)} y={p.y - ph(p)} width={6 * (p.w / 210)} height={ph(p)} fill={gold} />
                <circle cx={sideTop(p, d)} cy={p.y - ph(p)} r={6 * (p.w / 210) + 1} fill="#ffffff" />
              </g>
            ))}
            <path d={`M${posts.map((p) => `${sideTop(p, d)} ${p.y - ph(p)}`).join(" L")}`} stroke={gold} strokeWidth={4} fill="none" strokeLinejoin="round" />
          </g>
        );
      })}
      <Sparkle x={200} y={1010} r={12} o={0.9} />
      <Sparkle x={330} y={880} r={10} o={0.9} />
      {/* фонарь с нимбом у подножия лестницы */}
      <g>
        <ellipse cx={74} cy={1192} rx={40} ry={7} fill="#c9d6e6" opacity={0.7} />
        <rect x={68} y={930} width={12} height={262} rx={5} fill={gold} />
        <rect x={56} y={1176} width={36} height={16} rx={6} fill={goldD} />
        <Glow cx={74} cy={900} rx={70} color="#fff3c4" opacity={0.9} />
        <path d="M56 930 H92 L86 880 H62 Z" fill="#fff8dc" />
        <path d="M54 884 H94 L74 862 Z" fill={gold} />
        <rect x={54} y={928} width={40} height={6} rx={3} fill={gold} />
        <circle cx={74} cy={856} r={5} fill={gold} />
        <path d="M80 990 H150 L170 1012 L150 1034 H80 Z" fill="#fbf6e8" stroke={gold} strokeWidth={4} strokeLinejoin="round" />
        <HaloIcon x={120} y={1014} s={0.8} gold={gold} />
      </g>
      {/* весы суда на облачной тумбе слева от судьи */}
      <g>
        <ellipse cx={410} cy={1190} rx={74} ry={12} fill="#c9d6e6" opacity={0.6} />
        <g fill="#ffffff">
          <circle cx={380} cy={1150} r={34} />
          <circle cx={440} cy={1150} r={34} />
          <circle cx={410} cy={1128} r={38} />
          <rect x={350} y={1150} width={120} height={36} rx={16} />
        </g>
        <rect x={405} y={950} width={10} height={180} fill={gold} />
        <rect x={407} y={950} width={3} height={180} fill={goldL} />
        <circle cx={410} cy={944} r={11} fill={gold} />
        <path d="M344 968 Q410 952 476 968" stroke={gold} strokeWidth={8} fill="none" strokeLinecap="round" />
        {[344, 476].map((x, k) => (
          <g key={x}>
            <path d={`M${x} 970 L${x - 24} ${1030 + k * 6} M${x} 970 L${x + 24} ${1030 + k * 6}`} stroke={goldD} strokeWidth={2.5} />
            <path d={`M${x - 32} ${1030 + k * 6} Q${x} ${1058 + k * 6} ${x + 32} ${1030 + k * 6} Z`} fill={gold} />
            <path d={`M${x - 24} ${1033 + k * 6} Q${x} ${1046 + k * 6} ${x + 24} ${1033 + k * 6}`} stroke={goldL} strokeWidth={3} fill="none" />
          </g>
        ))}
        {/* на чашах: пёрышко и сердечко */}
        <path d="M330 1026 Q342 1004 360 998 Q352 1014 336 1028 Z" fill="#ffffff" />
        <path d="M476 1034 c-6 -10 -20 -6 -16 4 c2 6 16 14 16 14 c0 0 14 -8 16 -14 c4 -10 -10 -14 -16 -4 Z" fill="#d84a4a" />
        <Sparkle x={456} y={930} r={10} o={0.8} />
      </g>
      {/* главный указатель на развилке, за судьёй */}
      <g>
        <rect x={532} y={430} width={16} height={770} rx={6} fill="#c9b48a" />
        <rect x={535} y={430} width={5} height={770} fill="#ffffff" opacity={0.4} />
        <rect x={526} y={1184} width={28} height={12} rx={4} fill="#a89470" />
        <circle cx={540} cy={426} r={14} fill={gold} />
        <Sparkle x={540} y={426} r={22} o={0.8} />
        {/* вверх-влево: рай */}
        <g transform="rotate(-9 540 500)">
          <path d="M556 448 H420 L374 500 L420 552 H556 Z" fill="#fbf6e8" />
          <path d="M556 448 H420 L374 500 L420 552 H556 Z" fill="none" stroke={gold} strokeWidth={8} strokeLinejoin="round" />
          <path d="M546 458 H424 L388 500 L424 542 H546 Z" fill="none" stroke={goldL} strokeWidth={2.5} strokeLinejoin="round" />
          <HaloIcon x={452} y={508} s={1.15} gold={gold} />
          <path d="M478 524 q8 -16 22 -12 q10 -14 24 -4 q14 0 12 16 Z" fill="#ffffff" />
          <path d="M478 524 q8 -16 22 -12 q10 -14 24 -4 q14 0 12 16 Z" fill="none" stroke="#dfe8f5" strokeWidth={2} />
          <Sparkle x={512} y={478} r={9} color={gold} o={0.9} />
          {[[562, 460], [562, 540]].map(([x, y]) => <circle key={y} cx={x - 14} cy={y} r={4} fill={gold} />)}
        </g>
        {/* вниз-вправо: ад */}
        <g transform="rotate(11 540 620)">
          <path d="M522 574 H714 L764 624 L714 674 H522 Z" fill="#4a1612" />
          <path d="M522 574 H714 L764 624 L714 674 H522 Z" fill="none" stroke="#24090a" strokeWidth={8} strokeLinejoin="round" />
          <path d="M600 580 l10 22 l-8 14 M690 666 l-6 -18 l10 -10" stroke="#24090a" strokeWidth={3} fill="none" />
          <Flame x={668} y={660} s={0.4} />
          <ForkIcon x={590} y={626} s={0.95} />
          {[[534, 586], [534, 662]].map(([x, y]) => <circle key={y} cx={x} cy={y} r={4} fill="#8a6a5a" />)}
        </g>
      </g>
      {/* кривой столбик с пламенем у края провала */}
      <g transform="rotate(8 1030 1190)">
        <rect x={1022} y={950} width={16} height={240} rx={4} fill="#4a2a22" />
        <path d="M1000 966 H1062 V1040 H1000 Z" fill="#3a1410" />
        <path d="M1000 966 H1062 V1040 H1000 Z" fill="none" stroke="#24090a" strokeWidth={5} />
        <Flame x={1031} y={1030} s={0.3} />
        <path d="M1031 1046 v26 m-10 -12 l10 14 l10 -14" stroke="#f2902a" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      {/* пюпитр судьи с книгой душ, справа от метки judge */}
      <g transform="translate(662 1190) scale(0.8) translate(0 -1190)">
        <Lectern x={0} gold={gold} bell={false} />
      </g>
      {/* облачные кочки у краёв пола и по бокам дороги */}
      <Puff x={-80} y={1250} w={300} h={110} seed={53} />
      <Puff x={940} y={1330} w={240} h={80} seed={55} shadow="#efdcd8" />
      <g fill="#ffffff" opacity={0.9}>
        {[[350, 1470, 54], [380, 1420, 36], [732, 1480, 56], [706, 1428, 36], [290, 1800, 70], [800, 1810, 74], [340, 1760, 44]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      <Puff x={-140} y={1960} w={420} h={200} seed={57} shadow="#e8eef7" />
      <Puff x={820} y={1960} w={420} h={200} seed={59} shadow="#f0e2de" />
      {[[120, 800], [470, 760], [600, 860], [160, 1300], [980, 1300]].map(([x, y], i) => (
        <Sparkle key={i} x={x} y={y} r={8 + (i % 3) * 5} o={0.85} />
      ))}
    </>
  );
};

export const Nebesa = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "hell" ? (
      <Hell />
    ) : variant === "garden-of-eden" ? (
      <Eden palette={palette} />
    ) : variant === "space" ? (
      <Space />
    ) : variant === "crossroads" ? (
      <Crossroads palette={palette} />
    ) : (
      <Heaven palette={palette} />
    )}
  </Canvas>
);
