import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Foundations — three-tier token reference.
 *
 * Layer 1 (primitives): raw scales that don't change with theme. Consume directly only
 * in the catalog, in components that deliberately pin one theme, or when a semantic
 * token doesn't apply (Foundations uses them for the hex labels).
 *
 * Layer 2 (semantic): roles that flip under `.dark`. This is what 90%+ of component
 * code should consume.
 *
 * Layer 3 (brand): theme-invariant identity colors — voice gradient.
 *
 * The Semantic story renders each token twice (light stage / dark stage) so the flip
 * behavior is the catalog itself.
 */
const meta: Meta = {
  title: 'Foundations',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Three-tier token reference: primitives (fixed scales), semantic roles (flip with `.dark`), brand (theme-invariant). Each semantic token is shown in both themes side-by-side so the flip is the documentation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/* ============================================================================
 *  Shared helpers
 * ========================================================================== */

function Section({
  num,
  title,
  sub,
  children,
}: {
  num: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-6 flex items-baseline gap-4 border-b border-border pb-3">
        <span className="font-mono text-xs text-muted-foreground">{num}</span>
        <h2 className="m-0 font-display text-[28px] italic leading-none tracking-[-0.01em] text-foreground">
          {title}
        </h2>
        {sub && <span className="ml-auto font-mono text-xs text-muted-foreground">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, hex, note }: { name: string; hex: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-20 rounded-xl border border-border" style={{ background: hex }} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] text-foreground">{name}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{hex}</span>
      </div>
      {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
    </div>
  );
}

/**
 * SemanticRow — renders one semantic role twice: the light-theme value and the
 * dark-theme value, side-by-side. Each sample is a mini card that uses the exact
 * Tailwind utility (bg-surface, text-foreground, etc) inside a theme-pinned wrapper,
 * so what you see is the real rendered output of that utility in each mode.
 */
function SemanticRow({
  utility,
  description,
  children,
}: {
  utility: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(10rem,14rem)_1fr_1fr] items-stretch gap-4 border-b border-border py-4 last:border-0">
      <div className="flex flex-col justify-center gap-1">
        <code className="font-mono text-[12px] text-foreground">{utility}</code>
        {description && (
          <span className="text-[11px] leading-snug text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex min-h-[4.5rem] items-center rounded-xl border border-border bg-background p-3">
        {children}
      </div>
      <div className="dark flex min-h-[4.5rem] items-center rounded-xl border border-border bg-background p-3">
        {children}
      </div>
    </div>
  );
}

/* ============================================================================
 *  WARM primitives (scale)
 * ========================================================================== */

const WARM = Array.from({ length: 12 }, (_, i) => ({
  name: `warm-${i}`,
  hex: [
    '#FAFAF7', '#F4F3EE', '#EAE8E0', '#D7D4C8',
    '#A8A49A', '#6B6862', '#2A2A27', '#0A0A09',
    '#14140F', '#1F1E18', '#2A2924', '#3D3B34',
  ][i],
}));

const VOICE = [
  { n: 'voice-a', v: '#7C5CFF', note: 'Violet' },
  { n: 'voice-b', v: '#E85C8A', note: 'Rose' },
  { n: 'voice-c', v: '#F5A55C', note: 'Amber' },
];

/* ============================================================================
 *  Colors story
 * ========================================================================== */

export const Colors: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl bg-background px-10 py-10 font-ui text-foreground">
      <header className="mb-10">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          Agora · convo-ui · v0.2
        </div>
        <h1 className="m-0 font-display text-[48px] italic leading-none tracking-[-0.02em] text-foreground">
          Three tiers, one vocabulary.
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          Primitives are scales (fixed hex values). Semantic tokens are roles (flip with{' '}
          <code className="font-mono text-[12px] text-foreground">.dark</code>). Brand is
          identity (theme-invariant). Components consume semantic tokens almost
          exclusively; primitives appear only in Foundations or when a surface is
          intentionally pinned to one theme.
        </p>
      </header>

      <Section num="A1" title="Brand · Voice gradient" sub="Signature — theme-invariant">
        <div className="grid grid-cols-[1.2fr_1fr] gap-5">
          <div className="flex flex-col gap-3">
            <div className="h-24 rounded-2xl bg-gradient-to-br from-voice-a via-voice-b to-voice-c" />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Violet → Rose → Amber. Used only for the VoiceOrb, active conversation
              affordances, and the accent role. Never for ambient chrome.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {VOICE.map((s) => (
              <Swatch key={s.n} name={s.n} hex={s.v} note={s.note} />
            ))}
          </div>
        </div>
      </Section>

      <Section
        num="A2"
        title="Primitive · Warm scale"
        sub="0 lightest → 11 darkest"
      >
        <p className="mb-5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
          A single 12-step warm neutral ramp (formerly the <code>paper-0..7</code> +{' '}
          <code>dark-0..4</code> split). Fixed values — pick a step when you need an
          exact shade; otherwise prefer a semantic token.
        </p>
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-6 xl:grid-cols-12">
          {WARM.map((s) => (
            <Swatch key={s.name} name={s.name} hex={s.hex} />
          ))}
        </div>
      </Section>

      <Section
        num="B1"
        title="Semantic · Surface pairs"
        sub="bg-X + text-X-foreground — contrast is a pair-level guarantee"
      >
        <p className="mb-5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
          Each surface has a companion foreground token. Using the pair
          (<code className="font-mono text-[11px] text-foreground">bg-X</code> +{' '}
          <code className="font-mono text-[11px] text-foreground">text-X-foreground</code>)
          guarantees WCAG AA contrast — the tokens are designed together. Rows show the
          pair rendered in Light (left) and Dark (right).
        </p>
        <SemanticRow utility="bg-background + text-foreground" description="Page body.">
          <div className="flex size-full items-center rounded-lg bg-background px-3">
            <span className="text-sm text-foreground">Say hi to Ada.</span>
          </div>
        </SemanticRow>
        <SemanticRow utility="bg-surface + text-surface-foreground" description="Cards.">
          <div className="flex size-full items-center rounded-lg bg-surface px-3 border border-border">
            <span className="text-sm text-surface-foreground">Session · 02:14</span>
          </div>
        </SemanticRow>
        <SemanticRow
          utility="bg-surface-elevated + text-surface-elevated-foreground"
          description="Popovers, menus."
        >
          <div className="flex size-full items-center rounded-lg bg-surface-elevated px-3 border border-border shadow-sm">
            <span className="text-sm text-surface-elevated-foreground">Menu item</span>
          </div>
        </SemanticRow>
        <SemanticRow utility="bg-muted + text-muted-foreground" description="Quiet bg + secondary text.">
          <div className="flex size-full items-center rounded-lg bg-muted px-3 border border-border">
            <span className="text-sm text-muted-foreground">Placeholder text</span>
          </div>
        </SemanticRow>
      </Section>

      <Section
        num="B2"
        title="Semantic · Text levels"
        sub="Two levels. Anything quieter uses opacity."
      >
        <p className="mb-5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
          Only two text levels exist, both AA-compliant. For &ldquo;even quieter&rdquo; cases
          (decorative metadata, ghost placeholders) use Tailwind opacity suffixes:{' '}
          <code className="font-mono text-[11px] text-foreground">text-muted-foreground/60</code>
          . Don&apos;t add new text tokens.
        </p>
        <SemanticRow utility="text-foreground" description="Headings + primary body.">
          <span className="font-ui text-base text-foreground">Agora — voice AI.</span>
        </SemanticRow>
        <SemanticRow utility="text-muted-foreground" description="Captions, help text, overline, metadata.">
          <span className="font-ui text-sm text-muted-foreground">Secondary / muted text.</span>
        </SemanticRow>
        {/* "Use opacity for quieter-than-muted" is documented in prose rather than as a
            rendered swatch — rendering a sub-AA color would make the Foundations story
            itself fail the a11y gate. The guidance: if you need text more muted than
            `text-muted-foreground`, it probably shouldn't be meaningful text. Use
            `text-muted-foreground/X` only on decorative bits (bullet separators, ambient
            labels) that are also marked `aria-hidden` so SR users don't encounter
            unreadable content. */}
      </Section>

      <Section
        num="B3"
        title="Semantic · Borders + Accent + Destructive"
        sub="border · input · ring · accent · destructive"
      >
        <SemanticRow utility="border-border" description="Default hairlines, separators.">
          <div className="flex size-full items-center justify-center rounded-lg border border-border">
            <span className="text-[11px] text-muted-foreground">bordered</span>
          </div>
        </SemanticRow>
        <SemanticRow
          utility="border-input"
          description="Form field borders — meets WCAG 1.4.11 (3:1+)."
        >
          <div className="flex size-full items-center justify-center rounded-lg border-2 border-input bg-surface">
            <span className="text-[11px] text-muted-foreground">form input</span>
          </div>
        </SemanticRow>
        <SemanticRow utility="bg-accent + text-accent-foreground" description="Brand fill pair.">
          <div className="flex size-full items-center justify-center rounded-lg bg-accent">
            <span className="font-ui text-xs font-medium text-accent-foreground">
              Call to action
            </span>
          </div>
        </SemanticRow>
        <SemanticRow
          utility="bg-destructive + text-destructive-foreground"
          description="Danger pair."
        >
          <div className="flex size-full items-center justify-center rounded-lg bg-destructive">
            <span className="font-ui text-xs font-medium text-destructive-foreground">
              End call
            </span>
          </div>
        </SemanticRow>
      </Section>

      <Section
        num="B4"
        title="Semantic · State pills"
        sub="state-listen / -think / -speak / -muted / -error"
      >
        <div className="grid grid-cols-5 gap-3">
          {([
            { k: 'state-listen', label: 'Listening' },
            { k: 'state-think', label: 'Thinking' },
            { k: 'state-speak', label: 'Speaking' },
            { k: 'state-muted', label: 'Muted' },
            { k: 'state-error', label: 'Error' },
          ] as const).map((s) => (
            <div
              key={s.k}
              className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-3"
            >
              <span className="font-mono text-[10px] text-muted-foreground">{s.k}</span>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: `var(--${s.k})` }}
                />
                <span className="font-ui text-[13px] text-foreground">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
          These flip for contrast in dark mode (green/amber/blue/red shift lighter).
        </p>
      </Section>

      <Section num="B5" title="Semantic · Intent" sub="success · warning · info">
        <p className="mb-5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
          For danger / destructive use{' '}
          <code className="font-mono text-[11px] text-foreground">bg-destructive</code>{' '}
          (B3). These three are for non-destructive messaging: confirmations, warnings,
          informational banners.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(['success', 'warning', 'info'] as const).map((t) => (
            <div
              key={t}
              className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-3"
            >
              <span className="font-mono text-[10px] text-muted-foreground">{t}</span>
              <div className="h-6 rounded" style={{ background: `var(--${t})` }} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
};

/* ============================================================================
 *  Typography story
 * ========================================================================== */

export const Typography: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl bg-background px-10 py-10 font-ui text-foreground">
      <header className="mb-10">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          Typography · three families
        </div>
        <h1 className="m-0 font-display text-[48px] italic leading-none tracking-[-0.02em] text-foreground">
          Geist · Instrument Serif · Geist Mono.
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          One sans (UI), one display (italic serif accents), one mono (data + code). The
          earlier Inter Tight + JetBrains Mono pair retired with the token refactor.
        </p>
      </header>

      <Section num="C1" title="font-ui — Geist" sub="300 · 400 · 500 · 600 · 700">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
          <div className="font-ui text-[48px] font-medium leading-none tracking-[-0.02em]">
            A conversation that listens.
          </div>
          <div className="flex flex-wrap items-baseline gap-6 border-t border-border pt-4">
            {[300, 400, 500, 600, 700].map((w) => (
              <div key={w} className="flex flex-col gap-0.5">
                <div className="font-ui text-2xl" style={{ fontWeight: w }}>
                  Voice AI
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">{w}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section num="C2" title="font-display — Instrument Serif" sub="Italic · display accents">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
          <div className="font-display text-[56px] italic leading-none tracking-[-0.015em] text-foreground">
            Say hi to Ada.
          </div>
          <div className="font-display text-[24px] italic text-foreground">
            Listening… keep talking.
          </div>
          <div className="font-display text-sm italic text-muted-foreground">
            Transcript will appear here once you start talking.
          </div>
        </div>
      </Section>

      <Section num="C3" title="font-mono — Geist Mono" sub="400 · 500">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
          <div className="font-mono text-3xl font-medium">180ms · en_US</div>
          <div className="font-mono text-sm text-muted-foreground">
            AGORA · CONVO-UI · v0.2
          </div>
        </div>
      </Section>

      <Section num="C4" title="Scale ramp" sub="Reference sizes used across the library">
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-6">
          {[
            { label: 'display/hero', size: 64, family: 'font-display italic' },
            { label: 'display/section', size: 32, family: 'font-display italic' },
            { label: 'heading/lg', size: 24, family: 'font-ui font-medium' },
            { label: 'body/lg', size: 17, family: 'font-ui' },
            { label: 'body/base', size: 15, family: 'font-ui' },
            { label: 'body/sm', size: 13, family: 'font-ui' },
            { label: 'caption', size: 12, family: 'font-ui text-muted-foreground' },
            {
              label: 'overline',
              size: 10,
              family: 'font-mono uppercase tracking-[0.12em] text-muted-foreground',
            },
          ].map((r) => (
            <div
              key={r.label}
              className="flex items-baseline gap-4 border-b border-border py-2 last:border-0"
            >
              <div className={r.family} style={{ fontSize: r.size }}>
                The quick fox jumps
              </div>
              <div className="ml-auto font-mono text-[10px] text-muted-foreground">
                {r.label} · {r.size}px
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
};

/* ============================================================================
 *  Motion story
 * ========================================================================== */

function KeyframeCell({
  label,
  token,
  children,
}: {
  label: string;
  token: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-ui text-sm font-medium text-foreground">{label}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{token}</div>
      </div>
      <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-background">
        {children}
      </div>
    </div>
  );
}

function EaseCurveCell({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-baseline justify-between gap-2">
        <div className="font-ui text-sm font-medium text-foreground">{name}</div>
        <div className="font-mono text-[10px] text-muted-foreground">{value}</div>
      </div>
      <div className="relative flex h-12 items-center rounded-full border border-border bg-background px-2">
        <div
          className="size-3 rounded-full bg-voice-b"
          style={{ animation: `ease-demo 2.4s ${value} infinite alternate` }}
        />
      </div>
      <style>{`
        @keyframes ease-demo {
          from { transform: translateX(0); }
          to { transform: translateX(260px); }
        }
      `}</style>
    </div>
  );
}

export const Motion: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl bg-background px-10 py-10 font-ui text-foreground">
      <Section num="D1" title="Keyframes" sub="Live loops">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KeyframeCell label="breathe" token="animate-breathe">
            <span className="size-5 rounded-full bg-voice-b animate-breathe" />
          </KeyframeCell>
          <KeyframeCell label="pulse-ring" token="animate-pulse-ring">
            <span className="relative inline-block size-5">
              <span className="absolute inset-0 rounded-full bg-voice-a" />
              <span className="absolute inset-0 rounded-full bg-voice-a opacity-50 animate-pulse-ring" />
            </span>
          </KeyframeCell>
          <KeyframeCell label="typing-dot" token="animate-typing-dot">
            <span className="inline-flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-foreground animate-typing-dot"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </KeyframeCell>
          <KeyframeCell label="caret-blink" token="animate-caret-blink">
            <span className="font-display text-2xl italic text-foreground">
              Live
              <span className="ml-1 inline-block h-5 w-0.5 bg-voice-b align-middle animate-caret-blink" />
            </span>
          </KeyframeCell>
          <KeyframeCell label="slide-up" token="animate-slide-up">
            <span className="rounded-full bg-foreground px-3 py-1.5 font-ui text-xs text-background animate-slide-up">
              Just arrived
            </span>
          </KeyframeCell>
          <KeyframeCell label="rotate-slow" token="animate-rotate-slow">
            <svg width="40" height="40" viewBox="0 0 40 40" className="animate-rotate-slow">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="var(--foreground)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6 6"
              />
            </svg>
          </KeyframeCell>
        </div>
      </Section>

      <Section num="D2" title="Ease curves" sub="Semantic ease tokens">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <EaseCurveCell name="ease-voice-out" value="cubic-bezier(0.16, 1, 0.3, 1)" />
          <EaseCurveCell name="ease-organic" value="cubic-bezier(0.32, 0.72, 0, 1)" />
          <EaseCurveCell name="ease-spring" value="cubic-bezier(0.5, 1.4, 0.4, 1)" />
        </div>
        <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
          <strong className="text-foreground">voice-out</strong> — the default for state
          changes and layout transitions. Fast start, long trailing settle.{' '}
          <strong className="text-foreground">organic</strong> — used on the VoiceOrb
          breathe and other natural-feeling loops.{' '}
          <strong className="text-foreground">spring</strong> — light overshoot for
          micro-interactions (button press, dropdown open).
        </p>
      </Section>
    </div>
  ),
};
