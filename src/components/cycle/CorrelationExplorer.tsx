'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCorrelation } from '@/hooks/useCorrelation';
import ConfidenceBadge from './ConfidenceBadge';
import Skeleton from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';

type AgainstMode = 'dose' | 'donation_days' | 'weeks_since_change' | 'metric';

interface CorrelationExplorerProps {
  labMetrics: string[];
  compounds: string[];
}

const selectStyle = {
  backgroundColor: 'var(--bg-primary)',
  borderColor: 'var(--border-card)',
  color: 'var(--color-text-primary)',
};
const labelStyle = { color: 'var(--color-text-primary)' };

function formatR(r: number | null): string {
  return r === null ? '—' : r.toFixed(2);
}

/**
 * "What Moves With X?" / Correlation Explorer (§4). Picking "All metrics" for
 * the primary metric gets the full table (every lab metric vs the fixed
 * covariate); picking one metric narrows to a single row.
 */
export default function CorrelationExplorer({ labMetrics, compounds }: CorrelationExplorerProps) {
  const [primaryMetric, setPrimaryMetric] = useState<string>('ALL');
  const [against, setAgainst] = useState<AgainstMode>(
    compounds.length > 0 ? 'dose' : 'donation_days',
  );
  const [againstCompound, setAgainstCompound] = useState(compounds[0] ?? '');
  const [againstMetric, setAgainstMetric] = useState(labMetrics[0] ?? '');

  // Props load asynchronously (dose/lab data fetches finish after mount), so
  // the initial useState value can lag an empty list — resync once real
  // options arrive rather than leaving the picker stuck on ''.
  useEffect(() => {
    if (!againstCompound && compounds.length > 0) setAgainstCompound(compounds[0]);
  }, [compounds, againstCompound]);
  useEffect(() => {
    if (!againstMetric && labMetrics.length > 0) setAgainstMetric(labMetrics[0]);
  }, [labMetrics, againstMetric]);

  const covariateSpec = useMemo(() => {
    if (against === 'dose') {
      return againstCompound ? `dose:${againstCompound}` : null;
    }
    if (against === 'metric') {
      return againstMetric ? `metric:${againstMetric}` : null;
    }
    return against;
  }, [against, againstCompound, againstMetric]);

  const metricParam = primaryMetric === 'ALL' ? undefined : primaryMetric;
  const { results, loading, error } = useCorrelation(covariateSpec, metricParam);

  // A metric can't usefully correlate with itself.
  const visibleResults = results.filter(
    (r) => !(against === 'metric' && r.metric === againstMetric),
  );

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="corr-metric" className="block text-sm font-medium mb-1" style={labelStyle}>
            Correlate
          </label>
          <select
            id="corr-metric"
            value={primaryMetric}
            onChange={(e) => setPrimaryMetric(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={selectStyle}
          >
            <option value="ALL">All lab metrics</option>
            {labMetrics.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="corr-against" className="block text-sm font-medium mb-1" style={labelStyle}>
            Against
          </label>
          <select
            id="corr-against"
            value={against}
            onChange={(e) => setAgainst(e.target.value as AgainstMode)}
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
            style={selectStyle}
          >
            {compounds.length > 0 && <option value="dose">Compound dose</option>}
            <option value="donation_days">Days since last donation</option>
            <option value="weeks_since_change">Weeks since any dose change</option>
            {labMetrics.length > 0 && <option value="metric">Another lab metric</option>}
          </select>
        </div>
      </div>

      {against === 'dose' && compounds.length > 0 && (
        <div>
          <label htmlFor="corr-compound" className="block text-sm font-medium mb-1" style={labelStyle}>
            Compound
          </label>
          <select
            id="corr-compound"
            value={againstCompound}
            onChange={(e) => setAgainstCompound(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none sm:max-w-xs"
            style={selectStyle}
          >
            {compounds.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {against === 'metric' && (
        <div>
          <label htmlFor="corr-against-metric" className="block text-sm font-medium mb-1" style={labelStyle}>
            Metric
          </label>
          <select
            id="corr-against-metric"
            value={againstMetric}
            onChange={(e) => setAgainstMetric(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none sm:max-w-xs"
            style={selectStyle}
          >
            {labMetrics.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{ borderColor: 'var(--color-terracotta)', color: 'var(--color-terracotta)' }}
          role="alert"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <Skeleton variant="rect" />
          <Skeleton variant="rect" />
        </div>
      )}

      {!loading && !error && visibleResults.length === 0 && (
        <EmptyState
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          title="Not enough data yet"
          description="This needs at least one lab result to compute a correlation."
        />
      )}

      {!loading && !error && visibleResults.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-card)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Metric
                </th>
                <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  r
                </th>
                <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleResults.map((result) => (
                <tr key={result.metric} style={{ borderTop: '1px solid var(--border-card)' }}>
                  <td className="px-4 py-2" style={{ color: 'var(--color-text-primary)' }}>
                    {result.metric}
                  </td>
                  <td className="px-4 py-2 font-mono" style={{ color: 'var(--color-text-primary)' }}>
                    {formatR(result.r)}
                  </td>
                  <td className="px-4 py-2">
                    <ConfidenceBadge confidence={result.confidence} />
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
