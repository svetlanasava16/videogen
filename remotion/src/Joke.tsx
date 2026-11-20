import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { NARRATOR, lookForRole, type Episode } from "@jf/core";
import { characters, locations } from "./registry";
import { buildTimeline } from "./timeline";
import { Background } from "./components/Background";
import { BOX_H, BOX_W, Puppet } from "./components/Puppet";
import { Captions } from "./components/Captions";
import { Soundtrack } from "./components/Soundtrack";
import { Watermark } from "./components/Branding";

const FLOOR = 0.62; // линия пола (доля высоты кадра) — совпадает с FLOOR_Y фонов
const PUPPET_H = 0.4; // высота бокса куклы (доля высоты кадра)
const ease = Easing.inOut(Easing.cubic);

export const Joke = (ep: Episode) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const tl = buildTimeline(ep);
  const loc = locations[ep.location];
  const current = tl.lines.find((l) => frame >= l.startFrame && frame <= l.endFrame + 4);

  const boxH = height * PUPPET_H;
  const boxW = (boxH * BOX_W) / BOX_H;
  const top = height * FLOOR - (boxH * 585) / BOX_H; // ноги куклы на линии пола

  /**
   * Позиция x куклы: слоты делятся между теми, кто в кадре, пропорционально присутствию
   * (остальные плавно раздвигаются); входящий идёт от ближнего края к своему слоту.
   */
  const xAt = (id: string, f: number) => {
    const w = ep.cast.map((c) => ease(tl.presence(c, f)));
    const total = w.reduce((a, b) => a + b, 0) || 1;
    const i = ep.cast.indexOf(id);
    const before = w.slice(0, i).reduce((a, b) => a + b, 0);
    const slot = ((before + Math.max(w[i], 0.0001) / 2) / total) * width;
    const p = ease(tl.presence(id, f));
    const edge = i < ep.cast.length / 2 ? -boxW : width + boxW;
    return interpolate(p, [0, 1], [edge, slot]);
  };

  const people = ep.cast.filter((id) => tl.presence(id, frame) > 0);
  const centre = (except: string) => {
    const others = people.filter((c) => c !== except);
    return others.length ? others.reduce((a, c) => a + xAt(c, frame), 0) / others.length : undefined;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Background location={loc} place={ep.place} />
      {people.map((id, i) => {
        const ch = characters[id];
        const x = xAt(id, frame);
        const dx = x - xAt(id, frame - 1);
        const walk = Math.min(1, Math.abs(dx) / 6);
        // рот двигается только пока звучит слово (а не всю реплику с паузами и хвостом)
        const talking = current?.character === id && current.words.some((w) => frame >= w.startFrame - 1 && frame <= w.endFrame);
        const laughing = tl.laughing(id, frame);
        const speaking = talking || laughing;
        const c = centre(id);
        const facing: 1 | -1 = walk > 0.2 ? (dx > 0 ? 1 : -1) : c === undefined ? 1 : c >= x ? 1 : -1;
        return (
          <div key={id} style={{ position: "absolute", left: x - boxW / 2, top, width: boxW, height: boxH, display: "flex", justifyContent: "center" }}>
            <Puppet
              look={lookForRole(ch, ep.roles[id])}
              speaking={speaking}
              emotion={laughing ? "happy" : current?.character === id ? current.emotion : "neutral"}
              walk={walk}
              facing={facing}
              seed={ep.cast.indexOf(id) * 17 + i}
            />
          </div>
        );
      })}
      <Captions line={current} locale={ep.locale} narrator={current?.character === NARRATOR} />
      <Watermark />
      <Soundtrack tl={tl} />
    </AbsoluteFill>
  );
};
