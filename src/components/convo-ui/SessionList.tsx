'use client';

export interface SessionRowProps {
  title: string;
  time: string;
  duration: string;
  agent: string;
  unread?: boolean;
  active?: boolean;
  accent?: string;
}

function SessionRow({
  title,
  time,
  duration,
  agent,
  unread,
  active,
  accent,
}: SessionRowProps) {
  return (
    <div
      className={`relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 ${
        active ? 'bg-muted' : 'bg-transparent hover:bg-muted/50'
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-sm bg-warm-6"
        />
      )}
      <div
        aria-hidden="true"
        className="relative size-8 shrink-0 rounded-full"
        style={{ background: accent ?? 'linear-gradient(135deg, #7C5CFF, #E85C8A, #F5A55C)' }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_50%)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">
          {title}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span>{agent}</span>
          <span aria-hidden="true">·</span>
          <span>{duration}</span>
        </div>
      </div>
      <div className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
        {time}
      </div>
      {unread && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 size-1.5 rounded-full bg-voice-b"
        />
      )}
    </div>
  );
}

// Six canonical sessions — each entry's `accent` gradient matches the voice used.
// These also power the composition in section 12.
export const SESSIONS: SessionRowProps[] = [
  {
    title: 'Billing question — plan upgrade',
    time: '2m ago',
    duration: '4:32',
    agent: 'Aria',
    active: true,
    accent: 'linear-gradient(135deg, #7C5CFF, #E85C8A)',
  },
  {
    title: 'Schedule dental appointment',
    time: '1h ago',
    duration: '2:18',
    agent: 'Kai',
    accent: 'linear-gradient(135deg, #3D6BCC, #7C5CFF)',
  },
  {
    title: 'Refund for order #8821',
    time: '3h ago',
    duration: '6:05',
    agent: 'Aria',
    unread: true,
    accent: 'linear-gradient(135deg, #7C5CFF, #E85C8A)',
  },
  {
    title: 'Voice onboarding — new user',
    time: 'Yesterday',
    duration: '8:44',
    agent: 'Nova',
    accent: 'linear-gradient(135deg, #F5A55C, #E85C8A)',
  },
  {
    title: 'Technical support — router setup',
    time: 'Yesterday',
    duration: '12:17',
    agent: 'Onyx',
    accent: 'linear-gradient(135deg, #2A2924, #6B6862)',
  },
  {
    title: 'Flight rebooking to SFO',
    time: '2d ago',
    duration: '5:22',
    agent: 'Aria',
    accent: 'linear-gradient(135deg, #7C5CFF, #E85C8A)',
  },
];

export interface SessionListProps {
  compact?: boolean;
}

/**
 * SessionList — scrollable list of past voice calls. Active row gets a paper-1 fill + a
 * 3px paper-6 indicator bar on the leading edge; unread rows get a voice-b dot. `compact`
 * trims the list to the first 4 entries for use in denser layouts.
 */
export function SessionList({ compact = false }: SessionListProps) {
  const rows = compact ? SESSIONS.slice(0, 4) : SESSIONS;
  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((s, i) => (
        <SessionRow key={i} {...s} />
      ))}
    </div>
  );
}

export default SessionList;
