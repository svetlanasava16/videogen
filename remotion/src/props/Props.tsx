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
const upright = (children: React.ReactNode) => <g transform={`rotate(${HOLD_ANGLE})`}>{children}</g>;
/**
 * Положенный предмет (prop put/drop): движок рисует <PropItem rest>, y = 0 — линия поверхности (стол/пол), x = 0 — место.
 * Как предмет лежит/стоит, задаёт одна строка таблицы REST (ниже, у PropItem): поворот, «плоскость», сдвиг или свой рисунок.
 */

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

/** Открытый ноутбук: кисть держит левый край, низ корпуса на +40 (кладётся на стол). broken — мокрый и помятый. */
const Laptop = ({ broken }: { broken?: boolean }) => {
  const lid = broken ? "M-2 22 L110 22 L118 -58 L70 -72 L58 -60 L4 -66 Z" : "M-2 22 L110 22 L104 -68 L4 -68 Z";
  const screen = broken ? "M8 14 L100 14 L106 -50 L70 -62 L58 -50 L12 -56 Z" : "M8 14 L100 14 L95 -58 L13 -58 Z";
  return (
    <g>
      <path d={lid} fill={broken ? "#4a4f57" : "#3a3f47"} />
      <path d={screen} fill={broken ? "#2f3d4a" : "#7fb3d5"} />
      {broken ? (
        <g stroke="#e8f1f6" strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.85}>
          <path d="M62 -14 L44 -40 L36 -36 M62 -14 L88 -38 M62 -14 L84 8 M62 -14 L30 2 L18 -6 M62 -14 L66 -46" />
        </g>
      ) : (
        <g>
          <path d="M18 -50 L38 -50 L22 -30 Z" fill="#ffffff" opacity={0.35} />
          <rect x={24} y={-20} width={54} height={5} rx={2} fill="#e8f1f6" opacity={0.8} />
          <rect x={24} y={-10} width={38} height={5} rx={2} fill="#e8f1f6" opacity={0.6} />
        </g>
      )}
      {/* клавиатура (вид чуть сверху) и корпус */}
      <path d={broken ? "M-4 22 L112 22 L120 32 L40 30 L30 34 L-14 32 Z" : "M-4 22 L112 22 L122 32 L-14 32 Z"} fill="#c3cad2" />
      {[0, 1].map((r) => <rect key={r} x={4 + r * 4} y={24 + r * 4} width={96 - r * 4} height={2.5} rx={1} fill="#7d8792" />)}
      <path d={broken ? "M-14 32 L30 34 L40 30 L122 32 L122 40 L-14 40 Z" : "M-14 32 H122 V40 H-14 Z"} fill="#8b95a1" />
      {broken && (
        <g>
          {/* вода: капли с корпуса и брызги, мокрый блеск */}
          <path d="M70 26 Q90 24 104 28" stroke="#cfe6f5" strokeWidth={3} strokeLinecap="round" fill="none" />
          {[[-16, 18], [124, 14], [130, 30], [-22, 32]].map(([cx, cy], i) => <path key={i} d={`M${cx} ${cy - 8} Q${cx + 5} ${cy} ${cx} ${cy + 4} Q${cx - 5} ${cy} ${cx} ${cy - 8} Z`} fill="#6fb3e0" />)}
          <path d="M100 -76 q-8 -12 4 -20 q10 -8 2 -20" stroke="#b9bec4" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.7} />
        </g>
      )}
    </g>
  );
};

/** Гонг на стойке (без колотушки); ножки стойки на y = FLOOR. */
const GongStand = () => (
  <g>
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
  </g>
);

/** Открытый гроб стоймя (без ручки в кисти): изголовье вверху (y = -170), ноги на y = FLOOR, центр x = 74. */
const CoffinBody = () => {
  const cx = 74;
  const pts = (k: number) => {
    const top = -170 + k, sh = -100, bot = FLOOR - k;
    const wT = 36 - k * 0.6, wS = 62 - k, wB = 34 - k * 0.6;
    return `M${cx - wT} ${top} H${cx + wT} L${cx + wS} ${sh} L${cx + wB} ${bot} H${cx - wB} L${cx - wS} ${sh} Z`;
  };
  return (
    <g>
      <path d={pts(0)} fill={WOOD} />
      <path d={pts(12)} fill={WOOD_DARK} />
      <path d={pts(20)} fill="#efe2cc" />
      <ellipse cx={cx} cy={-128} rx={26} ry={14} fill={PAPER} />
      <path d={`M${cx - 30} -70 Q${cx - 20} -50 ${cx - 28} -20 M${cx + 30} -70 Q${cx + 20} -50 ${cx + 28} -20 M${cx - 24} 30 Q${cx - 16} 60 ${cx - 22} 100 M${cx + 24} 30 Q${cx + 16} 60 ${cx + 22} 100`} fill="none" stroke="#dccdb2" strokeWidth={4} />
    </g>
  );
};

