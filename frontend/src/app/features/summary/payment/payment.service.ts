import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import type { Step1Values } from '../../../core/session/quote-session.store';
import { simulatePayment } from './simulate-payment';

export const PAYMENT_DELAY_MS = 1500;

/** The single seam a real payment gateway would replace (ADR 0006). */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  pay(values: Step1Values, maskedKeys: string[]): Observable<'approved' | 'rejected'> {
    return timer(PAYMENT_DELAY_MS).pipe(map(() => simulatePayment(values, maskedKeys)));
  }
}
