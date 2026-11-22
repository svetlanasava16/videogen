import { Composition } from "remotion";
import "./fonts"; // Inter из remotion/public/fonts — до любой композиции
import { Episode } from "@jf/core";
import demo from "../../content/episodes/demo-ru.json";
import { Joke, PerformanceView, performanceOf } from "./Joke";
import type { Performance } from "./perf/types";
import { Cast } from "./Cast";
import { Acts } from "./Acts";
import { Outfits, outfitsSize } from "./Outfits";
import { Locations } from "./Locations";
import { Cover } from "./Cover";
import { TownPreview } from "./world/Flyover";
import { Compilation, CompilationProps, compilationLayout } from "./Compilation";
import demo2 from "../../content/episodes/test-scenes.ru.json";
import { buildTimeline } from "./timeline";
import { VehiclesPreview, VEHICLES_PREVIEW_SIZE } from "./VehiclesPreview";
import { PropsPreview, propsPreviewSize, allPropIds } from "./PropsPreview";

const defaultEpisode = Episode.parse(demo);

export const Root = () => (
  <>
  <Composition id="Locations" component={Locations} width={2860} height={3240} fps={30} durationInFrames={1} defaultProps={{ only: [] as string[], marks: false, locale: "ru" as const }} />
  <Composition id="Props" component={PropsPreview} {...propsPreviewSize("props", allPropIds().length)} fps={30} durationInFrames={1} defaultProps={{ only: [] as string[], rest: true, mode: "props" }} calculateMetadata={({ props }) => { const p = props as { only?: string[]; mode?: string }; return propsPreviewSize(p.mode ?? "props", p.only?.length || allPropIds().length); }} />
  <Composition id="Vehicles" component={VehiclesPreview} {...VEHICLES_PREVIEW_SIZE} fps={30} durationInFrames={1} defaultProps={{ grid: false, moving: false }} />
  <Composition id="Cast" component={Cast} width={2450} height={2850} fps={30} durationInFrames={1} />
  <Composition id="Outfits" component={Outfits} {...outfitsSize("outfits")} fps={30} durationInFrames={1} defaultProps={{ mode: "outfits" }} calculateMetadata={({ props }) => outfitsSize(String((props as { mode?: string }).mode ?? "outfits"))} />
  <Composition id="Acts" component={Acts} width={3520} height={3120} fps={30} durationInFrames={1} defaultProps={{ who: "muzhik" }} />
  <Composition
    id="Compilation"
    component={Compilation}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={compilationLayout({ id: "demo", locale: "ru", title: "Демо", episodes: [defaultEpisode, Episode.parse(demo2)] }).durationInFrames}
    defaultProps={{ id: "demo", locale: "ru" as const, title: "Демо", episodes: [defaultEpisode, Episode.parse(demo2)] }}
    calculateMetadata={({ props }) => {
      const p = CompilationProps.parse(props);
      return { durationInFrames: compilationLayout(p).durationInFrames, props: p };
    }}
  />
  <Composition id="Town" component={TownPreview} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ locale: "ru" as const }} />
  <Composition id="Cover" component={Cover} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={defaultEpisode}
    calculateMetadata={({ props }) => ({ props: Episode.parse(props) })} />
  <Composition
    id="Performance"
    component={PerformanceView}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={1}
    defaultProps={{ perf: performanceOf(defaultEpisode) }}
    calculateMetadata={({ props }) => {
      const p = (props as { perf: Performance }).perf;
      return { durationInFrames: p.frames, width: p.width, height: p.height, fps: p.fps };
    }}
  />
  <Composition
    id="Joke"
    component={Joke}
    width={defaultEpisode.format.width}
    height={defaultEpisode.format.height}
    fps={defaultEpisode.format.fps}
    durationInFrames={buildTimeline(defaultEpisode).durationInFrames}
    defaultProps={defaultEpisode}
    calculateMetadata={({ props }) => {
      const ep = Episode.parse(props);
      return {
        durationInFrames: buildTimeline(ep).durationInFrames,
        width: ep.format.width,
        height: ep.format.height,
        fps: ep.format.fps,
        props: ep,
      };
    }}
  />
  </>
);
