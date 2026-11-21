import { useCurrentFrame } from "remotion";
import type { Locale } from "@jf/core";
import type { TimedLine } from "../timeline";
import { FONT } from "../fonts";

/** Зазор между словами, px (≈0,45 em при 76px). */
const GAP = 34;

/** Сколько символов помещается в кусок субтитров (≈3 строки): длинная реплика показывается частями. */
const CHUNK_CHARS = { line: 44, narrator: 70 };

/** Делит слова реплики на куски по длине и возвращает кусок, который сейчас звучит. */
function chunkAt<W extends { text: string; startFrame: number }>(words: W[], frame: number, max: number) {
  const chunks: W[][] = [];
  let cur: W[] = [];
  let len = 0;
  for (const w of words) {
    if (cur.length && len + w.text.length + 1 > max) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(w);
    len += w.text.length + 1;
  }
  if (cur.length) chunks.push(cur);
  let k = 0;
  chunks.forEach((c, i) => {
    if (frame >= c[0].startFrame) k = i;
  });
  return chunks[k] ?? [];
}

/** Субтитры-караоке: слово подсвечивается, когда звучит. Безопасная зона — выше нижних 20% (UI шортсов). */
/** Рассказчик: голос без куклы, субтитры курсивом в верхней части кадра. */
/** top — своё место по вертикали (px), например полоса между половинами разделённого экрана. */
export const Captions = ({ line, locale, narrator = false, top }: { line?: TimedLine; locale: Locale; narrator?: boolean; top?: number }) => {
  const frame = useCurrentFrame();
  if (!line) return null;
  const words = chunkAt(line.words, frame, narrator ? CHUNK_CHARS.narrator : CHUNK_CHARS.line);
  return (
    <div
      lang={locale}
      style={{
        position: "absolute", left: 60, right: 60, top: top ?? (narrator ? "8%" : "72%"),
        fontStyle: narrator || line.offscreen ? "italic" : "normal", // голос из-за кадра — курсивом
        ...(narrator ? { background: "rgba(0,0,0,0.55)", borderRadius: 28, padding: "24px 32px" } : {}),
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `12px ${GAP}px`,
        fontFamily: FONT, fontWeight: narrator ? 700 : 900, fontSize: narrator ? 60 : 76, lineHeight: 1.1,
        letterSpacing: "0.01em",
        textAlign: "center", textTransform: narrator ? "none" : "uppercase",
      }}
    >
      {words.map((w, i) => {
        const active = frame >= w.startFrame && frame <= w.endFrame;
        const spoken = frame > w.endFrame;
        return (
          <span
            key={i}
            style={{
              color: active ? (narrator ? "#9be7ff" : "#ffd400") : spoken ? "#ffffff" : "#ffffffaa",
              // длинное слово растёт меньше, чтобы не наезжать на соседей (половина зазора с каждой стороны)
              transform: active ? `scale(${1 + Math.min(0.1, GAP / (0.62 * (narrator ? 60 : 76) * Math.max(w.text.length, 1)))})` : "none",
              WebkitTextStroke: "8px #000", paintOrder: "stroke fill",
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
