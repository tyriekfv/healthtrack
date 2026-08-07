'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { LabVisit, LabResult, Flag } from '@/lib/types';
import FlagBadge from '@/components/shared/FlagBadge';

interface VisitCardProps {
  visit: LabVisit & { results: LabResult[] };
  onDelete: (id: string) => Promise<void>;
  onUpdateVisit: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onAddResult: (visitId: string, input: Record<string, unknown>) => Promise<unknown>;
  onUpdateResult: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onDeleteResult: (id: string) => Promise<void>;
}

const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  borderColor: 'var(--border-card)',
  color: 'var(--color-text-primary)',
};

const FLAG_VALUES = ['', 'normal', 'high', 'low', 'critical'] as const;

interface ResultDraft {
  panel_name: string;
  test_name: string;
  value: string;
  unit: string;
  reference_range_low: string;
  reference_range_high: string;
  flag: string;
}

const EMPTY_DRAFT: ResultDraft = {
  panel_name: '',
  test_name: '',
  value: '',
  unit: '',
  reference_range_low: '',
  reference_range_high: '',
  flag: '',
};

function toDraft(r: LabResult): ResultDraft {
  return {
    panel_name: r.panel_name ?? '',
    test_name: r.test_name,
    value: String(r.value),
    unit: r.unit ?? '',
    reference_range_low: r.reference_range_low != null ? String(r.reference_range_low) : '',
    reference_range_high: r.reference_range_high != null ? String(r.reference_range_high) : '',
    flag: r.flag ?? '',
  };
}

/** Draft -> API payload. Empty numeric fields become null, not 0/NaN. */
function draftToPayload(d: ResultDraft): Record<string, unknown> {
  return {
    panel_name: d.panel_name.trim() || null,
    test_name: d.test_name.trim(),
    value: Number(d.value),
    unit: d.unit.trim() || null,
    reference_range_low: d.reference_range_low.trim() ? Number(d.reference_range_low) : null,
    reference_range_high: d.reference_range_high.trim() ? Number(d.reference_range_high) : null,
    flag: d.flag || null,
  };
}

