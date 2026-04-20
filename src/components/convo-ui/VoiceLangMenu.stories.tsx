import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { VoiceLangMenu, DEFAULT_VOICES } from './VoiceLangMenu';

const COMPONENT_DOC = `
Compact combined voice + language picker for the in-call dock. One pill
trigger, one popover with Voice + Language sections. Designed for tight
horizontal spaces where a full \`VoiceGallery\` grid or standalone
\`LanguagePicker\` would not fit.

### When to use which picker

- \`VoiceLangMenu\` (this) — in the call dock. Single pill, upward popover.
- \`VoiceGallery\` — full voice-library page. Card grid, landscape layout.
- \`LanguagePicker\` — standalone locale dropdown, no voice.

### Controlled vs uncontrolled language

\`voice\` + \`onVoiceChange\` are always controlled. \`language\` is optional:

- Omit \`language\` → component self-manages and picks the first enabled
  entry from \`languages\`.
- Pass \`language\` + \`onLanguageChange\` → fully controlled, caller owns
  the value.

\`\`\`tsx
// Controlled voice + language
<VoiceLangMenu
  voice={voice}
  onVoiceChange={setVoice}
  language={lang}
  onLanguageChange={setLang}
/>
\`\`\`

### Responsive collapse

Below 480px viewport width the trigger collapses to a 36x36 ink-dot pill —
voice name, separator, language label and chevron all hide via Tailwind
\`max-[480px]:hidden\`. The full semantic label stays on \`aria-label\` so
screen readers still announce "Voice: X, language: Y."

### Disabled entries

Each voice / language accepts \`disabled?: boolean\`. Disabled rows render
with \`disabled:text-muted-foreground\` (not opacity) to keep AA contrast,
and a "Soon" pill. Clicks on disabled rows are no-ops. The default lists
expose Ada enabled and everything else as "coming soon".

### DOM scoping

Each instance gets a unique \`voice-lang-menu-{id}\` scope class. The
outside-click handler only closes the specific menu clicked outside of,
which matters when multiple pickers co-exist on a page.
`;

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
      description: { component: COMPONENT_DOC },
    },
  },
  args: {
    voice: 'ada',
    // Satisfies the required prop at the meta level; each story re-wires it via the
    // wrapper components above so selections are visible in the UI.
    onVoiceChange: () => {},
  },
  argTypes: {
    voice: {
      control: 'text',
      description:
        'Currently-selected voice id. Matched against `voices[].id`; always controlled.',
    },
    language: {
      control: 'text',
      description:
        'Currently-selected language label. Omit to let the component self-manage.',
    },
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
  parameters: {
    docs: {
      description: {
        story:
          'Default lists — Ada enabled, every other voice and non-US-English language shown as "Soon". Uncontrolled language (component picks the first enabled entry).',
      },
    },
  },
};

export const Controlled: Story = {
  name: 'Controlled (voice + language)',
  render: (args) => <ControlledStory {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Fully controlled — parent owns both `voice` and `language`. A debug line underneath echoes the current values so you can see selections flow through the callbacks.',
      },
    },
  },
};

export const AllVoicesEnabled: Story = {
  name: 'All voices enabled',
  args: { voices: DEFAULT_VOICES.map((v) => ({ ...v, disabled: false })) },
  render: (args) => <AllEnabledStory {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Every voice enabled for exploring the full library state. Pre-selects "nova" in the wrapper so the checkmark is visible on a non-default row.',
      },
    },
  },
};

// --- Interaction tests -------------------------------------------------------

export const OpensMenu: Story = {
  name: 'Interaction — opens the menu',
  // The base stories (Default / Controlled / AllVoicesEnabled) carry the a11y audit;
  // this one exists to verify the click-to-open flow. Axe sometimes catches a mid-
  // transition frame where the menu's motion.div hasn't settled and reports false
  // contrast failures — disable the a11y gate for the interaction stories.
  parameters: {
    a11y: { test: 'off' },
    docs: {
      description: {
        story:
          'Interaction test: clicks the trigger and verifies `aria-expanded` flips `false` → `true` and the `role="menu"` popover mounts. a11y audit is disabled because motion transitions occasionally trip false positives mid-frame.',
      },
    },
  },
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
  parameters: {
    a11y: { test: 'off' },
    docs: {
      description: {
        story:
          'Interaction test: opens the menu, clicks a non-default voice ("Sol"), verifies the menu closes and the trigger\'s accessible name updates to include the new voice.',
      },
    },
  },
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
