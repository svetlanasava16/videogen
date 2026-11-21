import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { NARRATOR, lookForRole, type Episode } from "@jf/core";
import { characters, locations } from "./registry";
import { buildTimeline, type SceneTL, type Timeline } from "./timeline";
import { Background } from "./components/Background";
import { BOX_H, BOX_W, Puppet } from "./components/Puppet";
import { Captions } from "./components/Captions";
import { Soundtrack } from "./components/Soundtrack";
import { Watermark } from "./components/Branding";
import { SceneTransition } from "./world/Transitions";
import { Flyover } from "./world/Flyover";
import { buildingFor } from "./world/town";
import { Crowd } from "./world/Crowd";
import { cameraAt, cameraTransform } from "./director/camera";

const FLOOR = 0.62; // линия пола (доля высоты кадра) — совпадает с FLOOR_Y фонов
const PUPPET_H = 0.4; // высота бокса куклы (доля высоты кадра)
const ease = Easing.inOut(Easing.cubic);

/** Геометрия сцены: где стоят куклы на каждом кадре (автослоты, метки места, входы и уходы). */
/** Масштаб кукол по числу персонажей сцены: до трёх — как есть, 4–5 — мельче, чтобы все помещались в общем плане. */
const CAST_SCALE: Record<number, number> = { 4: 0.8, 5: 0.66 };
/** С 6 персонажей сцена шире кадра (куклы как при четырёх), камера едет вдоль неё. */
const WIDE_FROM = 6;
const WIDE_SCALE = 0.8;
/** Сколько кукол такого размера помещается в ширину кадра. */
const WIDE_PER_FRAME = 4.5;

export function stageGeometry(tl: Timeline, sc: SceneTL, width: number, height: number) {
  const cast = sc.scene.cast;
  const wide = cast.length >= WIDE_FROM;
  // ширина сцены: кадр или шире (широкая сцена, камера-панорама)
  const stageW = wide ? width * (cast.length / WIDE_PER_FRAME) : width;
  const boxH = height * PUPPET_H * (wide ? WIDE_SCALE : CAST_SCALE[cast.length] ?? 1);
  const boxW = (boxH * BOX_W) / BOX_H;
  const top = height * FLOOR - (boxH * 585) / BOX_H; // ноги куклы на линии пола
  const marks = locations[sc.scene.location]?.marks ?? {};
  const edgeX = (side: "left" | "right") => (side === "left" ? -boxW : stageW + boxW);
  const nearEdge = (id: string): "left" | "right" => (cast.indexOf(id) < cast.length / 2 ? "left" : "right");
  const pres = (id: string, f: number) => tl.presence(sc, id, f);

  /** Автослот: доли ширины делятся между теми, кто в кадре, пропорционально присутствию. При 4–5 — с полями, чтобы крайние не обрезались. */
  const margin = cast.length >= 4 ? boxW * 0.32 : 0;
  const slotX = (id: string, f: number) => {
    const w = cast.map((c) => ease(pres(c, f)));
    const total = w.reduce((a, b) => a + b, 0) || 1;
    const i = cast.indexOf(id);
    const before = w.slice(0, i).reduce((a, b) => a + b, 0);
    return margin + ((before + Math.max(w[i], 0.0001) / 2) / total) * (stageW - 2 * margin);
  };

  const xAt = (id: string, f: number): number => {
    const ms = sc.moves.filter((m) => m.id === id && m.from <= f);
    const m = ms[ms.length - 1];
    if (!m) return slotX(id, f);
    const k = ease(Math.min(1, (f - m.from) / Math.max(1, m.to - m.from)));
    // метка у края кадра: кукла целиком в кадре
    const markX = (k: string) => Math.min(stageW - boxW * 0.42, Math.max(boxW * 0.42, (marks[k] ?? 0.5) * stageW));
    const target = (ff: number) => (m.target === "slot" ? slotX(id, ff) : markX(m.target));
    if (m.kind === "enter") {
      // старый формат: вход по присутствию от ближнего края к слоту
      if (m.target === "slot" && !m.edge) return interpolate(ease(pres(id, f)), [0, 1], [edgeX(nearEdge(id)), slotX(id, f)]);
      return interpolate(k, [0, 1], [edgeX(m.edge ?? nearEdge(id)), target(f)]);
    }
    if (m.kind === "exit") {
      if (m.target === "slot" && !m.edge) return interpolate(ease(pres(id, f)), [0, 1], [edgeX(nearEdge(id)), slotX(id, f)]);
      const startX = xAt(id, m.from - 1);
      return interpolate(k, [0, 1], [startX, edgeX(m.edge ?? nearEdge(id))]);
    }
    const startX = xAt(id, m.from - 1);
    return interpolate(k, [0, 1], [startX, target(f)]);
  };

  /** Раздвижка: куклы в кадре не стоят ближе MIN_GAP друг к другу (метки бывают рядом). */
  const MIN_GAP = boxW * 0.78;
  const cache = new Map<number, Map<string, number>>();
  const layout = (f: number) => {
    const hit = cache.get(f);
    if (hit) return hit;
    const xs = cast.map((id) => ({ id, x: xAt(id, f), on: pres(id, f) > 0.5 })).sort((a, b) => a.x - b.x);
    for (let it = 0; it < 4; it++) {
      for (let i = 1; i < xs.length; i++) {
        const a = xs[i - 1], b = xs[i];
        if (!a.on || !b.on) continue;
        const d = b.x - a.x;
        if (d < MIN_GAP) {
          const push = (MIN_GAP - d) / 2;
          a.x = Math.max(boxW * 0.45, a.x - push);
          b.x = Math.min(stageW - boxW * 0.45, b.x + push);
        }
      }
    }
    const m = new Map(xs.map((v) => [v.id, v.x]));
    cache.set(f, m);
    return m;
  };
  const xOf = (id: string, f: number) => layout(f).get(id) ?? xAt(id, f);

  return { boxW, boxH, top, stageW, floorY: height * FLOOR, xAt: xOf, present: (id: string, f: number) => pres(id, f) > 0, headY: top + boxH * 0.33, bodyY: top + boxH * 0.5 };
}

