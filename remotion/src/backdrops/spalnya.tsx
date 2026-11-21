import { Canvas, Room, Window, Door, Rug, W, FLOOR_Y, type BackdropProps, type Palette } from "./parts";
import { seatTopY } from "../world/depth";
import { mix, dark, light, Plinth, Wardrobe, WOOD } from "./gostinaya";

/* ---------- спальня ---------- */
const Bedroom = ({ palette: p }: { palette: Palette }) => {
  const curtain = dark(p.wall, 0.35);
  const blanket = mix(p.accent, "#c8553d", 0.35);
  return (
    <>
      <Room wall={p.wall} floor={p.floor} />
      {/* обои с ромбиками */}
      {Array.from({ length: 10 }).flatMap((_, c) =>
        Array.from({ length: 7 }).map((__, r) => (
          <rect key={`${c}-${r}`} x={40 + c * 110 + (r % 2) * 55} y={470 + r * 100} width={14} height={14} fill={light(p.wall, 0.16)} transform={`rotate(45 ${47 + c * 110 + (r % 2) * 55} ${477 + r * 100})`} />
        )),
      )}
      <Plinth color={dark(p.wall, 0.3)} />
      {/* дверь слева (метка door) */}
      <Door x={20} w={180} color={dark(WOOD, 0.05)} />
      {/* ночное окно со шторами над кроватью */}
      <Window x={470} y={460} w={260} h={300} frame={light(p.wall, 0.5)} night />
      <circle cx={530} cy={540} r={4} fill="#f5e6a8" />
      <circle cx={580} cy={600} r={3} fill="#f5e6a8" />
      <rect x={410} y={440} width={380} height={14} rx={7} fill={WOOD} />
      <path d="M420 446 L510 446 Q480 640 530 820 L420 820 Z" fill={curtain} />
      <path d="M780 446 L690 446 Q720 640 670 820 L780 820 Z" fill={curtain} />
      {/* кровать: изголовье у стены, низкая; передний край одеяла чуть ниже высоты сиденья дальнего плана (метки bed, bed-1, bed-2) */}
      <g transform={`translate(60 ${seatTopY(1) - 1140})`}>
        <path d={`M260 ${FLOOR_Y - 120} L260 950 Q260 900 310 900 L770 900 Q820 900 820 950 L820 ${FLOOR_Y - 120} Z`} fill={WOOD} />
        <rect x={290} y={930} width={500} height={60} rx={22} fill={dark(WOOD, 0.1)} />
        <rect x={300} y={960} width={220} height={74} rx={30} fill="#f4efe6" />
        <rect x={560} y={960} width={220} height={74} rx={30} fill="#f4efe6" />
        <rect x={250} y={1020} width={580} height={36} rx={14} fill="#f4efe6" />
        <rect x={250} y={1046} width={580} height={110} rx={18} fill={blanket} />
        <rect x={250} y={1046} width={580} height={22} rx={10} fill={light(blanket, 0.15)} />
        <rect x={380} y={1090} width={70} height={66} rx={6} fill={dark(blanket, 0.08)} />
        <rect x={630} y={1090} width={70} height={66} rx={6} fill={dark(blanket, 0.08)} />
        <rect x={262} y={1150} width={556} height={26} rx={8} fill={dark(WOOD, 0.15)} />
      </g>
      <rect x={336} y={1182 + seatTopY(1) - 1140} width={22} height={FLOOR_Y - 1182 - seatTopY(1) + 1140} fill={dark(WOOD, 0.35)} />
      <rect x={842} y={1182 + seatTopY(1) - 1140} width={22} height={FLOOR_Y - 1182 - seatTopY(1) + 1140} fill={dark(WOOD, 0.35)} />
      {/* тумбочка с лампой между дверью и кроватью */}
      <circle cx={270} cy={900} r={150} fill={p.accent} opacity={0.15} />
      <g transform="translate(120 0) scale(0.82 1)">
        <rect x={100} y={FLOOR_Y - 180} width={140} height={180} rx={10} fill={WOOD} />
        <rect x={114} y={FLOOR_Y - 160} width={112} height={60} rx={6} fill={dark(WOOD, 0.1)} />
        <circle cx={170} cy={FLOOR_Y - 130} r={7} fill="#e0b030" />
        <rect x={164} y={FLOOR_Y - 250} width={12} height={70} fill="#4a3020" />
        <ellipse cx={170} cy={FLOOR_Y - 184} rx={36} ry={10} fill="#4a3020" />
        <path d={`M120 ${FLOOR_Y - 244} L220 ${FLOOR_Y - 244} L196 ${FLOOR_Y - 320} L144 ${FLOOR_Y - 320} Z`} fill={p.accent} />
      </g>
      {/* тапочки */}
      <ellipse cx={420} cy={FLOOR_Y + 14} rx={30} ry={12} fill="#e8a0b0" />
      <ellipse cx={466} cy={FLOOR_Y + 18} rx={30} ry={12} fill="#e8a0b0" />
      <Wardrobe x={890} w={180} h={680} color={dark(WOOD, 0.05)} />
      <Rug cx={600} color={dark(p.wall, 0.2)} w={560} />
    </>
  );
};

