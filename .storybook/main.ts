import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

/**
 * Storybook 10 is Vite-only in this project (no webpack builder installed). The React
 * framework adapter auto-wires @vitejs/plugin-react. `essentials` is gone in SB 10 —
 * its features (actions / backgrounds / controls / viewport / measure / outline) now
 * ship with the core, so we only list the extras we actually want.
 *
 * Tailwind v4 is injected via @tailwindcss/vite in `viteFinal`. The alternative would be
 * a PostCSS pipeline (which Vite also supports), but the Vite plugin is the v4 idiom and
 * produces a smaller, faster CSS bundle.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-vitest'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  viteFinal: async (config) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(tailwindcss());
    return config;
  },
};

export default config;
