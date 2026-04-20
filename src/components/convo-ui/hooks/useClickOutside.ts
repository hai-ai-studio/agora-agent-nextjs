'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Dismiss-on-outside-click for popovers, dropdowns, sheets.
 *
 * The listener is `mousedown` (not `click`) so dismissal fires before focus
 * blur — dropdowns feel snappier when the menu closes on pointer-down rather
 * than waiting for the click cycle to finish. Gating on `active` means the
 * document listener only exists while the surface is open; when closed, there
 * is zero per-page overhead.
 *
 * Container identity is ref-based. Passing the wrapping element's ref gives
 * free multi-instance isolation — each popover has its own ref, and
 * `ref.contains(event.target)` answers "inside this one?" without any class
 * or id naming. Prior to this hook, callers hand-rolled `.closest('.some-class')`
 * checks to scope the listener; those are no longer needed.
 *
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, open, () => setOpen(false));
 *
 * return <div ref={ref}>…</div>;
 * ```
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onOutside: () => void,
): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      const node = ref.current;
      if (!node) return;
      if (node.contains(e.target as Node)) return;
      onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [active, ref, onOutside]);
}
