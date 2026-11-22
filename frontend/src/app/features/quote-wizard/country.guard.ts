import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Country } from '../../core/country/country.model';
import { CountryService, findCountryByCode } from '../../core/country/country.service';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { WizardCountry } from './wizard-country.service';

/** FR-005 / FR-006: only active countries open the wizard; the code is normalised to lower case. */
export const countryGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const session = inject(QuoteSessionStore);
  const wizardCountry = inject(WizardCountry);
  const countryService = inject(CountryService);
  const param = route.paramMap.get('country') ?? '';
  const lower = param.toLowerCase();

  let countries: Country[];
  try {
    countries = await firstValueFrom(countryService.load());
  } catch {
    wizardCountry.set(null);
    return router.parseUrl('/');
  }

  const country = findCountryByCode(countries, lower);
  if (!country) {
    wizardCountry.set(null);
    session.clear();
    return router.createUrlTree(['/'], { queryParams: { unavailable: lower } });
  }
  if (param !== country.code) {
    return router.createUrlTree(['/', country.code, 'quote']);
  }
  wizardCountry.set(country);
  return true;
};
