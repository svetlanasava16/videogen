/**
 * Сериал (ROADMAP §9): готовые анекдоты без изменений + связки, которые пишет LLM.
 *   pnpm series pick --locale ru [--n 4] [--count 3] [--voiced]   — подбор анекдотов кодом (без LLM), просмотр
 *   pnpm llm prepare series --lang ru [--per-lang 2] [--voiced]   — те же наборы → data/llm/series/batch-*.in.jsonl
 *   pnpm llm materialize series                                    — content/series/<id>.json, связки content/episodes/<id>.bN.json,
 *                                                                    сборник content/compilations/<id>.json (рендер и озвучка)
 *   pnpm series check                                              — серии согласованы с эпизодами, каноном и журналом
 *   pnpm series accept <id>                                        — изменения мира серии → content/world/state.json
 *
 * Подбор: анекдоты языка (озвученные — с --voiced), без флагов публикации и ещё не в сериях; в наборе у каждой куклы
 * один житель канона, у анекдотов разные места, каждый следующий делит с набором хотя бы одного жителя.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { CompilationSpec, Episode, JokeAnalysis, Series, SeriesDraft, activeFacts, castConflicts, residentFor, type Locale, type ScriptDraft } from "@jf/core";
import { DATA, ROOT, readJsonl } from "./util.js";
import { episodeBlocked } from "./risk.js";
import { loadWorld } from "./world.js";
import { draftProblems, draftToEpisode } from "./drafts.js";

const EP_DIR = join(ROOT, "content", "episodes");
const SERIES_DIR = join(ROOT, "content", "series");
const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const loadEpisode = (id: string) => Episode.parse(readJson(join(EP_DIR, `${id}.json`)));
export const loadSeries = (): Series[] =>
  existsSync(SERIES_DIR) ? readdirSync(SERIES_DIR).filter((f) => f.endsWith(".json")).sort().map((f) => Series.parse(readJson(join(SERIES_DIR, f)))) : [];

type Cand = { ep: Episode; pop: number; map: Map<string, string>; residents: Set<string>; where: string };

/** Кандидаты в серии: эпизоды-анекдоты языка с жителями канона, без конфликтов состава. */
function candidates(locale: Locale, voiced: boolean, W = loadWorld()): Cand[] {
  const used = new Set(loadSeries().flatMap((s) => s.parts.map((p) => p.episode)));
  const pop = new Map<string, number>();
  for (const j of readJsonl<{ id: string; popularity?: number }>(join(DATA, "jokes", `${locale}.jsonl`))) pop.set(j.id, j.popularity ?? 0);
  const out: Cand[] = [];
  for (const f of readdirSync(EP_DIR).filter((f) => f.endsWith(`.${locale}.json`) && !/^(demo|test|custom)-/.test(f))) {
    const ep = Episode.parse(readJson(join(EP_DIR, f)));
    if (ep.kind !== "joke" || used.has(ep.id) || episodeBlocked(ep)) continue;
    if (voiced && !ep.lines.every((l) => l.audio)) continue;
    const links = ep.cast.map((p) => residentFor(W.canon, p, ep.roles[p]));
    if (links.some((l) => !l.resident) || castConflicts(W.canon, links).length) continue;
    const s0 = ep.scenes?.[0];
    out.push({
      ep, pop: pop.get(ep.jokeId) ?? 0,
      map: new Map(links.map((l) => [l.puppet, l.resident!])),
      residents: new Set(links.map((l) => l.resident!)),
      where: `${s0?.location ?? ep.location}:${s0?.place ?? ""}`,
    });
  }
  return out.sort((a, b) => b.pop - a.pop || a.ep.id.localeCompare(b.ep.id));
}

/** Наборы анекдотов для серий (детерминированно, жадно от самых популярных). */
export function pickSets(locale: Locale, o: { n?: number; count?: number; voiced?: boolean } = {}): Cand[][] {
  const n = o.n ?? 4, all = candidates(locale, !!o.voiced);
  const taken = new Set<string>(), sets: Cand[][] = [];
  for (const seed of all) {
    if (sets.length >= (o.count ?? Infinity)) break;
    if (taken.has(seed.ep.id)) continue;
    const set = [seed];
    const map = new Map(seed.map);
    const fits = (c: Cand) => {
      if (taken.has(c.ep.id) || set.includes(c) || set.some((x) => x.where === c.where)) return false;
      if (![...c.residents].some((r) => set.some((x) => x.residents.has(r)))) return false;
      // одна кукла — один житель во всей серии (и один житель — одна кукла)
      for (const [p, r] of c.map) {
        if (map.has(p) && map.get(p) !== r) return false;
        for (const [p2, r2] of map) if (r2 === r && p2 !== p) return false;
      }
      return true;
    };
    for (const c of all) {
      if (set.length >= n) break;
      if (fits(c)) { set.push(c); for (const [p, r] of c.map) map.set(p, r); }
    }
    if (set.length < Math.min(3, n)) continue;
    for (const c of set) taken.add(c.ep.id);
    sets.push(set);
  }
  return sets;
}

