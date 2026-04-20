# 0008 — Retire the "Aria" skin name

- Date: 2026-04-20
- Status: Accepted
- Supersedes: [0006 — "Aria" is the design skin, "Ada" is the agent](./0006-aria-skin-ada-agent.md) (skin half only; the Ada agent-name decision stands)

## Context

ADR 0006 split a single "Aria" name into two roles:

- "Aria" = the design skin (CSS prefix, state enum, ease-curve token, doc prose)
- "Ada" = the agent's spoken name (greeting, transcript label, persona card)

The split solved the confusion it was designed to solve — grep was unambiguous, and renaming the agent became a one-constant change.

But the project kept moving. By 2026-04-20, `src/components/convo-ui/` is the **only** design system in-tree; the earlier coexistence-with-another-skin scenario never materialized (the separate-package setup was rolled back, no second skin was ever ported). With only one skin, the "Aria" qualifier stopped distinguishing anything — it was a unique name applied to a unique thing, which adds a lookup step without reducing ambiguity.

Worse, "Aria" also collides with the **ARIA accessibility spec** — grep for `aria` across the repo mixes `aria-label` HTML attributes, `aria-state.ts` file, `ease-aria-out` utility class, and "the Aria skin" prose. Every one of those matches is hit in roughly equal frequency for very different semantic categories.

## Decision

Retire "Aria" as the skin name. Specifically:

| Before | After |
|---|---|
| `AriaState` type | `ViewState` |
| `mapToAriaState()` | `mapToViewState()` |
| `ARIA_HINT` constant | `VIEW_HINT` |
| `src/features/conversation/lib/aria-state.ts` | `lib/view-state.ts` |
| `--ease-aria-out` CSS var + `ease-aria-out` utility | `--ease-voice-out` + `ease-voice-out` |
| Hardcoded `'Aria'` strings in convo-ui demo/stories | replaced with `'Ada'` |
| Prose like "the Aria view layer / Aria skin" | "the conversation view layer" or removed |

`ADA_AGENT_NAME` is unchanged — the agent-name decision from ADR 0006 stands.

## Consequences

**Good:**

- Grep for "aria" now only hits actual ARIA accessibility attributes. One category, one meaning.
- No skin qualifier on names that describe the only skin. `ViewState` describes what it is (state for the conversation view); `AriaState` described what-it-descended-from.
- ADR 0006's "two names to explain in docs" bad-consequence goes away — there's one name now (Ada).

**Bad:**

- Churn across ~40 files. One-shot mechanical rename, typecheck-guarded.
- Git-archaeology gets one more layer: `grep "Aria"` in old commits still pulls up the skin usage; readers need to know it was retired.

## Alternatives considered

- **Keep "Aria" but scope it more tightly.** Rejected: the ambiguity doesn't come from loose scoping, it comes from "one-skin-calling-itself-by-name". No amount of scoping fixes that.
- **Rename to something other than `ViewState` / `view-state.ts`** (e.g. `ConvoState`, `AgentUIState`). Rejected: `ViewState` is generic on purpose — the enum describes visual states of the conversation view, not agent internals. If a second view surface is ever added, `ViewState` still applies.
- **Leave it.** Rejected: every new contributor has to learn that "Aria" means nothing operationally and just refers to a reference HTML we ported four months ago.
