export type SoundEffect = 'fire' | 'alienFire' | 'hit' | 'explosion' | 'damage' | 'launch' | 'wave' | 'clear' | 'gameOver' | 'victory';
type Voice = { from: number; to: number; gain: number; delay?: number; duration: number; shape?: 'sine' | 'triangle' };
type Noise = { gain: number; cutoff: number; duration: number; delay?: number; attack?: number };
type SoundDesign = { duration: number; voices: Voice[]; noise?: Noise[] };

// Short, layered effects: softer energy weapons, resonant armour, and low explosions.
const DESIGNS: Record<SoundEffect, SoundDesign> = {
  fire: { duration: .18, voices: [
    { from: 1100, to: 240, gain: .28, duration: .13 },
    { from: 220, to: 85, gain: .13, duration: .07, shape: 'triangle' },
  ], noise: [{ gain: .1, cutoff: 2100, duration: .035 }] },
  alienFire: { duration: .24, voices: [
    { from: 460, to: 150, gain: .15, duration: .2, shape: 'triangle' },
    { from: 690, to: 225, gain: .06, duration: .18 },
  ] },
  hit: { duration: .23, voices: [
    { from: 790, to: 740, gain: .15, duration: .19 },
    { from: 1230, to: 1190, gain: .1, duration: .12 },
    { from: 210, to: 95, gain: .14, duration: .07 },
  ], noise: [{ gain: .23, cutoff: 3000, duration: .055 }] },
  explosion: { duration: .7, voices: [
    { from: 120, to: 32, gain: .3, duration: .45 },
    { from: 210, to: 48, gain: .12, duration: .2, shape: 'triangle' },
  ], noise: [{ gain: .45, cutoff: 1600, duration: .55 }, { gain: .14, cutoff: 4200, duration: .06 }] },
  damage: { duration: .85, voices: [
    { from: 270, to: 65, gain: .23, duration: .5, shape: 'triangle' },
    { from: 840, to: 130, gain: .15, duration: .35 },
    { from: 90, to: 35, gain: .24, duration: .65 },
  ], noise: [{ gain: .35, cutoff: 2200, duration: .4 }] },
  launch: { duration: .8, voices: [
    { from: 261.63, to: 261.63, gain: .16, duration: .32 },
    { from: 392, to: 392, gain: .16, delay: .13, duration: .32 },
    { from: 523.25, to: 523.25, gain: .17, delay: .26, duration: .43 },
  ], noise: [{ gain: .12, cutoff: 900, duration: .5, attack: .15 }] },
  wave: { duration: 1.05, voices: [
    { from: 80, to: 260, gain: .18, duration: .75 },
    { from: 160, to: 520, gain: .07, duration: .75 },
    { from: 659.25, to: 659.25, gain: .12, delay: .6, duration: .24 },
    { from: 783.99, to: 783.99, gain: .12, delay: .75, duration: .24 },
  ], noise: [{ gain: .2, cutoff: 1400, duration: .85, attack: .32 }] },
  clear: { duration: .6, voices: [
    { from: 392, to: 392, gain: .11, duration: .25 },
    { from: 493.88, to: 493.88, gain: .11, delay: .1, duration: .25 },
    { from: 587.33, to: 587.33, gain: .12, delay: .2, duration: .32 },
  ] },
  gameOver: { duration: 2.6, voices: [
    // A final impact, descending minor melody, and a soft unresolved chord.
    { from: 110, to: 30, gain: .23, duration: .45 },
    ...[659.25, 587.33, 523.25, 493.88, 440].map((frequency, index) => ({
      from: frequency, to: frequency, gain: .15, delay: .2 + index * .2, duration: .38,
    })),
    ...[110, 261.63, 329.63].map(frequency => ({
      from: frequency, to: frequency, gain: .09, delay: 1.25, duration: 1.1,
    })),
  ], noise: [{ gain: .27, cutoff: 1100, duration: .35 }] },
  victory: { duration: 2.6, voices: [
    ...[523.25, 659.25, 783.99, 1046.5].map((frequency, index) => ({
      from: frequency, to: frequency, gain: .17, delay: index * .18, duration: .4,
    })),
    ...[523.25, 659.25, 783.99, 1046.5].map(frequency => ({
      from: frequency, to: frequency, gain: .095, delay: 1.05, duration: 1.3,
    })),
    { from: 130.81, to: 130.81, gain: .15, delay: 1.05, duration: 1.3 },
  ] },
};

