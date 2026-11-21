import { Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { buildTimeline } from "../timeline";

type TL = ReturnType<typeof buildTimeline>;

const VOICE_VOL = 1;
const LAUGH_VOL = 0.7;
const MUSIC_VOL = 0.1;
const MUSIC_DUCKED = 0.05;
const FADE = 15; // кадров (0,5 с при 30 fps)

/**
 * Звуковая дорожка: закадровый смех после реплик и тихая фоновая музыка,
 * которая проседает под репликами и плавно входит/уходит.
 */
export const Soundtrack = ({ tl }: { tl: TL }) => {
  // кадр композиции: у зацикленного трека кадр в volume-колбэке считается от начала повтора, поэтому громкость считаем здесь
  const frame = useCurrentFrame();
  const speaking = tl.lines.some((l) => frame >= l.startFrame - 3 && frame <= l.endFrame + 3);
  const edge = interpolate(frame, [0, FADE, tl.durationInFrames - FADE, tl.durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const musicVolume = edge * (speaking ? MUSIC_DUCKED : MUSIC_VOL);
  return (
    <>
      {tl.music && (
        <Html5Audio
          src={staticFile(tl.music.file)}
          loop
          volume={musicVolume}
        />
      )}
      {tl.lines.filter((l) => l.audioFile).map((l) => (
        <Sequence key={`v-${l.id}`} from={l.startFrame} layout="none">
          <Html5Audio src={staticFile(l.audioFile!)} volume={VOICE_VOL} playbackRate={l.rate} />
        </Sequence>
      ))}
      {tl.outro.map((o) => (
        <Sequence key={`o-${o.character}`} from={o.from} durationInFrames={o.frames} layout="none">
          <Html5Audio src={staticFile(o.file)} volume={VOICE_VOL} />
        </Sequence>
      ))}
      {tl.sfx.map((c, i) => (
        <Sequence key={`sfx-${i}`} from={c.from} durationInFrames={c.frames} layout="none">
          <Html5Audio src={staticFile(c.clip.file)} volume={0.8} />
        </Sequence>
      ))}
      {tl.laughs.map((c, i) => (
        <Sequence key={i} from={c.from} durationInFrames={c.frames} layout="none">
          <Html5Audio
            src={staticFile(c.clip.file)}
            volume={(f) => LAUGH_VOL * interpolate(f, [c.frames - 8, c.frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          />
        </Sequence>
      ))}
    </>
  );
};
