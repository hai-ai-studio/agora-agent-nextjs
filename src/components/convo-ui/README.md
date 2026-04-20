# convo-ui

Voice conversation component library. 28 presentational components, all Tailwind-first,
all Storybook-covered. No Agora SDK, no network IO — pass plain props and get UI back.

Canonical spec: [`docs/guides/CONVO_UI.md`](../../../docs/guides/CONVO_UI.md).
Catalog route: [`/design`](../../app/design/page.tsx). Storybook: `pnpm storybook`.

## Layering

Each component is one of:

- **L1 pure** — props → JSX, no state, no effects.
- **L2 stateful UI** — local UI state (open/close, selection draft, RAF tick). No IO, no business types.

No component imports `agora-*`, `navigator.*`, `fetch`, or `@/features/*`.
See [`docs/plans/active/2026-04-20-component-layering.md`](../../../docs/plans/active/2026-04-20-component-layering.md)
for the full rulebook and the checklist used to classify each file.

## Inventory

### Signature
| Component | Layer | What it is |
| --- | --- | --- |
| `VoiceOrb` | L2 | Canvas blob with voice-gradient + glow. The hero element. |

### Waveforms
| Component | Layer | What it is |
| --- | --- | --- |
| `BarsWave` | L2 | Vertical bars, RAF-animated. |
| `LinearWave` | L2 | Oscilloscope-style trace (canvas). |
| `CircleWave` | L2 | Three concentric gradient rings (canvas). |

### Ambient / identity
| Component | Layer | What it is |
| --- | --- | --- |
| `Ambient` | L2 | Drifting blob background + grain. Dark-mode aware via `useSyncExternalStore`. |
| `BrandMark` | L1 | Top-bar wordmark + optional agent label. |
| `Persona` | L2 | Concentric-ring avatar + status pill + call timer. |

### Status
| Component | Layer | What it is |
| --- | --- | --- |
| `StatusIndicator` | L1 | Breathing-dot pill, 6 agent states. |
| `LatencyIndicator` | L1 | ms readout + signal bars. |
| `ConnectionIndicator` | L1 | Header connection signal + optional secondary badge. |
| `BargeInIndicator` | L1 | "User interrupted" shimmer. |
| `ErrorToast` | L1 | Fixed-position `role="alert"` banner. |

### Controls
| Component | Layer | What it is |
| --- | --- | --- |
| `IconButton` | L1 | Round button with variant support. |
| `CallControls` | L1 | Glass-morph dock composing IconButtons. |
| `BigCallButton` | L1 | Primary call CTA, 3 states. |
| `Icons` | L1 | Inline SVG icon set (object-shape, not a component). |

### Transcript
| Component | Layer | What it is |
| --- | --- | --- |
| `Transcript` | L2 | Scrollable list. Auto-scrolls on new entries. |
| `TranscriptBubble` | L1 | One message bubble. |
| `LiveSubtitle` | L1 | Dark overlay with large centered caption. |

### Voice / language pickers
| Component | Layer | What it is |
| --- | --- | --- |
| `VoicePicker` | L2 | 6-card gallery of voice personas. |
| `VoiceCard` | L1 | One persona card (also used standalone). |
| `LanguagePicker` | L2 | Flag + accent dropdown, 8 locales. |
| `VoiceSelector` | L2 | Compact voice + language popover for the dock. |

### Session / agent / tools
| Component | Layer | What it is |
| --- | --- | --- |
| `SessionList` | L1 | Session history rows with gradient avatars. |
| `AgentConfigCard` | L1 | Prompt preview + tool badges + telemetry. |
| `ToolCallCard` | L1 | Tool call state: running / success / error. |

### Permission / playback
| Component | Layer | What it is |
| --- | --- | --- |
| `MicPermissionCard` | L1 | 4-state prompt / requesting / denied / granted card. |
| `AudioPlayer` | L2 | Scrubbable waveform + play/speed controls. |

### Hooks
| Hook | What it is |
| --- | --- |
| `useTypewriter` | Progressive-reveal helper for streaming text. |

## Adding a component

1. Pass the L1 / L2 checklist in the layering plan.
2. Consume semantic tokens from `globals.css`, not hard-coded colors.
3. Write a co-located `*.stories.tsx` — if you can't story it without mocking Agora, it belongs in `features/conversation/` instead.
4. Export from `index.ts` under the matching section.
5. Add a row to the table above.
