'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Scrollable streaming transcript — history entries fade in, then a live entry shows
// the in-progress turn with a blinking caret. Auto-scrolls to the tail on every append.
// Pure presentation: the consumer owns the history list and the active turn text.

export type TranscriptSpeaker = 'user' | 'agent';

export interface TranscriptEntry {
  speaker: TranscriptSpeaker;
  text: string;
  /** Stable key for React — use the upstream turn id when available. */
  key: string;
}

export interface TranscriptProps {
  entries: TranscriptEntry[];
  activeText: string;
  activeSpeaker: TranscriptSpeaker;
  /** Label shown above agent turns. Default: `Agent`. */
  agentName?: string;
  /** Label shown above user turns. Default: `You`. */
  userName?: string;
  /** Text rendered when no entries and no active turn exists. */
  emptyMessage?: string;
}

function labelFor(
  speaker: TranscriptSpeaker,
  agentName: string,
  userName: string,
): string {
  return speaker === 'user' ? userName : agentName;
}

export function Transcript({
  entries,
  activeText,
  activeSpeaker,
  agentName = 'Agent',
  userName = 'You',
  emptyMessage = 'Transcript will appear here once you start talking.',
}: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries.length, activeText]);

  const isEmpty = entries.length === 0 && !activeText;

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label="Conversation transcript"
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 pb-2 pt-1 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-border"
    >
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.div
            key={e.key}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {labelFor(e.speaker, agentName, userName)}
            </div>
            <div
              className={`text-sm leading-normal [text-wrap:pretty] ${
                e.speaker === 'user' ? 'italic text-muted-foreground' : 'text-foreground'
              }`}
            >
              {e.text}
            </div>
          </motion.div>
        ))}
        {activeText && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {labelFor(activeSpeaker, agentName, userName)}
            </div>
            <div className="text-sm leading-normal text-foreground [text-wrap:pretty]">
              {activeText}
              <motion.span
                className="ml-0.5 inline-block text-foreground"
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ duration: 0.9, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: 'linear' }}
              >
                ▍
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isEmpty && (
        <div className="mt-10 text-center font-display text-xs italic text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default Transcript;
