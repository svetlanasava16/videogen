import { Canvas, Room, Plant, FLOOR_Y, W, type BackdropProps, type Palette } from "./parts";

/**
 * Фон «ofis»: кабинет начальника. Варианты (content/locations/ofis.json → bible.variants):
 * tv-studio, police-station, bank / government-office. Остальное — базовый кабинет.
 */

/** Смешать цвет с белым (t>0) или чёрным (t<0). */
const shade = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t)));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};

const WOOD = "#8a5a3a";
const WOOD_D = "#6b4429";
const PAPER = "#f4efe2";

/** Плинтус и лёгкая панель низа стены. */
const Wainscot = ({ wall, top = 900 }: { wall: string; top?: number }) => (
  <>
    <rect x={0} y={top} width={W} height={FLOOR_Y - top} fill={shade(wall, -0.08)} />
    <rect x={0} y={top - 10} width={W} height={10} fill={shade(wall, -0.16)} />
  </>
);

/** Потолочный светильник-панель (выше плашки рассказчика). */
const CeilingLight = ({ x, w = 300 }: { x: number; w?: number }) => (
  <g>
    <rect x={x} y={0} width={w} height={34} rx={6} fill="#f7f4ea" />
    <rect x={x} y={30} width={w} height={8} rx={4} fill="#00000014" />
  </g>
);

/** Окно с жалюзи. */
const BlindsWindow = ({ x, y, w, h, wall }: { x: number; y: number; w: number; h: number; wall: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={10} fill="#f2ede2" />
    <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} rx={6} fill="#bfe0f2" />
    {/* городские крыши вдали */}
    <path d={`M${x + 16} ${y + h - 16} v-90 h60 v40 h50 v-70 h70 v55 h${w - 32 - 180} v${65 + 0} Z`} fill="#a6cde3" />
    {/* жалюзи: опущены на верхние 55% */}
    <rect x={x + 10} y={y + 6} width={w - 20} height={22} rx={6} fill={shade(wall, -0.25)} />
    {Array.from({ length: 9 }).map((_, i) => (
      <rect key={i} x={x + 18} y={y + 30 + i * 20} width={w - 36} height={14} rx={3} fill={i % 2 ? "#ece6d8" : "#e4ddcd"} />
    ))}
    <rect x={x + 22} y={y + 30 + 9 * 20} width={w - 44} height={10} rx={4} fill="#d6cdb8" />
    <rect x={x + w - 46} y={y + 28} width={4} height={220} fill="#b8ad96" />
    <circle cx={x + w - 44} cy={y + 252} r={7} fill="#b8ad96" />
    <rect x={x - 10} y={y + h - 8} width={w + 20} height={18} rx={6} fill="#e7e0d0" />
  </g>
);

/** Рамка с грамотой: печать и строки-полоски без текста. */
const Certificate = ({ x, y, accent }: { x: number; y: number; accent: string }) => (
  <g>
    <rect x={x} y={y} width={170} height={130} rx={6} fill={WOOD} />
    <rect x={x + 12} y={y + 12} width={146} height={106} fill={PAPER} />
    <rect x={x + 34} y={y + 30} width={102} height={10} rx={5} fill={accent} />
    <rect x={x + 30} y={y + 52} width={110} height={6} rx={3} fill="#d5cdbb" />
    <rect x={x + 30} y={y + 66} width={90} height={6} rx={3} fill="#d5cdbb" />
    <circle cx={x + 124} cy={y + 94} r={15} fill="#d9a630" />
    <path d={`M${x + 116} ${y + 104} l-6 18 l10 -6 l4 10 l4 -16 Z`} fill="#c8553d" />
  </g>
);

