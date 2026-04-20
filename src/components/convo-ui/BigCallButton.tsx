'use client';

import { Icons } from './Icons';

export type BigCallButtonState = 'idle' | 'ringing' | 'active';

export interface BigCallButtonProps {
  state?: BigCallButtonState;
  onClick?: () => void;
}

/**
 * BigCallButton — 72px round primary call button. Idle/ringing states use the dark paper-7
 * fill; active (mid-call) flips to red with an expanding halo ring. Ringing adds its own
 * pulse-ring so the button reads as "incoming / awaiting answer" before the call connects.
 */
export function BigCallButton({
  state = 'idle',
  onClick,
}: BigCallButtonProps) {
  const isActive = state === 'active';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isActive ? 'End call' : state === 'ringing' ? 'Ringing' : 'Start call'}
      className={`relative flex size-[72px] cursor-pointer items-center justify-center rounded-full border-0 transition-all duration-[250ms] ease-voice-out ${
        isActive
          ? 'bg-danger text-accent-foreground shadow-[0_0_0_6px_rgba(201,68,68,0.15)]'
          : 'bg-foreground text-background shadow-md'
      }`}
    >
      {isActive ? Icons.hangup : Icons.phone}
      {state === 'ringing' && (
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-full border-2 border-foreground/30 animate-pulse-ring"
        />
      )}
    </button>
  );
}

export default BigCallButton;
