# AGENTS.md

> Operational rules for AI agents (Claude Code, Cursor, any other) working in this repo.
> For the top-level map — directory layout, data flow, API routes, components — read [`ARCHITECTURE.md`](./ARCHITECTURE.md).
> For the "why" behind structural decisions, read [`docs/decisions/`](./docs/decisions/).

## Project

Next.js 16 (App Router) quickstart demonstrating Agora Conversational AI Engine. Developers copy this code — production quality and idiomatic patterns are required in every change.

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

### Conversation View Layer

Presentational components (`Ambient`, `Persona`, `Waveform` variants, `Transcript`, `VoiceLangMenu`, etc.) live in `src/components/convo-ui/` — see [`docs/guides/CONVO_UI.md`](./docs/guides/CONVO_UI.md). The business shell lives under `src/features/conversation/components/`: `LandingPage`, `ConversationShell`, `Waveform` (Agora audio-track adapter), `Controls` + `MicPicker` (pill-shaped dock). View-state enum + mapper + copy constants live in `features/conversation/lib/view-state.ts`.

`ConversationShell` keeps all Agora wiring (hooks, StrictMode guard, `useAgoraVoiceAI`, `useTokenRefresh`) and maps the existing `visualizerState` into the view-state enum via `mapToViewState(visualizerState, agentState, isMuted)`.

**Agent name:** "Ada" — `ADA_AGENT_NAME` constant in `view-state.ts` is the single source of truth. The old "Aria skin" name was retired 2026-04-20; see [`docs/decisions/0006-aria-skin-ada-agent.md`](./docs/decisions/0006-aria-skin-ada-agent.md) (Superseded).

### Styling + animation conventions

- **Layout / colors / typography / borders / spacing**: Tailwind utilities on the JSX.
- **Animations**: `motion/react` first (enter/exit, state-driven transitions, infinite decorative loops). CSS `@keyframes` only as fallback.
- **State cascades** (e.g. parent state → child color): compute inline `style` from props, not parent-class CSS selectors.
- **`src/app/globals.css`** is tokens + `body` base only — no component styling, no animations.
- **Dark mode**: tokens flip in the root `@media (prefers-color-scheme: dark)` block. `darkMode: "media"` in `tailwind.config.ts` so `dark:` utilities track OS preference. Non-token dark visuals (e.g. ambient blob gradients) read `useSyncExternalStore(matchMedia)` in the component.
- **Reduced motion**: `motion/react` honors `useReducedMotion()` automatically — prefer motion components for decoration so this works without extra CSS.

Fonts come from `next/font/google` (Inter Tight, Instrument Serif, JetBrains Mono) wired in `src/app/layout.tsx`. The Voice Agent DS additionally loads Geist + Geist Mono on top, exposed as the `font-geist` / `font-geist-mono` utilities — used only by components from the `convo-ui` package and the `/design` catalog.

### Voice Agent Design System

`src/components/convo-ui/` is the single DS for this project, with its own token set (`--voice-a/b/c`, warm neutrals, semantic roles, `--font-geist`). Rendered in catalog form at `/design`. Future extraction to a standalone npm package or a shadcn registry stays open — not today's scope.

**Storybook 10** lives at the repo root (`.storybook/`). Every component has a co-located `*.stories.tsx` file under `src/components/convo-ui/`. Run `pnpm storybook` for the dev server; `pnpm build-storybook` produces a static export. `@storybook/addon-a11y` runs axe-core on each story; `@storybook/addon-themes` provides a Light / Dark toggle via the `dark:` class.

Rule: **new feature UI reaches for `convo-ui` primitives first**; the conversation feature has been migrated onto them as of 2026-04-20. See `docs/decisions/0003-voice-design-system.md`.

## Architecture layers

