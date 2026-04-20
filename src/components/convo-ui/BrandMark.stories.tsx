import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrandMark } from './BrandMark';

const meta = {
  title: 'Identity/BrandMark',
  component: BrandMark,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Round ink chip with concentric-circle glyph + italic serif agent · product label. The recognizable top-left signature of landing + conversation screens. Use `labelSize="md"` for compact headers, `"sm"` for nav bars.',
      },
    },
  },
  args: { agentName: 'Ada', productName: 'Agora', size: 32, labelSize: 'lg' },
  argTypes: {
    size: { control: { type: 'range', min: 20, max: 64, step: 2 } },
    labelSize: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Medium: Story = { args: { labelSize: 'md' } };
export const Small: Story = { args: { labelSize: 'sm', size: 24 } };

export const CustomNames: Story = {
  args: { agentName: 'Sage', productName: 'Nimbus' },
  name: 'Custom agent + product',
};

export const InHeader: Story = {
  name: 'In a header bar',
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <BrandMark {...args} />
      <div className="font-mono text-xs tracking-[-0.01em] text-muted-foreground">
        End-to-end encrypted
      </div>
    </div>
  ),
};
