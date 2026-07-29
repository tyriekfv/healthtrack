import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/respond';
import { requireUser } from '@/lib/auth/session';
import { bodyToCamel, rowToSnake } from '@/lib/api/snake';
import { deleteLabVisit, updateLabVisit } from '@/lib/repos/labs';
import { deleteUpload } from '@/lib/storage';

/** PATCH — visit-level fields only (date, provider, notes); results are untouched. */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const updates = bodyToCamel(await request.json());
    const visit = await updateLabVisit(user.id, id, updates);
    return NextResponse.json(rowToSnake(visit));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const visit = await deleteLabVisit(user.id, id);

    // The medical rows are already gone at this point. File cleanup is soft so
    // a missing or inaccessible old upload cannot make the deletion appear to
    // have failed.
    if (visit.sourcePdfPath) {
      try {
        await deleteUpload(visit.sourcePdfPath);
      } catch (error) {
        console.error('Failed to delete lab report upload:', error);
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
