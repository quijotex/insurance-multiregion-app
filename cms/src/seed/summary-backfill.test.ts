import { describe, expect, it } from 'vitest';
import { TERMS_BY_COUNTRY, shouldPublishAfterBackfill, shouldRunTermsBackfill, termsPatch, termsUpgradePatch } from './countries';
import { rowsNeedingMaskedFlag } from './form-fields';

describe('US-03 · FR-003 masked flag backfill (UT-09)', () => {
  it('flags only documentNumber/rut rows where it is null or missing', () => {
    const rows = [
      { key: 'documentNumber', maskedInSummary: null },
      { key: 'rut' },
      { key: 'email', maskedInSummary: null },
      { key: 'plate' },
    ];
    expect(rowsNeedingMaskedFlag(rows).map((r) => r.key)).toEqual(['documentNumber', 'rut']);
  });

  it('never overrides a value an editor set (true or false)', () => {
    expect(
      rowsNeedingMaskedFlag([
        { key: 'documentNumber', maskedInSummary: false },
        { key: 'rut', maskedInSummary: true },
      ]),
    ).toEqual([]);
  });
});

describe('US-03 · FR-014 terms backfill (UT-09)', () => {
  it('adds the seeded terms when empty (null, missing or [])', () => {
    for (const termsAndConditions of [null, undefined, []]) {
      expect(termsPatch({ code: 'CO', termsAndConditions })).toEqual({ termsAndConditions: TERMS_BY_COUNTRY.CO });
    }
  });

  it('never overwrites existing terms; CO and CL texts differ', () => {
    expect(termsPatch({ code: 'CL', termsAndConditions: [{ type: 'paragraph' }] })).toEqual({});
    expect(TERMS_BY_COUNTRY.CO).not.toEqual(TERMS_BY_COUNTRY.CL);
  });

  it('adds nothing for a country without seeded terms (PE)', () => {
    expect(termsPatch({ code: 'PE', termsAndConditions: null })).toEqual({});
  });

  it('publishes only when the draft is clean', () => {
    expect(shouldPublishAfterBackfill({ draftUpdatedAt: '2026-01-01T10:00:00Z', publishedAt: '2026-01-01T10:00:00Z' })).toBe(true);
    expect(shouldPublishAfterBackfill({ draftUpdatedAt: '2026-02-01T10:00:00Z', publishedAt: '2026-01-01T10:00:00Z' })).toBe(false);
  });

  it('R-01 · marker present: no backfill even when terms are empty; marker absent: backfill runs', () => {
    expect(shouldRunTermsBackfill(true)).toBe(false);
    expect(shouldRunTermsBackfill(false)).toBe(true);
    // With the marker absent the per-row rule still fills empty terms.
    expect(termsPatch({ code: 'CO', termsAndConditions: [] })).toEqual({ termsAndConditions: TERMS_BY_COUNTRY.CO });
  });
});

describe('US-03 · FR-005 terms upgrade (Gate 3)', () => {
  it('Gate 3 · replaces only the untouched first seed (heading and mock-data line) with the current terms', () => {
    const lead = [
      { type: 'heading', level: 2, children: [{ type: 'text', text: 'Términos y condiciones del seguro de auto en Colombia' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'Esta cotización es una simulación con datos ficticios y no constituye una póliza vigente.' }] },
    ];
    const firstSeed = [...lead, ...TERMS_BY_COUNTRY.CO];
    expect(termsUpgradePatch({ code: 'CO', termsAndConditions: firstSeed })).toEqual({ termsAndConditions: TERMS_BY_COUNTRY.CO });
    expect(termsUpgradePatch({ code: 'CO', termsAndConditions: [...firstSeed, lead[1]] })).toEqual({});
    expect(termsUpgradePatch({ code: 'CO', termsAndConditions: TERMS_BY_COUNTRY.CO })).toEqual({});
    expect(termsUpgradePatch({ code: 'CO', termsAndConditions: [] })).toEqual({});
  });
});
