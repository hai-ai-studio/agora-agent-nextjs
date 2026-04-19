# 0001 — `src/features/<feature>/` layout

- Date: 2026-04-20
- Status: Accepted
- Supersedes: flat `components/` + `lib/` + `hooks/` + `types/` at repo root (the Next.js default)

## Context

The project started with Next.js's default flat layout: `components/`, `lib/`, `hooks/`, `types/` all at the repo root. As the conversation feature grew — transcript helpers, Agora lifecycle hooks, aria view layer, server-side agent config — related code scattered across those four top-level folders. Finding "everything about the conversation feature" required grep rather than navigation. Refactors also touched many folders because a single concern was split across them.

At the same time, we kept shared primitives (ErrorBoundary, shadcn UI building blocks, `use-mobile`, `cn()` utility) whose natural home is "global", not "inside a feature".

## Decision

Adopt `src/features/<feature>/` co-location:

- Application source moves under `src/`.
- Feature code lives in `src/features/<feature>/` with internal folders: `components/`, `hooks/`, `lib/`, `server/`, `types.ts`.
- Shared primitives stay at `src/components/`, `src/hooks/`, `src/lib/`, `src/types/`.
- Two features today: `conversation` (main real-time experience) and `visualizer-lab` (the `/lab/visualizer` WebGL playground).

Conversation feature layout:

```
src/features/conversation/
  components/   — UI layer (LandingPage, ConversationShell, Persona, Waveform, Transcript, Controls, …)
  hooks/        — useStrictModeReady, useAgoraVoiceAI, useTokenRefresh, useAgoraSession
  lib/          — pure helpers: transcript, visualizer-state, audio, agora-config
  server/       — server-only modules (invite-agent-config.ts — prompt + greeting)
  types.ts      — cross-module types (API shapes, component props)
```

## Consequences

**Good:**

- Changing one feature touches one folder subtree.
- New contributors find "where does X live" by scanning `src/features/`.
- Server-only code is clearly separated (`server/` subfolder), reducing the risk of leaking server constants into the client bundle.
- Import paths become self-documenting (`@/features/conversation/hooks/useAgoraVoiceAI` vs `@/hooks/useAgoraVoiceAI`).

**Bad:**

- Longer import paths than the flat layout.
- Mild risk of premature abstraction — a "feature" with only 2-3 files is smaller than its folder structure suggests. Current project has one real feature (`conversation`); `visualizer-lab` is borderline (one component, no hooks/lib/server).
- The step-by-step tutorial (`docs/guides/GUIDE.md`) uses a flat layout for pedagogical clarity — there is now a small gap between what the tutorial shows and what the repo ships. GUIDE.md carries a top-level note acknowledging this.

## Alternatives considered

- **Keep the flat layout.** Rejected: scaling problem was already visible with one feature.
- **Group by role globally** (e.g. `src/components/conversation/`, `src/hooks/conversation/`, etc.). Rejected: same downside as flat — changes still touch many folders per feature.
- **Nx or Turborepo monorepo with per-package isolation.** Rejected: massive overkill for a quickstart.
