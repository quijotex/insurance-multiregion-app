import { QUOTE_SESSION_KEY, QuoteSessionStore } from './quote-session.store';

function seed(value: unknown): void {
  sessionStorage.setItem(QUOTE_SESSION_KEY, JSON.stringify(value));
}

describe('US-00 · FR-011 / FR-012 quote session store', () => {
  let store: QuoteSessionStore;

  beforeEach(() => {
    sessionStorage.clear();
    store = new QuoteSessionStore();
  });

  it('returns null when nothing is stored', () => {
    expect(store.read()).toBeNull();
    expect(store.lastCountryCode()).toBeNull();
    expect(store.hasData()).toBe(false);
  });

  it('treats corrupt JSON as no session', () => {
    sessionStorage.setItem(QUOTE_SESSION_KEY, '{not json');
    expect(store.read()).toBeNull();
    expect(store.hasData()).toBe(false);
  });

  it('treats a malformed shape as no session', () => {
    seed({ data: {} });
    expect(store.read()).toBeNull();
  });

  // hasData now means "step 1 has user input" (US-01 FR-009), not "data has any key".
  it('hasData is true only when step 1 has user input', () => {
    seed({ countryCode: 'co', data: {} });
    expect(store.hasData()).toBe(false);
    seed({ countryCode: 'co', data: { step1: { plate: 'ABC123' } } });
    expect(store.hasData()).toBe(true);
  });

  it('start with the same country keeps the data (FR-011)', () => {
    seed({ countryCode: 'co', data: { step1: { plate: 'ABC123' } } });
    store.start('co');
    expect(store.read()?.data).toEqual({ step1: { plate: 'ABC123' } });
  });

  it('start with a different country resets the data (FR-012)', () => {
    seed({ countryCode: 'co', data: { step1: { plate: 'ABC123' } } });
    store.start('cl');
    expect(store.read()).toEqual({ countryCode: 'cl', data: {} });
  });

  it('discardData keeps the country and empties data', () => {
    seed({ countryCode: 'co', data: { step1: { plate: 'ABC123' } } });
    store.discardData();
    expect(store.read()).toEqual({ countryCode: 'co', data: {} });
  });

  it('clear removes the session', () => {
    seed({ countryCode: 'co', data: { a: 1 } });
    store.clear();
    expect(store.read()).toBeNull();
  });
});

describe('US-02 · FR-009 chosen plan persistence', () => {
  let store: QuoteSessionStore;

  beforeEach(() => {
    sessionStorage.clear();
    store = new QuoteSessionStore();
    store.start('co');
  });

  it('saves and reads the plan id, and clearPlan removes it', () => {
    expect(store.readPlanId()).toBeNull();
    store.savePlan('abc');
    expect(new QuoteSessionStore().readPlanId()).toBe('abc');
    store.clearPlan();
    expect(store.readPlanId()).toBeNull();
  });

  it('saveStep1 keeps the plan id', () => {
    store.saveStep1({ name: 'Ana' });
    store.savePlan('abc');
    store.saveStep1({ name: 'Ana B' });
    expect(store.readPlanId()).toBe('abc');
    expect(store.readStep1()).toEqual({ name: 'Ana B' });
  });

  it('discardData and a country change drop the plan id; the same country keeps it', () => {
    store.savePlan('abc');
    store.start('co');
    expect(store.readPlanId()).toBe('abc');
    store.start('cl');
    expect(store.readPlanId()).toBeNull();
    store.savePlan('xyz');
    store.discardData();
    expect(store.readPlanId()).toBeNull();
  });
});

