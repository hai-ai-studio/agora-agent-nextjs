import type { Meta, StoryObj } from '@storybook/react-vite';
import { TranscriptBubble } from './TranscriptBubble';

const meta = {
  title: 'Transcript/TranscriptBubble',
  component: TranscriptBubble,
  parameters: { layout: 'padded' },
  args: {
    role: 'agent',
    text: 'I can help with that. Your next invoice is on the 18th for $42.',
    timestamp: '3:14 PM',
  },
  argTypes: {
    role: { control: 'radio', options: ['user', 'agent'] },
    streaming: { control: 'boolean' },
    interim: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TranscriptBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AgentMessage: Story = { args: { role: 'agent' } };
export const UserMessage: Story = {
  args: { role: 'user', text: 'What does my next bill look like?' },
};
export const Streaming: Story = {
  args: { role: 'agent', streaming: true, text: 'Let me pull that up for you…' },
  name: 'Streaming (caret)',
};
export const Interim: Story = {
  args: {
    role: 'user',
    interim: true,
    text: 'Uhh… switch me to annual, I guess?',
  },
  name: 'Interim (ASR hypothesis)',
};

export const Conversation: Story = {
  name: 'Multi-turn conversation',
  render: () => (
    <div className="flex flex-col gap-3">
      <TranscriptBubble role="user" text="What's my next invoice?" timestamp="3:14 PM" />
      <TranscriptBubble
        role="agent"
        text="Your next invoice is on the 18th for $42. Want me to switch you to annual?"
        timestamp="3:14 PM"
      />
      <TranscriptBubble role="user" text="Yes, switch me to annual." timestamp="3:15 PM" interim />
      <TranscriptBubble role="agent" text="On it…" timestamp="3:15 PM" streaming />
    </div>
  ),
};
