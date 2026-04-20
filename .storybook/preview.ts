import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import './preview.css';

/**
 * Storybook preview config. Loads the Tailwind CSS bundle (with convo-ui tokens + keyframes
 * + Google-hosted Geist fonts), wires the light/dark theme toggle via a `dark` class on the
 * stage, and preselects a paper-0 page background so the warm neutrals read accurately.
 *
 * The theme decorator flips a class on the story root element; Tailwind's `dark:` variant
 * picks it up. The component-level `darkMode: 'class'` setting in `tailwind.config.ts`
 * (the package-local one for Storybook, not the root app one) makes this work.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Vitest + addon-vitest runs axe against every story; `'error'` gates CI on a11y
    // violations. The 2-level text model (ADR 0005) removes the `foreground-subtle`
    // token that was below AA — both `foreground` and `muted-foreground` are now
    // AA-compliant on their paired surfaces. Flip back to `'todo'` only while
    // triaging a regression.
    a11y: { test: 'error' },
    // No default background — we want the iframe body's `background: var(--background)`
    // rule in preview.css to take over, so toggling the Storybook theme flips the bg
    // too. Stories that want a pinned bg (e.g. `backgrounds.default: 'fixed-dark'`) can
    // still opt in via story-level parameters.
    backgrounds: {
      values: [
        { name: 'fixed-light', value: '#fafaf7' },
        { name: 'fixed-dark', value: '#0a0a09' },
      ],
    },
    options: {
      storySort: {
        order: [
          'Foundations',
          'Signature',
          'Waveforms',
          'Status',
          'Controls',
          'Transcript',
          'Pickers',
          'Identity',
          'Tools',
          'Permission',
          'Playback',
          'Compositions',
          'Hooks',
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: { Light: '', Dark: 'dark' },
      defaultTheme: 'Light',
    }),
  ],
};

export default preview;
