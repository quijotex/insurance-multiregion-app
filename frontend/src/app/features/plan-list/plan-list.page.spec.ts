import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Country } from '../../core/country/country.model';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { WizardCountry } from '../quote-wizard/wizard-country.service';
import { Plan } from './data/plan.model';
import { PlanService } from './data/plan.service';
import { PlanListPage } from './plan-list.page';

const COUNTRY: Country = {
  code: 'co',
  name: 'Colombia',
  legalAge: 18,
  currency: 'COP',
  numberLocale: 'es-CO',
  driverAgeBands: [],
  termsAndConditions: [],
  vehicleAgeBands: [],
  iconUrl: null,
  iconAlt: '',
};

function plan(id: string, basePrice: number, highlighted = false): Plan {
  return {
    id,
    name: `Plan ${id}`,
    shortDescription: `Descripción ${id}`,
    basePrice,
    coverages: ['Daños a terceros'],
    benefits: [],
    highlighted,
  };
}

const PLANS = [plan('a', 100000), plan('b', 150000, true), plan('c', 200000)];

describe('US-02 · FR-002–FR-010 plan list page', () => {
  let load: ReturnType<typeof vi.fn<(code: string) => Observable<Plan[]>>>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let session: QuoteSessionStore;
  let fixture: ComponentFixture<PlanListPage>;
  let el: HTMLElement;

  async function setup(): Promise<void> {
    TestBed.inject(WizardCountry).set(COUNTRY);
    session.start(COUNTRY.code);
    fixture = TestBed.createComponent(PlanListPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  const radios = () => Array.from(el.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
  const button = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text));

  beforeEach(() => {
    sessionStorage.clear();
    load = vi.fn().mockReturnValue(of(PLANS));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: PlanService, useValue: { load } }],
    });
    session = TestBed.inject(QuoteSessionStore);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('restores the saved choice while that plan is still offered', async () => {
    session.start('co');
    session.savePlan('c');
    await setup();
    expect(radios().map((r) => r.checked)).toEqual([false, false, true]);
    expect(button('Continuar')!.disabled).toBe(false);
    expect(session.readPlanId()).toBe('c');
  });

  it('drops a saved choice that is no longer offered', async () => {
    session.start('co');
    session.savePlan('gone');
    await setup();
    expect(radios().some((r) => r.checked)).toBe(false);
    expect(button('Continuar')!.disabled).toBe(true);
    expect(session.readPlanId()).toBeNull();
  });

  it('keeps Continuar disabled until a plan is chosen, saves the choice and goes to the summary', async () => {
    await setup();
    expect(radios()).toHaveLength(3);
    expect(button('Continuar')!.disabled).toBe(true);

    radios()[1].click();
    await fixture.whenStable();

    expect(session.readPlanId()).toBe('b');
    expect(button('Continuar')!.disabled).toBe(false);
    button('Continuar')!.click();
    expect(navigate).toHaveBeenCalledWith(['..', 'summary'], expect.anything());
  });

  it('shows the empty state with a way back and no Continuar', async () => {
    load.mockReturnValue(of([]));
    await setup();
    expect(el.textContent).toContain('No hay planes disponibles');
    expect(button('Continuar')).toBeUndefined();
    button('Volver a tus datos')!.click();
    expect(navigate).toHaveBeenCalledWith(['..'], expect.anything());
  });

  it('shows an alert when the plans fail to load and Reintentar loads them again', async () => {
    load.mockReturnValueOnce(throwError(() => new Error('down')));
    await setup();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No pudimos cargar los planes');
    expect(radios()).toHaveLength(0);

    button('Reintentar')!.click();
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(radios()).toHaveLength(3);
  });

  it('G3 · more than 3 plans use the slider on desktop', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    try {
      load.mockReturnValue(of([...PLANS, plan('d', 250000)]));
      await setup();
      expect(el.querySelectorAll('.plan-list__nav')).toHaveLength(2);
      expect(el.querySelector('.plan-list__dots')).not.toBeNull();
      fixture.destroy();

      load.mockReturnValue(of(PLANS));
      await setup();
      expect(el.querySelector('.plan-list__nav')).toBeNull();
      expect(el.querySelector('.plan-list__dots')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
