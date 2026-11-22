/**
 * Треки исполнения: значения во времени (секунды).
 *  - lin — число с линейной интерполяцией между ключами (позиция, масштаб, сила позы);
 *  - step — дискретное значение (эмоция, предмет в руке, имя действия): держится от ключа до следующего.
 * Ключи получаются прореживанием покадровых значений: ключ выбрасывается, если линейная интерполяция соседних
 * воспроизводит все кадры между ними с ошибкой не больше eps. Поэтому на целых кадрах трек повторяет постановку
 * (с точностью eps), а между кадрами плеер получает плавное движение.
 * Чистые функции без React и Remotion: их же использует будущий плеер (ROADMAP §7).
 */
export type LinTrack = { t: number[]; v: number[] };
export type StepTrack<T> = { t: number[]; v: T[] };

/** Секунды с точностью до микросекунды (короче JSON, кадр восстанавливается точно: round(t·fps)). */
export const sec = (frame: number, fps: number) => Math.round((frame / fps) * 1e6) / 1e6;
export const frameOf = (t: number, fps: number) => Math.round(t * fps);

/** Индекс последнего ключа с t ≤ time (−1, если раньше первого). */
function at(ts: number[], time: number): number {
  let lo = 0, hi = ts.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ts[mid] <= time + 1e-6) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}

export function sampleLin(tr: LinTrack, time: number): number {
  const i = at(tr.t, time);
  if (i < 0) return tr.v[0];
  if (i >= tr.t.length - 1) return tr.v[tr.v.length - 1];
  const t0 = tr.t[i], t1 = tr.t[i + 1];
  if (time <= t0 + 1e-6) return tr.v[i];
  return tr.v[i] + ((tr.v[i + 1] - tr.v[i]) * (time - t0)) / (t1 - t0);
}

export function sampleStep<T>(tr: StepTrack<T>, time: number): T {
  const i = at(tr.t, time);
  return tr.v[Math.max(0, i)];
}

const round = (x: number, q: number) => (q > 0 ? Math.round(x / q) * q : x);

/**
 * Числовой трек из покадровых значений (кадры frames, значения vals): округление до q (0 — без округления), прореживание с ошибкой ≤ eps.
 * Жадно: от ключа тянем отрезок, пока все промежуточные кадры укладываются в eps.
 */
export function encodeLin(frames: number[], vals: number[], fps: number, eps: number, q: number): LinTrack {
  const n = vals.length;
  const v = vals.map((x) => (Number.isFinite(x) ? round(x, q) : 0));
  const keep: number[] = [0];
  if (eps === 0) {
    // точный трек: ключи только там, где значение меняется (и последний кадр постоянного участка) — между ключами
    // либо постоянное значение, либо соседние кадры; интерполяция ничего не досчитывает, кадр совпадает бит в бит
    for (let i = 1; i < n; i++) if (v[i] !== v[i - 1] || (i + 1 < n && v[i + 1] !== v[i])) keep.push(i);
    if (keep[keep.length - 1] !== n - 1) keep.push(n - 1);
    const idx = [...new Set(keep)];
    return { t: idx.map((i) => sec(frames[i], fps)), v: idx.map((i) => v[i]) };
  }
  let a = 0;
  while (a < n - 1) {
    // «вращающаяся дверь»: коридор допустимых наклонов [lo, hi] от ключа a по всем промежуточным точкам;
    // кандидат c подходит, если наклон a→c внутри коридора (тогда все точки между ними в пределах eps)
    let b = a + 1, lo = -Infinity, hi = Infinity;
    while (b + 1 < n) {
      const dx = frames[b] - frames[a];
      lo = Math.max(lo, (v[b] - eps - v[a]) / dx);
      hi = Math.min(hi, (v[b] + eps - v[a]) / dx);
      const c = b + 1;
      const s = (v[c] - v[a]) / (frames[c] - frames[a]);
      if (s < lo - 1e-12 || s > hi + 1e-12) break;
      b = c;
    }
    keep.push(b);
    a = b;
  }
  const idx = [...new Set(keep)].filter((i) => i < n);
  return { t: idx.map((i) => sec(frames[i], fps)), v: idx.map((i) => v[i]) };
}

/** Дискретный трек: ключ на каждой смене значения (сравнение по JSON). */
export function encodeStep<T>(frames: number[], vals: T[], fps: number): StepTrack<T> {
  const t: number[] = [], v: T[] = [];
  let prev = "\u0000";
  vals.forEach((x, i) => {
    const s = JSON.stringify(x ?? null);
    if (s !== prev) { t.push(sec(frames[i], fps)); v.push((x ?? null) as T); prev = s; }
  });
  return { t, v };
}
