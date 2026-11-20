/** Куклы, фоны и канон: общие справочники для стадий script и каталога. */
import { Character, Location } from "@jf/core";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCanon } from "./canon.js";
import { ROOT } from "./util.js";

const readDir = <T,>(dir: string, schema: { parse: (x: unknown) => T }) => {
  const full = join(ROOT, "content", dir);
  return existsSync(full)
    ? readdirSync(full).filter((f) => f.endsWith(".json")).sort().map((f) => schema.parse(JSON.parse(readFileSync(join(full, f), "utf8"))))
    : [];
};

export function loadCast() {
  const puppets = readDir("characters", Character).filter((c) => c.bible);
  const backdrops = readDir("locations", Location).filter((l) => l.bible);
  const charCanon = loadCanon("characters");
  const locCanon = loadCanon("locations");
  const role = (arch: string) => charCanon?.map[arch] ?? arch;
  const place = (arch: string) => locCanon?.map[arch] ?? arch;
  const group = new Map(charCanon?.canon.map((c) => [c.id, c.group]) ?? []);
  const noPuppet = (r: string) => ["object", "crowd"].includes(group.get(r) ?? "");
  const playedBy = new Map<string, string>();
  for (const p of puppets) for (const r of p.bible!.roles) playedBy.set(r, p.id);
  const familyOf = new Map(puppets.map((p) => [p.id, p.family ?? p.id]));
  const families = new Map<string, string[]>();
  for (const [id, f] of familyOf) families.set(f, [...(families.get(f) ?? []), id]);
  const backdropFor = new Map<string, string>();
  for (const l of backdrops) for (const r of l.bible!.roles) backdropFor.set(r, l.id);

  /** Подобрать куклу на каждую роль сцены; при конфликте взять свободного двойника из семейства. */
  function castScene(roles: string[]): { cast: Record<string, string>; ok: boolean } {
    const used = new Set<string>();
    const cast: Record<string, string> = {};
    let ok = true;
    for (const r of roles) {
      if (noPuppet(r)) continue;
      const p = playedBy.get(r);
      if (!p) { ok = false; continue; }
      const pick = !used.has(p) ? p : (families.get(familyOf.get(p)!) ?? []).find((x) => !used.has(x));
      if (!pick) { ok = false; continue; }
      used.add(pick);
      cast[r] = pick;
    }
    return { cast, ok };
  }
  return { puppets, backdrops, role, place, noPuppet, playedBy, familyOf, families, backdropFor, castScene };
}
