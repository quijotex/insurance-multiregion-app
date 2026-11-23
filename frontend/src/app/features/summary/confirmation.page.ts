import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { QuoteReceipt, QuoteSessionStore } from '../../core/session/quote-session.store';
import { StepperComponent } from '../../shared/ui/stepper/stepper.component';
import { WizardCountry } from '../quote-wizard/wizard-country.service';

function formatAmount(receipt: QuoteReceipt): string {
  const digits = { minimumFractionDigits: 0, maximumFractionDigits: 0 };
  try {
    return new Intl.NumberFormat(receipt.numberLocale || 'es', {
      ...digits,
      style: 'currency',
      currency: receipt.currency,
    }).format(receipt.amount);
  } catch {
    return new Intl.NumberFormat('es', digits).format(receipt.amount);
  }
}

function formatDate(receipt: QuoteReceipt): string {
  const date = new Date(receipt.paidAt);
  if (Number.isNaN(date.getTime())) return '—';
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  try {
    return new Intl.DateTimeFormat(receipt.numberLocale || 'es', options).format(date);
  } catch {
    return new Intl.DateTimeFormat('es', options).format(date);
  }
}

/** Receipt (ui-ux-guidelines §3): everything comes from the session receipt, nothing is loaded. */
@Component({
  selector: 'app-confirmation-page',
  imports: [StepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirmation.page.html',
  styleUrl: './confirmation.page.scss',
})
export class ConfirmationPage {
  private readonly session = inject(QuoteSessionStore);
  private readonly router = inject(Router);
  private readonly wizardCountry = inject(WizardCountry);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly steps = ['Tus datos', 'Elige tu plan', 'Resumen'];
  protected readonly receipt = this.session.readReceipt();
  protected readonly total = this.receipt ? formatAmount(this.receipt) : '';
  protected readonly date = this.receipt ? formatDate(this.receipt) : '';
  protected readonly countryName =
    this.wizardCountry.country()?.name ?? this.receipt?.countryCode.toUpperCase() ?? '';

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus());
  }

  protected newQuote(): void {
    this.session.clear();
    void this.router.navigate(['/']);
  }
}
