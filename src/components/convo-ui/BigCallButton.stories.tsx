import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BigCallButton } from './BigCallButton';

const COMPONENT_DOC = `
72px round primary call affordance. The big button on the landing screen
and the end-call button mid-conversation. Three states share the same
bounding box but paint very differently so the user can read call status
at a glance.

### States

- \`idle\` (default) — dark \`bg-foreground\` fill, phone icon.
  "Tap to start a call."
- \`ringing\` — same dark fill, phone icon, plus an outward \`animate-pulse-ring\`
  border. Signals the call is dialling / awaiting answer.
- \`active\` — red \`bg-danger\` fill, hangup icon, static halo ring.
  Signals mid-call; clicking ends the call.

\`\`\`tsx
<BigCallButton state={callState} onClick={toggleCall} />
\`\`\`

### Accessibility

\`aria-label\` auto-switches with state: "Start call" / "Ringing" / "End call".
Screen-reader users get accurate semantics without the caller threading a
label prop through.

### Transitions

All state changes use a 250ms \`ease-voice-out\` transition on background
+ shadow, so transitions between idle/ringing/active feel intentional
rather than snappy.
`;

const meta = {
  title: 'Controls/BigCallButton',
  component: BigCallButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { state: 'idle' },
  argTypes: {
    state: {
      control: 'radio',
      options: ['idle', 'ringing', 'active'],
      description:
        'Call phase. `idle` / `ringing` / `active`. Drives fill, icon, halo, and `aria-label`.',
    },
  },
} satisfies Meta<typeof BigCallButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { state: 'idle' },
  parameters: {
    docs: {
      description: {
        story:
          'Resting "start call" appearance. Dark fill with phone icon. This is the landing-page hero CTA.',
      },
    },
  },
};
export const Ringing: Story = {
  args: { state: 'ringing' },
  parameters: {
    docs: {
      description: {
        story:
          '`state="ringing"` adds an outward `animate-pulse-ring` halo to the idle appearance. Use while the session is dialling but not yet connected.',
      },
    },
  },
};
export const Active: Story = {
  args: { state: 'active' },
  name: 'Active (in-call)',
  parameters: {
    docs: {
      description: {
        story:
          '`state="active"` — red fill with hangup icon and static red halo. Clicking ends the call. The `aria-label` becomes "End call" for screen readers.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Interaction test: verifies idle-state click fires `onClick` exactly once and the button is locatable by its "Start call" accessible name.',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          'Idle → ringing → active side-by-side. Useful for eyeballing the fill + icon transition path when tuning animations.',
      },
    },
  },
};
