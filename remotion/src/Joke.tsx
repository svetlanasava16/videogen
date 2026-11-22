import type { ReactElement } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { NARRATOR, PLANES, lookForRole, markOf, marksFor, subLocation, type Episode, type SetItem } from "@jf/core";
import { costumeFor } from "./puppet/costume";
import { characters, locations } from "./registry";
import { buildTimeline, type SceneTL, type Timeline } from "./timeline";
import { Background } from "./components/Background";
import { BOX_H, BOX_W, Puppet } from "./components/Puppet";
import { Captions } from "./components/Captions";
import { Soundtrack } from "./components/Soundtrack";
import { Watermark } from "./components/Branding";
import { SceneTransition } from "./world/Transitions";
import { Flyover } from "./world/Flyover";
import { buildingFor } from "./world/town";
import { Crowd, CrowdFront } from "./world/Crowd";
import { SEAT_ITEMS, SET_PIECES, SetPiece, pieceWidth } from "./world/SetPieces";
import { VEHICLE_SPECS, VehicleArt } from "./world/Vehicles";
import { PropItem } from "./props/Props";
import { LocaleProvider } from "./i18n/signs";
import { LANE, WALL_Y, depthScale, feetY } from "./world/depth";
import { cameraAt, cameraTransform } from "./director/camera";

/** Мебель, за которой по умолчанию сидят. */
const SEAT_DEFAULT = ["dining-table", "table", ...SEAT_ITEMS];
const FLOOR = WALL_Y / 1920; // линия стены (дальний план) — совпадает с FLOOR_Y фонов
const PUPPET_H = 0.4; // высота бокса куклы среднего плана (доля высоты кадра)
const FEET = 585 / BOX_H; // стопы куклы в её боксе
const ease = Easing.inOut(Easing.cubic);

/** Высота столешницы над полом (px при масштабе 1) — куда ложится положенный предмет (prop put). */
const TABLE_TOP: Record<string, number> = { "dining-table": 204, table: 200, desk: 330, counter: 380, lectern: 300, scales: 380, sink: 300 };
/** Положенный предмет рисуется в режиме rest (Props.tsx, таблица REST): его низ — на линии поверхности (y = 0). */
const PROP_REST = 0;

/** Насколько близко подходит кукла к цели действия (доля ширины бокса). */
const NEAR = 0.55;
/** Масштаб кукол по числу персонажей сцены: до трёх — как есть, 4–5 — мельче, чтобы все помещались в общем плане. */
const CAST_SCALE: Record<number, number> = { 4: 0.8, 5: 0.66 };
/** С 6 персонажей сцена шире кадра (куклы как при четырёх), камера едет вдоль неё. */
const WIDE_FROM = 6;
const WIDE_SCALE = 0.8;
/** Сколько кукол такого размера помещается в ширину кадра. */
const WIDE_PER_FRAME = 4.5;
/** Куклы на разных планах (|Δz| больше) не раздвигаются: один стоит за спиной другого. */
const SAME_PLANE = 0.25;
/** На разных планах — меньший зазор (доля MIN_GAP): дальний стоит за плечом ближнего, но его лицо видно. */
const BEHIND_GAP = 0.8;
/** Машины по умолчанию едут по дороге между средним и передним планом. */
const VEHICLE_Z = 0.3;
/** Машины чуть меньше «настоящих»: в вертикальном кадре легковая в профиле иначе шире кадра и закрывает героев. */
const VEHICLE_K = 0.85;
/** Вышедший из машины стоит перед ней (ближе к камере на столько), а не за кузовом. */
const ALIGHT_DZ = 0.3;

/**
 * Геометрия сцены на каждом кадре: где стоят куклы (x — автослоты, метки места, входы и уходы; z — план глубины),
 * их бокс (масштаб плана), машины и седоки, сиденья. Всё — функции кадра.
 */
