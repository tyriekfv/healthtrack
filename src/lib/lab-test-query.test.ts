import { describe, expect, it } from 'vitest';
import {
  appendRequestedLabTests,
  readRequestedLabTests,
} from './lab-test-query';

describe('lab test query parameters', () => {
  it('round-trips commas inside test names', () => {
    const params = new URLSearchParams({ dependent_id: 'all' });
    appendRequestedLabTests(params, [
      'Testosterone, Free',
      'Estradiol, Ultrasensitive, LC/MS',
    ]);

    expect(readRequestedLabTests(params)).toEqual([
      'Testosterone, Free',
      'Estradiol, Ultrasensitive, LC/MS',
    ]);
  });

  it('continues to accept the legacy CSV parameter', () => {
    expect(readRequestedLabTests(new URLSearchParams('tests=GGT,Hemoglobin'))).toEqual([
      'GGT',
      'Hemoglobin',
    ]);
  });
});
