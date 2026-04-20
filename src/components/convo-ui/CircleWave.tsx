'use client';

import { useEffect, useRef } from 'react';

export interface CircleWaveProps {
  active?: boolean;
  size?: number;
}

/**
 * CircleWave — three concentric voice-gradient rings with per-ring phase offset. Pairs with
 * VoiceOrb for depth layering. Pure canvas; stroke colors are hardcoded alpha-variants of
 * the voice gradient stops so each ring reads distinctly.
 */
export function CircleWave({ active = true, size = 80 }: CircleWaveProps) {
  const cRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = cRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let t = 0;
    let raf: number;
    const draw = () => {
      t += 0.03;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const rings = 3;
      const strokes = [
        'rgba(124,92,255,0.8)',
        'rgba(232,92,138,0.6)',
        'rgba(245,165,92,0.4)',
      ];

      for (let r = 0; r < rings; r++) {
        ctx.beginPath();
        const baseR = size * 0.2 + r * 8;
        const segs = 120;
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          const offset = active
            ? Math.sin(a * (4 + r) + t * (2 + r * 0.5)) * (3 + r)
            : Math.sin(a * 2 + t * 0.3) * 0.8;
          const rad = baseR + offset;
          const x = cx + Math.cos(a) * rad;
          const y = cy + Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = strokes[r];
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, size]);

  return (
    <canvas
      ref={cRef}
      aria-hidden="true"
      className="block"
      style={{ width: size, height: size }}
    />
  );
}

export default CircleWave;
