# 0006 — "Aria" is the design skin, "Ada" is the agent

- Date: 2026-04-20
- Status: Accepted
- Supersedes: earlier code that used "Aria" / "Ara" both as agent name and design name

## Context

The editorial view layer was ported from an external reference HTML file named "Aria Voice Agent". The reference used "Aria" as both the agent's spoken name (in greeting copy, transcript labels) and the design identity (CSS class prefix, file names). Initial port preserved both usages.

The agent itself has a personality, a system prompt, a greeting line. As the project evolved, the agent name was renamed to "Ada" for branding reasons (not the design, which retained "Aria" as the name of the port). This created ambiguity:

- "Aria" in `components/aria-state.ts` → design skin.
- "Ada" in greeting / status pill / transcript labels → agent.

## Decision

Split the two usages cleanly:

- **"Aria"** refers only to the **design skin** — the editorial port, its CSS/Tailwind token palette, its animation vocabulary, its layout conventions. Surfaces: `AriaState` type, `mapToAriaState` mapper, class names inside `aria-state.ts`, doc references to "the Aria skin".
- **"Ada"** refers only to the **agent's spoken name** — what users see as the caller identity, what the greeting says, what the transcript labels as the agent's name. Surface: `ADA_AGENT_NAME = 'Ada'` constant consumed by `Persona`, `Transcript`, `ARIA_HINT` copy, and the top-bar brand.

## Consequences

**Good:**

- No search ambiguity: grep for "Aria" finds design-layer concerns only; grep for "Ada" finds agent-identity concerns only.
- Renaming the agent in the future (e.g. for a white-label demo) is a one-constant change — `ADA_AGENT_NAME` flips and everything downstream follows. The design layer is untouched.
- Re-skinning the UI (e.g. porting a different editorial reference) doesn't drag the agent identity with it. "Aria" is the skin name, not the product.

**Bad:**

- Two names to explain in docs. Mitigated by AGENTS.md having a one-line note and this ADR.
- Mild cognitive overhead for new contributors — "why is the file called `aria-state` when the agent is Ada?" is a question this ADR answers.

## What goes where

| Surface | Name | File |
|---|---|---|
| State enum, mapper, copy constants | `Aria*` | `src/features/conversation/components/aria-state.ts` |
| Agent display name constant | `ADA_AGENT_NAME` | `src/features/conversation/components/aria-state.ts` (exported alongside the skin types because it's the content the skin displays) |
| Design tokens | `--ink`, `--bg`, `--wf-agent`, `--pill-*` | `src/app/globals.css` |
| Brand mark in top-bar | renders `Ada · Agora` | `LandingPage.tsx`, `ConversationShell.tsx` |
| System prompt / greeting | `ADA_PROMPT`, `GREETING` | `src/features/conversation/server/invite-agent-config.ts` |

## Alternatives considered

- **Rename the design skin to "Ada"** (unify on one name). Rejected: "Aria" is the external reference's given name; keeping it honors the attribution and makes the design-heritage story legible.
- **Rename the agent to "Aria"** (same rationale, other direction). Rejected: branding decision outside our scope; the agent name is product-facing.
- **Keep them merged.** Rejected: the ambiguity keeps biting (file names, search, doc writeups).
