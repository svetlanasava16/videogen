import { useId } from "react";
import { useCurrentFrame } from "remotion";
import type { Emotion, Look } from "@jf/core";
import { ANIMALS, Accessory, BACK, BOTH, DEFAULT_HAIR, FRONT, FUR, FUR_TRIM, GhostSheet, HAND, HairBack, HairTop, OVER, PLASTER, RIG, ROBES, defaultBuild, isChild, spotColor } from "./Accessories";
import type { BodyGeo } from "./Accessories";
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
  const build = BUILDS[asBuild(look.build ?? defaultBuild(kind))];
  const def = DEFAULT_HAIR[kind];
  const hairColor = look.hair ?? def?.color ?? "#3a2a20";
  const hairStyle = look.hairStyle ?? def?.style ?? "none";
  const robe = acc.find((a) => ROBES.has(a));
  const robeColor = robe ? ROBE_COLORS[robe] : undefined;
  const hook = acc.includes("hook-hand");
  const bandaged = acc.includes("bandages");
  const fur = acc.includes("fur-coat") && !robeColor;
  const spots = acc.includes("spots") ? spotColor(skin) : undefined;
  const poodle = kind === "dog" && look.hairStyle === "curly";
  const penguin = kind === "penguin";
  const baby = kind === "baby";

  const bodyBottom = BODY_TOP + build.bodyH;
  const dy = FEET_Y - (bodyBottom + build.legH); // сдвиг всей фигуры, чтобы ноги стояли на полу
  const bob = bodyBob(frame, seed, walk);
  const arms = armAngles(emotion, speaking, frame, seed, walk);
  if (hold && walk < 0.2) arms.right = 38; // рука с предметом чуть вынесена вперёд
  const legs = legAngles(frame, walk);
  const open = speaking ? mouthOpen(frame, seed) : 0;
  const tilt = speaking ? Math.sin(frame / 11 + seed) * 3 : emotion === "surprised" ? -4 : 0;
  const scale = (isChild(kind) ? 0.9 : 1) * (build.scale ?? 1);

  const bx = 150 - build.bodyW / 2;
  const body = SKIRTED.has(kind)
    ? `M${bx + 18} ${BODY_TOP} H${bx + build.bodyW - 18} Q${bx + build.bodyW} ${BODY_TOP} ${bx + build.bodyW + 4} ${BODY_TOP + 40} L${bx + build.bodyW + 26} ${bodyBottom} H${bx - 26} L${bx - 4} ${BODY_TOP + 40} Q${bx} ${BODY_TOP} ${bx + 18} ${BODY_TOP} Z`
    : `M${bx + 40} ${BODY_TOP} H${bx + build.bodyW - 40} Q${bx + build.bodyW} ${BODY_TOP} ${bx + build.bodyW} ${BODY_TOP + 40} V${bodyBottom - 30} Q${bx + build.bodyW} ${bodyBottom} ${bx + build.bodyW - 30} ${bodyBottom} H${bx + 30} Q${bx} ${bodyBottom} ${bx} ${bodyBottom - 30} V${BODY_TOP + 40} Q${bx} ${BODY_TOP} ${bx + 40} ${BODY_TOP} Z`;
  const pants = animal ? skin : SKIRTED.has(kind) ? skin : baby ? clothes : shade(clothes, 0.35);
  const sleeve = animal ? skin : robeColor ?? (fur ? FUR : clothes);
  const armL = Math.round(build.bodyH * 0.72);
  const shoulderY = BODY_TOP + 30;
  const geo: BodyGeo = { bx, w: build.bodyW, top: BODY_TOP, bottom: bodyBottom, legH: build.legH };
  const footY = bodyBottom + build.legH - 2;

  const Leg = ({ x, angle }: { x: number; angle: number }) => (
    <g transform={`rotate(${angle} ${x} ${bodyBottom - 10})`}>
      <rect x={x - 19} y={bodyBottom - 20} width={38} height={build.legH + 14} rx={16} fill={kind === "bird" || penguin ? "#e0a030" : pants} />
      {spots && <circle cx={x - 4} cy={bodyBottom + build.legH * 0.45} r={8} fill={spots} />}
      {penguin ? (
        <path d={`M${x - 22} ${footY + 8} Q${x - 18} ${footY - 10} ${x + 4} ${footY - 10} Q${x + 30} ${footY - 6} ${x + 38} ${footY + 8} Z`} fill="#e08a20" />
      ) : baby ? (
        <ellipse cx={x + 6} cy={footY} rx={22} ry={13} fill={shade(clothes, 0.12)} />
      ) : !animal ? (
        <ellipse cx={x + 8} cy={footY} rx={30} ry={14} fill="#2b1d14" />
      ) : null}
      {poodle && <circle cx={x} cy={footY - 6} r={22} fill={look.hair ?? skin} />}
      {bandaged && x > 150 && (
        <>
          <rect x={x - 22} y={bodyBottom + build.legH * 0.25} width={44} height={build.legH * 0.75 - 4} rx={14} fill={PLASTER} />
          <ellipse cx={x + 6} cy={footY} rx={30} ry={15} fill={PLASTER} />
        </>
      )}
    </g>
  );
  const Arm = ({ side, angle }: { side: -1 | 1; angle: number }) => {
    const sx = 150 + side * (build.bodyW / 2 - 6);
    return (
      <g transform={`rotate(${-side * angle} ${sx} ${shoulderY})`}>
        {penguin ? (
          // ласт: сужается к концу, без кисти
          <path d={`M${sx - 18} ${shoulderY - 6} Q${sx - 24} ${shoulderY + armL * 0.7} ${sx + side * 6} ${shoulderY + armL + 10} Q${sx + 20} ${shoulderY + armL * 0.5} ${sx + 18} ${shoulderY - 6} Z`} fill={sleeve} />
        ) : (
          <rect x={sx - 18} y={shoulderY - 10} width={36} height={armL} rx={18} fill={sleeve} />
        )}
        {spots && <circle cx={sx + 4} cy={shoulderY + armL * 0.4} r={8} fill={spots} />}
        {bandaged && side === -1 && <rect x={sx - 21} y={shoulderY + armL * 0.42} width={42} height={armL * 0.5} rx={16} fill={PLASTER} />}
        {fur && <circle cx={sx} cy={shoulderY + armL - 26} r={21} fill={FUR_TRIM} />}
        {hook && side === -1 ? (
          // пиратский крюк вместо кисти
          <g>
            <rect x={sx - 16} y={shoulderY + armL - 22} width={32} height={14} rx={5} fill="#5b4636" />
            <path d={`M${sx} ${shoulderY + armL - 10} v20 q0 24 -20 24 q-16 0 -18 -16`} stroke="#9aa0a6" strokeWidth={7} fill="none" strokeLinecap="round" />
          </g>
        ) : penguin ? null : (
          <circle cx={sx} cy={shoulderY + armL - 6} r={animal ? 18 : 19} fill={skin} />
        )}
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
          {penguin && <ellipse cx={150} cy={BODY_TOP + build.bodyH * 0.56} rx={build.bodyW / 2 - 26} ry={build.bodyH / 2 - 6} fill="#f6f2e8" />}
          {build === BUILDS.portly && !robeColor && <ellipse cx={150} cy={bodyBottom - 50} rx={build.bodyW / 2 - 6} ry={60} fill={shade(clothes, 0.08)} />}
          <g clipPath={`url(#body-${uid})`}>
            {accent && !robeColor && <rect x={130} y={BODY_TOP} width={40} height={build.bodyH} fill={accent} opacity={0.8} />}
            {acc.filter((a) => FRONT.has(a) && !HAND.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} skin={skin} geo={geo} part="body" />)}
          </g>
          {!robeColor && acc.filter((a) => OVER.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} skin={skin} geo={geo} part="body" />)}

          {/* руки и реквизит в руках */}
          <Arm side={-1} angle={arms.left} />
          <Arm side={1} angle={arms.right} />
          {acc.filter((a) => HAND.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} skin={skin} geo={geo} />)}

          {/* голова */}
          <g transform={`rotate(${tilt} 150 236)`}>
            {kind === "bear" && (<><circle cx="90" cy="95" r="26" fill={skin} /><circle cx="210" cy="95" r="26" fill={skin} /></>)}
            {kind === "hare" && (<><ellipse cx="115" cy="40" rx="18" ry="62" fill={skin} /><ellipse cx="185" cy="40" rx="18" ry="62" fill={skin} /></>)}
            {kind === "cat" && (<><path d="M85 120 L95 55 L135 95 Z" fill={skin} /><path d="M215 120 L205 55 L165 95 Z" fill={skin} /></>)}
            {kind === "dog" && !poodle && (<><ellipse cx="78" cy="150" rx="20" ry="45" fill={accent ?? (spots ? "#2b1d14" : "#5a3b22")} /><ellipse cx="222" cy="150" rx="20" ry="45" fill={accent ?? (spots ? "#2b1d14" : "#5a3b22")} /></>)}
            {poodle && <g fill={look.hair ?? skin}>{[[78, 132], [70, 160], [80, 188], [222, 132], [230, 160], [220, 188]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={20} />)}</g>}
            {kind === "cow" && (<><path d="M86 108 L60 80 L96 96 Z" fill="#f2e6d0" /><path d="M214 108 L240 80 L204 96 Z" fill="#f2e6d0" /><ellipse cx="70" cy="140" rx="24" ry="12" fill={skin} /><ellipse cx="230" cy="140" rx="24" ry="12" fill={skin} /></>)}
            {kind === "horse" && (<><path d="M104 96 L96 50 L128 86 Z" fill={skin} /><path d="M196 96 L204 50 L172 86 Z" fill={skin} /><path d="M140 70 Q150 40 160 70 L160 120 L140 120 Z" fill={look.hair ?? "#3a2a20"} /></>)}
            {!animal && (<><circle cx="78" cy="160" r="14" fill={skin} /><circle cx="222" cy="160" r="14" fill={skin} /></>)}

            {kind === "horse" ? <ellipse cx="150" cy="170" rx="62" ry="96" fill={skin} /> : <ellipse cx="150" cy="160" rx="76" ry="82" fill={skin} />}
            {kind === "cow" && (<><ellipse cx="118" cy="128" rx="24" ry="18" fill="#2b1d14" opacity="0.8" /><ellipse cx="150" cy="210" rx="44" ry="26" fill="#f0b8b8" /></>)}
            {kind === "bird" && <path d="M150 166 L196 182 L150 198 Z" fill="#e0a030" />}
            {penguin && <path d="M150 104 Q186 104 204 136 Q214 176 196 206 Q176 236 150 236 Q124 236 104 206 Q86 176 96 136 Q114 104 150 104 Z" fill="#f6f2e8" />}
            {baby && (<><circle cx="104" cy="190" r="13" fill="#f0a0a0" opacity="0.45" /><circle cx="196" cy="190" r="13" fill="#f0a0a0" opacity="0.45" /></>)}

            {(!animal || poodle) && <HairTop style={hairStyle} color={hairColor} />}
            {kind !== "bird" && !penguin && (animal ? <ellipse cx="150" cy={kind === "cow" ? 206 : 182} rx="14" ry="10" fill="#2b1d14" /> : <ellipse cx="150" cy="176" rx="8" ry="10" fill="#00000022" />)}

            <Face emotion={emotion} speaking={speaking} open={open} blinking={blink(frame, seed)} skin={skin} animal={animal}
              mouthY={kind === "horse" ? 230 : kind === "cow" ? 222 : 208} beak={kind === "bird"} beakFront={penguin}
              brows={!acc.includes("high-drawn-eyebrows")} />

            {acc.includes("ghost-sheet") && <GhostSheet geo={geo} />}
            {acc.filter((a) => (!FRONT.has(a) || BOTH.has(a)) && !ROBES.has(a) && !BACK.has(a) && !OVER.has(a) && !RIG.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} skin={skin} geo={geo} part="head" />)}
          </g>
        </g>
      </g>
    </svg>
  );
};
