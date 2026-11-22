/**
 * Схема ответа сценариста с перечнями из реестра (ROADMAP §6): только существующие куклы, роли, места, сублокации,
 * метки, реквизит, действия, машины, вещи гардероба. JSON Schema (draft 2020-12) — для ограниченной генерации
 * (локальная модель: llama.cpp / vLLM guided JSON), чтобы ошибка «нет такой метки/куклы» не могла появиться при записи.
 *   pnpm llm schema script   → data/llm/script/schema.json (+ самопроверка: все готовые сценарии проходят схему)
 * Перечни плоские (метки — всех мест сразу): привязку «метка именно этого места» по-прежнему проверяет `llm check`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { ZodTypeAny } from "zod";
import { APPEARANCE_ROLES, Character, GENERIC_ROLES, Location, NARRATOR, ScriptDraft, WardrobeFile, markOf } from "@jf/core";
import { ROOT } from "./util.js";

type JS = Record<string, unknown>;

/** zod v3 → JSON Schema (подмножество, которым описаны наши схемы). */
export function toJsonSchema(s: ZodTypeAny): JS {
  const d = s._def as Record<string, unknown> & { typeName: string };
  switch (d.typeName) {
    case "ZodObject": {
      const shape = (d.shape as () => Record<string, ZodTypeAny>)();
      const props: Record<string, JS> = {}, required: string[] = [];
      for (const [k, v] of Object.entries(shape)) {
        props[k] = toJsonSchema(v);
        const t = (v._def as { typeName: string }).typeName;
        if (t !== "ZodOptional" && t !== "ZodDefault") required.push(k);
      }
      return { type: "object", properties: props, ...(required.length ? { required } : {}), additionalProperties: false };
    }
    case "ZodString": return { type: "string", ...((d.checks as { kind: string; value: number }[]).find((c) => c.kind === "min") ? { minLength: (d.checks as { kind: string; value: number }[]).find((c) => c.kind === "min")!.value } : {}) };
    case "ZodNumber": {
      const c = d.checks as { kind: string; value: number }[];
      const min = c.find((x) => x.kind === "min"), max = c.find((x) => x.kind === "max");
      return { type: c.some((x) => x.kind === "int") ? "integer" : "number", ...(min ? { minimum: min.value } : {}), ...(max ? { maximum: max.value } : {}) };
    }
    case "ZodBoolean": return { type: "boolean" };
    case "ZodEnum": return { type: "string", enum: d.values as string[] };
    case "ZodLiteral": return { const: d.value };
    case "ZodArray": return { type: "array", items: toJsonSchema(d.type as ZodTypeAny), ...(d.minLength ? { minItems: (d.minLength as { value: number }).value } : {}) };
    case "ZodOptional": case "ZodNullable": return toJsonSchema(d.innerType as ZodTypeAny);
    case "ZodDefault": return toJsonSchema(d.innerType as ZodTypeAny);
    case "ZodEffects": return toJsonSchema(d.schema as ZodTypeAny);
    case "ZodRecord": return { type: "object", propertyNames: toJsonSchema(d.keyType as ZodTypeAny), additionalProperties: toJsonSchema(d.valueType as ZodTypeAny) };
    case "ZodUnion": return { anyOf: (d.options as ZodTypeAny[]).map(toJsonSchema) };
    case "ZodDiscriminatedUnion": return { anyOf: [...(d.options as ZodTypeAny[] | Map<string, ZodTypeAny>).values()].map(toJsonSchema) };
    case "ZodLazy": return toJsonSchema((d.getter as () => ZodTypeAny)());
    default: return {};
  }
}

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const list = (d: string) => readdirSync(join(ROOT, "content", d)).filter((f) => f.endsWith(".json"));

/** Перечни из реестра. */
export function vocab() {
  const chars = list("characters").map((f) => Character.parse(readJson(join(ROOT, "content/characters", f))));
  const locs = list("locations").map((f) => Location.parse(readJson(join(ROOT, "content/locations", f))));
  const items = list("wardrobe").flatMap((f) => WardrobeFile.parse(readJson(join(ROOT, "content/wardrobe", f))).items);
  const props = (readJson(join(ROOT, "content/props.json")).props as { id: string }[]).map((p) => p.id);
  const marks = new Set<string>(["auto", "off-left", "off-right"]);
  const places = new Set<string>();
  for (const l of locs) {
    for (const k of Object.keys(l.marks ?? {})) marks.add(k);
    for (const v of l.bible?.variants ?? []) {
      if (v.id) places.add(v.id);
      for (const r of v.roles) places.add(r);
      for (const k of Object.keys(v.marks ?? {})) marks.add(k);
    }
  }
  const roles = new Set<string>([...GENERIC_ROLES, ...APPEARANCE_ROLES]);
  for (const c of chars) for (const r of [...(c.bible?.roles ?? []), ...(c.bible?.variants ?? []).flatMap((v) => v.roles)]) roles.add(r);
  const sorted = (s: Iterable<string>) => [...new Set(s)].sort();
  return {
    puppets: sorted(chars.map((c) => c.id)),
    locations: sorted(locs.map((l) => l.id)),
    places: sorted(places),
    marks: sorted(marks),
    props: sorted(props),
    roles: sorted(roles),
    wear: sorted(items.filter((i) => i.slot !== "hair").map((i) => i.id)),
    hair: sorted([...items.filter((i) => i.slot === "hair").map((i) => i.id), "none"]),
  };
}

