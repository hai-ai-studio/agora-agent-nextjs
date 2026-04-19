# Responsive Adaptation Plan

> Date: 2026-04-20
> Goal: Make the Aria UI hold together from 320px phone-portrait up through 1920px desktop. Fix current overflow bugs, reflow the dock on narrow screens, rethink the transcript row on mobile.

## Current state audit

### Breakpoints in use today

| Breakpoint | Where | What it does |
|---|---|---|
| `max-[960px]` | top-bar, stage, dock, viz | Shrinks padding + viz panel padding |
| `max-[720px]` | stage, side, top-meta-quiet, dock padding, persona-hint (was hidden, now still shown) | Grid collapses 2-col → 1-col; transcript becomes a bottom strip; "End-to-end encrypted" hides; dock right-padding drops the 388px offset |
| `max-[640px]` (height) | persona, avatar sizes, avatar-core, persona-name, persona-hint | Shrinks everything persona-related for short landscape phones |

### Known bugs / gaps

**1. Waveform SVG overflows on narrow viewports**
`Waveform` renders `<svg width={640} height={140}>` as fixed attributes. On any container < 640px wide (phones, narrow tablets), the SVG overflows its parent. `.viz` panel then scrolls horizontally or clips.

**2. Dock is wider than phone viewports**
Dock content: VoiceSelector (208px) + mic-group (~68px) + transcript toggle (44px) + end-call (44px) + gaps + dock padding ≈ 400px minimum. iPhone SE (320px) and other small phones can't fit this in a single row. Currently it overflows.

**3. VoiceMenu / MicPicker popovers clip on narrow viewports**
Both popovers are 260px wide with `left: 0` anchoring. On phones where the trigger sits near the right edge of the dock, the popover overflows the viewport.

**4. Transcript bottom strip on mobile is too short to be useful**
At `max-[720px]` the grid becomes `1fr minmax(120px, 200px)` — the transcript gets 120-200px of height. For a live conversation log with 14.5px bubbles this fits maybe 2-3 turns. Either make it bigger, turn it into a bottom sheet, or hide it on phone and rely on the toggle.

**5. Brand row could wrap awkwardly on <360px**
"Ada · Agora" + the "● Connected" meta on a 320px phone shares ~280px of content with the brand-mark 32px circle. Might wrap the italic serif name onto a new line mid-character.

**6. Persona card left-aligned on desktop, crowded on phone**
The persona sits left-aligned in stage-center (max-w-720). On a 1920px screen it's fine. On phone (320-400px wide), the card has `max-width: 720` but actual rendered width = viewport - padding. Works but the avatar + meta + hint squeeze together. No explicit breakpoint currently handles this.

**7. Ultra-short viewport (< 500px height, mobile keyboard open)**
Persona's `max-height: 640` rule kicks in but doesn't go further. With a soft keyboard open, viewport can drop to 300-350px. Dock might collide with persona card.

**8. Hero headline at narrow width uses `clamp(40px, 6vw, 64px)`**
At 320px viewport, 6vw = 19.2px, so clamped to 40px. On a 320px device "Say hi to Ada." at 40px bold italic serif — checks at ~150px wide. Fits, but close. OK as-is.

## Target device / breakpoint matrix

| Class | Width range | Canonical devices | Priority |
|---|---|---|---|
| Phone portrait (narrow) | 320–374 | iPhone SE, small Android | P0 (must work) |
| Phone portrait (standard) | 375–430 | iPhone 13/14/15, Pixel 7/8 | P0 |
| Phone landscape | 640–932, height 375–430 | iPhone rotated | P1 |
| Tablet portrait | 600–810 | iPad mini, small Android tablets | P1 |
| Tablet landscape | 820–1180 | iPad standard | P1 |
| Desktop | 1280–1919 | Laptop, monitor | P0 (current default target) |
| Wide desktop | 1920+ | Large monitors | P2 (prevents over-spread) |

## Per-component strategy

### 1. Waveform SVG — fluid width

**Current:** fixed `width={640}` SVG attribute.
**Proposed:**
- Render SVG with `width="100%"` and `preserveAspectRatio="none"` or just keep `viewBox` with `width="100%"`.
- Keep internal coordinate system at 640×140 so the 48-bar layout math doesn't change.
- Parent already constrains to container width via flex; SVG will scale down smoothly.

Risk: bar width math becomes "visual width per bar shrinks" — on 320px viewport, bars become 320/48 ≈ 6.6px wide with 4px gap. Might look dense. Could reduce `BAR_COUNT` at narrow widths (e.g. 32 bars under 500px). Keep as follow-up if it looks bad.

### 2. Dock — reflow on narrow phones

Three options in order of aggressiveness:

**Option A (minimal):** Keep single row, shrink VoiceSelector to icon-only on `max-[480px]`. The voice + language pill becomes a 36×36 circle with the ink dot. Tap opens the menu. Saves ~170px of horizontal space.

**Option B (moderate):** Two rows on `max-[480px]`. Top row: VoiceSelector (full width). Bottom row: mic + transcript + end. Dock becomes taller but everything stays visible.

**Option C (aggressive):** Hide VoiceSelector entirely on `max-[480px]` since Ada/English are the only enabled options anyway. Minimal dock = mic + transcript + end.

**Recommended: C.** Voice selector currently ships disabled options — nothing to pick on phone. If/when we wire voice choice, A/B become relevant. Flag for user to confirm.

### 3. Popover menus — viewport-clamped positioning

VoiceMenu and MicPicker popovers:
- Change from `left: 0` to `right: 0` when their trigger sits in the right half of the dock, OR
- Use `left: clamp(0, anchor_left, viewport_width - popover_width)` via CSS `max(...)`.

