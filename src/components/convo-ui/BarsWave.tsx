'use client';

import { useEffect, useRef, useState } from 'react';

export interface BarsWaveProps {
  /** When false, bars fall to a flat low baseline. Default true. */
  active?: boolean;
  /**
   * Bar count for synth mode. Ignored when `values` is provided — the external
   * array's length wins there.
   */
  bars?: number;
  /** Container height in px. Default 48. */
  height?: number;
  /**
   * Bar fill. `'gradient'` uses the brand voice gradient per bar position;
   * any other value is treated as a static CSS color string.
   */
  color?: 'gradient' | string;
  /** Synth-mode amplitude multiplier. Ignored when `values` is provided. */
  amplitude?: number;
  /**
   * External per-bar target values in [0, 1]. When provided, BarsWave stops
   * synthesizing and animates toward these values. Caller pushes new arrays
   * each frame (typically via a RAF loop reading live FFT data); BarsWave
   * applies attack/release smoothing between frames so the rendered bars
   * glide instead of jittering.
   */
  values?: number[];
  /**
   * Smoothing — fast rise ("attack"), slow fall ("release") — the classic
   * VU-meter feel. Each frame: `next = prev + (target - prev) * rate`, with
   * `rate = target > prev ? attack : release`. Default 0.45 / 0.08.
   * Set both to 1 to disable smoothing entirely.
   */
  attack?: number;
  release?: number;
  /** Minimum bar height in px so bars don't disappear. Default 3. */
  minHeight?: number;
}

/**
 * BarsWave — classic meter-style waveform. DOM-based (no canvas), so it scales
 * fluidly with its container. Two modes:
 *
 *   - **Synth** (default): neighbors decorrelated via two-sinusoid + noise mix,
 *     driven by the internal RAF. Decorative, no audio input required.
 *   - **Driven** (pass `values`): bars animate toward the caller-supplied
 *     target values with built-in attack/release smoothing. The caller owns
 *     the data pipeline (FFT → bar values); BarsWave owns the visual feel.
 *
 * Both modes run through the same smoothing path, so the jitter-resistance is
 * uniform — synth mode just uses internally-generated targets instead of a
 * prop array. See `spreadBandsToBarValues` for the standard "FFT bands → bar
 * values" mapping.
 */
export function BarsWave({
  active = true,
  bars = 32,
  height = 48,
  color = 'gradient',
  amplitude = 1,
  values,
  attack = 0.45,
  release = 0.08,
  minHeight = 3,
}: BarsWaveProps) {
  const barCount = values?.length ?? bars;
  const [heights, setHeights] = useState<number[]>(
    () => new Array(barCount).fill(0),
  );

  // Refs so the RAF loop reads latest props without re-subscribing. `values`
  // in particular changes every frame when driven externally; without the ref
  // we'd either recreate the RAF each frame or capture stale data. Ref writes
  // happen in an effect (not in render) to satisfy react-hooks/refs — RAF ticks
  // run after commit so they see the updated refs on the next frame.
  const valuesRef = useRef(values);
  const activeRef = useRef(active);
  const amplitudeRef = useRef(amplitude);
  useEffect(() => {
    valuesRef.current = values;
    activeRef.current = active;
    amplitudeRef.current = amplitude;
  });

  useEffect(() => {
    let raf: number;
    let t = 0;
    const loop = () => {
      t += 0.08;
      setHeights((prev) => {
        const external = valuesRef.current;
        const n = external?.length ?? bars;

        // Resize persisted heights if bar count changed (e.g. caller swapped
        // from 32-bar synth to 48-bar external values). Carry over overlap.
        let pPrev: number[];
        if (prev.length === n) {
          pPrev = prev;
        } else {
          pPrev = new Array(n).fill(0);
          for (let i = 0; i < Math.min(prev.length, n); i++) pPrev[i] = prev[i];
        }

        const next = new Array<number>(n);
        const isActive = activeRef.current;
        const amp = amplitudeRef.current;

        for (let i = 0; i < n; i++) {
          // Compute this frame's target value for bar i.
          let target: number;
          if (!isActive) {
            // Idle baseline — small, flat, alive. Attack/release will glide
            // bars down here when `active` flips false mid-animation.
            target = 0.08;
          } else if (external) {
            target = external[i] ?? 0;
          } else {
            // Synth mode: two-sinusoid + random mix, decorrelated by index.
            const f1 = Math.sin(t + i * 0.3) * 0.5 + 0.5;
            const f2 = Math.sin(t * 2.3 + i * 0.7) * 0.5 + 0.5;
            const f3 = Math.random() * 0.3;
            target = Math.min(1, (f1 * 0.5 + f2 * 0.3 + f3) * amp);
          }

          // Attack/release — asymmetric smoothing for VU-meter feel.
          const p = pPrev[i];
          const rate = target > p ? attack : release;
          next[i] = p + (target - p) * rate;
        }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [bars, attack, release]);

  return (
    <div
      className="flex w-full items-center gap-[3px]"
      style={{ height }}
      aria-hidden="true"
    >
      {heights.map((v, i) => {
        const h = Math.max(minHeight, v * height);
        const bg =
          color === 'gradient'
            ? `linear-gradient(180deg, #7C5CFF, #E85C8A ${50 - i}%, #F5A55C)`
            : color;
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm ${active ? 'opacity-100' : 'opacity-40'}`}
            style={{ height: h, background: bg }}
          />
        );
      })}
    </div>
  );
}

export default BarsWave;
