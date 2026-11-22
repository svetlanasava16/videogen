/**
 * Компилятор эпизода → performance.json (ROADMAP §5).
 * Постановка (timeline.ts, stage/geometry.ts, director/camera.ts) запускается ОДИН раз по всем кадрам ролика,
 * результат — треки по времени (perf/tracks.ts). Проигрыватель (perf/Play.tsx) только читает их.
 * Здесь та же логика, что раньше жила в Joke.tsx на каждом кадре: кто в кадре, куда смотрит, говорит ли,
 * поза, сиденье, кровать, машины и седоки, лежащие предметы, мебель, камера.
 * Работает и в браузере (композиция Joke), и в Node (pnpm compile-episode, stills, golden, render).
 */
import { subLocation, type Episode } from "@jf/core";
import { characters, locations } from "../registry";
import { buildTimeline, type SceneTL, type Timeline } from "../timeline";
import { cameraAt } from "../director/camera";
import { costumeFor } from "../puppet/costume";
import { PROP_REST, PUPPET_H, TABLE_TOP, stageGeometry } from "../stage/geometry";
import { pieceWidth } from "../world/SetPieces";
import { depthScale, feetY } from "../world/depth";
import { encodeLin, encodeStep, sec } from "@jf/player";
import { PERF_VERSION, type ActorMode, type PerfActor, type PerfProp, type PerfScene, type PerfVehicle, type PerfView, type Performance } from "@jf/player";
import type { Act, Emotion } from "@jf/core";

/**
 * Точность треков: все числа — точно (eps 0, без округления): ключи только там, где значение меняется, между ключами —
 * постоянное значение. Так кадр проигрывателя совпадает с прежней покадровой постановкой бит в бит: порядок отрисовки
 * по z, пороги рига (k > 0.5, walk < 0.2), субпиксельный сдвиг камеры. Размер ~12 КБ на эпизод.
 */
const PX = { eps: 0, q: 0 };
const K = { eps: 0, q: 0 };
const SCALE = { eps: 0, q: 0 };
/**
 * План глубины z — без округления и без погрешности: по нему сортируется отрисовка, а у кукол «на одном плане»
 * z бывают равны до последнего бита (0.1 и 0.09999999999999998) — порядок должен остаться тем же, что в постановке.
 */
const Z = { eps: 0, q: 0 };

type ActorSample = {
  mode: ActorMode; x: number; top: number; w: number; h: number; z: number;
  walk: number; seated: number; bed: number; flinch: number; facing: 1 | -1;
  speaking: boolean; emotion: Emotion; hold: string | null;
  act: Act | null; actK: number; actStart: number | null; base: Act | null; baseK: number; baseStart: number | null; seed: number;
};
const OFF: ActorSample = {
  mode: "off", x: 0, top: 0, w: 0, h: 0, z: 0.5, walk: 0, seated: 0, bed: 0, flinch: 0, facing: 1,
  speaking: false, emotion: "neutral", hold: null, act: null, actK: 0, actStart: null, base: null, baseK: 0, baseStart: null, seed: 0,
};

/** Половины разделённого экрана (как прежний SplitStage): сверху — сцена без split.cast, снизу — второе место. */
function viewsOf(sc: SceneTL): { half?: "top" | "bottom"; scv: SceneTL }[] {
  const split = sc.scene.split;
  if (!split) return [{ scv: sc }];
  return [
    { half: "top", scv: { ...sc, scene: { ...sc.scene, cast: sc.scene.cast.filter((id) => !split.cast.includes(id)), split: undefined } } },
    { half: "bottom", scv: { ...sc, scene: { ...sc.scene, cast: split.cast, location: split.location, place: split.place, crowd: undefined, set: undefined, split: undefined } } },
  ];
}

/** Отладка: покадровые значения куклы до кодирования в треки (проверка точности треков). */
export type ProbeFn = (scene: number, half: string | undefined, frame: number, id: string, s: ActorSample) => void;
export type { ActorSample };

