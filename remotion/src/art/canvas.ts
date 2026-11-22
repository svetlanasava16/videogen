/**
 * Рендерер display list на Canvas2D (браузер). Тот же набор операций нужен Pixi Graphics: путь SVG в матрице,
 * заливка/обводка, прозрачность, клип путём. Это проверка, что арт не привязан к SVG/React.
 */
import type { DisplayItem, Mat } from "./displayList";

/** base — матрица холста (масштаб и сдвиг бокса куклы в кадре). */
export function drawDisplayList(ctx: CanvasRenderingContext2D, items: DisplayItem[], base: Mat = [1, 0, 0, 1, 0, 0]) {
  const set = (m: Mat) => ctx.setTransform(...mulM(base, m));
  for (const it of items) {
    ctx.save();
    for (const c of it.clip ?? []) { set(c.m); ctx.clip(new Path2D(c.d)); }
    set(it.m);
    ctx.globalAlpha = it.opacity;
    if (it.d) {
      const p = new Path2D(it.d);
      if (it.fill) { ctx.fillStyle = it.fill; ctx.fill(p, it.rule === "evenodd" ? "evenodd" : "nonzero"); }
      if (it.stroke) {
        ctx.strokeStyle = it.stroke; ctx.lineWidth = it.sw ?? 1;
        ctx.lineCap = (it.cap as CanvasLineCap) ?? "butt"; ctx.lineJoin = (it.join as CanvasLineJoin) ?? "miter";
        ctx.setLineDash(it.dash ?? []);
        ctx.stroke(p);
      }
    } else if (it.text) {
      const t = it.text;
      ctx.font = `${t.italic ? "italic " : ""}${t.weight} ${t.size}px Inter`;
      ctx.textAlign = t.anchor === "middle" ? "center" : t.anchor === "end" ? "right" : "left";
      ctx.textBaseline = "alphabetic";
      if (it.fill) { ctx.fillStyle = it.fill; ctx.fillText(t.s, t.x, t.y); }
    }
    ctx.restore();
  }
}
const mulM = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
