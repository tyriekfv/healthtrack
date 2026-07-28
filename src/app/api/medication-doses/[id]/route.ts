/**
 * /api/medication-doses/[id] — DELETE only. Corrects a mis-entered period
 * (e.g. wrong start date); a real dose change goes through POST
 * /api/medication-doses instead so the close/open pairing stays intact.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/respond';
import { deleteDosePeriod } from '@/lib/repos/medication-dose-periods';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    await deleteDosePeriod(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
