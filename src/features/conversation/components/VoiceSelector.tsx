'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// V1: UI-only. The voice + language choices are not yet wired to the agent-invite
// backend — they exist to match the reference design and to reserve the data shape
// for when we plumb them through /api/invite-agent.

export interface Voice {
  id: string;
  name: string;
  desc: string;
  // Non-Ada voices are shown but not selectable — they're reserved for future release.
  disabled?: boolean;
}

interface Lang {
  label: string;
  disabled?: boolean;
}

const VOICES: Voice[] = [
  { id: 'ada', name: 'Ada', desc: 'Warm, conversational' },
  { id: 'nova', name: 'Nova', desc: 'Crisp, professional', disabled: true },
  { id: 'sol', name: 'Sol', desc: 'Calm, thoughtful', disabled: true },
  { id: 'echo', name: 'Echo', desc: 'Playful, curious', disabled: true },
];

const LANGS: Lang[] = [
  { label: 'English (US)' },
  { label: 'English (UK)', disabled: true },
  { label: '日本語', disabled: true },
  { label: 'Español', disabled: true },
  { label: 'Deutsch', disabled: true },
  { label: 'Français', disabled: true },
];

function IconChevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export interface VoiceSelectorProps {
  voice: string;
  onVoiceChange: (id: string) => void;
}

export function VoiceSelector({ voice, onVoiceChange }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<string>('English (US)');

  // Close when a click lands outside the popover — matches the reference behavior.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.voice-sel')) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  const current =
    VOICES.find((v) => v.id === voice && !v.disabled) ??
    VOICES.find((v) => !v.disabled) ??
    VOICES[0];

  return (
    <div className="voice-sel relative mr-1 shrink-0">
      {/* Below 480px the trigger collapses to a 36×36 ink-dot pill to reclaim dock width
          for the mic + transcript + end-call buttons on narrow phones. The popover menu
          itself is unchanged; `aria-label` is always set so screen readers keep the
          semantic label when the visible text is hidden. */}
      <button
        type="button"
        className="flex h-9 w-52 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-line bg-white/60 px-3.5 font-sans text-xs font-medium text-ink-2 transition-colors duration-150 hover:border-line-2 max-[480px]:w-9 max-[480px]:justify-center max-[480px]:gap-0 max-[480px]:px-0"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Voice: ${current.name}, language: ${lang}. Change voice or language.`}
      >
        <span className="size-2 shrink-0 rounded-full bg-ink" />
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap max-[480px]:hidden">
          {current.name}
        </span>
        <span className="mx-0.5 h-3.5 w-px shrink-0 bg-line-2 max-[480px]:hidden" />
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-normal text-ink-3 max-[480px]:hidden">
          {lang}
        </span>
        <span className="max-[480px]:hidden">
          <IconChevron />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <VoiceMenu
            voice={voice}
            onVoiceChange={onVoiceChange}
            lang={lang}
            onLangChange={setLang}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface VoiceMenuProps {
  voice: string;
  onVoiceChange: (id: string) => void;
  lang: string;
  onLangChange: (l: string) => void;
  onClose: () => void;
}

// Shared option row styling — used by both voice and language sections.
const OPT_BASE =
  'flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg border-none bg-transparent px-2.5 py-2 text-left font-sans text-xs text-ink-2 transition-colors duration-100 hover:bg-bg-2 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent';

function VoiceMenu({ voice, onVoiceChange, lang, onLangChange, onClose }: VoiceMenuProps) {
  return (
    <motion.div
      role="menu"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute bottom-[calc(100%+12px)] left-0 z-10 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/95 max-sm:left-auto max-sm:right-0"
    >
      <div className="px-2.5 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-widest text-ink-4">
        Voice
      </div>
      {VOICES.map((v) => (
        <button
          key={v.id}
          type="button"
          className={`${OPT_BASE} ${v.id === voice ? 'text-ink' : ''}`}
          disabled={v.disabled}
          aria-disabled={v.disabled}
          onClick={() => {
            if (v.disabled) return;
            onVoiceChange(v.id);
            onClose();
          }}
        >
          <div>
            <div className="text-sm font-medium">{v.name}</div>
            <div className="mt-0.5 text-xs text-ink-4">{v.desc}</div>
          </div>
          {v.id === voice && <span className="text-xs text-ink">✓</span>}
          {v.disabled && <SoonBadge />}
        </button>
      ))}
      <div className="mx-1 my-1.5 h-px bg-line" />
      <div className="px-2.5 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-widest text-ink-4">
        Language
      </div>
      {LANGS.map((l) => (
        <button
          key={l.label}
          type="button"
          className={`${OPT_BASE} ${l.label === lang ? 'text-ink' : ''}`}
          disabled={l.disabled}
          aria-disabled={l.disabled}
          onClick={() => {
            if (l.disabled) return;
            onLangChange(l.label);
          }}
        >
          {l.label}
          {l.label === lang && <span className="text-xs text-ink">✓</span>}
          {l.disabled && <SoonBadge />}
        </button>
      ))}
    </motion.div>
  );
}

function SoonBadge() {
  return (
    <span className="rounded border border-line-2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-4">
      Soon
    </span>
  );
}
