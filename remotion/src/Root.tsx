import { Composition } from "remotion";
import { Episode } from "@jf/core";
import demo from "../../content/episodes/demo-ru.json";
import { Joke } from "./Joke";
import { Cast } from "./Cast";
import { buildTimeline } from "./timeline";

const defaultEpisode = Episode.parse(demo);

export const Root = () => (
  <>
  <Composition id="Cast" component={Cast} width={1600} height={1900} fps={30} durationInFrames={1} />
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
