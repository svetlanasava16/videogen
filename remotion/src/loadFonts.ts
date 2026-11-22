/**
 * Загрузка шрифта Inter в Remotion (remotion/public/fonts): явная, до любой композиции (импорт в Root.tsx).
 * Веб-плеер грузит тот же файл через CSS @font-face (web/index.html).
 */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONT } from "./fonts";


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
