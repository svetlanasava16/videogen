/**
 * Тонкий клиент Postiz Public API (https://docs.postiz.com/public-api).
 * Настройки в корневом .env: POSTIZ_API_URL=https://postiz.<домен>/api/public/v1, POSTIZ_API_KEY=<ключ>.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { ROOT } from "../util.js";

if (existsSync(join(ROOT, ".env"))) process.loadEnvFile(join(ROOT, ".env"));

export type Integration = { id: string; name: string; identifier: string; picture?: string; disabled: boolean; profile?: string };
export type Media = { id: string; path: string };
export type PostizPost = { id: string; state: string; releaseURL?: string; error?: string; publishDate?: string; integration?: { id: string } };
export type Series = { label: string; data: { total: number | string; date: string }[]; percentageChange?: number };

export function configured() {
  return Boolean(process.env.POSTIZ_API_URL && process.env.POSTIZ_API_KEY);
}

async function call<T>(method: string, path: string, body?: unknown, form?: FormData): Promise<T> {
  const base = process.env.POSTIZ_API_URL?.replace(/\/$/, "");
  const key = process.env.POSTIZ_API_KEY;
  if (!base || !key) throw new Error("POSTIZ_API_URL / POSTIZ_API_KEY are not set (root .env, see docs/POSTIZ.md)");
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: key, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Postiz ${method} ${path}: HTTP ${res.status} ${text.slice(0, 400)}`);
  return (text ? JSON.parse(text) : undefined) as T;
}

export const integrations = () => call<Integration[]>("GET", "/integrations");

/** Загрузить файл; если Postiz обрабатывает медиа асинхронно — дождаться готовности. */
export async function upload(file: string): Promise<Media> {
  const form = new FormData();
  form.append("file", new Blob([readFileSync(file)], { type: file.endsWith(".mp4") ? "video/mp4" : "application/octet-stream" }), basename(file));
  const m = await call<Media & { status?: string }>("POST", "/upload", undefined, form);
  for (let i = 0; m.status && m.status !== "ready" && i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await call<{ status: string }>("GET", `/media/${m.id}/status`);
    if (s.status === "ready") break;
    if (s.status === "error") throw new Error(`media ${m.id} processing failed`);
  }
  return { id: m.id, path: m.path };
}

export type CreatePost = {
  type: "schedule" | "draft" | "now";
  date: string;
  integrationId: string;
  content: string;
  media?: Media[];
  settings: Record<string, unknown>;
};

export async function createPost(p: CreatePost): Promise<string> {
  const res = await call<{ postId: string; integration: string }[]>("POST", "/posts", {
    type: p.type,
    date: p.date,
    shortLink: false,
    tags: [],
    posts: [{ integration: { id: p.integrationId }, value: [{ content: p.content, image: p.media ?? [] }], settings: p.settings }],
  });
  if (!res?.[0]?.postId) throw new Error(`Postiz returned no postId: ${JSON.stringify(res).slice(0, 200)}`);
  return res[0].postId;
}

export const listPosts = (startDate: string, endDate: string) =>
  call<{ posts: PostizPost[] }>("GET", `/posts?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`).then((r) => r.posts ?? []);

export const deletePost = (id: string) => call("DELETE", `/posts/${id}`);
export const postAnalytics = (postId: string, days = 30) => call<Series[]>("GET", `/analytics/post/${postId}?date=${days}`);
export const accountAnalytics = (integrationId: string, days = 7) => call<Series[]>("GET", `/analytics/${integrationId}?date=${days}`);