function compileView(ep: Episode, tl: Timeline, scv: SceneTL, frames: number[], W: number, H: number, fps: number, half?: "top" | "bottom", probe?: ProbeFn): PerfView {
  const geo = stageGeometry(tl, scv, W, H);
  const cast = scv.scene.cast;
  const samples = new Map<string, ActorSample[]>(cast.map((id) => [id, []]));
  const cam = { scale: [] as number[], fx: [] as number[], fy: [] as number[] };
  const veh = new Map<string, { present: boolean[]; x: number[]; facing: (1 | -1)[]; moving: boolean[]; wheelT: number[]; riders: string[][] }>(
    geo.vehicles.map((v) => [v.id, { present: [], x: [], facing: [], moving: [], wheelT: [], riders: [] }]),
  );

  for (const frame of frames) {
    const current = tl.lines.find((l) => l.scene === scv.index && frame >= l.startFrame && frame <= l.endFrame + 4);
    const people = cast.filter((id) => tl.presence(scv, id, frame) > 0 && !tl.ridingIn(scv, id, frame));
    const centre = (except: string) => {
      const others = people.filter((c) => c !== except);
      return others.length ? others.reduce((a, c) => a + geo.xAt(c, frame), 0) / others.length : undefined;
    };
    const c = cameraAt(tl, scv, frame, { width: W, stageW: geo.stageW, height: H, headY: geo.headY, bodyY: geo.bodyY, xOf: geo.xAt, present: geo.present });
    cam.scale.push(c.scale); cam.fx.push(c.fx); cam.fy.push(c.fy);

    const now = new Map<string, ActorSample>();
    /** То, что раньше считал Joke.tsx → puppet() на каждом кадре. */
    const puppet = (id: string, i: number, b: { x: number; top: number; w: number; h: number; z: number }, opts: { facing?: 1 | -1; inVehicle?: boolean }): ActorSample => {
      const x = b.x;
      const dx = opts.inVehicle ? 0 : x - geo.xAt(id, frame - 1);
      const walk = Math.min(1, Math.abs(dx) / 6);
      const bed = opts.inVehicle ? 0 : geo.inBedAt(id, frame);
      // рот двигается только пока звучит слово (а не всю реплику с паузами и хвостом)
      const talking = current?.character === id && current.words.some((w) => frame >= w.startFrame - 1 && frame <= w.endFrame);
      const laughing = tl.laughing(id, frame);
      const cx = centre(id);
      const { act, base } = tl.actAt(scv, id, frame);
      // действие по цели — лицом к цели
      const target = act || base ? scv.acts.filter((a) => a.who === id && a.from <= frame).pop()?.to : undefined;
      const tx = target && people.includes(target) ? geo.xAt(target, frame) : undefined;
      const facing: 1 | -1 = opts.facing ?? (walk > 0.2 ? (dx > 0 ? 1 : -1) : tx !== undefined ? (tx >= x ? 1 : -1) : cx === undefined ? 1 : cx >= x ? 1 : -1);
      return {
        mode: opts.inVehicle ? "vehicle" : "stage", x, top: b.top, w: b.w, h: b.h, z: b.z,
        walk, seated: geo.seatedAt(id, frame), bed, flinch: tl.flinchAt(scv, id, frame), facing,
        speaking: talking || laughing,
        emotion: laughing ? "happy" : current?.character === id ? current.emotion : "neutral",
        hold: tl.holding(scv, id, frame) ?? null,
        // начало действия (секунды): t считается от него в проигрывателе — точно, без интерполяции
        act: act?.name ?? null, actK: act?.k ?? 0, actStart: act ? sec(frame - Math.round(act.t * fps), fps) : null,
        base: base?.name ?? null, baseK: base?.k ?? 0, baseStart: base ? sec(frame - Math.round(base.t * fps), fps) : null,
        seed: cast.indexOf(id) * 17 + i,
      };
    };
    people.forEach((id, i) => now.set(id, puppet(id, i, geo.box(id, frame), {})));
    for (const v of geo.vehicles) {
      const V = veh.get(v.id)!;
      const present = geo.vehPresent(v.id, frame);
      const fc = geo.vehFacing(v.id, frame);
      const riders = present ? tl.ridersOf(scv, v.id, frame) : [];
      V.present.push(present);
      V.x.push(geo.vehX(v.id, frame));
      V.facing.push(fc);
      V.moving.push(geo.vehMoving(v.id, frame));
      // колёса крутятся только в пути: сумма секунд езды до этого кадра (стоит — угол замер)
      V.wheelT.push(scv.drives.filter((d) => d.vehicle === v.id && d.to > d.from).reduce((a, d) => a + Math.max(0, Math.min(frame, d.to) - d.from), 0) / 30);
      V.riders.push(riders);
      // с последнего места к первому: водитель поверх
      [...riders].reverse().forEach((id, i) => now.set(id, puppet(id, i, geo.box(id, frame), { facing: fc, inVehicle: true })));
    }
    for (const id of cast) {
      const arr = samples.get(id)!;
      // нет в кадре — значения прошлого кадра (трек не скачет зря), режим off
      arr.push(now.get(id) ?? { ...(arr[arr.length - 1] ?? OFF), mode: "off", speaking: false });
      probe?.(scv.index, half, frame, id, arr[arr.length - 1]);
    }
  }

  const lin = (vals: number[], p: { eps: number; q: number }) => encodeLin(frames, vals, fps, p.eps, p.q);
  const step = <T,>(vals: T[]) => encodeStep(frames, vals, fps);
  const actors: PerfActor[] = cast.map((id) => {
    const s = samples.get(id)!;
    const col = <K extends keyof ActorSample>(k: K) => s.map((x) => x[k]);
    return {
      id,
      look: costumeFor(characters[id], scv.scene.roles[id] ?? ep.roles[id], scv.scene.looks?.[id]),
      tracks: {
        mode: step(col("mode")),
        x: lin(col("x"), PX), top: lin(col("top"), PX), w: lin(col("w"), PX), h: lin(col("h"), PX), z: lin(col("z"), Z),
        walk: lin(col("walk"), K), seated: lin(col("seated"), K), bed: lin(col("bed"), K), flinch: lin(col("flinch"), K),
        facing: step(col("facing")), speaking: step(col("speaking")), emotion: step(col("emotion")), hold: step(col("hold")),
        act: step(col("act")), actK: lin(col("actK"), K), actStart: step(col("actStart")),
        base: step(col("base")), baseK: lin(col("baseK"), K), baseStart: step(col("baseStart")),
        seed: step(col("seed")),
      },
    };
  });
  const vehicles: PerfVehicle[] = geo.vehicles.map((v) => {
    const V = veh.get(v.id)!;
    return {
      id: v.id, kind: v.kind, color: v.color, z: geo.vehZ(v.id), s: geo.vehScale(v.id),
      tracks: { present: step(V.present), x: lin(V.x, PX), facing: step(V.facing), moving: step(V.moving), wheelT: lin(V.wheelT, K), riders: step(V.riders) },
    };
  });

  // положенные (put) и уроненные (drop) предметы лежат, где их оставили (стол, стойка рядом или пол), пока их снова не возьмут
  const loc = locations[scv.scene.location];
  const sub = subLocation(loc, scv.scene.place);
  const props: PerfProp[] = [];
  for (const e of scv.props) {
    if (e.action !== "put" && e.action !== "drop") continue;
    const pick = scv.props.filter((o) => o.item === e.item && o.frame > e.frame && (o.action === "hold" || o.action === "give")).map((o) => o.frame);
    const b = geo.box(e.who, e.frame);
    const toCentre = b.x < geo.stageW / 2 ? 1 : -1;
    let x = b.x + toCentre * b.w * 0.28;
    const table = e.action === "put" ? geo.setItems.find((it) => TABLE_TOP[it.item] !== undefined && Math.abs(geo.itemZ(it) - b.z) < 0.2 && Math.abs(geo.setX(it.at) - x) < pieceWidth(it, geo.stageW, geo.castK * depthScale(geo.itemZ(it))) / 2) : undefined;
    const surfaces = (sub ? sub.surfaces : loc?.surfaces) ?? [];
    const bg = e.action === "put" && !table
      ? surfaces.filter((sf) => x >= sf.x0 * geo.stageW && x <= sf.x1 * geo.stageW && Math.abs(sf.z - b.z) < 0.5).sort((p, q) => Math.abs(p.z - b.z) - Math.abs(q.z - b.z))[0]
      : undefined;
    if (bg && bg.z > b.z + 0.1) x = Math.min(bg.x1 * geo.stageW, Math.max(bg.x0 * geo.stageW, b.x + toCentre * b.w * 0.5));
    const z = table ? geo.itemZ(table) - 0.02 : bg ? bg.z - 0.02 : b.z - 0.005;
    const k = table ? geo.castK * depthScale(geo.itemZ(table)) : bg ? depthScale(bg.z) : geo.castK * depthScale(b.z);
    const surface = table ? feetY(geo.itemZ(table), H) - TABLE_TOP[table.item] * k : bg ? feetY(bg.z, H) - bg.top * k : feetY(b.z, H);
    const u = (k * H * PUPPET_H) / 600; // единица рисунка предмета (бокс куклы 600) в px
    props.push({ item: e.item, from: sec(e.frame, fps), ...(pick.length ? { until: sec(Math.min(...pick), fps) } : {}), x, surface: surface - PROP_REST * u, u, z });
  }

  // массовка: своя у сцены или по умолчанию у сублокации (салон самолёта — пассажиры); сидит ли и цвет кресел — от сублокации
  const placeCrowd = sub?.crowd;
  const crowd = scv.scene.crowd
    ? { seated: placeCrowd?.seated, seatColor: placeCrowd?.seatColor, ...Object.fromEntries(Object.entries(scv.scene.crowd).filter(([, v]) => v !== undefined)) } as typeof scv.scene.crowd
    : placeCrowd;
  const events = scv.crowd.map((e) => ({ react: e.react, from: sec(e.from, fps), to: sec(e.to, fps) }));
  const seed = `${ep.id}:${scv.index}`;

  return {
    ...(half ? { half } : {}),
    location: scv.scene.location, ...(scv.scene.place ? { place: scv.scene.place } : {}),
    stageW: geo.stageW, bgScale: geo.stageW / W, floorY: geo.floorY, heroH: H * PUPPET_H,
    ...((sub ? sub.front : loc?.front) ? { frontZ: (sub ? sub.front : loc?.front)!.z } : {}),
    ...(crowd && crowd.at !== "front" ? { crowd: { spec: crowd, seed, events } } : {}),
    ...(scv.scene.crowd?.at === "front" ? { crowdFront: { spec: scv.scene.crowd, seed, events } } : {}),
    sets: geo.setItems.map((it) => { const z = geo.itemZ(it); return { it, x: geo.setX(it.at), z, floorY: feetY(z, H), k: geo.castK * depthScale(z) }; }),
    props,
    shakes: scv.shakes.map((s) => ({ from: sec(s.from, fps), to: sec(s.to, fps), strength: s.strength })),
    camera: { scale: lin(cam.scale, SCALE), fx: lin(cam.fx, PX), fy: lin(cam.fy, PX) },
    actors, vehicles,
  };
}

