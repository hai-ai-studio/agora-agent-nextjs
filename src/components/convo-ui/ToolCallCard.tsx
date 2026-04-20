export type ToolCallStatus = 'running' | 'success' | 'error';

export interface ToolCallCardProps {
  name: string;
  status?: ToolCallStatus;
  args?: Record<string, string>;
  result?: string;
  duration?: string;
}

type StatusMeta = { dotClass: string; label: string; pulse?: boolean };

const STATUS: Record<ToolCallStatus, StatusMeta> = {
  running: { dotClass: 'bg-warning', label: 'Running', pulse: true },
  success: { dotClass: 'bg-success', label: 'Complete' },
  error: { dotClass: 'bg-danger', label: 'Failed' },
};

/**
 * ToolCallCard — shows one tool invocation with JSON args and a status dot. Inline syntax
 * colors use `text-voice-a` for keys and `text-voice-c` for values so the card reads as
 * "tool-adjacent" without being a full syntax highlighter. Pairs with animate-slide-up to
 * enter from below during a live call.
 */
export function ToolCallCard({
  name,
  status = 'running',
  args,
  result,
  duration,
}: ToolCallCardProps) {
  const meta = STATUS[status];
  const argEntries = args ? Object.entries(args) : [];

  return (
    <div className="rounded-xl border border-border bg-surface p-3 font-mono text-xs animate-slide-up">
      <div className="flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m8 6 4 4-4 4M14 16h6"
            stroke="var(--voice-a)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="flex-1 font-medium text-foreground">{name}</span>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span
            className={`size-1.5 rounded-full ${meta.dotClass} ${meta.pulse ? 'animate-breathe' : ''}`}
          />
          {meta.label}
          {duration && <span className="text-muted-foreground">· {duration}</span>}
        </span>
      </div>
      {argEntries.length > 0 && (
        <div className="mt-2 rounded-md bg-muted p-2 text-[11px] leading-normal text-foreground">
          <span className="text-muted-foreground">{'{ '}</span>
          {argEntries.map(([k, v], i) => (
            <span key={k}>
              <span className="text-accent">{k}</span>
              <span className="text-muted-foreground">: </span>
              <span className="text-foreground">&quot;{v}&quot;</span>
              {i < argEntries.length - 1 && (
                <span className="text-muted-foreground">, </span>
              )}
            </span>
          ))}
          <span className="text-muted-foreground">{' }'}</span>
        </div>
      )}
      {result && status === 'success' && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="text-success">→</span>
          {result}
        </div>
      )}
      {result && status === 'error' && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-danger">
          <span>×</span>
          {result}
        </div>
      )}
    </div>
  );
}

export default ToolCallCard;
