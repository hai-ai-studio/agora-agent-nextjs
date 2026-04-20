'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioFFT } from '@/features/conversation/hooks/useAudioFFT';
import type { ViewState } from '@/features/conversation/lib/view-state';

// useState initializer runs once at mount and is the sanctioned place for Math.random —
// useRef's initializer runs every render, which React 19 flags as impure.

// Two stacked bar rows (one Waveform per speaker). Amplitude math mirrors the reference
// (synthesized noise driven by `state`) — and when a MediaStreamTrack is provided for
// this variant's active state (listening→user, speaking→agent), we spread real-time
// FFT bass/mid/treble bands across the bars so they breathe with actual speech.

const BAR_COUNT = 48;

type Variant = 'agent' | 'user';

export interface WaveformProps {
  state: ViewState;
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

  // Keep the analyser warm whenever a track is present — don't gate on state. Gating on
  // `state === 'listening'` for the user row means we only start sampling the mic AFTER
  // the remote agent's VAD has flipped us into listening, which adds a noticeable
  // round-trip delay between the user speaking and the bars reacting. With the analyser
  // always live, `hasAudio` below still restricts WHEN we paint audio-driven amplitudes,
  // but the data is already fresh the moment state changes.
  const isUser = variant === 'user';
  const isAgent = variant === 'agent';
  const isActiveForTrack =
    (isUser && state === 'listening') || (isAgent && state === 'speaking');
  const bandsRef = useAudioFFT(audioTrack, { smoothing: 0.8 });

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
  const { bass: rawBass, mid: rawMid, treble: rawTreble } = frame;

  // Noise gate: subtract the typical ambient-noise floor and renormalize. Anything
  // below the floor (background hum, breathing, keyboard taps) is treated as silence
  // so the bars don't jitter. Speech typically lands well above the floor.
  const NOISE_FLOOR = 0.18;
  const FLOOR_SCALE = 1 / (1 - NOISE_FLOOR);
  const gate = (v: number) => Math.max(0, v - NOISE_FLOOR) * FLOOR_SCALE;
  // Soft power-curve compression — makes quiet-but-above-floor sounds visibly smaller
  // than real speech, flattening micro-fluctuations while letting peaks still reach full scale.
  const shape = (v: number) => v * v; // x² — zero stays zero, 1 stays 1, 0.5 → 0.25
  const bass = shape(gate(rawBass));
  const mid = shape(gate(rawMid));
  const treble = shape(gate(rawTreble));

  const hasAudio = isActiveForTrack && audioTrack !== null;

  // For the user row: bypass state gating entirely when there's genuine local audio energy.
  // Post-gate + compression means `userEnergy > 0.08` is a real "user is speaking" signal,
  // not sub-speech ambient noise.
  const userEnergy = Math.max(bass, mid, treble);
  const userAudioActive = isUser && audioTrack !== null && userEnergy > 0.08;

