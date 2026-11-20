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
import { Episode, JokeAnalysis, Joke, Locale, MAX_CAST, NARRATOR, ScriptDraft, sceneProblems, stagingProblems, type LookPatch } from "@jf/core";
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

/** Лимит слов сценария (~55 с речи): анекдот рассказывается целиком, сжимаются формулировки, а не структура. */
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
      // data/llm/script/redo.txt: id сценариев на переписывание (по одному в строке) — берутся снова, новая версия заменит старую при collect
      const redoFile = join(stageDir("script"), "redo.txt");
      if (existsSync(redoFile)) for (const id of readFileSync(redoFile, "utf8").split(/\s+/).filter(Boolean)) done.delete(id);
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
          .filter((x) => x.scene.ok && x.backdrop && Object.keys(x.scene.cast).length <= MAX_CAST)
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
              // персонажи из разметки: кто говорит, кто молчит, как выглядит (тёмные очки, трость…) — всё это должно быть видно
              characters: x.a.characters.map((c) => ({ archetype: c.archetype, role: c.role, looks: c.looks })),
              suggestedCast: x.scene.cast, // canonical role → puppet id
              suggestedBackdrop: x.backdrop, location: x.loc,
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
      // метка говорящего — только имя/id куклы или «рассказчик» с двоеточием в начале («Слушай:» — нормальная речь)
      const labels = new Set(
        [...C.puppets.flatMap((p) => [p.id, ...Object.values(p.name)]), "narrator", "рассказчик", "erzähler", "автор"].map((s) => s.toLowerCase()),
      );
      for (const l of row.lines) {
        // со сценами состав проверяется по каждой сцене (sceneProblems): говорящий может появиться только во второй
        if (!row.scenes?.length && l.character !== NARRATOR && !row.cast.includes(l.character)) pr.push(`line by ${l.character} not in cast`);
        const label = l.text.match(/^\s*([\p{L}-]+)\s*:/u)?.[1]?.toLowerCase();
        if (/[()\[\]*#]/u.test(l.text) || (label && labels.has(label))) pr.push(`stage direction or label: "${l.text.slice(0, 40)}"`);
        if (l.uncensored !== undefined && l.uncensored.trim() === l.text.trim()) pr.push(`uncensored equals text — omit it: "${l.text.slice(0, 40)}"`);
      }
      for (const [p, r] of Object.entries(row.roles)) if (!row.cast.includes(p)) pr.push(`roles: ${p} not in cast (${r})`);
      // костюмы на эпизод: только существующие аксессуары и только для кукол в составе
      const acc = new Set(accessoryIds());
      const checkLooks = (looks: Record<string, LookPatch> | undefined, cast: string[], tag: string) => {
        for (const [p, l] of Object.entries(looks ?? {})) {
          if (!cast.includes(p)) pr.push(`${tag}looks: ${p} not in cast`);
          for (const a of [...l.add, ...l.remove]) if (!acc.has(a)) pr.push(`${tag}looks: unknown accessory "${a}" (see the accessories list in context.md; ask for a new one in needs)`);
        }
      };
      checkLooks(row.looks, row.cast, "");
      for (const [i, sc] of (row.scenes ?? []).entries()) checkLooks(sc.looks, sc.cast, `scene ${i + 1}: `);
      if (row.scenes?.length && (row.looks || row.crowd)) pr.push("with scenes put looks and crowd inside the scenes, not at the top level");
      if (row.scenes?.length) {
        // движок v2: проверка сцен, меток и реквизита
        const props = (JSON.parse(readFileSync(join(ROOT, "content", "props.json"), "utf8")).props as { id: string }[]).map((p) => p.id);
        const lines = row.lines.map((l, i) => ({ ...l, id: `l${i + 1}` }));
        for (const sc of row.scenes) {
          if (!bds.has(sc.location) || sc.location === "none") pr.push(`scene: unknown backdrop ${sc.location}`);
          for (const c of sc.cast) if (!ids.has(c)) pr.push(`scene: unknown puppet ${c}`);
          if (sc.split && (!bds.has(sc.split.location) || sc.split.location === "none")) pr.push(`scene: unknown split backdrop ${sc.split.location}`);
        }
        pr.push(...sceneProblems({ lines, scenes: row.scenes }, { marksOf: (loc) => Object.keys(C.backdrops.find((b) => b.id === loc)?.marks ?? {}), props }));
        const s0 = row.scenes[0];
        if (s0.location !== row.location) pr.push("top-level location must repeat the first scene");
        if (s0.cast.join(",") !== row.cast.join(",")) pr.push("top-level cast must repeat the first scene's cast");
        for (const c of s0.cast) if ((s0.roles ?? {})[c] !== (row.roles ?? {})[c]) pr.push(`top-level roles must repeat the first scene's roles (${c})`);
      } else pr.push(...stagingProblems(row.cast, row.lines));
      return pr;
    },
  },
};