/* ---------- ванная ---------- */
const Bathroom = ({ palette: p }: { palette: Palette }) => {
  const tile = mix(p.wall, "#ffffff", 0.6);
  const grout = mix(p.wall, "#ffffff", 0.35);
  const enamel = "#f6f3ee";
  const towel = p.accent;
  return (
    <>
      <Room wall={p.wall} floor={dark(p.floor, 0.05)} />
      {/* кафель до потолочной полосы */}
      <rect x={0} y={440} width={W} height={FLOOR_Y - 440} fill={grout} />
      {Array.from({ length: 9 }).flatMap((_, r) =>
        Array.from({ length: 12 }).map((__, c) => <rect key={`${r}-${c}`} x={c * 90 + 3} y={443 + r * 84} width={84} height={78} rx={6} fill={r === 3 ? light(p.accent, 0.35) : tile} />),
      )}
      <rect x={0} y={428} width={W} height={14} fill={dark(p.wall, 0.15)} />
      <g transform="translate(10 0) scale(0.82 1)">
      {/* душ */}
      <rect x={70} y={620} width={14} height={380} fill="#b9b4aa" />
      <path d="M50 610 L140 610 L120 650 L70 650 Z" fill="#b9b4aa" transform="rotate(-10 95 630)" />
      <rect x={60} y={620} width={110} height={10} rx={5} fill="#b9b4aa" />
      {/* ванна на ножках */}
      <path d={`M20 990 L460 990 L440 1110 Q430 1150 390 1150 L90 1150 Q50 1150 40 1110 Z`} fill={enamel} />
      <rect x={10} y={978} width={460} height={26} rx={13} fill={light(enamel, 0.4)} />
      {[90, 160, 240, 320, 390].map((x, i) => <circle key={x} cx={x} cy={978 - (i % 2) * 14} r={26 + (i % 3) * 6} fill="#ffffff" />)}
      <path d={`M70 1150 L60 ${FLOOR_Y} L96 ${FLOOR_Y} L110 1150 Z`} fill="#e0b030" />
      <path d={`M370 1150 L384 ${FLOOR_Y} L420 ${FLOOR_Y} L410 1150 Z`} fill="#e0b030" />
      {/* уточка */}
      <ellipse cx={424} cy={958} rx={28} ry={18} fill="#f2c230" />
      <circle cx={438} cy={934} r={15} fill="#f2c230" />
      <path d="M450 932 L466 937 L450 942 Z" fill="#e07a30" />
      <circle cx={440} cy={930} r={3} fill="#2b1d14" />
      </g>
      {/* раковина и зеркало — левее, рядом унитаз */}
      <g transform="translate(-340 0)">
      <rect x={790} y={812} width={180} height={14} rx={6} fill="#f6f3ee" />
      <rect x={810} y={770} width={28} height={42} rx={8} fill={light(p.accent, 0.2)} />
      <rect x={816} y={740} width={6} height={40} rx={3} fill="#4a8ab0" />
      <rect x={826} y={744} width={6} height={36} rx={3} fill="#c8553d" />
      <ellipse cx={880} cy={640} rx={92} ry={118} fill="#e0b030" />
      <ellipse cx={880} cy={640} rx={78} ry={104} fill="#d6ecf5" />
      <rect x={838} y={570} width={16} height={86} rx={8} fill="#ffffff" opacity={0.7} transform="rotate(28 846 613)" />
      <rect x={868} y={866} width={12} height={34} rx={4} fill="#b9b4aa" />
      <path d={`M868 870 L900 870 L900 880 L880 880 Z`} fill="#b9b4aa" />
      <path d="M780 900 L980 900 Q975 980 880 990 Q785 980 780 900 Z" fill={enamel} />
      <rect x={772} y={892} width={216} height={22} rx={11} fill={light(enamel, 0.4)} />
      <path d={`M850 985 L910 985 L926 ${FLOOR_Y} L834 ${FLOOR_Y} Z`} fill={enamel} />
      </g>
      {/* дверь между раковиной и унитазом */}
      <Door x={672} w={170} color={light(p.accent, 0.2)} />
      {/* низкий унитаз у правой стены: верх сиденья — на высоте сиденья дальнего плана (метка toilet) */}
      <g transform="translate(76 0)">
      <rect x={846} y={930} width={116} height={150} rx={14} fill={enamel} />
      <rect x={838} y={918} width={132} height={22} rx={10} fill={light(enamel, 0.4)} />
      <circle cx={904} cy={912} r={10} fill="#b9b4aa" />
      <path d={`M812 ${seatTopY(1) + 8} L996 ${seatTopY(1) + 8} Q992 ${seatTopY(1) + 40} 950 ${seatTopY(1) + 46} L952 ${FLOOR_Y} L856 ${FLOOR_Y} L858 ${seatTopY(1) + 46} Q816 ${seatTopY(1) + 40} 812 ${seatTopY(1) + 8} Z`} fill={enamel} />
      <rect x={804} y={seatTopY(1) - 4} width={200} height={20} rx={10} fill={light(p.accent, 0.45)} />
      <rect x={856} y={FLOOR_Y - 10} width={96} height={10} fill="#00000014" />
      </g>
      {/* полотенце */}
      <circle cx={262} cy={640} r={10} fill="#b9b4aa" />
      <rect x={232} y={644} width={62} height={180} rx={12} fill={towel} />
      <rect x={232} y={780} width={62} height={14} fill={light(towel, 0.4)} />
      {/* коврик */}
      <rect x={130} y={FLOOR_Y + 12} width={240} height={40} rx={20} fill={light(p.accent, 0.3)} />
    </>
  );
};

/** Спальня: базовый вид + ванная (bathroom). */
export const Spalnya = ({ palette, variant }: BackdropProps) => (
  <Canvas>{variant === "bathroom" ? <Bathroom palette={palette} /> : <Bedroom palette={palette} />}</Canvas>
);
