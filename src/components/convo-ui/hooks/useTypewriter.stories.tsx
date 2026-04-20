import type { Meta, StoryObj } from '@storybook/react-vite';
import { useTypewriter } from './useTypewriter';

const COMPONENT_DOC = `
Progressively reveals a string one character at a time with a jittered
per-tick delay so the typing feels organic rather than metronomic.

### Returns

A \`string\` — the currently-revealed prefix of \`fullText\`. Re-render
is driven by the internal \`useState\`.

\`\`\`tsx
const out = useTypewriter(fullText, speed, trigger);
return <div>{out}</div>;
\`\`\`

### Signature

\`\`\`ts
useTypewriter(
  fullText: string,
  speed = 30,       // base delay (ms) per character
  trigger = true,   // flip false to short-circuit to fullText
): string
\`\`\`

Each tick waits \`speed + Math.random() * 40\` ms. There is a fixed
200 ms lead-in before the first character so it lines up with a
fade-in on the parent container.

### When to use

- Agent transcript bubbles where the text should feel "typed out"
  alongside TTS playback.
- \`LiveSubtitle\` / caption bars where the reveal matches speech
  cadence.

### When to skip

- **Reduced motion** — pass \`trigger={false}\` to instantly render
  \`fullText\` for users who opted out of animation.
- **Cycling between multiple phrases** — reach for
  \`useTypewriterCycle\` instead; it handles typing + backspacing +
  looping.

### Notes

- Changing \`fullText\` restarts the animation from an empty string.
- Kept as a hook (not a component) so the renderer stays free — any
  element, any style, any caret treatment.
`;

const meta = {
  title: 'Hooks/useTypewriter',
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: {
    text: 'I can help with that. Your next invoice is on the 18th for $42. Want me to switch you to the annual plan?',
    speed: 32,
    trigger: true,
  },
  argTypes: {
    speed: {
      control: { type: 'range', min: 10, max: 120, step: 2 },
      description:
        'Base per-character delay in ms. Add up to 40ms of jitter per tick. Default 30.',
    },
    trigger: {
      control: 'boolean',
      description:
        'When false, skips the animation and returns `fullText` directly. Wire to a reduced-motion flag.',
    },
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default 32ms tick rate — roughly matches a natural TTS read speed. Use as the baseline feel for agent transcript reveals.',
      },
    },
  },
};

export const Slow: Story = {
  args: { speed: 80 },
  parameters: {
    docs: {
      description: {
        story:
          '80ms tick — deliberate, contemplative pace. Good for headline reveals or when you want the reader to linger on each phrase.',
      },
    },
  },
};

export const Instant: Story = {
  args: { trigger: false },
  name: 'Instant (trigger=false)',
  parameters: {
    docs: {
      description: {
        story:
          '`trigger={false}` short-circuits to the full text — no reveal. Wire this to `prefers-reduced-motion` or a user preference so animation-averse users get a stable render.',
      },
    },
  },
};
