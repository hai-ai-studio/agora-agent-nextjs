'use client';

export interface VoiceCardProps {
  name: string;
  descriptor: string;
  tags: string[];
  /** CSS gradient string applied to the persona avatar. */
  accent: string;
  selected?: boolean;
  previewActive?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
}

/**
 * VoiceCard — persona tile used by VoicePicker. The card hosts two independent actions:
 * a primary "Select" button (covers the card body) and a secondary "Preview" button
 * (small circle, top-right). They are siblings, not nested — nesting interactive
 * controls violates WCAG 4.1.2 (screen readers can't focus the inner). The Select
 * button is absolutely-positioned to cover the card background; the Preview button
 * sits on top via z-index so its click isn't eaten by the Select button.
 */
export function VoiceCard({
  name,
  descriptor,
  tags,
  accent,
  selected,
  previewActive,
  onSelect,
  onPreview,
}: VoiceCardProps) {
  return (
    <div
      className={`relative flex flex-col gap-2.5 rounded-2xl p-3.5 font-ui transition-all duration-200 ease-aria-out ${
        selected
          ? 'bg-gradient-to-br from-white to-muted shadow-md ring-1 ring-accent'
          : 'border border-border bg-surface shadow-sm'
      }`}
    >
      {/* Primary Select action — covers the whole card background. The visible content
          (avatar / labels / tags) lives above this button via z-10 so it renders on top. */}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Select ${name}`}
        className="absolute inset-0 cursor-pointer rounded-2xl border-none bg-transparent"
      />

      <div className="pointer-events-none relative z-10 flex items-center gap-3">
        <div
          aria-hidden="true"
          className="relative size-10 shrink-0 overflow-hidden rounded-full"
          style={{ background: accent }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5),transparent_50%)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">{name}</div>
          <div className="mt-px text-xs text-muted-foreground">{descriptor}</div>
        </div>
        {/* Preview button — pointer-events-auto re-enables clicks on this specific
            element (its ancestor has pointer-events-none to let clicks reach the Select
            button, but Preview needs to capture its own clicks). */}
        <button
          type="button"
          onClick={onPreview}
          aria-label={previewActive ? `Stop preview of ${name}` : `Play preview of ${name}`}
          className={`pointer-events-auto flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 ${
            previewActive ? 'bg-warm-6 text-accent-foreground' : 'bg-muted text-foreground'
          }`}
        >
          {previewActive ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <rect x="3" y="2" width="2" height="8" rx="0.5" />
              <rect x="7" y="2" width="2" height="8" rx="0.5" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M3 2v8l7-4z" />
            </svg>
          )}
        </button>
      </div>
      <div className="pointer-events-none relative z-10 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default VoiceCard;
