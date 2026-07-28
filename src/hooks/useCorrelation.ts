'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useActiveProfile } from '@/components/shared/ActiveProfileProvider';
import type { CorrelationResult } from '@/lib/types';

/**
 * Correlation Explorer / "What Moves With X?" data (§3). `covariateSpec` is
 * the wire format the API expects (`dose:<compound>`, `donation_days`,
 * `weeks_since_change`, `metric:<name>`) — pass null to skip fetching (e.g.
 * before the user has picked a covariate). `metric` narrows to a single lab
 * metric; omitted, the full table (every metric vs the covariate) is fetched.
 */
export function useCorrelation(covariateSpec: string | null, metric?: string) {
  const [results, setResults] = useState<CorrelationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dependentId, delegateOwnerId } = useActiveProfile();

  useEffect(() => {
    if (!covariateSpec) {
      setResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ covariate: covariateSpec });
        if (metric) params.set('metric', metric);
        if (delegateOwnerId) params.set('owner_id', delegateOwnerId);
        else if (dependentId) params.set('dependent_id', dependentId);

        const data = await apiFetch<CorrelationResult[] | CorrelationResult>(
          `/api/analysis/correlation?${params.toString()}`,
        );
        if (cancelled) return;
        setResults(Array.isArray(data) ? data : [data]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load correlations');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [covariateSpec, metric, dependentId, delegateOwnerId]);

  return { results, loading, error };
}
