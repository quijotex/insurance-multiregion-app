import { describe, expect, it } from 'vitest';
import { checkFormFieldIntegrity, readCountryPayload } from './form-field-integrity';

describe('US-01 · Edge Cases form field integrity', () => {
  const existing = [
    { documentId: 'a1', key: 'plate' },
    { documentId: 'a2', key: 'email' },
  ];

  it('rejects a field without country', () => {
    expect(checkFormFieldIntegrity({ key: 'plate', countryDocumentId: null }, [])).toBe('El campo debe tener un país.');
  });

  it('rejects a duplicate key in the same country', () => {
    expect(checkFormFieldIntegrity({ key: 'plate', countryDocumentId: 'co', selfDocumentId: 'new' }, existing)).toBe(
      'Ya existe un campo con la clave «plate» para este país.',
    );
  });

  it('allows the same key in another country', () => {
    expect(checkFormFieldIntegrity({ key: 'plate', countryDocumentId: 'cl' }, [])).toBeNull();
  });

  it('allows an update that keeps its own key', () => {
    expect(
      checkFormFieldIntegrity({ key: 'plate', countryDocumentId: 'co', selfDocumentId: 'a1' }, existing),
    ).toBeNull();
  });

  it('allows a valid new field', () => {
    expect(checkFormFieldIntegrity({ key: 'city', countryDocumentId: 'co' }, existing)).toBeNull();
  });

  it('reads the relation payload shapes', () => {
    expect(readCountryPayload(undefined)).toEqual({ present: false, ref: null });
    expect(readCountryPayload('abc')).toEqual({ present: true, ref: 'abc' });
    expect(readCountryPayload({ connect: [{ documentId: 'abc' }] })).toEqual({ present: true, ref: 'abc' });
    expect(readCountryPayload({ set: ['abc'] })).toEqual({ present: true, ref: 'abc' });
    expect(readCountryPayload({ connect: [] })).toEqual({ present: true, ref: null });
    expect(readCountryPayload(3)).toEqual({ present: true, ref: 3 });
  });
});
