/**
 * medication_dose_periods repository — one row per compound per continuous
 * dose period (open period = end_date IS NULL).
 *
 * updateMedicationDose is the core operation: it closes out the compound's
 * current open period (if the dose actually changed) and opens a new one,
 * touching ONLY that compound's rows. No other compound's period is ever
 * read or written by this function — that isolation is the whole point.
 * Every other repository function here only ever filters by
 * (user_id, dependent_id, compound), so a bug that let one compound's write
 * leak into another's rows would have to be introduced at a call site, not
 * here.
 *
 * Authorization: owner full; delegates read-only; not shareable (see
 * src/lib/authz — 'medication_dose_periods' section, same grant as 'fitness').
 */
import { and, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { medicationDosePeriods } from '@/db/schema';
import { requireAuthz, NotFoundError } from '@/lib/authz';
import { daysBetweenDayKeys, localDayKey, shiftDayKey } from '@/lib/dates';
import { dependentFilter, requireListAuthz, type ListScope } from './_scope';

export type DosePeriodRow = typeof medicationDosePeriods.$inferSelect;

export interface CurrentDoseRow extends DosePeriodRow {
  /** Whole days since this period's start_date, through today. */
  daysAtDose: number;
}

const updateDoseInputSchema = z.object({
  compound: z.string().trim().min(1),
  dose: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  notes: z.string().nullish(),
});

export type UpdateDoseInput = z.infer<typeof updateDoseInputSchema>;

export interface UpdateDoseResult {
  changed: boolean;
  row: DosePeriodRow;
}

/** All currently-open periods (end_date IS NULL), one per compound. */
export async function listCurrentDoses(
  actorId: string,
  scope: ListScope,
): Promise<CurrentDoseRow[]> {
  await requireListAuthz(actorId, scope, 'medication_dose_periods', 'read');
  const today = localDayKey();
  const rows = await db
    .select()
    .from(medicationDosePeriods)
    .where(
      and(
        eq(medicationDosePeriods.userId, scope.ownerId),
        dependentFilter(medicationDosePeriods.dependentId, scope.dependentId),
        isNull(medicationDosePeriods.endDate),
      ),
    )
    .orderBy(medicationDosePeriods.compound);
  return rows.map((row) => ({
    ...row,
    daysAtDose: daysBetweenDayKeys(row.startDate, today),
  }));
}

/** Full period history, optionally scoped to one compound, newest first. */
export async function listDoseHistory(
  actorId: string,
  scope: ListScope,
  compound?: string,
): Promise<DosePeriodRow[]> {
  await requireListAuthz(actorId, scope, 'medication_dose_periods', 'read');
  return db
    .select()
    .from(medicationDosePeriods)
    .where(
      and(
        eq(medicationDosePeriods.userId, scope.ownerId),
        dependentFilter(medicationDosePeriods.dependentId, scope.dependentId),
        compound ? eq(medicationDosePeriods.compound, compound) : undefined,
      ),
    )
    .orderBy(desc(medicationDosePeriods.startDate));
}

/**
 * Close the compound's current open period (if the dose is actually
 * changing) and open a new one starting at `startDate`. A no-op (no rows
 * touched) when the new dose matches the currently open dose, to avoid
 * junk history entries from redundant saves.
 */
export async function updateMedicationDose(
  actorId: string,
  scope: { ownerId: string; dependentId: string | null },
  input: unknown,
): Promise<UpdateDoseResult> {
  await requireAuthz(actorId, scope, 'medication_dose_periods', 'write');
  const values = updateDoseInputSchema.parse(input);

  const openRows = await db
    .select()
    .from(medicationDosePeriods)
    .where(
      and(
        eq(medicationDosePeriods.userId, scope.ownerId),
        dependentFilter(medicationDosePeriods.dependentId, scope.dependentId),
        eq(medicationDosePeriods.compound, values.compound),
        isNull(medicationDosePeriods.endDate),
      ),
    )
    .limit(1);
  const open = openRows[0];

  if (open && open.dose === values.dose) {
    return { changed: false, row: open };
  }

  if (open) {
    const endDate = shiftDayKey(values.startDate, -1);
    await db
      .update(medicationDosePeriods)
      .set({ endDate })
      .where(eq(medicationDosePeriods.id, open.id));
  }

  const [row] = await db
    .insert(medicationDosePeriods)
    .values({
      userId: scope.ownerId,
      dependentId: scope.dependentId,
      compound: values.compound,
      dose: values.dose,
      startDate: values.startDate,
      notes: values.notes ?? null,
    })
    .returning();

  return { changed: true, row };
}

/** Row scope comes from the row itself (authz parity with other repos). */
async function loadRow(id: string): Promise<DosePeriodRow> {
  const rows = await db
    .select()
    .from(medicationDosePeriods)
    .where(eq(medicationDosePeriods.id, id))
    .limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

/** Corrects a mis-entered period (e.g. wrong start date) — not a dose change. */
export async function deleteDosePeriod(actorId: string, id: string): Promise<void> {
  const row = await loadRow(id);
  await requireAuthz(
    actorId,
    { ownerId: row.userId, dependentId: row.dependentId },
    'medication_dose_periods',
    'delete',
  );
  await db.delete(medicationDosePeriods).where(eq(medicationDosePeriods.id, id));
}
