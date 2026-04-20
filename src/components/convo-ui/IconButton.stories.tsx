import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { IconButton } from './IconButton';
import { Icons } from './Icons';

const meta = {
  title: 'Controls/IconButton',
  component: IconButton,
  parameters: { layout: 'centered' },
  args: { icon: Icons.mic, label: 'Microphone', size: 48, variant: 'default' },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['default', 'ghost', 'danger', 'voice', 'dark'],
    },
    active: { control: 'boolean' },
    size: { control: { type: 'range', min: 32, max: 72, step: 4 } },
    icon: { table: { disable: true } },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Ghost: Story = { args: { variant: 'ghost', icon: Icons.more, label: 'More' } };
export const Danger: Story = { args: { variant: 'danger', icon: Icons.hangup, label: 'End' } };
export const VoiceVariant: Story = {
  args: { variant: 'voice', icon: Icons.phone, label: 'Call' },
  name: 'Voice (dark fill)',
};
export const DarkVariant: Story = {
  args: { variant: 'dark', icon: Icons.settings, label: 'Settings' },
  parameters: { backgrounds: { default: 'fixed-dark' } },
};
export const Active: Story = {
  args: { active: true, icon: Icons.micOff, label: 'Muted' },
  name: 'Active (pressed)',
};

// --- Interaction tests -------------------------------------------------------

export const FiresOnClick: Story = {
  name: 'Interaction — fires onClick',
  args: {
    icon: Icons.phone,
    label: 'Call',
    variant: 'voice',
    // Storybook's `fn()` auto-renders in the Actions panel AND is assertable.
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Call' });
    await userEvent.click(btn);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Grid: Story = {
  name: 'All variants',
  render: () => (
    <div className="grid grid-cols-4 gap-2.5">
      <IconButton icon={Icons.mic} label="Mic" />
      <IconButton icon={Icons.micOff} label="Muted" active />
      <IconButton icon={Icons.speaker} label="Speaker" />
      <IconButton icon={Icons.video} label="Video" />
      <IconButton icon={Icons.phone} label="Call" variant="voice" />
      <IconButton icon={Icons.hangup} label="End" variant="danger" />
      <IconButton icon={Icons.settings} label="Settings" />
      <IconButton icon={Icons.more} label="More" variant="ghost" />
    </div>
  ),
};
