import type { Meta, StoryObj } from '@storybook/react-vite';
import { VoiceOrb } from './VoiceOrb';

const meta = {
  title: 'Signature/VoiceOrb',
  component: VoiceOrb,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Canvas-drawn signature blob with the voice gradient + glow halo. Five states; amplitude feeds per-frame deformation in listening / speaking states. The orb renders on top of paper or dark surfaces — the `On dark surface` story demonstrates the self-carried glow.',
      },
    },
  },
  args: { size: 140, amplitude: 0.5, state: 'listening' },
  argTypes: {
    state: {
      control: 'select',
      options: ['idle', 'listening', 'thinking', 'speaking', 'muted'],
    },
    size: { control: { type: 'range', min: 60, max: 300, step: 10 } },
    amplitude: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof VoiceOrb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { state: 'idle' } };
export const Listening: Story = { args: { state: 'listening' } };
export const Thinking: Story = { args: { state: 'thinking' } };
export const Speaking: Story = { args: { state: 'speaking', amplitude: 0.7 } };
export const Muted: Story = { args: { state: 'muted' } };

export const OnDark: Story = {
  args: { state: 'speaking', amplitude: 0.6 },
  parameters: { backgrounds: { default: 'fixed-dark' } },
  name: 'On dark surface',
};

export const Large: Story = {
  args: { state: 'speaking', size: 240, amplitude: 0.7 },
  parameters: { backgrounds: { default: 'fixed-dark' } },
};
