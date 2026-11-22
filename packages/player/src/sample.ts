/**
 * Состояние кадра из исполнения: sample(perf, frame) → FrameState. Чистая функция без React и Remotion.
 * Всё, что раньше решал проигрыватель (кто какой сцены на экране, поза куклы, что лежит, порядок отрисовки, камера,
 * тряска, субтитр, переходы), здесь; обёртки (Remotion, веб, позже Pixi) только рисуют FrameState.
 */
import type { Act, Emotion, Look, SetItem } from "@jf/core";
import { frameOf, sampleLin, sampleStep, sec } from "./tracks";
import type { ActorMode, PerfActor, PerfLine, PerfScene, PerfView, Performance } from "./types";

export type Pose = { name: Act; k: number; t: number };
/** Кукла на кадре. Бокс — px холста сцены; t позы — секунды с начала жеста. */
export type ActorState = {
  id: string; look: Look; mode: ActorMode;
  x: number; top: number; w: number; h: number; z: number;
  walk: number; seated: number; bed: number; flinch: number; facing: 1 | -1;
  speaking: boolean; emotion: Emotion; hold?: string; seed: number;
  act?: Pose; base?: Pose;
};
export type VehicleState = { id: string; kind: string; color?: string; z: number; s: number; x: number; facing: 1 | -1; moving: boolean; wheelT: number; riders: string[] };
/** Что рисовать и в каком порядке (дальние раньше): кукла, мебель, лежащий предмет, машина с седоками, передний слой фона. */
export type Drawable =
  | { kind: "actor"; z: number; key: string; id: string }
  | { kind: "set"; z: number; key: string; index: number }
  | { kind: "prop"; z: number; key: string; index: number }
  | { kind: "vehicle"; z: number; key: string; id: string }
  | { kind: "front"; z: number; key: string };
export type Cam = { scale: number; fx: number; fy: number };
export type ViewState = {
  view: PerfView;
  camera: Cam;
  /** Тряска на этом кадре (кадры начала и конца). */
  shake?: { from: number; to: number; strength: "light" | "strong" };
  actors: Map<string, ActorState>;
  vehicles: Map<string, VehicleState>;
  draw: Drawable[];
  /** События массовки в кадрах. */
  crowdEvents: { react: "scream" | "gasp" | "laugh" | "cheer" | "murmur" | "calm" | "flee"; from: number; to: number }[];
};
/** Реплика в кадрах (для субтитров-караоке). */
export type CaptionLine = {
  id: string; character: string; text: string; emotion: Emotion; scene: number; punch: boolean; offscreen?: boolean; rate: number;
  startFrame: number; endFrame: number; words: { text: string; startFrame: number; endFrame: number }[];
};
export type Transition = { index: number; at: number; frames: number; kind: "cut" | "wipe" | "flyover"; from: { location: string; place?: string }; to: { location: string; place?: string } };
export type FrameState = {
  frame: number; t: number;
  scene: PerfScene;
  views: ViewState[];
  /** Текущая реплика (субтитр): до конца речи + 4 кадра. */
  caption?: CaptionLine;
  /** Переходы между сценами (рисуются, когда кадр в их окне). */
  transitions: Transition[];
};

/** Реплики в кадрах (одни и те же для всего ролика). */
export const captionLines = (perf: Performance): CaptionLine[] =>
  perf.captions.map((l: PerfLine) => ({
    id: l.id, character: l.character, text: l.text, emotion: l.emotion, scene: l.scene, punch: l.punch, offscreen: l.offscreen,
    rate: l.audio?.rate ?? 1, startFrame: frameOf(l.from, perf.fps), endFrame: frameOf(l.to, perf.fps),
    words: l.words.map((w) => ({ text: w.text, startFrame: frameOf(w.from, perf.fps), endFrame: frameOf(w.to, perf.fps) })),
  }));

function actorAt(a: PerfActor, time: number, frame: number, fps: number): ActorState {
  const T = a.tracks, L = (k: keyof typeof T) => sampleLin(T[k] as never, time);
  const act = sampleStep(T.act, time), base = sampleStep(T.base, time);
  // время позы — от начала жеста, в кадрах, как в постановке (не интерполируется)
  const since = (start: number | null) => (frame - frameOf(start ?? 0, fps)) / fps;
  return {
    id: a.id, look: a.look, mode: sampleStep(T.mode, time),
    x: L("x"), top: L("top"), w: L("w"), h: L("h"), z: L("z"),
    walk: L("walk"), seated: L("seated"), bed: L("bed"), flinch: L("flinch"),
    facing: sampleStep(T.facing, time), speaking: sampleStep(T.speaking, time), emotion: sampleStep(T.emotion, time),
    hold: sampleStep(T.hold, time) ?? undefined, seed: sampleStep(T.seed, time),
    act: act ? { name: act, k: L("actK"), t: since(sampleStep(T.actStart, time)) } : undefined,
    base: base ? { name: base, k: L("baseK"), t: since(sampleStep(T.baseStart, time)) } : undefined,
  };
}

