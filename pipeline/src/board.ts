/**
 * Страница ручного постинга для телефона (та же Wi-Fi сеть).
 *   pnpm board [--port 4010]
 * Открыть на телефоне адрес, который напечатает команда (с ?t=<токен>). Карточка поста: видео, обложка, подпись,
 * чек-лист Instagram, кнопки «Опубликовано» (+ ссылка), «Пропустить», «Цифры» (просмотры, лайки…) → база.
 * Токен: BOARD_TOKEN в корневом .env или случайный на каждый запуск.
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { connect, schema as T } from "@jf/db";
import { disclosure } from "./publish/captions.js";
import { ROOT } from "./util.js";

if (existsSync(join(ROOT, ".env"))) process.loadEnvFile(join(ROOT, ".env"));
const PORT = Number(process.argv[process.argv.indexOf("--port") + 1] || 4010) || 4010;
const TOKEN = process.env.BOARD_TOKEN || randomBytes(6).toString("hex");
const { db } = connect();

const json = (res: ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
};
const readBody = (req: IncomingMessage) =>
  new Promise<any>((ok) => {
    let s = "";
    req.on("data", (c) => (s += c));
    req.on("end", () => {
      try { ok(s ? JSON.parse(s) : {}); } catch { ok({}); }
    });
  });

/** Последний рендер эпизода с настоящей озвучкой (или любой, если озвученных нет). */
async function renderFor(episodeId: string) {
  const rows = await db.select().from(T.renders).where(eq(T.renders.episodeId, episodeId)).orderBy(desc(T.renders.createdAt));
  return rows.find((r) => r.voice && !["none", "fake", "elevenlabs-free"].includes(r.voice)) ?? rows[0];
}

async function posts(account: string) {
  const [acc] = await db.select().from(T.accounts).where(eq(T.accounts.id, account));
  if (!acc) return { error: "unknown account" };
  const rows = await db
    .select({ p: T.posts, title: T.episodes.title })
    .from(T.posts)
    .leftJoin(T.episodes, eq(T.episodes.id, T.posts.episodeId))
    .where(and(eq(T.posts.accountId, account), notInArray(T.posts.state, ["skipped"])))
    .orderBy(T.posts.scheduledAt);
  const ids = rows.map((r) => r.p.id);
  const metrics = ids.length ? await db.select().from(T.postMetrics).where(inArray(T.postMetrics.postId, ids)).orderBy(desc(T.postMetrics.capturedAt)) : [];
  const out = [];
  for (const { p, title } of rows) {
    const r = p.renderId ? (await db.select().from(T.renders).where(eq(T.renders.id, p.renderId)))[0]
      : p.compilationId ? (await db.select().from(T.renders).where(eq(T.renders.compilationId, p.compilationId)).orderBy(desc(T.renders.createdAt)))[0]
      : p.episodeId ? await renderFor(p.episodeId) : undefined;
    const m = metrics.find((x) => x.postId === p.id);
    out.push({
      id: p.id, state: p.state, kind: p.kind, scheduledAt: p.scheduledAt, publishedAt: p.publishedAt, url: p.url,
      episodeId: p.episodeId ?? p.compilationId, title: title ?? p.title, caption: p.caption,
      render: r ? { id: r.id, voice: r.voice, duration: r.durationSec, cover: existsSync(join(ROOT, r.path.replace(/\.mp4$/, ".cover.jpg"))) } : null,
      metrics: m ? { views: m.views, likes: m.likes, comments: m.comments, shares: m.shares, saves: m.saves, at: m.capturedAt } : null,
    });
  }
  return { account: acc, checklist: disclosure().instagram?.[acc.locale as "ru"] ?? [], posts: out };
}

