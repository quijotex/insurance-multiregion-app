import { AgeBand, AgeBandDto, Country, CountryDto } from './country.model';

const DEFAULT_LEGAL_AGE = 18;

const isNum = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Drops bands with from > to, factor <= 0 or non-finite values; missing list gives []. */
export function mapAgeBands(dtos: AgeBandDto[] | null | undefined): AgeBand[] {
  const bands: AgeBand[] = [];
  for (const dto of dtos ?? []) {
    const { fromAge, toAge, factor } = dto;
    if (isNum(fromAge) && isNum(toAge) && isNum(factor) && fromAge <= toAge && factor > 0) {
      bands.push({ fromAge, toAge, factor });
    }
  }
  return bands;
}

export function mapCountry(dto: CountryDto): Country {
  return {
    code: dto.code.toLowerCase(),
    name: dto.name,
    legalAge:
      typeof dto.legalAge === 'number' && Number.isFinite(dto.legalAge) && dto.legalAge >= 0
        ? dto.legalAge
        : DEFAULT_LEGAL_AGE,
    currency: dto.currency ?? '',
    numberLocale: dto.numberLocale ?? '',
    driverAgeBands: mapAgeBands(dto.driverAgeBands),
    vehicleAgeBands: mapAgeBands(dto.vehicleAgeBands),
    iconUrl: dto.icon?.url ?? null,
    iconAlt: dto.icon?.alternativeText || dto.name,
  };
}

export function mapCountries(dtos: CountryDto[]): Country[] {
  return dtos.map(mapCountry);
}
