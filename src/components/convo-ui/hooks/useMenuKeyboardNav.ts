'use client';

import { useEffect, useCallback, type RefObject, type KeyboardEvent } from 'react';

/**
 * Keyboard-navigation glue for popover menus with `role="menu"` containers and
 * `role="menuitem"` children. Handles the standard ARIA menu keyboard model:
 *
 *   - When the menu opens, focus moves to the first enabled item.
 *   - ArrowDown / ArrowUp cycle through enabled items (wrap at ends).
 *   - Home / End jump to first / last item.
 *   - Escape closes the menu and returns focus to the trigger.
 *
 * Wire-up (both refs owned by the caller):
 *
 * ```tsx
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * const menuRef = useRef<HTMLDivElement>(null);
 * const handleKeyDown = useMenuKeyboardNav({
 *   open, setOpen, menuRef, triggerRef,
 * });
 *
 * <button ref={triggerRef}>…</button>
 * {open && <div ref={menuRef} role="menu" onKeyDown={handleKeyDown}>…</div>}
 * ```
 *
 * Children must carry `role="menuitem"`. Disabled items (`:disabled` or
 * `aria-disabled="true"`) are skipped during ArrowUp/Down navigation.
 */
export function useMenuKeyboardNav({
  open,
  setOpen,
  menuRef,
  triggerRef,
}: {
  open: boolean;
  setOpen: (next: boolean) => void;
  menuRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
}) {
  // Auto-focus first enabled item when the menu opens.
  useEffect(() => {
    if (!open) return;
    // Defer one tick so AnimatePresence mount + DOM layout settle before we
    // query items.
    const id = window.requestAnimationFrame(() => {
      const items = getEnabledItems(menuRef.current);
      items[0]?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, menuRef]);

  return useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (
        e.key !== 'ArrowDown' &&
        e.key !== 'ArrowUp' &&
        e.key !== 'Home' &&
        e.key !== 'End'
      ) {
        return;
      }
      const items = getEnabledItems(menuRef.current);
      if (items.length === 0) return;
      e.preventDefault();
      const currentIdx = items.indexOf(
        document.activeElement as HTMLElement,
      );
      let nextIdx: number;
      switch (e.key) {
        case 'ArrowDown':
          nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % items.length;
          break;
        case 'ArrowUp':
          nextIdx =
            currentIdx < 0
              ? items.length - 1
              : (currentIdx - 1 + items.length) % items.length;
          break;
        case 'Home':
          nextIdx = 0;
          break;
        case 'End':
          nextIdx = items.length - 1;
          break;
        default:
          return;
      }
      items[nextIdx]?.focus();
    },
    [menuRef, setOpen, triggerRef],
  );
}

function getEnabledItems(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  ).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-disabled') !== 'true',
  );
}
