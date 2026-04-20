import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorToast } from './ErrorToast';

const meta = {
  title: 'Status/ErrorToast',
  component: ErrorToast,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Fixed-position floating error banner. Red pill anchored top-center (or bottom) with `role="alert"`. Non-dismissible — the caller mounts/unmounts conditionally. Position + z-index configurable; styling is baked in and does not accept className.',
      },
    },
  },
  args: {
    children: 'Failed to connect with AI agent. The conversation may not work as expected.',
    position: 'top',
  },
  argTypes: {
    position: { control: 'radio', options: ['top', 'bottom'] },
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

export const Default: Story = {};

export const Bottom: Story = {
  args: { position: 'bottom' },
  name: 'Bottom-anchored',
};

export const LongMessage: Story = {
  args: {
    children:
      "Couldn't reach the agent. We'll retry automatically — please stay on the line and your conversation will resume as soon as the connection is re-established.",
  },
  name: 'Long message (wraps)',
};
