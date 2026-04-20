# 0004 — Three-tier semantic tokens, one vocabulary

- Date: 2026-04-20
- Status: Superseded by [0005 — shadcn-style tokens](./0005-shadcn-tokens.md)
- Supersedes: [0003](./0003-voice-design-system.md)

## Context

ADR 0003 established two parallel token vocabularies — Aria (semantic: `--ink`, `--bg`,
`--pill-*`, flips with theme) and Voice DS (scales: `--paper-0..7`, `--dark-0..4`,
fixed). They were separated by intent: Aria was theme-aware by design, the DS was a
fixed warm-neutral ramp plus an explicit dark scale.

In practice, coexistence produced three compounding problems:

1. **Dark mode broke at component boundaries.** Aria components (`Persona`,
   `Transcript`, …) used flip-tokens and mostly worked. DS components (`VoicePicker`,
   `SessionList`, …) used paper primitives and were effectively light-only. Composed
   surfaces that mixed the two (the `/design` showcase, every Composition story) had
   half-flipped text/bg pairs in dark mode.
2. **Contributors guessed wrong half the time.** "Is `bg-paper-0` or `bg-bg` the right
   page background?" had no compositional answer. The rule-of-thumb "Aria for the
   conversation feature, DS for everything else" didn't survive the convo-ui migration,
   where both systems needed to coexist inside one folder.
3. **Storybook theme toggle was a lie on most stories.** Flipping Light / Dark in the
   toolbar did nothing on any story that used DS tokens (majority of convo-ui), because
   those tokens don't flip by design. Users reading the catalog had no way to see most
   components' dark-mode appearance.

The dual vocabulary was a pragmatic bridge, not a durable architecture.

## Decision

Collapse to a single three-tier token architecture:

**Layer 1 — Primitives (fixed scales).**
- `--warm-0..11`: warm neutral ramp (merges the old `paper-0..7` + `dark-0..4`).
- `--voice-a / b / c`: the violet / rose / amber brand gradient.
- Primitives don't flip. They're referenced directly only in Foundations catalogs, in
  components that deliberately pin one theme, or when no semantic token applies.

**Layer 2 — Semantic roles (flip under `.dark`).**
- Surfaces: `--background`, `--surface`, `--surface-elevated`, `--surface-sunken`.
- Foregrounds: `--foreground`, `--foreground-soft`, `--foreground-muted`,
  `--foreground-subtle`.
- Borders: `--border`, `--border-strong`.
- Brand roles: `--accent` (defaults to `--voice-a`), `--accent-foreground`.
- State: `--state-listen`, `--state-think`, `--state-speak`, `--state-muted`,
  `--state-error`.
- Intent: `--success`, `--warning`, `--danger`, `--info`.
- Component code consumes these almost exclusively.

**Layer 3 — Brand (theme-invariant).**
- `--voice-a / b / c` are also exposed as brand primitives — the violet→rose→amber
  gradient stays the same under any theme because it's the product's identity.

Components consume semantic tokens. `.dark` anywhere in the ancestor tree swaps the
semantic values in a single cascade pass — individual components never write `dark:`
variants, never gate on theme, never branch on `isDark`.

## Why three tiers (and why shadcn-style names)

The primitives/semantic/brand split is industry-convergent: shadcn/ui, Radix, Material
3, Apple HIG all separate "raw values" from "roles". Using the shadcn naming —
`background`, `foreground`, `surface`, `border`, `accent`, `destructive` — also keeps
the existing `ui/button`, `LoadingSkeleton`, `ErrorBoundary`, and `/lab/visualizer`
components working without change. The legacy HSL-triple tokens that wrapped
`hsl(var(--background))` are gone; `--color-*` now resolves directly to the hex
semantic.

## Consequences

**Good:**

- **Dark mode just works.** One `.dark` at the root flips every semantic token at
  once; every downstream component updates. No per-component `dark:` variants, no
  ambient-audit passes, no half-flipped surfaces.
- **Storybook theme toggle is meaningful everywhere.** Flipping Light / Dark produces
  a real visual change on every story that uses semantic tokens — which is now all of
  them.
