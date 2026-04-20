import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinearWave } from './LinearWave';

const meta = {
  title: 'Waveforms/LinearWave',
  component: LinearWave,
  parameters: { layout: 'centered' },
  args: { active: true, width: 240, height: 56 },
  argTypes: {
    width: { control: { type: 'range', min: 120, max: 480, step: 20 } },
    height: { control: { type: 'range', min: 24, max: 120, step: 4 } },
  },
} satisfies Meta<typeof LinearWave>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Inactive: Story = { args: { active: false } };
export const Wide: Story = { args: { width: 420, height: 72 } };
