# Architecture — agora-convoai-quickstart-nextjs

> Top-level map. Read this to orient. Agent-facing operational rules live in [`AGENTS.md`](./AGENTS.md). Decisions behind this structure live in [`docs/decisions/`](./docs/decisions/).

---

## 1. What This Project Is

A Next.js 16 (App Router) quickstart that lets a browser user speak with an Agora Conversational AI agent. The browser joins an Agora RTC channel for audio; RTM carries real-time transcripts. A server-side call invites an Agora cloud agent into the same channel. The agent runs a full ASR → LLM → TTS voice experience and publishes audio back.

**Stack:** Next.js 16, React 19, TypeScript, Tailwind, pnpm, `agora-rtc-react`, `agora-rtm`, `agora-token`, `agora-agent-client-toolkit`, `agora-agent-uikit`, `agora-agent-server-sdk`.

---

## 2. Directory Map

All application source lives under `src/`. Feature code is grouped under `src/features/<feature>/` (components, hooks, lib, server, types co-located).

```
src/
  app/
    page.tsx                           — root page, renders <LandingPage />
    layout.tsx                         — minimal shell with next/font bindings
    globals.css                        — design tokens + body base only
    lab/
      visualizer/page.tsx              — standalone playground for AgentShaderVisualizer
    api/
      generate-agora-token/route.ts    — GET  — issues RTC+RTM token for the browser user
      invite-agent/route.ts            — POST — starts the Agora ConvoAI agent
      stop-conversation/route.ts       — POST — stops the agent
      chat/completions/route.ts        — POST — optional custom LLM proxy (OpenAI SSE format)

  features/
    conversation/
      components/
        LandingPage.tsx                — editorial pre-call screen; delegates orchestration to useAgoraSession
        ConversationShell.tsx          — in-call container; owns Agora RTC hooks, renders Aria layout
        Ambient.tsx                    — drifting blob background + grain
        Persona.tsx                    — concentric-ring avatar, status pill, call timer
        Waveform.tsx                   — SVG bar visualizer (two rows: agent + user), fluid width
        Transcript.tsx                 — glass side panel, bubbles + typewriter caret
        Controls.tsx                   — pill dock: voice, mic, transcript toggle, end-call
        VoiceSelector.tsx              — voice + language popover (UI only, not wired to backend yet)
        MicPicker.tsx                  — device picker popover (hot-swap via AgoraRTC.onMicrophoneChanged)
        aria-state.ts                  — AriaState enum + mapToAriaState + ADA_AGENT_NAME + ARIA_HINT copy
      hooks/
        useStrictModeReady.ts          — setTimeout(fn,0) StrictMode guard
        useAgoraVoiceAI.ts             — toolkit init + transcript/agent state + RTM error stream
        useTokenRefresh.ts             — renews RTC + RTM tokens on token-privilege-will-expire
        useAgoraSession.ts             — token fetch + agent invite + RTM lifecycle
        useAudioFFT.ts                 — MediaStreamTrack → bass/mid/treble band averages (shared by Waveform + lab shader)
      lib/
        transcript.ts                  — pure helpers: normalizeTranscript, getMessageList,
                                         getCurrentInProgressMessage, normalizeTimestampMs,
                                         toMessageListItem, normalizeTranscriptSpacing
        visualizer-state.ts            — mapAgentVisualizerState (RTC + agent signals → AgentVisualizerState)
        agora-config.ts                — DEFAULT_AGENT_UID constant (123456)
      server/
        invite-agent-config.ts         — ADA_PROMPT, GREETING, AGENT_UID (imported by invite-agent route)
      types.ts                         — AgoraTokenData, ClientStartRequest, AgentResponse,
                                         ConversationComponentProps, StopConversationRequest

  components/
    ErrorBoundary.tsx                  — last-resort recovery UI for the in-call tree
    LoadingSkeleton.tsx                — Suspense fallback for the lazy-loaded ConversationShell
    AgentShaderVisualizer/             — WebGL shader visualizer used at /lab/visualizer only
      index.tsx                        — React component
      gl.ts                            — minimal WebGL helper (no deps)
      shader.ts                        — vertex + fragment GLSL
    ui/
      button.tsx                       — shadcn button (consumed by ErrorBoundary + /lab)
      dropdown-menu.tsx                — shadcn dropdown (consumed by /lab)

  lib/
    utils.ts                           — cn() (clsx + tailwind-merge)

  types/
    env.d.ts                           — ProcessEnv index-signature augment
    jsx.d.ts                           — JSX.IntrinsicElements augment
    react-jsx.d.ts                     — /// <reference types="react" />

docs/
  guides/
    GUIDE.md                           — step-by-step build guide
    TEXT_STREAMING_GUIDE.md            — transcription/text-streaming deep-dive
  plans/
    active/                            — in-flight plans
    completed/                         — landed plans, historical record
    tech-debt.md                       — running list of known debt
  decisions/                           — ADRs, one per architectural choice
  design/                              — Aria design language, motion policy, component catalog
  architecture/                        — per-topic deep-dives (agora-flow, state-model, styling)
  references/                          — pinned external API surfaces (agent-context)
```

