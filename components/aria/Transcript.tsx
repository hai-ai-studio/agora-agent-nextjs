'use client';

import { useEffect, useRef } from 'react';
import { ARIA_AGENT_NAME } from './types';

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
  agentName = ARIA_AGENT_NAME,
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
      className="transcript"
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-label="Conversation transcript"
    >
      {entries.map((e) => (
        <div key={e.key} className={`bubble bubble-${e.speaker}`}>
          <div className="bubble-label">{labelFor(e.speaker, agentName)}</div>
          <div className="bubble-text">{e.text}</div>
        </div>
      ))}
      {activeText && (
        <div className={`bubble bubble-${activeSpeaker} bubble-active`}>
          <div className="bubble-label">
            {labelFor(activeSpeaker, agentName)}
            <span className="bubble-live">● live</span>
          </div>
          <div className="bubble-text">
            {activeText}
            <span className="caret">▍</span>
          </div>
        </div>
      )}
      {isEmpty && (
        <div className="transcript-empty">
          Transcript will appear here once you start talking.
        </div>
      )}
    </div>
  );
}
