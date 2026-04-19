# CLAUDE.md

> Read `agents.md` for the full project map (directory layout, API routes, data flow, known gotchas) before making changes.

## Project

Next.js 16 (App Router) quickstart demonstrating Agora Conversational AI Engine. Developers copy this code — production quality and idiomatic patterns are required in every change.

## Layout

Source lives under `src/`. Feature code is grouped under `src/features/<feature>/` (components, hooks, lib, server, types co-located). Shared primitives stay at `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`.

```
src/
  app/                                       — Next.js App Router (routes + API)
    layout.tsx  page.tsx  globals.css
    lab/visualizer/page.tsx
    api/{generate-agora-token,invite-agent,stop-conversation,chat/completions}/route.ts
  features/
    conversation/                            — main real-time feature
      components/{ConversationShell,LandingPage}.tsx
      components/{Ambient,Persona,Waveform,Transcript,Controls,VoiceSelector,MicPicker}.tsx
      components/aria-state.ts            — AriaState enum + mapToAriaState + ADA_AGENT_NAME + ARIA_HINT
      hooks/{useStrictModeReady,useAgoraVoiceAI,useTokenRefresh,useAgoraSession}.ts
      lib/{transcript,visualizer-state,audio,agora-config}.ts
      server/invite-agent-config.ts          — system prompt + greeting (imported by api route)
      types.ts
    visualizer-lab/
      components/AgentShaderVisualizer/{index,gl,shader}.tsx|ts
  components/{ErrorBoundary,LoadingSkeleton,ui/*}.tsx
  hooks/use-mobile.tsx
  lib/utils.ts
  types/{env,jsx,react-jsx}.d.ts
```

## Commands

```bash
pnpm dev      # start dev server (http://localhost:3000)
pnpm build    # production build
pnpm lint     # ESLint
```

## Key Patterns

### StrictMode Guard (`useStrictModeReady`)

Both `useJoin` and `useLocalMicrophoneTrack` are gated by the boolean returned from `useStrictModeReady()` (`src/features/conversation/hooks/useStrictModeReady.ts`) to prevent double-initialization in React StrictMode dev mode. The cleanup fires synchronously before any `setTimeout`, so only the real second mount's timer fires.

```tsx
const isReady = useStrictModeReady();
const { isConnected: joinSuccess } = useJoin(config, isReady);
const { localMicrophoneTrack } = useLocalMicrophoneTrack(isReady);
```

Do not remove this pattern. Do not set `reactStrictMode: false` as a workaround.

### Hook Ownership

- `useJoin` owns `client.leave()` — **never call it manually**
- `useLocalMicrophoneTrack` owns track lifecycle — **no manual `.close()`**
- `usePublish` owns publish state — mute via `track.setEnabled()` only, never unpublish manually

### AgoraVoiceAI Init — `useAgoraVoiceAI({ enabled: isReady && joinSuccess })`

The toolkit lifecycle lives in `src/features/conversation/hooks/useAgoraVoiceAI.ts`. `ConversationShell` calls it with `enabled: isReady && joinSuccess` so `AgoraVoiceAI.init()` fires exactly once past the StrictMode fake-unmount cycle.

**Why `isReady && joinSuccess` works:**
- `isReady` is `true` only after the StrictMode fake-unmount cycle completes (via the `setTimeout(fn, 0)` pattern inside `useStrictModeReady`).
- Once `isReady` is `true`, React does NOT double-invoke the effect for subsequent dependency changes (`joinSuccess` becoming `true`). So `AgoraVoiceAI.init()` runs exactly once.

Transcript + agent state are returned from the hook (`rawTranscript`, `agentState`); `ConversationShell` memoizes `transcript`, `messageList`, and `currentInProgressMessage` on top.

### UID Remapping

The toolkit uses `uid="0"` as a sentinel for the local user's speech. The uikit treats `uid===0` as an AI message. `normalizeTranscript` (in `src/features/conversation/lib/transcript.ts`) remaps it to `client.uid` — without this, ConvoTextStream shows user speech on the wrong side.

### `messageList` Filter

Include `INTERRUPTED` turns in `messageList` (filter only `IN_PROGRESS`). If the agent's first turn is interrupted, omitting it means `messageList` stays empty and `ConvoTextStream` never auto-opens. Enforced in `getMessageList` (`src/features/conversation/lib/transcript.ts`).

### Aria View Layer

The main conversation UI is the editorial "Aria" skin under `src/features/conversation/components/`: `Ambient` (drifting blob background), `Persona` (concentric-ring avatar + status pill + call timer), `Waveform` (two-row SVG bar visualizer, agent + user), `Transcript` (glass side panel with typewriter caret), `Controls` + `VoiceSelector` + `MicPicker` (pill-shaped dock). Aria state enum + mapper + copy constants live in `components/aria-state.ts`.

`ConversationShell` (`src/features/conversation/components/ConversationShell.tsx`) keeps all Agora wiring (hooks, StrictMode guard, `useAgoraVoiceAI`, `useTokenRefresh`) and maps the existing `visualizerState` into Aria's state enum via `mapToAriaState(visualizerState, agentState, isMuted)` from `components/aria-state.ts`.

### Styling + animation conventions

