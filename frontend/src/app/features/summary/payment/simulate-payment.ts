import type { Step1Values } from '../../../core/session/quote-session.store';

const REJECTED_SUFFIX = '0000';

/**
 * Simulated payment outcome (rule in docs/adr/0006-simulated-payment-and-receipt.md).
 * Rejected when any field flagged `maskedInSummary` has a value whose letters and digits
 * (dots, hyphens and spaces removed) end in "0000", e.g. CO 1020300000 or CL 10.006.000-0.
 * Approved otherwise. Pure: no data leaves the browser.
 */
export function simulatePayment(
  values: Step1Values,
  maskedKeys: string[],
): 'approved' | 'rejected' {
  const rejected = maskedKeys.some((key) => {
    const value = values[key];
    if (typeof value !== 'string') return false;
    const normalised = value.replace(/[^\p{L}\p{N}]/gu, '');
    return normalised.endsWith(REJECTED_SUFFIX);
  });
  return rejected ? 'rejected' : 'approved';
}
