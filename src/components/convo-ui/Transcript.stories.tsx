import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { Transcript, type TranscriptEntry } from './Transcript';

const SAMPLE_ENTRIES: TranscriptEntry[] = [
  {
    key: 'u-1',
    speaker: 'user',
    text: "Hey, I need to update my billing address.",
  },
  {
    key: 'a-1',
    speaker: 'agent',
    text: "Of course — let me pull up your account first.",
  },
  {
    key: 'u-2',
    speaker: 'user',
    text: "It's on file as 221B Baker St, but I moved last month.",
  },
  {
    key: 'a-2',
    speaker: 'agent',
    text: "Got it. What's the new address, and do you want me to update the shipping profile too?",
  },
];

const FULL_REPLY =
  "I can help with that. Your next invoice is on the 18th for $42. Want me to switch you to the annual plan?";

// Looping typewriter used only inside the `LiveAgent` story. Resets when the target text
// changes so re-opening the story re-plays the streaming animation.
function useTypewriter(text: string, speedMs = 32) {
  const [out, setOut] = useState('');
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    let i = 0;
    // Prime with empty on the first tick so React sees a fresh render before scheduling chars.
    const id = setInterval(() => {
      if (!mountedRef.current) return;
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speedMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [text, speedMs]);
  return out;
}

function LiveAgentStory(args: React.ComponentProps<typeof Transcript>) {
  const live = useTypewriter(FULL_REPLY, 32);
  return (
    <Transcript
      {...args}
      entries={SAMPLE_ENTRIES.slice(0, 2)}
      activeText={live}
      activeSpeaker="agent"
    />
  );
}

const meta = {
  title: 'Transcript/Transcript',
  component: Transcript,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Streaming conversation log. History entries fade in via layout animation; the live turn renders with a blinking caret and pulsing `● live` badge. Auto-scrolls to the tail on every new entry or active-text change. Labels for user / agent are configurable.',
      },
    },
  },
  args: {
    entries: SAMPLE_ENTRIES,
    activeText: '',
    activeSpeaker: 'agent',
    agentName: 'Ada',
    userName: 'You',
  },
  decorators: [
    (Story) => (
      <div className="flex h-[32rem] w-[28rem] flex-col rounded-2xl border border-border bg-surface/55 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02),_0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between border-b border-border px-1 pb-3.5">
          <div className="font-display text-xl italic tracking-[-0.01em]">Transcript</div>
          <div className="font-mono text-xs text-muted-foreground">Live</div>
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Transcript>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { entries: [], activeText: '', activeSpeaker: 'agent' },
};

export const History: Story = {
  args: { entries: SAMPLE_ENTRIES, activeText: '', activeSpeaker: 'agent' },
  name: 'History only',
};

export const LiveAgent: Story = {
  name: 'Live — agent streaming',
  render: (args) => <LiveAgentStory {...args} />,
};

export const LiveUser: Story = {
  name: 'Live — user interim',
  args: {
    entries: SAMPLE_ENTRIES.slice(0, 2),
    activeText: 'Yeah, switch me to the annual plan',
    activeSpeaker: 'user',
  },
};
