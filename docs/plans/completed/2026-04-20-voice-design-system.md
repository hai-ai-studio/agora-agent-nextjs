# 2026-04-20 — Voice Agent Design System Integration

> Status: **planning / awaiting decisions**
> Goal: port the reference Voice Agent DS (tokens + 18 components) into the project as reusable Tailwind-first components, render them all on a new `/design` catalog page, and reconcile with the existing Aria styles without breaking the shipped conversation UI.

---

## 1. Context

Reference material lives at `/Users/lucasay/Downloads/agora (1)/` (will be copied into repo history via this plan, not committed verbatim). It contains:

- `Voice Agent Design System.html` — React 18 UMD shell, loads tokens + component scripts via `<script>` tags
- `tokens.css` — design tokens (voice gradient, ink/dark scales, radii, shadows, Geist fonts, 6 keyframes)
- `app.jsx` — 615-line showcase laying out 12 numbered sections + hero + footer
- `components/` — 8 files, ~1200 LOC total, defining 18 components

All reference components use inline `style={{…}}` objects and a few global CSS helper classes (`.hero-title`, `.cell`, `.section-head`, `.eyebrow`, `.mono`, `.serif`). None of it is Tailwind-ready. Canvas components draw in raw 2D context.

### Component inventory

| # | Name | Type | Notes |
|---|------|------|-------|
| 1 | `VoiceOrb` | canvas | 5 states (idle/listening/thinking/speaking/muted). The signature element. Draws blob with voice-gradient + glow layers. |
| 2 | `BarsWave` | DOM | Gradient-filled vertical bars, classic meter. |
| 3 | `LinearWave` | canvas | Oscilloscope-style trace. |
| 4 | `CircleWave` | canvas | Three concentric voice-gradient rings. |
| 5 | `StatusIndicator` | DOM | Breathing-dot pill for agent state (6 states). |
| 6 | `LatencyIndicator` | DOM | Signal-bars + ms readout. |
| 7 | `IconButton` | DOM | 5 variants: default / ghost / danger / voice / dark. |
| 8 | `CallControls` | DOM | Floating glass-morph bar composing IconButtons. |
| 9 | `BigCallButton` | DOM | Primary call button, 3 states (idle/ringing/active). |
| 10 | `TranscriptBubble` | DOM | Asymmetric-corner bubble; agent messages carry the gradient. |
| 11 | `LiveSubtitle` | DOM | Dark overlay, large centered caption. |
| 12 | `VoicePicker` + `VoiceCard` | DOM | 6 persona cards with signature gradients. |
| 13 | `LanguagePicker` | DOM | Flag + accent dropdown, 8 locales. |
| 14 | `SessionList` + `SessionRow` | DOM | Session history rows with gradient avatars. |
| 15 | `AgentConfigCard` | DOM | Prompt preview + tool badges + telemetry. |
| 16 | `ToolCallCard` | DOM | running / success / error card with JSON args + result. |
| 17 | `MicPermissionCard` | DOM | 3 states (prompt / requesting / denied). |
| 18 | `AudioPlayer` | DOM | Scrubbable waveform + play/speed controls. |
| — | `BargeInIndicator` | DOM | "Tap to interrupt" pill. |
| — | `useTypewriter` | hook | Helper for streaming caret. |

Reference also provides **design primitives**: Hero, Section scaffold, Cell (stage card), and ProductComposition (full voice-console layout) in `app.jsx`.

---

## 2. Scope

### In

- Add new design tokens (voice gradient, Geist fonts, ink numeric scale, dark scale, keyframes) to `tailwind.config.ts` + `src/app/globals.css`.
- Port all 18 components into `src/components/design-system/` as ES-module exports.
- Build `/design` page at `src/app/design/page.tsx` — one section per reference section (12 sections + hero + footer).
- Rewrite every custom class (`.hero-title`, `.cell`, `.section-head`, `.eyebrow`, `.mono`, `.serif`, `.page`, `.dark-stage`) as Tailwind utilities.
- Keep canvas drawing logic (hex colors inside `ctx.fillStyle`) intact — that's not styling, it's graphics.

### Out

- **Not migrating the existing Aria conversation UI to the new DS.** Conversation stays on Aria (`Persona` concentric rings, `Waveform` 2-row bars, `Controls` pill dock). A separate plan can propose migration once the DS catalog exists.
- No backend wiring (the new `VoicePicker` / `LanguagePicker` / `SessionList` are catalog-only, purely visual).
- No tests (project has none).
- No i18n / RTL audit.

