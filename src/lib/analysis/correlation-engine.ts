/**
 * Correlation engine — generic "what does this lab metric correlate with"
 * over any of: a compound's dose history, days since last donation, protocol
 * stability (weeks since any compound's dose last changed), or another lab
 * metric entirely. Every result carries a confidence badge (pearson.ts) so a
 * 2-point r=1.0 never reads as proof of anything.
 *
 * Authorization: callers MUST resolve/verify the scope's read access before
 * calling into this module (it queries labResults/medicationDosePeriods/
 * bloodDonations directly, with no authz check of its own) — mirrors how
 * src/lib/repos modules gate access; this module is analysis-only, not a
 * repository, so it stays authz-agnostic and reuses the caller's scope.
 */
import type { Scope } from './covariates';
import {
  doseAtDate,
  daysSinceLastDonation,
  weeksSinceLastDoseChange,
  getLabSeries,
  getSameDrawPairs,
  listLabTestNames,
} from './covariates';
import { pearson, getConfidence, type Confidence } from './pearson';

export type Covariate =
  | { type: 'dose'; compound: string }
  | { type: 'donation_days' }
  | { type: 'weeks_since_change' }
  | { type: 'metric'; metric: string };

export interface CorrelationResult {
  metric: string;
  covariate: Covariate;
  r: number | null;
  n: number;
  confidence: Confidence;
}

/** Correlate one lab metric against one covariate. */
export async function correlateAgainstCovariate(
  scope: Scope,
  metric: string,
  covariate: Covariate,
): Promise<CorrelationResult> {
  const pairs = await buildPairs(scope, metric, covariate);
  const { r, n } = pearson(pairs);
  return { metric, covariate, r, n, confidence: getConfidence(n) };
}

/** Every lab metric this scope has data for, correlated against one fixed covariate. */
export async function generateCorrelationTable(
  scope: Scope,
  covariate: Covariate,
): Promise<CorrelationResult[]> {
  const metrics = await listLabTestNames(scope);
  const results: CorrelationResult[] = [];
  for (const metric of metrics) {
    if (covariate.type === 'metric' && covariate.metric === metric) continue;
    results.push(await correlateAgainstCovariate(scope, metric, covariate));
  }
  return results;
}

async function buildPairs(
  scope: Scope,
  metric: string,
  covariate: Covariate,
): Promise<Array<[number, number]>> {
  if (covariate.type === 'metric') {
    const drawPairs = await getSameDrawPairs(scope, metric, covariate.metric);
    return drawPairs.map((p): [number, number] => [p.a, p.b]);
  }

  const series = await getLabSeries(scope, metric);
  const pairs: Array<[number, number]> = [];
  for (const point of series) {
    const covariateValue = await resolveCovariateValue(scope, covariate, point.date);
    if (covariateValue !== null) pairs.push([covariateValue, point.value]);
  }
  return pairs;
}

async function resolveCovariateValue(
  scope: Scope,
  covariate: Exclude<Covariate, { type: 'metric' }>,
  date: string,
): Promise<number | null> {
  switch (covariate.type) {
    case 'dose':
      return doseAtDate(scope, covariate.compound, date);
    case 'donation_days':
      return daysSinceLastDonation(scope, date);
    case 'weeks_since_change':
      return weeksSinceLastDoseChange(scope, date);
  }
}
