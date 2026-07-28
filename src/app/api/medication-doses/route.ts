/**
 * /api/medication-doses — current per-compound dose state.
 * GET  → currently open period per compound (with days-at-dose)
 * POST { compound, dose, start_date, notes? } → close the compound's open
 *       period (if the dose changed) and open a new one. Touches ONLY that
 *       compound's rows.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/respond';
import { bodyToCamel, rowToSnake, rowsToSnake } from '@/lib/api/snake';
import { createScopeFromBody, scopeFromParams } from '@/lib/repos/_scope';
import { listCurrentDoses, updateMedicationDose } from '@/lib/repos/medication-dose-periods';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const scope = scopeFromParams(user.id, request.nextUrl.searchParams);
    const rows = await listCurrentDoses(user.id, scope);
    return NextResponse.json(rowsToSnake(rows));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = bodyToCamel(await request.json());
    const scope = createScopeFromBody(user.id, body);
    const result = await updateMedicationDose(user.id, scope, body);
    return NextResponse.json(
      { changed: result.changed, row: rowToSnake(result.row) },
      { status: result.changed ? 201 : 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
