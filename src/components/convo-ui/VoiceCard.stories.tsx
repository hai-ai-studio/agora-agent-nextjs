import type { Meta, StoryObj } from '@storybook/react-vite';
import { VoiceCard } from './VoiceCard';

const COMPONENT_DOC = `
Persona tile used by \`VoiceGallery\` and anywhere a single voice needs to
render on its own (e.g. session summaries, settings). Shows a gradient
avatar, display name, one-line descriptor, and tag chips.

### Two independent actions

The card hosts **two buttons**:

1. **Select** — covers the whole card body via \`absolute inset-0\`. Fires
   \`onSelect\`. Clicking anywhere on the card that isn't the preview
   button triggers this.
2. **Preview** — small circle, top-right. Fires \`onPreview\`. Uses
   \`pointer-events-auto\` to punch through the parent's
   \`pointer-events-none\` so its click isn't swallowed by Select.

They are **siblings, not nested**. Nesting buttons would violate WCAG 4.1.2
(screen readers can't focus the inner one) — the sibling layout plus
z-indexing preserves both keyboard and AT access.

\`\`\`tsx
<VoiceCard
  name="Ada"
  descriptor="Warm · Conversational"
  tags={['female', 'en-US']}
  accent="linear-gradient(135deg, #7C5CFF, #E85C8A)"
  selected={current === 'Ada'}
  previewActive={previewing === 'Ada'}
  onSelect={() => setCurrent('Ada')}
  onPreview={() => togglePreview('Ada')}
/>
\`\`\`

### State

- \`selected\` — white→muted gradient fill, \`ring-1 ring-accent\`, lifted
  shadow. The committed choice; persists across renders.
- \`previewActive\` — the preview button flips to a pause glyph and \`bg-warm-6\`.
  Only one card should hold this at a time — \`VoiceGallery\` enforces it.

### Accent gradient

\`accent\` is **any valid CSS background value** — typically a
\`linear-gradient(...)\` signature for the voice. The same gradient gets
reused elsewhere in the design system (session rows, orb blends) so a
voice reads visually consistent across screens.
`;

const meta = {
  title: 'Pickers/VoiceCard',
  component: VoiceCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: {
    name: 'Ada',
    descriptor: 'Warm · Conversational',
    tags: ['female', 'en-US'],
    accent: 'linear-gradient(135deg, #7C5CFF, #E85C8A)',
    selected: false,
    previewActive: false,
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Display name, rendered bold in the card header.',
    },
    descriptor: {
      control: 'text',
      description: 'Short one-line personality summary (e.g. "Warm · Conversational").',
    },
    tags: {
      control: 'object',
      description: 'Uppercase chip row at the bottom. Typically gender + locale.',
    },
    accent: {
      control: 'text',
      description: 'CSS background for the avatar. Typically a `linear-gradient(...)` signature.',
    },
    selected: {
      control: 'boolean',
      description:
        'Committed selection state — adds the accent ring, lifted shadow, and gradient fill.',
    },
    previewActive: {
      control: 'boolean',
      description:
        'Preview button is the active/playing one. Flips to pause glyph and `bg-warm-6`.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Idle card — unselected, not previewing. The resting appearance that fills the gallery by default.',
      },
    },
  },
};

export const Selected: Story = {
  args: { selected: true },
  parameters: {
    docs: {
      description: {
        story:
          '`selected={true}` — accent ring, lifted shadow, gradient fill. Use for the committed voice; exactly one card in a gallery holds this.',
      },
    },
  },
};

export const PreviewPlaying: Story = {
  args: { previewActive: true },
  name: 'Preview playing',
  parameters: {
    docs: {
      description: {
        story:
          'Preview button swapped to the pause glyph with `bg-warm-6`. Signals a voice sample is audibly playing — flip back on audio end.',
      },
    },
  },
};