/** Видео с поддержкой Range (Safari на iPhone иначе не играет). */
function sendFile(req: IncomingMessage, res: ServerResponse, file: string, type: string, download?: string) {
  if (!existsSync(file)) return json(res, 404, { error: "no file" });
  const size = statSync(file).size;
  const headers: Record<string, string | number> = { "Content-Type": type, "Accept-Ranges": "bytes" };
  if (download) headers["Content-Disposition"] = `attachment; filename="${download}"`;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
  if (m) {
    const start = m[1] ? Number(m[1]) : 0;
    const end = m[2] ? Number(m[2]) : size - 1;
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...headers, "Content-Length": size });
    createReadStream(file).pipe(res);
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://x");
    if (url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(PAGE);
    }
    if (url.searchParams.get("t") !== TOKEN && req.headers["x-token"] !== TOKEN) return json(res, 401, { error: "bad token" });
    if (url.pathname === "/api/accounts") {
      return json(res, 200, await db.select().from(T.accounts).where(eq(T.accounts.active, true)).orderBy(T.accounts.id));
    }
    if (url.pathname === "/api/posts") return json(res, 200, await posts(url.searchParams.get("account") ?? ""));
    const media = /^\/(media|cover)\/(\d+)$/.exec(url.pathname);
    if (media) {
      const [r] = await db.select().from(T.renders).where(eq(T.renders.id, Number(media[2])));
      if (!r) return json(res, 404, { error: "no render" });
      const dl = url.searchParams.get("dl") ? `${r.episodeId ?? r.compilationId}${media[1] === "cover" ? ".cover.jpg" : ".mp4"}` : undefined;
      return media[1] === "media"
        ? sendFile(req, res, join(ROOT, r.path), "video/mp4", dl)
        : sendFile(req, res, join(ROOT, r.path.replace(/\.mp4$/, ".cover.jpg")), "image/jpeg", dl);
    }
    const act = /^\/api\/posts\/(\d+)\/(published|skip|metrics|planned)$/.exec(url.pathname);
    if (act && req.method === "POST") {
      const id = Number(act[1]);
      const body = await readBody(req);
      const [p] = await db.select().from(T.posts).where(eq(T.posts.id, id));
      if (!p) return json(res, 404, { error: "no post" });
      if (act[2] === "published") {
        const r = p.compilationId ? (await db.select().from(T.renders).where(eq(T.renders.compilationId, p.compilationId)).orderBy(desc(T.renders.createdAt)))[0]
          : p.episodeId ? await renderFor(p.episodeId) : undefined;
        await db.update(T.posts).set({ state: "published", url: String(body.url ?? "").trim() || p.url, publishedAt: p.publishedAt ?? new Date(), renderId: p.renderId ?? r?.id ?? null, updatedAt: new Date() }).where(eq(T.posts.id, id));
      } else if (act[2] === "skip") {
        await db.update(T.posts).set({ state: "skipped", updatedAt: new Date() }).where(eq(T.posts.id, id));
      } else if (act[2] === "planned") {
        await db.update(T.posts).set({ state: "planned", publishedAt: null, updatedAt: new Date() }).where(eq(T.posts.id, id));
      } else {
        const n = (k: string) => (body[k] === "" || body[k] == null ? null : Math.max(0, Math.round(Number(body[k]))) || 0);
        await db.insert(T.postMetrics).values({ postId: id, views: n("views"), likes: n("likes"), comments: n("comments"), shares: n("shares"), saves: n("saves"), raw: { source: "manual" } });
      }
      return json(res, 200, { ok: true });
    }
    json(res, 404, { error: "not found" });
  } catch (e) {
    json(res, 500, { error: String((e as Error).message) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  let host = "localhost";
  try { host = execSync("scutil --get LocalHostName", { encoding: "utf8" }).trim() + ".local"; } catch {}
  const ip = Object.values(networkInterfaces()).flat().find((i) => i && i.family === "IPv4" && !i.internal)?.address;
  console.log(`ANEK. board:\n  http://${host}:${PORT}/?t=${TOKEN}\n  http://${ip ?? "127.0.0.1"}:${PORT}/?t=${TOKEN}\n(откройте на телефоне в той же Wi-Fi сети; Ctrl+C — остановить)`);
});

const PAGE = /* html */ `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ANEK. — посты</title>
<style>
:root{--bg:#f6f1e7;--card:#fff;--ink:#1f1a14;--mute:#6f665a;--line:#e4dccd;--acc:#c8553d;--ok:#3f7d4e;--y:#e0a030}
@media (prefers-color-scheme:dark){:root{--bg:#16130f;--card:#221d17;--ink:#f1ebe0;--mute:#a59b8c;--line:#3a3229}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.4 -apple-system,system-ui,sans-serif}
header{position:sticky;top:0;background:var(--bg);padding:12px 16px 8px;border-bottom:1px solid var(--line);z-index:2}
h1{margin:0 0 8px;font-size:22px}h1 .dot{display:inline-block;width:.42em;height:.42em;border-radius:50%;background:var(--y);margin:0 .12em 0 .07em;vertical-align:.15em}
.tabs{display:flex;gap:8px;flex-wrap:wrap}.tabs button,.seg button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:6px 14px;font-size:15px}
.tabs button.on,.seg button.on{background:var(--ink);color:var(--bg)}
.seg{display:flex;gap:6px;margin-top:8px}
main{padding:12px 16px 80px;max-width:560px;margin:0 auto}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin:0 0 14px}
.meta{color:var(--mute);font-size:14px}.title{font-weight:700;font-size:18px;margin:2px 0 8px}
video{width:100%;max-height:60vh;border-radius:12px;background:#000}
.row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
a.btn,button.btn{flex:1 1 auto;text-align:center;text-decoration:none;border:0;border-radius:12px;padding:12px;font-size:16px;font-weight:600;background:var(--ink);color:var(--bg)}
button.btn.alt{background:transparent;color:var(--ink);border:1px solid var(--line)}button.btn.ok{background:var(--ok);color:#fff}
textarea{width:100%;min-height:140px;border:1px solid var(--line);border-radius:12px;padding:10px;font-family:inherit;font-size:14px;line-height:1.4;background:var(--bg);color:var(--ink)}
input{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;font-size:16px;background:var(--bg);color:var(--ink)}
ul{margin:6px 0 0;padding-left:20px;color:var(--mute);font-size:14px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.badge{display:inline-block;border-radius:6px;padding:1px 6px;font-size:12px;background:var(--line);color:var(--ink)}.empty{color:var(--mute);text-align:center;padding:40px 0}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:10px 16px;border-radius:999px;opacity:0;transition:.2s}.toast.on{opacity:1}
</style></head><body>
<header><h1>ANEK<i class="dot"></i> посты</h1><div class="tabs" id="tabs"></div>
<div class="seg"><button data-v="todo" class="on">К публикации</button><button data-v="done">Опубликовано</button></div></header>
<main id="list"><div class="empty">Загрузка…</div></main><div class="toast" id="toast"></div>
<script>
const q=new URLSearchParams(location.search);if(q.get('t'))localStorage.setItem('anek_t',q.get('t'));
const T=localStorage.getItem('anek_t')||'';let acc=localStorage.getItem('anek_acc')||'',view='todo',data=null;
const api=(p,o={})=>fetch(p+(p.includes('?')?'&':'?')+'t='+T,{...o,headers:{'Content-Type':'application/json','x-token':T}}).then(r=>r.json());
const toast=m=>{const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1600)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function copy(id){const ta=document.getElementById('cap'+id);ta.focus();ta.select();ta.setSelectionRange(0,1e6);
 const ok=()=>toast('Подпись скопирована');if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(ta.value).then(ok);else{document.execCommand('copy');ok()}}
async function act(id,a,body){await api('/api/posts/'+id+'/'+a,{method:'POST',body:JSON.stringify(body||{})});toast('Сохранено');load()}
function published(id){const u=document.getElementById('url'+id).value;act(id,'published',{url:u})}
function metrics(id){const g=k=>document.getElementById(k+id).value;act(id,'metrics',{views:g('v'),likes:g('l'),comments:g('c'),shares:g('s'),saves:g('sv')})}
const when=d=>new Date(d).toLocaleString('ru-RU',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
function card(p){const r=p.render,m=p.metrics||{};const md=r?'/media/'+r.id+'?t='+T:'';
 const head='<div class="meta">'+when(p.scheduledAt)+' · <span class="badge">'+esc(p.episodeId)+'</span>'+(r?' · '+Math.round(r.duration)+' с':'')+'</div><div class="title">'+esc(p.title)+'</div>';
 if(view==='done')return '<div class="card">'+head+(p.url?'<div class="row"><a class="btn alt" href="'+esc(p.url)+'" target="_blank">Открыть пост</a></div>':'')+
  '<div class="meta">Цифры'+(m.at?' (последние: '+when(m.at)+')':'')+'</div><div class="grid">'+
  [['v','просмотры','views'],['l','лайки','likes'],['c','комменты','comments'],['s','репосты','shares'],['sv','сохранения','saves']].map(([k,n,f])=>'<input id="'+k+p.id+'" inputmode="numeric" placeholder="'+n+'" value="'+(m[f]??'')+'">').join('')+
  '</div><div class="row"><button class="btn ok" onclick="metrics('+p.id+')">Сохранить цифры</button><button class="btn alt" onclick="act('+p.id+',\\'planned\\')">Вернуть в очередь</button></div></div>';
 return '<div class="card">'+head+(r?'<video src="'+md+'" controls playsinline preload="metadata"'+(r.cover?' poster="/cover/'+r.id+'?t='+T+'"':'')+'></video>':'<div class="meta">Нет рендера с озвучкой</div>')+
  (r?'<div class="row"><a class="btn" href="'+md+'&dl=1" download>Скачать видео</a>'+(r.cover?'<a class="btn alt" href="/cover/'+r.id+'?t='+T+'&dl=1" download>Обложка</a>':'')+'</div>':'')+
  '<textarea id="cap'+p.id+'" readonly>'+esc(p.caption)+'</textarea><div class="row"><button class="btn" onclick="copy('+p.id+')">Скопировать подпись</button></div>'+
  '<ul>'+data.checklist.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul>'+
  '<div class="row"><input id="url'+p.id+'" placeholder="Ссылка на пост (необязательно)"></div>'+
  '<div class="row"><button class="btn ok" onclick="published('+p.id+')">Опубликовано</button><button class="btn alt" onclick="act('+p.id+',\\'skip\\')">Пропустить</button></div></div>'}
function render(){const L=document.getElementById('list');if(!data||data.error){L.innerHTML='<div class="empty">'+esc(data&&data.error||'Нет данных')+'</div>';return}
 const ps=data.posts.filter(p=>view==='done'?p.state==='published':p.state!=='published');if(view==='done')ps.reverse();
 L.innerHTML=ps.length?ps.map(card).join(''):'<div class="empty">'+(view==='done'?'Пока ничего не опубликовано':'Очередь пуста — pnpm posts plan')+'</div>'}
async function load(){data=await api('/api/posts?account='+encodeURIComponent(acc));render()}
async function init(){const accs=await api('/api/accounts');if(accs.error){document.getElementById('list').innerHTML='<div class="empty">Откройте ссылку с токеном из pnpm board</div>';return}
 if(!accs.find(a=>a.id===acc))acc=(accs[0]||{}).id||'';const tabs=document.getElementById('tabs');
 tabs.innerHTML=accs.map(a=>'<button data-a="'+a.id+'" class="'+(a.id===acc?'on':'')+'">'+a.id+(a.handle?' · @'+esc(a.handle):'')+'</button>').join('')||'<span class="meta">Нет активных аккаунтов (content/accounts.json → pnpm db sync)</span>';
 tabs.onclick=e=>{const b=e.target.closest('button');if(!b)return;acc=b.dataset.a;localStorage.setItem('anek_acc',acc);[...tabs.children].forEach(x=>x.classList.toggle('on',x===b));load()};load()}
document.querySelector('.seg').onclick=e=>{const b=e.target.closest('button');if(!b)return;view=b.dataset.v;[...b.parentNode.children].forEach(x=>x.classList.toggle('on',x===b));render()};
init();
</script></body></html>`;
