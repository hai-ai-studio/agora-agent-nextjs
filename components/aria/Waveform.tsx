'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioFFT } from '@/lib/audio';
import type { AriaState } from './types';

// useState initializer runs once at mount and is the sanctioned place for Math.random —
// useRef's initializer runs every render, which React 19 flags as impure.

// Two stacked bar rows (one Waveform per speaker). Amplitude math mirrors the reference
// (synthesized noise driven by `state`) — and when a MediaStreamTrack is provided for
// this variant's active state (listening→user, speaking→agent), we spread real-time
// FFT bass/mid/treble bands across the bars so they breathe with actual speech.

const BAR_COUNT = 48;

type Variant = 'agent' | 'user';

export interface WaveformProps {
  state: AriaState;
  variant?: Variant;
  width?: number;
  height?: number;
  // Optional MediaStreamTrack for the variant's active speaker. When absent, synthesized
  // math is used. The hook inside only runs the analyser when this row is the active
  // speaker for the current state — other states fall through to the synthesized path.
  audioTrack?: MediaStreamTrack | null;
}

// Spread a FFT-band triplet across 48 bars. Bass dominates the center, treble the edges —
// the classic spectrum-analyser layout rotated into center-mirror symmetry. Per-bar
// sparkle (sin(t, seed)) breaks up the neighbors so they don't move in lockstep.
function shapeByBand(
  bass: number,
  mid: number,
  treble: number,
  seed: number,
  barIndex: number,
  t: number,
): number {
  const phase = barIndex / BAR_COUNT;
  const fromCenter = Math.abs(phase - 0.5) * 2;
  const weightBass = Math.max(0, 1 - fromCenter * 1.6);
  const weightMid = Math.max(0, 1 - Math.abs(fromCenter - 0.5) * 2);
  const weightTreble = fromCenter;
  const sparkle =
    0.85 + 0.15 * Math.sin(t * 10 + seed * 7 + barIndex * 0.3);
  return (
    (bass * weightBass + mid * weightMid + treble * weightTreble) * sparkle
  );
}

export function Waveform({
  state,
  variant = 'agent',
  width = 640,
  height = 140,
  audioTrack = null,
}: WaveformProps) {
  // One state bag per frame so the render reads only plain values, never a ref.
  const [frame, setFrame] = useState({ tick: 0, bass: 0, mid: 0, treble: 0 });
  const rafRef = useRef<number | null>(null);
  // Stable per-bar seed generated once at mount.
  const [seeds] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => Math.random()),
  );

  // Only tap the analyser for this variant's active speaker. Other states (thinking,
  // muted, idle, error, ended) rely on the synthesized path below, which matches the
  // reference design's behavior and removes the need to gate audio plumbing per-state.
  const isUser = variant === 'user';
  const isAgent = variant === 'agent';
  const isActiveForTrack =
    (isUser && state === 'listening') || (isAgent && state === 'speaking');
  const bandsRef = useAudioFFT(isActiveForTrack ? audioTrack : null);

  useEffect(() => {
    const start = performance.now();
    const loop = (now: number) => {
      // Sample the ref inside the effect, not in render — appeases react-hooks/refs.
      const b = bandsRef.current;
      setFrame({
        tick: now - start,
        bass: b.bass,
        mid: b.mid,
        treble: b.treble,
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // bandsRef identity is stable (module-level AudioContext + ref).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = frame.tick / 1000;
  const { bass, mid, treble } = frame;
  const hasAudio = isActiveForTrack && audioTrack !== null;

  const bars = seeds.map((seed, i) => {
    const phase = i / BAR_COUNT;
    const center = Math.abs(phase - 0.5) * 2; // 0 at center, 1 at edges
    const envelope = 1 - Math.pow(center, 1.8); // taller in the middle

    let amp = 0;
    if (state === 'idle') {
      amp = 0.04 + 0.03 * Math.sin(t * 1.3 + i * 0.25) * envelope;
    } else if (state === 'listening') {
      if (isUser) {
        if (hasAudio) {
          // Real FFT: shape bands across bars + a soft baseline so silence pauses
          // still look alive rather than flatlining.
          const audioAmp = shapeByBand(bass, mid, treble, seed, i, t);
          const baseline = 0.05 + 0.03 * Math.sin(t * 1.2 + i * 0.3);
          amp = Math.max(baseline, audioAmp * 1.1) * envelope;
        } else {
          const n = Math.sin(t * 8 + seed * 10) * 0.5 + 0.5;
          const n2 = Math.sin(t * 13 + i * 0.6) * 0.5 + 0.5;
          amp = (0.15 + 0.8 * n * n2) * envelope;
        }
      } else {
        amp = 0.03 + 0.02 * Math.sin(t * 1.2 + i * 0.3);
      }
    } else if (state === 'thinking') {
      const wave = Math.sin(t * 3 - i * 0.35);
      amp = (0.1 + 0.35 * Math.max(0, wave)) * envelope * 0.7;
    } else if (state === 'speaking') {
      if (isAgent) {
        if (hasAudio) {
          const audioAmp = shapeByBand(bass, mid, treble, seed, i, t);
          const baseline = 0.06 + 0.04 * Math.sin(t * 1.3 + i * 0.3);
          amp = Math.max(baseline, audioAmp * 1.1) * envelope;
        } else {
          const n = Math.sin(t * 6 + seed * 12) * 0.5 + 0.5;
          const n2 = Math.sin(t * 10 + i * 0.4 + seed * 4) * 0.5 + 0.5;
          amp = (0.2 + 0.75 * n * n2) * envelope;
        }
      } else {
        amp = 0.03 + 0.02 * Math.sin(t * 1.2 + i * 0.3);
      }
    } else if (state === 'muted') {
      amp = 0.02;
    } else if (state === 'error') {
      amp = 0.05 + 0.05 * Math.sin(t * 20 + i);
    } else if (state === 'ended') {
      amp = 0.02;
    }

    const h = Math.max(3, amp * height * 0.9);
    return { h, i };
  });

  const gap = 4;
  const barW = (width - gap * (BAR_COUNT - 1)) / BAR_COUNT;
  const colorClass = isUser ? 'wf-user' : 'wf-agent';
  // Dim the inactive speaker's row so the active one reads as the focus.
  const activeOpacity =
    (isUser && state === 'listening') ||
    (isAgent && state === 'speaking') ||
    state === 'thinking'
      ? 1
      : 0.35;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', opacity: activeOpacity, transition: 'opacity .4s ease' }}
      aria-hidden="true"
    >
      {bars.map(({ h, i }) => (
        <rect
          key={i}
          className={colorClass}
          x={i * (barW + gap)}
          y={(height - h) / 2}
          width={barW}
          height={h}
          rx={barW / 2}
        />
      ))}
    </svg>
  );
}
