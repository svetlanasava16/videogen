/**
 * Сборники: несколько анекдотов подряд с пролётом по городу (композиция Compilation).
 *   pnpm compile --locale ru [--size 3] [--count 5] [--voiced] [--title "…"]   — собрать новые из готовых эпизодов
 *   pnpm compile --episodes id1,id2,id3 [--title "…"]                          — вручную
 *   pnpm compile list
 * Пишет content/compilations/<id>.json. Рендер: pnpm render --compilation <id>.
 * Отбор: популярность, разные фоны подряд, эпизоды не из других сборников, без отклонённых и высмеивающих веру.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CompilationSpec, Episode, type Locale } from "@jf/core";
import { blocked } from "./risk.js";
import { DATA, ROOT, readJsonl } from "./util.js";

const DIR = join(ROOT, "content", "compilations");
const EPISODES = join(ROOT, "content", "episodes");
const TITLES: Record<Locale, (n: number) => string> = {
  ru: (n) => `${n} ${n < 5 ? "анекдота" : "анекдотов"} подряд`,
  en: (n) => `${n} jokes in a row`,
  de: (n) => `${n} Witze am Stück`,
};

function arg(name: string, def?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}

export const loadCompilations = () =>
  existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => CompilationSpec.parse(JSON.parse(readFileSync(join(DIR, f), "utf8")))) : [];

const loadEpisode = (id: string) => Episode.parse(JSON.parse(readFileSync(join(EPISODES, `${id}.json`), "utf8")));

function save(spec: CompilationSpec) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(join(DIR, `${spec.id}.json`), JSON.stringify(spec, null, 2) + "\n");
  console.log(`${spec.id}: ${spec.title} — ${spec.episodes.join(", ")}`);
}

function nextId(locale: string) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const n = loadCompilations().filter((c) => c.id.startsWith(`${locale}-${day}`)).length + 1;
  return `${locale}-${day}-${String(n).padStart(2, "0")}`;
}

function auto() {
  const locale = arg("locale", "ru") as Locale;
  const size = Number(arg("size", "3"));
  const count = Number(arg("count", "1"));
  const voiced = process.argv.includes("--voiced");
  const used = new Set(loadCompilations().flatMap((c) => c.episodes));
  const pop = new Map<string, number>();
  for (const l of ["ru", "en", "de"]) for (const j of readJsonl<{ id: string; popularity?: number }>(join(DATA, "jokes", `${l}.jsonl`))) pop.set(j.id, j.popularity ?? 0);
  const pool = readdirSync(EPISODES)
    .filter((f) => f.endsWith(`.${locale}.json`) && !f.startsWith("test-") && !f.startsWith("demo-"))
    .map((f) => loadEpisode(f.replace(/\.json$/, "")))
    .filter((e) => !used.has(e.id) && !blocked(e.jokeId))
    .filter((e) => !voiced || e.lines.every((l) => l.audio))
    .sort((a, b) => (pop.get(b.jokeId) ?? 0) - (pop.get(a.jokeId) ?? 0));
  for (let k = 0; k < count; k++) {
    const pick: Episode[] = [];
    for (const e of [...pool]) {
      if (pick.length >= size) break;
      // разные фоны внутри сборника, чтобы пролёт был между разными зданиями
      if (pick.some((p) => p.location === e.location)) continue;
      pick.push(e);
      pool.splice(pool.indexOf(e), 1);
    }
    if (pick.length < 2) {
      console.log("недостаточно эпизодов (нужны озвученные? уберите --voiced или озвучьте больше)");
      return;
    }
    save(CompilationSpec.parse({ id: nextId(locale), locale, title: arg("title") ?? TITLES[locale](pick.length), episodes: pick.map((e) => e.id) }));
  }
}

function manual(ids: string[]) {
  const eps = ids.map(loadEpisode);
  const locale = eps[0].locale;
  if (eps.some((e) => e.locale !== locale)) throw new Error("все эпизоды сборника должны быть на одном языке");
  save(CompilationSpec.parse({ id: nextId(locale), locale, title: arg("title") ?? TITLES[locale](eps.length), episodes: ids }));
}

import { pathToFileURL } from "node:url";
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
const cmd = process.argv[2];
if (!isMain) {
  // импорт как библиотеки
} else if (cmd === "list") for (const c of loadCompilations()) console.log(`${c.id.padEnd(16)} ${c.title.padEnd(26)} ${c.episodes.join(", ")}`);
else if (arg("episodes")) manual(arg("episodes")!.split(",").map((s) => s.trim()));
else auto();
