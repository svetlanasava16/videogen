/**
 * Каталог по результатам analyze: частоты персонажей и локаций, покрытие, переводимость.
 *   pnpm catalog   → data/catalog/stats.json + docs/catalog-report.md
 */
import { Character, Joke, JokeAnalysis, Locale, Location } from "@jf/core";
import { writeFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { loadCanon } from "./canon.js";
import { join } from "node:path";
import { DATA, ROOT, readJsonl } from "./util.js";

const LOCALES = Locale.options;
const jokes = new Map(
  LOCALES.flatMap((l) => readJsonl(join(DATA, "jokes", `${l}.jsonl`)).map((r) => Joke.parse(r))).map((j) => [j.id, j]),
);
const rows = readJsonl(join(DATA, "llm", "analyze", "results.jsonl"))
  .map((r) => JokeAnalysis.parse(r))
  .filter((a) => jokes.has(a.id));
if (!rows.length) throw new Error("no analyze results yet: run pnpm llm collect analyze");

type Item = { a: JokeAnalysis; j: Joke; w: number };
const all: Item[] = rows.map((a) => {
  const j = jokes.get(a.id)!;
  return { a, j, w: 0.5 + j.popularity }; // вес: популярность, но и хвост учитываем
});
/** Частоты и покрытие считаем только по пригодным к публикации (без exclude). */
const items = all.filter((i) => !i.a.flags.includes("exclude"));

// --- канон: сырые архетипы → роли ------------------------------------------------------
const charCanon = loadCanon("characters");
const locCanon = loadCanon("locations");
const role = (arch: string) => charCanon?.map[arch] ?? arch;
const place = (arch: string) => locCanon?.map[arch] ?? arch;
const roleGroup = new Map(charCanon?.canon.map((c) => [c.id, c.group]) ?? []);
/** Роли, которым не нужна кукла: предметы и массовка. */
const noPuppet = (r: string) => ["object", "crowd"].includes(roleGroup.get(r) ?? "");

const onScreen = (a: JokeAnalysis) => [...new Set(a.characters.filter((c) => c.role !== "mentioned").map((c) => role(c.archetype)))];
const locOf = (a: JokeAnalysis) => place(a.location.archetype);
const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "—");

function freq(list: Item[], key: (a: JokeAnalysis) => string[]) {
  const m = new Map<string, { n: number; w: number; langs: Record<string, number> }>();
  for (const { a, j, w } of list)
    for (const k of key(a)) {
      const e = m.get(k) ?? { n: 0, w: 0, langs: {} };
      e.n++;
      e.w += w;
      e.langs[j.lang] = (e.langs[j.lang] ?? 0) + 1;
      m.set(k, e);
    }
  return [...m.entries()].sort((x, y) => y[1].w - x[1].w);
}

const chars = freq(items, onScreen);
const locs = freq(items, (a) => [locOf(a)]);

/** Доля анекдотов, где все экранные персонажи из топ-N, а локация из топ-K (или none). */
function coverage(nChars: number, nLocs: number, list = items) {
  const C = new Set(chars.slice(0, nChars).map(([k]) => k));
  const L = new Set(locs.filter(([k]) => k !== "none").slice(0, nLocs).map(([k]) => k));
  const ok = list.filter(({ a }) => onScreen(a).every((c) => C.has(c) || noPuppet(c)) && (locOf(a) === "none" || L.has(locOf(a))));
  return ok.length / list.length;
}

const looks = (arch: string) =>
  [...new Set(items.flatMap(({ a }) => a.characters.filter((c) => role(c.archetype) === arch && c.looks).map((c) => c.looks)))].slice(0, 3);

// --- переводимость -----------------------------------------------------------------
const trans: Record<string, Record<string, number>> = {};
const reasons: Record<string, Record<string, number>> = {};
for (const { a, j } of items)
  for (const t of LOCALES) {
    const v = a.translatability[t];
    if (!v || t === j.lang) continue;
    const key = `${j.lang}→${t}`;
    (trans[key] ??= { translate: 0, adapt: 0, skip: 0 })[v.verdict]++;
    if (v.verdict !== "translate") (reasons[key] ??= {})[v.reason] = (reasons[key][v.reason] ?? 0) + 1;
  }

