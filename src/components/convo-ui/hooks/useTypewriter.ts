'use client';

import { useEffect, useState } from 'react';

/**
 * useTypewriter — progressively reveals `fullText` one character at a time on a jittered
 * interval. When `trigger` flips false, the hook short-circuits to the full text (so the
 * reveal can be disabled at runtime without a state dance). Per-tick delay is `speed`
 * plus up to 40ms of random jitter so the typing feels organic rather than metronomic.
 */
export function useTypewriter(
  fullText: string,
  speed = 30,
  trigger = true,
): string {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!trigger) {
      setDisplayed(fullText);
      return;
    }
    setDisplayed('');
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i < fullText.length) {
        timer = setTimeout(tick, speed + Math.random() * 40);
      }
    };
    const start = setTimeout(tick, 200);
    return () => {
      cancelled = true;
      clearTimeout(start);
      if (timer) clearTimeout(timer);
    };
  }, [fullText, speed, trigger]);

  return displayed;
}
