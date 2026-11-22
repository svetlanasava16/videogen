/**
 * Маленький вычислитель выражений для гардероба: числа, переменные, + - * / %, унарный минус, скобки,
 * функции min, max, round, floor, abs. Порядок вычислений как в JS (те же приоритеты, слева направо),
 * поэтому результат совпадает с кодом бит в бит: `top + h * 0.42` даёт то же число, что и в TSX.
 * Без eval: разбор рекурсивным спуском, неизвестная переменная или функция — ошибка с текстом выражения.
 */
export type Vars = Record<string, number>;

const FUNCS: Record<string, (...a: number[]) => number> = {
  min: Math.min, max: Math.max, round: Math.round, floor: Math.floor, abs: Math.abs,
};

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " ") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.eE]/.test(src[j])) j++;
      out.push({ t: "num", v: Number(src.slice(i, j)) });
      i = j;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      out.push({ t: "id", v: src.slice(i, j) });
      i = j;
    } else if ("+-*/%(),".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
    } else throw new Error(`wardrobe expr: unexpected "${c}" in "${src}"`);
  }
  return out;
}

const cache = new Map<string, (v: Vars) => number>();

/** Компилирует выражение в функцию от переменных (кэшируется). */
export function compile(src: string): (v: Vars) => number {
  const hit = cache.get(src);
  if (hit) return hit;
  const toks = lex(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.t === "op" && peek().v === v;
  const expect = (v: string) => { if (!isOp(v)) throw new Error(`wardrobe expr: expected "${v}" in "${src}"`); p++; };
  type F = (v: Vars) => number;
  const primary = (): F => {
    const tk = toks[p++];
    if (!tk) throw new Error(`wardrobe expr: unexpected end in "${src}"`);
    if (tk.t === "num") { const n = tk.v; return () => n; }
    if (tk.t === "op" && tk.v === "(") { const e = add(); expect(")"); return e; }
    if (tk.t === "op" && tk.v === "-") { const e = primary(); return (v) => -e(v); }
    if (tk.t === "id") {
      const name = tk.v;
      if (isOp("(")) {
        p++;
        const args: F[] = [];
        if (!isOp(")")) { args.push(add()); while (isOp(",")) { p++; args.push(add()); } }
        expect(")");
        const fn = FUNCS[name];
        if (!fn) throw new Error(`wardrobe expr: unknown function ${name} in "${src}"`);
        return (v) => fn(...args.map((a) => a(v)));
      }
      return (v) => {
        const x = v[name];
        if (x === undefined) throw new Error(`wardrobe expr: unknown variable ${name} in "${src}"`);
        return x;
      };
    }
    throw new Error(`wardrobe expr: unexpected "${tk.v}" in "${src}"`);
  };
  const mul = (): F => {
    let l = primary();
    while (isOp("*") || isOp("/") || isOp("%")) {
      const op = toks[p++].v, a = l, b = primary();
      l = op === "*" ? (v) => a(v) * b(v) : op === "/" ? (v) => a(v) / b(v) : (v) => a(v) % b(v);
    }
    return l;
  };
  const add = (): F => {
    let l = mul();
    while (isOp("+") || isOp("-")) {
      const op = toks[p++].v, a = l, b = mul();
      l = op === "+" ? (v) => a(v) + b(v) : (v) => a(v) - b(v);
    }
    return l;
  };
  const f = add();
  if (p !== toks.length) throw new Error(`wardrobe expr: trailing tokens in "${src}"`);
  cache.set(src, f);
  return f;
}

/** Число из данных: число как есть, строка — выражение. */
export const num = (x: unknown, v: Vars): number => (typeof x === "number" ? x : compile(String(x))(v));

/** Строка с подстановками {выражение} (путь d, transform): каждое {…} заменяется числом (String(n), как в шаблонах JS). */
export const tmpl = (s: string, v: Vars): string => s.replace(/\{([^}]+)\}/g, (_, e: string) => String(compile(e)(v)));
