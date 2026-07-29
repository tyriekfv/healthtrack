/**
 * labs repository (lab_visits + lab_results).
 *
 * Authorization (003/012/014, encoded in src/lib/authz): owner full; shares
 * READ-ONLY with section 'labs' + exact dependent match. Delegates READ ONLY —
 * 012 granted delegates INSERT (no UPDATE/DELETE) on both tables, and our
 * Access model cannot split insert from update, so labs 'write' is
 * conservatively denied for delegates: labs mutations are owner-only.
 *
 * Storage note: lab_visits.source_pdf_path holds the relative filesystem
 * path (`<userId>/<uuid>.<ext>`) written by src/lib/storage and served by
 * GET /api/files/[...path].
 */
import { and, desc, eq, gte, inArray, like } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { labResults, labVisits } from '@/db/schema';
import { NotFoundError, requireAuthz } from '@/lib/authz';
import { normalizeLabTestName } from '@/lib/lab-test-names';
import { dependentFilter, requireListAuthz, type ListScope } from './_scope';

export type LabVisitRow = typeof labVisits.$inferSelect;
export type LabResultRow = typeof labResults.$inferSelect;

export interface LabVisitWithResults extends LabVisitRow {
  labResults: LabResultRow[];
}

export interface LabResultWithVisitDate extends LabResultRow {
  visitDate: string;
}

// Unknown keys (id, user_id, dependent_id, timestamps…) are stripped —
// row scope is never client-controlled.
const labResultInputSchema = z
  .object({
    panelName: z.string().nullish(),
    testName: z.string().trim().min(1),
    value: z.number(),
    unit: z.string().nullish(),
    referenceRangeLow: z.number().nullish(),
    referenceRangeHigh: z.number().nullish(),
    referenceRangeText: z.string().nullish(),
    flag: z.enum(['normal', 'high', 'low', 'critical']).nullish(),
    loincCode: z.string().nullish(),
  })
  .strip();

const labVisitInputSchema = z
  .object({
    visitDate: z.string().min(1),
    providerId: z.string().nullish(),
    sourcePdfPath: z.string().nullish(),
    notes: z.string().nullish(),
    results: z.array(labResultInputSchema).default([]),
  })
  .strip();

export type LabVisitInput = z.input<typeof labVisitInputSchema>;

const labVisitUpdateSchema = labVisitInputSchema
  .omit({ results: true })
  .partial();
const labResultUpdateSchema = labResultInputSchema.partial();

/**
 * Visits (newest first) with their results nested — hook parity with the old
 * PostgREST `lab_visits.select('*, lab_results(*)')` embed: results attach by
 * lab_visit_id, the dependent filter applies to the visit rows.
 */
export async function listLabVisitsWithResults(
  actorId: string,
  scope: ListScope,
): Promise<LabVisitWithResults[]> {
  await requireListAuthz(actorId, scope, 'labs', 'read');
  const visits = await db
    .select()
    .from(labVisits)
    .where(
      and(
        eq(labVisits.userId, scope.ownerId),
        dependentFilter(labVisits.dependentId, scope.dependentId),
      ),
    )
    .orderBy(desc(labVisits.visitDate));
  if (visits.length === 0) return [];

  const results = await db
    .select()
    .from(labResults)
    .where(
      inArray(
        labResults.labVisitId,
        visits.map((v) => v.id),
      ),
    );
  const byVisit = new Map<string, LabResultRow[]>();
  for (const r of results) {
    const group = byVisit.get(r.labVisitId) ?? [];
    group.push(r);
    byVisit.set(r.labVisitId, group);
  }
  return visits.map((v) => ({ ...v, labResults: byVisit.get(v.id) ?? [] }));
}

/**
 * Create a visit plus its results (hook `saveLabVisit` parity: sequential
 * inserts, results inherit the visit's scope). Owner-only — see header.
 */
export async function createLabVisitWithResults(
  actorId: string,
  scope: { ownerId: string; dependentId: string | null },
  input: unknown,
): Promise<LabVisitWithResults> {
  await requireAuthz(actorId, scope, 'labs', 'write');
  const { results, ...visitValues } = labVisitInputSchema.parse(input);
  const [visit] = await db
    .insert(labVisits)
    .values({ ...visitValues, userId: scope.ownerId, dependentId: scope.dependentId })
    .returning();

  let rows: LabResultRow[] = [];
  if (results.length > 0) {
    rows = await db
      .insert(labResults)
      .values(
        results.map((r) => ({
          ...r,
          userId: scope.ownerId,
          dependentId: scope.dependentId,
          labVisitId: visit.id,
        })),
      )
      .returning();
  }
  return { ...visit, labResults: rows };
}

/**
 * Delete one imported report. lab_results are removed by the visit foreign
 * key's ON DELETE CASCADE. Return the visit so the route can clean up its
 * stored source file after the database deletion succeeds.
 */
export async function deleteLabVisit(
  actorId: string,
  id: string,
): Promise<LabVisitRow> {
  const rows = await db.select().from(labVisits).where(eq(labVisits.id, id)).limit(1);
  const visit = rows[0];
  if (!visit) throw new NotFoundError();

  await requireAuthz(
    actorId,
    { ownerId: visit.userId, dependentId: visit.dependentId },
    'labs',
    'delete',
  );
  await db.delete(labVisits).where(eq(labVisits.id, id));
  return visit;
}

