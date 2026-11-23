import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { QuoteSessionStore } from '../../core/session/quote-session.store';

/** FR-012: the confirmation opens only with a receipt of this country; otherwise the summary. */
export const receiptGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const country = route.parent?.paramMap.get('country') ?? route.paramMap.get('country') ?? '';
  const receipt = inject(QuoteSessionStore).readReceipt();
  if (receipt && receipt.countryCode.toLowerCase() === country.toLowerCase()) return true;
  return inject(Router).createUrlTree(['/', country, 'quote', 'summary']);
};
