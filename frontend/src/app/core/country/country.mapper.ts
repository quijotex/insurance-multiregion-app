import { Country, CountryDto } from './country.model';

const DEFAULT_LEGAL_AGE = 18;

export function mapCountry(dto: CountryDto): Country {
  return {
    code: dto.code.toLowerCase(),
    name: dto.name,
    legalAge:
      typeof dto.legalAge === 'number' && Number.isFinite(dto.legalAge) && dto.legalAge >= 0
        ? dto.legalAge
        : DEFAULT_LEGAL_AGE,
    iconUrl: dto.icon?.url ?? null,
    iconAlt: dto.icon?.alternativeText || dto.name,
  };
}

export function mapCountries(dtos: CountryDto[]): Country[] {
  return dtos.map(mapCountry);
}
