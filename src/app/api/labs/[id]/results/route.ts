/** /api/labs/[id]/results — POST adds one result to an existing visit
 *  (for a value the import missed), without touching the rest of the visit. */
import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/respond';
import { requireUser } from '@/lib/auth/session';
import { bodyToCamel, rowToSnake } from '@/lib/api/snake';
import { addLabResult } from '@/lib/repos/labs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const input = bodyToCamel(await request.json());
    const result = await addLabResult(user.id, id, input);
    return NextResponse.json(rowToSnake(result), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
