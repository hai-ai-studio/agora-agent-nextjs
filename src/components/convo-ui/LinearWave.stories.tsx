import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinearWave } from './LinearWave';

const COMPONENT_DOC = `
Canvas oscilloscope trace. Two translucent sine curves layered in the voice
gradient — reads as a waveform rather than a meter. Use this when you want
a line shape (classic audio-trace aesthetic); use \`BarsWave\` when you want
bar-graph energy.

### Usage

\`\`\`tsx
<LinearWave active={isConnected} width={240} height={56} />
\`\`\`

### Behavior

- **\`active={true}\`** — curves breathe via an envelope (\`sin(x * 0.02 + t)\`)
  combined with the per-layer sine. Looks like a live audio trace.
- **\`active={false}\`** — envelope collapses to \`1\`, leaving flat low-amplitude
  lines. Use for "session not yet live" headers / placeholders.

### Visuals

Two overlapping sine layers draw at \`alpha = 1\` and \`0.5\` with different
phase speeds — gives the wave depth without needing a third rendering pass.
The horizontal gradient (\`#7C5CFF → #E85C8A → #F5A55C\`) is hardcoded; if
you need a different palette for a state, use a tinted color on \`BarsWave\`
instead.

### No input

Unlike \`BarsWave\`, \`LinearWave\` is synth-only — it does not accept external
FFT values. It is intentionally decorative; pair it with real audio-driven
visuals (\`BarsWave\`, \`VoiceOrb\`) rather than using it to represent energy.
`;

const meta = {
  title: 'Waveforms/LinearWave',
  component: LinearWave,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { active: true, width: 240, height: 56 },
  argTypes: {
    active: {
      control: 'boolean',
      description:
        'When `true`, curves breathe via an envelope. When `false`, lines flatten. Use for pre-session / paused states.',
    },
    width: {
      control: { type: 'range', min: 120, max: 480, step: 20 },
      description: 'Canvas width in px.',
    },
    height: {
      control: { type: 'range', min: 24, max: 120, step: 4 },
      description: 'Canvas height in px. Wave amplitude scales with height.',
    },
  },
} satisfies Meta<typeof LinearWave>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Standard active trace. Two sine layers with per-layer phase speed give the line depth without a heavy render cost.',
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
          '`active={false}` flattens the envelope to `1` — the lines still oscillate faintly, but without the breathing motion. Good for "not connected yet" placeholder rows.',
      },
    },
  },
};

export const Wide: Story = {
  args: { width: 420, height: 72 },
  parameters: {
    docs: {
      description: {
        story:
          'Full-width stage size. Amplitude scales with `height`, so a taller canvas gives a more dramatic trace — pair with hero layouts.',
      },
    },
  },
};
