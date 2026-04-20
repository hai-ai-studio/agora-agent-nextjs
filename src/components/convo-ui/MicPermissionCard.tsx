'use client';

export type MicPermissionState = 'prompt' | 'requesting' | 'granted' | 'denied';

export interface MicPermissionCardProps {
  state?: MicPermissionState;
  onGrant?: () => void;
  onDeny?: () => void;
}

const HEADLINE: Record<MicPermissionState, string> = {
  prompt: 'Allow microphone access',
  requesting: 'Waiting for permission…',
  granted: 'Microphone connected',
  denied: 'Microphone blocked',
};

const BODY: Record<MicPermissionState, string> = {
  prompt:
    "Aria needs to hear your voice to have a conversation. Audio is processed in real-time and never stored without consent.",
  requesting: 'Your browser will show a permission popup.',
  granted: "You're all set. Aria is ready to talk.",
  denied:
    'Enable microphone in your browser settings to start voice conversations.',
};

/**
 * MicPermissionCard — four-state permission card. Prompt shows the dual CTA (Not now /
 * Allow mic); requesting adds a pulse ring around the icon; granted is the success terminal;
 * denied swaps to red tint + "how to enable" path. Icon is an inline SVG with a gradient
 * fill ref keyed to voice-a → voice-b so the two mic states read consistently.
 */
export function MicPermissionCard({
  state = 'prompt',
  onGrant,
  onDeny,
}: MicPermissionCardProps) {
  const isDenied = state === 'denied';
  const isRequesting = state === 'requesting';
  return (
    <div className="flex w-[22.5rem] flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center shadow-lg">
      <div
        className={`relative flex size-[72px] items-center justify-center rounded-full ${
          isDenied ? 'bg-[#FDECEC]' : 'bg-gradient-to-br from-voice-a/10 via-voice-b/10 to-voice-c/10'
        }`}
      >
        <div
          className={`absolute inset-1.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] ${
            isDenied ? 'bg-[#FDECEC]' : 'bg-surface'
          }`}
        />
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          className="relative"
          aria-hidden="true"
        >
          {isDenied ? (
            <path
              d="M9 9v2a3 3 0 0 0 4.5 2.6M15 11V6a3 3 0 0 0-6 0v1M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-1 3.5M12 18v3M3 3l18 18"
              stroke="var(--destructive)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <>
              <defs>
                <linearGradient id="mic-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--voice-a)" />
                  <stop offset="100%" stopColor="var(--voice-b)" />
                </linearGradient>
              </defs>
              <rect
                x="9"
                y="3"
                width="6"
                height="12"
                rx="3"
                stroke="url(#mic-grad)"
                strokeWidth="2"
              />
              <path
                d="M5 11a7 7 0 0 0 14 0M12 18v3"
                stroke="url(#mic-grad)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
        {isRequesting && (
          <span
            aria-hidden="true"
            className="absolute -inset-1 rounded-full border-2 border-voice-a animate-pulse-ring"
          />
        )}
      </div>
      <div>
        <div className="text-[17px] font-semibold text-foreground">
          {HEADLINE[state]}
        </div>
        <div className="mx-auto mt-1.5 max-w-[17.5rem] text-[13px] leading-normal text-muted-foreground">
          {BODY[state]}
        </div>
      </div>
      {state === 'prompt' && (
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={onDeny}
            className="flex-1 cursor-pointer rounded-xl border border-border bg-transparent px-3.5 py-2.5 font-ui text-[13px] font-medium text-foreground"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onGrant}
            className="flex-1 cursor-pointer rounded-xl border-0 bg-foreground px-3.5 py-2.5 font-ui text-[13px] font-medium text-background shadow-sm"
          >
            Allow mic
          </button>
        </div>
      )}
      {state === 'denied' && (
        <button
          type="button"
          className="cursor-pointer rounded-xl border-0 bg-foreground px-4 py-2.5 font-ui text-[13px] font-medium text-background"
        >
          How to enable
        </button>
      )}
    </div>
  );
}

export default MicPermissionCard;
