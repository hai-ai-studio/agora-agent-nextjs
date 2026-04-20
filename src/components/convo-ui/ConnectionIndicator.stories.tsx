import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConnectionIndicator } from './ConnectionIndicator';

const COMPONENT_DOC = `
Header connection signal. Pulsing colored dot + short label, optionally
followed by a muted secondary badge. Used in the conversation header to
replace a raw "connected?" truthy read with a self-contained block that
answers "is this call live?".

### Usage

\`\`\`tsx
<ConnectionIndicator status="connected" />
<ConnectionIndicator status="connecting" secondary={false} />
<ConnectionIndicator status="connected" label="Live · 02:14" />
\`\`\`

### States

| Status | Label (default) | Dot color | Pulse |
| --- | --- | --- | --- |
| \`connected\` | Connected | Green (\`#16a34a\`) | yes |
| \`connecting\` | Connecting | Amber (\`#b45309\`) | yes |
| \`reconnecting\` | Reconnecting | Amber (\`#b45309\`) | yes |
| \`error\` | Disconnected | Red (\`#b91c1c\`) | — |

Each state also paints a \`box-shadow\` glow ring in the same color at 15%
alpha, so the dot carries weight against both light and dark headers.

### Secondary badge

The \`secondary\` slot shows "End-to-end encrypted" by default. Override with
a string, or pass \`false\` to hide entirely. **Auto-hidden below the \`md\`
breakpoint** so narrow headers don't wrap — the connection dot + label are
the primary signal, the secondary is advisory.

### Custom label

Pass \`label\` to override the state's default copy. Common use: a live
session timer, e.g. \`label="Live · 02:14"\`. The dot color still derives
from \`status\`.

### Motion

Pulsing states loop \`opacity: [1, 0.5, 1]\` on a 2s \`easeInOut\` cycle.
\`error\` is static — the absence of motion reinforces "this has stopped".
`;

const meta = {
  title: 'Status/ConnectionIndicator',
  component: ConnectionIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { status: 'connected' },
  argTypes: {
    status: {
      control: 'select',
      options: ['connected', 'connecting', 'reconnecting', 'error'],
      description: 'Connection state. Drives dot color, glow color, default label, and whether it pulses.',
    },
    label: {
      control: 'text',
      description:
        'Override the default label (e.g. `"Live · 02:14"`). Dot color still comes from `status`.',
    },
    secondary: {
      control: 'text',
      description:
        'Secondary muted badge. Default `"End-to-end encrypted"`. Pass `false` to hide. Auto-hidden below the `md` breakpoint.',
    },
  },
} satisfies Meta<typeof ConnectionIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Healthy, live call. Green dot pulsing on 2s; secondary badge visible at `md`+. The default resting state once the session is established.',
      },
    },
  },
};

export const Connecting: Story = {
  args: { status: 'connecting' },
  parameters: {
    docs: {
      description: {
        story:
          'Initial handshake — amber dot pulsing. Shown from "start call" tap until the WebRTC ICE/DTLS sequence completes.',
      },
    },
  },
};

export const Reconnecting: Story = {
  args: { status: 'reconnecting' },
  parameters: {
    docs: {
      description: {
        story:
          'Same amber dot as `connecting`; the label is the only differentiator. Shown on transient disconnects before falling into `error`.',
      },
    },
  },
};

export const Disconnected: Story = {
  args: { status: 'error' },
  parameters: {
    docs: {
      description: {
        story:
          '`status="error"` renders a static red dot labeled "Disconnected". The lack of pulse signals that the client is not trying to recover automatically — user action is needed.',
      },
    },
  },
};

export const WithoutSecondary: Story = {
  args: { secondary: false },
  name: 'Without secondary badge',
  parameters: {
    docs: {
      description: {
        story:
          'Pass `secondary={false}` when the header has other elements competing for horizontal space. Also what renders automatically below the `md` breakpoint.',
      },
    },
  },
};

export const CustomLabel: Story = {
  args: { status: 'connected', label: 'Live · 02:14' },
  name: 'Custom label',
  parameters: {
    docs: {
      description: {
        story:
          'Override the default copy with a live session timer or custom status. The dot color still derives from `status`, so "Live · 02:14" with `status="connected"` stays green.',
      },
    },
  },
};

export const AllStates: Story = {
  name: 'All states',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'All four states stacked. Useful for eyeballing the amber dot shared between `connecting` and `reconnecting`, and confirming the red `error` state reads as distinct.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      {(['connected', 'connecting', 'reconnecting', 'error'] as const).map((s) => (
        <ConnectionIndicator key={s} status={s} />
      ))}
    </div>
  ),
};
