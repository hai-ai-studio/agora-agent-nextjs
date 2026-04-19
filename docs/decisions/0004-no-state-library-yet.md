# 0004 — No global state library (no Zustand, no Redux) yet

- Date: 2026-04-20
- Status: Accepted
- Revisit when: a third "feature" is added, or prop-drilling exceeds 3 levels deep, or state needs cross-route persistence

## Context

As the conversation feature grew, state accumulated: mute, transcript visibility, voice selection, call state, session tokens, transcript data, agent state, connection state, etc. A common refactor question came up: should we introduce Zustand (or similar) to avoid prop-drilling and simplify sharing between components?

We considered introducing a global store and decided not to.

## Decision

No global state library. State ownership stays in React hooks co-located with the feature that owns the concern:

- `useAgoraSession` — token fetch, agent invite, RTM lifecycle (session-level).
- `useAgoraVoiceAI` — toolkit init + transcript + agent state.
- `useTokenRefresh` — token renewal subscription.
- `useStrictModeReady` — StrictMode guard.
- `useState` inside `ConversationShell` — mute, voice, transcript visibility (UI-local).
- `useState` inside `LandingPage` — handled by `useAgoraSession` hook's returns.

Prop-drilling is accepted up to ~2 levels (`ConversationShell → Controls → MicPicker`, `LandingPage → ConversationShell`). Longer drills would be the signal to revisit.

## Consequences

**Good:**

- One fewer dependency for copiers to learn. Quickstart stays focused on Agora's SDK, not state-management idioms.
- Hooks already encapsulate state by concern — they are the lightweight equivalent of scoped stores. Cross-hook coordination happens through composition, not shared global state.
- State flows are traceable by reading the component tree. No "who updated this" debugging that global stores invite.
- StrictMode + SSR gotchas are per-hook (locally reasoned) rather than a whole-app store lifecycle.

**Bad:**

- Some prop paths are long — `agoraData` / `rtmClient` pass through LandingPage → ConversationShell → wiring hooks.
- Future multi-session support (e.g. two concurrent calls, persisted history across routes) would probably need a store. Not a concern today.
- Testing cross-component behavior requires rendering the whole tree; a store would let us test a slice in isolation. Acceptable trade.

## Conditions that would flip this

Adopt Zustand (or similar) if any of these become true:

1. **Third feature lands** beyond `conversation` + `visualizer-lab` and needs to share state with `conversation` (e.g. a "call history" feature consuming transcript data).
2. **Prop-drilling exceeds 3 levels** in practice, not just occasionally.
3. **Cross-route persistence** becomes a requirement (e.g. an auth/session state that survives the pre-call → in-call boundary and lives beyond either).
4. **DevTools visibility into state transitions** is requested (Redux DevTools-class debugging).

## Related

- [0005-zod-at-boundaries-only](./0005-zod-at-boundaries-only.md) — parallel philosophy for validation.
- Zod was considered at the same time and adopted partially (at API boundaries). Zustand was considered and fully declined. Different tradeoffs; see each ADR.
