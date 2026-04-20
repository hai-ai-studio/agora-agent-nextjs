'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

// Agent identity card — avatar with pulsing rings, italic serif name, optional hint line,
// state pill, and mm:ss call timer. Reads as a single cohesive block at the top of the
// conversation surface. Remains purely presentational: the consumer owns `state`,
// `resetKey`, and the displayed hint.

export type PersonaState =
  | 'connecting'
  | 'preparing'
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted'
  | 'error';

type PillVariant = {
  label: string;
  tint: string;
  dotColor: string;
  blink: boolean;
};

// Neutral pills (connecting/preparing/idle/muted) use token-driven text + a `bg-surface`
// frosted surface that needs a dark-mode counterpart. The 4 state-colored pills
// (listening/thinking/speaking/error) keep their hardcoded pastel palettes in both
// themes — the saturation shift is intentional and reads as "status color" regardless
// of surface.
const NEUTRAL_PILL = 'border-border bg-surface/70 dark:bg-surface/5 text-foreground';
const PILL_VARIANTS: Record<PersonaState, PillVariant> = {
  connecting: { label: 'Connecting', tint: NEUTRAL_PILL, dotColor: 'var(--muted-foreground)', blink: true },
  preparing: { label: 'Starting', tint: NEUTRAL_PILL, dotColor: 'var(--muted-foreground)', blink: true },
  idle: { label: 'Ready', tint: NEUTRAL_PILL, dotColor: 'var(--foreground)', blink: false },
  listening: { label: 'Listening', tint: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#14532d]', dotColor: 'var(--state-listen)', blink: true },
  thinking: { label: 'Thinking', tint: 'border-[#fde68a] bg-[#fffbeb] text-[#78350f]', dotColor: 'var(--state-think)', blink: true },
  speaking: { label: 'Speaking', tint: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1e3a8a]', dotColor: 'var(--state-speak)', blink: true },
  muted: { label: 'Muted', tint: NEUTRAL_PILL, dotColor: 'var(--state-muted)', blink: false },
  error: { label: 'Reconnecting', tint: 'border-[#fecaca] bg-[#fef2f2] text-[#7f1d1d]', dotColor: 'var(--state-error)', blink: true },
};

function StatusPill({ state }: { state: PersonaState }) {
  const { label, tint, dotColor, blink } = PILL_VARIANTS[state];
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 pl-2 text-xs font-medium tracking-[-0.005em] ${tint}`}
    >
      <motion.span
        className="size-1.5 rounded-full"
        style={{ background: dotColor }}
        animate={blink ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
        transition={{ duration: 1, repeat: blink ? Infinity : 0, ease: 'easeInOut' }}
      />
      {label}
    </div>
  );
}

// Ring animation variants per state. Ring index (1|2|3) selects a progressively larger ring
// so outer rings lag slightly behind inner rings during pulse, matching the original cascade.
function ringAnimation(state: PersonaState, ringIndex: 1 | 2 | 3, reduceMotion: boolean) {
  if (reduceMotion) return { animate: undefined, transition: undefined, extraStyle: undefined };
  if (state === 'listening') {
    return {
      animate: { scale: [1, 1.25], opacity: [1, 0] },
      transition: {
        duration: 1.4,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        delay: (ringIndex - 1) * 0.15,
      },
      extraStyle: { borderColor: 'rgba(22,163,74,0.5)' } as React.CSSProperties,
    };
  }
  if (state === 'speaking') {
    return {
      animate: { scale: [1, 1.25], opacity: [1, 0] },
      transition: {
        duration: 1.1,
        repeat: Infinity,
        ease: 'easeInOut' as const,
        delay: (ringIndex - 1) * 0.12,
      },
      extraStyle: { borderColor: 'rgba(29,78,216,0.5)' } as React.CSSProperties,
    };
  }
  if (state === 'thinking') {
    return {
      animate: { rotate: 360 },
      transition: { duration: 2, repeat: Infinity, ease: 'linear' as const },
      extraStyle: {
        borderStyle: 'dashed',
        borderColor: 'rgba(180,83,9,0.35)',
      } as React.CSSProperties,
    };
  }
  return { animate: undefined, transition: undefined, extraStyle: undefined };
}

function AgentAvatar({ state, initial }: { state: PersonaState; initial: string }) {
  const reduceMotion = useReducedMotion() ?? false;
  const ringSizes: Array<{ ring: 1 | 2 | 3; size: number; baseOpacity: number }> = [
    { ring: 3, size: 68, baseOpacity: 0.4 },
    { ring: 2, size: 58, baseOpacity: 0.7 },
    { ring: 1, size: 48, baseOpacity: 1 },
  ];

  return (
    <div className="relative flex size-16 items-center justify-center [@media(max-height:640px)]:size-14 max-[480px]:size-14">
      {ringSizes.map(({ ring, size, baseOpacity }) => {
        const anim = ringAnimation(state, ring, reduceMotion);
        return (
          <motion.div
            key={ring}
            className="absolute rounded-full border border-border transition-[width,height] duration-700 ease-in-out"
            style={{
              width: size,
              height: size,
              opacity: baseOpacity,
              ...(anim.extraStyle ?? {}),
            }}
            animate={anim.animate}
            transition={anim.transition}
          />
        );
      })}
      <div className="relative flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-[0_4px_12px_rgba(0,0,0,0.15),_inset_0_1px_0_rgba(255,255,255,0.1)] [@media(max-height:640px)]:size-9 max-[480px]:size-9">
        <svg
          viewBox="0 0 40 40"
          width="32"
          height="32"
          aria-hidden="true"
          className="[@media(max-height:640px)]:size-5 max-[480px]:size-5"
        >
          <defs>
            <linearGradient id="persona-avatar-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#3a3a3a" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#persona-avatar-grad)" />
          <text
            x="20"
            y="26"
            textAnchor="middle"
            fontSize="16"
            fontWeight="500"
            fill="#fff"
            fontFamily="var(--font-display), serif"
            fontStyle="italic"
          >
            {initial}
          </text>
        </svg>
      </div>
    </div>
  );
}

// mm:ss counter, paused when `running` is false. Parent remounts this via a key prop bump
// to reset the count — lets us stay on useState(0) instead of a reset effect.
function CallTimer({ running }: { running: boolean }) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return (
    <div className="font-mono text-xs tracking-[-0.02em] text-muted-foreground tabular-nums">
      {m}:{s}
    </div>
  );
}

export interface PersonaProps {
  state: PersonaState;
  /** Agent display name; rendered in italic serif under the avatar. */
  name?: string;
  /** Short status-sentence shown above the pill. Empty string renders a fixed-height
   *  placeholder so the block height doesn't jump between hint and no-hint. */
  hint?: string;
  /** Bump this to reset the mm:ss timer. Re-mounts the inner timer via React key. */
  resetKey?: number;
}

export function Persona({
  state,
  name = 'Agent',
  hint,
  resetKey = 0,
}: PersonaProps) {
  const initial = (name.trim()[0] ?? 'a').toLowerCase();
  return (
    <div className="flex w-full max-w-3xl items-center gap-5 rounded-2xl border border-border bg-surface/55 py-3.5 pl-3.5 pr-5 shadow-[0_1px_2px_rgba(0,0,0,0.02),_0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-surface/55 dark:bg-surface/5 dark:supports-[backdrop-filter]:bg-surface/5 [@media(max-height:640px)]:gap-3 [@media(max-height:640px)]:p-2 [@media(max-height:640px)]:pr-3.5 max-[480px]:gap-3 max-[480px]:p-2.5 max-[480px]:pr-3.5 2xl:max-w-4xl">
      <AgentAvatar state={state} initial={initial} />
      <div className="flex shrink-0 flex-col gap-2 max-[480px]:gap-1.5">
        <div className="font-display text-2xl italic leading-none tracking-[-0.015em] text-foreground [@media(max-height:640px)]:text-xl max-[480px]:text-xl">
          {name}
        </div>
        {hint !== undefined && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={hint || 'empty'}
              className="min-h-[19px] font-display text-sm italic leading-snug tracking-[-0.005em] text-muted-foreground [@media(max-height:640px)]:min-h-[17px] [@media(max-height:640px)]:text-xs max-[480px]:min-h-[17px] max-[480px]:text-xs [@media(max-height:500px)]:hidden"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {hint}
            </motion.div>
          </AnimatePresence>
        )}
        <div className="flex items-center gap-3">
          <StatusPill state={state} />
          <CallTimer key={resetKey} running={state !== 'error'} />
        </div>
      </div>
    </div>
  );
}

export default Persona;
