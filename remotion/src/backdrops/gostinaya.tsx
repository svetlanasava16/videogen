import { Canvas, Room, Door, Picture, Rug, HangingLamp, W, H, FLOOR_Y, type BackdropProps, type Palette } from "./parts";

/* ---------- цветовые помощники (используются и в соседних фонах) ---------- */
const rgb = (c: string) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
export const dark = (c: string, t = 0.2) => mix(c, "#000000", t);
export const light = (c: string, t = 0.2) => mix(c, "#ffffff", t);

export const WOOD = "#8a5a3a";

/** Плинтус вдоль линии пола. */
export const Plinth = ({ color }: { color: string }) => <rect x={0} y={FLOOR_Y - 26} width={W} height={26} fill={color} />;

/** Большой двустворчатый шкаф; низ стоит на полу. */
export const Wardrobe = ({ x, w = 270, h = 660, color = WOOD }: { x: number; w?: number; h?: number; color?: string }) => {
  const y = FLOOR_Y - h;
  return (
    <g>
      <rect x={x + 14} y={y + 14} width={w} height={h - 14} rx={10} fill="#00000020" />
      <rect x={x - 10} y={y} width={w + 20} height={28} rx={8} fill={dark(color, 0.18)} />
      <rect x={x} y={y + 24} width={w} height={h - 44} rx={8} fill={color} />
      <rect x={x + 16} y={y + 44} width={w / 2 - 24} height={h - 104} rx={6} fill={dark(color, 0.08)} />
      <rect x={x + w / 2 + 8} y={y + 44} width={w / 2 - 24} height={h - 104} rx={6} fill={dark(color, 0.08)} />
      <rect x={x + w / 2 - 22} y={y + h * 0.48} width={10} height={44} rx={5} fill="#e0b030" />
      <rect x={x + w / 2 + 12} y={y + h * 0.48} width={10} height={44} rx={5} fill="#e0b030" />
      <rect x={x + 14} y={FLOOR_Y - 22} width={22} height={22} fill={dark(color, 0.35)} />
      <rect x={x + w - 36} y={FLOOR_Y - 22} width={22} height={22} fill={dark(color, 0.35)} />
    </g>
  );
};

/** Обои: мягкие вертикальные полосы с точками. */
const Wallpaper = ({ wall, step = 90 }: { wall: string; step?: number }) => (
  <g>
    {Array.from({ length: Math.ceil(W / step) + 1 }).map((_, i) => (
      <rect key={i} x={i * step} y={0} width={step * 0.42} height={FLOOR_Y} fill={dark(wall, 0.05)} />
    ))}
    {Array.from({ length: Math.ceil(W / step) + 1 }).flatMap((_, i) =>
      Array.from({ length: 7 }).map((__, j) => (
        <circle key={`${i}-${j}`} cx={i * step + step * 0.71} cy={470 + j * 110 + (i % 2) * 55} r={7} fill={light(wall, 0.18)} />
      )),
    )}
  </g>
);

const Sofa = ({ x, w, color }: { x: number; w: number; color: string }) => (
  <g>
    <rect x={x + 30} y={FLOOR_Y - 280} width={w - 60} height={170} rx={44} fill={dark(color, 0.12)} />
    <rect x={x + 50} y={FLOOR_Y - 262} width={(w - 110) / 2} height={120} rx={34} fill={dark(color, 0.04)} />
    <rect x={x + 60 + (w - 110) / 2} y={FLOOR_Y - 262} width={(w - 110) / 2} height={120} rx={34} fill={dark(color, 0.04)} />
    <rect x={x + 20} y={FLOOR_Y - 160} width={w - 40} height={74} rx={24} fill={color} />
    <rect x={x} y={FLOOR_Y - 215} width={74} height={150} rx={34} fill={light(color, 0.06)} />
    <rect x={x + w - 74} y={FLOOR_Y - 215} width={74} height={150} rx={34} fill={light(color, 0.06)} />
    <rect x={x + 10} y={FLOOR_Y - 96} width={w - 20} height={50} rx={14} fill={dark(color, 0.22)} />
    <rect x={x + 30} y={FLOOR_Y - 46} width={18} height={46} fill="#4a3020" />
    <rect x={x + w - 48} y={FLOOR_Y - 46} width={18} height={46} fill="#4a3020" />
    {/* подушка и заплатка — для уюта */}
    <rect x={x + 92} y={FLOOR_Y - 228} width={84} height={76} rx={20} fill="#e0b030" transform={`rotate(-12 ${x + 134} ${FLOOR_Y - 190})`} />
    <rect x={x + w - 170} y={FLOOR_Y - 150} width={50} height={36} rx={6} fill={light(color, 0.25)} />
  </g>
);

