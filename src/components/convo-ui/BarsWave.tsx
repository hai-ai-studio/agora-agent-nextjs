'use client';

import { useEffect, useMemo, useState } from 'react';

export interface BarsWaveProps {
  active?: boolean;
  bars?: number;
  height?: number;
  /** `'gradient'` uses the voice gradient per bar (index-interpolated); any other value is used
   *  as a static CSS color for all bars. */
  color?: 'gradient' | string;
  amplitude?: number;
}

/**
 * BarsWave — classic meter-style waveform. DOM-based (no canvas), so it scales fluidly with
 * its container. Bar heights are driven by a two-sinusoid + random-noise mix so neighbors
 * don't move in lockstep. Each bar's fill is a per-index interpolation of the voice gradient,
 * which is template-string computed at render — can't be a pure Tailwind utility, lives inline.
 *
 * Split state: `animVals` holds the per-frame animated heights (mutated by RAF when active);
 * `idleVals` is the memoized flat-low baseline for the inactive case. Render picks one without
 * touching setState outside of the animation loop, keeping the React 19 `set-state-in-effect`
 * rule happy.
 */
export function BarsWave({
  active = true,
  bars = 32,
  height = 48,
  color = 'gradient',
  amplitude = 1,
}: BarsWaveProps) {
  const idleVals = useMemo(() => Array(bars).fill(0.08), [bars]);
  const [animVals, setAnimVals] = useState<number[]>(() => Array(bars).fill(0.2));
  const vals = active ? animVals : idleVals;

  useEffect(() => {
    if (!active) return;
    let raf: number;
    let t = 0;
    const loop = () => {
      t += 0.08;
      setAnimVals((prev) =>
        prev.map((_, i) => {
          const f1 = Math.sin(t + i * 0.3) * 0.5 + 0.5;
          const f2 = Math.sin(t * 2.3 + i * 0.7) * 0.5 + 0.5;
          const f3 = Math.random() * 0.3;
          return Math.min(1, (f1 * 0.5 + f2 * 0.3 + f3) * amplitude);
        }),
      );
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [active, bars, amplitude]);

  // Bar height is dynamic (per-frame), so it stays inline. Transitions smoothed at 90ms
  // with the project's shared editorial ease.
  return (
    <div
      className="flex w-full items-center gap-[3px]"
      style={{ height }}
      aria-hidden="true"
    >
      {vals.map((v, i) => {
        const h = Math.max(3, v * height);
        const bg =
          color === 'gradient'
            ? `linear-gradient(180deg, #7C5CFF, #E85C8A ${50 - i}%, #F5A55C)`
            : color;
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-[height] duration-[90ms] ease-aria-out ${
              active ? 'opacity-100' : 'opacity-40'
            }`}
            style={{ height: h, background: bg }}
          />
        );
      })}
    </div>
  );
}

export default BarsWave;
