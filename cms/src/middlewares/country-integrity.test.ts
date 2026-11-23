import { describe, expect, it } from 'vitest';
import { checkFormFieldIntegrity, checkPlanIntegrity, readCountryPayload } from './country-integrity';

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
    expect(readCountryPayload({ set: [] })).toEqual({ present: true, ref: null });
    expect(readCountryPayload({ connect: [], disconnect: [{ id: 1 }] })).toEqual({ present: true, ref: null });
    expect(readCountryPayload(3)).toEqual({ present: true, ref: 3 });
  });
});

describe('US-01 · FR-001 admin edits keep the country (Gate 3 manual test)', () => {
  it('reads the untouched relation from the admin as no change, so editing another attribute is allowed', () => {
    expect(readCountryPayload({ connect: [], disconnect: [] })).toEqual({ present: false, ref: null });
    expect(readCountryPayload({ connect: [] })).toEqual({ present: false, ref: null });
  });

  it('reads a country changed in the admin (disconnect old, connect new)', () => {
    expect(
      readCountryPayload({ connect: [{ id: 2, documentId: 'cl' }], disconnect: [{ id: 1, documentId: 'co' }] }),
    ).toEqual({ present: true, ref: 'cl' });
  });
});


describe('US-02 · FR-001 plan integrity (UT-09)', () => {
  // The effective country is the payload's when present, else the stored one (null on create).
  const effective = (payload: unknown, stored: string | null) => {
    const { present, ref } = readCountryPayload(payload);
    return present ? (ref === null ? null : String(ref)) : stored;
  };

  it('rejects a plan without country on create, update and publish', () => {
    // create: nothing stored; update/publish: the payload clears the relation, or nothing is stored.
    const cases: Array<[unknown, string | null]> = [
      [undefined, null],
      [null, 'co'],
      [{ set: [] }, 'co'],
      [{ connect: [], disconnect: [{ id: 1 }] }, 'co'],
      [{ connect: [], disconnect: [] }, null],
    ];
    for (const [payload, stored] of cases) {
      expect(checkPlanIntegrity({ countryDocumentId: effective(payload, stored) })).toBe('El plan debe tener un país.');
    }
  });

  it('accepts a save that leaves the country untouched, or sets one', () => {
    expect(checkPlanIntegrity({ countryDocumentId: effective({ connect: [], disconnect: [] }, 'co') })).toBeNull();
    expect(checkPlanIntegrity({ countryDocumentId: effective({ connect: [{ documentId: 'cl' }] }, null) })).toBeNull();
  });
});
