import type { Emotion } from "@jf/core";

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
  emotion, speaking, open, blinking, skin, animal, mouthY = 208, beak = false,
}: { emotion: Emotion; speaking: boolean; open: number; blinking: boolean; skin: string; animal: boolean; mouthY?: number; beak?: boolean }) => {
  const b = brow[emotion];
  const big = emotion === "surprised";
  const eyeR = big ? 14 : 11;
  const pupilR = big ? 4 : 5;
  const pupilDy = emotion === "sad" ? 4 : 2;
  const laughing = speaking && emotion === "happy";
  const lid = emotion === "angry" || emotion === "smug" ? 0.5 : emotion === "sad" ? 0.3 : laughing ? 0.45 : 0;

  return (
    <g>
      {/* глаза */}
      {[122, 178].map((x) =>
        blinking ? (
          <rect key={x} x={x - eyeR} y={151} width={eyeR * 2} height={4} rx={2} fill="#2b1d14" />
        ) : (
          <g key={x}>
            <circle cx={x} cy={152} r={eyeR} fill="#fff" />
            <circle cx={x + 2} cy={152 + pupilDy} r={pupilR} fill="#111" />
            {lid > 0 && <rect x={x - eyeR - 1} y={152 - eyeR - 1} width={eyeR * 2 + 2} height={(eyeR * 2 + 2) * lid} fill={skin} />}
          </g>
        ),
      )}
      {/* брови */}
      <rect x="106" y={128 + b.dy} width="32" height="6" rx="3" fill="#2b1d14" transform={`rotate(${b.l} 122 ${131 + b.dy})`} />
      <rect x="162" y={128 + b.dy} width="32" height="6" rx="3" fill="#2b1d14" transform={`rotate(${b.r} 178 ${131 + b.dy})`} />

      {/* рот */}
      {beak ? (
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
