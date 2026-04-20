'use client';

import { useEffect, useRef } from 'react';

export interface LinearWaveProps {
  active?: boolean;
  width?: number;
  height?: number;
}

/**
 * LinearWave — canvas oscilloscope trace. Two translucent layers of the voice gradient
 * drawn as continuous sine curves; reads as a waveform rather than a meter. Pauses drawing
 * on unmount. Canvas internals are graphics code, not stylable via Tailwind.
 */
export function LinearWave({
  active = true,
  width = 200,
  height = 40,
}: LinearWaveProps) {
  const cRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = cRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let t = 0;
    let raf: number;
    const draw = () => {
      t += 0.04;
      ctx.clearRect(0, 0, width, height);

      const g = ctx.createLinearGradient(0, 0, width, 0);
      g.addColorStop(0, '#7C5CFF');
      g.addColorStop(0.5, '#E85C8A');
      g.addColorStop(1, '#F5A55C');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      // Two overlapping sine layers with descending alpha for depth.
      for (let layer = 0; layer < 2; layer++) {
        ctx.beginPath();
        ctx.globalAlpha = 1 - layer * 0.5;
        for (let x = 0; x <= width; x += 2) {
          const envelope = active
            ? (Math.sin(x * 0.02 + t) * 0.5 + 0.5) * height * 0.4
            : 1;
          const y =
            height / 2 + Math.sin(x * 0.08 + t * (1 + layer)) * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, width, height]);

  return (
    <canvas
      ref={cRef}
      aria-hidden="true"
      className="block"
      style={{ width, height }}
    />
  );
}

export default LinearWave;
