import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToolCallCard } from './ToolCallCard';

const COMPONENT_DOC = `
One tool invocation rendered inline in the transcript — name, JSON
args, status dot, and (optionally) a result line. Enters with
\`animate-slide-up\` so live calls feel like they're being appended
in real time.

### When to use

Inline in the conversation stream each time the agent fires a tool.
Render one card per \`tool_call\` event; toggle \`status\` as the call
progresses.

\`\`\`tsx
<ToolCallCard
  name="get_invoice"
  status="running"
  args={{ user_id: 'u_88241', period: '2026-04' }}
/>
\`\`\`

### Status

| Value      | Dot color    | Extra              |
| ---------- | ------------ | ------------------ |
| \`running\`  | \`bg-warning\` | Breathes (pulse)   |
| \`success\`  | \`bg-success\` | Optional \`→ result\` |
| \`error\`    | \`bg-danger\`  | Optional \`× result\` in red |

\`duration\` is appended to the status label (\`· 240ms\`) regardless of
status — useful for post-hoc timing even on failures.

### Args formatting

\`args\` is a flat \`Record<string, string>\`. Rendered as a pseudo-JSON
object with keys in \`text-accent\` and values in the foreground. Not a
full syntax highlighter — just enough color to read as "tool-adjacent"
in a transcript.
`;

const meta = {
  title: 'Tools/ToolCallCard',
  component: ToolCallCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: {
    name: 'lookup_user',
    status: 'running',
    args: { email: 'alex@nimbus.io' },
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Tool name (snake_case). Rendered as the card title.',
    },
    status: {
      control: 'radio',
      options: ['running', 'success', 'error'],
      description:
        '`running` pulses the warning dot; `success` shows `→ result`; `error` shows `× result` in red.',
    },
    result: {
      control: 'text',
      description:
        'Short outcome summary. Only rendered when `status` is `success` or `error`.',
    },
    duration: {
      control: 'text',
      description:
        'Formatted duration (e.g. `240ms`). Appended to the status label with a `·` separator.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToolCallCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {
  args: { status: 'running' },
  parameters: {
    docs: {
      description: {
        story:
          'Mid-call state — pulsing warning dot, no result line yet. Render this immediately on `tool_call` start and swap to `success` / `error` when the response arrives.',
      },
    },
  },
};

export const Success: Story = {
  args: {
    status: 'success',
    name: 'get_invoice',
    args: { user_id: 'u_88241', period: '2026-04' },
    result: '$42.00 · due Apr 18',
    duration: '240ms',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Completed call — green dot, `→ result` line, duration appended to the status label. Keep the result short; long payloads should link to a detail view instead of spilling into the transcript.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    status: 'error',
    name: 'issue_refund',
    args: { order_id: '8821' },
    result: 'Order expired',
  },
  name: 'Failed',
  parameters: {
    docs: {
      description: {
        story:
          'Failed call — red dot, `× result` line in danger color. The agent usually narrates recovery in a follow-up transcript bubble, so keep the card itself terse.',
      },
    },
  },
};

export const Timeline: Story = {
  name: 'All three statuses',
  render: () => (
    <div className="flex flex-col gap-2.5">
      <ToolCallCard name="lookup_user" status="running" args={{ email: 'alex@nimbus.io' }} />
      <ToolCallCard
        name="get_invoice"
        status="success"
        args={{ user_id: 'u_88241' }}
        result="$42.00"
        duration="240ms"
      />
      <ToolCallCard
        name="issue_refund"
        status="error"
        args={{ order_id: '8821' }}
        result="Order expired"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side comparison of all three statuses stacked with a 10px gap — matches how they appear in a real transcript scroll.',
      },
    },
  },
};
