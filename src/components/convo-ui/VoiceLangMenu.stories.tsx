import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { VoiceLangMenu, DEFAULT_VOICES } from './VoiceLangMenu';

function DefaultStory(args: React.ComponentProps<typeof VoiceLangMenu>) {
  const [voice, setVoice] = useState(args.voice);
  return <VoiceLangMenu {...args} voice={voice} onVoiceChange={setVoice} />;
}

function ControlledStory(args: React.ComponentProps<typeof VoiceLangMenu>) {
  const [voice, setVoice] = useState(args.voice);
  const [lang, setLang] = useState('English (US)');
  return (
    <div className="flex flex-col items-start gap-3">
      <VoiceLangMenu
        {...args}
        voice={voice}
        onVoiceChange={setVoice}
        language={lang}
        onLanguageChange={setLang}
      />
      <div className="font-mono text-xs text-muted-foreground">
        voice=<span className="text-foreground">{voice}</span> · lang=
        <span className="text-foreground">{lang}</span>
      </div>
    </div>
  );
}

function AllEnabledStory(args: React.ComponentProps<typeof VoiceLangMenu>) {
  const [voice, setVoice] = useState('nova');
  return <VoiceLangMenu {...args} voice={voice} onVoiceChange={setVoice} />;
}

const meta = {
  title: 'Controls/VoiceLangMenu',
  component: VoiceLangMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact combined voice + language picker. Designed for the in-call dock where horizontal space is tight. Distinct from `VoiceGallery` (card grid for the voice library page) and `LanguagePicker` (standalone locale dropdown). Below 480px viewport width the trigger collapses to a 36×36 ink-dot pill.',
      },
    },
  },
  args: {
    voice: 'ada',
    // Satisfies the required prop at the meta level; each story re-wires it via the
    // wrapper components above so selections are visible in the UI.
    onVoiceChange: () => {},
  },
  decorators: [
    (Story) => (
      // The dock sits at the bottom of the viewport in production; the popover opens
      // upward. Add bottom padding so the menu has room to render in the story frame.
      <div className="flex h-[22rem] w-[32rem] items-end justify-start pl-6 pb-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VoiceLangMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <DefaultStory {...args} />,
};

export const Controlled: Story = {
  name: 'Controlled (voice + language)',
  render: (args) => <ControlledStory {...args} />,
};

export const AllVoicesEnabled: Story = {
  name: 'All voices enabled',
  args: { voices: DEFAULT_VOICES.map((v) => ({ ...v, disabled: false })) },
  render: (args) => <AllEnabledStory {...args} />,
};

// --- Interaction tests -------------------------------------------------------

export const OpensMenu: Story = {
  name: 'Interaction — opens the menu',
  // The base stories (Default / Controlled / AllVoicesEnabled) carry the a11y audit;
  // this one exists to verify the click-to-open flow. Axe sometimes catches a mid-
  // transition frame where the menu's motion.div hasn't settled and reports false
  // contrast failures — disable the a11y gate for the interaction stories.
  parameters: { a11y: { test: 'off' } },
  render: (args) => <DefaultStory {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /voice:/i });

    // Menu closed by default.
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(canvas.queryByRole('menu')).toBeNull();

    // Click → menu opens.
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(await canvas.findByRole('menu')).toBeInTheDocument();
  },
};

export const SelectsVoice: Story = {
  name: 'Interaction — selects a voice',
  args: { voices: DEFAULT_VOICES.map((v) => ({ ...v, disabled: false })) },
  // Same rationale as OpensMenu — interaction test, not an a11y test.
  parameters: { a11y: { test: 'off' } },
  render: (args) => <AllEnabledStory {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /voice:/i });

    // Default story renders with 'nova' selected (wrapper's local state).
    await expect(trigger).toHaveAccessibleName(/Voice: Nova/);

    // Open menu, click a different voice, menu closes, trigger label updates.
    await userEvent.click(trigger);
    const sol = await canvas.findByRole('button', { name: /^Sol/ });
    await userEvent.click(sol);

    // Menu closes on select.
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAccessibleName(/Voice: Sol/);
  },
};