// --- отчёт ----------------------------------------------------------------------
const byLang = (l: string) => items.filter((i) => i.j.lang === l);
const langs = LOCALES.filter((l) => byLang(l).length);
const avg = (xs: number[]) => (xs.length ? (xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(2) : "—");
const out: string[] = [];
out.push(`# Каталог персонажей и локаций`, ``, `Размечено анекдотов: ${all.length}; пригодных (без exclude): ${items.length} (${langs.map((l) => `${l}: ${byLang(l).length}`).join(", ")}).`, ``);
out.push(`Исключено (exclude): ${langs.map((l) => `${l} ${all.filter((i) => i.j.lang === l && i.a.flags.includes("exclude")).length}`).join(", ")}.`, ``);

out.push(`## Общая картина`, ``, `| | ${langs.join(" | ")} |`, `|---|${langs.map(() => "---").join("|")}|`);
const forms = ["dialogue", "narrative", "qa", "one-liner"] as const;
for (const f of forms) out.push(`| ${f} | ${langs.map((l) => pct(byLang(l).filter((i) => i.a.form === f).length, byLang(l).length)).join(" | ")} |`);
out.push(`| нужен рассказчик | ${langs.map((l) => pct(byLang(l).filter((i) => i.a.needsNarrator).length, byLang(l).length)).join(" | ")} |`);
out.push(`| игра слов | ${langs.map((l) => pct(byLang(l).filter((i) => i.a.wordplay.present).length, byLang(l).length)).join(" | ")} |`);
out.push(`| смешно (ср., 1–5) | ${langs.map((l) => avg(byLang(l).map((i) => i.a.funny))).join(" | ")} |`);
out.push(`| годится для видео (ср., 1–5) | ${langs.map((l) => avg(byLang(l).map((i) => i.a.videoFit))).join(" | ")} |`);
out.push(`| videoFit ≥ 4 | ${langs.map((l) => pct(byLang(l).filter((i) => i.a.videoFit >= 4).length, byLang(l).length)).join(" | ")} |`);
for (const flag of ["ethnic", "sexual", "political", "profanity", "dark", "real-person", "religion", "drugs", "homophobia"])
  out.push(`| флаг ${flag} | ${langs.map((l) => pct(byLang(l).filter((i) => i.a.flags.includes(flag as never)).length, byLang(l).length)).join(" | ")} |`);
out.push(``);

out.push(`## Персонажи (топ-25, на экране)`, ``, `Вес = число анекдотов × (0.5 + популярность).`, ``, `| # | архетип | анекдотов | ${langs.join(" | ")} | как выглядит (из разметки) |`, `|---|---|---|${langs.map(() => "---").join("|")}|---|`);
chars.slice(0, 25).forEach(([k, e], i) => out.push(`| ${i + 1} | ${k} | ${e.n} | ${langs.map((l) => e.langs[l] ?? 0).join(" | ")} | ${looks(k).join("; ")} |`));
out.push(``, `## Локации (топ-15)`, ``, `| # | локация | анекдотов | ${langs.join(" | ")} |`, `|---|---|---|${langs.map(() => "---").join("|")}|`);
locs.slice(0, 15).forEach(([k, e], i) => out.push(`| ${i + 1} | ${k} | ${e.n} | ${langs.map((l) => e.langs[l] ?? 0).join(" | ")} |`));

out.push(``, `## Покрытие: сколько героев рисовать`, ``, `Доля анекдотов, которые целиком ставятся силами топ-N персонажей и топ-K локаций (плюс сцены без локации).`, ``, `| персонажей \\ локаций | 3 | 6 | 10 |`, `|---|---|---|---|`);
for (const n of [5, 10, 15, 20, 30]) out.push(`| ${n} | ${[3, 6, 10].map((k) => pct(Math.round(coverage(n, k) * 1000), 1000)).join(" | ")} |`);

out.push(``, `## Переводимость`, ``, `| направление | перевести | адаптировать | не переводить | главные причины |`, `|---|---|---|---|---|`);
for (const [k, v] of Object.entries(trans).sort()) {
  const total = v.translate + v.adapt + v.skip;
  const top = Object.entries(reasons[k] ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r, n]) => `${r} ${n}`).join(", ");
  out.push(`| ${k} | ${pct(v.translate, total)} | ${pct(v.adapt, total)} | ${pct(v.skip, total)} | ${top} |`);
}