export default function VisitCard({
  visit,
  onDelete,
  onUpdateVisit,
  onAddResult,
  onUpdateResult,
  onDeleteResult,
}: VisitCardProps) {
  const t = useTranslations('labs.visitCard');
  const tCommon = useTranslations('common');

  const flagLabel = (value: string): string => {
    switch (value) {
      case 'normal': return t('flagNormal');
      case 'high': return t('flagHigh');
      case 'low': return t('flagLow');
      case 'critical': return t('flagCritical');
      default: return t('flagNone');
    }
  };

  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editingVisit, setEditingVisit] = useState(false);
  const [visitDateDraft, setVisitDateDraft] = useState(visit.visit_date.slice(0, 10));
  const [visitNotesDraft, setVisitNotesDraft] = useState(visit.notes ?? '');
  const [savingVisit, setSavingVisit] = useState(false);
  const [visitEditError, setVisitEditError] = useState<string | null>(null);

  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [resultDraft, setResultDraft] = useState<ResultDraft>(EMPTY_DRAFT);
  const [savingResultId, setSavingResultId] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [deletingResultId, setDeletingResultId] = useState<string | null>(null);

  const [addingResult, setAddingResult] = useState(false);
  const [addDraft, setAddDraft] = useState<ResultDraft>(EMPTY_DRAFT);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const flaggedCount = visit.results.filter(
    (r) => r.flag && r.flag !== 'normal',
  ).length;

  async function handleDelete() {
    const confirmed = window.confirm(
      t('deleteConfirm', {
        date: new Date(visit.visit_date).toLocaleDateString(),
        count: visit.results.length,
      }),
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(visit.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : t('deleteFailed'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveVisit() {
    setSavingVisit(true);
    setVisitEditError(null);
    try {
      await onUpdateVisit(visit.id, {
        visit_date: visitDateDraft,
        notes: visitNotesDraft.trim() || null,
      });
      setEditingVisit(false);
    } catch (error) {
      setVisitEditError(error instanceof Error ? error.message : t('saveFailed'));
    } finally {
      setSavingVisit(false);
    }
  }

  function startEditResult(r: LabResult) {
    setEditingResultId(r.id);
    setResultDraft(toDraft(r));
    setResultError(null);
  }

  async function handleSaveResult(id: string) {
    setSavingResultId(id);
    setResultError(null);
    try {
      await onUpdateResult(id, draftToPayload(resultDraft));
      setEditingResultId(null);
    } catch (error) {
      setResultError(error instanceof Error ? error.message : t('saveResultFailed'));
    } finally {
      setSavingResultId(null);
    }
  }

  async function handleDeleteResult(id: string) {
    if (!window.confirm(t('deleteResultConfirm'))) return;
    setDeletingResultId(id);
    setResultError(null);
    try {
      await onDeleteResult(id);
      if (editingResultId === id) setEditingResultId(null);
    } catch (error) {
      setResultError(error instanceof Error ? error.message : t('deleteResultFailed'));
    } finally {
      setDeletingResultId(null);
    }
  }

  async function handleAddResult() {
    setSavingAdd(true);
    setAddError(null);
    try {
      await onAddResult(visit.id, draftToPayload(addDraft));
      setAddDraft(EMPTY_DRAFT);
      setAddingResult(false);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : t('addResultFailed'));
    } finally {
      setSavingAdd(false);
    }
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer text-left"
        type="button"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {new Date(visit.visit_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {visit.source_pdf_path && (
              <span
                className="inline-flex items-center gap-1 text-xs"
                style={{ color: 'var(--color-sage)' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ width: 12, height: 12 }}
                >
                  <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z" />
                </svg>
                {t('pdf')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>{t('resultsCount', { count: visit.results.length })}</span>
            {flaggedCount > 0 && (
              <span style={{ color: 'var(--color-terracotta)' }}>
                {t('flaggedCount', { count: flaggedCount })}
              </span>
            )}
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          style={{ width: 16, height: 16, color: 'var(--color-text-muted)' }}
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Expanded results table */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-card)' }}>
          {/* Visit-level edit (date, notes) */}
          <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border-card)' }}>
            {editingVisit ? (
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="date"
                    value={visitDateDraft}
                    onChange={(e) => setVisitDateDraft(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border text-xs"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={visitNotesDraft}
                    onChange={(e) => setVisitNotesDraft(e.target.value)}
                    placeholder={t('notesPlaceholder')}
                    className="flex-1 min-w-[160px] px-2 py-1.5 rounded-lg border text-xs"
                    style={inputStyle}
                  />
                </div>
                {visitEditError && (
                  <p className="text-xs" style={{ color: 'var(--color-terracotta)' }}>{visitEditError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveVisit}
                    disabled={savingVisit}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-sage)', color: 'var(--bg-primary)' }}
                  >
                    {savingVisit ? tCommon('saving') : tCommon('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVisit(false);
                      setVisitDateDraft(visit.visit_date.slice(0, 10));
                      setVisitNotesDraft(visit.notes ?? '');
                      setVisitEditError(null);
                    }}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer"
                    style={{ borderColor: 'var(--border-card)', color: 'var(--color-text-muted)' }}
                  >
                    {tCommon('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {visit.notes || t('noNotes')}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingVisit(true)}
                  className="text-xs font-medium cursor-pointer shrink-0"
                  style={{ color: 'var(--color-sage)' }}
                >
                  {t('editDateNotes')}
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                  {[t('panelHeader'), t('testHeader'), t('valueHeader'), t('unitHeader'), t('rangeHeader'), t('flagHeader'), ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 font-medium whitespace-nowrap"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visit.results.map((r) => {
                  const isEditing = editingResultId === r.id;
                  if (isEditing) {
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                        <td className="px-3 py-1.5">
                          <input
                            value={resultDraft.panel_name}
                            onChange={(e) => setResultDraft((d) => ({ ...d, panel_name: e.target.value }))}
                            className="w-24 px-1.5 py-1 rounded border text-xs"
                            style={inputStyle}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            value={resultDraft.test_name}
                            onChange={(e) => setResultDraft((d) => ({ ...d, test_name: e.target.value }))}
                            className="w-36 px-1.5 py-1 rounded border text-xs"
                            style={inputStyle}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            step="any"
                            value={resultDraft.value}
                            onChange={(e) => setResultDraft((d) => ({ ...d, value: e.target.value }))}
                            className="w-20 px-1.5 py-1 rounded border text-xs font-mono"
                            style={inputStyle}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            value={resultDraft.unit}
                            onChange={(e) => setResultDraft((d) => ({ ...d, unit: e.target.value }))}
                            className="w-16 px-1.5 py-1 rounded border text-xs"
                            style={inputStyle}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={resultDraft.reference_range_low}
                              onChange={(e) => setResultDraft((d) => ({ ...d, reference_range_low: e.target.value }))}
                              placeholder={t('lowPlaceholder')}
                              className="w-14 px-1.5 py-1 rounded border text-xs font-mono"
                              style={inputStyle}
                            />
                            <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                            <input
                              type="number"
                              step="any"
                              value={resultDraft.reference_range_high}
                              onChange={(e) => setResultDraft((d) => ({ ...d, reference_range_high: e.target.value }))}
                              placeholder={t('highPlaceholder')}
                              className="w-14 px-1.5 py-1 rounded border text-xs font-mono"
                              style={inputStyle}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-1.5">
                          <select
                            value={resultDraft.flag}
                            onChange={(e) => setResultDraft((d) => ({ ...d, flag: e.target.value }))}
                            className="px-1.5 py-1 rounded border text-xs"
                            style={inputStyle}
                          >
                            {FLAG_VALUES.map((value) => (
                              <option key={value} value={value}>{flagLabel(value)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSaveResult(r.id)}
                            disabled={savingResultId === r.id}
                            className="text-xs font-medium cursor-pointer disabled:opacity-50 mr-2"
                            style={{ color: 'var(--color-sage)' }}
                          >
                            {savingResultId === r.id ? tCommon('saving') : tCommon('save')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingResultId(null)}
                            className="text-xs font-medium cursor-pointer"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {tCommon('cancel')}
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                      <td className="px-3 py-1.5" style={{ color: 'var(--color-text-muted)' }}>
                        {r.panel_name ?? '--'}
                      </td>
                      <td className="px-3 py-1.5" style={{ color: 'var(--color-text-primary)' }}>
                        {r.test_name}
                      </td>
                      <td
                        className="px-3 py-1.5 font-mono"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {r.value}
                      </td>
                      <td className="px-3 py-1.5" style={{ color: 'var(--color-text-muted)' }}>
                        {r.unit ?? '--'}
                      </td>
                      <td className="px-3 py-1.5" style={{ color: 'var(--color-text-muted)' }}>
                        {r.reference_range_low !== null &&
                        r.reference_range_high !== null
                          ? `${r.reference_range_low} - ${r.reference_range_high}`
                          : r.reference_range_text ?? '--'}
                      </td>
                      <td className="px-3 py-1.5">
                        {r.flag ? <FlagBadge flag={r.flag as Flag} /> : '--'}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => startEditResult(r)}
                          className="cursor-pointer mr-2"
                          style={{ color: 'var(--color-sage)' }}
                          aria-label={t('editAriaLabel', { test: r.test_name })}
                          title={tCommon('edit')}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResult(r.id)}
                          disabled={deletingResultId === r.id}
                          className="cursor-pointer disabled:opacity-50"
                          style={{ color: 'var(--color-terracotta)' }}
                          aria-label={t('deleteAriaLabel', { test: r.test_name })}
                          title={tCommon('delete')}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {addingResult && (
                  <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                    <td className="px-3 py-1.5">
                      <input
                        value={addDraft.panel_name}
                        onChange={(e) => setAddDraft((d) => ({ ...d, panel_name: e.target.value }))}
                        placeholder={t('panelPlaceholder')}
                        className="w-24 px-1.5 py-1 rounded border text-xs"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        value={addDraft.test_name}
                        onChange={(e) => setAddDraft((d) => ({ ...d, test_name: e.target.value }))}
                        placeholder={t('testNamePlaceholder')}
                        className="w-36 px-1.5 py-1 rounded border text-xs"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        step="any"
                        value={addDraft.value}
                        onChange={(e) => setAddDraft((d) => ({ ...d, value: e.target.value }))}
                        placeholder={t('valuePlaceholder')}
                        className="w-20 px-1.5 py-1 rounded border text-xs font-mono"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        value={addDraft.unit}
                        onChange={(e) => setAddDraft((d) => ({ ...d, unit: e.target.value }))}
                        placeholder={t('unitPlaceholder')}
                        className="w-16 px-1.5 py-1 rounded border text-xs"
                        style={inputStyle}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={addDraft.reference_range_low}
                          onChange={(e) => setAddDraft((d) => ({ ...d, reference_range_low: e.target.value }))}
                          placeholder={t('lowPlaceholder')}
                          className="w-14 px-1.5 py-1 rounded border text-xs font-mono"
                          style={inputStyle}
                        />
                        <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                        <input
                          type="number"
                          step="any"
                          value={addDraft.reference_range_high}
                          onChange={(e) => setAddDraft((d) => ({ ...d, reference_range_high: e.target.value }))}
                          placeholder={t('highPlaceholder')}
                          className="w-14 px-1.5 py-1 rounded border text-xs font-mono"
                          style={inputStyle}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={addDraft.flag}
                        onChange={(e) => setAddDraft((d) => ({ ...d, flag: e.target.value }))}
                        className="px-1.5 py-1 rounded border text-xs"
                        style={inputStyle}
                      >
                        {FLAG_VALUES.map((value) => (
                          <option key={value} value={value}>{flagLabel(value)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={handleAddResult}
                        disabled={savingAdd || !addDraft.test_name.trim() || !addDraft.value.trim()}
                        className="text-xs font-medium cursor-pointer disabled:opacity-50 mr-2"
                        style={{ color: 'var(--color-sage)' }}
                      >
                        {savingAdd ? t('adding') : tCommon('add')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingResult(false);
                          setAddDraft(EMPTY_DRAFT);
                          setAddError(null);
                        }}
                        className="text-xs font-medium cursor-pointer"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {tCommon('cancel')}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {resultError && (
            <p className="px-3 pt-2 text-xs" style={{ color: 'var(--color-terracotta)' }}>
              {resultError}
            </p>
          )}
          {addError && (
            <p className="px-3 pt-2 text-xs" style={{ color: 'var(--color-terracotta)' }}>
              {addError}
            </p>
          )}

          <div className="flex justify-between items-start px-3 py-3">
            {!addingResult ? (
              <button
                type="button"
                onClick={() => setAddingResult(true)}
                className="text-xs font-medium cursor-pointer"
                style={{ color: 'var(--color-sage)' }}
              >
                {t('addResult')}
              </button>
            ) : (
              <span />
            )}
            <div className="flex flex-col items-end gap-2">
              {deleteError && (
                <p className="text-xs" style={{ color: 'var(--color-terracotta)' }}>
                  {deleteError}
                </p>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  borderColor: 'var(--color-terracotta)',
                  color: 'var(--color-terracotta)',
                }}
              >
                {deleting ? t('deleting') : t('deleteReportButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
