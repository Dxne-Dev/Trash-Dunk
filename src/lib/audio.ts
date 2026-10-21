/* Moteur SFX 100 % synthétisé (WebAudio) — aucun asset externe. */

export type SfxName =
  | "grab"
  | "stretch"
  | "release"
  | "swish"
  | "rim"
  | "drop"
  | "airball"
  | "buzzer"
  | "fire"
  | "freeze"
  | "crack"
  | "shatter"
  | "bin"
  | "ui"
  | "error";

class SfxEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 1.2);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    this.ensure();
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    // on ne crée l'AudioContext qu'après un geste utilisateur
    if (v && this.ctx) this.ensure();
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v ? 0.5 : 0.0001, this.ctx.currentTime, 0.02);
    }
  }

  private noise(
    dur: number,
    opts: { type?: BiquadFilterType; from?: number; to?: number; gain?: number; q?: number; at?: number }
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.noiseBuf || !this.master) return;
    const t = opts.at ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = opts.type ?? "bandpass";
    filt.frequency.setValueAtTime(opts.from ?? 900, t);
    if (opts.to) filt.frequency.exponentialRampToValueAtTime(Math.max(40, opts.to), t + dur);
    filt.Q.value = opts.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.3, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  private tone(
    freq: number,
    dur: number,
    opts: { type?: OscillatorType; gain?: number; to?: number; at?: number; detune?: number } = {}
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = opts.at ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + dur);
    if (opts.detune) osc.detune.value = opts.detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  play(name: SfxName) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (name) {
      case "grab":
        this.tone(180, 0.09, { type: "triangle", gain: 0.16, to: 120 });
        this.noise(0.07, { type: "highpass", from: 2200, gain: 0.06 });
        break;
      case "stretch":
        this.tone(90, 0.12, { type: "sawtooth", gain: 0.05, to: 70 });
        break;
      case "release":
        this.noise(0.34, { type: "bandpass", from: 500, to: 5200, gain: 0.3, q: 0.8 });
        this.tone(420, 0.18, { type: "triangle", gain: 0.1, to: 900 });
        break;
      case "swish":
        this.noise(0.3, { type: "highpass", from: 3400, to: 7000, gain: 0.26 });
        [880, 1320, 1760].forEach((f, i) =>
          this.tone(f, 0.5, { type: "sine", gain: 0.13, at: now + i * 0.045 })
        );
        break;
      case "rim":
        this.noise(0.09, { type: "bandpass", from: 2600, gain: 0.24, q: 2 });
        [330, 494, 712].forEach((f) =>
          this.tone(f, 0.26, { type: "square", gain: 0.075, to: f * 0.72 })
        );
        break;
      case "drop":
        this.noise(0.22, { type: "highpass", from: 2600, gain: 0.16 });
        this.tone(520, 0.3, { type: "sine", gain: 0.14, to: 780 });
        break;
      case "airball":
        this.tone(300, 0.55, { type: "sawtooth", gain: 0.11, to: 92 });
        this.noise(0.4, { type: "lowpass", from: 1400, to: 200, gain: 0.08 });
        break;
      case "buzzer":
        this.tone(104, 0.85, { type: "sawtooth", gain: 0.2 });
        this.tone(104, 0.85, { type: "sawtooth", gain: 0.16, detune: 22 });
        this.tone(156, 0.85, { type: "square", gain: 0.06 });
        break;
      case "fire":
        [523, 659, 784, 1046].forEach((f, i) =>
          this.tone(f, 0.34, { type: "triangle", gain: 0.15, at: now + i * 0.07 })
        );
        this.noise(0.9, { type: "bandpass", from: 400, to: 2600, gain: 0.13, q: 0.6 });
        break;
      case "freeze":
        this.noise(0.65, { type: "bandpass", from: 900, to: 6200, gain: 0.22, q: 1.8 });
        [1046, 1568, 2093].forEach((f, i) =>
          this.tone(f, 0.55, { type: "sine", gain: 0.11, at: now + i * 0.06 })
        );
        break;
      case "crack":
        [0, 0.17, 0.34].forEach((off, i) => {
          this.noise(0.085, {
            type: "highpass",
            from: 2400 - i * 350,
            to: 900,
            gain: 0.28,
            at: now + off,
          });
          this.tone(920 - i * 160, 0.09, {
            type: "square",
            gain: 0.09,
            to: 240,
            at: now + off,
          });
        });
        break;
      case "shatter":
        this.tone(110, 0.42, { type: "sine", gain: 0.28, to: 42 });
        this.noise(0.42, { type: "highpass", from: 2600, to: 7800, gain: 0.32 });
        [1568, 1975, 2349, 2637, 3136].forEach((f, i) =>
          this.tone(f, 0.32, { type: "triangle", gain: 0.1, to: f * 0.86, at: now + i * 0.035 })
        );
        break;
      case "bin":
        this.noise(0.14, { type: "lowpass", from: 900, to: 180, gain: 0.2 });
        this.tone(120, 0.2, { type: "sine", gain: 0.2, to: 58 });
        break;
      case "ui":
        this.tone(660, 0.05, { type: "square", gain: 0.05 });
        break;
      case "error":
        this.tone(220, 0.16, { type: "square", gain: 0.1, to: 150 });
        break;
    }
  }
}

export const sfx = new SfxEngine();
