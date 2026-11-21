import { Canvas, Room, Door, W, H, FLOOR_Y, type BackdropProps, type Palette } from "./parts";
import { seatTopY } from "../world/depth";
import {
  mix, dark, light, Wardrobe, WOOD,
  VShade, Glow, Ceiling, Skirting, FloorBoards, FloorTiles, FloorRug, FloorShadow, WindowView, Curtains, PhotoFrame, CeilingLamp,
} from "./gostinaya";

/** Картина «мишки в лесу»: сосны, утро, медвежата. */
const BearsPicture = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <g>
    <rect x={x + 6} y={y + 8} width={w} height={h} rx={4} fill="#00000025" />
    <rect x={x} y={y} width={w} height={h} rx={4} fill="#c9a24a" />
    <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} fill="#a8c4a0" />
    <rect x={x + 12} y={y + h * 0.66} width={w - 24} height={h * 0.34 - 12} fill="#6a7f4a" />
    {[0.18, 0.4, 0.75, 0.9].map((t, i) => (
      <g key={t}>
        <rect x={x + w * t - 4} y={y + 20} width={8} height={h * 0.62} fill="#5a4030" />
        <path d={`M${x + w * t} ${y + 18} l${18 + i * 2} ${h * 0.4} h${-36 - i * 4} Z`} fill="#3f5a3a" />
      </g>
    ))}
    <path d={`M${x + w * 0.5} ${y + h * 0.66} l${w * 0.18} ${-h * 0.18} l8 4 l${-w * 0.16} ${h * 0.18} Z`} fill="#7a5a40" />
    {[0.42, 0.58, 0.66].map((t, i) => (
      <g key={t}>
        <ellipse cx={x + w * t} cy={y + h * 0.72} rx={w * 0.05} ry={h * 0.06} fill="#4a3020" />
        <circle cx={x + w * t + (i % 2 ? 6 : -6)} cy={y + h * 0.65} r={w * 0.03} fill="#4a3020" />
      </g>
    ))}
  </g>
);

