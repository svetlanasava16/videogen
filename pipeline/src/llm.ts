/**
 * LLM-стадии через пачки файлов. Исполнитель любой: Claude Code в сессии сейчас,
 * сервер с локальной моделью (OpenAI-совместимый API) потом. Промпт стадии один: pipeline/prompts/<stage>.md
 *
 *   pnpm llm prepare analyze [--per-lang 100] [--size 50]   → data/llm/analyze/batch-NNNN.in.jsonl
 *   (исполнитель пишет batch-NNNN.out.jsonl: по одной JSON-строке на каждую входную)
 *   pnpm llm collect analyze                                 → проверка zod, слияние в results.jsonl
 *   pnpm llm status analyze
 *   pnpm llm prepare script [--per-lang 20] && … && pnpm llm collect script && pnpm llm materialize script
 */
import { Episode, JokeAnalysis, Joke, Locale, NARRATOR, ScriptDraft, stagingProblems } from "@jf/core";
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { loadCast } from "./cast.js";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { z, type ZodType } from "zod";
import { DATA, ROOT, readJsonl, writeJsonl } from "./util.js";

type Stage = {
  prompt: string;
  output: ZodType<{ id: string }, any, any>;
  /** Все кандидаты стадии по порядку приоритета. */
  inputs: (opts: { perLang?: number; lang?: string }) => { id: string; [k: string]: unknown }[];
  /** Доп. проверки строки ответа поверх схемы (input — соответствующая входная строка). */
  validate?: (row: any, input: any) => string[];
  /** Вызывается перед prepare: например, записать справочник для исполнителя. */
  beforePrepare?: () => void;
};

const MAX_WORDS: Record<string, number> = { ru: 95, en: 110, de: 90 };
const RISKY = ["sexual", "ethnic", "political", "real-person", "homophobia", "drugs", "exclude"];

const LOCALES = Locale.options;

function loadJokes(): Joke[] {
  return LOCALES.flatMap((l) => readJsonl(join(DATA, "jokes", `${l}.jsonl`)).map((r) => Joke.parse(r)));
}

