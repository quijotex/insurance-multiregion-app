import { FormControl } from '@angular/forms';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildValidators } from './build-validators';
import { FieldRules, FieldValue, INVALID_ERROR, ValidationContext } from './validation.model';

const ctx: ValidationContext = { legalAge: 18, today: new Date(2026, 10, 22) };
const base: FieldRules = {
  type: 'text',
  required: false,
  min: null,
  max: null,
  pattern: null,
  validators: [],
};

function errors(rules: Partial<FieldRules>, value: FieldValue) {
  const control = new FormControl<FieldValue>(value, { nonNullable: true });
  const vs = buildValidators({ ...base, ...rules }, ctx, 'f');
  for (const v of vs) {
    const e = v(control);
    if (e) return e;
  }
  return null;
}

afterEach(() => vi.restoreAllMocks());

describe('US-01 · FR-005 required', () => {
  it('fails on empty and whitespace', () => {
    expect(errors({ required: true }, '')?.[INVALID_ERROR]).toBe(true);
    expect(errors({ required: true }, '   ')?.[INVALID_ERROR]).toBe(true);
    expect(errors({ required: true }, 'x')).toBeNull();
  });
  it('checkbox requires true', () => {
    expect(errors({ type: 'checkbox', required: true }, false)).not.toBeNull();
    expect(errors({ type: 'checkbox', required: true }, true)).toBeNull();
  });
  it('optional empty field passes other rules', () => {
    expect(
      errors({ pattern: '[0-9]{3}', validators: [{ name: 'rut', value: null }] }, ''),
    ).toBeNull();
  });
});

describe('US-01 · FR-008 min/max', () => {
  const r = { type: 'number' as const, min: 10, max: 20 };
  it.each([
    ['10', true],
    ['20', true],
    ['9', false],
    ['21', false],
    ['x', false],
  ])('%s valid=%s', (v, ok) => expect(errors(r, v) === null).toBe(ok));
});

describe('US-01 · FR-005 pattern', () => {
  it('is anchored to the whole value', () => {
    expect(errors({ pattern: '[0-9]{3}' }, '123')).toBeNull();
    expect(errors({ pattern: '[0-9]{3}' }, '1234')).not.toBeNull();
  });
  it('skips an invalid regex with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(errors({ pattern: '(' }, 'abc')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"f"'));
  });
});

describe('US-01 · FR-014 named rules', () => {
  it('applies a known rule', () => {
    expect(errors({ validators: [{ name: 'rut', value: null }] }, '12.345.678-9')).not.toBeNull();
    expect(errors({ validators: [{ name: 'rut', value: null }] }, '12.345.678-5')).toBeNull();
  });
  it('skips an unknown rule with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(errors({ validators: [{ name: 'nope', value: null }] }, 'x')).toBeNull();
    expect(warn).toHaveBeenCalledWith('[form] Unknown rule "nope" on field "f" – skipped');
  });
});
