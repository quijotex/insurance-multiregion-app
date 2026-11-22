import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { QuoteSessionStore } from '../../core/session/quote-session.store';

/** SC-002: step 2 opens only after step 1 was completed; otherwise back to step 1. */
export const step1CompleteGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
): boolean | UrlTree => {
  if (inject(QuoteSessionStore).isStep1Completed()) return true;
  const country = route.parent?.paramMap.get('country') ?? route.paramMap.get('country') ?? '';
  return inject(Router).createUrlTree(['/', country, 'quote']);
};
