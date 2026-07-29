/**
 * Canonical key for a lab analyte across provider-specific display names.
 *
 * Labs commonly append the assay ("MS", "LC/MS/MS", "Ultrasensitive") or
 * use an abbreviation ("HGB", "HCT, Auto"). Those are presentation details,
 * not different dashboard metrics. Keep clinically distinct measurements
 * such as free testosterone separate.
 */
export function normalizeLabTestName(name: string): string {
  const normalized = name
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const aliases: Record<string, string> = {
    hgb: 'hemoglobin',
    hemoglobin: 'hemoglobin',
    'hct auto': 'hematocrit',
    hct: 'hematocrit',
    hematocrit: 'hematocrit',
    estradiol: 'estradiol',
    'estradiol ultrasensitive': 'estradiol',
    'estradiol ultrasensitive lc ms': 'estradiol',
    'estradiol ultrasensitive lc ms ms': 'estradiol',
    testosterone: 'testosterone total',
    'testosterone total': 'testosterone total',
    'testosterone total ms': 'testosterone total',
    'testosterone total lc ms': 'testosterone total',
    'testosterone total lc ms ms': 'testosterone total',
  };

  return aliases[normalized] ?? normalized;
}
