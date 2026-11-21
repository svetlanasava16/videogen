/**
 * Мебель на сцене (scene.set): то, о чём говорит анекдот, но чего нет в фоне — стол, прилавок, кафедра…
 * Предметы стоят на полу сцены; front — перед куклами (закрывает ноги: «сидят за столом», «за прилавком»),
 * back — за куклами (диван, кровать, ёлка). Координаты — холст сцены (1080 на кадр, пол = floorY).
 */
import type { SetItem } from "@jf/core";

const WOOD = "#8a5a3a";
const WOOD_DARK = "#6b4429";
const CLOTH = "#f6efe0";
const ACCENT = "#c8553d";

export const SET_PIECES: Record<string, { layer: "front" | "back"; w: number }> = {
  "dining-table": { layer: "front", w: 0.8 }, // длинный стол со скатертью, тарелками (доля ширины сцены)
  table: { layer: "front", w: 380 },
  desk: { layer: "front", w: 460 },
  counter: { layer: "front", w: 640 },
  lectern: { layer: "front", w: 220 },
  sofa: { layer: "back", w: 560 },
  bed: { layer: "back", w: 620 },
  "christmas-tree": { layer: "back", w: 300 },
  scales: { layer: "front", w: 300 }, // кусок прилавка (верх 380, как counter) с циферблатными весами
  sink: { layer: "front", w: 420 }, // кухонная мойка-тумба с краном и сушилкой для посуды
  "specimen-shelf": { layer: "back", w: 420 }, // музейный шкаф с банками заспиртованных экспонатов
  // сиденья: кукла на их x сидит (верх сиденья — SEAT_H над полом её плана, см. world/depth.ts)
  chair: { layer: "back", w: 150 },
  stool: { layer: "back", w: 120 },
  armchair: { layer: "back", w: 220 },
  bench: { layer: "back", w: 420 },
  "row-of-chairs": { layer: "back", w: 640 },
  swing: { layer: "back", w: 420 }, // детские качели: рама, сиденье на SEAT_H
};
/** Сиденья среди мебели: на них сидят сами (как за столом). */
export const SEAT_ITEMS = ["chair", "stool", "armchair", "bench", "row-of-chairs", "swing"];

