'use client';

import { useState } from 'react';
import type { DonationInput } from '@/hooks/useDonations';
import type { DonationType } from '@/lib/types';

const TYPE_OPTIONS: { value: DonationType; label: string }[] = [
  { value: 'whole_blood', label: 'Whole Blood (56-day interval)' },
  { value: 'double_red', label: 'Double Red Cells (112-day interval)' },
  { value: 'platelet', label: 'Platelet (7-day interval)' },
];

interface DonationFormProps {
  onSubmit: (data: DonationInput) => Promise<unknown>;
  onCancel?: () => void;
}

const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  borderColor: 'var(--border-card)',
  color: 'var(--color-text-primary)',
};
const labelStyle = { color: 'var(--color-text-primary)' };

export default function DonationForm({ onSubmit, onCancel }: DonationFormProps) {
  const [donationDate, setDonationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [donationType, setDonationType] = useState<DonationType>('whole_blood');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        donation_date: donationDate,
        donation_type: donationType,
        notes: notes.trim() || undefined,
      });
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Log blood donation">
      <div>
        <label htmlFor="donation-date" className="block text-sm font-medium mb-1" style={labelStyle}>
          Donation Date <span style={{ color: 'var(--color-terracotta)' }}>*</span>
        </label>
        <input
          id="donation-date"
          type="date"
          value={donationDate}
          onChange={(e) => setDonationDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="donation-type" className="block text-sm font-medium mb-1" style={labelStyle}>
          Type
        </label>
        <select
          id="donation-type"
          value={donationType}
          onChange={(e) => setDonationType(e.target.value as DonationType)}
          className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={inputStyle}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="donation-notes" className="block text-sm font-medium mb-1" style={labelStyle}>
          Notes
        </label>
        <textarea
          id="donation-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional"
          className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none resize-none"
          style={inputStyle}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--color-terracotta), var(--color-terracotta-light))',
            color: 'white',
            boxShadow: '0 4px 14px rgba(224, 122, 95, 0.3)',
          }}
        >
          {submitting ? 'Saving...' : 'Log Donation'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            style={{ backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--border-card)' }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
