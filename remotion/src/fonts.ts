/**
 * Шрифт всего проекта — Inter (SIL OFL, remotion/public/fonts, лицензия Inter-OFL.txt), вшит в проект и грузится явно:
 * ни субтитры, ни логотип, ни надписи в фонах не зависят от шрифтов, установленных на компьютере. Иначе перенос строк
 * и ширина надписей отличаются между машинами (golden на другой машине падал из-за переноса в субтитрах).
 * Переменный шрифт: любой вес 100–900, прямой и курсив. Подключается один раз в Root.tsx (импорт этого модуля).
 */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Имя семейства для fontFamily везде в проекте. Без системных запасных шрифтов. */
export const FONT = "Inter";

// только в браузере: в Node (компилятор эпизода, pnpm compile-episode) шрифт не нужен, а staticFile там не работает
if (typeof document !== "undefined") {
  for (const [file, style] of [["InterVariable.woff2", "normal"], ["InterVariable-Italic.woff2", "italic"]] as const) {
    loadFont({ family: FONT, url: staticFile(`fonts/${file}`), weight: "100 900", style, format: "woff2" });
  }
}

// Запасной вариант для текста без явного fontFamily: всё на странице рендера — Inter, а не системный шрифт браузера
if (typeof document !== "undefined" && !document.getElementById("anek-font-default")) {
  const st = document.createElement("style");
  st.id = "anek-font-default";
  st.textContent = `html, body, svg, text { font-family: ${FONT}; }`;
  document.head.appendChild(st);
}
