export interface BargeInIndicatorProps {
  active?: boolean;
}

/**
 * BargeInIndicator — uppercase pill that tells the user "you can interrupt" while the agent
 * is speaking, and flips to a rose-tinted active state the moment the user starts talking.
 * The dot uses animate-breathe; the active halo adds animate-pulse-ring on top.
 */
export function BargeInIndicator({
  active = false,
}: BargeInIndicatorProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
        active
          ? 'border-voice-b bg-voice-b/10 text-[#B93E6E]'
          : 'border-border bg-muted text-muted-foreground'
      }`}
    >
      <span className="relative inline-block size-2" aria-hidden="true">
        <span
          className={`absolute inset-0 rounded-full ${
            active ? 'bg-voice-b animate-breathe' : 'bg-warm-4'
          }`}
        />
        {active && (
          <span
            className="absolute -inset-0.5 rounded-full border border-voice-b animate-pulse-ring"
          />
        )}
      </span>
      {active ? 'Interrupting…' : 'Tap to interrupt'}
    </div>
  );
}

export default BargeInIndicator;
