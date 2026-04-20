import type { Meta, StoryObj } from '@storybook/react-vite';
import { AudioPlayer } from './AudioPlayer';

const COMPONENT_DOC = `
Call-recording scrubber. A static pseudo-waveform acts as the
timeline; bars up to the playhead are painted with the brand voice
gradient, the rest fall back to \`bg-border\`.

### When to use

Anywhere a saved call needs playback affordance — history screens,
call detail pages, shared recording links.

\`\`\`tsx
<AudioPlayer duration={184} title="Call with Ada" date="Today 3:14 PM" />
\`\`\`

### Interactions

- **Play/pause** — circular foreground button, top-left. Advances
  \`pos\` at 1 Hz using the current \`speed\` multiplier.
- **Seek** — click anywhere on the waveform strip to jump.
  \`role="slider"\` with proper \`aria-value*\`, so keyboard/AT users
  get the same behavior via the parent control surface.
- **Speed toggle** — cycles 1× → 1.5× → 2× → 1×. Multiplies the
  per-tick advance only; does not affect visual pitch.

### Waveform

56 bars generated from a deterministic sinusoidal envelope
(\`0.2 + sin(i·0.4)·0.5 + 0.5·0.6 + sin(i·1.3)·0.15\`). Stable across
mounts — swap in decoded peaks when wiring real audio.

### State

All playback state is local (\`playing\`, \`pos\`, \`speed\`). Safe to
mount multiple instances side-by-side; they won't fight each other,
though nothing prevents both from playing at once if that matters for
your feature.
`;

const meta = {
  title: 'Playback/AudioPlayer',
  component: AudioPlayer,
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { title: 'Call with Ada', date: 'Today 3:14 PM', duration: 184 },
  argTypes: {
    duration: {
      control: { type: 'range', min: 30, max: 600, step: 15 },
      description:
        'Track length in seconds. Drives the slider range and the `fmt()` time-remaining display.',
    },
    title: {
      control: 'text',
      description: 'Primary label — usually the counterparty name or call subject.',
    },
    date: {
      control: 'text',
      description:
        'Secondary label — rendered in the mono font. Free-form; no date parsing.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AudioPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Canonical layout with play button, title block, and speed toggle on top of the 56-bar waveform strip. Click play to watch the playhead advance; click the waveform to seek.',
      },
    },
  },
};

export const Yesterday: Story = {
  args: { title: "Yesterday's call", date: 'Apr 19 · 11:22 AM' },
  parameters: {
    docs: {
      description: {
        story:
          'Same layout with a different title/date pair — use this shape when rendering a list of recordings where each row shows the most recent call summary.',
      },
    },
  },
};

export const OnDark: Story = {
  args: { title: "Yesterday's call", date: 'Apr 19 · 11:22 AM' },
  parameters: {
    backgrounds: { default: 'fixed-dark' },
    docs: {
      description: {
        story:
          'Same card against the `fixed-dark` background to sanity-check contrast of the border, muted text, and inactive waveform bars on a dark page.',
      },
    },
  },
  name: 'On dark surface',
};
