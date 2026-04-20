import type { Meta, StoryObj } from '@storybook/react-vite';
import { VoicePicker } from './VoicePicker';

const meta = {
  title: 'Pickers/VoicePicker',
  component: VoicePicker,
  parameters: { layout: 'centered' },
  args: { compact: false },
  argTypes: {
    compact: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VoicePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Compact: Story = {
  args: { compact: true },
  name: 'Compact (single column)',
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
