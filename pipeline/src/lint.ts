/**
 * Линтер сценариев без LLM (ROADMAP §6): находит типовые ошибки постановки; что исправляется по правилам — исправляет код.
 *   pnpm lint-scripts [<id>…|--debug|--all] [--fix|--dry-run] [--json] [--redo] [--rule <id>] [--examples N]
 *
 * Правила:
 *  - mentioned-offscreen — в реплике «это моя жена» / «this is my wife», а куклы с этой ролью в сцене нет, хотя место есть;
 *  - long-line           — реплика длиннее трёх строк субтитров (показывается частями); fix — делим по границе предложения;
 *  - no-voice            — у говорящей куклы нет голоса для языка эпизода (кастинг, не сценарий: в redo не идёт);
 *  - seat-shared         — на одну метку-сиденье садятся двое; fix — второй садится на ближайшее свободное сиденье;
 *  - vehicle-covers      — машина стоит перед говорящим и закрывает его, пока он говорит;
 *  - act-after-line      — рассказчик называет действие («и раз подзатыльник!»), а бит act стоит после этой реплики;
 *                          fix — бит переносится перед репликой (действие идёт во время неё).
 * Исправления текста (long-line) — только у неозвученных эпизодов: озвучку не теряем.
 * Те же исправления применяет `pnpm llm materialize script` — пересборка их не откатывает.
 * --redo: эпизоды с неисправленными находками (кроме no-voice) → data/llm/script/lint-redo.txt — их переписывает LLM.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { Character, Episode, Location, NARRATOR, markOf, marksFor, type Act, type Beat, type Scene } from "@jf/core";
import { compileEpisode } from "../../remotion/src/perf/compile.js";
import { VEHICLE_SPECS } from "../../remotion/src/world/vehicleSpecs.js";
import { sampleLin, sampleStep, sec } from "../../remotion/src/perf/tracks.js";
import { debugSet } from "./validate.js";
import { ROOT } from "./util.js";

export type Rule = "mentioned-offscreen" | "long-line" | "no-voice" | "seat-shared" | "vehicle-covers" | "act-after-line";
export type Finding = { id: string; rule: Rule; level: "error" | "warn" | "info"; msg: string; fixable?: boolean };
/** Правила, которые чинит LLM (переписать сценарий); no-voice — дело кастинга. */
const REDO_RULES: Rule[] = ["mentioned-offscreen", "long-line", "seat-shared", "vehicle-covers", "act-after-line"];

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const dir = (d: string) => readdirSync(join(ROOT, "content", d)).filter((f) => f.endsWith(".json"));

export function lintAssets() {
  const characters = new Map(dir("characters").map((f) => { const c = Character.parse(readJson(join(ROOT, "content/characters", f))); return [c.id, c] as const; }));
  const locations = new Map(dir("locations").map((f) => { const l = Location.parse(readJson(join(ROOT, "content/locations", f))); return [l.id, l] as const; }));
  return { characters, locations };
}
type Assets = ReturnType<typeof lintAssets>;

/* ---------- субтитры: куски по длине, как components/Captions.tsx ---------- */
/** Сколько символов помещается в кусок субтитров (≈3 строки): длинная реплика показывается частями. */
export const CHUNK_CHARS = { line: 44, narrator: 70 };
export function captionChunks(text: string, narrator: boolean): number {
  const max = narrator ? CHUNK_CHARS.narrator : CHUNK_CHARS.line;
  let chunks = 0, len = 0, cur = 0;
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (cur && len + w.length + 1 > max) { chunks++; cur = 0; len = 0; }
    cur++; len += w.length + 1;
  }
  return chunks + (cur ? 1 : 0);
}