const STAGES: Record<string, Stage> = {
  analyze: {
    prompt: "pipeline/prompts/analyze.md",
    output: JokeAnalysis,
    inputs: ({ perLang, lang: only }) => {
      const done = doneIds("analyze");
      return LOCALES.filter((l) => !only || l === only).flatMap((lang) =>
        loadJokes()
          .filter((j) => j.lang === lang && !done.has(j.id))
          .slice(0, perLang ?? Infinity)
          .map((j) => ({ id: j.id, lang: j.lang, kind: j.kind, text: j.text, targets: LOCALES.filter((l) => l !== j.lang) })),
      );
    },
  },

  /** Риск публикации: религия (ст. 148 УК РФ). Только анекдоты, по которым есть эпизоды. */
  risk: {
    prompt: "pipeline/prompts/risk.md",
    output: z.object({
      id: z.string(),
      religion: z.enum(["none", "setting", "mocking"]),
      target: z.string().default(""),
      note: z.string().default(""),
    }),
    inputs: ({ perLang, lang: only }) => {
      const done = doneIds("risk");
      const withEpisodes = new Set(
        readdirSync(join(ROOT, "content", "episodes")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.(ru|en|de)\.json$/, "")),
      );
      const analysis = new Map(readJsonl<JokeAnalysis>(resultsPath("analyze")).map((a) => [a.id, a]));
      return LOCALES.filter((l) => !only || l === only).flatMap((lang) =>
        loadJokes()
          .filter((j) => j.lang === lang && withEpisodes.has(j.id) && !done.has(j.id))
          .slice(0, perLang ?? Infinity)
          .map((j) => {
            const a = analysis.get(j.id);
            return { id: j.id, lang: j.lang, text: j.text, gist: a?.gist ?? "", characters: a?.characters.map((c) => c.archetype) ?? [] };
          }),
      );
    },
  },

  script: {
    prompt: "pipeline/prompts/script.md",
    output: ScriptDraft,
    beforePrepare: writeScriptContext,
    inputs: ({ perLang, lang: only }) => {
      const done = doneIds("script");
      const jokes = new Map(loadJokes().map((j) => [j.id, j]));
      const C = loadCast();
      const analyses = readJsonl(join(DATA, "llm", "analyze", "results.jsonl")).map((r) => JokeAnalysis.parse(r));
      const items: { id: string; [k: string]: unknown }[] = [];
      for (const lang of LOCALES.filter((l) => !only || l === only)) {
        const pool = analyses
          .filter((a) => jokes.get(a.id)?.lang === lang && a.videoFit >= 4 && a.funny >= 4 && !a.flags.some((f) => RISKY.includes(f)))
          .map((a) => {
            const roles = [...new Set(a.characters.filter((c) => c.role !== "mentioned").map((c) => C.role(c.archetype)))];
            const scene = C.castScene(roles);
            const loc = C.place(a.location.archetype);
            const backdrop = loc === "none" ? "none" : C.backdropFor.get(loc);
            return { a, j: jokes.get(a.id)!, roles, scene, loc, backdrop };
          })
          .filter((x) => x.scene.ok && x.backdrop && Object.keys(x.scene.cast).length <= 3)
          .sort((x, y) => y.j.popularity * y.a.funny - x.j.popularity * x.a.funny)
          .slice(0, perLang ?? Infinity);
        for (const x of pool) {
          const targets = [lang, ...LOCALES.filter((l) => l !== lang && ["translate", "adapt"].includes(x.a.translatability[l]?.verdict ?? ""))];
          for (const locale of targets) {
            const id = `${x.j.id}.${locale}`;
            if (done.has(id)) continue;
            items.push({
              id, jokeId: x.j.id, sourceLang: lang, locale,
              mode: locale === lang ? "original" : x.a.translatability[locale]!.verdict,
              adaptNote: locale === lang ? "" : x.a.translatability[locale]!.note,
              text: x.j.text, gist: x.a.gist ?? "", form: x.a.form, needsNarrator: x.a.needsNarrator,
              wordplay: x.a.wordplay,
              suggestedCast: x.scene.cast, // canonical role → puppet id
              suggestedBackdrop: x.backdrop, location: x.loc,
              maxWords: MAX_WORDS[locale],
            });
          }
        }
      }
      return items;
    },
    validate: (row: ScriptDraft, input: Record<string, unknown>) => {
      const C = loadCast();
      const ids = new Set(C.puppets.map((p) => p.id));
      const bds = new Set(["none", ...C.backdrops.map((b) => b.id)]);
      const pr: string[] = [];
      if (row.jokeId !== input.jokeId || row.locale !== input.locale) pr.push("jokeId/locale do not match input");
      if (!bds.has(row.location)) pr.push(`unknown backdrop ${row.location}`);
      for (const c of row.cast) if (!ids.has(c)) pr.push(`unknown puppet ${c}`);
      if (new Set(row.cast).size !== row.cast.length) pr.push("duplicate puppet in cast");
      for (const l of row.lines) {
        if (l.character !== NARRATOR && !row.cast.includes(l.character)) pr.push(`line by ${l.character} not in cast`);
        if (/[()\[\]*#]|^\s*[\p{L}]+\s*:/u.test(l.text)) pr.push(`stage direction or label: "${l.text.slice(0, 40)}"`);
      }
      for (const [p, r] of Object.entries(row.roles)) if (!row.cast.includes(p)) pr.push(`roles: ${p} not in cast (${r})`);
      pr.push(...stagingProblems(row.cast, row.lines));
      const words = row.lines.reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0);
      if (words > Number(input.maxWords ?? 110) * 1.15) pr.push(`too long: ${words} words`);
      return pr;
    },
  },
};

/** Справочник кукол и фонов для сценариста: data/llm/script/context.md */
function writeScriptContext() {
  const C = loadCast();
  const lines = ["# Cast and backdrops (generated by `pnpm llm prepare script`)", "", "## Puppets", "",
    "| id | names ru / en / de | family | roles it plays |", "|---|---|---|---|",
    ...C.puppets.map((p) => `| ${p.id} | ${p.name.ru} / ${p.name.en} / ${p.name.de} | ${p.family ?? p.id} | ${p.bible!.roles.join(", ")} |`),
    "", "## Backdrops", "", "| id | covers locations |", "|---|---|",
    ...C.backdrops.map((b) => `| ${b.id} | ${b.bible!.roles.join(", ")} |`), "| none | no location (narrator over a neutral backdrop) |", ""];
  mkdirSync(join(DATA, "llm", "script"), { recursive: true });
  writeFileSync(join(DATA, "llm", "script", "context.md"), lines.join("\n"));
}

