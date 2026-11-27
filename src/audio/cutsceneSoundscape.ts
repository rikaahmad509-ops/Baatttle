import { sounds } from './soundManager';

export type CutsceneSoundTheme =
  | 'act0_coastal'
  | 'act1_summit'
  | 'act2_cathedral'
  | 'act3_eclipse'
  | 'act4_omega'
  | 'chrono'
  | 'tarot'
  | 'solar'
  | 'void'
  | 'abyss'
  | 'genesis'
  | 'duality'
  | 'sage'
  | 'puppet'
  | 'lumina'
  | 'axiom';

export type CutsceneActionState =
  | 'ambient'
  | 'stride'
  | 'dash'
  | 'duel'
  | 'clash'
  | 'timestop'
  | 'rewind'
  | 'cyclone'
  | 'convergence';

interface ThemePalette {
  rootHz: number;
  fifthHz: number;
  shimmerHz: number;
  scaleHz: number[];
  baseBpm: number;
  padWave: OscillatorType;
  arpWave: OscillatorType;
}

const THEME_PALETTES: Record<CutsceneSoundTheme, ThemePalette> = {
  act0_coastal: {
    rootHz: 73.42, // D2
    fifthHz: 110.0, // A2
    shimmerHz: 293.66, // D4
    scaleHz: [146.83, 174.61, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0],
    baseBpm: 88,
    padWave: 'triangle',
    arpWave: 'sine'
  },
  act1_summit: {
    rootHz: 98.0, // G2
    fifthHz: 146.83, // D3
    shimmerHz: 392.0, // G4
    scaleHz: [196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 587.33],
    baseBpm: 102,
    padWave: 'sawtooth',
    arpWave: 'triangle'
  },
  act2_cathedral: {
    rootHz: 61.74, // B1
    fifthHz: 92.5, // F#2
    shimmerHz: 369.99, // F#4
    scaleHz: [123.47, 146.83, 185.0, 220.0, 246.94, 293.66, 369.99, 493.88],
    baseBpm: 96,
    padWave: 'triangle',
    arpWave: 'sine'
  },
  act3_eclipse: {
    rootHz: 55.0, // A1
    fifthHz: 82.41, // E2
    shimmerHz: 329.63, // E4
    // Japanese Hirajoshi-inspired minor scale
    scaleHz: [110.0, 116.54, 164.81, 174.61, 220.0, 233.08, 329.63, 440.0],
    baseBpm: 108,
    padWave: 'sawtooth',
    arpWave: 'triangle'
  },
  act4_omega: {
    rootHz: 65.41, // C2
    fifthHz: 98.0, // G2
    shimmerHz: 392.0, // G4
    // Cosmic C Lydian scale
    scaleHz: [130.81, 164.81, 196.0, 246.94, 293.66, 369.99, 392.0, 523.25],
    baseBpm: 98,
    padWave: 'triangle',
    arpWave: 'sine'
  },
  chrono: {
    rootHz: 65.41,
    fifthHz: 98.0,
    shimmerHz: 392.0,
    scaleHz: [130.81, 155.56, 196.0, 233.08, 261.63, 311.13, 392.0, 523.25],
    baseBpm: 112,
    padWave: 'triangle',
    arpWave: 'sine'
  },
  tarot: {
    rootHz: 77.78, // Eb2
    fifthHz: 116.54,
    shimmerHz: 311.13,
    scaleHz: [155.56, 174.61, 196.0, 233.08, 293.66, 311.13, 392.0, 466.16],
    baseBpm: 106,
    padWave: 'triangle',
    arpWave: 'sine'
  },
  solar: {
    rootHz: 87.31, // F2
    fifthHz: 130.81,
    shimmerHz: 349.23,
    scaleHz: [174.61, 220.0, 261.63, 329.63, 349.23, 440.0, 523.25, 659.25],
    baseBpm: 118,
    padWave: 'sawtooth',
    arpWave: 'triangle'
  },
  void: {
    rootHz: 51.91, // G#1
    fifthHz: 77.78,
    shimmerHz: 311.13,
    scaleHz: [103.83, 123.47, 155.56, 185.0, 207.65, 246.94, 311.13, 415.3],
    baseBpm: 108,
    padWave: 'sawtooth',
    arpWave: 'sine'
  },
  abyss: {
    rootHz: 58.27, // Bb1
    fifthHz: 87.31,
    shimmerHz: 293.66,
    scaleHz: [116.54, 123.47, 174.61, 185.0, 233.08, 277.18, 349.23, 466.16],
    baseBpm: 104,
    padWave: 'sawtooth',
    arpWave: 'triangle'
  },
  genesis: {
    rootHz: 73.42,
    fifthHz: 110.0,
    shimmerHz: 329.63,
    scaleHz: [146.83, 185.0, 220.0, 277.18, 293.66, 369.99, 440.0, 587.33],
    baseBpm: 100,
    padWave: 'triangle',
    arpWave: 'sine'
  },
  duality: {
    rootHz: 69.3, // C#2
    fifthHz: 103.83,
    shimmerHz: 329.63,
    scaleHz: [138.59, 164.81, 207.65, 246.94, 277.18, 329.63, 415.3, 554.37],
    baseBpm: 114,
    padWave: 'sawtooth',
    arpWave: 'triangle'
  },
  sage: {
    rootHz: 98.0,
    fifthHz: 146.83,
    shimmerHz: 392.0,
    scaleHz: [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 587.33],
    baseBpm: 122,
    padWave: 'sawtooth',
    arpWave: 'triangle'
  },
  puppet: {
    rootHz: 65.41,
    fifthHz: 98.0,
    shimmerHz: 311.13,
    scaleHz: [130.81, 155.56, 196.0, 246.94, 261.63, 311.13, 392.0, 493.88],
    baseBpm: 108,
    padWave: 'triangle',
    arpWave: 'sine'
  },
  lumina: {
    rootHz: 82.41, // E2
    fifthHz: 123.47,
    shimmerHz: 329.63,
    scaleHz: [164.81, 207.65, 246.94, 311.13, 329.63, 415.3, 493.88, 659.25],
    baseBpm: 112,
    padWave: 'triangle',
    arpWave: 'sine'
  },
  axiom: {
    rootHz: 73.42,
    fifthHz: 110.0,
    shimmerHz: 369.99,
    scaleHz: [146.83, 174.61, 220.0, 277.18, 293.66, 369.99, 440.0, 554.37],
    baseBpm: 116,
    padWave: 'sawtooth',
    arpWave: 'sine'
  }
};

