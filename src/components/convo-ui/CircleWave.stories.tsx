import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleWave } from './CircleWave';

const meta = {
  title: 'Waveforms/CircleWave',
  component: CircleWave,
  parameters: { layout: 'centered' },
  args: { active: true, size: 120 },
  argTypes: {
    size: { control: { type: 'range', min: 60, max: 240, step: 10 } },
  },
} satisfies Meta<typeof CircleWave>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Inactive: Story = { args: { active: false } };
export const Large: Story = { args: { size: 200 } };
