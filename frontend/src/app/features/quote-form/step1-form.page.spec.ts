import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Country } from '../../core/country/country.model';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { WizardCountry } from '../quote-wizard/wizard-country.service';
import { FormFieldDescriptor, FormSections } from './data/form-field.model';
import { FormFieldService } from './data/form-field.service';
import { restoredValue, Step1FormPage } from './step1-form.page';

const COUNTRY: Country = { code: 'co', name: 'Colombia', legalAge: 18, currency: 'COP', numberLocale: 'es-CO', driverAgeBands: [], vehicleAgeBands: [], iconUrl: null, iconAlt: '' };

function field(partial: Partial<FormFieldDescriptor> & { key: string }): FormFieldDescriptor {
  const type = partial.type ?? 'text';
  const required = partial.required ?? true;
  return {
    label: partial.key,
    type,
    required,
    helpText: null,
    placeholder: null,
    errorMessage: `Error en ${partial.key}`,
    order: 1,
    section: 'policyholder',
    options: [],
    rules: { type, required, min: null, max: null, pattern: null, validators: [] },
    inputLimits: { allowedCharacters: null, maxLength: null },
    ...partial,
  };
}

const SECTIONS: FormSections = {
  policyholder: [
    field({ key: 'fullName', label: 'Nombre completo' }),
    field({
      key: 'birthDate',
      label: 'Fecha de nacimiento',
      type: 'date',
      rules: {
        type: 'date',
        required: true,
        min: null,
        max: null,
        pattern: null,
        validators: [{ name: 'legalAge', value: null }],
      },
    }),
  ],
  vehicle: [
    field({ key: 'plate', label: 'Placa', section: 'vehicle' }),
    field({
      key: 'brand',
      label: 'Marca',
      type: 'select',
      section: 'vehicle',
      options: [{ label: 'Mazda', value: 'mazda' }],
    }),
  ],
};

