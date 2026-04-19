# Aria-style Redesign — Pixel-level Mimicry

> Date: 2026-04-20
> Reference: `/Users/lucasay/Downloads/agora-voice-agent/` (Aria Voice Agent)
> Goal: Replace the current conversation UI with a pixel-accurate port of the Aria design, while keeping every bit of Agora wiring intact (`useJoin` / `AgoraVoiceAI` / StrictMode guards / token refresh / etc.).

## What Aria is

A minimalist, editorial-feeling voice-agent interface. Off-white background (`#fafaf7`) with three drifting color blobs + SVG grain; Instrument Serif italic for display, Inter Tight for sans, JetBrains Mono for meta. Three-row grid layout:

- **Top bar:** brand mark + italic name on the left, `• Connected` + `End-to-end encrypted` mono meta on the right.
- **Stage:** two-column grid. Left column stacks a glass persona card (animated concentric rings around an "a" avatar, status pill, call timer), a glass waveform panel (two bar rows — "Aria" / "You" — 48 bars each, center-tall envelope), and a hint line. Right column is a fixed 340px transcript side panel.
- **Dock:** pill-shaped glass controls bar — voice selector, mic/mute, keyboard, red end-call, dashed "cycle state" debug chip.

State-driven accents: idle=ink, listening=green, thinking=amber, speaking=blue, error=red, muted=gray, ended=pale gray.

## Scope decisions (no back-and-forth, calling them now)

1. **Light mode only.** Aria is designed for light. Dark mode is a future pass.
2. **Replace `ConvoTextStream` in the main flow.** Aria's transcript is structurally different (always-visible side panel, no FAB). The uikit transcript component is kept available but not rendered.
3. **Keep `AgentShaderVisualizer` at `/lab/visualizer` only.** The main UI uses Aria's bar waveform. `NEXT_PUBLIC_SHADER_VIZ` flag is retired.
4. **Audio coupling optional for V1.** Aria's waveform runs on synthesized noise driven by `state`. For pixel-level accuracy, we replicate that math verbatim in V1. Plumbing real FFT (via `useAudioFFT`) into bar amplitudes is a follow-up — clean interface kept so we can do it in one hook swap later.
5. **Voice selector UI-only.** Aria ships a voice/language picker; we mirror the UI but do not wire it to `/api/invite-agent` in V1. Swap to functional picker is orthogonal.
6. **"Cycle state" debug chip stays.** Useful during development; hidden via CSS on production build via `process.env.NODE_ENV`.
7. **Call-ended state.** Aria shows a "Start new call" primary button in the dock. We adopt this: clicking end-call transitions to `ended`, and "Start new call" reruns the session flow (returns to landing).

## Architectural approach: thin-render-swap

Rather than rewriting `ConversationComponent.tsx` from scratch, we keep all Agora wiring (hooks, StrictMode guards, `AgoraVoiceAI` init, token refresh, connection tracking) and replace only the JSX + styling. The new visual tree lives in `components/aria/`. `ConversationComponent` becomes the behavior container that passes derived state into the Aria components.

Key mapping from existing `AgentVisualizerState` → Aria's state enum:

| Existing | Aria |
|---|---|
| `joining` | `idle` (with "Connecting" hint) |
| `not-joined` | `idle` |
| `ambient` | `idle` |
| `listening` | `listening` |
| `analyzing` | `thinking` |
| `talking` | `speaking` |
| `disconnected` | `error` |

Plus app-level states derived from other inputs: `muted` (when `!isEnabled`), `ended` (after user clicks end-call).

## File layout

```
app/
  layout.tsx                         # + Google Fonts via next/font
  globals.css                        # wholesale replacement of tokens + Aria rules
components/
  aria/
    Ambient.tsx                      # drifting blobs + grain
    Persona.tsx                      # avatar + rings + status pill + call timer
    Waveform.tsx                     # SVG bar waveform (48 bars, center-tall envelope)
    Transcript.tsx                   # side panel, bubbles + caret
    Controls.tsx                     # dock — voice selector, mic, keyboard, end-call, cycle
    VoiceSelector.tsx                # pop-up voice + language menu (UI only)
    types.ts                         # shared AriaState type + maps
  ConversationComponent.tsx          # behavior container — all existing hooks preserved, JSX replaced
  LandingPage.tsx                    # pre-call CTA restyled to match Aria's editorial look
```

