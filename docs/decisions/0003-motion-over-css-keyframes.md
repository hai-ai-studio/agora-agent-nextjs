# 0003 — `motion/react` first, CSS `@keyframes` as fallback

- Date: 2026-04-20
- Status: Accepted
- Supersedes: CSS keyframes + state-cascade selectors for all animations

## Context

The original Aria port used CSS `@keyframes` + state-class cascades for every animation — `.ambient-listening .blob-1` swapped colors, `.avatar-listening .avatar-ring-1` added `animation: ariaRingPulse`, a typewriter `.caret` used `@keyframes ariaCaret`. This worked but created two problems:

1. **Mount / unmount animations are awkward in pure CSS.** The transcript side panel shows / hides via React state; CSS has no hook for "animate on unmount before React removes the node". We reached for `AnimatePresence` from `motion/react` anyway for that case.
2. **Reduced-motion handling was manual.** Every keyframe needed a `@media (prefers-reduced-motion: reduce)` rule to silence it. Easy to forget; easy to drift.

Now that `motion/react` is installed, the question is when to use which.

## Decision

`motion/react` is the first tool for animations. CSS `@keyframes` are the fallback when `motion/react` can't do it cleanly.

**Use `motion/react` for:**

- Enter / exit animations (`AnimatePresence` + `motion.div` with `initial` / `animate` / `exit`).
- State-driven transitions (prop changes → animate to new value).
- Infinite decorative loops (drifting blobs, ring pulse, status-pill dot blink, caret blink) via `animate={{ ... }} + transition={{ repeat: Infinity }}`.
- Any animation that should respect `useReducedMotion()` — `motion` reads the media query automatically and returns a no-op so components don't need parallel CSS rules.

**Use CSS `@keyframes` for:**

- Animations referenced by Tailwind animation utilities in `tailwind.config.ts` (kept for classes that live on elements outside of React's control, though we no longer have many of those).
- The `ariaShellEnter` mount animation on `.aria-shell` — but even this is a candidate for `motion.div` + `initial`/`animate` if we ever revisit.

In practice, after the tailwind refactor the only keyframes we still depend on are Tailwind animation utilities. The bulk of live animation is `motion/react`.

## Consequences

**Good:**

- Reduced-motion accessibility is automatic (motion/react honors `useReducedMotion()` — we don't author `@media` rules per animation).
- Mount / unmount animations use the same API as in-place animations. No mental context switch between "CSS keyframe for loop" and "motion for mount".
- State cascades (parent state → child animation) compute inline `style={{ ... }}` or animate targets per prop. No need for parent-class CSS selectors like `.avatar-listening .avatar-ring-1`.
- Component authors no longer hop between `.tsx` and `globals.css` to tune an animation.

**Bad:**

- `motion/react` adds ~30KB gzipped to the client bundle. Non-trivial for a quickstart. Accepted because the DX + accessibility wins outweigh it and the Agora SDK dominates the bundle anyway.
- Complex decorative animations (drifting blobs, ring pulse) become JS-driven rather than GPU-only CSS. Haven't seen perf issues at current density.
- Library lock-in: if `motion/react` becomes unmaintained, we'd have a broader migration than pure CSS.

## Rules of thumb

- "Does this animation exist before the component mounts?" → CSS keyframe + Tailwind utility (rare).
- "Does React own when this plays?" → `motion/react`.
- "Does the user prefer reduced motion?" → `useReducedMotion()` inside the component, gate props on it. (`motion` already handles the common cases; explicit for unusual ones.)

## Alternatives considered

- **`@keyframes` only.** Rejected: exit animations painful, reduced-motion manual.
- **Framer Motion (the pre-rebrand predecessor to `motion`)**. Rejected: deprecated in favor of `motion`.
- **CSS View Transitions API.** Rejected: browser support gaps; doesn't cover the in-component state-change use case cleanly.
