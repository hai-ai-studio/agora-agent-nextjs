'use client';

import { useEffect, useState } from 'react';
import { ARIA_AGENT_NAME, type AriaState } from './types';

const PILL_MAP: Record<AriaState, { label: string; cls: string }> = {
  idle: { label: 'Ready', cls: 'pill-idle' },
  listening: { label: 'Listening', cls: 'pill-listen' },
  thinking: { label: 'Thinking', cls: 'pill-think' },
  speaking: { label: 'Speaking', cls: 'pill-speak' },
  muted: { label: 'Muted', cls: 'pill-muted' },
  error: { label: 'Reconnecting', cls: 'pill-error' },
  ended: { label: 'Call ended', cls: 'pill-ended' },
};

function StatusPill({ state }: { state: AriaState }) {
  const { label, cls } = PILL_MAP[state];
  return (
    <div className={`status-pill ${cls}`}>
      <span className="pill-dot" />
      {label}
    </div>
  );
}

function AgentAvatar({ state }: { state: AriaState }) {
  const active = state === 'listening' || state === 'speaking' || state === 'thinking';
  return (
    <div className={`avatar ${active ? 'avatar-active' : ''} avatar-${state}`}>
      <div className="avatar-ring avatar-ring-3" />
      <div className="avatar-ring avatar-ring-2" />
      <div className="avatar-ring avatar-ring-1" />
      <div className="avatar-core">
        <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
          <defs>
            <linearGradient id="aria-avatar-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#3a3a3a" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#aria-avatar-grad)" />
          <text
            x="20"
            y="26"
            textAnchor="middle"
            fontSize="16"
            fontWeight="500"
            fill="#fff"
            fontFamily="var(--font-serif), serif"
            fontStyle="italic"
          >
            a
          </text>
        </svg>
      </div>
    </div>
  );
}

// mm:ss counter, paused when call is in a terminal state. Parent remounts this via a
// key prop bump to reset the count — lets us stay on useState(0) instead of a reset effect.
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
    <div className="timer">
      {m}:{s}
    </div>
  );
}

export interface PersonaProps {
  state: AriaState;
  // Bump to force the call timer to remount at 0:00. Optional — callers can omit this
  // and rely on natural mount/unmount to reset the counter.
  resetKey?: number;
  name?: string;
  subtitle?: string;
}

export function Persona({
  state,
  resetKey = 0,
  name = ARIA_AGENT_NAME,
  subtitle = '· your assistant',
}: PersonaProps) {
  return (
    <div className="persona">
      <AgentAvatar state={state} />
      <div className="persona-meta">
        <div className="persona-name">
          {name}
          <span className="persona-sub">{subtitle}</span>
        </div>
        <div className="persona-row">
          <StatusPill state={state} />
          <CallTimer
            key={resetKey}
            running={state !== 'ended' && state !== 'error'}
          />
        </div>
      </div>
    </div>
  );
}
