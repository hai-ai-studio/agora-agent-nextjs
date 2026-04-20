import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrandMark } from './BrandMark';

const COMPONENT_DOC = `
Round ink chip with a concentric-circle glyph followed by an italic serif
label. The recognizable top-left signature of landing + conversation screens.
Two shapes driven by whether \`agentName\` is provided:

### Product only _(no \`agentName\`)_

\`\`\`tsx
<BrandMark />                       // → ● Agora
\`\`\`

Use on the **landing screen** before a session has started. The agent is
still hypothetical at this point (the hero positions "your agent"), so only
the product is identified. Avoids pre-committing the user to a specific
demo character.

### Agent · Product _(\`agentName\` provided)_

\`\`\`tsx
<BrandMark agentName="Ada" />       // → ● Ada · Agora
\`\`\`

Use **in-call**, once the user is actually talking to a named agent. The
agent name on the left anchors "who am I talking to"; the muted product
name on the right keeps brand attribution.

### Sizing

- \`labelSize="lg"\` (default): \`text-2xl\` — full-page headers.
- \`labelSize="md"\`: \`text-xl\` — compact headers.
- \`labelSize="sm"\`: \`text-base\` — nav bars, tight contexts.

\`size\` independently controls the glyph chip diameter; the glyph strokes
scale proportionally.

### Customization

Both \`agentName\` and \`productName\` accept any string — use this for
white-label demos, or pair with environment variables to override at
deploy time. The italic serif + ink chip style stays consistent.
`;

const meta = {
  title: 'Identity/BrandMark',
  component: BrandMark,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { productName: 'Agora', size: 32, labelSize: 'lg' },
  argTypes: {
    agentName: {
      control: 'text',
      description:
        'Agent display name. Omit for product-only rendering (landing/pre-call). Pass a string to get "Agent · Product" (in-call).',
    },
    productName: {
      control: 'text',
      description: 'Product / host name. Always shown, muted when an agent is present.',
    },
    size: {
      control: { type: 'range', min: 20, max: 64, step: 2 },
      description: 'Glyph chip diameter in px. Default 32.',
    },
    labelSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Label size variant. `lg` (default) / `md` / `sm`.',
    },
  },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Product only (landing)',
  parameters: {
    docs: {
      description: {
        story:
          "No `agentName` — renders just the product. Used on the landing page where the agent is still hypothetical (\"your agent\" in the hero).",
      },
    },
  },
};

export const WithAgent: Story = {
  args: { agentName: 'Ada' },
  name: 'Agent · Product (in-call)',
  parameters: {
    docs: {
      description: {
        story:
          'With `agentName`, the label becomes "Agent · Product". Used in the conversation shell once the user is actually talking to a specific agent.',
      },
    },
  },
};

export const Medium: Story = {
  args: { agentName: 'Ada', labelSize: 'md' },
  parameters: {
    docs: {
      description: {
        story:
          '`labelSize="md"` — drops the label to `text-xl`. Useful when the header bar has competing elements (nav, status indicators).',
      },
    },
  },
};

export const Small: Story = {
  args: { agentName: 'Ada', labelSize: 'sm', size: 24 },
  parameters: {
    docs: {
      description: {
        story:
          '`labelSize="sm"` with a smaller chip — for dense nav bars or sidebars.',
      },
    },
  },
};

export const CustomNames: Story = {
  args: { agentName: 'Sage', productName: 'Nimbus' },
  name: 'Custom agent + product',
  parameters: {
    docs: {
      description: {
        story:
          'White-label example. Both names accept any string — pair with env vars to override at deploy time.',
      },
    },
  },
};

export const InHeader: Story = {
  name: 'In a header bar',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Realistic placement: BrandMark on the left of a top bar, balanced by a status indicator on the right. This is the actual layout used by both the landing screen and the conversation shell.',
      },
    },
  },
  render: (args) => (
    <div className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <BrandMark {...args} />
      <div className="font-mono text-xs tracking-[-0.01em] text-muted-foreground">
        End-to-end encrypted
      </div>
    </div>
  ),
};
