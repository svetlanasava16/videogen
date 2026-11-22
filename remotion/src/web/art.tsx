/**
 * Проверка display list в браузере (страница /art плеера): каждая кукла и каждая вещь гардероба — дважды:
 * SVG (та же разметка картинкой) и Canvas2D из display list. Разница по пикселям считается здесь же,
 * итог — в window.__artReport (для автоматической проверки) и в заголовке страницы.
 */
import { createElement, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { lookForRole, type Act, type Look } from "@jf/core";
import { characters } from "../registry";
import { Puppet, type PuppetProps } from "../puppet/Rig";
import { WARDROBE } from "../puppet/wardrobe";
import { flatten } from "../art/displayList";
import { drawDisplayList } from "../art/canvas";

/** Окно рисования в единицах бокса куклы (300×600) с полями: руки вверх, предметы, шляпы. */
const VB = { x: -150, y: -100, w: 600, h: 800 };
const W = 150, H = 200;

type Case = { label: string; props: PuppetProps };
const base = (look: Look, extra: Partial<PuppetProps> = {}): PuppetProps => ({ look, emotion: "neutral", speaking: false, seed: 0, t: 0, ...extra });
function cases(): Case[] {
  const out: Case[] = [];
  for (const c of Object.values(characters)) out.push({ label: c.id, props: base(c.look) });
  const man = characters.muzhik.look;
  for (const it of Object.values(WARDROBE)) {
    const look = it.slot === "hair" ? { ...man, hairStyle: it.id } : { ...man, accessories: [it.id] };
    out.push({ label: it.id, props: base(look) });
  }
  const acts: Act[] = ["hands-up", "point", "slap", "hug", "cry", "facepalm", "cover-ears", "think", "phone", "laugh"];
  for (const a of acts) out.push({ label: `act ${a}`, props: base(man, { act: { name: a, k: 1, t: 0.4 } }) });
  out.push({ label: "speaking", props: base(man, { speaking: true, t: 0.37, emotion: "angry" }) });
  out.push({ label: "seated", props: base(man, { seated: 1 }) });
  out.push({ label: "in bed", props: base(man, { seated: 1, bed: 1, base: { name: "sleep", k: 1, t: 1 } }) });
  out.push({ label: "walking", props: base(man, { walk: 1, t: 0.2 }) });
  out.push({ label: "stewardess", props: base(lookForRole(characters["devushka-blondinka"], "flight-attendant"), { speaking: true, t: 0.3 }) });
  out.push({ label: "traffic cop", props: base(lookForRole(characters.sluzhivy, "traffic-cop"), { hold: "baton-striped" }) });
  return out;
}

/** Разметка куклы → картинка SVG в том же окне. */
function svgImage(markup: string): Promise<HTMLImageElement> {
  const inner = markup.replace(/^<svg[^>]*>/, "<g>").replace(/<\/svg>$/, "</g>");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}">${inner}</svg>`;
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  return img.decode().then(() => img);
}

const Tile = ({ c, onDiff }: { c: Case; onDiff: (label: string, d: number) => void }) => {
  const a = useRef<HTMLCanvasElement>(null), b = useRef<HTMLCanvasElement>(null);
  const [diff, setDiff] = useState<number>();
  useEffect(() => {
    const markup = renderToStaticMarkup(createElement(Puppet, c.props));
    const list = flatten(markup);
    const k = W / VB.w;
    const cb = b.current!.getContext("2d")!;
    drawDisplayList(cb, list, [k, 0, 0, k, -VB.x * k, -VB.y * k]);
    svgImage(markup).then((img) => {
      const ca = a.current!.getContext("2d")!;
      ca.drawImage(img, 0, 0);
      const pa = ca.getImageData(0, 0, W, H).data, pb = cb.getImageData(0, 0, W, H).data;
      let ink = 0, bad = 0;
      for (let i = 0; i < pa.length; i += 4) {
        if (pa[i + 3] < 8 && pb[i + 3] < 8) continue;
        ink++;
        const dmax = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]), Math.abs(pa[i + 3] - pb[i + 3]));
        if (dmax > 64) bad++;
      }
      const d = ink ? bad / ink : 0;
      setDiff(d); onDiff(c.label, d);
    });
  }, [c]);
  return (
    <div style={{ display: "inline-block", margin: 4, background: "#f6ecd9", font: "11px Inter, sans-serif", color: "#2b1d14" }}>
      <div style={{ display: "flex" }}><canvas ref={a} width={W} height={H} /><canvas ref={b} width={W} height={H} /></div>
      <div style={{ padding: "2px 4px", display: "flex", justifyContent: "space-between" }}>
        <span>{c.label}</span><b style={{ color: diff === undefined ? "#999" : diff > 0.02 ? "#c00" : "#2a7" }}>{diff === undefined ? "…" : `${(diff * 100).toFixed(2)}%`}</b>
      </div>
    </div>
  );
};

