/**
 * Blood-donation recovery timeline — the single feature users found most
 * valuable in the tool this ports from: turns raw lab tables into an
 * automatic "here's what happened after you donated" narrative, e.g.
 * "28 days later: Hct -9.9, MCV -4.8, Hgb -1.8".
 *
 * For each donation, the nearest lab value at or before the donation date is
 * the baseline; every SUBSEQUENT draw (not just the first) gets a delta
 * against that baseline, until the next donation (or present).
 *
 * Authorization: same convention as correlation-engine.ts — this module is
 * analysis-only and trusts the caller to have already verified read access
 * to the scope for 'labs' and 'blood_donations'.
 */
import { asc, and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { bloodDonations } from '@/db/schema';
import { dependentFilter } from '@/lib/repos/_scope';
import { getLabSeries, type Scope, type LabPoint } from './covariates';
import { daysBetweenDayKeys } from '@/lib/dates';

/** Metrics with donation-recovery logic built around them (brief §6). */
export const RECOVERY_METRICS = [
  'Hematocrit',
  'Ferritin',
  'MCV',
  'Hemoglobin',
  'Reticulocyte %',
] as const;

export interface RecoveryPoint {
  date: string;
  daysLater: number;
  delta: Partial<Record<(typeof RECOVERY_METRICS)[number], number>>;
}

export interface DonationRecoveryEntry {
  donationId: string;
  donationDate: string;
  donationType: string;
  baseline: Partial<Record<(typeof RECOVERY_METRICS)[number], number>>;
  timeline: RecoveryPoint[];
}

export async function getDonationRecoveryTimeline(
  scope: Scope,
): Promise<DonationRecoveryEntry[]> {
  const donations = await db
    .select()
    .from(bloodDonations)
    .where(
      and(
        eq(bloodDonations.userId, scope.ownerId),
        dependentFilter(bloodDonations.dependentId, scope.dependentId),
      ),
    )
    .orderBy(asc(bloodDonations.donationDate));

  const seriesByMetric = new Map<string, LabPoint[]>();
  for (const metric of RECOVERY_METRICS) {
    seriesByMetric.set(metric, await getLabSeries(scope, metric));
  }

  const entries: DonationRecoveryEntry[] = [];
  for (let i = 0; i < donations.length; i++) {
    const donation = donations[i];
    const nextDonation = donations[i + 1];

    const baseline: DonationRecoveryEntry['baseline'] = {};
    for (const metric of RECOVERY_METRICS) {
      const series = seriesByMetric.get(metric) ?? [];
      const atOrBefore = series.filter((p) => p.date <= donation.donationDate);
      if (atOrBefore.length > 0) baseline[metric] = atOrBefore[atOrBefore.length - 1].value;
    }

    const followUpDates = new Set<string>();
    for (const metric of RECOVERY_METRICS) {
      const series = seriesByMetric.get(metric) ?? [];
      for (const point of series) {
        if (
          point.date > donation.donationDate &&
          (!nextDonation || point.date < nextDonation.donationDate)
        ) {
          followUpDates.add(point.date);
        }
      }
    }

    const timeline: RecoveryPoint[] = [...followUpDates].sort().map((date) => {
      const delta: RecoveryPoint['delta'] = {};
      for (const metric of RECOVERY_METRICS) {
        const base = baseline[metric];
        if (base === undefined) continue;
        const series = seriesByMetric.get(metric) ?? [];
        const reading = series.find((p) => p.date === date);
        if (reading) delta[metric] = round1(reading.value - base);
      }
      return { date, daysLater: daysBetweenDayKeys(donation.donationDate, date), delta };
    });

    entries.push({
      donationId: donation.id,
      donationDate: donation.donationDate,
      donationType: donation.donationType,
      baseline,
      timeline,
    });
  }

  return entries;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
