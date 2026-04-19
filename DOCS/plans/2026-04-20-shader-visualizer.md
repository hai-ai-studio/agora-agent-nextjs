# Shader-based Agent Visualizer

> Date: 2026-04-20
> Scope: New component `components/AgentShaderVisualizer/`, prototype route `app/lab/visualizer/`, opt-in integration in `ConversationComponent.tsx` via env flag.
> Goal: Replace the current Lottie-based `AgentVisualizer` with a raw-WebGL fragment shader that reacts to real agent / user audio in real time, not just to discrete state transitions.

## Why

The bundled `AgentVisualizer` (from `agora-agent-uikit`) plays one of seven pre-designed Lottie animations selected by a `state` prop. It is beautiful but fundamentally **open-loop** — it looks identical whether the agent is whispering or shouting, whether the user is mid-sentence or pausing.

A shader version gives us:

1. **Closed-loop feedback.** FFT of the active speaker's audio drives shader uniforms → the blob literally breathes with speech.
2. **Smooth state blending** instead of hard Lottie swaps.
3. **Brand palette integration** via existing CSS tokens `--viz-stop-1/2/3`.
4. **Smaller runtime footprint than a Lottie+dotlottie player** once we drop the uikit dependency for this one component.

## Non-goals

- Not replacing `MicButtonWithVisualizer`'s bar meter (that's a different affordance).
- Not introducing `three.js` / `@react-three/fiber` (too heavy for a quickstart whose SDK bundle is already large).
- Not changing any Agora wiring, hooks, or StrictMode guards.
- Not shipping enabled-by-default in the first landing — gated behind `NEXT_PUBLIC_SHADER_VIZ=1` until we're happy with it.

## Architecture

### 1. Audio tap

Each remote `user.audioTrack` exposed by `agora-rtc-react` is an `IRemoteAudioTrack`. Its `getMediaStreamTrack()` returns a raw `MediaStreamTrack`. We wrap it into a `MediaStream`, create a `MediaStreamAudioSourceNode` on a shared `AudioContext`, and attach an `AnalyserNode` — **never connecting to `ctx.destination`**, so Agora's own `audioTrack.play()` remains the sole playback path.

The local mic track already exposes a `MediaStreamTrack` via `localMicrophoneTrack.getMediaStreamTrack()`; same treatment for "listening" state reactivity.

```ts
// useAudioFFT.ts (pseudocode)
function useAudioFFT(track: MediaStreamTrack | null, opts: { bins: number }) {
  // returns a ref to Float32Array of normalized FFT magnitudes (0..1)
  // null track → returns a silent/zeroed buffer so shaders keep rendering
}
```

Lifecycle: create analyser when `track` arrives, tear down on change or unmount. Reuse one `AudioContext` per page (module singleton, lazy) to avoid hitting browser context limits.

### 2. Shader

One full-quad fragment shader driven by these uniforms:

| Uniform | Type | Source |
|---|---|---|
| `u_time` | float | `performance.now() / 1000` |
| `u_resolution` | vec2 | canvas size × DPR |
| `u_state` | float | state enum encoded 0..6 |
| `u_stateT` | float | 0..1 crossfade toward the current state |
| `u_bass` | float | low-band FFT avg (0..1) |
| `u_mid` | float | mid-band FFT avg |
| `u_treble` | float | high-band FFT avg |
| `u_stop1/2/3` | vec3 | palette colors read from `--viz-stop-1/2/3` |

**Visual recipe:**

- Base: SDF circle in screen space, radius = 0.4 + `u_bass * 0.15` + slow sine breathing.
- Edge distortion: 2-octave fbm noise offset, amplitude = 0.05 + `u_treble * 0.25`.
- Inner fill: 3-stop gradient from `u_stop1 → u_stop2 → u_stop3`, ramped by radius + `u_mid`.
- Glow: cheap outer halo via `smoothstep(radius, radius+0.08, d)` blended with palette top.
- State-specific overrides:
  - `joining`: slow rotation, low saturation.
  - `not-joined`: static dim circle, no FFT coupling.
  - `ambient`: breathing only, FFT off.
  - `listening`: coupled to **user** FFT.
  - `analyzing`: rotating internal swirl, FFT off.
  - `talking`: coupled to **agent** FFT.
  - `disconnected`: desaturate to gray, collapse radius.

Shader stays under ~150 lines. No ray marching, no loops over > 2 octaves — must hit 60 FPS on a mid-range laptop.

