import type { Meta, StoryObj } from '@storybook/react-vite';
import { LiveSubtitle } from './LiveSubtitle';

const COMPONENT_DOC = `
Dark overlay caption for full-screen / video-stage call views. A single
rounded pill with a speaker tag above the line and a blinking caret at the
tail.

### When to use

Pair with an immersive voice stage (full-bleed waveform, hero orb, or
background video) where a transcript panel would be visually heavy. For the
standard chat-style transcript, use \`TranscriptBubble\` / \`Transcript\`
instead.

\`\`\`tsx
<LiveSubtitle speaker="agent" text="Switching you to annual…" />
\`\`\`

### Theming (intentionally dark-only)

The component hardcodes \`bg-warm-7\` + \`text-warm-0\` instead of semantic
tokens because it sits over video or a dark stage — contrast has to hold
regardless of the root theme. Don't override the surface.

### Speaker tint

The tiny uppercase speaker tag flips color by role:

- \`speaker="agent"\` — \`text-voice-b\` (rose)
- \`speaker="user"\`  — \`text-warm-2\` (neutral)

Both pass 4.5:1 contrast on the \`warm-7\` pill.

### Caret

A \`voice-b\` blinking caret renders at the end of every subtitle — the
component assumes you only mount it while text is actively streaming.
Unmount when the turn finalizes; there's no "done" state.
`;

const meta = {
  title: 'Transcript/LiveSubtitle',
  component: LiveSubtitle,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'fixed-dark' },
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: {
    text: "Sure — I'll switch you to the annual plan and apply the 20% discount. Confirming now…",
    speaker: 'agent',
  },
  argTypes: {
    speaker: {
      control: 'radio',
      options: ['user', 'agent'],
      description:
        'Tag shown above the subtitle. `agent` tints the tag rose (`voice-b`); `user` uses neutral `warm-2`.',
    },
    text: {
      control: 'text',
      description: 'Caption body. Rendered with `[text-wrap:balance]` for even line breaks.',
    },
  },
} satisfies Meta<typeof LiveSubtitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AgentSpeaking: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default agent caption — rose speaker tag, blinking caret. Use over a video or full-stage waveform while the agent is talking.',
      },
    },
  },
};

export const UserSpeaking: Story = {
  args: { speaker: 'user', text: 'Change the billing address to 221B Baker Street.' },
  parameters: {
    docs: {
      description: {
        story:
          'User caption with a neutral speaker tag. Shown while the local mic is feeding the STT pipeline — mirrors how video-call apps caption their own user.',
      },
    },
  },
};