/** Одна сцена: фон и куклы на холсте, камера двигает холст. */
const Stage = ({ ep, tl, sc }: { ep: Episode; tl: Timeline; sc: SceneTL }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const geo = stageGeometry(tl, sc, width, height);
  const current = tl.lines.find((l) => l.scene === sc.index && frame >= l.startFrame && frame <= l.endFrame + 4);
  const people = sc.scene.cast.filter((id) => tl.presence(sc, id, frame) > 0);
  const centre = (except: string) => {
    const others = people.filter((c) => c !== except);
    return others.length ? others.reduce((a, c) => a + geo.xAt(c, frame), 0) / others.length : undefined;
  };
  const cam = cameraAt(tl, sc, frame, { width, stageW: geo.stageW, height, headY: geo.headY, bodyY: geo.bodyY, xOf: geo.xAt, present: geo.present });
  // широкая сцена: фон увеличен до ширины сцены, линия пола на месте
  const bgScale = geo.stageW / width;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: geo.stageW, height, transform: cameraTransform(cam, width, height, geo.stageW), transformOrigin: "0 0" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, transformOrigin: "0 0",
        transform: bgScale > 1 ? `translate(0px, ${geo.floorY * (1 - bgScale)}px) scale(${bgScale})` : undefined }}>
        <Background location={locations[sc.scene.location]} place={sc.scene.place} />
      </div>
      {sc.scene.crowd && (
        <Crowd spec={sc.scene.crowd} events={sc.crowd} seed={`${ep.id}:${sc.index}`} width={geo.stageW} floorY={geo.floorY} heroH={height * PUPPET_H} />
      )}
      {people.map((id, i) => {
        const ch = characters[id];
        const x = geo.xAt(id, frame);
        const dx = x - geo.xAt(id, frame - 1);
        const walk = Math.min(1, Math.abs(dx) / 6);
        // рот двигается только пока звучит слово (а не всю реплику с паузами и хвостом)
        const talking = current?.character === id && current.words.some((w) => frame >= w.startFrame - 1 && frame <= w.endFrame);
        const laughing = tl.laughing(id, frame);
        const c = centre(id);
        const facing: 1 | -1 = walk > 0.2 ? (dx > 0 ? 1 : -1) : c === undefined ? 1 : c >= x ? 1 : -1;
        return (
          <div key={id} style={{ position: "absolute", left: x - geo.boxW / 2, top: geo.top, width: geo.boxW, height: geo.boxH, display: "flex", justifyContent: "center" }}>
            <Puppet
              look={lookForRole(ch, sc.scene.roles[id] ?? ep.roles[id], sc.scene.looks?.[id] ?? ep.looks?.[id])}
              speaking={talking || laughing}
              emotion={laughing ? "happy" : current?.character === id ? current.emotion : "neutral"}
              walk={walk}
              facing={facing}
              hold={tl.holding(sc, id, frame)}
              seed={sc.scene.cast.indexOf(id) * 17 + i}
            />
          </div>
        );
      })}
    </div>
  );
};

