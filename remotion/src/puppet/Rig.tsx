import { useId } from "react";
import { useCurrentFrame } from "remotion";
import type { Emotion, Look } from "@jf/core";
import { ANIMALS, Accessory, BACK, DEFAULT_HAIR, FRONT, HairBack, HairTop, ROBES, isChild } from "./Accessories";
import { Face } from "./Face";
import { PropItem } from "../props/Props";
import { BODY_TOP, BUILDS, armAngles, asBuild, blink, bodyBob, legAngles, mouthOpen } from "./motion";

/** Высота бокса куклы: ноги всегда стоят на FEET_Y, разное телосложение = разный рост. */
export const BOX_W = 300;
export const BOX_H = 600;
const FEET_Y = 585;

const ROBE_COLORS: Record<string, string> = { "robe-white": "#f6f2e8", "robe-red": "#b3261e", "robe-black": "#1d1d1d" };
const SKIRTED = new Set(["woman", "old-woman", "girl"]);

/** Затемнить цвет #rrggbb на k (0..1). */
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 - k))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("")}`;
}

export type PuppetProps = {
  look: Look;
  emotion: Emotion;
  speaking: boolean;
  /** 0..1 — насколько кукла сейчас идёт (выход/уход). */
  walk?: number;
  /** 1 — смотрит вправо, -1 — влево. */
  facing?: 1 | -1;
  /** Реквизит в правой руке (content/props.json). */
  hold?: string;
  seed: number;
};

/**
 * Векторная кукла: тело по телосложению, ноги, руки, голова с лицом и аксессуарами.
 * Стиль: плоские округлые формы, без контуров.
 */
export const Puppet = ({ look, emotion, speaking, walk = 0, facing = 1, hold, seed }: PuppetProps) => {
  const frame = useCurrentFrame();
  const uid = useId().replace(/:/g, "");
  const { kind, skin, clothes, accent } = look;
  const acc = look.accessories ?? [];
  const animal = ANIMALS.includes(kind);
  const build = BUILDS[asBuild(look.build ?? (isChild(kind) ? "child" : undefined))];
  const def = DEFAULT_HAIR[kind];
  const hairColor = look.hair ?? def?.color ?? "#3a2a20";
  const hairStyle = look.hairStyle ?? def?.style ?? "none";
  const robe = acc.find((a) => ROBES.has(a));
  const robeColor = robe ? ROBE_COLORS[robe] : undefined;

  const bodyBottom = BODY_TOP + build.bodyH;
  const dy = FEET_Y - (bodyBottom + build.legH); // сдвиг всей фигуры, чтобы ноги стояли на полу
  const bob = bodyBob(frame, seed, walk);
  const arms = armAngles(emotion, speaking, frame, seed, walk);
  if (hold && walk < 0.2) arms.right = 38; // рука с предметом чуть вынесена вперёд
  const legs = legAngles(frame, walk);
  const open = speaking ? mouthOpen(frame, seed) : 0;
  const tilt = speaking ? Math.sin(frame / 11 + seed) * 3 : emotion === "surprised" ? -4 : 0;
  const scale = isChild(kind) ? 0.9 : 1;

  const bx = 150 - build.bodyW / 2;
  const body = SKIRTED.has(kind)
    ? `M${bx + 18} ${BODY_TOP} H${bx + build.bodyW - 18} Q${bx + build.bodyW} ${BODY_TOP} ${bx + build.bodyW + 4} ${BODY_TOP + 40} L${bx + build.bodyW + 26} ${bodyBottom} H${bx - 26} L${bx - 4} ${BODY_TOP + 40} Q${bx} ${BODY_TOP} ${bx + 18} ${BODY_TOP} Z`
    : `M${bx + 40} ${BODY_TOP} H${bx + build.bodyW - 40} Q${bx + build.bodyW} ${BODY_TOP} ${bx + build.bodyW} ${BODY_TOP + 40} V${bodyBottom - 30} Q${bx + build.bodyW} ${bodyBottom} ${bx + build.bodyW - 30} ${bodyBottom} H${bx + 30} Q${bx} ${bodyBottom} ${bx} ${bodyBottom - 30} V${BODY_TOP + 40} Q${bx} ${BODY_TOP} ${bx + 40} ${BODY_TOP} Z`;
  const pants = animal ? skin : SKIRTED.has(kind) ? skin : shade(clothes, 0.35);
  const sleeve = animal ? skin : robeColor ?? clothes;
  const armL = Math.round(build.bodyH * 0.72);
  const shoulderY = BODY_TOP + 30;

  const Leg = ({ x, angle }: { x: number; angle: number }) => (
    <g transform={`rotate(${angle} ${x} ${bodyBottom - 10})`}>
      <rect x={x - 19} y={bodyBottom - 20} width={38} height={build.legH + 14} rx={16} fill={kind === "bird" ? "#e0a030" : pants} />
      {!animal && <ellipse cx={x + 8} cy={bodyBottom + build.legH - 2} rx={30} ry={14} fill="#2b1d14" />}
    </g>
  );
  const Arm = ({ side, angle }: { side: -1 | 1; angle: number }) => {
    const sx = 150 + side * (build.bodyW / 2 - 6);
    return (
      <g transform={`rotate(${-side * angle} ${sx} ${shoulderY})`}>
        <rect x={sx - 18} y={shoulderY - 10} width={36} height={armL} rx={18} fill={sleeve} />
        <circle cx={sx} cy={shoulderY + armL - 6} r={animal ? 18 : 19} fill={skin} />
        {hold && side === 1 && <PropItem id={hold} x={sx} y={shoulderY + armL + 4} />}
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${BOX_W} ${BOX_H}`} style={{ height: "100%", overflow: "visible" }}>
      <defs>
        <clipPath id={`body-${uid}`}>
          <path d={body} />
        </clipPath>
      </defs>
      <g transform={`translate(150 ${FEET_Y}) scale(${facing * scale} ${scale}) translate(-150 ${-FEET_Y})`}>
        <g transform={`translate(0 ${dy + bob})`}>
          {/* ноги (под длинной рясой видны только ботинки) */}
          {robeColor ? (
            <>
              <path d={`M${bx - 10} ${BODY_TOP + 40} L${bx - 30} ${bodyBottom + build.legH} H${bx + build.bodyW + 30} L${bx + build.bodyW + 10} ${BODY_TOP + 40} Z`} fill={robeColor} />
              <ellipse cx={150 - build.legGap} cy={bodyBottom + build.legH} rx={28} ry={12} fill="#2b1d14" />
              <ellipse cx={150 + build.legGap} cy={bodyBottom + build.legH} rx={28} ry={12} fill="#2b1d14" />
            </>
          ) : (
            <>
              <Leg x={150 - build.legGap} angle={legs.left} />
              <Leg x={150 + build.legGap} angle={legs.right} />
            </>
          )}

          {acc.filter((a) => BACK.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} />)}
          {!animal && <HairBack style={hairStyle} color={hairColor} />}

          {/* тело */}
          <path d={body} fill={robeColor ?? clothes} />
          {build === BUILDS.portly && !robeColor && <ellipse cx={150} cy={bodyBottom - 50} rx={build.bodyW / 2 - 6} ry={60} fill={shade(clothes, 0.08)} />}
          <g clipPath={`url(#body-${uid})`}>
            {accent && !robeColor && <rect x={130} y={BODY_TOP} width={40} height={build.bodyH} fill={accent} opacity={0.8} />}
            {acc.filter((a) => FRONT.has(a) && !["loot-bag", "camera", "keys", "scythe", "baguette"].includes(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} />)}
          </g>

          {/* руки и реквизит в руках */}
          <Arm side={-1} angle={arms.left} />
          <Arm side={1} angle={arms.right} />
          {acc.filter((a) => ["loot-bag", "camera", "keys", "scythe", "baguette"].includes(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} />)}

          {/* голова */}
          <g transform={`rotate(${tilt} 150 236)`}>
            {kind === "bear" && (<><circle cx="90" cy="95" r="26" fill={skin} /><circle cx="210" cy="95" r="26" fill={skin} /></>)}
            {kind === "hare" && (<><ellipse cx="115" cy="40" rx="18" ry="62" fill={skin} /><ellipse cx="185" cy="40" rx="18" ry="62" fill={skin} /></>)}
            {kind === "cat" && (<><path d="M85 120 L95 55 L135 95 Z" fill={skin} /><path d="M215 120 L205 55 L165 95 Z" fill={skin} /></>)}
            {kind === "dog" && (<><ellipse cx="78" cy="150" rx="20" ry="45" fill={accent ?? "#5a3b22"} /><ellipse cx="222" cy="150" rx="20" ry="45" fill={accent ?? "#5a3b22"} /></>)}
            {kind === "cow" && (<><path d="M86 108 L60 80 L96 96 Z" fill="#f2e6d0" /><path d="M214 108 L240 80 L204 96 Z" fill="#f2e6d0" /><ellipse cx="70" cy="140" rx="24" ry="12" fill={skin} /><ellipse cx="230" cy="140" rx="24" ry="12" fill={skin} /></>)}
            {kind === "horse" && (<><path d="M104 96 L96 50 L128 86 Z" fill={skin} /><path d="M196 96 L204 50 L172 86 Z" fill={skin} /><path d="M140 70 Q150 40 160 70 L160 120 L140 120 Z" fill={look.hair ?? "#3a2a20"} /></>)}
            {!animal && (<><circle cx="78" cy="160" r="14" fill={skin} /><circle cx="222" cy="160" r="14" fill={skin} /></>)}

            {kind === "horse" ? <ellipse cx="150" cy="170" rx="62" ry="96" fill={skin} /> : <ellipse cx="150" cy="160" rx="76" ry="82" fill={skin} />}
            {kind === "cow" && (<><ellipse cx="118" cy="128" rx="24" ry="18" fill="#2b1d14" opacity="0.8" /><ellipse cx="150" cy="210" rx="44" ry="26" fill="#f0b8b8" /></>)}
            {kind === "bird" && <path d="M150 166 L196 182 L150 198 Z" fill="#e0a030" />}

            {!animal && <HairTop style={hairStyle} color={hairColor} />}
            {kind !== "bird" && (animal ? <ellipse cx="150" cy={kind === "cow" ? 206 : 182} rx="14" ry="10" fill="#2b1d14" /> : <ellipse cx="150" cy="176" rx="8" ry="10" fill="#00000022" />)}

            <Face emotion={emotion} speaking={speaking} open={open} blinking={blink(frame, seed)} skin={skin} animal={animal}
              mouthY={kind === "horse" ? 230 : kind === "cow" ? 222 : 208} beak={kind === "bird"} />

            {acc.filter((a) => !FRONT.has(a) && !ROBES.has(a) && !BACK.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} />)}
          </g>
        </g>
      </g>
    </svg>
  );
};
