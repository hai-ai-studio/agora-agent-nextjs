'use client';

import { useEffect, useRef, useState } from 'react';

export interface LanguagePickerProps {
  selected?: string;
  onChange?: (code: string) => void;
}

export const LANGS = [
  { code: 'en-US', label: 'English', accent: 'United States', flag: '🇺🇸' },
  { code: 'en-GB', label: 'English', accent: 'United Kingdom', flag: '🇬🇧' },
  { code: 'es-ES', label: 'Español', accent: 'España', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'Français', accent: 'France', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Deutsch', accent: 'Deutschland', flag: '🇩🇪' },
  { code: 'ja-JP', label: '日本語', accent: '日本', flag: '🇯🇵' },
  { code: 'zh-CN', label: '中文', accent: '简体', flag: '🇨🇳' },
  { code: 'ko-KR', label: '한국어', accent: '대한민국', flag: '🇰🇷' },
] as const;

/**
 * LanguagePicker — dropdown showing flag + locale label + regional accent. Uses the same
 * click-outside pattern as VoiceLangMenu / MicPicker: one ref on the container,
 * a document-level mousedown listener, unregister on close. `popover` isn't used (still
 * patchy browser support for the HTML popover API + positioning nuances).
 */
export function LanguagePicker({
  selected = 'en-US',
  onChange,
}: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(selected);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const current = LANGS.find((l) => l.code === sel) ?? LANGS[0];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-w-[11.25rem] cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 font-ui text-[13px] text-foreground"
      >
        <span className="text-base">{current.flag}</span>
        <span className="flex-1 text-left">
          <span className="font-medium">{current.label}</span>
          <span className="ml-1.5 text-[11px] text-muted-foreground">
            {current.accent}
          </span>
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="m3 5 3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[17.5rem] overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-lg"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={sel === l.code}
              onClick={() => {
                setSel(l.code);
                setOpen(false);
                onChange?.(l.code);
              }}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 px-2.5 py-1.5 text-left font-ui text-[13px] text-foreground ${
                sel === l.code ? 'bg-muted' : 'bg-transparent'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="font-medium">{l.label}</span>
              <span className="text-[11px] text-muted-foreground">{l.accent}</span>
              {sel === l.code && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  className="ml-auto"
                  aria-hidden="true"
                >
                  <path
                    d="m2 6 3 3 5-6"
                    stroke="var(--voice-a)"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguagePicker;
