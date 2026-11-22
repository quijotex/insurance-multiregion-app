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
