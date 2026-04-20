import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            // Force `prefers-reduced-motion: reduce` so Framer Motion transitions
            // collapse to instant in interaction tests. Without this, axe can snapshot
            // mid-animation frames where opacity/color haven't settled, producing
            // flaky color-contrast failures. Also pin the color scheme to `light` so
            // the `@media (prefers-color-scheme: dark)` in globals.css doesn't fire
            // on a headless Chromium that happens to report dark.
            instances: [
              {
                browser: 'chromium',
                contextOptions: {
                  reducedMotion: 'reduce',
                  colorScheme: 'light',
                },
              },
            ],
          },
        },
      },
    ],
  },
});
