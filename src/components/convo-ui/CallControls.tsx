'use client';

import { IconButton } from './IconButton';
import { Icons } from './Icons';

export interface CallControlsProps {
  muted: boolean;
  setMuted: (v: boolean) => void;
  paused: boolean;
  setPaused: (v: boolean) => void;
  onEnd?: () => void;
}

/**
 * CallControls — floating glass-morph bar composing five round IconButtons plus a hairline
 * divider before the hangup. Drop this into `position: fixed bottom-0` in real usage; on
 * the /design catalog it sits inside a Cell stage. The `backdrop-blur-xl` + `bg-surface/80`
 * pair is the signature glass look shared with the mobile transcript sheet.
 */
export function CallControls({
  muted,
  setMuted,
  paused,
  setPaused,
  onEnd,
}: CallControlsProps) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/80 p-2.5 shadow-md backdrop-blur-xl">
      <IconButton
        icon={muted ? Icons.micOff : Icons.mic}
        label="Mute"
        active={muted}
        onClick={() => setMuted(!muted)}
        size={44}
      />
      <IconButton
        icon={paused ? Icons.play : Icons.pause}
        label={paused ? 'Resume' : 'Pause'}
        onClick={() => setPaused(!paused)}
        size={44}
      />
      <IconButton icon={Icons.speaker} label="Speaker" size={44} />
      <IconButton icon={Icons.more} label="More" variant="ghost" size={44} />
      <div className="h-6 w-px bg-muted" aria-hidden="true" />
      <IconButton
        icon={Icons.hangup}
        label="End call"
        variant="danger"
        size={44}
        onClick={onEnd}
      />
    </div>
  );
}

export default CallControls;
