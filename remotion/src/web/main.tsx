/**
 * Страница веб-плеера: выбор эпизода и проигрывание его исполнения (performance.json).
 * Сервер — `pnpm player` (pipeline/src/player.ts): отдаёт эту страницу, /api/episodes, /perf/<id>.json и /public/*.
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Performance } from "@jf/player";
import { WebPlayer } from "./WebPlayer";

type Item = { id: string; title: string; voiced: boolean };

const App = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [id, setId] = useState(new URLSearchParams(location.search).get("id") ?? "");
  const [perf, setPerf] = useState<Performance>();
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/episodes").then((r) => r.json()).then((xs: Item[]) => { setItems(xs); if (!id && xs.length) setId(xs[0].id); }); }, []);
  useEffect(() => {
    if (!id) return;
    history.replaceState(null, "", `?id=${encodeURIComponent(id)}`);
    setPerf(undefined); setError("");
    fetch(`/perf/${encodeURIComponent(id)}.json`).then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(t)))).then(setPerf).catch((e) => setError(String(e)));
  }, [id]);
  return (
    <>
      <select value={id} onChange={(e) => setId(e.target.value)}
        style={{ position: "fixed", top: 8, left: 8, zIndex: 10, maxWidth: 360, font: "13px Inter, sans-serif", padding: 4, borderRadius: 6 }}>
        {items.map((x) => <option key={x.id} value={x.id}>{x.voiced ? "🔊 " : ""}{x.title} — {x.id}</option>)}
      </select>
      {error ? <pre style={{ color: "#f88", padding: 48 }}>{error}</pre> : perf ? <WebPlayer perf={perf} /> : <div style={{ color: "#aaa", padding: 48, font: "14px Inter, sans-serif" }}>…</div>}
    </>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
