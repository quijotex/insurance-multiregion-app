import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { QuoteSessionStore } from '../../core/session/quote-session.store';

/** R7 / FR-012: once a payment is approved, steps 1-3 redirect to the confirmation. */
export const noReceiptGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const session = inject(QuoteSessionStore);
  if (!session.readReceipt()) return true;
  const country = route.parent?.paramMap.get('country') ?? route.paramMap.get('country') ?? '';
  return inject(Router).createUrlTree(['/', country, 'quote', 'confirmation']);
};
