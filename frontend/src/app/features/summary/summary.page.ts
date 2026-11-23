import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { QuoteSessionStore, Step1Values } from '../../core/session/quote-session.store';
import { hasVisibleText } from '../../shared/ui/rich-text/rich-text.mapper';
import { RichTextComponent } from '../../shared/ui/rich-text/rich-text.component';
import { StepperComponent } from '../../shared/ui/stepper/stepper.component';
import { Plan } from '../plan-list/data/plan.model';
import { PlanService } from '../plan-list/data/plan.service';
import { agesFromStep1 } from '../plan-list/pricing/ages-from-step1';
import { formatAmount } from '../plan-list/pricing/format-price';
import { simulatePrice } from '../plan-list/pricing/simulate-price';
import { FormFieldService } from '../quote-form/data/form-field.service';
import { FormSections } from '../quote-form/data/form-field.model';
import { WizardCountry } from '../quote-wizard/wizard-country.service';
import { PaymentService } from './payment/payment.service';
import { createQuoteNumber } from './payment/quote-number';
import { SummaryRows, buildSummaryRows } from './summary-rows';

type PaymentState = 'idle' | 'processing' | 'rejected';

interface ChosenPlan {
  plan: Plan;
  finalPrice: number;
  /** Amount only, e.g. "$ 189.000" (the "/ mes" is rendered separately). */
  amount: string;
}

@Component({
  selector: 'app-summary-page',
  imports: [StepperComponent, RichTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './summary.page.html',
  styleUrl: './summary.page.scss',
})
export class SummaryPage {
  private readonly wizardCountry = inject(WizardCountry);
  private readonly planService = inject(PlanService);
  private readonly fieldService = inject(FormFieldService);
  private readonly payment = inject(PaymentService);
  private readonly session = inject(QuoteSessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('termsDialog');
  private readonly termsLink = viewChild<ElementRef<HTMLButtonElement>>('termsLink');

  protected readonly steps = ['Tus datos', 'Elige tu plan', 'Resumen'];
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly paymentState = signal<PaymentState>('idle');
  protected readonly accepted = signal(this.session.readTermsAccepted());

  private readonly fields = signal<FormSections>({ policyholder: [], vehicle: [] });
  private readonly values = signal<Step1Values>({});
  protected readonly chosen = signal<ChosenPlan | null>(null);
  private loadSub: Subscription | null = null;
  private paySub: Subscription | null = null;

  protected readonly rows = computed<SummaryRows>(() =>
    buildSummaryRows(this.fields(), this.values(), this.wizardCountry.country()?.numberLocale ?? 'es'),
  );
  protected readonly terms = computed(() => this.wizardCountry.country()?.termsAndConditions ?? []);
  protected readonly hasTerms = computed(() => hasVisibleText(this.terms()));
  protected readonly processing = computed(() => this.paymentState() === 'processing');
  protected readonly canPay = computed(
    () =>
      !this.loading() &&
      !this.failed() &&
      this.chosen() !== null &&
      this.hasTerms() &&
      this.accepted() &&
      !this.processing(),
  );

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus());
    this.destroyRef.onDestroy(() => {
      this.loadSub?.unsubscribe();
      this.paySub?.unsubscribe();
    });
    this.load();
  }

  protected load(): void {
    const country = this.wizardCountry.country();
    if (!country) return;
    this.loadSub?.unsubscribe();
    this.loading.set(true);
    this.failed.set(false);
    this.loadSub = forkJoin({
      plans: this.planService.load(country.code),
      fields: this.fieldService.load(country.code),
    }).subscribe({
      next: ({ plans, fields }) => {
        const values = this.session.readStep1();
        const plan = plans.find((p) => p.id === this.session.readPlanId());
        if (!plan) {
          // FR-010: the chosen plan is no longer offered.
          this.session.clearPlan();
          void this.router.navigate(['..', 'plans'], { relativeTo: this.route });
          return;
        }
        const { driverAge, vehicleAge } = agesFromStep1(values, new Date());
        const finalPrice = simulatePrice(plan.basePrice, driverAge, vehicleAge, country);
        this.values.set(values);
        this.fields.set(fields);
        this.chosen.set({
          plan,
          finalPrice,
          amount: formatAmount(finalPrice, country),
        });
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  protected toggleTerms(event: Event): void {
    const accepted = (event.target as HTMLInputElement).checked;
    this.accepted.set(accepted);
    this.session.acceptTerms(accepted);
  }

  protected openTerms(): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  protected closeTerms(): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      this.termsClosed();
    }
  }

  /** Esc, "Cerrar" and "Entendido" all end here: focus goes back to the link. */
  protected termsClosed(): void {
    this.termsLink()?.nativeElement.focus();
  }

  protected edit(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }

  protected changePlan(): void {
    void this.router.navigate(['..', 'plans'], { relativeTo: this.route });
  }

  /** R7: only an idle or rejected page pays; the button is disabled while processing. */
  protected pay(): void {
    const state = this.paymentState();
    if (state !== 'idle' && state !== 'rejected') return;
    const country = this.wizardCountry.country();
    const chosen = this.chosen();
    if (!country || !chosen || !this.hasTerms() || !this.accepted()) return;

    this.paymentState.set('processing');
    const maskedKeys = [...this.fields().policyholder, ...this.fields().vehicle]
      .filter((field) => field.maskedInSummary)
      .map((field) => field.key);
    this.paySub?.unsubscribe();
    this.paySub = this.payment.pay(this.values(), maskedKeys).subscribe({
      next: (result) => {
        if (result === 'approved') this.approve(country.code, chosen, country);
        else this.reject();
      },
      error: () => this.reject(),
    });
  }

  /** R-03: after a rejection, focus moves to the alert so the person hears it and can Tab to retry. */
  private reject(): void {
    this.paymentState.set('rejected');
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('.summary__error--payment')?.focus(),
      { injector: this.injector },
    );
  }

  private approve(
    countryCode: string,
    chosen: ChosenPlan,
    country: { currency: string; numberLocale: string },
  ): void {
    const now = new Date();
    // Receipt first, then navigate: reloads and Back never show the pay button again.
    this.session.completePayment({
      quoteNumber: createQuoteNumber(countryCode, now),
      countryCode,
      planName: chosen.plan.name,
      amount: chosen.finalPrice,
      currency: country.currency,
      numberLocale: country.numberLocale,
      paidAt: now.toISOString(),
    });
    void this.router.navigate(['..', 'confirmation'], {
      relativeTo: this.route,
      replaceUrl: true,
    });
  }
}
