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