/* ---------- спальня ---------- */
const Bedroom = ({ palette: p }: { palette: Palette }) => {
  const curtain = dark(p.wall, 0.35);
  const blanket = mix(p.accent, "#c8553d", 0.35);
  const dy = seatTopY(1) - 1140;
  return (
    <>
      <Room wall={p.wall} floor={p.floor} />
      {/* обои с ромбиками и веточками */}
      {Array.from({ length: 10 }).map((_, c) => <rect key={`s${c}`} x={c * 110 + 20} y={0} width={4} height={FLOOR_Y} fill={dark(p.wall, 0.04)} />)}
      {Array.from({ length: 10 }).flatMap((_, c) =>
        Array.from({ length: 8 }).map((__, r) => (
          <g key={`${c}-${r}`}>
            <rect x={40 + c * 110 + (r % 2) * 55} y={470 + r * 100} width={14} height={14} fill={light(p.wall, 0.16)} transform={`rotate(45 ${47 + c * 110 + (r % 2) * 55} ${477 + r * 100})`} />
            <circle cx={47 + c * 110 + (r % 2) * 55} cy={527 + r * 100} r={3} fill={dark(p.wall, 0.08)} />
          </g>
        )),
      )}
      <VShade y={0} h={700} from={0.2} to={0} />
      <Ceiling color={light(p.wall, 0.25)} h={70} />
      <FloorBoards color={p.floor} step={60} t={0.12} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.32} />
      <Skirting color={dark(p.wall, 0.3)} />
      {/* выключенный плафон под потолком */}
      <CeilingLamp x={600} y={82} len={30} kind="dish" color={light(p.wall, 0.4)} r={10} o={0} />
      {/* дверь слева (метка door) с халатом на крючке */}
      <rect x={6} y={FLOOR_Y - 538} width={208} height={538} rx={6} fill={light(p.wall, 0.25)} />
      <Door x={20} w={180} color={dark(WOOD, 0.05)} />
      <circle cx={150} cy={FLOOR_Y - 440} r={7} fill="#c9a24a" />
      <path d="M150 750 q-40 10 -44 70 l-6 200 h96 l-4 -200 q-2 -60 -42 -70 Z" fill={light(p.accent, 0.2)} />
      <rect x={104} y={880} width={92} height={14} fill={dark(p.accent, 0.1)} />
      {/* ночное окно: лунный свет, шторы на подхватах */}
      <WindowView x={470} y={460} w={260} h={300} night frame={light(p.wall, 0.5)} sill={false} />
      <Curtains x0={420} x1={780} y={446} h={380} color={curtain} tie={p.accent} part={0.26} />
      <path d={`M500 ${FLOOR_Y} L700 ${FLOOR_Y} L860 ${H} L260 ${H} Z`} fill="#cfe0ff" opacity={0.06} />
      {/* картина с мишками и семейные фото */}
      <BearsPicture x={226} y={520} w={170} h={118} />
      <PhotoFrame x={800} y={560} w={72} h={92} frame="#c9a24a" kind="couple" oval />
      <PhotoFrame x={808} y={670} w={58} h={70} frame={WOOD} kind="portrait" />
      {/* кровать: изголовье у стены, низкая; передний край одеяла чуть ниже высоты сиденья дальнего плана (метки bed, bed-1, bed-2) */}
      <FloorShadow cx={600} w={620} o={0.3} />
      <g transform={`translate(60 ${dy})`}>
        <path d={`M260 ${FLOOR_Y - 120} L260 950 Q260 900 310 900 L770 900 Q820 900 820 950 L820 ${FLOOR_Y - 120} Z`} fill={WOOD} />
        <path d={`M300 ${FLOOR_Y - 120} L300 960 Q300 930 330 930 L750 930 Q780 930 780 960 L780 ${FLOOR_Y - 120} Z`} fill={dark(WOOD, 0.08)} />
        <circle cx={540} cy={915} r={12} fill="#c9a24a" />
        <rect x={290} y={930} width={500} height={60} rx={22} fill={dark(WOOD, 0.1)} />
        <rect x={300} y={960} width={220} height={74} rx={30} fill="#f4efe6" />
        <rect x={560} y={960} width={220} height={74} rx={30} fill="#f4efe6" />
        <path d="M320 980 q90 -14 180 0" stroke="#e0d8c8" strokeWidth={4} fill="none" />
        <path d="M580 980 q90 -14 180 0" stroke="#e0d8c8" strokeWidth={4} fill="none" />
        <rect x={250} y={1020} width={580} height={36} rx={14} fill="#f4efe6" />
        <rect x={250} y={1046} width={580} height={110} rx={18} fill={blanket} />
        <rect x={250} y={1046} width={580} height={22} rx={10} fill={light(blanket, 0.15)} />
        {/* узор пододеяльника */}
        {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={290 + i * 62} cy={1110} r={8} fill={light(blanket, 0.25)} />)}
        <rect x={380} y={1090} width={70} height={66} rx={6} fill={dark(blanket, 0.08)} />
        <rect x={630} y={1090} width={70} height={66} rx={6} fill={dark(blanket, 0.08)} />
        <rect x={262} y={1150} width={556} height={26} rx={8} fill={dark(WOOD, 0.15)} />
        {/* кот спит в ногах */}
        <ellipse cx={800} cy={1036} rx={34} ry={18} fill="#8a8a8a" />
        <circle cx={776} cy={1030} r={14} fill="#8a8a8a" />
        <path d="M766 1020 l4 -12 l6 10 Z M780 1018 l6 -12 l4 12 Z" fill="#8a8a8a" />
        <path d="M832 1040 q14 0 8 -16" stroke="#8a8a8a" strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d="M770 1032 h8 M782 1032 h8" stroke="#3a3a3a" strokeWidth={2} />
      </g>
      <rect x={336} y={1182 + dy} width={22} height={FLOOR_Y - 1182 - dy} fill={dark(WOOD, 0.35)} />
      <rect x={842} y={1182 + dy} width={22} height={FLOOR_Y - 1182 - dy} fill={dark(WOOD, 0.35)} />
      {/* тумбочка с лампой, будильником, книгой и очками */}
      <Glow cx={260} cy={890} r={260} color={light(p.accent, 0.3)} opacity={0.4} />
      <FloorShadow cx={259} w={130} o={0.25} />
      <g transform="translate(120 0) scale(0.82 1)">
        <rect x={100} y={FLOOR_Y - 180} width={140} height={180} rx={10} fill={WOOD} />
        <rect x={114} y={FLOOR_Y - 160} width={112} height={60} rx={6} fill={dark(WOOD, 0.1)} />
        <rect x={114} y={FLOOR_Y - 90} width={112} height={70} rx={6} fill={dark(WOOD, 0.1)} />
        <circle cx={170} cy={FLOOR_Y - 130} r={7} fill="#e0b030" />
        <circle cx={170} cy={FLOOR_Y - 56} r={7} fill="#e0b030" />
        <rect x={164} y={FLOOR_Y - 250} width={12} height={70} fill="#4a3020" />
        <ellipse cx={170} cy={FLOOR_Y - 184} rx={36} ry={10} fill="#4a3020" />
        <path d={`M120 ${FLOOR_Y - 244} L220 ${FLOOR_Y - 244} L196 ${FLOOR_Y - 320} L144 ${FLOOR_Y - 320} Z`} fill={p.accent} />
        <path d={`M120 ${FLOOR_Y - 244} L220 ${FLOOR_Y - 244} L216 ${FLOOR_Y - 254} L124 ${FLOOR_Y - 254} Z`} fill={light(p.accent, 0.4)} />
      </g>
      <circle cx={298} cy={FLOOR_Y - 206} r={20} fill="#c8553d" />
      <circle cx={298} cy={FLOOR_Y - 206} r={14} fill="#f6f1e6" />
      <path d="M298 978 v8 h6" stroke="#2b2b2b" strokeWidth={3} fill="none" />
      <circle cx={286} cy={FLOOR_Y - 228} r={6} fill="#c8553d" />
      <circle cx={310} cy={FLOOR_Y - 228} r={6} fill="#c8553d" />
      <rect x={204} y={FLOOR_Y - 194} width={60} height={12} rx={2} fill="#4a6fa5" />
      <rect x={208} y={FLOOR_Y - 204} width={52} height={10} rx={2} fill="#c9a24a" />
      <path d="M214 980 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M234 980 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M230 980 h4" stroke="#2b2b2b" strokeWidth={3} fill="none" />
      {/* тапочки и прикроватный коврик */}
      <FloorRug x0={340} x1={560} y0={1198} y1={1250} color={light(p.accent, 0.15)} border={dark(p.accent, 0.1)} />
      <ellipse cx={420} cy={FLOOR_Y + 22} rx={30} ry={12} fill="#e8a0b0" />
      <ellipse cx={466} cy={FLOOR_Y + 26} rx={30} ry={12} fill="#e8a0b0" />
      {/* шкаф с зеркалом, чемоданом и коробкой сверху */}
      <FloorShadow cx={980} w={210} o={0.3} />
      <Wardrobe x={890} w={180} h={680} color={dark(WOOD, 0.05)} />
      <rect x={986} y={FLOOR_Y - 616} width={68} height={400} rx={6} fill="#cfe2ea" />
      <path d="M996 640 l40 -40 v20 l-40 40 Z" fill="#ffffff" opacity={0.6} />
      <rect x={900} y={FLOOR_Y - 760} width={130} height={80} rx={10} fill="#8a5a3a" />
      <rect x={900} y={FLOOR_Y - 730} width={130} height={10} fill="#6b4429" />
      <rect x={950} y={FLOOR_Y - 776} width={30} height={16} rx={6} fill="#4a3020" />
      <ellipse cx={1010} cy={FLOOR_Y - 772} rx={40} ry={14} fill={light(p.accent, 0.3)} />
    </>
  );
};

