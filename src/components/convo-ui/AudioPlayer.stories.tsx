import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudioPlayer } from './AudioPlayer';

const meta = {
  title: 'Playback/AudioPlayer',
  component: AudioPlayer,
  parameters: { layout: 'padded' },
  args: { title: 'Call with Ada', date: 'Today 3:14 PM', duration: 184 },
  argTypes: {
    duration: { control: { type: 'range', min: 30, max: 600, step: 15 } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AudioPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Yesterday: Story = {
  args: { title: "Yesterday's call", date: 'Apr 19 · 11:22 AM' },
};

export const OnDark: Story = {
  args: { title: "Yesterday's call", date: 'Apr 19 · 11:22 AM' },
  parameters: { backgrounds: { default: 'fixed-dark' } },
  name: 'On dark surface',
};
