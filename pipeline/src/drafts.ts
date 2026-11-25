/**
 * Сценарий (ScriptDraft) → проверки и эпизод. Общие для стадии script (анекдоты) и series (связки серий).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Episode, NARRATOR, SET_ITEMS, WardrobeFile, marksFor, migrateEpisodeData, sceneProblems, subLocation, type Location, type LookPatch, type ScriptDraft } from "@jf/core";
import { loadCast } from "./cast.js";
import { fixEpisode, lintAssets, lintEpisode } from "./lint.js";
import { ROOT } from "./util.js";

/** id вещей гардероба (content/wardrobe/*.json), кроме причёсок (hairStyle): то, что можно добавить кукле через looks. */
export function accessoryIds(): string[] {
  const dir = join(ROOT, "content", "wardrobe");
  const items = readdirSync(dir).filter((f) => f.endsWith(".json")).flatMap((f) => WardrobeFile.parse(JSON.parse(readFileSync(join(dir, f), "utf8"))).items);
  return items.filter((i) => i.slot !== "hair").map((i) => i.id).sort();
}


/** Проблемы сценария, которые исполнитель должен исправить: куклы, фоны, метки, костюмы, мебель, сцены, линтер. */
export function draftProblems(row: ScriptDraft): string[] {
  const C = loadCast();
  const ids = new Set(C.puppets.map((p) => p.id));
  const bds = new Set(["none", ...C.backdrops.map((b) => b.id)]);
  const pr: string[] = [];
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
  // мебель: известные предметы, метки места
  const bdOf = (loc: string) => C.backdrops.find((b) => b.id === loc) as Location | undefined;
  const checkSet = (set: { item: string; at?: string }[] | undefined, loc: string, tag: string, place?: string) => {
    const marks = Object.keys(marksFor(bdOf(loc), place));
    for (const it of set ?? []) {
      if (!(SET_ITEMS as readonly string[]).includes(it.item)) pr.push(`${tag}set: unknown item "${it.item}" (items: ${SET_ITEMS.join(", ")}; ask for a new one in needs, kind "backdrop")`);
      if (it.at && !["left", "center", "right", ...marks].includes(it.at)) pr.push(`${tag}set: unknown mark "${it.at}" at ${loc}`);
    }
  };
  checkSet(row.set, row.location, "");
  for (const [i, sc] of (row.scenes ?? []).entries()) checkSet(sc.set, sc.location, `scene ${i + 1}: `, sc.place);
  if (row.scenes?.length && (row.looks || row.crowd || row.set)) pr.push("with scenes put looks and crowd inside the scenes, not at the top level");
  // сцены: свои или из старого вида (enter/exit на репликах) — тот же перевод, что в materialize
  const props = (JSON.parse(readFileSync(join(ROOT, "content", "props.json"), "utf8")).props as { id: string }[]).map((p) => p.id);
  const mig = migrateEpisodeData({ location: row.location, cast: row.cast, roles: row.roles, looks: row.looks, crowd: row.crowd, set: row.set, scenes: row.scenes, lines: row.lines.map((l, i) => ({ ...l, id: `l${i + 1}` })) });
  for (const sc of mig.scenes) {
    if (!bds.has(sc.location) || sc.location === "none") pr.push(`scene: unknown backdrop ${sc.location}`);
    for (const c of sc.cast) if (!ids.has(c)) pr.push(`scene: unknown puppet ${c}`);
    if (sc.split && (!bds.has(sc.split.location) || sc.split.location === "none")) pr.push(`scene: unknown split backdrop ${sc.split.location}`);
  }
  pr.push(...sceneProblems({ lines: mig.lines, scenes: mig.scenes }, {
    marksOf: (loc, place) => Object.keys(marksFor(bdOf(loc), place)),
    places: (loc) => (bdOf(loc)?.bible?.variants ?? []).flatMap((v) => [...(v.id ? [v.id] : []), ...v.roles]),
    props,
  }));
  if (row.scenes?.length) {
    const s0 = row.scenes[0];
    if (s0.location !== row.location) pr.push("top-level location must repeat the first scene");
    if (s0.cast.join(",") !== row.cast.join(",")) pr.push("top-level cast must repeat the first scene's cast");
    for (const c of s0.cast) if ((s0.roles ?? {})[c] !== (row.roles ?? {})[c]) pr.push(`top-level roles must repeat the first scene's roles (${c})`);
  }
  // линтер (ROADMAP §6): то, что код не исправит сам — «это моя жена» без жены в кадре, машина закрывает говорящего
  if (!pr.length) {
    const ep = Episode.parse({ ...mig, id: row.id, jokeId: row.jokeId, locale: row.locale, title: row.title, location: mig.scenes[0].location, cast: mig.scenes[0].cast, roles: mig.scenes[0].roles });
    for (const f of lintEpisode(ep, lintAssets())) if (f.rule === "mentioned-offscreen" || f.rule === "vehicle-covers") pr.push(`lint ${f.rule}: ${f.msg}`);
  }

  return pr;
}

