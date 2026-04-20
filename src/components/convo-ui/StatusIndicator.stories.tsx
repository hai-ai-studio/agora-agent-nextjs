import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusIndicator } from './StatusIndicator';

const COMPONENT_DOC = `
Breathing-dot pill describing agent state. Used in the orb stage, the
live call header, and anywhere the agent's current activity needs to
read as a short label rather than an icon.

### Usage

\`\`\`tsx
<StatusIndicator state="listening" />
<StatusIndicator state="thinking" size="sm" />
\`\`\`

### States

| State | Label | Dot color | Pulse | Typing dots |
| --- | --- | --- | --- | --- |
| \`idle\` | Ready | \`#A8A49A\` (warm grey) | — | — |
| \`listening\` | Listening | \`#2A2A27\` (ink) | yes | — |
| \`thinking\` | Thinking | \`#6B6862\` (grey) | yes | **yes** |
| \`speaking\` | Speaking | \`#E85C8A\` (accent pink) | yes | — |
| \`muted\` | Muted | \`#A8A49A\` (warm grey) | — | — |
| \`error\` | Error | \`#C94444\` (danger) | — | — |

Only \`thinking\` adds the three animated typing dots — a secondary signal
that the agent is actively working.

### Animation

- Pulsing states render two stacked \`<span>\`s: a \`animate-breathe\` dot +
  an \`animate-pulse-ring\` halo at \`opacity: 0.4\`.
- \`thinking\` adds three \`animate-typing-dot\` microdots with staggered
  delays (\`0s / 0.15s / 0.3s\`).
- Non-pulsing states (\`idle\`, \`muted\`, \`error\`) render a flat dot — the
  lack of motion is intentional signal.

### Sizing

- \`size="md"\` (default) — \`text-[13px]\`, \`py-1.5\`. For primary headers.
- \`size="sm"\` — \`text-xs\`, \`py-1\`. For tight nav bars or secondary slots.
The dot itself stays \`size-2\` in both.
`;

const meta = {
  title: 'Status/StatusIndicator',
  component: StatusIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { state: 'listening', size: 'md' },
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'listening', 'thinking', 'speaking', 'muted', 'error'],
      description:
        'Agent state. Drives label, dot color, pulse animation, and whether typing dots render.',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md'],
      description: 'Pill size. `md` (default) for primary headers; `sm` for compact slots.',
    },
  },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { state: 'idle' },
  parameters: {
    docs: {
      description: {
        story:
          '"Ready" — warm grey dot, no pulse. Shown after connection completes but before the user has engaged. The stillness is intentional: this is a passive state.',
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
          '"Listening" — ink-dark dot with breathe + pulse-ring. Used while the user is speaking. The darker dot (vs `thinking`\'s mid-grey) reads as "attention focused on you".',
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
          '"Thinking" + three staggered typing dots. The only state that renders the auxiliary dots — they read as "actively working" the same way typing indicators do in chat UIs.',
      },
    },
  },
};

export const Speaking: Story = {
  args: { state: 'speaking' },
  parameters: {
    docs: {
      description: {
        story:
          '"Speaking" — accent-pink dot with breathe + pulse-ring. The only colored-dot state; the pink is the same gradient stop as the middle of the voice gradient, tying it back to the orb.',
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
          '"Muted" — warm grey, no pulse. Visually similar to `idle` but with a different label; the pill is the only part of the UI that distinguishes the two states in text.',
      },
    },
  },
};

export const Error: Story = {
  args: { state: 'error' },
  parameters: {
    docs: {
      description: {
        story:
          '"Error" — danger-red dot, no pulse. A static dot draws the eye without the distraction of motion, which matters when paired with an error toast or recovery UI.',
      },
    },
  },
};

export const AllStates: Story = {
  name: 'All states',
  render: () => (
    <div className="flex flex-wrap gap-2.5">
      {(['idle', 'listening', 'thinking', 'speaking', 'muted', 'error'] as const).map((s) => (
        <StatusIndicator key={s} state={s} />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All six states side-by-side for palette / motion comparison. Useful when auditing how the states differentiate at a glance.',
      },
    },
  },
};