| Layer | Package | Role |
|---|---|---|
| Client UI | `agora-rtc-react` | RTC hooks (`useJoin`, `useLocalMicrophoneTrack`, `usePublish`, etc.) |
| Toolkit core | `agora-agent-client-toolkit` | `AgoraVoiceAI`, `TurnStatus` enum, `TranscriptHelperItem` types |
| UI components | `agora-agent-uikit` | Type exports (`AgentVisualizerState`, `IMessageListItem`) consumed by helpers in `src/features/conversation/lib/`. Its runtime components are no longer rendered in the main flow. |
| View layer | `src/components/convo-ui/` + `src/features/conversation/components/` | Presentational primitives in `convo-ui`; business shell (LandingPage, ConversationShell, Waveform, Controls, MicPicker) in features. State machine in `features/conversation/lib/view-state.ts`. |
| Design system | `src/components/convo-ui/` | Voice Agent DS primitives (28 components + hooks) — rendered at `/design` |
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
| `src/app/design/page.tsx` | Voice Agent DS catalog — renders all 18 DS primitives + composition |
| `src/components/convo-ui/` | Voice Agent DS primitives (canvas + DOM, Tailwind-first) — in-tree, rendered at `/design` |
| `src/app/api/invite-agent/route.ts` | Starts AI agent — edit for VAD, model, voice (prompt lives in the config file) |
| `src/app/api/generate-agora-token/route.ts` | Issues RTC+RTM token for the browser user |
| `src/app/api/stop-conversation/route.ts` | Stops the agent |
| `docs/guides/GUIDE.md` | Step-by-step build guide — must stay in sync with implementation |
| `docs/guides/TEXT_STREAMING_GUIDE.md` | Text streaming / transcription deep-dive |
| `ARCHITECTURE.md` | Top-level map — directory tree, data flow, API routes, components |

## Known Gotchas

1. **`useJoin` owns `client.leave()`** — never call it manually. Causes `AgoraRTCError WS_ABORT: LEAVE`.

2. **StrictMode double-init** — `useStrictModeReady` (`setTimeout(fn,0)` + synchronous cleanup) prevents dual mic track creation and double `AgoraVoiceAI` init. Do not remove. `useAgoraVoiceAI`'s init effect is also gated on `enabled: isReady && joinSuccess` — by the time `joinSuccess` flips to `true`, the StrictMode cycle is done and the effect runs exactly once.

3. **`NEXT_PUBLIC_AGENT_UID` must match exactly** — `ConversationShell` compares `user.uid.toString() === agentUID` when deriving `isAgentConnected`. A mismatch means the UI never flips past `connecting`.

4. **RTM token** — must use `RtcTokenBuilder.buildTokenWithRtm`. A plain RTC token silently fails RTM login.

5. **UID remapping** — `uid="0"` is the toolkit's sentinel for local user speech. The uikit treats `uid===0` as AI. Without `normalizeTranscript`, user speech renders on the wrong side.

6. **`enable_rtm: true`** — without this in `advancedFeatures`, the agent joins but never sends RTM messages, so `TRANSCRIPT_UPDATED` never fires.

7. **Tailwind + uikit** — `tailwind.config.ts` must include `./node_modules/agora-agent-uikit/dist/**/*.{js,mjs}` or uikit component styles won't apply. Its `content` glob also scans `./src/**` after the `src/` layout migration.

8. **Custom LLM proxy needs public URL** — `localhost` is not reachable by Agora's cloud. Use `ngrok http 3000` in dev.

9. **Deprecated turn detection API** — use `turnDetection.config.start_of_speech` / `end_of_speech`. The old `type: 'agora_vad'` flat structure is deprecated.

10. **Audio track stability for FFT** — `getMediaStreamTrack()` on `IRemoteAudioTrack` / `IMicrophoneAudioTrack` may return a new object per call. Memoize on the upstream Agora track reference when passing tracks to `useAudioFFT`.

11. **Transcript `turn_id` uniqueness** — `turn_id` is scoped per speaker. Use a composite React key (`${uid}-${turn_id}`) when rendering transcript entries, otherwise user + agent turns with the same index collide.

12. **No `useState` + effect for derived data** — React 19's `react-hooks/set-state-in-effect` rule errors on patterns like `useEffect(() => setFoo(derived), [deps])`. Use `useMemo` instead. See `isAgentConnected` in `ConversationShell`.

## After Changing Implementation Files

After editing anything in `src/features/`, `src/app/api/`, or `src/components/`, manually verify that `docs/guides/GUIDE.md`, `docs/guides/TEXT_STREAMING_GUIDE.md`, `README.md`, and `ARCHITECTURE.md` still match the implementation, then run `pnpm lint` and `pnpm build`.

## What NOT To Do

- Do not call `client.leave()` manually (breaks `useJoin` cleanup)
- Do not call `localMicrophoneTrack.close()` manually (breaks hook ownership)
- Do not remove the `useStrictModeReady` guard
- Do not set `reactStrictMode: false`
- Do not use the deprecated `turnDetection.type: 'agora_vad'` flat API — use `turnDetection.config.start_of_speech` / `end_of_speech`
- Do not recreate `isAgentConnected` as a `useState` + event-handler pair; it is derived from `remoteUsers` as a pure `useMemo` (avoids the React 19 `react-hooks/set-state-in-effect` lint error)