const seriesId = (locale: string, eps: string[]) => `${locale}-s${createHash("sha1").update(eps.join(",")).digest("hex").slice(0, 8)}`;

/** Вход стадии series: анекдоты набора (место, кто кем, первая и последняя реплика, суть), выжимка канона, факты. */
export function seriesInputs({ perLang, lang, voiced }: { perLang?: number; lang?: string; voiced?: boolean }) {
  const W = loadWorld();
  const gist = new Map(readJsonl(join(DATA, "llm", "analyze", "results.jsonl")).map((r) => { const a = JokeAnalysis.parse(r); return [a.id, a.gist ?? ""]; }));
  const name = (id: string, l: Locale) => W.canon.residents.find((r) => r.id === id)?.name[l] ?? id;
  const items: Record<string, unknown>[] = [];
  for (const locale of (["ru", "en", "de"] as Locale[]).filter((l) => !lang || l === lang)) {
    for (const set of pickSets(locale, { count: perLang, voiced })) {
      const eps = set.map((c) => c.ep.id);
      const map = new Map(set.flatMap((c) => [...c.map]));
      const residents = [...new Set(map.values())];
      const ids = new Set(residents);
      const rel = W.canon.relations.filter((r) => ids.has(r.a) || ids.has(r.b));
      const near = new Set([...residents, ...rel.flatMap((r) => [r.a, r.b])]);
      items.push({
        id: seriesId(locale, eps), locale, district: `quarter-${locale}`,
        jokes: set.map((c, i) => ({
          index: i, episode: c.ep.id, title: c.ep.title,
          scenes: (c.ep.scenes ?? []).map((s) => (s.place ? `${s.location}:${s.place}` : s.location)),
          cast: c.ep.cast.map((p) => ({ puppet: p, role: c.ep.roles[p] ?? null, resident: c.map.get(p), name: name(c.map.get(p)!, locale) })),
          gist: gist.get(c.ep.jokeId) ?? "",
          firstLine: { who: c.ep.lines[0].character, text: c.ep.lines[0].text },
          lastLine: { who: c.ep.lines.at(-1)!.character, text: c.ep.lines.at(-1)!.text },
        })),
        // житель → кукла (в связках эти жители играются только этими куклами)
        cast: Object.fromEntries([...map].map(([p, r]) => [r, p])),
        canon: {
          residents: W.canon.residents.filter((r) => near.has(r.id)).map((r) => ({ id: r.id, puppet: r.puppet, name: r.name[locale], district: r.district === "home" ? `quarter-${locale}` : r.district, home: r.home, work: r.work, traits: r.traits, gags: r.gags })),
          relations: rel,
          landmarks: W.canon.landmarks.map((l) => ({ id: l.id, name: l.name[locale], location: l.location, place: l.place, owner: l.owner })),
        },
        facts: activeFacts(W.state).filter((f) => !f.actors.length || f.actors.some((a) => near.has(a))).map((f) => ({ id: f.id, fact: f.fact, text: f.text[locale] ?? f.text.en ?? "", actors: f.actors, place: f.place })),
      });
    }
  }
  return items;
}

/** Связка → сценарий (для общих проверок и сборки эпизода). */
const bridgeScript = (d: SeriesDraft, i: number): ScriptDraft => {
  const b = d.bridges[i];
  return { id: `${d.id}.b${i + 1}`, jokeId: `series:${d.id}`, locale: d.locale, adaptation: "original", notes: "", title: b.title, location: b.location, cast: b.cast, roles: b.roles, looks: b.looks, crowd: b.crowd, set: b.set, lines: b.lines, scenes: b.scenes };
};

