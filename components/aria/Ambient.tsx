'use client';

import type { AriaState } from './types';

// Drifting colored blobs + SVG grain overlay. State-tinted via the matching
// .ambient-{state} modifier; CSS in globals.css switches blob colors + opacity.
export function Ambient({ state }: { state: AriaState }) {
  return (
    <div className={`ambient ambient-${state}`} aria-hidden="true">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="grain" />
    </div>
  );
}
