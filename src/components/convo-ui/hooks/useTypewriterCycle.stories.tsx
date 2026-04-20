import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTypewriterCycle } from './useTypewriterCycle';

interface DemoArgs {
  phrases: string[];
  typeSpeedMs: number;
  backspaceSpeedMs: number;
  holdMs: number;
  lastHoldMs?: number;
  enabled: boolean;
}

const meta = {
  title: 'Hooks/useTypewriterCycle',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Types a phrase, holds, backspaces, types the next, loops. Designed for hero accents where a single phrase needs to demonstrate a range (e.g. cycling agent names to signal "one of many"). Respects `prefers-reduced-motion` by freezing on the first phrase — reduced-motion users see a stable, readable headline that matches frame zero of the animated version.',
      },
    },
  },
  args: {
    phrases: ['Ada', 'Aria', 'Echo', 'your agent'],
    typeSpeedMs: 70,
    backspaceSpeedMs: 40,
    holdMs: 2500,
    lastHoldMs: 3800,
    enabled: true,
  },
  argTypes: {
    typeSpeedMs: { control: { type: 'range', min: 20, max: 200, step: 10 } },
    backspaceSpeedMs: { control: { type: 'range', min: 10, max: 150, step: 5 } },
    holdMs: { control: { type: 'range', min: 500, max: 5000, step: 250 } },
    lastHoldMs: { control: { type: 'range', min: 500, max: 8000, step: 250 } },
    enabled: { control: 'boolean' },
    phrases: { table: { disable: true } },
  },
  render: (args) => <Demo {...args} />,
} satisfies Meta<DemoArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({
  phrases,
  typeSpeedMs,
  backspaceSpeedMs,
  holdMs,
  lastHoldMs,
  enabled,
}: DemoArgs) {
  const out = useTypewriterCycle(phrases, {
    typeSpeedMs,
    backspaceSpeedMs,
    holdMs,
    lastHoldMs,
    enabled,
  });
  return (
    <div className="font-display text-5xl italic text-foreground">
      Say hi to{' '}
      <span className="inline-block text-left">
        {out}
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-[0.8em] w-[3px] translate-y-[0.05em] bg-voice-b align-middle animate-caret-blink"
        />
      </span>
    </div>
  );
}

export const Default: Story = {};

export const FastCycle: Story = {
  name: 'Fast cycle',
  args: { typeSpeedMs: 40, backspaceSpeedMs: 20, holdMs: 1200, lastHoldMs: 1800 },
};

export const Frozen: Story = {
  name: 'Frozen (enabled=false)',
  args: { enabled: false },
};
