import { Routes } from '@angular/router';
import { step1CompleteGuard } from './features/quote-wizard/step1-complete.guard';
import { wizardEntryGuard } from './features/quote-wizard/wizard-entry.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/country-selection/country-selection.page').then(
        (m) => m.CountrySelectionPage,
      ),
  },
  {
    path: ':country/quote',
    // countryGuard then switchConfirmGuard, strictly in sequence.
    canActivate: [wizardEntryGuard],
    loadComponent: () =>
      import('./features/quote-wizard/quote-wizard.shell').then((m) => m.QuoteWizardShell),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/quote-form/step1-form.page').then((m) => m.Step1FormPage),
      },
      {
        path: 'plans',
        canActivate: [step1CompleteGuard],
        loadComponent: () =>
          import('./features/quote-wizard/step2-placeholder.page').then(
            (m) => m.Step2PlaceholderPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