Old components preserved but unused by default: `MicrophoneSelector.tsx` (folded into VoiceSelector menu section later), `ConnectionStatusPanel.tsx` (Aria uses top-bar `• Connected` pattern, superseded).

`components/AgentShaderVisualizer/` kept for `/lab/visualizer` route only.

## Typography + tokens

Add to `app/layout.tsx`:

```tsx
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
```

Replace `globals.css` `:root` tokens with Aria's set (verbatim):

```
--bg: #fafaf7; --bg-2: #f4f3ee;
--ink: #0b0b0c; --ink-2: #2a2a2d; --ink-3: #6b6b70; --ink-4: #a7a7ac;
--line: rgba(11,11,12,0.08); --line-2: rgba(11,11,12,0.14);
--card: #ffffff; --accent: #0b0b0c;
--wf-agent: #0b0b0c; --wf-user: #8a8a90;
--pill-idle: ...  --pill-listen: #16a34a  --pill-think: #b45309  ...
```

Existing Tailwind HSL tokens (`--primary`, `--destructive`, etc.) are retained only where shadcn components from `components/ui/*` still use them. We avoid reusing shadcn Button/Dropdown in the Aria surfaces — they would import their own styling conventions and break pixel match.

## Execution order

1. Fonts + token swap in `layout.tsx` + `globals.css`. Build — confirms the Google Font pipeline works before component work.
2. `components/aria/types.ts` + state-mapping helper.
3. `Ambient`, `Waveform` (pure visual, no Agora wiring).
4. `Persona` (rings + timer + status pill).
5. `Transcript` (takes `entries + activeText + activeSpeaker` — fed from existing `messageList` / `currentInProgressMessage`).
6. `Controls` + `VoiceSelector` (handlers = existing `handleMicToggle` / `onEndConversation`).
7. Rewire `ConversationComponent.tsx` return JSX to render the Aria layout.
8. Tune `LandingPage.tsx` pre-call CTA to match editorial style (brand + italic headline + minimal CTA pill).
9. Delete dead code: `USE_SHADER_VIZ` flag, old transcript panel CSS, reduced-motion overrides that targeted removed classes.
10. Update docs: `README.md`, `agents.md`, `CLAUDE.md`, `DOCS/GUIDE.md`, `DOCS/TEXT_STREAMING_GUIDE.md`.

## Verification

- `pnpm lint` + `pnpm build` after each execution step (at least after 1, 5, 7, 9).
- Visual verification needs `pnpm dev` (user's responsibility per CLAUDE.md).
- Side-by-side comparison with `/Users/lucasay/Downloads/agora-voice-agent/Aria Voice Agent.html` loaded in a separate tab.

## Risks

1. **Typography mismatch.** If the Google Fonts subset loaded via `next/font` differs from what the Aria HTML fetches at runtime, italic serif display will look subtly off. Mitigation: load the same weights/styles the Aria `<link>` uses.
2. **Transcript replacement drops features.** `ConvoTextStream` has smart scrolling, auto-open, mobile behavior. Aria's transcript is much simpler — on purpose. We lose the polish; Aria's clarity is the design trade.
3. **shadcn drift.** Any remaining shadcn `Button` in Aria surfaces will not match. We use plain `<button>` in `components/aria/*`.
4. **`isReady` / join gating still belongs to the container.** Accidentally moving those into Aria components would break StrictMode guards.
5. **Big diff.** This PR touches ~10 files. Land in one commit, not piecemeal — half-applied Aria styling is worse than either endpoint.

## Non-goals

- No dark mode.
- No real audio-reactive bar amplitudes in V1 (hook exists, swap later).
- No functional voice/language selector wiring to the backend.
- No i18n.
- No automated visual regression tests.
