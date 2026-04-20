import type { Meta, StoryObj } from '@storybook/react-vite';
import { MicPermissionCard } from './MicPermissionCard';

const meta = {
  title: 'Permission/MicPermissionCard',
  component: MicPermissionCard,
  parameters: { layout: 'centered' },
  args: { state: 'prompt' },
  argTypes: {
    state: {
      control: 'radio',
      options: ['prompt', 'requesting', 'granted', 'denied'],
    },
  },
} satisfies Meta<typeof MicPermissionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Prompt: Story = { args: { state: 'prompt' } };
export const Requesting: Story = { args: { state: 'requesting' } };
export const Granted: Story = { args: { state: 'granted' } };
export const Denied: Story = { args: { state: 'denied' } };
