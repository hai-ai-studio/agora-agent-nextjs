'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useSyncExternalStore } from 'react';
import type { AriaState } from './aria-state';

// SVG grain overlay. Encoded once so the data URI isn't rebuilt per render.
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

type BlobSpec = {
  background: string;
  opacity: number;
  transform?: string;
};

type BlobPosition = {
  size: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  driftX: number[];
  driftY: number[];
  duration: number;
};

// Light-mode blob palette. Picked to match the reference editorial design — warm-cool balance
// with tinted accents that shift per state (listening→green, thinking→amber, speaking→blue,
// error→red). Kept as JS data because motion drives the transforms and state drives the color.
const BLOB_LIGHT = {
  base: [
    { background: 'radial-gradient(circle, #e8f0ff 0%, transparent 70%)', opacity: 0.55 },
    { background: 'radial-gradient(circle, #fff1e0 0%, transparent 70%)', opacity: 0.55 },
    { background: 'radial-gradient(circle, #eef5ec 0%, transparent 70%)', opacity: 0.55 },
  ] as const,
  tints: {
    listening: { 0: { background: 'radial-gradient(circle, #d4e9d6 0%, transparent 70%)', opacity: 0.7 } },
    thinking: { 1: { background: 'radial-gradient(circle, #f5e4c4 0%, transparent 70%)', opacity: 0.8 } },
    speaking: { 2: { background: 'radial-gradient(circle, #dce4f7 0%, transparent 70%)', opacity: 0.85, transform: 'scale(1.15)' } },
    error: { 0: { background: 'radial-gradient(circle, #f5d4d4 0%, transparent 70%)', opacity: 0.7 } },
  } as Partial<Record<AriaState, Record<number, BlobSpec>>>,
};

// Dark-mode palette. Cooler, dimmer hues so the ambient layer doesn't feel saccharine.
const BLOB_DARK = {
  base: [
    { background: 'radial-gradient(circle, #1f2a48 0%, transparent 70%)', opacity: 0.35 },
    { background: 'radial-gradient(circle, #3d2a10 0%, transparent 70%)', opacity: 0.35 },
    { background: 'radial-gradient(circle, #1a2e22 0%, transparent 70%)', opacity: 0.35 },
  ] as const,
  tints: {
    listening: { 0: { background: 'radial-gradient(circle, #1a3d24 0%, transparent 70%)', opacity: 0.45 } },
    thinking: { 1: { background: 'radial-gradient(circle, #4a3418 0%, transparent 70%)', opacity: 0.5 } },
    speaking: { 2: { background: 'radial-gradient(circle, #1f2e55 0%, transparent 70%)', opacity: 0.55, transform: 'scale(1.15)' } },
    error: { 0: { background: 'radial-gradient(circle, #441a1a 0%, transparent 70%)', opacity: 0.45 } },
  } as Partial<Record<AriaState, Record<number, BlobSpec>>>,
};

// Positioning + drift amplitudes for each blob. Drift values are the peak offsets used by
// motion's keyframe arrays; durations are the original 22s / 28s / 34s loops.
const BLOB_CONFIG: BlobPosition[] = [
  { size: 640, top: -200, left: -140, driftX: [0, 40, 0], driftY: [0, 30, 0], duration: 22 },
  { size: 520, bottom: -160, right: -120, driftX: [0, -30, 0], driftY: [0, -40, 0], duration: 28 },
  { size: 420, top: '40%', left: '55%', driftX: [0, -50, 0], driftY: [0, 20, 0], duration: 34 },
];

// SSR returns false (server has no OS preference) — the client re-subscribes on mount
// via useSyncExternalStore, so dark users see a brief light flash that swaps once the
// media query reports. Tokens in :root still flip from the CSS @media block, so only
// the blob tints (driven by JS) show this flicker — acceptable for a decorative layer.
function subscribeDarkMedia(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
function getDarkMediaMatches() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function useIsDark() {
  return useSyncExternalStore(
    subscribeDarkMedia,
    getDarkMediaMatches,
    () => false,
  );
}

function specFor(state: AriaState, index: number, isDark: boolean): BlobSpec {
  const palette = isDark ? BLOB_DARK : BLOB_LIGHT;
  const override = palette.tints[state]?.[index];
  return override ?? palette.base[index];
}

export function Ambient({ state }: { state: AriaState }) {
  const isDark = useIsDark();
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {BLOB_CONFIG.map((cfg, i) => {
        const spec = specFor(state, i, isDark);
        const style: React.CSSProperties = {
          position: 'absolute',
          width: cfg.size,
          height: cfg.size,
          top: cfg.top,
          left: cfg.left,
          right: 'right' in cfg ? cfg.right : undefined,
          bottom: 'bottom' in cfg ? cfg.bottom : undefined,
          borderRadius: '50%',
          filter: 'blur(80px)',
          background: spec.background,
          opacity: spec.opacity,
          transform: spec.transform,
          transition:
            'background 1.2s ease, opacity 1s ease, transform 2s cubic-bezier(.4,0,.2,1)',
        };
        return (
          <motion.div
            key={i}
            style={style}
            animate={
              reduceMotion
                ? undefined
                : { x: [...cfg.driftX], y: [...cfg.driftY] }
            }
            transition={{
              duration: cfg.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{
          backgroundImage: GRAIN_URL,
          opacity: isDark ? 0.15 : 0.35,
        }}
      />
    </div>
  );
}
