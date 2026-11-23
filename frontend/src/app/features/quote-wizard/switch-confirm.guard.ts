import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CountryService, findCountryByCode } from '../../core/country/country.service';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { WizardCountry } from './wizard-country.service';

/** FR-012: entering another country with data in session asks before discarding it. Runs after countryGuard. */
export const switchConfirmGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const session = inject(QuoteSessionStore);
  const countryService = inject(CountryService);
  const confirmDialog = inject(ConfirmDialogService);
  const active = inject(WizardCountry).country();
  if (!active) return router.parseUrl('/');

  const previous = session.lastCountryCode();
  if (previous && previous !== active.code && session.hasData()) {
    let previousName = previous.toUpperCase();
    try {
      const countries = await firstValueFrom(countryService.load());
      previousName = findCountryByCode(countries, previous)?.name ?? previousName;
    } catch {
      /* keep the code as the label */
    }
    const confirmed = await confirmDialog.confirm({
      title: '¿Cambiar de país?',
      message: `Los datos que ingresaste para ${previousName} se van a borrar.`,
      confirmLabel: 'Sí, cambiar',
      cancelLabel: `Seguir en ${previousName}`,
    });
    if (!confirmed) return router.createUrlTree(['/', previous, 'quote']);
  }
  // A reload on the confirmation keeps its receipt (FR-011); noReceiptGuard handles the other steps.
  if (previous !== active.code || !session.readReceipt()) session.start(active.code);
  return true;
};
