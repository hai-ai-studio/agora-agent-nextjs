/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind v4 — the PostCSS integration lives in its own package now. Next.js's
    // PostCSS pipeline picks this up automatically via next.config.mjs.
    '@tailwindcss/postcss': {},
  },
};

export default config;
