import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorToast } from './ErrorToast';

const COMPONENT_DOC = `
Fixed-position floating error banner. Red pill anchored top-center (or
bottom) with \`role="alert"\` so assistive tech announces the message
immediately on mount.

### Usage

Non-dismissible on its own — the caller controls visibility via
conditional rendering. Mount it when the error appears, unmount when
cleared; there is no close button baked in.

\`\`\`tsx
{connectError && (
  <ErrorToast>Failed to connect with AI agent.</ErrorToast>
)}
\`\`\`

### Props

- \`position\` — \`"top"\` (default) or \`"bottom"\`. Vertical anchor via
  Tailwind \`top-16\` / \`bottom-16\`.
- \`z\` — z-index override when layered inside modal stacks. Default \`10\`.

Styling is baked in and intentionally not overridable via \`className\` —
this is a specific UX surface (connection errors, voice errors), not a
general-purpose toast.

### Accessibility

\`role="alert"\` on the root means screen readers announce the text as
soon as the node mounts. Keep messages concise; long messages wrap but
still get announced in full.

### Width + wrapping

Max width \`min(90vw, 28rem)\` with centered text. Long messages wrap
across multiple lines without breaking the centered anchor.
`;

const meta = {
  title: 'Status/ErrorToast',
  component: ErrorToast,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: {
    children: 'Failed to connect with AI agent. The conversation may not work as expected.',
    position: 'top',
  },
  argTypes: {
    position: {
      control: 'radio',
      options: ['top', 'bottom'],
      description: 'Vertical anchor. `top` (default) or `bottom`.',
    },
    z: {
      control: { type: 'number' },
      description: 'z-index override when layered in deeper stacks. Default 10.',
    },
  },
  decorators: [
    (Story) => (
      // The toast is position: fixed; give it a stage so it has a surface to float over.
      <div className="relative h-[20rem] w-full bg-background">
        <div className="absolute inset-0 flex items-center justify-center font-display text-sm italic text-muted-foreground">
          (underlying page content)
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ErrorToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default top-anchored connection-failure message. The most common appearance — short copy, centered, floats over the conversation.',
      },
    },
  },
};

export const Bottom: Story = {
  args: { position: 'bottom' },
  name: 'Bottom-anchored',
  parameters: {
    docs: {
      description: {
        story:
          '`position="bottom"` anchors the toast above the dock. Use on screens where a top toast would collide with the brand header.',
      },
    },
  },
};

export const LongMessage: Story = {
  args: {
    children:
      "Couldn't reach the agent. We'll retry automatically — please stay on the line and your conversation will resume as soon as the connection is re-established.",
  },
  name: 'Long message (wraps)',
  parameters: {
    docs: {
      description: {
        story:
          'Longer copy wraps across multiple lines inside the `max-w-[min(90vw,28rem)]` pill. Screen readers still announce the full text on mount thanks to `role="alert"`.',
      },
    },
  },
};
