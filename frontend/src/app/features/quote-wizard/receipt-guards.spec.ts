import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { QuoteReceipt, QuoteSessionStore } from '../../core/session/quote-session.store';
import { noReceiptGuard } from './no-receipt.guard';
import { receiptGuard } from './receipt.guard';

const RECEIPT: QuoteReceipt = {
  quoteNumber: 'CO-20261122-7KQ4MZ',
  countryCode: 'co',
  planName: 'Plan Total',
  amount: 189000,
  currency: 'COP',
  numberLocale: 'es-CO',
  paidAt: '2026-11-22T15:00:00.000Z',
};

describe('US-03 · FR-012 receipt guards', () => {
  let session: QuoteSessionStore;

  function run(guard: typeof noReceiptGuard, country: string): boolean | UrlTree {
    const route = {
      paramMap: { get: () => country },
      parent: { paramMap: { get: () => country } },
    } as unknown as ActivatedRouteSnapshot;
    return runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      guard(route, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  const url = (result: boolean | UrlTree) =>
    TestBed.inject(Router).serializeUrl(result as UrlTree);

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    session = TestBed.inject(QuoteSessionStore);
    session.start('co');
  });

  describe('noReceiptGuard', () => {
    it('lets steps 1-3 open while there is no receipt', () => {
      expect(run(noReceiptGuard, 'co')).toBe(true);
    });

    it('sends steps 1-3 to the confirmation once a payment is approved', () => {
      session.completePayment(RECEIPT);
      expect(url(run(noReceiptGuard, 'co'))).toBe('/co/quote/confirmation');
    });
  });

  describe('receiptGuard', () => {
    it('sends the confirmation to the summary when there is no receipt', () => {
      expect(url(run(receiptGuard, 'co'))).toBe('/co/quote/summary');
    });

    it('sends the confirmation to the summary when the receipt is of another country', () => {
      session.completePayment({ ...RECEIPT, countryCode: 'cl' });
      expect(url(run(receiptGuard, 'co'))).toBe('/co/quote/summary');
    });

    it('opens the confirmation with a receipt of the same country', () => {
      session.completePayment(RECEIPT);
      expect(run(receiptGuard, 'co')).toBe(true);
      expect(run(receiptGuard, 'CO')).toBe(true);
    });
  });
});
