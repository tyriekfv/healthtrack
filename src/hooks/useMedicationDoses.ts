'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useActiveProfile } from '@/components/shared/ActiveProfileProvider';
import type { CurrentDose, DosePeriod } from '@/lib/types';

function scopedUrl(
  base: string,
  dependentId: string | null,
  delegateOwnerId: string | null,
  extra?: Record<string, string>,
): string {
  const params = new URLSearchParams(extra);
  if (delegateOwnerId) params.set('owner_id', delegateOwnerId);
  else if (dependentId) params.set('dependent_id', dependentId);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export interface UpdateDoseInput {
  compound: string;
  dose: string;
  start_date: string;
  notes?: string | null;
}

/** Current per-compound dose state, plus the update-dose action (§1). */
export function useMedicationDoses() {
  const [doses, setDoses] = useState<CurrentDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dependentId, delegateOwnerId } = useActiveProfile();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CurrentDose[]>(
        scopedUrl('/api/medication-doses', dependentId, delegateOwnerId),
      );
      setDoses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medication doses');
    } finally {
      setLoading(false);
    }
  }, [dependentId, delegateOwnerId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDose = useCallback(
    async (input: UpdateDoseInput) => {
      setError(null);
      const payload: Record<string, unknown> = { ...input };
      if (delegateOwnerId) payload.owner_id = delegateOwnerId;
      else if (dependentId) payload.dependent_id = dependentId;

      try {
        const result = await apiFetch<{ changed: boolean; row: DosePeriod }>(
          '/api/medication-doses',
          { method: 'POST', body: JSON.stringify(payload) },
        );
        await load();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update dose');
        return undefined;
      }
    },
    [dependentId, delegateOwnerId, load],
  );

  return { doses, loading, error, updateDose, refresh: load };
}

/** Full period history for one compound (or every compound if omitted). */
export function useDoseHistory(compound?: string) {
  const [history, setHistory] = useState<DosePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dependentId, delegateOwnerId } = useActiveProfile();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<DosePeriod[]>(
          scopedUrl(
            '/api/medication-doses/history',
            dependentId,
            delegateOwnerId,
            compound ? { compound } : undefined,
          ),
        );
        if (!cancelled) setHistory(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [compound, dependentId, delegateOwnerId]);

  return { history, loading, error };
}
