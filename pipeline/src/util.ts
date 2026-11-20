import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const ROOT = resolve(import.meta.dirname, "../..");
export const DATA = join(ROOT, "data");
export const RAW = join(DATA, "raw");

/** Путь из аргумента CLI: относительно каталога, откуда запущен pnpm. */
export const fromCwd = (p: string) => resolve(process.env.INIT_CWD ?? process.cwd(), p);

export function readJsonl<T = unknown>(path: string): T[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l, i) => {
      try {
        return JSON.parse(l) as T;
      } catch {
        throw new Error(`${path}:${i + 1}: invalid JSON`);
      }
    });
}

export function writeJsonl(path: string, rows: unknown[]) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
}

export async function download(url: string, dest: string) {
  if (existsSync(dest)) return dest;
  mkdirSync(dirname(dest), { recursive: true });
  console.log(`download ${url}`);
  const res = await fetch(url, { headers: { "User-Agent": "joke-factory-ingest/0.1" } });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} for ${url}`);
  const tmp = dest + ".part";
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(tmp));
  const { renameSync } = await import("node:fs");
  renameSync(tmp, dest);
  return dest;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Перцентиль-ранг каждого значения (0..1), одинаковые значения получают одинаковый ранг. */
export function percentileRanks(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const rankOf = new Map<number, number>();
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && sorted[j + 1] === sorted[i]) j++;
    rankOf.set(sorted[i], n === 1 ? 1 : ((i + j) / 2) / (n - 1));
    i = j + 1;
  }
  return values.map((v) => rankOf.get(v)!);
}

export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
