# 0002 — Tailwind-first styling with CSS scoped to tokens + keyframes

- Date: 2026-04-20
- Status: Accepted
- Supersedes: hand-written CSS class taxonomy in `globals.css` (`.persona`, `.viz`, `.bubble`, `.ctrl-btn`, …) from the original Aria port

## Context

The Aria design was ported pixel-accurately from an external reference (a standalone HTML file using classical CSS classes). The first pass put ~900 lines of CSS into `globals.css` — class-per-component selectors like `.persona`, `.viz-row`, `.ctrl-btn`. This duplicates the React component tree in CSS and creates two places to edit per change.

Two forces pushed us to rewrite:

1. **Next.js convention** is Tailwind utilities on JSX. Developers copying this quickstart expect that; hand-written classes add friction.
2. **Every class in `globals.css` was referenced exactly once** (from its corresponding component). No reuse meant no abstraction win, just indirection.

## Decision

**Tailwind utilities on JSX for everything the class-based CSS was doing.** Keep `globals.css` only for things Tailwind handles poorly:

1. Design tokens (`:root` light + dark via `@media (prefers-color-scheme: dark)`).
2. `@keyframes` referenced by Tailwind animation utilities in `tailwind.config.ts`.
3. `body` base rule (font-family, color, background).

Everything else — spacing, typography, colors, borders, hover states — moves into `className=` on the JSX.

**Token bridge** is `tailwind.config.ts theme.extend.colors` mapping token names (`ink`, `bg`, `line`, `pill-listen`, `wf-agent`) to `var(--ink)` etc. Components write `bg-ink`, `text-ink-3`, `border-line`, which resolve to the tokens. Tokens flip in dark mode; utilities automatically follow.

## Consequences

**Good:**

- `globals.css` shrinks from ~1070 lines to ~130 lines (tokens + body + keyframes).
- Each component self-contains its styling. Grep for a visual tweak lands on one file, not two.
- Dark mode works via token override, not Tailwind's `dark:` variant. No per-utility dark variants cluttering the JSX.
- Aligns with `components/ui/*` (shadcn), which already uses Tailwind utilities.

**Bad:**

- `className` strings are long — 10-15 utilities is common for a styled card. Extracting shared fragments into `const FOO = '...'` helps for repeated patterns but adds indirection.
- Arbitrary-value utilities (`bg-[#fef2f2]`, `shadow-[0_8px_24px_rgba(...)]`) leak raw hex / px into JSX. Tolerated for one-off editorial tints that don't justify a token.
- State-cascaded decoration (e.g. `.ambient-listening .blob-1 { background: … }`) can't be Tailwind utilities. Those stay as CSS under `@media` or with parent classes. `Ambient.tsx` handles this with `useSyncExternalStore(matchMedia)` + inline styles — see [0003-motion-over-css-keyframes](./0003-motion-over-css-keyframes.md).

## What stays in `globals.css` (canonical list)

- `:root` tokens (light)
- `@media (prefers-color-scheme: dark) :root` token overrides
- `body` base (font + color + background)
- No component selectors. No class-per-element. No state-modifier CSS.

If a rule doesn't fit one of those three categories, it belongs somewhere else (Tailwind utility, inline style, `motion/react` animation).

## Alternatives considered

- **CSS Modules per component.** Rejected: 3rd taxonomy to maintain alongside Tailwind + tokens. Doesn't compose with shadcn.
- **Shift dark mode to Tailwind `dark:` variant.** Rejected: every component would need parallel `dark:bg-...` for every `bg-...`. Token override flips everything at once.
- **Use `@apply` in globals.css to keep the class-per-component taxonomy but with Tailwind under the hood.** Rejected: doesn't fix the two-files-per-change problem; loses locality.
