import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentConfigCard } from './AgentConfigCard';

const COMPONENT_DOC = `
Agent identity summary — a catalog-ready card that previews the
persona, system prompt, wired tools, and live telemetry in one glance.

### When to use

- Admin / agent-builder surfaces where operators inspect a deployed
  agent at a glance.
- "Share this agent" previews — pastes into docs, landing pages, or a
  directory of available personas.
- Storybook reference for downstream dashboards that want the same
  header + prompt + tools + telemetry rhythm.

### Anatomy

1. **Header row** — gradient persona chip, title, \`LIVE\` badge, and
   a single-line meta strip (\`Voice · GPT-4o · Ada · en-US\`).
2. **System prompt excerpt** — clipped to \`max-h-20\` with a bottom
   gradient fade into \`bg-muted\`. Inline tool names are colored
   \`text-accent\` to preview how references light up.
3. **Tool chips** — bordered pills with a \`text-success\` status dot.
   Count is shown in the section label.
4. **Telemetry row** — three columns (\`Latency\`, \`Turns\`, \`Avg call\`)
   separated from the body by a top border.

### Content is currently static

The card accepts no props today; it's a visual reference. Real usage
should accept an \`agent\` object and thread it through. Keep the
layout and spacing (\`gap-4\`, \`p-5\`, \`rounded-2xl\`) when reworking —
they're tuned for a 420px column.
`;

const meta = {
  title: 'Identity/AgentConfigCard',
  component: AgentConfigCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgentConfigCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Canonical sample: a "Customer Support" persona with four tools and healthy telemetry. Use as the reference render when redesigning the card or swapping in real data.',
      },
    },
  },
};
