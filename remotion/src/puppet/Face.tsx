import { useId } from "react";
import type { Emotion } from "@jf/core";
import type { FaceFx } from "./acts";

const brow: Record<Emotion, { l: number; r: number; dy: number }> = {
  neutral: { l: 0, r: 0, dy: 0 },
  happy: { l: -4, r: 4, dy: -4 },
  angry: { l: 16, r: -16, dy: 6 },
  surprised: { l: -10, r: 10, dy: -14 },
  sad: { l: -14, r: 14, dy: 0 },
  smug: { l: 10, r: -2, dy: 2 },
};

/** Глаза, брови и рот. Координаты бокса 300×420, центр головы (150,160). */
export const Face = ({
  emotion, speaking, open, blinking, skin, animal, mouthY = 208, beak = false, beakFront = false, brows = true, fx, lips,
}: {
  /** Помада (аксессуар lipstick): цвет губ — обводка вокруг рта любой формы, двигается вместе с ним. */ lips?: string;
  emotion: Emotion; speaking: boolean; open: number; blinking: boolean; skin: string; animal: boolean; mouthY?: number;
  /** Клюв в профиль (птица). */ beak?: boolean;
  /** Клюв анфас (пингвин): нижняя половина опускается при речи. */ beakFront?: boolean;
  /** false — свои брови не рисовать (их заменяет аксессуар, например high-drawn-eyebrows). */ brows?: boolean;
  /** Лицо действия (acts.ts): глаза, рот, брови, взгляд — поверх эмоции. */ fx?: FaceFx;
}) => {
  const lipsId = `lips${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const b = brow[fx?.brows ?? emotion];
  const big = fx?.eyes === "wide" || (!fx?.eyes && emotion === "surprised");
  const eyeR = big ? 14 : 11;
  const pupilR = big ? 4 : 5;
  const pupilDy = emotion === "sad" ? 4 : 2;
  const laughing = speaking && emotion === "happy";
  const lid = fx?.eyes === "wide" ? 0 : emotion === "angry" || emotion === "smug" ? 0.5 : emotion === "sad" ? 0.3 : laughing ? 0.45 : 0;
  const [lx, ly] = fx?.look ?? [0, 0];
  const shut = fx?.eyes && fx.eyes !== "wide" ? fx.eyes : undefined;
  // рот действия; при речи говорящий рот главнее, кроме смеха/поцелуя/жевания/рыданий
  const mfx = fx?.mouth && !beak && !beakFront && (!speaking || ["laugh", "pucker", "chomp", "wail"].includes(fx.mouth)) ? fx.mouth : undefined;

  return (
    <g>
      {/* глаза */}
      {[122, 178].map((x) =>
        shut ? (
          <ShutEye key={x} kind={shut} x={x} />
        ) : blinking ? (
          <rect key={x} x={x - eyeR} y={151} width={eyeR * 2} height={4} rx={2} fill="#2b1d14" />
        ) : (
          <g key={x}>
            <circle cx={x} cy={152} r={eyeR} fill="#fff" />
            <circle cx={x + 2 + lx} cy={152 + pupilDy + ly} r={pupilR} fill="#111" />
            {lid > 0 && <rect x={x - eyeR - 1} y={152 - eyeR - 1} width={eyeR * 2 + 2} height={(eyeR * 2 + 2) * lid} fill={skin} />}
          </g>
        ),
      )}
      {/* брови */}
      {brows && <rect x="106" y={128 + b.dy} width="32" height="6" rx="3" fill="#2b1d14" transform={`rotate(${b.l} 122 ${131 + b.dy})`} />}
      {brows && <rect x="162" y={128 + b.dy} width="32" height="6" rx="3" fill="#2b1d14" transform={`rotate(${b.r} 178 ${131 + b.dy})`} />}

      {/* рот (с помадой — обведён цветом губ через фильтр: контур повторяет любую форму рта) */}
      {lips && (
        <defs>
          <filter id={lipsId} x="-60%" y="-120%" width="220%" height="340%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="d" />
            <feFlood floodColor={lips} result="c" />
            <feComposite in="c" in2="d" operator="in" result="o" />
            <feMerge><feMergeNode in="o" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      )}
      <g filter={lips ? `url(#${lipsId})` : undefined}>
      {mfx ? (
        <ActMouth kind={mfx} y={mouthY} open={fx?.open ?? 0.8} />
      ) : beakFront ? (
        <g>
          <ellipse cx="150" cy="190" rx="13" ry={2 + open * 9} fill="#3a0f0f" />
          <path d={`M138 ${188 + open * 12} L162 ${188 + open * 12} L150 ${204 + open * 12} Z`} fill="#d07818" />
          <path d="M130 180 Q150 170 170 180 L150 196 Z" fill="#e0a030" />
        </g>
      ) : beak ? (
        speaking ? <path d={`M150 182 L192 ${186 + open * 10} L150 198 Z`} fill="#3a0f0f" /> : null
      ) : laughing ? (
        // смех: открытая улыбка, раскрывается в такт
        <path d={`M122 ${mouthY - 8} Q150 ${mouthY + 12 + open * 22} 178 ${mouthY - 8} Q150 ${mouthY - 2} 122 ${mouthY - 8} Z`} fill="#3a0f0f" />
      ) : speaking ? (
        <ellipse cx="150" cy={mouthY} rx={emotion === "surprised" ? 14 : 22} ry={4 + open * 20} fill="#3a0f0f" />
      ) : (
        <Mouth emotion={emotion} y={mouthY} animal={animal} />
      )}
      </g>
    </g>
  );
};

