'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useActiveProfile } from '@/components/shared/ActiveProfileProvider';
import type { Donation, DonationRecoveryEntry } from '@/lib/types';

function scopedUrl(
  base: string,
  dependentId: string | null,
  delegateOwnerId: string | null,
): string {
  const params = new URLSearchParams();
  if (delegateOwnerId) params.set('owner_id', delegateOwnerId);
  else if (dependentId) params.set('dependent_id', dependentId);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export interface DonationInput {
  donation_date: string;
  donation_type?: Donation['donation_type'];
  notes?: string | null;
}

/** Donation log (§2) — CRUD + next-eligible-date, computed on read. */
export function useDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dependentId, delegateOwnerId } = useActiveProfile();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Donation[]>(
        scopedUrl('/api/donations', dependentId, delegateOwnerId),
      );
      setDonations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [dependentId, delegateOwnerId]);

  useEffect(() => {
    load();
  }, [load]);

  const addDonation = useCallback(
    async (input: DonationInput) => {
      setError(null);
      const payload: Record<string, unknown> = { ...input };
      if (delegateOwnerId) payload.owner_id = delegateOwnerId;
      else if (dependentId) payload.dependent_id = dependentId;

      try {
        const row = await apiFetch<Donation>('/api/donations', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        await load();
        return row;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add donation');
        return undefined;
      }
    },
    [dependentId, delegateOwnerId, load],
  );

  const deleteDonation = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await apiFetch<void>(`/api/donations/${encodeURIComponent(id)}`, { method: 'DELETE' });
        setDonations((prev) => prev.filter((d) => d.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete donation');
      }
    },
    [],
  );

  return { donations, loading, error, addDonation, deleteDonation, refresh: load };
}

/** Auto-computed recovery timeline (§2) — baseline + delta per subsequent draw. */
export function useDonationRecovery() {
  const [entries, setEntries] = useState<DonationRecoveryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dependentId, delegateOwnerId } = useActiveProfile();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<DonationRecoveryEntry[]>(
          scopedUrl('/api/donations/recovery', dependentId, delegateOwnerId),
        );
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load recovery timeline');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dependentId, delegateOwnerId]);

  return { entries, loading, error };
}
