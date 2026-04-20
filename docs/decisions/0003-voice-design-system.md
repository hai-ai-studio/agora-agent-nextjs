# 0003 — Voice Agent Design System coexists with Aria

- Date: 2026-04-20
- Status: Superseded by [0004 — Three-tier semantic tokens](./0004-semantic-tokens.md)
- Supersedes: nothing (additive)

## Context

The existing Aria style (concentric-ring `Persona`, two-row bar `Waveform`, glass pill `Controls` dock, Inter Tight sans + Instrument Serif display) ships the conversation UI today. A reference Voice Agent design system arrived with:

- A different signature: canvas-drawn `VoiceOrb` + voice gradient (violet → rose → amber) as a recurring mark
- A different type pairing: Geist + Geist Mono (instead of Inter Tight + JetBrains Mono)
- A wider component catalog: 18 components covering personas, transcripts, tool calls, permission, audio playback, sessions, language pickers
- A numeric `paper-0..7` warm-neutral scale going from lightest paper (0) to max-contrast ink (7) — opposite direction to the existing Aria `--ink-2..4` tokens, which are dark shades

Doing a hard replacement would invalidate the current conversation UI, which just had a responsive pass + a Tailwind scale-snap pass. Doing nothing leaves the reference unused.

## Decision

Coexist. Both design languages live in the repo:

- **Aria** — the existing token set + components under `src/features/conversation/components/*`. Keeps `--ink`, `--ink-2..4`, `--bg`, `--bg-2`, `--pill-*`, Inter Tight via `font-sans`. Continues to power `/` (landing + conversation).
- **Voice Agent DS** — new token set + 20 components + 1 hook under the working name `convo-ui`, lives in-tree at `src/components/convo-ui/`. Adds `--voice-a/b/c`, `--paper-0..7`, `--dark-0..4`, `--ok/warn/err/info`, Geist via `font-geist`. Powers `/design` (dev catalog) and is the canonical starting point for future UI work. An earlier revision of this ADR scoped it as a workspace package at `packages/convo-ui/`; that layer got rolled back to reduce monorepo complexity while the API is still churning. Extraction (npm package, shadcn registry, or both) is a future plan, not this one.

The DS catalog lives at `/design` and is not linked from public navigation; it is a developer reference.

## Consequences

**Good:**

- No regression on the shipped conversation UI. All Aria screens render exactly as before.
- New features can reach for DS primitives immediately without a migration blocker.
- Canvas-drawn components (VoiceOrb, LinearWave, CircleWave) give the DS a recognizable motion signature that HTML/SVG alone can't match.
- Tokens and fonts are namespaced so Aria utilities (`text-ink`, `font-sans`) and DS utilities (`text-paper-7`, `font-geist`) never collide in Tailwind.

**Bad:**

- Two type families load on any page that mixes them (today: only the shared layout loads both — Geist is only *used* on `/design`). One extra network roundtrip per font family; mitigated by `display: swap`.
- Two palettes increase cognitive load. Contributors need to know which set to reach for; the rule-of-thumb is "Aria for the conversation feature, DS for everything else".
- Drift is possible over time. If the conversation UI gets touched without migrating to DS primitives, the two styles can evolve separately. Mitigation: a future plan (not this one) is expected to migrate the conversation feature to DS primitives once the catalog is used elsewhere.
- Keyframes in `globals.css` have grown: `accordion-down/up` (shadcn) + `breathe`, `pulse-ring`, `typing-dot`, `caret-blink`, `slide-up`, `rotate-slow` (DS). Tailwind references them by name via `animate-*` utilities. No collision with Aria animations (motion/react handles those).

## Naming reconciliation

The reference's own `--ink-0..7` scale conflicts semantically with Aria's existing `--ink-2..4` (Aria 2 is dark; reference 2 is light). Expose the reference scale as `--paper-0..7` in our CSS and Tailwind config. Reference-faithful in spirit ("paper-like warm neutrals" per the source's own description), unambiguous in our utility namespace.

## Alternatives considered

- **Hard replace Aria with the DS.** Rejected: the conversation UI just landed a multi-phase Aria polish pass; replacing immediately burns that investment and risks feature regressions.
- **Only port the tokens + `/design` page (no real components).** Rejected: without real components, the catalog would be a design mockup, not a usable library. The user's explicit ask was "整合所有的组件库到项目中".
- **Expose the reference scale as `ink-0..7` by renaming the existing Aria tokens.** Rejected: renames propagate through every Aria component. High-risk global refactor for a naming win.

## References

- Plan: [`docs/plans/completed/2026-04-20-voice-design-system.md`](../plans/completed/2026-04-20-voice-design-system.md)
- DS catalog page: `/design` (source: `src/app/design/page.tsx`)
- Components: `src/components/convo-ui/` (in-tree, future extraction deferred)
- Tokens: `src/app/globals.css` (@theme block — Tailwind v4 uses CSS-first config)
- Storybook config: `.storybook/` at the repo root
