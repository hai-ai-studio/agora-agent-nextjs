import type { Meta, StoryObj } from '@storybook/react-vite';
import { SessionList } from './SessionList';

const COMPONENT_DOC = `
Scrollable list of past voice calls — the history sidebar for the
conversation app. Each row bundles a gradient avatar, call title,
agent name, duration, and a relative timestamp.

### When to use

Drop this into a sidebar or drawer to show recent sessions. The
content is currently sourced from a canonical in-module \`SESSIONS\`
array; real integrations should replace it with fetched data and pass
the same row shape.

### Row anatomy

- **Gradient avatar** — one-to-one with the agent's voice color. The
  \`accent\` prop on each row is a CSS \`linear-gradient(...)\` string;
  defaults to the brand three-stop gradient if omitted.
- **Active state** — \`active: true\` swaps the background to \`bg-muted\`
  and pins a 3px \`bg-warm-6\` leading bar. Only one row should be active
  at a time.
- **Unread dot** — \`unread: true\` pins a \`bg-voice-b\` dot in the
  top-right corner. Independent of \`active\`.

### Sizing

\`\`\`tsx
<SessionList />                 // six canonical sessions
<SessionList compact />         // first four — denser layouts
\`\`\`

The list itself has no width — place it inside a parent that fixes one
(the catalog uses a 360px bordered card).
`;

const meta = {
  title: 'Identity/SessionList',
  component: SessionList,
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { compact: false },
  argTypes: {
    compact: {
      control: 'boolean',
      description:
        'Trims the list to the first 4 entries. Use in denser layouts (narrow drawers, mobile sheets).',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] rounded-xl border border-border bg-surface p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SessionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Full six-row list. The first entry is `active`, the third is `unread` — covers every visual state in a single screen.',
      },
    },
  },
};

export const Compact: Story = {
  args: { compact: true },
  parameters: {
    docs: {
      description: {
        story:
          '`compact={true}` — first four rows only. Use where vertical space is constrained (mobile side sheet, dashboard card).',
      },
    },
  },
};
