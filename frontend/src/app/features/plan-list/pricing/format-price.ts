import { Country } from '../../../core/country/country.model';

/** Formats a whole-unit amount in the country's currency, no decimals, e.g. "$ 145.000 / mes". */
export function formatPrice(
  amount: number,
  country: Pick<Country, 'currency' | 'numberLocale'>,
): string {
  const formatted = new Intl.NumberFormat(country.numberLocale, {
    style: 'currency',
    currency: country.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} / mes`;
}
