'use client';

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

export interface AudioPlayerProps {
  duration?: number;
  title?: string;
  date?: string;
}

// Static pseudo-waveform: 56 bars with a repeatable sinusoidal envelope so the visual is
// stable (not random per mount). Real usage would feed in decoded peaks.
const BARS = 56;

/**
 * AudioPlayer — call-recording scrubber. Shows a static waveform as the backdrop; bars up
 * to the play-head get the voice gradient, the rest fall back to paper-3. Click anywhere
 * on the waveform to seek. Speed toggle cycles 1× / 1.5× / 2×.
 */
export function AudioPlayer({
  duration = 184,
  title = 'Call with Ada',
  date = 'Today 3:14 PM',
}: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(42);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  useEffect(() => {
    if (!playing) return;
    const int = setInterval(() => {
      setPos((p) => {
        const nxt = p + speed;
        if (nxt >= duration) {
          setPlaying(false);
          return duration;
        }
        return nxt;
      });
    }, 1000);
    return () => clearInterval(int);
  }, [playing, speed, duration]);

  const waveform = useMemo(
    () =>
      Array.from({ length: BARS }, (_, i) => {
        return 0.2 + (Math.sin(i * 0.4) * 0.5 + 0.5) * 0.6 + Math.sin(i * 1.3) * 0.15;
      }),
    [],
  );

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const progress = pos / duration;

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos(Math.floor(((e.clientX - rect.left) / rect.width) * duration));
  };

  // Keyboard scrubber — matches native <input type="range"> semantics so
  // screen-reader + keyboard users can operate the slider as expected.
  // Left/Right: ±1s. Shift+Left/Right: ±5s. Home/End: jump to start/end.
  const handleSliderKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1;
    let next = pos;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(0, pos - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(duration, pos + step);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = duration;
        break;
      case 'PageDown':
        next = Math.max(0, pos - duration * 0.1);
        break;
      case 'PageUp':
        next = Math.min(duration, pos + duration * 0.1);
        break;
      default:
        return;
    }
    e.preventDefault();
    setPos(Math.floor(next));
  };

  const cycleSpeed = () => {
    setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-foreground text-background shadow-sm"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <rect x="3" y="2" width="3" height="10" rx="0.5" />
              <rect x="8" y="2" width="3" height="10" rx="0.5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <path d="M4 2v10l8-5z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-foreground">{title}</div>
          <div className="font-mono text-[11px] text-muted-foreground">{date}</div>
        </div>
        <button
          type="button"
          onClick={cycleSpeed}
          className="cursor-pointer rounded-md border-0 bg-muted px-2 py-1 font-mono text-[11px] text-foreground"
          aria-label={`Playback speed ${speed}×`}
        >
          {speed}×
        </button>
      </div>
      <div>
        <div
          onClick={handleSeek}
          onKeyDown={handleSliderKeyDown}
          tabIndex={0}
          className="relative flex h-9 cursor-pointer items-center gap-0.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
          role="slider"
          aria-label="Scrub position"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={pos}
          aria-valuetext={`${fmt(pos)} of ${fmt(duration)}`}
        >
          {waveform.map((v, i) => {
            const h = Math.max(3, v * 36);
            const active = i / BARS < progress;
            const bg = active
              ? `linear-gradient(180deg, #7C5CFF, #E85C8A ${50 - i}%, #F5A55C)`
              : undefined;
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-colors duration-100 ${
                  active ? '' : 'bg-border'
                }`}
                style={{ height: h, background: bg }}
              />
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>{fmt(pos)}</span>
          <span>-{fmt(duration - pos)}</span>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
