import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { step1CompleteGuard } from './step1-complete.guard';

describe('US-01 · SC-002 step 2 guard', () => {
  let session: QuoteSessionStore;

  const run = () =>
    runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      step1CompleteGuard(
        { parent: { paramMap: { get: () => 'co' } } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    session = TestBed.inject(QuoteSessionStore);
    session.start('co');
  });

  it('lets a completed step 1 through', () => {
    session.markStep1Completed();
    expect(run()).toBe(true);
  });

  it('redirects to step 1 of the same country when not completed', () => {
    const result = run() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/co/quote');
  });

  it('redirects again after step 1 is edited', () => {
    session.markStep1Completed();
    session.saveStep1({ fullName: 'Ana' });
    expect(run()).not.toBe(true);
  });
});