/* ---------- словари ---------- */
const L = "(?<![\\p{L}])"; // начало слова (\b не работает с кириллицей)
const E = "(?![\\p{L}])"; // конец слова
/** Слово роли → канонические роли (scene.roles). Основы с окончаниями. */
const ROLE_WORDS: { re: string; roles: string[] }[] = [
  { re: `жен[ауы]${E}|wife${E}|frau${E}`, roles: ["wife"] },
  { re: `муж${E}|husband${E}|(?:mein|ihr)\\s+mann${E}`, roles: ["husband"] },
  { re: `т[её]щ[ауи]${E}|свекров[ьи]${E}|mother-in-law|schwiegermutter`, roles: ["mother-in-law"] },
  { re: `сын${E}|сына${E}|son${E}|sohn${E}`, roles: ["son", "child"] },
  { re: `доч[ьк][аиу]?${E}|daughter|tochter`, roles: ["daughter", "child"] },
  { re: `мам[ауы]${E}|мать${E}|mom${E}|mother${E}|mutter${E}|mama${E}`, roles: ["mother"] },
  { re: `пап[ауы]${E}|отец${E}|dad${E}|father${E}|vater${E}|papa${E}`, roles: ["father"] },
  { re: `бабушк[аиу]${E}|grandma|grandmother|oma${E}`, roles: ["grandma", "old-woman"] },
  { re: `дедушк[аиу]${E}|grandpa|grandfather|opa${E}`, roles: ["grandpa", "old-man"] },
  { re: `начальник|шеф${E}|boss${E}|chef${E}`, roles: ["boss"] },
  { re: `доктор${E}|врач${E}|doctor${E}|arzt${E}|doktor${E}`, roles: ["doctor", "therapist"] },
  { re: `сосед${E}|соседк[аиу]${E}|neighbou?r${E}|nachbar`, roles: ["neighbor"] },
  { re: `любовни[кц][аи]?${E}|lover${E}|liebhaber|geliebte`, roles: ["lover"] },
];
/** Указание на человека в кадре с притяжательным: «это моя …», «вот мой …», «this is my …», «das ist meine …» (без него «das ist Frau Müller» — не жена). */
const DEICTIC: Record<string, string> = {
  ru: `${L}(?:это|вот|знакомьтесь|познакомься|познакомьтесь)[,:!]?\\s+(?:мо[йяёи]|наш[аеи]?|ваш[аеи]?|тво[йяёи])\\s+`,
  en: `${L}(?:this is|here is|here's|meet)\\s+(?:my|our|your)\\s+`,
  de: `${L}(?:das ist|hier ist|darf ich vorstellen,?)\\s+(?:mein|meine|unser|unsere|ihr|ihre|dein|deine)\\s+`,
};
/** Действие → слова, которыми рассказчик его называет (ru, en, de). */
const ACT_WORDS: Partial<Record<Act, string>> = {
  slap: `${L}(?:пощ[её]чин|оплеух|подзатыльн|шл[её]п)|${L}slap|${L}ohrfeig|${L}klaps`,
  punch: `${L}(?:ударил|бь[её]т${E}|врезал|в морду|в челюсть)|${L}punch|${L}(?:schlägt|faustschlag)`,
  "hit-head": `по (?:голове|башке|лбу)|on the head|auf den kopf`,
  "cover-ears": `уши руками|(?:закрывает|затыкает|зажимает) уши|covers? (?:his|her|their) ears|ohren zu`,
  "cover-eyes": `(?:закрывает|прикрывает) глаза|covers? (?:his|her|their) eyes|augen zu`,
  hug: `${L}обнима|${L}обнял|${L}hug|${L}umarm`,
  kiss: `${L}(?:целу|поцелу)|${L}kiss|${L}(?:küss|kuss)`,
  kneel: `на колени|на коленях|${L}kneel|auf die knie|${L}kniet`,
  sit: `${L}(?:садится|сел${E}|села${E}|присел|присаживается)|sits down|sat down|setzt sich`,
  stand: `${L}(?:вста[её]т|встал)|stands up|gets up|steht auf`,
  fall: `${L}(?:пада[ею]т|упал)|${L}(?:falls|fell)${E}|${L}(?:fällt|fiel)${E}`,
  faint: `в обморок|${L}faint|ohnmächtig|in ohnmacht`,
  cry: `${L}(?:плач|рыда|разрыдал)|${L}(?:cries|crying|sobs)|${L}(?:weint|heult)`,
  drink: `${L}(?:пь[её]т${E}|выпил|выпива|залпом)|${L}(?:drinks|drank|sips)|${L}trinkt`,
  eat: `${L}(?:ест${E}|съел|кушает|жу[её]т)|${L}(?:eats|ate)${E}|${L}(?:isst|aß)${E}`,
  "scratch-head": `чешет (?:в )?затыл|почесал (?:в )?затыл|scratch(?:es)? (?:his|her) head|kratzt sich am kopf`,
  "hands-up": `руки вверх|hands up|hände hoch`,
  clap: `${L}(?:хлопа|аплодир)|${L}(?:claps|applau)|${L}klatscht`,
  "pray-hands": `${L}(?:молится|молит)|${L}prays|${L}betet`,
  sleep: `${L}(?:спит|спят|уснул|заснул)|${L}(?:sleeps|asleep)|${L}schläft`,
  throw: `${L}(?:бросает|кидает|швыряет|бросил|швырнул)|${L}(?:throws|threw)|${L}wirft`,
  knock: `${L}(?:стучит|постучал)|${L}knocks|${L}klopft`,
  dance: `${L}(?:танцу|пляш)|${L}danc|${L}tanzt`,
  shiver: `${L}(?:дрожит|трясется|трясётся|задрожал)|${L}(?:shiver|trembl)|${L}zittert`,
  whistle: `${L}свист|${L}whistl|${L}pfeif`,
  wave: `${L}(?:машет|помахал)|${L}waves${E}|${L}winkt`,
  nod: `${L}(?:кивает|кивнул)|${L}nods|${L}nickt`,
  "shake-head": `(?:качает|покачал|мотает) головой|shakes? (?:his|her) head|schüttelt den kopf`,
  shrug: `пож(?:имает|ал) плечами|${L}shrugs?${E}|zuckt mit den schultern`,
  bow: `${L}(?:кланя|поклонил)|${L}bows${E}|${L}verbeugt`,
  jump: `${L}(?:прыга|прыгнул|подпрыгн)|${L}jumps|${L}springt`,
  grab: `${L}(?:хватает|схватил)|${L}grabs|${L}(?:packt|schnappt)`,
  turn: `${L}(?:оборачива|обернул)|turns around|dreht sich um`,
};
const actRe = Object.fromEntries(Object.entries(ACT_WORDS).map(([a, re]) => [a, new RegExp(re!, "iu")])) as Record<Act, RegExp>;

