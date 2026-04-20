import type { Meta, StoryObj } from '@storybook/react-vite';
import { LatencyIndicator } from './LatencyIndicator';

const COMPONENT_DOC = `
Four signal-bars + ms readout. Quality tier derives from \`ms\`, which
drives both the filled-bar count and their color. Used in the call header
to surface connection health without a full graph.

### Usage

\`\`\`tsx
<LatencyIndicator ms={rtt} />
\`\`\`

### Tiers

| Tier | Threshold | Active bars | Color token |
| --- | --- | --- | --- |
| \`good\` | \`< 200 ms\` | 4 / 4 | \`bg-success\` (green) |
| \`ok\` | \`< 500 ms\` | 3 / 4 | \`bg-warning\` (amber) |
| \`poor\` | \`≥ 500 ms\` | 2 / 4 | \`bg-danger\` (red) |

Inactive bars fall back to \`bg-border\` so the four-bar silhouette still
reads in the \`poor\` tier — you can always see that two of four are lit.

### Visuals

- Ascending bar heights: \`[4, 7, 10, 13]px\`. Classic cellular-signal shape.
- Readout is \`font-mono text-[11px]\` — matches the other header status
  labels (\`ConnectionIndicator\`'s secondary slot, etc).
- Colors are semantic tokens (\`bg-success\` / \`bg-warning\` / \`bg-danger\`),
  so dark-mode adaptation is automatic.

### Input

Pass the current round-trip time in ms. There is no smoothing — if you're
feeding live WebRTC RTT samples, apply your own EMA first so the bars
don't flicker between tiers every sample.
`;

const meta = {
  title: 'Status/LatencyIndicator',
  component: LatencyIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { ms: 180 },
  argTypes: {
    ms: {
      control: { type: 'range', min: 40, max: 900, step: 20 },
      description:
        'Round-trip time in ms. `<200` → good (4 bars green), `<500` → ok (3 bars amber), else poor (2 bars red).',
    },
  },
} satisfies Meta<typeof LatencyIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Good: Story = {
  args: { ms: 120 },
  name: 'Good (<200ms)',
  parameters: {
    docs: {
      description: {
        story:
          'Healthy connection — four green bars. Typical for local WebRTC sessions or geographically close relays.',
      },
    },
  },
};

export const Ok: Story = {
  args: { ms: 340 },
  name: 'Ok (<500ms)',
  parameters: {
    docs: {
      description: {
        story:
          'Degraded but usable — three amber bars. Conversation remains possible; turn-taking may feel slightly sluggish.',
      },
    },
  },
};

export const Poor: Story = {
  args: { ms: 620 },
  name: 'Poor (>500ms)',
  parameters: {
    docs: {
      description: {
        story:
          'High latency — two red bars. Interruption handling becomes unreliable at this RTT; pair with an advisory toast if the value sticks.',
      },
    },
  },
};

export const Scale: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <LatencyIndicator ms={120} />
      <LatencyIndicator ms={340} />
      <LatencyIndicator ms={620} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All three tiers side-by-side. Use to check color contrast and verify the inactive-bar fallback reads correctly in the `poor` tier.',
      },
    },
  },
};