describe('US-01 · FR-005/FR-006 step 1 form page', () => {
  let load: ReturnType<typeof vi.fn<(code: string) => Observable<FormSections>>>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let session: QuoteSessionStore;
  let fixture: ComponentFixture<Step1FormPage>;
  let el: HTMLElement;

  async function setup(country: Country = COUNTRY): Promise<void> {
    TestBed.inject(WizardCountry).set(country);
    session.start(country.code);
    fixture = TestBed.createComponent(Step1FormPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  const byLabel = (text: string) =>
    Array.from(el.querySelectorAll('label')).find((l) => l.textContent?.includes(text))!;
  const control = (text: string) =>
    el.querySelector<HTMLInputElement>(`#${byLabel(text).getAttribute('for')}`)!;
  const type = async (text: string, value: string) => {
    const input = control(text);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const submit = async () => {
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Continuar'))!.click();
    await fixture.whenStable();
  };
  const alerts = () => Array.from(el.querySelectorAll('[role="alert"]')).map((a) => a.textContent?.trim());
  const fieldErrors = () =>
    Array.from(el.querySelectorAll('.form-field__error')).map((a) => a.textContent?.trim());
  const status = () => el.querySelector('[aria-live="polite"]')?.textContent?.trim();
  const isoYearsAgo = (years: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  beforeEach(() => {
    sessionStorage.clear();
    load = vi.fn().mockReturnValue(of(SECTIONS));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: FormFieldService, useValue: { load } }],
    });
    session = TestBed.inject(QuoteSessionStore);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('renders the CMS fields in sections and shows no errors initially', async () => {
    await setup();
    expect(load).toHaveBeenCalledWith('co');
    expect(el.querySelector('h1')?.textContent).toContain('Cuéntanos de ti y de tu vehículo');
    expect(Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim())).toEqual([
      'Tus datos',
      'Tu vehículo',
    ]);
    expect(control('Nombre completo')).toBeTruthy();
    expect(el.querySelector('[role="combobox"]')).not.toBeNull();
    expect(fieldErrors()).toEqual([]);
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('Continuar with an empty form shows every error and focuses the first field', async () => {
    await setup();
    await submit();
    expect(fieldErrors()).toHaveLength(4);
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(status()).toBe('Revisa los 4 campos marcados.');
    expect(document.activeElement).toBe(control('Nombre completo'));
    expect(navigate).not.toHaveBeenCalled();
    expect(session.isStep1Completed()).toBe(false);
  });

  it('R-02 after the guard flags the saved values as invalid, step 1 shows the errors once and focuses the first bad field', async () => {
    session.start('co');
    session.saveStep1({ fullName: 'Ana Pérez', brand: 'renamed' });
    session.flagStep1Review();
    await setup();
    expect(fieldErrors().length).toBeGreaterThan(0);
    expect(status()).toMatch(/^Revisa /);
    expect(document.activeElement).toBe(control('Fecha de nacimiento'));
    expect(session.consumeStep1Review()).toBe(false);
  });

  it('focuses the select trigger when it is the first invalid control', async () => {
    await setup();
    await type('Nombre completo', 'Ana Pérez');
    await type('Fecha de nacimiento', isoYearsAgo(30));
    await type('Placa', 'ABC123');
    await submit();
    expect(document.activeElement).toBe(el.querySelector('[role="combobox"]'));
    expect(status()).toBe('Revisa el campo marcado.');
  });

  it('a field configured as not required shows no asterisk and can stay empty, for every type (Gate 3)', async () => {
    const optional = (f: FormFieldDescriptor): FormFieldDescriptor => ({
      ...f,
      required: false,
      rules: { ...f.rules, required: false },
    });
    load.mockReturnValue(
      of({
        policyholder: SECTIONS.policyholder.map(optional),
        vehicle: [
          ...SECTIONS.vehicle.map(optional),
          optional(field({ key: 'vehicleYear', label: 'Año', type: 'number', section: 'vehicle' })),
          optional(field({ key: 'terms', label: 'Acepto', type: 'checkbox', section: 'vehicle' })),
        ],
      }),
    );
    await setup();
    expect(el.querySelectorAll('.form-field__star').length).toBe(0);
    expect(el.querySelectorAll('[aria-required="true"], [required]').length).toBe(0);
    await submit();
    expect(fieldErrors()).toEqual([]);
    expect(navigate).toHaveBeenCalledWith(['plans'], { relativeTo: TestBed.inject(ActivatedRoute) });
  });

  it('a valid form marks step 1 completed and navigates to plans', async () => {
    await setup();
    await type('Nombre completo', 'Ana Pérez');
    await type('Fecha de nacimiento', isoYearsAgo(30));
    await type('Placa', 'ABC123');
    TestBed.inject(WizardCountry); // keep the injector alive
    const trigger = el.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    await submit();
    expect(session.isStep1Completed()).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['plans'], { relativeTo: TestBed.inject(ActivatedRoute) });
  });

  it('restores stored values and ignores unknown or wrongly typed keys', async () => {
    sessionStorage.setItem(
      'quote-session',
      JSON.stringify({
        countryCode: 'co',
        data: { step1: { fullName: 'Ana Pérez', plate: true, ghost: 'x' } },
      }),
    );
    await setup();
    expect(control('Nombre completo').value).toBe('Ana Pérez');
    expect(control('Placa').value).toBe('');
  });

  it('saves values to the session on every change', async () => {
    await setup();
    await type('Nombre completo', 'Ana');
    expect(session.readStep1()['fullName']).toBe('Ana');
  });

  it('shows a busy skeleton while loading, then the fields', async () => {
    const subject = new Subject<FormSections>();
    load.mockReturnValue(subject);
    await setup();
    expect(el.querySelector('[aria-busy="true"]')?.textContent).toContain('Cargando formulario…');
    subject.next(SECTIONS);
    await fixture.whenStable();
    expect(el.querySelector('[aria-busy="true"]')).toBeNull();
    expect(control('Nombre completo')).toBeTruthy();
  });

  it('shows an error with Reintentar that reloads', async () => {
    load.mockReturnValueOnce(throwError(() => new Error('down')));
    await setup();
    expect(alerts()[0]).toContain('No pudimos cargar el formulario.');
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Reintentar'))!.click();
    await fixture.whenStable();
    expect(load).toHaveBeenCalledTimes(2);
    expect(control('Nombre completo')).toBeTruthy();
  });

  it('shows the empty state without Continuar', async () => {
    load.mockReturnValue(of({ policyholder: [], vehicle: [] }));
    await setup();
    expect(el.textContent).toContain('Por ahora no hay datos que pedir para este país.');
    expect(el.textContent).not.toContain('Continuar');
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Reintentar'))!.click();
    await fixture.whenStable();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('FR-007 uses the legalAge of the active country', async () => {
    await setup({ ...COUNTRY, legalAge: 21 });
    await type('Nombre completo', 'Ana Pérez');
    await type('Fecha de nacimiento', isoYearsAgo(20));
    await type('Placa', 'ABC123');
    await submit();
    expect(fieldErrors()).toContain('Error en birthDate');
    expect(status()).toBe('Revisa los 2 campos marcados.');
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('US-01 · FR-009 restoring saved values (review R-13)', () => {
  const region = field({
    key: 'region',
    label: 'Región',
    type: 'select',
    options: [{ label: 'Metropolitana de Santiago', value: 'Metropolitana de Santiago' }],
  });

  it('keeps a saved select value that is still an option', () => {
    expect(restoredValue(region, 'Metropolitana de Santiago')).toBe('Metropolitana de Santiago');
  });

  it('drops a saved select value renamed or removed in the CMS, so required fails again', () => {
    expect(restoredValue(region, 'Región Metropolitana')).toBe('');
  });

  it('falls back to empty on a wrong type, and keeps text values as typed', () => {
    expect(restoredValue(field({ key: 'plate', label: 'Placa' }), true)).toBe('');
    expect(restoredValue(field({ key: 'plate', label: 'Placa' }), 'abc1')).toBe('abc1');
    expect(restoredValue(field({ key: 'ok', label: 'Acepto', type: 'checkbox' }), 'yes')).toBe(false);
  });
});