---

## 3. Decisions to confirm (default answers in **bold**)

### D1 — Fonts: Geist?

Reference uses **Geist** (sans) + **Geist Mono**. Current project uses **Inter Tight** + **JetBrains Mono**.

- **A (recommended)**: add Geist + Geist Mono via `next/font/google` as a third pair. New DS components use Geist; existing Aria components stay on Inter Tight. Two pairs coexist during catalog build-out.
- B: keep Inter Tight / JetBrains Mono throughout. Reference components just use current fonts (small visual drift from reference).
- C: switch everything to Geist (disruptive to shipped Aria).

### D2 — Voice gradient tokens

Voice gradient is brand new. Implementation:

- Add `--voice-a: #7C5CFF`, `--voice-b: #E85C8A`, `--voice-c: #F5A55C` to `:root` in `globals.css`
- Expose as Tailwind color tokens: `voice-a`, `voice-b`, `voice-c`
- For gradient surfaces, use Tailwind utility: `bg-gradient-to-br from-voice-a via-voice-b to-voice-c`
- For `voice-grad-soft` (22 opacity variant) — use `from-voice-a/10 via-voice-b/10 to-voice-c/10`
- Canvas-drawn gradients (VoiceOrb, LinearWave, BarsWave) continue to use hex directly in `ctx.createLinearGradient` — can't Tailwind that

### D3 — Ink scale

Reference has 8-step `--ink-0..7` (warm neutrals, paper-like). Current project has 4-step (`--ink`, `--ink-2`, `--ink-3`, `--ink-4`) + 2 bg tokens.

