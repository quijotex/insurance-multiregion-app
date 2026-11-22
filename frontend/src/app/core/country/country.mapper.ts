import { Country, CountryDto } from './country.model';

export function mapCountry(dto: CountryDto): Country {
  return {
    code: dto.code.toLowerCase(),
    name: dto.name,
    iconUrl: dto.icon?.url ?? null,
    iconAlt: dto.icon?.alternativeText || dto.name,
  };
}

export function mapCountries(dtos: CountryDto[]): Country[] {
  return dtos.map(mapCountry);
}
