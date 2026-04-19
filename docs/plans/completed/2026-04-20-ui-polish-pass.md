# UI Polish Pass — Conversation UX

> Date: 2026-04-20
> Scope: `components/ConversationComponent.tsx`, `components/LandingPage.tsx`, `app/globals.css`
> Goal: Close the biggest first-impression gaps in the voice-AI quickstart without changing any Agora wiring.

## Motivation

Walking the main path (`LandingPage` → `ConversationComponent`) from a designer's perspective, five things hurt the first-run experience disproportionately:

1. The end-call button uses "close modal" semantics (red X, top-right) instead of "hang up".
2. `ConnectionStatusPanel` is currently commented out, so every tracked RTM/agent issue is invisible to the user.
3. The `AgentVisualizer` is abstract — no text tells the user whether the agent is listening, thinking, or speaking.
4. After joining, there is no cue that the agent is ready for the user to start talking.
5. All animations run regardless of `prefers-reduced-motion`.

These are all cheap to fix and each one is independently shippable.

## Non-goals

- No structural refactor of the transcript panel (that's a bigger design decision — deferred).
- No changes to hooks / StrictMode guards / RTC lifecycle.
- No new dependencies.
- No doc rewrites beyond what is needed to keep `GUIDE.md` / `agents.md` / `README.md` truthful.

## Work items

### 1. `prefers-reduced-motion` guard — CSS only
**File:** `app/globals.css`
**Change:** Append a `@media (prefers-reduced-motion: reduce)` block that disables `fade-up`, `chat-pulse`, and the `.chatbox` height transition.
**Why first:** Zero behavioral risk, and it lets later animation additions (item 4) inherit the guard automatically.

### 2. Visualizer state label
**File:** `components/ConversationComponent.tsx`
**Change:** Under `<AgentVisualizer />`, render a 12–13px muted label driven by `visualizerState`:

| visualizerState | Label |
|---|---|
| `joining` | "Connecting…" |
| `not-joined` | "Waiting for agent…" |
| `listening` | "Listening" |
| `analyzing` | "Thinking…" |
| `talking` | "Speaking" |
| `ambient` | (empty) |
| `disconnected` | "Disconnected" |

Mark `aria-live="polite"` so screen readers announce state transitions.

### 3. End-call button redesign
**File:** `components/ConversationComponent.tsx:468-479`
**Change:**
- Swap `X` → `PhoneOff` (already available in `lucide-react`).
- Default state: neutral `ghost` style (transparent bg, border-border, muted-foreground icon).
- Hover / focus: destructive red. This preserves affordance without making the "live" screen feel angry.
- Keep `aria-label="End conversation with AI agent"` and `title="End conversation"`.

### 4. First-turn readiness hint
**File:** `components/ConversationComponent.tsx`
**Change:** When the agent enters `listening` for the **first time** in a session, fade in a small caption under the visualizer label: "Say hi — the agent is listening". Auto-dismiss after 4s or on first user speech turn. Hide permanently once dismissed (don't re-show across later listening transitions).
**Implementation sketch:** Track `hasShownReadyHint` ref + `showReadyHint` state. Set `showReadyHint=true` on first `listening`, `setTimeout` to flip it off.

### 5. Restore `ConnectionStatusPanel` — smaller, inline with the visualizer
**File:** `components/ConversationComponent.tsx:457-465`
**Change:**
- Un-comment the panel.
- Move from `absolute top-4 left-4` (competes with the X button symmetrically) to `absolute top-4 left-4` but render only the status *dot* by default; the expanded details panel is fine where it is.
- Ensure the `animate-ping` dot respects `prefers-reduced-motion` (handled by item 1's global guard — verify it covers `animate-ping`).

## Execution order

1. Item 1 (CSS guard) — safest, lands first.
2. Item 2 (state label) — small, visible win.
3. Item 3 (end-call button) — visual change, easy to eyeball.
4. Item 4 (first-turn hint) — depends on item 2 structure.
5. Item 5 (connection status) — largest diff; does last so prior items aren't blocked by review.

## Verification

- `pnpm lint` after each item.
- `pnpm build` once at the end (per CLAUDE.md: prefer `lint` + `typecheck` + `build` over `next dev` for correctness checks).
- Manually cross-check `DOCS/GUIDE.md` and `agents.md` — neither describes the end-call icon or status panel placement at a level of detail that needs updating, but confirm before closing.

## Out of scope (tracked separately)

- Transcript FAB unread indicator + `animate-chat-pulse` wiring.
- Desktop persistent transcript side panel.
- Pre-call example prompts.
- `Powered by Agora` footer hide during live session.
- Muted-state text pill.
- Visualizer framing glow + LoadingSkeleton crossfade.
