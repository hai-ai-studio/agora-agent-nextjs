import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BarsWave } from './BarsWave';
import { spreadBandsToBarValues } from './spread-bands';

const COMPONENT_DOC = `
Meter-style waveform — the bar-graph visualization of voice activity. Two
modes of operation:

### Synth mode _(default, no \`getTargets\`)_

Runs a built-in sine + noise animation. Good for decorative placeholders,
idle/thinking states, or anywhere you don't have a real audio source to
drive. Controlled by \`bars\`, \`amplitude\`, \`active\`.

\`\`\`tsx
<BarsWave bars={32} amplitude={0.8} />
\`\`\`

### Driven mode _(pass \`getTargets\` callback)_

Caller provides a callback that returns per-bar targets for the current
frame. BarsWave calls it **inside its own RAF loop** — the caller never
needs its own \`requestAnimationFrame\`, and no React re-renders happen on
the hot path (DOM heights are written directly via refs).

\`\`\`tsx
// getTargets identity must be stable — useCallback + scratch buffer
const scratch = useRef(new Float32Array(48));
const getTargets = useCallback((t: number) => {
  return spreadBandsToBarValues(bandsRef.current, 48, { seeds, t }, scratch.current);
}, [seeds]);

return <BarsWave getTargets={getTargets} bars={48} color="#16a34a" />;
\`\`\`

### Smoothing (attack / release)

Both modes route through the same VU-meter smoothing path:

\`\`\`
next = prev + (target - prev) × rate
rate = target > prev ? attack : release
\`\`\`

Fast **attack** (default \`0.45\`) makes peaks pop up instantly — useful for
speech energy. Slow **release** (default \`0.08\`) keeps decays smooth so bars
fade naturally instead of snapping to silence. Set both to \`1.0\` to disable
smoothing (see **Jitter (smoothing off)** story to compare).

Tune per instance if the default feel is off for your use case:

\`\`\`tsx
<BarsWave getTargets={getTargets} attack={0.6} release={0.05} />
\`\`\`

### Visuals

- \`color="gradient"\` (default) uses the brand voice gradient interpolated
  per-bar position. Pass any CSS color string to override, e.g. \`"#16a34a"\`
  for a user-listening state or a CSS custom property like
  \`"var(--foreground)"\`.
- \`active={false}\` dims opacity and glides bars to a low baseline —
  attack/release applies here too, so the fade-out is graceful.

### Helpers

See \`spreadBandsToBarValues\` for the standard bass/mid/treble → per-bar
values mapping. It handles noise gating, x² compression, center-mirror
envelope, and per-bar sparkle — all parameterized.
`;

