import { describe, expect, it } from 'vitest';
import { isAllowedCharacters, NO_INPUT_LIMITS, sanitizeInput } from './input-limits';

describe('US-01 · FR-015 sanitizeInput', () => {
  it('drops letters from a digits field', () => {
    expect(sanitizeInput('12a3b', 5, { allowedCharacters: 'digits', maxLength: null }).value).toBe('123');
  });

  it('caps length after filtering (paste of a formatted value)', () => {
    expect(sanitizeInput('3.001.234.567-89', 16, { allowedCharacters: 'digits', maxLength: 10 }).value).toBe(
      '3001234567',
    );
  });

  it('keeps letters and digits only for a plate', () => {
    expect(sanitizeInput('ab-c 123', 8, { allowedCharacters: 'alphanumeric', maxLength: 6 }).value).toBe('abc123');
  });

  it('keeps RUT characters (digits, dots, hyphen, K) and drops the rest', () => {
    expect(sanitizeInput('12.345.678-kx', 13, { allowedCharacters: 'rut', maxLength: 12 }).value).toBe('12.345.678-k');
  });

  it('keeps the caret after the same character when one is dropped before it', () => {
    // "12a|3": caret after "a" (index 3) → "12|3"
    expect(sanitizeInput('12a3', 3, { allowedCharacters: 'digits', maxLength: null })).toEqual({ value: '123', caret: 2 });
  });

  it('leaves the value untouched without limits', () => {
    expect(sanitizeInput('Ana María', 9, NO_INPUT_LIMITS)).toEqual({ value: 'Ana María', caret: 9 });
  });

  it('recognises only known character sets', () => {
    expect(isAllowedCharacters('digits')).toBe(true);
    expect(isAllowedCharacters('emoji')).toBe(false);
    expect(isAllowedCharacters('toString')).toBe(false);
    expect(isAllowedCharacters(null)).toBe(false);
  });
});

describe('US-01 · FR-015 sanitizeInput on a full field (review R-14)', () => {
  const phone = { allowedCharacters: 'digits' as const, maxLength: 10 };

  it('refuses a digit typed at the start instead of cutting the end', () => {
    expect(sanitizeInput('93001234567', 1, phone)).toEqual({ value: '3001234567', caret: 0 });
  });

  it('refuses a digit typed in the middle', () => {
    // "30012|9|34567": typed 9 after the 5th digit
    expect(sanitizeInput('30012934567', 6, phone)).toEqual({ value: '3001234567', caret: 5 });
  });

  it('keeps only the part of a paste that fits', () => {
    // "300|99999|1234" into "3001234" (7 digits): 3 fit
    expect(sanitizeInput('300999991234', 8, phone)).toEqual({ value: '3009991234', caret: 6 });
  });
});

