import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConnectionIndicator } from './ConnectionIndicator';

const meta = {
  title: 'Status/ConnectionIndicator',
  component: ConnectionIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Header connection signal. Pulsing dot + label + optional muted secondary badge (default "End-to-end encrypted"). The secondary slot auto-hides below the `md` breakpoint so narrow headers stay readable.',
      },
    },
  },
  args: { status: 'connected' },
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'connecting', 'reconnecting', 'error'],
    },
    secondary: { control: 'text' },
  },
} satisfies Meta<typeof ConnectionIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {};
export const Connecting: Story = { args: { status: 'connecting' } };
export const Reconnecting: Story = { args: { status: 'reconnecting' } };
export const Disconnected: Story = { args: { status: 'error' } };

export const WithoutSecondary: Story = {
  args: { secondary: false },
  name: 'Without secondary badge',
};

export const CustomLabel: Story = {
  args: { status: 'connected', label: 'Live · 02:14' },
  name: 'Custom label',
};

export const AllStates: Story = {
  name: 'All states',
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-4">
      {(['connected', 'connecting', 'reconnecting', 'error'] as const).map((s) => (
        <ConnectionIndicator key={s} status={s} />
      ))}
    </div>
  ),
};
