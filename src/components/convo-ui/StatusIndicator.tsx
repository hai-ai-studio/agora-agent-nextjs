'use client';

export type StatusState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted'
  | 'error';

export interface StatusIndicatorProps {
  state?: StatusState;
  size?: 'sm' | 'md';
}

type Config = {
  label: string;
  /** Hex literal — used for the inline dot background since dynamic state → CSS var isn't
   *  Tailwind-expressible without class-map explosion. */
  color: string;
  pulse: boolean;
  dots?: boolean;
};

const CONFIGS: Record<StatusState, Config> = {
  idle: { label: 'Ready', color: '#A8A49A', pulse: false },
  listening: { label: 'Listening', color: '#2A2A27', pulse: true },
  thinking: { label: 'Thinking', color: '#6B6862', pulse: true, dots: true },
  speaking: { label: 'Speaking', color: '#E85C8A', pulse: true },
  muted: { label: 'Muted', color: '#A8A49A', pulse: false },
  error: { label: 'Error', color: '#C94444', pulse: false },
};

/**
 * StatusIndicator — breathing-dot pill describing agent state. The dot pulses via
 * `animate-breathe` + a `animate-pulse-ring` halo; thinking adds three typing dots.
 * Used in the orb stages, the live call header, and anywhere the agent's current
 * activity needs to read as a short label.
 */
export function StatusIndicator({
  state = 'idle',
  size = 'md',
}: StatusIndicatorProps) {
  const c = CONFIGS[state];
  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 font-medium text-foreground backdrop-blur-md ${
        isSmall ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]'
      }`}
    >
      <span
        className="relative inline-block size-2"
        aria-hidden="true"
      >
        <span
          className={`absolute inset-0 rounded-full ${c.pulse ? 'animate-breathe' : ''}`}
          style={{ background: c.color }}
        />
        {c.pulse && (
          <span
            className="absolute inset-0 rounded-full opacity-40 animate-pulse-ring"
            style={{ background: c.color }}
          />
        )}
      </span>
      <span>{c.label}</span>
      {c.dots && (
        <span className="-ml-0.5 inline-flex gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-[3px] rounded-full animate-typing-dot"
              style={{ background: c.color, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      )}
    </div>
  );
}

export default StatusIndicator;
