import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { CallControls } from './CallControls';

const COMPONENT_DOC = `
Floating glass-morph dock composing five round \`IconButton\` children plus a
hairline divider before the hangup. The signature in-call control bar.

### Usage

Drop into \`position: fixed bottom-0\` in production; in the /design catalog
it sits inside a Cell stage. The \`backdrop-blur-xl\` + \`bg-surface/80\`
pair is shared with the mobile transcript sheet so the glass look stays
coherent.

\`\`\`tsx
const [muted, setMuted] = useState(false);
const [paused, setPaused] = useState(false);

<CallControls
  muted={muted}
  setMuted={setMuted}
  paused={paused}
  setPaused={setPaused}
  onEnd={() => endCall()}
/>
\`\`\`

### Controlled API

CallControls is a fully controlled compound — \`muted\` and \`paused\` live in
the caller's state. The stories here wrap it in a \`Harness\` so Storybook's
boolean toggles drive the real underlying state and the rendered dock
reflects it.

### Layout

Five fixed buttons (mute / pause / speaker / more / hangup) at \`size={44}\`,
gap 10px, inside a pill with 10px padding. The hairline \`h-6 w-px bg-muted\`
before hangup is decorative (\`aria-hidden\`) and signals the destructive
separation.
`;

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
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  argTypes: {
    initialMuted: {
      control: 'boolean',
      description:
        'Seed value for the Harness `muted` state. Maps to `CallControls` `muted` prop.',
    },
    initialPaused: {
      control: 'boolean',
      description:
        'Seed value for the Harness `paused` state. Maps to `CallControls` `paused` prop.',
    },
  },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { initialMuted: false, initialPaused: false },
  parameters: {
    docs: {
      description: {
        story:
          'Resting state — call is live, mic is open, audio is playing. The most common appearance of the dock during an active conversation.',
      },
    },
  },
};
export const Muted: Story = {
  args: { initialMuted: true, initialPaused: false },
  parameters: {
    docs: {
      description: {
        story:
          'User has muted their mic. The mic button flips to the dark voice treatment with `aria-pressed="true"` and the icon swaps to the slashed mic.',
      },
    },
  },
};
export const Paused: Story = {
  args: { initialMuted: false, initialPaused: true },
  parameters: {
    docs: {
      description: {
        story:
          'Playback paused. The pause button relabels to "Resume" and its icon swaps from pause glyph to play glyph.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Interaction test: clicks the mute button twice and verifies `aria-pressed` flips `false` → `true` → `false`. Guards the toggle contract used by screen readers.',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          'Interaction test: clicks pause and verifies the accessible name changes from "Pause" to "Resume". Pause does not use `aria-pressed` since the label itself conveys state.',
      },
    },
  },
};
