# Agora Conversational AI Next.js Quickstart

> **English** · [简体中文](./README_zh-CN.md)
>
> The Next.js entry in Agora's official Conversational AI demo family. On top of the baseline demo, this quickstart ships substantial **design & UX polish**, runs **out of the box** with just two env vars, and bundles a reusable **voice UI component library** (`convo-ui`) you can extend into your own product.

<p align="center">
  <img src=".github/assets/Conversation-Ai-Client.gif" alt="Conversational AI demo" width="720" />
</p>

## Highlights

- **Karaoke-style live captions** — word-level highlighting anchored to the agent's TTS playback position, not server timestamps. Interruptions switch the caption signal to whoever is actually speaking.
- **Real-time end-to-end latency indicator** — the agent's own latency data is surfaced as a 4-bar gauge (green / yellow / red) so you can tell at a glance whether the call is healthy.
- **Voice-native UI** — canvas `VoiceOrb`, multiple waveform visualizations, streaming subtitle, tool-call card, connection indicator, barge-in cue — all tuned for real conversational UX rather than adapted from generic chat UI.
- **`convo-ui` component library** — 28 components packaged as an independent in-tree library. Browse the catalog at `/design`, or run `pnpm storybook` for isolated dev with light/dark toggle and accessibility checks.
- **Single view-state machine** — RTC connection, RTM login, mic mute, and agent state collapse into one enum, so the UI never flickers mid-call or tells you to "start talking" before the agent has greeted you.
- **Two env vars and you're running** — Agora-managed STT + LLM + TTS kick in by default, so you can hear the first "hello" without signing up for any third-party vendor.

## Quickstart

```bash
git clone https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs.git
cd agent-quickstart-nextjs
pnpm install
cp env.local.example .env.local    # then fill in the two Agora vars
pnpm dev
```

Open `http://localhost:3000`.

Required env vars (create a project in [Agora Console](https://console.agora.io/) to obtain them):

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_AGORA_APP_ID` | client + server |
| `NEXT_AGORA_APP_CERTIFICATE` | server only — never expose |

Optional: `NEXT_PUBLIC_AGENT_UID` (defaults to `123456`), `NEXT_AGENT_GREETING` (overrides the opening line).

## Customize

| I want to change… | Where |
| --- | --- |
| Agent's system prompt + greeting | `src/features/conversation/server/invite-agent-config.ts` |
| VAD / model / voice pipeline | `src/app/api/invite-agent/route.ts` |
| Bring your own LLM | `src/app/api/chat/completions/route.ts` + set `NEXT_LLM_URL` / `NEXT_LLM_API_KEY` |
| Swap STT / TTS vendors | uncomment the Deepgram / ElevenLabs blocks in `src/app/api/invite-agent/route.ts` |
| UI components + theme | `src/components/convo-ui/` — browse at `/design`, or run `pnpm storybook` |

BYOK examples (Deepgram STT, ElevenLabs TTS, custom LLM) live commented in the invite-agent route. A custom LLM proxy needs a public URL — use `ngrok http 3000` in dev since Agora's cloud can't reach `localhost`.

## Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./system-architecture-dark.svg">
  <img src="./system-architecture.svg" alt="System architecture" />
</picture>

Browser requests a token → server invites an Agora cloud agent into the channel → browser joins RTC and publishes mic, listens over RTM for live transcripts and agent state → session ends with `/api/stop-conversation`.

Full directory map, data flow, and per-route contracts live in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAgoraIO-Conversational-AI%2Fagent-quickstart-nextjs&project-name=agent-quickstart-nextjs&repository-name=agent-quickstart-nextjs&env=NEXT_PUBLIC_AGORA_APP_ID,NEXT_AGORA_APP_CERTIFICATE&envDescription=Agora%20credentials%20needed%20to%20run%20the%20app&envLink=https%3A%2F%2Fgithub.com%2FAgoraIO-Conversational-AI%2Fagent-quickstart-nextjs%23run-it&demo-title=Agora%20Conversational%20AI%20Next.js%20Quickstart&demo-description=Official%20Next.js%20quickstart%20for%20building%20browser-based%20voice%20AI%20with%20Agora&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2FAgoraIO-Conversational-AI%2Fagent-quickstart-nextjs%2Fmain%2F.github%2Fassets%2FConversation-Ai-Client.gif)

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — directory tree, data flow, API routes, components
- [AGENTS.md](./AGENTS.md) — operational rules for AI coding agents, known gotchas, styling conventions
- [docs/guides/GUIDE.md](./docs/guides/GUIDE.md) — step-by-step build guide
- [docs/guides/TEXT_STREAMING_GUIDE.md](./docs/guides/TEXT_STREAMING_GUIDE.md) — transcript / text-streaming deep-dive
- [docs/decisions/](./docs/decisions/) — ADRs behind structural choices

## Acknowledgements

Built on top of [AgoraIO-Conversational-AI/agent-quickstart-nextjs](https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs) — thanks to the upstream team for the baseline demo this quickstart extends.
