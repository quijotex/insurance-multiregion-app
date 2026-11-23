import { describe, expect, it } from 'vitest';
import { checkFormFieldIntegrity, checkPlanIntegrity, planIntegrityMessage, readCountryPayload } from './country-integrity';

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


describe('US-02 · FR-001 plan integrity (UT-09, R-10)', () => {
  // R-10: runs the real code path the middleware uses (planIntegrityMessage) against a fake strapi.
  const fakeStrapi = (stored: string | null, numericIdToDocumentId: string | null = null) =>
    ({
      documents: () => ({ findOne: async () => (stored ? { country: { documentId: stored } } : { country: null }) }),
      db: { query: () => ({ findOne: async () => (numericIdToDocumentId ? { documentId: numericIdToDocumentId } : null) }) },
    }) as never;
  const run = (data: Record<string, unknown>, stored: string | null, documentId: string | undefined, numeric: string | null = null) =>
    planIntegrityMessage(fakeStrapi(stored, numeric), { params: { documentId, data } });

  it('rejects a plan without country on create, update and publish', async () => {
    const msg = 'El plan debe tener un país.';
    expect(await run({}, null, undefined)).toBe(msg); // create without country
    expect(await run({ country: null }, 'co', 'p1')).toBe(msg);
    expect(await run({ country: { set: [] } }, 'co', 'p1')).toBe(msg);
    expect(await run({ country: { connect: [], disconnect: [{ id: 1 }] } }, 'co', 'p1')).toBe(msg);
    expect(await run({ country: { connect: [], disconnect: [] } }, null, 'p1')).toBe(msg); // publish, none stored
    expect(await run({ country: 7 }, 'co', 'p1', null)).toBe(msg); // numeric id that resolves to nothing
  });

  it('accepts a save that leaves the country untouched, or sets one', async () => {
    expect(await run({ country: { connect: [], disconnect: [] } }, 'co', 'p1')).toBeNull();
    expect(await run({ name: 'x' }, 'co', 'p1')).toBeNull();
    expect(await run({ country: { connect: [{ documentId: 'cl' }] } }, null, undefined)).toBeNull();
    expect(await run({ country: 7 }, null, undefined, 'cl')).toBeNull();
  });

  it('keeps the pure rule', () => {
    expect(checkPlanIntegrity({ countryDocumentId: null })).toBe('El plan debe tener un país.');
    expect(checkPlanIntegrity({ countryDocumentId: 'co' })).toBeNull();
  });
});
