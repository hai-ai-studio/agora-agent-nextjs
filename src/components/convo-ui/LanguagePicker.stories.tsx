import type { Meta, StoryObj } from '@storybook/react-vite';
import { LanguagePicker } from './LanguagePicker';

const COMPONENT_DOC = `
Dropdown for picking a conversation locale. Button shows the current flag
+ label + regional accent; opening reveals the full list of 8 presets.

### Usage

\`\`\`tsx
<LanguagePicker selected="en-US" onChange={(code) => setLocale(code)} />
\`\`\`

\`selected\` is the initial code only — the component holds its own internal
state after that. \`onChange\` fires whenever a row is clicked.

### Preset locales

Exported from the module as \`LANGS\`. Each entry is a \`{ code, label,
accent, flag }\` tuple:

- \`en-US\` / \`en-GB\` — English (US, UK)
- \`es-ES\`, \`fr-FR\`, \`de-DE\` — Spanish, French, German
- \`ja-JP\`, \`zh-CN\`, \`ko-KR\` — Japanese, Chinese (Simplified), Korean

Labels render in their native script (日本語, 中文, 한국어), with the accent
text — "United States", "United Kingdom", "简体" — rendered in the muted
tone next to it.

### Close behaviour

Uses the same click-outside pattern as the rest of the picker family
(\`VoiceLangMenu\`, \`MicPicker\`): one container ref, a document-level
\`mousedown\` listener that clears \`open\` when the target sits outside the
ref. The HTML \`popover\` API isn't used — browser support is still patchy
and positioning is more ergonomic with absolute layout here.

### Accessibility

- Trigger: \`aria-haspopup="listbox"\`, \`aria-expanded\`.
- Menu: \`role="listbox"\`, each row \`role="option"\` with \`aria-selected\`.
- Selected row gets a checkmark rendered in \`var(--voice-a)\`.
`;

const meta = {
  title: 'Pickers/LanguagePicker',
  component: LanguagePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: { component: COMPONENT_DOC },
    },
  },
  args: { selected: 'en-US' },
  argTypes: {
    selected: {
      control: 'select',
      options: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN', 'ko-KR'],
      description:
        'Initial locale code. Internal state takes over after mount; subsequent changes are surfaced via `onChange`.',
    },
  },
  // Story frame needs vertical space so the open dropdown has somewhere to land.
  decorators: [
    (Story) => (
      <div style={{ paddingBottom: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LanguagePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'English (US) preselected. Click the trigger to open the listbox, click outside (or pick a row) to close.',
      },
    },
  },
};

export const Japanese: Story = {
  args: { selected: 'ja-JP' },
  parameters: {
    docs: {
      description: {
        story:
          'Japanese preselected — shows the native-script label rendering (日本語 / 日本) for CJK locales.',
      },
    },
  },
};

export const Chinese: Story = {
  args: { selected: 'zh-CN' },
  parameters: {
    docs: {
      description: {
        story:
          'Simplified Chinese preselected. Pairs the 中文 label with the 简体 accent suffix to disambiguate from Traditional.',
      },
    },
  },
};
