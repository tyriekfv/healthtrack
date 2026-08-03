'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Allergy } from '@/lib/types';
import AddAllergyForm, { type AddAllergyFormData } from './AddAllergyForm';

const SEVERITY_COLORS: Record<string, string> = {
  mild: 'var(--color-sage)',
  moderate: 'var(--color-warning)',
  severe: '#F97316',
  life_threatening: 'var(--color-terracotta)',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface AllergyCardProps {
  allergy: Allergy;
  onUpdate: (id: string, updates: Partial<Allergy>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function AllergyCard({ allergy, onUpdate, onDelete }: AllergyCardProps) {
  const t = useTranslations('allergies');
  const tCommon = useTranslations('common');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUpdate = async (data: AddAllergyFormData) => {
    await onUpdate(allergy.id, {
      name: data.name,
      severity: data.severity,
      reaction: data.reaction || null,
      diagnosed_date: data.diagnosed_date || null,
      notes: data.notes || null,
      rxcui: data.rxcui ?? null,
    });
    setEditing(false);
  };

  const severityColor = SEVERITY_COLORS[allergy.severity] ?? 'var(--color-text-muted)';

  if (editing) {
    return (
      <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('card.editAllergy')}</h3>
        <AddAllergyForm
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel={t('card.saveChanges')}
          initialValues={{
            name: allergy.name,
            severity: allergy.severity,
            reaction: allergy.reaction ?? '',
            diagnosed_date: allergy.diagnosed_date ?? '',
            notes: allergy.notes ?? '',
            rxcui: allergy.rxcui,
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {allergy.name}
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${severityColor}20`, color: severityColor }}
            >
              {t(`severity.${allergy.severity}`)}
            </span>
          </div>
          {allergy.reaction && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('card.reaction', { reaction: allergy.reaction })}</p>
          )}
          {allergy.diagnosed_date && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('card.diagnosed', { date: formatDate(allergy.diagnosed_date) })}</p>
          )}
          {allergy.rxcui && (
            <span className="text-xs px-2 py-0.5 rounded-full mt-2 inline-block" style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-sage)' }}>
              {t('card.rxcui', { rxcui: allergy.rxcui })}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-sage)' }}
          >
            {tCommon('edit')}
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onDelete(allergy.id)}
                className="px-2 py-1 rounded text-xs font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--color-terracotta)', color: 'var(--color-bark)' }}
              >
                {t('card.confirmYes')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded text-xs font-medium cursor-pointer"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('card.confirmNo')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
              style={{ backgroundColor: 'transparent', color: 'var(--color-terracotta)', border: '1px solid #F87171' }}
            >
              {tCommon('delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
