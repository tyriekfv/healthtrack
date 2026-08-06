/**
 * Canonical name + grouping key for a lab analyte across provider-specific
 * report formats (Labcorp, Quest Diagnostics, Kaiser Permanente, and others
 * report the same assay under different labels — "HGB" vs "Hemoglobin",
 * "Free T" vs "Testosterone, Free").
 *
 * Two things live here:
 * - `normalizeLabTestName` — a lowercase/punctuation-folded grouping key,
 *   used to match test names for equality (dashboard filters, trend
 *   grouping) without caring how the name is displayed.
 * - `canonicalLabTestName` — the pretty display name written to the DB at
 *   import/entry time (see repos/labs.ts) so every source ends up under one
 *   consistent label. Names outside this table pass through unchanged
 *   (trimmed) rather than being mangled.
 *
 * This deliberately does NOT collapse different assay methods into one
 * canonical name: "Testosterone, Total" (standard immunoassay) and
 * "Testosterone, Total, MS" (LC-MS/MS) are clinically distinct measurements
 * with different accuracy profiles — immunoassays are well documented to
 * read inaccurately at high concentrations, which is exactly where the two
 * methods' values diverge most. Merging them lost that distinction and made
 * the more-accurate result indistinguishable from the less-accurate one on
 * the dashboard. Same reasoning for Estradiol vs Estradiol, Ultrasensitive
 * (LC-MS) — a different, more precise assay, not a naming variant of the
 * same one. Percent vs. absolute-count differentials (e.g. Neutrophils %
 * vs Neutrophils Absolute) are kept separate for the same reason: they are
 * different numbers with different units, not two spellings of one value.
 */

