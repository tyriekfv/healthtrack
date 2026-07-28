/**
 * TRT/PED cycle tracking domain: medication_dose_periods, blood_donations.
 *
 * New domain (no legacy SQL migration) — authorization is encoded in
 * src/lib/authz under 'medication_dose_periods'/'blood_donations': owner
 * full; delegates read-only; not shareable (same conservative grant as
 * 'fitness' — see src/db/schema/fitness.ts).
 *
 * medication_dose_periods models one row per compound per continuous dose
 * period (open period = end_date IS NULL). This is deliberately a SEPARATE
 * table from `medications` (clinical.ts): `medications` is a single
 * mutable row per prescription with no history, while this table exists
 * specifically to answer "what was compound X's dose on date Y" and "how
 * long has X been at its current dose" — which requires an append-only
 * period history that isn't overwritten on edit. Only one open period per
 * (user_id, dependent_id, compound) should exist at a time; enforced at the
 * repository layer (src/lib/repos/medication-dose-periods.ts), not the DB,
 * since SQLite can't express a partial unique index on `end_date IS NULL`
 * portably alongside the dependent_id NULL-coalescing this schema already
 * relies on elsewhere (see vitals.ts's idx_vitals_upsert_tuple comment).
 */
import { sql } from 'drizzle-orm';
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { user } from './auth';
import { dependents } from './users';
import { uuidPk, timestampNow } from './_shared';

export const medicationDosePeriods = sqliteTable(
  'medication_dose_periods',
  {
    id: uuidPk(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    compound: text('compound').notNull(),
    dose: text('dose').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date'),
    notes: text('notes'),
    dependentId: text('dependent_id').references(() => dependents.id, { onDelete: 'cascade' }),
    createdAt: timestampNow('created_at'),
  },
  (t) => [
    index('idx_dose_periods_user_compound').on(t.userId, t.compound, sql`${t.startDate} desc`),
    index('idx_dose_periods_dependent').on(t.dependentId),
    // Fast "current state" lookup (WHERE end_date IS NULL).
    index('idx_dose_periods_open').on(t.userId, t.dependentId, t.endDate),
  ],
);

// Whole Blood: 56-day interval; Double Red Cells: 112 days; Platelets: 7 days
// (AABB/Red Cross standard donation eligibility intervals).
export const bloodDonations = sqliteTable(
  'blood_donations',
  {
    id: uuidPk(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    donationDate: text('donation_date').notNull(),
    donationType: text('donation_type', {
      enum: ['whole_blood', 'double_red', 'platelet'],
    })
      .notNull()
      .default('whole_blood'),
    notes: text('notes'),
    dependentId: text('dependent_id').references(() => dependents.id, { onDelete: 'cascade' }),
    createdAt: timestampNow('created_at'),
  },
  (t) => [
    index('idx_blood_donations_user_date').on(t.userId, sql`${t.donationDate} desc`),
    index('idx_blood_donations_dependent').on(t.dependentId),
  ],
);
