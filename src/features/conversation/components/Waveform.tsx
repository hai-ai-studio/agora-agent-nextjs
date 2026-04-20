'use client';

import { useCallback, useRef, useState } from 'react';
import { BarsWave, spreadBandsToBarValues } from '@/components/convo-ui';
import { useAudioFFT } from '@/features/conversation/hooks/useAudioFFT';
import type { ViewState } from '@/features/conversation/lib/view-state';

// Conversation-layer adapter around BarsWave. This file stays thin: its only
// jobs are
//   1. tap the Agora audio track via useAudioFFT,
//   2. compute per-frame target values based on current view state,
//   3. map view-state to the color + active props BarsWave expects.
//
// The hot path has ZERO React re-renders:
//   - useAudioFFT writes bands into a ref continuously
//   - getTargets is a stable useCallback (only re-created on state changes)
//   - BarsWave's RAF loop calls getTargets per frame and writes DOM directly
//   - Waveform itself only re-renders when `state`, `variant`, or the audio
//     track identity changes (i.e., on semantic transitions, not per frame)

const BAR_COUNT = 48;

type Variant = 'agent' | 'user';

export interface WaveformProps {
  state: ViewState;
  variant?: Variant;
  height?: number;
  /**
   * Optional MediaStreamTrack for this variant's active speaker. When present
   * and the current state routes audio to this row, bars breathe with real
   * FFT output; otherwise the row falls back to synthesized animation.
   */
  audioTrack?: MediaStreamTrack | null;
}

export function Waveform({
  state,
  variant = 'agent',
  height = 140,
  audioTrack = null,
}: WaveformProps) {
  const isUser = variant === 'user';
  const isAgent = variant === 'agent';

  // Keep the analyser warm whenever the track is present — don't gate on
  // state. Gating on `state === 'listening'` delayed mic reactions until
  // after the remote agent's VAD flipped us into listening.
  const bandsRef = useAudioFFT(audioTrack, { smoothing: 0.8 });

  // Stable per-bar seeds for sparkle decorrelation. useState lazy init is the
  // sanctioned place for `Math.random()` — the initializer runs once at mount.
  const [seeds] = useState(() =>
    Array.from({ length: BAR_COUNT }, () => Math.random()),
  );

  // Scratch buffer reused every frame — no GC pressure inside the RAF loop.
  const scratch = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  // RAF start time — null sentinel filled on the first frame, subtracted to
  // give `t` in seconds. Avoids calling `performance.now()` during render.
  const startRef = useRef<number | null>(null);

  // getTargets is called from inside BarsWave's RAF. Must be stable unless
  // semantic state changes — useCallback with state + variant + track in deps.
  const getTargets = useCallback(
    (rafT: number) => {
      // BarsWave passes t (seconds since its RAF start). Fall back to tracking
      // our own start on the first call in case that contract ever changes.
      if (startRef.current === null) startRef.current = rafT;
      const t = rafT;
      const b = bandsRef.current;
      const buf = scratch.current;

      // Decide whether this row should be driven by real audio or synth.
      // User row fast-path: start reacting to mic energy BEFORE the remote
      // agent's VAD flips us into `listening`.
      const userEnergy = Math.max(b.bass, b.mid, b.treble);
      const userAudioActive = isUser && audioTrack !== null && userEnergy > 0.28;
      const activeForTrack =
        (isUser && state === 'listening') ||
        (isAgent && state === 'speaking');
      const hasAudio = (activeForTrack || userAudioActive) && audioTrack !== null;
      const isMuted = state === 'muted';

      if (hasAudio && !isMuted) {
        // Audio path — shape bands onto bars, write into scratch buffer.
        spreadBandsToBarValues(b, BAR_COUNT, { seeds, t }, buf);
        return buf;
      }

      // Synth fallback — state-specific decorative shapes. Written into the
      // same scratch buffer so both paths return a reused array.
      for (let i = 0; i < BAR_COUNT; i++) {
        const phase = i / BAR_COUNT;
        const fromCenter = Math.abs(phase - 0.5) * 2;
        const envelope = 1 - Math.pow(fromCenter, 1.8);
        const seed = seeds[i];
        let amp: number;

        if (isMuted) {
          amp = 0.02;
        } else if (state === 'thinking' && isAgent) {
          // Traveling wave on the agent row; user stays quiet.
          const wave = Math.sin(t * 3 - i * 0.35);
          amp = (0.1 + 0.35 * Math.max(0, wave)) * envelope * 0.7;
        } else if (state === 'error' && isAgent) {
          amp = 0.05 + 0.05 * Math.sin(t * 20 + i);
        } else if (state === 'listening' && isUser) {
          const n = Math.sin(t * 8 + seed * 10) * 0.5 + 0.5;
          const n2 = Math.sin(t * 13 + i * 0.6) * 0.5 + 0.5;
          amp = (0.15 + 0.8 * n * n2) * envelope;
        } else if (state === 'speaking' && isAgent) {
          const n = Math.sin(t * 6 + seed * 12) * 0.5 + 0.5;
          const n2 = Math.sin(t * 10 + i * 0.4 + seed * 4) * 0.5 + 0.5;
          amp = (0.2 + 0.75 * n * n2) * envelope;
        } else if (state === 'idle') {
          amp = 0.04 + 0.03 * Math.sin(t * 1.3 + i * 0.25) * envelope;
        } else {
          amp = 0.03 + 0.02 * Math.sin(t * 1.2 + i * 0.3);
        }
        buf[i] = amp;
      }
      return buf;
      // bandsRef + seeds identities are stable — omitted from deps.
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, isUser, isAgent, audioTrack],
  );

  // State → color. Inline because `state` is in scope and the mapping is small.
  let color: string;
  if (state === 'error') {
    color = '#b91c1c';
  } else if (isUser) {
    color = state === 'listening' ? '#16a34a' : 'var(--muted-foreground)';
  } else {
    color =
      state === 'speaking'
        ? '#1d4ed8'
        : state === 'thinking'
          ? '#b45309'
          : 'var(--foreground)';
  }

  const rowActive =
    (isUser && state === 'listening') ||
    (isAgent && state === 'speaking') ||
    (isAgent && state === 'thinking') ||
    (isAgent && state === 'error') ||
    state === 'idle';

  return (
    <div
      style={{ opacity: rowActive ? 1 : 0.35, transition: 'opacity .4s ease' }}
    >
      <BarsWave
        getTargets={getTargets}
        bars={BAR_COUNT}
        height={height}
        color={color}
        active={rowActive}
      />
    </div>
  );
}
