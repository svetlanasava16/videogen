/**
 * Генерирует remotion/src/registry.generated.ts из content/characters, content/locations, content/signs и content/wardrobe.
 *   pnpm registry
 */
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./util.js";

const list = (dir: string) => readdirSync(join(ROOT, "content", dir)).filter((f) => f.endsWith(".json")).sort();
const ident = (f: string, p: string) => p + f.replace(/\.json$/, "").replace(/[^a-zA-Z0-9]/g, "_");
const chars = list("characters");
const locs = list("locations");
// надписи в фонах по местам: content/signs/<location>.json — {ключ: {ru, en, de}}, сливаются в один словарь
const signs = list("signs");
// гардероб: content/wardrobe/*.json — {items: [...]} (схема WardrobeFile в @jf/core)
const wardrobe = list("wardrobe");
const out = [
  "// Сгенерировано pnpm registry — не редактировать вручную.",
  ...chars.map((f) => `import ${ident(f, "c_")} from "../../content/characters/${f}";`),
  ...locs.map((f) => `import ${ident(f, "l_")} from "../../content/locations/${f}";`),
  ...signs.map((f) => `import ${ident(f, "s_")} from "../../content/signs/${f}";`),
  ...wardrobe.map((f) => `import ${ident(f, "w_")} from "../../content/wardrobe/${f}";`),
  `export const characterData: unknown[] = [${chars.map((f) => ident(f, "c_")).join(", ")}];`,
  `export const locationData: unknown[] = [${locs.map((f) => ident(f, "l_")).join(", ")}];`,
  `export const signData: Record<string, Record<string, string>> = Object.assign({}, ${signs.map((f) => ident(f, "s_")).join(", ")});`,
  `export const wardrobeData: unknown[] = [${wardrobe.map((f) => ident(f, "w_")).join(", ")}];`,
  "",
].join("\n");
writeFileSync(join(ROOT, "remotion", "src", "registry.generated.ts"), out);
console.log(`registry: ${chars.length} characters, ${locs.length} locations, ${signs.length} sign files, ${wardrobe.length} wardrobe files`);
