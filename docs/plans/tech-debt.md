# Tech Debt

> Running list of known issues that are not blocking but should be addressed before they compound. One-liner per item; link to a plan in `docs/plans/active/` when work starts. When resolved, strike through and note commit.

## Code

- `pnpm-workspace.yaml` at repo root is untracked — predates recent refactors, needs decision: commit or gitignore.
- `VoiceSelector` / language options in the dock are UI-only; selection isn't plumbed through `/api/invite-agent` to `MiniMaxTTS(voiceId)` / locale yet.
- ~~`Waveform` SVG renders with fixed `width={640}` attribute.~~ Fluid `width="100%"` + `viewBox` landed 2026-04-20 (responsive Phase 1).
- ~~Dock minimum width ≈ 400px. Overflows iPhone SE (320).~~ VoiceSelector collapses to 36×36 ink-dot at `max-[480px]` 2026-04-20 (responsive Phase 2).
- ~~`VoiceMenu` / `MicPicker` popovers anchor `left: 0` — clip viewport edge on narrow screens.~~ `max-sm:right-0` + `max-w-[calc(100vw-2rem)]` 2026-04-20 (responsive Phase 1).
- ~~Mobile transcript row is 120-200px tall — too short to be readable.~~ Fixed bottom sheet at `max-md`, default-hidden 2026-04-20 (responsive Phase 3).
- ~~`useAudioFFT` lives in `src/features/conversation/lib/audio.ts` but is a hook.~~ Moved to `src/features/conversation/hooks/useAudioFFT.ts` 2026-04-20.
- `mapAgentVisualizerState` (`lib/visualizer-state.ts`) and `mapToAriaState` (`components/aria-state.ts`) are the two halves of the same RTC-signal-to-view-state pipeline but live in different folders.
- ~~`src/hooks/use-mobile.tsx` contains no JSX; rename to `.ts`.~~ Hook removed from tree entirely 2026-04-20 (wasn't referenced).
- ~~`src/features/visualizer-lab/components/AgentShaderVisualizer/` — hollow feature nesting.~~ Flattened to `src/components/AgentShaderVisualizer/` 2026-04-20.
- `src/features/conversation/lib/agora-config.ts` contains a single `DEFAULT_AGENT_UID = 123456` constant. Could fold into `types.ts` or a shared constants module.

## Boundaries / validation

- `/api/invite-agent`, `/api/stop-conversation`, `/api/chat/completions` parse `body as X` without runtime validation. `zod` schemas at these three routes would make malformed requests fail loud rather than downstream-unclear. See the zod discussion in recent conversation history.
- `useAgoraVoiceAI`'s `isRtmMessageErrorPayload` / `isRtmSalStatusPayload` are hand-written type guards; a small `zod` schema would be both the guard and the shape in one declaration.
- No env-var validation at startup. `NEXT_PUBLIC_AGORA_APP_ID` missing silently breaks the RTC join; validating in a server-only module would fail the build / first-request instead.

## Docs / structure

- Plans in `docs/plans/completed/` are full narrative (context, scope, phases, risks). Several of them also encode a durable architectural choice. Convert the "decision" content of each into an ADR in `docs/decisions/`, leaving the full plan as its process record. Candidates: aria-redesign (→ ADR), tailwind-refactor (→ ADR), shader-visualizer (→ ADR for `/lab` location).
- `docs/design/` and `docs/architecture/` folders are planned but not created yet. Add when there's actual content; empty dirs age badly.
- `docs/references/` pinned external-API dumps — deferred. Add when an agent hits a question that would've been answered by a pinned reference.
- No link-checker in CI. Cross-doc links will rot when files move (we just moved `docs/GUIDE.md` → `docs/guides/GUIDE.md`; the risk is concrete).

## Behavior / UX

- End-call flow currently does an immediate unmount + background stop-agent (fire-and-forget). There's a previously-considered "call ended" dwell state (persona shows `Call ended`, dock shows `Start new call`) that was removed. Reinstate if / when the product wants a goodbye screen.
- No prefers-reduced-motion handling for the waveform bars — motion there is informational (audio reactive), so not strictly required, but a lower-motion variant (just a steady bar graph) would help accessibility.
- Mute state has no audible cue. Users can't tell they're muted by audio alone. Low priority for a voice demo.
