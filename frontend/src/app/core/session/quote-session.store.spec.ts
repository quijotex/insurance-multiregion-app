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

  it('start creates a session with empty data', () => {
    store.start('co');
    expect(store.read()).toEqual({ countryCode: 'co', data: {} });
    expect(store.lastCountryCode()).toBe('co');
  });

  it('hasData is true only when data has at least one key', () => {
    seed({ countryCode: 'co', data: {} });
    expect(store.hasData()).toBe(false);
    seed({ countryCode: 'co', data: { plate: 'ABC123' } });
    expect(store.hasData()).toBe(true);
  });

  it('start with the same country keeps the data (FR-011)', () => {
    seed({ countryCode: 'co', data: { plate: 'ABC123' } });
    store.start('co');
    expect(store.read()?.data).toEqual({ plate: 'ABC123' });
  });

  it('start with a different country resets the data (FR-012)', () => {
    seed({ countryCode: 'co', data: { plate: 'ABC123' } });
    store.start('cl');
    expect(store.read()).toEqual({ countryCode: 'cl', data: {} });
  });

  it('discardData keeps the country and empties data', () => {
    seed({ countryCode: 'co', data: { plate: 'ABC123' } });
    store.discardData();
    expect(store.read()).toEqual({ countryCode: 'co', data: {} });
  });

  it('clear removes the session', () => {
    seed({ countryCode: 'co', data: { a: 1 } });
    store.clear();
    expect(store.read()).toBeNull();
  });
});
