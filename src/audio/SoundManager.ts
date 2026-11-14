/**
 * SoundManager — toàn bộ âm thanh được tổng hợp bằng Web Audio API (không có
 * file mp3 nào) và giọng đọc tên màu song ngữ bằng Web Speech API.
 */
export class SoundManager {
  enabled = true;
  voiceEnabled = true;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private scribbleGain: GainNode | null = null;
  private scribbleFilter: BiquadFilterNode | null = null;
  private scribbleSrc: AudioBufferSourceNode | null = null;
  private musicTimer: number | null = null;
  private musicGain: GainNode | null = null;

  /** Phải gọi trong một sự kiện chạm/bấm để trình duyệt cho phép phát tiếng. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, len);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private tone(freq: number, t0: number, dur: number, vol: number, type: OscillatorType = 'sine', glideTo?: number, out?: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(out ?? this.master!);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  /** Tiếng bóng nước "pop" khi đổ màu. */
  pop() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const base = 260 + Math.random() * 160;
    this.tone(base, t, 0.14, 0.5, 'sine', base * 3.2);
    this.tone(base * 2.5, t + 0.05, 0.12, 0.16, 'triangle', base * 4.5);
  }

  /** Tiếng "bụp" ngược khi tẩy. */
  unpop() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(700, t, 0.16, 0.35, 'sine', 180);
  }

  click() {
    if (!this.enabled || !this.ctx) return;
    this.tone(880, this.ctx.currentTime, 0.06, 0.18, 'triangle', 1200);
  }

  sparkle() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const f = 1400 + Math.random() * 1400;
    this.tone(f, t, 0.25, 0.12, 'sine');
    this.tone(f * 1.5, t + 0.04, 0.22, 0.08, 'sine');
  }

  /** Tiếng sột soạt của bút: nhiễu trắng qua bộ lọc thông dải, âm lượng theo tốc độ tay. */
  scribbleStart(crayon: boolean) {
    if (!this.enabled || !this.ctx || !this.noise || this.scribbleSrc) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = crayon ? 2400 : 3800;
    f.Q.value = crayon ? 0.7 : 1.4;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(f).connect(g).connect(this.master!);
    src.start();
    this.scribbleSrc = src;
    this.scribbleGain = g;
    this.scribbleFilter = f;
  }

  scribbleMove(speed: number, crayon: boolean) {
    if (!this.scribbleGain || !this.ctx) return;
    const v = Math.min(1, speed / 40) * (crayon ? 0.22 : 0.07);
    const t = this.ctx.currentTime;
    this.scribbleGain.gain.cancelScheduledValues(t);
    this.scribbleGain.gain.linearRampToValueAtTime(v, t + 0.03);
    this.scribbleGain.gain.linearRampToValueAtTime(0, t + 0.16);
    this.scribbleFilter!.frequency.setTargetAtTime((crayon ? 2000 : 3400) + speed * 30, t, 0.05);
  }

  scribbleStop() {
    if (!this.scribbleSrc || !this.ctx) return;
    const src = this.scribbleSrc;
    this.scribbleGain!.gain.cancelScheduledValues(this.ctx.currentTime);
    this.scribbleGain!.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    setTimeout(() => {
      try {
        src.stop();
      } catch {}
    }, 150);
    this.scribbleSrc = null;
    this.scribbleGain = null;
  }

  /** Chuông phép thuật khi hoàn thành bức tranh. */
  chime() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
    notes.forEach((f, i) => {
      const at = t + i * 0.09;
      this.tone(f, at, 1.1, 0.22, 'sine');
      this.tone(f * 2.01, at, 0.7, 0.07, 'sine');
      this.tone(f * 3.0, at, 0.35, 0.03, 'sine');
    });
  }

  /** Nhạc nền vui tươi cho chế độ Thức Giấc (hộp nhạc đơn giản lặp lại). */
  musicStart() {
    if (!this.enabled || !this.ctx || this.musicTimer !== null) return;
    const ctx = this.ctx;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.55;
    this.musicGain.connect(this.master!);
    const C = 261.63;
    const st = (n: number) => C * Math.pow(2, n / 12);
    // giai điệu ngũ cung vui nhộn, 16 phách
    const melody = [12, 16, 19, 16, 21, 19, 16, 12, 14, 16, 19, 24, 21, 19, 16, 14];
    const bass = [0, 0, 7, 7, 9, 9, 7, 7, 5, 5, 7, 7, 0, 0, 7, 7];
    const beat = 0.24;
    let step = 0;
    let next = ctx.currentTime + 0.1;
    const tick = () => {
      while (next < ctx.currentTime + 0.3) {
        const i = step % 16;
        this.tone(st(melody[i]), next, 0.42, 0.16, 'triangle', undefined, this.musicGain!);
        this.tone(st(melody[i] + 12), next, 0.2, 0.04, 'sine', undefined, this.musicGain!);
        if (i % 2 === 0) this.tone(st(bass[i] - 12), next, 0.4, 0.2, 'sine', undefined, this.musicGain!);
        if (i % 4 === 2) this.tone(st(bass[i] + 4), next, 0.3, 0.06, 'sine', undefined, this.musicGain!);
        next += beat;
        step++;
      }
    };
    tick();
    this.musicTimer = window.setInterval(tick, 100);
  }

  musicStop() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGain && this.ctx) {
      const g = this.musicGain;
      g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => g.disconnect(), 600);
      this.musicGain = null;
    }
  }

  /** Đọc tên màu song ngữ: "Màu đỏ" (vi-VN) rồi "Red" (en-US). */
  speakColor(vi: string, en: string) {
    if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const voices = synth.getVoices();
    const say = (text: string, lang: string, rate: number) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      const v = voices.find((x) => x.lang.replace('_', '-').toLowerCase().startsWith(lang.slice(0, 2)));
      if (v) u.voice = v;
      u.rate = rate;
      u.pitch = 1.25;
      synth.speak(u);
    };
    say(vi, 'vi-VN', 0.95);
    say(en, 'en-US', 0.9);
  }

  /** Lời gợi ý ngắn bằng tiếng Việt (dùng trong Xưởng Phép Thuật). */
  say(text: string) {
    if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    const v = synth.getVoices().find((x) => x.lang.toLowerCase().startsWith('vi'));
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 1.2;
    synth.speak(u);
  }

  stopSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
}

export const sound = new SoundManager();