/** Схема ScriptDraft с перечнями вместо свободных строк. */
export function scriptSchema(): JS {
  const V = vocab();
  const e = (xs: string[]) => ({ type: "string", enum: xs });
  const sc = toJsonSchema(ScriptDraft) as JS;
  const P = (o: JS) => o.properties as Record<string, JS>;
  const item = (o: JS) => o.items as JS;
  /** Облик на эпизод: кукла → патч (вещи гардероба, причёска). */
  const looks = (o: JS) => { o.propertyNames = e(V.puppets); const p = P(o.additionalProperties as JS); p.add.items = e(V.wear); p.remove.items = e(V.wear); p.hairStyle = e(V.hair); };
  const roles = (o: JS) => { o.propertyNames = e(V.puppets); o.additionalProperties = e(V.roles); };
  const set = (o: JS) => { const p = P(item(o)); p.at = e([...new Set([...V.marks, "left", "center", "right"])].sort()); };
  const top = P(sc);
  top.location = e(["none", ...V.locations]);
  top.cast.items = e(V.puppets);
  roles(top.roles); looks(top.looks); set(top.set);
  const line = P(item(top.lines));
  line.character = e([NARRATOR, ...V.puppets]);
  line.enter.items = e(V.puppets); line.exit.items = e(V.puppets);
  const scene = item(top.scenes);
  const S = P(scene);
  S.location = e(V.locations); S.place = e(V.places);
  S.cast.items = e(V.puppets);
  roles(S.roles); looks(S.looks); set(S.set);
  const veh = P(item(S.vehicles)); veh.at = e(V.marks); veh.riders.items = e(V.puppets);
  const split = P(S.split); split.location = e(V.locations); split.place = e(V.places); split.cast.items = e(V.puppets);
  for (const b of (item(S.beats).anyOf as JS[])) {
    const p = P(b), type = (p.type as { const: string }).const;
    if (p.who) p.who = e(V.puppets);
    if (type === "move" || type === "drive") p.to = e(V.marks);
    if (type === "alight") p.to = e(V.marks);
    if (type === "act") p.to = e([NARRATOR, ...V.puppets]);
    if (type === "prop") { p.item = e(V.props); p.to = e(V.puppets); }
    if (type === "camera") p.on = e(V.puppets);
  }
  return { $schema: "https://json-schema.org/draft/2020-12/schema", title: "ScriptDraft (ANEK.)", ...sc };
}

/** Проверка значения по схеме (подмножество, которое порождает toJsonSchema): список ошибок с путём. */
export function checkSchema(s: JS, v: unknown, path = "$"): string[] {
  const out: string[] = [];
  if (s.anyOf) {
    const ok = (s.anyOf as JS[]).some((o) => !checkSchema(o, v, path).length);
    if (!ok) {
      // ветка с тем же type — её ошибки понятнее
      const t = (v as { type?: string })?.type;
      const br = (s.anyOf as JS[]).find((o) => (P0(o).type as { const?: string })?.const === t);
      out.push(...(br ? checkSchema(br, v, path) : [`${path}: matches no variant`]));
    }
    return out;
  }
  if ("const" in s && v !== s.const) out.push(`${path}: expected ${JSON.stringify(s.const)}`);
  if (s.enum && !(s.enum as unknown[]).includes(v)) out.push(`${path}: "${String(v)}" is not allowed`);
  if (s.type === "string" && typeof v !== "string") out.push(`${path}: expected string`);
  if ((s.type === "number" || s.type === "integer") && typeof v !== "number") out.push(`${path}: expected number`);
  if (s.type === "boolean" && typeof v !== "boolean") out.push(`${path}: expected boolean`);
  if (typeof v === "number") {
    if (s.minimum !== undefined && v < (s.minimum as number)) out.push(`${path}: < ${s.minimum}`);
    if (s.maximum !== undefined && v > (s.maximum as number)) out.push(`${path}: > ${s.maximum}`);
  }
  if (s.type === "array") {
    if (!Array.isArray(v)) return [...out, `${path}: expected array`];
    if (s.minItems !== undefined && v.length < (s.minItems as number)) out.push(`${path}: fewer than ${s.minItems} items`);
    v.forEach((x, i) => out.push(...checkSchema(s.items as JS, x, `${path}[${i}]`)));
  }
  if (s.type === "object") {
    if (!v || typeof v !== "object" || Array.isArray(v)) return [...out, `${path}: expected object`];
    const o = v as Record<string, unknown>;
    for (const r of (s.required as string[] | undefined) ?? []) if (!(r in o)) out.push(`${path}.${r}: required`);
    const props = (s.properties as Record<string, JS> | undefined) ?? {};
    for (const [k, x] of Object.entries(o)) {
      if (s.propertyNames) out.push(...checkSchema(s.propertyNames as JS, k, `${path}{${k}}`));
      if (props[k]) out.push(...checkSchema(props[k], x, `${path}.${k}`));
      else if (s.additionalProperties === false) out.push(`${path}.${k}: unknown field`);
      else if (s.additionalProperties && typeof s.additionalProperties === "object") out.push(...checkSchema(s.additionalProperties as JS, x, `${path}.${k}`));
    }
  }
  return out;
}
const P0 = (o: JS) => (o.properties as Record<string, unknown>) ?? {};
