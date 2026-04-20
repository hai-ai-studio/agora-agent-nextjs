import type { Meta, StoryObj } from '@storybook/react-vite';
import { BargeInIndicator } from './BargeInIndicator';

const COMPONENT_DOC = `
Uppercase mono pill that tells the user "you can interrupt" while the
agent is speaking, and flips to a rose-tinted active state the moment
the user actually starts talking over the agent.

### States

- \`active={false}\` (default) — muted neutral pill with "Tap to interrupt"
  label. The dot sits in a resting \`bg-warm-4\`.
- \`active={true}\` — rose-tinted pill with "Interrupting…" label. The dot
  fills \`bg-voice-b\` and runs \`animate-breathe\`; an extra
  \`animate-pulse-ring\` halo mounts on top.

\`\`\`tsx
<BargeInIndicator active={userIsInterrupting} />
\`\`\`

### Usage

Render whenever the agent is speaking. Flip \`active\` to \`true\` once the
local VAD detects the user vocalizing over the agent's audio — the
component does not detect this itself.

### Animations

- Dot breathes via \`animate-breathe\` (subtle opacity pulse) in both
  states when active — signals liveness.
- Active halo ring uses \`animate-pulse-ring\` — an expanding border to
  emphasize the interrupt moment.
- Outer pill transitions colors over 200ms so the state flip feels
  intentional rather than abrupt.
`;

const meta = {
  title: 'Pickers/BargeInIndicator',
  component: BargeInIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { active: false },
  argTypes: {
    active: {
      control: 'boolean',
      description:
        'Whether the user is actively interrupting. Flips label + tint + halo animation.',
    },
  },
} satisfies Meta<typeof BargeInIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resting: Story = {
  args: { active: false },
  name: 'Resting ("Tap to interrupt")',
  parameters: {
    docs: {
      description: {
        story:
          'Neutral affordance shown while the agent speaks and the user is quiet. Invites a barge-in without demanding attention.',
      },
    },
  },
};
export const Interrupting: Story = {
  args: { active: true },
  name: 'Active (user interrupting)',
  parameters: {
    docs: {
      description: {
        story:
          '`active={true}` — rose tint, "Interrupting…" label, breathing dot plus pulse-ring halo. Shown while the local VAD detects the user talking over the agent.',
      },
    },
  },
};

export const Pair: Story = {
  name: 'Both states',
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <BargeInIndicator active={false} />
      <BargeInIndicator active={true} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side comparison of resting and active appearances. Useful for eyeballing contrast between the two tints when tuning the palette.',
      },
    },
  },
};
