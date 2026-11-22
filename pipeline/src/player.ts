/**
 * Веб-плеер исполнений (ROADMAP §7): собирает remotion/src/web/main.tsx (esbuild) и раздаёт его локально.
 *   pnpm player [--port 4173]  → http://localhost:4173/?id=<эпизод>
 * Маршруты: /             — страница плеера (remotion/src/web/index.html)
 *           /main.js       — сборка плеера (React + арт + @jf/player, без Remotion-хуков)
 *           /api/episodes  — список эпизодов (id, название, озвучен ли)
 *           /perf/<id>.json — исполнение, компилируется на лету (как pnpm compile-episode)
 *           /public/*      — remotion/public (озвучка, смех, музыка, шрифт)
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { parseArgs } from "node:util";
import { build } from "esbuild";
import { ROOT } from "./util.js";
import { compileById } from "./compile-episode.js";

const WEB = join(ROOT, "remotion/src/web");
const PUBLIC = join(ROOT, "remotion/public");
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml" };

/** Сборка страницы: один файл main.js. */
export async function bundlePlayer(): Promise<string> {
  const r = await build({
    entryPoints: [join(WEB, "main.tsx")], bundle: true, write: false, format: "iife", target: "es2020",
    jsx: "automatic", loader: { ".json": "json" }, define: { "process.env.NODE_ENV": '"production"' }, minify: true,
    absWorkingDir: join(ROOT, "remotion"), logLevel: "warning",
  });
  return r.outputFiles[0].text;
}

async function main() {
  const { values } = parseArgs({ options: { port: { type: "string" } } });
  const port = Number(values.port ?? 4173);
  let js = await bundlePlayer();
  console.log(`player bundle: ${(js.length / 1024).toFixed(0)} KB`);
  const episodes = () => readdirSync(join(ROOT, "content/episodes")).filter((f) => f.endsWith(".json")).sort().map((f) => {
    const ep = JSON.parse(readFileSync(join(ROOT, "content/episodes", f), "utf8"));
    return { id: f.replace(/\.json$/, ""), title: ep.title as string, voiced: (ep.lines as { audio?: unknown }[]).some((l) => l.audio) };
  });
  createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const send = (code: number, body: string | Buffer, type = "text/plain; charset=utf-8") => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(body); };
    try {
      if (url.pathname === "/") return send(200, readFileSync(join(WEB, "index.html")), TYPES[".html"]);
      if (url.pathname === "/main.js") { if (url.searchParams.has("rebuild")) js = await bundlePlayer(); return send(200, js, TYPES[".js"]); }
      if (url.pathname === "/api/episodes") return send(200, JSON.stringify(episodes()), TYPES[".json"]);
      const perf = url.pathname.match(/^\/perf\/(.+)\.json$/);
      if (perf) {
        const id = decodeURIComponent(perf[1]);
        if (!/^[\w.-]+$/.test(id) || !existsSync(join(ROOT, "content/episodes", `${id}.json`))) return send(404, `no episode ${id}`);
        return send(200, JSON.stringify(compileById(id)), TYPES[".json"]);
      }
      if (url.pathname.startsWith("/public/")) {
        const file = normalize(join(PUBLIC, decodeURIComponent(url.pathname.slice("/public/".length))));
        if (!file.startsWith(PUBLIC) || !existsSync(file) || !statSync(file).isFile()) return send(404, "not found");
        return send(200, readFileSync(file), TYPES[extname(file)] ?? "application/octet-stream");
      }
      send(404, "not found");
    } catch (e) {
      send(500, String((e as Error).stack ?? e));
    }
  }).listen(port, "127.0.0.1", () => console.log(`ANEK. player → http://localhost:${port}/`));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
