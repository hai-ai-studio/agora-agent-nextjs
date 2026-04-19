'use client';

import { useEffect, useRef } from 'react';

// Shape the shader reads each frame. Always non-null so the RAF loop stays branch-free.
export type AudioBands = {
  bass: number;
  mid: number;
  treble: number;
};

type FFTOptions = {
  // FFT size passed to AnalyserNode. Must be power of two between 32 and 32768.
  fftSize?: number;
  // Per-band exponential moving average. Higher = more responsive, lower = more smoothed.
  smoothing?: number;
};

// Module-level AudioContext reused across every useAudioFFT caller — browsers cap the
// number of live contexts, and the conversation page may want to analyze both agent and
// user tracks simultaneously.
let sharedCtx: AudioContext | null = null;
function getSharedCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedCtx && sharedCtx.state !== 'closed') return sharedCtx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  sharedCtx = new Ctor();
  return sharedCtx;
}

// Hook: given a MediaStreamTrack (or null), returns a ref whose `.current` holds
// EMA-smoothed bass/mid/treble values in [0..1]. Null track → bands decay to zero.
// The hook does not cause re-renders; the shader RAF loop reads the ref each frame.
export function useAudioFFT(
  track: MediaStreamTrack | null,
  { fftSize = 512, smoothing = 0.6 }: FFTOptions = {},
) {
  const bandsRef = useRef<AudioBands>({ bass: 0, mid: 0, treble: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const ctx = getSharedCtx();
    if (!ctx || !track) {
      // No audio source: decay existing bands on next frames; also start a soft decay loop
      // so bands don't freeze at their last value.
      const decay = () => {
        const b = bandsRef.current;
        b.bass *= 0.9;
        b.mid *= 0.9;
        b.treble *= 0.9;
        rafRef.current = requestAnimationFrame(decay);
      };
      rafRef.current = requestAnimationFrame(decay);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }

    // Safari sometimes returns 'suspended' until a user gesture; call resume() defensively.
    void ctx.resume().catch(() => {});

    const stream = new MediaStream([track]);
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    // Lower analyser-level smoothing → crisper response. Hook's own EMA supplies the
    // rest of the polish. 0.5 (default) adds ~60 ms perceived latency which reads as
    // "the waveform is behind my voice"; 0.3 feels synchronized.
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);
    // NOTE: we never connect to ctx.destination. Playback is Agora's responsibility.

    const bins = analyser.frequencyBinCount;
    const data = new Uint8Array(bins);

    // Band splits assume common voice/music: bass ≈ 0-250 Hz, mid 250-2000 Hz, treble 2k-6k Hz.
    // For an AudioContext at 48 kHz with fftSize=512, each bin ≈ 93.75 Hz.
    const sampleRate = ctx.sampleRate;
    const hzPerBin = sampleRate / fftSize;
    const bassEnd = Math.min(bins, Math.round(250 / hzPerBin));
    const midEnd = Math.min(bins, Math.round(2000 / hzPerBin));
    const trebleEnd = Math.min(bins, Math.round(6000 / hzPerBin));

    const avgRange = (from: number, to: number): number => {
      if (to <= from) return 0;
      let sum = 0;
      for (let i = from; i < to; i++) sum += data[i];
      return sum / (to - from) / 255;
    };

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const rawBass = avgRange(0, bassEnd);
      const rawMid = avgRange(bassEnd, midEnd);
      const rawTreble = avgRange(midEnd, trebleEnd);
      const prev = bandsRef.current;
      bandsRef.current = {
        bass: prev.bass * (1 - smoothing) + rawBass * smoothing,
        mid: prev.mid * (1 - smoothing) + rawMid * smoothing,
        treble: prev.treble * (1 - smoothing) + rawTreble * smoothing,
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {}
    };
  }, [track, fftSize, smoothing]);

  return bandsRef;
}
