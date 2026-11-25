/**
 * Проверка всех эпизодов по схеме и ссылкам (без LLM):
 *   pnpm validate                 — все эпизоды content/episodes
 *   pnpm validate --debug         — только отладочный набор (content/debug-set.json)
 *   pnpm validate <id> [<id>…]    — выбранные эпизоды
 *   --json                        — машинный вывод (для агентов и MCP)
 *
 * Ошибки (error) — эпизод отрендерится неправильно или упадёт: неизвестная кукла, место, метка, реквизит, реплика вне сцены,
 * говорящий не в cast, роль, которой нет ни у одной куклы, нет файла озвучки.
 * Предупреждения (warn) — сработает, но не так, как задумано: роль чужой куклы (костюм берётся у хозяйки роли),
 * неизвестный place у эпизода (показывается вид по умолчанию).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { APPEARANCE_ROLES, GENERIC_ROLES, Character, Episode, Location, WardrobeFile, sceneProblems, subLocation, marksFor, type Scene } from "@jf/core";
import { ROOT } from "./util.js";
import { checkWorld } from "./world.js";
import { checkSeries } from "./series.js";

export type Issue = { id: string; level: "error" | "warn" | "info"; kind: string; msg: string };

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const dir = (d: string) => readdirSync(join(ROOT, "content", d)).filter((f) => f.endsWith(".json"));

export function loadAssets() {
  const characters = new Map(dir("characters").map((f) => { const c = Character.parse(readJson(join(ROOT, "content/characters", f))); return [c.id, c] as const; }));
  const locations = new Map(dir("locations").map((f) => { const l = Location.parse(readJson(join(ROOT, "content/locations", f))); return [l.id, l] as const; }));
  const props = (readJson(join(ROOT, "content/props.json")).props as { id: string }[]).map((p) => p.id);
  /** Роль → кукла, которой она принадлежит (bible.roles или варианты). */
  const owner = new Map<string, string>();
  for (const c of characters.values()) for (const r of [...(c.bible?.roles ?? []), ...(c.bible?.variants ?? []).flatMap((v) => v.roles)]) if (!owner.has(r)) owner.set(r, c.id);
  // гардероб: вещи (accessories) и причёски (hairStyle) — content/wardrobe/*.json
  const items = dir("wardrobe").flatMap((f) => WardrobeFile.parse(readJson(join(ROOT, "content/wardrobe", f))).items);
  const wear = new Set(items.filter((i) => i.slot !== "hair").map((i) => i.id));
  const hair = new Set([...items.filter((i) => i.slot === "hair").map((i) => i.id), "none"]);
  return { characters, locations, props, owner, wear, hair };
}

/** Неизвестные вещи и причёски в облике (look, патч роли или эпизода). */
function lookProblems(l: { accessories?: string[]; add?: string[]; hairStyle?: string }, A: ReturnType<typeof loadAssets>): string[] {
  const out: string[] = [];
  for (const a of [...(l.accessories ?? []), ...(l.add ?? [])]) if (!A.wear.has(a)) out.push(`unknown wardrobe item "${a}" (content/wardrobe)`);
  if (l.hairStyle && !A.hair.has(l.hairStyle)) out.push(`unknown hairStyle "${l.hairStyle}" (content/wardrobe/hair.json)`);
  return out;
}

/** Куклы: облик и варианты ролей ссылаются только на вещи гардероба. */
export function validateCharacters(A = loadAssets()): Issue[] {
  const out: Issue[] = [];
  for (const c of A.characters.values()) {
    for (const m of lookProblems(c.look, A)) out.push({ id: `character:${c.id}`, level: "error", kind: "wardrobe", msg: m });
    for (const v of c.bible?.variants ?? []) for (const m of lookProblems(v.look ?? {}, A)) out.push({ id: `character:${c.id}`, level: "error", kind: "wardrobe", msg: `${v.roles.join("/")}: ${m}` });
  }
  return out;
}

export function debugSet(): string[] {
  return readJson(join(ROOT, "content/debug-set.json")).episodes as string[];
}

