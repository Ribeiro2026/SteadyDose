import { ChimeStyle } from '../types/medication';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.04);
}

export function playReminderChime(style: ChimeStyle = 'bell'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (style === 'bell') {
    // Calm two-note temple bell (C5 -> G5)
    playTone(ctx, 523.25, 0, 0.75, 'sine', 0.22);
    playTone(ctx, 1046.5, 0, 0.4, 'sine', 0.06);
    playTone(ctx, 783.99, 0.28, 0.95, 'sine', 0.2);
  } else if (style === 'warm') {
    // Gentle rising triad (F4 -> A4 -> C5)
    playTone(ctx, 349.23, 0, 0.55, 'triangle', 0.22);
    playTone(ctx, 440.0, 0.22, 0.55, 'triangle', 0.2);
    playTone(ctx, 523.25, 0.44, 0.85, 'sine', 0.22);
  } else {
    // Clear, slightly higher chime for easier hearing
    playTone(ctx, 659.25, 0, 0.45, 'sine', 0.24);
    playTone(ctx, 880.0, 0.24, 0.45, 'sine', 0.24);
    playTone(ctx, 659.25, 0.54, 0.45, 'sine', 0.2);
    playTone(ctx, 880.0, 0.78, 0.75, 'sine', 0.24);
  }
}

export function playTakenConfirmation(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  // Soft reassuring confirmation chord
  playTone(ctx, 440.0, 0, 0.25, 'sine', 0.14);
  playTone(ctx, 554.37, 0.1, 0.35, 'sine', 0.14);
}
