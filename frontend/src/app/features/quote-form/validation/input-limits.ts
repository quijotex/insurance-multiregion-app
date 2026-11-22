/** Typing limits configured per field in the CMS (US-01 FR-015, ADR 0004). */
export type AllowedCharacters = 'digits' | 'alphanumeric' | 'rut';

export interface InputLimits {
  allowedCharacters: AllowedCharacters | null;
  maxLength: number | null;
}

export const NO_INPUT_LIMITS: InputLimits = { allowedCharacters: null, maxLength: null };

const CHARSETS: Record<AllowedCharacters, RegExp> = {
  digits: /[0-9]/,
  alphanumeric: /[A-Za-z0-9]/,
  rut: /[0-9kK.-]/,
};

export function isAllowedCharacters(value: unknown): value is AllowedCharacters {
  return typeof value === 'string' && Object.hasOwn(CHARSETS, value);
}

export interface SanitizedInput {
  value: string;
  caret: number;
}

/**
 * Drops characters outside the allowed set, then anything beyond `maxLength`.
 * `caret` is where the cursor was in `value`; the result keeps it after the same typed character.
 * Extra length is taken from the text just typed or pasted (right before the caret), so a full
 * field refuses new characters like native `maxlength` instead of losing its end (review R-14).
 */
export function sanitizeInput(value: string, caret: number, limits: InputLimits): SanitizedInput {
  const charset = limits.allowedCharacters ? CHARSETS[limits.allowedCharacters] : null;
  let kept = '';
  let newCaret = 0;
  [...value].forEach((ch, i) => {
    if (charset && !charset.test(ch)) return;
    kept += ch;
    if (i < caret) newCaret = kept.length;
  });
  const max = limits.maxLength && limits.maxLength > 0 ? limits.maxLength : null;
  if (max !== null && kept.length > max) {
    const excess = kept.length - max;
    const fromInsert = Math.min(excess, newCaret);
    kept = kept.slice(0, newCaret - fromInsert) + kept.slice(newCaret);
    newCaret -= fromInsert;
    kept = kept.slice(0, max);
  }
  return { value: kept, caret: Math.min(newCaret, kept.length) };
}