/** Проверка ответа стадии series поверх схемы. */
export function seriesProblems(d: SeriesDraft, input: { id: string; locale: string; jokes: { episode: string }[]; cast: Record<string, string> }): string[] {
  const W = loadWorld();
  const pr: string[] = [];
  if (d.id !== input.id || d.locale !== input.locale) pr.push("id/locale do not match input");
  const n = input.jokes.length;
  const byPuppet = new Map(Object.entries(input.cast).map(([r, p]) => [p, r]));
  const residents = new Set(W.canon.residents.map((r) => r.id));
  const inSeries = new Set(Object.keys(input.cast));
  if (!d.bridges.some((b) => b.before === 0)) pr.push("no opening bridge (before: 0) — the series needs a setup");
  if (!d.bridges.some((b) => b.before === n)) pr.push(`no closing bridge (before: ${n}) — the series needs an ending`);
  d.bridges.forEach((b, i) => {
    const tag = `bridge ${i + 1}: `;
    if (b.before > n) pr.push(`${tag}before ${b.before} > number of jokes ${n}`);
    if (i && b.before < d.bridges[i - 1].before) pr.push(`${tag}bridges must be in order of "before"`);
    for (const p of [...b.cast, ...(b.scenes ?? []).flatMap((s) => s.cast)]) {
      if (byPuppet.has(p)) continue;
      // новая кукла: житель по умолчанию, который ещё не играется другой куклой
      const r = residentFor(W.canon, p, b.roles[p]).resident;
      if (!r) pr.push(`${tag}puppet ${p} has no resident in canon`);
      else if (inSeries.has(r)) pr.push(`${tag}puppet ${p} would play ${r}, who is ${input.cast[r]} in this series`);
    }
    pr.push(...draftProblems(bridgeScript(d, i)).map((x) => tag + x));
  });
  const facts = new Set(activeFacts(W.state).map((f) => f.id));
  for (const c of d.stateChanges) {
    for (const a of c.actors) if (!residents.has(a)) pr.push(`stateChanges: unknown resident "${a}"`);
    if (c.undoes && !facts.has(c.undoes)) pr.push(`stateChanges: undoes "${c.undoes}", which is not an active fact`);
  }
  return pr;
}

/** Ответы стадии → серии, связки и сборники. Связки пересобираются, озвучка неизменённых реплик сохраняется. */
export function materializeSeries(rows: SeriesDraft[], inputs: Map<string, { jokes: { episode: string }[]; cast: Record<string, string>; district: string }>) {
  mkdirSync(SERIES_DIR, { recursive: true });
  let chars = 0;
  for (const d of rows) {
    const inp = inputs.get(d.id);
    if (!inp) { console.warn(`${d.id}: no input, skipped`); continue; }
    const file = join(SERIES_DIR, `${d.id}.json`);
    const old = existsSync(file) ? Series.parse(readJson(file)) : undefined;
    const bridgeIds = d.bridges.map((_, i) => `${d.id}.b${i + 1}`);
    d.bridges.forEach((_, i) => {
      const f = join(EP_DIR, `${bridgeIds[i]}.json`);
      const prev = existsSync(f) ? Episode.parse(readJson(f)) : undefined;
      const ep = draftToEpisode(bridgeScript(d, i), { prev, kind: "bridge" });
      chars += ep.lines.filter((l) => !l.audio).reduce((s, l) => s + l.text.length, 0);
      writeFileSync(f, JSON.stringify(ep, null, 2) + "\n");
    });
    const parts: Series["parts"] = [];
    for (let k = 0; k <= inp.jokes.length; k++) {
      d.bridges.forEach((b, i) => { if (b.before === k) parts.push({ kind: "bridge", episode: bridgeIds[i] }); });
      if (k < inp.jokes.length) parts.push({ kind: "joke", episode: inp.jokes[k].episode });
    }
    const series = Series.parse({ id: d.id, locale: d.locale, title: d.title, district: inp.district, arc: d.arc, parts, cast: inp.cast, stateChanges: d.stateChanges, accepted: old?.accepted ?? false });
    writeFileSync(file, JSON.stringify(series, null, 2) + "\n");
    const comp = CompilationSpec.parse({ id: d.id, locale: d.locale, title: d.title, episodes: parts.map((p) => p.episode), transition: "flyover" });
    writeFileSync(join(ROOT, "content", "compilations", `${d.id}.json`), JSON.stringify(comp, null, 2) + "\n");
  }
  console.log(`${rows.length} series → content/series/, bridges → content/episodes/*.bN.json, compilations → content/compilations/; ${chars} characters of bridge lines to voice`);
}

