# Aria → Tailwind Refactor

> Date: 2026-04-20
> Goal: Move component-level styling out of `globals.css` and into Tailwind utility classes on the JSX. Keep CSS for things Tailwind handles poorly: design tokens, keyframes, state-cascaded custom properties, complex selectors, and OS-preference media queries.

## What moves, what stays

### Stays in `globals.css`

- `:root` design tokens (Aria editorial set + legacy HSL block for shadcn/lab).
- `@media (prefers-color-scheme: dark) :root` token override (dark mode implementation strategy is token-based, **not** Tailwind `dark:` variants — keep tokens as the switch).
- All `@keyframes` (`ariaDrift1/2/3`, `ariaRingPulse`, `ariaRingSpin`, `ariaLivePulse`, `ariaDotBlink`, `ariaCaret`, `ariaMenuIn`, `ariaShellEnter`, `ariaSpin`).
- State-cascaded token rules: `.aria-shell-listening { --wf-user: #16a34a }` etc. These are Aria-specific custom-property injections driven by a React className — the exact thing CSS variables exist to do.
- `.ambient-{state} .blob-N { background: ... }` — bundles of color rules tied to a parent state modifier. Too coupled for inline utilities.
- `@media (prefers-reduced-motion: reduce)` rules targeting those decorative keyframes.
- Complex sibling / `:not()` selectors (e.g., `.stage:not(.stage-no-side) ~ .dock`).
- One small set of named helpers the JSX can't cleanly express in utilities: `wf-agent` / `wf-user` SVG fill classes.

### Moves to Tailwind utilities in JSX

- All spacing, padding, margin, flex/grid layout.
- All typography (font-family, size, weight, letter-spacing, line-height, italic, text-align).
- Colors via token-backed utilities (`bg-card`, `text-ink-3`, `border-line`).
- Borders, rounded corners, box shadows.
- Generic transitions (`transition-colors`, `duration-150`).
- Hover / focus-visible / disabled variants.

## `tailwind.config.ts` additions

Expose the Aria tokens as color utilities and the Aria keyframes as animation utilities so the JSX can read naturally:

```ts
extend: {
  colors: {
    ink: 'var(--ink)',
    'ink-2': 'var(--ink-2)',
    'ink-3': 'var(--ink-3)',
    'ink-4': 'var(--ink-4)',
    bg: 'var(--bg)',
    'bg-2': 'var(--bg-2)',
    card: 'var(--card)',
    line: 'var(--line)',
    'line-2': 'var(--line-2)',
    'pill-listen': 'var(--pill-listen)',
    'pill-think': 'var(--pill-think)',
    'pill-speak': 'var(--pill-speak)',
    'pill-error': 'var(--pill-error)',
    'pill-muted': 'var(--pill-muted)',
    'wf-agent': 'var(--wf-agent)',
    'wf-user': 'var(--wf-user)',
  },
  fontFamily: {
    serif: 'var(--font-serif), Georgia, serif',
    mono: 'var(--font-mono), ui-monospace, monospace',
  },
  animation: {
    'aria-ring-pulse': 'ariaRingPulse 1.4s ease-in-out infinite',
    'aria-ring-spin': 'ariaRingSpin 2s linear infinite',
    'aria-live-pulse': 'ariaLivePulse 2s ease-in-out infinite',
    'aria-dot-blink': 'ariaDotBlink 1s ease-in-out infinite',
    'aria-caret': 'ariaCaret 0.9s step-end infinite',
    'aria-shell-enter': 'ariaShellEnter 420ms cubic-bezier(0.16,1,0.3,1) both',
    'aria-drift-1': 'ariaDrift1 22s ease-in-out infinite',
    'aria-drift-2': 'ariaDrift2 28s ease-in-out infinite',
    'aria-drift-3': 'ariaDrift3 34s ease-in-out infinite',
    'aria-menu-in': 'ariaMenuIn .18s ease-out',
    'aria-spin': 'ariaSpin 0.8s linear infinite',
  },
  transitionTimingFunction: {
    'aria-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
}
```

## Execution order

1. `tailwind.config.ts` — extend colors / fonts / animations.
2. `components/aria/Waveform.tsx` — tiny change (SVG wrapper classes). Keeps `.wf-agent` / `.wf-user` fill helpers in CSS.
3. `components/aria/Ambient.tsx` — keeps `.ambient-{state}` / `.blob-N` / `.grain` since they're state-cascaded color bundles. No JSX change needed.
4. `components/aria/Controls.tsx` — dock + ctrl-btn variants → utilities. Keeps `.ctrl-active` only if it's used as a discriminator elsewhere (it isn't; drop).
5. `components/aria/VoiceSelector.tsx` + `MicPicker.tsx` — pills, popover menus → utilities. Popover keyframe stays; `animate-aria-menu-in` utility replaces hand-written class.
6. `components/aria/Persona.tsx` — persona card + avatar rings + status pill + timer + hint → utilities. Avatar-ring animations stay (they're keyframes + state cascade).
7. `components/aria/Transcript.tsx` — side panel bubbles + caret → utilities. Caret keyframe stays.
8. `components/ConversationComponent.tsx` — shell root, top-bar, stage, dock wrappers → utilities. Shell keeps `.aria-shell aria-shell-{state}` (state-cascaded token injection).
9. `components/LandingPage.tsx` — landing hero + CTA + footer → utilities.
10. Prune `app/globals.css` — delete every rule now covered by utilities. Keep tokens + keyframes + state cascades + `:has`/sibling rules + reduced-motion + dark-mode overrides.
11. Lint + build.

## Non-goals

- No visual regression allowed. Dark mode, reduced motion, mobile breakpoint behavior must all be identical post-refactor.
- No changes to hook ownership, StrictMode guards, Agora wiring, state machine, or motion integration.
- Not switching the dark-mode strategy to Tailwind `dark:` variants — token overrides remain the source of truth.
- Not touching `/lab/visualizer` or `components/AgentShaderVisualizer/` — they already use Tailwind.

## Risks

1. **Color tokens as raw HSL vs hex.** Aria's tokens are hex (`--bg: #fafaf7`) not HSL. Tailwind's color utilities expect either hex-strings or `hsl(var(...))`. Direct `var(--ink)` as a color value works for background/color/border-color/fill but **not** for alpha variants (`bg-ink/50`). If we need alpha we'd need `rgb(from var(--ink) r g b / <alpha>)` or stick with `bg-black/5` as an approximation. Will note where encountered.
2. **Keyframes need the names defined in CSS.** Tailwind only references them by name. If the keyframes are in `globals.css`, the animation utility works. Verified.
3. **`backdrop-filter` mobile Safari quirks.** Tailwind's `backdrop-blur-xl` compiles to both `backdrop-filter` + `-webkit-backdrop-filter`, so safer than hand-rolled.
4. **Sizes baked into Tailwind arbitrary values** (`w-[340px]`, `h-[68px]`). Fine, but a future token pass could promote them to theme.extend.spacing.
