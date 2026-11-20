import { join } from "node:path";
import { RAW, readJsonl, sleep, writeJsonl } from "../util.js";
import { autoParquet, readHf, repoFile } from "./hf.js";
import type { RawJoke, Source } from "./types.js";

const num = (v: unknown) => (typeof v === "bigint" ? Number(v) : Number(v ?? 0));
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** anekdot.ru: жёсткие переносы строк внутри фраз склеиваем, реплики с тире оставляем с новой строки. */
export function unwrapAnekdot(t: string) {
  return t
    .replace(/``|''/g, '"')
    .split(/\n/)
    .map((l) => l.trim())
    .reduce((acc, line) => {
      if (!acc) return line;
      return /^[-—–]\s*\D/.test(line) ? `${acc}\n${line}` : `${acc} ${line}`;
    }, "")
    .replace(/^\s*-\s*(?=\D)/gm, "— ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Reddit: заголовок часто является завязкой, текст — продолжением или панчлайном. */
export function joinReddit(title: string, body: string) {
  const b = body.replace(/&amp;/g, "&").replace(/&#x200B;/g, "").replace(/\s+\n/g, "\n").trim();
  const t = title.trim();
  if (!b) return t;
  if (b.toLowerCase().startsWith(t.toLowerCase().slice(0, 40))) return b;
  return `${t}\n${b}`;
}

const DEAD = /^\[(removed|deleted)\]$/;

export const ruAnekdots: Source = {
  id: "anekdot-ru",
  lang: "ru",
  license: "ODC-BY (igorktech/anekdots, source anekdot.ru)",
  async fetch() {
    const rows = await readHf(repoFile("igorktech/anekdots", "data/train-00000-of-00001.parquet"), ["text", "hash", "total_mark"]);
    return rows.map((r) => ({
      id: `ru-${str(r.hash).slice(0, 12)}`,
      lang: "ru",
      kind: "anekdot",
      text: unwrapAnekdot(str(r.text)),
      score: num(r.total_mark),
      sourceRef: { dataset: "igorktech/anekdots", id: str(r.hash), license: this.license },
    }));
  },
};

export const enRedditJokes: Source = {
  id: "reddit-jokes",
  lang: "en",
  license: "CC-BY-4.0 (SocialGrep/one-million-reddit-jokes)",
  async fetch() {
    const rows = await readHf(autoParquet("SocialGrep/one-million-reddit-jokes"), [
      "id", "title", "selftext", "score", "permalink", "subreddit.nsfw",
    ]);
    const out: RawJoke[] = [];
    for (const r of rows) {
      const body = str(r.selftext);
      if (DEAD.test(body.trim()) || r["subreddit.nsfw"] === true) continue;
      out.push({
        id: `en-r-${str(r.id)}`,
        lang: "en",
        kind: "joke",
        text: joinReddit(str(r.title), body),
        score: num(r.score),
        sourceRef: { dataset: "SocialGrep/one-million-reddit-jokes", id: str(r.id), url: str(r.permalink), license: this.license },
      });
    }
    return out;
  },
};

export const enDadabase: Source = {
  id: "dadabase",
  lang: "en",
  license: "unspecified (enjalot/ls-dadabase, r/dadjokes)",
  async fetch() {
    const rows = await readHf(autoParquet("enjalot/ls-dadabase"), ["index", "joke", "score", "url", "deleted"]);
    return rows
      .filter((r) => r.deleted !== true)
      .map((r) => ({
        id: `en-d-${num(r.index)}`,
        lang: "en" as const,
        kind: "dad-joke" as const,
        text: str(r.joke).trim(),
        score: num(r.score),
        sourceRef: { dataset: "enjalot/ls-dadabase", id: String(num(r.index)), url: str(r.url), license: this.license },
      }));
  },
};

/** Немецкие сабреддиты через Arctic Shift. Кэш в data/raw/arctic/<sub>.jsonl, догружается по страницам. */
function arcticSource(sub: string, kind: RawJoke["kind"]): Source {
  return {
    id: `reddit-${sub.toLowerCase()}`,
    lang: "de",
    license: `Reddit r/${sub} via Arctic Shift (Reddit terms)`,
    async fetch() {
      const cache = join(RAW, "arctic", `${sub}.jsonl`);
      let posts = readJsonl<Record<string, unknown>>(cache);
      if (!posts.length) {
        let before = "";
        for (let page = 0; page < 400; page++) {
          const url = `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=${sub}&limit=100&sort=desc&fields=id,title,selftext,score,created_utc,over_18${before ? `&before=${before}` : ""}`;
          let data: Record<string, unknown>[] | null = null;
          for (let attempt = 0; attempt < 8 && !data; attempt++) {
            const res = await fetch(url, { headers: { "User-Agent": "joke-factory-ingest/0.1" } });
            const json = (await res.json().catch(() => ({}))) as { data?: Record<string, unknown>[] | null };
            if (json.data) data = json.data;
            else {
              if (json && "error" in json && !/timeout|slow/i.test(String((json as { error?: string }).error))) throw new Error(`Arctic Shift: ${(json as { error?: string }).error}`);
              await sleep(5000 * (attempt + 1));
            }
          }
          if (!data) throw new Error(`Arctic Shift: no data for ${sub} page ${page}`);
          if (!data.length) break;
          posts.push(...data);
          before = String(num(data[data.length - 1].created_utc));
          if (page % 10 === 0) console.log(`  r/${sub}: ${posts.length} posts`);
          await sleep(1100);
        }
        writeJsonl(cache, posts);
      }
      return posts
        .filter((p) => p.over_18 !== true && !DEAD.test(str(p.selftext).trim()))
        .map((p) => ({
          id: `de-${sub.toLowerCase()}-${str(p.id)}`,
          lang: "de" as const,
          kind,
          text: joinReddit(str(p.title), str(p.selftext)),
          score: num(p.score),
          sourceRef: { dataset: `reddit/r/${sub}`, id: str(p.id), url: `https://reddit.com/r/${sub}/comments/${str(p.id)}`, license: this.license },
        }));
    },
  };
}

export const deWitze = arcticSource("Witze", "joke");
export const deFlachwitze = arcticSource("Flachwitze", "dad-joke");

// r/Flachwitze почти пуст (~20 постов), оставлен для дозагрузки, но в квотах не участвует.
export const SOURCES: Source[] = [ruAnekdots, enRedditJokes, enDadabase, deWitze, deFlachwitze];

/** Сколько анекдотов брать из каждого источника в итоговые ~2000 на язык. */
export const QUOTAS: Record<string, number> = {
  "anekdot-ru": 2000,
  "reddit-jokes": 1400,
  dadabase: 600,
  "reddit-witze": 2000,
  "reddit-flachwitze": 0,
};
