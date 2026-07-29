import { describe, expect, it } from 'vitest';
import { normalizeLabTestName } from './lab-test-names';

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
