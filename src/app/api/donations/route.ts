/**
 * /api/donations — blood donation event CRUD.
 * GET  → donations with computed next-eligible-date, newest first
 * POST { donation_date, donation_type?, notes? } → donation_type inferred
 *      from notes via classifyDonationType when omitted.
 */
import { collectionHandlers } from '@/lib/api/crud-routes';
import { createDonation, listDonations } from '@/lib/repos/blood-donations';

const handlers = collectionHandlers({
  list: (actorId, scope) => listDonations(actorId, scope),
  create: (actorId, scope, input) => createDonation(actorId, scope, input),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
