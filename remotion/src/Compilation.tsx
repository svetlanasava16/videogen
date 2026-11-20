import { AbsoluteFill, Sequence } from "remotion";
import { CompilationProps, scenesOf, type Episode } from "@jf/core";
import { Joke } from "./Joke";
import { buildTimeline } from "./timeline";
import { Flyover, TownIntro } from "./world/Flyover";
import { buildingFor } from "./world/town";

export { CompilationProps };
/** Сборник: заставка над городом, анекдоты по очереди, между ними — пролёт по карте к следующему зданию. */
const FPS = 30;
export const INTRO = Math.round(1.4 * FPS);
export const FLY = Math.round(1.6 * FPS);
/** Пауза между анекдотами под картой (доля пролёта): следующий начинается, когда карта ещё закрывает кадр. */
const GAP = Math.round(FLY * 0.7);

export function compilationLayout(p: CompilationProps) {
  let t = INTRO;
  const items = p.episodes.map((ep, i) => {
    const frames = buildTimeline(ep).durationInFrames;
    const from = t;
    t += frames + (i < p.episodes.length - 1 ? GAP : 0);
    return { ep, from, frames };
  });
  return { items, durationInFrames: t };
}

const firstScene = (ep: Episode) => scenesOf(ep)[0];
const lastScene = (ep: Episode) => scenesOf(ep)[scenesOf(ep).length - 1];

export const Compilation = (p: CompilationProps) => {
  const { items } = compilationLayout(p);
  const first = firstScene(items[0].ep);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {items.map(({ ep, from, frames }) => (
        <Sequence key={ep.id} from={from} durationInFrames={frames}>
          <Joke {...ep} />
        </Sequence>
      ))}
      {items.slice(1).map(({ ep, from }, i) => {
        const prev = items[i];
        const end = prev.from + prev.frames;
        const a = lastScene(prev.ep), b = firstScene(ep);
        return (
          <Flyover key={ep.id} at={end + Math.round(FLY * 0.35)} frames={FLY} locale={p.locale}
            from={buildingFor(a.location, a.place)} to={buildingFor(b.location, b.place)} />
        );
      })}
      <TownIntro frames={INTRO} to={buildingFor(first.location, first.place)} locale={p.locale} title={p.title} />
    </AbsoluteFill>
  );
};
