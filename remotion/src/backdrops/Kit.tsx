/**
 * Фон из данных: content/locations/<id>.json → kit. Новое место без нового кода — из тех же деталей, что и нарисованные фоны.
 * Координаты кадра 1080×1920, пол FLOOR_Y = 1190. Цвета по умолчанию — из палитры места.
 */
import type { Location } from "@jf/core";
import { Canvas, Cloud, Door, Fence, FLOOR_Y, HangingLamp, Outdoor, Picture, Plant, Room, Rug, Shelf, Table, Tree, Window } from "./parts";

type Kit = NonNullable<Location["kit"]>;

export const KitBackdrop = ({ kit, palette }: { kit: Kit; palette: Location["palette"] }) => (
  <Canvas>
    {kit.base === "room" ? <Room wall={palette.wall} floor={palette.floor} /> : <Outdoor sky={kit.sky ?? palette.wall} ground={kit.ground ?? palette.floor} horizon={kit.horizon} />}
    {kit.items.map((it, i) => {
      const c = it.color ?? palette.accent;
      switch (it.part) {
        case "window": return <Window key={i} x={it.x} y={it.y ?? 520} w={it.w} h={it.h} night={it.night} />;
        case "door": return <Door key={i} x={it.x} w={it.w} h={it.h} color={it.color} />;
        case "shelf": return <Shelf key={i} x={it.x} y={it.y ?? 700} w={it.w} color={it.color} items={it.items ?? [palette.accent, "#7fb3d5", "#c8553d", "#5b8c5a"]} />;
        case "lamp": return <HangingLamp key={i} x={it.x} len={it.h} color={it.color} />;
        case "table": return <Table key={i} x={it.x} w={it.w} h={it.h} top={it.color} legs={it.color2} />;
        case "plant": return <Plant key={i} x={it.x} y={it.y ?? FLOOR_Y} scale={it.s} />;
        case "tree": return <Tree key={i} x={it.x} y={it.y ?? FLOOR_Y} s={it.s} crown={it.color} kind={(it.kind as "round" | "pine" | "birch") ?? "round"} />;
        case "fence": return <Fence key={i} x0={it.x} x1={it.x + (it.w ?? 1080)} y={it.y ?? FLOOR_Y} color={it.color} h={it.h} />;
        case "picture": return <Picture key={i} x={it.x} y={it.y ?? 520} w={it.w} h={it.h} art={it.color} />;
        case "rug": return <Rug key={i} cx={it.x} color={c} w={it.w} />;
        case "cloud": return <Cloud key={i} x={it.x} y={it.y ?? 200} s={it.s} />;
        case "rect": return <rect key={i} x={it.x} y={it.y ?? 0} width={it.w ?? 100} height={it.h ?? 100} rx={it.r ?? 6} fill={c} />;
        case "circle": return <circle key={i} cx={it.x} cy={it.y ?? 0} r={it.r ?? 40} fill={c} />;
        case "path": return <path key={i} d={it.d ?? ""} transform={`translate(${it.x} ${it.y ?? 0})`} fill={c} />;
        default: return null;
      }
    })}
  </Canvas>
);
