'use client';

import type { DonationRecoveryEntry } from '@/lib/types';

const TYPE_LABELS: Record<DonationRecoveryEntry['donation_type'], string> = {
  whole_blood: 'Whole Blood',
  double_red: 'Double Red Cells',
  platelet: 'Platelet',
};

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function formatDelta(metric: string, value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${metric} ${sign}${value}`;
}

/**
 * Auto-computed "here's what happened after you donated" narrative — the
 * single feature users found most valuable in the source tool. One line per
 * subsequent lab draw, not just the first.
 */
export default function RecoveryTimeline({ entry }: { entry: DonationRecoveryEntry }) {
  const baselineEntries = Object.entries(entry.baseline);

  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {formatDate(entry.donation_date)} — {TYPE_LABELS[entry.donation_type]}
        </h3>
      </div>

      {baselineEntries.length === 0 ? (
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          No lab draw at or before this donation to use as a baseline yet.
        </p>
      ) : entry.timeline.length === 0 ? (
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          No follow-up lab draws yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {entry.timeline.map((point) => {
            const deltas = Object.entries(point.delta);
            if (deltas.length === 0) return null;
            return (
              <li key={point.date} className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                <span style={{ color: 'var(--color-sage)' }}>{point.days_later} days later:</span>{' '}
                {deltas.map(([metric, value]) => formatDelta(metric, value)).join(', ')}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
