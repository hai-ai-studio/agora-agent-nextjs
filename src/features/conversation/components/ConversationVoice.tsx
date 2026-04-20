'use client';

import { useCallback, useRef, useState } from 'react';
import { BarsWave, VoiceOrb } from '@/components/convo-ui';
import { useAudioFFT } from '@/features/conversation/hooks/useAudioFFT';
import type { ViewState } from '@/features/conversation/lib/view-state';

// Unified voice display for the in-call stage. Swaps the old two-row bar
// waveform for the DS's signature VoiceOrb on top of a compact user mic-level
// strip. The orb represents the conversation state (listening / thinking /
// speaking) and is driven by whichever speaker is active; the strip below is
// always the local mic so the user has continuous feedback that their audio
// is live.
//
// Hot path mirrors the BarsWave refactor:
//   - useAudioFFT writes FFT bands into a ref (no re-renders)
//   - getAmplitude callback feeds VoiceOrb's internal RAF — orb deforms in
//     sync with audio without causing a React re-render per frame
//   - getTargets callback feeds the mic-strip BarsWave the same way
// ConversationVoice itself only re-renders on semantic state changes.

// Lower noise floor than the bar-wave path — the orb needs to react to quiet
// speech to feel alive, and the single-orb visual can tolerate a bit more
// ambient flutter than 48 individual bars can.
const ORB_NOISE_FLOOR = 0.12;
const ORB_FLOOR_SCALE = 1 / (1 - ORB_NOISE_FLOOR);
// Mic-strip uses the same noise floor as the original bar-wave default — it's
// visually a meter and benefits from the stricter gate.
const MIC_NOISE_FLOOR = 0.18;
const MIC_FLOOR_SCALE = 1 / (1 - MIC_NOISE_FLOOR);
const MIC_BAR_COUNT = 14;

export interface ConversationVoiceProps {
  state: ViewState;
  /** Remote agent's audio track. Drives the orb when `state === 'speaking'`. */
  agentTrack?: MediaStreamTrack | null;
  /** Local mic track. Drives the orb when `state === 'listening'` and always feeds the mic strip. */
  userTrack?: MediaStreamTrack | null;
  /** Orb diameter in px. Default 180. */
  orbSize?: number;
  /**
   * Currently-streaming speech to show under the mic strip. `text` is the
   * partial transcript; `speaker` drives the small prefix label. Pass `null`
   * or empty text to hide the line (a non-breaking space still holds the slot
   * so layout doesn't jump). Caller is expected to prioritize user speech on
   * barge-in — see `getPriorityInProgressMessage`.
   */
  activeSpeech?: { text: string; speaker: 'agent' | 'user' } | null;
  /** Agent display name for the caption prefix. Default 'Ada'. */
  agentName?: string;
}

// 8-state conversation enum → 5-state orb enum. `connecting`/`preparing` map
// to `idle` (orb is alive but gentle — nothing to listen to yet). `error`
// maps to `muted` because the greyed palette reads as "not working" better
// than the warm voice gradient does.
function orbStateFor(
  state: ViewState,
): 'idle' | 'listening' | 'thinking' | 'speaking' | 'muted' {
  if (state === 'error' || state === 'muted') return 'muted';
  if (state === 'listening') return 'listening';
  if (state === 'thinking') return 'thinking';
  if (state === 'speaking') return 'speaking';
  return 'idle';
}

