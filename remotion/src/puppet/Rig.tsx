import { useId } from "react";
import { useCurrentFrame } from "remotion";
import type { Act, Emotion, Look } from "@jf/core";
import { ANIMALS, Accessory, BACK, BOTH, DEFAULT_HAIR, FRONT, FUR, FUR_TRIM, GhostSheet, HAND, HairBack, HairTop, OVER, PLASTER, RIG, ROBES, defaultBuild, isChild, spotColor } from "./Accessories";
import type { BodyGeo } from "./Accessories";
import { Face } from "./Face";
import { PropItem } from "../props/Props";
import { BODY_TOP, BUILDS, armAngles, asBuild, blink, bodyBob, legAngles, mouthOpen } from "./motion";
import { basePose, mR, mT, mmul, resolvePose } from "./acts";
import type { ArmP, HandShape, LegP, RigGeo } from "./acts";
import { FxLayer } from "./Fx";

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
  /**
   * Действие (бит act): name — из ACTS (@jf/core), k — сила позы 0..1 (плавный вход/выход),
   * t — секунды с начала действия (для циклов: машет, хлопает, смеётся, бежит, дрожит).
   */
  act?: { name: Act; k: number; t: number };
  /** Сидит (за столом): 0..1 — кукла опускается на высоту ног. */
  seated?: number;
  /** Вздрагивает от удара: 0..1 — отшатывается, голова в сторону. */
  flinch?: number;
};

/**
 * Векторная кукла: тело по телосложению, ноги, руки, голова с лицом и аксессуарами.
 * Стиль: плоские округлые формы, без контуров.
 * Позы действий (act, seated, flinch) — в acts.ts: там поза — набор углов, здесь она только рисуется.
 * Руки и ноги — по два звена (плечо+предплечье, бедро+голень); без действия звенья на одной линии и фигура как прежде.
 */