/** Эпизод → исполнение. */
export function compileEpisode(ep: Episode, probe?: ProbeFn): Performance {
  const tl = buildTimeline(ep);
  const fps = ep.format.fps, W = ep.format.width, H = ep.format.height;
  const N = tl.durationInFrames;
  const byScene = new Map<number, number[]>();
  for (let f = 0; f < N; f++) {
    const i = tl.sceneAt(f).index;
    if (!byScene.has(i)) byScene.set(i, []);
    byScene.get(i)!.push(f);
  }
  const scenes: PerfScene[] = tl.scenes.map((sc) => {
    const frames = byScene.get(sc.index) ?? [];
    return {
      index: sc.index, from: sec(sc.from, fps), to: sec(sc.to, fps),
      ...(frames.length ? { shown: [sec(frames[0], fps), sec(frames[frames.length - 1], fps)] as [number, number] } : {}),
      location: sc.scene.location, ...(sc.scene.place ? { place: sc.scene.place } : {}),
      transition: { kind: sc.transition.kind, sec: sec(sc.transition.frames, fps) },
      split: !!sc.scene.split,
      views: frames.length ? viewsOf(sc).map(({ half, scv }) => compileView(ep, tl, scv, frames, W, H, fps, half, probe)) : [],
    };
  });
  return {
    v: PERF_VERSION, id: ep.id, locale: ep.locale, fps, frames: N, duration: sec(N, fps), width: W, height: H,
    scenes,
    captions: tl.lines.map((l) => ({
      id: l.id, character: l.character, text: l.text, emotion: l.emotion, scene: l.scene,
      from: sec(l.startFrame, fps), to: sec(l.endFrame, fps),
      words: l.words.map((w) => ({ text: w.text, from: sec(w.startFrame, fps), to: sec(w.endFrame, fps) })),
      ...(l.offscreen ? { offscreen: true } : {}), punch: l.punch,
      ...(l.audioFile ? { audio: { file: l.audioFile, from: sec(l.audioFrom ?? l.startFrame, fps), rate: l.rate } } : {}),
    })),
    audio: {
      ...(tl.music ? { music: tl.music.file } : {}),
      outro: tl.outro.map((o) => ({ character: o.character, file: o.file, from: sec(o.from, fps), dur: sec(o.frames, fps) })),
      sfx: tl.sfx.map((c) => ({ file: c.clip.file, from: sec(c.from, fps), dur: sec(c.frames, fps) })),
      laughs: tl.laughs.map((c) => ({ file: c.clip.file, from: sec(c.from, fps), dur: sec(c.frames, fps) })),
    },
  };
}