export function ConversationVoice({
  state,
  agentTrack = null,
  userTrack = null,
  orbSize = 180,
  activeSpeech = null,
  agentName = 'Ada',
}: ConversationVoiceProps) {
  const agentBandsRef = useAudioFFT(agentTrack, { smoothing: 0.8 });
  const userBandsRef = useAudioFFT(userTrack, { smoothing: 0.8 });

  // Smoothed amplitude for the orb. `max(bass, mid, treble)` after noise gate
  // picks up the loudest band, which reads as "speech intensity". Stored in
  // a ref + asymmetric attack/release smoothing so the orb reacts quickly to
  // onset but decays smoothly — same VU-meter feel as BarsWave's bars.
  const orbAmpRef = useRef(0);
  // Snappier attack for more responsive voice feedback. Release stays slow
  // so decays feel graceful. Compression is linear (not x²) — squaring was
  // crushing normal-conversation amplitudes; linear maps them more visibly.
  const ATTACK = 0.55;
  const RELEASE = 0.08;

  const getOrbAmplitude = useCallback(() => {
    // Pick the side that's currently driving the orb. During speaking the
    // agent's FFT is the source; during listening it's the mic. Other states
    // → return to 0 (orb falls back to its state-specific ambient motion).
    const b =
      state === 'speaking'
        ? agentBandsRef.current
        : state === 'listening'
          ? userBandsRef.current
          : null;
    let target = 0;
    if (b) {
      const raw = Math.max(b.bass, b.mid, b.treble);
      // Gate + gain. Gain 3.0 (was 1.8) — typical speech now reaches amp ~0.5
      // instead of ~0.25, so the orb actually visibly responds to voice.
      const gated = Math.max(0, raw - ORB_NOISE_FLOOR) * ORB_FLOOR_SCALE;
      target = Math.min(1, gated * 3.0);
    }
    const prev = orbAmpRef.current;
    const rate = target > prev ? ATTACK : RELEASE;
    orbAmpRef.current = prev + (target - prev) * rate;
    return orbAmpRef.current;
    // Refs are stable; state changes intentionally re-create the callback so
    // the orb-source logic picks up the new variant.
  }, [state, agentBandsRef, userBandsRef]);

  // Mic-level strip — always driven by the local mic, independent of view
  // state. Purpose: reassure the user their audio is live even while the
  // agent is speaking (they may want to interrupt).
  const [micSeeds] = useState(() =>
    Array.from({ length: MIC_BAR_COUNT }, () => Math.random()),
  );
  const micScratch = useRef<Float32Array>(new Float32Array(MIC_BAR_COUNT));

  const getMicTargets = useCallback(() => {
    const b = userBandsRef.current;
    const buf = micScratch.current;
    // Same compression shape as BarsWave's default. For a compact strip we
    // skip the center envelope — the bars look better flat at this size.
    const raw = Math.max(b.bass, b.mid, b.treble);
    const gated = Math.max(0, raw - MIC_NOISE_FLOOR) * MIC_FLOOR_SCALE;
    const amp = Math.min(1, gated * gated * 2.2);
    // Spread amplitude across bars with a tiny sparkle so neighbors decorrelate.
    const t = performance.now() / 1000;
    for (let i = 0; i < MIC_BAR_COUNT; i++) {
      const seed = micSeeds[i];
      const sparkle = 0.85 + 0.15 * Math.sin(t * 9 + seed * 6 + i * 0.4);
      buf[i] = amp * sparkle;
    }
    return buf;
  }, [micSeeds, userBandsRef]);

  // Mic strip visibility — hidden when muted, subtly dimmed when the agent is
  // speaking (so it doesn't compete with the orb, but user can still see
  // their mic is hot and ready to interrupt).
  const micVisible = state !== 'muted' && state !== 'error';
  const micProminent = state === 'listening' || state === 'idle';

  // Live speech caption — single line under the mic strip. Only visible when
  // something is streaming; keeps a fixed min-height so the orb above doesn't
  // shift when speech toggles on/off. Prefix label distinguishes user (green)
  // from agent (ink) so the reader knows at a glance who's speaking.
  const speechText = activeSpeech?.text?.trim() ?? '';
  const hasSpeech = speechText.length > 0;
  const speechSpeaker = activeSpeech?.speaker ?? 'agent';
  const speakerLabel = speechSpeaker === 'user' ? 'You' : agentName;
  const speakerColor =
    speechSpeaker === 'user' ? 'text-[#16a34a]' : 'text-foreground';

  return (
    <div className="flex flex-col items-center gap-5">
      <VoiceOrb
        state={orbStateFor(state)}
        size={orbSize}
        getAmplitude={getOrbAmplitude}
      />
      <div
        className={`flex h-6 w-36 items-center justify-center transition-opacity duration-300 ease-voice-out ${
          micVisible ? (micProminent ? 'opacity-90' : 'opacity-35') : 'opacity-0'
        }`}
        aria-hidden="true"
      >
        <BarsWave
          bars={MIC_BAR_COUNT}
          height={24}
          color="#16a34a"
          getTargets={getMicTargets}
          attack={0.5}
          release={0.1}
          minHeight={2}
        />
      </div>
      <div
        className={`min-h-[1.75rem] max-w-xl px-6 text-center transition-opacity duration-200 ${
          hasSpeech ? 'opacity-100' : 'opacity-0'
        }`}
        aria-live="polite"
      >
        <span
          className={`mr-2 font-mono text-[10px] uppercase tracking-widest ${speakerColor}`}
        >
          {speakerLabel}
        </span>
        <span className="font-display italic text-base leading-snug text-muted-foreground [text-wrap:balance]">
          {speechText || '\u00A0'}
        </span>
      </div>
    </div>
  );
}
