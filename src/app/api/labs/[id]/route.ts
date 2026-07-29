import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/respond';
import { requireUser } from '@/lib/auth/session';
import { deleteLabVisit } from '@/lib/repos/labs';
import { deleteUpload } from '@/lib/storage';

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
