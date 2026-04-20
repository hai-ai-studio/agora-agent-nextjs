'use client';

import type { ReactNode } from 'react';

export type IconButtonVariant =
  | 'default'
  | 'ghost'
  | 'danger'
  | 'voice'
  | 'dark';

export interface IconButtonProps {
  icon: ReactNode;
  label?: string;
  variant?: IconButtonVariant;
  active?: boolean;
  onClick?: () => void;
  size?: number;
}

// Variant → class map. `active` overrides background + foreground to the default-active
// treatment regardless of the underlying variant, which matches the reference behavior.
const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  default: 'bg-surface text-foreground border border-border shadow-sm',
  ghost: 'bg-transparent text-foreground border border-transparent',
  danger: 'bg-danger text-accent-foreground border-0 shadow-md',
  voice: 'bg-warm-6 text-accent-foreground border-0 shadow-md',
  dark: 'bg-warm-9 text-foreground border border-warm-10 shadow-sm',
};

/**
 * IconButton — round button for dock controls and one-offs. `variant` picks the baseline
 * treatment; `active` always wins and flips to dark-fill + white-icon so users can see a
 * pressed state (used for muted mic, active transcript toggle, etc.). Lift-on-hover via
 * Tailwind `hover:-translate-y-px` keeps the press feedback uniform across variants.
 */
export function IconButton({
  icon,
  label,
  variant = 'default',
  active,
  onClick,
  size = 48,
}: IconButtonProps) {
  const variantClass = active
    ? 'bg-warm-6 text-accent-foreground border-0 shadow-md'
    : VARIANT_CLASSES[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      style={{ width: size, height: size }}
      className={`relative flex cursor-pointer items-center justify-center rounded-full transition-all duration-200 ease-voice-out hover:-translate-y-px ${variantClass}`}
    >
      {icon}
    </button>
  );
}

export default IconButton;
