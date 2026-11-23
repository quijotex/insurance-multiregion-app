import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { mapCountries } from './country.mapper';
import { CountriesResponseDto, Country } from './country.model';

export function findCountryByCode(countries: Country[], code: string): Country | undefined {
  const wanted = code.toLowerCase();
  return countries.find((country) => country.code === wanted);
}

@Injectable({ providedIn: 'root' })
export class CountryService {
  private readonly http = inject(HttpClient);
  private cached$: Observable<Country[]> | null = null;

  /** Shared request: guard and page reuse the same result. Failures are not cached. */
  load(): Observable<Country[]> {
    if (!this.cached$) {
      const params = new HttpParams()
        .set('fields[0]', 'name')
        .set('fields[1]', 'code')
        .set('fields[2]', 'legalAge')
        .set('fields[3]', 'currency')
        .set('fields[4]', 'numberLocale')
        .set('fields[5]', 'termsAndConditions')
        .set('populate[driverAgeBands]', 'true')
        .set('populate[vehicleAgeBands]', 'true')
        .set('populate[icon][fields][0]', 'url')
        .set('populate[icon][fields][1]', 'alternativeText')
        .set('sort', 'order:asc');
      const request$ = this.http.get<CountriesResponseDto>('/api/countries', { params }).pipe(
        map((response) => mapCountries(response.data)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.cached$ = request$;
      // Drop the cache on failure so a retry issues a new request.
      request$.subscribe({
        error: () => {
          if (this.cached$ === request$) this.cached$ = null;
        },
      });
    }
    return this.cached$;
  }

  /** Forces a fresh request (e.g. "Reintentar"). */
  reload(): Observable<Country[]> {
    this.cached$ = null;
    return this.load();
  }

  findByCode(countries: Country[], code: string): Country | undefined {
    return findCountryByCode(countries, code);
  }
}
