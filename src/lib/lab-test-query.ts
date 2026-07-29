/**
 * Add requested lab test names without treating commas inside a provider's
 * display name as separators (for example "Testosterone, Free").
 */
export function appendRequestedLabTests(
  params: URLSearchParams,
  testNames: string[],
): void {
  for (const testName of testNames) {
    params.append('test', testName);
  }
}

/** Read intact repeated params, with compatibility for older CSV clients. */
export function readRequestedLabTests(
  params: URLSearchParams,
): string[] | undefined {
  const repeated = params.getAll('test').map((name) => name.trim()).filter(Boolean);
  if (repeated.length > 0) return repeated;

  const legacyCsv = params.get('tests');
  if (!legacyCsv) return undefined;
  return legacyCsv.split(',').map((name) => name.trim()).filter(Boolean);
}