const meta = {
  title: 'Waveforms/BarsWave',
  component: BarsWave,
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { active: true, bars: 32, height: 48, amplitude: 1, color: 'gradient' },
  argTypes: {
    bars: {
      control: { type: 'range', min: 12, max: 64, step: 2 },
      description:
        'Bar count. Pre-allocates the scratch and ref arrays; driven mode returns arrays of this length from `getTargets`.',
    },
    height: {
      control: { type: 'range', min: 24, max: 120, step: 4 },
      description: 'Container height in px.',
    },
    amplitude: {
      control: { type: 'range', min: 0.1, max: 1, step: 0.05 },
      description: 'Synth-mode amplitude multiplier. Ignored in driven mode.',
    },
    attack: {
      control: { type: 'range', min: 0.05, max: 1, step: 0.05 },
      description:
        'Smoothing rate for rising values (0.05–1). Higher = faster pop on peaks. Default 0.45.',
    },
    release: {
      control: { type: 'range', min: 0.02, max: 1, step: 0.02 },
      description:
        'Smoothing rate for falling values (0.02–1). Lower = slower decay. Default 0.08.',
    },
    minHeight: {
      control: { type: 'range', min: 0, max: 10, step: 1 },
      description:
        'Minimum bar height in px so bars never disappear entirely. Default 3.',
    },
    color: {
      control: 'select',
      options: ['gradient', '#2A2A27', '#7C5CFF', '#16A34A', '#b91c1c'],
      description:
        '`gradient` uses the brand voice gradient; any other value is a static CSS color.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BarsWave>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Synth-mode stories ------------------------------------------------------

export const Default: Story = {
  name: 'Synth (default)',
  parameters: {
    docs: {
      description: {
        story:
          'Built-in sine + noise animation. No audio input required. The go-to for decorative placements or idle/thinking states.',
      },
    },
  },
};

export const Inactive: Story = {
  args: { active: false },
  parameters: {
    docs: {
      description: {
        story:
          '`active={false}` — bars glide to a low baseline and the row dims to 40% opacity. Attack/release still applies, so if you flip this prop mid-animation the transition is smooth rather than an instant snap.',
      },
    },
  },
};

export const LowDensity: Story = {
  args: { bars: 16, height: 60 },
  parameters: {
    docs: {
      description: {
        story:
          'Fewer, fatter bars. Good for persona cards or other tight side-by-side placements where individual bar motion needs to read.',
      },
    },
  },
};

export const HighDensity: Story = {
  args: { bars: 48, height: 60 },
  parameters: {
    docs: {
      description: {
        story:
          'Spectrum-analyser density. Matches the conversation shell\'s main waveform count — good for full-width stages.',
      },
    },
  },
};

export const SolidColor: Story = {
  args: { color: '#2A2A27' },
  name: 'Solid color (non-gradient)',
  parameters: {
    docs: {
      description: {
        story:
          'Pass any CSS color string instead of `"gradient"` to paint all bars the same. The conversation adapter uses this to map view-state to a single color (green for user-listening, blue for agent-speaking, etc).',
      },
    },
  },
};

// --- Driven-mode stories -----------------------------------------------------
// Simulates a live FFT pipeline by synthesizing fake bass/mid/treble bands
// from sinusoids + noise, then routing through `spreadBandsToBarValues`.
// The getTargets callback runs INSIDE BarsWave's RAF — nothing in this story
// component ever causes a re-render after mount (just like the real
// conversation feature).
function DrivenStory({
  barCount = 48,
  height = 60,
  color = 'gradient',
  attack = 0.45,
  release = 0.08,
}: {
  barCount?: number;
  height?: number;
  color?: string;
  attack?: number;
  release?: number;
}) {
  // useState lazy init is the sanctioned place for impure calls. Seeds stay
  // at the barCount they were initialized with — changing `bars` via the
  // Controls slider doesn't regenerate them, which keeps the sparkle pattern
  // stable across knob tweaks. Remount the story (reload) to reroll seeds.
  const [seeds] = useState(() =>
    Array.from({ length: barCount }, () => Math.random()),
  );
  const scratch = useRef<Float32Array>(new Float32Array(barCount));
  useEffect(() => {
    if (scratch.current.length === barCount) return;
    scratch.current = new Float32Array(barCount);
  }, [barCount]);

  const getTargets = useCallback(
    (t: number) => {
      // t is seconds since BarsWave's RAF started — good enough for sparkle
      // phase and sinusoid drive in a story context.
      // Fake audio bands — three oscillators at different frequencies plus
      // noise, to simulate the texture of real speech spectra.
      const bass = Math.max(
        0,
        0.4 + 0.35 * Math.sin(t * 1.3) + (Math.random() - 0.5) * 0.25,
      );
      const mid = Math.max(
        0,
        0.5 + 0.3 * Math.sin(t * 2.1 + 1) + (Math.random() - 0.5) * 0.2,
      );
      const treble = Math.max(
        0,
        0.35 + 0.3 * Math.sin(t * 3.2 + 2) + (Math.random() - 0.5) * 0.25,
      );
      return spreadBandsToBarValues(
        { bass, mid, treble },
        barCount,
        { seeds, t },
        scratch.current,
      );
    },
    [barCount, seeds],
  );

  return (
    <BarsWave
      getTargets={getTargets}
      bars={barCount}
      height={height}
      color={color}
      attack={attack}
      release={release}
    />
  );
}

export const Driven: Story = {
  name: 'Driven (getTargets callback)',
  render: (args) => (
    <DrivenStory
      barCount={args.bars ?? 48}
      height={args.height ?? 60}
      color={args.color ?? 'gradient'}
      attack={args.attack}
      release={args.release}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
Driven mode with synthesized "FFT-like" data: three sinusoids at 1.3 / 2.1 /
3.2 Hz plus per-frame noise, routed through \`spreadBandsToBarValues\`.
Mirrors what the conversation feature does with real mic/agent audio.

Play with **attack** and **release** in the controls:

- \`attack = 0.9, release = 0.05\` — very responsive peaks, long graceful decays. Classic VU meter.
- \`attack = 0.2, release = 0.2\` — smooth but laggy, feels muted.
- \`attack = 1, release = 1\` — smoothing disabled (see **Jitter** story).

The three default colors (\`#16a34a\`, \`#1d4ed8\`, \`#b45309\`) match the
conversation shell's listening / speaking / thinking states.
        `.trim(),
      },
    },
  },
};

export const JitterOff: Story = {
  name: 'Jitter (smoothing off)',
  args: { attack: 1, release: 1 },
  render: (args) => (
    <DrivenStory
      barCount={args.bars ?? 48}
      height={args.height ?? 60}
      color={args.color ?? 'gradient'}
      attack={args.attack}
      release={args.release}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '**Attack and release both set to 1.0** — each frame paints the raw target value directly, no temporal blending. Compare to the **Driven** story to see what the attack/release envelope is hiding: raw per-frame FFT data is noisy, and without smoothing every bar strobes from frame to frame. This is what the conversation shell was doing before smoothing moved into BarsWave (2026-04-20).',
      },
    },
  },
};

export const UserListening: Story = {
  name: 'User listening (green)',
  args: { attack: 0.5, release: 0.08 },
  render: (args) => (
    <DrivenStory
      barCount={args.bars ?? 48}
      height={args.height ?? 60}
      color="#16a34a"
      attack={args.attack}
      release={args.release}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'How the conversation shell paints the user row during `listening` state: solid green, driven by the local mic\'s FFT. Attack slightly bumped to 0.5 so the bars catch speech onset snappily.',
      },
    },
  },
};

export const AgentSpeaking: Story = {
  name: 'Agent speaking (blue)',
  args: { attack: 0.45, release: 0.08 },
  render: (args) => (
    <DrivenStory
      barCount={args.bars ?? 48}
      height={args.height ?? 60}
      color="#1d4ed8"
      attack={args.attack}
      release={args.release}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Agent row during `speaking` state: solid blue, driven by the remote agent's FFT. Same smoothing defaults as the user row — the color is the only visual difference.",
      },
    },
  },
};
