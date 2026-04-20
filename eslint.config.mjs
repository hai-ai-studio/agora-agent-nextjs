import coreWebVitals from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    // Storybook's static bundle + any workspace package build output. These are bundled
    // + minified artifacts, not our source; linting them produces thousands of false
    // positives. Add other build dirs (dist/, .next/ is already ignored) here if needed.
    ignores: [
      'packages/*/storybook-static/**',
      'packages/*/dist/**',
      'storybook-static/**',
    ],
  },
  ...coreWebVitals,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
