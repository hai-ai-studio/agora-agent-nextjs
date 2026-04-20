import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { CallControls } from './CallControls';

// CallControls is a controlled compound — mute / pause live in parent state. Wrap in a
// tiny host so the interactive states can be driven from Storybook controls AND reflected
// in the rendered dock. Storybook's meta targets this Harness (not CallControls directly)
// so `initialMuted` / `initialPaused` become boolean toggles in the controls panel.
function Harness({
  initialMuted,
  initialPaused,
}: {
  initialMuted: boolean;
  initialPaused: boolean;
}) {
  const [muted, setMuted] = useState(initialMuted);
  const [paused, setPaused] = useState(initialPaused);
  return (
    <CallControls
      muted={muted}
      setMuted={setMuted}
      paused={paused}
      setPaused={setPaused}
    />
  );
}

const meta = {
  title: 'Controls/CallControls',
  component: Harness,
  parameters: { layout: 'centered' },
  argTypes: {
    initialMuted: { control: 'boolean' },
    initialPaused: { control: 'boolean' },
  },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { initialMuted: false, initialPaused: false },
};
export const Muted: Story = {
  args: { initialMuted: true, initialPaused: false },
};
export const Paused: Story = {
  args: { initialMuted: false, initialPaused: true },
};

// --- Interaction tests -------------------------------------------------------

export const TogglesMute: Story = {
  name: 'Interaction — toggles mute',
  args: { initialMuted: false, initialPaused: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const muteBtn = canvas.getByRole('button', { name: /^Mute$/i });

    // Starts unmuted — aria-pressed reflects state.
    await expect(muteBtn).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(muteBtn);
    await expect(muteBtn).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(muteBtn);
    await expect(muteBtn).toHaveAttribute('aria-pressed', 'false');
  },
};

export const TogglesPause: Story = {
  name: 'Interaction — toggles pause',
  args: { initialMuted: false, initialPaused: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially "Pause"; after click, relabels to "Resume".
    const pauseBtn = canvas.getByRole('button', { name: /^Pause$/i });
    await userEvent.click(pauseBtn);
    await expect(
      canvas.getByRole('button', { name: /^Resume$/i }),
    ).toBeInTheDocument();
  },
};
