'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useActiveProfile } from '@/components/shared/ActiveProfileProvider';
import type { LabVisit, LabResult } from '@/lib/types';
import type { ParsedLabResult } from '@/lib/claude/parse-lab';

export interface LabVisitWithResults extends LabVisit {
  lab_results: LabResult[];
}

function listUrl(dependentId: string | null, delegateOwnerId: string | null): string {
  const params = new URLSearchParams();
  if (delegateOwnerId) {
    params.set('owner_id', delegateOwnerId);
  } else if (dependentId) {
    params.set('dependent_id', dependentId);
  }
  const qs = params.toString();
  return qs ? `/api/labs?${qs}` : '/api/labs';
}

export function useLabResults() {
  const [labVisits, setLabVisits] = useState<LabVisitWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dependentId, delegateOwnerId } = useActiveProfile();

  const fetchLabResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<LabVisitWithResults[]>(
        listUrl(dependentId, delegateOwnerId),
      );
      setLabVisits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lab results');
    } finally {
      setLoading(false);
    }
  }, [dependentId, delegateOwnerId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<LabVisitWithResults[]>(
          listUrl(dependentId, delegateOwnerId),
        );
        if (cancelled) return;
        setLabVisits(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load lab results');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [dependentId, delegateOwnerId]);

  const saveLabVisit = useCallback(
    async (parsedData: ParsedLabResult, storagePath: string) => {
      const payload: Record<string, unknown> = {
        visit_date: parsedData.visit_date ?? new Date().toISOString().split('T')[0],
        source_pdf_path: storagePath,
        notes: parsedData.provider_name
          ? `Imported from ${parsedData.provider_name}`
          : 'Imported from lab PDF',
        results: parsedData.results.map((r) => ({
          panel_name: r.panel_name,
          test_name: r.test_name,
          value: r.value,
          unit: r.unit || null,
          reference_range_low: r.reference_range_low,
          reference_range_high: r.reference_range_high,
          reference_range_text: r.reference_range_text,
          flag: r.flag,
        })),
      };
      if (delegateOwnerId) payload.owner_id = delegateOwnerId;
      else if (dependentId) payload.dependent_id = dependentId;

      await apiFetch<LabVisitWithResults>('/api/labs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Refetch to update state
      await fetchLabResults();
    },
    [fetchLabResults, dependentId, delegateOwnerId],
  );

  const deleteLabVisit = useCallback(async (id: string) => {
    await apiFetch<void>(`/api/labs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    setLabVisits((current) => current.filter((visit) => visit.id !== id));
  }, []);

  /** Visit-level fields only (date, provider, notes) — results untouched. */
  const updateLabVisit = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      const updated = await apiFetch<LabVisit>(`/api/labs/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setLabVisits((current) =>
        current.map((visit) => (visit.id === id ? { ...visit, ...updated } : visit)),
      );
    },
    [],
  );

  /** Add a result to an existing visit — for a value the import missed. */
  const addLabResult = useCallback(
    async (visitId: string, input: Record<string, unknown>) => {
      const result = await apiFetch<LabResult>(
        `/api/labs/${encodeURIComponent(visitId)}/results`,
        { method: 'POST', body: JSON.stringify(input) },
      );
      setLabVisits((current) =>
        current.map((visit) =>
          visit.id === visitId
            ? { ...visit, lab_results: [...visit.lab_results, result] }
            : visit,
        ),
      );
      return result;
    },
    [],
  );

  /** Fix one result in place without touching the rest of the visit. */
  const updateLabResult = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      const updated = await apiFetch<LabResult>(`/api/labs/results/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setLabVisits((current) =>
        current.map((visit) => ({
          ...visit,
          lab_results: visit.lab_results.map((r) => (r.id === id ? updated : r)),
        })),
      );
    },
    [],
  );

  /** Remove one bad/duplicate result without deleting the whole visit. */
  const deleteLabResult = useCallback(async (id: string) => {
    await apiFetch<void>(`/api/labs/results/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    setLabVisits((current) =>
      current.map((visit) => ({
        ...visit,
        lab_results: visit.lab_results.filter((r) => r.id !== id),
      })),
    );
  }, []);

  return {
    labVisits,
    loading,
    error,
    saveLabVisit,
    deleteLabVisit,
    updateLabVisit,
    addLabResult,
    updateLabResult,
    deleteLabResult,
    refetch: fetchLabResults,
  };
}