const TvStand = ({ x }: { x: number }) => (
  <g>
    <rect x={x} y={FLOOR_Y - 170} width={170} height={150} rx={8} fill={WOOD} />
    <rect x={x + 14} y={FLOOR_Y - 150} width={142} height={56} rx={5} fill={dark(WOOD, 0.12)} />
    <circle cx={x + 85} cy={FLOOR_Y - 122} r={6} fill="#e0b030" />
    <rect x={x + 10} y={FLOOR_Y - 20} width={16} height={20} fill="#4a3020" />
    <rect x={x + 144} y={FLOOR_Y - 20} width={16} height={20} fill="#4a3020" />
    {/* пузатый телевизор с «рожками» */}
    <line x1={x + 85} y1={FLOOR_Y - 300} x2={x + 40} y2={FLOOR_Y - 370} stroke="#3a2a20" strokeWidth={5} strokeLinecap="round" />
    <line x1={x + 85} y1={FLOOR_Y - 300} x2={x + 132} y2={FLOOR_Y - 362} stroke="#3a2a20" strokeWidth={5} strokeLinecap="round" />
    <rect x={x + 6} y={FLOOR_Y - 304} width={158} height={134} rx={22} fill="#5a4a40" />
    <rect x={x + 22} y={FLOOR_Y - 288} width={100} height={100} rx={16} fill="#3b4f63" />
    <rect x={x + 34} y={FLOOR_Y - 278} width={26} height={12} rx={6} fill="#ffffff40" />
    <circle cx={x + 143} cy={FLOOR_Y - 270} r={8} fill="#c9b8a0" />
    <circle cx={x + 143} cy={FLOOR_Y - 242} r={8} fill="#c9b8a0" />
  </g>
);

/* ---------- базовая гостиная ---------- */
const Living = ({ palette: p }: { palette: Palette }) => (
  <>
    <Room wall={p.wall} floor={p.floor} />
    <Wallpaper wall={p.wall} />
    <Plinth color={dark(p.wall, 0.3)} />
    <HangingLamp x={540} len={40} color="#e0a030" />
    <Picture x={360} y={530} w={200} h={140} frame={WOOD} art="#9cc3d8" />
    <ellipse cx={630} cy={590} rx={42} ry={54} fill={WOOD} />
    <ellipse cx={630} cy={590} rx={30} ry={42} fill={light(p.accent, 0.35)} />
    <Door x={30} w={200} color={dark(WOOD, 0.05)} />
    <Sofa x={258} w={410} color={p.accent} />
    <TvStand x={676} />
    <Wardrobe x={854} w={216} h={700} />
    <rect x={890} y={FLOOR_Y - 760} width={150} height={60} rx={8} fill="#6b7f5a" />
    <rect x={930} y={FLOOR_Y - 790} width={90} height={30} rx={6} fill="#e0b030" />
    <Rug cx={480} color={dark(p.accent, 0.1)} w={600} />
  </>
);