  const bars = seeds.map((seed, i) => {
    const phase = i / BAR_COUNT;
    const center = Math.abs(phase - 0.5) * 2; // 0 at center, 1 at edges
    const envelope = 1 - Math.pow(center, 1.8); // taller in the middle

    let amp = 0;
    // User row fast-path: if local mic has energy, drive bars from FFT regardless of state.
    // Skips the agent-VAD round trip so bars respond to the user's voice immediately.
    if (userAudioActive && state !== 'muted') {
      const audioAmp = shapeByBand(bass, mid, treble, seed, i, t);
      const baseline = 0.05 + 0.03 * Math.sin(t * 1.2 + i * 0.3);
      // Gain 1.6× after gate+compression: squared values sit near 0.1-0.3 for speech;
      // multiplying by 1.6 (and capping at ~1 via envelope) maps speech peaks to full bar height.
      amp = Math.max(baseline, audioAmp * 1.6) * envelope;
    } else if (state === 'idle') {
      amp = 0.04 + 0.03 * Math.sin(t * 1.3 + i * 0.25) * envelope;
    } else if (state === 'listening') {
      if (isUser) {
        if (hasAudio) {
          // Real FFT: shape bands across bars + a soft baseline so silence pauses
          // still look alive rather than flatlining. Gain matches the user fast-path.
          const audioAmp = shapeByBand(bass, mid, treble, seed, i, t);
          const baseline = 0.05 + 0.03 * Math.sin(t * 1.2 + i * 0.3);
          amp = Math.max(baseline, audioAmp * 1.6) * envelope;
        } else {
          const n = Math.sin(t * 8 + seed * 10) * 0.5 + 0.5;
          const n2 = Math.sin(t * 13 + i * 0.6) * 0.5 + 0.5;
          amp = (0.15 + 0.8 * n * n2) * envelope;
        }
      } else {
        amp = 0.03 + 0.02 * Math.sin(t * 1.2 + i * 0.3);
      }
    } else if (state === 'thinking') {
      // Thinking is agent-internal — only the agent row shimmers. User row stays quiet
      // so the viz reads "Aria is processing" without implying user input.
      if (isAgent) {
        const wave = Math.sin(t * 3 - i * 0.35);
        amp = (0.1 + 0.35 * Math.max(0, wave)) * envelope * 0.7;
      } else {
        amp = 0.03 + 0.02 * Math.sin(t * 1.2 + i * 0.3);
      }
    } else if (state === 'speaking') {
      if (isAgent) {
        if (hasAudio) {
          const audioAmp = shapeByBand(bass, mid, treble, seed, i, t);
          const baseline = 0.06 + 0.04 * Math.sin(t * 1.3 + i * 0.3);
          amp = Math.max(baseline, audioAmp * 1.6) * envelope;
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
      // Error / reconnecting is a transport problem on the agent side — user stays quiet.
      if (isAgent) {
        amp = 0.05 + 0.05 * Math.sin(t * 20 + i);
      } else {
        amp = 0.02;
      }
    }

    const h = Math.max(3, amp * height * 0.9);
    return { h, i };
  });

  const gap = 4;
  const barW = (width - gap * (BAR_COUNT - 1)) / BAR_COUNT;
  // Fill color is state-cascaded: listening→green for user, speaking/thinking→tints for agent,
  // error→red for both. Default falls back to the base --wf-* token so the palette still flips
  // with dark mode. Inline style drives this directly, replacing the former --wf-* injection
  // on the shell root (no CSS var indirection needed since we have `state` in-scope).
  let fill: string;
  if (state === 'error') {
    fill = '#b91c1c';
  } else if (isUser) {
    fill = state === 'listening' ? '#16a34a' : 'var(--muted-foreground)';
  } else {
    fill =
      state === 'speaking'
        ? '#1d4ed8'
        : state === 'thinking'
          ? '#b45309'
          : 'var(--foreground)';
  }
  // Dim the inactive speaker's row so the active one reads as the focus.
  // thinking + error are agent-owned states — only the agent row brightens.
  // Real user voice energy bright-flips user row too, before the agent's VAD arrives.
  const activeOpacity =
    userAudioActive ||
    (isUser && state === 'listening') ||
    (isAgent && state === 'speaking') ||
    (isAgent && state === 'thinking') ||
    (isAgent && state === 'error')
      ? 1
      : 0.35;

  // Fluid-width: SVG scales to its parent, internal coordinate system stays at the prop
  // values so bar math is unaffected. On a 320px viewport each bar ends up ~4.6px wide with
  // 4px gap — still readable, no horizontal overflow.
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', opacity: activeOpacity, transition: 'opacity .4s ease' }}
      aria-hidden="true"
    >
      {bars.map(({ h, i }) => (
        <rect
          key={i}
          x={i * (barW + gap)}
          y={(height - h) / 2}
          width={barW}
          height={h}
          rx={barW / 2}
          fill={fill}
        />
      ))}
    </svg>
  );
}
