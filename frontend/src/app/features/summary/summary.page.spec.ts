import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { Country } from '../../core/country/country.model';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { Plan } from '../plan-list/data/plan.model';
import { PlanService } from '../plan-list/data/plan.service';
import { FormFieldDescriptor, FormSections } from '../quote-form/data/form-field.model';
import { FormFieldService } from '../quote-form/data/form-field.service';
import { WizardCountry } from '../quote-wizard/wizard-country.service';
import { PaymentService } from './payment/payment.service';
import { SummaryPage } from './summary.page';

const TERMS = [{ type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Texto de términos' }] }];

const COUNTRY: Country = {
  code: 'co',
  name: 'Colombia',
  legalAge: 18,
  currency: 'COP',
  numberLocale: 'es-CO',
  driverAgeBands: [],
  vehicleAgeBands: [],
  termsAndConditions: TERMS,
  iconUrl: null,
  iconAlt: '',
};

function field(key: string, label: string, section: 'policyholder' | 'vehicle', masked = false): FormFieldDescriptor {
  return {
    key,
    label,
    type: 'text',
    required: true,
    helpText: null,
    placeholder: null,
    errorMessage: '',
    order: 1,
    section,
    options: [],
    rules: { type: 'text', required: true, min: null, max: null, pattern: null, validators: [] },
    inputLimits: { allowedCharacters: null, maxLength: null },
    maskedInSummary: masked,
  };
}

const FIELDS: FormSections = {
  policyholder: [field('fullName', 'Nombre', 'policyholder'), field('documentNumber', 'Cédula', 'policyholder', true)],
  vehicle: [field('plate', 'Placa', 'vehicle')],
};

const PLAN: Plan = {
  id: 'p1',
  name: 'Plan Total',
  shortDescription: 'Todo cubierto',
  basePrice: 189000,
  coverages: [],
  benefits: [],
  highlighted: false,
};

describe('US-03 · FR-001–FR-010 summary page', () => {
  let session: QuoteSessionStore;
  let navigate: ReturnType<typeof vi.spyOn>;
  let paySubject: Subject<'approved' | 'rejected'>;
  let pay: ReturnType<typeof vi.fn<(values: unknown, keys: string[]) => Observable<'approved' | 'rejected'>>>;
  let plans: Plan[];
  let fixture: ComponentFixture<SummaryPage>;
  let el: HTMLElement;

  async function setup(country: Country = COUNTRY): Promise<void> {
    TestBed.inject(WizardCountry).set(country);
    fixture = TestBed.createComponent(SummaryPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  const button = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text));
  const payButton = () => (button('Quiero mi seguro') ?? button('Procesando')) as HTMLButtonElement;
  const checkbox = () => el.querySelector<HTMLInputElement>('input[type="checkbox"]')!;

  async function accept(): Promise<void> {
    checkbox().click();
    await fixture.whenStable();
  }

  beforeEach(() => {
    sessionStorage.clear();
    paySubject = new Subject();
    pay = vi.fn().mockReturnValue(paySubject.asObservable());
    plans = [PLAN];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PlanService, useValue: { load: () => of(plans) } },
        { provide: FormFieldService, useValue: { load: () => of(FIELDS) } },
        { provide: PaymentService, useValue: { pay } },
      ],
    });
    session = TestBed.inject(QuoteSessionStore);
    session.start('co');
    session.saveStep1({ fullName: 'Ana Prueba', documentNumber: '1020304050', plate: 'ABC123' });
    session.markStep1Completed();
    session.savePlan('p1');
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('FR-001 / FR-003 shows the data with the document masked and the plan price', async () => {
    await setup();
    expect(el.textContent).toContain('Ana Prueba');
    expect(el.textContent).toContain('••••••4050');
    expect(el.textContent).not.toContain('1020304050');
    expect(el.textContent).toContain('Plan Total');
  });

  it('FR-006 keeps "Quiero mi seguro" disabled until the terms are accepted, and remembers the acceptance', async () => {
    await setup();
    expect(payButton().disabled).toBe(true);
    await accept();
    expect(payButton().disabled).toBe(false);
    expect(session.readTermsAccepted()).toBe(true);
  });

  it('FR-007 a double press calls the payment once and disables the controls while processing', async () => {
    await setup();
    await accept();
    payButton().click();
    payButton().click();
    await fixture.whenStable();
    expect(pay).toHaveBeenCalledTimes(1);
    expect(pay).toHaveBeenCalledWith(expect.objectContaining({ documentNumber: '1020304050' }), ['documentNumber']);
    expect(payButton().getAttribute('aria-disabled')).toBe('true');
    expect(payButton().getAttribute('aria-busy')).toBe('true');
    expect(payButton().textContent).toContain('Procesando…');
    expect(checkbox().disabled).toBe(true);
  });

  it('FR-010 a rejected payment opens an alert dialog, keeps data and acceptance, and allows a retry', async () => {
    await setup();
    await accept();
    payButton().click();
    paySubject.next('rejected');
    await fixture.whenStable();

    const alert = el.querySelector<HTMLDialogElement>('dialog[role="alertdialog"]');
    expect(alert?.hasAttribute('open')).toBe(true);
    expect(alert?.textContent).toContain('No pudimos procesar tu pago.');
    expect(session.readStep1()['documentNumber']).toBe('1020304050');
    expect(session.readTermsAccepted()).toBe(true);
    expect(checkbox().checked).toBe(true);
    expect(session.readReceipt()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();

    paySubject = new Subject();
    pay.mockReturnValue(paySubject.asObservable());
    expect(payButton().disabled).toBe(false);
    payButton().click();
    expect(pay).toHaveBeenCalledTimes(2);
  });

  it('FR-009 an approved payment saves the receipt and goes to the confirmation', async () => {
    await setup();
    await accept();
    payButton().click();
    paySubject.next('approved');
    await fixture.whenStable();

    const receipt = session.readReceipt();
    expect(receipt).toMatchObject({
      countryCode: 'co',
      planName: 'Plan Total',
      amount: 189000,
      currency: 'COP',
      numberLocale: 'es-CO',
    });
    expect(receipt?.quoteNumber).toMatch(/^CO-\d{8}-[A-Z2-9]{6}$/);
    expect(session.readStep1()).toEqual({});
    expect(navigate).toHaveBeenCalledWith(['..', 'confirmation'], expect.objectContaining({ replaceUrl: true }));
  });

  it('FR-012 a plan that is no longer offered clears the choice and goes to the plan list', async () => {
    plans = [{ ...PLAN, id: 'other' }];
    await setup();
    expect(session.readPlanId()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['..', 'plans'], expect.anything());
  });

  it('FR-006 a country without terms shows an error and keeps the CTA disabled', async () => {
    await setup({ ...COUNTRY, termsAndConditions: [] });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('términos y condiciones');
    expect(el.querySelector('input[type="checkbox"]')).toBeNull();
    expect(payButton().disabled).toBe(true);
  });

  it('R-02 · terms with no visible text block the payment', async () => {
    const blank = [
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: '   ' }] },
      { type: 'paragraph' as const, children: [] },
    ];
    await setup({ ...COUNTRY, termsAndConditions: blank });
    expect(el.querySelector('input[type="checkbox"]')).toBeNull();
    expect(payButton().disabled).toBe(true);
  });
});
