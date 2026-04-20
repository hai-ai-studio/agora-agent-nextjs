import type { Meta, StoryObj } from '@storybook/react-vite';
import { SessionList } from './SessionList';

const meta = {
  title: 'Identity/SessionList',
  component: SessionList,
  parameters: { layout: 'padded' },
  args: { compact: false },
  argTypes: {
    compact: { control: 'boolean' },
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

export const Default: Story = {};
export const Compact: Story = { args: { compact: true } };