/* ---------- правила ---------- */
const sceneLines = (ep: Episode, sc: Scene) => sc.beats.flatMap((b) => (b.type === "line" ? [ep.lines.find((l) => l.id === b.ref)!] : [])).filter(Boolean);

function mentionedOffscreen(ep: Episode): Finding[] {
  const out: Finding[] = [];
  const deictic = DEICTIC[ep.locale] ?? DEICTIC.en;
  ep.scenes.forEach((sc, si) => {
    const present = new Set(Object.values(sc.roles));
    if (sc.cast.length >= 5) return; // места в кадре нет: 5 и больше кукол
    for (const l of sceneLines(ep, sc)) {
      for (const w of ROLE_WORDS) {
        const m = l.text.match(new RegExp(deictic + `(?:${w.re})`, "iu"));
        if (m && !w.roles.some((r) => present.has(r))) {
          out.push({ id: ep.id, rule: "mentioned-offscreen", level: "warn", msg: `scene ${si + 1}, ${l.id} (${l.character}): «${m[0].trim()}» — no ${w.roles[0]} on screen (cast ${sc.cast.length})` });
          break;
        }
      }
    }
  });
  return out;
}

function longLines(ep: Episode): Finding[] {
  return ep.lines.flatMap((l) => {
    const n = captionChunks(l.text, l.character === NARRATOR);
    return n > 1 ? [{ id: ep.id, rule: "long-line" as const, level: n > 2 ? "warn" as const : "info" as const, msg: `${l.id} (${l.character}): shown in ${n} parts (${l.text.length} chars)` }] : [];
  });
}

