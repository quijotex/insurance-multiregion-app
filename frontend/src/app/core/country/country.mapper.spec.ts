import { mapCountry } from './country.mapper';
import { CountryDto } from './country.model';
import { findCountryByCode } from './country.service';

const base: CountryDto = { id: 1, documentId: 'a', name: 'Colombia', code: 'CO', legalAge: 18, icon: null };

describe('US-00 · FR-001 country mapper', () => {
  it('lower-cases the code', () => {
    expect(mapCountry(base).code).toBe('co');
  });

  it('maps icon url and alternative text', () => {
    const country = mapCountry({
      ...base,
      icon: { id: 1, documentId: 'x', url: '/uploads/co.svg', alternativeText: 'Bandera de Colombia' },
    });
    expect(country.iconUrl).toBe('/uploads/co.svg');
    expect(country.iconAlt).toBe('Bandera de Colombia');
  });

  it('returns null iconUrl and name as alt when there is no icon', () => {
    const country = mapCountry(base);
    expect(country.iconUrl).toBeNull();
    expect(country.iconAlt).toBe('Colombia');
  });

  it('falls back to the name when alternativeText is null', () => {
    const country = mapCountry({
      ...base,
      icon: { id: 1, documentId: 'x', url: '/u.svg', alternativeText: null },
    });
    expect(country.iconAlt).toBe('Colombia');
  });
});

describe('US-00 · FR-001 findByCode', () => {
  const countries = [mapCountry(base), mapCountry({ ...base, id: 2, name: 'Chile', code: 'CL' })];

  it('finds case-insensitively', () => {
    expect(findCountryByCode(countries, 'CL')?.name).toBe('Chile');
    expect(findCountryByCode(countries, 'co')?.name).toBe('Colombia');
  });

  it('returns undefined for unknown codes', () => {
    expect(findCountryByCode(countries, 'xx')).toBeUndefined();
  });
});

describe('US-01 � FR-007 country legal age', () => {
  it('maps the legal age from the CMS', () => {
    expect(mapCountry({ ...base, legalAge: 21 }).legalAge).toBe(21);
  });

  it('defaults to 18 when null, missing or negative', () => {
    expect(mapCountry({ ...base, legalAge: null }).legalAge).toBe(18);
    const withoutAge: Partial<CountryDto> = { ...base };
    delete withoutAge.legalAge;
    expect(mapCountry(withoutAge as CountryDto).legalAge).toBe(18);
    expect(mapCountry({ ...base, legalAge: -5 }).legalAge).toBe(18);
  });
});
