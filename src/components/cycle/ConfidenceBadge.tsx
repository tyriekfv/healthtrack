'use client';

import type { Confidence } from '@/lib/types';

const LEVEL_COLOR: Record<Confidence['level'], string> = {
  red: 'var(--color-terracotta)',
  yellow: 'var(--color-warning)',
  green: 'var(--color-sage)',
};

/**
 * Surfaced next to every displayed r value, not buried in a footnote — a
 * correlation on N=2 can look like r=1.0 and mean nothing (see
 * src/lib/analysis/pearson.ts's getConfidence).
 */
export default function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const color = LEVEL_COLOR[confidence.level];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: 'var(--color-cream)', color }}
      title={confidence.note}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {confidence.label}
    </span>
  );
}
