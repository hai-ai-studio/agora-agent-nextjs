# 0007 — Dark mode via `prefers-color-scheme` token overrides, not Tailwind `dark:` variants

- Date: 2026-04-20
- Status: Accepted

## Context

Two common ways to implement dark mode in a Tailwind + CSS-variable codebase:

1. **Tailwind `dark:` variants.** Every utility gets a dark variant: `bg-white dark:bg-black`, `text-ink dark:text-white`, `border-line dark:border-[rgba(255,255,255,0.1)]`. `darkMode: "class"` or `"media"` in `tailwind.config.ts` controls how the `dark:` variant activates.

2. **Token overrides.** CSS custom properties (`--bg`, `--ink`, `--line`, etc.) have light values in `:root` and dark values in `@media (prefers-color-scheme: dark) :root`. Tailwind utilities resolve to `var(--ink)` etc., which flip automatically. No `dark:` variant anywhere in the JSX.

The Aria design already had a token palette (`--bg`, `--ink`, `--line`, `--wf-agent`, `--pill-*`, etc.) as its source of truth. The question was whether to add parallel `dark:` utilities or flip tokens.

## Decision

**Token override.** Dark mode is implemented by:

1. `tailwind.config.ts` maps Aria tokens to CSS variables: `ink: 'var(--ink)'`, `bg: 'var(--bg)'`, etc.
2. `darkMode: "media"` in `tailwind.config.ts` — `dark:` variant tracks OS preference (not toggled manually).
3. `src/app/globals.css` defines light tokens in `:root` and dark overrides in `@media (prefers-color-scheme: dark) :root`.
4. Components use Tailwind utilities (`bg-ink`, `text-ink-3`, `border-line`). No `dark:` variants.
5. Non-token dark visuals — ambient blob gradients, grain opacity — read `useSyncExternalStore(matchMedia)` in the component and branch inline (see `Ambient.tsx`).

## Consequences

**Good:**

- No `dark:` utilities cluttering JSX. `bg-white/55 dark:bg-black/5` pattern is replaced by `bg-white/55` alone, with the token doing the flip.
- Adding a new component means writing one set of utilities, not two. Dark mode "just works" as long as tokens are used.
- Token overrides compose naturally with shadcn components in `/lab/visualizer` (the legacy HSL token block also flips via the same `@media` rule).
- `prefers-color-scheme` means users without a manual toggle still get dark if their OS is dark. No toggle UI required.

**Bad:**

- Components can't opt out of dark mode per-instance. (Not a real constraint today; we have no such case.)
- No manual light/dark toggle. Users who want to override their OS preference can't, short of browser-level dark-mode extensions. Acceptable for a demo.
- Hard-coded colors outside the token system (rare — used for pill tints) need explicit `dark:` workarounds. Currently handled with Tailwind arbitrary-value utilities like `bg-[#ecfdf5] dark:bg-[rgba(34,197,94,0.12)]` in `PILL_VARIANTS`. Not ideal; the mitigation is keeping these to a small number.

## Mixed case: non-token decorative visuals

Ambient blob gradients can't be tokens (each blob is a radial-gradient string; you'd need 12 tokens for 6 blobs × 2 modes). `Ambient.tsx` handles this by reading `prefers-color-scheme: dark` via `useSyncExternalStore(window.matchMedia)` and selecting the right gradient string inline. The tradeoff: JS re-evaluates on SSR mismatch, so dark users see a brief light flash on first paint. Accepted because the blobs are decorative.

## Alternatives considered

- **Tailwind `dark:` variants everywhere.** Rejected: doubles the utility count per component; doesn't compose with the existing token palette we already have.
- **`darkMode: "class"` + manual toggle.** Rejected: no UI toggle in this demo; OS preference is sufficient.
- **CSS-only (no Tailwind for colors at all).** Rejected: loses Tailwind's hover/focus variant compositing.

## Related

- [0002-tailwind-first-styling](./0002-tailwind-first-styling.md) — parent decision about Tailwind-on-JSX.
- The token list lives in `src/app/globals.css`.
- The token → Tailwind utility bridge lives in `tailwind.config.ts theme.extend.colors`.
