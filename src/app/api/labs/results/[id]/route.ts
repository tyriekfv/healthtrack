/** /api/labs/results/[id] — PATCH fixes one result in place (value, test
 *  name, range, flag); DELETE removes one bad/duplicate result. Neither
 *  touches the rest of the visit — the alternative used to be deleting the
 *  whole report and re-importing. */
import { itemHandlers } from '@/lib/api/crud-routes';
import { deleteLabResult, updateLabResult } from '@/lib/repos/labs';

const handlers = itemHandlers({
  update: (actorId, id, updates) => updateLabResult(actorId, id, updates),
  remove: (actorId, id) => deleteLabResult(actorId, id),
});

export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