function noVoice(ep: Episode, A: Assets): Finding[] {
  const out: Finding[] = [];
  const seen = new Set<string>();
  for (const l of ep.lines) {
    if (l.character === NARRATOR || l.audio || seen.has(l.character)) continue;
    const v = A.characters.get(l.character)?.voice?.[ep.locale]?.elevenlabsVoiceId;
    if (!v || v === "TODO") { seen.add(l.character); out.push({ id: ep.id, rule: "no-voice", level: "info", msg: `${l.character} has no ${ep.locale} voice (pnpm voice cast --locale ${ep.locale})` }); }
  }
  return out;
}

/** Метки-сиденья места (с типом сиденья и x). */
function seatMarks(A: Assets, location: string, place?: string) {
  const marks = marksFor(A.locations.get(location), place);
  return Object.entries(marks).flatMap(([k, m]) => { const o = markOf(m)!; return o.seat ? [{ k, x: o.x, z: o.z ?? 0.5, seat: o.seat }] : []; });
}

/** Кто на какой метке стоит после каждого бита (только явные метки). Возвращает конфликты сидений. */
function seatConflicts(ep: Episode, A: Assets) {
  const out: { si: number; bi: number; who: string; mark: string; other: string }[] = [];
  ep.scenes.forEach((sc, si) => {
    const seats = new Set(seatMarks(A, sc.location, sc.place).map((s) => s.k));
    if (!seats.size) return;
    const at = new Map<string, string>();
    sc.beats.forEach((b, bi) => {
      if (b.type !== "move" || sc.split?.cast.includes(b.who)) return;
      if (b.to.startsWith("off-") || b.to === "auto") { at.delete(b.who); return; }
      const other = [...at.entries()].find(([w, mk]) => w !== b.who && mk === b.to)?.[0];
      if (other && seats.has(b.to)) out.push({ si, bi, who: b.who, mark: b.to, other });
      at.set(b.who, b.to);
    });
  });
  return out;
}
function seatShared(ep: Episode, A: Assets): Finding[] {
  return seatConflicts(ep, A).map((c) => ({ id: ep.id, rule: "seat-shared" as const, level: "error" as const, fixable: true, msg: `scene ${c.si + 1}: ${c.who} sits on "${c.mark}" taken by ${c.other}` }));
}

/** Машина перед говорящим: по скомпилированному исполнению (кадры, где говорит, а машина ближе к камере и закрывает его по x). */
function vehicleCovers(ep: Episode): Finding[] {
  if (!ep.scenes.some((s) => s.vehicles?.length)) return [];
  const p = compileEpisode(ep);
  const out: Finding[] = [];
  for (const sc of p.scenes) for (const v of sc.views) {
    if (!v.vehicles.length || !sc.shown) continue;
    const f0 = Math.round(sc.shown[0] * p.fps), f1 = Math.round(sc.shown[1] * p.fps);
    const bad = new Map<string, number>();
    for (let f = f0; f <= f1; f++) {
      const t = sec(f, p.fps);
      for (const a of v.actors) {
        if (sampleStep(a.tracks.mode, t) !== "stage" || !sampleStep(a.tracks.speaking, t)) continue;
        const az = sampleLin(a.tracks.z, t), ax = sampleLin(a.tracks.x, t), aw = sampleLin(a.tracks.w, t);
        for (const veh of v.vehicles) {
          if (!sampleStep(veh.tracks.present, t)) continue;
          // рисуется позже (поверх), если его план ближе к камере: z машины + 0.02 < z куклы
          if (veh.z + 0.02 >= az) continue;
          const vw = VEHICLE_SPECS[veh.kind as keyof typeof VEHICLE_SPECS].w * veh.s;
          if (Math.abs(sampleLin(veh.tracks.x, t) - ax) < vw / 2 + aw * 0.15) bad.set(`${a.id}/${veh.id}`, (bad.get(`${a.id}/${veh.id}`) ?? 0) + 1);
        }
      }
    }
    for (const [k, n] of bad) if (n >= 10) out.push({ id: ep.id, rule: "vehicle-covers", level: "warn", msg: `scene ${sc.index + 1}: ${k.split("/")[1]} covers ${k.split("/")[0]} while speaking (${(n / p.fps).toFixed(1)} s)` });
  }
  return out;
}