/** Готовые сценарии → content/episodes/<jokeId>.<locale>.json */
function materialize() {
  const rows = readJsonl(resultsPath("script")).map((r) => ScriptDraft.parse(r));
  // каноническая локация из входа стадии → вариант фона
  const places = new Map<string, string>();
  for (const b of batches("script"))
    for (const r of readJsonl<{ id: string; location?: string }>(join(stageDir("script"), b))) if (r.location && r.location !== "none") places.set(r.id, r.location);
  const dir = join(ROOT, "content", "episodes");
  mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const d of rows) {
    if (d.adaptation === "unfit") continue;
    // озвучку уже существующего эпизода сохраняем для реплик, чей текст и говорящий не изменились
    const file = join(dir, `${d.id}.json`);
    const prev = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Episode) : undefined;
    const voiced = (i: number, character: string, text: string) => {
      const p = prev?.lines[i];
      return p?.audio && p.character === character && p.text === text ? p.audio : undefined;
    };
    const ep = Episode.parse({
      id: d.id, jokeId: d.jokeId, locale: d.locale, title: d.title,
      location: d.location === "none" ? "gostinaya" : d.location,
      place: places.get(d.id),
      cast: d.cast, roles: d.roles,
      lines: d.lines.map((l, i) => ({
        id: `l${i + 1}`, character: l.character, text: l.text.trim(), emotion: l.emotion, enter: l.enter, exit: l.exit, laugh: l.laugh,
        audio: voiced(i, l.character, l.text.trim()),
        pauseAfterSec: i === d.lines.length - 1 ? 0.8 : Math.min(1.2, Math.max(0.1, l.pauseAfterSec)),
      })),
    });
    writeFileSync(file, JSON.stringify(ep, null, 2) + "\n");
    n++;
  }
  console.log(`${n} episodes → content/episodes/ (${rows.length - n} unfit skipped)`);
}

const stageDir = (s: string) => join(DATA, "llm", s);
const resultsPath = (s: string) => join(stageDir(s), "results.jsonl");
const batches = (s: string) =>
  existsSync(stageDir(s)) ? readdirSync(stageDir(s)).filter((f) => /^batch-\d+\.in\.jsonl$/.test(f)).sort() : [];
const outOf = (s: string, inFile: string) => join(stageDir(s), inFile.replace(".in.", ".out."));

function doneIds(s: string) {
  return new Set(readJsonl<{ id: string }>(resultsPath(s)).map((r) => r.id));
}

/** id, которые уже лежат в пачках без результата. */
function pendingIds(s: string) {
  const done = doneIds(s);
  const ids = new Set<string>();
  for (const b of batches(s)) {
    if (existsSync(outOf(s, b))) continue;
    for (const r of readJsonl<{ id: string }>(join(stageDir(s), b))) if (!done.has(r.id)) ids.add(r.id);
  }
  return ids;
}

function prepare(s: string, stage: Stage, perLang?: number, size = 50, lang?: string) {
  stage.beforePrepare?.();
  const pending = pendingIds(s);
  const items = stage.inputs({ perLang, lang }).filter((i) => !pending.has(i.id));
  let n = batches(s).length;
  const created: string[] = [];
  for (let i = 0; i < items.length; i += size) {
    const name = `batch-${String(++n).padStart(4, "0")}.in.jsonl`;
    writeJsonl(join(stageDir(s), name), items.slice(i, i + size));
    created.push(name);
  }
  console.log(`${items.length} items → ${created.length} new batches in data/llm/${s}/ (prompt: ${stage.prompt})`);
  for (const c of created) console.log(`  ${c}`);
}