/** Большой стол начальника с монитором, бумагами и креслом (слева). */
const BossDesk = ({ accent }: { accent: string }) => {
  const top = 965;
  return (
    <g>
      {/* кресло за столом */}
      <rect x={250} y={770} width={170} height={210} rx={40} fill="#2f2a2a" />
      <rect x={268} y={790} width={134} height={60} rx={24} fill="#3d3636" />
      {/* монитор */}
      <rect x={70} y={790} width={190} height={130} rx={12} fill="#2d3640" />
      <rect x={82} y={802} width={166} height={106} rx={6} fill={shade(accent, 0.45)} />
      <rect x={82} y={802} width={166} height={34} fill={shade(accent, 0.6)} />
      <rect x={152} y={920} width={26} height={34} fill="#2d3640" />
      <rect x={120} y={950} width={90} height={15} rx={6} fill="#2d3640" />
      {/* бумаги и кружка */}
      <rect x={300} y={935} width={110} height={30} rx={3} fill={PAPER} />
      <rect x={306} y={925} width={104} height={12} rx={3} fill="#e6ddc8" />
      <rect x={296} y={915} width={110} height={12} rx={3} fill={PAPER} />
      <rect x={430} y={922} width={34} height={43} rx={8} fill={accent} />
      <path d="M464 932 q18 0 18 14 q0 12 -18 12" stroke={accent} strokeWidth={7} fill="none" />
      {/* столешница и тумба */}
      <rect x={30} y={top} width={490} height={30} rx={8} fill={WOOD} />
      <rect x={46} y={top + 30} width={458} height={FLOOR_Y - top - 30} fill={WOOD_D} />
      <rect x={66} y={top + 50} width={180} height={70} rx={6} fill="#00000020" />
      <rect x={66} y={top + 132} width={180} height={70} rx={6} fill="#00000020" />
      <rect x={136} y={top + 80} width={40} height={10} rx={5} fill="#d9a630" />
      <rect x={136} y={top + 162} width={40} height={10} rx={5} fill="#d9a630" />
      <rect x={274} y={top + 50} width={210} height={152} rx={6} fill="#00000014" />
    </g>
  );
};

const BaseOffice = ({ palette }: { palette: Palette }) => (
  <>
    <Room wall={palette.wall} floor={palette.floor} />
    <Wainscot wall={palette.wall} />
    <CeilingLight x={140} />
    <CeilingLight x={640} />
    <Certificate x={120} y={460} accent={palette.accent} />
    <BlindsWindow x={600} y={450} w={340} h={360} wall={palette.wall} />
    <BossDesk accent={palette.accent} />
    <Plant x={985} scale={1.15} pot={palette.accent} />
  </>
);

/* ---------- tv-studio ---------- */

const StudioLight = ({ x, flip = false }: { x: number; flip?: boolean }) => {
  const d = flip ? -1 : 1;
  return (
    <g>
      <rect x={x - 6} y={760} width={12} height={FLOOR_Y - 770} fill="#2a2a30" />
      <path d={`M${x} ${FLOOR_Y - 120} L${x - 70} ${FLOOR_Y} M${x} ${FLOOR_Y - 120} L${x + 70} ${FLOOR_Y}`} stroke="#2a2a30" strokeWidth={10} />
      <g transform={`rotate(${25 * d} ${x} 740)`}>
        <rect x={x - 70} y={690} width={140} height={110} rx={18} fill="#3a3a44" />
        <rect x={x - 54} y={700} width={108} height={90} rx={12} fill="#fff4cf" />
      </g>
    </g>
  );
};

const TvStudio = ({ palette }: { palette: Palette }) => {
  const back = shade(palette.accent, -0.15);
  return (
    <>
      <Room wall="#2b2f3a" floor="#3a3e4a" />
      {/* потолочная ферма с прожекторами */}
      <rect x={0} y={40} width={W} height={22} fill="#1d2028" />
      {[180, 420, 660, 900].map((x) => (
        <g key={x}>
          <rect x={x - 6} y={62} width={12} height={30} fill="#1d2028" />
          <rect x={x - 34} y={88} width={68} height={50} rx={12} fill="#3a3a44" />
          <rect x={x - 24} y={130} width={48} height={10} rx={4} fill="#fff4cf" />
        </g>
      ))}
      {/* цветной задник */}
      <rect x={110} y={440} width={860} height={560} rx={60} fill={back} />
      <circle cx={540} cy={720} r={230} fill={shade(palette.accent, 0.12)} />
      <circle cx={540} cy={720} r={150} fill={shade(palette.accent, 0.25)} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={150} y={480 + i * 34} width={110 - i * 22} height={14} rx={7} fill={shade(palette.accent, 0.3)} />
      ))}
      {/* лучи света */}
      <path d="M420 140 L250 1190 L560 1190 Z" fill="#fff4cf" opacity={0.07} />
      <path d="M660 140 L520 1190 L840 1190 Z" fill="#fff4cf" opacity={0.07} />
      {/* дикторский стол с микрофоном */}
      <path d="M200 980 Q540 940 880 980 L860 1190 L220 1190 Z" fill="#e8e4dc" />
      <path d="M190 968 Q540 926 890 968 L890 994 Q540 954 190 994 Z" fill={palette.accent} />
      <rect x={470} y={1040} width={140} height={60} rx={10} fill={shade(palette.accent, -0.1)} />
      <rect x={612} y={880} width={10} height={80} rx={4} fill="#2a2a30" />
      <rect x={598} y={950} width={38} height={14} rx={6} fill="#2a2a30" />
      <rect x={603} y={846} width={28} height={50} rx={14} fill="#4a4a54" />
      <rect x={300} y={936} width={90} height={20} rx={3} fill={PAPER} />
      <StudioLight x={70} />
      <StudioLight x={1010} flip />
    </>
  );
};