/** Бит act сразу после реплики рассказчика, которая это действие называет (действие должно идти во время неё). */
function lateActs(ep: Episode) {
  const out: { si: number; lineBi: number; actBi: number; act: Act; line: string }[] = [];
  ep.scenes.forEach((sc, si) => {
    sc.beats.forEach((b, bi) => {
      if (b.type !== "line") return;
      const l = ep.lines.find((x) => x.id === b.ref);
      if (!l || l.character !== NARRATOR) return;
      // биты между этой репликой и следующей
      for (let j = bi + 1; j < sc.beats.length && sc.beats[j].type !== "line"; j++) {
        const a = sc.beats[j];
        if (a.type !== "act" || !actRe[a.act]?.test(l.text)) continue;
        // действие идёт во время следующей реплики — если и она его называет («Стучит, стучит…»), всё на месте
        const next = sc.beats.slice(j + 1).find((x) => x.type === "line");
        const nextLine = next && next.type === "line" ? ep.lines.find((x) => x.id === next.ref) : undefined;
        if (nextLine && actRe[a.act].test(nextLine.text)) continue;
        // то же действие той же куклы уже стоит перед репликой — не трогаем
        const prevLine = sc.beats.slice(0, bi).map((x) => x.type).lastIndexOf("line");
        if (sc.beats.slice(prevLine + 1, bi).some((x) => x.type === "act" && x.act === a.act && x.who === a.who)) continue;
        out.push({ si, lineBi: bi, actBi: j, act: a.act, line: l.id });
      }
    });
  });
  return out;
}
function actAfterLine(ep: Episode): Finding[] {
  return lateActs(ep).map((x) => ({ id: ep.id, rule: "act-after-line" as const, level: "warn" as const, fixable: true, msg: `scene ${x.si + 1}: act "${x.act}" comes after ${x.line} that names it` }));
}

export function lintEpisode(ep: Episode, A: Assets): Finding[] {
  // у озвученного эпизода длинная реплика — только сведения: переписывать текст значит переозвучивать (платно)
  const voiced = ep.lines.some((l) => l.audio);
  const longs = longLines(ep).map((f) => (voiced ? { ...f, level: "info" as const, msg: `${f.msg}; voiced — keep` } : { ...f, fixable: f.level === "warn" }));
  return [...mentionedOffscreen(ep), ...longs, ...noVoice(ep, A), ...seatShared(ep, A), ...vehicleCovers(ep), ...actAfterLine(ep)];
}

/* ---------- исправления ---------- */
/** Делит длинную реплику на две по границе предложения (иначе по запятой/тире), ближайшей к середине: обе части — тем же голосом, подряд, слова не меняются. */
function splitAt(text: string): [string, string] | undefined {
  let cuts = [...text.matchAll(/[.!?…]+["»”]?\s+(?=[\p{Lu}«"„—–-])/gu)].map((m) => m.index! + m[0].length);
  // нет границы предложения — по запятой, точке с запятой или тире ближе к середине (слова те же)
  if (!cuts.length) cuts = [...text.matchAll(/(?:[,;:]|\s[—–])\s+/gu)].map((m) => m.index! + m[0].length).filter((c) => c > text.length * 0.25 && c < text.length * 0.75);
  if (!cuts.length) return undefined;
  const mid = text.length / 2;
  const at = cuts.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
  const a = text.slice(0, at).trim(), b = text.slice(at).trim();
  return a && b ? [a, b] : undefined;
}

