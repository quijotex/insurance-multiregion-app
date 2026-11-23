import { describe, expect, it } from 'vitest';
import { DRIVER_BANDS, VEHICLE_BANDS, pricingPatch, shouldPublishAfterBackfill } from './countries';

describe('US-02 · FR-004 country pricing backfill (UT-10)', () => {
  it('fills currency, locale and bands when all are missing', () => {
    expect(pricingPatch({ code: 'CL' })).toEqual({
      currency: 'CLP',
      numberLocale: 'es-CL',
      driverAgeBands: DRIVER_BANDS,
      vehicleAgeBands: VEHICLE_BANDS,
    });
  });

  it('R-01 · fills only what is missing on a pre-US-02 row (currency missing)', () => {
    const edited = [{ fromAge: 0, toAge: 99, factor: 1.5 }];
    expect(
      pricingPatch({ code: 'CO', currency: null, numberLocale: 'en-US', driverAgeBands: edited, vehicleAgeBands: [] }),
    ).toEqual({ currency: 'COP', vehicleAgeBands: VEHICLE_BANDS });
  });

  it('R-01 · regression: emptied bands on a country that already has currency stay empty', () => {
    expect(
      pricingPatch({ code: 'CL', currency: 'CLP', numberLocale: 'es-CL', driverAgeBands: [], vehicleAgeBands: [] }),
    ).toEqual({});
    expect(
      pricingPatch({ code: 'CL', currency: 'CLP', numberLocale: 'es-CL', driverAgeBands: null, vehicleAgeBands: null }),
    ).toEqual({});
  });

  it('never overwrites edited values', () => {
    const edited = [{ fromAge: 0, toAge: 99, factor: 1.5 }];
    expect(
      pricingPatch({ code: 'CO', currency: 'USD', numberLocale: 'en-US', driverAgeBands: edited, vehicleAgeBands: [] }),
    ).toEqual({});
    expect(
      pricingPatch({ code: 'CO', currency: 'COP', numberLocale: 'es-CO', driverAgeBands: edited, vehicleAgeBands: edited }),
    ).toEqual({});
  });
});

describe('US-02 · FR-004 backfill publish decision', () => {
  it('R-01 · draft not ahead of the published version: publish after writing', () => {
    expect(
      shouldPublishAfterBackfill({
        draftUpdatedAt: '2026-01-01T10:00:00.000Z',
        publishedAt: '2026-01-01T10:00:00.000Z',
        publishedUpdatedAt: '2026-01-01T10:00:00.000Z',
      }),
    ).toBe(true);
  });

  it('R-01 · draft ahead (pending editor changes): do not publish (warning)', () => {
    expect(
      shouldPublishAfterBackfill({
        draftUpdatedAt: '2026-02-01T10:00:00.000Z',
        publishedAt: '2026-01-01T10:00:00.000Z',
        publishedUpdatedAt: '2026-01-01T10:00:00.000Z',
      }),
    ).toBe(false);
  });

  it('R-01 · never publishes when there is no published version', () => {
    expect(shouldPublishAfterBackfill({ draftUpdatedAt: '2026-01-01T10:00:00.000Z', publishedAt: null })).toBe(false);
  });
});
