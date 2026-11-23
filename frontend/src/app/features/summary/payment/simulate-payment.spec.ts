import type { Step1Values } from '../../../core/session/quote-session.store';
import { simulatePayment } from './simulate-payment';

describe('US-03 · FR-008 simulated payment outcome (ADR 0006)', () => {
  const cases: [string, Step1Values, string[], 'approved' | 'rejected'][] = [
    ['CO document ending in 0000', { documentNumber: '1020300000' }, ['documentNumber'], 'rejected'],
    ['CL RUT 10.006.000-0 (separators ignored)', { rut: '10.006.000-0' }, ['rut'], 'rejected'],
    [
      'document not ending in 0000',
      { documentNumber: '1020304050' },
      ['documentNumber'],
      'approved',
    ],
    [
      '0000 only in an unmasked field',
      { plate: 'AB0000', documentNumber: '1020304050' },
      ['documentNumber'],
      'approved',
    ],
    ['no masked field configured', { documentNumber: '1020300000' }, [], 'approved'],
  ];

  it.each(cases)('%s', (_name, values, maskedKeys, expected) => {
    expect(simulatePayment(values, maskedKeys)).toBe(expected);
  });
});
