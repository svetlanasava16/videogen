import { AbsoluteFill } from "remotion";
import { VEHICLES, type VehicleKind } from "@jf/core";
import { characters } from "./registry";
import { BOX_H, BOX_W, Puppet } from "./components/Puppet";
import { VEHICLE_SPECS, VehicleArt } from "./world/Vehicles";
import { PUPPET_BOX_H } from "./world/depth";
import { FONT } from "./fonts";

const TW = 1000;
const TH = 860;
const FLOOR = TH - 80;
const COLS = 4;
/** Кто сидит на местах (по кругу): разные телосложения, чтобы проверить окна. */
const RIDERS = ["muzhik", "devushka", "nachalnik", "ded", "zhena", "paren", "uchilka", "sluzhivy"];

/** Верх рисунка вместе с головами седоков (px при масштабе 1). */
const topOf = (kind: VehicleKind) => {
  const sp = VEHICLE_SPECS[kind];
  return Math.max(sp.h, ...sp.seats.map((s) => s.dy + 560 * s.s));
};

const Tile = ({ kind, i, grid, moving }: { kind: VehicleKind; i: number; grid: boolean; moving: boolean }) => {
  const sp = VEHICLE_SPECS[kind];
  const sc = Math.min(1, (TW - 70) / sp.w, (FLOOR - 70) / topOf(kind));
  const ox = TW / 2;
  const t = 0.37 * (i + 1);
  const layer = (part: "back" | "front") => (
    <svg width={TW} height={TH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={`translate(${ox} ${FLOOR}) scale(${sc})`}>
        <VehicleArt kind={kind} part={part} t={t} moving={moving} />
      </g>
    </svg>
  );
  return (
    <div style={{ position: "relative", width: TW, height: TH, overflow: "hidden", background: i % 2 ? "#cfe3ee" : "#d8eaf2", outline: "2px solid #b9cbd6" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR, bottom: 0, background: "#8a8f96" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR + 30, height: 8, background: "#e8e8e8" }} />
      {grid && (
        <svg width={TW} height={TH} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 12 }, (_, k) => (
            <line key={k} x1={0} x2={TW} y1={FLOOR - k * 100 * sc} y2={FLOOR - k * 100 * sc} stroke="#000" strokeOpacity={0.15} />
          ))}
        </svg>
      )}
      {layer("back")}
      {sp.seats
        .map((s, k) => ({ s, k }))
        .reverse()
        .map(({ s, k }) => {
          const ch = characters[RIDERS[(i + k) % RIDERS.length]];
          const h = PUPPET_BOX_H * s.s * sc;
          const w = (h * BOX_W) / BOX_H;
          const fx = ox + s.dx * sc;
          const fy = FLOOR - s.dy * sc;
          return (
            <div key={k} style={{ position: "absolute", left: fx - w / 2, top: fy - (h * 585) / BOX_H, width: w, height: h, display: "flex", justifyContent: "center" }}>
              <Puppet look={ch.look} emotion="neutral" speaking={false} seed={k} t={0} seated={1} facing={1} />
            </div>
          );
        })}
      {layer("front")}
      {/* дверь: где выходят */}
      <svg width={TW} height={TH} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M${ox + sp.door * sc - 14} ${FLOOR + 62} l14 -22 l14 22 z`} fill="#c8253d" />
      </svg>
      <div style={{ position: "absolute", left: 18, top: 10, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: "#2b1d14" }}>
        {kind} <span style={{ fontWeight: 400, fontSize: 26 }}>×{sc.toFixed(2)} · {sp.seats.length} seats · {sp.driveSec}s</span>
      </div>
    </div>
  );
};

/** Лист транспорта: все виды с седоками на каждом месте (проверка окон и посадки), красный треугольник — дверь. */
export const VehiclesPreview = ({ grid = false, moving = false }: { grid?: boolean; moving?: boolean }) => (
  <AbsoluteFill style={{ background: "#2b1d14", display: "grid", gridTemplateColumns: `repeat(${COLS}, ${TW}px)`, gridAutoRows: `${TH}px` }}>
    {VEHICLES.map((kind, i) => (
      <Tile key={kind} kind={kind} i={i} grid={grid} moving={moving} />
    ))}
  </AbsoluteFill>
);

export const VEHICLES_PREVIEW_SIZE = { width: TW * COLS, height: TH * Math.ceil(VEHICLES.length / COLS) };
