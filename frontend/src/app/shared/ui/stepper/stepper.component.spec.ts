import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { StepperComponent } from './stepper.component';

describe('US-01 · FR-011 stepper', () => {
  let fixture: ComponentFixture<StepperComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StepperComponent);
    fixture.componentRef.setInput('steps', ['Datos', 'Plan', 'Pago']);
    fixture.componentRef.setInput('current', 2);
    fixture.detectChanges();
  });

  it('marks only the current step with aria-current', () => {
    const items = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('li'));
    expect(items.map((i) => i.getAttribute('aria-current'))).toEqual([null, 'step', null]);
  });

  it('marks previous steps as done with accessible text', () => {
    const items = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('li'));
    expect(items[0].classList.contains('stepper__step--done')).toBe(true);
    expect(items[0].textContent).toContain('(completado)');
    expect(items[1].textContent).not.toContain('(completado)');
  });

  it('shows the mobile summary', () => {
    expect(fixture.nativeElement.textContent).toContain('Paso 2 de 3');
  });
});