/** Row scope comes from the row itself (authz parity with other repos). */
async function loadVisit(id: string): Promise<LabVisitRow> {
  const rows = await db.select().from(labVisits).where(eq(labVisits.id, id)).limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

async function loadResult(id: string): Promise<LabResultRow> {
  const rows = await db.select().from(labResults).where(eq(labResults.id, id)).limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

/**
 * Edit a visit's own fields (date, provider, notes) without touching its
 * results — the counterpart to createLabVisitWithResults's all-in-one write,
 * for fixing a single field after import instead of delete-and-reimport.
 */
export async function updateLabVisit(
  actorId: string,
  id: string,
  updates: unknown,
): Promise<LabVisitRow> {
  const visit = await loadVisit(id);
  await requireAuthz(
    actorId,
    { ownerId: visit.userId, dependentId: visit.dependentId },
    'labs',
    'write',
  );
  const values = labVisitUpdateSchema.parse(updates);
  const [updated] = await db
    .update(labVisits)
    .set(values)
    .where(eq(labVisits.id, id))
    .returning();
  return updated;
}

/** Add a result to an existing visit — for a value the import missed. */
export async function addLabResult(
  actorId: string,
  visitId: string,
  input: unknown,
): Promise<LabResultRow> {
  const visit = await loadVisit(visitId);
  await requireAuthz(
    actorId,
    { ownerId: visit.userId, dependentId: visit.dependentId },
    'labs',
    'write',
  );
  const values = labResultInputSchema.parse(input);
  const [row] = await db
    .insert(labResults)
    .values({
      ...values,
      userId: visit.userId,
      dependentId: visit.dependentId,
      labVisitId: visit.id,
    })
    .returning();
  return row;
}

/** Fix one result in place (wrong value, mislabeled test, bad range) without touching the rest of the visit. */
export async function updateLabResult(
  actorId: string,
  id: string,
  updates: unknown,
): Promise<LabResultRow> {
  const result = await loadResult(id);
  await requireAuthz(
    actorId,
    { ownerId: result.userId, dependentId: result.dependentId },
    'labs',
    'write',
  );
  const values = labResultUpdateSchema.parse(updates);
  const [updated] = await db
    .update(labResults)
    .set(values)
    .where(eq(labResults.id, id))
    .returning();
  return updated;
}

/** Remove one bad/duplicate result without deleting the whole visit. */
export async function deleteLabResult(actorId: string, id: string): Promise<void> {
  const result = await loadResult(id);
  await requireAuthz(
    actorId,
    { ownerId: result.userId, dependentId: result.dependentId },
    'labs',
    'delete',
  );
  await db.delete(labResults).where(eq(labResults.id, id));
}

/**
 * Case/whitespace-insensitive key for matching test names across imports.
 * PDF-to-structured-data extraction (parse-lab.ts) doesn't guarantee two
 * imports of "the same" test render byte-identical strings — trailing
 * whitespace or a stray Unicode space is invisible in the UI but breaks a
 * naive exact match, silently blanking any dashboard card or query pinned to
 * the test. Collapse and fold case before comparing rather than relying on
 * imports being byte-perfect.
 */
export function normalizeTestName(name: string): string {
  return normalizeLabTestName(name);
}

export interface ListLabResultsOptions {
  /** Test-name filter (dashboard stat cards) — matched via normalizeTestName. */
  testNames?: string[];
}

/**
 * Flat results (newest created_at first) joined with their visit date —
 * serves the dashboard stat cards and the PDF export, which read the user's
 * results without a dependent filter ('all'). testNames filtering happens in
 * JS (not SQL) so it can use normalizeTestName instead of an exact match.
 */
export async function listLabResults(
  actorId: string,
  scope: ListScope,
  opts: ListLabResultsOptions = {},
): Promise<LabResultWithVisitDate[]> {
  await requireListAuthz(actorId, scope, 'labs', 'read');
  const rows = await db
    .select({ result: labResults, visitDate: labVisits.visitDate })
    .from(labResults)
    .innerJoin(labVisits, eq(labResults.labVisitId, labVisits.id))
    .where(
      and(
        eq(labResults.userId, scope.ownerId),
        dependentFilter(labResults.dependentId, scope.dependentId),
      ),
    )
    .orderBy(desc(labResults.createdAt));
  const mapped = rows.map(({ result, visitDate }) => ({ ...result, visitDate }));
  if (!opts.testNames || opts.testNames.length === 0) return mapped;
  const wanted = new Set(opts.testNames.map(normalizeTestName));
  return mapped.filter((r) => wanted.has(normalizeTestName(r.testName)));
}

export interface ListLabResultsV1Options {
  /** Case-insensitive substring match on test_name (PAT `?test=`). */
  test?: string | null;
  /** Only results whose visit_date falls within the last N days. */
  days?: number | null;
}

/**
 * PAT surface (/api/v1/labs): the key owner's own data only (dependent_id
 * NULL), id desc — parity with the legacy PostgREST implementation.
 */
export async function listLabResultsV1(
  ownerId: string,
  opts: ListLabResultsV1Options,
): Promise<LabResultWithVisitDate[]> {
  await requireAuthz(ownerId, { ownerId, dependentId: null }, 'labs', 'read');
  const conditions = [
    eq(labResults.userId, ownerId),
    dependentFilter(labResults.dependentId, null),
  ];
  if (opts.test) {
    // SQLite LIKE is case-insensitive for ASCII — matches PostgREST ilike
    conditions.push(like(labResults.testName, `%${opts.test}%`));
  }
  if (opts.days && opts.days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - opts.days);
    conditions.push(gte(labVisits.visitDate, since.toISOString().split('T')[0]));
  }
  const rows = await db
    .select({ result: labResults, visitDate: labVisits.visitDate })
    .from(labResults)
    .innerJoin(labVisits, eq(labResults.labVisitId, labVisits.id))
    .where(and(...conditions))
    .orderBy(desc(labResults.id));
  return rows.map(({ result, visitDate }) => ({ ...result, visitDate }));
}
