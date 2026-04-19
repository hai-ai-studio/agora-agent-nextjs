'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  createGLContext,
  drawQuad,
  resizeToDisplaySize,
  setUniforms,
  type GLContext,
} from './gl';
import { fragSrc, vertSrc } from './shader';
import { useAudioFFT, type AudioBands } from '@/features/conversation/lib/audio';

export type AgentShaderVisualizerState =
  | 'not-joined'
  | 'joining'
  | 'ambient'
  | 'listening'
  | 'analyzing'
  | 'talking'
  | 'disconnected';

export type AgentShaderVisualizerSize = 'sm' | 'md' | 'lg';

interface AgentShaderVisualizerProps {
  state: AgentShaderVisualizerState;
  size?: AgentShaderVisualizerSize;
  // MediaStreamTrack for the remote agent's audio — drives `talking` state reactivity.
  agentAudioTrack?: MediaStreamTrack | null;
  // MediaStreamTrack for the local user's mic — drives `listening` state reactivity.
  userAudioTrack?: MediaStreamTrack | null;
  className?: string;
}

const SIZE_PX: Record<AgentShaderVisualizerSize, number> = {
  sm: 96,
  md: 160,
  lg: 224,
};

const STATE_TO_FLOAT: Record<AgentShaderVisualizerState, number> = {
  'not-joined': 0,
  joining: 1,
  ambient: 2,
  listening: 3,
  analyzing: 4,
  talking: 5,
  disconnected: 6,
};

// Read the three --viz-stop-* tokens by letting the browser resolve their HSL values for us.
// Returns RGB triplets in [0..1].
function readPalette(sample: HTMLElement): [number[], number[], number[]] {
  const stops = ['--viz-stop-1', '--viz-stop-2', '--viz-stop-3'];
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  sample.appendChild(probe);
  const result = stops.map((token) => {
    probe.style.color = `hsl(var(${token}))`;
    const rgb = getComputedStyle(probe).color;
    // rgb() or rgba() string — grab the first three numbers.
    const match = rgb.match(/\d+(?:\.\d+)?/g) ?? ['128', '128', '128'];
    return [
      parseFloat(match[0]) / 255,
      parseFloat(match[1]) / 255,
      parseFloat(match[2]) / 255,
    ];
  });
  sample.removeChild(probe);
  return [result[0], result[1], result[2]];
}

export function AgentShaderVisualizer({
  state,
  size = 'md',
  agentAudioTrack = null,
  userAudioTrack = null,
  className,
}: AgentShaderVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Pick which track to analyse based on state — listening listens to the user,
  // talking listens to the agent, everything else passes null (bands will decay).
  const activeTrack = useMemo(() => {
    if (state === 'listening') return userAudioTrack;
    if (state === 'talking') return agentAudioTrack;
    return null;
  }, [state, userAudioTrack, agentAudioTrack]);

  const bandsRef = useAudioFFT(activeTrack);

  // Track current + previous state for the crossfade uniform. A ref avoids a render per frame.
  const stateTransitionRef = useRef<{
    curr: number;
    prev: number;
    startedAt: number;
  }>({
    curr: STATE_TO_FLOAT[state],
    prev: STATE_TO_FLOAT[state],
    startedAt: 0,
  });

  useEffect(() => {
    const next = STATE_TO_FLOAT[state];
    stateTransitionRef.current = {
      prev: stateTransitionRef.current.curr,
      curr: next,
      startedAt: performance.now(),
    };
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let ctx: GLContext | null = null;
    try {
      ctx = createGLContext(canvas, vertSrc, fragSrc);
    } catch (err) {
      console.error('[AgentShaderVisualizer] WebGL init failed:', err);
      return;
    }

    const { gl, program } = ctx;
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const palette = readPalette(wrap);

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let rafId: number | null = null;
    let disposed = false;

    const render = (now: number) => {
      if (disposed || !ctx) return;
      if (resizeToDisplaySize(canvas)) {
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const bands: AudioBands = bandsRef.current;
      const { curr, prev, startedAt } = stateTransitionRef.current;
      // ~300 ms crossfade to new state.
      const t = Math.min(1, (now - startedAt) / 300);

      setUniforms(ctx, {
        u_resolution: { kind: 'v2', value: [canvas.width, canvas.height] },
        u_time: { kind: 'f', value: now / 1000 },
        u_state: { kind: 'f', value: curr },
        u_prevState: { kind: 'f', value: prev },
        u_stateT: { kind: 'f', value: t },
        u_bass: { kind: 'f', value: bands.bass },
        u_mid: { kind: 'f', value: bands.mid },
        u_treble: { kind: 'f', value: bands.treble },
        u_stop1: {
          kind: 'v3',
          value: [palette[0][0], palette[0][1], palette[0][2]],
        },
        u_stop2: {
          kind: 'v3',
          value: [palette[1][0], palette[1][1], palette[1][2]],
        },
        u_stop3: {
          kind: 'v3',
          value: [palette[2][0], palette[2][1], palette[2][2]],
        },
      });
      drawQuad(ctx);

      if (!reducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    if (reducedMotion) {
      // Render one frame so the canvas isn't transparent; re-render on state change via the effect above.
      render(performance.now());
    } else {
      rafId = requestAnimationFrame(render);
    }

    // WebGL context loss is rare but fatal — bail cleanly so a remount can re-init.
    const onLost = (e: Event) => {
      e.preventDefault();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
    canvas.addEventListener('webglcontextlost', onLost, false);

    return () => {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      canvas.removeEventListener('webglcontextlost', onLost);
      ctx?.dispose();
    };
    // Palette is read once at mount — theme swaps would need a remount, which is fine for now.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const px = SIZE_PX[size];

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ width: px, height: px }}
      role="img"
      aria-label="AI agent visual state"
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

export default AgentShaderVisualizer;
