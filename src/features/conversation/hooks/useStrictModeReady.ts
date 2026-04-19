'use client';

import { useEffect, useState } from 'react';

// StrictMode guard. React 18+ in dev mounts every effect twice (mount → cleanup → mount);
// gating `useJoin`, `useLocalMicrophoneTrack`, and `AgoraVoiceAI.init()` on the returned
// flag prevents double-initialization and the audio-gap it produces.
//
// Why `setTimeout(fn, 0)` works: StrictMode fires cleanup synchronously before any pending
// timeout callback, so the first (fake) mount's timer is always cancelled — only the real
// second mount's timer fires. The consumer therefore observes `true` exactly once, on the
// real mount.
export function useStrictModeReady(): boolean {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
      setIsReady(false);
    };
  }, []);
  return isReady;
}
