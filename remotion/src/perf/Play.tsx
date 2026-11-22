/**
 * Проигрыватель исполнения (performance.json) в Remotion: рисует кадр только из треков, без постановки.
 * Где стоит кукла, куда смотрит, что держит, поза, камера, субтитр и звуки уже посчитаны компилятором (perf/compile.ts).
 * Порядок отрисовки — как раньше: по плану глубины (дальние раньше), передний слой фона между планами.
 */
import type { ReactElement } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { NARRATOR, type Crowd as CrowdSpec } from "@jf/core";
import { locations } from "../registry";
import { Background } from "../components/Background";
import { Puppet } from "../components/Puppet";
import { Captions } from "../components/Captions";
import { Watermark } from "../components/Branding";
import { SceneTransition } from "../world/Transitions";
import { Flyover } from "../world/Flyover";
import { buildingFor } from "../world/town";
import { Crowd, CrowdFront } from "../world/Crowd";
import { SET_PIECES, SetPiece } from "../world/SetPieces";
import { VehicleArt } from "../world/Vehicles";
import { PropItem } from "../props/Props";
import { LocaleProvider } from "../i18n/signs";
import { cameraTransform } from "../director/camera";
import { feetY } from "../world/depth";
import { FPS } from "../puppet/motion";
import type { TimedLine, CrowdEvent } from "../timeline";
import { PerfSoundtrack } from "./PerfSoundtrack";
import { frameOf, sampleLin, sampleStep, sec } from "./tracks";
import type { PerfActor, PerfLine, PerfScene, PerfView, Performance } from "./types";

/** Разделённый экран: полоса под субтитры между половинами и какая полоса холста видна в каждой половине. */
export const SPLIT = { band: 280, from: 400 };

/** Тряска кадра: дрожание холста сцены (затухает к концу). */
function shakeOffset(view: PerfView, frame: number, fps: number) {
  const s = view.shakes.map((x) => ({ from: frameOf(x.from, fps), to: frameOf(x.to, fps), strength: x.strength })).find((x) => frame >= x.from && frame <= x.to);
  if (!s) return "";
  const k = 1 - (frame - s.from) / Math.max(1, s.to - s.from);
  const amp = (s.strength === "strong" ? 26 : 11) * (0.4 + 0.6 * k);
  // кадр чуть увеличен вокруг центра, чтобы при дрожании не открывались края
  const z = 1.06;
  return `translate(${-540 * (z - 1) + Math.sin(frame * 2.3) * amp}px, ${-960 * (z - 1) + Math.cos(frame * 3.1) * amp * 0.7}px) scale(${z}) rotate(${Math.sin(frame * 1.7) * amp * 0.02}deg)`;
}

/** Состояние куклы на момент time (из треков). */
function actorAt(a: PerfActor, time: number, frame: number, fps: number) {
  const T = a.tracks, L = (k: keyof typeof T) => sampleLin(T[k] as never, time);
  const act = sampleStep(T.act, time), base = sampleStep(T.base, time);
  const since = (start: number | null) => (frame - frameOf(start ?? 0, fps)) / fps;
  return {
    mode: sampleStep(T.mode, time),
    x: L("x"), top: L("top"), w: L("w"), h: L("h"), z: L("z"),
    walk: L("walk"), seated: L("seated"), bed: L("bed"), flinch: L("flinch"),
    facing: sampleStep(T.facing, time), speaking: sampleStep(T.speaking, time), emotion: sampleStep(T.emotion, time),
    hold: sampleStep(T.hold, time) ?? undefined, seed: sampleStep(T.seed, time),
    act: act ? { name: act, k: L("actK"), t: since(sampleStep(T.actStart, time)) } : undefined,
    base: base ? { name: base, k: L("baseK"), t: since(sampleStep(T.baseStart, time)) } : undefined,
  };
}

const events = (es: { react: CrowdEvent["react"]; from: number; to: number }[], fps: number): CrowdEvent[] =>
  es.map((e) => ({ react: e.react, from: frameOf(e.from, fps), to: frameOf(e.to, fps) }));

