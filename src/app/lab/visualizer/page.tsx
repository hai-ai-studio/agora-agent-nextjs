'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { AgentShaderVisualizerState } from '@/features/visualizer-lab/components/AgentShaderVisualizer';

// WebGL needs `window`; keep this page client-only.
const AgentShaderVisualizer = dynamic(
  () =>
    import('@/features/visualizer-lab/components/AgentShaderVisualizer').then(
      (m) => m.AgentShaderVisualizer,
    ),
  { ssr: false },
);

const STATES: AgentShaderVisualizerState[] = [
  'not-joined',
  'joining',
  'ambient',
  'listening',
  'analyzing',
  'talking',
  'disconnected',
];

export default function VisualizerLab() {
  const [state, setState] = useState<AgentShaderVisualizerState>('ambient');
  const [autoCycle, setAutoCycle] = useState(false);
  const [micTrack, setMicTrack] = useState<MediaStreamTrack | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Cycle through every state on a 3-second interval so crossfades are easy to eyeball.
  useEffect(() => {
    if (!autoCycle) return;
    const id = setInterval(() => {
      setState((prev) => STATES[(STATES.indexOf(prev) + 1) % STATES.length]);
    }, 3000);
    return () => clearInterval(id);
  }, [autoCycle]);

  const enableMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicTrack(stream.getAudioTracks()[0] ?? null);
      setMicError(null);
      // Flip to listening so AgentShaderVisualizer actually routes the mic track into FFT.
      setState('listening');
    } catch (err) {
      setMicError(err instanceof Error ? err.message : 'Mic access denied');
    }
  }, []);

  const disableMic = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setMicTrack(null);
  }, []);

  // Release the mic on unmount — the shared AudioContext stays alive, but the device should free.
  useEffect(() => {
    return () => {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background p-8">
      <h1 className="text-xl font-semibold">Shader Visualizer Lab</h1>

      <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-10">
        <AgentShaderVisualizer
          state={state}
          size="lg"
          userAudioTrack={micTrack}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        State: <span className="text-foreground font-mono">{state}</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setAutoCycle(false);
              setState(s);
            }}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              s === state
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={autoCycle}
          onChange={(e) => setAutoCycle(e.target.checked)}
        />
        Auto-cycle every 3 s
      </label>

      <div className="flex flex-col items-center gap-2">
        {micTrack ? (
          <button
            type="button"
            onClick={disableMic}
            className="rounded-md border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            Stop microphone
          </button>
        ) : (
          <button
            type="button"
            onClick={enableMic}
            className="rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-transparent hover:text-primary"
          >
            Enable microphone (listening)
          </button>
        )}
        {micError && <p className="text-xs text-destructive">{micError}</p>}
        <p className="text-xs text-muted-foreground max-w-md text-center">
          {micTrack
            ? 'Only the listening state routes mic FFT into the shader. Switch states to compare.'
            : 'Phase B: click to grant mic access. In listening state, the blob reacts to your voice.'}
        </p>
      </div>
    </div>
  );
}