const Piece = ({ item, x, w, floor }: { item: string; x: number; w: number; floor: number }) => {
  const l = x - w / 2;
  switch (item) {
    case "dining-table": {
      const top = floor - 190;
      const plates = Math.max(2, Math.round(w / 230));
      return (
        <g>
          <rect x={l} y={top} width={w} height={190} rx={10} fill={CLOTH} />
          <rect x={l} y={top + 150} width={w} height={40} fill={ACCENT} opacity={0.85} />
          <rect x={l - 10} y={top - 14} width={w + 20} height={24} rx={10} fill={CLOTH} />
          {Array.from({ length: plates }, (_, i) => {
            const px = l + ((i + 0.5) / plates) * w;
            return <ellipse key={i} cx={px} cy={top - 10} rx={46} ry={12} fill="#ffffff" stroke="#d8d0c0" strokeWidth={4} />;
          })}
          {/* праздничная еда между тарелками: салат, бутылка, торт, курица — не выше подбородка сидящих */}
          {plates >= 3 && (
            <g>
              <path d={`M${l + w * 0.3 - 40} ${top - 8} Q${l + w * 0.3} ${top + 28} ${l + w * 0.3 + 40} ${top - 8} Z`} fill={ACCENT} />
              <ellipse cx={l + w * 0.3} cy={top - 8} rx={40} ry={9} fill="#e8d6a0" />
              <rect x={l + w * 0.45 - 12} y={top - 90} width={24} height={82} rx={8} fill="#3f6b4f" />
              <rect x={l + w * 0.45 - 7} y={top - 112} width={14} height={26} rx={5} fill="#3f6b4f" />
              <rect x={l + w * 0.58 - 55} y={top - 60} width={110} height={52} rx={10} fill="#f6efe0" />
              <rect x={l + w * 0.58 - 55} y={top - 42} width={110} height={12} fill="#c86fa0" />
              <ellipse cx={l + w * 0.72} cy={top - 26} rx={42} ry={24} fill="#c8813d" />
            </g>
          )}
        </g>
      );
    }
    case "table": {
      const top = floor - 200;
      return (
        <g>
          <rect x={l} y={top} width={w} height={30} rx={8} fill={WOOD} />
          <rect x={l + 24} y={top + 30} width={26} height={170} fill={WOOD_DARK} />
          <rect x={l + w - 50} y={top + 30} width={26} height={170} fill={WOOD_DARK} />
        </g>
      );
    }
    case "desk": {
      const top = floor - 330;
      return (
        <g>
          <rect x={l + w * 0.55} y={top - 150} width={150} height={110} rx={8} fill="#3a4a5a" />
          <rect x={l + w * 0.55 + 10} y={top - 140} width={130} height={86} rx={4} fill="#8fb8d8" />
          <rect x={l + w * 0.55 + 65} y={top - 40} width={20} height={40} fill="#3a4a5a" />
          <rect x={l} y={top} width={w} height={34} rx={8} fill={WOOD} />
          <rect x={l + 10} y={top + 34} width={w - 20} height={296} fill={WOOD_DARK} />
          {[0, 1, 2].map((i) => <rect key={i} x={l + 30} y={top + 60 + i * 86} width={w * 0.35} height={64} rx={6} fill={WOOD} />)}
        </g>
      );
    }
    case "counter": {
      const top = floor - 380;
      return (
        <g>
          <rect x={l - 10} y={top} width={w + 20} height={36} rx={8} fill="#d8d0c0" />
          <rect x={l} y={top + 36} width={w} height={344} fill={WOOD} />
          {Array.from({ length: 4 }, (_, i) => <rect key={i} x={l + 20 + (i * (w - 40)) / 4} y={top + 70} width={(w - 40) / 4 - 20} height={260} rx={8} fill={WOOD_DARK} opacity={0.5} />)}
        </g>
      );
    }
    case "lectern": {
      const top = floor - 300;
      return (
        <g>
          <path d={`M${l - 20} ${top} H${l + w + 20} L${l + w} ${top + 50} H${l} Z`} fill={WOOD} />
          <rect x={l + 20} y={top + 50} width={w - 40} height={250} fill={WOOD_DARK} />
          <circle cx={x} cy={top + 150} r={36} fill={ACCENT} opacity={0.8} />
          <rect x={x + 40} y={top - 90} width={8} height={90} fill="#333" />
          <circle cx={x + 44} cy={top - 96} r={14} fill="#333" />
        </g>
      );
    }
    case "sofa": {
      const top = floor - 330;
      return (
        <g>
          <rect x={l} y={top} width={w} height={200} rx={50} fill={ACCENT} />
          <rect x={l + 30} y={top + 150} width={w - 60} height={120} rx={30} fill="#b4452f" />
          <rect x={l - 30} y={top + 100} width={90} height={230} rx={36} fill={ACCENT} />
          <rect x={l + w - 60} y={top + 100} width={90} height={230} rx={36} fill={ACCENT} />
        </g>
      );
    }
    case "bed": {
      const top = floor - 260;
      return (
        <g>
          <rect x={l} y={top - 120} width={40} height={380} rx={14} fill={WOOD} />
          <rect x={l + 40} y={top} width={w - 40} height={150} rx={20} fill="#e8eef5" />
          <rect x={l + 60} y={top - 50} width={180} height={70} rx={30} fill="#ffffff" />
          <rect x={l + 260} y={top + 10} width={w - 300} height={130} rx={20} fill="#7fa8d8" />
          <rect x={l + 40} y={top + 150} width={w - 40} height={40} fill={WOOD} />
          <rect x={l + 50} y={top + 190} width={24} height={70} fill={WOOD_DARK} />
          <rect x={l + w - 40} y={top + 190} width={24} height={70} fill={WOOD_DARK} />
        </g>
      );
    }
    case "christmas-tree": {
      const top = floor - 700;
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${x} ${top + i * 170} L${x + 90 + i * 50} ${top + 230 + i * 170} H${x - 90 - i * 50} Z`} fill="#3f7a4a" />
          ))}
          <rect x={x - 22} y={floor - 100} width={44} height={100} fill={WOOD_DARK} />
          {[["#e0a030", -40, 260], [ACCENT, 50, 380], ["#7fa8d8", -70, 470], ["#e0a030", 80, 540], [ACCENT, -20, 600]].map(([c, dx, dy], i) => (
            <circle key={i} cx={x + (dx as number)} cy={top + (dy as number)} r={16} fill={c as string} />
          ))}
          <path d={`M${x} ${top - 40} l12 30 h32 l-26 20 l10 32 l-28 -20 l-28 20 l10 -32 l-26 -20 h32 Z`} fill="#e0a030" />
        </g>
      );
    }
    case "scales": {
      // прилавок той же высоты, что counter (380), на нём весы: чашка слева, циферблат со стрелкой справа
      const top = floor - 380;
      const dx = x + 36, dy = top - 150;
      return (
        <g>
          <rect x={l - 10} y={top} width={w + 20} height={36} rx={8} fill="#d8d0c0" />
          <rect x={l} y={top + 36} width={w} height={344} fill={WOOD} />
          <rect x={l + 24} y={top + 70} width={w - 48} height={260} rx={8} fill={WOOD_DARK} opacity={0.5} />
          <rect x={x - 120} y={top - 44} width={240} height={44} rx={10} fill="#e8e4d8" />
          <rect x={x - 120} y={top - 12} width={240} height={12} rx={4} fill="#c9c2b0" />
          <rect x={dx - 18} y={dy + 60} width={36} height={70} fill="#d8d2c2" />
          <circle cx={dx} cy={dy} r={74} fill="#e8e4d8" />
          <circle cx={dx} cy={dy} r={60} fill="#fbfaf5" />
          {Array.from({ length: 11 }, (_, i) => {
            const a = ((-150 + i * 30) * Math.PI) / 180;
            return <line key={i} x1={dx + Math.sin(a) * 48} y1={dy - Math.cos(a) * 48} x2={dx + Math.sin(a) * 57} y2={dy - Math.cos(a) * 57} stroke="#2b1d14" strokeWidth={i % 5 === 0 ? 5 : 3} />;
          })}
          <line x1={dx} y1={dy} x2={dx + 36} y2={dy - 30} stroke={ACCENT} strokeWidth={5} strokeLinecap="round" />
          <circle cx={dx} cy={dy} r={8} fill="#2b1d14" />
          <rect x={x - 74} y={top - 66} width={12} height={24} fill="#9aa8b8" />
          <path d={`M${x - 140} ${top - 70} H${x + 4} Q${x - 4} ${top - 54} ${x - 30} ${top - 52} H${x - 106} Q${x - 132} ${top - 54} ${x - 140} ${top - 70} Z`} fill="#b9c2cc" />
          <rect x={x - 144} y={top - 76} width={152} height={8} rx={4} fill="#d6dce2" />
        </g>
      );
    }
    case "sink": {
      // тумба с мойкой: столешница, кран, сушилка с тарелками справа
      // столешница на 300 px — на уровне кистей стоящей куклы: руки «в мойке»
      const top = floor - 300;
      return (
        <g>
          <rect x={l} y={top + 30} width={w} height={270} fill="#e8e1cf" />
          {[0, 1].map((i) => <rect key={i} x={l + 16 + (i * (w - 32)) / 2} y={top + 52} width={(w - 32) / 2 - 10} height={222} rx={6} fill="#ddd4be" />)}
          {[0, 1].map((i) => <rect key={i} x={l + (i ? w / 2 + 10 : w / 2 - 34)} y={top + 140} width={24} height={8} rx={4} fill="#9aa8b8" />)}
          <rect x={l} y={floor - 26} width={w} height={26} fill="#b8ae96" />
          <rect x={l - 12} y={top} width={w + 24} height={32} rx={6} fill="#b9c2cc" />
          {/* мойка и кран — у левого края, сушилка — у правого: середина свободна для лица куклы за тумбой */}
          <path d={`M${l + 24} ${top + 4} H${l + w * 0.46} Q${l + w * 0.46} ${top + 28} ${l + w * 0.46 - 20} ${top + 28} H${l + 44} Q${l + 24} ${top + 28} ${l + 24} ${top + 4} Z`} fill="#7e8ea0" />
          <rect x={l + 24} y={top - 64} width={18} height={64} rx={6} fill="#c9d0da" />
          <path d={`M${l + 33} ${top - 58} Q${l + 33} ${top - 104} ${l + 80} ${top - 98} L${l + 90} ${top - 78}`} stroke="#c9d0da" strokeWidth={16} fill="none" strokeLinecap="round" />
          <rect x={l + 12} y={top - 40} width={44} height={12} rx={6} fill="#aeb6c2" />
          <path d={`M${l + 90} ${top - 68} q-5 10 0 14 q5 -4 0 -14 Z`} fill="#8fc3e6" />
          {/* сушилка: тарелки на ребре и чашка */}
          {[0, 1, 2].map((i) => <ellipse key={i} cx={l + w * 0.78 + i * 20} cy={top - 40} rx={11} ry={40} fill={i === 1 ? "#f6f2e8" : "#ece6d8"} stroke="#4a6fa5" strokeWidth={3} />)}
          <rect x={l + w * 0.74} y={top - 18} width={w * 0.24} height={16} rx={4} fill="#9aa8b8" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={l + w * 0.74 + i * (w * 0.24 - 6) / 3} y={top - 32} width={6} height={16} rx={2} fill="#9aa8b8" />)}
          <path d={`M${l + w * 0.86} ${top - 34} h30 v26 q0 10 -10 10 h-10 q-10 0 -10 -10 Z`} fill={ACCENT} />
          <path d={`M${l + w * 0.86 + 30} ${top - 29} q12 2 10 12 q-2 7 -10 5`} stroke={ACCENT} strokeWidth={5} fill="none" />
        </g>
      );
    }
    case "specimen-shelf": {
      // высокий музейный шкаф: деревянная рама, стекло, банки с экспонатами в желтоватом растворе
      const top = floor - 760;
      const rows = [top + 40, top + 230, top + 420];
      const jar = (cx: number, by: number, jw: number, jh: number, k: number) => {
        const jt = by - jh, mx = cx, my = by - jh * 0.45;
        const thing = [
          <g key="fish"><ellipse cx={mx} cy={my} rx={jw * 0.3} ry={jh * 0.14} fill="#8a9a6a" /><path d={`M${mx + jw * 0.28} ${my} l${jw * 0.16} -${jh * 0.1} v${jh * 0.2} Z`} fill="#8a9a6a" /><circle cx={mx - jw * 0.16} cy={my - 2} r={3} fill="#2b1d14" /></g>,
          <g key="brain"><ellipse cx={mx} cy={my} rx={jw * 0.3} ry={jh * 0.2} fill="#e8a8a8" /><path d={`M${mx - jw * 0.22} ${my} q${jw * 0.1} -${jh * 0.12} ${jw * 0.2} 0 q${jw * 0.1} ${jh * 0.12} ${jw * 0.22} 0 M${mx} ${my - jh * 0.18} v${jh * 0.36}`} stroke="#c88080" strokeWidth={3} fill="none" /></g>,
          <g key="snake"><path d={`M${mx - jw * 0.25} ${my + jh * 0.2} q${jw * 0.25} -${jh * 0.2} 0 -${jh * 0.2} q-${jw * 0.25} -${jh * 0.2} ${jw * 0.05} -${jh * 0.2} q${jw * 0.3} 0 ${jw * 0.2} ${jh * 0.15}`} stroke="#6a8a4a" strokeWidth={7} fill="none" strokeLinecap="round" /></g>,
          <g key="frog"><ellipse cx={mx} cy={my} rx={jw * 0.22} ry={jh * 0.16} fill="#7a9a5a" /><circle cx={mx - jw * 0.1} cy={my - jh * 0.15} r={6} fill="#7a9a5a" /><circle cx={mx + jw * 0.1} cy={my - jh * 0.15} r={6} fill="#7a9a5a" /><path d={`M${mx - jw * 0.2} ${my + jh * 0.1} l-${jw * 0.14} ${jh * 0.14} M${mx + jw * 0.2} ${my + jh * 0.1} l${jw * 0.14} ${jh * 0.14}`} stroke="#7a9a5a" strokeWidth={5} strokeLinecap="round" /></g>,
          <g key="eye"><circle cx={mx} cy={my} r={jw * 0.2} fill="#f6f2e8" /><circle cx={mx + 3} cy={my} r={jw * 0.09} fill="#4a6fa5" /><circle cx={mx + 3} cy={my} r={jw * 0.04} fill="#2b1d14" /><path d={`M${mx - jw * 0.2} ${my + 4} q-${jw * 0.08} ${jh * 0.14} 0 ${jh * 0.24}`} stroke="#c88080" strokeWidth={3} fill="none" /></g>,
          <g key="octopus"><circle cx={mx} cy={my - jh * 0.08} r={jw * 0.2} fill="#c87a6a" />{[-2, -1, 0, 1, 2].map((t) => <path key={t} d={`M${mx + t * jw * 0.06} ${my} q${t * jw * 0.08} ${jh * 0.14} ${t * jw * 0.1} ${jh * 0.26}`} stroke="#c87a6a" strokeWidth={5} fill="none" strokeLinecap="round" />)}</g>,
        ][k % 6];
        return (
          <g>
            <rect x={cx - jw / 2} y={jt + 14} width={jw} height={jh - 14} rx={14} fill="#dfe6b0" opacity={0.85} />
            {thing}
            <rect x={cx - jw / 2 + 6} y={jt + 22} width={8} height={jh - 40} rx={4} fill="#ffffff" opacity={0.5} />
            <rect x={cx - jw / 2 + 6} y={jt} width={jw - 12} height={18} rx={5} fill="#b08a3a" />
            <rect x={cx - 16} y={by - 30} width={32} height={14} rx={2} fill="#f6f2e8" opacity={0.9} />
          </g>
        );
      };
      return (
        <g>
          <rect x={l} y={top} width={w} height={760} rx={10} fill={WOOD_DARK} />
          <rect x={l + 18} y={top + 18} width={w - 36} height={600} fill="#4a3a30" />
          {rows.map((ry, ri) => (
            <g key={ri}>
              {[0, 1, 2].map((j) => <g key={j}>{jar(l + 18 + ((w - 36) * (j + 0.5)) / 3, ry + 170, (w - 36) / 3 - 22 - ((ri + j) % 2) * 14, 130 - ((ri * 2 + j) % 3) * 16, ri * 3 + j)}</g>)}
              <rect x={l + 18} y={ry + 170} width={w - 36} height={14} fill={WOOD} />
            </g>
          ))}
          {/* стекло дверец */}
          <rect x={l + 18} y={top + 18} width={w - 36} height={600} fill="#cfe8f5" opacity={0.18} />
          <path d={`M${l + 40} ${top + 60} L${l + 90} ${top + 60} L${l + 30} ${top + 200} Z M${l + w / 2 + 30} ${top + 300} L${l + w / 2 + 60} ${top + 300} L${l + w / 2 + 10} ${top + 420} Z`} fill="#ffffff" opacity={0.3} />
          <rect x={x - 3} y={top + 18} width={6} height={600} fill={WOOD_DARK} />
          <rect x={l} y={top + 618} width={w} height={142} fill={WOOD} />
          {[0, 1].map((i) => <rect key={i} x={l + 24 + (i * (w - 48)) / 2} y={top + 638} width={(w - 48) / 2 - 12} height={102} rx={6} fill={WOOD_DARK} opacity={0.6} />)}
          <rect x={l - 14} y={top - 16} width={w + 28} height={26} rx={6} fill={WOOD} />
        </g>
      );
    }
    case "swing": {
      // детские качели: две А-стойки, перекладина, цепи, доска сиденья на SEAT_H = 72 над полом
      const seatY = floor - 72;
      const beam = floor - 760;
      const pole = (cx: number) => (
        <g>
          <path d={`M${cx - 70} ${floor} L${cx} ${beam}`} stroke="#3f6b8f" strokeWidth={22} strokeLinecap="round" />
          <path d={`M${cx + 70} ${floor} L${cx} ${beam}`} stroke="#4f7ba0" strokeWidth={22} strokeLinecap="round" />
          <rect x={cx - 44} y={floor - 300} width={88} height={12} rx={5} fill="#3f6b8f" />
        </g>
      );
      const rope = (cx: number) => <line x1={cx} y1={beam + 10} x2={cx} y2={seatY} stroke="#8a9096" strokeWidth={6} strokeDasharray="12 5" />;
      return (
        <g>
          {pole(l + 30)}
          {pole(l + w - 30)}
          <rect x={l} y={beam - 16} width={w} height={26} rx={10} fill={ACCENT} />
          {rope(x - 66)}
          {rope(x + 66)}
          <rect x={x - 86} y={seatY} width={172} height={20} rx={8} fill="#f2c94c" />
          <rect x={x - 86} y={seatY + 14} width={172} height={6} rx={3} fill="#d9a92a" />
        </g>
      );
    }
    case "chair":
    case "stool":
    case "armchair":
    case "bench":
    case "row-of-chairs": {
      // верх сиденья на 72 px над полом (SEAT_H): сидящая кукла садится ровно на него
      const seatY = floor - 72;
      const n = item === "row-of-chairs" ? 4 : 1;
      const cw = w / n;
      const one = (cx: number, i: number) => {
        const l0 = cx - cw / 2 + 8;
        const ww = cw - 16;
        if (item === "bench") {
          return (
            <g key={i}>
              <rect x={l0} y={seatY - 120} width={ww} height={22} rx={8} fill={WOOD} />
              <rect x={l0} y={seatY - 70} width={ww} height={22} rx={8} fill={WOOD} />
              <rect x={l0 - 6} y={seatY} width={ww + 12} height={22} rx={8} fill={WOOD} />
              <rect x={l0 + 20} y={seatY + 22} width={16} height={50} fill={WOOD_DARK} />
              <rect x={l0 + ww - 36} y={seatY + 22} width={16} height={50} fill={WOOD_DARK} />
            </g>
          );
        }
        if (item === "armchair") {
          return (
            <g key={i}>
              <rect x={l0} y={seatY - 170} width={ww} height={190} rx={40} fill={ACCENT} />
              <rect x={l0 - 14} y={seatY - 60} width={46} height={110} rx={20} fill="#b4452f" />
              <rect x={l0 + ww - 32} y={seatY - 60} width={46} height={110} rx={20} fill="#b4452f" />
              <rect x={l0 + 10} y={seatY - 6} width={ww - 20} height={40} rx={14} fill="#b4452f" />
              <rect x={l0 + 20} y={seatY + 34} width={14} height={38} fill={WOOD_DARK} />
              <rect x={l0 + ww - 34} y={seatY + 34} width={14} height={38} fill={WOOD_DARK} />
            </g>
          );
        }
        const back = item === "stool" ? null : <rect x={l0 + 4} y={seatY - 150} width={18} height={160} rx={6} fill={WOOD_DARK} />;
        return (
          <g key={i}>
            {back}
            {item !== "stool" && <rect x={l0 + 4} y={seatY - 150} width={ww * 0.7} height={50} rx={10} fill={item === "row-of-chairs" ? "#3f6b8f" : WOOD} />}
            <rect x={l0} y={seatY} width={ww} height={20} rx={8} fill={item === "row-of-chairs" ? "#3f6b8f" : WOOD} />
            <rect x={l0 + 8} y={seatY + 20} width={12} height={52} fill={WOOD_DARK} />
            <rect x={l0 + ww - 20} y={seatY + 20} width={12} height={52} fill={WOOD_DARK} />
          </g>
        );
      };
      return <g>{Array.from({ length: n }, (_, i) => one(l + cw * (i + 0.5), i))}</g>;
    }
    default:
      return null;
  }
};

/**
 * Один предмет мебели на своём плане глубины: floorY — пол этого плана, k — масштаб (план × размер кукол сцены).
 * Движок сортирует предметы вместе с куклами по z (дальние раньше).
 */
export const SetPiece = ({ it, x, stageW, height, floorY, k }: { it: SetItem; x: number; stageW: number; height: number; floorY: number; k: number }) => {
  const def = SET_PIECES[it.item];
  if (!def) return null;
  const w = def.w <= 1 ? (def.w * stageW) / k : def.w * (it.size === "big" ? 1.4 : it.size === "small" ? 0.7 : 1);
  return (
    <svg width={stageW} height={height} viewBox={`0 0 ${stageW} ${height}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={`translate(${x} ${floorY}) scale(${k}) translate(${-x} ${-floorY})`}>
        <Piece item={it.item} x={x} w={w} floor={floorY} />
      </g>
    </svg>
  );
};
/** Ширина предмета на сцене (px) — для «сидит за столом / на скамье». */
export const pieceWidth = (it: SetItem, stageW: number, k: number) => {
  const def = SET_PIECES[it.item];
  if (!def) return 0;
  return def.w <= 1 ? def.w * stageW : def.w * k * (it.size === "big" ? 1.4 : it.size === "small" ? 0.7 : 1);
};

/** Слой мебели сцены. xOf — позиция по метке (доля ширины сцены → px). */
/** Мебель рисуется под куклу высотой 768 px (бокс при обычном масштабе); k — масштаб кукол сцены. */
export const SetLayer = ({ items, layer, stageW, height, floorY, xOf, k = 1 }: {
  items: SetItem[]; layer: "front" | "back"; stageW: number; height: number; floorY: number; xOf: (at?: string) => number; k?: number;
}) => {
  const mine = items.filter((it) => SET_PIECES[it.item]?.layer === layer);
  if (!mine.length) return null;
  return (
    <svg width={stageW} height={height} viewBox={`0 0 ${stageW} ${height}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {mine.map((it, i) => {
        const def = SET_PIECES[it.item];
        // ширина-доля (длинный стол) — от ширины сцены, остальное — в масштабе кукол
        const w = def.w <= 1 ? (def.w * stageW) / k : def.w * (it.size === "big" ? 1.4 : it.size === "small" ? 0.7 : 1);
        const x = xOf(it.at);
        return (
          <g key={i} transform={`translate(${x} ${floorY}) scale(${k}) translate(${-x} ${-floorY})`}>
            <Piece item={it.item} x={x} w={w} floor={floorY} />
          </g>
        );
      })}
    </svg>
  );
};