describe('US-01 · FR-009 step 1 persistence', () => {
  let store: QuoteSessionStore;

  beforeEach(() => {
    sessionStorage.clear();
    store = new QuoteSessionStore();
    store.start('co');
  });

  it('saves and restores step 1 values', () => {
    store.saveStep1({ name: 'Ana', accepted: true });
    expect(new QuoteSessionStore().readStep1()).toEqual({ name: 'Ana', accepted: true });
  });

  it('hasData is false when all values are empty or unchecked', () => {
    store.saveStep1({ name: '  ', plate: '', accepted: false });
    expect(store.hasData()).toBe(false);
  });

  it('hasData is true for a checked box or a non-blank string', () => {
    store.saveStep1({ accepted: true });
    expect(store.hasData()).toBe(true);
    store.saveStep1({ name: 'Ana' });
    expect(store.hasData()).toBe(true);
  });

  it('markStep1Completed sets the flag and saveStep1 clears it', () => {
    expect(store.isStep1Completed()).toBe(false);
    store.markStep1Completed();
    expect(store.isStep1Completed()).toBe(true);
    store.saveStep1({ name: 'Ana' });
    expect(store.isStep1Completed()).toBe(false);
  });

  it('discardData clears step 1 and completion but keeps the country', () => {
    store.saveStep1({ name: 'Ana' });
    store.markStep1Completed();
    store.discardData();
    expect(store.readStep1()).toEqual({});
    expect(store.isStep1Completed()).toBe(false);
    expect(store.lastCountryCode()).toBe('co');
  });

  it('is tolerant to corrupt data', () => {
    seed({ countryCode: 'co', data: { step1: 'oops', step1Completed: 'yes' } });
    expect(store.readStep1()).toEqual({});
    expect(store.isStep1Completed()).toBe(false);
    seed({ countryCode: 'co', data: { step1: { a: 1, b: 'ok', c: null } } });
    expect(store.readStep1()).toEqual({ b: 'ok' });
    sessionStorage.setItem(QUOTE_SESSION_KEY, '{bad');
    expect(store.readStep1()).toEqual({});
    expect(() => store.saveStep1({ a: 'x' })).not.toThrow();
  });
});

describe('US-03 · FR-011 terms acceptance and receipt-only session', () => {
  let store: QuoteSessionStore;
  const receipt = {
    quoteNumber: 'CO-20261122-7KQ4MZ',
    countryCode: 'co',
    planName: 'Plan Básico',
    amount: 145000,
    currency: 'COP',
    numberLocale: 'es-CO',
    paidAt: '2026-11-22T10:00:00.000Z',
  };

  beforeEach(() => {
    sessionStorage.clear();
    store = new QuoteSessionStore();
    store.start('co');
  });

  it('keeps the acceptance when step 1 or the plan change', () => {
    store.acceptTerms(true);
    store.saveStep1({ name: 'Ana' });
    store.savePlan('abc');
    expect(store.readTermsAccepted()).toBe(true);
    store.acceptTerms(false);
    expect(store.readTermsAccepted()).toBe(false);
  });

  it('completePayment keeps only the receipt', () => {
    store.saveStep1({ name: 'Ana' });
    store.markStep1Completed();
    store.savePlan('abc');
    store.acceptTerms(true);
    store.completePayment(receipt);
    expect(new QuoteSessionStore().read()).toEqual({ countryCode: 'co', data: {}, receipt });
    expect(store.readReceipt()).toEqual(receipt);
    expect(store.readPlanId()).toBeNull();
    expect(store.isStep1Completed()).toBe(false);
    expect(store.readTermsAccepted()).toBe(false);
  });

  it('start (same or other country), discardData and clearReceipt drop the receipt', () => {
    store.completePayment(receipt);
    store.start('co');
    expect(store.readReceipt()).toBeNull();
    store.completePayment(receipt);
    store.start('cl');
    expect(store.readReceipt()).toBeNull();
    store.completePayment({ ...receipt, countryCode: 'cl' });
    store.discardData();
    expect(store.readReceipt()).toBeNull();
    store.completePayment(receipt);
    store.clearReceipt();
    expect(store.readReceipt()).toBeNull();
    expect(store.lastCountryCode()).toBe('cl');
  });

  it('discardData and a country change drop the acceptance', () => {
    store.acceptTerms(true);
    store.discardData();
    expect(store.readTermsAccepted()).toBe(false);
    store.acceptTerms(true);
    store.start('cl');
    expect(store.readTermsAccepted()).toBe(false);
  });
});
