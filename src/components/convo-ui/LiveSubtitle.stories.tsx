import type { Meta, StoryObj } from '@storybook/react-vite';
import { LiveSubtitle } from './LiveSubtitle';

const meta = {
  title: 'Transcript/LiveSubtitle',
  component: LiveSubtitle,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'fixed-dark' },
  },
  args: {
    text: "Sure — I'll switch you to the annual plan and apply the 20% discount. Confirming now…",
    speaker: 'agent',
  },
  argTypes: {
    speaker: { control: 'radio', options: ['user', 'agent'] },
  },
} satisfies Meta<typeof LiveSubtitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AgentSpeaking: Story = {};
export const UserSpeaking: Story = {
  args: { speaker: 'user', text: "Change the billing address to 221B Baker Street." },
};
