'use client';

import type { CurrentDose } from '@/lib/types';

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** One compound's current dose — pulled live from medication_dose_periods
 *  WHERE end_date IS NULL. Read-only; edits go through UpdateDoseForm. */
export default function CurrentDoseCard({ dose }: { dose: CurrentDose }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      role="article"
      aria-label={`${dose.compound} current dose`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {dose.compound}
          </h3>
          <p className="text-base font-medium mt-0.5" style={{ color: 'var(--color-sage)' }}>
            {dose.dose}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Since {formatDate(dose.start_date)}
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-sage)' }}
        >
          {dose.days_at_dose} {dose.days_at_dose === 1 ? 'day' : 'days'}
        </span>
      </div>
      {dose.notes && (
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {dose.notes}
        </p>
      )}
    </div>
  );
}
