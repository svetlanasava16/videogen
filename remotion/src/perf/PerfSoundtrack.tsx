/**
 * Звук исполнения: озвучка реплик, смех в конце, эффекты, закадровый смех и тихая музыка,
 * которая проседает под репликами и плавно входит/уходит. Те же правила, что components/Soundtrack, но из performance.json.
 */
import { Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { TimedLine } from "../timeline";
import { frameOf } from "./tracks";
import type { Performance } from "./types";

const VOICE_VOL = 1;
const LAUGH_VOL = 0.7;
const MUSIC_VOL = 0.1;
const MUSIC_DUCKED = 0.05;
const FADE = 15; // кадров (0,5 с при 30 fps)

export const PerfSoundtrack = ({ perf, lines }: { perf: Performance; lines: TimedLine[] }) => {
  const frame = useCurrentFrame();
  const { fps, frames: N, audio } = perf;
  const speaking = lines.some((l) => frame >= l.startFrame - 3 && frame <= l.endFrame + 3);
  const edge = interpolate(frame, [0, FADE, N - FADE, N], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const f = (s: number) => frameOf(s, fps);
  return (
    <>
      {audio.music && <Html5Audio src={staticFile(audio.music)} loop volume={edge * (speaking ? MUSIC_DUCKED : MUSIC_VOL)} />}
      {perf.captions.filter((l) => l.audio).map((l) => (
        <Sequence key={`v-${l.id}`} from={f(l.audio!.from)} layout="none">
          <Html5Audio src={staticFile(l.audio!.file)} volume={VOICE_VOL} playbackRate={l.audio!.rate} />
        </Sequence>
      ))}
      {audio.outro.map((o) => (
        <Sequence key={`o-${o.character}`} from={f(o.from)} durationInFrames={f(o.dur)} layout="none">
          <Html5Audio src={staticFile(o.file)} volume={VOICE_VOL} />
        </Sequence>
      ))}
      {audio.sfx.map((c, i) => (
        <Sequence key={`sfx-${i}`} from={f(c.from)} durationInFrames={f(c.dur)} layout="none">
          <Html5Audio src={staticFile(c.file)} volume={0.8} />
        </Sequence>
      ))}
      {audio.laughs.map((c, i) => {
        const frames = f(c.dur);
        return (
          <Sequence key={i} from={f(c.from)} durationInFrames={frames} layout="none">
            <Html5Audio src={staticFile(c.file)} volume={(x) => LAUGH_VOL * interpolate(x, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          </Sequence>
        );
      })}
    </>
  );
};