function fold(name: string): string {
  return name
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface AnalyteGroup {
  /** Pretty display name written to the DB and shown to users. */
  canonical: string;
  /** Provider-specific spellings that mean the same assay (folded via `fold`). */
  variants: string[];
}

const ANALYTE_GROUPS: AnalyteGroup[] = [
  // --- CBC ---------------------------------------------------------------
  { canonical: 'Hemoglobin', variants: ['Hemoglobin', 'HGB', 'Hgb'] },
  { canonical: 'Hematocrit', variants: ['Hematocrit', 'HCT', 'Hct', 'HCT, Auto', 'HCT Auto'] },
  { canonical: 'WBC', variants: ['WBC', 'White Blood Cell Count', 'White Blood Cells', 'Leukocytes'] },
  { canonical: 'RBC', variants: ['RBC', 'Red Blood Cell Count', 'Red Blood Cells', 'Erythrocytes'] },
  { canonical: 'MCV', variants: ['MCV'] },
  { canonical: 'MCH', variants: ['MCH'] },
  { canonical: 'MCHC', variants: ['MCHC'] },
  { canonical: 'RDW', variants: ['RDW', 'RDW-CV', 'RDW CV'] },
  { canonical: 'Platelets', variants: ['Platelets', 'Platelet Count', 'PLT'] },
  { canonical: 'MPV', variants: ['MPV', 'Mean Platelet Volume'] },
  { canonical: 'Neutrophils %', variants: ['Neutrophils', 'Neutrophils %', 'Neutrophils Percent', 'Neut %', 'Neutrophil Percent'] },
  { canonical: 'Neutrophils Absolute', variants: ['Neutrophils Absolute', 'Absolute Neutrophils', 'Neut Abs', 'Neutrophils Abs'] },
  { canonical: 'Lymphocytes %', variants: ['Lymphocytes', 'Lymphocytes %', 'Lymphs %', 'Lymphocyte Percent'] },
  { canonical: 'Lymphocytes Absolute', variants: ['Lymphocytes Absolute', 'Absolute Lymphocytes', 'Lymphs Abs'] },
  { canonical: 'Monocytes %', variants: ['Monocytes', 'Monocytes %', 'Monocyte Percent'] },
  { canonical: 'Monocytes Absolute', variants: ['Monocytes Absolute', 'Absolute Monocytes', 'Monocytes Abs'] },
  { canonical: 'Eosinophils %', variants: ['Eosinophils', 'Eosinophils %', 'Eosinophil Percent'] },
  { canonical: 'Eosinophils Absolute', variants: ['Eosinophils Absolute', 'Absolute Eosinophils', 'Eosinophils Abs'] },
  { canonical: 'Basophils %', variants: ['Basophils', 'Basophils %', 'Basophil Percent'] },
  { canonical: 'Basophils Absolute', variants: ['Basophils Absolute', 'Absolute Basophils', 'Basophils Abs'] },

  // --- CMP -----------------------------------------------------------------
  { canonical: 'Glucose', variants: ['Glucose', 'Glucose, Fasting', 'Glucose Fasting', 'GLU'] },
  { canonical: 'BUN', variants: ['BUN', 'Blood Urea Nitrogen', 'Urea Nitrogen'] },
  { canonical: 'Creatinine', variants: ['Creatinine', 'CREAT'] },
  { canonical: 'eGFR', variants: ['eGFR', 'EGFR', 'GFR Estimated', 'Estimated GFR'] },
  { canonical: 'BUN/Creatinine Ratio', variants: ['BUN/Creatinine Ratio', 'BUN Creatinine Ratio'] },
  { canonical: 'Sodium', variants: ['Sodium', 'Na'] },
  { canonical: 'Potassium', variants: ['Potassium', 'K'] },
  { canonical: 'Chloride', variants: ['Chloride', 'Cl'] },
  { canonical: 'CO2', variants: ['CO2', 'Carbon Dioxide', 'Bicarbonate', 'CO2, Total', 'CO2 Total'] },
  { canonical: 'Calcium', variants: ['Calcium', 'Ca'] },
  { canonical: 'Total Protein', variants: ['Total Protein', 'Protein, Total', 'Protein Total'] },
  { canonical: 'Albumin', variants: ['Albumin'] },
  { canonical: 'Globulin', variants: ['Globulin', 'Globulin, Total', 'Globulin Total'] },
  { canonical: 'A/G Ratio', variants: ['A/G Ratio', 'Albumin/Globulin Ratio', 'Albumin Globulin Ratio'] },
  { canonical: 'Bilirubin, Total', variants: ['Bilirubin, Total', 'Bilirubin Total', 'Total Bilirubin'] },
  { canonical: 'ALT', variants: ['ALT', 'SGPT', 'Alanine Aminotransferase'] },
  { canonical: 'AST', variants: ['AST', 'SGOT', 'Aspartate Aminotransferase'] },
  { canonical: 'Alkaline Phosphatase', variants: ['Alkaline Phosphatase', 'ALP', 'Alk Phos'] },

  // --- Lipid panel -----------------------------------------------------
  { canonical: 'Cholesterol, Total', variants: ['Cholesterol, Total', 'Cholesterol Total', 'Total Cholesterol', 'Cholesterol'] },
  { canonical: 'HDL Cholesterol', variants: ['HDL Cholesterol', 'HDL', 'Cholesterol, HDL', 'Cholesterol HDL', 'HDL-C'] },
  { canonical: 'LDL Cholesterol', variants: ['LDL Cholesterol', 'LDL', 'Cholesterol, LDL', 'Cholesterol LDL', 'LDL-C', 'LDL Chol Calc', 'LDL Cholesterol Calc'] },
  { canonical: 'Triglycerides', variants: ['Triglycerides', 'Trig', 'TRIG'] },
  { canonical: 'Cholesterol/HDL Ratio', variants: ['Cholesterol/HDL Ratio', 'Cholesterol HDL Ratio', 'CHOL/HDLC Ratio'] },
  { canonical: 'Non-HDL Cholesterol', variants: ['Non-HDL Cholesterol', 'Non HDL Cholesterol', 'Non-HDL Chol'] },

  // --- Thyroid -----------------------------------------------------------
  { canonical: 'TSH', variants: ['TSH', 'Thyroid Stimulating Hormone'] },
  { canonical: 'T4, Free', variants: ['T4, Free', 'T4 Free', 'Free T4', 'FT4'] },
  { canonical: 'T3, Free', variants: ['T3, Free', 'T3 Free', 'Free T3', 'FT3'] },
  { canonical: 'T4, Total', variants: ['T4, Total', 'T4 Total', 'Total T4', 'T4'] },
  { canonical: 'T3, Total', variants: ['T3, Total', 'T3 Total', 'Total T3', 'T3'] },

  // --- Hormones ------------------------------------------------------------
  { canonical: 'Testosterone, Total', variants: ['Testosterone', 'Testosterone, Total', 'Testosterone Total'] },
  { canonical: 'Testosterone, Total, MS', variants: ['Testosterone, Total, MS', 'Testosterone Total MS', 'Testosterone, Total MS'] },
  { canonical: 'Testosterone, Free', variants: ['Testosterone, Free', 'Testosterone Free', 'Free Testosterone', 'Free T'] },
  { canonical: 'SHBG', variants: ['SHBG', 'Sex Hormone Binding Globulin'] },
  { canonical: 'LH', variants: ['LH', 'Luteinizing Hormone'] },
  { canonical: 'FSH', variants: ['FSH', 'Follicle Stimulating Hormone'] },
  { canonical: 'Prolactin', variants: ['Prolactin'] },
  { canonical: 'DHEA-S', variants: ['DHEA-S', 'DHEA Sulfate', 'DHEAS'] },
  { canonical: 'Estradiol', variants: ['Estradiol', 'E2'] },
  { canonical: 'Estradiol, Ultrasensitive', variants: ['Estradiol, Ultrasensitive', 'Estradiol Ultrasensitive'] },

  // --- PSA -----------------------------------------------------------------
  { canonical: 'PSA, Total', variants: ['PSA', 'PSA, Total', 'PSA Total', 'Prostate Specific Antigen'] },
  { canonical: 'PSA, Free', variants: ['PSA, Free', 'PSA Free', 'Free PSA', 'Prostate Specific Antigen Free', 'Prostate Specific Ag Free'] },

  // --- Vitamins / iron -----------------------------------------------------
  { canonical: 'Vitamin D, 25-Hydroxy', variants: ['Vitamin D, 25-Hydroxy', 'Vitamin D 25-Hydroxy', '25-Hydroxy Vitamin D', 'Vitamin D', 'Vitamin D3', '25-OH Vitamin D', 'Vit D, 25-OH'] },
  { canonical: 'Vitamin B12', variants: ['Vitamin B12', 'B12', 'Cobalamin'] },
  { canonical: 'Folate', variants: ['Folate', 'Folic Acid'] },
  { canonical: 'Ferritin', variants: ['Ferritin'] },
  { canonical: 'Iron', variants: ['Iron', 'Iron, Total', 'Iron Total'] },
  { canonical: 'TIBC', variants: ['TIBC', 'Total Iron Binding Capacity'] },
  { canonical: 'Iron Saturation', variants: ['Iron Saturation', '% Saturation', 'Transferrin Saturation'] },

  // --- Other commonly tracked panels ---------------------------------------
  { canonical: 'Hemoglobin A1c', variants: ['Hemoglobin A1c', 'HbA1c', 'A1C', 'Hemoglobin A1C'] },
  { canonical: 'hs-CRP', variants: ['hs-CRP', 'hsCRP', 'C-Reactive Protein, Cardiac', 'C-Reactive Protein Cardiac', 'CRP High Sensitivity'] },
];

const FOLD_TO_GROUP_KEY = new Map<string, string>();
const FOLD_TO_CANONICAL = new Map<string, string>();

for (const group of ANALYTE_GROUPS) {
  const groupKey = fold(group.canonical);
  for (const variant of [group.canonical, ...group.variants]) {
    const key = fold(variant);
    FOLD_TO_GROUP_KEY.set(key, groupKey);
    FOLD_TO_CANONICAL.set(key, group.canonical);
  }
}

/** Lowercase/punctuation-folded grouping key — for equality matching only, not display. */
export function normalizeLabTestName(name: string): string {
  const key = fold(name);
  return FOLD_TO_GROUP_KEY.get(key) ?? key;
}

/**
 * Pretty display name for a lab analyte, used to canonicalize `test_name`
 * at write time (see repos/labs.ts) so every provider's spelling collapses
 * to one label. Names outside the known table pass through unchanged
 * (trimmed) — this only ever normalizes recognized analytes, never mangles
 * an unfamiliar one.
 */
export function canonicalLabTestName(name: string): string {
  const key = fold(name);
  return FOLD_TO_CANONICAL.get(key) ?? name.trim();
}
