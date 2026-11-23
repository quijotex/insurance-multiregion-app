import { AgeBand, Country } from '../../../core/country/country.model';

/** First band with fromAge <= age <= toAge gives its factor; no band or unknown age gives 1. */
function factorFor(age: number | null, bands: AgeBand[]): number {
  if (age === null) return 1;
  return bands.find((band) => band.fromAge <= age && age <= band.toAge)?.factor ?? 1;
}

/**
 * Simulated monthly price:
 * `Math.round(basePrice × driverAgeFactor × vehicleAgeFactor)`.
 *
 * Each factor is the first band of the country (`driverAgeBands` / `vehicleAgeBands`) that covers
 * the age (`fromAge <= age <= toAge`); no band, or an unknown age, gives 1.
 *
 * This is a simulation, not a real tariff, and it is intentionally NOT shown to customers: the UI
 * only shows the final price. See docs/adr/0005-simulated-price-rule-age-bands.md.
 */
export function simulatePrice(
  basePrice: number,
  driverAge: number | null,
  vehicleAge: number | null,
  country: Pick<Country, 'driverAgeBands' | 'vehicleAgeBands'>,
): number {
  return Math.round(
    basePrice *
      factorFor(driverAge, country.driverAgeBands) *
      factorFor(vehicleAge, country.vehicleAgeBands),
  );
}