- Reference `--ink-0` (#FAFAF7) == current `--bg` (#fafaf7) ✓ exact match
- Reference `--ink-7` (#0A0A09) ≈ current `--ink` (#0b0b0c) — 1-bit diff
- Middle steps (ink-1 through ink-6) are new

**Proposal**: coexist. Add `--ink-0` through `--ink-7` as a parallel numeric scale. Existing aliases stay (`--ink`, `--ink-2` etc. point at what they currently point at; nothing breaks). Tailwind gets both `ink-0..7` numeric utilities AND existing semantic utilities. Over time the aliases can be deprecated.

### D4 — Where the DS components live

- **A (recommended)**: `src/components/design-system/` — single folder, each component one file. Separate from `src/components/{ErrorBoundary, LoadingSkeleton, ui/*, AgentShaderVisualizer/}` (which are one-off shared primitives, not a catalog).
- B: `src/components/*` flat — higher discoverability, but muddies the distinction between shared primitives and the DS catalog.
- C: `src/features/design-system/*` — feature-style, but it's not really a feature; it's a visual library.

### D5 — Custom class names vs Tailwind utilities

The user's explicit ask: **尽量使用 tailwind utils，而不是自定义类名**. Strict interpretation:

- All `.hero-title`, `.cell`, `.section-head`, `.eyebrow`, `.mono`, `.serif` etc. → delete; replaced by utility combinations.
- Component-internal styling → utility classes on JSX.
- Dynamic computed values (e.g. `style={{ height: computedHeight }}`) → stay inline.
- Canvas drawing → stays inline (it's not CSS).

**Kept as CSS** (not Tailwind-able):
- `@keyframes` definitions in `globals.css` (Tailwind references them by name via `animate-*` utilities, but the keyframes themselves must exist in CSS).
- `::-webkit-scrollbar` pseudo-elements.
- `font-feature-settings: 'ss01', 'cv11'` on body (micro-typography tweak).

### D6 — Public link to `/design`?

- **A (recommended)**: URL-only, no nav link. The landing page stays clean; `/design` reachable via direct URL. Dev reference only.
- B: link from landing footer.

---

## 4. Token additions (concrete spec)

### `src/app/globals.css` additions

```css
:root {
  /* Voice gradient signature */
  --voice-a: #7C5CFF;
  --voice-b: #E85C8A;
  --voice-c: #F5A55C;

  /* Numeric ink scale (parallel to existing aliases) */
  --ink-0: #FAFAF7;
  --ink-1: #F4F3EE;
  --ink-2: #EAE8E0;
  --ink-3: #D7D4C8;
  --ink-4: #A8A49A;
  --ink-5: #6B6862;
  --ink-6: #2A2A27;
  --ink-7: #0A0A09;

  /* Dark surface scale */
  --dark-0: #0A0A09;
  --dark-1: #14140F;
  --dark-2: #1F1E18;
  --dark-3: #2A2924;
  --dark-4: #3D3B34;

  /* Semantic (DS versions; reconcile with existing pill-* if identical) */
  --ok: #2E8B5C;
  --warn: #C97A1F;
  --err: #C94444;
  --info: #3D6BCC;
}
```

Existing `--ink`, `--ink-2`, `--ink-3`, `--ink-4`, `--bg`, `--bg-2`, `--pill-*` stay untouched.

### `tailwind.config.ts` additions

```ts
theme.extend.colors = {
  ...existing,
  'voice-a': 'var(--voice-a)',
  'voice-b': 'var(--voice-b)',
  'voice-c': 'var(--voice-c)',
  'ink-0': 'var(--ink-0)', // through ink-7
  'dark-0': 'var(--dark-0)', // through dark-4
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  err: 'var(--err)',
  info: 'var(--info)',
};

theme.extend.keyframes = {
  ...existing,
  breathe: {
    '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
    '50%': { transform: 'scale(1.06)', opacity: '1' },
  },
  'pulse-ring': {
    '0%': { transform: 'scale(1)', opacity: '0.6' },
    '100%': { transform: 'scale(1.8)', opacity: '0' },
  },
  'typing-dot': {
    '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
    '30%': { transform: 'translateY(-4px)', opacity: '1' },
  },
  'caret-blink': {
    '0%, 50%': { opacity: '1' },
    '51%, 100%': { opacity: '0' },
  },
  'slide-up': {
    from: { opacity: '0', transform: 'translateY(8px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  'rotate-slow': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
};

theme.extend.animation = {
  ...existing,
  breathe: 'breathe 1.6s cubic-bezier(0.32,0.72,0,1) infinite',
  'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.16,1,0.3,1) infinite',
  'typing-dot': 'typing-dot 1.2s infinite',
  'caret-blink': 'caret-blink 1s infinite',
  'slide-up': 'slide-up 400ms cubic-bezier(0.16,1,0.3,1)',
  'rotate-slow': 'rotate-slow 12s linear infinite',
};

theme.extend.transitionTimingFunction = {
  ...existing,
  organic: 'cubic-bezier(0.32, 0.72, 0, 1)',
  // ease-aria-out already exists and matches ease-out-soft; reuse
  spring: 'cubic-bezier(0.5, 1.4, 0.4, 1)',
};
```

### Fonts (via `next/font/google` in `src/app/layout.tsx`)

```tsx
import { Geist, Geist_Mono } from 'next/font/google';
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
```

In `globals.css`:

```css
:root {
  --font-geist: /* populated by next/font */;
  --font-geist-mono: /* populated by next/font */;
}
```

In `tailwind.config.ts`:

```ts
theme.extend.fontFamily = {
  ...existing,
  geist: ['var(--font-geist)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  'geist-mono': ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
};
```

DS components use `font-geist` / `font-geist-mono`. Existing Aria stays on `font-sans` / `font-mono` / `font-serif`.

---

## 5. Component porting notes

### General rules

1. Every `style={{ ... }}` with static values → Tailwind utilities on JSX.
2. Every `style={{ ... }}` with computed values (runtime numbers, gradients with template literals) → stays inline.
3. Every custom class in the reference (`.hero-title`, `.cell`, etc.) → delete, inline as utilities.
4. Hex colors in canvas `ctx.fillStyle` / `ctx.strokeStyle` → keep as hex (not token-backed; canvases don't read CSS vars).
5. All components default-export as named function; no `window.X = ...` pollution.
6. Each component file uses `'use client'` where needed (canvas animation, event handlers, state).

### Per-component gotchas

- **VoiceOrb**: canvas inside a Tailwind-sized wrapper div. Canvas internals untouched. Add `aria-hidden="true"` on canvas; parent gets `role="img" aria-label="…"`.
- **BarsWave**: bar heights computed at runtime → `style={{ height }}`. Bar bg gradient uses template literal interpolating index — can't Tailwind, keep inline. Container → utilities.
- **LinearWave / CircleWave**: canvas, same pattern as VoiceOrb.
- **StatusIndicator**: all styling → utilities. Breathing-dot animation via `animate-breathe`. Pulse ring via `animate-pulse-ring`. Typing dots via `animate-typing-dot` with `[animation-delay:100ms]` utility per dot.
- **LatencyIndicator**: 4 signal bars as span grid. Active/inactive via ternary class.
- **IconButton / CallControls / BigCallButton**: variant → class map via simple dict (no `cva` needed; reference is small enough).
- **TranscriptBubble**: asymmetric corners → `rounded-*` utilities with specific corner overrides. Streaming caret → `animate-caret-blink`.
- **LiveSubtitle**: dark overlay → `bg-dark-0/85 backdrop-blur-xl`.
- **VoiceCard**: gradient avatar 40×40 with radial-highlight overlay → nested div, gradient inline (runtime accent prop), overlay with `bg-[radial-gradient(...)]` inline (template) or static Tailwind `after:` pseudo.
- **LanguagePicker**: popover uses existing pattern (similar to `VoiceSelector` in Aria). Click-outside via `useEffect`.
- **SessionRow**: active-indicator absolute span, hover bg via group-hover or `hover:bg-*` utility.
- **AgentConfigCard**: complex multi-section card; pure Tailwind.
- **ToolCallCard**: JSON args renderer uses inline color spans for syntax-highlight-like output. Keep colors as Tailwind (`text-voice-a` for keys, `text-voice-c` for values).
- **MicPermissionCard**: inline SVG with `<linearGradient>` defs — keep SVG; only wrapper container uses utilities.
- **AudioPlayer**: waveform bars with gradient → same pattern as BarsWave; scrubber click handler stays JS.
- **BargeInIndicator**: simple pill, utility-first.

### Hook helper

- `useTypewriter` → port as `src/components/design-system/hooks/useTypewriter.ts` (small enough to live here, not in feature folder).

---

## 6. `/design` page layout

`src/app/design/page.tsx` — client component (canvas animations need browser APIs).

Structure:

```tsx
<div className="mx-auto max-w-7xl px-10 pb-30 pt-12">
  <Hero/>                              {/* title + animated VoiceOrb */}
  <Section num="00" title="Foundations">…</Section>
  <Section num="01" title="Voice Orb">…</Section>
  … through section 12 …
  <Footer/>                            {/* version stripe + tagline */}
</div>
```

`Section` helper component (defined in the page file, not exported):

```tsx
function Section({ num, title, count, children }) {
  return (
    <section className="mt-22">
      <div className="mb-8 flex items-baseline gap-4 border-b border-ink-2 pb-4">
        <span className="font-geist-mono text-xs text-ink-4">{num}</span>
        <h2 className="font-serif text-3xl italic tracking-tight text-ink-7">{title}</h2>
        <span className="ml-auto font-geist-mono text-sm text-ink-5">{count}</span>
      </div>
      {children}
    </section>
  );
}
```

`Cell` helper (stage card):

```tsx
function Cell({ label, desc, dark, children }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-ink-2 bg-ink-1 p-7">
      <div>
        <div className="font-geist-mono text-[10px] uppercase tracking-widest text-ink-5">{label}</div>
        {desc && <div className="mt-1 text-xs leading-normal text-ink-5">{desc}</div>}
      </div>
      <div className={`flex min-h-[11rem] items-center justify-center rounded-2xl border border-ink-2 p-6 ${dark ? 'bg-dark-0 text-ink-0' : 'bg-white'}`}>
        {children}
      </div>
    </div>
  );
}
```

All three helpers are utility-class-only; no custom CSS classes added to `globals.css` for them.

---

## 7. Phase order

Each phase ends with `pnpm lint && pnpm typecheck && pnpm build` (skip build if Google Fonts network flaky; lint + typecheck is proof of correctness).

**Phase 1 — Foundation (tokens + fonts)**
- `globals.css`: add voice / ink numeric / dark / semantic tokens + keyframes
- `tailwind.config.ts`: extend colors / keyframes / animation / fontFamily / transitionTimingFunction
- `src/app/layout.tsx`: add Geist + Geist Mono via next/font
- No components built yet; verify tokens flow by dropping a `<div className="bg-gradient-to-br from-voice-a via-voice-b to-voice-c h-20"/>` test in a scratch page

**Phase 2 — Page shell + signature (sections 00, 01, 03)**
- Build `/design/page.tsx` with Hero, Section, Cell, Footer helpers (utility-only)
- Port: `VoiceOrb`, `StatusIndicator`, `LatencyIndicator`
- Render: Foundations + Voice Orb + Status

**Phase 3 — Waveforms + Controls (sections 02, 04)**
- Port: `BarsWave`, `LinearWave`, `CircleWave`, `IconButton`, `CallControls`, `BigCallButton`
- Render: Waveforms + Call Controls

**Phase 4 — Transcript + Pickers (sections 05, 06, 11)**
- Port: `TranscriptBubble`, `LiveSubtitle`, `useTypewriter`, `VoiceCard`, `VoicePicker`, `LanguagePicker`, `BargeInIndicator`
- Render: Transcript + Voice Picker + Language

**Phase 5 — Agent UI + Tool + Permission + Player (sections 07, 08, 09, 10)**
- Port: `SessionRow`, `SessionList`, `AgentConfigCard`, `ToolCallCard`, `MicPermissionCard`, `AudioPlayer`
- Render: Sessions + Tool calls + Permission + Player

**Phase 6 — Product composition (section 12)**
- Port the full voice console layout from `app.jsx` `ProductComposition` into the page inline
- Cross-component integration pass (orb state sequencer, typing effect, etc.)

**Phase 7 — Docs + ADR**
- New ADR: `docs/decisions/0003-voice-design-system.md` capturing the DS coexistence decision
- Update `ARCHITECTURE.md`: add `components/design-system/` entry in the tree
- Update `AGENTS.md`: add a short note pointing DS consumers to the `design-system/` folder
- Update `README.md` "Repo Map" section
- Move this plan to `docs/plans/completed/`

---

## 8. File layout after port

```
src/
  app/
    design/
      page.tsx                         — /design catalog page
  components/
    design-system/
      hooks/
        useTypewriter.ts
      VoiceOrb.tsx
      BarsWave.tsx
      LinearWave.tsx
      CircleWave.tsx
      StatusIndicator.tsx
      LatencyIndicator.tsx
      IconButton.tsx
      CallControls.tsx
      BigCallButton.tsx
      TranscriptBubble.tsx
      LiveSubtitle.tsx
      VoiceCard.tsx
      VoicePicker.tsx
      LanguagePicker.tsx
      SessionList.tsx                  — includes SessionRow inline
      AgentConfigCard.tsx
      ToolCallCard.tsx
      MicPermissionCard.tsx
      AudioPlayer.tsx
      BargeInIndicator.tsx
      icons.tsx                        — inline SVGs (CCIcon set + others)
      index.ts                         — barrel export
```

Estimated LOC: ~1800 across all 20 files (porting + Tailwind refactor tends to slim each file by 10-20%).

---

## 9. Risks

1. **Canvas components ignore Tailwind.** VoiceOrb / LinearWave / CircleWave animation uses raw hex in `ctx`. The user's Tailwind-first preference applies to surrounding JSX only; inside the canvas it's graphics code.
2. **Voice gradient inside DOM bars.** `BarsWave` and `AudioPlayer` waveform compute per-bar gradient `linear-gradient(180deg, #7C5CFF, #E85C8A Nx%, #F5A55C)` where N is the bar index. This can't be a pure utility; must stay inline.
3. **Two font families loading on `/design`.** Geist + Inter Tight both loaded on that page (layout-level next/font loads both globally). ~40kb extra. Acceptable for a dev-reference page; mitigate via `display: swap` already default.
4. **Token surface grows by ~20 colors.** Organized sections in `globals.css` required to stay navigable.
5. **Keyframe naming overlap.** `animate-aria-out` already exists; new `animate-breathe / pulse-ring / …` don't collide. Check for any other potential name collisions before landing Phase 1.
6. **`/design` isn't production UI.** It's a dev reference. Don't spend time on edge cases (tiny viewports, print stylesheets, SEO meta).
7. **Coexistence invites drift.** Once both design languages are in-tree, future changes may be applied inconsistently. An ADR locks the rule: "new features use DS primitives; Aria stays as-is until a separate migration."

---

## 10. Open questions (pick answers before Phase 1)

- [ ] **D1** fonts: add Geist? → **A**: yes, coexist
- [ ] **D2** voice gradient tokens: add as `voice-a/b/c` + `bg-gradient-to-br` utilities? → **yes**
- [ ] **D3** ink scale: add numeric 0-7 in parallel to existing aliases? → **yes**
- [ ] **D4** component location: `src/components/design-system/`? → **yes**
- [ ] **D5** all custom reference classes → utilities; canvas/computed styles stay inline? → **yes**
- [ ] **D6** link `/design` from landing? → **no, URL-only**

---

## 11. Success criteria

- `/design` page renders all 12 sections + hero + footer at `localhost:3000/design`
- Lint + typecheck clean; production build succeeds
- Zero new custom CSS classes in `globals.css` beyond the keyframes (which Tailwind references by name)
- Zero regressions on the existing conversation UI (`LandingPage` + `ConversationShell`)
- No dead exports in `src/components/design-system/index.ts`
- ADR + ARCHITECTURE + AGENTS + README kept in sync
