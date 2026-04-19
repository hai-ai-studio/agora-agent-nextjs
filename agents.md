# Agent Codex — agora-convoai-quickstart-nextjs

> Machine-readable project map. Read this before touching any file.

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
      lib/
        transcript.ts                  — pure helpers: normalizeTranscript, getMessageList,
                                         getCurrentInProgressMessage, normalizeTimestampMs,
                                         toMessageListItem, normalizeTranscriptSpacing
        visualizer-state.ts            — mapAgentVisualizerState (RTC + agent signals → AgentVisualizerState)
        audio.ts                       — useAudioFFT hook (MediaStreamTrack → bass/mid/treble bands)
        agora-config.ts                — DEFAULT_AGENT_UID constant (123456)
      server/
        invite-agent-config.ts         — ADA_PROMPT, GREETING, AGENT_UID (imported by invite-agent route)
      types.ts                         — AgoraTokenData, ClientStartRequest, AgentResponse,
                                         ConversationComponentProps, StopConversationRequest

    visualizer-lab/
      components/
        AgentShaderVisualizer/         — WebGL shader visualizer used at /lab/visualizer only
          index.tsx                    — React component
          gl.ts                        — minimal WebGL helper (no deps)
          shader.ts                    — vertex + fragment GLSL

  components/
    ErrorBoundary.tsx                  — last-resort recovery UI for the in-call tree
    LoadingSkeleton.tsx                — Suspense fallback for the lazy-loaded ConversationShell
    ui/
      button.tsx                       — shadcn button (consumed by ErrorBoundary + /lab)
      dropdown-menu.tsx                — shadcn dropdown (consumed by /lab)

  hooks/
    use-mobile.tsx                     — useIsMobile() — viewport < 768 px

  lib/
    utils.ts                           — cn() (clsx + tailwind-merge)

  types/
    env.d.ts                           — ProcessEnv index-signature augment
    jsx.d.ts                           — JSX.IntrinsicElements augment
    react-jsx.d.ts                     — /// <reference types="react" />

docs/
  GUIDE.md                             — step-by-step build guide
  TEXT_STREAMING_GUIDE.md              — transcription/text-streaming deep-dive
  plans/                               — dated design docs (not implementation reference)
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

- `Persona`, `Waveform`, `Transcript`, `Controls`, `VoiceSelector`, `MicPicker`, `Ambient` directly under `src/features/conversation/components/` (no `aria/` subfolder). No uikit runtime component is rendered.
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

## 8. Known Gotchas

1. **`useJoin` owns `client.leave()`** — never call it manually. Causes `AgoraRTCError WS_ABORT: LEAVE`.

2. **StrictMode double-init** — `useStrictModeReady` (`setTimeout(fn,0)` + synchronous cleanup) prevents dual mic track creation and double `AgoraVoiceAI` init. Do not remove. `useAgoraVoiceAI`'s init effect is also gated on `enabled: isReady && joinSuccess` — by the time `joinSuccess` flips to `true`, the StrictMode cycle is done and the effect runs exactly once.

3. **`NEXT_PUBLIC_AGENT_UID` must match exactly** — `ConversationShell` compares `user.uid.toString() === agentUID` when deriving `isAgentConnected`. A mismatch means the UI never flips past `connecting`.

4. **RTM token** — must use `RtcTokenBuilder.buildTokenWithRtm`. A plain RTC token silently fails RTM login.

5. **UID remapping** — `uid="0"` is the toolkit's sentinel for local user speech. The uikit treats `uid===0` as AI. Without `normalizeTranscript`, user speech renders on the wrong side.

6. **`enable_rtm: true`** — without this in `advancedFeatures`, the agent joins but never sends RTM messages, so `TRANSCRIPT_UPDATED` never fires.

7. **Tailwind + uikit** — `tailwind.config.ts` must include `./node_modules/agora-agent-uikit/dist/**/*.{js,mjs}` or uikit component styles won't apply. Its `content` glob also scans `./src/**` after the `src/` layout migration.

8. **Custom LLM proxy needs public URL** — `localhost` is not reachable by Agora's cloud. Use `ngrok http 3000` in dev.

9. **Deprecated turn detection API** — use `turnDetection.config.start_of_speech` / `end_of_speech`. The old `type: 'agora_vad'` flat structure is deprecated.

10. **Shader visualizer track stability** — `getMediaStreamTrack()` on `IRemoteAudioTrack` / `IMicrophoneAudioTrack` may return a new object per call. Memoize on the upstream Agora track reference when passing tracks to `useAudioFFT`.

11. **Transcript `turn_id` uniqueness** — `turn_id` is scoped per speaker. Use a composite React key (`${uid}-${turn_id}`) when rendering transcript entries, otherwise user + agent turns with the same index collide.

12. **No `useState` + effect for derived data** — React 19's `react-hooks/set-state-in-effect` rule errors on patterns like `useEffect(() => setFoo(derived), [deps])`. Use `useMemo` instead. See `isAgentConnected` in `ConversationShell`.