/** Свисток без шнурка: мундштук назад, бочонок у кисти, низ бочонка на y = -5. */
const WhistleBody = () => (
  <g><rect x={-40} y={-24} width={36} height={10} rx={3} fill="#aeb6c2" /><circle cx={4} cy={-18} r={13} fill="#c9d0da" /><circle cx={8} cy={-22} r={4} fill={INK} /><circle cx={14} cy={-8} r={4} fill="none" stroke="#aeb6c2" strokeWidth={2.5} /></g>
);

/** Рисунок предмета «в руке» (кисть в (0,0)). up — upright(...) для руки или «как есть» для REST. */
const propArt = (id: string, up: (children: React.ReactNode) => React.ReactNode): React.ReactNode => {
  const g = (children: React.ReactNode) => <>{children}</>;
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
        <GongStand />
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
    case "coffin":
      // открытый деревянный гроб стоймя рядом с куклой, стоит на полу
      return g(up(<>
        <CoffinBody />
        <rect x={-4} y={-18} width={20} height={14} rx={4} fill={BRASS} />
      </>));
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
    case "clipboard": // планшет с листом и зажимом (кисть держит нижний край)
      return g(<><rect x={-31} y={-84} width={62} height={90} rx={5} fill={WOOD} /><rect x={-25} y={-74} width={50} height={72} rx={2} fill={PAPER} /><rect x={-11} y={-90} width={22} height={14} rx={3} fill={METAL} />{[-60, -50, -40, -30, -20].map((y, i) => <rect key={y} x={-19} y={y} width={i === 4 ? 22 : 38} height={3.5} rx={1.5} fill="#b8af9f" />)}</>);
    case "pen": // ручка, кончик внизу-сзади кисти (как при письме)
      return g(<><path d="M16 -26 L-9 14" stroke="#2f5fa8" strokeWidth={7} strokeLinecap="round" /><path d="M-9 14 L-12 19" stroke={INK} strokeWidth={4} strokeLinecap="round" /><path d="M16 -26 L12 -20" stroke="#f6f2e8" strokeWidth={7} strokeLinecap="round" /></>);
    case "whistle": // свисток: мундштук назад (ко рту), бочонок у кисти, красный шнурок
      return g(<><path d="M14 -8 Q26 22 8 38" fill="none" stroke="#c8302e" strokeWidth={3} strokeLinecap="round" /><WhistleBody /></>);
    case "baton-striped": // жезл регулировщика: чёрно-белые полосы
      return g(up(<g transform="rotate(28)">
        <rect x={-7} y={-96} width={14} height={104} rx={6} fill="#f6f6f2" />
        {[-84, -60, -36, -12].map((y) => <rect key={y} x={-7} y={y} width={14} height={12} fill="#1d1d1d" />)}
        <rect x={-8} y={-4} width={16} height={18} rx={5} fill="#1d1d1d" />
      </g>));
    // ——— низ на y ≈ +40 от кисти (REST_BOTTOM): положенный предмет стоит на столе/полу ———
    case "laptop":
      return g(up(<Laptop />));
    case "laptop-broken": // мокрый, помятый, с трещинами на экране, дымится
      return g(up(<Laptop broken />));
    case "dishes": // тарелка (держат за край) и губка с пеной
      return g(up(<>
        <circle cx={38} cy={0} r={40} fill="#f6f2e8" />
        <circle cx={38} cy={0} r={33} fill="none" stroke="#4a6fa5" strokeWidth={3} />
        <circle cx={38} cy={0} r={24} fill="#ebe4d4" />
        <g transform="rotate(-18 56 10)">
          <rect x={38} y={0} width={40} height={24} rx={5} fill="#f2c94c" />
          <rect x={38} y={0} width={40} height={9} rx={4} fill="#5b8c5a" />
        </g>
        {[[30, -14, 7], [42, -20, 5], [24, -24, 4], [72, -8, 6], [50, -8, 4]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="#ffffff" stroke="#bfe0ee" strokeWidth={1.5} />)}
      </>));
    case "fridge-magnets": // два сувенирных магнита веером в ладони: пальма у моря и башня
      return g(up(<>
        <g transform="rotate(14 34 10)">
          <rect x={16} y={-18} width={38} height={46} rx={6} fill="#f6efe0" />
          <rect x={20} y={-14} width={30} height={38} rx={4} fill="#f2b8c0" />
          <path d="M35 -10 L31 6 L28 20 H33 Q35 14 37 20 H42 L39 6 Z" fill="#3a3a44" />
          <rect x={29} y={4} width={12} height={3} fill="#3a3a44" />
        </g>
        <g transform="rotate(-10 14 20)">
          <rect x={-8} y={-2} width={44} height={42} rx={6} fill="#f6efe0" />
          <rect x={-4} y={2} width={36} height={34} rx={4} fill="#8fc3e6" />
          <rect x={-4} y={26} width={36} height={10} rx={3} fill="#f2d48a" />
          <circle cx={24} cy={10} r={5} fill="#f2b33d" />
          <path d="M8 28 Q6 18 10 10" stroke="#8a5a3a" strokeWidth={3} fill="none" />
          <path d="M10 10 q-8 -2 -10 4 M10 10 q8 -4 12 2 M10 10 q-2 -8 -8 -8 M10 10 q4 -8 10 -6" stroke="#5b8c5a" strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      </>));
    case "gavel": // судейский молоток лежит в руке: черенок в кулаке, боёк впереди
      return g(up(<>
        <rect x={-30} y={10} width={100} height={13} rx={6} fill={WOOD} />
        <circle cx={-30} cy={16.5} r={8} fill={WOOD_DARK} />
        <rect x={64} y={-6} width={42} height={46} rx={10} fill={WOOD_DARK} />
        <rect x={64} y={-6} width={42} height={8} rx={4} fill={BRASS} />
        <rect x={64} y={32} width={42} height={8} rx={4} fill={BRASS} />
        <rect x={70} y={6} width={6} height={22} rx={3} fill="#8a5a3a" opacity={0.6} />
      </>));
    case "plush-heart": // плюшевое сердце остриём вверх — две «половинки» внизу (сойдёт и за попу)
      return g(up(<>
        <path d="M40 -46 C62 -30 90 -10 88 14 A26 26 0 0 1 40 27.9 A26 26 0 0 1 -8 14 C-10 -10 18 -30 40 -46 Z" fill="#d9363e" />
        <ellipse cx={16} cy={16} rx={13} ry={10} fill="#e85a62" />
        <ellipse cx={64} cy={16} rx={13} ry={10} fill="#e85a62" />
        <path d="M40 28 Q38 18 40 8" stroke="#a8232b" strokeWidth={3.5} strokeLinecap="round" fill="none" />
        <path d="M40 -36 C58 -22 80 -6 80 12 M40 -36 C22 -22 0 -6 0 12" stroke="#f08a90" strokeWidth={2} strokeDasharray="4 5" fill="none" />
        <rect x={34} y={-52} width={12} height={10} rx={2} fill={PAPER} />
        <path d="M30 -10 q4 -3 8 0 M50 -16 q4 -3 8 0 M24 4 q4 -3 8 0" stroke="#b52a33" strokeWidth={1.6} fill="none" opacity={0.6} />
      </>));
    case "voodoo-doll": // тряпичная кукла с булавками, держат за ручку
      return g(up(<>
        <rect x={-2} y={-8} width={84} height={14} rx={7} fill="#c9a77a" />
        <path d="M26 -8 H54 L58 24 H22 Z" fill="#c9a77a" />
        <rect x={22} y={18} width={15} height={22} rx={7} fill="#c9a77a" />
        <rect x={43} y={18} width={15} height={22} rx={7} fill="#c9a77a" />
        <circle cx={40} cy={-26} r={19} fill="#c9a77a" />
        <path d="M24 -38 q4 -10 10 -4 M34 -44 q6 -8 10 0 M46 -42 q8 -6 10 2" stroke="#3a2a20" strokeWidth={3} fill="none" strokeLinecap="round" />
        <rect x={28} y={-9} width={24} height={4} rx={2} fill="#7a5a3a" />
        <g stroke={INK} strokeWidth={2.6} strokeLinecap="round">
          <path d="M30 -32 l7 7 M37 -32 l-7 7 M43 -32 l7 7 M50 -32 l-7 7" />
          <path d="M31 -16 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3" fill="none" />
        </g>
        <path d="M34 2 q6 -6 12 0 l-6 8 Z" fill="#c8302e" />
        <g stroke="#8a6a44" strokeWidth={1.6} strokeDasharray="3 4" fill="none"><path d="M26 -2 V20 M54 -2 V20 M4 -1 H22 M58 -1 H78" /></g>
        {[[52, -34, 70, -48, "#c8302e"], [46, 8, 66, 0, "#f2b33d"], [30, 30, 12, 36, "#3d6fb3"], [26, -22, 8, -36, "#5b8c5a"]].map(([x1, y1, x2, y2, c], i) => (
          <g key={i}><line x1={x1 as number} y1={y1 as number} x2={x2 as number} y2={y2 as number} stroke="#b9c2cc" strokeWidth={2.5} /><circle cx={x2 as number} cy={y2 as number} r={4.5} fill={c as string} /></g>
        ))}
      </>));
    case "bass-drum": {
      // большой барабан с тарелкой сверху, несут перед собой: кисть — у правого обода, барабан — перед животом
      const L = -300, R = -4, T = -128, B = 40;
      const zig: string[] = [];
      for (let i = 0; i <= 8; i++) zig.push(`${L + 14 + ((R - L - 28) * i) / 8} ${i % 2 ? B - 14 : T + 14}`);
      return g(up(<>
        {/* тарелка сверху — ближе к переднему ободу, чтобы не пряталась за головой */}
        <rect x={-58} y={T - 40} width={8} height={40} fill="#8a9096" />
        <ellipse cx={-54} cy={T - 40} rx={48} ry={9} fill="#e0a030" />
        <ellipse cx={-54} cy={T - 44} rx={12} ry={5} fill="#c99020" />
        <ellipse cx={-70} cy={T - 41} rx={18} ry={2.5} fill="#f6d27a" opacity={0.8} />
        <rect x={L} y={T} width={R - L} height={B - T} fill="#c8553d" />
        <rect x={L} y={T + 10} width={R - L} height={10} fill="#e0a030" opacity={0.8} />
        <rect x={L} y={B - 20} width={R - L} height={10} fill="#e0a030" opacity={0.8} />
        <path d={`M${zig.join(" L")}`} fill="none" stroke={PAPER} strokeWidth={4} strokeLinejoin="round" />
        {[L, R].map((hx) => (
          <g key={hx}>
            <rect x={hx - 13} y={T - 4} width={26} height={B - T + 4} rx={10} fill="#efe2cc" />
            <rect x={hx - 13} y={T - 4} width={26} height={B - T + 4} rx={10} fill="none" stroke="#8a5a3a" strokeWidth={4} />
          </g>
        ))}
      </>));
    }
    case "cable-coil": { // моток сетевого кабеля, держат сбоку; стяжка сверху, хвост с коннектором
      const loops = [[46, -4, 44, 0], [44, -2, 40, 14], [48, -6, 42, -12], [45, -3, 36, 26], [47, -5, 38, -26], [44, -4, 46, 6]];
      return g(up(<>
        {loops.map(([cx, cy, r, a], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.96} transform={`rotate(${a} ${cx} ${cy})`} fill="none" stroke={["#3d7cc9", "#3471b8", "#4a88d4"][i % 3]} strokeWidth={7} />
        ))}
        <rect x={38} y={-56} width={16} height={14} rx={3} fill="#2b2b2b" />
        <path d="M86 18 Q100 30 98 40 Q96 30 110 26" stroke="#3d7cc9" strokeWidth={6} fill="none" strokeLinecap="round" />
        <rect x={104} y={14} width={16} height={22} rx={3} fill="#dde7ee" opacity={0.95} />
        {[107, 111, 115].map((cx) => <rect key={cx} x={cx} y={28} width={2} height={6} fill="#d9a92a" />)}
      </>));
    }
    case "towel": // сложенное банное полотенце, держат за край
      return g(up(<>
        <rect x={-10} y={0} width={96} height={40} rx={10} fill="#f4f1ea" />
        <rect x={-10} y={14} width={96} height={4} fill="#e2ddd0" />
        <rect x={-10} y={26} width={96} height={4} fill="#e2ddd0" />
        <rect x={60} y={0} width={7} height={40} fill="#4a8fc8" />
        <rect x={71} y={0} width={4} height={40} fill="#4a8fc8" />
        <path d="M86 6 V34" stroke="#f4f1ea" strokeWidth={4} strokeDasharray="2 3" />
      </>));
    default:
      return null;
  }
};

