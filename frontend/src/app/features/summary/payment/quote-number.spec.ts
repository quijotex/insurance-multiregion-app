import { createQuoteNumber } from './quote-number';

describe('US-03 · FR-009 quote number', () => {
  const now = new Date(2026, 10, 22, 10, 0, 0);

  it('follows CC-YYYYMMDD-XXXXXX with no look-alike characters', () => {
    expect(createQuoteNumber('co', now)).toMatch(/^CO-20261122-[2-9A-HJKMNP-Z]{6}$/);
  });

  it('is built from the injected random source', () => {
    expect(createQuoteNumber('CL', now, () => 0)).toBe('CL-20261122-222222');
  });

  it('gives 1000 unique numbers', () => {
    const numbers = new Set(Array.from({ length: 1000 }, () => createQuoteNumber('CO', now)));
    expect(numbers.size).toBe(1000);
  });
});