export function stageGeometry(tl: Timeline, sc: SceneTL, width: number, height: number) {
  const cast = sc.scene.cast;
  const wide = cast.length >= WIDE_FROM;
  // ширина сцены: кадр или шире (широкая сцена, камера-панорама)
  const stageW = wide ? width * (cast.length / WIDE_PER_FRAME) : width;
  const castK = wide ? WIDE_SCALE : CAST_SCALE[cast.length] ?? 1;
  const boxH = height * PUPPET_H * castK; // средний план
  const boxW = (boxH * BOX_W) / BOX_H;
  const loc = locations[sc.scene.location];
  const marks = marksFor(loc, sc.scene.place);
  const mark = (k: string) => markOf(marks[k]);
  const edgeX = (side: "left" | "right", w = boxW) => (side === "left" ? -w : stageW + w);
  const nearEdge = (id: string): "left" | "right" => (cast.indexOf(id) < cast.length / 2 ? "left" : "right");
  const pres = (id: string, f: number) => tl.presence(sc, id, f);
  const markX = (k: string) => Math.min(stageW - boxW * 0.42, Math.max(boxW * 0.42, (mark(k)?.x ?? 0.5) * stageW));

  // ---- машины ----
  const vehicles = sc.scene.vehicles ?? [];
  const vehOf = (vid: string) => vehicles.find((v) => v.id === vid);
  const vehZ = (vid: string) => {
    const v = vehOf(vid);
    if (!v) return VEHICLE_Z;
    if (v.plane) return PLANES[v.plane];
    const first = v.at ?? sc.drives.find((d) => d.vehicle === vid && d.target !== "slot")?.target;
    // машины едут по дороге (передний план); дальняя метка (обочина у стены) задаёт только x — иначе машина ехала бы по тротуару
    const m = first ? marks[first] : undefined;
    const mz = m !== undefined && typeof m !== "number" ? m.z : undefined;
    return mz !== undefined && mz <= PLANES.mid ? mz : VEHICLE_Z;
  };
  const vehScale = (vid: string) => depthScale(vehZ(vid)) * VEHICLE_K;
  const vehW = (vid: string) => VEHICLE_SPECS[vehOf(vid)!.kind].w * vehScale(vid);
  const vehX = (vid: string, f: number): number => {
    const v = vehOf(vid)!;
    const ds = sc.drives.filter((d) => d.vehicle === vid && d.from <= f);
    const d = ds[ds.length - 1];
    const W = vehW(vid) / 2 + 30;
    const startX = v.at ? markX(v.at) : edgeX(v.facing === "left" ? "right" : "left", W);
    if (!d) return startX;
    const k = ease(Math.min(1, (f - d.from) / Math.max(1, d.to - d.from)));
    if (d.kind === "enter") return interpolate(k, [0, 1], [edgeX(d.edge ?? "left", W), markX(d.target)]);
    const from = vehX(vid, d.from - 1);
    if (d.kind === "exit") return interpolate(k, [0, 1], [from, edgeX(d.edge ?? "right", W)]);
    return interpolate(k, [0, 1], [from, markX(d.target)]);
  };
  /** Машина в кадре: стоит с начала (at) или въехала; уехала — нет. */
  const vehPresent = (vid: string, f: number) => {
    const v = vehOf(vid);
    if (!v) return false;
    const ds = sc.drives.filter((d) => d.vehicle === vid && d.from <= f);
    const d = ds[ds.length - 1];
    if (!d) return !!v.at;
    return d.kind !== "exit" || f < d.to;
  };
  const vehMoving = (vid: string, f: number) => sc.drives.some((d) => d.vehicle === vid && d.from <= f && f < d.to && d.to > d.from);
  /** Куда смотрит машина: задано, иначе по направлению последней поездки. */
  const vehFacing = (vid: string, f: number): 1 | -1 => {
    const v = vehOf(vid);
    if (v?.facing) return v.facing === "left" ? -1 : 1;
    const dx = vehX(vid, f) - vehX(vid, f - 2);
    if (Math.abs(dx) > 0.5) return dx > 0 ? 1 : -1;
    const ds = sc.drives.filter((d) => d.vehicle === vid && d.from <= f && d.to > d.from);
    const d = ds[ds.length - 1];
    if (!d) return 1;
    return vehX(vid, d.to) >= vehX(vid, d.from) ? 1 : -1;
  };
  /** Где сидит седок: место по порядку посадки (первый — водитель). */
  const riderSeat = (id: string, vid: string, f: number) => {
    const sp = VEHICLE_SPECS[vehOf(vid)!.kind];
    const i = Math.max(0, tl.ridersOf(sc, vid, f).indexOf(id));
    return sp.seats[Math.min(i, sp.seats.length - 1)];
  };
  const doorX = (vid: string, f: number) => vehX(vid, f) + VEHICLE_SPECS[vehOf(vid)!.kind].door * vehScale(vid) * vehFacing(vid, f);

  /** Автослот: доли ширины делятся между теми, кто в кадре, пропорционально присутствию. При 4–5 — с полями, чтобы крайние не обрезались. */
  const margin = cast.length >= 4 ? boxW * 0.32 : 0;
  const slotX = (id: string, f: number) => {
    const w = cast.map((c) => ease(pres(c, f)));
    const total = w.reduce((a, b) => a + b, 0) || 1;
    const i = cast.indexOf(id);
    const before = w.slice(0, i).reduce((a, b) => a + b, 0);
    return margin + ((before + Math.max(w[i], 0.0001) / 2) / total) * (stageW - 2 * margin);
  };

  const lastMove = (id: string, f: number) => {
    const ms = sc.moves.filter((m) => m.id === id && m.from <= f);
    return ms[ms.length - 1];
  };

  const xAt = (id: string, f: number): number => {
    const riding = tl.ridingIn(sc, id, f);
    if (riding && vehOf(riding)) return vehX(riding, f) + riderSeat(id, riding, f).dx * vehScale(riding) * vehFacing(riding, f);
    const m = lastMove(id, f);
    if (!m) return slotX(id, f);
    const k = ease(Math.min(1, (f - m.from) / Math.max(1, m.to - m.from)));
    const target = (ff: number) => {
      if (m.target === "slot") return slotX(id, ff);
      // подойти вплотную к другой кукле (удар, объятие): встать с той стороны, откуда пришёл
      if (m.target.startsWith("near:")) {
        const tid = m.target.slice(5);
        const tx = tid === id ? xAt(id, m.from - 1) : xAt(tid, m.from);
        const side = xAt(id, m.from - 1) < tx ? -1 : 1;
        return tx + side * boxW * NEAR;
      }
      // к двери машины (посадка) или у двери (высадка)
      if (m.target.startsWith("veh:") && vehOf(m.target.slice(4))) return doorX(m.target.slice(4), ff);
      return markX(m.target);
    };
    if (m.kind === "enter") {
      // старый формат: вход по присутствию от ближнего края к слоту
      if (m.target === "slot" && !m.edge) return interpolate(ease(pres(id, f)), [0, 1], [edgeX(nearEdge(id)), slotX(id, f)]);
      return interpolate(k, [0, 1], [edgeX(m.edge ?? nearEdge(id)), target(f)]);
    }
    if (m.kind === "exit") {
      if (m.target === "slot" && !m.edge) return interpolate(ease(pres(id, f)), [0, 1], [edgeX(nearEdge(id)), slotX(id, f)]);
      const startX = xAt(id, m.from - 1);
      return interpolate(k, [0, 1], [startX, edgeX(m.edge ?? nearEdge(id))]);
    }
    if (m.from === m.to) return target(f);
    const startX = xAt(id, m.from - 1);
    return interpolate(k, [0, 1], [startX, target(f)]);
  };

  /** План куклы в конце хода (без обхода): из бита (plane), метки, цели (near:) или машины; автослот — средний план. */
  const targetZ = (id: string, m: NonNullable<ReturnType<typeof lastMove>>): number => {
    if (m.z !== undefined) return m.z;
    if (m.target.startsWith("near:")) { const t = m.target.slice(5); return t === id ? zBase(id, m.from - 1) : zBase(t, m.from); }
    if (m.target.startsWith("veh:")) return Math.max(0, vehZ(m.target.slice(4)) - ALIGHT_DZ);
    if (m.target === "slot") return m.kind === "exit" ? zBase(id, m.from - 1) : PLANES.mid;
    return mark(m.target)?.z ?? PLANES.mid;
  };
  /** Ход пересекает кукол того же плана — тогда обход по передней дорожке (или за спинами, via: back). */
  const laneCache = new Map<string, number>();
  const laneOf = (id: string, m: NonNullable<ReturnType<typeof lastMove>>): number => {
    const key = `${id}@${m.from}`;
    const hit = laneCache.get(key);
    if (hit !== undefined) return hit;
    let lane = 0;
    if (m.kind === "walk" && m.to > m.from) {
      const a = xAt(id, m.from - 1), b = xAt(id, m.to);
      const z0 = zBase(id, m.from - 1);
      const lo = Math.min(a, b) + boxW * 0.3, hi = Math.max(a, b) - boxW * 0.3;
      const blocked = cast.some((o) => o !== id && pres(o, m.from) > 0.5 && !tl.ridingIn(sc, o, m.from) && Math.abs(zBase(o, m.from) - z0) < SAME_PLANE && xAt(o, m.from) > lo && xAt(o, m.from) < hi);
      if (m.via) lane = m.via === "back" ? LANE : -LANE;
      else if (blocked) lane = -LANE;
    }
    laneCache.set(key, lane);
    return lane;
  };
  /** План куклы без обхода. */
  const zBase = (id: string, f: number): number => {
    const riding = tl.ridingIn(sc, id, f);
    if (riding && vehOf(riding)) return vehZ(riding);
    const m = lastMove(id, f);
    if (!m) return PLANES.mid;
    const tz = targetZ(id, m);
    if (m.kind === "enter" || m.from === m.to) return tz;
    const k = ease(Math.min(1, (f - m.from) / Math.max(1, m.to - m.from)));
    return zBase(id, m.from - 1) + (tz - zBase(id, m.from - 1)) * k;
  };
  /** План куклы на кадре (с обходом посередине хода). */
  const zAt = (id: string, f: number): number => {
    const m = lastMove(id, f);
    const base = zBase(id, f);
    if (!m || tl.ridingIn(sc, id, f)) return base;
    const lane = laneOf(id, m);
    if (!lane || f >= m.to) return base;
    const k = Math.min(1, (f - m.from) / Math.max(1, m.to - m.from));
    return Math.min(1.15, Math.max(-0.15, base + lane * Math.sin(Math.PI * k)));
  };

  /** Раздвижка: куклы одного плана не стоят ближе MIN_GAP друг к другу (метки бывают рядом). */
  const MIN_GAP = boxW * 0.78;
  const cache = new Map<number, Map<string, number>>();
  const layout = (f: number) => {
    const hit = cache.get(f);
    if (hit) return hit;
    // кто подошёл вплотную (удар, объятие) — не раздвигаем его с целью
    const close = new Set(sc.moves.filter((m) => m.from <= f && m.target.startsWith("near:")).flatMap((m) => [m.id, m.target.slice(5)]));
    const xs = cast.map((id) => ({ id, x: xAt(id, f), z: zAt(id, f), on: pres(id, f) > 0.5 && !tl.ridingIn(sc, id, f) })).sort((a, b) => a.x - b.x);
    for (let it = 0; it < 4; it++) {
      for (let i = 0; i < xs.length; i++) {
        for (let j = i + 1; j < xs.length; j++) {
          const a = xs[i], b = xs[j];
          if (!a.on || !b.on || (close.has(a.id) && close.has(b.id))) continue;
          // один план — не стоят друг в друге; разные — можно стоять за спиной, но лицо дальнего не закрыто ближним
          const gap = (Math.abs(a.z - b.z) >= SAME_PLANE ? MIN_GAP * BEHIND_GAP : MIN_GAP) * depthScale((a.z + b.z) / 2);
          const d = b.x - a.x;
          if (d < gap) {
            const push = (gap - d) / 2;
            a.x = Math.max(boxW * 0.45, a.x - push);
            b.x = Math.min(stageW - boxW * 0.45, b.x + push);
          }
        }
      }
    }
    const m = new Map(xs.map((v) => [v.id, v.x]));
    cache.set(f, m);
    return m;
  };
  const xOf = (id: string, f: number) => layout(f).get(id) ?? xAt(id, f);

  /** Бокс куклы на кадре: масштаб плана (в машине — места седока), стопы на полу плана (в машине — на сиденье). */
  const box = (id: string, f: number) => {
    const riding = tl.ridingIn(sc, id, f);
    if (riding && vehOf(riding)) {
      const vs = vehScale(riding);
      const seat = riderSeat(id, riding, f);
      const h = height * PUPPET_H * vs * seat.s;
      const feet = feetY(vehZ(riding), height) - seat.dy * vs;
      return { x: xOf(id, f), z: vehZ(riding), h, w: (h * BOX_W) / BOX_H, top: feet - h * FEET, s: vs * seat.s };
    }
    const z = zAt(id, f);
    const s = depthScale(z);
    const h = boxH * s;
    return { x: xOf(id, f), z, h, w: (h * BOX_W) / BOX_H, top: feetY(z, height) - h * FEET, s };
  };

  // ---- сиденья: метки с seat и мебель (стол, стулья, скамьи) ----
  const setItems: SetItem[] = [...(subLocation(loc, sc.scene.place)?.set ?? []), ...(sc.scene.set ?? [])];
  const itemZ = (it: SetItem) => (it.plane ? PLANES[it.plane] : mark(it.at ?? "")?.z ?? (SET_PIECES[it.item]?.layer === "back" && !SEAT_ITEMS.includes(it.item) ? PLANES.back : PLANES.mid));
  const setX = (at?: string) => (mark(at ?? "")?.x ?? ({ left: 0.25, right: 0.75 } as Record<string, number>)[at ?? ""] ?? 0.5) * stageW;
  const furnitureSeats = setItems.filter((it) => it.seat ?? SEAT_DEFAULT.includes(it.item)).map((it) => {
    const z = itemZ(it);
    const w = pieceWidth(it, stageW, castK * depthScale(z));
    const cx = setX(it.at);
    return { lo: cx - w / 2, hi: cx + w / 2, z };
  });
  /**
   * Сидит ли кукла (0..1): в машине — да; стоит на метке-сиденье или в пределах стола/скамьи своего плана, не идёт,
   * не подошла к кому-то (удар) и не встала (act stand) после того, как пришла; act sit рядом с сиденьем — на нём.
   */
  const seatedAt = (id: string, f: number): number => {
    if (tl.ridingIn(sc, id, f)) return 1;
    const m = lastMove(id, f);
    if (m && f < m.to) return 0;
    if (m && (m.target.startsWith("near:") || m.target.startsWith("veh:"))) return 0;
    const since = m ? m.to : sc.from;
    if (sc.acts.some((a) => a.who === id && a.act === "stand" && a.from >= since && a.from <= f)) return 0;
    const ramp = m && m.to > m.from ? Math.min(1, (f - m.to) / 6) : 1;
    if (m && mark(m.target)?.seat) return ramp;
    const x = xOf(id, f), z = zAt(id, f);
    if (furnitureSeats.some((s) => x >= s.lo && x <= s.hi && Math.abs(s.z - z) < 0.2)) return ramp;
    const sitting = tl.actAt(sc, id, f).base?.name === "sit";
    if (sitting && Object.values(marks).some((mk) => { const o = markOf(mk)!; return !!o.seat && Math.abs(o.x * stageW - x) < boxW * 0.5; })) return 1;
    return 0;
  };
  /** Голова и середина фигуры (для камеры): сидящий ниже на высоту ног. */
  const headY = (id: string, f: number) => { const b = box(id, f); return b.top + b.h * (0.33 + (seatedAt(id, f) > 0.5 && !tl.ridingIn(sc, id, f) ? 0.11 : 0)); };
  const bodyY = (id: string, f: number) => { const b = box(id, f); return b.top + b.h * (0.5 + (seatedAt(id, f) > 0.5 && !tl.ridingIn(sc, id, f) ? 0.11 : 0)); };
  /** В кадре: обычная кукла — по присутствию; седок — пока его машина в кадре. */
  const present = (id: string, f: number) => {
    const v = tl.ridingIn(sc, id, f);
    return v && vehOf(v) ? vehPresent(v, f) : pres(id, f) > 0;
  };

  return {
    boxW, boxH, castK, stageW, floorY: height * FLOOR, xAt: xOf, zAt, box, present, headY, bodyY, seatedAt,
    setItems, itemZ, setX, vehicles, vehX, vehZ, vehScale, vehPresent, vehMoving, vehFacing, riderSeat,
  };
}

