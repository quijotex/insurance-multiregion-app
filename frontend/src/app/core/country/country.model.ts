/** Strapi DTO types — mirror cms/src/api/country (see contracts/countries-api.md). */
export interface CountryIconDto {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
}

export interface AgeBandDto {
  id?: number;
  fromAge: number | null;
  toAge: number | null;
  factor: number | null;
}

export interface CountryDto {
  id: number;
  documentId: string;
  name: string;
  code: string;
  legalAge: number | null;
  currency?: string | null;
  numberLocale?: string | null;
  driverAgeBands?: AgeBandDto[] | null;
  vehicleAgeBands?: AgeBandDto[] | null;
  icon: CountryIconDto | null;
}

export interface CountriesResponseDto {
  data: CountryDto[];
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
}

/** Inclusive age range with a price factor (ADR 0005). */
export interface AgeBand {
  fromAge: number;
  toAge: number;
  factor: number;
}

/** App model. `code` is lower case (e.g. 'co'). */
export interface Country {
  code: string;
  name: string;
  /** Minimum age to hold a policy (FR-007). Defaults to 18 when the CMS has none. */
  legalAge: number;
  /** ISO 4217 currency code, e.g. 'COP'. */
  currency: string;
  /** BCP 47 locale used to format numbers, e.g. 'es-CO'. */
  numberLocale: string;
  driverAgeBands: AgeBand[];
  vehicleAgeBands: AgeBand[];
  iconUrl: string | null;
  iconAlt: string;
}
