/**
 * Озвучка эпизодов (ElevenLabs). Работает по файлам из git, база не нужна — запускается на компьютере, где есть ключ.
 *   pnpm voice cast [--locale ru]                          — кому назначен голос, кому нет (TODO) + описание голоса
 *   pnpm voice search "<запрос>" [--language ru] [--gender male|female] [--age young|middle_aged|old]
 *   pnpm voice assign <кукла|narrator> <locale> <voiceId> [--owner <public_owner_id>]   — назначить (с --owner: добавить из библиотеки в My voices)
 *   pnpm voice preview <кукла|narrator> --locale ru [--text "…"]  — пробная фраза → out/voice-preview/
 *   pnpm voice run <episodeId…> | --locale ru --top 30 [--yes] [--provider fake] [--no-laughs]
 *     (кроме реплик озвучивает смех каждой куклы в конце — content/voices.json → laughModel, по умолчанию eleven_v3)
 *   pnpm voice check                                        — устаревшая озвучка (текст поменялся), пропавшие файлы
 *   pnpm voice casting                                      — docs/CASTING.md: кандидаты из content/casting.json со ссылками для прослушивания
 *   pnpm voice apply-casting --locale ru [--roles zhena,vovochka] [--dry-run] [--force]  — найти выбранных кандидатов в библиотеке, добавить в My voices, назначить
 * Без --yes `run` только показывает список и смету символов. Результат: remotion/public/audio/voice/<episodeId>/<lineId>.mp3
 * и поле lines[].audio в content/episodes/<id>.json — закоммитить и запушить.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { NARRATOR, VoiceConfig, estimateWords, textHash, type Emotion, type Locale, type WordTiming } from "@jf/core";
import { duration, tool } from "./audio.js";
import { DATA, ROOT, readJsonl } from "./util.js";
import * as EL from "./voice/elevenlabs.js";
import { blocked } from "./risk.js";

const CHARS = join(ROOT, "content", "characters");
const EPISODES = join(ROOT, "content", "episodes");
const VOICES = join(ROOT, "content", "voices.json");
const PUBLIC = join(ROOT, "remotion", "public");
const LOCALES: Locale[] = ["ru", "en", "de"];

function arg(name: string, def?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}
const flag = (n: string) => process.argv.includes(`--${n}`);
const positional = () => process.argv.slice(3).filter((a, i, all) => !a.startsWith("--") && !all[i - 1]?.startsWith("--"));

// ---------- файлы ----------
type Raw = Record<string, any>;
const readRaw = (p: string): Raw => JSON.parse(readFileSync(p, "utf8"));
const writeRaw = (p: string, v: Raw) => writeFileSync(p, JSON.stringify(v, null, 2) + "\n");

const voiceConfig = () => VoiceConfig.parse(readRaw(VOICES));
const characters = () =>
  Object.fromEntries(readdirSync(CHARS).filter((f) => f.endsWith(".json")).map((f) => [f.replace(/\.json$/, ""), readRaw(join(CHARS, f))]));

/** voiceId говорящего на языке; undefined — голос не назначен. */
function voiceOf(who: string, locale: Locale, chars = characters(), cfg = voiceConfig()) {
  const id = who === NARRATOR ? cfg.narrator[locale]?.elevenlabsVoiceId : chars[who]?.voice?.[locale]?.elevenlabsVoiceId;
  return id && id !== "TODO" ? (id as string) : undefined;
}

function popularity() {
  const m = new Map<string, number>();
  for (const l of LOCALES) for (const j of readJsonl<{ id: string; popularity?: number }>(join(DATA, "jokes", `${l}.jsonl`))) m.set(j.id, j.popularity ?? 0);
  return m;
}

const episodeFiles = () => readdirSync(EPISODES).filter((f) => f.endsWith(".json") && !f.startsWith("demo-") && !f.startsWith("test-"));

/** Смех персонажа в конце (аудио-тег + звукоподражание, чтобы было что произнести). */
const LAUGH_TEXT: Record<Locale, string> = { ru: "[laughs heartily] Ха-ха-ха!", en: "[laughs heartily] Ha-ha-ha!", de: "[laughs heartily] Ha-ha-ha!" };

