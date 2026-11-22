/**
 * Арт для игры (ROADMAP §7): pnpm export-art [--png] [--locale ru|en|de|all] [--only bar,klass] [--out out/art]
 *   backdrops/<место>/<вид>.<язык>.<слой>.svg (и .png с --png; передний слой — прозрачный вокруг стойки)
 *   backdrops/index.json — виды, файлы и метаданные: метки (x, план, стопы, масштаб, верх сиденья), поверхности,
 *                          передний слой, слоты, массовка — всё в px кадра 1080×1920
 *   puppets/<кукла>.json — display list куклы в покое (облик по умолчанию); в игре его строят на каждый кадр
 *                          из позы (remotion/src/art/displayList.ts), рисует canvas.ts или Pixi Graphics
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import type { Locale } from "@jf/core";
import { artPlaces, backdropSvg, placeMeta, puppetDisplayLists, type Layer } from "../../remotion/src/art/exportArt.js";
import { ROOT } from "./util.js";

async function main() {
  const { values } = parseArgs({ options: { png: { type: "boolean" }, locale: { type: "string" }, only: { type: "string" }, out: { type: "string" } } });
  const locales: Locale[] = !values.locale || values.locale === "all" ? ["ru", "en", "de"] : [values.locale as Locale];
  const only = values.only?.split(",").map((s) => s.trim());
  const out = join(ROOT, values.out ?? "out/art");
  const places = artPlaces().filter((p) => !only || only.includes(p.location));
  const index: unknown[] = [];
  const jobs: { location: string; place?: string; layer: Layer; locale: Locale; file: string }[] = [];
  let svgs = 0, bytes = 0;
  for (const p of places) {
    const dir = join(out, "backdrops", p.location);
    mkdirSync(dir, { recursive: true });
    const files: Record<string, Record<string, { svg: string; png?: string }>> = {};
    for (const locale of locales) for (const layer of p.layers) {
      const svg = backdropSvg(p.location, p.place, layer, locale);
      if (!svg) continue;
      const base = `${p.place ?? "default"}.${locale}.${layer}`;
      writeFileSync(join(dir, `${base}.svg`), svg);
      svgs++; bytes += svg.length;
      (files[locale] ??= {})[layer] = { svg: `backdrops/${p.location}/${base}.svg`, ...(values.png ? { png: `backdrops/${p.location}/${base}.png` } : {}) };
      if (values.png) jobs.push({ location: p.location, place: p.place, layer, locale, file: join(dir, `${base}.png`) });
    }
    index.push({ name: p.name, ...placeMeta(p.location, p.place), files });
  }
  writeFileSync(join(out, "backdrops", "index.json"), JSON.stringify({ v: 1, size: [1080, 1920], locales, places: index }, null, 2));
  console.log(`${places.length} views, ${svgs} SVG layers (${(bytes / 1024 / 1024).toFixed(1)} MB) → ${join(values.out ?? "out/art", "backdrops")}`);

  // куклы: display list в покое (облик по умолчанию)
  mkdirSync(join(out, "puppets"), { recursive: true });
  let items = 0;
  const puppets = puppetDisplayLists();
  for (const p of puppets) {
    items += p.items.length;
    writeFileSync(join(out, "puppets", `${p.id}.json`), JSON.stringify({ v: 1, id: p.id, box: [300, 600], feetY: 585, items: p.items }));
  }
  console.log(`${puppets.length} puppets, ${items} display-list items → ${join(values.out ?? "out/art", "puppets")}`);

  if (jobs.length) {
    const t0 = Date.now();
    const serveUrl = await bundle({ entryPoint: join(ROOT, "remotion/src/index.ts") });
    const browser = await openBrowser("chrome");
    try {
      for (const [i, j] of jobs.entries()) {
        const inputProps = { location: j.location, place: j.place, layer: j.layer, locale: j.locale };
        const composition = await selectComposition({ serveUrl, id: "BackdropLayer", inputProps, puppeteerInstance: browser });
        await renderStill({ composition, serveUrl, output: j.file, inputProps, imageFormat: "png", puppeteerInstance: browser, overwrite: true });
        if ((i + 1) % 25 === 0) console.log(`  png ${i + 1}/${jobs.length}`);
      }
    } finally {
      await browser.close({ silent: true });
    }
    console.log(`${jobs.length} PNG layers in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}

main();
