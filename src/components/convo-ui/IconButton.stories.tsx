import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { IconButton } from './IconButton';
import { Icons } from './Icons';

const COMPONENT_DOC = `
Round button primitive for dock controls and one-off actions. Five visual
variants plus an orthogonal \`active\` state, unified 200ms
\`hover:-translate-y-px\` lift, and built-in a11y labelling via
\`aria-label\` / \`aria-pressed\`.

### Variants

- \`default\` — light surface, border, subtle shadow. The baseline for
  non-emphasized dock buttons.
- \`ghost\` — transparent, no border, no shadow. Use for tertiary actions
  like "more" menus that should recede.
- \`danger\` — solid red fill for destructive one-shots (hangup, end call).
- \`voice\` — warm dark-fill for the primary call CTA. Also what \`active\`
  flips to under the hood.
- \`dark\` — dark paper chip with a contrasting border. Intended for
  dark-mode-first surfaces where \`default\` would disappear.

### \`active\` overrides the variant

\`active={true}\` always paints the \`voice\` treatment (dark fill, white
icon, no border) regardless of the underlying \`variant\`. This keeps the
pressed state consistent across the dock — a muted mic looks like a muted
mic no matter what its resting variant was.

\`\`\`tsx
<IconButton icon={Icons.mic} label="Mute" active={muted} />
\`\`\`

### Accessibility

- \`label\` drives both \`aria-label\` and \`title\` — always required for
  icon-only buttons.
- \`aria-pressed\` is set whenever \`active\` is defined (toggle semantics).
- Hit target: \`size\` sets the square bounding box in px (default 48).
  Stay at 44px+ for touch targets.
`;

const meta = {
  title: 'Controls/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { icon: Icons.mic, label: 'Microphone', size: 48, variant: 'default' },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['default', 'ghost', 'danger', 'voice', 'dark'],
      description:
        'Visual baseline. `default` / `ghost` / `danger` / `voice` / `dark`. Overridden by `active`.',
    },
    active: {
      control: 'boolean',
      description:
        'Pressed/toggled state. Flips to dark fill regardless of `variant`. Sets `aria-pressed`.',
    },
    size: {
      control: { type: 'range', min: 32, max: 72, step: 4 },
      description: 'Square hit target in px. Default 48. Keep >= 44 for touch.',
    },
    label: {
      control: 'text',
      description:
        'Accessible label for the icon-only button. Drives `aria-label` + `title`.',
    },
    icon: { table: { disable: true } },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Baseline `default` variant with the mic icon. The standard treatment for non-emphasized dock buttons.',
      },
    },
  },
};
export const Ghost: Story = {
  args: { variant: 'ghost', icon: Icons.more, label: 'More' },
  parameters: {
    docs: {
      description: {
        story:
          '`variant="ghost"` — transparent, borderless. Good for tertiary overflow actions that should visually recede next to the primary dock buttons.',
      },
    },
  },
};
export const Danger: Story = {
  args: { variant: 'danger', icon: Icons.hangup, label: 'End' },
  parameters: {
    docs: {
      description: {
        story:
          '`variant="danger"` — solid red fill for destructive one-shots. Used for the call hangup at the end of the dock.',
      },
    },
  },
};
export const VoiceVariant: Story = {
  args: { variant: 'voice', icon: Icons.phone, label: 'Call' },
  name: 'Voice (dark fill)',
  parameters: {
    docs: {
      description: {
        story:
          '`variant="voice"` — warm dark fill with white icon. Reserved for the primary call CTA. Visually identical to what `active={true}` produces on any other variant.',
      },
    },
  },
};
export const DarkVariant: Story = {
  args: { variant: 'dark', icon: Icons.settings, label: 'Settings' },
  parameters: {
    backgrounds: { default: 'fixed-dark' },
    docs: {
      description: {
        story:
          '`variant="dark"` — dark paper chip with border. Use on dark-mode surfaces where the `default` variant would disappear into the background.',
      },
    },
  },
};
export const Active: Story = {
  args: { active: true, icon: Icons.micOff, label: 'Muted' },
  name: 'Active (pressed)',
  parameters: {
    docs: {
      description: {
        story:
          '`active={true}` flips any variant to the dark voice treatment and sets `aria-pressed="true"`. This is how the dock shows a muted mic or an engaged toggle.',
      },
    },
  },
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
  parameters: {
    docs: {
      description: {
        story:
          'Interaction test: clicking the button fires the `onClick` handler exactly once. Uses Storybook `fn()` so the call is also visible in the Actions panel.',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story:
          'Side-by-side of every variant plus an `active` pressed state. Useful for eyeballing weight/contrast balance across a full dock.',
      },
    },
  },
};
