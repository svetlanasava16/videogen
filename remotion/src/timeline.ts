import {
  AudioLibrary, estimateWords, laughs, lineDuration, orderedLines, pick, scenesOf,
  type AudioClip, type CrowdReact, type Episode, type Scene, type Shot, type WordTiming,
} from "@jf/core";
import audioData from "../../content/audio.json";

const clips = AudioLibrary.parse(audioData).clips;

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
  /** Индекс сцены. */
  scene: number;
  /** Последняя реплика эпизода (панчлайн). */
  punch: boolean;
};

/**
 * Перемещение куклы в сцене:
 * enter — появляется (0→1) у края или у метки; exit — уходит (1→0) за край; walk — идёт к метке, оставаясь в кадре.
 * target: "slot" — автослот (старый формат), иначе id метки места.
 */
export type Move = { id: string; from: number; to: number; kind: "enter" | "exit" | "walk"; target: string; edge?: "left" | "right" };

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
};

/** Реакция массовки: с кадра from до to. */
export type CrowdEvent = { react: CrowdReact; from: number; to: number };
/** Сколько длится реакция массовки (секунды, сдвигает таймлайн). */
const CROWD_SEC: Record<CrowdReact, number> = { scream: 1.2, gasp: 0.7, laugh: 1.2, cheer: 1.2, murmur: 1.0, calm: 0.6 };

/** Звук на таймлайне: смех, эффект или музыка (кадры). */
export type Cue = { clip: AudioClip; from: number; frames: number };

export const LEAD_IN_SEC = 0.3;
export const TAIL_SEC = 1.0;
export const WALK_SEC = 0.7;
const PROP_SEC = 0.35;
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

    // кто начинает за кадром: первое событие — вход
    const first = new Map<string, "in" | "out">();
    for (const b of sc.beats) {
      if (b.type === "line") {
        const l = byId.get(b.ref);
        for (const id of l?.enter ?? []) if (!first.has(id)) first.set(id, "in");
        if (l && !first.has(l.character)) first.set(l.character, "out");
      } else if (b.type === "move" && !first.has(b.who)) first.set(b.who, b.from ? "in" : "out");
    }
    const startsOn = new Set(sc.cast.filter((id) => first.get(id) !== "in"));

    let started = false; // была ли уже реплика/пауза: move до неё — расстановка без ходьбы
    for (const b of sc.beats) {
      if (b.type === "line" || b.type === "pause") started = true;
      if (b.type === "line") {
        const l = byId.get(b.ref);
        if (!l) continue;
        if (l.enter.length) {
          for (const id of l.enter) moves.push({ id, from: f(t), to: f(t + WALK_SEC), kind: "enter", target: "slot" });
          t += WALK_SEC;
        }
        // без цензуры — только для неозвученных реплик (озвучена чистая версия)
        const shown = ep.explicit && !l.audio && l.uncensored ? l.uncensored : l.text;
        const words: WordTiming[] = l.audio ? l.audio.words : estimateWords(shown);
        const dur = lineDuration(l);
        lines.push({
          id: l.id, character: l.character, text: shown, emotion: l.emotion,
          startFrame: f(t), endFrame: f(t + dur),
          words: words.map((w) => ({ text: w.text, startFrame: f(t + w.start), endFrame: f(t + w.end) })),
          audioFile: l.audio?.file, scene: si, punch: l.id === lastLineId,
        });
        t += dur;
        if (l.id === lastLineId) punchEnd = t;
        // если персонажи смеются сами, закадровый смех после панчлайна не нужен
        const want = hasOutro && l.id === lastLineId ? undefined : laughOf.get(l.id);
        const clip = want ? pick(laughPool.filter((c) => c.intensity === want), `${ep.id}:${l.id}`) ?? pick(laughPool, `${ep.id}:${l.id}`) : undefined;
        let gap = 0;
        if (clip) {
          laughCues.push({ clip, from: f(t + 0.1), frames: f(clip.durationSec) });
          laughEnd = Math.max(laughEnd, t + 0.1 + clip.durationSec);
          gap = l.id !== lastLineId ? clip.durationSec * LAUGH_GAP : 0;
        }
        if (l.exit.length) {
          for (const id of l.exit) moves.push({ id, from: f(t + 0.15), to: f(t + 0.15 + WALK_SEC), kind: "exit", target: "slot" });
          t += WALK_SEC + 0.15;
        }
        t += Math.max(l.pauseAfterSec, gap);
      } else if (b.type === "move" && !started && !b.from && !b.to.startsWith("off-")) {
        // начальная расстановка: кукла сразу стоит на метке
        moves.push({ id: b.who, from: f(t) - 1, to: f(t) - 1, kind: "walk", target: b.to });
      } else if (b.type === "move") {
        const off = b.to.startsWith("off-");
        moves.push({
          id: b.who, from: f(t), to: f(t + WALK_SEC),
          kind: b.from ? "enter" : off ? "exit" : "walk",
          target: off ? "slot" : b.to,
          edge: b.from ? (b.from === "off-left" ? "left" : "right") : off ? (b.to === "off-left" ? "left" : "right") : undefined,
        });
        t += WALK_SEC;
      } else if (b.type === "prop") {
        props.push({ who: b.who, item: b.item, action: b.action, to: b.to, frame: f(t) });
        t += PROP_SEC;
      } else if (b.type === "camera") {
        shots.push({ frame: f(t), shot: b.shot, on: b.on, auto: false });
      } else if (b.type === "sfx") {
        const clip = clips.find((c) => c.id === b.id);
        if (clip) sfxCues.push({ clip, from: f(t), frames: f(clip.durationSec) });
      } else if (b.type === "pause") {
        t += b.sec;
      } else if (b.type === "crowd") {
        started = true;
        const sec = CROWD_SEC[b.react];
        crowd.push({ react: b.react, from: f(t), to: f(t + sec) });
        // звук реакции, если есть в библиотеке (sfx crowd-<react>)
        const clip = clips.find((c) => c.id === `crowd-${b.react}`);
        if (clip) sfxCues.push({ clip, from: f(t), frames: f(clip.durationSec) });
        t += sec;
      }
    }
    const next = scenesOf(ep)[si + 1];
    if (next) t += TRANSITION_SEC[next.transition] / 2;
    return { index: si, scene: sc, from, to: f(t), transition: { kind: sc.transition, frames: f(trans) }, startsOn, moves, props, shots, crowd };
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

  /** Смеётся ли кукла сейчас (смех в конце). */
  const laughing = (id: string, frame: number) => outro.some((o) => o.character === id && frame >= o.from && frame <= o.from + o.frames);

  const music = musicFor(ep);
  return { lines, scenes, sceneAt, presence, holding, laughing, laughs: laughCues, sfx: sfxCues, outro, music, durationInFrames };
}

export type Timeline = ReturnType<typeof buildTimeline>;
