export interface LiveSubtitleProps {
  text: string;
  speaker?: 'agent' | 'user';
}

/**
 * LiveSubtitle — dark overlay caption for full-screen call views. The component is
 * intrinsically dark (captions over video / voice stage), so it consumes primitive
 * `warm-*` values for text + bg rather than semantic tokens — that way contrast is
 * guaranteed regardless of the root theme. Speaker tag distinguishes agent (voice-b
 * rose) from user (voice-a violet); both colors pass 4.5:1 on the warm-7 stage.
 */
export function LiveSubtitle({
  text,
  speaker = 'agent',
}: LiveSubtitleProps) {
  return (
    <div className="max-w-[35rem] rounded-2xl bg-warm-7 px-5 py-3.5 text-center text-[17px] leading-snug tracking-[-0.01em] text-warm-0 shadow-lg backdrop-blur-xl">
      <div
        className={`mb-1 font-mono text-[10px] uppercase tracking-widest ${
          speaker === 'agent' ? 'text-voice-b' : 'text-warm-2'
        }`}
      >
        {speaker === 'agent' ? 'Aria' : 'You'}
      </div>
      <div className="[text-wrap:balance]">
        {text}
        <span
          aria-hidden="true"
          className="ml-[3px] inline-block h-4 w-0.5 bg-voice-b align-text-bottom animate-caret-blink"
        />
      </div>
    </div>
  );
}

export default LiveSubtitle;
