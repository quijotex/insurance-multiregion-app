import { describe, expect, it } from 'vitest';
import { DRIVER_BANDS, VEHICLE_BANDS, pricingPatch } from './countries';

describe('US-02 · FR-004 country pricing backfill (UT-10)', () => {
  it('fills currency, locale and bands when all are missing', () => {
    expect(pricingPatch({ code: 'CL' })).toEqual({
      currency: 'CLP',
      numberLocale: 'es-CL',
      driverAgeBands: DRIVER_BANDS,
      vehicleAgeBands: VEHICLE_BANDS,
    });
  });

  it('never overwrites edited values and fills only what is missing', () => {
    const edited = [{ fromAge: 0, toAge: 99, factor: 1.5 }];
    expect(
      pricingPatch({ code: 'CO', currency: 'USD', numberLocale: 'en-US', driverAgeBands: edited, vehicleAgeBands: [] }),
    ).toEqual({ vehicleAgeBands: VEHICLE_BANDS });
    expect(
      pricingPatch({ code: 'CO', currency: 'COP', numberLocale: 'es-CO', driverAgeBands: edited, vehicleAgeBands: edited }),
    ).toEqual({});
  });
});
