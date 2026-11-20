/**
 * LLM-стадии через пачки файлов. Исполнитель любой: Claude Code в сессии сейчас,
 * сервер с локальной моделью (OpenAI-совместимый API) потом. Промпт стадии один: pipeline/prompts/<stage>.md
 *
 *   pnpm llm prepare analyze [--per-lang 100] [--size 50]   → data/llm/analyze/batch-NNNN.in.jsonl
 *   (исполнитель пишет batch-NNNN.out.jsonl: по одной JSON-строке на каждую входную)
 *   pnpm llm collect analyze                                 → проверка zod, слияние в results.jsonl
 *   pnpm llm status analyze
 */
import { JokeAnalysis, Joke, Locale } from "@jf/core";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { ZodType } from "zod";
import { DATA, ROOT, readJsonl, writeJsonl } from "./util.js";

type Stage = {
  prompt: string;
  output: ZodType<{ id: string }, any, any>;
  /** Все кандидаты стадии по порядку приоритета. */
  inputs: (opts: { perLang?: number; lang?: string }) => { id: string; [k: string]: unknown }[];
};

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
};

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
    const want = new Set(readJsonl<{ id: string }>(join(stageDir(s), b)).map((r) => r.id));
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
  const want = readJsonl<{ id: string }>(join(stageDir(s), inFile)).map((r) => r.id);
  const out = outOf(s, inFile);
  if (!existsSync(out)) throw new Error(`no output: ${out}`);
  const rows = readJsonl<{ id?: string }>(out);
  const problems: string[] = [];
  if (rows.length !== want.length) problems.push(`line count ${rows.length}, expected ${want.length}`);
  rows.forEach((row, i) => {
    const parsed = stage.output.safeParse(row);
    if (!parsed.success) problems.push(`line ${i + 1} ${row?.id ?? "?"}: ${parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
    else if (parsed.data.id !== want[i]) problems.push(`line ${i + 1}: id ${parsed.data.id}, expected ${want[i]}`);
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
if (!stage || !["prepare", "collect", "status", "check"].includes(cmd)) {
  console.error(`usage: llm prepare|collect|status|check <${Object.keys(STAGES).join("|")}> [--per-lang N] [--lang ru|en|de] [--size 50]`);
  process.exit(2);
}
if (!existsSync(join(ROOT, stage.prompt))) throw new Error(`prompt missing: ${stage.prompt}`);
if (cmd === "prepare") prepare(s, stage, values["per-lang"] ? Number(values["per-lang"]) : undefined, values.size ? Number(values.size) : 50, values.lang);
if (cmd === "collect") collect(s, stage);
if (cmd === "status") status(s);
if (cmd === "check") {
  if (!values.batch) throw new Error("check needs --batch batch-NNNN");
  check(s, stage, values.batch);
}
