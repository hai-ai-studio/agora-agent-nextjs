'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Drifting radial blobs + SVG grain overlay. Pure decoration — no layout, no interaction.
// The `state` prop tints one of three blobs per state; unspecified states fall through to
// the base warm palette. Intended as an absolute-positioned layer behind conversation
// surfaces. Keep `pointer-events-none` at the call site.

export type AmbientState =
  | 'connecting'
  | 'preparing'
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted'
  | 'error';

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
  } as Partial<Record<AmbientState, Record<number, BlobSpec>>>,
};

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
  } as Partial<Record<AmbientState, Record<number, BlobSpec>>>,
};

const BLOB_CONFIG: BlobPosition[] = [
  { size: 640, top: -200, left: -140, driftX: [0, 40, 0], driftY: [0, 30, 0], duration: 22 },
  { size: 520, bottom: -160, right: -120, driftX: [0, -30, 0], driftY: [0, -40, 0], duration: 28 },
  { size: 420, top: '40%', left: '55%', driftX: [0, -50, 0], driftY: [0, 20, 0], duration: 34 },
];

// SSR returns false (server has no OS preference). Client re-subscribes on mount via
// useSyncExternalStore, so dark users see a brief light flash that swaps once the media
// query reports — acceptable for a decorative layer.
function subscribeDarkMedia(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
function getDarkMediaMatches() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function useIsDark(forceDark?: boolean) {
  const systemDark = useSyncExternalStore(
    subscribeDarkMedia,
    getDarkMediaMatches,
    () => false,
  );
  return forceDark ?? systemDark;
}

function specFor(state: AmbientState, index: number, isDark: boolean): BlobSpec {
  const palette = isDark ? BLOB_DARK : BLOB_LIGHT;
  const override = palette.tints[state]?.[index];
  return override ?? palette.base[index];
}

export interface AmbientProps {
  state: AmbientState;
  // Force the palette independent of the system color scheme. Useful for Storybook stages
  // that pin a dark background.
  dark?: boolean;
}

export function Ambient({ state, dark }: AmbientProps) {
  const isDark = useIsDark(dark);
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Pause the blob drift animations when the Ambient container scrolls off-screen
  // or the tab is backgrounded. Framer Motion only animates when `animate` is
  // provided, so gating `animate` on `visible` stops the RAF loop entirely
  // rather than continuing to tween invisible nodes.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? true),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
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
              reduceMotion || !visible
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

export default Ambient;
