import {
  AudioLibrary, VoiceConfig, estimateWords, laughs, lineDuration, orderedLines, pick, scenesOf,
  STATE_ACTS, TARGET_ACTS, type Act, type AudioClip, type Beat, type CrowdReact, type Episode, type Scene, type Shot, type WordTiming,
} from "@jf/core";
import audioData from "../../content/audio.json";
import voicesData from "../../content/voices.json";
import { VEHICLE_SPECS } from "./world/Vehicles";
import { PLANES } from "@jf/core";

const clips = AudioLibrary.parse(audioData).clips;
/** Темп озвучки (content/voices.json → tempo): рассказчик и персонажи. */
const TEMPO = VoiceConfig.parse(voicesData).tempo;

export type TimedLine = {
  id: string;
  character: string;
  text: string;
  emotion: Episode["lines"][number]["emotion"];
  startFrame: number;
  endFrame: number; // конец речи (без паузы)
  words: { text: string; startFrame: number; endFrame: number }[];
  /** Файл озвучки (относительно public/), если реплика озвучена. */
  audioFile?: string;
  /** С какого кадра играть mp3 (раньше startFrame на тишину в начале файла). */
  audioFrom?: number;
  /** Индекс сцены. */
  scene: number;
  /** Последняя реплика эпизода (панчлайн). */
  punch: boolean;
  /** Голос из-за кадра: говорящего не видно. */
  offscreen?: boolean;
  /** Скорость воспроизведения озвучки (темп рассказчика/персонажей). */
  rate: number;
};

/**
 * Перемещение куклы в сцене:
 * enter — появляется (0→1) у края или у метки; exit — уходит (1→0) за край; walk — идёт к метке, оставаясь в кадре.
 * target: "slot" — автослот (старый формат), иначе id метки места.
 */
export type Move = {
  id: string; from: number; to: number; kind: "enter" | "exit" | "walk"; target: string; edge?: "left" | "right";
  /** План, на который встаёт кукла (z), если задан битом (иначе план метки); via — обход впереди или за спинами. */
  z?: number; via?: "front" | "back";
};
/**
 * Машина сцены (scene.vehicles): едет к метке (drive), въезжает (enter) или уезжает (exit) за край.
 * target — метка или "slot" (для уезда); edge — край.
 */
export type Drive = { vehicle: string; from: number; to: number; kind: "enter" | "exit" | "drive"; target: string; edge?: "left" | "right" };
/** Посадка и высадка: с кадра frame кукла едет в машине (board) или уже снаружи у двери (alight). */
export type Ride = { who: string; vehicle: string; frame: number; kind: "board" | "alight" };

/** Реквизит: событие в кадре (взять, отдать, уронить, положить). */
export type PropEvent = { who: string; item: string; action: "hold" | "give" | "drop" | "put"; to?: string; frame: number };

/** План камеры с кадра frame. auto — выставлен режиссурой, иначе — битом сценария. */
export type CameraShot = { frame: number; shot: Shot; on?: string; auto: boolean; push?: boolean };

export type SceneTL = {
  index: number;
  scene: Scene;
  from: number;
  to: number;
  /** Переход перед сценой (кадры, перекрывают стык). */
  transition: { kind: Scene["transition"]; frames: number };
  startsOn: Set<string>;
  moves: Move[];
  props: PropEvent[];
  shots: CameraShot[];
  /** Реакции массовки (кадры). */
  crowd: CrowdEvent[];
  /** Тряска кадра (кадры). */
  shakes: { from: number; to: number; strength: "light" | "strong" }[];
  /** Действия кукол (кадры; to_ = Infinity — поза держится). */
  acts: ActEvent[];
  /** Машины: поездки (кадры) и посадки/высадки. */
  drives: Drive[];
  rides: Ride[];
};

/** Действие куклы: act с кадра from до to_ (Infinity — до следующего действия или stand). */
export type ActEvent = { who: string; act: Act; to?: string; from: number; to_: number };

