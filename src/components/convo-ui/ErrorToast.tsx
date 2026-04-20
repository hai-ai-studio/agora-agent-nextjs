'use client';

import type { ReactNode } from 'react';

// Fixed-position floating error banner. Top-center by default, centered red pill that
// floats above the layout with `role="alert"` so assistive tech announces it.
// Non-dismissible — the caller controls mount/unmount via conditional rendering.

export interface ErrorToastProps {
  children: ReactNode;
  /** Vertical anchor. Default `top`. */
  position?: 'top' | 'bottom';
  /** Override z-index when layered inside deeper stacks. Default `10`. */
  z?: number;
}

export function ErrorToast({
  children,
  position = 'top',
  z = 10,
}: ErrorToastProps) {
  const anchor = position === 'top' ? 'top-16' : 'bottom-16';
  return (
    <div
      role="alert"
      className={`fixed left-1/2 ${anchor} max-w-[min(90vw,28rem)] -translate-x-1/2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-center text-xs text-[#7f1d1d] shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:border-[rgba(239,68,68,0.35)] dark:bg-[rgba(239,68,68,0.12)] dark:text-[#fca5a5] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]`}
      style={{ zIndex: z }}
    >
      {children}
    </div>
  );
}

export default ErrorToast;
