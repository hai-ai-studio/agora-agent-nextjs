import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToolCallCard } from './ToolCallCard';

const meta = {
  title: 'Tools/ToolCallCard',
  component: ToolCallCard,
  parameters: { layout: 'padded' },
  args: {
    name: 'lookup_user',
    status: 'running',
    args: { email: 'alex@nimbus.io' },
  },
  argTypes: {
    status: { control: 'radio', options: ['running', 'success', 'error'] },
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

export const Running: Story = { args: { status: 'running' } };
export const Success: Story = {
  args: {
    status: 'success',
    name: 'get_invoice',
    args: { user_id: 'u_88241', period: '2026-04' },
    result: '$42.00 · due Apr 18',
    duration: '240ms',
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
};
