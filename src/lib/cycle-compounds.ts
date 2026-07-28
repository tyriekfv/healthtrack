/**
 * Starting compound list (§5 of the source brief) — not exhaustive. "Other"
 * exists for anything not enumerated; the dose field itself stays free text
 * so unusual dosing conventions (IU, mL, "3x/week") aren't over-constrained.
 */
export const CYCLE_COMPOUNDS = [
  'Testosterone',
  'Primo',
  'Masteron',
  'GH',
  'HCG',
  'Tren A',
  'Anavar',
  'Anadrol',
  'Testosterone Suspension',
  'Other',
] as const;
