/**
 * Golden-тесты движка на отладочном наборе (content/debug-set.json): эталонные кадры в tests/golden/<id>/,
 * сравнение текущего рендера с эталоном по пикселям.
 *   pnpm golden                 — сравнить; отчёт out/golden/report.md, диффы out/golden/<id>/f<frame>-diff.png; код 1 при расхождении
 *   pnpm golden --update        — записать эталоны (после того как изменение проверено глазами)
 *   pnpm golden <id> [--update] — только эти эпизоды
 * Кадры эталона фиксируются в tests/golden/<id>/frames.json: сравниваются те же номера кадров, даже если таймлайн сдвинулся.
 * Прогонять перед каждым коммитом в движок.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { keyFrames, loadEpisode, stillRenderer, type KeyFrame } from "./stillkit.js";
import { debugSet } from "./validate.js";
import { ROOT } from "./util.js";

/** Размер эталонных кадров (доля 1080×1920): мелко, чтобы эталоны жили в git, но видно раскладку. */
const SCALE = 0.15;
/** Пиксель считается изменённым при цветовом расстоянии больше порога pixelmatch. */
const PIXEL_THRESHOLD = 0.1;
/** Кадр «сломан», если изменилось больше этой доли пикселей. */
const FRAME_LIMIT = 0.005;

async function main() {
  const { values, positionals } = parseArgs({ options: { update: { type: "boolean" } }, allowPositionals: true });
  const ids = positionals.length ? positionals : debugSet();
  const r = await stillRenderer();
  const rows: string[] = [];
  let failed = 0;
  try {
    for (const id of ids) {
      const gdir = join(ROOT, "tests/golden", id);
      const odir = join(ROOT, "out/golden", id);
      rmSync(odir, { recursive: true, force: true });
      mkdirSync(odir, { recursive: true });
      const ep = loadEpisode(id);
      const manifest = join(gdir, "frames.json");
      const keys: KeyFrame[] = values.update || !existsSync(manifest) ? keyFrames(ep) : JSON.parse(readFileSync(manifest, "utf8"));
      await r.render(ep, keys.map((k) => k.frame), SCALE, (f) => join(odir, `f${f}.png`));
      if (values.update || !existsSync(manifest)) {
        rmSync(gdir, { recursive: true, force: true });
        mkdirSync(gdir, { recursive: true });
        for (const k of keys) writeFileSync(join(gdir, `f${k.frame}.png`), readFileSync(join(odir, `f${k.frame}.png`)));
        writeFileSync(manifest, JSON.stringify(keys, null, 2) + "\n");
        rows.push(`| ${id} | ${keys.length} | updated | |`);
        console.log(`${id}: ${keys.length} reference frames written`);
        continue;
      }
      const bad: string[] = [];
      for (const k of keys) {
        const a = PNG.sync.read(readFileSync(join(gdir, `f${k.frame}.png`)));
        const b = PNG.sync.read(readFileSync(join(odir, `f${k.frame}.png`)));
        if (a.width !== b.width || a.height !== b.height) { bad.push(`f${k.frame} size`); continue; }
        const diff = new PNG({ width: a.width, height: a.height });
        const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: PIXEL_THRESHOLD });
        const share = n / (a.width * a.height);
        if (share > FRAME_LIMIT) {
          writeFileSync(join(odir, `f${k.frame}-diff.png`), PNG.sync.write(diff));
          bad.push(`f${k.frame} ${(share * 100).toFixed(1)}% (${k.label.slice(0, 50)})`);
        }
      }
      if (bad.length) failed++;
      rows.push(`| ${id} | ${keys.length} | ${bad.length ? `**${bad.length} changed**` : "ok"} | ${bad.join("; ")} |`);
      console.log(`${id}: ${bad.length ? `${bad.length}/${keys.length} frames changed` : "ok"}`);
    }
  } finally {
    await r.close();
  }
  mkdirSync(join(ROOT, "out/golden"), { recursive: true });
  writeFileSync(join(ROOT, "out/golden/report.md"), [
    "# Golden report", "", `${ids.length} episodes, ${failed} with changes (limit ${FRAME_LIMIT * 100}% pixels per frame)`, "",
    "| episode | frames | result | changed frames |", "|---|---|---|---|", ...rows, "",
    "Diffs: out/golden/<id>/f<frame>-diff.png (red = changed). If the change is intended: pnpm golden --update.",
  ].join("\n"));
  console.log(`\n${ids.length} episodes, ${failed} with changes → out/golden/report.md`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
