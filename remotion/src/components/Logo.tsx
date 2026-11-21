/**
 * Логотип ANEK● : «ANEK» и крупная жирная точка на уровне середины заглавных букв (не внизу, как обычная точка).
 * Точка — круг, а не символ шрифта, чтобы форма не зависела от шрифта.
 */
import { FONT } from "../fonts";
export const LOGO_DOT = "#e0a030";

export const Logo = ({ size, color = "#fff", stroke, dot = LOGO_DOT }: { size: number; color?: string; stroke?: string; dot?: string }) => {
  const d = size * 0.42; // диаметр точки — крупная жирная
  return (
    <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: "0.02em", color, whiteSpace: "nowrap",
      ...(stroke ? { WebkitTextStroke: `${Math.max(2, size * 0.12)}px ${stroke}`, paintOrder: "stroke fill" } : {}) }}>
      ANEK
      <span
        style={{
          display: "inline-block", width: d, height: d, borderRadius: "50%", background: dot, marginLeft: size * 0.07,
          // центр точки на ~0.36 em над базовой линией — середина заглавных букв
          verticalAlign: size * 0.36 - d / 2,
          boxShadow: stroke ? `0 0 0 ${Math.max(1.5, size * 0.05)}px ${stroke}` : undefined,
        }}
      />
    </span>
  );
};