/** Одна сцена: фон, массовка, куклы, мебель и машины на своих планах глубины; камера двигает холст. */
const Stage = ({ ep, tl, sc }: { ep: Episode; tl: Timeline; sc: SceneTL }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const geo = stageGeometry(tl, sc, width, height);
  const current = tl.lines.find((l) => l.scene === sc.index && frame >= l.startFrame && frame <= l.endFrame + 4);
  const people = sc.scene.cast.filter((id) => tl.presence(sc, id, frame) > 0 && !tl.ridingIn(sc, id, frame));
  const centre = (except: string) => {
    const others = people.filter((c) => c !== except);
    return others.length ? others.reduce((a, c) => a + geo.xAt(c, frame), 0) / others.length : undefined;
  };
  const cam = cameraAt(tl, sc, frame, { width, stageW: geo.stageW, height, headY: geo.headY, bodyY: geo.bodyY, xOf: geo.xAt, present: geo.present });
  // широкая сцена: фон увеличен до ширины сцены, линия стены на месте
  const bgScale = geo.stageW / width;

  /** Кукла в боксе b (на сцене или в машине). */
  const puppet = (id: string, i: number, b: { x: number; top: number; w: number; h: number }, opts: { facing?: 1 | -1; inVehicle?: boolean }) => {
    const ch = characters[id];
    const x = b.x;
    const dx = opts.inVehicle ? 0 : x - geo.xAt(id, frame - 1);
    const walk = Math.min(1, Math.abs(dx) / 6);
    // рот двигается только пока звучит слово (а не всю реплику с паузами и хвостом)
    const talking = current?.character === id && current.words.some((w) => frame >= w.startFrame - 1 && frame <= w.endFrame);
    const laughing = tl.laughing(id, frame);
    const c = centre(id);
    const { act, base } = tl.actAt(sc, id, frame);
    // действие по цели — лицом к цели
    const target = act || base ? sc.acts.filter((a) => a.who === id && a.from <= frame).pop()?.to : undefined;
    const tx = target && people.includes(target) ? geo.xAt(target, frame) : undefined;
    const facing: 1 | -1 = opts.facing ?? (walk > 0.2 ? (dx > 0 ? 1 : -1) : tx !== undefined ? (tx >= x ? 1 : -1) : c === undefined ? 1 : c >= x ? 1 : -1);
    return (
      <div key={id} style={{ position: "absolute", left: x - b.w / 2, top: b.top, width: b.w, height: b.h, display: "flex", justifyContent: "center" }}>
        <Puppet
          look={costumeFor(ch, sc.scene.roles[id] ?? ep.roles[id], sc.scene.looks?.[id])}
          speaking={talking || laughing}
          emotion={laughing ? "happy" : current?.character === id ? current.emotion : "neutral"}
          walk={walk}
          facing={facing}
          hold={tl.holding(sc, id, frame)}
          seed={sc.scene.cast.indexOf(id) * 17 + i}
          act={act}
          base={base}
          seated={geo.seatedAt(id, frame)}
          flinch={tl.flinchAt(sc, id, frame)}
        />
      </div>
    );
  };

  // всё, что стоит на полу, сортируется по плану: дальние раньше (выше и мельче), ближние поверх
  type Drawable = { z: number; key: string; node: ReactElement };
  const draw: Drawable[] = [];
  people.forEach((id, i) => {
    const b = geo.box(id, frame);
    draw.push({ z: b.z, key: `p:${id}`, node: puppet(id, i, b, {}) });
  });
  for (const it of geo.setItems) {
    const z = geo.itemZ(it);
    const front = SET_PIECES[it.item]?.layer === "front";
    // стол перед куклами своего плана, стул и диван — за ними
    draw.push({
      z: z + (front ? -0.01 : 0.01), key: `s:${it.item}:${it.at ?? ""}`,
      node: <SetPiece key={`s:${it.item}:${it.at ?? ""}`} it={it} x={geo.setX(it.at)} stageW={geo.stageW} height={height} floorY={feetY(z, height)} k={geo.castK * depthScale(z)} />,
    });
  }
  // положенные (put) и уроненные (drop) предметы остаются, где их оставили: на столе/прилавке рядом или на полу,
  // пока кто-нибудь не возьмёт этот предмет снова (hold)
  for (const [i, e] of sc.props.entries()) {
    if ((e.action !== "put" && e.action !== "drop") || e.frame > frame) continue;
    if (sc.props.some((o) => o.item === e.item && o.frame > e.frame && o.frame <= frame && (o.action === "hold" || o.action === "give"))) continue;
    const b = geo.box(e.who, e.frame);
    const toCentre = b.x < geo.stageW / 2 ? 1 : -1;
    // кладёт перед собой, на шаг в сторону центра; на стойку за собой — дальше, чтобы предмет не скрылся за телом
    let x = b.x + toCentre * b.w * 0.28;
    // стол рядом (того же плана) — кладём на столешницу
    const table = e.action === "put" ? geo.setItems.find((it) => TABLE_TOP[it.item] !== undefined && Math.abs(geo.itemZ(it) - b.z) < 0.2 && Math.abs(geo.setX(it.at) - x) < pieceWidth(it, geo.stageW, geo.castK * depthScale(geo.itemZ(it))) / 2) : undefined;
    // поверхность фона (стойка, прилавок: location/variant.surfaces) — ближайшая по глубине, в пределах её x
    const loc = locations[sc.scene.location];
    // у сублокации свои поверхности и передний слой (ресторан без стойки), у базового вида — свои
    const sub = subLocation(loc, sc.scene.place);
    const surfaces = (sub ? sub.surfaces : loc?.surfaces) ?? [];
    const bg = e.action === "put" && !table
      ? surfaces.filter((sf) => x >= sf.x0 * geo.stageW && x <= sf.x1 * geo.stageW && Math.abs(sf.z - b.z) < 0.5).sort((p, q) => Math.abs(p.z - b.z) - Math.abs(q.z - b.z))[0]
      : undefined;
    if (bg && bg.z > b.z + 0.1) x = Math.min(bg.x1 * geo.stageW, Math.max(bg.x0 * geo.stageW, b.x + toCentre * b.w * 0.5));
    const z = table ? geo.itemZ(table) - 0.02 : bg ? bg.z - 0.02 : b.z - 0.005;
    const k = table ? geo.castK * depthScale(geo.itemZ(table)) : bg ? depthScale(bg.z) : geo.castK * depthScale(b.z);
    const surface = table ? feetY(geo.itemZ(table), height) - TABLE_TOP[table.item] * k : bg ? feetY(bg.z, height) - bg.top * k : feetY(b.z, height);
    const u = (k * height * PUPPET_H) / BOX_H; // единица рисунка предмета (бокс куклы 600) в px
    draw.push({
      z, key: `prop:${i}`,
      node: (
        <svg key={`prop:${i}`} width={geo.stageW} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`translate(${x} ${surface - PROP_REST * u}) scale(${u})`}><PropItem id={e.item} x={0} y={0} rest /></g>
        </svg>
      ),
    });
  }
  for (const v of geo.vehicles) {
    if (!geo.vehPresent(v.id, frame)) continue;
    const x = geo.vehX(v.id, frame), z = geo.vehZ(v.id), s = geo.vehScale(v.id), fc = geo.vehFacing(v.id, frame);
    const moving = geo.vehMoving(v.id, frame);
    // колёса крутятся только в пути: t — сумма секунд езды до этого кадра (стоит — угол замер)
    const t = sc.drives.filter((d) => d.vehicle === v.id && d.to > d.from).reduce((a, d) => a + Math.max(0, Math.min(frame, d.to) - d.from), 0) / 30;
    const art = (part: "back" | "front") => (
      <svg width={geo.stageW} height={height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${x} ${feetY(z, height)}) scale(${s * fc} ${s})`}>
          <VehicleArt kind={v.kind} part={part} t={t} moving={moving} color={v.color} />
        </g>
      </svg>
    );
    const riders = tl.ridersOf(sc, v.id, frame);
    // на одном плане с людьми машина — позади них (люди говорят перед машиной)
    draw.push({
      z: z + 0.02, key: `v:${v.id}`,
      node: (
        <div key={`v:${v.id}`} style={{ position: "absolute", left: 0, top: 0, width: geo.stageW, height }}>
          {art("back")}
          {/* с последнего места к первому: водитель поверх */}
          {[...riders].reverse().map((id, i) => puppet(id, i, geo.box(id, frame), { facing: fc, inVehicle: true }))}
          {art("front")}
        </div>
      ),
    });
  }
  // передний слой фона (стойка перед барменом): поверх тех, кто дальше его z, под теми, кто ближе
  const subLoc = subLocation(locations[sc.scene.location], sc.scene.place);
  const front = subLoc ? subLoc.front : locations[sc.scene.location]?.front;
  if (front) {
    draw.push({
      z: front.z, key: "bg-front",
      node: (
        <div key="bg-front" style={{ position: "absolute", left: 0, top: 0, width, height, transformOrigin: "0 0",
          transform: bgScale > 1 ? `translate(0px, ${geo.floorY * (1 - bgScale)}px) scale(${bgScale})` : undefined }}>
          <Background location={locations[sc.scene.location]} place={sc.scene.place} layer="front" />
        </div>
      ),
    });
  }
  draw.sort((a, b) => b.z - a.z);
  // массовка: своя у сцены или по умолчанию у сублокации (салон самолёта — пассажиры)
  // сидит ли она и цвет кресел — от сублокации, если сценарий не задал (пассажиры в салоне сидят)
  const placeCrowd = subLocation(locations[sc.scene.location], sc.scene.place)?.crowd;
  const crowd = sc.scene.crowd
    ? { seated: placeCrowd?.seated, seatColor: placeCrowd?.seatColor, ...Object.fromEntries(Object.entries(sc.scene.crowd).filter(([, v]) => v !== undefined)) } as typeof sc.scene.crowd
    : placeCrowd;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: geo.stageW, height, transformOrigin: "0 0",
      transform: `${shakeOffset(sc, frame)} ${cameraTransform(cam, width, height, geo.stageW)}` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, transformOrigin: "0 0",
        transform: bgScale > 1 ? `translate(0px, ${geo.floorY * (1 - bgScale)}px) scale(${bgScale})` : undefined }}>
        <Background location={locations[sc.scene.location]} place={sc.scene.place} />
      </div>
      {crowd && crowd.at !== "front" && (
        <Crowd spec={crowd} events={sc.crowd} seed={`${ep.id}:${sc.index}`} width={geo.stageW} floorY={geo.floorY} heroH={height * PUPPET_H} />
      )}
      {draw.map((d) => d.node)}
      {sc.scene.crowd?.at === "front" && (
        <CrowdFront spec={sc.scene.crowd} events={sc.crowd} seed={`${ep.id}:${sc.index}`} width={geo.stageW} height={height} />
      )}
    </div>
  );
};

/** Тряска кадра: дрожание холста сцены (затухает к концу). */
function shakeOffset(sc: SceneTL, frame: number) {
  const s = sc.shakes.find((x) => frame >= x.from && frame <= x.to);
  if (!s) return "";
  const k = 1 - (frame - s.from) / Math.max(1, s.to - s.from);
  const amp = (s.strength === "strong" ? 26 : 11) * (0.4 + 0.6 * k);
  // кадр чуть увеличен вокруг центра, чтобы при дрожании не открывались края
  const z = 1.06;
  return `translate(${-540 * (z - 1) + Math.sin(frame * 2.3) * amp}px, ${-960 * (z - 1) + Math.cos(frame * 3.1) * amp * 0.7}px) scale(${z}) rotate(${Math.sin(frame * 1.7) * amp * 0.02}deg)`;
}

/** Разделённый экран: полоса под субтитры между половинами и какая полоса холста видна в каждой половине. */
export const SPLIT = { band: 280, from: 400 };

/**
 * Разделённый экран (телефонный разговор двух мест): сверху — место сцены и её куклы,
 * снизу — split.location и куклы из split.cast, между ними — полоса под субтитры. Каждая половина — своя сцена со своей камерой.
 */
const SplitStage = ({ ep, tl, sc }: { ep: Episode; tl: Timeline; sc: SceneTL }) => {
  const { width, height } = useVideoConfig();
  const split = sc.scene.split!;
  const half = (height - SPLIT.band) / 2;
  const top: SceneTL = { ...sc, scene: { ...sc.scene, cast: sc.scene.cast.filter((id) => !split.cast.includes(id)), split: undefined } };
  const bottom: SceneTL = { ...sc, scene: { ...sc.scene, cast: split.cast, location: split.location, place: split.place, crowd: undefined, set: undefined, split: undefined } };
  const Half = ({ part, y }: { part: SceneTL; y: number }) => (
    <div style={{ position: "absolute", left: 0, top: y, width, height: half, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: -SPLIT.from, width, height }}>
        <Stage ep={ep} tl={tl} sc={part} />
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "#2b1d14" }}>
      <Half part={top} y={0} />
      <Half part={bottom} y={half + SPLIT.band} />
    </AbsoluteFill>
  );
};

export const Joke = (ep: Episode) => {
  const frame = useCurrentFrame();
  const tl = buildTimeline(ep);
  const sc = tl.sceneAt(frame);
  const current = tl.lines.find((l) => frame >= l.startFrame && frame <= l.endFrame + 4);
  return (
    <LocaleProvider value={ep.locale}>
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {sc.scene.split ? <SplitStage ep={ep} tl={tl} sc={sc} /> : <Stage ep={ep} tl={tl} sc={sc} />}
      {tl.scenes.slice(1).map((s) => {
        const prev = tl.scenes[s.index - 1].scene;
        return s.transition.kind === "flyover" ? (
          <Flyover key={s.index} at={s.from} frames={s.transition.frames} locale={ep.locale}
            from={buildingFor(prev.location, prev.place)} to={buildingFor(s.scene.location, s.scene.place)} />
        ) : (
          <SceneTransition key={s.index} at={s.from} frames={s.transition.frames} kind={s.transition.kind} />
        );
      })}
      <Captions line={current} locale={ep.locale} narrator={current?.character === NARRATOR}
        top={sc.scene.split && current?.character !== NARRATOR ? (1920 - SPLIT.band) / 2 + 24 : undefined} />
      <Watermark />
      <Soundtrack tl={tl} />
    </AbsoluteFill>
    </LocaleProvider>
  );
};
