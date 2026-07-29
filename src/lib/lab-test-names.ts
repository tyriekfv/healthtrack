/**
 * Canonical key for a lab analyte across provider-specific display names.
 *
 * Only collapses pure presentation variance — abbreviations ("HGB" vs
 * "Hemoglobin") and word-order/punctuation differences ("Free T" vs
 * "Testosterone, Free") for the SAME assay. It deliberately does NOT collapse
 * different assay methods into one key: "Testosterone, Total" (standard
 * immunoassay) and "Testosterone, Total, MS" (LC-MS/MS) are clinically
 * distinct measurements with different accuracy profiles — immunoassays are
 * well documented to read inaccurately at high concentrations, which is
 * exactly where the two methods' values diverge most. Merging them lost that
 * distinction and made the more-accurate result indistinguishable from the
 * less-accurate one on the dashboard. Same reasoning for Estradiol vs
 * Estradiol, Ultrasensitive (LC-MS) — a different, more precise assay, not a
 * naming variant of the same one.
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
    testosterone: 'testosterone total',
    'testosterone total': 'testosterone total',
    'testosterone free': 'testosterone free',
    'free testosterone': 'testosterone free',
    'free t': 'testosterone free',
    'psa free': 'psa free',
    'free psa': 'psa free',
    'prostate specific antigen free': 'psa free',
    'prostate specific ag free': 'psa free',
  };

  return aliases[normalized] ?? normalized;
}
