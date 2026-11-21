import { AbsoluteFill } from "remotion";
import { ACTS } from "@jf/core";
import type { Act } from "@jf/core";
import { characters } from "./registry";
import { Puppet, BOX_H, BOX_W } from "./puppet/Rig";
import { FONT } from "./fonts";

/** Показательный момент каждого действия (секунды от начала): взмах — посередине, позы — когда устоялись. */
const T: Partial<Record<Act, number>> = {
  slap: 0.34, "hit-head": 0.34, punch: 0.2, knock: 0.076, wave: 0.11, clap: 0.179, nod: 0.125, "shake-head": 0.1,
  fall: 1.2, faint: 1.2, jump: 0.32, run: 0.08, cry: 0.4, laugh: 0.3, "scratch-head": 0.5, throw: 0.33, grab: 0.28,
  dance: 0.25, shiver: 0.3, kiss: 0.3, hug: 0.3, sleep: 0.8,
};
const HOLD: Partial<Record<Act, string>> = { drink: "bottle", eat: "sandwich" };

type Tile = { label: string; act?: Act; t?: number; seated?: number; flinch?: number; hold?: string; facing?: 1 | -1; table?: boolean };

const TILES: Tile[] = [
  ...ACTS.map((a): Tile => ({ label: a, act: a, t: T[a] ?? 1, hold: HOLD[a] })),
  { label: "seated=1", seated: 1 },
  { label: "flinch=1", flinch: 1 },
  { label: "seated + table", seated: 1, table: true },
  { label: "seated + drink glass", seated: 1, act: "drink", t: 1, hold: "glass", table: true },
  { label: "drink (no prop)", act: "drink", t: 1 },
  { label: "slap ← facing −1", act: "slap", t: 0.34, facing: -1 },
  { label: "point ← facing −1", act: "point", t: 1, facing: -1 },
  { label: "neutral", },
];

const TW = 440, TH = 520, PH = 360, FLOOR = 470, CX = 290;

/** Лист действий: кукла в каждой позе (k=1), подписи; ?who=vovochka / pyos — проверить ребёнка и животное. */
export const Acts = ({ who = "muzhik" }: { who?: string }) => {
  const ch = characters[who] ?? characters.muzhik;
  const cols = 8;
  const pw = (PH * BOX_W) / BOX_H;
  const top = FLOOR - (PH * 585) / BOX_H;
  return (
    <AbsoluteFill style={{ background: "#efe3cc", display: "grid", gridTemplateColumns: `repeat(${cols}, ${TW}px)`, gridAutoRows: `${TH}px` }}>
      {TILES.map((tile, i) => (
        <div key={i} style={{ position: "relative", width: TW, height: TH, overflow: "hidden", background: i % 2 ? "#f2e6d0" : "#f6ecd9", outline: "1px solid #e0d2b8" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR, bottom: 0, background: "#d8c4a0" }} />
          <div style={{ position: "absolute", left: CX - pw / 2, top, width: pw, height: PH, display: "flex", justifyContent: "center" }}>
            <Puppet
              look={ch.look}
              emotion="neutral"
              speaking={false}
              seed={0}
              facing={tile.facing ?? 1}
              hold={tile.hold}
              seated={tile.seated}
              flinch={tile.flinch}
              act={tile.act ? { name: tile.act, k: 1, t: tile.t ?? 1 } : undefined}
            />
          </div>
          {tile.table && (
            <div style={{ position: "absolute", left: CX - 10, top: FLOOR - 190 * (PH / 768), width: 220, height: 190 * (PH / 768), background: "#f6efe0", borderTop: "10px solid #fff", borderBottom: `${18 * (PH / 768)}px solid #c8553d` }} />
          )}
          <div style={{ position: "absolute", left: 14, top: 10, fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#2b1d14" }}>{tile.label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
export const ACTS_TILES = TILES.length;
