/**
 * Звук исполнения в Remotion: план звука из @jf/player (озвучка, смех в конце, эффекты, закадровый смех)
 * и громкость музыки на кадре (вход/выход, проседание под репликами).
 */
import { Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { audioPlan, musicGain, type CaptionLine, type Performance } from "@jf/player";

export const PerfSoundtrack = ({ perf, lines }: { perf: Performance; lines: CaptionLine[] }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {perf.audio.music && <Html5Audio src={staticFile(perf.audio.music)} loop volume={musicGain(perf, frame, lines)} />}
      {audioPlan(perf).map((c) => (
        <Sequence key={c.key} from={c.from} durationInFrames={c.frames} layout="none">
          <Html5Audio src={staticFile(c.file)} playbackRate={c.rate}
            volume={c.fadeOut ? (x) => c.gain * interpolate(x, [c.frames! - c.fadeOut!, c.frames!], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : c.gain} />
        </Sequence>
      ))}
    </>
  );
};
