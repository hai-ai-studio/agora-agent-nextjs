# convo-ui — Voice Conversation Component Library

> The in-tree component library used by this quickstart's voice UI. Lives at
> `src/components/convo-ui/`. Catalog route: [`/design`](../../src/app/design/page.tsx).
> Storybook: `pnpm storybook` (port 6006) or `pnpm build-storybook` for a static build.

This doc is the authoritative spec for what belongs in `convo-ui`, which design tokens
to reach for, and how to add a new component. Architectural rationale lives in
[ADR 0005](../decisions/0005-shadcn-tokens.md) (shadcn-style tokens). ADR 0003
(dual-vocab) and ADR 0004 (3-tier, 4-foreground) are the superseded intermediate
steps.

## 1. Scope

`convo-ui` is where presentational building blocks for voice-first conversation UIs live.

**A component belongs in `convo-ui` when:**

- It's purely presentational — no Agora SDK, no RTC/RTM client, no backend fetch.
- It takes plain props (state enum, callback, data array). No React context dependencies
  beyond what the library already declares.
- It's reusable beyond the current quickstart feature — at minimum, it should story
  cleanly with mocked inputs.

**A component belongs in `src/features/conversation/` when:**

- It binds to the Agora SDK (`agora-rtc-react`, `agora-agent-client-toolkit`).
- It orchestrates network state, tokens, or subscriptions.
- It wires together multiple `convo-ui` primitives around a product-specific flow
  (`LandingPage`, `ConversationShell`, `Controls`).

As a rule: if you can write a Storybook story for it without touching `agora-*`, it goes
in `convo-ui`. If not, it stays in `features/conversation/`.

## 2. Design tokens — three tiers (shadcn-style)

All tokens live in [`src/app/globals.css`](../../src/app/globals.css) and are mirrored
in [`.storybook/preview.css`](../../.storybook/preview.css). The vocabulary is
**primitive + semantic + brand**, with shadcn's paired-`-foreground` convention at the
semantic layer.

### Layer 1 — Primitives (fixed scales, don't flip)

| Role          | Tokens              | Tailwind utilities       |
| ------------- | ------------------- | ------------------------ |
| Warm neutrals | `--warm-0..11`      | `bg-warm-0`, `text-warm-7`, … |
| Brand voice   | `--voice-a/b/c`     | `bg-voice-a`, `from-voice-a`, … |

Primitives are referenced directly only in Foundations catalogs or when a component is
intrinsically pinned to one theme (e.g. `LiveSubtitle` is a dark-stage caption, uses
`bg-warm-7 text-warm-0` so contrast survives regardless of root theme).

### Layer 2 — Semantic roles (paired, flip under `.dark`)

Each surface has a companion foreground token. Using the pair (`bg-X` +
`text-X-foreground`) guarantees WCAG AA contrast at the vocab layer.

| Pair | Meaning |
| ---- | ------- |
| `bg-background` / `text-foreground` | Page |
| `bg-surface` / `text-surface-foreground` | Cards, raised panels |
| `bg-surface-elevated` / `text-surface-elevated-foreground` | Popovers, menus |
| `bg-muted` / `text-muted-foreground` | Quiet bg + secondary text |
| `bg-accent` / `text-accent-foreground` | Brand action (functional CTA) |
| `bg-destructive` / `text-destructive-foreground` | Danger action |

Stand-alone semantic tokens:

| Tokens | Use |
| ------ | --- |
| `--border` | Default hairlines, separators |
| `--input` | Form field borders (3:1+ non-text AA) |
| `--ring` | Focus indicator |
| `--state-listen / -think / -speak / -muted / -error` | Agent state dots + tints |
| `--success / --warning / --info` | Non-destructive intent colors |

**Text has exactly two levels: `foreground` and `muted-foreground`. Both pass AA
on every paired surface.** Anything quieter uses Tailwind opacity
(`text-muted-foreground/60`) and **only for decorative content marked
`aria-hidden`**. Don't add a third text token — ADR 0005 explains why.

