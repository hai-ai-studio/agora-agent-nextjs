'use client';

import { useEffect, useMemo, useRef } from 'react';

export interface BarsWaveProps {
  /** When false, bars fall to a flat low baseline. Synth-only; ignored in driven mode. */
  active?: boolean;
  /** Bar count. Default 32. */
  bars?: number;
  /** Container height in px. Default 48. */
  height?: number;
  /**
   * Bar fill. `'gradient'` uses the brand voice gradient per bar position;
   * any other value is treated as a static CSS color string.
   */
  color?: 'gradient' | string;
  /** Synth-mode amplitude multiplier. Ignored when `getTargets` is provided. */
  amplitude?: number;
  /**
   * Driven-mode data source. Called once per frame with the current time in
   * seconds. Return an array of `bars` values in [0, 1]. BarsWave applies
   * attack/release smoothing internally and writes directly to DOM — the
   * callback never causes a React re-render, so this is the zero-overhead
   * hot path for audio-reactive bars.
   *
   * Reuse the same buffer across calls to avoid allocation:
   *
   * ```tsx
   * const scratch = useRef(new Float32Array(bars));
   * const getTargets = useCallback((t: number) => {
   *   // write into scratch.current, return it
   *   return scratch.current;
   * }, [bars]);
   * ```
   *
   * Keep the callback identity stable (useCallback) — otherwise the RAF loop
   * re-subscribes on every render.
   */
  getTargets?: (t: number) => number[] | Float32Array;
  /**
   * Smoothing — fast rise ("attack"), slow fall ("release") — the classic
   * VU-meter feel. Each frame: `next = prev + (target - prev) * rate`, with
   * `rate = target > prev ? attack : release`. Default 0.45 / 0.08.
   * Set both to 1 to disable smoothing.
   */
  attack?: number;
  release?: number;
  /** Minimum bar height in px so bars don't disappear. Default 3. */
  minHeight?: number;
}

/**
 * BarsWave — meter-style waveform. DOM-based (no canvas), fluid width.
 *
 * ### Rendering path (why this component is the way it is)
 *
 * The RAF loop writes directly to each bar's `style.height` via refs. No
 * setState per frame, no React reconciliation per frame — at 48 bars × 60fps
 * that's ~2880 DOM ops/sec that never touch React. Only prop changes
 * (bar count, color, smoothing rates) trigger a re-render.
 *
 * ### Two modes
 *
 *   - **Synth** (default): built-in sine + noise mix.
 *   - **Driven**: pass `getTargets` — the callback runs inside the RAF loop
 *     each frame; its return value becomes the target for attack/release
 *     smoothing. No `values` prop, no re-renders from the caller.
 *
 * Both modes share the same smoothing + DOM-write path.
 */
export function BarsWave({
  active = true,
  bars = 32,
  height = 48,
  color = 'gradient',
  amplitude = 1,
  getTargets,
  attack = 0.45,
  release = 0.08,
  minHeight = 3,
}: BarsWaveProps) {
  // Per-bar DOM refs — the RAF loop writes style.height into these directly.
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Latest smoothed heights, in [0, 1]. Persisted across frames. Using a
  // Float32Array over number[] for the inner loop avoids boxing overhead.
  // Initial allocation uses the first-render bar count; subsequent `bars`
  // changes resize inside an effect to keep ref writes out of render.
  const smoothedRef = useRef<Float32Array>(new Float32Array(bars));
  useEffect(() => {
    if (smoothedRef.current.length === bars) return;
    const next = new Float32Array(bars);
    const carry = Math.min(smoothedRef.current.length, bars);
    for (let i = 0; i < carry; i++) next[i] = smoothedRef.current[i];
    smoothedRef.current = next;
  }, [bars]);

  // Latest-ref pattern for props the RAF reads on each tick. Avoids stale
  // closures without restarting the RAF on every render.
  const getTargetsRef = useRef(getTargets);
  const activeRef = useRef(active);
  const amplitudeRef = useRef(amplitude);
  useEffect(() => {
    getTargetsRef.current = getTargets;
    activeRef.current = active;
    amplitudeRef.current = amplitude;
  });

  // Pre-compute per-bar gradient strings once per (bars, color) pair. Without
  // this, we'd re-allocate `bars` strings on every render.
  const barFills = useMemo<string[]>(() => {
    const fills = new Array<string>(bars);
    if (color === 'gradient') {
      for (let i = 0; i < bars; i++) {
        fills[i] = `linear-gradient(180deg, #7C5CFF, #E85C8A ${50 - i}%, #F5A55C)`;
      }
    } else {
      for (let i = 0; i < bars; i++) fills[i] = color;
    }
    return fills;
  }, [bars, color]);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    let synthT = 0;
    const loop = (now: number) => {
      synthT += 0.08;
      const t = (now - start) / 1000;
      const getTargetsFn = getTargetsRef.current;
      const isActive = activeRef.current;
      const amp = amplitudeRef.current;

      // Compute target values for this frame — driven or synth.
      let targets: number[] | Float32Array | null = null;
      if (getTargetsFn) {
        targets = getTargetsFn(t);
      }

      const smoothed = smoothedRef.current;
      const refs = barRefs.current;
      for (let i = 0; i < bars; i++) {
        let target: number;
        if (targets) {
          target = targets[i] ?? 0;
        } else if (!isActive) {
          target = 0.08;
        } else {
          // Synth: two-sinusoid + random mix, decorrelated by index.
          const f1 = Math.sin(synthT + i * 0.3) * 0.5 + 0.5;
          const f2 = Math.sin(synthT * 2.3 + i * 0.7) * 0.5 + 0.5;
          const f3 = Math.random() * 0.3;
          target = Math.min(1, (f1 * 0.5 + f2 * 0.3 + f3) * amp);
        }

        // Asymmetric smoothing — VU-meter feel.
        const p = smoothed[i];
        const rate = target > p ? attack : release;
        const next = p + (target - p) * rate;
        smoothed[i] = next;

        // Direct DOM write — no React involvement.
        const el = refs[i];
        if (el) {
          const h = Math.max(minHeight, next * height);
          el.style.height = `${h}px`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bars, attack, release, height, minHeight]);

  // Render the bar DOM once per prop change. Heights start at minHeight and
  // the RAF takes over on the next frame. Dimming via CSS opacity (not on
  // height) so the inactive transition looks clean.
  return (
    <div
      className={`flex w-full items-center gap-[3px] ${active ? 'opacity-100' : 'opacity-40'}`}
      style={{ height }}
      aria-hidden="true"
    >
      {Array.from({ length: bars }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className="flex-1 rounded-sm"
          style={{ height: minHeight, background: barFills[i] }}
        />
      ))}
    </div>
  );
}

export default BarsWave;
