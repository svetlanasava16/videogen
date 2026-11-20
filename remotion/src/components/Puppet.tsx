import { useCurrentFrame } from "remotion";
import type { Character, Emotion } from "@jf/core";

const brow: Record<Emotion, { l: number; r: number }> = {
  neutral: { l: 0, r: 0 },
  happy: { l: -4, r: 4 },
  angry: { l: 14, r: -14 },
  surprised: { l: -10, r: 10 },
  sad: { l: -12, r: 12 },
  smug: { l: 8, r: -2 },
};

const HAIR: Record<string, string> = {
  man: "#3a2a20",
  woman: "#6b3e26",
  boy: "#c98a3c",
  girl: "#8a4b2a",
  "old-man": "#d9d9d9",
  "old-woman": "#e3e3e3",
};

const isChild = (k: string) => k === "boy" || k === "girl";
const isAnimal = (k: string) => ["bear", "hare", "dog", "cat"].includes(k);

/**
 * Параметрическая 2D-кукла (SVG) — заглушка до арта из ComfyUI.
 * Липсинк: рот открывается, пока персонаж говорит.
 */
export const Puppet = ({
  character, speaking, emotion, flip, seed,
}: { character: Character; speaking: boolean; emotion: Emotion; flip: boolean; seed: number }) => {
  const frame = useCurrentFrame();
  const { kind, skin, clothes, accent } = character.look;
  const bob = Math.sin((frame + seed) / 9) * 6;
  const open = speaking ? 6 + Math.abs(Math.sin(frame * 0.85 + seed)) * 20 : 3;
  const size = (isChild(kind) ? 0.78 : 1) * (speaking ? 1.06 : 1);
  const b = brow[emotion];
  const hair = HAIR[kind];

  return (
    <svg
      viewBox="0 0 300 420"
      style={{ height: "100%", transform: `scale(${flip ? -size : size}, ${size})`, transformOrigin: "50% 100%" }}
    >
      <g transform={`translate(0 ${bob})`}>
        {/* длинные волосы — за головой */}
        {kind === "woman" && <path d="M70 150 Q60 260 95 290 L205 290 Q240 260 230 150 Z" fill={hair} />}
        {kind === "girl" && (<><circle cx="70" cy="190" r="22" fill={hair} /><circle cx="230" cy="190" r="22" fill={hair} /></>)}

        {/* тело */}
        <rect x={kind === "woman" ? 75 : 60} y="230" width={kind === "woman" ? 150 : 180} height="190" rx="40" fill={clothes} />
        {accent && <rect x="130" y="230" width="40" height="190" fill={accent} opacity="0.8" />}

        {/* уши */}
        {kind === "bear" && (<><circle cx="90" cy="95" r="26" fill={skin} /><circle cx="210" cy="95" r="26" fill={skin} /></>)}
        {kind === "hare" && (<><ellipse cx="115" cy="40" rx="18" ry="62" fill={skin} /><ellipse cx="185" cy="40" rx="18" ry="62" fill={skin} /></>)}
        {kind === "cat" && (<><path d="M85 120 L95 55 L135 95 Z" fill={skin} /><path d="M215 120 L205 55 L165 95 Z" fill={skin} /></>)}
        {kind === "dog" && (<><ellipse cx="78" cy="150" rx="20" ry="45" fill="#5a3b22" /><ellipse cx="222" cy="150" rx="20" ry="45" fill="#5a3b22" /></>)}
        {!isAnimal(kind) && (<><circle cx="78" cy="160" r="14" fill={skin} /><circle cx="222" cy="160" r="14" fill={skin} /></>)}

        {/* голова */}
        <ellipse cx="150" cy="160" rx="76" ry="82" fill={skin} />

        {/* волосы сверху */}
        {hair && kind !== "old-woman" && <path d="M74 150 Q74 76 150 74 Q226 76 226 150 Q206 112 150 108 Q94 112 74 150 Z" fill={hair} />}
        {kind === "old-woman" && (<><path d="M74 150 Q74 80 150 78 Q226 80 226 150 Q200 116 150 112 Q100 116 74 150 Z" fill={hair} /><circle cx="150" cy="70" r="22" fill={hair} /></>)}
        {kind === "devil" && (<><path d="M100 95 L88 40 L122 85 Z" fill="#b3261e" /><path d="M200 95 L212 40 L178 85 Z" fill="#b3261e" /></>)}
        {kind === "angel" && <ellipse cx="150" cy="58" rx="58" ry="12" fill="none" stroke="#f5d76e" strokeWidth="8" />}

        {/* глаза */}
        <circle cx="122" cy="152" r="11" fill="#fff" /><circle cx="178" cy="152" r="11" fill="#fff" />
        <circle cx="124" cy="154" r="5" fill="#111" /><circle cx="180" cy="154" r="5" fill="#111" />
        {/* брови */}
        <rect x="106" y="128" width="32" height="6" rx="3" fill="#2b1d14" transform={`rotate(${b.l} 122 131)`} />
        <rect x="162" y="128" width="32" height="6" rx="3" fill="#2b1d14" transform={`rotate(${b.r} 178 131)`} />
        {/* нос */}
        {isAnimal(kind) ? <ellipse cx="150" cy="182" rx="14" ry="10" fill="#2b1d14" /> : <ellipse cx="150" cy="176" rx="8" ry="10" fill="#00000022" />}
        {/* усы у деда */}
        {kind === "old-man" && <path d="M118 194 Q150 180 182 194 Q150 204 118 194 Z" fill={hair} />}
        {/* рот */}
        <ellipse cx="150" cy="208" rx="22" ry={open} fill="#3a0f0f" />
      </g>
    </svg>
  );
};
