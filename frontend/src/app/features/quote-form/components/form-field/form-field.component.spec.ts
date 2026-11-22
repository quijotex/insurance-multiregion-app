import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { FormFieldDescriptor } from '../../data/form-field.model';
import { FieldValue } from '../../validation/validation.model';
import { FormFieldComponent } from './form-field.component';

const FIELD: FormFieldDescriptor = {
  key: 'fullName',
  label: 'Nombre completo',
  type: 'text',
  required: true,
  helpText: 'Como aparece en tu documento',
  placeholder: 'Ej: Ana Pérez',
  errorMessage: 'Ingresa tu nombre completo.',
  order: 1,
  section: 'policyholder',
  options: [],
  rules: { type: 'text', required: true, min: null, max: null, pattern: null, validators: [] },
};

@Component({
  imports: [FormFieldComponent],
  template: `<app-form-field [field]="field()" [control]="control" [submitted]="submitted()" />`,
})
class HostComponent {
  field = signal<FormFieldDescriptor>(FIELD);
  submitted = signal(false);
  control = new FormControl<FieldValue>('', { nonNullable: true, validators: [Validators.required] });
}

describe('US-01 · FR-005 form field error visibility and a11y', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;
  const input = () => el.querySelector<HTMLInputElement>('input')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('hides the error before blur', () => {
    expect(el.querySelector('.form-field__error')).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('shows the configured error after blur, wired with aria-describedby', async () => {
    input().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    const alert = el.querySelector('.form-field__error')!;
    expect(alert.textContent).toContain('Ingresa tu nombre completo.');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    const ids = input().getAttribute('aria-describedby')!.split(' ');
    expect(ids).toEqual(['field-fullName-help', alert.id]);
  });

  it('clears the error live once the value is valid', async () => {
    input().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    input().value = 'Ana Pérez';
    input().dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(el.querySelector('.form-field__error')).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBeNull();
    expect(input().getAttribute('aria-describedby')).toBe('field-fullName-help');
  });

  it('shows the error without blur when submitted', async () => {
    host.submitted.set(true);
    await fixture.whenStable();
    expect(el.querySelector('.form-field__error')).not.toBeNull();
  });

  it('links the visible label, marks required and hides the asterisk from AT', () => {
    const label = el.querySelector('label')!;
    expect(label.getAttribute('for')).toBe('field-fullName');
    expect(label.querySelector('[aria-hidden="true"]')?.textContent).toContain('*');
    expect(input().hasAttribute('required')).toBe(true);
    expect(input().getAttribute('aria-required')).toBe('true');
  });

  it('renders number as a numeric text input and date as a date input', async () => {
    host.field.set({ ...FIELD, type: 'number' });
    await fixture.whenStable();
    expect(input().type).toBe('text');
    expect(input().getAttribute('inputmode')).toBe('numeric');
    host.field.set({ ...FIELD, type: 'date' });
    await fixture.whenStable();
    expect(input().type).toBe('date');
  });

  it('renders a checkbox and shows its error on blur', async () => {
    host.field.set({ ...FIELD, key: 'terms', type: 'checkbox', label: 'Acepto' });
    host.control.setValidators(Validators.requiredTrue);
    host.control.setValue(false);
    await fixture.whenStable();
    expect(input().type).toBe('checkbox');
    input().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(el.querySelector('.form-field__error')).not.toBeNull();
  });

  it('renders a select as a combobox linked to the label', async () => {
    host.field.set({
      ...FIELD,
      key: 'brand',
      type: 'select',
      options: [{ label: 'Mazda', value: 'mazda' }],
    });
    await fixture.whenStable();
    const combo = el.querySelector('[role="combobox"]')!;
    expect(combo.id).toBe('field-brand');
    expect(combo.getAttribute('aria-required')).toBe('true');
  });
});
