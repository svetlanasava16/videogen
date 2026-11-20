/**
 * Генерирует remotion/src/registry.generated.ts из content/characters и content/locations.
 *   pnpm registry
 */
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./util.js";

const list = (dir: string) => readdirSync(join(ROOT, "content", dir)).filter((f) => f.endsWith(".json")).sort();
const ident = (f: string, p: string) => p + f.replace(/\.json$/, "").replace(/[^a-zA-Z0-9]/g, "_");
const chars = list("characters");
const locs = list("locations");
const out = [
  "// Сгенерировано pnpm registry — не редактировать вручную.",
  ...chars.map((f) => `import ${ident(f, "c_")} from "../../content/characters/${f}";`),
  ...locs.map((f) => `import ${ident(f, "l_")} from "../../content/locations/${f}";`),
  `export const characterData: unknown[] = [${chars.map((f) => ident(f, "c_")).join(", ")}];`,
  `export const locationData: unknown[] = [${locs.map((f) => ident(f, "l_")).join(", ")}];`,
  "",
].join("\n");
writeFileSync(join(ROOT, "remotion", "src", "registry.generated.ts"), out);
console.log(`registry: ${chars.length} characters, ${locs.length} locations`);
