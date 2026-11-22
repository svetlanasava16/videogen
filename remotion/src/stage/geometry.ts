/**
 * Геометрия сцены (постановка без рисования): где стоят куклы, их планы и боксы, машины, сиденья, кровати.
 * Чистый TS без React: её запускает компилятор эпизода (perf/compile.ts) один раз на весь ролик.
 */
import { Easing, interpolate } from "remotion";
import { PLANES, markOf, marksFor, subLocation, type SetItem } from "@jf/core";
import { locations } from "../registry";
import type { SceneTL, Timeline } from "../timeline";
import { BOX_H, BOX_W } from "../puppet/Rig";
import { SEAT_ITEMS, SET_PIECES, pieceWidth } from "../world/SetPieces";
import { VEHICLE_SPECS } from "../world/vehicleSpecs";
import { LANE, WALL_Y, depthScale, feetY } from "../world/depth";

/** Мебель, за которой по умолчанию сидят. */
export const SEAT_DEFAULT = ["dining-table", "table", ...SEAT_ITEMS];
export const FLOOR = WALL_Y / 1920; // линия стены (дальний план) — совпадает с FLOOR_Y фонов
export const PUPPET_H = 0.4; // высота бокса куклы среднего плана (доля высоты кадра)
export const FEET = 585 / BOX_H; // стопы куклы в её боксе
const ease = Easing.inOut(Easing.cubic);

