import { asyncBufferFromFile, parquetMetadataAsync, parquetReadObjects, parquetSchema } from "hyparquet";
import { join } from "node:path";
import { RAW, download } from "../util.js";

export type HfFile = { repo: string; url: string };

/** Файл, лежащий в репозитории датасета. */
export const repoFile = (repo: string, path: string): HfFile => ({
  repo,
  url: `https://huggingface.co/datasets/${repo}/resolve/main/${path}`,
});

/** Автоконвертированный parquet (у датасетов с включённым viewer). */
export const autoParquet = (repo: string, split = "train", shard = 0): HfFile => ({
  repo,
  url: `https://huggingface.co/api/datasets/${repo}/parquet/default/${split}/${shard}.parquet`,
});

async function local(f: HfFile) {
  const name = f.url.split("/").slice(-3).join("__");
  return download(f.url, join(RAW, "hf", f.repo.replace("/", "__"), name));
}

export async function readHf(f: HfFile, columns?: string[]) {
  const buf = await asyncBufferFromFile(await local(f));
  return (await parquetReadObjects({ file: buf, columns })) as Record<string, unknown>[];
}

export async function hfColumns(f: HfFile) {
  const buf = await asyncBufferFromFile(await local(f));
  const meta = await parquetMetadataAsync(buf);
  return { rows: Number(meta.num_rows), columns: parquetSchema(meta).children.map((c) => c.element.name) };
}
