/**
 * Мир ANEK. (ROADMAP §8): канон жителей, журнал фактов, граф городка.
 *   pnpm world check [--json]                 — канон, граф и журнал согласованы с куклами, местами и town.json
 *   pnpm world cast [<id>… | --all] [--json]  — роли кукол эпизодов → жители канона, конфликты, сводка
 *   pnpm world route <откуда> <куда>          — кратчайший путь по графу (узлы — здания и улицы map.json)
 * Файлы: content/world/canon.json, state.json, map.json (town.json — координаты зданий и места в них).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { Canon, GENERIC_ROLES, TownGraph, WorldState, activeFacts, castConflicts, residentFor, shortestRoute, type CastLink } from "@jf/core";
import { ROOT } from "./util.js";
import { loadAssets, type Issue } from "./validate.js";

const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

type Town = { buildings: { id: string; x: number; y: number; places: { location: string; place?: string }[] }[] };
export function loadWorld() {
  return {
    canon: Canon.parse(readJson("content/world/canon.json")),
    state: WorldState.parse(readJson("content/world/state.json")),
    graph: TownGraph.parse(readJson("content/world/map.json")),
    town: readJson("content/world/town.json") as Town,
  };
}

/** Все проверки мира. Ошибки — сломанные ссылки и несвязный граф; предупреждения — то, что сработает, но странно. */
export function checkWorld(A = loadAssets(), W = loadWorld()): Issue[] {
  const out: Issue[] = [];
  const err = (id: string, kind: string, msg: string) => out.push({ id, level: "error", kind, msg });
  const warn = (id: string, kind: string, msg: string) => out.push({ id, level: "warn", kind, msg });
  const { canon, state, graph, town } = W;
  const nodes = new Set(graph.nodes.map((n) => n.id));
  const districts = new Set(canon.districts.map((d) => d.id));
  const residents = new Set<string>();
  const place = (id: string, p: { location: string; place?: string }, what: string) => {
    const loc = A.locations.get(p.location);
    if (!loc) return err(id, "place", `${what}: unknown location "${p.location}"`);
    if (p.place && !(loc.bible?.variants ?? []).some((v) => v.id === p.place)) err(id, "place", `${what}: location ${p.location} has no place "${p.place}"`);
  };
  const dup = (kind: string, ids: string[]) => { const s = new Set<string>(); for (const i of ids) { if (s.has(i)) err(`${kind}:${i}`, "duplicate", `duplicate id`); s.add(i); } };
  dup("district", canon.districts.map((d) => d.id)); dup("resident", canon.residents.map((r) => r.id));
  dup("landmark", canon.landmarks.map((l) => l.id)); dup("node", graph.nodes.map((n) => n.id)); dup("fact", state.facts.map((f) => f.id));

  // районы: узел есть, у кварталов — язык; узлы графа ссылаются на районы
  for (const d of canon.districts) {
    if (!nodes.has(d.node)) err(`district:${d.id}`, "node", `unknown map node "${d.node}"`);
    if (d.kind === "quarter" && !d.locale) err(`district:${d.id}`, "locale", "a quarter needs a locale");
  }
  for (const n of graph.nodes) if (!districts.has(n.district)) err(`node:${n.id}`, "district", `unknown district "${n.district}"`);

  // жители: кукла, район, дом и работа, роли
  const roleKey = new Map<string, string>();
  for (const r of canon.residents) {
    const id = `resident:${r.id}`;
    residents.add(r.id);
    if (!A.characters.has(r.puppet)) err(id, "puppet", `unknown puppet "${r.puppet}"`);
    if (r.district !== "home" && !districts.has(r.district)) err(id, "district", `unknown district "${r.district}"`);
    if (r.home) place(id, r.home, "home");
    if (r.work) place(id, r.work, "work");
    for (const role of r.roles) {
      if (!A.owner.has(role) && !(GENERIC_ROLES as readonly string[]).includes(role)) warn(id, "role", `role "${role}" is not used by any puppet or the generic list`);
      const k = `${r.puppet}/${role}`;
      if (roleKey.has(k)) err(id, "role", `role "${role}" of puppet ${r.puppet} already belongs to ${roleKey.get(k)} — the mapping must be unique`);
      else roleKey.set(k, r.id);
    }
  }
  // у каждой куклы есть житель (иначе в серии она безымянная)
  for (const c of A.characters.keys()) if (!canon.residents.some((r) => r.puppet === c)) warn(`character:${c}`, "canon", "puppet has no resident in canon");

  // связи
  for (const rel of canon.relations) {
    const id = `relation:${rel.a}-${rel.kind}-${rel.b}`;
    for (const x of [rel.a, rel.b]) if (!residents.has(x)) err(id, "resident", `unknown resident "${x}"`);
    if (rel.a === rel.b) err(id, "relation", "relation to self");
  }
  // ориентиры
  for (const l of canon.landmarks) {
    const id = `landmark:${l.id}`;
    place(id, l, "landmark");
    if (!nodes.has(l.node)) err(id, "node", `unknown map node "${l.node}"`);
    if (l.owner && !residents.has(l.owner)) err(id, "owner", `unknown resident "${l.owner}"`);
  }

  // граф: рёбра на известные узлы, каждое здание town.json — узел, граф связен
  for (const e of graph.edges) for (const x of [e.a, e.b]) if (!nodes.has(x)) err(`edge:${e.a}-${e.b}`, "node", `unknown node "${x}"`);
  for (const b of town.buildings) if (!nodes.has(b.id)) err(`building:${b.id}`, "map", "town building is not a node of map.json");
  for (const n of graph.nodes) if (n.kind === "building" && !town.buildings.some((b) => b.id === n.id)) err(`node:${n.id}`, "map", "building node is not in town.json");
  if (graph.nodes.length) {
    const seen = new Set([graph.nodes[0].id]), q = [graph.nodes[0].id];
    while (q.length) { const u = q.pop()!; for (const e of graph.edges) for (const [a, b] of [[e.a, e.b], [e.b, e.a]]) if (a === u && !seen.has(b)) { seen.add(b); q.push(b); } }
    for (const n of graph.nodes) if (!seen.has(n.id)) err(`node:${n.id}`, "map", "not reachable from the rest of the town");
  }

  // журнал: undoes — на более ранний факт; актёры — жители; один и тот же действующий факт дважды
  const earlier = new Set<string>();
  for (const f of state.facts) {
    const id = `fact:${f.id}`;
    if (f.undoes && !earlier.has(f.undoes)) err(id, "undoes", `undoes "${f.undoes}", which is not an earlier fact`);
    for (const a of f.actors) if (!residents.has(a)) err(id, "actor", `unknown resident "${a}"`);
    if (f.place) place(id, f.place, "place");
    earlier.add(f.id);
  }
  const act = new Map<string, string>();
  for (const f of activeFacts(state)) {
    const k = `${f.fact}|${[...f.actors].sort().join(",")}`;
    if (act.has(k)) warn(`fact:${f.id}`, "duplicate", `same active fact as ${act.get(k)}`);
    else act.set(k, f.id);
  }
  return out;
}