/** Согласованность серий: части существуют и нужного вида, сборник совпадает, жители и куклы, принятые факты в журнале. */
export function checkSeries(): { id: string; level: "error" | "warn"; kind: string; msg: string }[] {
  const out: ReturnType<typeof checkSeries> = [];
  const W = loadWorld();
  const residents = new Map(W.canon.residents.map((r) => [r.id, r]));
  const used = new Map<string, string>();
  for (const s of loadSeries()) {
    const id = `series:${s.id}`;
    const err = (kind: string, msg: string) => out.push({ id, level: "error", kind, msg });
    for (const p of s.parts) {
      if (!existsSync(join(EP_DIR, `${p.episode}.json`))) { err("part", `missing episode ${p.episode}`); continue; }
      const ep = loadEpisode(p.episode);
      if (ep.kind !== p.kind) err("part", `${p.episode} is kind ${ep.kind}, part says ${p.kind}`);
      if (ep.locale !== s.locale) err("part", `${p.episode} is ${ep.locale}`);
      if (p.kind === "joke") { if (used.has(p.episode)) err("part", `${p.episode} is already in ${used.get(p.episode)}`); used.set(p.episode, s.id); }
    }
    for (const [r, p] of Object.entries(s.cast)) if (!residents.has(r)) err("cast", `unknown resident ${r}`); else if (residents.get(r)!.puppet !== p) err("cast", `${r} is puppet ${residents.get(r)!.puppet}, not ${p}`);
    const comp = join(ROOT, "content", "compilations", `${s.id}.json`);
    if (!existsSync(comp)) err("compilation", "missing content/compilations/<id>.json");
    else if (CompilationSpec.parse(readJson(comp)).episodes.join(",") !== s.parts.map((p) => p.episode).join(",")) err("compilation", "compilation episodes differ from series parts (re-run pnpm llm materialize series)");
    if (s.accepted) s.stateChanges.forEach((_, i) => { if (!W.state.facts.some((f) => f.id === `${s.id}.f${i + 1}`)) err("state", `accepted, but fact ${s.id}.f${i + 1} is not in state.json`); });
  }
  return out;
}

/** Принять серию: её изменения мира → журнал (id <серия>.fN), серия помечается accepted. */
function accept(id: string) {
  const file = join(SERIES_DIR, `${id}.json`);
  const s = Series.parse(readJson(file));
  if (s.accepted) return console.log(`${id}: already accepted`);
  const statePath = join(ROOT, "content", "world", "state.json");
  const state = readJson(statePath) as { v: 1; facts: unknown[] };
  s.stateChanges.forEach((c, i) => state.facts.push({ id: `${id}.f${i + 1}`, ...c, series: id }));
  writeFileSync(statePath, JSON.stringify(state, null, 1) + "\n");
  writeFileSync(file, JSON.stringify({ ...s, accepted: true }, null, 2) + "\n");
  console.log(`${id}: ${s.stateChanges.length} facts → content/world/state.json (check: pnpm world check)`);
}

function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { locale: { type: "string" }, n: { type: "string" }, count: { type: "string" }, voiced: { type: "boolean" } } });
  const [cmd, arg] = positionals;
  if (cmd === "pick") {
    const locale = (values.locale ?? "ru") as Locale;
    const W = loadWorld();
    const sets = pickSets(locale, { n: values.n ? Number(values.n) : 4, count: values.count ? Number(values.count) : 5, voiced: values.voiced });
    for (const set of sets) {
      const eps = set.map((c) => c.ep.id);
      console.log(`${seriesId(locale, eps)}`);
      for (const c of set) console.log(`  ${c.ep.id.padEnd(24)} ${c.where.padEnd(24)} ${[...c.residents].map((r) => W.canon.residents.find((x) => x.id === r)!.name[locale]).join(", ").padEnd(40)} ${c.ep.title}`);
    }
    console.log(`${sets.length} sets (${candidates(locale, !!values.voiced).length} candidate jokes)`);
  } else if (cmd === "check") {
    const issues = checkSeries();
    for (const i of issues) console.log(`${i.level} ${i.id}: ${i.msg}`);
    console.log(`${loadSeries().length} series, ${issues.length} problems`);
    if (issues.some((i) => i.level === "error")) process.exitCode = 1;
  } else if (cmd === "accept" && arg) accept(arg);
  else { console.error("usage: pnpm series pick --locale ru [--n 4] [--count 5] [--voiced] | check | accept <id>"); process.exitCode = 1; }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