/* ---------- police-station ---------- */

const WantedPoster = ({ x, y, tilt = 0, face = "#8a7a66" }: { x: number; y: number; tilt?: number; face?: string }) => (
  <g transform={`rotate(${tilt} ${x + 60} ${y + 75})`}>
    <rect x={x} y={y} width={120} height={150} rx={4} fill="#efe2bf" />
    <rect x={x + 30} y={y + 14} width={60} height={12} rx={6} fill="#b4452f" />
    <circle cx={x + 60} cy={y + 66} r={24} fill={face} />
    <path d={`M${x + 24} ${y + 128} q36 -48 72 0 Z`} fill={face} />
    <rect x={x + 28} y={y + 134} width={64} height={6} rx={3} fill="#cdbf9c" />
    <circle cx={x + 60} cy={y + 8} r={6} fill="#c8553d" />
  </g>
);

const BarredDoor = ({ x }: { x: number }) => {
  const y = FLOOR_Y - 560;
  const w = 260;
  return (
    <g>
      <rect x={x - 16} y={y - 16} width={w + 32} height={576} rx={8} fill="#5d6870" />
      <rect x={x} y={y} width={w} height={560} fill="#3a4148" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={x + 18 + i * 44} y={y} width={12} height={560} rx={6} fill="#9aa5ad" />
      ))}
      <rect x={x} y={y + 120} width={w} height={14} fill="#9aa5ad" />
      <rect x={x} y={y + 380} width={w} height={14} fill="#9aa5ad" />
      <rect x={x + 10} y={y + 260} width={46} height={60} rx={8} fill="#7d878f" />
      <circle cx={x + 33} cy={y + 290} r={8} fill="#3a4148" />
    </g>
  );
};

const PoliceStation = ({ palette }: { palette: Palette }) => (
  <>
    <Room wall={palette.wall} floor={palette.floor} />
    <Wainscot wall={palette.wall} top={880} />
    <rect x={0} y={860} width={W} height={20} fill={palette.accent} />
    <CeilingLight x={120} />
    <CeilingLight x={620} />
    {/* пробковая доска с ориентировками */}
    <rect x={90} y={445} width={470} height={210} rx={10} fill="#b98a5a" />
    <rect x={102} y={457} width={446} height={186} rx={6} fill="#c99c6a" />
    <WantedPoster x={124} y={472} tilt={-4} />
    <WantedPoster x={264} y={470} tilt={3} face="#6f6255" />
    <WantedPoster x={404} y={474} tilt={-2} face="#94826c" />
    {/* часы */}
    <circle cx={690} cy={530} r={56} fill="#f4f1ea" />
    <circle cx={690} cy={530} r={56} fill="none" stroke="#3a4148" strokeWidth={10} />
    <rect x={686} y={492} width={8} height={42} rx={4} fill="#3a4148" />
    <rect x={688} y={526} width={34} height={8} rx={4} fill="#3a4148" />
    <BarredDoor x={790} />
    {/* дежурный стол слева */}
    <rect x={30} y={985} width={330} height={26} rx={6} fill="#5d6870" />
    <rect x={44} y={1011} width={302} height={179} fill="#4a545c" />
    <rect x={70} y={930} width={80} height={55} rx={6} fill="#2b3036" />
    <rect x={80} y={940} width={60} height={30} rx={4} fill="#6aa0c8" />
    <rect x={200} y={956} width={100} height={29} rx={3} fill={PAPER} />
    <rect x={250} y={900} width={10} height={60} fill="#2b3036" transform="rotate(-20 255 960)" />
    <path d="M222 880 l60 0 l-10 34 l-40 0 Z" fill={palette.accent} transform="rotate(-20 252 900)" />
  </>
);

