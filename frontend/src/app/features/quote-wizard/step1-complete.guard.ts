import { inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { FormFieldService } from '../quote-form/data/form-field.service';
import { buildValidators } from '../quote-form/validation/build-validators';
import { restoredValue } from '../quote-form/validation/restored-value';
import { FieldValue } from '../quote-form/validation/validation.model';
import { WizardCountry } from './wizard-country.service';

/**
 * FR-011 / R8: later steps open only when step 1 was completed AND its saved values are still
 * valid against the current CMS fields. Otherwise the completion is cleared and the person goes
 * back to step 1, where the errors show. Fields that fail to load also go back to step 1.
 */
export const step1CompleteGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
): Promise<boolean | UrlTree> => {
  const session = inject(QuoteSessionStore);
  const router = inject(Router);
  const country = route.parent?.paramMap.get('country') ?? route.paramMap.get('country') ?? '';
  const toStep1 = router.createUrlTree(['/', country, 'quote']);
  if (!session.isStep1Completed()) return toStep1;

  const active = inject(WizardCountry).country();
  try {
    const sections = await firstValueFrom(inject(FormFieldService).load(country));
    const stored = session.readStep1();
    const ctx = { legalAge: active?.legalAge ?? 18, today: new Date() };
    const controls: Record<string, FormControl<FieldValue>> = {};
    for (const field of [...sections.policyholder, ...sections.vehicle]) {
      controls[field.key] = new FormControl<FieldValue>(restoredValue(field, stored[field.key]), {
        nonNullable: true,
        validators: buildValidators(field.rules, ctx, field.key),
      });
    }
    if (new FormGroup(controls).valid) return true;
  } catch {
    /* fields failed to load: step 1 shows its own error and retry */
  }
  session.clearStep1Completed();
  return toStep1;
};
