/**
 * Pearson correlation + confidence scoring — shared by every correlation
 * surface in src/lib/analysis (metric-vs-covariate, metric-vs-metric).
 *
 * Confidence exists because r on a tiny N is actively misleading (two points
 * always produce |r| = 1). It must be surfaced next to every displayed r,
 * not buried in a footnote — see getConfidence callers in
 * correlation-engine.ts.
 */

export interface PearsonResult {
  r: number | null;
  n: number;
}

export function pearson(pairs: ReadonlyArray<readonly [number, number]>): PearsonResult {
  const n = pairs.length;
  if (n < 2) return { r: null, n };

  const mx = mean(pairs.map(([x]) => x));
  const my = mean(pairs.map(([, y]) => y));

  let num = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  for (const [x, y] of pairs) {
    const dx = x - mx;
    const dy = y - my;
    num += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denom = Math.sqrt(sumSqX * sumSqY);
  return { r: denom === 0 ? null : num / denom, n };
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export type ConfidenceLevel = 'red' | 'yellow' | 'green';

export interface Confidence {
  level: ConfidenceLevel;
  label: string;
  note: string;
}

/**
 * N < 8 → exploratory only (a 2-point correlation can look like r = 1 and
 * mean nothing). N < 15 → moderate. Otherwise → high. Thresholds match the
 * TRT/PED tool this is ported from.
 */
export function getConfidence(n: number): Confidence {
  if (n < 8) {
    return {
      level: 'red',
      label: 'Exploratory only',
      note: `Exploratory only (N=${n}). Do not interpret as evidence of a relationship.`,
    };
  }
  if (n < 15) {
    return {
      level: 'yellow',
      label: 'Moderate confidence',
      note: `Moderate confidence (N=${n}) — a rough signal, not proof.`,
    };
  }
  return { level: 'green', label: 'High confidence', note: `High confidence (N=${n}).` };
}