/**
 * Исправления по правилам (без LLM), детерминированно: те же применяет materialize.
 * Возвращает новый эпизод и список исправленного.
 */
export function fixEpisode(ep0: Episode, A: Assets, opts: { textFixes?: boolean } = {}): { ep: Episode; fixed: Finding[] } {
  const ep: Episode = JSON.parse(JSON.stringify(ep0));
  const fixed: Finding[] = [];
  // 1. сиденье занято: второй садится на ближайшее свободное сиденье того же места (сначала того же вида)
  for (let guard = 0; guard < 20; guard++) {
    const c = seatConflicts(ep, A)[0];
    if (!c) break;
    const sc = ep.scenes[c.si];
    const seats = seatMarks(A, sc.location, sc.place);
    const cur = seats.find((s) => s.k === c.mark)!;
    // занятые к этому моменту и потом (чтобы не создать новый конфликт): все метки, куда ходят в сцене
    const used = new Set(sc.beats.flatMap((b) => (b.type === "move" ? [b.to] : [])));
    const free = seats.filter((s) => !used.has(s.k)).sort((a, b) => (a.seat === cur.seat ? 0 : 1) - (b.seat === cur.seat ? 0 : 1) || Math.abs(a.x - cur.x) - Math.abs(b.x - cur.x));
    if (!free.length) break;
    (sc.beats[c.bi] as Extract<Beat, { type: "move" }>).to = free[0].k;
    fixed.push({ id: ep.id, rule: "seat-shared", level: "error", msg: `scene ${c.si + 1}: ${c.who} "${c.mark}" → "${free[0].k}" (${c.other} sits there)` });
  }
  // 2. действие после реплики, которая его называет: бит act переносится перед реплику
  for (let guard = 0; guard < 50; guard++) {
    const x = lateActs(ep)[0];
    if (!x) break;
    const beats = ep.scenes[x.si].beats;
    const [a] = beats.splice(x.actBi, 1);
    beats.splice(x.lineBi, 0, a);
    fixed.push({ id: ep.id, rule: "act-after-line", level: "warn", msg: `scene ${x.si + 1}: act "${x.act}" moved before ${x.line}` });
  }
  // 3. длинная реплика (больше двух кусков субтитров): делим по границе предложения — только у неозвученных эпизодов
  // textFixes: false — эпизод уже озвучен (materialize передаёт это по прежней версии файла)
  if (opts.textFixes ?? !ep.lines.some((l) => l.audio)) {
    for (let i = 0; i < ep.lines.length; i++) {
      const l = ep.lines[i];
      if (captionChunks(l.text, l.character === NARRATOR) <= 2) continue;
      const parts = splitAt(l.text);
      if (!parts) continue;
      // id второй части: l3 → l3b (l3c, …, если часть делится ещё раз)
      const base = l.id.replace(/[b-z]$/, "");
      const id2 = [..."bcdefghijklmnopqrstuvwxyz"].map((c) => `${base}${c}`).find((x) => !ep.lines.some((y) => y.id === x))!;
      const second: typeof l = { ...l, id: id2, text: parts[1], uncensored: undefined };
      if (l.uncensored) {
        const up = splitAt(l.uncensored);
        if (!up) continue; // версию без цензуры не разделить так же — оставляем LLM
        second.uncensored = up[1];
        l.uncensored = up[0];
      }
      l.text = parts[0];
      // пауза и смех — после второй части
      second.pauseAfterSec = l.pauseAfterSec; second.laugh = l.laugh;
      l.pauseAfterSec = 0.15; delete l.laugh;
      ep.lines.splice(i + 1, 0, second);
      for (const sc of ep.scenes) {
        const bi = sc.beats.findIndex((b) => b.type === "line" && b.ref === l.id);
        if (bi >= 0) sc.beats.splice(bi + 1, 0, { type: "line", ref: id2 });
      }
      fixed.push({ id: ep.id, rule: "long-line", level: "warn", msg: `${l.id} split in two: «${parts[0].slice(0, 30)}…» + «${parts[1].slice(0, 30)}…»` });
      i--; // первая часть может всё ещё быть длинной — проверить её снова
    }
  }
  return { ep: Episode.parse(ep), fixed };
}

