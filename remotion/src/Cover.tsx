import { AbsoluteFill, useVideoConfig } from "remotion";
import { lookForRole, type Episode } from "@jf/core";
import { costumeFor } from "./puppet/costume";
import { characters, locations } from "./registry";
import { Background } from "./components/Background";
import { BOX_H, BOX_W, Puppet } from "./components/Puppet";
import { Watermark } from "./components/Branding";

const FLOOR = 0.62;
const PUPPET_H = 0.4;

/** Обложка Reel: фон, все куклы каста, крупный заголовок. Рендерится в renders/<id>/cover.jpg. */
export const Cover = (ep: Episode) => {
  const { width, height } = useVideoConfig();
  const boxH = height * PUPPET_H;
  const boxW = (boxH * BOX_W) / BOX_H;
  const top = height * FLOOR - (boxH * 585) / BOX_H;
  const n = ep.cast.length;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Background location={locations[ep.location]} place={ep.place} />
      {ep.cast.map((id, i) => {
        const x = ((i + 0.5) / n) * width;
        const facing: 1 | -1 = n === 1 ? 1 : i < (n - 1) / 2 ? 1 : -1;
        return (
          <div key={id} style={{ position: "absolute", left: x - boxW / 2, top, width: boxW, height: boxH, display: "flex", justifyContent: "center" }}>
            <Puppet look={costumeFor(characters[id], ep.roles[id], ep.looks?.[id] ?? ep.scenes?.[0]?.looks?.[id])} emotion={i === 0 ? "happy" : "surprised"} speaking={false} facing={facing} seed={i * 17} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute", left: 70, right: 70, top: "10%", textAlign: "center",
          fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif", fontWeight: 900, fontSize: 120, lineHeight: 1.05,
          color: "#ffd400", textTransform: "uppercase", WebkitTextStroke: "14px #000", paintOrder: "stroke fill",
        }}
      >
        {ep.title}
      </div>
      <Watermark />
    </AbsoluteFill>
  );
};
