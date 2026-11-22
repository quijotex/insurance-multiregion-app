import { EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { countryGuard } from './country.guard';
import { switchConfirmGuard } from './switch-confirm.guard';

/** Runs countryGuard then switchConfirmGuard strictly in sequence (no side effects if the first redirects). */
export const wizardEntryGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Promise<boolean | UrlTree> => {
  const injector = inject(EnvironmentInjector);
  const first = await (runInInjectionContext(injector, () =>
    countryGuard(route, state),
  ) as Promise<boolean | UrlTree>);
  if (first !== true) return first;
  return runInInjectionContext(injector, () => switchConfirmGuard(route, state)) as Promise<
    boolean | UrlTree
  >;
};
