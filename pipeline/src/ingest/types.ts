import type { Joke } from "@jf/core";

/** Сырой анекдот из источника до нормализации популярности. */
export type RawJoke = Omit<Joke, "popularity" | "source" | "tags"> & { score: number; tags?: string[] };

export type Source = {
  id: string;
  lang: Joke["lang"];
  license: string;
  fetch: () => Promise<RawJoke[]>;
};