### 3. React component API

Drop-in compatible with the existing `AgentVisualizer`:

```tsx
<AgentShaderVisualizer
  state={visualizerState}
  size="lg"
  agentAudioTrack={agentTrack}   // optional MediaStreamTrack
  userAudioTrack={userTrack}     // optional MediaStreamTrack
/>
```

When both optional tracks are `null`, the shader still renders — just without audio coupling (same result as the current Lottie visualizer, minus the hand-designed motion).

### 4. File layout

```
components/AgentShaderVisualizer/
  index.tsx          # React component, canvas mount, RAF loop
  useAudioFFT.ts     # MediaStreamTrack → FFT ref
  gl.ts              # minimal WebGL helper (compile/link/uniforms), no deps
  shader.ts          # vertex + fragment GLSL strings
app/lab/visualizer/
  page.tsx           # prototype page — state cycler + mic input + file drop
```

### 5. Reduced-motion behavior

Inside the component, read `window.matchMedia('(prefers-reduced-motion: reduce)').matches`:

- Skip the RAF loop entirely; render one static frame per state change.
- Skip audio tap setup to avoid battery drain on dormant canvases.

### 6. StrictMode + SSR

- Canvas init gated behind `isReady` pattern (same as `useJoin` / `useLocalMicrophoneTrack`) so WebGL context is created exactly once.
- Component imported via `next/dynamic({ ssr: false })` in `ConversationComponent` if we decide to gate integration.
- Handle `webglcontextlost` / `webglcontextrestored` by reinitializing the program.

## Phased execution

### Phase A — shader pipeline at `/lab/visualizer`

- Minimal WebGL helper (`gl.ts`) + trivial pass-through vertex shader + a placeholder fragment that draws a radial gradient.
- Prototype page cycles through the 7 states with a picker.
- No audio yet — fake `u_bass/mid/treble` driven by sine functions of `u_time` for visual tuning.
- **Exit criteria:** all 7 states look distinct and visually coherent, 60 FPS on a MacBook.

### Phase B — real audio coupling

- Implement `useAudioFFT` against the browser mic via `getUserMedia` on the lab page.
- Wire `u_bass/mid/treble` from the analyser.
- Tune band ranges and smoothing (per-band exponential moving average, ~0.6).
- **Exit criteria:** speaking into the mic visibly deforms the blob; silence decays to baseline within ~300 ms.

### Phase C — integrate behind `NEXT_PUBLIC_SHADER_VIZ=1`

- In `ConversationComponent`, conditionally render `AgentShaderVisualizer` or the existing `AgentVisualizer` based on the env flag.
- Pass `agentAudioTrack` from the first remote user matching `agentUID`; pass `userAudioTrack` from `localMicrophoneTrack.getMediaStreamTrack()`.
- Leave the existing `visualizerLabel` + `showReadyHint` JSX untouched — shader slots into the same position.
- **Exit criteria:** flag on → shader visualizer works in a real call; flag off → original behavior unchanged.

### Phase D — promote default (separate PR, not in this plan)

Once Phase C has soaked, flip the default. Decide then whether to keep the Lottie path as fallback (e.g. for browsers without WebGL). Probably not worth it — WebGL is universal.

## Risks

1. **Remote track `MediaStreamTrack` availability** — `agora-rtc-react`'s `IRemoteAudioTrack.getMediaStreamTrack()` should exist but hasn't been exercised in this codebase. If it returns something unusable, we can fall back to `createMediaElementSource` on the hidden `<audio>` element Agora creates. Verify in Phase C first hour.
2. **AudioContext lifetime** — creating/destroying per-call can bloat. Module-level singleton with reference counting is safer.
3. **Aesthetic regression** — raw shader blobs easily look like "generic AI sci-fi". Constrain palette to the existing `--viz-stop-*` tokens; if the first iteration feels off, treat it as tunable rather than inherent to the approach.
4. **Context loss** — devices sometimes kill WebGL contexts under memory pressure. Handle `webglcontextlost` event and rebuild.

## Verification

- `pnpm lint`, `pnpm build` after each phase.
- Manual check on `/lab/visualizer` at each phase.
- Phase C: verify flag-off path still boots the Lottie visualizer (default quickstart experience must not regress).

## Doc sync

No changes needed to `GUIDE.md` / `agents.md` / `TEXT_STREAMING_GUIDE.md` during Phase A–C — the shader component is behind a flag. When we flip the default in Phase D, update them in the same commit.
