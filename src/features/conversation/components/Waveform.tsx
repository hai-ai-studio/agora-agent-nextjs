'use client';

import { useEffect, useRef, useState } from 'react';
import { BarsWave, spreadBandsToBarValues } from '@/components/convo-ui';
import { useAudioFFT } from '@/features/conversation/hooks/useAudioFFT';
import type { ViewState } from '@/features/conversation/lib/view-state';

// Conversation-layer adapter around BarsWave. This file stays thin: its only
// jobs are
//   1. tap the Agora audio track via useAudioFFT,
//   2. choose a per-frame target-value array based on current view state,
//   3. map view-state to the color + active/opacity props BarsWave expects.
//
// All visual behavior (bar layout, attack/release smoothing, sparkle, envelope)
// lives in BarsWave + spreadBandsToBarValues. This adapter never reaches into
// rendering — if bars look off, fix it there, not here.

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

  // Keep the analyser warm whenever the track is present — don't gate on state.
  // Gating on `state === 'listening'` delayed mic reactions until the remote
  // agent's VAD had already flipped us into listening. Keeping the analyser
  // hot means the data is fresh the instant the state lands.
  const bandsRef = useAudioFFT(audioTrack, { smoothing: 0.8 });

  // Stable per-bar seeds for sparkle decorrelation. Generated once at mount.
  const [seeds] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => Math.random()),
  );

  // The target-value array we feed BarsWave each frame. A ref + setState pair:
  // the RAF loop writes via the ref (avoiding stale closure) and triggers a
  // re-render via a tick counter so BarsWave gets fresh `values`.
  const [values, setValues] = useState<number[]>(() =>
    new Array(BAR_COUNT).fill(0.04),
  );
  const tRef = useRef(0);
  const startRef = useRef(0);

  // Decide whether this row's audio input should drive the bars. For the user
  // row we also fast-path on raw mic energy so bars start moving BEFORE the
  // remote agent's VAD flips us into `listening`.
  const activeForTrack =
    (isUser && state === 'listening') || (isAgent && state === 'speaking');

  useEffect(() => {
    startRef.current = performance.now();
    let raf: number;
    const loop = (now: number) => {
      const t = (now - startRef.current) / 1000;
      tRef.current = t;
      const b = bandsRef.current;

      // Raw mic energy on the user row — used to bypass VAD round-trip.
      const userEnergy = Math.max(b.bass, b.mid, b.treble);
      const userAudioActive =
        isUser && audioTrack !== null && userEnergy > 0.28;

      const hasAudio = (activeForTrack || userAudioActive) && audioTrack !== null;
      const isMuted = state === 'muted';

      let next: number[];
      if (hasAudio && !isMuted) {
        // Real audio path. BarsWave handles smoothing between frames; we just
        // supply the frame's target values.
        next = spreadBandsToBarValues(b, BAR_COUNT, { seeds, t });
      } else {
        // Synth fallback — state-specific decorative shapes. Kept deliberately
        // subtle; the expressive path is real audio. These formulas feed
        // BarsWave `values`, which will then smooth them like anything else.
        next = new Array(BAR_COUNT);
        for (let i = 0; i < BAR_COUNT; i++) {
          const phase = i / BAR_COUNT;
          const fromCenter = Math.abs(phase - 0.5) * 2;
          const envelope = 1 - Math.pow(fromCenter, 1.8);
          const seed = seeds[i];
          let amp: number;

          if (isMuted) {
            amp = 0.02;
          } else if (state === 'thinking' && isAgent) {
            // Agent processing — traveling wave. User row stays quiet so the
            // viz reads "the agent is working" without implying user input.
            const wave = Math.sin(t * 3 - i * 0.35);
            amp = (0.1 + 0.35 * Math.max(0, wave)) * envelope * 0.7;
          } else if (state === 'error' && isAgent) {
            // Error / reconnecting — agent-side shimmer.
            amp = 0.05 + 0.05 * Math.sin(t * 20 + i);
          } else if (state === 'listening' && isUser) {
            // User row without mic input yet — subtle organic motion.
            const n = Math.sin(t * 8 + seed * 10) * 0.5 + 0.5;
            const n2 = Math.sin(t * 13 + i * 0.6) * 0.5 + 0.5;
            amp = (0.15 + 0.8 * n * n2) * envelope;
          } else if (state === 'speaking' && isAgent) {
            // Agent speaking without audio (rare — track not yet subscribed).
            const n = Math.sin(t * 6 + seed * 12) * 0.5 + 0.5;
            const n2 = Math.sin(t * 10 + i * 0.4 + seed * 4) * 0.5 + 0.5;
            amp = (0.2 + 0.75 * n * n2) * envelope;
          } else if (state === 'idle') {
            // Gentle baseline so the viz never flat-lines when idle.
            amp = 0.04 + 0.03 * Math.sin(t * 1.3 + i * 0.25) * envelope;
          } else {
            // Inactive row for this state — very quiet baseline.
            amp = 0.03 + 0.02 * Math.sin(t * 1.2 + i * 0.3);
          }
          next[i] = amp;
        }
      }
      setValues(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // bandsRef identity is stable (module-level AudioContext + ref).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isUser, isAgent, audioTrack, activeForTrack]);

  // State → color. Inline rather than via CSS var indirection since we have
  // `state` in-scope and the mapping is compact.
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

  // Dim the inactive speaker's row so the active one reads as the focus.
  // `active` also drives BarsWave's subtle baseline when false — bars glide to
  // the low idle state instead of staying where they were.
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
        values={values}
        height={height}
        color={color}
        active={rowActive}
      />
    </div>
  );
}
