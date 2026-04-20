'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * SSR-safe subscription to a CSS media query. Re-renders the component when
 * the match state changes.
 *
 * Uses `useSyncExternalStore` rather than `useState + useEffect` so:
 *   - the initial render has the correct value (no "hydrated-then-flipped" flash),
 *   - the subscription is batched across React 19's concurrent renders, and
 *   - Server components get `defaultValue` without throwing on `window`.
 *
 * ```tsx
 * const isWide = useMediaQuery('(min-width: 900px)');
 * ```
 *
 * Common queries have dedicated wrappers below — prefer those for
 * consistency across the DS.
 */
export function useMediaQuery(query: string, defaultValue: boolean = false): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const m = window.matchMedia(query);
      m.addEventListener('change', notify);
      return () => m.removeEventListener('change', notify);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return defaultValue;
    return window.matchMedia(query).matches;
  }, [query, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * `prefers-color-scheme: dark` subscription. Defaults to `false` on the
 * server. Components that need to swap palette on OS theme change use this —
 * not to be confused with the `.dark` class, which is the manual / Storybook
 * toggle. Both are respected by the token layer.
 */
export function useIsDark(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)', false);
}

/**
 * `max-width: 767px` — matches Tailwind's `md` breakpoint boundary. True on
 * phones, false on tablets and up. Kept in sync with the Tailwind config so
 * the JS-side check agrees with `md:` utilities.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)', false);
}
