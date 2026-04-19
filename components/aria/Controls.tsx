'use client';

import { VoiceSelector } from './VoiceSelector';
import type { AriaState } from './types';

function IconMic({ muted }: { muted: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      {muted && <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />}
    </svg>
  );
}

function IconEnd() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M3 10.5a12 12 0 0 1 18 0v2.3a1.5 1.5 0 0 1-1 1.4l-3 1a1.5 1.5 0 0 1-1.8-.9l-.7-2a1.5 1.5 0 0 0-1.1-1 10 10 0 0 0-3.8 0 1.5 1.5 0 0 0-1.1 1l-.7 2A1.5 1.5 0 0 1 6.5 15l-3-1a1.5 1.5 0 0 1-1-1.4z"
        transform="rotate(135 12 12)"
      />
    </svg>
  );
}

function IconKeyboard() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="10" x2="6" y2="10" />
      <line x1="10" y1="10" x2="10" y2="10" />
      <line x1="14" y1="10" x2="14" y2="10" />
      <line x1="18" y1="10" x2="18" y2="10" />
      <line x1="7" y1="14" x2="17" y2="14" />
    </svg>
  );
}

export interface ControlsProps {
  state: AriaState;
  muted: boolean;
  voice: string;
  onVoiceChange: (id: string) => void;
  onToggleMute: () => void;
  onEnd: () => void;
  onRestart: () => void;
  // Optional dev helper — cycles through visual states for design QA. Hidden in prod.
  onCycle?: () => void;
}

const isDev = process.env.NODE_ENV !== 'production';

export function Controls({
  state,
  muted,
  voice,
  onVoiceChange,
  onToggleMute,
  onEnd,
  onRestart,
  onCycle,
}: ControlsProps) {
  if (state === 'ended') {
    return (
      <div className="controls">
        <button type="button" className="ctrl-btn ctrl-primary" onClick={onRestart}>
          Start new call
        </button>
      </div>
    );
  }

  return (
    <div className="controls">
      <VoiceSelector voice={voice} onVoiceChange={onVoiceChange} />

      <button
        type="button"
        className={`ctrl-btn ${muted ? 'ctrl-active' : ''}`}
        onClick={onToggleMute}
        title={muted ? 'Unmute' : 'Mute'}
        aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
        aria-pressed={muted}
      >
        <IconMic muted={muted} />
      </button>

      <button
        type="button"
        className="ctrl-btn"
        title="Keyboard input (coming soon)"
        aria-label="Keyboard input"
        disabled
      >
        <IconKeyboard />
      </button>

      <button
        type="button"
        className="ctrl-btn ctrl-end"
        onClick={onEnd}
        title="End call"
        aria-label="End call"
      >
        <IconEnd />
      </button>

      {isDev && onCycle && (
        <button
          type="button"
          className="ctrl-cycle"
          onClick={onCycle}
          title="Dev: cycle visual state"
        >
          <span className="ctrl-cycle-dot" />
          Cycle state
        </button>
      )}
    </div>
  );
}