export interface CutsceneSoundUpdate {
  theme: CutsceneSoundTheme;
  intensity: number; // 0..1
  action: CutsceneActionState;
  paused?: boolean;
}

/**
 * Procedural Web Audio Dynamic Soundscape Engine for 3D Cutscenes.
 * Modulates harmonic drone, filter resonance, pulse tempo, arpeggio density,
 * and action transition swells in real time with zero external audio assets.
 */
class CutsceneSoundscapeEngine {
  private active = false;
  private ctx: AudioContext | null = null;
  private bgmBus: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;
  private shimmerGain: GainNode | null = null;
  private rootOsc: OscillatorNode | null = null;
  private fifthOsc: OscillatorNode | null = null;
  private shimmerOsc: OscillatorNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private curTheme: CutsceneSoundTheme = 'act0_coastal';
  private curAction: CutsceneActionState = 'ambient';
  private curIntensity = 0.25;
  private nextStepTime = 0;
  private stepIdx = 0;

  public start(initialTheme: CutsceneSoundTheme = 'act0_coastal'): void {
    const res = sounds.getAudioResources();
    if (!res) return;
    if (this.active) {
      this.curTheme = initialTheme;
      return;
    }

    const { ctx, masterGain } = res;
    this.ctx = ctx;
    this.curTheme = initialTheme;
    this.curAction = 'ambient';
    this.curIntensity = 0.28;
    this.stepIdx = 0;

    try {
      const now = ctx.currentTime;
      const palette = THEME_PALETTES[initialTheme];

      this.bgmBus = ctx.createGain();
      this.bgmBus.gain.setValueAtTime(0.0001, now);
      this.bgmBus.gain.linearRampToValueAtTime(0.26, now + 0.65);

      this.masterFilter = ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(640, now);
      this.masterFilter.Q.setValueAtTime(1.6, now);

      this.padGain = ctx.createGain();
      this.padGain.gain.setValueAtTime(0.24, now);

      this.shimmerGain = ctx.createGain();
      this.shimmerGain.gain.setValueAtTime(0.06, now);

      this.rootOsc = ctx.createOscillator();
      this.rootOsc.type = 'sine';
      this.rootOsc.frequency.setValueAtTime(palette.rootHz, now);

      this.fifthOsc = ctx.createOscillator();
      this.fifthOsc.type = palette.padWave;
      this.fifthOsc.frequency.setValueAtTime(palette.fifthHz, now);

      this.shimmerOsc = ctx.createOscillator();
      this.shimmerOsc.type = 'sine';
      this.shimmerOsc.frequency.setValueAtTime(palette.shimmerHz, now);

      // Gentle breathing LFO modulating filter frequency
      this.lfoOsc = ctx.createOscillator();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.setValueAtTime(0.24, now);
      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.setValueAtTime(95, now);

      this.lfoOsc.connect(this.lfoGain);
      this.lfoGain.connect(this.masterFilter.frequency);

      this.rootOsc.connect(this.padGain);
      this.fifthOsc.connect(this.padGain);
      this.shimmerOsc.connect(this.shimmerGain);

      this.padGain.connect(this.masterFilter);
      this.shimmerGain.connect(this.masterFilter);
      this.masterFilter.connect(this.bgmBus);
      this.bgmBus.connect(masterGain);

      this.rootOsc.start(now);
      this.fifthOsc.start(now);
      this.shimmerOsc.start(now);
      this.lfoOsc.start(now);

      this.nextStepTime = now + 0.08;
      this.active = true;
    } catch {
      this.stop();
    }
  }

