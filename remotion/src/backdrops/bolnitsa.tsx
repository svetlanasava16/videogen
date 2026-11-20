import { Canvas, Room, Window, FLOOR_Y, W, type BackdropProps } from "./parts";

/** Фон «bolnitsa»: кабинет врача; варианты hospital (палата) и madhouse (палата с мягкими стенами). */

const rgb = (c: string) => {
  const h = c.replace("#", "");
  const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0);
};
const mix = (a: string, b: string, t: number) => {
  const A = rgb(a);
  const B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const dark = (c: string, t: number) => mix(c, "#000000", t);
const light = (c: string, t: number) => mix(c, "#ffffff", t);

const WHITE = "#f4f1ea";
const METAL = "#9aa6aa";
const WOOD = "#a8774f";
const BONE = "#efe6cf";
const INK = "#2b2a2e";

/** Нижняя панель стены с полоской акцента. */
const Wainscot = ({ wall, accent }: { wall: string; accent: string }) => (
  <>
    <rect x={0} y={880} width={W} height={FLOOR_Y - 880} fill={dark(wall, 0.07)} />
    <rect x={0} y={866} width={W} height={14} fill={accent} />
  </>
);

/** Таблица для проверки зрения: ряды кружков-«колечек» и плашек, без букв. */
const EyeChart = ({ x, y, accent }: { x: number; y: number; accent: string }) => {
  const w = 190;
  const rows = [
    { n: 1, s: 46 },
    { n: 2, s: 30 },
    { n: 3, s: 22 },
    { n: 4, s: 16 },
    { n: 5, s: 12 },
    { n: 6, s: 9 },
  ];
  let yy = y + 26;
  return (
    <g>
      <rect x={x + 6} y={y + 8} width={w} height={276} rx={10} fill="#00000018" />
      <rect x={x} y={y} width={w} height={276} rx={10} fill={WHITE} />
      {rows.map((r, ri) => {
        const gap = r.s * 0.7;
        const total = r.n * r.s + (r.n - 1) * gap;
        const x0 = x + (w - total) / 2;
        const cy = yy + r.s / 2;
        yy += r.s + 14;
        return (
          <g key={ri}>
            {Array.from({ length: r.n }).map((_, i) => {
              const cx = x0 + i * (r.s + gap) + r.s / 2;
              return (i + ri) % 2 === 0 ? (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={r.s / 2} fill={INK} />
                  <circle cx={cx} cy={cy} r={r.s / 4} fill={WHITE} />
                  <rect x={cx} y={cy - r.s / 10} width={r.s / 2 + 1} height={r.s / 5} fill={WHITE} />
                </g>
              ) : (
                <rect key={i} x={cx - r.s / 2} y={cy - r.s / 2} width={r.s} height={r.s} rx={r.s * 0.2} fill={INK} />
              );
            })}
            {ri === 3 && <rect x={x + 18} y={cy + r.s / 2 + 5} width={w - 36} height={3} fill="#c8553d" />}
          </g>
        );
      })}
      <rect x={x} y={y + 252} width={w} height={24} rx={0} fill={accent} opacity={0.6} />
    </g>
  );
};

/** Учебный скелет на стойке. */
const Skeleton = ({ cx }: { cx: number }) => {
  const top = FLOOR_Y - 610;
  const bone = { stroke: BONE, strokeLinecap: "round" as const, fill: "none" };
  return (
    <g>
      {/* стойка */}
      <rect x={cx - 5} y={top - 30} width={10} height={610} fill={dark(METAL, 0.3)} />
      <rect x={cx - 70} y={FLOOR_Y - 18} width={140} height={18} rx={9} fill={dark(METAL, 0.35)} />
      {/* череп */}
      <circle cx={cx} cy={top + 46} r={42} fill={BONE} />
      <rect x={cx - 26} y={top + 66} width={52} height={36} rx={12} fill={BONE} />
      <circle cx={cx - 15} cy={top + 44} r={11} fill={INK} />
      <circle cx={cx + 15} cy={top + 44} r={11} fill={INK} />
      <path d={`M${cx} ${top + 58} l-6 12 h12 z`} fill={INK} />
      {[-14, -5, 4, 13].map((d) => (
        <rect key={d} x={cx + d - 1} y={top + 84} width={4} height={14} fill={dark(BONE, 0.25)} />
      ))}
      {/* позвоночник, ключицы, рёбра */}
      <rect x={cx - 8} y={top + 104} width={16} height={240} rx={8} fill={BONE} />
      <rect x={cx - 66} y={top + 124} width={132} height={14} rx={7} fill={BONE} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={cx - (58 - i * 6)} y={top + 152 + i * 28} width={(58 - i * 6) * 2} height={14} rx={7} fill={BONE} />
      ))}
      {/* таз */}
      <ellipse cx={cx} cy={top + 350} rx={52} ry={26} fill={BONE} />
      <circle cx={cx} cy={top + 354} r={10} fill={dark(BONE, 0.2)} />
      {/* руки */}
      <path d={`M${cx - 62} ${top + 132} L${cx - 76} ${top + 236} L${cx - 70} ${top + 338}`} strokeWidth={13} {...bone} strokeLinejoin="round" />
      <path d={`M${cx + 62} ${top + 132} L${cx + 76} ${top + 236} L${cx + 70} ${top + 338}`} strokeWidth={13} {...bone} strokeLinejoin="round" />
      <circle cx={cx - 70} cy={top + 350} r={13} fill={BONE} />
      <circle cx={cx + 70} cy={top + 350} r={13} fill={BONE} />
      {/* ноги */}
      <path d={`M${cx - 26} ${top + 368} L${cx - 30} ${top + 470} L${cx - 30} ${top + 580}`} strokeWidth={15} {...bone} strokeLinejoin="round" />
      <path d={`M${cx + 26} ${top + 368} L${cx + 30} ${top + 470} L${cx + 30} ${top + 580}`} strokeWidth={15} {...bone} strokeLinejoin="round" />
      <ellipse cx={cx - 38} cy={top + 588} rx={20} ry={8} fill={BONE} />
      <ellipse cx={cx + 38} cy={top + 588} rx={20} ry={8} fill={BONE} />
    </g>
  );
};

