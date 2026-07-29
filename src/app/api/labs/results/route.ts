/**
 * /api/labs/results — flat lab results joined with their visit date, newest
 * first. Serves the dashboard stat cards (?tests=CSV of exact test names) and
 * the PDF export (no filter). Standard scope params; the callers historically
 * read the user's own rows without a dependent filter (?dependent_id=all).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { errorResponse } from '@/lib/api/respond';
import { rowsToSnake } from '@/lib/api/snake';
import { readRequestedLabTests } from '@/lib/lab-test-query';
import { scopeFromParams } from '@/lib/repos/_scope';
import { listLabResults } from '@/lib/repos/labs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;
    const testNames = readRequestedLabTests(params);
    const rows = await listLabResults(user.id, scopeFromParams(user.id, params), {
      testNames,
    });
    return NextResponse.json(rowsToSnake(rows));
  } catch (error) {
    return errorResponse(error);
  }
}
