# Documentation Structure Plan

> Date: 2026-04-20
> Reference: Cursor/Vercel-style agent-first doc architecture (AGENTS.md / ARCHITECTURE.md, design-docs/, exec-plans/active|completed, product-specs/, references/, QUALITY_SCORE.md, RELIABILITY.md, SECURITY.md).
> Goal: Adapt that structure to this project's scale — a Next.js quickstart that developers copy — without over-engineering.

## Reading the reference

The reference architecture is built around **progressive disclosure + agent-without-context**:

1. **Stable root entries** (`AGENTS.md`, `ARCHITECTURE.md`) — single files an agent can always load first.
2. **Plans as first-class artifacts** — `exec-plans/active/` vs `completed/` separates "what we're doing" from "what we did". Progress + decision logs commit to the repo.
3. **Design docs cataloged with validation status** — `design-docs/index.md` lists all design choices with whether they're believed true, stale, or deprecated.
4. **References folder** — pinned `*-llms.txt` dumps of external library APIs so agents don't have to re-fetch.
5. **Generated folder** — auto-derived artifacts (schemas, type dumps) live separately from hand-written docs.
6. **Product specs** — the "what is this product for" layer, above architecture.
7. **Quality / reliability / security** scoring — per-area gap tracking.

**What applies to us:** stable entries, plans-as-artifacts, references, decisions-as-repo-state.
**What doesn't:** product specs (we're a demo, not a product), quality-score ceremony (over-engineering for ~15 TS files), reliability/security as top-level docs (the concerns are real but covered by Agora platform guarantees + a short note in AGENTS.md is enough).

## Current state

```
CLAUDE.md                              # AI agent instructions (Claude Code format)
CONTRIBUTING.md                        # contribution norms
README.md                              # human onboarding
agents.md                              # machine-readable project map
docs/
  GUIDE.md                             # step-by-step build guide
  TEXT_STREAMING_GUIDE.md              # transcript deep-dive
  plans/
    2026-04-20-aria-redesign.md        # mixed active + completed, no buckets
    2026-04-20-doc-structure.md        # ← this file
    2026-04-20-responsive-plan.md
    2026-04-20-shader-visualizer.md
    2026-04-20-tailwind-refactor.md
    2026-04-20-ui-polish-pass.md
```

Gaps vs. reference:
- Plans all in one flat folder, no active / completed distinction.
- No ADR / decision log — design decisions are scattered across CLAUDE.md and plan docs.
- No references/ for pinned vendor API surfaces.
- No design-language doc separate from build guide (Aria tokens, motion conventions, styling policy).
- No architecture diagram file — `agents.md` carries that load, but it mixes directory map + data flow + gotchas.

## Proposed structure

