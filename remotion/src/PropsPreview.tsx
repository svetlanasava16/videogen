import { AbsoluteFill } from "remotion";
import propsData from "../../content/props.json";
import { characters } from "./registry";
import { Puppet, BOX_H, BOX_W } from "./puppet/Rig";
import { PropItem } from "./props/Props";
import { SetPiece } from "./world/SetPieces";

/**
 * Лист реквизита: каждый предмет в руке куклы и положенный на стол (как prop put: кисть на 40 над столешницей).
 * only — показать только эти id; rest = false — положенный как рисует движок сейчас (без снятия поворота руки).
 * Режим set — мебель (scales, sink, specimen-shelf, swing) с куклой рядом/на качелях и кукла в полотенце.
 */
const TW = 440, TH = 470, PH = 330, FLOOR = TH - 40;
const TABLE_H = 150; // столешница над полом в превью
const U = PH / BOX_H; // px на единицу рисунка куклы
const REST = 40;

const Tile = ({ id, rest, i }: { id: string; rest: boolean; i: number }) => {
  const pw = (PH * BOX_W) / BOX_H;
  const surf = FLOOR - TABLE_H;
  return (
    <div style={{ position: "relative", width: TW, height: TH, background: i % 2 ? "#f2e6d0" : "#f6ecd9", overflow: "hidden", outline: "1px solid #e0cfae" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR, bottom: 0, background: "#d8c4a0" }} />
      <div style={{ position: "absolute", left: 10, top: FLOOR - (PH * 585) / BOX_H, width: pw, height: PH, display: "flex", justifyContent: "center" }}>
        <Puppet look={characters.muzhik.look} emotion="neutral" speaking={false} seed={0} facing={1} hold={id} />
      </div>
      <svg width={TW} height={TH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={250} y={surf} width={180} height={14} rx={4} fill="#8a5a3a" />
        <rect x={262} y={surf + 14} width={14} height={TABLE_H - 14} fill="#6b4429" />
        <rect x={404} y={surf + 14} width={14} height={TABLE_H - 14} fill="#6b4429" />
        <line x1={250} x2={430} y1={surf} y2={surf} stroke="#c8302e" strokeWidth={1} opacity={0.6} />
        <g transform={`translate(${300} ${surf - REST * U}) scale(${U})`}><PropItem id={id} x={0} y={0} rest={rest} /></g>
      </svg>
      <div style={{ position: "absolute", left: 10, top: 6, fontFamily: "Inter, Arial, sans-serif", fontWeight: 800, fontSize: 24, color: "#2b1d14" }}>{id}</div>
    </div>
  );
};

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
  mode === "set" ? { width: SET_W * 3, height: SET_H * 2 } : { width: TW * Math.min(COLS, n), height: TH * Math.ceil(n / COLS) };
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
  return (
    <AbsoluteFill style={{ background: "#efe3cc", display: "grid", gridTemplateColumns: `repeat(${Math.min(COLS, ids.length)}, ${TW}px)`, gridAutoRows: `${TH}px` }}>
      {ids.map((id, i) => <Tile key={id} id={id} rest={rest} i={i} />)}
    </AbsoluteFill>
  );
};
