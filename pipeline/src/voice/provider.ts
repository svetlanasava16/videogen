/**
 * Озвучка (заготовка, пока не реализована).
 * Провайдер синтезирует реплику и возвращает файл + тайминги слов → Line.audio (packages/core):
 * тогда субтитры-караоке и длительность берутся из реального звука, а не из оценки estimateWords.
 *   - elevenlabs: API with-timestamps (голоса по bible.voiceBrief куклы);
 *   - comfy: TTS-workflow в ComfyUI на GPU-сервере пользователя (несколько GPU, очередь),
 *     тайминги — из выравнивания (forced alignment) после синтеза.
 */
import type { Locale, WordTiming } from "@jf/core";

export type VoiceRequest = {
  episodeId: string;
  lineId: string;
  locale: Locale;
  /** id куклы или "narrator" — по нему выбирается голос. */
  character: string;
  text: string;
  emotion: string;
};

export type VoiceResult = {
  /** Путь относительно remotion/public (например audio/voice/<episodeId>/<lineId>.mp3). */
  file: string;
  durationSec: number;
  words: WordTiming[];
};

export interface VoiceProvider {
  readonly id: "elevenlabs" | "comfy";
  synthesize(req: VoiceRequest): Promise<VoiceResult>;
}
