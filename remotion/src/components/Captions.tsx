import { useCurrentFrame } from "remotion";
import type { Locale } from "@jf/core";
import type { TimedLine } from "../timeline";

/** Субтитры-караоке: слово подсвечивается, когда звучит. Безопасная зона — выше нижних 20% (UI шортсов). */
/** Рассказчик: голос без куклы, субтитры курсивом в верхней части кадра. */
export const Captions = ({ line, locale, narrator = false }: { line?: TimedLine; locale: Locale; narrator?: boolean }) => {
  const frame = useCurrentFrame();
  if (!line) return null;
  return (
    <div
      lang={locale}
      style={{
        position: "absolute", left: 60, right: 60, top: narrator ? "8%" : "66%",
        fontStyle: narrator ? "italic" : "normal",
        ...(narrator ? { background: "rgba(0,0,0,0.55)", borderRadius: 28, padding: "24px 32px" } : {}),
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 26px",
        fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif", fontWeight: narrator ? 700 : 900, fontSize: narrator ? 60 : 76, lineHeight: 1.1,
        textAlign: "center", textTransform: narrator ? "none" : "uppercase",
      }}
    >
      {line.words.map((w, i) => {
        const active = frame >= w.startFrame && frame <= w.endFrame;
        const spoken = frame > w.endFrame;
        return (
          <span
            key={i}
            style={{
              color: active ? (narrator ? "#9be7ff" : "#ffd400") : spoken ? "#ffffff" : "#ffffffaa",
              // длинное слово растёт меньше, чтобы не наезжать на соседей (зазор 26px)
              transform: active ? `scale(${1 + Math.min(0.12, 26 / (0.62 * (narrator ? 60 : 76) * Math.max(w.text.length, 1)))})` : "none",
              WebkitTextStroke: "10px #000", paintOrder: "stroke fill",
              display: "inline-block",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