/** Кто смеётся в конце: куклы, у которых есть реплики (без рассказчика), и кто не ушёл со сцены. */
function laughers(ep: Raw): string[] {
  const speakers = [...new Set((ep.lines as Raw[]).map((l) => l.character as string))].filter((c) => c !== NARRATOR);
  const gone = new Set<string>();
  for (const l of ep.lines as Raw[]) {
    for (const id of l.enter ?? []) gone.delete(id);
    for (const id of l.exit ?? []) gone.add(id);
  }
  return speakers.filter((c) => !gone.has(c));
}

/** Каких смехов не хватает (нет файла или голос куклы сменился). */
function staleLaughs(ep: Raw, voiceOfChar: (c: string) => string | undefined) {
  if (flag("no-laughs")) return [];
  const have = new Map(((ep.outroLaughs ?? []) as Raw[]).map((x) => [x.character, x]));
  return laughers(ep).filter((c) => {
    const x = have.get(c);
    return !x || !existsSync(join(PUBLIC, x.file)) || (voiceOfChar(c) && x.voiceId !== voiceOfChar(c));
  });
}

/** Реплики эпизода, которым нужна (пере)озвучка. */
function stale(ep: Raw) {
  return (ep.lines as Raw[]).filter((l) => !l.audio || l.audio.textHash !== textHash(l.text) || !existsSync(join(PUBLIC, l.audio.file)));
}

// ---------- команды ----------
function cast() {
  const only = arg("locale") as Locale | undefined;
  const chars = characters();
  const cfg = voiceConfig();
  // кто реально говорит в эпизодах (чтобы начинать кастинг с важных)
  const speaks = new Map<string, number>();
  for (const f of episodeFiles()) {
    const ep = readRaw(join(EPISODES, f));
    for (const l of ep.lines) speaks.set(`${l.character}:${ep.locale}`, (speaks.get(`${l.character}:${ep.locale}`) ?? 0) + 1);
  }
  const rows: [string, Locale, string, number, string][] = [];
  for (const l of only ? [only] : LOCALES) {
    rows.push([NARRATOR, l, cfg.narrator[l]?.elevenlabsVoiceId ?? "TODO", speaks.get(`${NARRATOR}:${l}`) ?? 0, cfg.narrator[l]?.notes ?? ""]);
    for (const [id, c] of Object.entries(chars)) rows.push([id, l, c.voice?.[l]?.elevenlabsVoiceId ?? "TODO", speaks.get(`${id}:${l}`) ?? 0, c.bible?.voiceBrief?.[l] ?? c.voice?.[l]?.notes ?? ""]);
  }
  rows.sort((a, b) => a[1].localeCompare(b[1]) || b[3] - a[3]);
  for (const [id, l, v, n, notes] of rows) console.log(`${l}  ${id.padEnd(20)} ${v === "TODO" ? "TODO".padEnd(22) : v.padEnd(22)} ${String(n).padStart(4)} реплик  ${notes}`);
  // двойники с одинаковым голосом в одной сцене — проверяется в run; здесь подсказка по семьям
  const todo = rows.filter((r) => r[2] === "TODO" && r[3] > 0).length;
  console.log(`\nбез голоса и с репликами: ${todo}`);
}

async function search() {
  const q = positional()[0];
  const voices = await EL.searchVoices({ search: q, language: arg("language"), gender: arg("gender"), age: arg("age"), pageSize: Number(arg("n", "20")) });
  for (const v of voices)
    console.log(`${v.voice_id}  owner=${v.public_owner_id}  ${v.name} | ${[v.gender, v.age, v.accent, v.language, v.descriptive, v.use_case].filter(Boolean).join(", ")}\n    ${v.preview_url ?? ""}`);
}

async function assign() {
  const [who, locale, voiceId] = positional() as [string, Locale, string];
  if (!who || !LOCALES.includes(locale) || !voiceId) throw new Error("usage: voice assign <кукла|narrator> <ru|en|de> <voiceId> [--owner <public_owner_id>]");
  const id = arg("owner") ? await EL.addSharedVoice(arg("owner")!, voiceId, `ANEK ${who} ${locale}`) : voiceId;
  if (who === NARRATOR) {
    const cfg = readRaw(VOICES);
    cfg.narrator[locale] = { ...(cfg.narrator[locale] ?? {}), elevenlabsVoiceId: id };
    writeRaw(VOICES, cfg);
  } else {
    const p = join(CHARS, `${who}.json`);
    if (!existsSync(p)) throw new Error(`нет куклы ${who}`);
    const c = readRaw(p);
    c.voice = c.voice ?? {};
    c.voice[locale] = { ...(c.voice[locale] ?? {}), elevenlabsVoiceId: id };
    writeRaw(p, c);
  }
  console.log(`${who} ${locale} → ${id}`);
}

