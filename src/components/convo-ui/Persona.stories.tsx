import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { Persona, type PersonaState } from './Persona';

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
      description: {
        component:
          'Agent identity card: avatar with state-driven pulsing rings, italic serif name, hint line, state pill, and live mm:ss call timer. Rings pulse green for listening, pulse blue for speaking, rotate dashed for thinking. Timer pauses during `error`. Bump `resetKey` from the parent to reset the timer.',
      },
    },
  },
  args: { state: 'listening', name: 'Ada', hint: HINTS.listening },
  argTypes: {
    state: { control: 'select', options: ALL_STATES },
    name: { control: 'text' },
    hint: { control: 'text' },
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

export const Listening: Story = { args: { state: 'listening', hint: HINTS.listening } };
export const Thinking: Story = { args: { state: 'thinking', hint: HINTS.thinking } };
export const Speaking: Story = { args: { state: 'speaking', hint: HINTS.speaking } };
export const Idle: Story = { args: { state: 'idle', hint: HINTS.idle } };
export const Connecting: Story = { args: { state: 'connecting', hint: HINTS.connecting } };
export const Preparing: Story = { args: { state: 'preparing', hint: HINTS.preparing } };
export const Muted: Story = { args: { state: 'muted', hint: HINTS.muted } };
export const ErrorState: Story = {
  args: { state: 'error', hint: HINTS.error },
  name: 'Error (timer paused)',
};

export const NoHint: Story = {
  args: { state: 'listening', hint: undefined },
  name: 'No hint line',
};

export const AllStates: Story = {
  name: 'All states',
  parameters: { layout: 'padded' },
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
};
