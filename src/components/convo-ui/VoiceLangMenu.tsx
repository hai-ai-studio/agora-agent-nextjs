'use client';

import { useState, type KeyboardEvent, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePopover } from './hooks/usePopover';

// Compact combined voice + language menu. Sits inside the call-dock. Distinct from:
//  - VoiceGallery → card grid for the voice library page
//  - LanguagePicker → standalone language dropdown
// This one is a single ink-dot pill that opens a two-section menu (Voice over Language).

export interface VoiceLangMenuVoice {
  id: string;
  name: string;
  desc: string;
  disabled?: boolean;
}

export interface VoiceLangMenuLang {
  label: string;
  disabled?: boolean;
}

const DEFAULT_VOICES: VoiceLangMenuVoice[] = [
  { id: 'ada', name: 'Ada', desc: 'Warm, conversational' },
  { id: 'nova', name: 'Nova', desc: 'Crisp, professional', disabled: true },
  { id: 'sol', name: 'Sol', desc: 'Calm, thoughtful', disabled: true },
  { id: 'echo', name: 'Echo', desc: 'Playful, curious', disabled: true },
];

const DEFAULT_LANGS: VoiceLangMenuLang[] = [
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

export interface VoiceLangMenuProps {
  voice: string;
  onVoiceChange: (id: string) => void;
  /** Currently-selected language label. When undefined the component self-manages. */
  language?: string;
  onLanguageChange?: (label: string) => void;
  voices?: VoiceLangMenuVoice[];
  languages?: VoiceLangMenuLang[];
}

export function VoiceLangMenu({
  voice,
  onVoiceChange,
  language,
  onLanguageChange,
  voices = DEFAULT_VOICES,
  languages = DEFAULT_LANGS,
}: VoiceLangMenuProps) {
  const { open, setOpen, triggerRef, menuRef, handleMenuKeyDown } =
    usePopover<HTMLButtonElement, HTMLDivElement>();
  const [internalLang, setInternalLang] = useState<string>(
    languages.find((l) => !l.disabled)?.label ?? languages[0]?.label ?? '',
  );
  const effectiveLang = language ?? internalLang;
  const setLang = (next: string) => {
    if (onLanguageChange) onLanguageChange(next);
    else setInternalLang(next);
  };

  const current =
    voices.find((v) => v.id === voice && !v.disabled) ??
    voices.find((v) => !v.disabled) ??
    voices[0];

  return (
    <div className="relative mr-1 shrink-0">
      {/* Below 480px the trigger collapses to a 36×36 ink-dot pill to reclaim dock
          width; the menu itself is unchanged and `aria-label` keeps the full
          semantic label for screen readers. */}
      <button
        ref={triggerRef}
        type="button"
        className="flex h-9 w-52 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 font-ui text-xs font-medium text-foreground transition-colors duration-150 hover:border-border dark:bg-surface/10 max-[480px]:w-9 max-[480px]:justify-center max-[480px]:gap-0 max-[480px]:px-0"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Voice: ${current?.name ?? '—'}, language: ${effectiveLang}. Change voice or language.`}
      >
        <span className="size-2 shrink-0 rounded-full bg-foreground" />
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap max-[480px]:hidden">
          {current?.name}
        </span>
        <span className="mx-0.5 h-3.5 w-px shrink-0 bg-border max-[480px]:hidden" />
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-normal text-muted-foreground max-[480px]:hidden">
          {effectiveLang}
        </span>
        <span className="max-[480px]:hidden">
          <IconChevron />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <VoiceMenu
            menuRef={menuRef}
            onKeyDown={handleMenuKeyDown}
            voices={voices}
            languages={languages}
            voice={voice}
            onVoiceChange={onVoiceChange}
            lang={effectiveLang}
            onLangChange={setLang}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface VoiceMenuProps {
  menuRef: RefObject<HTMLDivElement | null>;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  voices: VoiceLangMenuVoice[];
  languages: VoiceLangMenuLang[];
  voice: string;
  onVoiceChange: (id: string) => void;
  lang: string;
  onLangChange: (l: string) => void;
  onClose: () => void;
}

// `disabled:text-muted-foreground` (not `disabled:opacity-50`) so disabled text stays
// AA-compliant; opacity would dim the foreground below the 4.5:1 threshold.
// `max-sm:py-1.5` — tighter vertical rhythm on phones where screen real estate is
// precious; the whole menu column needs to fit above the dock without pushing off-screen.
const OPT_BASE =
  'flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg border-none bg-transparent px-2.5 py-2 text-left font-ui text-xs text-foreground transition-colors duration-100 hover:bg-muted disabled:cursor-default disabled:text-muted-foreground disabled:hover:bg-transparent max-sm:py-1.5';

function VoiceMenu({
  menuRef,
  onKeyDown,
  voices,
  languages,
  voice,
  onVoiceChange,
  lang,
  onLangChange,
  onClose,
}: VoiceMenuProps) {
  return (
    <motion.div
      ref={menuRef}
      role="menu"
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute bottom-[calc(100%+12px)] left-0 z-10 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-surface/95 dark:bg-warm-7/90 dark:supports-[backdrop-filter]:bg-warm-7/80 max-sm:left-auto max-sm:right-0 max-sm:max-h-[60vh] max-sm:overflow-y-auto"
    >
      <div className="px-2.5 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        Voice
      </div>
      {voices.map((v) => (
        <button
          key={v.id}
          type="button"
          role="menuitem"
          className={`${OPT_BASE} focus-visible:bg-muted focus-visible:outline-none ${v.id === voice ? 'text-foreground' : ''}`}
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
            {/* Description hidden on phones — it's the biggest row-height
                contributor and the voice name alone is enough to disambiguate.
                Desktop keeps it for richer context. */}
            <div className="mt-0.5 text-xs text-muted-foreground max-sm:hidden">{v.desc}</div>
          </div>
          {v.id === voice && <span className="text-xs text-foreground">✓</span>}
          {v.disabled && <SoonBadge />}
        </button>
      ))}
      <div className="mx-1 my-1.5 h-px bg-border" />
      <div className="px-2.5 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        Language
      </div>
      {languages.map((l) => (
        <button
          key={l.label}
          type="button"
          role="menuitem"
          className={`${OPT_BASE} focus-visible:bg-muted focus-visible:outline-none ${l.label === lang ? 'text-foreground' : ''}`}
          disabled={l.disabled}
          aria-disabled={l.disabled}
          onClick={() => {
            if (l.disabled) return;
            onLangChange(l.label);
          }}
        >
          {l.label}
          {l.label === lang && <span className="text-xs text-foreground">✓</span>}
          {l.disabled && <SoonBadge />}
        </button>
      ))}
    </motion.div>
  );
}

function SoonBadge() {
  return (
    <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      Soon
    </span>
  );
}

export { DEFAULT_VOICES, DEFAULT_LANGS };
export default VoiceLangMenu;