/** Состав эпизода → жители канона (по сценам: у сцены свои роли). */
export function castEpisode(id: string, W = loadWorld()) {
  const ep = JSON.parse(readFileSync(join(ROOT, "content/episodes", `${id}.json`), "utf8"));
  const links: CastLink[] = (ep.cast as string[]).map((p) => residentFor(W.canon, p, ep.roles?.[p]));
  return { id, locale: ep.locale as string, links, conflicts: castConflicts(W.canon, links) };
}

function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { json: { type: "boolean" }, all: { type: "boolean" } } });
  const [cmd, ...rest] = positionals;
  if (cmd === "check") {
    const issues = checkWorld();
    if (values.json) return console.log(JSON.stringify(issues, null, 1));
    for (const i of issues) console.log(`${i.level.padEnd(5)} ${i.id}: ${i.msg}`);
    const W = loadWorld(), e = issues.filter((i) => i.level === "error").length;
    console.log(`world: ${W.canon.districts.length} districts, ${W.canon.residents.length} residents, ${W.canon.relations.length} relations, ${W.canon.landmarks.length} landmarks; map ${W.graph.nodes.length} nodes, ${W.graph.edges.length} edges; ${W.state.facts.length} facts — ${e} errors, ${issues.length - e} warnings`);
    if (e) process.exitCode = 1;
  } else if (cmd === "cast") {
    const W = loadWorld();
    const ids = values.all || !rest.length ? readdirSync(join(ROOT, "content/episodes")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort() : rest;
    const rows = ids.map((id) => castEpisode(id, W));
    if (values.json) return console.log(JSON.stringify(rows, null, 1));
    if (rest.length) for (const r of rows) {
      console.log(`${r.id} (${r.locale})`);
      for (const l of r.links) { const res = W.canon.residents.find((x) => x.id === l.resident); console.log(`  ${l.puppet.padEnd(20)} ${(l.role ?? "-").padEnd(18)} → ${res ? `${res.name[r.locale as "ru"]} [${res.id}]` : "—"} (${l.how})`); }
      for (const c of r.conflicts) console.log(`  ! ${c}`);
    }
    const links = rows.flatMap((r) => r.links);
    const by = (h: string) => links.filter((l) => l.how === h).length;
    const res = new Map<string, number>(); for (const l of links) if (l.resident) res.set(l.resident, (res.get(l.resident) ?? 0) + 1);
    const fall = new Map<string, number>(); for (const l of links) if (l.how === "default" && l.role) fall.set(`${l.puppet}/${l.role}`, (fall.get(`${l.puppet}/${l.role}`) ?? 0) + 1);
    const withConf = rows.filter((r) => r.conflicts.length);
    console.log(`${rows.length} episodes, ${links.length} cast slots: by role ${by("role")}, puppet default ${by("default")}, no resident ${by("none")}; ${withConf.length} episodes with conflicts`);
    if (!rest.length) {
      console.log("top residents: " + [...res].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} ${v}`).join(", "));
      console.log("roles falling back to the puppet's main resident: " + [...fall].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k} ${v}`).join(", "));
      const kinds = new Map<string, number>(); for (const r of withConf) for (const c of r.conflicts) { const k = c.includes("plays both") ? "same resident twice" : c.replace(/^.*no "(.+)" relation.*$/, "no $1 relation"); kinds.set(k, (kinds.get(k) ?? 0) + 1); }
      console.log("conflicts: " + [...kinds].map(([k, v]) => `${k} ${v}`).join(", "));
    }
  } else if (cmd === "route") {
    const W = loadWorld();
    const [a, b] = rest;
    const r = a && b ? shortestRoute(W.graph, a, b) : undefined;
    if (!r) { console.error(a && b ? `no route ${a} → ${b}` : "usage: pnpm world route <from> <to>"); process.exitCode = 1; return; }
    console.log(`${r.nodes.join(" → ")}  (${r.minutes} min; ${r.edges.map((e) => e.kind).join(", ")})`);
  } else {
    console.error("usage: pnpm world check | cast [ids|--all] | route <from> <to>");
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
