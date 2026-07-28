/**
 * /api/medication-doses/history — full per-compound dose period history.
 * GET ?compound=<name> (optional) → all periods (open + closed), newest first.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/respond';
import { rowsToSnake } from '@/lib/api/snake';
import { scopeFromParams } from '@/lib/repos/_scope';
import { listDoseHistory } from '@/lib/repos/medication-dose-periods';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;
    const scope = scopeFromParams(user.id, params);
    const compound = params.get('compound') ?? undefined;
    const rows = await listDoseHistory(user.id, scope, compound);
    return NextResponse.json(rowsToSnake(rows));
  } catch (error) {
    return errorResponse(error);
  }
}