/** Рот без речи — по эмоции. */
function Mouth({ emotion, y, animal }: { emotion: Emotion; y: number; animal: boolean }) {
  const c = "#3a0f0f";
  switch (emotion) {
    case "happy":
      return <path d={`M126 ${y - 6} Q150 ${y + 22} 174 ${y - 6} Q150 ${y + 6} 126 ${y - 6} Z`} fill={c} />;
    case "sad":
      return <path d={`M128 ${y + 8} Q150 ${y - 10} 172 ${y + 8}`} stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" />;
    case "surprised":
      return <ellipse cx="150" cy={y} rx="11" ry="14" fill={c} />;
    case "angry":
      return <rect x="130" y={y - 3} width="40" height="7" rx="3" fill={c} />;
    case "smug":
      return <path d={`M130 ${y + 2} Q160 ${y + 6} 176 ${y - 10}`} stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" />;
    default:
      return animal ? <rect x="138" y={y - 2} width="24" height="5" rx="2" fill={c} /> : <ellipse cx="150" cy={y} rx="22" ry="3" fill={c} />;
  }
}

/** Глаза действия: зажмурены (> <), закрыты (дуги вниз), смеются (^ ^), крестики. */
function ShutEye({ kind, x }: { kind: string; x: number }) {
  const c = "#2b1d14";
  const side = x < 150 ? 1 : -1; // > у левого глаза, < у правого
  switch (kind) {
    case "squeeze":
      return <path d={`M${x - side * 12} 141 L${x + side * 9} 152 L${x - side * 12} 163`} stroke={c} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    case "happy":
      return <path d={`M${x - 13} 158 Q${x} 140 ${x + 13} 158`} stroke={c} strokeWidth={6} fill="none" strokeLinecap="round" />;
    case "x":
      return <path d={`M${x - 10} 142 L${x + 10} 162 M${x + 10} 142 L${x - 10} 162`} stroke={c} strokeWidth={6} strokeLinecap="round" />;
    default: // closed
      return <path d={`M${x - 13} 150 Q${x} 162 ${x + 13} 150`} stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" />;
  }
}

/** Рот действия: трубочкой, хохот, «о», оскал, рыдание, улыбка, жуёт, дрожит. */
function ActMouth({ kind, y, open }: { kind: string; y: number; open: number }) {
  const c = "#3a0f0f";
  switch (kind) {
    case "pucker":
      return (<><ellipse cx="160" cy={y} rx="13" ry="12" fill="#c0263e" /><ellipse cx="161" cy={y} rx="5" ry="5" fill={c} /></>);
    case "laugh":
      return (
        <g>
          <path d={`M118 ${y - 10} Q150 ${y + 16 + open * 28} 182 ${y - 10} Q150 ${y - 4} 118 ${y - 10} Z`} fill={c} />
          <ellipse cx="150" cy={y + 6 + open * 14} rx={14} ry={4 + open * 4} fill="#d9646e" />
        </g>
      );
    case "o":
      return <ellipse cx="150" cy={y} rx="10" ry="12" fill={c} />;
    case "grimace":
      return (
        <g>
          <rect x="122" y={y - 11} width="56" height="22" rx="9" fill={c} />
          <rect x="127" y={y - 7} width="46" height="14" rx="5" fill="#fff" />
          <path d={`M127 ${y} H173 M139 ${y - 7} V${y + 7} M150 ${y - 7} V${y + 7} M161 ${y - 7} V${y + 7}`} stroke="#cfc6b6" strokeWidth="2" />
        </g>
      );
    case "wail":
      return <path d={`M124 ${y + 14} Q150 ${y - 24} 176 ${y + 14} Q150 ${y + 6} 124 ${y + 14} Z`} fill={c} />;
    case "grin":
      return <path d={`M120 ${y - 8} Q150 ${y + 24} 180 ${y - 8} Q150 ${y + 4} 120 ${y - 8} Z`} fill={c} />;
    case "chomp":
      return <ellipse cx="150" cy={y} rx="18" ry={3 + open * 12} fill={c} />;
    case "wavy":
      return <path d={`M124 ${y} L132 ${y - 5} L141 ${y + 5} L150 ${y - 5} L159 ${y + 5} L168 ${y - 5} L176 ${y}`} stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    default:
      return null;
  }
}