/**
 * Как предмет лежит/стоит на поверхности (rest). Рисунок — тот же, что в руке, но без поворота руки (или свой `draw`);
 * к нему применяется `rotate(rot)`, затем `scale(s, s·flat)` (flat < 1 — плоский предмет «лежит» в лёгкой перспективе),
 * затем сдвиг (dx, dy), после которого низ предмета ровно на y = 0, а середина — на x = 0.
 * Новый предмет = одна строка: rot/flat/draw на глаз, dx/dy — обмером листа `Props` с mode "measure" (см. PropsPreview.tsx),
 * проверка — лист `Props`: предмет должен стоять/лежать на красных линиях пола и стола.
 */
export type Rest = { rot?: number; flat?: number; s?: number; dx: number; dy: number; draw?: () => React.ReactNode };

/** Пачка купюр, лежит плашмя. */
const MoneyFlat = () => (
  <g>
    <path d="M-34 -6 L30 -6 L36 0 L-28 0 Z" fill="#6f9f6a" />
    <path d="M-36 -10 L28 -10 L34 -5 L-30 -5 Z" fill="#7fb07a" />
    <path d="M-30 -15 L32 -15 L38 -10 L-24 -10 Z" fill="#94c48d" />
    <ellipse cx={4} cy={-12.5} rx={7} ry={2} fill="#7fb07a" />
  </g>
);
/** Телефон экраном вверх. */
const PhoneFlat = () => (
  <g><path d="M-22 -7 L18 -7 L24 0 L-16 0 Z" fill={INK} /><path d="M-18 -6 L14 -6 L18 -2 L-14 -2 Z" fill="#7fb3d5" /></g>
);
/** Сложенная газета. */
const NewspaperFlat = () => (
  <g>
    <path d="M-44 -4 L40 -4 L46 0 L-38 0 Z" fill="#d9d1c0" />
    <path d="M-42 -14 L38 -14 L44 -4 L-36 -4 Z" fill="#efe9dc" />
    <path d="M-36 -12 L-6 -12 L-4 -9 L-34 -9 Z" fill="#8a8072" />
    <path d="M-32 -8 L36 -8 L37 -6.5 L-31 -6.5 Z" fill="#b8af9f" />
  </g>
);
/** Сложенный зонт лежит. */
const UmbrellaFlat = () => (
  <g>
    <rect x={-68} y={-10} width={128} height={5} rx={2.5} fill={INK} />
    <path d="M-60 -8 L40 -17 Q48 -8 40 0 Z" fill="#3d6fb3" />
    <path d="M60 -8 Q74 -8 74 -16" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
  </g>
);
/** Удочка лежит: катушка снизу, леска с поплавком рядом. */
const FishingRodFlat = () => (
  <g>
    <path d="M-110 -16 L130 -9 L130 -7 L-110 -8 Z" fill={WOOD_DARK} />
    <circle cx={-80} cy={-10} r={10} fill={METAL} />
    <circle cx={-80} cy={-10} r={4} fill={INK} />
    <path d="M130 -8 Q146 -2 150 -4" fill="none" stroke={INK} strokeWidth={2} opacity={0.55} />
    <ellipse cx={160} cy={-7} rx={11} ry={7} fill="#c8553d" />
    <rect x={158} y={-14} width={4} height={14} fill={PAPER} />
  </g>
);

