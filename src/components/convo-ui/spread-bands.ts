// Shared helper for mapping FFT bass/mid/treble triplets onto N horizontal bars.
// Lives in convo-ui (not features/) so any future audio-reactive component gets
// the same bar-shaping vocabulary. The function is pure: caller manages stable
// per-bar `seeds` (for decorrelated sparkle) and the frame time `t` — BarsWave
// does neither itself.

export interface SpreadBandsOptions {
  /**
   * Per-bar seeds (0-1) for decorrelated sparkle. Length should match barCount.
   * Keep stable across frames (e.g. `useState(() => seeds)` in the caller) so
   * neighbors don't dance in lockstep. When omitted, sparkle is phase-based only.
   */
  seeds?: number[];
  /** Current frame time in seconds. Drives the sparkle oscillator. */
  t?: number;
  /**
   * Per-bar random modulation amount (0-1). Result oscillates between
   * `1 - sparkle` and `1 + 0`, so sparkle=0.15 gives ±15% relative to 1.
   * Default 0.15. Set 0 to disable.
   */
  sparkle?: number;
  /**
   * Envelope shape across the bar row:
   *   'flat'    — no shaping, all bars equal.
   *   'center'  — middle bars taller, tapering to edges (classic meter look).
   * Default 'center'.
   */
  envelope?: 'flat' | 'center';
  /**
   * Noise gate threshold (0-1). Bands below this are treated as silence
   * (typical ambient-hum floor). Default 0.18.
   */
  noiseFloor?: number;
  /**
   * Post-gate compression curve:
   *   'square' — x², flattens quiet-but-above-floor sounds, lets peaks reach
   *              full scale. Default.
   *   'none'   — linear.
   */
  compression?: 'square' | 'none';
  /**
   * Gain multiplier applied after gate + compression. Squared values sit
   * near 0.1–0.3 for speech; multiplying by ~1.6 maps speech peaks to full
   * bar height via the envelope cap. Default 1.6.
   */
  gain?: number;
}

/**
 * Map a bass/mid/treble triplet across `barCount` bars using a center-mirror
 * spectrum-analyser layout. Bass dominates the center, treble the edges, mid
 * bridges between. Optional per-bar sparkle + center envelope add visual life.
 *
 * Returns a plain number[] with values in [0, 1], ready to feed into BarsWave's
 * `values` prop (BarsWave handles attack/release smoothing on top).
 */
export function spreadBandsToBarValues(
  bands: { bass: number; mid: number; treble: number },
  barCount: number,
  options: SpreadBandsOptions = {},
): number[] {
  const {
    seeds,
    t = 0,
    sparkle = 0.15,
    envelope = 'center',
    noiseFloor = 0.18,
    compression = 'square',
    gain = 1.6,
  } = options;

  // Noise gate — subtract the ambient floor and renormalize so speech fills the
  // 0-1 range instead of floating near 0.2-0.5.
  const floorScale = 1 / (1 - noiseFloor);
  const gate = (v: number) => Math.max(0, v - noiseFloor) * floorScale;
  const shape = compression === 'square' ? (v: number) => v * v : (v: number) => v;

  const bass = shape(gate(bands.bass));
  const mid = shape(gate(bands.mid));
  const treble = shape(gate(bands.treble));

  const values = new Array<number>(barCount);
  for (let i = 0; i < barCount; i++) {
    const phase = i / barCount;
    // 0 at center, 1 at edges — used both for band weighting and the envelope.
    const fromCenter = Math.abs(phase - 0.5) * 2;

    // Classic spectrum-analyser weighting: bass in the middle, treble at the
    // edges, mid straddles. Weights sum to ~1 across the row.
    const weightBass = Math.max(0, 1 - fromCenter * 1.6);
    const weightMid = Math.max(0, 1 - Math.abs(fromCenter - 0.5) * 2);
    const weightTreble = fromCenter;

    // Per-bar sparkle oscillator — range [(1 - sparkle), 1]. With seeds, each
    // bar gets its own phase offset so neighbors decorrelate.
    const seed = seeds?.[i] ?? 0;
    const sparkleMod =
      1 - sparkle + sparkle * (Math.sin(t * 10 + seed * 7 + i * 0.3) * 0.5 + 0.5);

    const raw =
      (bass * weightBass + mid * weightMid + treble * weightTreble) *
      sparkleMod *
      gain;

    const env = envelope === 'center' ? 1 - Math.pow(fromCenter, 1.8) : 1;

    values[i] = Math.min(1, raw * env);
  }
  return values;
}
