import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { Ambient, type AmbientState } from './Ambient';

/**
 * Ambient is absolute-positioned and fills its nearest `position: relative` ancestor.
 * Each story wraps it in a tall stage so the drifting blobs have room to read as motion.
 */
const meta = {
  title: 'Signature/Ambient',
  component: Ambient,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Drifting radial-gradient blobs + SVG grain overlay. Intended as a decorative background layer behind conversation surfaces. The `state` prop tints one blob per active state (listening→green, thinking→amber, speaking→blue, error→red); other states render the base warm palette. Motion respects `prefers-reduced-motion`.',
      },
    },
  },
  args: { state: 'idle' },
  argTypes: {
    state: {
      control: 'select',
      options: ['connecting', 'preparing', 'idle', 'listening', 'thinking', 'speaking', 'muted', 'error'],
    },
    dark: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="relative h-[28rem] w-full overflow-hidden bg-background">
        <Story />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-border bg-surface/70 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
            ambient layer
          </div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Ambient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { state: 'idle' } };
export const Listening: Story = { args: { state: 'listening' } };
export const Thinking: Story = { args: { state: 'thinking' } };
export const Speaking: Story = { args: { state: 'speaking' } };
export const Muted: Story = { args: { state: 'muted' } };
export const ErrorState: Story = { args: { state: 'error' }, name: 'Error' };

function AutoCycleRender() {
  // Only the 4 tinted states have visible palette differences; loop them so reviewers
  // can see the blob recolor transitions. Other states fall through to the base palette
  // and look identical, so they're skipped to keep the cycle purposeful.
  const cycle: AmbientState[] = ['listening', 'thinking', 'speaking', 'error'];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % cycle.length), 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="relative h-[28rem] w-full overflow-hidden bg-background">
      <Ambient state={cycle[i]} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-full border border-border bg-surface/70 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
          {cycle[i]}
        </div>
      </div>
    </div>
  );
}

export const AutoCycle: Story = {
  name: 'Auto-cycle (tinted states)',
  decorators: [(Story) => <Story />],
  render: () => <AutoCycleRender />,
};

export const OnDark: Story = {
  args: { state: 'speaking', dark: true },
  name: 'On dark surface',
  decorators: [
    (Story) => (
      <div className="relative h-[28rem] w-full overflow-hidden bg-warm-7">
        <Story />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-warm-4/30 bg-warm-0/5 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-warm-0/70 backdrop-blur">
            ambient layer · dark
          </div>
        </div>
      </div>
    ),
  ],
  parameters: { backgrounds: { default: 'fixed-dark' } },
};