/** Смотровая кушетка (у левой стены). */
const Couch = ({ x, w, accent }: { x: number; w: number; accent: string }) => {
  const padTop = FLOOR_Y - 196;
  return (
    <g>
      <rect x={x + 30} y={padTop + 40} width={14} height={FLOOR_Y - padTop - 40} fill={METAL} />
      <rect x={x + w - 44} y={padTop + 40} width={14} height={FLOOR_Y - padTop - 40} fill={METAL} />
      <rect x={x + 30} y={FLOOR_Y - 60} width={w - 60} height={10} fill={METAL} />
      {/* приподнятое изголовье */}
      <path d={`M${x} ${padTop + 44} L${x + 14} ${padTop - 70} Q${x + 18} ${padTop - 84} ${x + 34} ${padTop - 80} L${x + 120} ${padTop - 6} L${x + 120} ${padTop + 44} Z`} fill={dark(accent, 0.12)} />
      <rect x={x} y={padTop} width={w} height={46} rx={14} fill={accent} />
      <rect x={x + 110} y={padTop - 8} width={w - 130} height={14} rx={6} fill={WHITE} opacity={0.9} />
      <ellipse cx={x + 54} cy={padTop - 34} rx={40} ry={18} fill={WHITE} transform={`rotate(-50 ${x + 54} ${padTop - 34})`} />
    </g>
  );
};

