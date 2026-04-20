import type { Meta, StoryObj } from '@storybook/react-vite';
import { VoiceOrb } from './VoiceOrb';

const COMPONENT_DOC = `
Canvas-drawn signature blob with the voice gradient + glow halo. The DS's
hero element — anywhere the conversation UI needs "the agent" to feel
present, this is what reads. Five states plus an amplitude knob for the
active ones.

### States

| State | Motion | Halo | Gradient rotation |
| --- | --- | --- | --- |
| \`idle\` | Gentle idle ripple | 1 layer | Slow (0.15 rad/s) |
| \`listening\` | Amplitude-driven deform | 2 layers | Slow |
| \`thinking\` | Mid-frequency wobble | 1 layer | **Fast** (0.5 rad/s) |
| \`speaking\` | Large amplitude-driven deform | 3 layers | Slow |
| \`muted\` | Barely-moving + grey palette | 1 layer | Slow, desaturated |

\`thinking\` is the only state that reads as "processing" — faster gradient
rotation + mid-frequency blob deformation. \`muted\` is the only state that
swaps the voice gradient for a neutral grey (\`#A8A49A → #6B6862\`).

### Amplitude

\`amplitude\` (0–1) scales blob deformation in \`listening\` and \`speaking\`
states. Feed it a smoothed RMS or FFT-derived envelope from the relevant
audio source:

\`\`\`tsx
<VoiceOrb state="listening" amplitude={micRms} />
<VoiceOrb state="speaking"  amplitude={agentRms} />
\`\`\`

Values are read through refs so the RAF loop picks them up without
restarting — you can push a new amplitude every frame cheaply.

### Sizing

\`size\` sets both canvas width and height (the orb is square). Canvas
backing store is DPR-scaled at setup time, so changing \`size\` restarts the
loop. Pick a size and stick with it for the lifetime of the view.

### Accessibility

The wrapper has \`role="img"\` and an \`ariaLabel\` prop (default \`"Voice
orb"\`). The canvas itself is \`aria-hidden\`. Motion is always on — consumers
that need reduced-motion support should swap to a static \`state="idle"\`
orb or a different visual entirely.
`;

const meta = {
  title: 'Signature/VoiceOrb',
  component: VoiceOrb,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { size: 140, amplitude: 0.5, state: 'listening' },
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'listening', 'thinking', 'speaking', 'muted'],
      description:
        'Visual state. Drives deformation math, halo layer count, gradient rotation speed, and palette.',
    },
    size: {
      control: { type: 'range', min: 60, max: 300, step: 10 },
      description:
        'Canvas width/height in px (square). Changing this restarts the RAF loop — pick once per view.',
    },
    amplitude: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description:
        'Target amplitude 0–1. Only affects `listening` and `speaking`. Feed a smoothed RMS or FFT envelope.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Label exposed on the outer `role="img"` wrapper. Default `"Voice orb"`.',
    },
  },
} satisfies Meta<typeof VoiceOrb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { state: 'idle' },
  parameters: {
    docs: {
      description: {
        story:
          'Resting state — gentle idle ripple, single halo layer. Use when the session is connected but neither party is speaking. Amplitude is ignored.',
      },
    },
  },
};

export const Listening: Story = {
  args: { state: 'listening' },
  parameters: {
    docs: {
      description: {
        story:
          'User is speaking. Two halo layers; blob deformation scales with `amplitude`. Pair with the mic\'s smoothed RMS for a responsive "I hear you" signal.',
      },
    },
  },
};

export const Thinking: Story = {
  args: { state: 'thinking' },
  parameters: {
    docs: {
      description: {
        story:
          'Agent is processing. The only state with fast gradient rotation (3× the others) — that spinning gradient is the visual tell for "working on it". Amplitude is ignored.',
      },
    },
  },
};

export const Speaking: Story = {
  args: { state: 'speaking', amplitude: 0.7 },
  parameters: {
    docs: {
      description: {
        story:
          'Agent is speaking. Three halo layers (most prominent state) and the largest amplitude-driven deformation. Feed agent-audio RMS into `amplitude`.',
      },
    },
  },
};

export const Muted: Story = {
  args: { state: 'muted' },
  parameters: {
    docs: {
      description: {
        story:
          'Mic is muted. Desaturated grey palette (`#A8A49A → #6B6862`) and near-zero deformation — deliberately reads as "asleep". The only state that drops the voice gradient.',
      },
    },
  },
};

export const OnDark: Story = {
  args: { state: 'speaking', amplitude: 0.6 },
  parameters: {
    backgrounds: { default: 'fixed-dark' },
    docs: {
      description: {
        story:
          'Speaking orb on a dark surface to demo the self-carried glow halo. The orb is designed to work on both paper and dark backgrounds without a container frame.',
      },
    },
  },
  name: 'On dark surface',
};

export const Large: Story = {
  args: { state: 'speaking', size: 240, amplitude: 0.7 },
  parameters: {
    backgrounds: { default: 'fixed-dark' },
    docs: {
      description: {
        story:
          'Hero-size orb (`size={240}`) for landing/empty-state stages. The blob and halo scale proportionally; amplitude deformation stays in absolute px so it reads the same regardless of size.',
      },
    },
  },
};