- **Layout / colors / typography / borders / spacing**: Tailwind utilities on the JSX.
- **Animations**: `motion/react` first (enter/exit, state-driven transitions, infinite decorative loops). CSS `@keyframes` only as fallback.
- **State cascades** (e.g. parent state → child color): compute inline `style` from props, not parent-class CSS selectors.
- **`src/app/globals.css`** is tokens + `body` base only — no component styling, no animations, no `.aria-shell *` rules.
- **Dark mode**: tokens flip in the root `@media (prefers-color-scheme: dark)` block. `darkMode: "media"` in `tailwind.config.ts` so `dark:` utilities track OS preference. Non-token dark visuals (e.g. ambient blob gradients) read `useSyncExternalStore(matchMedia)` in the component.
- **Reduced motion**: `motion/react` honors `useReducedMotion()` automatically — prefer motion components for decoration so this works without extra CSS.

Fonts come from `next/font/google` (Inter Tight, Instrument Serif, JetBrains Mono) wired in `src/app/layout.tsx`.

The shader visualizer (`src/features/visualizer-lab/components/AgentShaderVisualizer/`) stays in the codebase but is only rendered at `/lab/visualizer`. It is not used by the main conversation flow.

## Architecture

| Layer | Package | Role |
|---|---|---|
| Client UI | `agora-rtc-react` | RTC hooks (`useJoin`, `useLocalMicrophoneTrack`, `usePublish`, etc.) |
| Toolkit core | `agora-agent-client-toolkit` | `AgoraVoiceAI`, `TurnStatus` enum, `TranscriptHelperItem` types |
| UI components | `agora-agent-uikit` | Type exports (`AgentVisualizerState`, `IMessageListItem`) consumed by helpers in `src/features/conversation/lib/`. Its runtime components are no longer rendered in the main flow. |
| View layer | `src/features/conversation/components/` | Ambient, Persona, Waveform, Transcript, Controls, VoiceSelector, MicPicker + aria-state |
| Visualizer (lab) | `src/features/visualizer-lab/components/AgentShaderVisualizer/` | WebGL shader visualizer — `/lab/visualizer` only |
| Server SDK | `agora-agent-server-sdk` | Builder pattern — `AgoraClient` → `Agent` → `session.start()` |
| Messaging | `agora-rtm` | RTM transport for transcripts |

RTM token must be generated with `RtcTokenBuilder.buildTokenWithRtm` — a standard RTC-only token does not grant RTM access.

Tailwind must scan uikit classes: `./node_modules/agora-agent-uikit/dist/**/*.{js,mjs}` in `tailwind.config.ts`.

## Important Files

| File | Purpose |
|---|---|
| `src/features/conversation/components/ConversationShell.tsx` | Core real-time UI — Agora hooks, mic toggle, render |
| `src/features/conversation/components/LandingPage.tsx` | Entry point — pre-call screen, delegates orchestration to `useAgoraSession` |
| `src/features/conversation/hooks/useAgoraSession.ts` | Token fetch + agent invite + RTM lifecycle, returns start/end/renew |
| `src/features/conversation/hooks/useAgoraVoiceAI.ts` | AgoraVoiceAI init + transcript/agent state + RTM error stream |
| `src/features/conversation/hooks/useStrictModeReady.ts` | `setTimeout(fn, 0)` StrictMode guard |
| `src/features/conversation/hooks/useTokenRefresh.ts` | Renews RTC + RTM tokens on `token-privilege-will-expire` |
| `src/features/conversation/lib/transcript.ts` | Pure helpers: normalize, messageList, currentInProgressMessage |
| `src/features/conversation/lib/visualizer-state.ts` | `mapAgentVisualizerState` — RTC + agent signals → AgentVisualizerState |
| `src/features/conversation/lib/agora-config.ts` | `DEFAULT_AGENT_UID` constant |
| `src/features/conversation/server/invite-agent-config.ts` | `ADA_PROMPT`, `GREETING`, `AGENT_UID` — edit for agent persona |
| `src/features/visualizer-lab/components/AgentShaderVisualizer/` | WebGL shader + FFT hook + palette reader |
| `src/app/lab/visualizer/page.tsx` | Standalone playground for tuning the shader visualizer |
| `src/app/api/invite-agent/route.ts` | Starts AI agent — edit for VAD, model, voice (prompt lives in the config file) |
| `src/app/api/generate-agora-token/route.ts` | Issues RTC+RTM token for the browser user |
| `src/app/api/stop-conversation/route.ts` | Stops the agent |
| `docs/GUIDE.md` | Step-by-step build guide — must stay in sync with implementation |
| `docs/TEXT_STREAMING_GUIDE.md` | Text streaming / transcription deep-dive |
| `agents.md` | Machine-readable project map for AI context |

## After Changing Implementation Files

After editing anything in `src/features/`, `src/app/api/`, or `src/components/`, manually verify that `docs/GUIDE.md`, `docs/TEXT_STREAMING_GUIDE.md`, `README.md`, and `agents.md` still match the implementation, then run `pnpm lint` and `pnpm build`.

## What NOT To Do

- Do not call `client.leave()` manually (breaks `useJoin` cleanup)
- Do not call `localMicrophoneTrack.close()` manually (breaks hook ownership)
- Do not remove the `useStrictModeReady` guard
- Do not set `reactStrictMode: false`
- Do not use the deprecated `turnDetection.type: 'agora_vad'` flat API — use `turnDetection.config.start_of_speech` / `end_of_speech`
- Do not recreate `isAgentConnected` as a `useState` + event-handler pair; it is derived from `remoteUsers` as a pure `useMemo` (avoids the React 19 `react-hooks/set-state-in-effect` lint error)