/* ---------- прихожая с входной дверью ---------- */
const Hallway = ({ palette: p }: { palette: Palette }) => {
  const dx = 590;
  const dy = FLOOR_Y - 580;
  const door = dark(p.accent, 0.4);
  return (
    <>
      <Room wall={p.wall} floor={p.floor} />
      <Wallpaper wall={p.wall} step={120} />
      <rect x={0} y={900} width={W} height={FLOOR_Y - 900} fill={dark(p.wall, 0.14)} />
      <rect x={0} y={892} width={W} height={14} fill={dark(p.wall, 0.28)} />
      <Plinth color={dark(p.wall, 0.34)} />
      <HangingLamp x={300} len={40} color="#e0a030" />
      {/* обитая дерматином входная дверь */}
      <rect x={dx - 26} y={dy - 26} width={312} height={606} rx={10} fill={light(p.wall, 0.35)} />
      <rect x={dx} y={dy} width={260} height={580} rx={8} fill={door} />
      {Array.from({ length: 5 }).flatMap((_, r) =>
        Array.from({ length: 3 }).map((__, c) => <circle key={`${r}-${c}`} cx={dx + 60 + c * 70} cy={dy + 70 + r * 105} r={7} fill={light(door, 0.25)} />),
      )}
      <circle cx={dx + 130} cy={dy + 150} r={9} fill="#e0b030" />
      <rect x={dx + 214} y={dy + 290} width={30} height={14} rx={7} fill="#e0b030" />
      <rect x={dx + 222} y={dy + 330} width={14} height={30} rx={5} fill="#c9b070" />
      <rect x={dx + 10} y={FLOOR_Y} width={240} height={26} rx={6} fill={dark(p.floor, 0.25)} />
      {/* вешалка */}
      <rect x={150} y={640} width={16} height={FLOOR_Y - 640} fill={dark(WOOD, 0.2)} />
      <ellipse cx={158} cy={FLOOR_Y - 8} rx={70} ry={14} fill={dark(WOOD, 0.3)} />
      <circle cx={158} cy={640} r={16} fill={dark(WOOD, 0.2)} />
      <path d="M118 680 Q158 650 198 680" stroke={dark(WOOD, 0.2)} strokeWidth={12} fill="none" strokeLinecap="round" />
      <rect x={96} y={680} width={86} height={300} rx={36} fill="#4a6a8a" />
      <rect x={100} y={690} width={20} height={140} rx={10} fill={dark("#4a6a8a", 0.15)} />
      <rect x={160} y={688} width={66} height={230} rx={30} fill="#8a6a4a" />
      <rect x={196} y={690} width={14} height={180} fill={p.accent} />
      <path d="M118 628 Q158 560 198 628 Z" fill="#3a3a3a" />
      <ellipse cx={158} cy={630} rx={58} ry={12} fill="#3a3a3a" />
      {/* обувь и зонтик */}
      <rect x={276} y={FLOOR_Y - 140} width={260} height={20} rx={6} fill={WOOD} />
      <rect x={290} y={FLOOR_Y - 120} width={16} height={120} fill={dark(WOOD, 0.25)} />
      <rect x={506} y={FLOOR_Y - 120} width={16} height={120} fill={dark(WOOD, 0.25)} />
      <rect x={276} y={FLOOR_Y - 66} width={260} height={14} rx={5} fill={dark(WOOD, 0.1)} />
      <ellipse cx={340} cy={FLOOR_Y - 76} rx={30} ry={12} fill="#2b2b2b" />
      <ellipse cx={400} cy={FLOOR_Y - 76} rx={30} ry={12} fill="#2b2b2b" />
      <ellipse cx={460} cy={FLOOR_Y - 10} rx={34} ry={12} fill="#c8553d" />
      <ellipse cx={500} cy={FLOOR_Y - 10} rx={34} ry={12} fill="#c8553d" />
      <path d={`M960 ${FLOOR_Y} L940 ${FLOOR_Y - 300}`} stroke="#2b2b2b" strokeWidth={8} strokeLinecap="round" />
      <path d={`M900 ${FLOOR_Y - 300} Q940 ${FLOOR_Y - 380} 980 ${FLOOR_Y - 300} Z`} fill="#4a6a8a" />
      <rect x={936} y={FLOOR_Y - 300} width={10} height={200} rx={4} fill="#4a6a8a" />
      {/* зеркальце и ключница */}
      <ellipse cx={420} cy={690} rx={70} ry={90} fill={WOOD} />
      <ellipse cx={420} cy={690} rx={56} ry={76} fill="#cfe6f5" />
      <rect x={390} y={640} width={14} height={60} rx={7} fill="#ffffff90" transform="rotate(25 397 670)" />
      <rect x={950} y={720} width={90} height={18} rx={6} fill={WOOD} />
      <circle cx={975} cy={752} r={9} fill="#e0b030" />
      <circle cx={1012} cy={756} r={9} fill="#c9b070" />
    </>
  );
};