---

## 3. External Packages

### Client-side

| Package                      | Role                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `agora-rtc-react`            | RTC hooks: `useJoin`, `useLocalMicrophoneTrack`, `usePublish`, `useRemoteUsers`, `useClientEvent`    |
| `agora-rtm`                  | RTM transport — carries transcript messages from agent to browser                                    |
| `agora-agent-client-toolkit` | `AgoraVoiceAI` runtime plus core types: `TurnStatus`, `TranscriptHelperItem`, `TranscriptHelperMode` |
| `agora-agent-uikit`          | Type exports (`AgentVisualizerState`, `IMessageListItem`). Runtime components are not rendered in the main flow. |

### Server-side

| Package                  | Role                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `agora-agent-server-sdk` | `AgoraClient`, `Agent`, `DeepgramSTT`, `OpenAI`, `MiniMaxTTS` — builder pattern for starting/stopping agents |
| `agora-token`            | `RtcTokenBuilder.buildTokenWithRtm` — generates RTC+RTM combined token                                       |

---

## 4. Environment Variables

All vars live in `.env.local` (gitignored). `env.local.example` is the source of truth.

| Variable                     | Side                    | Purpose                                                                                                                         |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_AGORA_APP_ID`   | client+server           | Agora project App ID                                                                                                            |
| `NEXT_AGORA_APP_CERTIFICATE` | server only             | Signs tokens — never expose client-side                                                                                         |
| `NEXT_PUBLIC_AGENT_UID`      | client+server, optional | Agent UID override. Defaults to `123456` from `src/features/conversation/lib/agora-config.ts`, so the quickstart runs unset.    |
| `NEXT_AGENT_GREETING`        | server only, optional   | Overrides the agent's opening line. Read in `src/features/conversation/server/invite-agent-config.ts`.                          |
| `NEXT_LLM_URL`               | server only, optional   | Any OpenAI-compatible chat completions endpoint for the optional BYOK LLM block                                                 |
| `NEXT_LLM_API_KEY`           | server only, optional   | LLM API key for the optional BYOK LLM block                                                                                     |
| `NEXT_DEEPGRAM_API_KEY`      | server only, optional   | Deepgram STT API key for the optional BYOK STT block                                                                            |
| `NEXT_ELEVENLABS_API_KEY`    | server only, optional   | ElevenLabs TTS API key for the optional BYOK TTS block                                                                          |

---

## 5. API Routes

### `GET /api/generate-agora-token`

Generates an Agora RTC+RTM combined token via `RtcTokenBuilder.buildTokenWithRtm` (the `agora-token` npm package).

- Query params: `?uid=<string>&channel=<string>` (both optional)
- Returns: `{ token, uid: string, channel: string }`
- Called by: `useAgoraSession` on session start and on token renewal

**Note:** RTM access requires `buildTokenWithRtm` — a plain `buildTokenWithUid` token will not grant RTM privileges.

---

### `POST /api/invite-agent`

Starts an Agora ConvoAI agent using `agora-agent-server-sdk`.

**Input** (`ClientStartRequest`): `{ requester_id, channel_name }`

**What it does:**

1. Validates required env vars (throws on startup if missing).
2. Builds the agent: `new AgoraClient(...)` → `new Agent({ instructions, greeting, turnDetection, advancedFeatures })` → `.withStt(DeepgramSTT)` → `.withLlm(OpenAI)` → `.withTts(MiniMaxTTS)`.
3. `agent.createSession(client, { channel, agentUid, remoteUids, idleTimeout, expiresIn })`.
4. `await session.start()` → returns agent ID.
5. Returns `AgentResponse: { agent_id, create_ts, state }`.

**Where to edit:**

- System prompt + greeting: `src/features/conversation/server/invite-agent-config.ts` (`ADA_PROMPT`, `GREETING`, `AGENT_UID`).
- Pipeline plumbing (VAD, model, voice): `src/app/api/invite-agent/route.ts`.

**Turn detection** uses the current (non-deprecated) API:

```ts
turnDetection: {
  config: {
    speech_threshold: 0.5,
    start_of_speech: { mode: 'vad', vad_config: { interrupt_duration_ms, prefix_padding_ms } },
    end_of_speech: { mode: 'vad', vad_config: { silence_duration_ms } },
  },
}
```

Do not use the deprecated `type: 'agora_vad'` flat structure.

---

### `POST /api/stop-conversation`

Stops an agent. Input: `{ agent_id: string }`. Uses `agora-agent-server-sdk` internally.

---

### `POST /api/chat/completions` (optional)

Custom LLM proxy. Point the agent at your deployed URL to intercept LLM calls and add RAG, tools, guardrails. Uses Vercel AI SDK `streamText`. Model is hardcoded in the route (ignores `body.model` to prevent injection). Requires a public URL — `localhost` is not reachable by Agora's cloud.

---

## 6. Components

### `LandingPage` (`src/features/conversation/components/LandingPage.tsx`)

- Editorial pre-call screen: drifting ambient blobs, italic serif headline, ink CTA pill.
- Delegates all orchestration to `useAgoraSession()` (`src/features/conversation/hooks/useAgoraSession.ts`), which exposes `startConversation`, `endConversation`, `handleTokenWillExpire`, and the relevant session state.
- On start: preloads `agora-rtc-react` + `agora-rtm` → `Promise.all([inviteAgent, rtmLogin])` → renders `<AgoraProvider><ConversationShell>`.

---

### `ConversationShell` (`src/features/conversation/components/ConversationShell.tsx`)

Core real-time component. Must be inside `AgoraRTCProvider`.

**StrictMode guard:** `useStrictModeReady()` returns a boolean. Both `useJoin(config, isReady)` and `useLocalMicrophoneTrack(isReady)` gate on it to prevent double-initialization.

**Hook ownership:**

- `useJoin` owns `client.leave()` — do not call manually
- `useLocalMicrophoneTrack` owns track lifecycle — do not call `.close()` manually
- `usePublish` owns publish state — mute via `track.setEnabled()` only

**Transcript + agent state:** `useAgoraVoiceAI({ client, rtmClient, channel, enabled: isReady && joinSuccess })` owns `AgoraVoiceAI.init()`. It runs the init exactly once past the StrictMode double-mount cycle and returns `{ rawTranscript, agentState }`. `uid="0"` remapping (local user sentinel → `client.uid`) happens in a `useMemo` via `normalizeTranscript` over the raw transcript.

**Derived state:**

- `isAgentConnected` — `useMemo(() => remoteUsers.some(…))`. No separate state; `useRemoteUsers` already tracks user-joined/user-left internally.
- `messageList` — completed + interrupted turns (`status !== IN_PROGRESS`) via `getMessageList`.
- `currentInProgressMessage` — the single in-progress turn, if any.

**Token renewal:** `useTokenRefresh({ client, rtmClient, onTokenWillExpire })` subscribes to `token-privilege-will-expire` and calls `client.renewToken` + `rtmClient.renewToken` in parallel, reading `client.uid` at handler time.

**View layer (Aria):**

- `Persona`, `Waveform`, `Transcript`, `Controls`, `VoiceSelector`, `MicPicker`, `Ambient` directly under `src/features/conversation/components/`. No uikit runtime component is rendered.
- State mapping: `mapToAriaState(visualizerState, agentState, isMuted)` from `components/aria-state.ts` collapses `AgentVisualizerState` + agent state + local mute into Aria's 8-state enum (`connecting` / `preparing` / `idle` / `listening` / `thinking` / `speaking` / `muted` / `error`).
- Transcript data comes from `messageList` + `currentInProgressMessage` mapped into `{ speaker, text, key }` where `key = ${uid}-${turn_id}` (turn_id is per-speaker, not globally unique).

**Shader visualizer (lab-only):**

- `AgentShaderVisualizer` (`src/features/visualizer-lab/components/AgentShaderVisualizer/`) is kept in the codebase and rendered at `/lab/visualizer`. Not used in the main conversation flow. Useful as a reference for anyone tapping `MediaStreamTrack` for custom audio-reactive UI.

---

### `MicPicker` (`src/features/conversation/components/MicPicker.tsx`)

Device picker via `AgoraRTC.getMicrophones()`. Hot-swap detection via `AgoraRTC.onMicrophoneChanged`. Switching calls `localMicrophoneTrack.setDevice(deviceId)`.

---

## 7. Data Flow

```
User clicks "Start the call"  (LandingPage)
  │
  └─ useAgoraSession.startConversation():
        │
        ├─ GET /api/generate-agora-token → { token, uid, channel }
        ├─ Promise.all:
        │   ├─ POST /api/invite-agent → { agent_id }   (Agora cloud starts agent)
        │   └─ rtmClient.login(token) + rtmClient.subscribe(channel)
        │
        └─ setShowConversation(true) → render <AgoraRTCProvider><ConversationShell>
              │
              ├─ useStrictModeReady → isReady=true → useJoin joins RTC channel
              ├─ useLocalMicrophoneTrack creates mic track
              ├─ usePublish publishes mic
              │
              ├─ joinSuccess=true → useAgoraVoiceAI effect fires (enabled=isReady && joinSuccess)
              │   └─ ai.subscribeMessage(channel) — binds RTC stream-message + RTM message events
              │
              ├─ Agent joins channel → RemoteUser auto-subscribes → agent audio plays through hidden RemoteUser
              │
              ├─ Agent speaks:
              │   RTM → AgoraVoiceAI → TRANSCRIPT_UPDATED → setRawTranscript
              │   → normalizeTranscript (UID remap + spacing) → messageList/currentInProgressMessage
              │   → Transcript renders bubbles + live caret
              │
              └─ User clicks end-call button
                  → onEndConversation → useAgoraSession.endConversation
                  → POST /api/stop-conversation (fire-and-forget)
                  → rtmClient.logout()
                  → setShowConversation(false) → ConversationShell unmounts
                  → useJoin cleanup: client.leave()
                  → useAgoraVoiceAI cleanup: ai.unsubscribe() + ai.destroy()
```

---

## Where to look next

- **Operating rules / what not to do / gotchas:** [`AGENTS.md`](./AGENTS.md)
- **Decisions behind this structure:** [`docs/decisions/`](./docs/decisions/)
- **In-flight work:** [`docs/plans/active/`](./docs/plans/active/)
- **Historical plan record:** [`docs/plans/completed/`](./docs/plans/completed/)
- **Known tech debt:** [`docs/plans/tech-debt.md`](./docs/plans/tech-debt.md)
- **Step-by-step build guide:** [`docs/guides/GUIDE.md`](./docs/guides/GUIDE.md)
- **Transcript streaming deep-dive:** [`docs/guides/TEXT_STREAMING_GUIDE.md`](./docs/guides/TEXT_STREAMING_GUIDE.md)