/**
 * Сценарий → эпизод: миграция в сцены, исправления линтера, озвучка прежней версии (prev) для реплик с тем же текстом.
 * kind: "bridge" — связка серии.
 */
export function draftToEpisode(d: ScriptDraft, o: { place?: string; prev?: Episode; kind?: "joke" | "bridge"; C?: ReturnType<typeof loadCast>; lintA?: ReturnType<typeof lintAssets> } = {}): Episode {
  const C = o.C ?? loadCast(), lintA = o.lintA ?? lintAssets(), prev = o.prev;
  // озвучку уже существующего эпизода сохраняем для реплик, чей текст и говорящий не изменились
  const voiced = (i: number, character: string, text: string) => {
    const p = prev?.lines[i];
    return p?.audio && p.character === character && p.text === text ? p.audio : undefined;
  };
  const wasVoiced = !!prev?.lines.some((l) => l.audio);
  const isPlace = (loc: string, place: string) => !!subLocation(C.backdrops.find((b) => b.id === loc) as Location | undefined, place);
  const ep = Episode.parse(migrateEpisodeData({
    id: d.id, jokeId: d.jokeId, locale: d.locale, title: d.title, kind: o.kind,
    location: d.location === "none" ? "gostinaya" : d.location,
    place: o.place,
    cast: d.cast, roles: d.roles, looks: d.looks, crowd: d.crowd, set: d.set,
    lines: d.lines.map((l, i) => ({
      id: `l${i + 1}`, character: l.character, text: l.text.trim(), uncensored: l.uncensored?.trim() || undefined, offscreen: l.offscreen || undefined, emotion: l.emotion, enter: l.enter, exit: l.exit, laugh: l.laugh,
      pauseAfterSec: i === d.lines.length - 1 ? 0.8 : Math.min(0.6, Math.max(0, l.pauseAfterSec)),
    })),
    scenes: d.scenes?.length ? d.scenes : undefined, // нет — migrateEpisodeData соберёт одну сцену
    // смех в конце, музыку и режим без цензуры не теряем при пересборке (смех — только тех, кто ещё в составе)
    outroLaughs: (prev?.outroLaughs ?? []).filter((o) => [...d.cast, ...(d.scenes ?? []).flatMap((sc) => sc.cast)].includes(o.character)),
    music: prev?.music,
    explicit: prev?.explicit,
    flags: prev?.flags,
  }, isPlace));
  // исправления линтера по правилам (pnpm lint-scripts): сиденья, порядок действий; деление длинных реплик —
  // только если прежняя версия не озвучена. Потом — озвучка прежней версии для реплик с тем же текстом и голосом.
  const fixedEp = fixEpisode(ep, lintA, { textFixes: !wasVoiced }).ep;
  fixedEp.lines.forEach((l, i) => { const a = voiced(i, l.character, l.text); if (a) l.audio = a; });
  // повторный parse — порядок ключей как в схеме (audio на своём месте), файл не меняется зря
  return Episode.parse(fixedEp);
}
