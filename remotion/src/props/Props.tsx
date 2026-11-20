/**
 * Реквизит в руке куклы. Координаты — бокс куклы (300×600), (0,0) — центр кисти; предмет рисуется чуть ниже/выше кисти.
 * Список id — content/props.json (его же видит сценарист). Новый предмет = новый case + строка в props.json.
 * Стиль: плоские формы без контуров, как у кукол.
 */
const INK = "#2b1d14";
const METAL = "#9aa8b8";
const WOOD = "#8a5a3a";
const WOOD_DARK = "#6b4429";
const BRASS = "#c9a227";
const PAPER = "#f6f2e8";
const SKIN = "#efc8a0";

/**
 * Рука с предметом в Rig.tsx поднята на 38° (arms.right = 38), и предмет поворачивается вместе с рукой.
 * Крупные/висящие/стоящие предметы рисуем «по вертикали экрана»: внутри `up(...)` ось y смотрит вниз,
 * x — вперёд (по взгляду куклы). Пол примерно на y ≈ +140…+190 от кисти (зависит от телосложения), берём ~160.
 */
const HOLD_ANGLE = 38;
const FLOOR = 148;
const up = (children: React.ReactNode) => <g transform={`rotate(${HOLD_ANGLE})`}>{children}</g>;

/** Колесо велосипеда: шина, спицы, втулка. */
const Wheel = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    {[0, 30, 60, 90, 120, 150].map((a) => {
      const dx = Math.cos((a * Math.PI) / 180) * r;
      const dy = Math.sin((a * Math.PI) / 180) * r;
      return <line key={a} x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy} stroke="#b9c2cc" strokeWidth={2} />;
    })}
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={9} />
    <circle cx={cx} cy={cy} r={6} fill={METAL} />
  </g>
);

/** Полоски «шотландки» внутри эллипса (без clipPath). */
const tartan = (cx: number, cy: number, rx: number, ry: number, color: string) => {
  const out: React.ReactNode[] = [];
  for (const k of [-0.55, -0.1, 0.35]) {
    const yy = cy + k * ry;
    const hw = rx * Math.sqrt(1 - k * k) - 4;
    out.push(<rect key={`h${k}`} x={cx - hw} y={yy - 3} width={hw * 2} height={6} fill={color} opacity={0.7} />);
  }
  for (const k of [-0.5, 0, 0.5]) {
    const xx = cx + k * rx;
    const hh = ry * Math.sqrt(1 - k * k) - 4;
    out.push(<rect key={`v${k}`} x={xx - 3} y={cy - hh} width={6} height={hh * 2} fill={color} opacity={0.5} />);
  }
  return out;
};