Simpler: add `right-0 left-auto` utility when the popover would overflow. Or just position both relative to the dock's right edge since they naturally live toward the left of the dock.

Practically easiest: switch to `right: 0; left: auto` on `max-[640px]` so menus open toward the left side of the screen.

### 4. Transcript on mobile — three paths

**Path A (keep current):** bottom strip 120-200px. Acceptable for "glanceable" transcript but not readable.

**Path B (bottom sheet):** tap the transcript toggle → full-screen overlay transcript, tap again to close. Keeps main UI clean.

**Path C (hidden by default, on-demand full-screen):** Start with transcript hidden on phone. Toggle opens a bottom sheet. Desktop behavior unchanged.

**Recommended: C.** Mobile users typically care about the live state (persona + waveform) more than the scrollback. When they want history, a bottom sheet gives real reading space.

### 5. Brand row on very narrow (<360px)

Add `text-[18px] max-[360px]:text-[16px]` on `.brand-name` so the italic serif ramps down a tick. Also add `gap-2` instead of `gap-2.5` at this width.

### 6. Persona card on phone

At phone portrait, the 720px max-width limiter is fine (card fills available width). Tighten the layout:
- Reduce avatar size from 68 → 56 at `max-[480px]`
- Drop the persona-name from 24px → 20px at `max-[480px]` (or reuse the max-height:640 rule — expand it to `(max-height: 640) or (max-width: 480)`)
- persona-hint already shrinks at short height; add narrow-width rule.

### 7. Ultra-short viewport (<500px height)

Hide persona-hint entirely.
Hide top-meta fully (not just top-meta-quiet).
Reduce dock padding to 8px top/bottom.
This handles mobile-with-keyboard.

### 8. Wide desktop (≥1920px)

Currently nothing is centered at wide widths — the shell is `width: 100vw` so it fills. Content `max-width: 720px` centers via `stage-center`'s flex-column. Should work.

One opportunity: at `min-[1440px]`, bump persona + viz max-width to 860 or 920 so they feel more proportional on big screens. Not critical.

### 9. Tablet portrait 600–810

Currently falls between our breakpoints — between `max-[720px]` (mobile) and `max-[960px]` (compact desktop). At 720-810 the grid uses `1fr 300px` (the 960 rule) which works. Under 720 it switches to 1-col. OK but the transition could feel abrupt. Consider a 600-720 range that keeps side panel but narrower (e.g. 260px).

## Open design decisions (flagging for user)

1. **Mobile transcript strategy** — Option C (hidden by default, bottom sheet on toggle) vs keep current bottom strip.
2. **Dock on narrow phone** — Option C (hide voice selector) vs A (icon-only) vs B (wrap 2 rows).
3. **Narrow-width avatar size** — shrink to 56px at phone widths, or leave at 68?
4. **Wide desktop max-width** — bump to 860/920 at ≥1440, or keep 720 for editorial feel?

## Execution phases

Ordered smallest-risk-first so we can land incrementally:

**Phase 1 — overflow fixes (P0, no design decisions needed)**
- Waveform SVG → fluid width
- Popover menus → `right-0 left-auto` on narrow viewports
- Brand row font-size ramp on <360px

**Phase 2 — dock reflow (needs user decision on A/B/C)**
- Apply the chosen narrow-phone dock strategy
- Update reduced-motion + dark-mode if any new elements

**Phase 3 — transcript mobile treatment (needs user decision)**
- Apply the chosen mobile transcript path
- Tie the state to the existing `isTranscriptVisible` toggle so desktop behavior unchanged

**Phase 4 — persona + short-viewport polish**
- Shrink avatar at `max-[480px]` width
- Unify `max-height: 640` rules to fire on `max-width: 480` too
- Hide persona-hint + top-meta on `max-height: 500`

**Phase 5 — wide desktop polish (optional, P2)**
- Bump persona/viz max-width at `min-[1440px]` if agreed
- Any spacing tweaks

**Phase 6 — verification**
- Lint + build
- User manually tests at each device class via Chrome DevTools device emulation
- Take notes for any follow-up

## Non-goals

- No new animations — keep motion work from the previous pass untouched.
- No refactor of the current Tailwind-utility approach — this is additive (mostly new breakpoint variants).
- No landscape-specific orientation-lock behavior — trust the viewport-dimension breakpoints.
- No changes to Agora wiring, hooks, state machine.
- No new illustrations or icons for mobile.

## Verification approach

1. `pnpm lint` + `pnpm build` after each phase.
2. User-side visual verification in Chrome DevTools at:
   - 320 × 568 (iPhone SE)
   - 390 × 844 (iPhone 14)
   - 810 × 1080 (iPad portrait)
   - 1280 × 800 (laptop)
   - 1920 × 1080 (desktop)
   - 844 × 390 (iPhone 14 landscape — short-viewport case)
3. Toggle dark mode at each size.
4. Try transcript show/hide at each size.
5. Toggle mute, open voice selector, open mic picker at each size.

## Risks

1. **Waveform bar density at narrow widths.** Going from 640-internal to container-width mapping may make bars look crowded. Mitigation: conditional `BAR_COUNT` based on measured container width (requires `ResizeObserver`). Defer unless visually bad.
2. **Bottom-sheet transcript adds complexity.** Requires `motion.div` full-screen overlay + backdrop + lock body scroll. Small scope but new surface area for bugs.
3. **Short-viewport rule consolidation.** Merging `max-height: 640` with `max-width: 480` could over-fire on tablets in portrait at 768 wide — check boundaries.
4. **Popover right-alignment.** Flipping `left` to `right` changes where menus open, could feel inconsistent with desktop. Alternative: transform translateX on overflow. More CSS work.
