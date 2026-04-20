import type { Meta, StoryObj } from '@storybook/react-vite';
import { VoiceGallery } from './VoiceGallery';

const COMPONENT_DOC = `
Two-column grid of \`VoiceCard\`s rendering the 6 preset personas (Ada, Kai,
Nova, Onyx, Sage, Echo). Self-contained — tracks its own \`selected\` and
\`previewing\` state, no props to wire.

### State model

- \`selected\` — the committed voice (starts at \`Ada\`). Clicking any card's
  body updates this.
- \`previewing\` — at most one card plays at a time. Clicking Preview on a
  different card switches the active preview; clicking it again toggles off.

\`\`\`tsx
<VoiceGallery />            // full 6-card grid, 2 columns
<VoiceGallery compact />    // 4-card grid, 1 column — side panels
\`\`\`

### Compact mode

\`compact\` trims the list to 4 voices and collapses to a single column —
use when the gallery has to fit in a narrow side panel or a mobile sheet.
Pick the first four (Ada, Kai, Nova, Onyx); reorder the source constant
if you want a different subset.

### Preset voices

Each voice has a fixed gradient (\`accent\`) that's reused wherever the same
voice renders in the DS (session rows, orbs), so one voice reads the same
across screens. Tags drive the chip row: first entry is gender, second is
locale.

### Ownership

The state lives **inside** VoiceGallery, making it a plug-and-play
composite. If you need external control (e.g. persisting the selection to
a backend), compose \`VoiceCard\` directly and lift the state up instead.
`;

const meta = {
  title: 'Pickers/VoiceGallery',
  component: VoiceGallery,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { compact: false },
  argTypes: {
    compact: {
      control: 'boolean',
      description:
        '`true` → 4 voices, single column. Default (`false`) → 6 voices, 2 columns.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VoiceGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Full 2-column, 6-card grid. Ada starts selected. Click cards to change the committed voice; click Preview to toggle audio preview (one at a time).',
      },
    },
  },
};

export const Compact: Story = {
  args: { compact: true },
  name: 'Compact (single column)',
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          '`compact={true}` — 4 voices stacked in one column. Fits a narrow side panel or a mobile settings sheet. Selection + preview behaviour is unchanged.',
      },
    },
  },
};
