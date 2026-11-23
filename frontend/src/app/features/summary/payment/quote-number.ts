/** 31 characters, without the look-alikes 0, O, 1, I, L (R3). */
export const QUOTE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const SUFFIX_LENGTH = 6;

function cryptoRandom(max: number): number {
  const buffer = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

/** `CO-20261122-7KQ4MZ`. `random(max)` returns an integer in [0, max). */
export function createQuoteNumber(
  countryCode: string,
  now: Date,
  random: (max: number) => number = cryptoRandom,
): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  let suffix = '';
  for (let i = 0; i < SUFFIX_LENGTH; i++) suffix += QUOTE_ALPHABET[random(QUOTE_ALPHABET.length)];
  return `${countryCode.toUpperCase()}-${date}-${suffix}`;
}
