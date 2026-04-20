import type { ReactElement } from 'react';

/**
 * Inline SVG icon set for design-system components. Each icon uses `currentColor` for
 * strokes/fills so consumers can control color via `text-*` utilities on the parent.
 * Keep width/height at 20 unless an icon semantically needs a different base size —
 * consumers scale via wrapper styling.
 */

const s = (children: ReactElement | ReactElement[]) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const Icons = {
  mic: s(
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  ),
  micOff: s(
    <path
      d="M9 9v2a3 3 0 0 0 4.5 2.6M15 11V6a3 3 0 0 0-6 0v1M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-1 3.5M12 18v3M3 3l18 18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />,
  ),
  phone: s(
    <path
      d="M5 4c0-.5.4-1 1-1h2.5c.4 0 .8.3.9.7l1.2 3.6c.1.4 0 .8-.3 1L8.8 9.8c1 2.1 2.7 3.8 4.8 4.8l1.5-1.5c.3-.3.7-.4 1-.3l3.6 1.2c.4.1.7.5.7.9V17c0 .5-.4 1-1 1h-2C10.5 18 6 13.5 6 6V4z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />,
  ),
  hangup: s(
    <path
      d="M3 13c2-2 5-3 9-3s7 1 9 3v2c0 .6-.4 1-1 1h-3c-.6 0-1-.4-1-1v-1.5c-1.2-.4-2.6-.5-4-.5s-2.8.1-4 .5V15c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1v-2z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />,
  ),
  speaker: s(
    <path
      d="M11 5 6 9H3v6h3l5 4V5zM15 9a4 4 0 0 1 0 6M18 6a7 7 0 0 1 0 12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />,
  ),
  video: s(
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 10 6-3v10l-6-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </>,
  ),
  pause: s(
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </>,
  ),
  play: s(<path d="M7 5v14l12-7-12-7z" fill="currentColor" />),
  more: s(
    <>
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    </>,
  ),
  settings: s(
    <>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>,
  ),
  captions: s(
    <>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 11h2M7 15h2M13 11h4M13 15h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>,
  ),
  chevronUp: s(
    <polyline
      points="18 15 12 9 6 15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />,
  ),
  close: s(
    <path
      d="M18 6 6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />,
  ),
} as const;

export type IconName = keyof typeof Icons;