- **One vocabulary, uniform mental model.** Contributors stop choosing between "Aria
  or DS". There's one question: "which role does this surface play?"
- **Primitives remain available.** The `warm-0..11` scale + `voice-a/b/c` are still
  Tailwind utilities (`bg-warm-8`, `from-voice-a`). Used for Foundations catalogs,
  gradients, and "intentionally pinned" surfaces.
- **Single font family per role.** Geist (UI) + Instrument Serif (display) + Geist
  Mono (mono). Inter Tight + JetBrains Mono retired in the same pass — two fewer
  network roundtrips, one fewer typeface to reason about.

**Bad:**

- **One-time migration touched ~35 files, ~524 utility-class swaps.** Mostly
  mechanical (regex sweep); lower risk than it looks. Anything subtle is behind the
  `pnpm lint / typecheck / build / build-storybook` gate.
- **The "Aria" brand name drops out of tokens.** It remains as a product-visual
  reference (`features/conversation`) but `--ink` / `--pill-*` are gone from the CSS.
- **Visual shifts, marginal.** Some tokens shifted hue slightly where the old shadcn
  HSL triples were hue-different from the warm palette (e.g. `--primary` was a cyan
  blue, now points at `--voice-a` violet). Legacy `/lab/visualizer` inherits these
  shifts and reads slightly different.
- **Always-dark surfaces require explicit intent.** The old pattern "wrap this subtree
  in `.dark` so the semantic tokens resolve to dark" still works but is now the
  exception rather than the norm. Compositions that demo a dark call stage no longer
  pin themselves — they follow the root theme. If a future composition genuinely
  needs to be dark regardless of theme, it opts in with a local `.dark` wrapper.

## Alternatives considered

- **Stick with the Aria + DS coexistence from ADR 0003.** Rejected: the Storybook
  dark-mode regression was the proximate trigger for this refactor; leaving it would
  leave the half-flipped state permanent.
- **Add `.dark` overrides to the paper scale.** Rejected on ADR 0003's own reasoning:
  `paper-0` as a name implies "the lightest step" — flipping its value in dark mode
  destroys the name's meaning. A scale is not a role.
- **Keep DS scales, add a parallel semantic layer on top.** Plausible but cosmetic —
  still two vocabularies, still two rules-of-thumb. The collapse to one vocabulary is
  the actual win.
- **Follow tailwindcss-themer / per-theme CSS files.** Rejected: Tailwind v4's @theme
  + `:root` / `.dark` variable overrides achieves the same effect with zero build-time
  tooling and no third-party dependency.

## Mechanics

- `src/app/globals.css` holds the source of truth: primitives on top, semantic roles
  below (with a `.dark` override block + `@media (prefers-color-scheme: dark)` fallback
  for users who don't toggle).
- `.storybook/preview.css` mirrors globals.css so Storybook renders identically to the
  running Next app, including the theme-toggle behavior.
- Storybook's `backgrounds` parameter no longer sets a default (the iframe body CSS
  paints `--background` directly, which flips with the theme toolbar). Pinned
  backgrounds remain available as `fixed-light` / `fixed-dark` for stories that
  genuinely need them.
- Typography: `--font-ui` (Geist), `--font-display` (Instrument Serif), `--font-mono`
  (Geist Mono). next/font variables stay under family-specific names
  (`--font-geist-sans`, `--font-geist-mono-face`, `--font-instrument-serif`) and are
  aliased one layer up.

## References

- Previous: [0003 — Voice Agent Design System coexists with Aria](./0003-voice-design-system.md)
- Tokens: [`src/app/globals.css`](../../src/app/globals.css) and
  [`.storybook/preview.css`](../../.storybook/preview.css) (mirror)
- Catalog: [`/design`](../../src/app/design/page.tsx) + Storybook `Foundations` story
- Component library: [`src/components/convo-ui/`](../../src/components/convo-ui/)
- Guide: [`docs/guides/CONVO_UI.md`](../guides/CONVO_UI.md)
