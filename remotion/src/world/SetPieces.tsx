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
  // сиденья: кукла на их x сидит (верх сиденья — SEAT_H над полом её плана, см. world/depth.ts)
  chair: { layer: "back", w: 150 },
  stool: { layer: "back", w: 120 },
  armchair: { layer: "back", w: 220 },
  bench: { layer: "back", w: 420 },
  "row-of-chairs": { layer: "back", w: 640 },
};
/** Сиденья среди мебели: на них сидят сами (как за столом). */
export const SEAT_ITEMS = ["chair", "stool", "armchair", "bench", "row-of-chairs"];

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
