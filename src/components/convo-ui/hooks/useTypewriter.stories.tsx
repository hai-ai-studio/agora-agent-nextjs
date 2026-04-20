import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTypewriter } from './useTypewriter';

const meta = {
  title: 'Hooks/useTypewriter',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Progressive character reveal with jittered delay. Pass `trigger=false` to short-circuit to the full text (e.g. reduced motion). Kept as a hook rather than a component so it can live alongside any renderer — `TranscriptBubble`, `LiveSubtitle`, or bespoke.',
      },
    },
  },
  args: {
    text: 'I can help with that. Your next invoice is on the 18th for $42. Want me to switch you to the annual plan?',
    speed: 32,
    trigger: true,
  },
  argTypes: {
    speed: { control: { type: 'range', min: 10, max: 120, step: 2 } },
    trigger: { control: 'boolean' },
    text: { table: { disable: true } },
  },
  render: (args) => <Demo {...args} />,
} satisfies Meta<{ text: string; speed: number; trigger: boolean }>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ text, speed, trigger }: { text: string; speed: number; trigger: boolean }) {
  const out = useTypewriter(text, speed, trigger);
  return (
    <div className="max-w-[32rem] font-display text-lg italic leading-snug text-foreground [text-wrap:balance]">
      {out}
      <span
        aria-hidden="true"
        className="ml-[3px] inline-block h-5 w-0.5 bg-voice-b align-text-bottom animate-caret-blink"
      />
    </div>
  );
}

export const Default: Story = {};
export const Slow: Story = { args: { speed: 80 } };
export const Instant: Story = {
  args: { trigger: false },
  name: 'Instant (trigger=false)',
};
