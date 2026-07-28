/**
 * /api/analysis/correlation — "What Moves With X?" / Correlation Explorer.
 *
 * GET ?covariate=<spec>&metric=<name>
 *   covariate spec, one of:
 *     dose:<compound>        e.g. dose:Testosterone
 *     donation_days          days since last donation
 *     weeks_since_change     weeks since any compound's dose last changed
 *     metric:<name>          another lab metric, same-draw pairing
 *   metric (optional): a single lab test name to correlate against the
 *     covariate. Omitted → the full table (every lab metric vs the covariate).
 *
 * Every result carries an r value AND a confidence badge — see
 * src/lib/analysis/pearson.ts's getConfidence.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/respond';
import { requireListAuthz, scopeFromParams } from '@/lib/repos/_scope';
import {
  correlateAgainstCovariate,
  generateCorrelationTable,
  type Covariate,
} from '@/lib/analysis/correlation-engine';

class BadCovariateError extends Error {
  readonly status = 400;
}

function parseCovariate(spec: string | null): Covariate {
  if (!spec) throw new BadCovariateError('covariate query param is required');
  if (spec === 'donation_days') return { type: 'donation_days' };
  if (spec === 'weeks_since_change') return { type: 'weeks_since_change' };
  if (spec.startsWith('dose:')) {
    const compound = spec.slice('dose:'.length).trim();
    if (!compound) throw new BadCovariateError('dose covariate requires a compound name');
    return { type: 'dose', compound };
  }
  if (spec.startsWith('metric:')) {
    const metric = spec.slice('metric:'.length).trim();
    if (!metric) throw new BadCovariateError('metric covariate requires a metric name');
    return { type: 'metric', metric };
  }
  throw new BadCovariateError(`unrecognized covariate spec: ${spec}`);
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;
    const scope = scopeFromParams(user.id, params);
    const covariate = parseCovariate(params.get('covariate'));
    const metric = params.get('metric');

    await requireListAuthz(user.id, scope, 'labs', 'read');
    if (covariate.type === 'dose' || covariate.type === 'weeks_since_change') {
      await requireListAuthz(user.id, scope, 'medication_dose_periods', 'read');
    }
    if (covariate.type === 'donation_days') {
      await requireListAuthz(user.id, scope, 'blood_donations', 'read');
    }

    if (metric) {
      const result = await correlateAgainstCovariate(scope, metric, covariate);
      return NextResponse.json(toJson(result));
    }
    const table = await generateCorrelationTable(scope, covariate);
    return NextResponse.json(table.map(toJson));
  } catch (error) {
    if (error instanceof BadCovariateError) {
      return NextResponse.json(
        { error: 'validation_error', message: error.message, status: 400 },
        { status: 400 },
      );
    }
    return errorResponse(error);
  }
}

function toJson(result: Awaited<ReturnType<typeof correlateAgainstCovariate>>) {
  return {
    metric: result.metric,
    covariate: result.covariate,
    r: result.r,
    n: result.n,
    confidence: result.confidence,
  };
}
