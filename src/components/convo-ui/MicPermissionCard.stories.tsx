import type { Meta, StoryObj } from '@storybook/react-vite';
import { MicPermissionCard } from './MicPermissionCard';

const COMPONENT_DOC = `
Four-state microphone permission card. The pre-call surface that walks
the user through granting mic access before the conversation can start.

### States

- \`prompt\` (default) — explainer copy plus dual CTA (\`Not now\` /
  \`Allow mic\`). The only state where the buttons fire \`onDeny\` /
  \`onGrant\` callbacks.
- \`requesting\` — user has clicked Allow; waiting for the browser's native
  permission popup. Adds an \`animate-pulse-ring\` halo around the icon.
- \`granted\` — success terminal. No buttons; the caller transitions away
  from this screen once reached.
- \`denied\` — red-tinted icon (slashed mic), plus a \`How to enable\` link
  out to browser settings. No \`onGrant\` button — the user has to
  resolve the block in their browser first.

\`\`\`tsx
<MicPermissionCard
  state={permState}
  onGrant={() => requestMicPermission()}
  onDeny={() => skipForNow()}
/>
\`\`\`

### Icon treatment

The icon is an inline SVG keyed to a \`voice-a → voice-b\` linear gradient
on the three non-denied states so the mic reads consistently with the
rest of the voice brand. The \`denied\` state swaps to a solid
destructive-red slashed-mic path.

### Layout

Fixed width \`22.5rem\`, centered column, 24px internal padding. Designed
to sit on its own against a soft background — no width override prop by
design; if you need a different width, wrap it.

### State-dependent footer

Only \`prompt\` and \`denied\` render a footer control. \`requesting\` and
\`granted\` are pure status cards — callers are expected to auto-advance
away from those.
`;

const meta = {
  title: 'Permission/MicPermissionCard',
  component: MicPermissionCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { state: 'prompt' },
  argTypes: {
    state: {
      control: 'radio',
      options: ['prompt', 'requesting', 'granted', 'denied'],
      description:
        'Permission flow phase. Drives copy, icon treatment, halo animation, and footer CTA.',
    },
  },
} satisfies Meta<typeof MicPermissionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Prompt: Story = {
  args: { state: 'prompt' },
  parameters: {
    docs: {
      description: {
        story:
          'Initial ask. Explainer copy plus dual CTA — `Not now` (secondary) fires `onDeny`, `Allow mic` (primary) fires `onGrant`. The primary CTA is where the browser permission dialog gets triggered.',
      },
    },
  },
};
export const Requesting: Story = {
  args: { state: 'requesting' },
  parameters: {
    docs: {
      description: {
        story:
          'Shown between the user clicking Allow and the browser popup resolving. Adds an `animate-pulse-ring` halo around the icon to signal "waiting on browser".',
      },
    },
  },
};
export const Granted: Story = {
  args: { state: 'granted' },
  parameters: {
    docs: {
      description: {
        story:
          'Success terminal — mic ready, agent ready. No CTA; the caller typically transitions past this state after a brief moment.',
      },
    },
  },
};
export const Denied: Story = {
  args: { state: 'denied' },
  parameters: {
    docs: {
      description: {
        story:
          'User blocked the permission (or browser policy denied it). Icon swaps to a red slashed mic; the footer shows a `How to enable` button linking out to browser settings. No `Allow` retry because the browser will not re-prompt once blocked.',
      },
    },
  },
};
