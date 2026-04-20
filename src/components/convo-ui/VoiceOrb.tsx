'use client';

import { useEffect, useRef } from 'react';

export type VoiceOrbState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted';

export interface VoiceOrbProps {
  state?: VoiceOrbState;
  size?: number;
  /** Target amplitude in [0, 1]. Drives blob deformation for listening/speaking. */
  amplitude?: number;
  /**
   * Hot-path alternative to `amplitude`. When provided, VoiceOrb's RAF loop
   * calls this each frame instead of reading the `amplitude` prop — so the
   * caller can drive audio-reactive amplitude without triggering a React
   * re-render per frame. Keep the callback identity stable (useCallback) so
   * the effect doesn't re-subscribe on every render.
   *
   * ```tsx
   * const getAmp = useCallback(() => max(bandsRef.current) * smoothedGain, []);
   * <VoiceOrb state="speaking" getAmplitude={getAmp} />
   * ```
   *
   * Takes precedence over `amplitude` when both are passed.
   */
  getAmplitude?: () => number;
  ariaLabel?: string;
}

/**
 * VoiceOrb — the DS signature element. Canvas-drawn blob with the voice-a/b/c gradient,
 * radial glow halo, and state-driven deformation. Animates via RAF; pauses drawing on unmount.
 *
 * Canvas internals (hex colors, path math) are kept verbatim from the reference — Tailwind
 * only styles the wrapper. Size is a prop because the canvas backing store is scaled by DPR,
 * so dimensions must be known at setup time.
 */
export function VoiceOrb({
  state = 'idle',
  size = 120,
  amplitude = 0.5,
  getAmplitude,
  ariaLabel = 'Voice orb',
}: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  // State + amplitude read through refs so the RAF loop picks up new values without
  // restarting. Restarting the loop on every prop change would cost a canvas re-scale.
  const stateRef = useRef(state);
  const ampRef = useRef(amplitude);
  const getAmpRef = useRef(getAmplitude);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    ampRef.current = amplitude;
  }, [amplitude]);
  useEffect(() => {
    getAmpRef.current = getAmplitude;
  }, [getAmplitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let t = 0;
    const draw = () => {
      t += 0.016;
      const st = stateRef.current;
      // getAmplitude callback takes precedence — lets the caller drive
      // audio-reactive amplitude per frame without re-rendering React.
      const amp = getAmpRef.current ? getAmpRef.current() : ampRef.current;
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      // Base radius is the orb's plumpness at rest — larger value = fuller
      // orb, smaller halo ring around it. Bumped from 0.32 to 0.40 so the orb
      // reads as a confident filled shape rather than a small disc floating
      // in a big halo. Pulses with amplitude for the "breathe with voice"
      // effect — 7% range keeps the pulse visible without making the orb
      // clip past the container at peak speech.
      const baseR = size * 0.4 * (1 + amp * 0.07);

      // Glow halo layers — more layers when active (listening/speaking).
      const glowCount = st === 'speaking' ? 3 : st === 'listening' ? 2 : 1;
      for (let i = glowCount; i >= 1; i--) {
        const pulse =
          st === 'idle' ? 0.04 : st === 'thinking' ? 0.02 : 0.14 * amp;
        const r = baseR + i * 8 + Math.sin(t * 2 + i) * size * pulse;
        const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
        grad.addColorStop(0, `rgba(124, 92, 255, ${0.15 / i})`);
        grad.addColorStop(0.5, `rgba(232, 92, 138, ${0.1 / i})`);
        grad.addColorStop(1, 'rgba(245, 165, 92, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core orb — 64-point blob contour; deformation math per state.
      const points = 64;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const a = (i / points) * Math.PI * 2;
        let r = baseR;
        if (st === 'idle') {
          r += Math.sin(a * 3 + t * 0.8) * 2 + Math.sin(a * 5 + t * 1.2) * 1.5;
        } else if (st === 'listening') {
          // amp-driven deformation dialled up from 6px → 14px peak so normal
          // speech produces visibly visible wobble, not a subtle shimmer.
          r +=
            Math.sin(a * 4 + t * 2) * (4 + amp * 14) +
            Math.cos(a * 7 + t * 3) * 2;
        } else if (st === 'thinking') {
          r += Math.sin(a * 6 + t * 3) * 3 + Math.cos(a * 2 + t * 1.5) * 4;
        } else if (st === 'speaking') {
          // Same reasoning — 10px → 18px amp-driven peak. Speaking has slightly
          // more base motion than listening because the agent's TTS is
          // typically louder/cleaner than the user's mic input.
          r +=
            Math.sin(a * 3 + t * 4) * (6 + amp * 18) +
            Math.sin(a * 9 + t * 6) * 3;
        } else if (st === 'muted') {
          r += Math.sin(a * 2 + t * 0.3) * 1;
        }
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Rotating linear gradient — thinking state rotates faster to read as processing.
      const rot = (t * (st === 'thinking' ? 0.5 : 0.15)) % (Math.PI * 2);
      const g = ctx.createLinearGradient(
        cx + Math.cos(rot) * baseR,
        cy + Math.sin(rot) * baseR,
        cx - Math.cos(rot) * baseR,
        cy - Math.sin(rot) * baseR,
      );
      if (st === 'muted') {
        g.addColorStop(0, '#A8A49A');
        g.addColorStop(1, '#6B6862');
      } else {
        g.addColorStop(0, '#7C5CFF');
        g.addColorStop(0.5, '#E85C8A');
        g.addColorStop(1, '#F5A55C');
      }
      ctx.fillStyle = g;
      ctx.fill();

      // Specular highlight — fixed top-left, gives the orb physical weight.
      const hi = ctx.createRadialGradient(
        cx - baseR * 0.3,
        cy - baseR * 0.3,
        0,
        cx - baseR * 0.3,
        cy - baseR * 0.3,
        baseR * 0.8,
      );
      hi.addColorStop(0, 'rgba(255,255,255,0.35)');
      hi.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hi;
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="inline-block"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block"
        style={{
          width: size,
          height: size,
          // Soft circular mask — the halo layers extend past the canvas edge
          // at amp=1, so without a mask the user sees a faint rectangular
          // boundary where the alpha gradient is clipped. The radial mask
          // feathers the outer ~10% into transparent, making the halo blend
          // smoothly into the page instead of ending at a square.
          maskImage:
            'radial-gradient(circle at center, black 82%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(circle at center, black 82%, transparent 100%)',
        }}
      />
    </div>
  );
}

export default VoiceOrb;