  public unlock(): void {
    sounds.ensureContextReady();
    if (!this.active) {
      this.start(this.curTheme);
    }
  }

  public update(params: CutsceneSoundUpdate): void {
    if (!this.active) {
      this.start(params.theme);
    }
    if (!this.active || !this.ctx || !this.bgmBus || !this.masterFilter || !this.padGain || !this.shimmerGain) {
      return;
    }
    if (this.ctx.state === 'suspended') {
      return;
    }

    const now = this.ctx.currentTime;
    const clampedIntensity = Math.max(0, Math.min(1, params.intensity));
    this.curIntensity += (clampedIntensity - this.curIntensity) * 0.14;
    const palette = THEME_PALETTES[params.theme];
    const isMuted = sounds.getMuted();

    // Smooth harmonic glide on theme switch
    if (params.theme !== this.curTheme) {
      this.curTheme = params.theme;
      if (this.rootOsc && this.fifthOsc && this.shimmerOsc) {
        this.rootOsc.frequency.setTargetAtTime(palette.rootHz, now, 0.35);
        this.fifthOsc.frequency.setTargetAtTime(palette.fifthHz, now, 0.35);
        this.shimmerOsc.frequency.setTargetAtTime(palette.shimmerHz, now, 0.35);
        this.fifthOsc.type = palette.padWave;
      }
    }

    // Action transition musical accents
    if (params.action !== this.curAction) {
      const prevAction = this.curAction;
      this.curAction = params.action;
      if (!isMuted && !params.paused) {
        this.triggerActionAccent(params.action, prevAction, palette, now);
      }
    }

    // Modulate master BGM gain, filter cutoff & shimmer layer based on action + intensity
    const paused = Boolean(params.paused);
    const isTimeStop = params.action === 'timestop';
    const targetBusGain = paused ? 0.045 : isTimeStop ? 0.2 : 0.19 + this.curIntensity * 0.21;
    const targetCutoff = paused
      ? 240
      : isTimeStop
      ? 220
      : 320 + Math.pow(this.curIntensity, 1.25) * 2650 + (params.action === 'clash' || params.action === 'cyclone' ? 450 : 0);

    this.bgmBus.gain.setTargetAtTime(isMuted ? 0.0001 : targetBusGain, now, 0.12);
    this.masterFilter.frequency.setTargetAtTime(targetCutoff, now, 0.12);
    this.padGain.gain.setTargetAtTime(isTimeStop ? 0.18 : 0.2 + this.curIntensity * 0.16, now, 0.15);
    this.shimmerGain.gain.setTargetAtTime(
      isTimeStop ? 0.16 : params.action === 'convergence' ? 0.18 : 0.04 + this.curIntensity * 0.11,
      now,
      0.15
    );

    if (paused || isMuted || isTimeStop) {
      this.nextStepTime = Math.max(this.nextStepTime, now + 0.05);
      return;
    }

    // Dynamic lookahead sequencer (schedules notes slightly ahead on Web Audio clock)
    const actionBpmBoost =
      params.action === 'clash' || params.action === 'cyclone'
        ? 34
        : params.action === 'duel'
        ? 24
        : params.action === 'dash' || params.action === 'rewind'
        ? 18
        : params.action === 'convergence'
        ? 16
        : params.action === 'stride'
        ? 6
        : 0;
    const effectiveBpm = palette.baseBpm + actionBpmBoost + this.curIntensity * 22;
    // 16th-note step duration during high action, 8th-note when calm
    const subdivision = this.curIntensity > 0.48 || params.action === 'duel' || params.action === 'clash' || params.action === 'cyclone' ? 4 : 2;
    const stepDur = 60 / effectiveBpm / subdivision;

    let guard = 0;
    while (this.nextStepTime < now + 0.14 && guard < 4) {
      this.scheduleStep(this.nextStepTime, this.stepIdx, palette, params.action, this.curIntensity);
      this.nextStepTime += stepDur;
      this.stepIdx++;
      guard++;
    }
    if (this.nextStepTime < now - 0.25) {
      this.nextStepTime = now + 0.02;
    }
  }

