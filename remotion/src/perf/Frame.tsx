/**
 * Кадр исполнения в React SVG: рисует FrameState (sample из @jf/player), без Remotion. Его используют обёртки —
 * Remotion (perf/Play.tsx: рендер видео) и веб-плеер (web/: браузер, Tauri, мобильный webview).
 * Логики постановки здесь нет: где кто стоит, порядок, камера, субтитр — уже в FrameState.
 */
import { NARRATOR, type Crowd as CrowdSpec, type SetItem } from "@jf/core";
import { SPLIT, cameraTransform, shakeTransform, type ActorState, type FrameState, type Performance, type ViewState } from "@jf/player";
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
import { feetY } from "../world/depth";
import { FPS } from "../puppet/motion";
import { Fill } from "../lib/Fill";

export { SPLIT };
/** Мебель перед куклами (стол, прилавок) — для порядка отрисовки в sample. */
export const frontLayer = (it: SetItem) => SET_PIECES[it.item]?.layer === "front";

/** Кукла в своём боксе. В кровати — ниже пола плана ничего (опущенное под одеяло тело не торчит из-под кровати). */
const PuppetBox = ({ s, frame }: { s: ActorState; frame: number }) => (
  <div style={{ position: "absolute", left: s.x - s.w / 2, top: s.top, width: s.w, height: s.h, display: "flex", justifyContent: "center",
    clipPath: s.bed > 0.5 ? `polygon(-200% -100%, 300% -100%, 300% ${(585 / 600) * 100}%, -200% ${(585 / 600) * 100}%)` : undefined }}>
    <Puppet look={s.look} speaking={s.speaking} emotion={s.emotion} walk={s.walk} facing={s.facing} hold={s.hold} seed={s.seed}
      t={frame / FPS} act={s.act} base={s.base} seated={s.seated} bed={s.bed} flinch={s.flinch} />
  </div>
);

/** Один вид сцены (сцена или половина разделённого экрана). */
const View = ({ perf, v, frame }: { perf: Performance; v: ViewState; frame: number }) => {
  const { width, height } = perf;
  const view = v.view;
  const loc = locations[view.location];
  const bgT = view.bgScale > 1 ? `translate(0px, ${view.floorY * (1 - view.bgScale)}px) scale(${view.bgScale})` : undefined;
  const nodes = v.draw.map((d) => {
    if (d.kind === "actor") return <PuppetBox key={d.key} s={v.actors.get(d.id)!} frame={frame} />;
    if (d.kind === "set") {
      const st = view.sets[d.index];
      return <SetPiece key={d.key} it={st.it} x={st.x} stageW={view.stageW} height={height} floorY={st.floorY} k={st.k} />;
    }
    if (d.kind === "prop") {
      const p = view.props[d.index];
      return (
        <svg key={d.key} width={view.stageW} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`translate(${p.x} ${p.surface}) scale(${p.u})`}><PropItem id={p.item} x={0} y={0} rest /></g>
        </svg>
      );
    }
    if (d.kind === "vehicle") {
      const s = v.vehicles.get(d.id)!;
      const art = (part: "back" | "front") => (
        <svg width={view.stageW} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`translate(${s.x} ${feetY(s.z, height)}) scale(${s.s * s.facing} ${s.s})`}>
            <VehicleArt kind={s.kind as never} part={part} t={s.wheelT} moving={s.moving} color={s.color} />
          </g>
        </svg>
      );
      return (
        <div key={d.key} style={{ position: "absolute", left: 0, top: 0, width: view.stageW, height }}>
          {art("back")}
          {/* с последнего места к первому: водитель поверх */}
          {[...s.riders].reverse().map((id) => { const a = v.actors.get(id); return a ? <PuppetBox key={id} s={a} frame={frame} /> : null; })}
          {art("front")}
        </div>
      );
    }
    return (
      <div key={d.key} style={{ position: "absolute", left: 0, top: 0, width, height, transformOrigin: "0 0", transform: bgT }}>
        <Background location={loc} place={view.place} layer="front" />
      </div>
    );
  });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: view.stageW, height, transformOrigin: "0 0",
      transform: `${shakeTransform(v.shake, frame)} ${cameraTransform(v.camera, width, height, view.stageW)}` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, transformOrigin: "0 0", transform: bgT }}>
        <Background location={loc} place={view.place} />
      </div>
      {view.crowd && (
        <Crowd spec={view.crowd.spec as CrowdSpec} events={v.crowdEvents} seed={view.crowd.seed} width={view.stageW} floorY={view.floorY} heroH={view.heroH} t={frame / FPS} />
      )}
      {nodes}
      {view.crowdFront && (
        <CrowdFront spec={view.crowdFront.spec as CrowdSpec} events={v.crowdEvents} seed={view.crowdFront.seed} width={view.stageW} height={height} t={frame / FPS} />
      )}
    </div>
  );
};

/** Весь кадр: сцена (или две половины разделённого экрана), переходы, субтитры, водяной знак. */
export const FrameView = ({ perf, state }: { perf: Performance; state: FrameState }) => {
  const { width, height } = perf;
  const { frame, scene, caption } = state;
  const half = (height - SPLIT.band) / 2;
  return (
    <LocaleProvider value={perf.locale}>
      <Fill style={{ backgroundColor: "#000", overflow: "hidden" }}>
        {!scene.split ? <View perf={perf} v={state.views[0]} frame={frame} /> : (
          <Fill style={{ background: "#2b1d14" }}>
            {state.views.map((v) => (
              <div key={v.view.half} style={{ position: "absolute", left: 0, top: v.view.half === "top" ? 0 : half + SPLIT.band, width, height: half, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: -SPLIT.from, width, height }}>
                  <View perf={perf} v={v} frame={frame} />
                </div>
              </div>
            ))}
          </Fill>
        )}
        {state.transitions.map((tr) => tr.kind === "flyover" ? (
          <Flyover key={tr.index} frame={frame} at={tr.at} frames={tr.frames} locale={perf.locale} from={buildingFor(tr.from.location, tr.from.place)} to={buildingFor(tr.to.location, tr.to.place)} />
        ) : (
          <SceneTransition key={tr.index} frame={frame} at={tr.at} frames={tr.frames} kind={tr.kind} />
        ))}
        <Captions frame={frame} line={caption} locale={perf.locale} narrator={caption?.character === NARRATOR}
          top={scene.split && caption?.character !== NARRATOR ? (1920 - SPLIT.band) / 2 + 24 : undefined} />
        <Watermark />
      </Fill>
    </LocaleProvider>
  );
};