/** Стол врача с лампой и бумагами. */
const Desk = ({ x, w, accent }: { x: number; w: number; accent: string }) => {
  const top = FLOOR_Y - 240;
  return (
    <g>
      <rect x={x + 20} y={top + 24} width={20} height={240 - 24} fill={dark(WOOD, 0.25)} />
      <rect x={x + w - 130} y={top + 24} width={120} height={240 - 24} rx={6} fill={dark(WOOD, 0.1)} />
      <rect x={x + w - 118} y={top + 46} width={96} height={60} rx={6} fill={dark(WOOD, 0.22)} />
      <rect x={x + w - 118} y={top + 122} width={96} height={60} rx={6} fill={dark(WOOD, 0.22)} />
      <circle cx={x + w - 70} cy={top + 76} r={6} fill="#e0b030" />
      <circle cx={x + w - 70} cy={top + 152} r={6} fill="#e0b030" />
      <rect x={x} y={top} width={w} height={26} rx={8} fill={WOOD} />
      {/* лампа */}
      <rect x={x + 40} y={top - 10} width={60} height={12} rx={6} fill={INK} />
      <path d={`M${x + 70} ${top - 6} L${x + 92} ${top - 92}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d={`M${x + 64} ${top - 82} L${x + 130} ${top - 128} L${x + 150} ${top - 82} Z`} fill={accent} />
      {/* бумаги и кружка */}
      <rect x={x + 150} y={top - 14} width={90} height={14} rx={3} fill={WHITE} />
      <rect x={x + 156} y={top - 24} width={80} height={10} rx={3} fill={light(accent, 0.6)} />
      <rect x={x + w - 80} y={top - 46} width={36} height={46} rx={8} fill="#c8553d" />
      <path d={`M${x + w - 44} ${top - 36} q20 4 0 22`} stroke="#c8553d" strokeWidth={7} fill="none" />
    </g>
  );
};

/** Диплом в рамке. */
const Diploma = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x} y={y} width={150} height={110} rx={6} fill={WOOD} />
    <rect x={x + 12} y={y + 12} width={126} height={86} fill={WHITE} />
    <rect x={x + 30} y={y + 30} width={90} height={8} rx={4} fill="#c9c0aa" />
    <rect x={x + 30} y={y + 48} width={70} height={6} rx={3} fill="#c9c0aa" />
    <circle cx={x + 110} cy={y + 76} r={12} fill="#c8553d" />
  </g>
);

const Office = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => (
  <>
    <Room wall={wall} floor={floor} />
    <Wainscot wall={wall} accent={accent} />
    <Window x={60} y={450} w={260} h={300} glass={light(accent, 0.55)} />
    <EyeChart x={445} y={436} accent={accent} />
    <Diploma x={690} y={500} />
    <Skeleton cx={985} />
    <Couch x={20} w={360} accent={accent} />
    <Desk x={630} w={300} accent={accent} />
  </>
);

/** Больничная палата: кровать, капельница, шторка. */
const Ward = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => {
  const bedTop = FLOOR_Y - 250;
  const bx = 560;
  const bw = 480;
  const curtain = light(accent, 0.35);
  return (
    <>
      <Room wall={wall} floor={floor} />
      <Wainscot wall={wall} accent={accent} />
      <Window x={650} y={440} w={260} h={250} glass={light(accent, 0.55)} />
      {/* монитор с пульсом */}
      <rect x={420} y={470} width={150} height={104} rx={12} fill={dark(METAL, 0.45)} />
      <rect x={432} y={482} width={126} height={80} rx={6} fill="#1f3a34" />
      <path d="M440 524 h28 l10 -26 l14 50 l12 -34 l8 10 h36" stroke="#7fe0a0" strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* штора слева */}
      <rect x={0} y={428} width={320} height={10} rx={5} fill={METAL} />
      <path d={`M0 438 H230 V1110 Q215 1132 200 1110 Q185 1132 170 1110 Q155 1132 140 1110 Q125 1132 110 1110 Q95 1132 80 1110 Q65 1132 50 1110 Q35 1132 20 1110 Q10 1124 0 1110 Z`} fill={curtain} />
      {[40, 100, 160, 215].map((xx) => (
        <rect key={xx} x={xx} y={438} width={16} height={672} fill={dark(curtain, 0.08)} />
      ))}
      {/* капельница */}
      <rect x={986} y={520} width={8} height={FLOOR_Y - 520} fill={dark(METAL, 0.2)} />
      <rect x={940} y={FLOOR_Y - 14} width={100} height={14} rx={7} fill={dark(METAL, 0.3)} />
      <rect x={960} y={516} width={60} height={8} rx={4} fill={dark(METAL, 0.2)} />
      <rect x={942} y={530} width={50} height={86} rx={16} fill={light(accent, 0.75)} opacity={0.95} />
      <rect x={950} y={570} width={34} height={38} rx={10} fill={light(accent, 0.35)} />
      <path d={`M967 616 Q960 760 900 ${bedTop - 10}`} stroke={light(METAL, 0.4)} strokeWidth={5} fill="none" />
      {/* кровать */}
      <rect x={bx + bw - 34} y={FLOOR_Y - 400} width={34} height={360} rx={12} fill={METAL} />
      <rect x={bx} y={FLOOR_Y - 320} width={30} height={280} rx={12} fill={METAL} />
      <rect x={bx + 10} y={bedTop + 50} width={bw - 20} height={22} fill={dark(METAL, 0.15)} />
      <rect x={bx + 20} y={bedTop + 70} width={12} height={130} fill={METAL} />
      <rect x={bx + bw - 50} y={bedTop + 70} width={12} height={130} fill={METAL} />
      <circle cx={bx + 26} cy={FLOOR_Y - 18} r={18} fill={INK} />
      <circle cx={bx + bw - 44} cy={FLOOR_Y - 18} r={18} fill={INK} />
      <rect x={bx + 20} y={bedTop} width={bw - 50} height={54} rx={14} fill={WHITE} />
      <rect x={bx + 330} y={bedTop - 34} width={110} height={44} rx={20} fill={WHITE} />
      <rect x={bx + 26} y={bedTop - 6} width={300} height={66} rx={18} fill={accent} />
      <rect x={bx + 280} y={bedTop - 6} width={46} height={66} rx={14} fill={light(accent, 0.5)} />
    </>
  );
};

/** Палата с мягкими стенами, решётка на окне, скамья. */
const Padded = ({ wall, floor, accent }: { wall: string; floor: string; accent: string }) => {
  const pad = mix(wall, "#f6f0e2", 0.55);
  const seam = dark(wall, 0.05);
  const S = 135;
  const cols = Math.ceil(W / S);
  const rows = Math.ceil(FLOOR_Y / S);
  return (
    <>
      <Room wall={seam} floor={dark(floor, 0.05)} />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect key={`${r}-${c}`} x={c * S + 5} y={FLOOR_Y - (r + 1) * S + 5} width={S - 10} height={S - 10} rx={34} fill={pad} />
        )),
      )}
      {Array.from({ length: rows + 1 }).map((_, r) =>
        Array.from({ length: cols + 1 }).map((_, c) => (
          <circle key={`b${r}-${c}`} cx={c * S} cy={FLOOR_Y - r * S} r={7} fill={dark(wall, 0.18)} />
        )),
      )}
      <rect x={0} y={FLOOR_Y - 18} width={W} height={18} fill="#00000022" />
      {/* луч света из окна */}
      <path d={`M430 612 L650 612 L800 ${FLOOR_Y + 60} L300 ${FLOOR_Y + 60} Z`} fill="#ffffff" opacity={0.13} />
      {/* окно с решёткой */}
      <rect x={410} y={440} width={260} height={180} rx={10} fill={dark(METAL, 0.35)} />
      <rect x={426} y={456} width={228} height={148} rx={4} fill={light(accent, 0.55)} />
      <circle cx={600} cy={500} r={22} fill="#f5e6a8" />
      {[466, 512, 558, 604].map((xx) => (
        <rect key={xx} x={xx} y={456} width={12} height={148} fill={dark(METAL, 0.45)} />
      ))}
      <rect x={426} y={524} width={228} height={12} fill={dark(METAL, 0.45)} />
      {/* скамья */}
      <rect x={730} y={FLOOR_Y - 150} width={300} height={30} rx={12} fill={WOOD} />
      <rect x={750} y={FLOOR_Y - 122} width={22} height={122} fill={dark(WOOD, 0.3)} />
      <rect x={988} y={FLOOR_Y - 122} width={22} height={122} fill={dark(WOOD, 0.3)} />
      <rect x={750} y={FLOOR_Y - 60} width={260} height={12} fill={dark(WOOD, 0.3)} />
      {/* подушка на полу и кружка */}
      <rect x={60} y={FLOOR_Y - 60} width={160} height={70} rx={30} fill={light(accent, 0.6)} />
      <rect x={90} y={FLOOR_Y - 46} width={100} height={8} rx={4} fill={light(accent, 0.35)} />
    </>
  );
};

export const Bolnitsa = ({ palette, variant }: BackdropProps) => {
  const { wall, floor, accent } = palette;
  return (
    <Canvas>
      {variant === "hospital" ? (
        <Ward wall={wall} floor={floor} accent={accent} />
      ) : variant === "madhouse" ? (
        <Padded wall={wall} floor={floor} accent={accent} />
      ) : (
        <Office wall={wall} floor={floor} accent={accent} />
      )}
    </Canvas>
  );
};