  private scheduleStep(
    time: number,
    step: number,
    palette: ThemePalette,
    action: CutsceneActionState,
    intensity: number
  ): void {
    if (!this.ctx || !this.masterFilter || !this.bgmBus) return;
    const scale = palette.scaleHz;
    const len = scale.length;

    // 1. Melodic Arpeggio Note
    let idx: number;
    if (action === 'rewind') {
      // Sweeping backward-ascending cascade
      idx = (len - 1 - (step % len) + Math.floor(step / 3)) % len;
    } else if (action === 'convergence') {
      // Wide uplifting chordal pattern
      const chordPattern = [0, 2, 4, 7, 5, 4, 2, 6];
      idx = chordPattern[step % chordPattern.length] % len;
    } else if (action === 'clash' || action === 'cyclone') {
      const intensePattern = [0, 4, 7, 3, 5, 7, 2, 6];
      idx = intensePattern[step % intensePattern.length] % len;
    } else {
      const calmPattern = [0, 2, 4, 5, 4, 2, 1, 3];
      idx = calmPattern[step % calmPattern.length] % len;
    }

    const playArp = intensity > 0.18 || step % 2 === 0;
    if (playArp) {
      const freq = scale[idx] * (action === 'convergence' && step % 4 === 3 ? 2 : 1);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = palette.arpWave;
      osc.frequency.setValueAtTime(freq, time);

      const noteVol = 0.045 + intensity * 0.085;
      const dur = intensity > 0.6 ? 0.22 : 0.36;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(noteVol, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      osc.connect(gain);
      gain.connect(this.masterFilter);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    }

    // 2. Rhythmic Sub-Bass Pulse on downbeats during motion/duel/climax
    const bassBeatModulo = action === 'duel' || action === 'clash' || action === 'cyclone' ? 2 : 4;
    if (step % bassBeatModulo === 0 && (intensity > 0.24 || action !== 'ambient')) {
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'triangle';
      const bassNote = step % 8 === 0 ? palette.rootHz : palette.fifthHz * 0.75;
      bOsc.frequency.setValueAtTime(bassNote * 1.15, time);
      bOsc.frequency.exponentialRampToValueAtTime(bassNote, time + 0.09);

      const bassVol = 0.09 + intensity * 0.14;
      bGain.gain.setValueAtTime(0.0001, time);
      bGain.gain.linearRampToValueAtTime(bassVol, time + 0.01);
      bGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);

      bOsc.connect(bGain);
      bGain.connect(this.bgmBus);
      bOsc.start(time);
      bOsc.stop(time + 0.26);
    }

    // 3. Soft Percussive Pulse during high-intensity combat / cyclone / dash
    if (
      (action === 'clash' || action === 'duel' || action === 'cyclone' || action === 'dash') &&
      step % 4 === 2 &&
      intensity > 0.45
    ) {
      const pOsc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      pOsc.type = 'sine';
      pOsc.frequency.setValueAtTime(160, time);
      pOsc.frequency.exponentialRampToValueAtTime(42, time + 0.08);
      pGain.gain.setValueAtTime(0.08 + intensity * 0.1, time);
      pGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
      pOsc.connect(pGain);
      pGain.connect(this.bgmBus);
      pOsc.start(time);
      pOsc.stop(time + 0.1);
    }
  }

