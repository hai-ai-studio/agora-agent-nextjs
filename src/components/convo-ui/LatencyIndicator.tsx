export interface LatencyIndicatorProps {
  ms: number;
}

type Quality = 'good' | 'ok' | 'poor';

// Bar-index cutoff for each quality tier: good = 4 active bars, ok = 3, poor = 2.
const ACTIVE_BARS: Record<Quality, number> = { good: 4, ok: 3, poor: 2 };
// Per-quality active color (ok / warn / err semantic tokens).
const COLOR_CLASS: Record<Quality, string> = {
  good: 'bg-success',
  ok: 'bg-warning',
  poor: 'bg-danger',
};

// Ascending bar heights — classic signal-bar visual.
const BAR_HEIGHTS = [4, 7, 10, 13];

/**
 * LatencyIndicator — 4 signal bars + ms readout. Color + filled-bar count reflect
 * a quality tier (<200ms = good, <500ms = ok, else poor). Pure Tailwind; inactive
 * bars fall back to `paper-3` so the bar shape still reads even at the worst tier.
 */
export function LatencyIndicator({ ms }: LatencyIndicatorProps) {
  const q: Quality = ms < 200 ? 'good' : ms < 500 ? 'ok' : 'poor';
  const activeCount = ACTIVE_BARS[q];
  const activeClass = COLOR_CLASS[q];

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
      <span className="inline-flex items-end gap-0.5" aria-hidden="true">
        {BAR_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className={`w-0.5 rounded-sm ${i < activeCount ? activeClass : 'bg-border'}`}
            style={{ height: h }}
          />
        ))}
      </span>
      <span>{ms}ms</span>
    </div>
  );
}

export default LatencyIndicator;