```
AGENTS.md                              # renamed from CLAUDE.md. Single agent-facing entry.
                                       #   Keeps the "project instructions" contract Claude Code reads.
ARCHITECTURE.md                        # one-page domain map: layers, data flow, state machine,
                                       #   "read this first" for any agent/human.
README.md                              # unchanged — human onboarding + quick start.
CONTRIBUTING.md                        # unchanged.

docs/
  # Guides — how-to, narrative, teaches the reader. Changes rarely.
  guides/
    GUIDE.md                           # existing build guide
    TEXT_STREAMING_GUIDE.md            # existing transcript deep-dive

  # Design — what the UI looks like and why. Token palette, motion rules, component catalog.
  design/
    aria.md                            # editorial voice, tokens, typography, layout grid
    motion.md                          # when motion/react vs CSS keyframes; easing curves
    components.md                      # per-component state matrix + variant table

  # Architecture — how the code is organized and why. Implementation-layer decisions.
  architecture/
    agora-flow.md                      # RTC + RTM lifecycle, hook ownership, StrictMode
    state-model.md                     # AgentVisualizerState → AriaState mapping
    styling.md                         # Tailwind-first policy, what stays in globals.css

  # Plans — split by state. Active = what's being worked on. Completed = historical record.
  plans/
    active/
      (whatever's in flight)
    completed/
      2026-04-20-ui-polish-pass.md
      2026-04-20-shader-visualizer.md
      2026-04-20-aria-redesign.md
      2026-04-20-tailwind-refactor.md
      2026-04-20-responsive-plan.md    # moves here when landed
      2026-04-20-doc-structure.md      # this file, moves here when done
    tech-debt.md                       # one-line-per-item running list

  # Decisions — ADR-style, one per architectural choice. Repo is the source of truth.
  decisions/
    0001-src-features-layout.md        # why src/features/<feature>/ over flat layout
    0002-tailwind-first-styling.md     # when CSS stays in globals.css
    0003-motion-over-css-keyframes.md  # animation policy
    0004-no-state-library-yet.md       # why not zustand right now
    0005-zod-at-boundaries-only.md     # scope of validation
    0006-aria-is-skin-ada-is-agent.md  # naming — Aria = design, Ada = agent
    0007-dark-mode-via-tokens.md       # prefers-color-scheme token flip, not dark: variant
    (more as they accumulate)

  # References — pinned external API surfaces. Agent-friendly dumps so context doesn't drift.
  references/
    agora-rtc-react.md                 # the hooks we use, signatures, gotchas
    agora-voice-ai-toolkit.md          # AgoraVoiceAI events, TurnStatus, TranscriptHelperMode
    tailwind-aria-tokens.md            # what's in tailwind.config.ts extend, how it maps to globals.css
    motion-react-patterns.md           # AnimatePresence + useReducedMotion idioms we use
```

## What I'm deliberately dropping from the reference

1. **`product-specs/`** — we're a demo, not a product with user segments. The "what does this teach" story fits in `README.md` + `guides/GUIDE.md`.
2. **`generated/`** — no current generated content. If we later extract RTM message schemas or env-var shapes, add the folder then.
3. **`QUALITY_SCORE.md` / `RELIABILITY.md` / `SECURITY.md`** — the bar for a ~15-file quickstart is "it builds and the demo works." Agora owns most of the reliability story; security concerns are addressed inline (token signing, no secrets client-side) and cross-referenced from AGENTS.md.
4. **`core-beliefs.md` / `PRODUCT_SENSE.md`** — the design voice is small enough to live in `docs/design/aria.md`. We don't have a broader product philosophy to codify.
5. **`design-docs/index.md` with validation status** — at this project's scale, 6-8 decisions total. We track them as numbered files in `docs/decisions/`. Each is either live or superseded by a later ADR; explicit "validation status" field is overkill.

## What the root `AGENTS.md` + `ARCHITECTURE.md` split looks like

Right now `CLAUDE.md` (agent instructions) and `agents.md` (machine-readable map) do overlapping jobs. Proposed split:

- **`AGENTS.md`**: the contract. Commands, key patterns, hook ownership rules, styling conventions, what-not-to-do, pointers. Claude Code + other agents read this first. Renamed from `CLAUDE.md` for vendor-agnostic naming (Claude Code still picks up `AGENTS.md` by convention; verify before the rename).
- **`ARCHITECTURE.md`**: the map. One-page: domain layers, data flow diagram (pre-call → in-call → teardown), state machine, pointers into `docs/architecture/*` for per-topic deep-dives.
- **`agents.md`**: deleted. Its directory map moves into `ARCHITECTURE.md`; its gotchas list folds into `AGENTS.md`.

## Migration plan (phased)

**Phase 1 — structural rename + split (low risk, high visibility)**
1. `CLAUDE.md` → `AGENTS.md`. Verify Claude Code still reads it (it supports both).
2. Create `ARCHITECTURE.md` from the directory-map + data-flow sections of `agents.md`. Delete `agents.md`.
3. Re-parent `docs/GUIDE.md` / `TEXT_STREAMING_GUIDE.md` under `docs/guides/`. Update cross-links.

