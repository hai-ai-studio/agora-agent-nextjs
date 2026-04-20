import type { Meta, StoryObj } from '@storybook/react-vite';
import { LanguagePicker } from './LanguagePicker';

const meta = {
  title: 'Pickers/LanguagePicker',
  component: LanguagePicker,
  parameters: { layout: 'centered' },
  args: { selected: 'en-US' },
  argTypes: {
    selected: {
      control: 'select',
      options: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN', 'ko-KR'],
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

export const Default: Story = {};
export const Japanese: Story = { args: { selected: 'ja-JP' } };
export const Chinese: Story = { args: { selected: 'zh-CN' } };
