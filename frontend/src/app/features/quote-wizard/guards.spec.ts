import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Country } from '../../core/country/country.model';
import { CountryService } from '../../core/country/country.service';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { countryGuard } from './country.guard';
import { switchConfirmGuard } from './switch-confirm.guard';
import { wizardEntryGuard } from './wizard-entry.guard';
import { WizardCountry } from './wizard-country.service';

const CO: Country = { code: 'co', name: 'Colombia', legalAge: 18, iconUrl: '/uploads/co.svg', iconAlt: 'Bandera de Colombia' };
const CL: Country = { code: 'cl', name: 'Chile', legalAge: 18, iconUrl: '/uploads/cl.svg', iconAlt: 'Bandera de Chile' };

describe('US-00 · quote wizard entry guards', () => {
  let load: () => Observable<Country[]>;
  let confirm: ReturnType<typeof vi.fn>;
  let session: QuoteSessionStore;
  let wizardCountry: WizardCountry;

  function route(country: string): ActivatedRouteSnapshot {
    return { paramMap: { get: () => country } } as unknown as ActivatedRouteSnapshot;
  }
  const state = {} as RouterStateSnapshot;

  function run(guard: typeof countryGuard, country: string) {
    return runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      guard(route(country), state),
    ) as Promise<boolean | UrlTree>;
  }

  function url(result: boolean | UrlTree): string {
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  beforeEach(() => {
    sessionStorage.clear();
    load = () => of([CO, CL]);
    confirm = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CountryService, useValue: { load: () => load() } },
        { provide: ConfirmDialogService, useValue: { confirm } },
      ],
    });
    session = TestBed.inject(QuoteSessionStore);
    wizardCountry = TestBed.inject(WizardCountry);
  });

  describe('FR-005 / FR-006 country guard', () => {
    it('lets an active country through and exposes it', async () => {
      expect(await run(countryGuard, 'co')).toBe(true);
      expect(wizardCountry.country()).toEqual(CO);
    });

    it('redirects an upper or mixed case code to the lower case URL', async () => {
      expect(url(await run(countryGuard, 'CO'))).toBe('/co/quote');
      expect(url(await run(countryGuard, 'Cl'))).toBe('/cl/quote');
    });

    it('redirects an unknown country to the selection page with unavailable and clears the session', async () => {
      session.start('co');
      expect(url(await run(countryGuard, 'XX'))).toBe('/?unavailable=xx');
      expect(session.read()).toBeNull();
    });

    it('redirects to the selection page when countries fail to load', async () => {
      load = () => throwError(() => new Error('down'));
      expect(url(await run(countryGuard, 'co'))).toBe('/');
    });
  });

  describe('FR-012 switch confirm guard', () => {
    async function enter(code: string) {
      expect(await run(countryGuard, code)).toBe(true);
      return run(switchConfirmGuard, code);
    }

    it('starts the session without asking when there is no data', async () => {
      session.start('cl');
      expect(await enter('co')).toBe(true);
      expect(confirm).not.toHaveBeenCalled();
      expect(session.lastCountryCode()).toBe('co');
    });

    it('passes without asking for the same country and keeps its data', async () => {
      session.start('co');
      sessionStorage.setItem('quote-session', JSON.stringify({ countryCode: 'co', data: { step1: { a: 'x' } } }));
      expect(await enter('co')).toBe(true);
      expect(confirm).not.toHaveBeenCalled();
      expect(session.hasData()).toBe(true);
    });

    it('asks when another country has data and resets it on confirm', async () => {
      sessionStorage.setItem('quote-session', JSON.stringify({ countryCode: 'cl', data: { step1: { a: 'x' } } }));
      confirm.mockResolvedValue(true);
      expect(await enter('co')).toBe(true);
      expect(confirm).toHaveBeenCalledWith({
        title: '¿Cambiar de país?',
        message: 'Los datos que ingresaste para Chile se van a borrar.',
        confirmLabel: 'Sí, cambiar',
        cancelLabel: 'Seguir en Chile',
      });
      expect(session.lastCountryCode()).toBe('co');
      expect(session.hasData()).toBe(false);
    });

    it('returns to the previous country and keeps its data on cancel', async () => {
      sessionStorage.setItem('quote-session', JSON.stringify({ countryCode: 'cl', data: { step1: { a: 'x' } } }));
      confirm.mockResolvedValue(false);
      expect(url(await enter('co'))).toBe('/cl/quote');
      expect(session.lastCountryCode()).toBe('cl');
      expect(session.hasData()).toBe(true);
    });
  });

  describe('composed entry guard', () => {
    it('does not ask or touch the session when the country is invalid', async () => {
      sessionStorage.setItem('quote-session', JSON.stringify({ countryCode: 'cl', data: { step1: { a: 'x' } } }));
      const result = await run(wizardEntryGuard, 'zz');
      expect(url(result)).toBe('/?unavailable=zz');
      expect(confirm).not.toHaveBeenCalled();
    });
  });
});
