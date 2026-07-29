'use client';

import React, { useState } from 'react';
import type { LabVisit, LabResult, Flag } from '@/lib/types';
import FlagBadge from '@/components/shared/FlagBadge';

interface VisitCardProps {
  visit: LabVisit & { results: LabResult[] };
  onDelete: (id: string) => Promise<void>;
}

export default function VisitCard({ visit, onDelete }: VisitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const flaggedCount = visit.results.filter(
    (r) => r.flag && r.flag !== 'normal',
  ).length;

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete this ${new Date(visit.visit_date).toLocaleDateString()} report and all ${visit.results.length} results? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(visit.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete report');
    } finally {
      setDeleting(false);
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
                PDF
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span>{visit.results.length} results</span>
            {flaggedCount > 0 && (
              <span style={{ color: 'var(--color-terracotta)' }}>
                {flaggedCount} flagged
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
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                {['Panel', 'Test', 'Value', 'Unit', 'Range', 'Flag'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 font-medium"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visit.results.map((r) => (
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
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end px-3 py-3">
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
                {deleting ? 'Deleting…' : 'Delete report and all results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