/**
 * Сцена «как в игре» — только из выгрузки pnpm export-art, без React SVG: фон PNG (back), куклы из display list
 * на метках из index.json (масштаб и стопы плана), передний слой PNG поверх тех, кто за ним.
 */
const GameScene = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [note, setNote] = useState("…");
  useEffect(() => {
    (async () => {
      const idx = await fetch("/art-files/backdrops/index.json").then((r) => r.json());
      const place = idx.places.find((p: { location: string; place?: string }) => p.location === "bar" && !p.place);
      if (!place?.files?.ru?.back?.png) { setNote("нет PNG бара: pnpm export-art --png --only bar --locale ru"); return; }
      const img = (src: string) => new Promise<HTMLImageElement>((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = "/art-files/" + src; });
      const back = await img(place.files.ru.back.png);
      const front = place.files.ru.front?.png ? await img(place.files.ru.front.png) : undefined;
      const cast: [string, string][] = [["barmen", "behind-counter"], ["muzhik", "stool-2"], ["devushka-blondinka", "stool-3"]];
      const lists = await Promise.all(cast.map(([id]) => fetch(`/art-files/puppets/${id}.json`).then((r) => r.json())));
      const c = ref.current!, ctx = c.getContext("2d")!;
      const k = c.width / 1080;
      ctx.drawImage(back, 0, 0, c.width, c.height);
      // по плану: дальние раньше; передний слой — между планом стойки и гостями
      const actors = cast.map(([, mark], i) => ({ m: place.marks[mark], dl: lists[i] })).sort((a, b) => b.m.z - a.m.z);
      let frontDone = !front;
      for (const a of actors) {
        if (!frontDone && place.front && a.m.z < place.front.z) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(front!, 0, 0, c.width, c.height); frontDone = true; }
        const s = a.m.puppetH / 600; // единица бокса куклы → px кадра
        // стопы бокса (y = 585) на линии плана; сидящий — ниже на высоту ног (как в постановке: SEAT); здесь стоя
        drawDisplayList(ctx, a.dl.items, [s * k, 0, 0, s * k, (a.m.x - 150 * s) * k, (a.m.feetY - 585 * s) * k]);
      }
      if (!frontDone) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(front!, 0, 0, c.width, c.height); }
      setNote(`бар из выгрузки: фон ${place.files.ru.back.png}, ${cast.length} куклы из display list на метках, передний слой z ${place.front?.z}`);
    })().catch((e) => setNote(String(e)));
  }, []);
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", margin: 4, font: "12px Inter, sans-serif" }}>
      <canvas ref={ref} width={540} height={960} style={{ background: "#000" }} />
      <div style={{ maxWidth: 540 }}>{note}</div>
    </div>
  );
};

const App = () => {
  const [all] = useState(cases);
  const results = useRef(new Map<string, number>());
  const [summary, setSummary] = useState("…");
  const onDiff = (label: string, d: number) => {
    results.current.set(label, d);
    if (results.current.size === all.length) {
      const xs = [...results.current.entries()].sort((p, q) => q[1] - p[1]);
      const worst = xs.slice(0, 8).map(([l, v]) => `${l} ${(v * 100).toFixed(2)}%`).join(", ");
      const mean = xs.reduce((s, [, v]) => s + v, 0) / xs.length;
      const text = `${xs.length} puppets: mean ${(mean * 100).toFixed(2)}% pixels differ (SVG vs display list on Canvas2D); worst: ${worst}`;
      setSummary(text);
      (window as unknown as { __artReport: unknown }).__artReport = { n: xs.length, mean, worst: xs.slice(0, 20) };
    }
  };
  return (
    <div style={{ padding: 8, background: "#efe3cc", minHeight: "100vh", overflow: "auto", height: "100vh", boxSizing: "border-box" }}>
      <div style={{ font: "bold 14px Inter, sans-serif", margin: "4px 4px 8px" }}>Display list: left — SVG, right — Canvas2D. {summary}</div>
      {new URLSearchParams(location.search).has("scene") && <GameScene />}
      {all.map((c) => <Tile key={c.label} c={c} onDiff={onDiff} />)}
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
