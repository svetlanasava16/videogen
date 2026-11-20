/**
 * Реквизит в руке куклы. Координаты — бокс куклы (300×600), (0,0) — центр кисти; предмет рисуется чуть ниже/выше кисти.
 * Список id — content/props.json (его же видит сценарист). Новый предмет = новый case + строка в props.json.
 * Стиль: плоские формы без контуров, как у кукол.
 */
const INK = "#2b1d14";

export const PropItem = ({ id, x, y }: { id: string; x: number; y: number }) => {
  const g = (children: React.ReactNode) => <g transform={`translate(${x} ${y})`}>{children}</g>;
  switch (id) {
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
    case "bill":
      return g(<><path d="M-24 -84 h48 v76 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 z" fill="#f6f2e8" /><rect x={-16} y={-74} width={32} height={4} fill="#8a8072" /><rect x={-16} y={-62} width={24} height={4} fill="#c8b99a" /><rect x={-16} y={-50} width={32} height={4} fill="#c8b99a" /><rect x={-16} y={-34} width={20} height={6} fill="#c8553d" /></>);
    case "wrench":
      return g(<><rect x={-5} y={-10} width={10} height={90} rx={4} fill="#9aa8b8" transform="rotate(-20)" /><path d="M-22 -26 a22 22 0 1 0 30 -12 l-10 12 l-12 -4 z" fill="#9aa8b8" /></>);
    default:
      return null;
  }
};
