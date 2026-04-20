import type { Meta, StoryObj } from '@storybook/react-vite';
import { LatencyIndicator } from './LatencyIndicator';

const meta = {
  title: 'Status/LatencyIndicator',
  component: LatencyIndicator,
  parameters: { layout: 'centered' },
  args: { ms: 180 },
  argTypes: {
    ms: { control: { type: 'range', min: 40, max: 900, step: 20 } },
  },
} satisfies Meta<typeof LatencyIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Good: Story = { args: { ms: 120 }, name: 'Good (<200ms)' };
export const Ok: Story = { args: { ms: 340 }, name: 'Ok (<500ms)' };
export const Poor: Story = { args: { ms: 620 }, name: 'Poor (>500ms)' };

export const Scale: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <LatencyIndicator ms={120} />
      <LatencyIndicator ms={340} />
      <LatencyIndicator ms={620} />
    </div>
  ),
};