/** Разделённый экран: полоса под субтитры между половинами и какая полоса холста видна в каждой половине. */
export const SPLIT = { band: 280, from: 400 };

/**
 * Разделённый экран (телефонный разговор двух мест): сверху — место сцены и её куклы,
 * снизу — split.location и куклы из split.cast, между ними — полоса под субтитры. Каждая половина — своя сцена со своей камерой.
 */
const SplitStage = ({ ep, tl, sc }: { ep: Episode; tl: Timeline; sc: SceneTL }) => {
  const { width, height } = useVideoConfig();
  const split = sc.scene.split!;
  const half = (height - SPLIT.band) / 2;
  const top: SceneTL = { ...sc, scene: { ...sc.scene, cast: sc.scene.cast.filter((id) => !split.cast.includes(id)), split: undefined } };
  const bottom: SceneTL = { ...sc, scene: { ...sc.scene, cast: split.cast, location: split.location, place: split.place, crowd: undefined, split: undefined } };
  const Half = ({ part, y }: { part: SceneTL; y: number }) => (
    <div style={{ position: "absolute", left: 0, top: y, width, height: half, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: -SPLIT.from, width, height }}>
        <Stage ep={ep} tl={tl} sc={part} />
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "#2b1d14" }}>
      <Half part={top} y={0} />
      <Half part={bottom} y={half + SPLIT.band} />
    </AbsoluteFill>
  );
};

export const Joke = (ep: Episode) => {
  const frame = useCurrentFrame();
  const tl = buildTimeline(ep);
  const sc = tl.sceneAt(frame);
  const current = tl.lines.find((l) => frame >= l.startFrame && frame <= l.endFrame + 4);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {sc.scene.split ? <SplitStage ep={ep} tl={tl} sc={sc} /> : <Stage ep={ep} tl={tl} sc={sc} />}
      {tl.scenes.slice(1).map((s) => {
        const prev = tl.scenes[s.index - 1].scene;
        return s.transition.kind === "flyover" ? (
          <Flyover key={s.index} at={s.from} frames={s.transition.frames} locale={ep.locale}
            from={buildingFor(prev.location, prev.place)} to={buildingFor(s.scene.location, s.scene.place)} />
        ) : (
          <SceneTransition key={s.index} at={s.from} frames={s.transition.frames} kind={s.transition.kind} />
        );
      })}
      <Captions line={current} locale={ep.locale} narrator={current?.character === NARRATOR}
        top={sc.scene.split && current?.character !== NARRATOR ? (1920 - SPLIT.band) / 2 + 24 : undefined} />
      <Watermark />
      <Soundtrack tl={tl} />
    </AbsoluteFill>
  );
};
