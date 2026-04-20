import type { Meta, StoryObj } from '@storybook/react-vite';
import { VoiceCard } from './VoiceCard';

const meta = {
  title: 'Pickers/VoiceCard',
  component: VoiceCard,
  parameters: { layout: 'centered' },
  args: {
    name: 'Aria',
    descriptor: 'Warm · Conversational',
    tags: ['female', 'en-US'],
    accent: 'linear-gradient(135deg, #7C5CFF, #E85C8A)',
    selected: false,
    previewActive: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const PreviewPlaying: Story = {
  args: { previewActive: true },
  name: 'Preview playing',
};
