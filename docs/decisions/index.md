# Decisions

Architectural decision records (ADRs). Each file captures: context that forced the choice, the decision, consequences (good and bad), and alternatives considered. New choices add a new numbered file; when a choice is superseded, the new file notes which it replaces.

## Index

| # | Title | Status |
|---|---|---|
| [0001](./0001-src-features-layout.md) | `src/features/<feature>/` layout | Accepted |
| [0002](./0002-tailwind-first-styling.md) | Tailwind-first styling with CSS scoped to tokens + keyframes | Accepted |
| [0003](./0003-motion-over-css-keyframes.md) | `motion/react` first, CSS `@keyframes` as fallback | Accepted |
| [0004](./0004-no-state-library-yet.md) | No global state library (no Zustand, no Redux) yet | Accepted |
| [0005](./0005-zod-at-boundaries-only.md) | Zod at boundaries only (API routes + env + RTM payloads) | Proposed |
| [0006](./0006-aria-skin-ada-agent.md) | "Aria" is the design skin, "Ada" is the agent | Superseded by [0008](./0008-retire-aria-skin-name.md) |
| [0007](./0007-dark-mode-via-tokens.md) | Dark mode via `prefers-color-scheme` token overrides | Accepted |
| [0008](./0008-retire-aria-skin-name.md) | Retire the "Aria" skin name | Accepted |

## Conventions

- Numbering is sequential. Don't skip; don't reorder.
- Status is one of `Proposed`, `Accepted`, `Superseded by NNNN`.
- When a decision is superseded, keep the old file (don't delete); update its Status line to point at the replacement.
- Add a new ADR when: a durable architectural choice is made, or a prior choice is overturned. Skip ADRs for tactical choices that one future commit could undo (e.g. button colors).
- Keep each ADR short — context in a paragraph, decision in one or two, consequences as a bulleted list. If it grows beyond ~100 lines the scope is probably too broad; split.
