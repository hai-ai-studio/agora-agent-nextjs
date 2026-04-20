'use client';

import { useState } from 'react';
import { VoiceCard } from './VoiceCard';

export interface VoiceGalleryProps {
  compact?: boolean;
}

// 6 preset voice personas. Each has a signature gradient that gets reused in the avatar
// and (elsewhere in the DS) in the session row avatars so one voice reads the same across
// screens. Tags drive the uppercase chip row at the bottom of each card.
export const VOICES = [
  {
    name: 'Ada',
    descriptor: 'Warm · Conversational',
    tags: ['female', 'en-US'],
    accent: 'linear-gradient(135deg, #7C5CFF, #E85C8A)',
  },
  {
    name: 'Kai',
    descriptor: 'Calm · Deliberate',
    tags: ['male', 'en-US'],
    accent: 'linear-gradient(135deg, #3D6BCC, #7C5CFF)',
  },
  {
    name: 'Nova',
    descriptor: 'Bright · Energetic',
    tags: ['female', 'en-GB'],
    accent: 'linear-gradient(135deg, #F5A55C, #E85C8A)',
  },
  {
    name: 'Onyx',
    descriptor: 'Deep · Authoritative',
    tags: ['male', 'en-US'],
    accent: 'linear-gradient(135deg, #2A2924, #6B6862)',
  },
  {
    name: 'Sage',
    descriptor: 'Thoughtful · Measured',
    tags: ['neutral', 'en-US'],
    accent: 'linear-gradient(135deg, #2E8B5C, #7C5CFF)',
  },
  {
    name: 'Echo',
    descriptor: 'Youthful · Friendly',
    tags: ['female', 'en-US'],
    accent: 'linear-gradient(135deg, #E85C8A, #F5A55C)',
  },
] as const;

/**
 * VoiceGallery — 6-card grid (or 4 in `compact` mode). Tracks two pieces of state locally:
 * `selected` is the committed voice (persists across renders); `previewing` is a transient
 * audio-preview toggle that only one card can hold at a time.
 */
export function VoiceGallery({ compact = false }: VoiceGalleryProps) {
  const [selected, setSelected] = useState<string>('Ada');
  const [previewing, setPreviewing] = useState<string | null>(null);
  const list = compact ? VOICES.slice(0, 4) : VOICES;
  return (
    <div
      className={`grid gap-2.5 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}
    >
      {list.map((v) => (
        <VoiceCard
          key={v.name}
          {...v}
          tags={[...v.tags]}
          selected={selected === v.name}
          previewActive={previewing === v.name}
          onSelect={() => setSelected(v.name)}
          onPreview={() =>
            setPreviewing(previewing === v.name ? null : v.name)
          }
        />
      ))}
    </div>
  );
}

export default VoiceGallery;
