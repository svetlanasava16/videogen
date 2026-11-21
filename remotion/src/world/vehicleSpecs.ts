/**
 * Данные транспорта (без рисунка): габариты, места седоков, дверь, время проезда. Отдельно от Vehicles.tsx,
 * чтобы таймлайн и будущий плеер (packages/player) не зависели от React-рисунков.
 */
import type { VehicleKind } from "@jf/core";

export type VehicleSpec = {
  /** Габарит рисунка (px при масштабе 1): ширина и высота над полом. */
  w: number;
  h: number;
  /**
   * Места седоков по порядку (первое — водитель): dx — от центра к переду (+), dy — подъём стоп куклы над полом (px),
   * s — масштаб куклы относительно плана (в окне автобуса куклы мельче, чтобы голова попала в окно).
   */
  seats: { dx: number; dy: number; s: number }[];
  /** true — седок сидит сверху (велосипед, мотоцикл, телега); false — виден в окне между слоями back/front. */
  open: boolean;
  /** Где выходят: dx двери от центра. */
  door: number;
  /** Сколько секунд едет от края до метки. */
  driveSec: number;
};

const S = (dx: number, dy: number, s = 1) => ({ dx, dy, s });

/**
 * Рисунки сделаны в своих «чертёжных» координатах; ox сдвигает рисунок, чтобы габарит был симметричен вокруг 0.
 * Места и дверь заданы в тех же чертёжных координатах — сдвиг применяется ниже, в VEHICLE_SPECS.
 */
export const DESIGN: Record<VehicleKind, VehicleSpec & { ox: number }> = {
  car: { ox: -5, w: 880, h: 565, seats: [S(112, 85, 0.82), S(-165, 85, 0.82)], open: false, door: 125, driveSec: 1.6 },
  taxi: { ox: -5, w: 880, h: 615, seats: [S(112, 85, 0.82), S(-165, 85, 0.82)], open: false, door: 125, driveSec: 1.6 },
  "police-car": { ox: -5, w: 880, h: 610, seats: [S(112, 85, 0.82), S(-165, 85, 0.82)], open: false, door: 125, driveSec: 1.3 },
  ambulance: { ox: 0, w: 850, h: 695, seats: [S(200, 138, 0.82), S(-150, 138, 0.82)], open: false, door: -150, driveSec: 1.4 },
  bus: {
    ox: 0, w: 1420, h: 625,
    seats: [S(512, 165, 0.72), S(188, 165, 0.72), S(-16, 165, 0.72), S(-361, 165, 0.72), S(-564, 165, 0.72)],
    open: false, door: 355, driveSec: 2.4,
  },
  tram: {
    ox: 0, w: 1400, h: 805,
    seats: [S(512, 184, 0.72), S(188, 184, 0.72), S(-16, 184, 0.72), S(-361, 184, 0.72), S(-564, 184, 0.72)],
    open: false, door: 355, driveSec: 2.6,
  },
  train: {
    ox: 0, w: 1520, h: 725,
    seats: [S(345, 225, 0.72), S(135, 225, 0.72), S(-75, 225, 0.72), S(-285, 225, 0.72), S(-495, 225, 0.72)],
    open: false, door: 485, driveSec: 3,
  },
  truck: { ox: -50, w: 1240, h: 625, seats: [S(335, 155, 0.82), S(-110, 205, 0.82), S(-370, 205, 0.82)], open: false, door: 335, driveSec: 2 },
  tractor: { ox: -15, w: 830, h: 580, seats: [S(-150, 269, 0.85)], open: true, door: -150, driveSec: 2.6 },
  bicycle: { ox: 0, w: 600, h: 290, seats: [S(-95, 105, 1)], open: true, door: -95, driveSec: 2 },
  motorcycle: { ox: 0, w: 690, h: 360, seats: [S(-60, 160, 1)], open: true, door: -60, driveSec: 1.2 },
  scooter: { ox: 15, w: 600, h: 380, seats: [S(-90, 80, 1)], open: true, door: -90, driveSec: 1.8 },
  "horse-cart": { ox: -150, w: 1270, h: 600, seats: [S(-165, 150, 0.85), S(-362, 150, 0.85)], open: true, door: -250, driveSec: 2.6 },
  "road-roller": { ox: -8, w: 830, h: 885, seats: [S(-170, 370, 0.85)], open: true, door: -170, driveSec: 4 },
};

export const VEHICLE_SPECS: Record<VehicleKind, VehicleSpec> = Object.fromEntries(
  Object.entries(DESIGN).map(([k, { ox, ...sp }]) => [
    k,
    { ...sp, seats: sp.seats.map((s) => ({ ...s, dx: s.dx + ox })), door: sp.door + ox },
  ]),
) as Record<VehicleKind, VehicleSpec>;