// --- куклы и фоны (стадия cast) ---------------------------------------------------------
const readDir = <T,>(dir: string, schema: { parse: (x: unknown) => T }) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => schema.parse(JSON.parse(readFileSync(join(dir, f), "utf8")))) : [];
const puppets = readDir(join(ROOT, "content", "characters"), Character).filter((c) => c.bible);
const backdrops = readDir(join(ROOT, "content", "locations"), Location).filter((l) => l.bible);
if (puppets.length) {
  const playedBy = new Map<string, string>();
  for (const p of puppets) for (const r of p.bible!.roles) playedBy.set(r, p.id);
  const coveredBy = new Map<string, string>();
  for (const l of backdrops) for (const r of l.bible!.roles) coveredBy.set(r, l.id);
  /** Каждая роль сыграна куклой, и в сцене нет двух разных ролей одной куклы. */
  const castOk = (a: JokeAnalysis) => {
    const rs = onScreen(a).filter((r) => !noPuppet(r));
    if (!rs.every((r) => playedBy.has(r))) return false;
    const ps = rs.map((r) => playedBy.get(r)!);
    return new Set(ps).size === ps.length;
  };
  const clash = (a: JokeAnalysis) => {
    const ps = onScreen(a).filter((r) => playedBy.has(r)).map((r) => playedBy.get(r)!);
    return new Set(ps).size !== ps.length;
  };
  const locOk = (a: JokeAnalysis) => locOf(a) === "none" || coveredBy.has(locOf(a));
  const pct2 = (f: (a: JokeAnalysis) => boolean, list: Item[]) => pct(list.filter((i) => f(i.a)).length, list.length);
  out.push(``, `## Покрытие куклами и фонами`, ``, `${puppets.length} кукол играют ${playedBy.size} ролей; ${backdrops.length} фонов закрывают ${coveredBy.size} локаций.`, ``,
    `| | ${langs.join(" | ")} | все |`, `|---|${langs.map(() => "---").join("|")}|---|`,
    `| все персонажи есть | ${langs.map((l) => pct2(castOk, byLang(l))).join(" | ")} | ${pct2(castOk, items)} |`,
    `| конфликт: две роли одной куклы в сцене | ${langs.map((l) => pct2(clash, byLang(l))).join(" | ")} | ${pct2(clash, items)} |`,
    `| локация есть | ${langs.map((l) => pct2(locOk, byLang(l))).join(" | ")} | ${pct2(locOk, items)} |`,
    `| ставится целиком | ${langs.map((l) => pct2((a) => castOk(a) && locOk(a), byLang(l))).join(" | ")} | ${pct2((a) => castOk(a) && locOk(a), items)} |`);
  const poolAll = items.filter((i) => i.a.videoFit >= 4 && i.a.funny >= 4);
  out.push(`| пул для видео: ставится целиком | ${langs.map((l) => pct2((a) => castOk(a) && locOk(a), poolAll.filter((i) => i.j.lang === l))).join(" | ")} | ${pct2((a) => castOk(a) && locOk(a), poolAll)} |`);
  // каких ролей не хватает чаще всего
  const missing = new Map<string, number>();
  for (const { a } of items) if (locOk(a)) { const miss = onScreen(a).filter((r) => !playedBy.has(r) && !noPuppet(r)); if (miss.length === 1) missing.set(miss[0], (missing.get(miss[0]) ?? 0) + 1); }
  const pairs = new Map<string, number>();
  for (const { a } of items) {
    const rs = onScreen(a).filter((r) => playedBy.has(r));
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++)
      if (playedBy.get(rs[i]) === playedBy.get(rs[j])) { const k = [rs[i], rs[j]].sort().join("+") + ` (${playedBy.get(rs[i])})`; pairs.set(k, (pairs.get(k) ?? 0) + 1); }
  }
  out.push(``, `Частые конфликты: ${[...pairs.entries()].sort((x, y) => y[1] - x[1]).slice(0, 12).map(([k, n]) => `${k} ${n}`).join(", ")}.`);
  out.push(``, `Чаще всего не хватает одной роли: ${[...missing.entries()].sort((x, y) => y[1] - x[1]).slice(0, 15).map(([r, n]) => `${r} (${n})`).join(", ")}.`);
}

// --- фольклорные герои -------------------------------------------------------------
const FOLK = ["vovochka", "rabinovich", "stirlitz", "chukchi", "petka", "vasily-ivanovich", "new-russian", "rzhevsky", "ded-moroz",
  "blonde", "mother-in-law", "fritzchen", "ostfriese", "god", "devil", "saint-peter", "death", "goldfish", "genie", "bear", "dog", "cat", "parrot"];
out.push(``, `## Фольклорные и «сказочные» герои`, ``, `| герой | ${langs.join(" | ")} |`, `|---|${langs.map(() => "---").join("|")}|`);
for (const f of FOLK) {
  const n = langs.map((l) => byLang(l).filter((i) => onScreen(i.a).includes(f)).length);
  if (n.some((x) => x > 0)) out.push(`| ${f} | ${n.join(" | ")} |`);
}

// --- пул для видео ---------------------------------------------------------------------
const RISKY = new Set(["sexual", "ethnic", "political", "real-person", "homophobia", "drugs"]);
const pool = items.filter((i) => i.a.videoFit >= 4 && i.a.funny >= 4);
const safe = pool.filter((i) => !i.a.flags.some((f) => RISKY.has(f)));
out.push(``, `## Пул для первых роликов`, ``, `videoFit ≥ 4 и funny ≥ 4; «безопасные» — без флагов ${[...RISKY].join(", ")}.`, ``,
  `| | ${langs.join(" | ")} |`, `|---|${langs.map(() => "---").join("|")}|`,
  `| сильные для видео | ${langs.map((l) => pool.filter((i) => i.j.lang === l).length).join(" | ")} |`,
  `| из них безопасные | ${langs.map((l) => safe.filter((i) => i.j.lang === l).length).join(" | ")} |`);
for (const l of langs)
  for (const t of LOCALES.filter((x) => x !== l)) {
    const s = safe.filter((i) => i.j.lang === l);
    const n = s.filter((i) => ["translate", "adapt"].includes(i.a.translatability[t]?.verdict ?? "")).length;
    out.push(`| безопасные ${l}→${t} переводимы | ${langs.map((x) => (x === l ? `${n}/${s.length}` : "")).join(" | ")} |`);
  }

mkdirSync(join(DATA, "catalog"), { recursive: true });
writeFileSync(join(DATA, "catalog", "stats.json"), JSON.stringify({ characters: chars, locations: locs, translatability: trans }, null, 2) + "\n");
writeFileSync(join(ROOT, "docs", "catalog-report.md"), out.join("\n") + "\n");
console.log(out.join("\n"));
