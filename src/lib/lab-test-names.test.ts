import { describe, expect, it } from 'vitest';
import { normalizeLabTestName } from './lab-test-names';

describe('normalizeLabTestName', () => {
  it.each([
    ['Testosterone', 'Testosterone, Total'],
    ['Testosterone, Total, MS', 'Testosterone, Total'],
    ['Testosterone, Total, LC/MS/MS', 'Testosterone'],
    ['Estradiol, Ultrasensitive, LC/MS', 'Estradiol'],
    ['HGB', 'Hemoglobin'],
    ['HCT, Auto', 'Hematocrit'],
  ])('matches provider aliases: %s / %s', (left, right) => {
    expect(normalizeLabTestName(left)).toBe(normalizeLabTestName(right));
  });

  it('does not merge free and total testosterone', () => {
    expect(normalizeLabTestName('Testosterone, Free')).not.toBe(
      normalizeLabTestName('Testosterone, Total'),
    );
  });

  it('folds case, punctuation, unicode, and whitespace', () => {
    expect(normalizeLabTestName('  TESTOSTERONE,\u00a0TOTAL  ')).toBe(
      normalizeLabTestName('testosterone total'),
    );
  });
});