/** Реакция массовки: с кадра from до to. */
export type CrowdEvent = { react: CrowdReact; from: number; to: number };
/** Сколько длится реакция массовки (секунды, сдвигает таймлайн). */
const CROWD_SEC: Record<CrowdReact, number> = { scream: 1.2, gasp: 0.7, laugh: 1.2, cheer: 1.2, murmur: 1.0, calm: 0.6, flee: 1.4 };

/** Звук на таймлайне: смех, эффект или музыка (кадры). */
export type Cue = { clip: AudioClip; from: number; frames: number };

export const LEAD_IN_SEC = 0.3;
export const TAIL_SEC = 1.0;
export const WALK_SEC = 0.7;
const PROP_SEC = 0.35;
/** Пауза между репликами и перед панчлайном (секунды): живой рассказ без провалов. */
const GAP_SEC = 0.08;
const PUNCH_GAP_SEC = 0.25;
/** Действие по умолчанию длится; подойти к цели. */
const ACT_SEC = 1.2;
const APPROACH_SEC = 0.45;
/** Подойти к двери машины и сесть. */
const BOARD_SEC = 0.8;
/** Длительность перехода между сценами (перекрытие стыка). */
export const TRANSITION_SEC: Record<Scene["transition"], number> = { cut: 0, wipe: 0.5, flyover: 1.6 };
/** Смех персонажей в конце: начинается после панчлайна, второй вступает чуть позже первого. */
const OUTRO_DELAY_SEC = 0.25;
const OUTRO_STAGGER_SEC = 0.2;

/** Смех куклы в конце (кадры). */
export type OutroLaugh = { character: string; file: string; from: number; frames: number };
/** Какая доля смеха звучит в паузе (хвост накладывается на следующую реплику). */
const LAUGH_GAP = 0.6;

/** Музыка эпизода: явная, "none" или выбор по id из библиотеки. */
export function musicFor(ep: Episode): AudioClip | undefined {
  if (ep.music === "none") return undefined;
  const pool = clips.filter((c) => c.kind === "music");
  return ep.music ? pool.find((c) => c.id === ep.music) : pick(pool, ep.id);
}

