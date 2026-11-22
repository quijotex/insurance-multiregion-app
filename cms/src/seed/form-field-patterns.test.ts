import { describe, expect, it } from 'vitest';
import {
  CL_MOBILE_PATTERN,
  CL_PLATE_PATTERN,
  CL_RUT_PATTERN,
  CO_DOCUMENT_NUMBER_PATTERN,
  CO_MOBILE_PATTERN,
  CO_PLATE_PATTERN,
  EMAIL_PATTERN,
  FULL_NAME_PATTERN,
} from './form-field-patterns';
import { BY_COUNTRY, countriesNeedingLegalAge } from './form-fields';

const table: Array<[string, string, string[], string[]]> = [
  ['cédula', CO_DOCUMENT_NUMBER_PATTERN, ['123456', '1020304050'], ['12345', '10203040501', '1.020.304', 'abc123']],
  ['placa', CO_PLATE_PATTERN, ['ABC123', 'abc123'], ['AB123', 'ABC1234', 'AB-123']],
  ['patente', CL_PLATE_PATTERN, ['BCDF12', 'AB1234'], ['BCD123', 'A12345']],
  ['celular CO', CO_MOBILE_PATTERN, ['3001234567'], ['2001234567']],
  ['celular CL', CL_MOBILE_PATTERN, ['912345678'], ['81234567']],
  ['email', EMAIL_PATTERN, ['ana@correo.test'], ['ana@', 'ana correo.test']],
  ['nombre', FULL_NAME_PATTERN, ['Ana María Pérez'], ['Ana2', 'Al']],
  ['RUT permisivo', CL_RUT_PATTERN, ['12.345.678-5', '12345678-k', '123456785'], ['1-9', 'abc']],
];

describe('US-01 · FR-013 seed patterns', () => {
  for (const [name, pattern, valid, invalid] of table) {
    const re = new RegExp(pattern);
    it.each(valid)(`${name} accepts %s`, (v) => expect(re.test(v)).toBe(true));
    it.each(invalid)(`${name} rejects %s`, (v) => expect(re.test(v)).toBe(false));
  }
});

describe('US-01 · FR-007 legalAge backfill', () => {
  it('fills only null values and never overwrites', () => {
    const result = countriesNeedingLegalAge([
      { documentId: 'a', legalAge: null },
      { documentId: 'b', legalAge: 21 },
      { documentId: 'c' },
    ]);
    expect(result.map((c) => c.documentId)).toEqual(['a', 'c']);
  });
});

const CHARSETS: Record<string, RegExp> = { digits: /^[0-9]*$/, alphanumeric: /^[A-Za-z0-9]*$/, rut: /^[0-9kK.-]*$/ };
const longestValid: Record<string, string> = {
  'CO documentNumber': '1020304050',
  'CO mobilePhone': '3001234567',
  'CO plate': 'ABC123',
  'CO vehicleYear': '2026',
  'CL rut': '12.345.678-5',
  'CL mobilePhone': '912345678',
  'CL plate': 'BCDF12',
  'CL vehicleYear': '2026',
};

describe('US-01 · FR-015 seed input limits', () => {
  it.each(Object.entries(longestValid))('%s limits let its longest valid value through', (name, value) => {
    const [code, key] = name.split(' ');
    const v = BY_COUNTRY[code].find((f) => f.key === key)?.validations;
    expect(v?.allowedCharacters).toBeDefined();
    expect(v?.maxLength).toBeGreaterThanOrEqual(value.length);
    expect(CHARSETS[v!.allowedCharacters!].test(value)).toBe(true);
  });
});
