import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarsWave } from './BarsWave';

const meta = {
  title: 'Waveforms/BarsWave',
  component: BarsWave,
  parameters: { layout: 'padded' },
  args: { active: true, bars: 32, height: 48, amplitude: 1, color: 'gradient' },
  argTypes: {
    bars: { control: { type: 'range', min: 12, max: 64, step: 2 } },
    height: { control: { type: 'range', min: 24, max: 120, step: 4 } },
    amplitude: { control: { type: 'range', min: 0.1, max: 1, step: 0.05 } },
    color: {
      control: 'select',
      options: ['gradient', '#2A2A27', '#7C5CFF', '#16A34A'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BarsWave>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Inactive: Story = { args: { active: false } };
export const LowDensity: Story = { args: { bars: 16, height: 60 } };
export const HighDensity: Story = { args: { bars: 48, height: 60 } };
export const SolidColor: Story = {
  args: { color: '#2A2A27' },
  name: 'Solid color (non-gradient)',
};