/** Вид сцены на кадре: состояния кукол и машин, видимые предметы, порядок отрисовки, камера. */
function viewAt(view: PerfView, frame: number, fps: number, frontLayer: (it: SetItem) => boolean): ViewState {
  const time = sec(frame, fps);
  const actors = new Map(view.actors.map((a) => [a.id, actorAt(a, time, frame, fps)]));
  const vehicles = new Map<string, VehicleState>();
  const draw: Drawable[] = [];
  for (const a of view.actors) {
    const s = actors.get(a.id)!;
    if (s.mode === "stage") draw.push({ kind: "actor", z: s.z, key: `p:${a.id}`, id: a.id });
  }
  // стол перед куклами своего плана, стул и диван — за ними
  view.sets.forEach((st, index) => draw.push({ kind: "set", z: st.z + (frontLayer(st.it) ? -0.01 : 0.01), key: `s:${st.it.item}:${st.it.at ?? ""}`, index }));
  // положенный предмет лежит, пока его снова не взяли
  view.props.forEach((p, index) => {
    if (time < p.from - 1e-6 || (p.until !== undefined && time >= p.until - 1e-6)) return;
    draw.push({ kind: "prop", z: p.z, key: `prop:${index}`, index });
  });
  for (const v of view.vehicles) {
    if (!sampleStep(v.tracks.present, time)) continue;
    vehicles.set(v.id, {
      id: v.id, kind: v.kind, color: v.color, z: v.z, s: v.s,
      x: sampleLin(v.tracks.x, time), facing: sampleStep(v.tracks.facing, time), moving: sampleStep(v.tracks.moving, time),
      wheelT: sampleLin(v.tracks.wheelT, time), riders: sampleStep(v.tracks.riders, time),
    });
    // на одном плане с людьми машина — позади них (люди говорят перед машиной)
    draw.push({ kind: "vehicle", z: v.z + 0.02, key: `v:${v.id}`, id: v.id });
  }
  // передний слой фона (стойка перед барменом): поверх тех, кто дальше его z, под теми, кто ближе
  if (view.frontZ !== undefined) draw.push({ kind: "front", z: view.frontZ, key: "bg-front" });
  draw.sort((a, b) => b.z - a.z);
  const shakes = view.shakes.map((x) => ({ from: frameOf(x.from, fps), to: frameOf(x.to, fps), strength: x.strength }));
  return {
    view,
    camera: { scale: sampleLin(view.camera.scale, time), fx: sampleLin(view.camera.fx, time), fy: sampleLin(view.camera.fy, time) },
    shake: shakes.find((x) => frame >= x.from && frame <= x.to),
    actors, vehicles, draw,
    crowdEvents: (view.crowd ?? view.crowdFront)?.events.map((e) => ({ react: e.react, from: frameOf(e.from, fps), to: frameOf(e.to, fps) })) ?? [],
  };
}

/**
 * Кадр ролика. frontLayer(it) — стоит ли предмет мебели перед куклами (таблица рисунков мебели, у обёртки).
 * lines — реплики в кадрах (captionLines(perf)), чтобы не пересчитывать их на каждом кадре.
 */
export function sample(perf: Performance, frame: number, opts: { frontLayer: (it: SetItem) => boolean; lines?: CaptionLine[] }): FrameState {
  const { fps } = perf;
  const t = sec(frame, fps);
  const scene = perf.scenes.find((s) => s.shown && t >= s.shown[0] - 1e-6 && t <= s.shown[1] + 1e-6) ?? perf.scenes.find((s) => s.views.length)!;
  const lines = opts.lines ?? captionLines(perf);
  return {
    frame, t, scene,
    views: scene.views.map((v) => viewAt(v, frame, fps, opts.frontLayer)),
    caption: lines.find((l) => frame >= l.startFrame && frame <= l.endFrame + 4),
    transitions: perf.scenes.slice(1).map((s) => {
      const prev = perf.scenes[s.index - 1];
      return { index: s.index, at: frameOf(s.from, fps), frames: frameOf(s.transition.sec, fps), kind: s.transition.kind, from: { location: prev.location, place: prev.place }, to: { location: s.location, place: s.place } };
    }),
  };
}

/** Разделённый экран: полоса под субтитры между половинами и какая полоса холста видна в каждой половине. */
export const SPLIT = { band: 280, from: 400 };

/** Тряска кадра: CSS-сдвиг холста сцены (затухает к концу). */
export function shakeTransform(s: ViewState["shake"], frame: number): string {
  if (!s) return "";
  const k = 1 - (frame - s.from) / Math.max(1, s.to - s.from);
  const amp = (s.strength === "strong" ? 26 : 11) * (0.4 + 0.6 * k);
  // кадр чуть увеличен вокруг центра, чтобы при дрожании не открывались края
  const z = 1.06;
  return `translate(${-540 * (z - 1) + Math.sin(frame * 2.3) * amp}px, ${-960 * (z - 1) + Math.cos(frame * 3.1) * amp * 0.7}px) scale(${z}) rotate(${Math.sin(frame * 1.7) * amp * 0.02}deg)`;
}

/** CSS-трансформация холста сцены под камеру: фокус в центр кадра, края не вылезают. */
export function cameraTransform(c: Cam, width: number, height: number, stageW = width) {
  const s = c.scale;
  const tx = Math.min(0, Math.max(width - stageW * s, width / 2 - c.fx * s));
  const ty = Math.min(0, Math.max(height - height * s, height / 2 - c.fy * s));
  return `translate(${tx}px, ${ty}px) scale(${s})`;
}
