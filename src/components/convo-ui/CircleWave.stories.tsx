import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleWave } from './CircleWave';

const COMPONENT_DOC = `
Three concentric voice-gradient rings, each with a different phase offset
and harmonic. Pairs with \`VoiceOrb\` to add depth layering — the orb is the
filled blob, \`CircleWave\` surrounds it with open rings.

### Usage

\`\`\`tsx
<div className="relative">
  <CircleWave size={160} />
  <VoiceOrb size={120} state="speaking" />
</div>
\`\`\`

### Behavior

- **\`active={true}\`** — each ring deforms with a per-ring harmonic
  (\`sin(a * (4 + r) + t * (2 + r * 0.5))\`), so the three rings never sync
  up. Reads as organic, continuous motion.
- **\`active={false}\`** — deformation collapses to a gentle low-frequency
  wobble. Rings remain visible but quiet.

### Visuals

Stroke colors are hardcoded alpha-variants of the three voice-gradient
stops — purple (0.8), pink (0.6), orange (0.4) — so each ring reads
distinctly as it overlaps. Not stylable via Tailwind; edit the component
if you need a different palette.

### No input

Like \`LinearWave\`, this is a decorative synth. It does not accept audio
data. Use \`BarsWave\` or \`VoiceOrb\`'s \`amplitude\` if you need energy-driven
visuals.
`;

const meta = {
  title: 'Waveforms/CircleWave',
  component: CircleWave,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { active: true, size: 120 },
  argTypes: {
    active: {
      control: 'boolean',
      description:
        'When `true`, rings deform with per-ring harmonics. When `false`, they collapse to a gentle low-frequency wobble.',
    },
    size: {
      control: { type: 'range', min: 60, max: 240, step: 10 },
      description: 'Canvas width/height in px (square). Rings scale proportionally.',
    },
  },
} satisfies Meta<typeof CircleWave>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Three active rings with independent harmonics. Each ring deforms on its own frequency so the overall shape never repeats identically.',
      },
    },
  },
};

export const Inactive: Story = {
  args: { active: false },
  parameters: {
    docs: {
      description: {
        story:
          '`active={false}` — rings remain visible but reduce to a slow wobble. Use for pre-session or idle states where you want the shape present without drawing attention.',
      },
    },
  },
};

export const Large: Story = {
  args: { size: 200 },
  parameters: {
    docs: {
      description: {
        story:
          'Hero scale. Good for pairing around a 140–160px `VoiceOrb` in an empty-state or landing hero.',
      },
    },
  },
};
