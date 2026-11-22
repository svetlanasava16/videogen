/**
 * Скомпилированный эпизод — performance.json (ROADMAP §5). Время — в секундах.
 * Всё, что решает постановка (где стоит кукла, поза, рот, камера, субтитр, какие звуки), здесь уже посчитано;
 * проигрыватель (perf/Play.tsx, позже packages/player) только читает треки и рисует.
 */
import type { Act, Crowd, Emotion, Locale, Look, SetItem, Shot } from "@jf/core";
import type { LinTrack, StepTrack } from "./tracks";

export const PERF_VERSION = 1;

/** Как кукла видна: на сцене, в машине (седок) или нет в кадре. */
export type ActorMode = "stage" | "vehicle" | "off";

export type ActorTracks = {
  mode: StepTrack<ActorMode>;
  /** Бокс куклы, px холста сцены: центр x, верх, ширина, высота; z — план глубины (порядок отрисовки). */
  x: LinTrack; top: LinTrack; w: LinTrack; h: LinTrack; z: LinTrack;
  walk: LinTrack; seated: LinTrack; bed: LinTrack; flinch: LinTrack;
  facing: StepTrack<1 | -1>;
  /** Рот двигается (звучит слово или смеётся). */
  speaking: StepTrack<boolean>;
  emotion: StepTrack<Emotion>;
  hold: StepTrack<string | null>;
  /** Жест и поза-состояние: имя, сила k и начало (секунды): время позы t = (кадр − начало) / fps, как в постановке. */
  act: StepTrack<Act | null>; actK: LinTrack; actStart: StepTrack<number | null>;
  base: StepTrack<Act | null>; baseK: LinTrack; baseStart: StepTrack<number | null>;
  /** Зерно разброса анимации (моргание, речь) — как в покадровой постановке. */
  seed: StepTrack<number>;
};
export type PerfActor = { id: string; look: Look; tracks: ActorTracks };

export type PerfVehicle = {
  id: string; kind: string; color?: string;
  /** План и масштаб (постоянны в сцене). */
  z: number; s: number;
  tracks: { present: StepTrack<boolean>; x: LinTrack; facing: StepTrack<1 | -1>; moving: StepTrack<boolean>; wheelT: LinTrack; riders: StepTrack<string[]> };
};

export type PerfCrowdEvent = { react: "scream" | "gasp" | "laugh" | "cheer" | "murmur" | "calm" | "flee"; from: number; to: number };

/** Положенный или уроненный предмет: лежит с from до until (или до конца сцены). */
export type PerfProp = { item: string; from: number; until?: number; x: number; surface: number; u: number; z: number };
export type PerfSet = { it: SetItem; x: number; z: number; floorY: number; k: number };

/** Вид сцены: обычная сцена — один, разделённый экран — два (top/bottom). */
export type PerfView = {
  half?: "top" | "bottom";
  location: string; place?: string;
  stageW: number; bgScale: number; floorY: number; heroH: number;
  /** Передний слой фона (стойка, стол, одеяло) и его план. */
  frontZ?: number;
  /** Массовка у стены (своя сцены или сублокации) и зрители спиной к нам (crowd.at = "front"); события — в секундах. */
  crowd?: { spec: Crowd; seed: string; events: PerfCrowdEvent[] };
  crowdFront?: { spec: Crowd; seed: string; events: PerfCrowdEvent[] };
  sets: PerfSet[];
  props: PerfProp[];
  shakes: { from: number; to: number; strength: "light" | "strong" }[];
  camera: { scale: LinTrack; fx: LinTrack; fy: LinTrack };
  actors: PerfActor[];
  vehicles: PerfVehicle[];
};

export type PerfScene = {
  index: number; from: number; to: number;
  /** Первый и последний кадр (в секундах), когда сцена на экране (переходы перекрывают стыки). */
  shown?: [number, number];
  location: string; place?: string;
  transition: { kind: "cut" | "wipe" | "flyover"; sec: number };
  split: boolean;
  views: PerfView[];
};

export type PerfWord = { text: string; from: number; to: number };
export type PerfLine = {
  id: string; character: string; text: string; emotion: Emotion; scene: number;
  from: number; to: number; words: PerfWord[];
  offscreen?: boolean; punch: boolean;
  audio?: { file: string; from: number; rate: number };
};
export type PerfCue = { file: string; from: number; dur: number };

export type Performance = {
  v: number; id: string; locale: Locale;
  fps: number; frames: number; duration: number; width: number; height: number;
  scenes: PerfScene[];
  captions: PerfLine[];
  audio: { music?: string; outro: (PerfCue & { character: string })[]; sfx: PerfCue[]; laughs: PerfCue[] };
  /** Явные планы камеры из сценария (для справки и будущего плеера; кадр камеры уже в треках видов). */
  shots?: { scene: number; t: number; shot: Shot; on?: string }[];
};