/** Высота столешницы над полом (px при масштабе 1) — куда ложится положенный предмет (prop put). */
export const TABLE_TOP: Record<string, number> = { "dining-table": 204, table: 200, desk: 330, counter: 380, lectern: 300, scales: 380, sink: 300 };
/** Положенный предмет рисуется в режиме rest (Props.tsx, таблица REST): его низ — на линии поверхности (y = 0). */
export const PROP_REST = 0;

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
/** Насколько сидящий на метке-сиденье сдвигается, когда раздвигают его с идущим (доля; идущий — 1). */
const PIN_SLIDE = 0.15;
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

  // ---- автослоты места (location/variant.slots): кто без своей метки — встаёт по данным места ----
  // у сублокации свои слоты, у вида по умолчанию — свои (как передний слой и поверхности)
  const subPlace = subLocation(loc, sc.scene.place);
  const placeSlots = (subPlace ? subPlace.slots : loc?.slots) ?? [];
  const autoMarks = new Map<string, string>();
  /** План переднего слоя места (стойка, стол, кафедра): кто дальше него — за ним. */
  const frontZ = (subPlace ? subPlace.front : loc?.front)?.z;
  if (placeSlots.length) {
    // автослот нужен тем, у кого нет хода к своей метке (только вход/уход за край или move to "auto")
    const ownMark = (id: string) => sc.moves.some((m) => m.id === id && m.kind !== "exit" && m.target !== "slot" && !m.target.startsWith("near:") && !m.target.startsWith("veh:"));
    const users = cast.filter((id) => !ownMark(id));
    const taken = new Set(sc.moves.filter((m) => m.target !== "slot").map((m) => m.target));
    const free = placeSlots.filter((sl) => !taken.has(sl.mark) && mark(sl.mark));
    for (const id of users) {
      const r = sc.scene.roles[id];
      const i = r ? free.findIndex((sl) => sl.roles?.includes(r)) : -1;
      if (i >= 0) { autoMarks.set(id, free[i].mark); free.splice(i, 1); }
    }
    const rest = users.filter((id) => !autoMarks.has(id));
    let pool = free.filter((sl) => !sl.roles?.length).slice(0, rest.length).sort((a, b) => mark(a.mark)!.x - mark(b.mark)!.x);
    // один без метки — в центр, если у места есть свободный слот center (а не на край пары)
    const centre = free.find((sl) => !sl.roles?.length && sl.mark === "center");
    if (rest.length === 1 && centre) pool = [centre];
    rest.slice(0, pool.length).forEach((id, i) => autoMarks.set(id, pool[i].mark));
  }
  /** x автослота: метка места или прежняя раскладка по ширине. */
  const slotPos = (id: string, f: number) => (autoMarks.has(id) ? markX(autoMarks.get(id)!) : slotX(id, f));
  /** Метка, на которой кукла стоит: своя (последний ход) или автослот. */
  const standMark = (id: string, m?: { target: string }) => (!m || m.target === "slot" ? autoMarks.get(id) : m.target);

  const xAt = (id: string, f: number): number => {
    const riding = tl.ridingIn(sc, id, f);
    if (riding && vehOf(riding)) return vehX(riding, f) + riderSeat(id, riding, f).dx * vehScale(riding) * vehFacing(riding, f);
    const m = lastMove(id, f);
    if (!m) return slotPos(id, f);
    const k = ease(Math.min(1, (f - m.from) / Math.max(1, m.to - m.from)));
    const target = (ff: number) => {
      if (m.target === "slot") return slotPos(id, ff);
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
    if (m.target === "slot") return m.kind === "exit" ? zBase(id, m.from - 1) : mark(autoMarks.get(id) ?? "")?.z ?? PLANES.mid;
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
    if (!m) return mark(autoMarks.get(id) ?? "")?.z ?? PLANES.mid;
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
    // сидит на метке-сиденье и не идёт — не сдвигается (иначе соскальзывает со стула); сдвигается сосед
    const pinned = (id: string) => {
      const m = lastMove(id, f);
      if (m && f < m.to) return false;
      const st = standMark(id, m && m.kind !== "exit" ? m : undefined);
      return !!(st && mark(st)?.seat);
    };
    const xs = cast.map((id) => ({ id, x: xAt(id, f), z: zAt(id, f), on: pres(id, f) > 0.5 && !tl.ridingIn(sc, id, f), pin: pinned(id) })).sort((a, b) => a.x - b.x);
    for (let it = 0; it < 4; it++) {
      for (let i = 0; i < xs.length; i++) {
        for (let j = i + 1; j < xs.length; j++) {
          const a = xs[i], b = xs[j];
          if (!a.on || !b.on || (close.has(a.id) && close.has(b.id))) continue;
          // один план — не стоят друг в друге; разные — можно стоять за спиной, но лицо дальнего не закрыто ближним
          const gap = (Math.abs(a.z - b.z) >= SAME_PLANE ? MIN_GAP * BEHIND_GAP : MIN_GAP) * depthScale((a.z + b.z) / 2);
          const d = b.x - a.x;
          // соседи на сиденьях одного плана (скамья, ряд кресел) сидят рядом — не раздвигаем;
          // сидящие на разных планах — раздвигаем поровну (лицо дальнего видно); идущий уступает сидящему почти целиком
          const samePlane = Math.abs(a.z - b.z) < SAME_PLANE;
          if (d < gap && !(a.pin && b.pin && samePlane)) {
            const push = gap - d;
            let wa = a.pin && !b.pin ? PIN_SLIDE : 1, wb = b.pin && !a.pin ? PIN_SLIDE : 1;
            // сидящий за передним слоем (врач за столом, начальник за столом) не съезжает со стула: уступает тот, кто перед столом
            const behind = (v: { z: number }) => frontZ !== undefined && v.z > frontZ;
            if (behind(a) !== behind(b)) { if (a.pin && behind(a)) { wa = 0; wb = 1; } else if (b.pin && behind(b)) { wb = 0; wa = 1; } }
            a.x = Math.max(boxW * 0.45, a.x - (push * wa) / (wa + wb));
            b.x = Math.min(stageW - boxW * 0.45, b.x + (push * wb) / (wa + wb));
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
    const st = standMark(id, m && m.kind !== "exit" ? m : undefined);
    if (st && mark(st)?.seat) return ramp;
    const x = xOf(id, f), z = zAt(id, f);
    if (furnitureSeats.some((s) => x >= s.lo && x <= s.hi && Math.abs(s.z - z) < 0.2)) return ramp;
    const sitting = tl.actAt(sc, id, f).base?.name === "sit";
    if (sitting && Object.values(marks).some((mk) => { const o = markOf(mk)!; return !!o.seat && Math.abs(o.x * stageW - x) < boxW * 0.5; })) return 1;
    return 0;
  };
  /** В кровати: сидит на метке-сиденье bed (лёжа — голова на подушке, тело под одеялом переднего слоя). */
  const inBedAt = (id: string, f: number): number => {
    const k = seatedAt(id, f);
    if (!k || tl.ridingIn(sc, id, f)) return 0;
    const m = lastMove(id, f);
    const st = standMark(id, m && m.kind !== "exit" ? m : undefined);
    return st && mark(st)?.seat === "bed" ? k : 0;
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
    boxW, boxH, castK, stageW, floorY: height * FLOOR, xAt: xOf, zAt, box, present, headY, bodyY, seatedAt, inBedAt,
    setItems, itemZ, setX, vehicles, vehX, vehZ, vehScale, vehPresent, vehMoving, vehFacing, riderSeat,
  };
}

