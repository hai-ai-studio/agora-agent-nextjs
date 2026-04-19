'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ADA_AGENT_NAME } from './aria-state';

export type TranscriptSpeaker = 'user' | 'agent';

export interface TranscriptEntry {
  speaker: TranscriptSpeaker;
  text: string;
  // Stable key for React — use the upstream turn_id when available.
  key: string;
}

export interface TranscriptProps {
  entries: TranscriptEntry[];
  activeText: string;
  activeSpeaker: TranscriptSpeaker;
  agentName?: string;
}

function labelFor(speaker: TranscriptSpeaker, agentName: string): string {
  return speaker === 'user' ? 'You' : agentName;
}

export function Transcript({
  entries,
  activeText,
  activeSpeaker,
  agentName = ADA_AGENT_NAME,
}: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Follow the tail as new entries or live characters arrive.
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
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 pb-2 pt-1 [scrollbar-color:var(--line-2)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-line-2"
    >
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.div
            key={e.key}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-[5px]"
          >
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-4">
              {labelFor(e.speaker, agentName)}
            </div>
            <div
              className={`text-[14.5px] leading-[1.5] [text-wrap:pretty] ${
                e.speaker === 'user' ? 'italic text-ink-3' : 'text-ink'
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
            className="flex flex-col gap-[5px]"
          >
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-4">
              {labelFor(activeSpeaker, agentName)}
              <motion.span
                className="text-[9px] tracking-[0.05em] text-pill-listen"
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              >
                ● live
              </motion.span>
            </div>
            <div className="text-[14.5px] leading-[1.5] text-ink [text-wrap:pretty]">
              {activeText}
              <motion.span
                className="ml-0.5 inline-block text-ink"
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
        <div className="mt-10 text-center font-serif text-[13px] italic text-ink-4">
          Transcript will appear here once you start talking.
        </div>
      )}
    </div>
  );
}
