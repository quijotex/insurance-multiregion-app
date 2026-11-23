import { Country } from '../../../core/country/country.model';
import { agesFromStep1 } from './ages-from-step1';
import { formatPrice } from './format-price';
import { simulatePrice } from './simulate-price';

type Bands = Pick<Country, 'driverAgeBands' | 'vehicleAgeBands'>;

const bands: Bands = {
  driverAgeBands: [
    { fromAge: 0, toAge: 24, factor: 1.2 },
    { fromAge: 25, toAge: 65, factor: 1 },
    { fromAge: 66, toAge: 120, factor: 1.15 },
  ],
  vehicleAgeBands: [
    { fromAge: 0, toAge: 5, factor: 1 },
    { fromAge: 6, toAge: 10, factor: 1.1 },
    { fromAge: 11, toAge: 20, factor: 1.2 },
  ],
};

const overlapping: Bands = {
  driverAgeBands: [
    { fromAge: 20, toAge: 40, factor: 1.5 },
    { fromAge: 25, toAge: 35, factor: 3 },
  ],
  vehicleAgeBands: [],
};

interface PriceCase {
  name: string;
  base: number;
  driver: number | null;
  vehicle: number | null;
  bands: Bands;
  expected: number;
}

describe('US-02 · FR-005 simulatePrice', () => {
  const cases: PriceCase[] = [
    { name: 'driver 24 is in the young band', base: 100000, driver: 24, vehicle: 0, bands, expected: 120000 },
    { name: 'driver 25 is in the standard band', base: 100000, driver: 25, vehicle: 0, bands, expected: 100000 },
    { name: 'driver 65 is in the standard band', base: 100000, driver: 65, vehicle: 0, bands, expected: 100000 },
    { name: 'driver 66 is in the senior band', base: 100000, driver: 66, vehicle: 0, bands, expected: 115000 },
    { name: 'vehicle 5 and 6 change band (6)', base: 100000, driver: 30, vehicle: 6, bands, expected: 110000 },
    { name: 'vehicle 10 and 11 change band (11)', base: 100000, driver: 30, vehicle: 11, bands, expected: 120000 },
    { name: 'no band or unknown age gives factor 1; overlapping bands: first wins', base: 100000, driver: 30, vehicle: null, bands: overlapping, expected: 150000 },
    { name: 'rounds to a whole peso', base: 89990, driver: 22, vehicle: 8, bands, expected: 118787 },
  ];

  it.each(cases)('$name', ({ base, driver, vehicle, bands: country, expected }) => {
    expect(simulatePrice(base, driver, vehicle, country)).toBe(expected);
  });
});

describe('US-02 · FR-005 agesFromStep1', () => {
  const today = new Date(2026, 10, 22);

  it('driver age counts a birthday today but not tomorrow', () => {
    expect(agesFromStep1({ birthDate: '2000-11-22' }, today).driverAge).toBe(26);
    expect(agesFromStep1({ birthDate: '2000-11-23' }, today).driverAge).toBe(25);
  });

  it('vehicle age is the year difference and never below 0', () => {
    expect(agesFromStep1({ vehicleYear: '2018' }, today).vehicleAge).toBe(8);
    expect(agesFromStep1({ vehicleYear: '2027' }, today).vehicleAge).toBe(0);
  });

  it('missing, invalid or future values give null', () => {
    expect(agesFromStep1({}, today)).toEqual({ driverAge: null, vehicleAge: null });
    expect(agesFromStep1({ birthDate: '2000-02-31', vehicleYear: 'abc' }, today)).toEqual({
      driverAge: null,
      vehicleAge: null,
    });
    expect(agesFromStep1({ birthDate: '2030-01-01' }, today).driverAge).toBeNull();
  });

  it('ignores non-string values', () => {
    expect(agesFromStep1({ birthDate: true, vehicleYear: false }, today)).toEqual({
      driverAge: null,
      vehicleAge: null,
    });
  });
});

describe('US-02 · FR-004 formatPrice', () => {
  const plain = (text: string): string => text.replace(/\s/g, ' ');

  it('formats COP with no decimals and " / mes"', () => {
    expect(plain(formatPrice(145000, { currency: 'COP', numberLocale: 'es-CO' }))).toBe('$ 145.000 / mes');
  });

  it('formats CLP with no decimals and " / mes"', () => {
    expect(plain(formatPrice(39990, { currency: 'CLP', numberLocale: 'es-CL' }))).toBe('$39.990 / mes');
  });
});
