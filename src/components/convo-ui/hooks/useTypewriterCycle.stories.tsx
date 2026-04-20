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

const COMPONENT_DOC = `
Types a phrase, holds, backspaces, types the next — forever. Purpose-built
for hero accents where a single phrase has to demonstrate a range
(cycling agent names to signal "one of many", cycling verbs to imply
breadth, etc).

### Returns

A \`string\` — the current frame of the animation. Mount renders the
first phrase fully typed; the loop immediately enters the hold →
backspace → type-next cycle.

\`\`\`tsx
const label = useTypewriterCycle(
  ['Ada', 'Aria', 'Echo', 'your agent'],
  { holdMs: 2500, lastHoldMs: 3800 },
);
return <h1>Say hi to {label}</h1>;
\`\`\`

### Options

\`\`\`ts
interface UseTypewriterCycleOptions {
  typeSpeedMs?: number;       // default 60
  backspaceSpeedMs?: number;  // default 35 — deletes faster than types
  holdMs?: number;            // default 2500 — hold after each phrase
  lastHoldMs?: number;        // default = holdMs — linger on final phrase
  enabled?: boolean;          // default true — flip false to freeze
}
\`\`\`

\`lastHoldMs\` is the key dial for reveal-style copy: set it longer
than \`holdMs\` so the payoff phrase (e.g. "your agent") sits on screen
long enough to read before the loop restarts.

### Reduced motion

Respects \`prefers-reduced-motion\` via Motion's \`useReducedMotion\`. When
set, the hook freezes on the first phrase — no animation, stable
headline. The static frame is visually identical to frame zero of the
animated version, so nothing jumps.

### Phrase array identity

The phrases array is serialized internally with a \`\\u0001\` delimiter,
so passing an inline literal is safe — reference churn won't restart
the animation as long as the values are equal. For very large arrays,
prefer a module-level constant to avoid the per-render join.

### When to use this vs. \`useTypewriter\`

- **\`useTypewriter\`** — single string, one-shot reveal (transcript
  bubble, subtitle).
- **\`useTypewriterCycle\`** — multiple strings, infinite loop with
  backspacing (hero headline accent).
`;

const meta = {
  title: 'Hooks/useTypewriterCycle',
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
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
    typeSpeedMs: {
      control: { type: 'range', min: 20, max: 200, step: 10 },
      description: 'Per-character typing delay in ms. Default 60.',
    },
    backspaceSpeedMs: {
      control: { type: 'range', min: 10, max: 150, step: 5 },
      description:
        'Per-character backspace delay in ms. Usually smaller than `typeSpeedMs` so deletes feel snappier. Default 35.',
    },
    holdMs: {
      control: { type: 'range', min: 500, max: 5000, step: 250 },
      description: 'Hold duration after typing completes, before backspacing. Default 2500.',
    },
    lastHoldMs: {
      control: { type: 'range', min: 500, max: 8000, step: 250 },
      description:
        'Hold duration for the final phrase before looping. Use a longer value to linger on a reveal line. Defaults to `holdMs`.',
    },
    enabled: {
      control: 'boolean',
      description:
        'When false, freezes on the first phrase without animating. Same behavior as `prefers-reduced-motion`.',
    },
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default cadence — 70ms type, 40ms backspace, 2500ms hold, 3800ms last-hold. Matches the landing page hero and leaves comfortable read time on the "your agent" reveal frame.',
      },
    },
  },
};

export const FastCycle: Story = {
  name: 'Fast cycle',
  args: { typeSpeedMs: 40, backspaceSpeedMs: 20, holdMs: 1200, lastHoldMs: 1800 },
  parameters: {
    docs: {
      description: {
        story:
          'Roughly double-speed all four dials. Useful for attention-grabbing promo spots where the full cycle needs to complete within a short viewport visibility window.',
      },
    },
  },
};

export const Frozen: Story = {
  name: 'Frozen (enabled=false)',
  args: { enabled: false },
  parameters: {
    docs: {
      description: {
        story:
          '`enabled={false}` — identical output to what reduced-motion users see: the first phrase, rendered statically. Use when animation would distract (print styles, screenshot fixtures, tests).',
      },
    },
  },
};
