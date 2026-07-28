/** /api/donations/[id] — PATCH/DELETE (authz derived from the row's scope). */
import { itemHandlers } from '@/lib/api/crud-routes';
import { deleteDonation, updateDonation } from '@/lib/repos/blood-donations';

const handlers = itemHandlers({
  update: (actorId, id, updates) => updateDonation(actorId, id, updates),
  remove: (actorId, id) => deleteDonation(actorId, id),
});

export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
