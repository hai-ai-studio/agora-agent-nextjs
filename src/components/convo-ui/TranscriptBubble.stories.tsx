import type { Meta, StoryObj } from '@storybook/react-vite';
import { TranscriptBubble } from './TranscriptBubble';

const COMPONENT_DOC = `
Asymmetric-corner chat bubble for finished conversation turns. Pairs with
\`Transcript\` (the scrolling log) — use TranscriptBubble directly when you
need per-message control over streaming/interim states.

### Role (\`'agent'\` vs \`'user'\`)

Direction, fill, and avatar all flip on \`role\`:

\`\`\`tsx
<TranscriptBubble role="agent" text="..." />  // left, paper-bright fill, gradient dot
<TranscriptBubble role="user"  text="..." />  // right, dark fill (reads as "you")
\`\`\`

The top-corner asymmetry (\`rounded-tl-[4px]\` for agent,
\`rounded-tr-[4px]\` for user) points the bubble at its speaker — a cheap
visual cue that survives at very small sizes.

### Streaming vs. interim

Two overlapping but distinct "not-final" visuals:

- \`streaming\` — agent turn still being generated. Appends a blinking caret
  (\`animate-caret-blink\`) coloured \`bg-voice-b\` on agent bubbles,
  \`bg-background\` on user bubbles. Drop the flag once the turn finalizes.
- \`interim\` — the user's intermediate ASR hypothesis, before the STT engine
  commits. Italicises the body. Usually replaced (not appended) when the
  final transcript arrives.

The two can coexist — e.g. an agent bubble that's streaming and dimmed — but
interim is almost always user-side only.

### Timestamp

Optional \`HH:MM\` string rendered in the meta row. Prefer short local times;
the bubble doesn't format for you.
`;

const meta = {
  title: 'Transcript/TranscriptBubble',
  component: TranscriptBubble,
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: {
    role: 'agent',
    text: 'I can help with that. Your next invoice is on the 18th for $42.',
    timestamp: '3:14 PM',
  },
  argTypes: {
    role: {
      control: 'radio',
      options: ['user', 'agent'],
      description:
        'Speaker. `agent` → left, paper fill, gradient dot. `user` → right, dark fill.',
    },
    streaming: {
      control: 'boolean',
      description:
        'Appends a blinking caret — use while an agent turn is still being generated.',
    },
    interim: {
      control: 'boolean',
      description:
        'Italicises the body. Reserved for the user\'s intermediate ASR hypothesis before final commit.',
    },
    timestamp: {
      control: 'text',
      description:
        'Optional time string rendered in the meta row (e.g. `3:14 PM`). Not auto-formatted.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TranscriptBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AgentMessage: Story = {
  args: { role: 'agent' },
  parameters: {
    docs: {
      description: {
        story:
          'Default agent bubble — left-aligned, paper-bright fill, gradient avatar dot. Use for completed agent turns in the transcript.',
      },
    },
  },
};

export const UserMessage: Story = {
  args: { role: 'user', text: 'What does my next bill look like?' },
  parameters: {
    docs: {
      description: {
        story:
          'User bubble — right-aligned with a dark `bg-foreground` fill to read as "you / on-device". Top-right corner is clipped so the bubble points at its speaker.',
      },
    },
  },
};

export const Streaming: Story = {
  args: { role: 'agent', streaming: true, text: 'Let me pull that up for you…' },
  name: 'Streaming (caret)',
  parameters: {
    docs: {
      description: {
        story:
          'Agent turn mid-generation. The blinking caret (`bg-voice-b`) signals the text is still being written. Clear `streaming` once the turn finalizes.',
      },
    },
  },
};

export const Interim: Story = {
  args: {
    role: 'user',
    interim: true,
    text: 'Uhh… switch me to annual, I guess?',
  },
  name: 'Interim (ASR hypothesis)',
  parameters: {
    docs: {
      description: {
        story:
          'User bubble during partial ASR — italicised to mark "not final yet". Replace (don\'t append) with the committed text when STT finalizes.',
      },
    },
  },
};

export const Conversation: Story = {
  name: 'Multi-turn conversation',
  parameters: {
    docs: {
      description: {
        story:
          'Realistic four-bubble sequence showing user / agent alternation, an interim user turn, and a streaming agent reply. Useful for previewing spacing and alignment end-to-end.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <TranscriptBubble role="user" text="What's my next invoice?" timestamp="3:14 PM" />
      <TranscriptBubble
        role="agent"
        text="Your next invoice is on the 18th for $42. Want me to switch you to annual?"
        timestamp="3:14 PM"
      />
      <TranscriptBubble role="user" text="Yes, switch me to annual." timestamp="3:15 PM" interim />
      <TranscriptBubble role="agent" text="On it…" timestamp="3:15 PM" streaming />
    </div>
  ),
};
