/**
 * blood_donations repository.
 *
 * Authorization: owner full; delegates read-only; not shareable (see
 * src/lib/authz — 'blood_donations' section, same grant as 'fitness').
 */
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { bloodDonations } from '@/db/schema';
import { requireAuthz, NotFoundError } from '@/lib/authz';
import { shiftDayKey } from '@/lib/dates';
import { dependentFilter, requireListAuthz, type ListScope } from './_scope';

export type DonationRow = typeof bloodDonations.$inferSelect;
export type DonationType = DonationRow['donationType'];

/** AABB/Red Cross standard eligibility intervals, in days. */
const ELIGIBILITY_INTERVAL_DAYS: Record<DonationType, number> = {
  whole_blood: 56,
  double_red: 112,
  platelet: 7,
};

/**
 * Best-effort donation-type inference from free text (e.g. imported notes
 * that don't carry a structured type). Only used when the caller hasn't
 * supplied an explicit `donationType`.
 */
export function classifyDonationType(text: string | null | undefined): DonationType {
  if (!text) return 'whole_blood';
  if (/double|power\s*red/i.test(text)) return 'double_red';
  if (/platelet/i.test(text)) return 'platelet';
  return 'whole_blood';
}

/** Next date this donation type's eligibility interval clears, `YYYY-MM-DD`. */
export function nextEligibleDate(donationDate: string, donationType: DonationType): string {
  return shiftDayKey(donationDate, ELIGIBILITY_INTERVAL_DAYS[donationType]);
}

const donationInputSchema = z
  .object({
    donationDate: z.string().trim().min(1),
    donationType: z.enum(['whole_blood', 'double_red', 'platelet']).optional(),
    notes: z.string().nullish(),
  })
  .strip();

const donationUpdateSchema = donationInputSchema.partial();

export type DonationInput = z.infer<typeof donationInputSchema>;

export interface DonationWithEligibility extends DonationRow {
  nextEligibleDate: string;
}

export async function listDonations(
  actorId: string,
  scope: ListScope,
): Promise<DonationWithEligibility[]> {
  await requireListAuthz(actorId, scope, 'blood_donations', 'read');
  const rows = await db
    .select()
    .from(bloodDonations)
    .where(
      and(
        eq(bloodDonations.userId, scope.ownerId),
        dependentFilter(bloodDonations.dependentId, scope.dependentId),
      ),
    )
    .orderBy(desc(bloodDonations.donationDate));
  return rows.map((row) => ({
    ...row,
    nextEligibleDate: nextEligibleDate(row.donationDate, row.donationType),
  }));
}

export async function createDonation(
  actorId: string,
  scope: { ownerId: string; dependentId: string | null },
  input: unknown,
): Promise<DonationRow> {
  await requireAuthz(actorId, scope, 'blood_donations', 'write');
  const values = donationInputSchema.parse(input);
  const [row] = await db
    .insert(bloodDonations)
    .values({
      userId: scope.ownerId,
      dependentId: scope.dependentId,
      donationDate: values.donationDate,
      donationType: values.donationType ?? classifyDonationType(values.notes),
      notes: values.notes ?? null,
    })
    .returning();
  return row;
}

async function loadRow(id: string): Promise<DonationRow> {
  const rows = await db.select().from(bloodDonations).where(eq(bloodDonations.id, id)).limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function updateDonation(
  actorId: string,
  id: string,
  updates: unknown,
): Promise<DonationRow> {
  const row = await loadRow(id);
  await requireAuthz(
    actorId,
    { ownerId: row.userId, dependentId: row.dependentId },
    'blood_donations',
    'write',
  );
  const values = donationUpdateSchema.parse(updates);
  const [updated] = await db
    .update(bloodDonations)
    .set(values)
    .where(eq(bloodDonations.id, id))
    .returning();
  return updated;
}

export async function deleteDonation(actorId: string, id: string): Promise<void> {
  const row = await loadRow(id);
  await requireAuthz(
    actorId,
    { ownerId: row.userId, dependentId: row.dependentId },
    'blood_donations',
    'delete',
  );
  await db.delete(bloodDonations).where(eq(bloodDonations.id, id));
}
