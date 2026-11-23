import { Injectable } from '@angular/core';

export const QUOTE_SESSION_KEY = 'quote-session';

export type Step1Values = Record<string, string | boolean>;

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

  /** True only when step 1 holds a non-empty string (trimmed) or a checked box. */
  hasData(): boolean {
    return Object.values(this.readStep1()).some(
      (value) => value === true || (typeof value === 'string' && value.trim() !== ''),
    );
  }

  readStep1(): Step1Values {
    const raw = this.read()?.data['step1'];
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
    const values: Step1Values = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'string' || typeof value === 'boolean') values[key] = value;
    }
    return values;
  }

  /** Saves step 1 values; any earlier completion no longer applies. */
  saveStep1(values: Step1Values): void {
    const current = this.read();
    if (!current) return;
    const rest = { ...current.data };
    delete rest['step1Completed'];
    this.write({ countryCode: current.countryCode, data: { ...rest, step1: { ...values } } });
  }

  markStep1Completed(): void {
    const current = this.read();
    if (!current) return;
    this.write({
      countryCode: current.countryCode,
      data: { ...current.data, step1Completed: true },
    });
  }

  isStep1Completed(): boolean {
    return this.read()?.data['step1Completed'] === true;
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
