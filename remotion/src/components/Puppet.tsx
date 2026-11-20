import { useCurrentFrame } from "remotion";
import type { Emotion, Look } from "@jf/core";

const brow: Record<Emotion, { l: number; r: number }> = {
  neutral: { l: 0, r: 0 },
  happy: { l: -4, r: 4 },
  angry: { l: 14, r: -14 },
  surprised: { l: -10, r: 10 },
  sad: { l: -12, r: 12 },
  smug: { l: 8, r: -2 },
};

const DEFAULT_HAIR: Record<string, { color: string; style: string }> = {
  man: { color: "#3a2a20", style: "short" },
  woman: { color: "#6b3e26", style: "long" },
  boy: { color: "#c98a3c", style: "short" },
  girl: { color: "#8a4b2a", style: "pigtails" },
  "old-man": { color: "#d9d9d9", style: "bald" },
  "old-woman": { color: "#e3e3e3", style: "perm" },
};

const ANIMALS = ["bear", "hare", "dog", "cat", "bird", "cow", "horse"];
const isChild = (k: string) => k === "boy" || k === "girl";

/** Причёска поверх головы (и длинные волосы — отдельно, за головой). */
function HairBack({ style, color }: { style: string; color: string }) {
  if (style === "long") return <path d="M70 150 Q60 260 95 290 L205 290 Q240 260 230 150 Z" fill={color} />;
  if (style === "pigtails") return (<><circle cx="70" cy="190" r="22" fill={color} /><circle cx="230" cy="190" r="22" fill={color} /></>);
  return null;
}
function HairTop({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "short":
    case "long":
    case "pigtails":
      return <path d="M74 150 Q74 76 150 74 Q226 76 226 150 Q206 112 150 108 Q94 112 74 150 Z" fill={color} />;
    case "curly":
      return <g fill={color}>{[90, 115, 140, 165, 190, 210].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 92 : 100} r="22" />)}</g>;
    case "fringe":
      return (<><path d="M74 165 Q72 130 88 118 L92 168 Z" fill={color} /><path d="M226 165 Q228 130 212 118 L208 168 Z" fill={color} /></>);
    case "bun":
      return (<><path d="M74 150 Q74 80 150 78 Q226 80 226 150 Q200 116 150 112 Q100 116 74 150 Z" fill={color} /><circle cx="150" cy="70" r="22" fill={color} /></>);
    case "perm":
      return <g fill={color}>{[85, 110, 135, 160, 185, 212].map((x) => <circle key={x} cx={x} cy="98" r="24" />)}</g>;
    case "bald":
      return (<><path d="M76 170 Q74 140 86 130 L92 172 Z" fill={color} /><path d="M224 170 Q226 140 214 130 L208 172 Z" fill={color} /></>);
    default:
      return null;
  }
}

