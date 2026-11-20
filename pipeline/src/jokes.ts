/**
 * База анекдотов.
 *   pnpm jokes ingest [--source anekdot-ru]   скачать и нормализовать источники → data/raw/norm/<source>.jsonl
 *   pnpm jokes select                         чистка, дедупликация, топ по квотам → data/jokes/<lang>.jsonl
 */
import { Joke, type Locale } from "@jf/core";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { QUOTAS, SOURCES } from "./ingest/sources.js";
import type { RawJoke } from "./ingest/types.js";
import { DATA, RAW, percentileRanks, readJsonl, wordCount, writeJsonl } from "./util.js";

const normPath = (id: string) => join(RAW, "norm", `${id}.jsonl`);

async function ingest(only?: string) {
  for (const src of SOURCES) {
    if (only && src.id !== only) continue;
    console.log(`== ${src.id}`);
    const raw = await src.fetch();
    const ranks = percentileRanks(raw.map((r) => r.score));
    const rows = raw.map((r, i) => ({ ...r, popularity: ranks[i] }));
    writeJsonl(normPath(src.id), rows);
    console.log(`   ${rows.length} jokes`);
  }
}

// --- чистка ------------------------------------------------------------------
function clean(text: string) {
  return text
    .split("\n")
    .filter((l) => !/^[\s*_(\[]*(edit|update|eta|ps|p\.s\.|source|credit|tl;?dr)\b/i.test(l))
    .join("\n")
    // подписи авторов: "(С) Робинзон", "=Денис из Киева=-", "-- Timur-san"
    .replace(/\s*\([СсCc©]\)[^\n]*$/u, "")
    .replace(/\s*=+[^=\n]{2,40}=+-?\s*$/u, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function rejectReason(j: RawJoke): string | null {
  const w = wordCount(j.text);
  const [min, max] = j.kind === "dad-joke" ? [5, 60] : [8, 160];
  if (w < min) return "too-short";
  if (w > max) return "too-long";
  if (/https?:\/\/|www\.|\br\/\w+|\bu\/\w+/i.test(j.text)) return "link";
  if (/\b(repost|upvotes?|karma|subreddit|this sub|front page|reddit)\b/i.test(j.text)) return "meta";
  if (/[\u{1F300}-\u{1FAFF}]{3,}/u.test(j.text)) return "emoji";
  return null;
}

// --- дедупликация --------------------------------------------------------------
const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
function shingles(s: string, n = 3) {
  const w = normalize(s).split(" ");
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  if (!out.size) out.add(w.join(" "));
  return out;
}

class Deduper {
  private exact = new Set<string>();
  private index = new Map<string, number[]>();
  private sizes: number[] = [];
  isDup(text: string, threshold = 0.5) {
    const key = normalize(text).slice(0, 300);
    if (this.exact.has(key)) return true;
    const sh = shingles(text);
    const shared = new Map<number, number>();
    for (const s of sh) for (const k of this.index.get(s) ?? []) shared.set(k, (shared.get(k) ?? 0) + 1);
    for (const [k, inter] of shared) {
      if (inter / (sh.size + this.sizes[k] - inter) >= threshold) return true;
    }
    const id = this.sizes.length;
    this.sizes.push(sh.size);
    for (const s of sh) (this.index.get(s) ?? this.index.set(s, []).get(s)!).push(id);
    this.exact.add(key);
    return false;
  }
}

function select() {
  const byLang = new Map<Locale, Joke[]>();
  const report: string[] = [];
  const dedupers = new Map<Locale, Deduper>();
  for (const src of SOURCES) {
    const rows = readJsonl<RawJoke & { popularity: number }>(normPath(src.id));
    if (!rows.length) {
      report.push(`${src.id}: нет данных (сначала pnpm jokes ingest)`);
      continue;
    }
    const quota = QUOTAS[src.id] ?? 0;
    const dd = dedupers.get(src.lang) ?? dedupers.set(src.lang, new Deduper()).get(src.lang)!;
    const rejects: Record<string, number> = {};
    const picked: Joke[] = [];
    for (const r of [...rows].sort((a, b) => b.score - a.score)) {
      if (picked.length >= quota) break;
      const j = { ...r, text: clean(r.text) };
      const why = rejectReason(j) ?? (dd.isDup(j.text) ? "duplicate" : null);
      if (why) {
        rejects[why] = (rejects[why] ?? 0) + 1;
        continue;
      }
      picked.push(Joke.parse({ ...j, source: "folk", tags: [src.id] }));
    }
    const list = byLang.get(src.lang) ?? byLang.set(src.lang, []).get(src.lang)!;
    list.push(...picked);
    const minScore = picked.at(-1)?.score ?? 0;
    report.push(`${src.id}: ${rows.length} всего → взято ${picked.length}/${quota} (score ≥ ${minScore}); отсеяно ${JSON.stringify(rejects)}`);
  }
  for (const [lang, list] of byLang) {
    list.sort((a, b) => b.popularity - a.popularity);
    writeJsonl(join(DATA, "jokes", `${lang}.jsonl`), list);
    report.push(`→ data/jokes/${lang}.jsonl: ${list.length}`);
  }
  console.log(report.join("\n"));
}

const { positionals, values } = parseArgs({ allowPositionals: true, options: { source: { type: "string" } } });
const cmd = positionals[0];
if (cmd === "ingest") await ingest(values.source);
else if (cmd === "select") select();
else {
  console.error("usage: jokes ingest [--source id] | jokes select");
  process.exit(2);
}
