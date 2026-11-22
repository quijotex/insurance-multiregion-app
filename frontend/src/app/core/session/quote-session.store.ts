import { Injectable } from '@angular/core';

export const QUOTE_SESSION_KEY = 'quote-session';

export interface QuoteSession {
  countryCode: string;
  data: Record<string, unknown>;
}

/** Single persistence helper for the quote wizard (sessionStorage). Never stores tokens. */
@Injectable({ providedIn: 'root' })
export class QuoteSessionStore {
  read(): QuoteSession | null {
    try {
      const raw = sessionStorage.getItem(QUOTE_SESSION_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return null;
      const { countryCode, data } = parsed as Partial<QuoteSession>;
      if (typeof countryCode !== 'string' || !countryCode) return null;
      const safeData =
        typeof data === 'object' && data !== null && !Array.isArray(data) ? data : {};
      return { countryCode, data: safeData };
    } catch {
      return null;
    }
  }

  lastCountryCode(): string | null {
    return this.read()?.countryCode ?? null;
  }

  hasData(): boolean {
    const session = this.read();
    return session !== null && Object.keys(session.data).length > 0;
  }

  /** Same country keeps data; a different country resets it. */
  start(countryCode: string): void {
    const current = this.read();
    const data = current?.countryCode === countryCode ? current.data : {};
    this.write({ countryCode, data });
  }

  /** Keeps the country, empties the form data. */
  discardData(): void {
    const current = this.read();
    if (current) this.write({ countryCode: current.countryCode, data: {} });
  }

  clear(): void {
    try {
      sessionStorage.removeItem(QUOTE_SESSION_KEY);
    } catch {
      /* storage unavailable */
    }
  }

  private write(session: QuoteSession): void {
    try {
      sessionStorage.setItem(QUOTE_SESSION_KEY, JSON.stringify(session));
    } catch {
      /* storage unavailable: degrade to no persistence */
    }
  }
}
