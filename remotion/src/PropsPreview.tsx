import { AbsoluteFill } from "remotion";
import propsData from "../../content/props.json";
import { characters } from "./registry";
import { Puppet, BOX_H, BOX_W } from "./puppet/Rig";
import { PropItem } from "./props/Props";
import { SetPiece } from "./world/SetPieces";

/**
 * Лист реквизита: каждый предмет в руке куклы и положенный (prop put/drop, PropItem rest) — на пол и на стол.
 * Красные линии — пол и столешница: положенный предмет должен стоять/лежать ровно на них (y = 0 у PropItem rest).
 * only — показать только эти id; rest = false — вместо положенных показать рисунок «в руке» (кисть в точке на линии).
 * Режим set — мебель (scales, sink, specimen-shelf, swing) с куклой рядом/на качелях и кукла в полотенце.
 * Режим measure — лист для обмера dx/dy таблицы REST в props/Props.tsx (см. Measure).
 */
const TW = 760, TH = 470, PH = 330, FLOOR = TH - 40;
const TABLE_H = 150; // столешница над полом в превью
const U = PH / BOX_H; // px на единицу рисунка куклы
const FLOOR_X = 400, TABLE_X = 640;

const Tile = ({ id, rest, i }: { id: string; rest: boolean; i: number }) => {
  const pw = (PH * BOX_W) / BOX_H;
  const surf = FLOOR - TABLE_H;
  const put = (x: number, y: number) => <g transform={`translate(${x} ${y}) scale(${U})`}><PropItem id={id} x={0} y={0} rest={rest} /></g>;
  return (
    <div style={{ position: "relative", width: TW, height: TH, background: i % 2 ? "#f2e6d0" : "#f6ecd9", overflow: "hidden", outline: "1px solid #e0cfae" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR, bottom: 0, background: "#d8c4a0" }} />
      <div style={{ position: "absolute", left: 10, top: FLOOR - (PH * 585) / BOX_H, width: pw, height: PH, display: "flex", justifyContent: "center" }}>
        <Puppet look={characters.muzhik.look} emotion="neutral" speaking={false} seed={0} facing={1} hold={id} />
      </div>
      <svg width={TW} height={TH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={TABLE_X - 110} y={surf} width={220} height={14} rx={4} fill="#8a5a3a" />
        <rect x={TABLE_X - 98} y={surf + 14} width={14} height={TABLE_H - 14} fill="#6b4429" />
        <rect x={TABLE_X + 84} y={surf + 14} width={14} height={TABLE_H - 14} fill="#6b4429" />
        {put(FLOOR_X, FLOOR)}
        {put(TABLE_X, surf)}
        <line x1={TABLE_X - 110} x2={TABLE_X + 110} y1={surf} y2={surf} stroke="#e0201a" strokeWidth={1.5} opacity={0.8} />
        <line x1={FLOOR_X - 180} x2={FLOOR_X + 120} y1={FLOOR} y2={FLOOR} stroke="#e0201a" strokeWidth={1.5} opacity={0.8} />
        {[FLOOR_X, TABLE_X].map((cx) => <line key={cx} x1={cx} x2={cx} y1={(cx === FLOOR_X ? FLOOR : surf) + 2} y2={(cx === FLOOR_X ? FLOOR : surf) + 10} stroke="#e0201a" strokeWidth={2} />)}
      </svg>
      <div style={{ position: "absolute", left: 10, top: 6, fontFamily: "Inter, Arial, sans-serif", fontWeight: 800, fontSize: 24, color: "#2b1d14" }}>{id}</div>
    </div>
  );
};

/**
 * Обмер (mode "measure"): каждый положенный предмет (PropItem rest) в своей клетке 1000×1000 на пурпурном фоне, масштаб 2,
 * точка (0,0) предмета — в (500, 800) клетки, 8 клеток в ряд (порядок — как в content/props.json).
 * Скрипт сканирует непурпурные пиксели и поправляет dx/dy в REST (props/Props.tsx): середина на x = 0, низ на y = 0.
 */
export const MEASURE_CELL = 1000, MEASURE_SCALE = 2, MEASURE_OX = 500, MEASURE_OY = 800;
const Measure = ({ ids }: { ids: string[] }) => (
  <AbsoluteFill style={{ background: "#ff00ff" }}>
    <svg width={MEASURE_CELL * 8} height={MEASURE_CELL * Math.ceil(ids.length / 8)}>
      {ids.map((id, i) => (
        <g key={id} transform={`translate(${(i % 8) * MEASURE_CELL + MEASURE_OX} ${Math.floor(i / 8) * MEASURE_CELL + MEASURE_OY}) scale(${MEASURE_SCALE})`}>
          <PropItem id={id} x={0} y={0} rest />
        </g>
      ))}
    </svg>
  </AbsoluteFill>
);

/** Мебель и костюм: каждый предмет на своём куске сцены с куклой среднего плана (768 px). */
const SET_W = 1080, SET_H = 1300, SET_FLOOR = 1180;
const SetTile = ({ item, i, sit }: { item: string; i: number; sit?: boolean }) => {
  const ph = 768;
  const pw = (ph * BOX_W) / BOX_H;
  const px = item === "swing" ? SET_W / 2 : item === "specimen-shelf" ? 230 : SET_W / 2 + 230;
  return (
    <div style={{ position: "relative", width: SET_W, height: SET_H, background: i % 2 ? "#e8d8bc" : "#efe0c6", overflow: "hidden", outline: "1px solid #d0bd98" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: SET_FLOOR, bottom: 0, background: "#c9b089" }} />
      {item !== "swing" && <SetPiece it={{ item }} x={item === "specimen-shelf" ? SET_W / 2 + 200 : SET_W / 2 - 120} stageW={SET_W} height={SET_H} floorY={SET_FLOOR} k={1} />}
      {item === "swing" && <SetPiece it={{ item }} x={SET_W / 2} stageW={SET_W} height={SET_H} floorY={SET_FLOOR} k={1} />}
      <div style={{ position: "absolute", left: px - pw / 2, top: SET_FLOOR - (ph * 585) / BOX_H, width: pw, height: ph, display: "flex", justifyContent: "center" }}>
        <Puppet
          look={item === "towel" ? { ...characters.muzhik.look, clothes: characters.muzhik.look.skin, accessories: ["towel-wrap", "bath-hat"] } : characters.muzhik.look}
          emotion="neutral" speaking={false} seed={0} facing={-1} seated={sit ? 1 : 0} hold={item === "sink" ? "dishes" : undefined}
        />
      </div>
      <div style={{ position: "absolute", left: 16, top: 10, fontFamily: "Inter, Arial, sans-serif", fontWeight: 800, fontSize: 40, color: "#2b1d14" }}>{item === "towel" ? "towel-wrap + bath-hat" : item}</div>
    </div>
  );
};
const SET_TILES: { item: string; sit?: boolean }[] = [{ item: "scales" }, { item: "sink" }, { item: "specimen-shelf" }, { item: "swing", sit: true }, { item: "towel" }];

const COLS = 8;
export const propsPreviewSize = (mode: string, n: number) =>
  mode === "measure" ? { width: MEASURE_CELL * 8, height: MEASURE_CELL * Math.ceil(n / 8) } : mode === "set" ? { width: SET_W * 3, height: SET_H * 2 } : { width: TW * Math.min(COLS, n), height: TH * Math.ceil(n / COLS) };
export const allPropIds = () => (propsData as { props: { id: string }[] }).props.map((p) => p.id);

export const PropsPreview = ({ only = [], rest = true, mode = "props" }: { only?: string[]; rest?: boolean; mode?: string }) => {
  if (mode === "set") {
    return (
      <AbsoluteFill style={{ background: "#efe3cc", display: "grid", gridTemplateColumns: `repeat(3, ${SET_W}px)`, gridAutoRows: `${SET_H}px` }}>
        {SET_TILES.map((t, i) => <SetTile key={t.item} item={t.item} sit={t.sit} i={i} />)}
      </AbsoluteFill>
    );
  }
  const ids = only.length ? only : allPropIds();
  if (mode === "measure") return <Measure ids={ids} />;
  return (
    <AbsoluteFill style={{ background: "#efe3cc", display: "grid", gridTemplateColumns: `repeat(${Math.min(COLS, ids.length)}, ${TW}px)`, gridAutoRows: `${TH}px` }}>
      {ids.map((id, i) => <Tile key={id} id={id} rest={rest} i={i} />)}
    </AbsoluteFill>
  );
};
