const MASK_CHAR = '•';
const VISIBLE = 4;

/** Keeps the last 4 characters and replaces the rest with '•'; 4 or fewer are fully masked. */
export function maskValue(value: string): string {
  const chars = Array.from(value);
  if (chars.length <= VISIBLE) return MASK_CHAR.repeat(chars.length);
  return MASK_CHAR.repeat(chars.length - VISIBLE) + chars.slice(-VISIBLE).join('');
}
