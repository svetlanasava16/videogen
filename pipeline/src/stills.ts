/**
 * Стоп-кадры эпизода на ключевых моментах и контактный лист:
 *   pnpm stills <id> [<id>…]      — out/stills/<id>/NN-<kind>-f<frame>.png, sheet.png, index.html (подписи кадров)
 *   pnpm stills --debug           — весь отладочный набор (content/debug-set.json) + общий лист out/stills/debug-sheet.png
 *   --scale 0.25                  — размер кадров (по умолчанию 0.25 → 270×480)
 * Смотреть кадры после каждой правки эпизода или движка: кукла не на месте, перекрытия, субтитры на лицах, предмет не в руке.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { contactSheet, keyFrames, loadEpisode, stillRenderer } from "./stillkit.js";
import { debugSet } from "./validate.js";
import { ROOT } from "./util.js";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function main() {
  const { values, positionals } = parseArgs({ options: { debug: { type: "boolean" }, scale: { type: "string" } }, allowPositionals: true });
  const ids = positionals.length ? positionals : values.debug ? debugSet() : [];
  if (!ids.length) throw new Error("usage: pnpm stills <episodeId…> | --debug");
  const scale = Number(values.scale ?? "0.25");
  const r = await stillRenderer();
  const firsts: string[] = [];
  try {
    for (const id of ids) {
      const ep = loadEpisode(id);
      const keys = keyFrames(ep);
      const dir = join(ROOT, "out/stills", id);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      const name = (i: number) => `${String(i + 1).padStart(2, "0")}-${keys[i].kind}-f${keys[i].frame}.png`;
      const byFrame = new Map(keys.map((k, i) => [k.frame, join(dir, name(i))]));
      await r.render(ep, keys.map((k) => k.frame), scale, (f) => byFrame.get(f)!);
      const files = keys.map((_, i) => join(dir, name(i)));
      writeFileSync(join(dir, "sheet.png"), contactSheet(files));
      writeFileSync(join(dir, "frames.json"), JSON.stringify(keys, null, 2));
      writeFileSync(join(dir, "index.html"), `<!doctype html><meta charset="utf-8"><title>${esc(id)}</title><body style="background:#2b1d14;color:#eee;font:14px sans-serif">
<h2>${esc(id)} — ${esc(ep.title)}</h2><div style="display:flex;flex-wrap:wrap;gap:8px">
${keys.map((k, i) => `<figure style="width:${Math.round(1080 * scale)}px;margin:0"><img src="${name(i)}" width="100%"><figcaption>${k.frame}: ${esc(k.label)}</figcaption></figure>`).join("\n")}
</div>`);
      firsts.push(...files);
      console.log(`${id}: ${keys.length} frames → out/stills/${id}/sheet.png`);
    }
  } finally {
    await r.close();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
