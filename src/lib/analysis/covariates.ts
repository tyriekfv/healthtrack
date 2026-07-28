/**
 * Covariate lookups for the correlation engine (correlation-engine.ts) —
 * generalizes "what does this lab metric correlate with" beyond a single
 * hardcoded dose. Every covariate resolves to a numeric value AS OF A GIVEN
 * DATE, so the engine can pair it against a lab draw on that date.
 */
import { and, asc, eq, isNull, or, lte, gte } from 'drizzle-orm';
import { db } from '@/db';
import { medicationDosePeriods, bloodDonations, labResults, labVisits } from '@/db/schema';
import { dependentFilter, type ListScope } from '@/lib/repos/_scope';
import { daysBetweenDayKeys } from '@/lib/dates';

/** Same shape as repos' ListScope — aliased here so analysis modules don't
 *  need to import repo-layer naming, but stays structurally identical. */
export type Scope = ListScope;

/** First number in a free-text dose string ("120 mg/week" → 120). Null if none. */
export function parseDoseNumeric(dose: string): number | null {
  const match = dose.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

/**
 * A compound's numeric dose active on `date` (the period covering that
 * date), or null if the compound had no active period then or the dose
 * text has no parseable number (e.g. "Stopped").
 */
export async function doseAtDate(
  scope: Scope,
  compound: string,
  date: string,
): Promise<number | null> {
  const rows = await db
    .select({ dose: medicationDosePeriods.dose })
    .from(medicationDosePeriods)
    .where(
      and(
        eq(medicationDosePeriods.userId, scope.ownerId),
        dependentFilter(medicationDosePeriods.dependentId, scope.dependentId),
        eq(medicationDosePeriods.compound, compound),
        lte(medicationDosePeriods.startDate, date),
        or(isNull(medicationDosePeriods.endDate), gte(medicationDosePeriods.endDate, date)),
      ),
    )
    .limit(1);
  return rows[0] ? parseDoseNumeric(rows[0].dose) : null;
}

/** Days since the most recent donation at or before `date`, or null if none. */
export async function daysSinceLastDonation(scope: Scope, date: string): Promise<number | null> {
  const rows = await db
    .select({ donationDate: bloodDonations.donationDate })
    .from(bloodDonations)
    .where(
      and(
        eq(bloodDonations.userId, scope.ownerId),
        dependentFilter(bloodDonations.dependentId, scope.dependentId),
        lte(bloodDonations.donationDate, date),
      ),
    )
    .orderBy(asc(bloodDonations.donationDate));
  if (rows.length === 0) return null;
  const nearest = rows[rows.length - 1];
  return daysBetweenDayKeys(nearest.donationDate, date);
}

/**
 * How stable the protocol is on `date`: the minimum days-at-dose across
 * every compound with a period covering that date, in weeks. A metric drawn
 * right after ANY dose change reads a low value here — useful both as a
 * covariate and as a caveat signal that the draw isn't a steady-state
 * reading. Null if no compound has an active period on that date.
 */
export async function weeksSinceLastDoseChange(scope: Scope, date: string): Promise<number | null> {
  const rows = await db
    .select({ startDate: medicationDosePeriods.startDate })
    .from(medicationDosePeriods)
    .where(
      and(
        eq(medicationDosePeriods.userId, scope.ownerId),
        dependentFilter(medicationDosePeriods.dependentId, scope.dependentId),
        lte(medicationDosePeriods.startDate, date),
        or(isNull(medicationDosePeriods.endDate), gte(medicationDosePeriods.endDate, date)),
      ),
    );
  if (rows.length === 0) return null;
  const minDays = Math.min(...rows.map((r) => daysBetweenDayKeys(r.startDate, date)));
  return minDays / 7;
}

export interface LabPoint {
  date: string;
  value: number;
}

/** A lab metric's full time series (visit date, value), oldest first. */
export async function getLabSeries(scope: Scope, testName: string): Promise<LabPoint[]> {
  const rows = await db
    .select({ date: labVisits.visitDate, value: labResults.value })
    .from(labResults)
    .innerJoin(labVisits, eq(labVisits.id, labResults.labVisitId))
    .where(
      and(
        eq(labResults.userId, scope.ownerId),
        dependentFilter(labResults.dependentId, scope.dependentId),
        eq(labResults.testName, testName),
      ),
    )
    .orderBy(asc(labVisits.visitDate));
  return rows;
}

/** Every distinct lab test name this scope has results for. */
export async function listLabTestNames(scope: Scope): Promise<string[]> {
  const rows = await db
    .selectDistinct({ testName: labResults.testName })
    .from(labResults)
    .where(
      and(
        eq(labResults.userId, scope.ownerId),
        dependentFilter(labResults.dependentId, scope.dependentId),
      ),
    );
  return rows.map((r) => r.testName);
}

export interface PairedDraw {
  drawId: string;
  date: string;
  a: number;
  b: number;
}

/**
 * Two metrics' values from the SAME lab draw (join on lab_visit_id, not
 * nearest-date matching) — avoids the timing ambiguity of pairing readings
 * from different visits.
 */
export async function getSameDrawPairs(
  scope: Scope,
  metricA: string,
  metricB: string,
): Promise<PairedDraw[]> {
  // Scope (user/dependent) is applied inside the `ra` subquery's WHERE; the
  // join to `rb` on drawId (a UUID lab_visit_id) can't cross users, so `rb`
  // and the labVisits join need no separate scope filter.
  const ra = db
    .select({ drawId: labResults.labVisitId, value: labResults.value })
    .from(labResults)
    .where(
      and(
        eq(labResults.userId, scope.ownerId),
        dependentFilter(labResults.dependentId, scope.dependentId),
        eq(labResults.testName, metricA),
      ),
    )
    .as('ra');
  const rb = db
    .select({ drawId: labResults.labVisitId, value: labResults.value })
    .from(labResults)
    .where(eq(labResults.testName, metricB))
    .as('rb');

  const rows = await db
    .select({ drawId: ra.drawId, date: labVisits.visitDate, a: ra.value, b: rb.value })
    .from(ra)
    .innerJoin(rb, eq(rb.drawId, ra.drawId))
    .innerJoin(labVisits, eq(labVisits.id, ra.drawId))
    .orderBy(asc(labVisits.visitDate));
  return rows;
}
