'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useMenuKeyboardNav } from './useMenuKeyboardNav';

export interface UsePopoverResult<
  T extends HTMLElement = HTMLElement,
  M extends HTMLElement = HTMLElement,
> {
  /** Whether the popover is open. */
  open: boolean;
  /** Setter — call with `true` / `false` or a toggler `(o) => !o`. */
  setOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  /** Attach to the trigger button. Receives focus back when the menu closes via Escape. */
  triggerRef: RefObject<T | null>;
  /**
   * Attach to the menu container (the element with `role="menu"`). Outside-
   * click detection and keyboard navigation both scope to this element.
   */
  menuRef: RefObject<M | null>;
  /** Wire to the menu container's `onKeyDown`. Handles Escape + arrow navigation. */
  handleMenuKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
}

/**
 * One-stop hook for the standard popover menu pattern: a trigger button that
 * opens a `role="menu"` surface with `role="menuitem"` children. Bundles
 * outside-click dismissal + `useMenuKeyboardNav` (Escape + ArrowUp/Down +
 * Home/End + auto-focus on open) behind one API, plus owns the `open` state.
 *
 * Multiple instances on the same page work out of the box — outside-click
 * scoping is ref-based, so each popover is naturally isolated without any
 * per-instance class names or ids.
 *
 * The outside-click handler excludes BOTH the trigger and the menu from the
 * "outside" set. Without the trigger exclusion, clicking the trigger while
 * the menu is open would fire dismiss (menu closes) and then toggle (menu
 * re-opens) back-to-back — the trigger's own click can't close the menu.
 * Including it means trigger clicks behave naturally (toggles the existing
 * state) while genuine outside clicks dismiss.
 *
 * ```tsx
 * const { open, setOpen, triggerRef, menuRef, handleMenuKeyDown } = usePopover();
 *
 * return (
 *   <>
 *     <button
 *       ref={triggerRef}
 *       onClick={() => setOpen((o) => !o)}
 *       aria-haspopup="menu"
 *       aria-expanded={open}
 *     >
 *       …
 *     </button>
 *     {open && (
 *       <div ref={menuRef} role="menu" onKeyDown={handleMenuKeyDown}>
 *         <button type="button" role="menuitem" onClick={pick}>…</button>
 *       </div>
 *     )}
 *   </>
 * );
 * ```
 *
 * For popovers that don't follow the menu ARIA pattern (e.g. a disclosure that
 * shows a richer panel), use `useClickOutside` directly and skip this hook.
 */
export function usePopover<
  T extends HTMLElement = HTMLElement,
  M extends HTMLElement = HTMLElement,
>(): UsePopoverResult<T, M> {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<T | null>(null);
  const menuRef = useRef<M | null>(null);

  // Outside-click dismissal, scoped across both the trigger and the menu.
  // Not using `useClickOutside` directly because that helper takes a single
  // ref; we need "inside" to mean "inside either of these two elements".
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMenuKeyDown = useMenuKeyboardNav({
    open,
    setOpen,
    menuRef,
    triggerRef,
  });

  return { open, setOpen, triggerRef, menuRef, handleMenuKeyDown };
}
