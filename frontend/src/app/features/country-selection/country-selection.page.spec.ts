import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Country } from '../../core/country/country.model';
import { CountryService } from '../../core/country/country.service';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { CountrySelectionPage } from './country-selection.page';

const CL: Country = { code: 'cl', name: 'Chile', legalAge: 18, iconUrl: '/uploads/cl.svg', iconAlt: 'Bandera de Chile' };
const CO: Country = { code: 'co', name: 'Colombia', legalAge: 18, iconUrl: null, iconAlt: '' };

interface Setup {
  fixture: ComponentFixture<CountrySelectionPage>;
  el: HTMLElement;
  navigateByUrl: ReturnType<typeof vi.fn>;
  reload: ReturnType<typeof vi.fn>;
}

function setup(opts: {
  load?: Observable<Country[]>;
  reload?: Observable<Country[]>;
  last?: string | null;
  query?: Record<string, string>;
}): Setup {
  const navigateByUrl = vi.fn().mockResolvedValue(true);
  const reload = vi.fn().mockReturnValue(opts.reload ?? of([CL, CO]));
  TestBed.configureTestingModule({
    providers: [
      { provide: CountryService, useValue: { load: () => opts.load ?? of([CL, CO]), reload } },
      { provide: QuoteSessionStore, useValue: { lastCountryCode: () => opts.last ?? null } },
      { provide: Router, useValue: { navigateByUrl } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(opts.query ?? {}) } },
      },
    ],
  });
  const fixture = TestBed.createComponent(CountrySelectionPage);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, navigateByUrl, reload };
}

function continueButton(el: HTMLElement): HTMLButtonElement {
  return Array.from(el.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === 'Continuar',
  ) as HTMLButtonElement;
}

function radio(el: HTMLElement, index: number): HTMLInputElement {
  return el.querySelectorAll<HTMLInputElement>('input[type="radio"]')[index];
}

function radioByName(el: HTMLElement, name: string): HTMLInputElement | undefined {
  const label = Array.from(el.querySelectorAll('label')).find((l) => l.textContent?.trim() === name);
  return label?.querySelector<HTMLInputElement>('input[type="radio"]') ?? undefined;
}

describe('US-00 · FR-003 / FR-004 continue button and navigation', () => {
  it('is disabled until a country is selected, then enabled', async () => {
    const { fixture, el } = setup({});
    expect(continueButton(el).disabled).toBe(true);
    radioByName(el, 'Chile')?.click();
    fixture.detectChanges();
    expect(continueButton(el).disabled).toBe(false);
  });

  it('navigates to /cl/quote after selecting Chile', () => {
    const { fixture, el, navigateByUrl } = setup({});
    radioByName(el, 'Chile')?.click();
    fixture.detectChanges();
    continueButton(el).click();
    expect(navigateByUrl).toHaveBeenCalledWith('/cl/quote');
  });

  it('does not auto-select a single country', () => {
    const { el } = setup({ load: of([CL]) });
    expect(radio(el, 0).checked).toBe(false);
    expect(continueButton(el).disabled).toBe(true);
  });
});

describe('US-00 · FR-011 preselect last country', () => {
  it('preselects the session country when it is in the list', () => {
    const { el } = setup({ last: 'co' });
    expect(radioByName(el, 'Colombia')?.checked).toBe(true);
    expect(continueButton(el).disabled).toBe(false);
  });

  it('does not preselect when the session country is not available', () => {
    const { el } = setup({ last: 'xx' });
    expect(radio(el, 0).checked).toBe(false);
    expect(radio(el, 1).checked).toBe(false);
    expect(continueButton(el).disabled).toBe(true);
  });
});

describe('US-00 · FR-006 unavailable country alert', () => {
  it('shows the alert when ?unavailable is present', () => {
    const { el } = setup({ query: { unavailable: '1' } });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'El país seleccionado no está disponible. Elige uno de la lista.',
    );
  });

  it('does not show the alert otherwise', () => {
    const { el } = setup({});
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });
});

describe('US-00 · FR-010 loading, empty and error states', () => {
  it('shows a busy loading message while countries load', () => {
    const { el } = setup({ load: new Subject<Country[]>() });
    const status = el.querySelector('[aria-busy="true"]');
    expect(status?.textContent).toContain('Cargando países…');
  });

  it('shows the empty message when there are no countries', () => {
    const { el } = setup({ load: of([]) });
    expect(el.textContent).toContain('Por ahora no hay países disponibles.');
    expect(continueButton(el)).toBeUndefined();
  });

  it('shows the error and Reintentar reloads the countries', () => {
    const { fixture, el, reload } = setup({
      load: throwError(() => new Error('down')),
      reload: of([CL, CO]),
    });
    expect(el.textContent).toContain('No pudimos cargar los países.');
    const retry = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Reintentar',
    );
    retry?.click();
    fixture.detectChanges();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(el.querySelectorAll('input[type="radio"]').length).toBe(2);
  });
});

describe('US-00 · FR-003 selected tile', () => {
  it('shows no "Seleccionado" text and marks the tile with the modifier', () => {
    const { fixture, el } = setup({});
    radioByName(el, 'Chile')?.click();
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Seleccionado');
    expect(radioByName(el, 'Chile')?.checked).toBe(true);
    expect(el.querySelectorAll('.choice-tile--selected').length).toBe(1);
    expect(el.querySelector('.choice-tile--selected svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('US-00 · FR-009 focus on the selection heading', () => {
  it('focuses the heading after render', async () => {
    const { fixture, el } = setup({});
    await fixture.whenStable();
    expect(document.activeElement).toBe(el.querySelector('h1'));
    expect(el.querySelector('h1')?.getAttribute('tabindex')).toBe('-1');
  });
});
