import type { Meta, StoryObj } from '@storybook/react-vite';
import { BargeInIndicator } from './BargeInIndicator';

const meta = {
  title: 'Pickers/BargeInIndicator',
  component: BargeInIndicator,
  parameters: { layout: 'centered' },
  args: { active: false },
} satisfies Meta<typeof BargeInIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resting: Story = {
  args: { active: false },
  name: 'Resting ("Tap to interrupt")',
};
export const Interrupting: Story = {
  args: { active: true },
  name: 'Active (user interrupting)',
};

export const Pair: Story = {
  name: 'Both states',
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <BargeInIndicator active={false} />
      <BargeInIndicator active={true} />
    </div>
  ),
};
