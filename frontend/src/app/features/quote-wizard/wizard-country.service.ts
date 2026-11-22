import { Injectable, signal } from '@angular/core';
import { Country } from '../../core/country/country.model';

/** Active country of the wizard, set by the entry guards before the shell renders. */
@Injectable({ providedIn: 'root' })
export class WizardCountry {
  private readonly active = signal<Country | null>(null);
  readonly country = this.active.asReadonly();

  set(country: Country | null): void {
    this.active.set(country);
  }
}
