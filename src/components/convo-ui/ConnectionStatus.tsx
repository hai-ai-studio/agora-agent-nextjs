'use client';

import { motion } from 'motion/react';

// Header-row connection signal. Pulsing colored dot + short label, optionally followed by
// a second muted badge (by default "End-to-end encrypted"). Used in the conversation
// header to replace a raw "connected?" truthy read with a self-contained block.

export type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'error';

const VARIANTS: Record<
  ConnectionState,
  { label: string; color: string; glow: string; pulse: boolean }
> = {
  connected: {
    label: 'Connected',
    color: '#16a34a',
    glow: 'rgba(22,163,74,0.15)',
    pulse: true,
  },
  connecting: {
    label: 'Connecting',
    color: '#b45309',
    glow: 'rgba(180,83,9,0.15)',
    pulse: true,
  },
  reconnecting: {
    label: 'Reconnecting',
    color: '#b45309',
    glow: 'rgba(180,83,9,0.15)',
    pulse: true,
  },
  error: {
    label: 'Disconnected',
    color: '#b91c1c',
    glow: 'rgba(185,28,28,0.15)',
    pulse: false,
  },
};

export interface ConnectionStatusProps {
  status: ConnectionState;
  /** Override the default label ("Connected" / "Connecting" / etc). */
  label?: string;
  /** Secondary muted badge shown after the dot. Pass `false` to hide; omit for the
   *  default "End-to-end encrypted" copy. Hidden below the `md` breakpoint regardless. */
  secondary?: string | false;
}

export function ConnectionStatus({
  status,
  label,
  secondary = 'End-to-end encrypted',
}: ConnectionStatusProps) {
  const v = VARIANTS[status];
  const displayLabel = label ?? v.label;

  return (
    <div className="flex gap-5 font-mono text-xs tracking-[-0.01em] text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <motion.span
          className="size-2 rounded-full"
          style={{ background: v.color, boxShadow: `0 0 0 3px ${v.glow}` }}
          animate={v.pulse ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
          transition={{ duration: 2, repeat: v.pulse ? Infinity : 0, ease: 'easeInOut' }}
        />
        {displayLabel}
      </span>
      {secondary && (
        <span className="inline-flex items-center gap-2 text-muted-foreground max-md:hidden">
          {secondary}
        </span>
      )}
    </div>
  );
}

export default ConnectionStatus;
