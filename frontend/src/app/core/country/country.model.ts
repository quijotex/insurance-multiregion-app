/** Strapi DTO types — mirror cms/src/api/country (see contracts/countries-api.md). */
export interface CountryIconDto {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
}

export interface CountryDto {
  id: number;
  documentId: string;
  name: string;
  code: string;
  icon: CountryIconDto | null;
}

export interface CountriesResponseDto {
  data: CountryDto[];
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
}

/** App model. `code` is lower case (e.g. 'co'). */
export interface Country {
  code: string;
  name: string;
  iconUrl: string | null;
  iconAlt: string;
}