function collect(s: string, stage: Stage) {
  const results = new Map(readJsonl<{ id: string }>(resultsPath(s)).map((r) => [r.id, r]));
  let ok = 0;
  const problems: string[] = [];
  for (const b of batches(s)) {
    const out = outOf(s, b);
    if (!existsSync(out)) continue;
    const inputs = new Map(readJsonl<{ id: string }>(join(stageDir(s), b)).map((r) => [r.id, r]));
    const want = new Set(inputs.keys());
    let rows: unknown[];
    try {
      rows = readJsonl(out);
    } catch (e) {
      problems.push(`${b}: ${(e as Error).message}`);
      continue;
    }
    for (const row of rows) {
      const parsed = stage.output.safeParse(row);
      const id = (row as { id?: string })?.id ?? "?";
      if (!parsed.success) {
        problems.push(`${b} ${id}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        continue;
      }
      if (!want.has(parsed.data.id)) {
        problems.push(`${b} ${id}: id not in batch input`);
        continue;
      }
      const extra = stage.validate?.(parsed.data, inputs.get(parsed.data.id)) ?? [];
      if (extra.length) {
        problems.push(`${b} ${id}: ${extra.join("; ")}`);
        continue;
      }
      want.delete(parsed.data.id);
      results.set(parsed.data.id, parsed.data);
      ok++;
    }
    for (const missing of want) if (!results.has(missing)) problems.push(`${b} ${missing}: missing in output`);
  }
  writeJsonl(resultsPath(s), [...results.values()]);
  console.log(`${ok} valid rows merged; results.jsonl has ${results.size}`);
  if (problems.length) {
    console.log(`\n${problems.length} problems (fix the .out.jsonl or re-run those ids):`);
    for (const p of problems.slice(0, 50)) console.log(`  ${p}`);
    process.exitCode = 1;
  }
}

/** Проверка одной пачки без записи results.jsonl (безопасно запускать параллельно). */
function check(s: string, stage: Stage, batch: string) {
  const inFile = batch.endsWith(".in.jsonl") ? batch : `${batch}.in.jsonl`;
  const inRows = readJsonl<{ id: string }>(join(stageDir(s), inFile));
  const want = inRows.map((r) => r.id);
  const out = outOf(s, inFile);
  if (!existsSync(out)) throw new Error(`no output: ${out}`);
  const rows = readJsonl<{ id?: string }>(out);
  const problems: string[] = [];
  if (rows.length !== want.length) problems.push(`line count ${rows.length}, expected ${want.length}`);
  rows.forEach((row, i) => {
    const parsed = stage.output.safeParse(row);
    if (!parsed.success) problems.push(`line ${i + 1} ${row?.id ?? "?"}: ${parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
    else if (parsed.data.id !== want[i]) problems.push(`line ${i + 1}: id ${parsed.data.id}, expected ${want[i]}`);
    else for (const e of stage.validate?.(parsed.data, inRows[i]) ?? []) problems.push(`line ${i + 1} ${want[i]}: ${e}`);
  });
  if (problems.length) {
    console.log(`${inFile}: ${problems.length} problems`);
    for (const p of problems) console.log(`  ${p}`);
    process.exitCode = 1;
  } else console.log(`${inFile}: OK (${rows.length} rows)`);
}

function status(s: string) {
  const all = batches(s);
  const withOut = all.filter((b) => existsSync(outOf(s, b)));
  console.log(`${s}: ${all.length} batches, ${withOut.length} with output, ${doneIds(s).size} results, ${pendingIds(s).size} pending ids`);
  for (const b of all.filter((b) => !withOut.includes(b))) console.log(`  todo ${b}`);
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { "per-lang": { type: "string" }, size: { type: "string" }, lang: { type: "string" }, batch: { type: "string" } },
});
const [cmd, s] = positionals;
const stage = s ? STAGES[s] : undefined;
if (!stage || !["prepare", "collect", "status", "check", "materialize"].includes(cmd)) {
  console.error(`usage: llm prepare|collect|status|check|materialize <${Object.keys(STAGES).join("|")}> [--per-lang N] [--lang ru|en|de] [--size 50]`);
  process.exit(2);
}
if (!existsSync(join(ROOT, stage.prompt))) throw new Error(`prompt missing: ${stage.prompt}`);
if (cmd === "prepare") prepare(s, stage, values["per-lang"] ? Number(values["per-lang"]) : undefined, values.size ? Number(values.size) : 50, values.lang);
if (cmd === "collect") collect(s, stage);
if (cmd === "status") status(s);
if (cmd === "materialize") {
  if (s !== "script") throw new Error("materialize is only for the script stage");
  materialize();
}
if (cmd === "check") {
  if (!values.batch) throw new Error("check needs --batch batch-NNNN");
  // `--batch 7` и `--batch batch-0007` равнозначны
  check(s, stage, /^\d+$/.test(values.batch) ? `batch-${values.batch.padStart(4, "0")}` : values.batch);
}
