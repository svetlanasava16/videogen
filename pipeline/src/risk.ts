/**
 * Риск публикации по анекдоту (стадия risk: data/llm/risk/results.jsonl).
 * religion: none | setting | mocking. mocking — не озвучиваем, не рендерим, не публикуем (ст. 148 УК РФ и не наш юмор).
 */
import { join } from "node:path";
import { DATA, readJsonl } from "./util.js";

export type Risk = { id: string; religion: "none" | "setting" | "mocking"; target: string; note: string };

let cache: Map<string, Risk> | undefined;
export function riskOf(jokeId: string): Risk | undefined {
  cache ??= new Map(readJsonl<Risk>(join(DATA, "llm", "risk", "results.jsonl")).map((r) => [r.id, r]));
  return cache.get(jokeId);
}
export const blocked = (jokeId: string) => riskOf(jokeId)?.religion === "mocking";
