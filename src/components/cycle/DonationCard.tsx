'use client';

import type { Donation } from '@/lib/types';

const TYPE_LABELS: Record<Donation['donation_type'], string> = {
  whole_blood: 'Whole Blood',
  double_red: 'Double Red Cells',
  platelet: 'Platelet',
};

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function isFuture(dateStr: string): boolean {
  return dateStr > new Date().toISOString().slice(0, 10);
}

interface DonationCardProps {
  donation: Donation;
  onDelete: (id: string) => void;
}

export default function DonationCard({ donation, onDelete }: DonationCardProps) {
  const eligible = isFuture(donation.next_eligible_date);

  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
      role="article"
      aria-label={`Donation on ${donation.donation_date}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {formatDate(donation.donation_date)}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {TYPE_LABELS[donation.donation_type]}
          </p>
          <p className="text-xs mt-1.5" style={{ color: eligible ? 'var(--color-warning)' : 'var(--color-sage)' }}>
            {eligible
              ? `Next eligible ${formatDate(donation.next_eligible_date)}`
              : 'Eligible to donate again'}
          </p>
          {donation.notes && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {donation.notes}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(donation.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
          style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-terracotta)' }}
          aria-label={`Delete donation on ${donation.donation_date}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