**Phase 2 — plan bucket split**
4. `docs/plans/` → `docs/plans/completed/` for the 5 landed ones.
5. Create `docs/plans/active/` (empty initially); any future plan goes here first.
6. Create `docs/plans/tech-debt.md` — start with one-liner items pulled from CLAUDE.md "What NOT To Do" + recent sessions (e.g. "pnpm-workspace.yaml untracked", "voice-selector UI not wired to backend").

**Phase 3 — decisions log**
7. Create `docs/decisions/` with 0001–0007 covering the choices we've already made this quarter. Each ADR is ~30-60 lines: context, decision, consequences.

**Phase 4 — design docs**
8. Create `docs/design/aria.md` (token palette, typography, what the editorial voice is).
9. `docs/design/motion.md` (motion/react policy — when to use AnimatePresence, when to use CSS keyframes, prefers-reduced-motion strategy).
10. `docs/design/components.md` (per-component state × variant matrix).

**Phase 5 — architecture deep-dives**
11. `docs/architecture/agora-flow.md` (RTC+RTM lifecycle).
12. `docs/architecture/state-model.md` (state enum mapping, transitions).
13. `docs/architecture/styling.md` (Tailwind-first rules).

**Phase 6 — references**
14. `docs/references/agora-rtc-react.md` (pin the hook signatures we rely on).
15. `docs/references/agora-voice-ai-toolkit.md` (events + types we consume).
16. `docs/references/tailwind-aria-tokens.md` (bridge between tokens in globals.css and utilities in tailwind.config.ts).
17. `docs/references/motion-react-patterns.md` (our idioms for AnimatePresence, layout, useReducedMotion).

## What to defer / skip unless there's real demand

- `docs/generated/` — until there's actually a generated artifact.
- `docs/product/` — not until this becomes a product.
- `QUALITY_SCORE.md` / `RELIABILITY.md` / `SECURITY.md` at the root — security notes can live in `AGENTS.md`'s "Important" section or `docs/architecture/security.md` if it grows.
- Per-decision "validation status" tracking in a central index — the ADR file itself carries that via "Supersedes / superseded-by" links when needed.
- `CONTRIBUTING.md` rewrite — keep as-is unless contribution flow changes.

## Open questions for you

1. **AGENTS.md vs CLAUDE.md rename** — AGENTS.md is the vendor-agnostic norm, but switching may hide docs from older Claude Code versions. Verify compatibility first; acceptable fallback is keeping `CLAUDE.md` as a 2-line pointer to `AGENTS.md`.
2. **ADR granularity** — 7 ADRs is what I'd write today. If you want finer-grained (e.g. separate ADRs for `flatten aria/`, `rename ConversationComponent → ConversationShell`), the count roughly doubles. I lean coarser.
3. **Phase order** — I'd do Phase 1 first (big visible rearrangement, small diff), then skip directly to Phase 3 (decisions), because ADRs produce the highest future-agent value per file. Design + architecture + references can come later as needs arise.
4. **References format** — full prose (human-readable) vs `llms.txt`-style compact (agent-friendly). Reference uses the latter. I'd use prose for ours since the audience includes humans copying the quickstart.

## Risks

- **Churn on docs without real content** — empty folders with placeholder files age badly. Only create a file when there's something to put in it. Phased rollout prevents this.
- **Doc links rot when files move** — Phase 1 moves `GUIDE.md` / `TEXT_STREAMING_GUIDE.md` paths. Grep-replace all cross-links after each move.
- **AGENTS.md convention adoption** — mostly Cursor + newer agents support it; Claude Code has good support. If in doubt, keep `CLAUDE.md` as a symlink / pointer.
- **ADR sprawl** — 7 today, 30 in a year. Build a lightweight index (`docs/decisions/index.md`) only when you hit ~15 entries.

## Non-goals

- No automated doc generation (GitBook, Nextra, etc.). Files stay in markdown, rendered wherever.
- No doc CI enforcement (link-checker, ADR template-validator). Lint clean builds come first.
- No translation. Docs stay in English; code comments as-is.
