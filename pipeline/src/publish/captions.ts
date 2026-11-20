/**
 * Подписи и настройки площадок. Маркировка — content/disclosure.json, всегда в конце подписи.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NARRATOR, orderedLines, type Episode, type Locale } from "@jf/core";
import { ROOT } from "../util.js";

export type Disclosure = {
  version: number;
  brand: string;
  card: Record<Locale, string>;
  video: Record<Locale, string>;
  text: Record<Locale, string>;
  translated: Record<Locale, string>;
  rights: Record<Locale, string>;
  copyright: string;
  instagram: Record<Locale, string[]>;
  hashtags: Record<Locale, string[]>;
};
export const disclosure = (): Disclosure => JSON.parse(readFileSync(join(ROOT, "content", "disclosure.json"), "utf8"));

export type Platform = "youtube" | "tiktok" | "instagram" | "threads" | "x" | "vk";
export type Kind = "video" | "story" | "text";

/** Лимиты длины подписи. */
export const LIMITS: Record<Platform, number> = { youtube: 5000, tiktok: 2200, instagram: 2200, threads: 500, x: 280, vk: 4000 };

/** Анекдот как связный текст: реплики персонажей — через тире, рассказчик — обычным абзацем. */
export function jokeText(ep: Episode) {
  return orderedLines(ep).map((l) => (l.character === NARRATOR ? l.text : `— ${l.text}`)).join("\n");
}

/** Подпись поста. originalText — исходный текст анекдота (для текстовых постов на языке оригинала). */
export function caption(ep: Episode, platform: Platform, kind: Kind, opts: { translated: boolean; originalText?: string }) {
  const d = disclosure();
  const tags = d.hashtags[ep.locale].join(" ");
  const note = [kind === "text" ? d.text[ep.locale] : d.video[ep.locale], opts.translated ? d.translated[ep.locale] : ""].filter(Boolean).join(" ");
  if (kind === "text") {
    const body = opts.originalText && !opts.translated ? opts.originalText.trim() : jokeText(ep);
    return `${body}\n\n${note}\n${d.rights[ep.locale]}`;
  }
  return `${ep.title}\n\n${tags}\n\n${note}\n\n${d.rights[ep.locale]}`;
}

/** provider settings для Postiz (поля сверены с DTO Postiz). Флаги ИИ включены везде, где площадка их принимает. */
export function settings(platform: Platform, kind: Kind, ep: Episode, opts: { identifier: string; privateMode: boolean }) {
  const tags = disclosure().hashtags[ep.locale].map((t) => t.replace(/^#/, ""));
  switch (platform) {
    case "youtube":
      return {
        __type: "youtube", title: ep.title.slice(0, 100), type: opts.privateMode ? "private" : "public",
        selfDeclaredMadeForKids: "no", made_with_ai: true, tags: tags.map((t) => ({ value: t, label: t })),
      };
    case "tiktok":
      return {
        __type: "tiktok", title: ep.title.slice(0, 90), privacy_level: opts.privateMode ? "SELF_ONLY" : "PUBLIC_TO_EVERYONE",
        duet: false, stitch: false, comment: true, autoAddMusic: "no", brand_content_toggle: false, brand_organic_toggle: false,
        video_made_with_ai: true, content_posting_method: "DIRECT_POST",
      };
    case "instagram":
      // Reel = post с одним видео; is_ai_generated Postiz пока не передаёт — маркировка в подписи
      return { __type: opts.identifier, post_type: kind === "story" ? "story" : "post", is_trial_reel: false, collaborators: [] };
    case "threads":
      return { __type: "threads" };
    case "x":
      return { __type: "x", who_can_reply_post: "everyone", made_with_ai: kind !== "text", paid_partnership: false, community: "" };
    case "vk":
      return { __type: "vk" };
  }
}

/** Время публикации по языку аудитории: окно (часы, местное время) и смещение от UTC. */
export const AUDIENCE: Record<Locale, { from: number; to: number; utcOffset: number }> = {
  ru: { from: 9, to: 22, utcOffset: 3 }, // Москва
  en: { from: 8, to: 22, utcOffset: -5 }, // США, восток
  de: { from: 8, to: 22, utcOffset: 1 }, // Берлин
};