/* ---------- ванная ---------- */
const Bathroom = ({ palette: p, noToilet = false }: { palette: Palette; noToilet?: boolean }) => {
  const tile = mix(p.wall, "#ffffff", 0.6);
  const grout = mix(p.wall, "#ffffff", 0.35);
  const enamel = "#f6f3ee";
  const towel = p.accent;
  const curtainC = light(p.accent, 0.5);
  return (
    <>
      <Room wall={p.wall} floor={dark(p.floor, 0.05)} />
      <Ceiling color={light(p.wall, 0.45)} h={70} />
      {/* кафель до потолочной полосы */}
      <rect x={0} y={440} width={W} height={FLOOR_Y - 440} fill={grout} />
      {Array.from({ length: 9 }).flatMap((_, r) =>
        Array.from({ length: 12 }).map((__, c) => <rect key={`${r}-${c}`} x={c * 90 + 3} y={443 + r * 84} width={84} height={78} rx={6} fill={r === 3 ? light(p.accent, 0.35) : tile} />),
      )}
      {Array.from({ length: 12 }).map((_, c) => <rect key={`h${c}`} x={c * 90 + 12} y={450} width={30} height={6} rx={3} fill="#ffffff" opacity={0.5} />)}
      <rect x={0} y={428} width={W} height={14} fill={dark(p.wall, 0.15)} />
      <VShade y={0} h={800} from={0.18} to={0} />
      {/* пол — мелкая плитка */}
      <FloorTiles a={light(p.floor, 0.1)} b={light(p.floor, 0.18)} step={80} d={0.07} grout={dark(p.floor, 0.05)} />
      <VShade y={FLOOR_Y} h={H - FLOOR_Y} from={0} to={0.3} />
      <CeilingLamp x={540} y={82} len={20} kind="dish" color="#f6f1e6" r={300} o={0.3} />
      {/* вентиляционная решётка */}
      <rect x={760} y={470} width={90} height={70} rx={6} fill="#e6e2d8" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={772} y={482 + i * 14} width={66} height={6} rx={3} fill="#9a968e" />)}
      {/* трубы у пола */}
      <rect x={0} y={1120} width={W} height={14} rx={7} fill="#c9c4b8" />
      <rect x={0} y={1146} width={W} height={10} rx={5} fill="#b9b4a8" />
      <g transform="translate(10 0) scale(0.82 1)">
        {/* душ и шторка */}
        <rect x={70} y={620} width={14} height={380} fill="#b9b4aa" />
        <path d="M50 610 L140 610 L120 650 L70 650 Z" fill="#b9b4aa" transform="rotate(-10 95 630)" />
        <rect x={60} y={620} width={110} height={10} rx={5} fill="#b9b4aa" />
        <rect x={0} y={560} width={480} height={10} rx={5} fill="#b9b4aa" />
        <path d="M0 566 h110 q-10 160 10 280 q-30 120 -10 160 h-110 Z" fill={curtainC} />
        {[24, 62, 96].map((x) => <rect key={x} x={x} y={566} width={8} height={430} fill={dark(curtainC, 0.08)} />)}
        {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={16 + (i % 3) * 34} cy={600 + Math.floor(i / 3) * 90} r={8} fill={light(p.accent, 0.15)} />)}
        {/* полочка с флаконами над ванной */}
        <rect x={210} y={800} width={190} height={12} rx={4} fill="#e6e2d8" />
        {[["#4a8ab0", 230, 64], ["#e0b030", 270, 50], ["#c8553d", 310, 70], ["#5b8c5a", 352, 44]].map(([c, x, h]) => (
          <g key={x as number}>
            <rect x={x as number} y={800 - (h as number)} width={30} height={h as number} rx={8} fill={c as string} />
            <rect x={(x as number) + 9} y={792 - (h as number)} width={12} height={10} rx={3} fill={dark(c as string, 0.2)} />
          </g>
        ))}
        {/* ванна на ножках */}
        <path d={`M20 990 L460 990 L440 1110 Q430 1150 390 1150 L90 1150 Q50 1150 40 1110 Z`} fill={enamel} />
        <path d={`M40 1010 L440 1010 L432 1060 L48 1060 Z`} fill="#ffffff" opacity={0.5} />
        <rect x={10} y={978} width={460} height={26} rx={13} fill={light(enamel, 0.4)} />
        {[90, 160, 240, 320, 390].map((x, i) => <circle key={x} cx={x} cy={978 - (i % 2) * 14} r={26 + (i % 3) * 6} fill="#ffffff" />)}
        {[120, 200, 280].map((x, i) => <circle key={x} cx={x} cy={930 - i * 14} r={8} fill="#ffffff" opacity={0.8} />)}
        <path d={`M70 1150 L60 ${FLOOR_Y} L96 ${FLOOR_Y} L110 1150 Z`} fill="#e0b030" />
        <path d={`M370 1150 L384 ${FLOOR_Y} L420 ${FLOOR_Y} L410 1150 Z`} fill="#e0b030" />
        {/* уточка */}
        <ellipse cx={424} cy={958} rx={28} ry={18} fill="#f2c230" />
        <circle cx={438} cy={934} r={15} fill="#f2c230" />
        <path d="M450 932 L466 937 L450 942 Z" fill="#e07a30" />
        <circle cx={440} cy={930} r={3} fill="#2b1d14" />
      </g>
      <FloorShadow cx={200} w={380} o={0.2} />
      {/* таз на гвозде */}
      <circle cx={420} cy={498} r={6} fill="#6a6a6a" />
      <ellipse cx={420} cy={560} rx={70} ry={62} fill="#9aa5ad" />
      <ellipse cx={420} cy={560} rx={54} ry={46} fill="#b8c2c8" />
      {/* раковина и зеркало — левее, рядом унитаз */}
      <g transform="translate(-340 0)">
        <rect x={790} y={812} width={180} height={14} rx={6} fill="#f6f3ee" />
        <rect x={810} y={770} width={28} height={42} rx={8} fill={light(p.accent, 0.2)} />
        <rect x={816} y={740} width={6} height={40} rx={3} fill="#4a8ab0" />
        <rect x={826} y={744} width={6} height={36} rx={3} fill="#c8553d" />
        <rect x={930} y={790} width={30} height={22} rx={8} fill="#f2c2a0" />
        <rect x={880} y={796} width={40} height={16} rx={6} fill="#e8e0f0" />
        <ellipse cx={880} cy={640} rx={92} ry={118} fill="#e0b030" />
        <ellipse cx={880} cy={640} rx={78} ry={104} fill="#d6ecf5" />
        <rect x={838} y={570} width={16} height={86} rx={8} fill="#ffffff" opacity={0.7} transform="rotate(28 846 613)" />
        <rect x={868} y={866} width={12} height={34} rx={4} fill="#b9b4aa" />
        <path d={`M868 870 L900 870 L900 880 L880 880 Z`} fill="#b9b4aa" />
        <path d="M780 900 L980 900 Q975 980 880 990 Q785 980 780 900 Z" fill={enamel} />
        <rect x={772} y={892} width={216} height={22} rx={11} fill={light(enamel, 0.4)} />
        <path d={`M850 985 L910 985 L926 ${FLOOR_Y} L834 ${FLOOR_Y} Z`} fill={enamel} />
        <rect x={866} y={1000} width={10} height={60} fill="#e6e2d8" />
      </g>
      <FloorShadow cx={540} w={120} o={0.2} />
      {/* дверь между раковиной и унитазом, полотенце и халат на крючках */}
      <Door x={672} w={170} color={light(p.accent, 0.2)} />
      <circle cx={706} cy={FLOOR_Y - 440} r={7} fill="#c9a24a" />
      <path d="M706 750 q-30 10 -30 60 l-4 170 h70 l-4 -170 q0 -50 -32 -60 Z" fill="#f6efe0" />
      <rect x={672} y={860} width={70} height={10} fill={light(p.accent, 0.3)} />
      {/* без встроенного унитаза (вариант bathroom-wide): унитазы ставятся мебелью set (toilet) */}
      {!noToilet && (<>
      {/* высокий бачок с цепочкой над низким унитазом: верх сиденья — на высоте сиденья дальнего плана (метка toilet) */}
      <g transform="translate(76 0)">
        <rect x={846} y={600} width={130} height={80} rx={10} fill={enamel} />
        <rect x={840} y={592} width={142} height={16} rx={6} fill={light(enamel, 0.4)} />
        <rect x={898} y={680} width={16} height={seatTopY(1) - 680} fill="#d8d4c8" />
        <path d="M960 680 v120" stroke="#9a968e" strokeWidth={4} strokeDasharray="6 4" />
        <rect x={952} y={800} width={16} height={34} rx={8} fill={WOOD} />
        <path d={`M812 ${seatTopY(1) + 8} L996 ${seatTopY(1) + 8} Q992 ${seatTopY(1) + 40} 950 ${seatTopY(1) + 46} L952 ${FLOOR_Y} L856 ${FLOOR_Y} L858 ${seatTopY(1) + 46} Q816 ${seatTopY(1) + 40} 812 ${seatTopY(1) + 8} Z`} fill={enamel} />
        <rect x={804} y={seatTopY(1) - 4} width={200} height={20} rx={10} fill={light(p.accent, 0.45)} />
        <rect x={856} y={FLOOR_Y - 10} width={96} height={10} fill="#00000014" />
      </g>
      <FloorShadow cx={980} w={140} o={0.2} />
      {/* рулон бумаги и газета */}
      <rect x={830} y={990} width={10} height={20} fill="#9a968e" />
      <rect x={812} y={1004} width={44} height={44} rx={20} fill="#ffffff" />
      <circle cx={834} cy={1026} r={8} fill="#d8d4c8" />
      <rect x={800} y={1080} width={60} height={70} rx={3} fill="#e8e2d0" transform="rotate(-8 830 1115)" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={808} y={1092 + i * 12} width={44} height={4} fill="#a8a090" transform="rotate(-8 830 1115)" />)}
      </>)}
      {/* полотенце */}
      <circle cx={262} cy={640} r={10} fill="#b9b4aa" />
      <rect x={232} y={644} width={62} height={180} rx={12} fill={towel} />
      <rect x={232} y={780} width={62} height={14} fill={light(towel, 0.4)} />
      {/* коврик */}
      <rect x={130} y={FLOOR_Y + 12} width={240} height={40} rx={20} fill={light(p.accent, 0.3)} />
      {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={150 + i * 30} y={FLOOR_Y + 18} width={10} height={28} rx={5} fill={light(p.accent, 0.45)} />)}
    </>
  );
};

/** Спальня: базовый вид + ванная (bathroom). */
export const Spalnya = ({ palette, variant }: BackdropProps) => (
  <Canvas>{variant === "bathroom" || variant === "bathroom-wide" ? <Bathroom palette={palette} noToilet={variant === "bathroom-wide"} /> : <Bedroom palette={palette} />}</Canvas>
);
