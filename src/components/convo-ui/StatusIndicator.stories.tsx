import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusIndicator } from './StatusIndicator';

const meta = {
  title: 'Status/StatusIndicator',
  component: StatusIndicator,
  parameters: { layout: 'centered' },
  args: { state: 'listening', size: 'md' },
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'listening', 'thinking', 'speaking', 'muted', 'error'],
    },
    size: { control: 'radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { state: 'idle' } };
export const Listening: Story = { args: { state: 'listening' } };
export const Thinking: Story = { args: { state: 'thinking' } };
export const Speaking: Story = { args: { state: 'speaking' } };
export const Muted: Story = { args: { state: 'muted' } };
export const Error: Story = { args: { state: 'error' } };

export const AllStates: Story = {
  name: 'All states',
  render: () => (
    <div className="flex flex-wrap gap-2.5">
      {(['idle', 'listening', 'thinking', 'speaking', 'muted', 'error'] as const).map((s) => (
        <StatusIndicator key={s} state={s} />
      ))}
    </div>
  ),
};
