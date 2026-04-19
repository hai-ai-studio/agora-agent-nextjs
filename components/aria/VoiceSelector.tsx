'use client';

import { useEffect, useState } from 'react';

// V1: UI-only. The voice + language choices are not yet wired to the agent-invite
// backend — they exist to match the reference design and to reserve the data shape
// for when we plumb them through /api/invite-agent.

export interface Voice {
  id: string;
  name: string;
  desc: string;
}

const VOICES: Voice[] = [
  { id: 'aria', name: 'Aria', desc: 'Warm, conversational' },
  { id: 'nova', name: 'Nova', desc: 'Crisp, professional' },
  { id: 'sol', name: 'Sol', desc: 'Calm, thoughtful' },
  { id: 'echo', name: 'Echo', desc: 'Playful, curious' },
];

const LANGS = [
  'English (US)',
  'English (UK)',
  '日本語',
  'Español',
  'Deutsch',
  'Français',
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

  const current = VOICES.find((v) => v.id === voice) ?? VOICES[0];

  return (
    <div className="voice-sel">
      <button
        type="button"
        className="voice-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="voice-dot" />
        <span>{current.name}</span>
        <span className="voice-divider" />
        <span className="voice-lang">{lang}</span>
        <IconChevron />
      </button>
      {open && (
        <div className="voice-menu" role="menu">
          <div className="voice-menu-label">Voice</div>
          {VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`voice-opt ${v.id === voice ? 'voice-opt-active' : ''}`}
              onClick={() => {
                onVoiceChange(v.id);
                setOpen(false);
              }}
            >
              <div>
                <div className="voice-opt-name">{v.name}</div>
                <div className="voice-opt-desc">{v.desc}</div>
              </div>
              {v.id === voice && <span className="voice-check">✓</span>}
            </button>
          ))}
          <div className="voice-menu-divider" />
          <div className="voice-menu-label">Language</div>
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              className={`voice-opt voice-opt-lang ${l === lang ? 'voice-opt-active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l}
              {l === lang && <span className="voice-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