/* ---------- bank / government-office ---------- */

const Stamp = ({ x, color }: { x: number; color: string }) => (
  <g>
    <rect x={x - 26} y={952} width={52} height={14} rx={4} fill={color} />
    <rect x={x - 8} y={918} width={16} height={36} rx={4} fill="#5a4030" />
    <circle cx={x} cy={914} r={14} fill="#5a4030" />
  </g>
);

const Stanchion = ({ x }: { x: number }) => (
  <g fill="#c9a24a">
    <ellipse cx={x} cy={FLOOR_Y - 4} rx={34} ry={10} />
    <rect x={x - 6} y={FLOOR_Y - 190} width={12} height={186} />
    <circle cx={x} cy={FLOOR_Y - 194} r={12} />
  </g>
);

const BankCounter = ({ palette }: { palette: Palette }) => {
  const top = 960;
  const glass = "#d8ecf4";
  return (
    <>
      <Room wall={palette.wall} floor={palette.floor} />
      <CeilingLight x={80} w={260} />
      <CeilingLight x={410} w={260} />
      <CeilingLight x={740} w={260} />
      {/* часы над окошками */}
      <circle cx={540} cy={500} r={52} fill="#f4f1ea" />
      <circle cx={540} cy={500} r={52} fill="none" stroke={palette.accent} strokeWidth={10} />
      <rect x={536} y={466} width={8} height={38} rx={4} fill="#333" />
      <rect x={538} y={496} width={30} height={8} rx={4} fill="#333" />
      {/* перегородка с окошками */}
      <rect x={0} y={590} width={W} height={24} fill={shade(palette.accent, -0.1)} />
      {[0, 1, 2].map((i) => {
        const x = 20 + i * 350;
        return (
          <g key={i}>
            <rect x={x} y={614} width={340} height={top - 614} fill={shade(palette.wall, -0.12)} />
            <rect x={x + 30} y={640} width={280} height={top - 640} rx={10} fill={glass} />
            <path d={`M${x + 120} ${top} v-70 a50 50 0 0 1 100 0 v70 Z`} fill={shade(palette.wall, -0.2)} />
            <rect x={x + 120} y={650} width={100} height={36} rx={6} fill={palette.accent} />
            <rect x={x + 60} y={660} width={30} height={200} rx={6} fill="#ffffff55" />
          </g>
        );
      })}
      {/* стойка */}
      <rect x={0} y={top} width={W} height={26} fill="#e8e1d2" />
      <rect x={0} y={top + 26} width={W} height={FLOOR_Y - top - 26} fill={shade(palette.wall, -0.22)} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={50 + i * 350} y={top + 60} width={280} height={110} rx={8} fill="#00000014" />
      ))}
      <Stamp x={110} color="#c8553d" />
      <Stamp x={170} color={palette.accent} />
      <rect x={760} y={940} width={110} height={20} rx={3} fill={PAPER} />
      <rect x={764} y={930} width={104} height={12} rx={3} fill="#e6ddc8" />
      {/* ограждение очереди */}
      <Stanchion x={60} />
      <Stanchion x={250} />
      <path d={`M60 ${FLOOR_Y - 186} Q155 ${FLOOR_Y - 120} 250 ${FLOOR_Y - 186}`} stroke="#b4452f" strokeWidth={14} fill="none" strokeLinecap="round" />
    </>
  );
};

export const Ofis = ({ palette, variant }: BackdropProps) => (
  <Canvas>
    {variant === "tv-studio" ? (
      <TvStudio palette={palette} />
    ) : variant === "police-station" ? (
      <PoliceStation palette={palette} />
    ) : variant === "bank" || variant === "government-office" ? (
      <BankCounter palette={palette} />
    ) : (
      <BaseOffice palette={palette} />
    )}
  </Canvas>
);