/** id аксессуаров, которые умеет рисовать риг (case в remotion/src/puppet/Accessories.tsx). */
function accessoryIds(): string[] {
  const src = readFileSync(join(ROOT, "remotion", "src", "puppet", "Accessories.tsx"), "utf8");
  // в том же файле — причёски (hairStyle), это не аксессуары
  const hair = new Set(["short", "long", "pigtails", "curly", "fringe", "bun", "perm", "bald", "none"]);
  const cases = [...src.matchAll(/case "([a-z0-9-]+)"/g)].map((m) => m[1]);
  // аксессуары, которые рисует сам риг (крюк вместо руки, простыня-привидение): RIG = new Set([...])
  const rig = [...(src.match(/RIG = new Set\(\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
  return [...new Set([...cases, ...rig])].filter((a) => !hair.has(a)).sort();
}

/** Справочник кукол и фонов для сценариста: data/llm/script/context.md */
function writeScriptContext() {
  const C = loadCast();
  const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
  const town = JSON.parse(read("content/world/town.json")) as { name: Record<string, string>; buildings: { id: string; name: Record<string, string>; places: { location: string; place?: string }[] }[] };
  const props = JSON.parse(read("content/props.json")).props as { id: string; ru: string; en: string; de: string }[];
  const lines = [
    "# Writer's reference (generated by `pnpm llm prepare script`)", "",
    read("content/world/bible.md"), "",
    `## Town map: ${town.name.ru} / ${town.name.en} / ${town.name.de}`, "",
    "| building | names ru / en / de | backdrop[:variant] |", "|---|---|---|",
    ...town.buildings.map((b) => `| ${b.id} | ${b.name.ru} / ${b.name.en} / ${b.name.de} | ${b.places.map((p) => p.location + (p.place ? ":" + p.place : "")).join(", ")} |`),
    "", "## Puppets", "",
    "| id | names ru / en / de | family | roles it plays |", "|---|---|---|---|",
    ...C.puppets.map((p) => `| ${p.id} | ${p.name.ru} / ${p.name.en} / ${p.name.de} | ${p.family ?? p.id} | ${p.bible!.roles.join(", ")} |`),
    "", "## Backdrops", "", "| id | covers locations | marks (spots on the floor, left → right) |", "|---|---|---|",
    ...C.backdrops.map((b) => `| ${b.id} | ${b.bible!.roles.join(", ")} | ${Object.entries(b.marks ?? {}).sort((x, y) => x[1] - y[1]).map(([k]) => k).join(", ")} |`),
    "| none | no location (narrator over a neutral backdrop) | |",
    "", "## Props (held in the right hand)", "", "| id | ru | en | de |", "|---|---|---|---|",
    ...props.map((p) => `| ${p.id} | ${p.ru} | ${p.en} | ${p.de} |`), "",
    "## Accessories (for `looks`: add to / remove from a puppet in this episode)", "",
    accessoryIds().join(", "), "",
    "## Crowd", "",
    `Background crowd: \`crowd: {who, size: few|many}\` — who: passengers, pupils, guests, audience, patients, soldiers, people (pupils/children are kids, the rest adults), or animals: penguins, dogs, cats, cows, birds, horses. Reactions: crowd beat \`{type: "crowd", react}\` with react = scream, gasp, laugh, cheer, murmur, calm, flee (the crowd runs off screen for good). At most ${MAX_CAST} puppets per scene plus the crowd.`, "",
  ];
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
      cast: d.cast, roles: d.roles, looks: d.looks, crowd: d.crowd,
      lines: d.lines.map((l, i) => ({
        id: `l${i + 1}`, character: l.character, text: l.text.trim(), uncensored: l.uncensored?.trim() || undefined, offscreen: l.offscreen || undefined, emotion: l.emotion, enter: l.enter, exit: l.exit, laugh: l.laugh,
        audio: voiced(i, l.character, l.text.trim()),
        pauseAfterSec: i === d.lines.length - 1 ? 0.8 : Math.min(1.2, Math.max(0.1, l.pauseAfterSec)),
      })),
      scenes: d.scenes?.length ? d.scenes : undefined,
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
  // id в пачке без выхода — в работе, даже если старая версия уже есть в results (переписывание через redo.txt)
  const ids = new Set<string>();
  for (const b of batches(s)) {
    if (existsSync(outOf(s, b))) continue;
    for (const r of readJsonl<{ id: string }>(join(stageDir(s), b))) ids.add(r.id);
  }
  return ids;
}

function prepare(s: string, stage: Stage, perLang?: number, size = 50, lang?: string, only?: Set<string>) {
  stage.beforePrepare?.();
  const pending = pendingIds(s);
  // --ids: только эти задачи (id задачи или jokeId) — для пилотов на выбранных анекдотах
  const items = stage.inputs({ perLang, lang }).filter((i) => !pending.has(i.id) && (!only || only.has(i.id) || only.has(String(i.jokeId))));
  // номер — после самого большого существующего (архивные пачки оставляют дыры, перезаписывать нельзя)
  let n = Math.max(0, ...batches(s).map((b) => Number(b.match(/\d+/)![0])));
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

/**
 * Сводка заявок сценаристов художнику (ScriptDraft.needs) по всем выходам: что нарисовать, сколько раз просили, для каких эпизодов.
 * Пишет data/llm/script/needs.md. После рисования эти эпизоды переписываются заново (redo.txt).
 */
function needsReport() {
  type Need = NonNullable<ScriptDraft["needs"]>[number];
  const by = new Map<string, { need: Need; ids: string[]; descr: Set<string> }>();
  // только последняя версия каждого сценария (переписанные пачки заменяют старые)
  const latest = new Map<string, { id: string; needs?: Need[] }>();
  for (const b of batches("script")) {
    const out = outOf("script", b);
    if (!existsSync(out)) continue;
    for (const r of readJsonl<{ id: string; needs?: Need[] }>(out)) latest.set(r.id, r);
  }
  for (const r of latest.values()) {
      for (const n of r.needs ?? []) {
        const key = `${n.kind}:${n.id}`;
        const e = by.get(key) ?? { need: n, ids: [], descr: new Set<string>() };
        e.ids.push(r.id);
        e.descr.add(n.description);
        by.set(key, e);
      }
  }
  const rows = [...by.entries()].sort((a, b) => b[1].ids.length - a[1].ids.length);
  const md = [
    "# Заявки сценаристов (`pnpm llm needs script`)", "",
    "| kind:id | раз | описание | эпизоды |", "|---|---|---|---|",
    ...rows.map(([k, e]) => `| ${k} | ${e.ids.length} | ${[...e.descr].slice(0, 3).join(" / ")} | ${e.ids.slice(0, 8).join(", ")}${e.ids.length > 8 ? " …" : ""} |`),
  ];
  writeFileSync(join(stageDir("script"), "needs.md"), md.join("\n") + "\n");
  for (const [k, e] of rows.slice(0, 40)) console.log(`${String(e.ids.length).padStart(3)}  ${k} — ${[...e.descr][0]}`);
  console.log(`${rows.length} distinct needs → data/llm/script/needs.md`);
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { "per-lang": { type: "string" }, size: { type: "string" }, lang: { type: "string" }, batch: { type: "string" }, ids: { type: "string" } },
});
const [cmd, s] = positionals;
const stage = s ? STAGES[s] : undefined;
if (!stage || !["prepare", "collect", "status", "check", "materialize", "needs"].includes(cmd)) {
  console.error(`usage: llm prepare|collect|status|check|materialize|needs <${Object.keys(STAGES).join("|")}> [--per-lang N] [--lang ru|en|de] [--size 50]`);
  process.exit(2);
}
if (!existsSync(join(ROOT, stage.prompt))) throw new Error(`prompt missing: ${stage.prompt}`);
if (cmd === "prepare")
  prepare(s, stage, values["per-lang"] ? Number(values["per-lang"]) : undefined, values.size ? Number(values.size) : 50, values.lang,
    values.ids ? new Set(values.ids.split(",").map((x) => x.trim()).filter(Boolean)) : undefined);
if (cmd === "collect") collect(s, stage);
if (cmd === "status") status(s);
if (cmd === "materialize") {
  if (s !== "script") throw new Error("materialize is only for the script stage");
  materialize();
}
if (cmd === "needs") needsReport();
if (cmd === "check") {
  if (!values.batch) throw new Error("check needs --batch batch-NNNN");
  // `--batch 7` и `--batch batch-0007` равнозначны
  check(s, stage, /^\d+$/.test(values.batch) ? `batch-${values.batch.padStart(4, "0")}` : values.batch);
}
