/**
 * Ролик-анекдот: эпизод компилируется в исполнение (perf/compile.ts — постановка, камера, субтитры, звук; один раз)
 * и проигрывается (perf/Play.tsx — только рисование из треков). Готовый performance.json проигрывает композиция
 * Performance (pnpm compile-episode, stills, golden, render).
 */
import type { Episode } from "@jf/core";
import { compileEpisode } from "./perf/compile";
import { Play } from "./perf/Play";
import type { Performance } from "@jf/player";

export { SPLIT } from "./perf/Play";

/** Кэш компиляции: Remotion рендерит кадры по одному с теми же пропсами — компилируем один раз на эпизод. */
const cache = new Map<string, Performance>();
export function performanceOf(ep: Episode): Performance {
  const key = JSON.stringify(ep);
  let p = cache.get(key);
  if (!p) {
    p = compileEpisode(ep);
    if (cache.size > 16) cache.clear();
    cache.set(key, p);
  }
  return p;
}

export const Joke = (ep: Episode) => <Play perf={performanceOf(ep)} />;

/** Проигрывает готовое исполнение (performance.json). */
export const PerformanceView = ({ perf }: { perf: Performance }) => <Play perf={perf} />;
