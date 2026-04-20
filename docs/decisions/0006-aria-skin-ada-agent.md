# 0006 — "Aria" is the design skin, "Ada" is the agent

- Date: 2026-04-20
- Status: **Superseded** by [0008 — retire the "Aria" skin name](./0008-retire-aria-skin-name.md)
- Supersedes: earlier code that used "Aria" / "Ara" both as agent name and design name

## Context

The editorial view layer was ported from an external reference HTML file named "Aria Voice Agent". The reference used "Aria" as both the agent's spoken name (in greeting copy, transcript labels) and the design identity (CSS class prefix, file names). Initial port preserved both usages.

The agent itself has a personality, a system prompt, a greeting line. As the project evolved, the agent name was renamed to "Ada" for branding reasons (not the design, which retained "Aria" as the name of the port). This created ambiguity:

- "Aria" in `lib/aria-state.ts` → design skin.
- "Ada" in greeting / status pill / transcript labels → agent.

## Decision

Split the two usages cleanly:

- **"Aria"** refers only to the **design skin** — the editorial port, its CSS/Tailwind token palette, its animation vocabulary, its layout conventions. Surfaces: `AriaState` type, `mapToAriaState` mapper, class names inside `aria-state.ts`, doc references to "the Aria skin".
- **"Ada"** refers only to the **agent's spoken name** — what users see as the caller identity, what the greeting says, what the transcript labels as the agent's name. Surface: `ADA_AGENT_NAME = 'Ada'` constant consumed by `Persona`, `Transcript`, `ARIA_HINT` copy, and the top-bar brand.

## What changed (superseded)

Once `convo-ui` became the single DS in the project, the "Aria" skin qualifier no longer distinguished anything — there's no other skin to contrast it against. The name was retired 2026-04-20 in favor of neutral "view-state / conversation-UI" vocabulary. See [ADR 0008](./0008-retire-aria-skin-name.md). "Ada" as the agent's name is kept; the decision to split skin-vs-agent was right, but the specific "Aria" label was the wrong name for the skin half.

## Historical: What went where (for commit-archaeology)

| Surface | Name (then) | File (then) | → now |
|---|---|---|---|
| State enum, mapper, copy constants | `Aria*` | `src/features/conversation/components/aria-state.ts` | `ViewState`, `mapToViewState`, `VIEW_HINT` in `lib/view-state.ts` |
| Agent display name constant | `ADA_AGENT_NAME` | same file | same file (unchanged) |
| Ease curve token | `--ease-aria-out` | `globals.css` | `--ease-voice-out` |
| Demo copy "Aria" in L1 components | hardcoded | `convo-ui/*` | replaced with `Ada` |

## Alternatives considered (at the time)

- **Rename the design skin to "Ada"** (unify on one name). Rejected then — reinstated on 2026-04-20 as part of the retirement (the one-name world is achievable because there's only one skin).
- **Rename the agent to "Aria"** (same rationale, other direction). Rejected: branding decision outside our scope; the agent name is product-facing.
- **Keep them merged.** Rejected: the ambiguity kept biting (file names, search, doc writeups).
