import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { FormFieldDescriptor, FormSections } from '../quote-form/data/form-field.model';
import { FormFieldService } from '../quote-form/data/form-field.service';
import { planChosenGuard } from './plan-chosen.guard';
import { step1CompleteGuard } from './step1-complete.guard';
import { WizardCountry } from './wizard-country.service';

function field(partial: Partial<FormFieldDescriptor> & { key: string }): FormFieldDescriptor {
  const type = partial.type ?? 'text';
  return {
    label: partial.key,
    type,
    required: true,
    helpText: null,
    placeholder: null,
    errorMessage: 'Error',
    order: 1,
    section: 'policyholder',
    options: [],
    rules: { type, required: true, min: null, max: null, pattern: null, validators: [] },
    inputLimits: { allowedCharacters: null, maxLength: null },
    ...partial,
  };
}

const SECTIONS: FormSections = {
  policyholder: [field({ key: 'fullName' })],
  vehicle: [
    field({
      key: 'brand',
      type: 'select',
      section: 'vehicle',
      options: [{ label: 'Mazda', value: 'mazda' }],
    }),
  ],
};

describe('US-02 · FR-011 step 1 re-check guard', () => {
  let session: QuoteSessionStore;
  let load: () => Observable<FormSections>;

  const route = { parent: { paramMap: { get: () => 'co' } } } as unknown as ActivatedRouteSnapshot;
  const run = () =>
    runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      step1CompleteGuard(route, {} as RouterStateSnapshot),
    ) as Promise<boolean | UrlTree>;
  const url = (result: boolean | UrlTree) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  beforeEach(() => {
    sessionStorage.clear();
    load = () => of(SECTIONS);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: FormFieldService, useValue: { load: () => load() } }],
    });
    TestBed.inject(WizardCountry).set(null);
    session = TestBed.inject(QuoteSessionStore);
    session.start('co');
  });

  it('redirects to step 1 when step 1 was never completed', async () => {
    expect(url(await run())).toBe('/co/quote');
  });

  it('lets valid saved values through', async () => {
    session.saveStep1({ fullName: 'Ana', brand: 'mazda' });
    session.markStep1Completed();
    expect(await run()).toBe(true);
    expect(session.isStep1Completed()).toBe(true);
  });

  it('sends invalid saved values to step 1 and clears the completion', async () => {
    session.saveStep1({ fullName: '', brand: 'mazda' });
    session.markStep1Completed();
    expect(url(await run())).toBe('/co/quote');
    expect(session.isStep1Completed()).toBe(false);
  });

  it('treats a select value no longer offered as missing', async () => {
    session.saveStep1({ fullName: 'Ana', brand: 'renamed' });
    session.markStep1Completed();
    expect(url(await run())).toBe('/co/quote');
    expect(session.isStep1Completed()).toBe(false);
  });

  it('sends to step 1 when the fields fail to load', async () => {
    load = () => throwError(() => new Error('down'));
    session.saveStep1({ fullName: 'Ana', brand: 'mazda' });
    session.markStep1Completed();
    expect(url(await run())).toBe('/co/quote');
  });
});

describe('US-02 · FR-008 plan chosen guard', () => {
  const route = { parent: { paramMap: { get: () => 'co' } } } as unknown as ActivatedRouteSnapshot;
  const run = () =>
    runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      planChosenGuard(route, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(QuoteSessionStore).start('co');
  });

  it('sends to the plan list when no plan is chosen', () => {
    expect(TestBed.inject(Router).serializeUrl(run() as UrlTree)).toBe('/co/quote/plans');
  });

  it('lets a chosen plan through', () => {
    TestBed.inject(QuoteSessionStore).savePlan('plan-1');
    expect(run()).toBe(true);
  });
});
