import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { NARRATOR, type Episode } from "@jf/core";
import { characters, locations } from "./registry";
import { buildTimeline } from "./timeline";
import { Background } from "./components/Background";
import { Puppet } from "./components/Puppet";
import { Captions } from "./components/Captions";

export const Joke = (ep: Episode) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { lines } = buildTimeline(ep);
  const loc = locations[ep.location];

  const current = lines.find((l) => frame >= l.startFrame && frame <= l.endFrame + 4);
  const slotW = width / ep.cast.length;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Background location={loc} />
      {ep.cast.map((id, i) => {
        const ch = characters[id];
        const speaking = current?.character === id && frame <= current.endFrame;
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: slotW * i,
              width: slotW,
              top: height * 0.22,
              height: height * 0.4,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Puppet
              character={ch}
              speaking={speaking}
              emotion={current?.character === id ? current.emotion : "neutral"}
              flip={i % 2 === 1}
              seed={i * 17}
            />
          </div>
        );
      })}
      <Captions line={current} locale={ep.locale} narrator={current?.character === NARRATOR} />
    </AbsoluteFill>
  );
};
