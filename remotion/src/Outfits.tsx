import { AbsoluteFill } from "remotion";
import { lookForRole } from "@jf/core";
import type { Act, Look } from "@jf/core";
import { characters } from "./registry";
import { Puppet, BOX_H, BOX_W } from "./puppet/Rig";
import { FONT } from "./fonts";

/**
 * Лист формы: mode "outfits" — каждая форма на разных телосложениях (и в движении: руки вверх, хлопок, взгляд назад);
 * mode "roles" — настоящие куклы в ролях (lookForRole), как их оденет эпизод.
 */
type Body = { label: string; kind: string; build: string; act?: Act; t?: number; facing?: 1 | -1 };
const BODIES: Body[] = [
  { label: "man", kind: "man", build: "average" },
  { label: "woman", kind: "woman", build: "slim" },
  { label: "portly", kind: "man", build: "portly" },
  { label: "child", kind: "boy", build: "child" },
  { label: "stocky ← hands-up", kind: "man", build: "stocky", act: "hands-up", facing: -1 },
  { label: "slim · clap", kind: "man", build: "slim", act: "clap", t: 0.179 },
];
type Row = { label: string; acc: string[]; clothes?: string; hold?: string };
const ROWS: Row[] = [
  { label: "pilot", acc: ["pilot-uniform", "pilot-cap"] },
  { label: "police", acc: ["police-uniform", "police-cap"] },
  { label: "traffic cop", acc: ["police-uniform", "traffic-vest", "police-cap"], hold: "baton-striped" },
  { label: "soldier", acc: ["military-uniform", "army-cap"] },
  { label: "officer", acc: ["officer-uniform", "officer-cap"] },
  { label: "chef", acc: ["chef-whites", "chef-hat", "apron"] },
  { label: "construction", acc: ["construction", "hard-hat"], clothes: "#4a6fa5" },
  { label: "suit + tie", acc: ["suit", "tie"], clothes: "#2f2f3a" },
  { label: "stewardess", acc: ["stewardess-uniform", "stewardess-hat"] },
  { label: "doctor", acc: ["doctor-coat", "stethoscope"], clothes: "#9cc0e0" },
  { label: "prisoner", acc: ["prisoner", "prisoner-cap"] },
  { label: "sailor", acc: ["sailor", "sailor-cap"] },
];
const ROLES: [string, string][] = [
  ["sluzhivy", "police-officer"], ["sluzhivy", "traffic-cop"], ["sluzhivy", "pilot"], ["sluzhivy", "officer"], ["sluzhivy", "petka"],
  ["sluzhivy-ryadovoy", "soldier"], ["sluzhivy-ryadovoy", "sailor"], ["devushka-blondinka", "flight-attendant"], ["barmen", "cook"], ["barmen", "construction-worker"],
  ["nachalnik", "boss"], ["nachalnik", "new-russian"], ["nachalnik", "tv-host"], ["doktor", "doctor"], ["doktor", "scientist"],
  ["muzhik", "prisoner"], ["paren", "employee"], ["nachalnik", "judge"],
];

const TW = 300, TH = 400, PH = 330, LW = 250;
export const outfitsSize = (mode: string) =>
  mode === "roles" ? { width: 6 * TW, height: Math.ceil(ROLES.length / 6) * TH } : { width: LW + BODIES.length * TW, height: 60 + ROWS.length * TH };

const Tile = ({ look, label, act, t, facing, hold, bg }: { look: Look; label: string; act?: Act; t?: number; facing?: 1 | -1; hold?: string; bg: string }) => {
  const pw = (PH * BOX_W) / BOX_H;
  return (
    <div style={{ position: "relative", width: TW, height: TH, background: bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: TH - 40, bottom: 0, background: "#d8c4a0" }} />
      <div style={{ position: "absolute", left: (TW - pw) / 2, top: TH - 40 - (PH * 585) / BOX_H, width: pw, height: PH, display: "flex", justifyContent: "center" }}>
        <Puppet look={look} emotion="neutral" speaking={false} seed={0} t={0} facing={facing ?? 1} hold={hold} act={act ? { name: act, k: 1, t: t ?? 1 } : undefined} />
      </div>
      <div style={{ position: "absolute", left: 10, top: 6, fontFamily: FONT, fontWeight: 800, fontSize: 22, color: "#2b1d14" }}>{label}</div>
    </div>
  );
};

export const Outfits = ({ mode = "outfits" }: { mode?: string }) => {
  if (mode === "roles") {
    return (
      <AbsoluteFill style={{ background: "#efe3cc", display: "grid", gridTemplateColumns: `repeat(6, ${TW}px)`, gridAutoRows: `${TH}px` }}>
        {ROLES.map(([id, role], i) => {
          const ch = characters[id];
          if (!ch) return <div key={i} />;
          return <Tile key={i} look={lookForRole(ch, role)} label={`${id} · ${role}`} bg={i % 2 ? "#f2e6d0" : "#f6ecd9"} hold={role === "traffic-cop" ? "baton-striped" : undefined} />;
        })}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "#efe3cc" }}>
      <div style={{ display: "flex", height: 60, marginLeft: LW }}>
        {BODIES.map((b) => <div key={b.label} style={{ width: TW, fontFamily: FONT, fontWeight: 800, fontSize: 24, padding: 14, color: "#5b4636" }}>{b.label}</div>)}
      </div>
      {ROWS.map((r, ri) => (
        <div key={r.label} style={{ display: "flex" }}>
          <div style={{ width: LW, height: TH, fontFamily: FONT, fontWeight: 800, fontSize: 30, padding: 16, color: "#2b1d14", boxSizing: "border-box" }}>
            {r.label}
            <div style={{ fontWeight: 400, fontSize: 18, color: "#5b4636", marginTop: 8 }}>{r.acc.join(" + ")}</div>
          </div>
          {BODIES.map((b, bi) => (
            <Tile key={b.label} bg={(ri + bi) % 2 ? "#f2e6d0" : "#f6ecd9"} label="" act={b.act} t={b.t} facing={b.facing} hold={r.hold}
              look={{ kind: b.kind, build: b.build, skin: "#f0c8a0", clothes: r.clothes ?? "#8a6a4a", accessories: r.acc }} />
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};
