import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BigCallButton } from './BigCallButton';

const meta = {
  title: 'Controls/BigCallButton',
  component: BigCallButton,
  parameters: { layout: 'centered' },
  args: { state: 'idle' },
  argTypes: {
    state: { control: 'radio', options: ['idle', 'ringing', 'active'] },
  },
} satisfies Meta<typeof BigCallButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { state: 'idle' } };
export const Ringing: Story = { args: { state: 'ringing' } };
export const Active: Story = {
  args: { state: 'active' },
  name: 'Active (in-call)',
};

export const ClickStartsCall: Story = {
  name: 'Interaction — click from idle fires onClick',
  args: { state: 'idle', onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: /start call/i });
    await userEvent.click(btn);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Sequence: Story = {
  name: 'All states',
  render: () => (
    <div className="flex items-center gap-5">
      <BigCallButton state="idle" />
      <BigCallButton state="ringing" />
      <BigCallButton state="active" />
    </div>
  ),
};