`--accent` is a darker violet (#5a3edb) than `--voice-a` (#7c5cff) — accent carries
a contrast obligation against `--accent-foreground` (white), voice-a is pure brand
for gradients / orbs / halos.

### Layer 3 — Brand (theme-invariant)

`--voice-a/b/c` — the violet → rose → amber gradient. Identity, not a role. Stays
constant in any theme.

### Dark mode

Automatic. The root `.dark` class (Storybook theme toolbar, or OS
`prefers-color-scheme: dark`) re-resolves every semantic token in one cascade pass.
Components don't gate on theme, don't import an `isDark` hook, don't write
`dark:bg-foo`.

**Two narrow escape hatches:**

1. **Intentionally pinned surface** — a subtree that must stay in one theme
   regardless of root. Wrap in `<div className="dark">` or consume primitives
   directly (`bg-warm-7 text-warm-0`). `LiveSubtitle` is the reference example.
2. **A literal color that has no semantic analog** — rare marketing / illustration
   colors. Document the exception at the call site.

### a11y as a CI gate

`preview.ts` has `a11y: { test: 'error' }`. Every story runs axe on every render
via `@storybook/addon-vitest`; color-contrast / nested-interactive / other WCAG
violations fail `pnpm test`. Two narrow per-story opt-outs:

- `aria-hidden="true"` on decorative elements (live-indicator `●` dots paired
  with text labels, bullet separators, watermarks)
- `parameters: { a11y: { test: 'off' } }` on interaction-test stories where axe
  snapshots a transient mid-animation frame. The base visual story for the same
  component still carries the audit.

## 3. Typography — three families

| Utility         | Family            | Use                                        |
| --------------- | ----------------- | ------------------------------------------ |
| `font-ui`       | Geist             | All UI sans — headings, body, labels.      |
| `font-display`  | Instrument Serif  | Italic display accents. Always italic.     |
| `font-mono`     | Geist Mono        | Data, metadata, code, overline.            |

Loaded via `next/font` in [`src/app/layout.tsx`](../../src/app/layout.tsx) with
family-specific variables (`--font-geist-sans`, `--font-instrument-serif`,
`--font-geist-mono-face`) that globals.css aliases as `--font-ui / -display / -mono`.
The separation keeps `next/font` variables from colliding with Tailwind utility names.

## 4. Component catalog

Section order matches Storybook's sort (`.storybook/preview.ts`). Add a new section
only when three or more components cluster around it.

### Foundations
Not a component — a three-story meta (`Colors` / `Typography` / `Motion`) that's the
design-token reference. Covers every primitive, semantic role, brand color, type family,
keyframe, and ease curve. Semantic roles are shown light/dark side-by-side so the flip
behavior is the catalog itself.

### Signature — `VoiceOrb`, `Ambient`
- `VoiceOrb` — canvas-drawn signature blob. Voice gradient + glow halo. Five states.
- `Ambient` — drifting radial-gradient blobs + grain overlay. Decorative background.

### Waveforms — `BarsWave`, `LinearWave`, `CircleWave`
Three waveform styles. SVG-based, no audio graph required.

### Status — `StatusIndicator`, `LatencyIndicator`, `ConnectionIndicator`, `ErrorToast`
- `StatusIndicator`: breathing-dot pill for the 6-state state enum.
- `LatencyIndicator`: ms + quality signal.
- `ConnectionIndicator`: header connection signal with secondary-badge slot.
- `ErrorToast`: fixed-position `role="alert"` banner.

### Controls — `IconButton`, `CallControls`, `BigCallButton`, `VoiceLangMenu`, `Icons`
- `IconButton / CallControls / BigCallButton`: round controls + glass-morph dock +
  primary call CTA.
- `VoiceLangMenu`: compact voice + language dropdown for the dock.

### Transcript — `TranscriptBubble`, `LiveSubtitle`, `Transcript`
- `TranscriptBubble`: single message bubble with timestamp + streaming caret.
- `LiveSubtitle`: center-overlay caption for dark stages.
- `Transcript`: scrolling log with history + live-turn blink caret.

### Pickers — `VoiceGallery`, `VoiceCard`, `LanguagePicker`, `BargeInIndicator`
- `VoiceGallery / VoiceCard`: card-grid voice library.
- `LanguagePicker`: standalone locale dropdown.
- `BargeInIndicator`: active/inactive interruption affordance.

### Identity — `Persona`, `BrandMark`, `SessionList`, `AgentConfigCard`
- `Persona`: agent identity card — avatar with rings, name, hint, pill, mm:ss timer.
  8-state `PersonaState`.
- `BrandMark`: round chip + italic serif `<agent> · <product>` label.
- `SessionList`: recent-calls list with per-voice gradient avatars.
- `AgentConfigCard`: agent identity + prompt preview + tools + telemetry snapshot.

### Tools — `ToolCallCard`
Tool invocation card — running / success / error.

### Permission — `MicPermissionCard`
prompt / requesting / denied.

### Playback — `AudioPlayer`
Scrubbable recording player, light + dark variants.

### Compositions
End-to-end surfaces assembled from the library: `Landing`, `InCallStage`, `FullConsole`.
All flip with the root theme; no pinned-theme wrappers. Each drives its own mock state
cycle — no Agora bindings.

### Hooks — `useTypewriter`
Character-reveal hook used by streaming stories. Single-entry section; fold into the
consumer's doc if the collection doesn't grow.

## 5. Story conventions

Every component must have a `*.stories.tsx` next to it. Conventions:

- **Title namespace**: `'<Section>/<Component>'` — matches the order in
  [`.storybook/preview.ts`](../../.storybook/preview.ts).
- **Layout**: `parameters: { layout: 'centered' }` unless the component wants a full
  stage (`'fullscreen'` or `'padded'`).
- **Meta args**: supply values for all required props so stories without an explicit
  `args` block still render. Use a noop (`() => {}`) for required callbacks.
- **Interactive stories**: wrap state-holding logic in a named component (e.g.
  `function ControlledStory(args) { … }`) and render it via
  `render: (args) => <ControlledStory {...args} />`. Do **not** call hooks directly
  inside `render` — `rules-of-hooks` rejects it because "render" isn't an uppercased
  component name.
- **Docs block**: include a `parameters.docs.description.component` string summarizing
  what the component is for. Keep it under ~3 sentences.
- **A11y**: `addon-a11y` is wired in; keep labels / `aria-*` on interactive stories.
- **Theme**: don't pin a theme per story. The toolbar toggle + semantic tokens handle
  both themes for free. Exception: stories that specifically demo a dark-surface render
  (`VoiceOrb/OnDark`, `AudioPlayer/OnDark`) can pin `parameters: { backgrounds: { default: 'fixed-dark' } }`.
- **Interaction tests (`play`)**: for any story whose point is a user-visible
  interaction (clicks, toggles, menu opens, form submits), add a dedicated
  `Interaction — …` story with a `play` function. Import `expect`, `userEvent`,
  `within`, `fn` from `storybook/test` (not `@storybook/test` in SB 10). Keep
  rendering stories separate from interaction stories so a failed interaction doesn't
  break the visual-only catalog entries. Interaction stories run as vitest tests via
  `@storybook/addon-vitest`; use `pnpm test` to run the full suite headlessly
  (chromium via playwright). Current examples: `VoiceLangMenu/OpensMenu`,
  `VoiceLangMenu/SelectsVoice`, `CallControls/TogglesMute`,
  `CallControls/TogglesPause`, `IconButton/FiresOnClick`,
  `BigCallButton/ClickStartsCall`.

Minimal skeleton:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Thing } from './Thing';

