import { maskValue } from './mask';

describe('US-03 · FR-003 masked values keep the last 4 characters', () => {
  const examples: [string, string][] = [
    ['1020304050', '••••••4050'],
    ['10.006.000-0', '••••••••00-0'],
    ['12345', '•2345'],
    ['1234', '••••'],
  ];

  it.each(examples)('masks %s as %s', (input, expected) => {
    expect(maskValue(input)).toBe(expected);
  });
});