  private triggerActionAccent(
    nextAction: CutsceneActionState,
    prevAction: CutsceneActionState,
    palette: ThemePalette,
    now: number
  ): void {
    if (!this.ctx || !this.bgmBus || !this.masterFilter) return;

    try {
      if (nextAction === 'timestop') {
        // Dramatic downward time-freeze resonance sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(palette.shimmerHz * 2, now);
        osc.frequency.exponentialRampToValueAtTime(palette.rootHz, now + 0.55);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
        osc.connect(gain);
        gain.connect(this.bgmBus);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (nextAction === 'rewind' || nextAction === 'convergence') {
        // Ascending harmonic shimmer chord
        [0, 2, 4].forEach((sIdx, i) => {
          if (!this.ctx || !this.masterFilter) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(palette.scaleHz[sIdx % palette.scaleHz.length] * 1.5, now + i * 0.06);
          gain.gain.setValueAtTime(0.0001, now + i * 0.06);
          gain.gain.linearRampToValueAtTime(0.11, now + i * 0.06 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.55);
          osc.connect(gain);
          gain.connect(this.masterFilter);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.6);
        });
      } else if (
        (nextAction === 'clash' || nextAction === 'cyclone' || nextAction === 'dash') &&
        prevAction !== nextAction
      ) {
        // Sub-impact tension swell
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(palette.rootHz * 2, now);
        osc.frequency.exponentialRampToValueAtTime(palette.rootHz, now + 0.25);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.bgmBus);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Ignore transient Web Audio scheduling errors
    }
  }

  public stop(): void {
    const ctx = this.ctx;
    const bus = this.bgmBus;
    const nodes: Array<AudioNode | null> = [
      this.rootOsc,
      this.fifthOsc,
      this.shimmerOsc,
      this.lfoOsc,
      this.lfoGain,
      this.padGain,
      this.shimmerGain,
      this.masterFilter,
      this.bgmBus
    ];
    const oscs = [this.rootOsc, this.fifthOsc, this.shimmerOsc, this.lfoOsc];

    this.active = false;
    this.ctx = null;
    this.bgmBus = null;
    this.masterFilter = null;
    this.padGain = null;
    this.shimmerGain = null;
    this.rootOsc = null;
    this.fifthOsc = null;
    this.shimmerOsc = null;
    this.lfoOsc = null;
    this.lfoGain = null;

    if (ctx && bus) {
      try {
        const now = ctx.currentTime;
        bus.gain.cancelScheduledValues(now);
        bus.gain.setTargetAtTime(0.0001, now, 0.06);
      } catch {
        // ignore
      }
      window.setTimeout(() => {
        oscs.forEach((o) => {
          try {
            o?.stop();
          } catch {
            // ignore
          }
        });
        nodes.forEach((n) => {
          try {
            n?.disconnect();
          } catch {
            // ignore
          }
        });
      }, 220);
    }
  }
}

export const cutsceneSoundscape = new CutsceneSoundscapeEngine();