export function buildTimeline(ep: Episode) {
  const fps = ep.format.fps;
  /** Плавный вход/выход позы действия (кадры). */
  const ACT_RAMP_F = Math.round(0.18 * fps);
  const f = (sec: number) => Math.round(sec * fps);
  const byId = new Map(ep.lines.map((l) => [l.id, l]));
  const order = orderedLines(ep);
  const laughMarks = laughs(order);
  const laughOf = new Map(order.map((l, i) => [l.id, laughMarks[i]]));
  const lastLineId = order[order.length - 1]?.id;
  const laughPool = clips.filter((c) => c.kind === "laugh");
  const hasOutro = ep.outroLaughs.length > 0;

  const lines: TimedLine[] = [];
  const laughCues: Cue[] = [];
  const sfxCues: Cue[] = [];
  let laughEnd = 0;
  let punchEnd = 0;
  let t = LEAD_IN_SEC;

  const scenes: SceneTL[] = scenesOf(ep).map((sc, si) => {
    const trans = si === 0 ? 0 : TRANSITION_SEC[sc.transition];
    if (si > 0) t += trans / 2; // вторая половина перехода — уже в новой сцене
    const from = si === 0 ? 0 : f(t - trans / 2);
    const moves: Move[] = [];
    const props: PropEvent[] = [];
    const shots: CameraShot[] = [];
    const crowd: CrowdEvent[] = [];
    const shakes: SceneTL["shakes"] = [];
    const drives: Drive[] = [];
    const rides: Ride[] = [];

    // кто начинает за кадром: первое событие — вход
    const first = new Map<string, "in" | "out">();
    for (const b of sc.beats) {
      if (b.type === "line") {
        const l = byId.get(b.ref);
        for (const id of l?.enter ?? []) if (!first.has(id)) first.set(id, "in");
        if (l && !l.offscreen && !first.has(l.character)) first.set(l.character, "out");
      } else if (b.type === "move" && !first.has(b.who)) first.set(b.who, b.from ? "in" : "out");
    }
    // голос из-за кадра без других событий — кукла не стоит в кадре
    const voiceOnly = new Set(sc.beats.flatMap((b) => (b.type === "line" && byId.get(b.ref)?.offscreen ? [byId.get(b.ref)!.character] : [])).filter((id) => !first.has(id)));
    const startsOn = new Set(sc.cast.filter((id) => first.get(id) !== "in" && !voiceOnly.has(id)));

    let started = false; // была ли уже реплика/пауза: move до неё — расстановка без ходьбы
    const acts: ActEvent[] = [];
    // Не-речевые биты копятся и стартуют вместе со следующей репликой — параллельно с ней и между собой
    // (рассказчик говорит «пилоты заходят» — они заходят в этот момент). Время двигает только речь и pause.
    let pending: Beat[] = [];
    /** Запустить накопленные биты с момента at; одна кукла делает свои шаги по очереди. Возвращает конец самого долгого. */
    const flush = (at: number) => {
      const busy = new Map<string, number>(); // кукла → когда освободится
      let end = at;
      const startOf = (who: string) => Math.max(at, busy.get(who) ?? at);
      const placed = new Set<string>();
      for (const b of pending) {
        if (b.type === "move" && !started && !b.from && !b.to.startsWith("off-") && !placed.has(b.who)) {
          // начальная расстановка: кукла сразу стоит на метке (второй move той же куклы до первой реплики — уже ходьба на первых словах)
          placed.add(b.who);
          moves.push({ id: b.who, from: f(at) - 1, to: f(at) - 1, kind: "walk", target: b.to, z: b.plane ? PLANES[b.plane] : undefined });
        } else if (b.type === "move") {
          const s0 = startOf(b.who);
          const off = b.to.startsWith("off-");
          moves.push({
            id: b.who, from: f(s0), to: f(s0 + WALK_SEC),
            kind: b.from ? "enter" : off ? "exit" : "walk",
            target: off ? "slot" : b.to,
            edge: b.from ? (b.from === "off-left" ? "left" : "right") : off ? (b.to === "off-left" ? "left" : "right") : undefined,
            z: b.plane ? PLANES[b.plane] : undefined, via: b.via,
          });
          busy.set(b.who, s0 + WALK_SEC); end = Math.max(end, s0 + WALK_SEC);
        } else if (b.type === "prop") {
          const s0 = startOf(b.who);
          props.push({ who: b.who, item: b.item, action: b.action, to: b.to, frame: f(s0) });
          busy.set(b.who, s0 + PROP_SEC); end = Math.max(end, s0 + PROP_SEC);
        } else if (b.type === "act") {
          let s0 = startOf(b.who);
          // действие по цели: сначала подойти вплотную (если цель — кукла сцены)
          if (b.to && TARGET_ACTS.includes(b.act) && sc.cast.includes(b.to)) {
            moves.push({ id: b.who, from: f(s0), to: f(s0 + APPROACH_SEC), kind: "walk", target: `near:${b.to}` });
            s0 += APPROACH_SEC;
          }
          const sec = b.sec ?? (STATE_ACTS.includes(b.act) ? Infinity : ACT_SEC);
          acts.push({ who: b.who, act: b.act, to: b.to, from: f(s0), to_: Number.isFinite(sec) ? f(s0 + sec) : Infinity });
          const dur = Number.isFinite(sec) ? sec : 0.6;
          busy.set(b.who, s0 + dur); end = Math.max(end, s0 + dur);
        } else if (b.type === "drive") {
          const v = sc.vehicles?.find((x) => x.id === b.vehicle);
          if (!v) continue;
          const key = `veh:${b.vehicle}`;
          const off = b.to.startsWith("off-");
          if (!started && !b.from && !off) {
            drives.push({ vehicle: b.vehicle, from: f(at) - 1, to: f(at) - 1, kind: "drive", target: b.to });
            continue;
          }
          const sec = VEHICLE_SPECS[v.kind].driveSec;
          const s0 = startOf(key);
          drives.push({
            vehicle: b.vehicle, from: f(s0), to: f(s0 + sec), kind: b.from ? "enter" : off ? "exit" : "drive", target: off ? "slot" : b.to,
            edge: b.from ? (b.from === "off-left" ? "left" : "right") : off ? (b.to === "off-left" ? "left" : "right") : undefined,
          });
          busy.set(key, s0 + sec); end = Math.max(end, s0 + sec);
        } else if (b.type === "board") {
          // подойти к двери машины (после её приезда), затем — внутри
          const s0 = Math.max(startOf(b.who), busy.get(`veh:${b.vehicle}`) ?? at);
          moves.push({ id: b.who, from: f(s0), to: f(s0 + BOARD_SEC), kind: "walk", target: `veh:${b.vehicle}` });
          rides.push({ who: b.who, vehicle: b.vehicle, frame: f(s0 + BOARD_SEC), kind: "board" });
          busy.set(b.who, s0 + BOARD_SEC); busy.set(`veh:${b.vehicle}`, s0 + BOARD_SEC); end = Math.max(end, s0 + BOARD_SEC);
        } else if (b.type === "alight") {
          // выйти у двери (машина сначала доезжает), затем, если задано, пройти к метке
          const s0 = Math.max(startOf(b.who), busy.get(`veh:${b.vehicle}`) ?? at);
          rides.push({ who: b.who, vehicle: b.vehicle, frame: f(s0), kind: "alight" });
          moves.push({ id: b.who, from: f(s0), to: f(s0), kind: "walk", target: `veh:${b.vehicle}` });
          let e = s0 + 0.2;
          if (b.to) { moves.push({ id: b.who, from: f(e), to: f(e + WALK_SEC), kind: "walk", target: b.to }); e += WALK_SEC; }
          busy.set(b.who, e); end = Math.max(end, e);
        } else if (b.type === "camera") {
          shots.push({ frame: f(at), shot: b.shot, on: b.on, auto: false });
        } else if (b.type === "sfx") {
          const clip = clips.find((c) => c.id === b.id);
          if (clip) sfxCues.push({ clip, from: f(at), frames: f(clip.durationSec) });
        } else if (b.type === "shake") {
          shakes.push({ from: f(at), to: f(at + b.sec), strength: b.strength });
        } else if (b.type === "crowd") {
          const sec = CROWD_SEC[b.react];
          crowd.push({ react: b.react, from: f(at), to: f(at + sec) });
          const clip = clips.find((c) => c.id === `crowd-${b.react}`);
          if (clip) sfxCues.push({ clip, from: f(at), frames: f(clip.durationSec) });
          end = Math.max(end, at + sec);
        }
      }
      pending = [];
      return end;
    };

    for (const b of sc.beats) {
      if (b.type === "pause") {
        flush(t);
        started = true;
        t += b.sec;
        continue;
      }
      if (b.type !== "line") { pending.push(b); continue; }
      const l = byId.get(b.ref);
      if (!l) continue;
      // вход на реплике — тоже во время реплики (входит и говорит)
      for (const id of l.enter) moves.push({ id, from: f(t), to: f(t + WALK_SEC), kind: "enter", target: "slot" });
      flush(t);
      started = true;
      // без цензуры — только для неозвученных реплик (озвучена чистая версия)
      const shown = ep.explicit && !l.audio && l.uncensored ? l.uncensored : l.text;
      const rate = l.character === "narrator" ? TEMPO.narrator : TEMPO.characters;
      const raw: WordTiming[] = l.audio ? l.audio.words : estimateWords(shown);
      // тишина в начале и в конце mp3 не в счёт: реплика — от первого до последнего слова
      const lead = l.audio && raw.length ? raw[0].start : 0;
      const speech = l.audio && raw.length ? raw[raw.length - 1].end - lead : lineDuration(l);
      const dur = speech / rate;
      lines.push({
        id: l.id, character: l.character, text: shown, emotion: l.emotion,
        startFrame: f(t), endFrame: f(t + dur),
        words: raw.map((w) => ({ text: w.text, startFrame: f(t + (w.start - lead) / rate), endFrame: f(t + (w.end - lead) / rate) })),
        audioFile: l.audio?.file, audioFrom: f(t - lead / rate), scene: si, punch: l.id === lastLineId, offscreen: l.offscreen, rate,
      });
      t += dur;
      if (l.id === lastLineId) punchEnd = t;
      // закадровый смех звучит поверх, реплики не раздвигает; если персонажи смеются сами — после панчлайна не нужен
      const want = hasOutro && l.id === lastLineId ? undefined : laughOf.get(l.id);
      const clip = want ? pick(laughPool.filter((c) => c.intensity === want), `${ep.id}:${l.id}`) ?? pick(laughPool, `${ep.id}:${l.id}`) : undefined;
      if (clip) {
        laughCues.push({ clip, from: f(t + 0.05), frames: f(clip.durationSec) });
        laughEnd = Math.max(laughEnd, t + 0.05 + clip.durationSec);
      }
      for (const id of l.exit) moves.push({ id, from: f(t), to: f(t + WALK_SEC), kind: "exit", target: "slot" });
      // паузы почти нет: темп живого рассказа; чуть дольше — перед панчлайном
      const nextId = order[order.findIndex((x) => x.id === l.id) + 1]?.id;
      t += l.id === lastLineId ? 0 : nextId === lastLineId ? PUNCH_GAP_SEC : GAP_SEC;
    }
    // биты после последней реплики сцены — в конце сцены, по очереди после речи
    if (pending.length) t = Math.max(t, flush(t));
    const next = scenesOf(ep)[si + 1];
    if (next) t += TRANSITION_SEC[next.transition] / 2;
    return { index: si, scene: sc, from, to: f(t), transition: { kind: sc.transition, frames: f(trans) }, startsOn, moves, props, shots, crowd, shakes, acts, drives, rides };
  });

  const outro: OutroLaugh[] = ep.outroLaughs.map((x, k) => ({
    character: x.character, file: x.file,
    from: f(punchEnd + OUTRO_DELAY_SEC + k * OUTRO_STAGGER_SEC), frames: f(x.durationSec),
  }));
  const outroEnd = outro.reduce((a, o) => Math.max(a, (o.from + o.frames) / fps), 0);
  const endSec = Math.max(t + TAIL_SEC, laughEnd + 0.2, outroEnd + 0.5);
  const durationInFrames = f(endSec);
  const last = scenes[scenes.length - 1];
  if (last) last.to = durationInFrames;

  /** Сцена на кадре. */
  const sceneAt = (frame: number) => scenes.find((s) => frame >= s.from && frame < s.to) ?? last;

  /** Присутствие куклы в кадре 0..1 на кадре frame (в своей сцене). */
  const presence = (sc: SceneTL, id: string, frame: number) => {
    let p = sc.startsOn.has(id) ? 1 : 0;
    for (const m of sc.moves) {
      if (m.id !== id || frame < m.from || m.kind === "walk") continue;
      const k = Math.min(1, (frame - m.from) / Math.max(1, m.to - m.from));
      p = m.kind === "enter" ? k : 1 - k;
    }
    return p;
  };

  /** Что кукла держит на кадре frame. */
  const holding = (sc: SceneTL, id: string, frame: number) => {
    let item: string | undefined;
    for (const e of sc.props) {
      if (e.frame > frame) break;
      if (e.who === id) item = e.action === "hold" ? e.item : undefined;
      if (e.action === "give" && e.to === id) item = e.item;
    }
    return item;
  };

  /**
   * Действия куклы на кадре — два слоя: base — поза-состояние (сидит, на коленях, лежит, закрыл уши),
   * держится до следующего состояния, stand или ходьбы; act — разовый жест поверх неё (кивок, удар, плач).
   * k — сила позы (плавный вход/выход за ACT_RAMP), t — секунды с начала.
   */
  type ActNow = { name: Act; k: number; t: number };
  const actAt = (sc: SceneTL, id: string, frame: number): { act?: ActNow; base?: ActNow } => {
    const mine = sc.acts.filter((a) => a.who === id);
    const ramp = (from: number, endF: number): number => {
      const kIn = Math.min(1, (frame - from) / ACT_RAMP_F);
      const kOut = Number.isFinite(endF) ? Math.min(1, Math.max(0, (endF + ACT_RAMP_F - frame) / ACT_RAMP_F)) : 1;
      return Math.max(0, Math.min(kIn, kOut));
    };
    const isState = (a: ActEvent) => a.act === "stand" || STATE_ACTS.includes(a.act);
    let base: ActNow | undefined;
    const st = mine.filter((a) => isState(a) && a.from <= frame).pop();
    if (st && st.act !== "stand") {
      const nextState = mine.find((a) => isState(a) && a.from > st.from);
      const walk = sc.moves.find((m) => m.id === id && m.from > st.from && m.to !== m.from);
      const endF = Math.min(st.to_, nextState?.from ?? Infinity, walk?.from ?? Infinity);
      // повтор того же состояния (kneel … kneel) — продолжение, а не новый вход в позу
      const states = mine.filter((a) => isState(a) && a.from <= st.from);
      let start = st.from;
      for (let i = states.length - 2; i >= 0 && states[i].act === st.act; i--) {
        if (sc.moves.some((m) => m.id === id && m.from > states[i].from && m.from < start && m.to !== m.from)) break;
        start = states[i].from;
      }
      const k = ramp(start, endF);
      if (k > 0) base = { name: st.act, k, t: (frame - start) / fps };
    }
    let act: ActNow | undefined;
    const g = mine.filter((a) => !isState(a) && a.from <= frame).pop();
    if (g) {
      const next = mine.find((a) => !isState(a) && a.from > g.from);
      const k = ramp(g.from, Math.min(g.to_, next?.from ?? Infinity));
      if (k > 0) act = { name: g.act, k, t: (frame - g.from) / fps };
    }
    return { act, base };
  };
  /** Вздрагивает ли кукла от удара (0..1): чуть позже начала удара по ней, ~0.5 с. */
  const flinchAt = (sc: SceneTL, id: string, frame: number) => {
    let v = 0;
    for (const a of sc.acts) {
      if (a.to !== id || !["slap", "punch", "hit-head", "throw"].includes(a.act)) continue;
      const hit = a.from + Math.round(0.3 * fps);
      const d = frame - hit;
      if (d >= 0 && d < 0.6 * fps) v = Math.max(v, 1 - d / (0.6 * fps));
    }
    return v;
  };
  /** Встала ли кукла (после ходьбы или act stand) — тогда за столом уже не сидит. */
  const standsUp = (sc: SceneTL, id: string, frame: number) =>
    sc.moves.some((m) => m.id === id && m.from <= frame && m.to !== m.from && m.from > sc.from) ||
    sc.acts.some((a) => a.who === id && a.act === "stand" && a.from <= frame);

  /** В какой машине едет кукла на кадре (scene.vehicles[].riders + посадки/высадки) — id машины или undefined. */
  const ridingIn = (sc: SceneTL, id: string, frame: number): string | undefined => {
    let v = sc.scene.vehicles?.find((x) => x.riders.includes(id))?.id;
    for (const r of sc.rides) if (r.who === id && r.frame <= frame) v = r.kind === "board" ? r.vehicle : undefined;
    return v;
  };
  /** Порядок седоков машины на кадре (первый — водитель): места в машине по этому порядку. */
  const ridersOf = (sc: SceneTL, vehicle: string, frame: number): string[] => {
    const v = sc.scene.vehicles?.find((x) => x.id === vehicle);
    const out = [...(v?.riders ?? [])];
    for (const r of [...sc.rides].sort((a, b) => a.frame - b.frame)) {
      if (r.vehicle !== vehicle || r.frame > frame) continue;
      const i = out.indexOf(r.who);
      if (r.kind === "board" && i < 0) out.push(r.who);
      if (r.kind === "alight" && i >= 0) out.splice(i, 1);
    }
    return out;
  };

  /** Смеётся ли кукла сейчас (смех в конце). */
  const laughing = (id: string, frame: number) => outro.some((o) => o.character === id && frame >= o.from && frame <= o.from + o.frames);

  const music = musicFor(ep);
  return { lines, scenes, sceneAt, presence, holding, actAt, flinchAt, standsUp, ridingIn, ridersOf, laughing, laughs: laughCues, sfx: sfxCues, outro, music, durationInFrames };
}

export type Timeline = ReturnType<typeof buildTimeline>;