export const EFFECTS = Object.keys(DESIGNS) as SoundEffect[];

export function synthesise(effect: SoundEffect, sampleRate: number, random = Math.random): Float32Array {
  const design = DESIGNS[effect];
  const samples = new Float32Array(Math.ceil(design.duration * sampleRate));
  const envelope = (time: number, duration: number, attack = .004) =>
    Math.min(1, time / attack) * Math.exp(-5 * time / duration)
    * Math.min(1, Math.max(0, (duration - time) / .015));
  for (const voice of design.voices) {
    let phase = 0;
    const delay = Math.round((voice.delay ?? 0) * sampleRate);
    for (let i = 0; i < voice.duration * sampleRate && i + delay < samples.length; i++) {
      const time = i / sampleRate;
      const frequency = voice.from * (voice.to / voice.from) ** (time / voice.duration);
      phase += 2 * Math.PI * frequency / sampleRate;
      const signal = voice.shape === 'triangle' ? 2 / Math.PI * Math.asin(Math.sin(phase)) : Math.sin(phase);
      samples[i + delay] += signal * voice.gain * envelope(time, voice.duration, effect === 'wave' ? .12 : .004);
    }
  }
  for (const noise of design.noise ?? []) {
    let filtered = 0;
    const blend = 1 - Math.exp(-2 * Math.PI * noise.cutoff / sampleRate);
    const delay = Math.round((noise.delay ?? 0) * sampleRate);
    for (let i = 0; i < noise.duration * sampleRate && i + delay < samples.length; i++) {
      filtered += blend * ((random() * 2 - 1) - filtered);
      samples[i + delay] += filtered * noise.gain * envelope(i / sampleRate, noise.duration, noise.attack);
    }
  }
  // Soft saturation prevents harsh clipping when effects overlap.
  for (let i = 0; i < samples.length; i++) samples[i] = Math.tanh(samples[i]);
  return samples;
}

export class GameAudio {
  muted = true;
  private context?: AudioContext;
  private master?: GainNode;
  private buffers = new Map<SoundEffect, AudioBuffer>();
  private voices = new Set<AudioBufferSourceNode>();

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) { this.stop(); return; }
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = .5;
        const compressor = this.context.createDynamicsCompressor();
        compressor.threshold.value = -16;
        compressor.knee.value = 18;
        compressor.ratio.value = 4;
        this.master.connect(compressor);
        compressor.connect(this.context.destination);
      }
      void this.context.resume().catch(() => { this.muted = true; this.stop(); });
    } catch { this.muted = true; }
  }

  play(effect: SoundEffect) {
    if (this.muted || !this.context || !this.master || this.context.state !== 'running') return;
    if (this.voices.size >= 20) return;
    let buffer = this.buffers.get(effect);
    if (!buffer) {
      const samples = synthesise(effect, this.context.sampleRate);
      buffer = this.context.createBuffer(1, samples.length, this.context.sampleRate);
      buffer.getChannelData(0).set(samples);
      this.buffers.set(effect, buffer);
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    if (effect === 'fire' || effect === 'hit' || effect === 'explosion') source.playbackRate.value = .97 + Math.random() * .06;
    source.connect(this.master);
    this.voices.add(source);
    source.onended = () => { source.disconnect(); this.voices.delete(source); };
    source.start();
  }

  stop() {
    for (const voice of this.voices) { voice.stop(); voice.disconnect(); }
    this.voices.clear();
  }
}