const REST: Record<string, Rest> = {
  // стоят
  bottle: { dx: 0, dy: 10 },
  glass: { dx: 0, dy: 6 },
  suitcase: { dx: 0, dy: -72 },
  cake: { dx: 0, dy: 4 },
  bicycle: { dx: 66, dy: -152.5 },
  "road-sign": { dx: 0, dy: -60 },
  gong: { dx: -130, dy: -150, draw: () => <><GongStand /><line x1={180} y1={FLOOR - 1.5} x2={222} y2={FLOOR - 1.5} stroke={WOOD} strokeWidth={7} strokeLinecap="round" /><circle cx={232} cy={FLOOR - 12} r={14} fill="#c8553d" /></> },
  bucket: { dx: 0, dy: -110 },
  vase: { dx: -16, dy: -74 },
  birdcage: { dx: 0, dy: -120 },
  globe: { dx: -17.2, dy: -6 },
  "genie-bottle": { dx: 0, dy: 10.5 },
  canister: { dx: 0, dy: -110 },
  scales: { dx: -27, dy: -2 },
  laptop: { dx: -54, dy: -40 },
  "laptop-broken": { dx: -54, dy: -40 },
  "plush-heart": { dx: -40, dy: -40 },
  "bass-drum": { dx: 152, dy: -42 },
  matchbox: { rot: 10, dx: 0, dy: 8 },
  // лежат на боку
  flowers: { rot: 90, dx: -41, dy: -22 },
  keys: { rot: 90, flat: 0.6, dx: 18.8, dy: -7.5 },
  cane: { rot: -90, dx: -60, dy: -8 },
  "white-cane": { rot: -90, dx: -75, dy: -4 },
  wrench: { rot: -70, dx: -23.5, dy: -17 },
  pistol: { flat: 0.5, dx: -16.4, dy: -6 },
  rifle: { rot: 58, dx: -32.5, dy: -16 },
  bagpipes: { rot: 90, dx: -76.7, dy: -46 },
  sandwich: { rot: 8, dx: 0, dy: 0 },
  shovel: { rot: -82, flat: 0.5, dx: -19, dy: -12 },
  chicken: { dx: -2, dy: -124 },
  coffin: { rot: -90, flat: 0.55, dx: 11, dy: 6.5, draw: () => <CoffinBody /> },
  snake: { rot: -90, flat: 0.4, dx: -52.2, dy: -18.5 },
  "chocolate-bar": { rot: 98, flat: 0.45, dx: -42, dy: -10 },
  baby: { rot: 18, dx: -5, dy: -6 },
  pen: { rot: 58, dx: -4.8, dy: -3.5 },
  "baton-striped": { rot: 62, dx: -41, dy: -8 },
  gavel: { dx: -34, dy: -40 },
  "voodoo-doll": { rot: -90, flat: 0.5, dx: 6, dy: -1 },
  mirror: { rot: 90, flat: 0.5, dx: -43, dy: -14 },
  // лежат плашмя (бумага, плоские вещи)
  money: { dx: -1, dy: 0, draw: () => <MoneyFlat /> },
  phone: { dx: -1, dy: 0, draw: () => <PhoneFlat /> },
  newspaper: { dx: -1, dy: 0, draw: () => <NewspaperFlat /> },
  umbrella: { dx: -4.5, dy: 0, draw: () => <UmbrellaFlat /> },
  "fishing-rod": { dx: -30.5, dy: 0, draw: () => <FishingRodFlat /> },
  whistle: { dx: -6.8, dy: 0, draw: () => <><WhistleBody /><path d="M14 -8 Q20 -1.5 34 -1.5 Q50 -1.5 52 -4" fill="none" stroke="#c8302e" strokeWidth={3} strokeLinecap="round" /></> },
  letter: { flat: 0.22, dx: 0, dy: 1 },
  certificate: { flat: 0.16, dx: 0, dy: 0.5 },
  photo: { flat: 0.2, dx: 0, dy: 2.5 },
  ticket: { flat: 0.25, dx: 0, dy: 2 },
  bill: { flat: 0.16, dx: 0, dy: 1 },
  map: { rot: 6, flat: 0.16, dx: -49, dy: 2 },
  clipboard: { flat: 0.18, dx: 0, dy: -1.5 },
  "playing-cards": { flat: 0.25, dx: 0, dy: 1 },
  coin: { flat: 0.3, dx: -4, dy: 3 },
  dishes: { flat: 0.35, dx: -39, dy: -14 },
  "fridge-magnets": { flat: 0.25, dx: -24.4, dy: -10.5 },
  "cable-coil": { flat: 0.35, dx: -57.2, dy: -15.5 },
  towel: { flat: 0.55, dx: -39, dy: -22 },
};

/**
 * Предмет. В руке: (x, y) — центр кисти, рисунок поворачивается вместе с рукой (Rig.tsx).
 * rest: (x, y) — точка на поверхности; предмет стоит/лежит на ней по строке REST (без строки — рисунок как есть).
 */
export const PropItem = ({ id, x, y, rest = false }: { id: string; x: number; y: number; rest?: boolean }) => {
  if (!rest) {
    const art = propArt(id, upright);
    return art === null ? null : <g transform={`translate(${x} ${y})`}>{art}</g>;
  }
  const r = REST[id];
  const art = r?.draw ? r.draw() : propArt(id, (c) => <g>{c}</g>);
  if (art === null) return null;
  const s = r?.s ?? 1;
  return <g transform={`translate(${x + (r?.dx ?? 0)} ${y + (r?.dy ?? 0)}) scale(${s} ${s * (r?.flat ?? 1)}) rotate(${r?.rot ?? 0})`}>{art}</g>;
};
