import type { Meta, StoryObj } from '@storybook/react-vite';
import { VoiceGallery } from './VoiceGallery';

const meta = {
  title: 'Pickers/VoiceGallery',
  component: VoiceGallery,
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
} satisfies Meta<typeof VoiceGallery>;

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