const meta = {
  title: 'Section/Thing',
  component: Thing,
  parameters: { layout: 'centered' },
  args: { state: 'idle' },
  argTypes: {
    state: { control: 'select', options: ['idle', 'listening', 'thinking'] },
  },
} satisfies Meta<typeof Thing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { state: 'idle' } };
export const Listening: Story = { args: { state: 'listening' } };
```

## 6. Exports

Every exported component + its types must appear in
[`src/components/convo-ui/index.ts`](../../src/components/convo-ui/index.ts), grouped
under the same sectioning as this doc. Consumers import exclusively from the barrel:

```ts
import { Ambient, Persona, Transcript } from '@/components/convo-ui';
```

Deep imports (`@/components/convo-ui/Persona`) are discouraged — they defeat the
public-surface boundary.

## 7. Adding a new component

1. Drop `Foo.tsx` into `src/components/convo-ui/`. First line: `'use client';` if it
   uses state, effects, refs, or motion.
2. Consume semantic tokens for anything theme-sensitive. Reach for primitives only when
   showing literal hex values or pinning a theme.
3. Export the component + all its public types.
4. Add exports to `index.ts` under the appropriate section header.
5. Write `Foo.stories.tsx` covering at least: default, each named variant/state, and a
   dark stage if relevant.
6. If the component needs to show up in `/design` (the curated in-app catalog), add a
   `Cell` to the relevant section of `src/app/design/page.tsx`.
7. Run `pnpm lint && pnpm typecheck && pnpm build-storybook` before opening the PR.

## 8. Promotion from `features/conversation/`

If a component in `src/features/conversation/components/` turns out to be reusable and
presentational, promote it:

1. Move the file to `src/components/convo-ui/`. Strip product-specific constants
   (e.g. don't import `ADA_AGENT_NAME` — take a `name` prop instead).
2. Swap any remaining product-specific tokens to semantic tokens during the move.
3. Add to `index.ts`, write stories.
4. Update the feature-side imports to come from `@/components/convo-ui`.
5. Delete the original file.

`Ambient`, `Persona`, `Transcript`, `VoiceLangMenu` (and later `BrandMark`,
`ConnectionIndicator`, `ErrorToast`) were promoted this way; treat them as worked examples.

## 9. Non-goals

- **Not a published package.** `convo-ui` is in-tree. Extraction to `packages/` or npm
  is explicitly deferred. Design the API as though it might be extracted, but don't
  add package.json, version bumps, or changelog ceremony yet.
- **Not a shadcn clone.** Shadcn's naming conventions inspire the semantic layer
  (`background`, `foreground`, `border`, `accent`), but the library leans on
  motion-driven, Canvas, and SVG primitives rather than wrapping Radix.
- **Not responsible for Agora wiring.** Never import `agora-*` into `convo-ui`. If you
  need a live audio track, accept a `MediaStreamTrack | null` prop and let the caller
  source it.
