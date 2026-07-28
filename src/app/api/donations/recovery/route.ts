/**
 * /api/donations/recovery — auto-computed recovery timeline per donation
 * (baseline + delta at every subsequent lab draw, see
 * src/lib/analysis/donation-recovery.ts). Read-only; requires read access to
 * both 'blood_donations' and 'labs' for the resolved scope.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/respond';
import { requireListAuthz, scopeFromParams } from '@/lib/repos/_scope';
import { getDonationRecoveryTimeline } from '@/lib/analysis/donation-recovery';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const scope = scopeFromParams(user.id, request.nextUrl.searchParams);
    await requireListAuthz(user.id, scope, 'blood_donations', 'read');
    await requireListAuthz(user.id, scope, 'labs', 'read');
    const timeline = await getDonationRecoveryTimeline(scope);
    // Shallow, hand-built conversion: `baseline`/`delta` keys are free-form
    // lab test names (e.g. "Reticulocyte %"), not schema field names — they
    // must never go through camelCase→snake_case rewriting (same reasoning
    // as vitals' `metadata`, see src/lib/api/snake.ts).
    const json = timeline.map((entry) => ({
      donation_id: entry.donationId,
      donation_date: entry.donationDate,
      donation_type: entry.donationType,
      baseline: entry.baseline,
      timeline: entry.timeline.map((point) => ({
        date: point.date,
        days_later: point.daysLater,
        delta: point.delta,
      })),
    }));
    return NextResponse.json(json);
  } catch (error) {
    return errorResponse(error);
  }
}
