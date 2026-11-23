import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { QuoteSessionStore } from '../../core/session/quote-session.store';

/** FR-008: the summary opens only with a chosen plan; otherwise back to the plan list. */
export const planChosenGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
): boolean | UrlTree => {
  if (inject(QuoteSessionStore).readPlanId()) return true;
  const country = route.parent?.paramMap.get('country') ?? route.paramMap.get('country') ?? '';
  return inject(Router).createUrlTree(['/', country, 'quote', 'plans']);
};
