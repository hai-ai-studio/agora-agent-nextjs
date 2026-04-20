import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { Persona, type PersonaState } from './Persona';

const COMPONENT_DOC = `
Agent identity card shown at the top of the conversation surface. Avatar
with state-driven pulsing rings, italic serif name, optional hint line,
state pill, and a live mm:ss call timer — one cohesive block.

### State-driven visuals

The \`state\` prop is load-bearing: it drives the ring animation, the pill
copy + color, the dot blink, and whether the timer runs.

| State        | Rings                         | Pill copy      | Timer  |
| ------------ | ----------------------------- | -------------- | ------ |
| \`connecting\` | static                        | Connecting     | runs   |
| \`preparing\`  | static                        | Starting       | runs   |
| \`idle\`       | static                        | Ready          | runs   |
| \`listening\`  | green pulse (scale + fade)    | Listening      | runs   |
| \`thinking\`   | dashed, slow 360° rotation    | Thinking       | runs   |
| \`speaking\`   | blue pulse (faster cadence)   | Speaking       | runs   |
| \`muted\`      | static                        | Muted          | runs   |
| \`error\`      | static                        | Reconnecting   | paused |

\`listening\` / \`speaking\` / \`thinking\` / \`error\` pills use hardcoded pastel
palettes in both themes — the saturation shift is deliberate so status
reads as "status color" regardless of surface.

### Hint line

\`hint\` is a short status sentence above the pill. It's animated in/out
via \`AnimatePresence\` — swap it on state change and you get a free fade
transition. Rendering \`undefined\` drops the slot entirely; rendering an
empty string keeps the height reservation so the block doesn't jump.

\`\`\`tsx
<Persona state="listening" name="Ada" hint="Listening… keep talking." />
\`\`\`

### Timer reset

The timer lives inside a child component keyed on \`resetKey\`. Bumping the
key from the parent remounts the child, so the counter restarts from
\`00:00\` without a reset effect:

\`\`\`tsx
<Persona state={state} resetKey={sessionId} />
\`\`\`

### Reduced motion

\`prefers-reduced-motion\` disables the ring animations entirely; the rest
of the card (pill, hint fade, timer) continues to render normally.
`;

const ALL_STATES: PersonaState[] = [
  'connecting',
  'preparing',
  'idle',
  'listening',
  'thinking',
  'speaking',
  'muted',
  'error',
];

const HINTS: Record<PersonaState, string> = {
  connecting: 'Connecting to Ada…',
  preparing: 'Ada is about to say hi.',
  idle: "Say something whenever you're ready.",
  listening: 'Listening… keep talking.',
  thinking: 'Thinking through that for you.',
  speaking: 'Ada is responding.',
  muted: "Mic is off. Ada can't hear you right now.",
  error: 'Network hiccup — trying to reconnect.',
};

const meta = {
  title: 'Identity/Persona',
  component: Persona,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { state: 'listening', name: 'Ada', hint: HINTS.listening },
  argTypes: {
    state: {
      control: 'select',
      options: ALL_STATES,
      description:
        'Conversation state. Drives ring animation, pill copy + color, and whether the timer runs.',
    },
    name: {
      control: 'text',
      description:
        'Agent display name. First letter renders inside the avatar in italic serif; full name above the pill.',
    },
    hint: {
      control: 'text',
      description:
        'Short status sentence above the pill. Empty string reserves height; `undefined` drops the slot.',
    },
    resetKey: {
      control: 'number',
      description: 'Bump to remount the inner timer, resetting it to `00:00`.',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[42rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Persona>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Listening: Story = {
  args: { state: 'listening', hint: HINTS.listening },
  parameters: {
    docs: {
      description: {
        story:
          'User is talking. Rings pulse green (scale + fade, staggered); pill reads "Listening" with a blinking dot in `state-listen`.',
      },
    },
  },
};

export const Thinking: Story = {
  args: { state: 'thinking', hint: HINTS.thinking },
  parameters: {
    docs: {
      description: {
        story:
          'Agent is processing. Rings swap to dashed borders with a slow 360° rotation; pill reads "Thinking" in the amber palette.',
      },
    },
  },
};

export const Speaking: Story = {
  args: { state: 'speaking', hint: HINTS.speaking },
  parameters: {
    docs: {
      description: {
        story:
          'Agent is responding. Rings pulse blue on a faster cadence (1.1s vs listening\'s 1.4s) to read as "more active".',
      },
    },
  },
};

export const Idle: Story = {
  args: { state: 'idle', hint: HINTS.idle },
  parameters: {
    docs: {
      description: {
        story:
          'Connected and waiting. Rings are static, pill dot is solid (no blink) — a calm baseline between turns.',
      },
    },
  },
};

export const Connecting: Story = {
  args: { state: 'connecting', hint: HINTS.connecting },
  parameters: {
    docs: {
      description: {
        story:
          'Pre-session: establishing the transport. Neutral pill with a blinking dot. Typically the first Persona render after mount.',
      },
    },
  },
};

export const Preparing: Story = {
  args: { state: 'preparing', hint: HINTS.preparing },
  parameters: {
    docs: {
      description: {
        story:
          'Transport up, agent warming up before its opening line. Visually identical to `connecting` but semantically distinct — useful for analytics.',
      },
    },
  },
};

export const Muted: Story = {
  args: { state: 'muted', hint: HINTS.muted },
  parameters: {
    docs: {
      description: {
        story:
          'Mic is off. Pill reads "Muted" with the `state-muted` dot; rings stay static so the card doesn\'t falsely look active.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: { state: 'error', hint: HINTS.error },
  name: 'Error (timer paused)',
  parameters: {
    docs: {
      description: {
        story:
          'Transport dropped. Red pill reads "Reconnecting"; the timer **pauses** (the only state where it does) so the displayed duration reflects useful time only.',
      },
    },
  },
};

export const NoHint: Story = {
  args: { state: 'listening', hint: undefined },
  name: 'No hint line',
  parameters: {
    docs: {
      description: {
        story:
          '`hint={undefined}` removes the slot entirely — the card collapses to avatar + name + pill. Use when the surrounding UI already carries the status sentence.',
      },
    },
  },
};

export const AllStates: Story = {
  name: 'All states',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Every state stacked vertically for side-by-side comparison. Useful for visual regression sweeps and for reviewing the pill palette holistically.',
      },
    },
  },
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col gap-3">
      {ALL_STATES.map((s) => (
        <Persona key={s} state={s} name="Ada" hint={HINTS[s]} />
      ))}
    </div>
  ),
};

function AutoCycleRender() {
  // Rotate through the 4 most common in-call states so reviewers can see transitions
  // without hand-swapping controls. `connecting/preparing/error/muted` sit outside the
  // primary loop — their transitions are one-shot and covered by the dedicated stories.
  const cycle: PersonaState[] = ['listening', 'thinking', 'speaking', 'idle'];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % cycle.length), 2600);
    return () => clearInterval(id);
    // cycle is a literal; rotation loops indefinitely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const state = cycle[i];
  return <Persona state={state} name="Ada" hint={HINTS[state]} />;
}

export const AutoCycle: Story = {
  name: 'Auto-cycle (listening → thinking → speaking → idle)',
  render: () => <AutoCycleRender />,
  parameters: {
    docs: {
      description: {
        story:
          'Rotates through the four main in-call states every 2.6s so you can see the ring + pill transitions without touching controls. One-shot states (`connecting` / `preparing` / `muted` / `error`) stay in their dedicated stories.',
      },
    },
  },
};