/** Стереотипные детали: крест, борода, кепка, корона… Неизвестные id игнорируются. */
function Accessory({ id, hair }: { id: string; hair: string }) {
  switch (id) {
    // лицо
    case "beard": return <path d="M88 185 Q90 250 150 262 Q210 250 212 185 Q190 215 150 218 Q110 215 88 185 Z" fill={hair} />;
    case "white-beard": return <path d="M84 180 Q86 270 150 290 Q214 270 216 180 Q190 220 150 222 Q110 220 84 180 Z" fill="#f2f2f2" />;
    case "goatee": return <path d="M135 222 Q150 252 165 222 Z" fill={hair} />;
    case "stubble": return <ellipse cx="150" cy="212" rx="48" ry="26" fill="#00000018" />;
    case "mustache": return <path d="M116 196 Q150 182 184 196 Q150 206 116 196 Z" fill={hair} />;
    case "mustache-curled": return <path d="M108 190 Q130 200 150 192 Q170 200 192 190 Q196 206 180 204 Q150 208 120 204 Q104 206 108 190 Z" fill={hair} />;
    case "side-curls": return (<><path d="M80 160 q-10 30 4 50" stroke={hair} strokeWidth="8" fill="none" /><path d="M220 160 q10 30 -4 50" stroke={hair} strokeWidth="8" fill="none" /></>);
    case "glasses": return <g stroke="#2b1d14" strokeWidth="5" fill="none"><rect x="102" y="138" width="40" height="28" rx="6" /><rect x="158" y="138" width="40" height="28" rx="6" /><path d="M142 150 h16" /></g>;
    case "round-glasses": return <g stroke="#2b1d14" strokeWidth="5" fill="none"><circle cx="122" cy="152" r="20" /><circle cx="178" cy="152" r="20" /><path d="M142 152 h16" /></g>;
    case "cat-eye-glasses": return <g stroke="#5b2a6a" strokeWidth="6" fill="none"><path d="M98 140 L146 142 L140 166 L106 166 Z" /><path d="M202 140 L154 142 L160 166 L194 166 Z" /></g>;
    case "dark-glasses": return <g fill="#111"><rect x="100" y="140" width="44" height="24" rx="8" /><rect x="156" y="140" width="44" height="24" rx="8" /><rect x="142" y="148" width="16" height="5" /></g>;
    case "monocle": return <circle cx="178" cy="152" r="18" stroke="#c8a227" strokeWidth="5" fill="none" />;
    case "eye-mask": return <path d="M90 140 Q150 126 210 140 L206 166 Q178 172 160 160 L140 160 Q122 172 94 166 Z" fill="#111" />;
    case "freckles": return <g fill="#c06a3a">{[[112, 180], [122, 186], [132, 180], [168, 180], [178, 186], [188, 180]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" />)}</g>;
    case "red-nose": return <circle cx="150" cy="178" r="14" fill="#d9363e" />;
    case "mole": return <circle cx="186" cy="196" r="4" fill="#3a2a20" />;
    case "lipstick": return <ellipse cx="150" cy="208" rx="24" ry="7" fill="#c0263e" opacity="0.6" />;
    case "earrings": return (<><circle cx="78" cy="180" r="7" fill="#e0a030" /><circle cx="222" cy="180" r="7" fill="#e0a030" /></>);
    // голова
    case "flat-cap": return <path d="M78 118 Q150 70 222 118 L236 128 Q150 112 78 122 Z" fill="#5b4636" />;
    case "police-cap": return (<><rect x="84" y="78" width="132" height="34" rx="8" fill="#2b3a55" /><path d="M78 112 L222 112 L240 124 L84 124 Z" fill="#111" /><circle cx="150" cy="94" r="8" fill="#c8a227" /></>);
    case "army-cap": return (<><path d="M80 112 Q150 60 220 112 Z" fill="#4b5a3a" /><circle cx="150" cy="96" r="7" fill="#b3261e" /></>);
    case "helmet": return <path d="M72 128 Q150 44 228 128 Z" fill="#4b5a3a" />;
    case "shako": return (<><rect x="104" y="40" width="92" height="72" rx="6" fill="#7a2e2e" /><rect x="104" y="40" width="92" height="12" fill="#c8a227" /></>);
    case "papakha": return <rect x="88" y="62" width="124" height="54" rx="22" fill="#3a2a20" />;
    case "chef-hat": return (<><rect x="108" y="64" width="84" height="44" fill="#fff" /><circle cx="120" cy="58" r="22" fill="#fff" /><circle cx="150" cy="50" r="24" fill="#fff" /><circle cx="180" cy="58" r="22" fill="#fff" /></>);
    case "nurse-cap": return (<><path d="M110 98 L190 98 L180 74 L120 74 Z" fill="#fff" /><path d="M146 80 h8 v14 h-8 z M140 84 h20 v6 h-20 z" fill="#d9363e" /></>);
    case "crown": return <path d="M100 100 L104 56 L126 82 L150 50 L174 82 L196 56 L200 100 Z" fill="#e0b030" />;
    case "halo": return <ellipse cx="150" cy="56" rx="58" ry="12" fill="none" stroke="#f5d76e" strokeWidth="8" />;
    case "horns": return (<><path d="M100 95 L88 40 L122 85 Z" fill="#b3261e" /><path d="M200 95 L212 40 L178 85 Z" fill="#b3261e" /></>);
    case "kippah": return <path d="M118 84 Q150 64 182 84 Z" fill="#1c2a4a" />;
    case "black-hat": return (<><rect x="104" y="48" width="92" height="52" rx="8" fill="#111" /><rect x="80" y="96" width="140" height="12" rx="6" fill="#111" /></>);
    case "bowler": return (<><path d="M106 100 Q106 52 150 52 Q194 52 194 100 Z" fill="#1d1d1d" /><rect x="88" y="96" width="124" height="10" rx="5" fill="#1d1d1d" /></>);
    case "cowboy-hat": return (<><path d="M108 100 Q112 50 150 56 Q188 50 192 100 Z" fill="#8a5a2b" /><path d="M60 102 Q150 124 240 102 Q240 92 150 100 Q60 92 60 102 Z" fill="#8a5a2b" /></>);
    case "beret": return <ellipse cx="140" cy="84" rx="66" ry="22" fill="#2b2b2b" />;
    case "tyrolean-hat": return (<><path d="M104 102 Q110 52 150 54 Q190 52 196 102 Z" fill="#3e5a2e" /><path d="M188 70 l24 -30" stroke="#c8553d" strokeWidth="5" /></>);
    case "aerodrome-cap": return <ellipse cx="150" cy="92" rx="96" ry="26" fill="#3a3a3a" />;
    case "straw-hat": return (<><ellipse cx="150" cy="100" rx="104" ry="18" fill="#e3c36a" /><path d="M110 100 Q112 60 150 60 Q188 60 190 100 Z" fill="#e3c36a" /></>);
    case "headscarf": return <path d="M64 170 Q60 70 150 64 Q240 70 236 170 Q220 120 150 112 Q80 120 64 170 Z M120 236 L150 270 L180 236 Z" fill="#c8553d" />;
    case "curlers": return <g fill="#7fb3d5">{[96, 124, 152, 180, 206].map((x) => <rect key={x} x={x - 9} y="76" width="18" height="26" rx="8" />)}</g>;
    case "turban": return <ellipse cx="150" cy="84" rx="82" ry="34" fill="#f2f2f2" />;
    case "hood": return <path d="M60 210 Q50 60 150 54 Q250 60 240 210 Q226 120 150 110 Q74 120 60 210 Z" fill="#1d1d1d" />;
    case "zucchetto": return <path d="M122 82 Q150 66 178 82 Z" fill="#f2f2f2" />;
    case "nun-veil": return <path d="M62 250 Q50 64 150 58 Q250 64 238 250 L222 250 Q228 120 150 112 Q72 120 78 250 Z" fill="#1d1d1d" />;
    case "bows": return (<><path d="M50 172 l20 12 -20 12 z M90 172 l-20 12 20 12 z" fill="#d9363e" /><path d="M210 172 l20 12 -20 12 z M250 172 l-20 12 20 12 z" fill="#d9363e" /></>);
    case "headset": return <path d="M72 160 Q72 80 150 78 Q228 80 228 160 M228 160 Q228 200 186 206" stroke="#2b2b2b" strokeWidth="7" fill="none" />;
    case "cowlick": return <path d="M146 76 q-4 -26 16 -30 q-12 12 -6 30 z" fill="#c98a3c" />;
    // тело
    case "cross": return (<><path d="M138 232 L150 262 L162 232" stroke="#c8a227" strokeWidth="3" fill="none" /><rect x="145" y="262" width="10" height="44" fill="#c8a227" /><rect x="133" y="274" width="34" height="9" fill="#c8a227" /></>);
    case "tie": return <path d="M144 232 L156 232 L162 300 L150 316 L138 300 Z" fill="#b3261e" />;
    case "bow-tie": return <path d="M126 236 L150 246 L174 236 L174 258 L150 248 L126 258 Z" fill="#111" />;
    case "gold-chain": return <path d="M104 236 Q150 300 196 236" stroke="#e0b030" strokeWidth="8" fill="none" />;
    case "stethoscope": return <path d="M114 236 Q110 290 150 296 Q190 290 186 236 M150 296 v20" stroke="#2b2b2b" strokeWidth="5" fill="none" />;
    case "apron": return <path d="M100 270 L200 270 L208 420 L92 420 Z" fill="#f2e6d0" opacity="0.95" />;
    case "towel": return <rect x="190" y="228" width="28" height="64" rx="6" fill="#f2f2f2" />;
    case "brooch": return <circle cx="122" cy="256" r="9" fill="#e0a030" />;
    case "badge": return <path d="M112 262 l10 -14 10 14 -10 14 z" fill="#e0b030" />;
    case "striped-shirt": return <g fill="#111">{[250, 280, 310, 340, 370, 400].map((y) => <rect key={y} x="62" y={y} width="176" height="12" />)}</g>;
    case "loot-bag": return (<><ellipse cx="248" cy="340" rx="40" ry="46" fill="#9a8a6a" /><text x="230" y="352" fontSize="34" fontWeight="900" fill="#2b1d14">$</text></>);
    case "camera": return <rect x="122" y="292" width="56" height="38" rx="6" fill="#2b2b2b" />;
    case "collar": return <rect x="98" y="226" width="104" height="14" rx="7" fill="#c8553d" />;
    case "robe-white": return <rect x="56" y="228" width="188" height="192" rx="40" fill="#f6f2e8" />;
    case "robe-red": return <rect x="56" y="228" width="188" height="192" rx="40" fill="#b3261e" />;
    case "robe-black": return <rect x="56" y="228" width="188" height="192" rx="40" fill="#1d1d1d" />;
    case "keys": return <g stroke="#c8a227" strokeWidth="6" fill="none"><circle cx="232" cy="300" r="12" /><path d="M232 312 v40 h10 M232 330 h8" /></g>;
    case "scythe": return <path d="M262 420 L262 180 Q200 170 180 210" stroke="#5b4636" strokeWidth="8" fill="none" />;
    case "baguette": return <rect x="230" y="250" width="18" height="120" rx="9" fill="#d9a65a" transform="rotate(20 239 310)" />;
    case "suspenders": return (<><rect x="96" y="232" width="12" height="188" fill="#5b4636" /><rect x="192" y="232" width="12" height="188" fill="#5b4636" /></>);
    default: return null;
  }
}
const FRONT = new Set(["cross", "tie", "bow-tie", "gold-chain", "stethoscope", "apron", "towel", "brooch", "badge", "striped-shirt", "loot-bag", "camera", "collar", "keys", "scythe", "baguette", "suspenders"]);
const ROBES = new Set(["robe-white", "robe-red", "robe-black"]);
const BACK = new Set(["hood", "nun-veil", "headscarf"]);

/**
 * Параметрическая 2D-кукла (SVG) — заглушка до финального арта.
 * Липсинк: рот открывается, пока персонаж говорит.
 */
export const Puppet = ({
  look, speaking, emotion, flip, seed,
}: { look: Look; speaking: boolean; emotion: Emotion; flip: boolean; seed: number }) => {
  const frame = useCurrentFrame();
  const { kind, skin, clothes, accent } = look;
  const acc = look.accessories ?? [];
  const def = DEFAULT_HAIR[kind];
  const hairColor = look.hair ?? def?.color ?? "#3a2a20";
  const hairStyle = look.hairStyle ?? def?.style ?? "none";
  const animal = ANIMALS.includes(kind);
  const bob = Math.sin((frame + seed) / 9) * 6;
  const open = speaking ? 6 + Math.abs(Math.sin(frame * 0.85 + seed)) * 20 : 3;
  const size = (isChild(kind) ? 0.78 : 1) * (speaking ? 1.06 : 1);
  const b = brow[emotion];
  const slim = kind === "woman" || kind === "old-woman";

  return (
    <svg viewBox="0 0 300 420" style={{ height: "100%", overflow: "visible", transform: `scale(${flip ? -size : size}, ${size})`, transformOrigin: "50% 100%" }}>
      <g transform={`translate(0 ${bob})`}>
        {acc.filter((a) => BACK.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} />)}
        {!animal && <HairBack style={hairStyle} color={hairColor} />}

        {/* тело */}
        <rect x={slim ? 75 : 60} y="230" width={slim ? 150 : 180} height="190" rx="40" fill={clothes} />
        {accent && <rect x="130" y="230" width="40" height="190" fill={accent} opacity="0.8" />}
        {acc.filter((a) => ROBES.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} />)}
        {acc.filter((a) => FRONT.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} />)}

        {/* уши */}
        {kind === "bear" && (<><circle cx="90" cy="95" r="26" fill={skin} /><circle cx="210" cy="95" r="26" fill={skin} /></>)}
        {kind === "hare" && (<><ellipse cx="115" cy="40" rx="18" ry="62" fill={skin} /><ellipse cx="185" cy="40" rx="18" ry="62" fill={skin} /></>)}
        {kind === "cat" && (<><path d="M85 120 L95 55 L135 95 Z" fill={skin} /><path d="M215 120 L205 55 L165 95 Z" fill={skin} /></>)}
        {kind === "dog" && (<><ellipse cx="78" cy="150" rx="20" ry="45" fill={accent ?? "#5a3b22"} /><ellipse cx="222" cy="150" rx="20" ry="45" fill={accent ?? "#5a3b22"} /></>)}
        {kind === "cow" && (<><path d="M86 108 L60 80 L96 96 Z" fill="#f2e6d0" /><path d="M214 108 L240 80 L204 96 Z" fill="#f2e6d0" /><ellipse cx="70" cy="140" rx="24" ry="12" fill={skin} /><ellipse cx="230" cy="140" rx="24" ry="12" fill={skin} /></>)}
        {kind === "horse" && (<><path d="M104 96 L96 50 L128 86 Z" fill={skin} /><path d="M196 96 L204 50 L172 86 Z" fill={skin} /><path d="M140 70 Q150 40 160 70 L160 120 L140 120 Z" fill={look.hair ?? "#3a2a20"} /></>)}
        {!animal && (<><circle cx="78" cy="160" r="14" fill={skin} /><circle cx="222" cy="160" r="14" fill={skin} /></>)}

        {/* голова */}
        {kind === "horse"
          ? <ellipse cx="150" cy="170" rx="62" ry="96" fill={skin} />
          : <ellipse cx="150" cy="160" rx="76" ry="82" fill={skin} />}
        {kind === "cow" && (<><ellipse cx="118" cy="128" rx="24" ry="18" fill="#2b1d14" opacity="0.8" /><ellipse cx="150" cy="210" rx="44" ry="26" fill="#f0b8b8" /></>)}
        {kind === "bird" && <path d="M150 166 L196 182 L150 198 Z" fill="#e0a030" />}

        {!animal && <HairTop style={hairStyle} color={hairColor} />}

        {/* глаза */}
        <circle cx="122" cy="152" r="11" fill="#fff" /><circle cx="178" cy="152" r="11" fill="#fff" />
        <circle cx="124" cy="154" r="5" fill="#111" /><circle cx="180" cy="154" r="5" fill="#111" />
        {/* брови */}
        <rect x="106" y="128" width="32" height="6" rx="3" fill="#2b1d14" transform={`rotate(${b.l} 122 131)`} />
        <rect x="162" y="128" width="32" height="6" rx="3" fill="#2b1d14" transform={`rotate(${b.r} 178 131)`} />
        {/* нос */}
        {kind === "bird" ? null : animal ? <ellipse cx="150" cy={kind === "cow" ? 206 : 182} rx="14" ry="10" fill="#2b1d14" /> : <ellipse cx="150" cy="176" rx="8" ry="10" fill="#00000022" />}
        {/* рот */}
        {kind !== "bird" && <ellipse cx="150" cy={kind === "horse" ? 230 : 208} rx="22" ry={open} fill="#3a0f0f" />}
        {kind === "bird" && speaking && <path d="M150 182 L192 190 L150 198 Z" fill="#3a0f0f" />}

        {/* аксессуары лица и головы */}
        {acc.filter((a) => !FRONT.has(a) && !ROBES.has(a) && !BACK.has(a)).map((a) => <Accessory key={a} id={a} hair={hairColor} />)}
      </g>
    </svg>
  );
};