export function validateEpisode(id: string, A = loadAssets()): Issue[] {
  const out: Issue[] = [];
  const add = (level: Issue["level"], kind: string, msg: string) => out.push({ id, level, kind, msg });
  const file = join(ROOT, "content/episodes", `${id}.json`);
  if (!existsSync(file)) { add("error", "missing", `no file content/episodes/${id}.json`); return out; }
  const raw = readJson(file);
  if (!Array.isArray(raw.scenes) || raw.lines?.some((l: Record<string, unknown>) => "enter" in l || "exit" in l)) {
    add("error", "legacy", "old format (no scenes or enter/exit on lines): run pnpm migrate-episodes");
    return out;
  }
  const parsed = Episode.safeParse(raw);
  if (!parsed.success) {
    for (const i of parsed.error.issues.slice(0, 8)) add("error", "schema", `${i.path.join(".")}: ${i.message}`);
    return out;
  }
  const ep = parsed.data;
  const scenes: Scene[] = ep.scenes;

  // места и сублокации
  const checkLoc = (loc: string, place: string | undefined, tag: string, explicit: boolean) => {
    const L = A.locations.get(loc);
    if (!L) { add("error", "location", `${tag}unknown location "${loc}"`); return; }
    if (place && place !== loc && !subLocation(L, place) && !L.bible?.roles.includes(place)) {
      add(explicit ? "error" : "warn", "place", `${tag}unknown place "${place}" at ${loc} (default view is shown)`);
    }
  };
  if (!A.locations.has(ep.location)) add("error", "location", `unknown location "${ep.location}"`);
  if (ep.location !== ep.scenes[0].location) add("error", "summary", `location must repeat the first scene (${ep.scenes[0].location})`);

  // куклы и роли
  const checkCast = (cast: string[], roles: Record<string, string>, tag: string, looks: Record<string, { hair?: string }> = {}) => {
    for (const c of cast) if (!A.characters.has(c)) add("error", "puppet", `${tag}unknown puppet "${c}"`);
    for (const [c, r] of Object.entries(roles)) {
      const ch = A.characters.get(c);
      if (!ch) continue;
      if (!cast.includes(c)) add("warn", "role", `${tag}role for ${c} who is not in cast`);
      const own = ch.bible?.roles.includes(r) || ch.bible?.variants.some((v) => v.roles.includes(r));
      if (own) continue;
      const o = A.owner.get(r);
      // двойник семьи играет роль базовой куклы (muzhik-sosed — father) — так и задумано
      const fam = (x?: Character) => x?.family ?? x?.id;
      if (o && fam(A.characters.get(o)) === fam(ch)) continue;
      if (GENERIC_ROLES.includes(r)) continue;
      if (o && APPEARANCE_ROLES.includes(r) && looks[c]?.hair) continue; // внешность задана в эпизоде (looks: hair)
      if (o && APPEARANCE_ROLES.includes(r)) add("error", "role", `${tag}${c} plays "${r}" — the look belongs to ${o}; cast ${o} instead`);
      else if (o) add("info", "role", `${tag}${c} plays "${r}" — costume borrowed from ${o}`);
      else add("error", "role", `${tag}${c} plays "${r}" — no puppet has this role (base costume is shown)`);
    }
  };
  for (const sc of scenes) for (const c of sc.cast) if (!ep.cast.includes(c)) add("error", "summary", `cast must list every puppet of the scenes (${c})`);

  scenes.forEach((sc, i) => {
    const tag = `scene ${i + 1}: `;
    checkLoc(sc.location, sc.place, tag, true);
    if (sc.split) checkLoc(sc.split.location, sc.split.place, `${tag}split: `, true);
    checkCast(sc.cast, sc.roles, tag, sc.looks ?? {});
  });
  const problems = sceneProblems(
    { lines: ep.lines, scenes },
    {
      marksOf: (loc, place) => Object.keys(marksFor(A.locations.get(loc), place)),
      places: (loc) => (A.locations.get(loc)?.bible?.variants ?? []).flatMap((v) => [...(v.id ? [v.id] : []), ...v.roles]),
      props: A.props,
    },
  );
  for (const p of problems) add("error", "staging", p);
  for (const [si, sc] of scenes.entries()) for (const [who, l] of Object.entries(sc.looks ?? {})) for (const m of lookProblems(l, A)) add("error", "wardrobe", `scene ${si + 1}: looks.${who}: ${m}`);

  // озвучка: файлы на месте
  for (const l of ep.lines) if (l.audio && !existsSync(join(ROOT, "remotion/public", l.audio.file))) add("error", "audio", `${l.id}: missing ${l.audio.file}`);
  for (const o of ep.outroLaughs ?? []) {
    if (!existsSync(join(ROOT, "remotion/public", o.file))) add("error", "audio", `laugh ${o.character}: missing ${o.file}`);
    const inCast = [...ep.cast, ...scenes.flatMap((s) => s.cast)].includes(o.character);
    if (!inCast) add("warn", "audio", `laugh of ${o.character} who is not in any cast`);
  }
  return out;
}

function main() {
  const { values, positionals } = parseArgs({ options: { debug: { type: "boolean" }, json: { type: "boolean" }, quiet: { type: "boolean" } }, allowPositionals: true });
  const ids = positionals.length ? positionals : values.debug ? debugSet() : dir("episodes").map((f) => f.replace(/\.json$/, ""));
  const A = loadAssets();
  const issues = [...validateCharacters(A), ...checkWorld(A), ...checkSeries(), ...ids.flatMap((id) => validateEpisode(id, A))];
  if (values.json) { console.log(JSON.stringify(issues, null, 2)); process.exitCode = issues.some((i) => i.level === "error") ? 1 : 0; return; }
  const errors = issues.filter((i) => i.level === "error"), warns = issues.filter((i) => i.level === "warn"), infos = issues.filter((i) => i.level === "info");
  const byKind = (xs: Issue[]) => Object.entries(xs.reduce<Record<string, number>>((a, i) => ((a[i.kind] = (a[i.kind] ?? 0) + 1), a), {})).map(([k, n]) => `${k} ${n}`).join(", ");
  if (!values.quiet) {
    for (const i of errors) console.log(`ERROR ${i.id}: ${i.msg}`);
    if (ids.length <= 50) for (const i of warns) console.log(`warn  ${i.id}: ${i.msg}`);
  }
  const bad = new Set(errors.map((i) => i.id));
  console.log(`\n${ids.length} episodes: ${bad.size} with errors (${errors.length}: ${byKind(errors) || "—"}), warnings ${warns.length} (${byKind(warns) || "—"}), info ${infos.length} (borrowed costumes)`);
  process.exitCode = errors.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
