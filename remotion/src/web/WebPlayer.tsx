/**
 * Веб-плеер исполнения (ROADMAP §7): тот же кадр (perf/Frame.tsx), что в видео, но в обычном браузере —
 * без Remotion. Часы — requestAnimationFrame (во время звука — по AudioContext), звук — WebAudio по плану @jf/player.
 * Годится для браузера, Tauri и мобильного webview: нужны только React и файлы remotion/public.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { audioPlan, captionLines, musicGain, sample, type AudioCue, type Performance } from "@jf/player";
import { FrameView, frontLayer } from "../perf/Frame";

/** Откуда грузить звук и шрифты (сервер плеера отдаёт remotion/public по этому пути). */
export const PUBLIC = "/public/";

/** Звук через WebAudio: буферы файлов, запуск всех реплик и смеха с нужного кадра, музыка с громкостью по кадру. */
class Sound {
  ctx = new AudioContext();
  buffers = new Map<string, Promise<AudioBuffer | null>>();
  playing: { src: AudioBufferSourceNode; gain: GainNode }[] = [];
  music?: { src: AudioBufferSourceNode; gain: GainNode };
  load(file: string) {
    if (!this.buffers.has(file)) {
      this.buffers.set(file, fetch(PUBLIC + file).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status))).then((b) => this.ctx.decodeAudioData(b)).catch(() => null));
    }
    return this.buffers.get(file)!;
  }
  /** Запуск с кадра frame: каждый звук — со своего места (если уже идёт — с середины). */
  async start(perf: Performance, frame: number, cues: AudioCue[]) {
    this.stop();
    await this.ctx.resume();
    // все файлы — параллельно (обычно уже загружены заранее, preload)
    const bufs = await Promise.all(cues.map((c) => this.load(c.file)));
    const now = this.ctx.currentTime + 0.05;
    const fps = perf.fps;
    for (const [i, c] of cues.entries()) {
      const buf = bufs[i];
      if (!buf) continue;
      const rate = c.rate ?? 1;
      const endFrame = c.frames !== undefined ? c.from + c.frames : c.from + Math.ceil((buf.duration / rate) * fps);
      if (endFrame <= frame) continue;
      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.playbackRate.value = rate;
      const gain = this.ctx.createGain();
      gain.gain.value = c.gain;
      src.connect(gain).connect(this.ctx.destination);
      const delay = Math.max(0, (c.from - frame) / fps);
      const offset = Math.max(0, (frame - c.from) / fps) * rate;
      const at = now + delay;
      src.start(at, offset);
      if (c.frames !== undefined) src.stop(at + (endFrame - Math.max(frame, c.from)) / fps);
      if (c.fadeOut && c.frames !== undefined) {
        const fadeAt = at + Math.max(0, (endFrame - c.fadeOut - Math.max(frame, c.from)) / fps);
        gain.gain.setValueAtTime(c.gain, fadeAt);
        gain.gain.linearRampToValueAtTime(0, fadeAt + c.fadeOut / fps);
      }
      this.playing.push({ src, gain });
    }
    if (perf.audio.music) {
      const buf = await this.load(perf.audio.music);
      if (buf) {
        const src = this.ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const gain = this.ctx.createGain();
        gain.gain.value = 0;
        src.connect(gain).connect(this.ctx.destination);
        src.start(now, ((frame / fps) % buf.duration));
        this.music = { src, gain };
      }
    }
    return now;
  }
  /** Заранее загрузить и раскодировать все звуки эпизода (AudioContext может ещё спать — декодирование работает). */
  preload(perf: Performance, cues: AudioCue[]) {
    for (const c of cues) this.load(c.file);
    if (perf.audio.music) this.load(perf.audio.music);
  }
  setMusic(g: number) { if (this.music) this.music.gain.gain.value = g; }
  stop() {
    for (const p of this.playing) try { p.src.stop(); } catch { /* уже остановлен */ }
    this.playing = [];
    if (this.music) { try { this.music.src.stop(); } catch { /* уже остановлен */ } this.music = undefined; }
  }
}

export const WebPlayer = ({ perf }: { perf: Performance }) => {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [box, setBox] = useState({ w: window.innerWidth, h: window.innerHeight });
  const lines = useMemo(() => captionLines(perf), [perf]);
  const cues = useMemo(() => audioPlan(perf), [perf]);
  const sound = useRef<Sound | undefined>(undefined);
  const clock = useRef<{ t0: number; f0: number } | undefined>(undefined);
  const frameRef = useRef(0);
  frameRef.current = frame;

  useEffect(() => { const on = () => setBox({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, []);
  useEffect(() => {
    setFrame(0); setPlaying(false);
    sound.current?.stop();
    sound.current ??= new Sound();
    sound.current.preload(perf, cues);
  }, [perf, cues]);

  // часы: время звука (если играет) → кадр; без звука — performance.now()
  useEffect(() => {
    if (!playing) { sound.current?.stop(); return; }
    let raf = 0, alive = true;
    sound.current ??= new Sound();
    const s = sound.current;
    s.start(perf, frameRef.current, cues).then((at) => {
      if (!alive) return;
      clock.current = { t0: at, f0: frameRef.current };
      const tick = () => {
        const c = clock.current!;
        const f = Math.max(c.f0, Math.floor(c.f0 + (s.ctx.currentTime - c.t0) * perf.fps));
        if (f >= perf.frames - 1) { setFrame(perf.frames - 1); setPlaying(false); return; }
        s.setMusic(musicGain(perf, f, lines));
        setFrame(f);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => { alive = false; cancelAnimationFrame(raf); s.stop(); };
  }, [playing, perf, cues, lines]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.code === "ArrowRight") { setPlaying(false); setFrame((f) => Math.min(perf.frames - 1, f + (e.shiftKey ? 30 : 1))); }
      if (e.code === "ArrowLeft") { setPlaying(false); setFrame((f) => Math.max(0, f - (e.shiftKey ? 30 : 1))); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [perf]);

  const state = sample(perf, frame, { frontLayer, lines });
  const bar = 64;
  const scale = Math.min(box.w / perf.width, (box.h - bar) / perf.height);
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", background: "#111" }}>
      <div style={{ width: perf.width * scale, height: perf.height * scale, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: perf.width, height: perf.height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <FrameView perf={perf} state={state} />
        </div>
      </div>
      <div style={{ height: bar, width: Math.max(360, perf.width * scale), display: "flex", alignItems: "center", gap: 12, color: "#eee", font: "14px Inter, sans-serif" }}>
        <button onClick={() => setPlaying((p) => !p)} style={{ width: 72, height: 36, borderRadius: 8, border: "none", background: "#e0a030", color: "#2b1d14", fontWeight: 800, cursor: "pointer" }}>
          {playing ? "Pause" : "Play"}
        </button>
        <input type="range" min={0} max={perf.frames - 1} value={frame} style={{ flex: 1 }}
          onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }} />
        <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 92, textAlign: "right" }}>{(frame / perf.fps).toFixed(1)} / {perf.duration.toFixed(1)} s</span>
      </div>
    </div>
  );
};
