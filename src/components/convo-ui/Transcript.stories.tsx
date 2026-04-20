import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { Transcript, type TranscriptEntry } from './Transcript';

const COMPONENT_DOC = `
Scrolling conversation log. Committed turns render as history entries; the
in-progress turn (if any) renders below with a blinking caret and pulsing
\`● live\` badge. Auto-scrolls to the tail on every append.

### Pure presentation

The component owns no speech or timing logic — the parent provides:

\`\`\`tsx
<Transcript
  entries={history}         // committed turns, keyed by stable id
  activeText={liveTurn}     // in-flight text, or '' when nothing live
  activeSpeaker="agent"     // who owns the live turn
  agentName="Ada"
  userName="You"
/>
\`\`\`

When \`activeText\` is non-empty, the live block appears at the bottom with
the caret. When it clears, the parent is expected to append the finalized
turn to \`entries\`.

### Animation

Entries enter with a subtle \`y: 8 → 0\` + fade via framer-motion's
\`AnimatePresence\` + \`layout\` — a new entry settling in pushes older ones
up smoothly. The live caret uses an opacity keyframe (blink), the live
badge uses a continuous opacity pulse.

### Scroll behaviour

Scroll container is \`flex-1 overflow-y-auto\`. After every \`entries.length\`
or \`activeText\` change, \`scrollTop\` is set to \`scrollHeight\` — this is
unconditional, so if the user has scrolled up to read history they will be
snapped back to the tail. Wrap in a "scroll to bottom" affordance upstream
if that's a problem for your use case.

### Accessibility

\`role="log"\` + \`aria-live="polite"\` — screen readers announce new entries
as they land, without interrupting the user.

### Empty state

When no entries and no \`activeText\`, renders \`emptyMessage\` in italic
display type. Default copy: _"Transcript will appear here once you start
talking."_
`;

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
      description: { component: COMPONENT_DOC },
    },
  },
  args: {
    entries: SAMPLE_ENTRIES,
    activeText: '',
    activeSpeaker: 'agent',
    agentName: 'Ada',
    userName: 'You',
  },
  argTypes: {
    entries: {
      description:
        'Committed turns, in chronological order. Each needs a stable `key` — prefer the upstream turn id.',
    },
    activeText: {
      control: 'text',
      description:
        'In-flight turn text. Non-empty → live block with caret + badge renders. Empty → live block hidden.',
    },
    activeSpeaker: {
      control: 'radio',
      options: ['user', 'agent'],
      description: 'Owner of the live turn. Drives the label above the caret block.',
    },
    agentName: {
      control: 'text',
      description: 'Label for agent turns. Default `Agent`.',
    },
    userName: {
      control: 'text',
      description: 'Label for user turns. Default `You`.',
    },
    emptyMessage: {
      control: 'text',
      description: 'Copy rendered when entries are empty and no live turn exists.',
    },
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
  parameters: {
    docs: {
      description: {
        story:
          'No history and no live turn — renders the italic `emptyMessage` placeholder. Matches the transcript panel\'s state before the first turn fires.',
      },
    },
  },
};

export const History: Story = {
  args: { entries: SAMPLE_ENTRIES, activeText: '', activeSpeaker: 'agent' },
  name: 'History only',
  parameters: {
    docs: {
      description: {
        story:
          'Four completed turns, no active turn. Use to preview spacing, speaker label styling, and the italic-muted user vs. solid agent treatment.',
      },
    },
  },
};

export const LiveAgent: Story = {
  name: 'Live — agent streaming',
  render: (args) => <LiveAgentStory {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Two history turns followed by a streaming agent reply. A typewriter feeds `activeText` char-by-char so you can see the caret blink and the live badge pulse on a realistic signal.',
      },
    },
  },
};

export const LiveUser: Story = {
  name: 'Live — user interim',
  args: {
    entries: SAMPLE_ENTRIES.slice(0, 2),
    activeText: 'Yeah, switch me to the annual plan',
    activeSpeaker: 'user',
  },
  parameters: {
    docs: {
      description: {
        story:
          'User side of the live block — used while the STT engine is emitting partial hypotheses. The label flips to `userName` and the italic-muted body style applies once this text commits to `entries`.',
      },
    },
  },
};