/* ---------- балкон, ночной город ---------- */
const STARS = [[120, 470], [300, 520], [520, 450], [660, 560], [980, 470], [420, 620], [200, 660], [900, 640], [760, 470], [60, 590]];
const Balcony = ({ palette: p }: { palette: Palette }) => {
  const sky = "#2b3a55";
  const back = Array.from({ length: 12 }).map((_, i) => ({ x: i * 95 - 20, w: 90, h: 180 + ((i * 53) % 140) }));
  const front = Array.from({ length: 9 }).map((_, i) => ({ x: i * 130 - 40, w: 120, h: 120 + ((i * 71) % 130) }));
  const rail = "#4a3a34";
  return (
    <>
      <rect x={0} y={0} width={W} height={H} fill={sky} />
      <rect x={0} y={760} width={W} height={300} fill={mix(sky, "#e0a030", 0.12)} />
      {STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 6 : 4} fill="#f5e6a8" opacity={0.8} />)}
      <circle cx={830} cy={540} r={58} fill="#f5e6a8" />
      <circle cx={852} cy={524} r={52} fill={sky} />
      {back.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={1000 - b.h} width={b.w} height={b.h + 40} fill={mix(sky, "#000000", 0.2)} />
          {Array.from({ length: Math.floor(b.h / 50) }).map((_, j) =>
            (i + j) % 3 === 0 ? <rect key={j} x={b.x + 22 + (j % 2) * 32} y={1000 - b.h + 24 + j * 50} width={16} height={20} fill="#f5d77a" opacity={0.75} /> : null,
          )}
        </g>
      ))}
      {front.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={1060 - b.h} width={b.w} height={b.h + 40} fill={mix(sky, "#000000", 0.42)} />
          {Array.from({ length: Math.floor(b.h / 46) }).map((_, j) =>
            (i * 2 + j) % 3 !== 1 ? <rect key={j} x={b.x + 20 + (j % 2) * 50} y={1060 - b.h + 20 + j * 46} width={22} height={24} fill="#f5c85a" /> : null,
          )}
        </g>
      ))}
      {/* стена дома и балконная дверь */}
      <rect x={0} y={0} width={120} height={FLOOR_Y} fill={dark(p.wall, 0.25)} />
      <rect x={0} y={560} width={96} height={FLOOR_Y - 560} fill={dark(p.wall, 0.45)} />
      <rect x={0} y={580} width={76} height={FLOOR_Y - 580} fill="#f5d77a" opacity={0.85} />
      <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill={dark(p.floor, 0.1)} />
      <path d={`M0 ${FLOOR_Y} L80 ${FLOOR_Y} L380 ${H} L0 ${H} Z`} fill="#f5d77a" opacity={0.12} />
      {/* бельевая верёвка */}
      <path d="M120 470 Q600 520 1080 470" stroke="#d8cdb8" strokeWidth={4} fill="none" />
      <path d="M330 488 h120 l20 40 h-30 v110 h-100 v-110 h-30 z" fill={light(p.accent, 0.1)} />
      <rect x={600} y={494} width={40} height={90} rx={12} fill="#e0b030" />
      <rect x={660} y={494} width={40} height={90} rx={12} fill="#e0b030" />
      {/* перила */}
      <rect x={100} y={940} width={W} height={26} rx={8} fill={rail} />
      <rect x={100} y={FLOOR_Y - 30} width={W} height={18} fill={rail} />
      {Array.from({ length: 20 }).map((_, i) => <rect key={i} x={140 + i * 50} y={966} width={10} height={FLOOR_Y - 996} fill={rail} />)}
      {/* ящик с цветами */}
      <rect x={760} y={880} width={240} height={60} rx={8} fill={WOOD} />
      {[790, 840, 890, 940, 975].map((x, i) => (
        <g key={x}>
          <rect x={x - 3} y={850} width={6} height={34} fill="#5b8c5a" />
          <circle cx={x} cy={846} r={16} fill={i % 2 ? "#e0b030" : p.accent} />
        </g>
      ))}
    </>
  );
};

