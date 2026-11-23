import { Country } from '../../../core/country/country.model';

/** Formats a whole-unit amount in the country's currency, no decimals, e.g. "$ 145.000 / mes". */
export function formatPrice(
  amount: number,
  country: Pick<Country, 'currency' | 'numberLocale'>,
): string {
  const locale = country.numberLocale || 'es';
  const digits = { minimumFractionDigits: 0, maximumFractionDigits: 0 };
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(locale, {
      ...digits,
      style: 'currency',
      currency: country.currency,
    }).format(amount);
  } catch {
    // R-12: a country with no (or an invalid) currency or locale must not break step 2.
    try {
      formatted = new Intl.NumberFormat(locale, digits).format(amount);
    } catch {
      formatted = new Intl.NumberFormat('es', digits).format(amount);
    }
  }
  return `${formatted} / mes`;
}
