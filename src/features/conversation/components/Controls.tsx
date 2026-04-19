'use client';

import type { IMicrophoneAudioTrack } from 'agora-rtc-react';
import { MicPicker } from './MicPicker';
import { VoiceSelector } from './VoiceSelector';
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

// "CC" caption glyph — reads as "transcript / live captions" which is what the side panel is.
function IconCaptions() {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 11h2" />
      <path d="M7 15h2" />
      <path d="M13 11h4" />
      <path d="M13 15h4" />
    </svg>
  );
}

export interface ControlsProps {
  muted: boolean;
  voice: string;
  onVoiceChange: (id: string) => void;
  onToggleMute: () => void;
  onEnd: () => void;
  // Passed into MicPicker so the chevron next to the mic button can enumerate + swap devices.
  localMicrophoneTrack?: IMicrophoneAudioTrack | null;
  // Controls the side transcript panel. Button is shown in the active "on" style when visible.
  transcriptVisible?: boolean;
  onToggleTranscript?: () => void;
}

// Utility class fragments for the dock buttons. Pulled out so the variants below stay readable.
const DOCK_PILL =
  'flex items-center gap-2.5 rounded-full border border-line bg-white/70 px-2 py-2 shadow-[0_2px_4px_rgba(0,0,0,0.03),_0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/70';

const CTRL_BTN =
  'flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-ink transition-colors duration-150 hover:bg-black/5 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent';

// Active toggle variant — dark fill with inverted icon color. `!` importance on bg + text
// is needed for the same reason as CTRL_END: CTRL_BTN's `bg-transparent` and `text-ink` can
// win over these in the generated CSS depending on Tailwind class emit order.
const CTRL_ACTIVE = '!bg-ink !text-white hover:!bg-ink-2';

// End-call variant — red fill, darker red on hover. Both `!bg-*` importance flags are
// required: without them, `bg-transparent` / `hover:bg-black/5` from CTRL_BTN can win in
// the cascade depending on Tailwind class emit order, making the hangup button render
// transparent or gray instead of the expected red.
const CTRL_END =
  '!bg-[#dc2626] text-white hover:!bg-[#b91c1c]';

export function Controls({
  muted,
  voice,
  onVoiceChange,
  onToggleMute,
  onEnd,
  localMicrophoneTrack = null,
  transcriptVisible = false,
  onToggleTranscript,
}: ControlsProps) {
  return (
    <div className={DOCK_PILL}>
      <VoiceSelector voice={voice} onVoiceChange={onVoiceChange} />

      <div className="relative inline-flex items-center gap-0.5">
        <button
          type="button"
          className={`${CTRL_BTN} ${muted ? CTRL_ACTIVE : ''}`}
          onClick={onToggleMute}
          title={muted ? 'Unmute' : 'Mute'}
          aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={muted}
        >
          <IconMic muted={muted} />
        </button>
        <MicPicker localMicrophoneTrack={localMicrophoneTrack} />
      </div>

      {onToggleTranscript && (
        <button
          type="button"
          className={`${CTRL_BTN} ${transcriptVisible ? CTRL_ACTIVE : ''}`}
          onClick={onToggleTranscript}
          title={transcriptVisible ? 'Hide transcript' : 'Show transcript'}
          aria-label={transcriptVisible ? 'Hide transcript' : 'Show transcript'}
          aria-pressed={transcriptVisible}
        >
          <IconCaptions />
        </button>
      )}

      <button
        type="button"
        className={`${CTRL_BTN} ${CTRL_END}`}
        onClick={onEnd}
        title="End call"
        aria-label="End call"
      >
        <IconEnd />
      </button>
    </div>
  );
}