/* ---------- CLI ---------- */
function main() {
  const { values, positionals } = parseArgs({
    options: { debug: { type: "boolean" }, all: { type: "boolean" }, fix: { type: "boolean" }, "dry-run": { type: "boolean" }, json: { type: "boolean" }, redo: { type: "boolean" }, rule: { type: "string" }, examples: { type: "string" } },
    allowPositionals: true,
  });
  const ids = values.all || (!positionals.length && !values.debug)
    ? dir("episodes").map((f) => f.replace(/\.json$/, ""))
    : values.debug ? debugSet() : positionals;
  const A = lintAssets();
  const all: Finding[] = [];
  const fixedAll: Finding[] = [];
  for (const id of ids) {
    const file = join(ROOT, "content/episodes", `${id}.json`);
    let ep = Episode.parse(readJson(file));
    if (values.fix || values["dry-run"]) {
      const r = fixEpisode(ep, A);
      if (r.fixed.length) {
        if (values.fix) writeFileSync(file, JSON.stringify(r.ep, null, 2) + "\n");
        fixedAll.push(...r.fixed); ep = r.ep;
      }
    }
    all.push(...lintEpisode(ep, A).filter((f) => !values.rule || f.rule === values.rule));
  }
  if (values.json) { console.log(JSON.stringify({ findings: all, fixed: fixedAll }, null, 2)); return; }
  const n = Number(values.examples ?? (ids.length <= 30 ? 1000 : 3));
  const rules = [...new Set(all.map((f) => f.rule))];
  if (fixedAll.length) {
    console.log(`${values.fix ? "fixed" : "would fix (dry run)"} ${fixedAll.length} in ${new Set(fixedAll.map((f) => f.id)).size} episodes:`);
    for (const r of new Set(fixedAll.map((f) => f.rule))) {
      const xs = fixedAll.filter((f) => f.rule === r);
      console.log(`  ${r}: ${xs.length}`);
      for (const f of xs.slice(0, n)) console.log(`    ${f.id}: ${f.msg}`);
    }
  }
  for (const r of rules) {
    const xs = all.filter((f) => f.rule === r);
    const byLevel = ["error", "warn", "info"].map((l) => [l, xs.filter((f) => f.level === l).length] as const).filter(([, k]) => k).map(([l, k]) => `${k} ${l}`).join(", ");
    console.log(`\n${r}: ${xs.length} in ${new Set(xs.map((f) => f.id)).size} episodes (${byLevel})`);
    for (const f of xs.filter((f) => f.level !== "info").slice(0, n)) console.log(`  ${f.id}: ${f.msg}`);
  }
  const redo = [...new Set(all.filter((f) => REDO_RULES.includes(f.rule) && f.level !== "info").map((f) => f.id))];
  console.log(`\n${ids.length} episodes: ${new Set(all.filter((f) => f.level !== "info").map((f) => f.id)).size} with warnings/errors; ${redo.length} need an LLM rewrite`);
  if (values.redo) {
    const p = join(ROOT, "data/llm/script/lint-redo.txt");
    writeFileSync(p, redo.join("\n") + "\n");
    console.log(`→ ${p} (append to redo.txt to rewrite them: pnpm llm prepare script)`);
  }
  process.exitCode = all.some((f) => f.level === "error") ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
