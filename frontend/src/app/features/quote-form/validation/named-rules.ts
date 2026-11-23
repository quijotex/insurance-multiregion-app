import { ValidationContext } from './validation.model';

export type NamedRuleFactory = (
  value: number | null,
  ctx: ValidationContext,
) => (raw: string) => boolean;

/** Chilean RUT check-digit validation (modulo 11). */
export function isValidRut(raw: string): boolean {
  const clean = raw.replace(/[.\s-]/g, '').toUpperCase();
  const match = /^(\d{7,8})([0-9K])$/.exec(clean);
  if (!match) return false;
  const body = match[1];
  let sum = 0;
  let weight = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * weight;
    weight = weight === 7 ? 2 : weight + 1;
  }
  const rest = 11 - (sum % 11);
  const expected = rest === 11 ? '0' : rest === 10 ? 'K' : String(rest);
  return match[2] === expected;
}

/** raw is yyyy-mm-dd; whole years on `today` (local components), or null when invalid or in the future. */
export function ageOn(raw: string, today: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const birth = new Date(y, m - 1, d);
  if (birth.getFullYear() !== y || birth.getMonth() !== m - 1 || birth.getDate() !== d) {
    return null;
  }
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birth.getTime() > t.getTime()) return null;
  let age = t.getFullYear() - y;
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) age--;
  return age;
}

/** raw is yyyy-mm-dd; age computed from local date components. */
export function isOfLegalAge(raw: string, legalAge: number, today: Date): boolean {
  const age = ageOn(raw, today);
  return age !== null && age >= legalAge;
}

function parseYear(raw: string): number | null {
  const s = raw.trim();
  return /^\d{1,4}$/.test(s) ? Number(s) : null;
}

export const NAMED_RULES: Record<string, NamedRuleFactory> = {
  rut: () => (raw) => isValidRut(raw),
  legalAge: (_value, ctx) => (raw) => isOfLegalAge(raw, ctx.legalAge, ctx.today),
  maxYearsAgo: (value, ctx) => (raw) => {
    const year = parseYear(raw);
    return year !== null && value !== null && year >= ctx.today.getFullYear() - value;
  },
  maxYearsAhead: (value, ctx) => (raw) => {
    const year = parseYear(raw);
    return year !== null && value !== null && year <= ctx.today.getFullYear() + value;
  },
};
