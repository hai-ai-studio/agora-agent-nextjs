import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentConfigCard } from './AgentConfigCard';

const meta = {
  title: 'Identity/AgentConfigCard',
  component: AgentConfigCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgentConfigCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
