'use client';

// Brand mark — round ink chip with concentric-circle glyph, followed by an italic
// serif label. Two shapes:
//   - "Agora"              (no agentName — used pre-call, when the agent is still
//                           hypothetical and the hero positions "your agent")
//   - "Ada · Agora"        (agentName provided — used in-call, when the user is
//                           actually talking to a named agent)
// Landing + conversation screens share the glyph so the visual signature is stable.

export interface BrandMarkProps {
  /** Agent display name. When omitted, renders just the product (no separator). */
  agentName?: string;
  /** Product / host name. Always shown. */
  productName?: string;
  /** Diameter of the round ink chip in px. Default 32. */
  size?: number;
  /** Size variant for the label text. `lg` is default; `sm` shrinks for tight headers. */
  labelSize?: 'sm' | 'md' | 'lg';
}

export function BrandMark({
  agentName,
  productName = 'Agora',
  size = 32,
  labelSize = 'lg',
}: BrandMarkProps) {
  const glyphSize = Math.round(size * (18 / 32));
  const labelClass =
    labelSize === 'lg'
      ? 'text-2xl max-[360px]:text-lg'
      : labelSize === 'md'
        ? 'text-xl'
        : 'text-base';

  return (
    <div className="flex items-center gap-2.5 text-foreground">
      <div
        // text-background (not text-accent-foreground) so the chip stays legible when `.dark` flips `--ink`
        // to light — `--bg` flips in lockstep, so chip + glyph always contrast.
        className="flex shrink-0 items-center justify-center rounded-full bg-foreground text-background"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          width={glyphSize}
          height={glyphSize}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="7" opacity="0.5" />
          <circle cx="12" cy="12" r="11" opacity="0.2" />
        </svg>
      </div>
      <span className={`font-display italic tracking-[-0.01em] ${labelClass}`}>
        {agentName ? (
          <>
            {agentName}
            <span className="text-muted-foreground"> · </span>
            <span className="text-muted-foreground">{productName}</span>
          </>
        ) : (
          productName
        )}
      </span>
    </div>
  );
}

export default BrandMark;
