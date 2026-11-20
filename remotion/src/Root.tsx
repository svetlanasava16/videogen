import { Composition } from "remotion";
import { Episode } from "@jf/core";
import demo from "../../content/episodes/demo-ru.json";
import { Joke } from "./Joke";
import { Cast } from "./Cast";
import { Locations } from "./Locations";
import { Cover } from "./Cover";
import { buildTimeline } from "./timeline";

const defaultEpisode = Episode.parse(demo);

export const Root = () => (
  <>
  <Composition id="Locations" component={Locations} width={2860} height={2700} fps={30} durationInFrames={1} defaultProps={{ only: [] as string[] }} />
  <Composition id="Cast" component={Cast} width={2450} height={1950} fps={30} durationInFrames={1} />
  <Composition id="Cover" component={Cover} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={defaultEpisode}
    calculateMetadata={({ props }) => ({ props: Episode.parse(props) })} />
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
