'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import FlagBadge from '@/components/shared/FlagBadge';
import TrendLine from './TrendLine';
import LabTrendChart from './LabTrendChart';
import type { Flag } from '@/lib/types';

interface TrendDataPoint {
  value: number;
  visit_date: string;
  flag: string | null;
  ref_low: number | null;
  ref_high: number | null;
}

interface TrendCardProps {
  testName: string;
  results: TrendDataPoint[];
  /** Dashboard usage only — shows the pinned star + terracotta border. */
  pinned?: boolean;
}

export default function TrendCard({ testName, results, pinned = false }: TrendCardProps) {
  const t = useTranslations('labs.trendCard');
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () =>
      [...results].sort(
        (a, b) =>
          new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime(),
      ),
    [results],
  );

  const latest = sorted[sorted.length - 1] as TrendDataPoint | undefined;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const delta = previous && latest ? latest.value - previous.value : null;

  const trendData = sorted.map((r) => ({ value: r.value, date: r.visit_date }));
  const refLow = latest?.ref_low ?? undefined;
  const refHigh = latest?.ref_high ?? undefined;

  // Dashboard widgets can be pinned to a test with zero matching results
  // (nothing imported yet, or a name that no longer matches); the Labs page
  // never renders a card without data, so this only shows up there.
  if (!latest) {
    return (
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: pinned ? 'var(--color-terracotta)' : 'var(--border-card)' }}
      >
        <h4 className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
          {pinned && <span style={{ color: 'var(--color-terracotta)', fontSize: '10px' }}>★</span>}
          {testName}
        </h4>
        <div className="flex items-center justify-center h-10 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          {t('noData')}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-3 cursor-pointer transition-colors hover:border-opacity-60"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: pinned ? 'var(--color-terracotta)' : 'var(--border-card)',
      }}
      onClick={() => setExpanded((prev) => !prev)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
          {pinned && <span style={{ color: 'var(--color-terracotta)', fontSize: '10px' }}>★</span>}
          {testName}
        </h4>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {t('readingsCount', { count: sorted.length })}
        </span>
      </div>

      {/* Latest value + delta */}
      <div className="flex items-end gap-3">
        <span
          className="text-2xl font-mono font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {latest.value}
        </span>
        {latest.flag && latest.flag !== 'normal' && (
          <FlagBadge flag={latest.flag as Flag} />
        )}
        {delta !== null && (
          <span
            className="text-sm font-medium"
            style={{
              color:
                delta === 0
                  ? 'var(--color-text-muted)'
                  : delta > 0
                  ? 'var(--color-terracotta)'
                  : 'var(--color-sage)',
            }}
          >
            {delta > 0 ? '+' : ''}
            {delta.toFixed(1)}
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sorted.length >= 2 && (
        <TrendLine
          data={trendData}
          refLow={refLow}
          refHigh={refHigh}
          width={200}
          height={50}
        />
      )}

      {/* Expanded: trend chart + data table */}
      {expanded && (
        <div
          className="mt-3 rounded-lg overflow-hidden border"
          style={{ borderColor: 'var(--border-card)' }}
        >
          {/* LabTrendChart shown above the table when expanded and ≥2 readings */}
          {sorted.length >= 2 && (
            <div className="p-3" style={{ borderBottom: '1px solid var(--border-card)' }}>
              <LabTrendChart
                data={sorted.map((r) => ({
                  value: r.value,
                  date: r.visit_date,
                  flag: r.flag ?? 'normal',
                  refLow: r.ref_low,
                  refHigh: r.ref_high,
                }))}
                testName={testName}
              />
            </div>
          )}
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                <th
                  className="text-left px-3 py-2 font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t('dateHeader')}
                </th>
                <th
                  className="text-left px-3 py-2 font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t('valueHeader')}
                </th>
                <th
                  className="text-left px-3 py-2 font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t('rangeHeader')}
                </th>
                <th
                  className="text-left px-3 py-2 font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {t('flagHeader')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-card)' }}>
                  <td className="px-3 py-1.5" style={{ color: 'var(--color-text-primary)' }}>
                    {new Date(r.visit_date).toLocaleDateString()}
                  </td>
                  <td
                    className="px-3 py-1.5 font-mono"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {r.value}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    {r.ref_low !== null && r.ref_high !== null
                      ? `${r.ref_low} - ${r.ref_high}`
                      : '--'}
                  </td>
                  <td className="px-3 py-1.5">
                    {r.flag ? <FlagBadge flag={r.flag as Flag} /> : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
