import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { Ambient, type AmbientState } from './Ambient';

const COMPONENT_DOC = `
Drifting radial-gradient blobs + SVG grain overlay. Decorative background
layer behind conversation surfaces — no layout, no interaction, no
children.

### Usage

Absolute-positioned; fills its nearest \`position: relative\` ancestor. The
call site is responsible for stacking / pointer-events:

\`\`\`tsx
<div className="relative min-h-screen overflow-hidden">
  <Ambient state={viewState} />
  <main className="relative z-10"> ... </main>
</div>
\`\`\`

\`Ambient\` already applies \`pointer-events-none\` internally.

### State tinting

The \`state\` prop recolors one of the three blobs per state. Only four
states have visible tints; the rest fall through to the base warm palette:

| State | Tinted blob | Color (light) |
| --- | --- | --- |
| \`listening\` | 0 | Green (\`#d4e9d6\`) |
| \`thinking\` | 1 | Amber (\`#f5e4c4\`) |
| \`speaking\` | 2 | Blue (\`#dce4f7\`) — also scales to 1.15× |
| \`error\` | 0 | Red (\`#f5d4d4\`) |
| \`idle\` / \`muted\` / \`connecting\` / \`preparing\` | (base palette) | Warm neutrals |

Transitions between states are CSS-driven (\`background 1.2s\`,
\`transform 2s\`), so state changes cross-fade smoothly.

### Dark mode

Defaults to \`prefers-color-scheme: dark\`. Pass \`dark={true}\` to pin the
dark palette regardless (useful for Storybook stages or app-level theme
overrides). SSR returns the light palette; dark users see a brief flash
until the media query reports client-side.

### Motion

Each blob drifts on an infinite \`easeInOut\` loop (22–34s per cycle).
Respects \`prefers-reduced-motion\` via \`useReducedMotion\` — motion is
disabled entirely, though blobs still recolor on state change.
`;

const meta = {
  title: 'Signature/Ambient',
  component: Ambient,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { state: 'idle' },
  argTypes: {
    state: {
      control: 'select',
      options: ['connecting', 'preparing', 'idle', 'listening', 'thinking', 'speaking', 'muted', 'error'],
      description:
        'View state. Only `listening` / `thinking` / `speaking` / `error` have visible tints; others fall through to the base palette.',
    },
    dark: {
      control: 'boolean',
      description:
        'Force the dark palette. Omit to follow `prefers-color-scheme: dark`.',
    },
  },
  decorators: [
    (Story) => (
      <div className="relative h-[28rem] w-full overflow-hidden bg-background">
        <Story />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-border bg-surface/70 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
            ambient layer
          </div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof Ambient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { state: 'idle' },
  parameters: {
    docs: {
      description: {
        story:
          'Base warm palette — no tint applied. The default look for `connecting` / `preparing` / `idle` / `muted`, since those states share the same rendering.',
      },
    },
  },
};

export const Listening: Story = {
  args: { state: 'listening' },
  parameters: {
    docs: {
      description: {
        story:
          'Blob 0 tints green (`#d4e9d6`). Used while the user is speaking — the green aligns with the user-listening accent elsewhere in the DS.',
      },
    },
  },
};

export const Thinking: Story = {
  args: { state: 'thinking' },
  parameters: {
    docs: {
      description: {
        story:
          'Blob 1 tints amber (`#f5e4c4`). Used while the agent is processing. The warm tint adds perceptual weight without being alarming.',
      },
    },
  },
};

export const Speaking: Story = {
  args: { state: 'speaking' },
  parameters: {
    docs: {
      description: {
        story:
          'Blob 2 tints blue (`#dce4f7`) and scales to 1.15×. The only state with a transform change — the background subtly pushes forward to match the agent\'s foreground presence.',
      },
    },
  },
};

export const Muted: Story = {
  args: { state: 'muted' },
  parameters: {
    docs: {
      description: {
        story:
          '`muted` falls through to the base palette — visually identical to `idle`. The muted signal lives in the foreground (orb desaturation, mic button), not the ambient layer.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: { state: 'error' },
  name: 'Error',
  parameters: {
    docs: {
      description: {
        story:
          'Blob 0 tints red (`#f5d4d4`). Used when the session has failed — still gentle (a toast carries the hard signal), just enough to color the environment.',
      },
    },
  },
};

function AutoCycleRender() {
  // Only the 4 tinted states have visible palette differences; loop them so reviewers
  // can see the blob recolor transitions. Other states fall through to the base palette
  // and look identical, so they're skipped to keep the cycle purposeful.
  const cycle: AmbientState[] = ['listening', 'thinking', 'speaking', 'error'];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % cycle.length), 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="relative h-[28rem] w-full overflow-hidden bg-background">
      <Ambient state={cycle[i]} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded-full border border-border bg-surface/70 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
          {cycle[i]}
        </div>
      </div>
    </div>
  );
}

export const AutoCycle: Story = {
  name: 'Auto-cycle (tinted states)',
  decorators: [(Story) => <Story />],
  render: () => <AutoCycleRender />,
  parameters: {
    docs: {
      description: {
        story:
          'Cycles through the four tinted states every 3s so the cross-fade between palettes is visible. Demonstrates the 1.2s background transition — state changes are never abrupt.',
      },
    },
  },
};

export const OnDark: Story = {
  args: { state: 'speaking', dark: true },
  name: 'On dark surface',
  decorators: [
    (Story) => (
      <div className="relative h-[28rem] w-full overflow-hidden bg-warm-7">
        <Story />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-warm-4/30 bg-warm-0/5 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-warm-0/70 backdrop-blur">
            ambient layer · dark
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    backgrounds: { default: 'fixed-dark' },
    docs: {
      description: {
        story:
          'Dark palette forced via `dark={true}`. Blob colors shift to low-chroma, darker variants and grain opacity drops to 0.15 (vs 0.35 light) so noise stays perceptible without muddying dark surfaces.',
      },
    },
  },
};