export const PropItem = ({ id, x, y }: { id: string; x: number; y: number }) => {
  const g = (children: React.ReactNode) => <g transform={`translate(${x} ${y})`}>{children}</g>;
  switch (id) {
    case "bicycle": {
      // старый велосипед стоит рядом, кукла держит его за руль; колёса на полу
      const r = 48;
      const wy = FLOOR - r;
      const F = [18, wy], R = [-150, wy], B = [-68, wy + 6], S = [-88, 22], H = [-6, 26], H2 = [2, 52];
      const frame = "#7a2e2e";
      const ln = (a: number[], b: number[], w = 8) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={frame} strokeWidth={w} strokeLinecap="round" />;
      return g(up(<>
        <Wheel cx={R[0]} cy={R[1]} r={r} />
        <Wheel cx={F[0]} cy={F[1]} r={r} />
        <path d={`M${R[0] - 40} ${wy - 52} Q${R[0]} ${wy - 66} ${R[0] + 34} ${wy - 46}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        {ln(R, B)}{ln(R, S, 6)}{ln(B, S)}{ln(S, H)}{ln(B, H2)}{ln(H2, F, 7)}{ln(H, H2, 10)}
        <circle cx={B[0]} cy={B[1]} r={13} fill={METAL} />
        <rect x={B[0] - 4} y={B[1] + 8} width={22} height={6} rx={3} fill={INK} />
        <rect x={S[0] - 3} y={S[1] - 10} width={6} height={12} fill={METAL} />
        <path d={`M${S[0] - 22} ${S[1] - 12} Q${S[0]} ${S[1] - 22} ${S[0] + 18} ${S[1] - 14} L${S[0] + 14} ${S[1] - 6} L${S[0] - 20} ${S[1] - 6} Z`} fill={INK} />
        <line x1={H[0]} y1={H[1]} x2={-2} y2={-4} stroke={METAL} strokeWidth={6} strokeLinecap="round" />
        <path d="M-30 -14 Q-14 -4 -2 -4 L10 -4" fill="none" stroke={METAL} strokeWidth={6} strokeLinecap="round" />
        <circle cx={-18} cy={-2} r={6} fill={BRASS} />
      </>));
    }
    case "pistol":
      return g(up(<>
        <path d="M-10 -24 L4 -24 L-2 8 Q-3 12 -8 12 L-16 12 Q-20 12 -19 7 Z" fill="#4a3a30" />
        <rect x={-14} y={-38} width={62} height={16} rx={4} fill="#3a3a40" />
        <rect x={44} y={-36} width={8} height={10} rx={2} fill={INK} />
        <path d="M2 -22 Q2 -8 14 -8 L14 -14 Q8 -14 8 -22 Z" fill="#3a3a40" />
        <rect x={-8} y={-35} width={36} height={4} rx={2} fill="#5a5a62" />
      </>));
    case "rifle":
      // охотничье ружьё по диагонали: приклад внизу-сзади, ствол вверх-вперёд
      return g(up(<g transform="rotate(-58)">
        <path d="M-80 -6 L-20 -8 L-14 6 L-80 14 Q-86 4 -80 -6 Z" fill={WOOD} />
        <rect x={-22} y={-9} width={34} height={14} rx={3} fill="#4a4a52" />
        <rect x={10} y={-6} width={50} height={9} rx={3} fill={WOOD_DARK} />
        <rect x={10} y={-10} width={138} height={6} rx={3} fill={INK} />
        <path d="M-6 5 Q-4 16 6 14" fill="none" stroke="#4a4a52" strokeWidth={3} />
      </g>));
    case "road-sign":
      // предупреждающий знак «!» на столбе (без букв — кукла может быть отзеркалена)
      return g(up(<>
        <rect x={-5} y={-190} width={10} height={250} rx={4} fill={METAL} />
        <path d="M0 -300 L66 -186 L-66 -186 Z" fill="#c8553d" stroke="#c8553d" strokeWidth={14} strokeLinejoin="round" />
        <path d="M0 -272 L44 -196 L-44 -196 Z" fill={PAPER} />
        <rect x={-5} y={-254} width={10} height={36} rx={4} fill={INK} />
        <circle cx={0} cy={-208} r={6} fill={INK} />
      </>));
    case "bagpipes":
      return g(up(<>
        {/* трубки-бурдоны уходят за плечо */}
        {[[-40, -196], [-66, -180], [-88, -158]].map(([tx, ty], i) => (
          <g key={i}>
            <line x1={-20 - i * 8} y1={-50} x2={tx} y2={ty} stroke={INK} strokeWidth={8} strokeLinecap="round" />
            <rect x={tx - 6} y={ty - 12} width={12} height={14} rx={3} fill={PAPER} />
          </g>
        ))}
        <path d="M-52 -150 Q-74 -100 -50 -54" fill="none" stroke="#c8553d" strokeWidth={3} />
        <ellipse cx={-6} cy={-34} rx={44} ry={30} fill="#c8553d" />
        {tartan(-6, -34, 44, 30, "#2f4f3a")}
        <rect x={22} y={-14} width={10} height={70} rx={4} fill={INK} transform="rotate(-12 27 -14)" />
        <circle cx={30} cy={10} r={2.5} fill={PAPER} /><circle cx={32} cy={24} r={2.5} fill={PAPER} /><circle cx={35} cy={38} r={2.5} fill={PAPER} />
      </>));
    case "gong":
      // латунный гонг на стойке стоит рядом, в руке — колотушка
      return g(up(<>
        <rect x={26} y={-80} width={10} height={FLOOR + 80} rx={4} fill={WOOD_DARK} />
        <rect x={150} y={-80} width={10} height={FLOOR + 80} rx={4} fill={WOOD_DARK} />
        <rect x={18} y={-92} width={150} height={14} rx={6} fill={WOOD} />
        <rect x={14} y={FLOOR - 8} width={30} height={10} rx={4} fill={WOOD_DARK} />
        <rect x={142} y={FLOOR - 8} width={30} height={10} rx={4} fill={WOOD_DARK} />
        <line x1={70} y1={-78} x2={80} y2={-20} stroke={INK} strokeWidth={3} />
        <line x1={116} y1={-78} x2={106} y2={-20} stroke={INK} strokeWidth={3} />
        <circle cx={93} cy={34} r={58} fill="#e0a030" />
        <circle cx={93} cy={34} r={46} fill="#cf8f22" />
        <circle cx={93} cy={34} r={18} fill="#f0c060" />
        <line x1={-4} y1={-6} x2={44} y2={18} stroke={WOOD} strokeWidth={7} strokeLinecap="round" />
        <circle cx={50} cy={21} r={14} fill="#c8553d" />
      </>));
    case "sandwich":
      return g(up(<g transform="rotate(-8)">
        <rect x={-36} y={-36} width={72} height={16} rx={8} fill="#d9a679" />
        <rect x={-38} y={-26} width={76} height={8} rx={4} fill="#5b8c5a" />
        <rect x={-34} y={-22} width={70} height={8} rx={3} fill="#e07a7a" />
        <rect x={-36} y={-18} width={72} height={6} rx={2} fill="#f2c94c" />
        <rect x={-36} y={-14} width={72} height={14} rx={7} fill="#d9a679" />
        <rect x={-30} y={-34} width={60} height={5} rx={2} fill="#e8c393" />
      </g>));
    case "shovel":
      // садовая лопата: длинный черенок, штык почти у пола
      return g(up(<g transform="rotate(-8)">
        <rect x={-5} y={-110} width={10} height={FLOOR + 50} rx={4} fill={WOOD} />
        <rect x={-18} y={-118} width={36} height={10} rx={5} fill={WOOD_DARK} />
        <rect x={-8} y={FLOOR - 62} width={16} height={16} rx={3} fill="#6f7a86" />
        <path d={`M-24 ${FLOOR - 50} H24 V${FLOOR - 14} Q24 ${FLOOR + 4} 0 ${FLOOR + 8} Q-24 ${FLOOR + 4} -24 ${FLOOR - 14} Z`} fill={METAL} />
        <rect x={-24} y={FLOOR - 50} width={48} height={6} rx={2} fill="#b9c2cc" />
      </g>));
    case "fishing-rod":
      return g(up(<>
        <path d="M-22 22 L-16 26 L150 -176 L146 -178 Z" fill={WOOD_DARK} />
        <circle cx={-4} cy={4} r={10} fill={METAL} />
        <circle cx={-4} cy={4} r={4} fill={INK} />
        <line x1={148} y1={-177} x2={148} y2={60} stroke={INK} strokeWidth={2} opacity={0.55} />
        <ellipse cx={148} cy={66} rx={7} ry={11} fill="#c8553d" />
        <rect x={141} y={64} width={14} height={4} fill={PAPER} />
        <line x1={148} y1={77} x2={148} y2={96} stroke={INK} strokeWidth={2} opacity={0.55} />
        <path d="M148 96 q0 8 -6 6" fill="none" stroke={METAL} strokeWidth={2} />
      </>));
    case "playing-cards":
      return g(up(<>
        {[-36, -18, 0, 18, 36].map((a, i) => (
          <g key={a} transform={`rotate(${a} 0 0)`}>
            <rect x={-17} y={-66} width={34} height={50} rx={4} fill={PAPER} />
            {i % 2 === 0
              ? <path d="M0 -56 L7 -46 L0 -36 L-7 -46 Z" fill="#c8553d" />
              : <><circle cx={-4} cy={-48} r={4.5} fill={INK} /><circle cx={4} cy={-48} r={4.5} fill={INK} /><circle cx={0} cy={-54} r={4.5} fill={INK} /><rect x={-1.5} y={-48} width={3} height={9} fill={INK} /></>}
          </g>
        ))}
      </>));
    case "mirror":
      return g(up(<>
        <rect x={-5} y={-36} width={10} height={40} rx={4} fill="#c8553d" />
        <circle cx={0} cy={-62} r={28} fill="#c8553d" />
        <circle cx={0} cy={-62} r={22} fill="#cfe6f5" />
        <path d="M-12 -70 L-2 -80 M-8 -60 L6 -74" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      </>));
    case "coin":
      return g(up(<>
        <circle cx={4} cy={-28} r={17} fill="#e0a030" />
        <circle cx={4} cy={-28} r={12} fill="none" stroke={BRASS} strokeWidth={3} />
        <rect x={1} y={-35} width={6} height={14} rx={2} fill={BRASS} />
      </>));
    case "matchbox":
      return g(up(<g transform="rotate(-10)">
        <rect x={-4} y={-54} width={4} height={18} rx={1} fill="#e8d9b5" transform="rotate(10 -2 -36)" />
        <circle cx={-5} cy={-55} r={4} fill="#c8553d" />
        <rect x={-26} y={-40} width={52} height={32} rx={3} fill="#d9a679" />
        <rect x={-22} y={-36} width={44} height={24} rx={2} fill="#4a6fa5" />
        <circle cx={0} cy={-24} r={7} fill="#e0a030" />
        <rect x={-26} y={-40} width={52} height={5} fill="#7a5a3a" />
      </g>));
    case "bucket":
      return g(up(<>
        <path d="M-38 34 Q-36 -10 0 -10 Q36 -10 38 34" fill="none" stroke={METAL} strokeWidth={4} />
        <path d="M-38 30 H38 L30 104 Q30 110 24 110 H-24 Q-30 110 -30 104 Z" fill="#7e8ea0" />
        <rect x={-40} y={26} width={80} height={9} rx={4} fill="#b9c2cc" />
        <rect x={-33} y={62} width={66} height={5} fill="#6f7d8e" />
      </>));
    case "map":
      return g(up(<g transform="rotate(-6)">
        <path d="M-14 -116 L28 -108 L70 -116 L112 -108 V-14 L70 -22 L28 -14 L-14 -22 Z" fill="#efe6c8" />
        <path d="M28 -108 V-14 L70 -22 V-116 Z" fill="#e3d8b6" />
        <path d="M-6 -96 Q14 -104 24 -84 Q30 -66 8 -60 Q-8 -62 -6 -96 Z" fill="#9cc48f" />
        <path d="M60 -60 Q84 -74 104 -56 L104 -30 Q80 -24 62 -36 Z" fill="#9cc48f" />
        <path d="M74 -104 Q92 -100 104 -94 L104 -76 Q86 -82 74 -92 Z" fill="#8fbbe0" />
        <path d="M-2 -40 Q30 -50 44 -76 Q60 -96 88 -84" fill="none" stroke="#c8553d" strokeWidth={3} strokeDasharray="6 5" />
        <path d="M82 -90 l10 10 M92 -90 l-10 10" stroke="#c8553d" strokeWidth={4} strokeLinecap="round" />
      </g>));
    case "chicken":
      // ощипанная замороженная курица, держат за ножки
      return g(up(<>
        <path d="M-10 -6 Q-14 20 -12 36" fill="none" stroke="#f3d6b0" strokeWidth={13} strokeLinecap="round" />
        <path d="M12 -6 Q16 20 14 36" fill="none" stroke="#f3d6b0" strokeWidth={13} strokeLinecap="round" />
        <circle cx={-10} cy={-12} r={6} fill={PAPER} /><circle cx={12} cy={-12} r={6} fill={PAPER} />
        <ellipse cx={2} cy={74} rx={44} ry={42} fill="#f3d6b0" />
        <ellipse cx={-16} cy={44} rx={16} ry={20} fill="#ecc89e" /><ellipse cx={20} cy={44} rx={16} ry={20} fill="#ecc89e" />
        <ellipse cx={-38} cy={78} rx={12} ry={22} fill="#ecc89e" transform="rotate(20 -38 78)" />
        <ellipse cx={42} cy={78} rx={12} ry={22} fill="#ecc89e" transform="rotate(-20 42 78)" />
        <rect x={-6} y={110} width={14} height={14} rx={6} fill="#ecc89e" />
        <path d="M-20 54 q8 -6 16 0 M10 92 q8 -6 16 0 M-16 96 q6 -4 12 0" fill="none" stroke="#dbeef8" strokeWidth={4} strokeLinecap="round" />
        <circle cx={18} cy={58} r={3} fill="#ffffff" /><circle cx={-24} cy={80} r={2.5} fill="#ffffff" />
      </>));
    case "coffin": {
      // открытый деревянный гроб стоймя рядом с куклой, стоит на полу
      const cx = 74;
      const pts = (k: number) => {
        const top = -170 + k, sh = -100, bot = FLOOR - k;
        const wT = 36 - k * 0.6, wS = 62 - k, wB = 34 - k * 0.6;
        return `M${cx - wT} ${top} H${cx + wT} L${cx + wS} ${sh} L${cx + wB} ${bot} H${cx - wB} L${cx - wS} ${sh} Z`;
      };
      return g(up(<>
        <path d={pts(0)} fill={WOOD} />
        <path d={pts(12)} fill={WOOD_DARK} />
        <path d={pts(20)} fill="#efe2cc" />
        <ellipse cx={cx} cy={-128} rx={26} ry={14} fill={PAPER} />
        <path d={`M${cx - 30} -70 Q${cx - 20} -50 ${cx - 28} -20 M${cx + 30} -70 Q${cx + 20} -50 ${cx + 28} -20 M${cx - 24} 30 Q${cx - 16} 60 ${cx - 22} 100 M${cx + 24} 30 Q${cx + 16} 60 ${cx + 22} 100`} fill="none" stroke="#dccdb2" strokeWidth={4} />
        <rect x={-4} y={-18} width={20} height={14} rx={4} fill={BRASS} />
      </>));
    }
    case "vase":
      // высокая фарфоровая ваза
      return g(up(<>
        <path d="M-2 -96 H34 Q30 -82 26 -74 Q62 -50 58 -6 Q54 34 34 60 L38 74 H-6 L-2 60 Q-22 34 -26 -6 Q-30 -50 6 -74 Q2 -82 -2 -96 Z" fill={PAPER} />
        <rect x={-4} y={-100} width={40} height={8} rx={4} fill="#4a6fa5" />
        <path d="M-24 -20 Q16 -30 56 -20 L56 -6 Q16 -16 -24 -6 Z" fill="#4a6fa5" />
        <path d="M2 10 q14 -16 28 0 q-14 16 -28 0 Z" fill="#4a6fa5" opacity={0.8} />
        <path d="M-2 -60 Q16 -66 36 -60" fill="none" stroke="#4a6fa5" strokeWidth={4} />
        <rect x={-6} y={66} width={44} height={8} rx={3} fill="#4a6fa5" />
      </>));
    case "birdcage":
      return g(up(<>
        <circle cx={0} cy={-6} r={8} fill="none" stroke={BRASS} strokeWidth={4} />
        <path d="M-42 50 Q-42 2 0 2 Q42 2 42 50 Z" fill="#f2e6d0" opacity={0.35} />
        <rect x={-46} y={110} width={92} height={10} rx={4} fill={WOOD_DARK} />
        <path d="M-42 50 Q-42 2 0 2 Q42 2 42 50" fill="none" stroke={BRASS} strokeWidth={4} />
        <line x1={-30} y1={86} x2={30} y2={86} stroke={WOOD} strokeWidth={4} />
        {/* птичка */}
        <ellipse cx={0} cy={70} rx={14} ry={12} fill="#e0a030" />
        <circle cx={8} cy={60} r={8} fill="#e0a030" />
        <path d="M15 60 L22 62 L15 64 Z" fill="#c8553d" />
        <circle cx={10} cy={58} r={1.8} fill={INK} />
        <path d="M-12 72 L-22 80 L-12 78 Z" fill="#c99020" />
        {[-42, -28, -14, 0, 14, 28, 42].map((bx) => (
          <line key={bx} x1={bx} y1={Math.abs(bx) > 35 ? 48 : 4 + Math.abs(bx) * 0.5} x2={bx} y2={112} stroke={BRASS} strokeWidth={3} />
        ))}
        <line x1={-42} y1={50} x2={42} y2={50} stroke={BRASS} strokeWidth={3} />
      </>));
    case "globe":
      // школьный глобус на подставке, держат за подставку
      return g(up(<>
        <g transform="rotate(-20 12 -78)">
          <circle cx={12} cy={-78} r={50} fill="#4a8fc8" />
          <path d="M-14 -112 Q6 -120 18 -104 Q26 -88 10 -80 Q-6 -84 -12 -96 Z" fill="#7fb07a" />
          <path d="M20 -70 Q40 -76 50 -58 Q46 -40 30 -36 Q22 -50 20 -70 Z" fill="#7fb07a" />
          <path d="M-30 -66 Q-20 -58 -26 -44 Q-36 -54 -30 -66 Z" fill="#e0a030" />
          <path d="M12 -136 A58 58 0 0 1 12 -20" fill="none" stroke={BRASS} strokeWidth={5} />
          <rect x={9} y={-140} width={6} height={8} fill={BRASS} />
        </g>
        <rect x={6} y={-24} width={10} height={20} fill={BRASS} />
        <path d="M-22 6 Q-22 -8 11 -8 Q44 -8 44 6 Z" fill={WOOD_DARK} />
      </>));
    case "genie-bottle":
      // закупоренная стеклянная бутылка, внутри крошечный джинн
      return g(up(<g transform="scale(1.3)">
        <rect x={-9} y={-104} width={18} height={14} rx={4} fill="#d9a679" />
        <rect x={-8} y={-92} width={16} height={22} fill="#bfe0ee" opacity={0.85} />
        <circle cx={0} cy={-42} r={34} fill="#bfe0ee" opacity={0.85} />
        <path d="M-4 -14 Q-14 -22 -4 -30 Q6 -36 0 -44" fill="none" stroke="#4a6fa5" strokeWidth={6} strokeLinecap="round" />
        <ellipse cx={0} cy={-50} rx={8} ry={7} fill="#4a6fa5" />
        <circle cx={0} cy={-60} r={7} fill="#6f9bd1" />
        <circle cx={-2.5} cy={-61} r={1.4} fill={INK} /><circle cx={2.5} cy={-61} r={1.4} fill={INK} />
        <path d="M-7 -50 L-14 -58 M7 -50 L14 -58" stroke="#6f9bd1" strokeWidth={3} strokeLinecap="round" />
        <path d="M-20 -60 Q-26 -44 -18 -26" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      </g>));
    case "snake":
      // змея: голова у кисти, тело свисает волной
      return g(up(<>
        <path d="M18 -34 Q-6 -24 -2 0 Q2 30 -26 52 Q-52 76 -20 100 Q8 120 -14 150" fill="none" stroke="#5b8c5a" strokeWidth={15} strokeLinecap="round" />
        <path d="M-2 4 Q2 30 -26 52 M-20 100 Q8 120 -14 150" fill="none" stroke="#e0c060" strokeWidth={4} strokeDasharray="6 8" strokeLinecap="round" />
        <ellipse cx={24} cy={-38} rx={16} ry={11} fill="#5b8c5a" transform="rotate(-18 24 -38)" />
        <circle cx={28} cy={-43} r={2.6} fill={INK} />
        <path d="M38 -44 L50 -48 M50 -48 L56 -52 M50 -48 L56 -45" stroke="#c8553d" strokeWidth={2.5} strokeLinecap="round" />
      </>));
    case "chocolate-bar":
      return g(up(<g transform="rotate(-8)">
        <rect x={-20} y={-86} width={40} height={40} rx={3} fill="#5a3320" />
        {[-70, -56].map((yy) => <line key={yy} x1={-20} y1={yy} x2={20} y2={yy} stroke="#3e2216" strokeWidth={2} />)}
        <line x1={0} y1={-86} x2={0} y2={-46} stroke="#3e2216" strokeWidth={2} />
        <path d="M-22 -50 H22 V-2 Q22 2 18 2 H-18 Q-22 2 -22 -2 Z" fill="#c8553d" />
        <rect x={-22} y={-50} width={44} height={6} fill="#e0a030" />
        <rect x={-14} y={-34} width={28} height={14} rx={3} fill={PAPER} />
      </g>));
    case "canister":
      // пластиковая канистра с пивом и винтовой крышкой, держат за ручку
      return g(up(<>
        <path d="M-12 -12 H12 Q18 -12 18 -4 V16 H-18 V-4 Q-18 -12 -12 -12 Z" fill="#e8e1cf" />
        <rect x={-6} y={-6} width={12} height={16} rx={3} fill="#9a917c" opacity={0.4} />
        <rect x={-36} y={12} width={72} height={98} rx={12} fill="#e8e1cf" />
        <rect x={-30} y={40} width={60} height={64} rx={8} fill="#e0a030" opacity={0.85} />
        <rect x={-30} y={38} width={60} height={7} rx={3} fill="#fbf3dc" />
        <rect x={20} y={2} width={14} height={14} rx={3} fill="#c8553d" />
        <rect x={18} y={8} width={18} height={4} fill="#a8432f" />
      </>));
    case "scales":
      // магазинные весы с табло; держат снизу
      return g(up(<>
        <rect x={-12} y={-70} width={86} height={8} rx={4} fill={METAL} />
        <rect x={24} y={-64} width={10} height={14} fill="#7e8ea0" />
        <path d="M-30 -52 H84 Q90 -52 90 -46 V-4 Q90 2 84 2 H-30 Q-36 2 -36 -4 V-46 Q-36 -52 -30 -52 Z" fill="#e8e4d8" />
        <rect x={-24} y={-42} width={56} height={22} rx={3} fill="#24302a" />
        {[-18, -6, 6, 18].map((dx) => <rect key={dx} x={dx} y={-37} width={8} height={12} rx={1} fill="#7ee08a" opacity={0.9} />)}
        <circle cx={52} cy={-31} r={5} fill="#c8553d" /><circle cx={70} cy={-31} r={5} fill="#5b8c5a" />
        <rect x={-36} y={-10} width={126} height={8} fill="#d3cdbd" />
      </>));
    case "baby":
      // младенец в одеяльце на руках, видно личико
      return g(up(<g transform="rotate(-18 0 -24) scale(1.25)">
        <ellipse cx={-2} cy={-24} rx={56} ry={28} fill="#a9c6e8" />
        <circle cx={-36} cy={-30} r={21} fill="#a9c6e8" />
        <circle cx={-34} cy={-28} r={16} fill={SKIN} />
        <path d="M-40 -30 q3 -2 6 0 M-32 -30 q3 -2 6 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
        <circle cx={-31} cy={-22} r={2} fill="#d9877a" />
        <path d="M-34 -42 q4 -6 8 -2" fill="none" stroke="#8a5a3a" strokeWidth={2.5} strokeLinecap="round" />
        <path d="M-18 -46 Q10 -30 40 -46 Q46 -24 40 -6 Q10 -2 -18 -10 Z" fill="#bcd3ee" />
      </g>));
    case "bottle":
      return g(<><rect x={-12} y={-70} width={24} height={60} rx={8} fill="#3f7d4e" /><rect x={-6} y={-92} width={12} height={26} rx={4} fill="#3f7d4e" /><rect x={-12} y={-52} width={24} height={20} fill="#f2e6d0" /></>);
    case "glass":
      return g(<><path d="M-14 -46 L14 -46 L9 -6 L-9 -6 Z" fill="#cfe6f5" /><rect x={-11} y={-30} width={22} height={22} fill="#e8eef2" opacity={0.7} /></>);
    case "phone":
      return g(<><rect x={-14} y={-52} width={28} height={50} rx={6} fill={INK} /><rect x={-10} y={-47} width={20} height={38} rx={3} fill="#7fb3d5" /></>);
    case "newspaper":
      return g(<><rect x={-46} y={-70} width={92} height={64} rx={3} fill="#efe9dc" /><rect x={-38} y={-62} width={44} height={8} fill="#8a8072" /><rect x={-38} y={-48} width={76} height={4} fill="#b8af9f" /><rect x={-38} y={-40} width={76} height={4} fill="#b8af9f" /><rect x={-38} y={-32} width={50} height={4} fill="#b8af9f" /></>);
    case "money":
      return g(<><rect x={-34} y={-30} width={68} height={34} rx={4} fill="#7fb07a" transform="rotate(-8)" /><rect x={-32} y={-24} width={68} height={34} rx={4} fill="#94c48d" /><circle cx={2} cy={-7} r={8} fill="#7fb07a" /></>);
    case "flowers":
      return g(<><path d="M-4 0 L-10 -60 M4 0 L10 -64 M0 0 L0 -70" stroke="#5b8c5a" strokeWidth={6} /><circle cx={-10} cy={-66} r={12} fill="#d94f6b" /><circle cx={10} cy={-70} r={12} fill="#f2b33d" /><circle cx={0} cy={-80} r={12} fill="#c8553d" /><path d="M-16 -10 L16 -10 L8 10 L-8 10 Z" fill="#e8d9b5" /></>);
    case "suitcase":
      return g(<><rect x={-8} y={-6} width={16} height={14} rx={4} fill={INK} /><rect x={-44} y={8} width={88} height={64} rx={10} fill="#8a5a3a" /><rect x={-44} y={34} width={88} height={8} fill="#6b4429" /></>);
    case "keys":
      return g(<><circle cx={0} cy={6} r={10} fill="none" stroke="#c9a227" strokeWidth={5} /><rect x={-3} y={14} width={6} height={30} fill="#c9a227" /><rect x={-3} y={36} width={12} height={5} fill="#c9a227" /></>);
    case "cake":
      return g(<><rect x={-46} y={-12} width={92} height={8} rx={4} fill="#efe9dc" /><rect x={-38} y={-48} width={76} height={38} rx={8} fill="#f2c6c6" /><rect x={-38} y={-48} width={76} height={10} rx={5} fill="#fff4f4" /><rect x={-2} y={-66} width={4} height={18} fill="#7fb3d5" /><circle cx={0} cy={-70} r={4} fill="#f2b33d" /></>);
    case "letter":
      return g(<><rect x={-32} y={-46} width={64} height={42} rx={3} fill="#f6f2e8" /><path d="M-32 -46 L0 -22 L32 -46" fill="none" stroke="#c8b99a" strokeWidth={4} /></>);
    case "certificate":
      return g(<><rect x={-28} y={-74} width={56} height={72} rx={3} fill="#f6f2e8" /><rect x={-20} y={-64} width={40} height={6} fill="#8a8072" /><rect x={-20} y={-50} width={40} height={4} fill="#c8b99a" /><rect x={-20} y={-42} width={40} height={4} fill="#c8b99a" /><circle cx={12} cy={-18} r={9} fill="#3d6fb3" opacity={0.8} /></>);
    case "umbrella":
      return g(<><rect x={-3} y={-100} width={6} height={100} fill={INK} /><path d="M-60 -96 Q0 -160 60 -96 Z" fill="#3d6fb3" /><path d="M-3 0 Q-3 14 -14 14" fill="none" stroke={INK} strokeWidth={6} /></>);
    case "photo":
      return g(<><rect x={-30} y={-62} width={60} height={50} rx={3} fill="#f6f2e8" /><rect x={-24} y={-56} width={48} height={34} fill="#7fb3d5" /><circle cx={0} cy={-44} r={8} fill="#efc8a0" /><rect x={-10} y={-36} width={20} height={14} rx={6} fill="#c8553d" /></>);
    case "ticket":
      return g(<><rect x={-34} y={-40} width={68} height={32} rx={4} fill="#f2b33d" /><rect x={8} y={-40} width={3} height={32} fill="#f6f2e8" /><rect x={-26} y={-30} width={26} height={5} fill="#8a5a3a" /><rect x={-26} y={-20} width={20} height={5} fill="#8a5a3a" /></>);
    case "cane":
      return g(<><rect x={-4} y={0} width={8} height={150} rx={4} fill="#6b4429" /><path d="M-4 0 Q-4 -26 20 -26 Q34 -26 34 -12" fill="none" stroke="#6b4429" strokeWidth={8} strokeLinecap="round" /></>);
    case "white-cane":
      // трость слепого: длинная, белая, с красным кончиком, без рукояти-крюка
      return g(<><rect x={-4} y={-30} width={8} height={210} rx={4} fill="#f4f4f0" /><rect x={-4} y={-30} width={8} height={14} rx={3} fill="#2b1d14" /><rect x={-4} y={160} width={8} height={20} rx={3} fill="#c8553d" /></>);
    case "bill":
      return g(<><path d="M-24 -84 h48 v76 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 z" fill="#f6f2e8" /><rect x={-16} y={-74} width={32} height={4} fill="#8a8072" /><rect x={-16} y={-62} width={24} height={4} fill="#c8b99a" /><rect x={-16} y={-50} width={32} height={4} fill="#c8b99a" /><rect x={-16} y={-34} width={20} height={6} fill="#c8553d" /></>);
    case "wrench":
      return g(<><rect x={-5} y={-10} width={10} height={90} rx={4} fill="#9aa8b8" transform="rotate(-20)" /><path d="M-22 -26 a22 22 0 1 0 30 -12 l-10 12 l-12 -4 z" fill="#9aa8b8" /></>);
    default:
      return null;
  }
};