/** Один вид сцены (сцена или половина разделённого экрана) на кадре. */
const View = ({ perf, view, frame }: { perf: Performance; view: PerfView; frame: number }) => {
  const { width, height, fps } = perf;
  const time = sec(frame, fps);
  const loc = locations[view.location];
  const bgT = view.bgScale > 1 ? `translate(0px, ${view.floorY * (1 - view.bgScale)}px) scale(${view.bgScale})` : undefined;

  const puppet = (a: PerfActor, s: ReturnType<typeof actorAt>) => (
    <div key={a.id} style={{ position: "absolute", left: s.x - s.w / 2, top: s.top, width: s.w, height: s.h, display: "flex", justifyContent: "center",
      // в кровати: ниже пола плана ничего (опущенное под одеяло тело не торчит из-под кровати)
      clipPath: s.bed > 0.5 ? `polygon(-200% -100%, 300% -100%, 300% ${(585 / 600) * 100}%, -200% ${(585 / 600) * 100}%)` : undefined }}>
      <Puppet look={a.look} speaking={s.speaking} emotion={s.emotion} walk={s.walk} facing={s.facing} hold={s.hold} seed={s.seed}
        t={frame / FPS} act={s.act} base={s.base} seated={s.seated} bed={s.bed} flinch={s.flinch} />
    </div>
  );

  type Drawable = { z: number; key: string; node: ReactElement };
  const draw: Drawable[] = [];
  const states = new Map(view.actors.map((a) => [a.id, actorAt(a, time, frame, fps)]));
  for (const a of view.actors) {
    const s = states.get(a.id)!;
    if (s.mode === "stage") draw.push({ z: s.z, key: `p:${a.id}`, node: puppet(a, s) });
  }
  for (const st of view.sets) {
    const front = SET_PIECES[st.it.item]?.layer === "front";
    // стол перед куклами своего плана, стул и диван — за ними
    draw.push({ z: st.z + (front ? -0.01 : 0.01), key: `s:${st.it.item}:${st.it.at ?? ""}`,
      node: <SetPiece key={`s:${st.it.item}:${st.it.at ?? ""}`} it={st.it} x={st.x} stageW={view.stageW} height={height} floorY={st.floorY} k={st.k} /> });
  }
  view.props.forEach((p, i) => {
    if (time < p.from - 1e-6 || (p.until !== undefined && time >= p.until - 1e-6)) return;
    draw.push({ z: p.z, key: `prop:${i}`, node: (
      <svg key={`prop:${i}`} width={view.stageW} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${p.x} ${p.surface}) scale(${p.u})`}><PropItem id={p.item} x={0} y={0} rest /></g>
      </svg>
    ) });
  });
  for (const v of view.vehicles) {
    if (!sampleStep(v.tracks.present, time)) continue;
    const x = sampleLin(v.tracks.x, time), fc = sampleStep(v.tracks.facing, time);
    const moving = sampleStep(v.tracks.moving, time), wt = sampleLin(v.tracks.wheelT, time);
    const art = (part: "back" | "front") => (
      <svg width={view.stageW} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${x} ${feetY(v.z, height)}) scale(${v.s * fc} ${v.s})`}>
          <VehicleArt kind={v.kind as never} part={part} t={wt} moving={moving} color={v.color} />
        </g>
      </svg>
    );
    const riders = sampleStep(v.tracks.riders, time);
    // на одном плане с людьми машина — позади них (люди говорят перед машиной)
    draw.push({ z: v.z + 0.02, key: `v:${v.id}`, node: (
      <div key={`v:${v.id}`} style={{ position: "absolute", left: 0, top: 0, width: view.stageW, height }}>
        {art("back")}
        {/* с последнего места к первому: водитель поверх */}
        {[...riders].reverse().map((id) => { const a = view.actors.find((x) => x.id === id); return a ? puppet(a, states.get(id)!) : null; })}
        {art("front")}
      </div>
    ) });
  }
  // передний слой фона (стойка перед барменом): поверх тех, кто дальше его z, под теми, кто ближе
  if (view.frontZ !== undefined) {
    draw.push({ z: view.frontZ, key: "bg-front", node: (
      <div key="bg-front" style={{ position: "absolute", left: 0, top: 0, width, height, transformOrigin: "0 0", transform: bgT }}>
        <Background location={loc} place={view.place} layer="front" />
      </div>
    ) });
  }
  draw.sort((a, b) => b.z - a.z);
  const cam = { scale: sampleLin(view.camera.scale, time), fx: sampleLin(view.camera.fx, time), fy: sampleLin(view.camera.fy, time) };

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: view.stageW, height, transformOrigin: "0 0",
      transform: `${shakeOffset(view, frame, fps)} ${cameraTransform(cam, width, height, view.stageW)}` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, transformOrigin: "0 0", transform: bgT }}>
        <Background location={loc} place={view.place} />
      </div>
      {view.crowd && (
        <Crowd spec={view.crowd.spec as CrowdSpec} events={events(view.crowd.events, fps)} seed={view.crowd.seed} width={view.stageW} floorY={view.floorY} heroH={view.heroH} t={frame / FPS} />
      )}
      {draw.map((d) => d.node)}
      {view.crowdFront && (
        <CrowdFront spec={view.crowdFront.spec as CrowdSpec} events={events(view.crowdFront.events, fps)} seed={view.crowdFront.seed} width={view.stageW} height={height} t={frame / FPS} />
      )}
    </div>
  );
};

