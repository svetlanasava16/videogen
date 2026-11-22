import type { Locale } from "@jf/core";
import { locations } from "../registry";
import { Background } from "../components/Background";
import { LocaleProvider } from "../i18n/signs";

/** Один слой фона (back/front) места и сублокации на языке надписей; прозрачный вокруг рисунка — для PNG (pnpm export-art). */
export const BackdropLayer = ({ location, place, layer = "back", locale = "ru" }: { location: string; place?: string; layer?: "back" | "front"; locale?: Locale }) => (
  <LocaleProvider value={locale}>
    <Background location={locations[location]} place={place} layer={layer} />
  </LocaleProvider>
);
