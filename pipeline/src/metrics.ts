/**
 * Метрики публикаций.
 *   pnpm metrics pull     — снимок по каждому опубликованному посту (Postiz analytics) + подписчики аккаунтов
 *   pnpm metrics report   — docs/metrics-report.md: топ постов, разрезы по площадке, языку, герою, фону
 * Регулярный запуск: infra/launchd/com.anek.metrics.plist (каждые 6 часов).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { connect, schema as T, type Db } from "@jf/db";
import * as P from "./publish/postiz.js";
import { ROOT } from "./util.js";

/** Имена метрик у разных площадок → наши колонки. */
const FIELDS: Record<string, "views" | "likes" | "comments" | "shares" | "saves" | "followers"> = {
  views: "views", impressions: "views", plays: "views", "video views": "views",
  likes: "likes", favorites: "likes", reactions: "likes",
  comments: "comments", replies: "comments",
  shares: "shares", reposts: "shares", retweets: "shares", quotes: "shares",
  saves: "saves", saved: "saves", bookmarks: "saves",
  followers: "followers", subscribers: "followers", "followers count": "followers",
};

/** Последнее (максимальное) значение каждой серии. */
function totals(series: P.Series[]) {
  const out: Partial<Record<(typeof FIELDS)[string], number>> = {};
  for (const s of series ?? []) {
    const key = FIELDS[s.label.toLowerCase().trim()];
    if (!key) continue;
    const vals = s.data.map((d) => Number(d.total)).filter(Number.isFinite);
    if (vals.length) out[key] = Math.max(out[key] ?? 0, ...vals);
  }
  return out;
}

async function pull(db: Db) {
  const posts = await db.select().from(T.posts).where(and(eq(T.posts.state, "published"), isNotNull(T.posts.postizPostId)));
  let n = 0;
  for (const p of posts) {
    try {
      const series = await P.postAnalytics(p.postizPostId!, 30);
      const t = totals(series);
      await db.insert(T.postMetrics).values({ postId: p.id, views: t.views ?? null, likes: t.likes ?? null, comments: t.comments ?? null, shares: t.shares ?? null, saves: t.saves ?? null, raw: series });
      n++;
    } catch (e) {
      console.error(`post ${p.id}: ${(e as Error).message}`);
    }
  }
  const accs = await db.select().from(T.accounts).where(and(eq(T.accounts.active, true), isNotNull(T.accounts.postizIntegrationId)));
  const today = new Date().toISOString().slice(0, 10);
  for (const a of accs) {
    try {
      const series = await P.accountAnalytics(a.postizIntegrationId!, 7);
      await db.insert(T.accountMetrics).values({ accountId: a.id, date: today, followers: totals(series).followers ?? null, raw: series })
        .onConflictDoUpdate({ target: [T.accountMetrics.accountId, T.accountMetrics.date], set: { followers: totals(series).followers ?? null, raw: series, capturedAt: new Date() } });
    } catch (e) {
      console.error(`account ${a.id}: ${(e as Error).message}`);
    }
  }
  console.log(`metrics: ${n}/${posts.length} posts, ${accs.length} accounts`);
}

async function report(db: Db) {
  // последний снимок по каждому посту
  const latest = sql`(select distinct on (post_id) * from post_metrics order by post_id, captured_at desc)`;
  const rows = (await db.execute(sql`
    select p.id, p.account_id, a.platform, a.locale, p.kind, p.episode_id, e.title, e.location, e.cast, p.url, p.published_at,
           coalesce(m.views,0) views, coalesce(m.likes,0) likes, coalesce(m.comments,0) comments, coalesce(m.shares,0) shares, coalesce(m.saves,0) saves
    from posts p join accounts a on a.id = p.account_id left join episodes e on e.id = p.episode_id left join ${latest} m on m.post_id = p.id
    where p.state = 'published'`)) as any[];
  const eng = (r: any) => Number(r.likes) + Number(r.comments) * 2 + Number(r.shares) * 3 + Number(r.saves) * 2;
  const by = (key: (r: any) => string) => {
    const g = new Map<string, { n: number; views: number; eng: number }>();
    for (const r of rows) {
      const k = key(r);
      const v = g.get(k) ?? { n: 0, views: 0, eng: 0 };
      v.n++; v.views += Number(r.views); v.eng += eng(r);
      g.set(k, v);
    }
    return [...g.entries()].sort((a, b) => b[1].views - a[1].views)
      .map(([k, v]) => `| ${k} | ${v.n} | ${v.views} | ${Math.round(v.views / v.n)} | ${v.views ? ((100 * v.eng) / v.views).toFixed(1) : "–"}% |`);
  };
  const head = "| | posts | views | views/post | engagement |\n|---|---|---|---|---|";
  const top = [...rows].sort((a, b) => Number(b.views) - Number(a.views)).slice(0, 20)
    .map((r) => `| ${r.account_id} | [${r.title ?? r.episode_id}](${r.url ?? "#"}) | ${r.views} | ${r.likes} | ${r.comments} | ${r.shares} | ${r.saves} |`);
  const md = [
    "# Метрики публикаций", "", `Сгенерировано \`pnpm metrics report\` ${new Date().toISOString().slice(0, 16)}Z. Опубликовано: ${rows.length}.`,
    "Engagement = (лайки + 2·комментарии + 3·репосты + 2·сохранения) / просмотры.", "",
    "## Топ-20 по просмотрам", "", "| аккаунт | эпизод | views | likes | comments | shares | saves |", "|---|---|---|---|---|---|---|", ...top, "",
    "## По площадкам", "", head, ...by((r) => r.platform), "",
    "## По языкам", "", head, ...by((r) => r.locale), "",
    "## По фону", "", head, ...by((r) => r.location ?? "—"), "",
    "## По первому персонажу в касте", "", head, ...by((r) => (r.cast?.[0] as string) ?? "—"), "",
  ].join("\n");
  writeFileSync(join(ROOT, "docs", "metrics-report.md"), md);
  console.log(`docs/metrics-report.md (${rows.length} published posts)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const cmd = process.argv[2];
  const { db, close } = connect();
  try {
    if (cmd === "pull") await pull(db);
    else if (cmd === "report") await report(db);
    else {
      console.error("usage: metrics pull|report");
      process.exitCode = 1;
    }
  } finally {
    await close();
  }
}
