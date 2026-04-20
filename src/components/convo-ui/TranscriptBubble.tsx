export type TranscriptRole = 'user' | 'agent';

export interface TranscriptBubbleProps {
  role?: TranscriptRole;
  text: string;
  timestamp?: string;
  /** Show the blinking caret (still-streaming partial turn). */
  streaming?: boolean;
  /** Dim + italicize — reserved for the user's intermediate ASR hypothesis. */
  interim?: boolean;
}

/**
 * TranscriptBubble — asymmetric-corner chat bubble. Agent bubbles sit left-aligned with a
 * gradient avatar dot and a paper-bright fill; user bubbles sit right-aligned with a dark
 * fill (read as "you" — private, on-device). The streaming caret uses animate-caret-blink.
 */
export function TranscriptBubble({
  role = 'agent',
  text,
  timestamp,
  streaming = false,
  interim = false,
}: TranscriptBubbleProps) {
  const isAgent = role === 'agent';
  return (
    <div
      className={`flex animate-slide-up ${isAgent ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`flex max-w-[80%] flex-col gap-1 ${isAgent ? 'items-start' : 'items-end'}`}
      >
        <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {isAgent && (
            <span className="inline-block size-3.5 rounded-full bg-gradient-to-br from-voice-a via-voice-b to-voice-c" />
          )}
          <span>{isAgent ? 'Ada' : 'You'}</span>
          {timestamp && <span className="text-muted-foreground">· {timestamp}</span>}
        </div>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-[1.55] [text-wrap:pretty] shadow-sm ${
            isAgent
              ? 'border border-border bg-surface text-surface-foreground'
              : 'border-0 bg-foreground text-background'
          } ${isAgent ? 'rounded-tl-[4px]' : 'rounded-tr-[4px]'} ${
            interim ? 'italic' : ''
          }`}
        >
          {text}
          {streaming && (
            <span
              aria-hidden="true"
              className={`ml-[3px] inline-block h-3.5 w-0.5 align-text-bottom animate-caret-blink ${
                isAgent ? 'bg-voice-b' : 'bg-background'
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default TranscriptBubble;
