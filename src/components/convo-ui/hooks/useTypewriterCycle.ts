'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export interface UseTypewriterCycleOptions {
  /** Per-character typing delay (ms). Default 60. */
  typeSpeedMs?: number;
  /** Per-character backspace delay (ms). Default 35 — deletes should feel faster than typing. */
  backspaceSpeedMs?: number;
  /** Hold duration after a phrase finishes typing, before backspace starts (ms). Default 2500. */
  holdMs?: number;
  /** Hold duration for the LAST phrase in the list before looping. Use this to linger on
   *  a reveal line longer than the others. Defaults to `holdMs`. */
  lastHoldMs?: number;
  /** Flip false to freeze on the first phrase without animating. Defaults true. */
  enabled?: boolean;
}

/**
 * useTypewriterCycle — types a phrase, holds, backspaces, types the next, loops.
 *
 * Designed for hero / headline accents where you want to show "this one thing is
 * actually a range of things" (e.g. cycling agent names to communicate "Ada is one
 * we built; yours is next"). Respects `prefers-reduced-motion` by freezing on the
 * first phrase — users who opted into reduced motion get a stable, readable page
 * that matches frame-zero of the animated version.
 *
 * Important: the `phrases` array identity matters for effect deps. Pass a module-level
 * constant or a memoized array to avoid re-running the animation on every parent render.
 * Internally the hook joins phrases into a stable dep string, so value equality is
 * sufficient even if the reference changes (e.g. inline literals).
 */
export function useTypewriterCycle(
  phrases: string[],
  options?: UseTypewriterCycleOptions,
): string {
  const {
    typeSpeedMs = 60,
    backspaceSpeedMs = 35,
    holdMs = 2500,
    lastHoldMs,
    enabled = true,
  } = options ?? {};
  const reduceMotion = useReducedMotion();
  const shouldAnimate = enabled && !reduceMotion;
  const [text, setText] = useState(phrases[0] ?? '');

  // Serialize phrases so inline-literal arrays don't retrigger the effect when
  // their reference changes but contents don't. \u0001 is never in normal text.
  const phrasesKey = phrases.join('\u0001');

  useEffect(() => {
    if (!shouldAnimate || phrases.length === 0) {
      setText(phrases[0] ?? '');
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const typePhrase = async (phrase: string) => {
      for (let i = 1; i <= phrase.length; i++) {
        if (cancelled) return;
        setText(phrase.slice(0, i));
        await wait(typeSpeedMs);
      }
    };

    const backspacePhrase = async (phrase: string) => {
      for (let i = phrase.length - 1; i >= 0; i--) {
        if (cancelled) return;
        setText(phrase.slice(0, i));
        await wait(backspaceSpeedMs);
      }
    };

    const run = async () => {
      // We render with the first phrase fully typed at mount — skip typing it
      // and start the loop at hold → backspace → next.
      let index = 0;
      while (!cancelled) {
        const phrase = phrases[index] ?? '';
        const isLast = index === phrases.length - 1;
        await wait(isLast ? (lastHoldMs ?? holdMs) : holdMs);
        if (cancelled) return;
        await backspacePhrase(phrase);
        if (cancelled) return;
        index = (index + 1) % phrases.length;
        const next = phrases[index] ?? '';
        await typePhrase(next);
      }
    };

    void run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // phrasesKey is a stable serialization; the actual array is read via closure at
    // effect-run time, which is exactly what we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAnimate, phrasesKey, typeSpeedMs, backspaceSpeedMs, holdMs, lastHoldMs]);

  return text;
}
