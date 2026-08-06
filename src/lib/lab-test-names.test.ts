import { describe, expect, it } from 'vitest';
import { canonicalLabTestName, normalizeLabTestName } from './lab-test-names';

describe('normalizeLabTestName', () => {
  it.each([
    ['Testosterone', 'Testosterone, Total'],
    ['HGB', 'Hemoglobin'],
    ['HCT, Auto', 'Hematocrit'],
    ['Free T', 'Testosterone, Free'],
    ['Free PSA', 'PSA, Free'],
  ])('matches provider aliases for the same assay: %s / %s', (left, right) => {
    expect(normalizeLabTestName(left)).toBe(normalizeLabTestName(right));
  });

  it('does not merge free and total testosterone', () => {
    expect(normalizeLabTestName('Testosterone, Free')).not.toBe(
      normalizeLabTestName('Testosterone, Total'),
    );
  });

  it('does not merge different assay methods for the same analyte', () => {
    // Immunoassay vs LC-MS/MS: clinically distinct accuracy profiles, must
    // stay distinguishable rather than silently picking one as "the" value.
    expect(normalizeLabTestName('Testosterone, Total, MS')).not.toBe(
      normalizeLabTestName('Testosterone, Total'),
    );
    expect(normalizeLabTestName('Testosterone, Total, LC/MS/MS')).not.toBe(
      normalizeLabTestName('Testosterone, Total'),
    );
    expect(normalizeLabTestName('Estradiol, Ultrasensitive, LC/MS')).not.toBe(
      normalizeLabTestName('Estradiol'),
    );
  });

  it('folds case, punctuation, unicode, and whitespace', () => {
    expect(normalizeLabTestName('  TESTOSTERONE,\u00a0TOTAL  ')).toBe(
      normalizeLabTestName('testosterone total'),
    );
  });
});

describe('canonicalLabTestName', () => {
  it.each([
    ['HGB', 'Hemoglobin'],
    ['Hgb', 'Hemoglobin'],
    ['HCT, Auto', 'Hematocrit'],
    ['Free T', 'Testosterone, Free'],
    ['Testosterone', 'Testosterone, Total'],
    ['Free PSA', 'PSA, Free'],
    ['PSA', 'PSA, Total'],
    ['GLU', 'Glucose'],
    ['Total Cholesterol', 'Cholesterol, Total'],
    ['Thyroid Stimulating Hormone', 'TSH'],
    ['HbA1c', 'Hemoglobin A1c'],
    ['25-OH Vitamin D', 'Vitamin D, 25-Hydroxy'],
  ])('maps a provider spelling to its canonical display name: %s -> %s', (raw, canonical) => {
    expect(canonicalLabTestName(raw)).toBe(canonical);
  });

  it('keeps distinct assay methods distinct rather than collapsing them', () => {
    expect(canonicalLabTestName('Testosterone, Total, MS')).toBe('Testosterone, Total, MS');
    expect(canonicalLabTestName('Testosterone, Total, MS')).not.toBe(
      canonicalLabTestName('Testosterone, Total'),
    );
    expect(canonicalLabTestName('Estradiol, Ultrasensitive')).not.toBe(
      canonicalLabTestName('Estradiol'),
    );
  });

  it('passes an unrecognized test name through unchanged (trimmed)', () => {
    expect(canonicalLabTestName('  Some Obscure Panel Value  ')).toBe('Some Obscure Panel Value');
  });

  describe('eGFR / cystatin-C split', () => {
    it('splits eGFR into its own bucket when the panel signals cystatin C', () => {
      expect(canonicalLabTestName('eGFR', 'Cystatin C with eGFR')).toBe('Cystatin C - eGFR');
      expect(canonicalLabTestName('eGFR', 'Cystatin C with eGFR')).not.toBe(
        canonicalLabTestName('eGFR', 'Comprehensive Metabolic Panel'),
      );
    });

    it('applies the split across every eGFR spelling, not just the bare name', () => {
      expect(canonicalLabTestName('Estimated GFR', 'Cystatin C with eGFR')).toBe('Cystatin C - eGFR');
      expect(canonicalLabTestName('Glomerular Filtration Rate', 'Cystatin C with eGFR')).toBe(
        'Cystatin C - eGFR',
      );
    });

    it('keeps creatinine-based eGFR merged under the normal canonical name', () => {
      expect(canonicalLabTestName('eGFR', 'Comprehensive Metabolic Panel')).toBe('eGFR');
      expect(canonicalLabTestName('eGFR', 'Creatinine')).toBe('eGFR');
      expect(canonicalLabTestName('Glomerular Filtration Rate', 'Creatinine, Serum')).toBe('eGFR');
      // No panel context at all — still falls back to the normal bucket.
      expect(canonicalLabTestName('eGFR')).toBe('eGFR');
    });

    it('is case-insensitive on the panel name', () => {
      expect(canonicalLabTestName('eGFR', 'CYSTATIN C WITH EGFR')).toBe('Cystatin C - eGFR');
    });
  });
});