async function preview() {
  const who = positional()[0];
  const locale = (arg("locale") ?? "ru") as Locale;
  const voiceId = voiceOf(who, locale);
  if (!voiceId) throw new Error(`${who} ${locale}: голос не назначен`);
  let text = arg("text");
  if (!text) {
    for (const f of episodeFiles()) {
      const ep = readRaw(join(EPISODES, f));
      const l = ep.locale === locale && ep.lines.find((x: Raw) => x.character === who && x.text.length > 30);
      if (l) { text = l.text; break; }
    }
  }
  text ??= locale === "ru" ? "Заходит как-то мужик в бар…" : locale === "en" ? "So a guy walks into a bar…" : "Kommt ein Mann in eine Kneipe…";
  const r = await EL.tts({ voiceId, text: text!, model: voiceConfig().model, emotion: "neutral", locale });
  const dir = join(ROOT, "out", "voice-preview");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${who}.${locale}.mp3`);
  writeFileSync(file, r.audio);
  console.log(`${file.replace(ROOT + "/", "")}  «${text}»`);
}

/** Тестовый «голос» без трат: тон длиной с оценку по тексту, тайминги равномерные. */
function fakeTts(text: string, out: string): WordTiming[] {
  const words = estimateWords(text);
  const dur = words.length ? words[words.length - 1].end + 0.1 : 0.6;
  tool("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", `sine=frequency=330:duration=${dur.toFixed(2)}`, "-af", "volume=0.3", "-c:a", "libmp3lame", "-b:a", "96k", out]);
  return words;
}

async function run() {
  const provider = arg("provider", "elevenlabs") as "elevenlabs" | "fake";
  const cfg = voiceConfig();
  const chars = characters();
  let files = positional().map((id) => `${id}.json`);
  if (!files.length) {
    const locale = arg("locale") as Locale;
    if (!locale) throw new Error("укажите эпизоды или --locale ru --top N");
    const pop = popularity();
    files = episodeFiles()
      .map((f) => ({ f, ep: readRaw(join(EPISODES, f)) }))
      .filter(({ ep }) => !blocked(ep.jokeId))
      .filter(({ ep }) => ep.locale === locale && (stale(ep).length || staleLaughs(ep, (c) => voiceOf(c, ep.locale, chars, cfg)).length))
      .sort((a, b) => (pop.get(b.ep.jokeId) ?? 0) - (pop.get(a.ep.jokeId) ?? 0))
      .slice(0, Number(arg("top", "10")))
      .map(({ f }) => f);
  }
  // проверки: голоса назначены, в одной сцене у говорящих разные голоса
  let chars_ = 0;
  const problems: string[] = [];
  const plan = files.map((f) => {
    const ep = readRaw(join(EPISODES, f));
    const todo = stale(ep);
    const speakers = [...new Set((ep.lines as Raw[]).map((l) => l.character as string))];
    const ids = new Map<string, string>();
    for (const s of speakers) {
      const v = provider === "fake" ? `fake-${s}` : voiceOf(s, ep.locale, chars, cfg);
      if (!v) problems.push(`${ep.id}: нет голоса для ${s} (${ep.locale}) — pnpm voice cast`);
      else if ([...ids.values()].includes(v)) problems.push(`${ep.id}: у ${s} и ${[...ids].find(([, x]) => x === v)![0]} один и тот же голос`);
      else ids.set(s, v);
    }
    const laughs = staleLaughs(ep, (c) => (provider === "fake" ? `fake-${c}` : voiceOf(c, ep.locale, chars, cfg)));
    const n = todo.reduce((a: number, l: Raw) => a + l.text.length, 0) + laughs.length * LAUGH_TEXT[ep.locale as Locale].length;
    chars_ += n;
    return { f, ep, todo, ids, n, laughs };
  });
  for (const p of plan) console.log(`${p.ep.id.padEnd(24)} ${String(p.todo.length).padStart(2)} реплик + ${p.laughs.length} смех  ${String(p.n).padStart(5)} симв.  ${p.ep.title}`);
  console.log(`\nвсего: ${plan.length} эпизодов, ${chars_} символов (${provider}, модель ${cfg.model})`);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exitCode = 1;
    return;
  }
  if (provider === "elevenlabs") {
    try {
      const q = await EL.quota();
      console.log(`ElevenLabs: использовано ${q.used} из ${q.limit} (${q.tier}), после прогона останется ~${q.limit - q.used - chars_}`);
      if (q.limit - q.used < chars_) throw new Error("не хватит символов в подписке");
    } catch (e) {
      if (!flag("yes")) console.error(String((e as Error).message));
      else throw e;
    }
  }
  if (!flag("yes")) return console.log("это смета; для озвучки добавьте --yes");
  // бесплатный план ElevenLabs: без коммерческой лицензии — такая озвучка только для тестов, к публикации не допускается
  const tag = provider === "elevenlabs" && process.env.ELEVENLABS_PLAN === "free" ? "elevenlabs-free" : provider;
  if (tag === "elevenlabs-free") console.log("ELEVENLABS_PLAN=free: озвучка помечается как тестовая (elevenlabs-free) и не попадёт в публикации");

  for (const p of plan) {
    const dir = join(PUBLIC, "audio", "voice", p.ep.id);
    mkdirSync(dir, { recursive: true });
    const lines = p.ep.lines as Raw[];
    for (const l of p.todo) {
      const i = lines.indexOf(l);
      const rel = `audio/voice/${p.ep.id}/${l.id}.mp3`;
      const out = join(PUBLIC, rel);
      let words: WordTiming[];
      if (provider === "fake") words = fakeTts(l.text, out);
      else {
        const r = await EL.tts({
          voiceId: p.ids.get(l.character)!, text: l.text, model: cfg.model, emotion: (l.emotion ?? "neutral") as Emotion, locale: p.ep.locale,
          previousText: lines[i - 1]?.text, nextText: lines[i + 1]?.text, seed: 42,
        });
        writeFileSync(out, r.audio);
        words = r.words;
      }
      l.audio = {
        file: rel, durationSec: Math.round(duration(out) * 1000) / 1000, words,
        provider: tag, voiceId: p.ids.get(l.character), model: provider === "fake" ? "fake" : cfg.model, textHash: textHash(l.text),
      };
    }
    // смех персонажей в конце
    const laughs = new Map<string, Raw>(((p.ep.outroLaughs ?? []) as Raw[]).filter((x) => laughers(p.ep).includes(x.character)).map((x) => [x.character, x]));
    for (const c of p.laughs) {
      const rel = `audio/voice/${p.ep.id}/laugh-${c}.mp3`;
      const out = join(PUBLIC, rel);
      if (provider === "fake") fakeTts("ha ha ha ha", out);
      else writeFileSync(out, (await EL.tts({ voiceId: p.ids.get(c)!, text: LAUGH_TEXT[p.ep.locale as Locale], model: cfg.laughModel, emotion: "happy", locale: p.ep.locale, raw: true })).audio);
      laughs.set(c, { character: c, file: rel, durationSec: Math.round(duration(out) * 1000) / 1000, provider: tag, voiceId: p.ids.get(c) });
    }
    p.ep.outroLaughs = [...laughs.values()];
    // старые файлы реплик, которых больше нет
    const keep = new Set([...lines.map((l) => `${l.id}.mp3`), ...[...laughs.keys()].map((c) => `laugh-${c}.mp3`)]);
    for (const f of readdirSync(dir)) if (!keep.has(f)) rmSync(join(dir, f));
    writeRaw(join(EPISODES, p.f), p.ep);
    console.log(`✓ ${p.ep.id}`);
  }
  console.log("готово: git add content/episodes remotion/public/audio/voice && git commit && git push");
}

// ---------- кастинг (content/casting.json) ----------
type Casting = Record<string, unknown> & Partial<Record<Locale, Record<string, { pick: number; brief: string; candidates: string[] }>>>;
const CASTING = join(ROOT, "content", "casting.json");
const norm = (s: string) => s.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
const head = (name: string) => name.split(/\s[-–—]\s/)[0].trim();
const libraryLink = (locale: Locale, name: string) =>
  `https://elevenlabs.io/app/voice-library?required_languages=${locale}&search=${encodeURIComponent(head(name))}`;

function casting() {
  const c = readRaw(CASTING) as Casting;
  const chars = characters();
  const out = ["# Кастинг голосов", "", "Сгенерировано `pnpm voice casting` из `content/casting.json`. Ссылки открывают поиск в ElevenLabs Voice Library — там можно прослушать голос.",
    "Выбор: поменяйте `pick` (0 — первый кандидат) в `content/casting.json`, затем `pnpm voice apply-casting --locale ru --dry-run` и без `--dry-run` (нужен ключ ElevenLabs).", ""];
  for (const locale of LOCALES) {
    const roles = c[locale];
    if (!roles) continue;
    out.push(`## ${locale}`, "", "| роль | голос сейчас | бриф | кандидаты |", "|---|---|---|---|");
    for (const [role, r] of Object.entries(roles)) {
      const cur = voiceOf(role, locale, chars) ?? "—";
      const cands = r.candidates.map((n, i) => `${i === r.pick ? "**→** " : ""}[${n}](${libraryLink(locale, n)})`).join("<br>");
      out.push(`| ${role} | ${cur} | ${r.brief} | ${cands} |`);
    }
    out.push("");
  }
  writeFileSync(join(ROOT, "docs", "CASTING.md"), out.join("\n"));
  console.log("docs/CASTING.md");
}

async function applyCasting() {
  const locale = (arg("locale") ?? "ru") as Locale;
  const dry = flag("dry-run");
  const roles = (readRaw(CASTING) as Casting)[locale];
  if (!roles) throw new Error(`в content/casting.json нет раздела ${locale}`);
  const chosen = new Map<string, string>();
  const only = arg("roles")?.split(",").map((x) => x.trim());
  for (const [role, r] of Object.entries(roles)) {
    if (only && !only.includes(role)) continue;
    const want = r.candidates[r.pick ?? 0];
    if (!want) continue;
    if (voiceOf(role, locale) && !flag("force")) {
      console.log(`${role.padEnd(18)} уже назначен (${voiceOf(role, locale)}), пропуск (--force — переназначить)`);
      continue;
    }
    const found = await EL.searchVoices({ search: head(want), language: locale, pageSize: 30 });
    const v = found.find((x) => norm(x.name).startsWith(norm(want).slice(0, 28))) ?? found.find((x) => norm(x.name).startsWith(norm(head(want))));
    if (!v) {
      console.log(`${role.padEnd(18)} НЕ НАЙДЕН «${want}» — проверьте имя в библиотеке (pnpm voice search "${head(want)}" --language ${locale})`);
      continue;
    }
    if ([...chosen.values()].includes(v.voice_id)) {
      console.log(`${role.padEnd(18)} «${v.name}» уже выбран для другой роли — выберите другого кандидата`);
      continue;
    }
    chosen.set(role, v.voice_id);
    if (dry) {
      console.log(`${role.padEnd(18)} → ${v.name} (${v.voice_id})`);
      continue;
    }
    const id = await EL.addSharedVoice(v.public_owner_id, v.voice_id, `ANEK ${role} ${locale}`);
    if (role === NARRATOR) {
      const cfg = readRaw(VOICES);
      cfg.narrator[locale] = { ...(cfg.narrator[locale] ?? {}), elevenlabsVoiceId: id };
      writeRaw(VOICES, cfg);
    } else {
      const p = join(CHARS, `${role}.json`);
      const ch = readRaw(p);
      ch.voice = ch.voice ?? {};
      ch.voice[locale] = { ...(ch.voice[locale] ?? {}), elevenlabsVoiceId: id };
      writeRaw(p, ch);
    }
    console.log(`${role.padEnd(18)} ✓ ${v.name} → ${id}`);
  }
  if (dry) console.log("\nэто проверка; без --dry-run голоса будут добавлены в My voices (занимают слоты плана) и записаны куклам");
}

function check() {
  let voiced = 0;
  const bad: string[] = [];
  for (const f of episodeFiles()) {
    const ep = readRaw(join(EPISODES, f));
    if (!(ep.lines as Raw[]).some((l) => l.audio)) continue;
    voiced++;
    const s = stale(ep);
    if (s.length) bad.push(`${ep.id}: ${s.length} реплик без актуальной озвучки (${s.map((l: Raw) => l.id).join(", ")})`);
  }
  console.log(`озвучено эпизодов: ${voiced}`);
  if (bad.length) {
    console.log(bad.join("\n"));
    process.exitCode = 1;
  } else console.log("всё актуально");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const cmd = process.argv[2];
  const cmds: Record<string, () => unknown> = { cast, search, assign, preview, run, check, casting, "apply-casting": applyCasting };
  if (!cmds[cmd]) {
    console.error("usage: voice cast|search|assign|preview|run|check (см. шапку pipeline/src/voice.ts)");
    process.exitCode = 1;
  } else await cmds[cmd]();
}
