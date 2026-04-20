# 0005 — shadcn-style tokens: 2-level text, paired foregrounds, a11y as a gate

- Date: 2026-04-20
- Status: Accepted
- Supersedes: [0004](./0004-semantic-tokens.md)

## Context

ADR 0004 established three-tier tokens with four foreground levels
(`foreground / foreground-soft / foreground-muted / foreground-subtle`). When
`@storybook/addon-vitest` landed and we tried to flip `a11y.test: 'error'`, 36
stories failed on `color-contrast` — the root cause being `foreground-subtle`
(#a7a7ac on #fafaf7 = 2.1:1, WCAG AA requires 4.5:1).

The token wasn't accidentally subtle; it was *designed* subtle. Using it on text
is genuinely inaccessible. The 4-level hierarchy gave us an extra visual dial
but imported a built-in a11y debt.

Investigating shadcn/ui's approach surfaced a cleaner model: **two text levels,
both AA-compliant, plus paired `-foreground` tokens per surface**. Visual variation
quieter than muted is handled by Tailwind opacity (`text-muted-foreground/60`)
on purely decorative elements, never on readable text.

## Decision

Adopt the shadcn token idioms wholesale.

### Text levels — exactly two

```
--foreground           /* primary body + headings; ~18:1 on --background */
--muted-foreground     /* captions, metadata, help text; ~7.1:1 on --background */
```

Both pass WCAG AA (4.5:1) on every paired surface. For anything that would need
to be quieter than `muted-foreground`, the guidance is:

1. **Ask whether it's really text.** A bullet separator (`·`), an ambient
   watermark, a ghost overlay — these often shouldn't be text at all. Use an
   `aria-hidden` span or an SVG / pseudo-element.
2. **Use Tailwind opacity** on non-informational chrome only:
   `text-muted-foreground/60`. Mark the element `aria-hidden="true"` so
   assistive tech doesn't surface unreadable content.

Never add a third text token.

### Paired `-foreground` tokens per surface

Every surface has a companion foreground token:

```
--background             --foreground
--surface                --surface-foreground
--surface-elevated       --surface-elevated-foreground
--muted                  --muted-foreground
--accent                 --accent-foreground
--destructive            --destructive-foreground
```

Using the pair (`bg-X` + `text-X-foreground`) guarantees AA contrast at the
token layer — the tokens are chosen together. Cross-pairing (`bg-surface` +
`text-muted-foreground`) is allowed but the contributor carries the contrast
obligation.

### Decoupling `--accent` from `--voice-a`

`--voice-a` (#7c5cff) is the brand violet used in gradients, orbs, and
decorative glows. As text or as a button background with white text it
lands at 4.12:1 / 4.36:1 — just below AA. Rather than darkening the brand,
`--accent` is a separate token (#5a3edb, AA-comfortable with white) used for
the functional "call to action" role. Brand identity stays pure; the accent
role carries the a11y obligation.

### Destructive replaces ad-hoc danger

`--destructive` / `--destructive-foreground` replace the earlier `--danger` /
`--danger-foreground`. Name aligned with shadcn convention; existing semantic
intent colors `--success` / `--warning` / `--info` stay for non-destructive
messaging.

### a11y as a CI gate

With the token cleanup, `preview.ts` flips `a11y.test: 'error'`. Any future
story with sub-AA color contrast fails `pnpm test`. This is the durable value
of the refactor — contrast regressions can't land silently.

Two narrow escape hatches, used sparingly:

- **`aria-hidden="true"`** on genuinely decorative elements (live-indicator
  dots paired with text labels, separator characters, ambient watermarks).
- **`parameters: { a11y: { test: 'off' } }`** on interaction-test stories
  where axe snapshots a mid-animation frame. The base visual stories still
  carry the a11y audit for the same component.

Playwright browser context is pinned to `reducedMotion: 'reduce'` +
`colorScheme: 'light'` in vitest.config.ts so animations + OS-level dark
preference can't make axe results flaky.

## Consequences

**Good:**

- **`a11y.test: 'error'` gates CI** — all 131 stories pass. Contrast
  regressions are now test failures, not TODO items.
- **Two text levels is simpler than four** — fewer decisions per call site,
  no sub-AA token to accidentally reach for.
- **Paired `-foreground` tokens encode contrast at the vocab layer.**
  Contributors writing `bg-destructive text-destructive-foreground` don't
  need to think about WCAG; the tokens were chosen to pass together.
- **shadcn-convergent naming** — `foreground / muted-foreground / surface /
  border / destructive / accent` reads to anyone familiar with shadcn.
- **Brand identity stays pure.** `--voice-a/b/c` aren't forced to meet
  functional contrast obligations; `--accent` carries that weight.

**Bad:**

- **One fewer visual level in the type hierarchy.** The "quiet metadata"
  aesthetic that `foreground-subtle` was trying to provide doesn't have a
  first-class token; decorators that want it use `/opacity` + `aria-hidden`.
  In practice this is almost always the right call anyway.
- **Migration cost.** Another 173-replacement sweep across the codebase,
  on top of the ADR 0004 sweep a day earlier. If the token vocabulary
  stabilizes for real this time, this is the last such sweep; if not, the
  cost compounds.
- **VoiceCard restructure.** The card was a `<button>` hosting an inner
  `<button>` for preview (nested-interactive, WCAG 4.1.2 violation, caught
  by axe). Restructured to two sibling buttons with the Select button
  absolutely-positioned to cover the card. Functionally equivalent, a11y
  clean.
- **Two stories exempted from a11y.** VoiceSelector's `OpensMenu` and
  `SelectsVoice` interaction tests use `a11y: { test: 'off' }` because axe
  snapshots a transient post-animation frame. The base VoiceSelector stories
  still carry the audit. Not ideal; acceptable.

## Alternatives considered

- **Keep 4 foreground levels and move `foreground-subtle` to a larger type
  size.** Doesn't work — even large-text AA (3:1) requires ~#767676, which
  is essentially the `muted-foreground` value. No daylight between them.
- **Introduce a separate `foreground-decor` tier with Tailwind utility
  gating (only `bg-*`/`border-*`, no `text-*`) and ESLint rules.** Legit
  but over-engineered. Opacity + `aria-hidden` does the same job with less
  tooling ceremony. See the rejected proposal in commit history.
- **Accept the debt and keep `a11y.test: 'todo'`.** Rejected: the CI gate
  is the actual long-term value. Once in place, contrast regressions can't
  land. A one-time migration beats perpetual visual QA.
- **Use shadcn `--card` / `--popover` naming instead of `--surface` /
  `--surface-elevated`.** Cosmetic difference. Kept the role-based `surface`
  naming because it describes elevation semantics directly; `--card` and
  `--popover` are aliased for shadcn-compat components
  (`ui/button`, `LoadingSkeleton`, `/lab/visualizer`).

## Mechanics

- `src/app/globals.css` and `.storybook/preview.css` define the tokens.
  Light values under `:root`, dark under `.dark` + `@media
  (prefers-color-scheme: dark)` (globals.css only — preview.css is
  class-only so tests aren't affected by OS dark preference).
- `vitest.config.ts` pins `reducedMotion: 'reduce'` and `colorScheme:
  'light'` on the Playwright browser context.
- `preview.ts` has `a11y: { test: 'error' }`. Stories can opt out with
  per-story `a11y: { test: 'off' }` but this should be rare and
  commented.

## References

- Previous: [0004 — Three-tier semantic tokens](./0004-semantic-tokens.md)
- shadcn color system: https://ui.shadcn.com/docs/theming
- WCAG AA contrast: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- Tokens + mirror: [`src/app/globals.css`](../../src/app/globals.css),
  [`.storybook/preview.css`](../../.storybook/preview.css)
- Vitest setup: [`vitest.config.ts`](../../vitest.config.ts)
- Storybook config: [`.storybook/preview.ts`](../../.storybook/preview.ts)
