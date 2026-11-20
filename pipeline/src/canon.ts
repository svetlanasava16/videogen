/**
 * Канон: сырые архетипы из разметки → канонические роли и локации.
 *   pnpm canon check characters|locations   проверить data/llm/canon/<kind>.out.json
 */
import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DATA, readJsonl } from "./util.js";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const Names = z.object({ ru: z.string().min(1), en: z.string().min(1), de: z.string().min(1) });
const CHAR_GROUPS = ["adult-man", "adult-woman", "elderly-man", "elderly-woman", "child", "teen", "animal", "supernatural", "object", "crowd"] as const;
const LOC_GROUPS = ["home", "public-indoor", "work", "outdoor-city", "outdoor-nature", "transport", "fantasy", "none"] as const;

export const CanonFile = (groups: readonly [string, ...string[]]) =>
  z.object({
    canon: z.array(
      z.object({ id: z.string().regex(KEBAB), names: Names, group: z.enum(groups), folk: z.boolean().default(false), note: z.string().default("") }),
    ),
    map: z.record(z.string(), z.string()),
  });

export const CharCanon = CanonFile(CHAR_GROUPS);
export const LocCanon = CanonFile(LOC_GROUPS);
export type Canon = z.infer<typeof CharCanon>;

export function loadCanon(kind: "characters" | "locations"): Canon | null {
  const p = join(DATA, "llm", "canon", `${kind}.out.json`);
  if (!existsSync(p)) return null;
  return (kind === "characters" ? CharCanon : LocCanon).parse(JSON.parse(readFileSync(p, "utf8")));
}

function check(kind: "characters" | "locations") {
  const input = readJsonl<{ id: string }>(join(DATA, "llm", "canon", `${kind}.in.jsonl`)).map((r) => r.id);
  const raw = JSON.parse(readFileSync(join(DATA, "llm", "canon", `${kind}.out.json`), "utf8"));
  const parsed = (kind === "characters" ? CharCanon : LocCanon).safeParse(raw);
  if (!parsed.success) {
    console.log(parsed.error.issues.slice(0, 30).map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
    process.exit(1);
  }
  const { canon, map } = parsed.data;
  const ids = new Set(canon.map((c) => c.id));
  const problems: string[] = [];
  if (ids.size !== canon.length) problems.push("duplicate canonical ids");
  for (const id of input) if (!(id in map)) problems.push(`missing in map: ${id}`);
  for (const [k, v] of Object.entries(map)) if (!ids.has(v)) problems.push(`map ${k} → ${v}: not a canonical id`);
  const unused = [...ids].filter((id) => !Object.values(map).includes(id));
  if (unused.length) problems.push(`canonical ids never used: ${unused.join(", ")}`);
  if (problems.length) {
    console.log(`${problems.length} problems:\n  ${problems.slice(0, 60).join("\n  ")}`);
    process.exit(1);
  }
  console.log(`OK: ${input.length} raw → ${canon.length} canonical`);
}

const [cmd, kind] = process.argv.slice(2);
if (cmd === "check" && (kind === "characters" || kind === "locations")) check(kind);
else if (import.meta.url === `file://${process.argv[1]}`) {
  console.error("usage: canon check characters|locations");
  process.exit(2);
}
