/**
 * Надписи в фонах (вывески, таблички, экраны) — на языке эпизода.
 *
 * Правило:
 *  - универсальные таблички, которые во всём мире дублируются по-английски (EXIT, WC, TAXI, BAR, HOTEL, POLICE, OPEN…),
 *    пишутся по-английски прямо в рисунке — без перевода;
 *  - надписи, привязанные к месту (ХЛЕБ / BREAD / BROT, МОЛОКО, название станции, меню), — ассеты места:
 *    content/signs/<location>.json ({ключ: {ru, en, de}}, общие — common.json), в рисунке:
 *    `const t = useSign(); <text>{t("bread")}</text>`. Новая надпись = строка в JSON + `pnpm registry`.
 * Язык задаёт LocaleProvider (Joke, Compilation, Cover, Locations); по умолчанию — ru.
 */
import { createContext, useContext } from "react";
import type { Locale } from "@jf/core";
import { signData } from "../registry.generated";

const SIGNS = signData as Record<string, Partial<Record<Locale, string>>>;

export const LocaleContext = createContext<Locale>("ru");
export const LocaleProvider = LocaleContext.Provider;

/** Перевод надписи: ключ → текст на языке эпизода (нет перевода — английский, нет ключа — сам ключ). */
export function useSign() {
  const locale = useContext(LocaleContext);
  return (key: string) => SIGNS[key]?.[locale] ?? SIGNS[key]?.en ?? key;
}
export const useLocale = () => useContext(LocaleContext);