/* ---------- подвал ---------- */
const Basement = ({ palette: p }: { palette: Palette }) => {
  const wall = mix(p.wall, "#6f6a64", 0.55);
  const floor = dark(mix(p.floor, "#5a5550", 0.4), 0.15);
  const brick = dark(wall, 0.12);
  const jars = ["#5b8c5a", "#c8553d", "#e0b030", "#5b8c5a", "#c8553d"];
  return (
    <>
      <Room wall={wall} floor={floor} />
      {/* кирпич проступает сквозь штукатурку */}
      {Array.from({ length: 4 }).flatMap((_, r) =>
        Array.from({ length: 3 }).map((__, c) => <rect key={`${r}-${c}`} x={300 + c * 74 + (r % 2) * 37} y={760 + r * 40} width={66} height={32} rx={4} fill={brick} />),
      )}
      {Array.from({ length: 3 }).flatMap((_, r) =>
        Array.from({ length: 2 }).map((__, c) => <rect key={`b${r}-${c}`} x={40 + c * 74 + (r % 2) * 37} y={540 + r * 40} width={66} height={32} rx={4} fill={brick} />),
      )}
      {/* окошко под потолком и луч */}
      <path d="M440 560 L640 560 L780 1190 L320 1190 Z" fill="#f5e6a8" opacity={0.1} />
      <rect x={430} y={450} width={220} height={120} rx={8} fill={dark(wall, 0.3)} />
      <rect x={446} y={466} width={188} height={88} rx={4} fill="#9fb8c8" />
      {[490, 540, 590].map((x) => <rect key={x} x={x - 4} y={466} width={8} height={88} fill="#3a3a3a" />)}
      {/* трубы */}
      <rect x={0} y={620} width={W} height={30} fill="#7a6a5a" />
      <rect x={0} y={668} width={W} height={18} fill="#8a7a6a" />
      {[160, 520, 860].map((x) => <rect key={x} x={x} y={612} width={22} height={46} rx={4} fill="#5a4a3a" />)}
      <circle cx={700} cy={605} r={30} fill="#c8553d" />
      <circle cx={700} cy={605} r={14} fill={wall} />
      <rect x={696} y={605} width={8} height={18} fill="#5a4a3a" />
      {/* лампочка */}
      <rect x={258} y={0} width={5} height={420} fill="#2b1d14" />
      <circle cx={260} cy={450} r={150} fill="#f5e6a8" opacity={0.12} />
      <rect x={250} y={420} width={20} height={20} fill="#5a5a5a" />
      <circle cx={260} cy={458} r={22} fill="#f5e6a8" />
      {/* стеллаж с банками */}
      <rect x={20} y={720} width={14} height={FLOOR_Y - 720} fill={WOOD} />
      <rect x={226} y={720} width={14} height={FLOOR_Y - 720} fill={WOOD} />
      {[840, 980, 1120].map((y, r) => (
        <g key={y}>
          <rect x={14} y={y} width={232} height={16} rx={4} fill={dark(WOOD, 0.05)} />
          {[0, 1, 2, 3].map((k) => {
            const c = jars[(r + k) % jars.length];
            return (
              <g key={k}>
                <rect x={44 + k * 46} y={y - 76} width={38} height={76} rx={10} fill={c} opacity={0.9} />
                <rect x={46 + k * 46} y={y - 86} width={34} height={14} rx={4} fill="#c9b070" />
              </g>
            );
          })}
        </g>
      ))}
      {/* лестница наверх */}
      <path d={`M1080 560 L1080 640 L800 ${FLOOR_Y} L740 ${FLOOR_Y} Z`} fill={dark(WOOD, 0.25)} />
      {Array.from({ length: 7 }).map((_, i) => {
        const t = (i + 0.5) / 7;
        const x = 1080 - t * 300;
        const y = 600 + t * (FLOOR_Y - 600);
        return <rect key={i} x={x - 70} y={y - 14} width={130} height={22} rx={4} fill={WOOD} />;
      })}
      <path d={`M1080 360 L800 ${FLOOR_Y - 330}`} stroke={dark(WOOD, 0.3)} strokeWidth={12} strokeLinecap="round" />
      <rect x={794} y={FLOOR_Y - 336} width={12} height={336} fill={dark(WOOD, 0.3)} />
      {/* ящики */}
      <rect x={900} y={FLOOR_Y - 120} width={150} height={120} rx={6} fill="#a07a50" />
      <rect x={900} y={FLOOR_Y - 70} width={150} height={12} fill="#86643f" />
      <rect x={930} y={FLOOR_Y - 200} width={100} height={80} rx={6} fill="#b58e60" />
    </>
  );
};

/** Гостиная: базовый вид + прихожая (front-door), балкон (balcony), подвал (basement). */
export const Gostinaya = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "front-door" ? (
      <Hallway palette={palette} />
    ) : variant === "balcony" ? (
      <Balcony palette={palette} />
    ) : variant === "basement" ? (
      <Basement palette={palette} />
    ) : (
      <Living palette={palette} />
    )}
  </Canvas>
);
