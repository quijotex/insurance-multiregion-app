import { Routes } from '@angular/router';
import { planChosenGuard } from './features/quote-wizard/plan-chosen.guard';
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
          import('./features/plan-list/plan-list.page').then((m) => m.PlanListPage),
      },
      {
        path: 'summary',
        canActivate: [step1CompleteGuard, planChosenGuard],
        loadComponent: () =>
          import('./features/plan-list/summary-placeholder.page').then(
            (m) => m.SummaryPlaceholderPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