/** Сцена на кадре: обычная — один вид, разделённый экран — две половины и полоса под субтитры. */
const SceneView = ({ perf, scene, frame }: { perf: Performance; scene: PerfScene; frame: number }) => {
  const { width, height } = perf;
  if (!scene.split) return <View perf={perf} view={scene.views[0]} frame={frame} />;
  const half = (height - SPLIT.band) / 2;
  return (
    <AbsoluteFill style={{ background: "#2b1d14" }}>
      {scene.views.map((v) => (
        <div key={v.half} style={{ position: "absolute", left: 0, top: v.half === "top" ? 0 : half + SPLIT.band, width, height: half, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: -SPLIT.from, width, height }}>
            <View perf={perf} view={v} frame={frame} />
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** Реплика в форме, которую понимают субтитры (кадры). */
const timed = (l: PerfLine, fps: number): TimedLine => ({
  id: l.id, character: l.character, text: l.text, emotion: l.emotion, scene: l.scene, punch: l.punch, offscreen: l.offscreen,
  rate: l.audio?.rate ?? 1, startFrame: frameOf(l.from, fps), endFrame: frameOf(l.to, fps),
  words: l.words.map((w) => ({ text: w.text, startFrame: frameOf(w.from, fps), endFrame: frameOf(w.to, fps) })),
});

/** Весь ролик из исполнения. */
export const Play = ({ perf }: { perf: Performance }) => {
  const frame = useCurrentFrame();
  const { fps } = perf;
  const time = sec(frame, fps);
  const scene = perf.scenes.find((s) => s.shown && time >= s.shown[0] - 1e-6 && time <= s.shown[1] + 1e-6) ?? perf.scenes.find((s) => s.views.length)!;
  const lines = perf.captions.map((l) => timed(l, fps));
  const current = lines.find((l) => frame >= l.startFrame && frame <= l.endFrame + 4);
  return (
    <LocaleProvider value={perf.locale}>
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <SceneView perf={perf} scene={scene} frame={frame} />
      {perf.scenes.slice(1).map((s) => {
        const prev = perf.scenes[s.index - 1];
        const at = frameOf(s.from, fps), frames = frameOf(s.transition.sec, fps);
        return s.transition.kind === "flyover" ? (
          <Flyover key={s.index} at={at} frames={frames} locale={perf.locale} from={buildingFor(prev.location, prev.place)} to={buildingFor(s.location, s.place)} />
        ) : (
          <SceneTransition key={s.index} at={at} frames={frames} kind={s.transition.kind} />
        );
      })}
      <Captions line={current} locale={perf.locale} narrator={current?.character === NARRATOR}
        top={scene.split && current?.character !== NARRATOR ? (1920 - SPLIT.band) / 2 + 24 : undefined} />
      <Watermark />
      <PerfSoundtrack perf={perf} lines={lines} />
    </AbsoluteFill>
    </LocaleProvider>
  );
};
