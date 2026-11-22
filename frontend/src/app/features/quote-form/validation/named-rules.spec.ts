import { describe, expect, it } from 'vitest';
import { NAMED_RULES } from './named-rules';
import { ValidationContext } from './validation.model';

const ctx = (legalAge: number, today = new Date(2026, 10, 22)): ValidationContext => ({
  legalAge,
  today,
});

describe('US-01 · FR-014 RUT check digit', () => {
  const rut = NAMED_RULES['rut'](null, ctx(18));
  it.each(['12.345.678-5', '12345678-5', '123456785', '7.654.321-6', '1.000.005-K', '1.000.005-k'])(
    'accepts %s',
    (v) => expect(rut(v)).toBe(true),
  );
  it.each(['12.345.678-9', '1234A678-5', '123456-5', '1.000.005-1', ''])('rejects "%s"', (v) =>
    expect(rut(v)).toBe(false),
  );
});

describe('US-01 · FR-007 legal age', () => {
  const today = new Date(2026, 10, 22);
  const rule18 = NAMED_RULES['legalAge'](null, ctx(18, today));
  it('valid when turning 18 today', () => expect(rule18('2008-11-22')).toBe(true));
  it('invalid when turning 18 tomorrow', () => expect(rule18('2008-11-23')).toBe(false));
  it('invalid for future date', () => expect(rule18('2030-01-01')).toBe(false));
  it('invalid for malformed or impossible date', () => {
    expect(rule18('abc')).toBe(false);
    expect(rule18('2000-02-31')).toBe(false);
  });
  it('uses the country legal age (21)', () => {
    const rule21 = NAMED_RULES['legalAge'](null, ctx(21, today));
    expect(rule21('2006-11-22')).toBe(false);
    expect(rule21('2005-11-22')).toBe(true);
  });
});

describe('US-01 · FR-008 year range rules', () => {
  const ago = NAMED_RULES['maxYearsAgo'](20, ctx(18));
  const ahead = NAMED_RULES['maxYearsAhead'](1, ctx(18));
  it.each([
    ['2006', true],
    ['2005', false],
    ['20.5', false],
    ['abc', false],
  ] as const)('maxYearsAgo 20: %s -> %s', (v, ok) => expect(ago(v)).toBe(ok));
  it.each([
    ['2027', true],
    ['2028', false],
    ['20.5', false],
    ['abc', false],
  ] as const)('maxYearsAhead 1: %s -> %s', (v, ok) => expect(ahead(v)).toBe(ok));
});
