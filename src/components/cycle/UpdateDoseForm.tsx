'use client';

import { useState } from 'react';
import { CYCLE_COMPOUNDS } from '@/lib/cycle-compounds';
import type { UpdateDoseInput } from '@/hooks/useMedicationDoses';

interface UpdateDoseFormProps {
  onSubmit: (data: UpdateDoseInput) => Promise<unknown>;
  onCancel?: () => void;
  knownCompounds?: string[];
}

const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  borderColor: 'var(--border-card)',
  color: 'var(--color-text-primary)',
};
const labelStyle = { color: 'var(--color-text-primary)' };

/**
 * Deliberately single-compound: one dropdown, one dose, one effective date.
 * This constraint is what prevents the original "editing one compound reset
 * every other compound" bug from recurring — see medication-dose-periods.ts.
 */
export default function UpdateDoseForm({ onSubmit, onCancel, knownCompounds }: UpdateDoseFormProps) {
  const compoundOptions = knownCompounds?.length
    ? Array.from(new Set([...knownCompounds, ...CYCLE_COMPOUNDS]))
    : [...CYCLE_COMPOUNDS];

  const [compound, setCompound] = useState(compoundOptions[0] ?? 'Other');
  const [customCompound, setCustomCompound] = useState('');
  const [dose, setDose] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resolvedCompound = compound === 'Other' ? customCompound.trim() : compound;
  const canSubmit = resolvedCompound.length > 0 && dose.trim().length > 0 && startDate.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        compound: resolvedCompound,
        dose: dose.trim(),
        start_date: startDate,
        notes: notes.trim() || undefined,
      });
      setDose('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Update medication dose">
      <div>
        <label htmlFor="dose-compound" className="block text-sm font-medium mb-1" style={labelStyle}>
          Compound <span style={{ color: 'var(--color-terracotta)' }}>*</span>
        </label>
        <select
          id="dose-compound"
          value={compound}
          onChange={(e) => setCompound(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={inputStyle}
        >
          {compoundOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {compound === 'Other' && (
          <input
            type="text"
            value={customCompound}
            onChange={(e) => setCustomCompound(e.target.value)}
            placeholder="Compound name"
            className="w-full mt-2 px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={inputStyle}
          />
        )}
      </div>

      <div>
        <label htmlFor="dose-value" className="block text-sm font-medium mb-1" style={labelStyle}>
          New Dose <span style={{ color: 'var(--color-terracotta)' }}>*</span>
        </label>
        <input
          id="dose-value"
          type="text"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          placeholder='e.g. "120 mg/week", "500 IU 3x/week", "Stopped"'
          className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="dose-start-date" className="block text-sm font-medium mb-1" style={labelStyle}>
          Effective Date <span style={{ color: 'var(--color-terracotta)' }}>*</span>
        </label>
        <input
          id="dose-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="dose-notes" className="block text-sm font-medium mb-1" style={labelStyle}>
          Notes
        </label>
        <textarea
          id="dose-notes"
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
          disabled={submitting || !canSubmit}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--color-terracotta), var(--color-terracotta-light))',
            color: 'white',
            boxShadow: '0 4px 14px rgba(224, 122, 95, 0.3)',
          }}
        >
          {submitting ? 'Saving...' : 'Save Dose'}
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