export const Puppet = ({ look, emotion, speaking, walk = 0, facing = 1, hold, seed, act, seated = 0, flinch = 0 }: PuppetProps) => {
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
  const tilt0 = speaking ? Math.sin(frame / 11 + seed) * 3 : emotion === "surprised" ? -4 : 0;
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
  const hipY = bodyBottom - 10;

  // поза: обычная (эмоция, речь, шаг) → сидя → действие → вздрагивание
  const rg: RigGeo = {
    shY: shoulderY, sxF: 150 + (build.bodyW / 2 - 6), sxB: 150 - (build.bodyW / 2 - 6), L: (armL - 6) / 2,
    hipY, Lf: footY - hipY, legGap: build.legGap, bodyW: build.bodyW, bodyH: build.bodyH, bodyBottom,
  };
  const { pose, face, fx, fxK, over, hand } = resolvePose(basePose(arms, legs, tilt0), rg, { act, seated, flinch, hold });
  const sy = shoulderY - pose.shoulder;
  const actK = Math.min(1, Math.max(0, act?.k ?? 0));
  const bent = pose.drop > 8 || Math.abs(pose.legF.a) > 30 || Math.abs(pose.legB.a) > 30;
  const backShade = Math.min(1, Math.max(0, pose.drop / 40)) * 0.15;
  // матрицы для значков над головой (Z, сердечко): корпус и голова в кадре фигуры
  const mRoot = mmul(mmul(mT(pose.x, -pose.lift), mR(pose.rot, 150, FEET_Y)), mT(0, dy + bob + pose.drop));
  const mTorso = mmul(mRoot, mR(pose.lean, 150, hipY));
  const mHead = mmul(mTorso, mmul(mT(pose.headX, pose.headY), mR(pose.tilt, 150, 236)));

  const Leg = ({ side, p, color }: { side: -1 | 1; p: LegP; color: string }) => {
    const x = 150 + side * build.legGap + p.dx;
    const half = rg.Lf / 2;
    const ky = hipY + half * p.ts; // колено
    const shift = ky - (hipY + half); // предметы голени, нарисованные для прямой ноги, едут вместе с коленом
    return (
      <g transform={`rotate(${-p.a} ${x} ${hipY})`}>
        <rect x={x - 19} y={bodyBottom - 20} width={38} height={ky + 16 - (bodyBottom - 20)} rx={16} fill={color} />
        <g transform={`rotate(${p.a - p.s} ${x} ${ky})`}>
          <rect x={x - 19} y={ky - 16} width={38} height={footY + shift - 4 - (ky - 16)} rx={16} fill={color} />
          <g transform={`translate(0 ${shift})`}>
            <g transform={p.fr ? `rotate(${p.fr} ${x} ${footY})` : undefined}>
              {penguin ? (
                <path d={`M${x - 22} ${footY + 8} Q${x - 18} ${footY - 10} ${x + 4} ${footY - 10} Q${x + 30} ${footY - 6} ${x + 38} ${footY + 8} Z`} fill="#e08a20" />
              ) : baby ? (
                <ellipse cx={x + 6} cy={footY} rx={22} ry={13} fill={shade(clothes, 0.12)} />
              ) : !animal ? (
                <ellipse cx={x + 8} cy={footY} rx={30} ry={14} fill="#2b1d14" />
              ) : null}
              {poodle && <circle cx={x} cy={footY - 6} r={22} fill={look.hair ?? skin} />}
            </g>
            {bandaged && side === 1 && (
              <>
                <rect x={x - 22} y={bodyBottom + build.legH * 0.25} width={44} height={build.legH * 0.75 - 4} rx={14} fill={PLASTER} />
                <ellipse cx={x + 6} cy={footY} rx={30} ry={15} fill={PLASTER} />
              </>
            )}
          </g>
        </g>
        {spots && <circle cx={x - 4} cy={bodyBottom + build.legH * 0.45} r={8} fill={spots} />}
      </g>
    );
  };

  const Arm = ({ side, p, shape }: { side: -1 | 1; p: ArmP; shape?: HandShape }) => {
    const sx = 150 + side * (build.bodyW / 2 - 6);
    const Ls = rg.L * p.s;
    const ey = sy + Ls; // локоть
    const hy0 = shoulderY + armL - 6; // кисть прямой руки (по ней нарисованы гипс, мех, крюк, предмет)
    const shift = sy + 2 * Ls - hy0;
    const r = (animal ? 18 : 19) * p.palm;
    // рука поперёк тела (хлопок, объятие, смех) — рукав чуть темнее, иначе сливается с одеждой;
    // ладонь на лице — чуть темнее кожи. Только в действии: обычные руки как раньше.
    const hx = sx + Ls * (Math.sin(p.u / 57.2958) + Math.sin(p.f / 57.2958));
    const cross = actK * Math.min(1, Math.max(0, (build.bodyW / 2 + 6 - side * (hx - 150)) / 36));
    const arm = cross > 0.01 ? shade(sleeve, 0.17 * cross) : sleeve;
    const onFace = side === 1 ? over.F : over.B;
    const palmC = onFace ? shade(skin, 0.1) : skin;
    if (penguin) {
      // ласт: одно звено, смотрит на кисть
      const [hx, hy] = [sx + Ls * (Math.sin(p.u / 57.2958) + Math.sin(p.f / 57.2958)), sy + Ls * (Math.cos(p.u / 57.2958) + Math.cos(p.f / 57.2958))];
      const dir = Math.abs(p.u - p.f) < 0.01 ? p.u : (Math.atan2(hx - sx, hy - sy) * 180) / Math.PI;
      return (
        <g transform={`rotate(${-dir} ${sx} ${sy})`}>
          <path d={`M${sx - 18} ${sy - 6} Q${sx - 24} ${sy + armL * 0.7} ${sx + side * 6} ${sy + armL + 10} Q${sx + 20} ${sy + armL * 0.5} ${sx + 18} ${sy - 6} Z`} fill={sleeve} />
          {hold && side === 1 && <PropItem id={hold} x={sx} y={sy + armL + 4} />}
        </g>
      );
    }
    return (
      <g transform={`rotate(${-p.u} ${sx} ${sy})`}>
        <rect x={sx - 18} y={sy - 10} width={36} height={Ls + 28} rx={18} fill={arm} />
        <g transform={`rotate(${p.u - p.f} ${sx} ${ey})`}>
          <rect x={sx - 18} y={ey - 18} width={36} height={Ls + 14} rx={18} fill={arm} />
          <g transform={`translate(0 ${shift})`}>
            {bandaged && side === -1 && <rect x={sx - 21} y={shoulderY + armL * 0.42} width={42} height={armL * 0.5} rx={16} fill={PLASTER} />}
            {fur && <circle cx={sx} cy={shoulderY + armL - 26} r={21} fill={FUR_TRIM} />}
            {hook && side === -1 ? (
              // пиратский крюк вместо кисти
              <g>
                <rect x={sx - 16} y={shoulderY + armL - 22} width={32} height={14} rx={5} fill="#5b4636" />
                <path d={`M${sx} ${shoulderY + armL - 10} v20 q0 24 -20 24 q-16 0 -18 -16`} stroke="#9aa0a6" strokeWidth={7} fill="none" strokeLinecap="round" />
              </g>
            ) : shape === "pray" ? (
              // ладони вместе: «капля» остриём вверх (обе кисти в одной точке дают одну фигуру)
              <path transform={`rotate(${p.f} ${sx} ${hy0})`} d={`M${sx} ${hy0 - 40} Q${sx + 19} ${hy0 - 6} ${sx + 13} ${hy0 + 14} Q${sx} ${hy0 + 22} ${sx - 13} ${hy0 + 14} Q${sx - 19} ${hy0 - 6} ${sx} ${hy0 - 40} Z`} fill={skin} />
            ) : (
              <>
                {shape === "point" && <rect x={sx - 6} y={hy0} width={12} height={38} rx={6} fill={skin} />}
                {p.palm === 1 && shape !== "fist" ? (
                  <circle cx={sx} cy={hy0} r={r} fill={palmC} />
                ) : (
                  <ellipse cx={sx} cy={hy0 + (p.palm - 1) * 8} rx={shape === "fist" ? r * 1.1 : r} ry={shape === "fist" ? r * 1.1 : r * 1.15} fill={palmC} />
                )}
                {p.palm >= 1.25 && shape !== "fist" && (
                  // пальцы: три бороздки на краю ладони
                  <g stroke={shade(skin, 0.28)} strokeWidth={3} strokeLinecap="round">
                    {[-0.4, 0, 0.4].map((k) => <line key={k} x1={sx + k * r} y1={hy0 + (p.palm - 1) * 8 + r * 0.55} x2={sx + k * r} y2={hy0 + (p.palm - 1) * 8 + r * 1.05} />)}
                  </g>
                )}
              </>
            )}
            {hold && side === 1 && (
              <g transform={`rotate(${p.f + pose.propR} ${sx} ${shoulderY + armL + 4})`}>
                <PropItem id={hold} x={sx} y={shoulderY + armL + 4} />
              </g>
            )}
          </g>
        </g>
        {spots && <circle cx={sx + 4} cy={sy + armL * 0.4} r={8} fill={spots} />}
        {p.bulge > 0.05 && <ellipse cx={sx + side * 14} cy={sy + Ls * 0.6} rx={16 * p.bulge} ry={22 * p.bulge} fill={arm} />}
      </g>
    );
  };

  const armB = <Arm side={-1} p={pose.armB} shape={hand.B} />;
  const armF = <Arm side={1} p={pose.armF} shape={hand.F} />;
  const fxM = { torso: mTorso, head: mHead };

  return (
    <svg viewBox={`0 0 ${BOX_W} ${BOX_H}`} style={{ height: "100%", overflow: "visible" }}>
      <defs>
        <clipPath id={`body-${uid}`}>
          <path d={body} />
        </clipPath>
      </defs>
      <g transform={`translate(150 ${FEET_Y}) scale(${facing * scale} ${scale}) translate(-150 ${-FEET_Y})`}>
        {/* тень на полу в прыжке */}
        {pose.lift > 3 && Math.abs(pose.rot) < 20 && (
          <ellipse cx={150 + pose.x} cy={FEET_Y} rx={(build.bodyW / 2 + 20) * Math.max(0.5, 1 - pose.lift / 400)} ry={12} fill="#000" opacity={0.15} />
        )}
        <g transform={`translate(${pose.x} ${-pose.lift}) rotate(${pose.rot} 150 ${FEET_Y})`}>
        <g transform={`translate(0 ${dy + bob + pose.drop})`}>
          {/* ноги (под длинной рясой видны только ботинки; сидя/на коленях ряса — на ногах) */}
          {robeColor && !bent ? (
            <>
              <path d={`M${bx - 10} ${BODY_TOP + 40} L${bx - 30} ${bodyBottom + build.legH} H${bx + build.bodyW + 30} L${bx + build.bodyW + 10} ${BODY_TOP + 40} Z`} fill={robeColor} />
              <ellipse cx={150 - build.legGap} cy={bodyBottom + build.legH} rx={28} ry={12} fill="#2b1d14" />
              <ellipse cx={150 + build.legGap} cy={bodyBottom + build.legH} rx={28} ry={12} fill="#2b1d14" />
            </>
          ) : (
            <>
              {(() => {
                const c = robeColor ?? (kind === "bird" || penguin ? "#e0a030" : pants);
                return (
                  <>
                    <Leg side={-1} p={pose.legB} color={backShade > 0 ? shade(c, backShade) : c} />
                    <Leg side={1} p={pose.legF} color={c} />
                    {/* таз: при наклоне/сидя закрывает стык ног и корпуса */}
                    {(pose.lean > 4 || pose.drop > 4) && <ellipse cx={150 + pose.legF.dx * 0.5} cy={hipY + 4} rx={build.legGap + 22} ry={28} fill={robeColor ?? (SKIRTED.has(kind) ? clothes : c)} />}
                  </>
                );
              })()}
            </>
          )}

          <g transform={pose.lean ? `rotate(${pose.lean} 150 ${hipY})` : undefined}>
          <g transform={pose.headX || pose.headY ? `translate(${pose.headX} ${pose.headY})` : undefined}>
            {acc.filter((a) => BACK.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} />)}
            {!animal && <HairBack style={hairStyle} color={hairColor} />}
          </g>

          {/* тело */}
          <path d={body} fill={robeColor ?? clothes} />
          {penguin && <ellipse cx={150} cy={BODY_TOP + build.bodyH * 0.56} rx={build.bodyW / 2 - 26} ry={build.bodyH / 2 - 6} fill="#f6f2e8" />}
          {build === BUILDS.portly && !robeColor && <ellipse cx={150} cy={bodyBottom - 50} rx={build.bodyW / 2 - 6} ry={60} fill={shade(clothes, 0.08)} />}
          <g clipPath={`url(#body-${uid})`}>
            {accent && !robeColor && <rect x={130} y={BODY_TOP} width={40} height={build.bodyH} fill={accent} opacity={0.8} />}
            {acc.filter((a) => FRONT.has(a) && !HAND.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} skin={skin} geo={geo} part="body" />)}
          </g>
          {!robeColor && acc.filter((a) => OVER.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} skin={skin} geo={geo} part="body" />)}

          {/* руки и реквизит в руках (рука у лица — поверх головы, ниже) */}
          {!over.B && armB}
          {!over.F && armF}
          {acc.filter((a) => HAND.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} skin={skin} geo={geo} />)}

          {/* голова */}
          <g transform={`${pose.headX || pose.headY ? `translate(${pose.headX} ${pose.headY}) ` : ""}rotate(${pose.tilt} 150 236)`}>
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
              brows={!acc.includes("high-drawn-eyebrows")} fx={face} />

            {acc.includes("ghost-sheet") && <GhostSheet geo={geo} />}
            {acc.filter((a) => (!FRONT.has(a) || BOTH.has(a)) && !ROBES.has(a) && !BACK.has(a) && !OVER.has(a) && !RIG.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} skin={skin} geo={geo} part="head" />)}
            {fx.length > 0 && <FxLayer items={fx} where="head" facing={facing} opacity={fxK} />}
          </g>
          {over.B && armB}
          {over.F && armF}
          {fx.length > 0 && <FxLayer items={fx} where="torso" facing={facing} opacity={fxK} />}
          </g>
        </g>
        </g>
        {fx.length > 0 && <FxLayer items={fx} where="up" M={fxM} facing={facing} opacity={fxK} />}
      </g>
    </svg>
  );
};
